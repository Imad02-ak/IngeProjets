using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboardData(CancellationToken cancellationToken)
    {
        var kpis = new
        {
            ChantiersActifs = await _context.Projets.CountAsync(p => p.Statut == StatutProjet.EnCours, cancellationToken),
            ProjetsTermines = await _context.Projets.CountAsync(p => p.Statut == StatutProjet.Termine, cancellationToken),
            Alertes = await _context.Projets.CountAsync(p => p.Statut == StatutProjet.EnRetard, cancellationToken),
            BudgetTotal = await _context.Projets.SumAsync(p => p.BudgetAlloue, cancellationToken),
            DepensesTotales = await _context.TransactionsBudget
                .Where(t => t.Type == TypeTransaction.Depense)
                .SumAsync(t => t.Montant, cancellationToken)
        };

        var budgetUtilise = kpis.BudgetTotal > 0
            ? Math.Round(kpis.DepensesTotales / kpis.BudgetTotal * 100, 0)
            : 0;

        var projetsRecents = await _context.Projets
            .OrderByDescending(p => p.DateCreation)
            .Take(4)
            .Select(p => new
            {
                p.Id,
                p.Nom,
                Statut = p.Statut.ToString(),
                p.Localisation
            })
            .ToListAsync(cancellationToken);

        var echeancesProches = await _context.Taches
            .Where(t => t.Statut != StatutTache.Terminee)
            .OrderBy(t => t.DateEcheance)
            .Take(4)
            .Select(t => new
            {
                t.Id,
                t.Titre,
                Projet = t.Projet.Nom,
                t.DateEcheance
            })
            .ToListAsync(cancellationToken);

        var parType = await _context.Projets
            .GroupBy(p => p.Type)
            .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            Kpis = new
            {
                kpis.ChantiersActifs,
                kpis.ProjetsTermines,
                kpis.Alertes,
                kpis.BudgetTotal,
                BudgetUtilise = budgetUtilise
            },
            ProjetsRecents = projetsRecents,
            EcheancesProches = echeancesProches,
            ParType = parType
        });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.Nom,
            user.Prenom,
            user.NomComplet,
            user.Email,
            Role = roles.FirstOrDefault() ?? "Inconnu"
        });
    }
}
