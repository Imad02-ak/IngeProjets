using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Services;

/// <summary>
/// Recalculates project progress and status based on its tasks.
/// </summary>
public sealed class ProjetProgressionService
{
    private readonly ApplicationDbContext _context;

    public ProjetProgressionService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Recomputes <see cref="Projet.Avancement"/> and <see cref="Projet.Statut"/>
    /// from the current task data, then persists changes.
    /// </summary>
    public async Task RecalculerAvancementAsync(int projetId, CancellationToken cancellationToken = default)
    {
        var projet = await _context.Projets.FindAsync([projetId], cancellationToken);
        if (projet is null) return;

        var stats = await _context.Taches
            .Where(t => t.ProjetId == projetId)
            .GroupBy(t => 1)
            .Select(g => new
            {
                Count = g.Count(),
                AvgProgression = g.Average(t => t.Progression),
                AllTerminee = g.All(t => t.Statut == StatutTache.Terminee),
                AnyActive = g.Any(t => t.Statut == StatutTache.EnCours || t.Statut == StatutTache.EnRevue)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (stats is null || stats.Count == 0)
        {
            projet.Avancement = 0;
        }
        else
        {
            projet.Avancement = (int)Math.Round(stats.AvgProgression);

            if (stats.AllTerminee)
            {
                projet.Statut = StatutProjet.Termine;
                projet.DateFinReelle = DateTime.UtcNow;
            }
            else if (stats.AnyActive && projet.Statut == StatutProjet.EnPlanification)
            {
                projet.Statut = StatutProjet.EnCours;
            }
        }

        if (projet.DateFinPrevue < DateTime.UtcNow && projet.Statut != StatutProjet.Termine)
        {
            projet.Statut = StatutProjet.EnRetard;
        }

        projet.DateModification = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
