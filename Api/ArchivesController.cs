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

    /// <summary>Returns archive statistics.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var projetsArchives = await _context.Projets.CountAsync(p => p.EstArchive, cancellationToken);
        var tachesArchivees = await _context.Taches.CountAsync(t => t.EstArchive, cancellationToken);
        var budgetArchive = await _context.Projets
            .Where(p => p.EstArchive)
            .SumAsync(p => p.BudgetAlloue, cancellationToken);

        return Ok(new
        {
            ProjetsArchives = projetsArchives,
            TachesArchivees = tachesArchivees,
            BudgetArchive = budgetArchive
        });
    }
}
