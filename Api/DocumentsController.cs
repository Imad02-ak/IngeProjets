using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/projects/{projetId}/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWebHostEnvironment _env;

    private static readonly HashSet<string> AllowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".dwg", ".dxf", ".zip", ".rar", ".txt", ".csv"];
    private const long MaxFileSize = 50 * 1024 * 1024; // 50 MB

    public DocumentsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IWebHostEnvironment env)
    {
        _context = context;
        _userManager = userManager;
        _env = env;
    }

    /// <summary>
    /// Returns all documents for a given project.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(int projetId, CancellationToken cancellationToken)
    {
        var projetExists = await _context.Projets.AnyAsync(p => p.Id == projetId, cancellationToken);
        if (!projetExists)
            return NotFound();

        var documents = await _context.Documents
            .Where(d => d.ProjetId == projetId)
            .OrderByDescending(d => d.DateAjout)
            .Select(d => new
            {
                d.Id,
                d.NomOriginal,
                d.ContentType,
                d.TailleFichier,
                d.DateAjout,
                AjoutePar = d.AjoutePar != null ? d.AjoutePar.NomComplet : null
            })
            .ToListAsync(cancellationToken);

        return Ok(documents);
    }

    /// <summary>
    /// Uploads a document for a given project.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Upload(int projetId, IFormFile file, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(file);

        var projet = await _context.Projets.FindAsync([projetId], cancellationToken);
        if (projet is null)
            return NotFound();

        if (file.Length == 0)
            return BadRequest("Le fichier est vide.");

        if (file.Length > MaxFileSize)
            return BadRequest("Le fichier dépasse la taille maximale de 50 Mo.");

        // Sanitize: extract extension from the file name only (strip any path segments)
        var safeFileName = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(safeFileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest($"Le type de fichier '{ext}' n'est pas autorisé.");

        var uploadsDir = Path.Combine(_env.ContentRootPath, "Uploads", "Documents", projetId.ToString());
        Directory.CreateDirectory(uploadsDir);

        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.GetFullPath(Path.Combine(uploadsDir, uniqueName));

        // Ensure resolved path stays within the uploads directory
        if (!filePath.StartsWith(Path.GetFullPath(uploadsDir), StringComparison.OrdinalIgnoreCase))
            return BadRequest("Nom de fichier invalide.");

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, cancellationToken);

        var user = await _userManager.GetUserAsync(User);

        var doc = new DocumentProjet
        {
            NomFichier = uniqueName,
            NomOriginal = safeFileName,
            ContentType = file.ContentType,
            TailleFichier = file.Length,
            AjouteParId = user?.Id,
            ProjetId = projetId
        };

        _context.Documents.Add(doc);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            doc.Id,
            doc.NomOriginal,
            doc.ContentType,
            doc.TailleFichier,
            doc.DateAjout,
            AjoutePar = user?.NomComplet
        });
    }

    /// <summary>
    /// Downloads a project document.
    /// </summary>
    [HttpGet("{docId}")]
    public async Task<IActionResult> Download(int projetId, int docId, CancellationToken cancellationToken)
    {
        var doc = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == docId && d.ProjetId == projetId, cancellationToken);

        if (doc is null)
            return NotFound();

        var filePath = Path.Combine(_env.ContentRootPath, "Uploads", "Documents", projetId.ToString(), doc.NomFichier);

        if (!System.IO.File.Exists(filePath))
            return NotFound("Le fichier n'existe plus sur le serveur.");

        var contentType = doc.ContentType ?? "application/octet-stream";
        return PhysicalFile(filePath, contentType, doc.NomOriginal);
    }

    /// <summary>
    /// Deletes a project document.
    /// </summary>
    [HttpDelete("{docId}")]
    public async Task<IActionResult> Delete(int projetId, int docId, CancellationToken cancellationToken)
    {
        var doc = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == docId && d.ProjetId == projetId, cancellationToken);

        if (doc is null)
            return NotFound();

        var filePath = Path.Combine(_env.ContentRootPath, "Uploads", "Documents", projetId.ToString(), doc.NomFichier);

        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        _context.Documents.Remove(doc);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
