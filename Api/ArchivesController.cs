using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ArchivesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ArchivesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Returns all archived projects.</summary>
    [HttpGet("projects")]
    public async Task<IActionResult> GetArchivedProjects(CancellationToken cancellationToken)
    {
        var projets = await _context.Projets
            .AsNoTracking()
            .Where(p => p.EstArchive)
            .OrderByDescending(p => p.DateArchivage)
            .Select(p => new
            {
                p.Id,
                p.Nom,
                p.Code,
                Type = p.Type.ToString(),
                Priorite = p.Priorite.ToString(),
                Statut = p.Statut.ToString(),
                p.DateDebut,
                p.DateFinPrevue,
                p.BudgetAlloue,
                p.Avancement,
                p.Localisation,
                ChefProjet = p.ChefProjet != null ? p.ChefProjet.NomComplet : null,
                p.DateArchivage,
                NbTaches = p.Taches.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(projets);
    }

    /// <summary>Returns all archived tasks (including those from non-archived projects).</summary>
    [HttpGet("tasks")]
    public async Task<IActionResult> GetArchivedTasks(CancellationToken cancellationToken)
    {
        var taches = await _context.Taches
            .AsNoTracking()
            .Where(t => t.EstArchive)
            .OrderByDescending(t => t.DateArchivage)
            .Select(t => new
            {
                t.Id,
                t.Titre,
                Priorite = t.Priorite.ToString(),
                Statut = t.Statut.ToString(),
                t.DateEcheance,
                t.Progression,
                t.ProjetId,
                Projet = t.Projet.Nom,
                ProjetArchive = t.Projet.EstArchive,
                AssigneA = t.AssigneA != null ? t.AssigneA.NomComplet : null,
                t.DateArchivage
            })
            .ToListAsync(cancellationToken);

        return Ok(taches);
    }

    /// <summary>Returns all archived rapports.</summary>
    [HttpGet("rapports")]
    public async Task<IActionResult> GetArchivedRapports(CancellationToken cancellationToken)
    {
        var rapports = await _context.Rapports
            .AsNoTracking()
            .Where(r => r.EstArchive)
            .OrderByDescending(r => r.DateArchivage)
            .Select(r => new
            {
                r.Id,
                r.Titre,
                Type = r.Type.ToString(),
                Statut = r.Statut.ToString(),
                r.DateGeneration,
                r.ProjetId,
                Projet = r.Projet != null ? r.Projet.Nom : null,
                GenerePar = r.GenerePar != null ? r.GenerePar.NomComplet : null,
                r.DateArchivage
            })
            .ToListAsync(cancellationToken);

        return Ok(rapports);
    }

    /// <summary>Returns all archived documents.</summary>
    [HttpGet("documents")]
    public async Task<IActionResult> GetArchivedDocuments(CancellationToken cancellationToken)
    {
        var documents = await _context.Documents
            .AsNoTracking()
            .Where(d => d.EstArchive)
            .OrderByDescending(d => d.DateArchivage)
            .Select(d => new
            {
                d.Id,
                d.NomOriginal,
                d.ContentType,
                d.TailleFichier,
                d.ProjetId,
                Projet = d.Projet.Nom,
                AjoutePar = d.AjoutePar != null ? d.AjoutePar.NomComplet : null,
                d.DateAjout,
                d.DateArchivage
            })
            .ToListAsync(cancellationToken);

        return Ok(documents);
    }

    /// <summary>Returns archive statistics.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var projetsArchives = await _context.Projets.CountAsync(p => p.EstArchive, cancellationToken);
        var tachesArchivees = await _context.Taches.CountAsync(t => t.EstArchive, cancellationToken);
        var rapportsArchives = await _context.Rapports.CountAsync(r => r.EstArchive, cancellationToken);
        var documentsArchives = await _context.Documents.CountAsync(d => d.EstArchive, cancellationToken);
        var budgetArchive = await _context.Projets
            .Where(p => p.EstArchive)
            .SumAsync(p => p.BudgetAlloue, cancellationToken);

        return Ok(new
        {
            ProjetsArchives = projetsArchives,
            TachesArchivees = tachesArchivees,
            RapportsArchives = rapportsArchives,
            DocumentsArchives = documentsArchives,
            BudgetArchive = budgetArchive
        });
    }
}
