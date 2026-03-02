using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/rapports")]
[Authorize]
public class RapportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public RapportsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    /// <summary>
    /// Returns all generated rapports.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var rapports = await _context.Rapports
            .Include(r => r.Projet)
            .Include(r => r.GenerePar)
            .OrderByDescending(r => r.DateGeneration)
            .Select(r => new
            {
                r.Id,
                r.Titre,
                Type = r.Type.ToString(),
                Statut = r.Statut.ToString(),
                r.Contenu,
                r.DonneesFormulaire,
                r.DateGeneration,
                Projet = r.Projet != null ? r.Projet.Nom : null,
                r.ProjetId,
                GenerePar = r.GenerePar != null ? r.GenerePar.NomComplet : null
            })
            .ToListAsync(cancellationToken);

        return Ok(rapports);
    }

    /// <summary>
    /// Returns a single rapport by id.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var r = await _context.Rapports
            .Include(r => r.Projet)
            .Include(r => r.GenerePar)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (r is null)
            return NotFound();

        return Ok(new
        {
            r.Id,
            r.Titre,
            Type = r.Type.ToString(),
            Statut = r.Statut.ToString(),
            r.Contenu,
            r.DonneesFormulaire,
            r.DateGeneration,
            Projet = r.Projet?.Nom,
            r.ProjetId,
            GenerePar = r.GenerePar?.NomComplet
        });
    }

    /// <summary>
    /// Creates a new rapport.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRapportRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Titre))
            return BadRequest("Le titre est requis.");

        if (!Enum.TryParse<TypeRapport>(request.Type, out var type))
            return BadRequest("Type de rapport invalide.");

        var user = await _userManager.GetUserAsync(User);

        var rapport = new Rapport
        {
            Titre = request.Titre,
            Type = type,
            Statut = StatutRapport.Genere,
            Contenu = request.Contenu,
            DonneesFormulaire = request.DonneesFormulaire,
            ProjetId = request.ProjetId,
            GenereParId = user?.Id,
            DateGeneration = DateTime.UtcNow
        };

        _context.Rapports.Add(rapport);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            rapport.Id,
            rapport.Titre,
            Type = rapport.Type.ToString(),
            Statut = rapport.Statut.ToString(),
            rapport.Contenu,
            rapport.DonneesFormulaire,
            rapport.DateGeneration,
            rapport.ProjetId,
            GenerePar = user?.NomComplet
        });
    }

    /// <summary>
    /// Deletes a rapport.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var rapport = await _context.Rapports.FindAsync([id], cancellationToken);
        if (rapport is null)
            return NotFound();

        _context.Rapports.Remove(rapport);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}

public record CreateRapportRequest
{
    public string Titre { get; init; } = default!;
    public string Type { get; init; } = default!;
    public string? Contenu { get; init; }
    public string? DonneesFormulaire { get; init; }
    public int? ProjetId { get; init; }
}
