using IngeProjets.Api.Dtos;
using IngeProjets.Data;
using IngeProjets.Data.Models;
using IngeProjets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly NotificationService _notificationService;

    public ImportController(ApplicationDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Parses an Excel file and returns extracted project data.
    /// If all required fields are present, creates the project directly.
    /// Otherwise, returns partial data for the user to complete in the form.
    /// </summary>
    [HttpPost("excel")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> ImportExcel(IFormFile file, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(file);

        if (file.Length == 0)
            return BadRequest("Le fichier est vide.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not ".xlsx" and not ".xls")
            return BadRequest("Format non supporté. Veuillez utiliser un fichier Excel (.xlsx ou .xls).");

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        var results = new List<ImportedProjectResult>();

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;

        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();

        if (worksheet is null)
            return BadRequest("Le fichier Excel ne contient aucune feuille.");

        // Build a header map from row 1
        var headerMap = BuildHeaderMap(worksheet);

        if (headerMap.Count == 0)
            return BadRequest("Impossible de détecter les colonnes. Vérifiez que la première ligne contient les en-têtes.");

        int rowCount = worksheet.Dimension?.Rows ?? 0;

        for (int row = 2; row <= rowCount; row++)
        {
            var data = ExtractRowData(worksheet, row, headerMap);

            if (string.IsNullOrWhiteSpace(data.Nom))
                continue;

            bool isComplete = IsProjectComplete(data);

            if (isComplete)
            {
                var projet = MapToProjet(data);
                _context.Projets.Add(projet);
                await _context.SaveChangesAsync(cancellationToken);

                await _notificationService.NotifyProjetAsync(NotificationType.ProjetCree, projet.Nom, projet.Id, cancellationToken);

                results.Add(new ImportedProjectResult
                {
                    Created = true,
                    ProjectId = projet.Id,
                    Data = data
                });
            }
            else
            {
                results.Add(new ImportedProjectResult
                {
                    Created = false,
                    Data = data
                });
            }
        }

        if (results.Count == 0)
            return BadRequest("Aucun projet trouvé dans le fichier. Vérifiez que les données commencent à la ligne 2.");

        return Ok(results);
    }

    private static Dictionary<string, int> BuildHeaderMap(ExcelWorksheet worksheet)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        int colCount = worksheet.Dimension?.Columns ?? 0;

        for (int col = 1; col <= colCount; col++)
        {
            var header = worksheet.Cells[1, col].Text?.Trim();
            if (string.IsNullOrWhiteSpace(header))
                continue;

            var normalized = NormalizeHeader(header);
            if (!string.IsNullOrEmpty(normalized) && !map.ContainsKey(normalized))
                map[normalized] = col;
        }

        return map;
    }

    private static string NormalizeHeader(string header)
    {
        var h = header.ToLowerInvariant()
            .Replace("é", "e").Replace("è", "e").Replace("ê", "e")
            .Replace("à", "a").Replace("â", "a")
            .Replace("î", "i").Replace("ï", "i")
            .Replace("ô", "o").Replace("ù", "u").Replace("û", "u")
            .Replace("ç", "c")
            .Replace("'", "").Replace("'", "").Replace("\"", "")
            .Replace("(", "").Replace(")", "")
            .Replace("€", "").Replace("$", "")
            .Trim();

        return h switch
        {
            var s when s.Contains("nom") && (s.Contains("projet") || s.Contains("chantier")) => "nom",
            "nom" => "nom",
            "name" or "project name" or "project" => "nom",
            var s when s.Contains("code") && s.Contains("projet") => "code",
            "code" => "code",
            var s when s.Contains("description") => "description",
            var s when s.Contains("type") && s.Contains("projet") => "type",
            "type" => "type",
            var s when s.Contains("priorite") || s.Contains("priority") => "priorite",
            var s when s.Contains("date") && s.Contains("debut") => "dateDebut",
            var s when s.Contains("start") && s.Contains("date") => "dateDebut",
            var s when s.Contains("date") && s.Contains("fin") && s.Contains("prevue") => "dateFinPrevue",
            var s when s.Contains("date") && s.Contains("fin") => "dateFinPrevue",
            var s when s.Contains("end") && s.Contains("date") => "dateFinPrevue",
            var s when s.Contains("echeance") || s.Contains("deadline") => "dateFinPrevue",
            var s when s.Contains("budget") && s.Contains("alloue") => "budgetAlloue",
            var s when s.Contains("budget") => "budgetAlloue",
            var s when s.Contains("proposition") && s.Contains("prix") => "nombrePropositionsPrix",
            var s when s.Contains("nombre") && s.Contains("proposition") => "nombrePropositionsPrix",
            var s when s.Contains("localisation") || s.Contains("lieu") || s.Contains("location") || s.Contains("adresse") => "localisation",
            var s when s.Contains("wilaya") => "localisation",
            var s when s.Contains("maitre") && s.Contains("ouvrage") => "maitreOuvrage",
            var s when s.Contains("maitre") && s.Contains("oeuvre") => "maitreOeuvre",
            var s when s.Contains("client") || s.Contains("donneur") => "maitreOuvrage",
            _ => ""
        };
    }

    private static ImportedProjectData ExtractRowData(ExcelWorksheet worksheet, int row, Dictionary<string, int> headerMap)
    {
        string GetCell(string key) =>
            headerMap.TryGetValue(key, out int col) ? worksheet.Cells[row, col].Text?.Trim() ?? "" : "";

        DateTime? ParseDate(string key)
        {
            var text = GetCell(key);
            if (string.IsNullOrWhiteSpace(text)) return null;
            if (DateTime.TryParse(text, out var dt)) return dt;

            // Try parsing formats commonly found in Excel exports
            var formats = new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy" };
            if (DateTime.TryParseExact(text, formats, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out dt))
                return dt;

            return null;
        }

        decimal? ParseDecimal(string key)
        {
            var text = GetCell(key).Replace(" ", "").Replace("€", "").Replace("$", "").Replace(",", ".");
            if (string.IsNullOrWhiteSpace(text)) return null;
            if (decimal.TryParse(text, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var val))
                return val;
            return null;
        }

        int? ParseInt(string key)
        {
            var text = GetCell(key).Replace(" ", "");
            if (string.IsNullOrWhiteSpace(text)) return null;
            if (int.TryParse(text, out var val)) return val;
            // Fall back: if a decimal was entered, truncate
            if (decimal.TryParse(text, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var dec))
                return (int)dec;
            return null;
        }

        return new ImportedProjectData
        {
            Nom = GetCell("nom"),
            Code = GetCell("code"),
            Description = GetCell("description"),
            Type = ResolveType(GetCell("type")),
            Priorite = ResolvePriorite(GetCell("priorite")),
            DateDebut = ParseDate("dateDebut")?.ToString("yyyy-MM-dd"),
            DateFinPrevue = ParseDate("dateFinPrevue")?.ToString("yyyy-MM-dd"),
            BudgetAlloue = ParseDecimal("budgetAlloue"),
            NombrePropositionsPrix = ParseInt("nombrePropositionsPrix"),
            Localisation = GetCell("localisation"),
            MaitreOuvrage = GetCell("maitreOuvrage"),
            MaitreOeuvre = GetCell("maitreOeuvre"),
        };
    }

    private static string? ResolveType(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var lower = raw.ToLowerInvariant();

        if (lower.Contains("route") || lower.Contains("autoroute")) return "Route";
        if (lower.Contains("pont") || lower.Contains("viaduc")) return "Pont";
        if (lower.Contains("batiment") || lower.Contains("bâtiment") || lower.Contains("building")) return "Batiment";
        if (lower.Contains("assainissement") || lower.Contains("eau")) return "Assainissement";
        if (lower.Contains("energie") || lower.Contains("énergie") || lower.Contains("reseau") || lower.Contains("réseau") || lower.Contains("electri")) return "Energie";

        // Try exact enum match
        if (Enum.TryParse<TypeProjet>(raw, true, out _)) return raw;

        return null;
    }

    private static string? ResolvePriorite(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var lower = raw.ToLowerInvariant();

        if (lower.Contains("urgent")) return "Urgente";
        if (lower.Contains("haute") || lower.Contains("high")) return "Haute";
        if (lower.Contains("moyenne") || lower.Contains("medium") || lower.Contains("normal")) return "Moyenne";
        if (lower.Contains("basse") || lower.Contains("low") || lower.Contains("faible")) return "Basse";

        if (Enum.TryParse<Priorite>(raw, true, out _)) return raw;

        return null;
    }

    private static bool IsProjectComplete(ImportedProjectData data)
    {
        return !string.IsNullOrWhiteSpace(data.Nom)
            && !string.IsNullOrWhiteSpace(data.Type)
            && !string.IsNullOrWhiteSpace(data.DateDebut)
            && !string.IsNullOrWhiteSpace(data.DateFinPrevue)
            && data.BudgetAlloue.HasValue && data.BudgetAlloue.Value > 0;
    }

    private static Projet MapToProjet(ImportedProjectData data)
    {
        Enum.TryParse<TypeProjet>(data.Type, true, out var type);
        Enum.TryParse<Priorite>(data.Priorite ?? "Moyenne", true, out var priorite);

        return new Projet
        {
            Nom = data.Nom!,
            Code = string.IsNullOrWhiteSpace(data.Code) ? null : data.Code,
            Description = string.IsNullOrWhiteSpace(data.Description) ? null : data.Description,
            Type = type,
            Priorite = priorite,
            DateDebut = DateTime.Parse(data.DateDebut!),
            DateFinPrevue = DateTime.Parse(data.DateFinPrevue!),
            BudgetAlloue = data.BudgetAlloue ?? 0,
            NombrePropositionsPrix = data.NombrePropositionsPrix,
            Localisation = string.IsNullOrWhiteSpace(data.Localisation) ? null : data.Localisation,
            MaitreOuvrage = string.IsNullOrWhiteSpace(data.MaitreOuvrage) ? null : data.MaitreOuvrage,
            MaitreOeuvre = string.IsNullOrWhiteSpace(data.MaitreOeuvre) ? null : data.MaitreOeuvre,
            DateCreation = DateTime.UtcNow,
        };
    }
}

public sealed class ImportedProjectData
{
    public string? Nom { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string? Type { get; set; }
    public string? Priorite { get; set; }
    public string? DateDebut { get; set; }
    public string? DateFinPrevue { get; set; }
    public decimal? BudgetAlloue { get; set; }
    public int? NombrePropositionsPrix { get; set; }
    public string? Localisation { get; set; }
    public string? MaitreOuvrage { get; set; }
    public string? MaitreOeuvre { get; set; }
}

public sealed class ImportedProjectResult
{
    public bool Created { get; set; }
    public int? ProjectId { get; set; }
    public ImportedProjectData Data { get; set; } = default!;
}
