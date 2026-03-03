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
        var activeProjects = _context.Projets.Where(p => !p.EstArchive);

        var chantiersActifs = await activeProjects.CountAsync(p => p.Statut == StatutProjet.EnCours, cancellationToken);
        var projetsTermines = await activeProjects.CountAsync(p => p.Statut == StatutProjet.Termine, cancellationToken);
        var alertes = await activeProjects.CountAsync(p => p.Statut == StatutProjet.EnRetard, cancellationToken);

        // Montant total = sum of all BudgetAlloue for active projects
        var montantTotal = await activeProjects.SumAsync(p => p.BudgetAlloue, cancellationToken);
        var depensesTotales = await _context.TransactionsBudget
            .Where(t => t.Type == TypeTransaction.Depense && !t.Projet.EstArchive)
            .SumAsync(t => t.Montant, cancellationToken);
        var budgetUtilise = montantTotal > 0
            ? Math.Round(depensesTotales / montantTotal * 100, 0)
            : 0;

        // KPI change indicators
        var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var nouveauxCeMois = await activeProjects.CountAsync(
            p => p.Statut == StatutProjet.EnCours && p.DateCreation >= debutMois, cancellationToken);
        var alertesAujourdhui = await activeProjects.CountAsync(
            p => p.Statut == StatutProjet.EnRetard && p.DateModification != null && p.DateModification >= DateTime.UtcNow.Date,
            cancellationToken);

        // Recent projects (chantiers r&#233;cents)
        var projetsRecents = await _context.Projets
            .Where(p => !p.EstArchive)
            .OrderByDescending(p => p.DateCreation)
            .Take(5)
            .Select(p => new
            {
                p.Id,
                p.Nom,
                p.Code,
                Statut = p.Statut.ToString(),
                Type = p.Type.ToString(),
                p.Localisation,
                p.Avancement,
                p.BudgetAlloue,
                p.DateDebut,
                p.DateFinPrevue,
                ChefProjet = p.ChefProjet != null ? p.ChefProjet.Prenom + " " + p.ChefProjet.Nom : null
            })
            .ToListAsync(cancellationToken);

        // Upcoming deadlines
        var now = DateTime.UtcNow.Date;
        var echeancesProches = await _context.Taches
            .Where(t => !t.EstArchive && t.Statut != StatutTache.Terminee && t.DateEcheance >= now)
            .OrderBy(t => t.DateEcheance)
            .Take(6)
            .Select(t => new
            {
                t.Id,
                t.Titre,
                Projet = t.Projet.Nom,
                ProjetId = t.ProjetId,
                t.DateEcheance,
                Priorite = t.Priorite.ToString(),
                t.Progression,
                AssigneA = t.AssigneA != null ? t.AssigneA.Prenom + " " + t.AssigneA.Nom : null
            })
            .ToListAsync(cancellationToken);

        // Distribution by type
        var parType = await activeProjects
            .GroupBy(p => p.Type)
            .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Monthly evolution (last 6 months)
        var evolution = new List<object>();
        for (var i = 5; i >= 0; i--)
        {
            var moisDate = DateTime.UtcNow.AddMonths(-i);
            var finMois = new DateTime(moisDate.Year, moisDate.Month, DateTime.DaysInMonth(moisDate.Year, moisDate.Month), 23, 59, 59);

            var actifs = await _context.Projets
                .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnCours && p.DateCreation <= finMois, cancellationToken);
            var termines = await _context.Projets
                .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.Termine && (p.DateFinReelle == null || p.DateFinReelle <= finMois), cancellationToken);

            evolution.Add(new
            {
                Mois = moisDate.ToString("MMM yyyy", new System.Globalization.CultureInfo("fr-FR")),
                Actifs = actifs,
                Termines = termines
            });
        }

        // Recent activities (from notifications table)
        var recentNotifications = await _context.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.DateCreation)
            .Take(8)
            .Select(n => new
            {
                n.Icon,
                n.Couleur,
                Texte = n.Message,
                Date = n.DateCreation,
                n.EntityType,
                n.EntityId
            })
            .ToListAsync(cancellationToken);

        var activitesSorted = recentNotifications
            .Select(n => (object)new
            {
                Icon = "fa-solid " + (n.Icon ?? "fa-bell"),
                Couleur = n.Couleur ?? "info",
                n.Texte,
                n.Date,
                n.EntityType,
                n.EntityId
            })
            .Take(6)
            .ToList();

        return Ok(new
        {
            Kpis = new
            {
                ChantiersActifs = chantiersActifs,
                ProjetsTermines = projetsTermines,
                Alertes = alertes,
                MontantTotal = montantTotal,
                BudgetUtilise = budgetUtilise,
                NouveauxCeMois = nouveauxCeMois,
                AlertesAujourdhui = alertesAujourdhui
            },
            ProjetsRecents = projetsRecents,
            EcheancesProches = echeancesProches,
            ParType = parType,
            Evolution = evolution,
            Activites = activitesSorted
        });
    }

    /// <summary>
    /// Global search endpoint for projects, tasks, and users.
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new { Projets = Array.Empty<object>(), Taches = Array.Empty<object>(), Utilisateurs = Array.Empty<object>() });

        var query = q.ToLower();

        var projets = await _context.Projets
            .Where(p => !p.EstArchive && (
                p.Nom.ToLower().Contains(query) ||
                (p.Code != null && p.Code.ToLower().Contains(query)) ||
                (p.Localisation != null && p.Localisation.ToLower().Contains(query)) ||
                (p.MaitreOuvrage != null && p.MaitreOuvrage.ToLower().Contains(query))
            ))
            .Take(5)
            .Select(p => new
            {
                p.Id,
                p.Nom,
                p.Code,
                Statut = p.Statut.ToString(),
                Type = p.Type.ToString(),
                Categorie = "projet"
            })
            .ToListAsync(cancellationToken);

        var taches = await _context.Taches
            .Where(t => !t.EstArchive && (
                t.Titre.ToLower().Contains(query) ||
                (t.Phase != null && t.Phase.ToLower().Contains(query))
            ))
            .Take(5)
            .Select(t => new
            {
                t.Id,
                Nom = t.Titre,
                Projet = t.Projet.Nom,
                ProjetId = t.ProjetId,
                Statut = t.Statut.ToString(),
                Categorie = "tache"
            })
            .ToListAsync(cancellationToken);

        var utilisateurs = await _userManager.Users
            .Where(u => u.NomComplet.ToLower().Contains(query) ||
                        u.Email!.ToLower().Contains(query))
            .Take(5)
            .Select(u => new
            {
                u.Id,
                Nom = u.NomComplet,
                u.Email,
                Categorie = "utilisateur"
            })
            .ToListAsync(cancellationToken);

        return Ok(new { Projets = projets, Taches = taches, Utilisateurs = utilisateurs });
    }

    [HttpGet("evolution")]
    public async Task<IActionResult> GetEvolution([FromQuery] string period = "month", CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var evolution = new List<object>();

        switch (period)
        {
            case "week":
            {
                // Last 7 days
                for (var i = 6; i >= 0; i--)
                {
                    var day = now.AddDays(-i).Date;
                    var endOfDay = day.AddDays(1).AddTicks(-1);

                    var actifs = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnCours && p.DateCreation <= endOfDay, cancellationToken);
                    var termines = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.Termine && (p.DateFinReelle == null || p.DateFinReelle <= endOfDay), cancellationToken);
                    var enRetard = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnRetard && p.DateCreation <= endOfDay, cancellationToken);
                    var enPause = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnPause && p.DateCreation <= endOfDay, cancellationToken);

                    evolution.Add(new
                    {
                        Label = day.ToString("ddd dd", new System.Globalization.CultureInfo("fr-FR")),
                        Actifs = actifs,
                        Termines = termines,
                        EnRetard = enRetard,
                        EnPause = enPause
                    });
                }
                break;
            }
            case "year":
            {
                // Last 12 months
                for (var i = 11; i >= 0; i--)
                {
                    var moisDate = now.AddMonths(-i);
                    var finMois = new DateTime(moisDate.Year, moisDate.Month, DateTime.DaysInMonth(moisDate.Year, moisDate.Month), 23, 59, 59);

                    var actifs = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnCours && p.DateCreation <= finMois, cancellationToken);
                    var termines = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.Termine && (p.DateFinReelle == null || p.DateFinReelle <= finMois), cancellationToken);
                    var enRetard = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnRetard && p.DateCreation <= finMois, cancellationToken);
                    var enPause = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnPause && p.DateCreation <= finMois, cancellationToken);

                    evolution.Add(new
                    {
                        Label = moisDate.ToString("MMM yyyy", new System.Globalization.CultureInfo("fr-FR")),
                        Actifs = actifs,
                        Termines = termines,
                        EnRetard = enRetard,
                        EnPause = enPause
                    });
                }
                break;
            }
            default: // month - last 30 days grouped by week
            {
                for (var i = 3; i >= 0; i--)
                {
                    var weekEnd = now.AddDays(-i * 7).Date;
                    var weekStart = weekEnd.AddDays(-6);
                    var endOfWeek = weekEnd.AddDays(1).AddTicks(-1);

                    var actifs = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnCours && p.DateCreation <= endOfWeek, cancellationToken);
                    var termines = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.Termine && (p.DateFinReelle == null || p.DateFinReelle <= endOfWeek), cancellationToken);
                    var enRetard = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnRetard && p.DateCreation <= endOfWeek, cancellationToken);
                    var enPause = await _context.Projets
                        .CountAsync(p => !p.EstArchive && p.Statut == StatutProjet.EnPause && p.DateCreation <= endOfWeek, cancellationToken);

                    evolution.Add(new
                    {
                        Label = $"{weekStart:dd/MM} - {weekEnd:dd/MM}",
                        Actifs = actifs,
                        Termines = termines,
                        EnRetard = enRetard,
                        EnPause = enPause
                    });
                }
                break;
            }
        }

        return Ok(evolution);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Inconnu";

        return Ok(new
        {
            user.Id,
            user.Nom,
            user.Prenom,
            user.NomComplet,
            user.Email,
            user.Poste,
            user.DateCreation,
            Role = role,
            Permissions = GetPermissions(role)
        });
    }

    /// <summary>Returns the permission map for the given role.</summary>
    private static object GetPermissions(string role)
    {
        var isGerant = role == "Gerant";
        var isCoGerant = role == "CoGerant";
        var isDirecteur = role == "DirecteurTechnique";
        var isIngenieur = role == "Ingenieur";
        var isSecretaire = role == "Secretaire";

        var isDirection = isGerant || isCoGerant;
        var isEncadrement = isDirection || isDirecteur;
        var isTechnique = isEncadrement || isIngenieur;

        return new
        {
            // Navigation / sections visibles
            Dashboard = true,
            Projets = true,
            ProjetsModifier = isEncadrement,
            ProjetsSupprimer = isDirection,
            Planning = true,
            PlanningModifier = isTechnique,
            Budgets = isEncadrement || isSecretaire,
            Rapports = true,
            RapportsModifier = isEncadrement || isSecretaire,
            Archives = isDirection,
            Utilisateurs = isDirection,
            Parametres = true,
            // Documents
            DocumentsAjouter = isEncadrement || isSecretaire,
            DocumentsSupprimer = isDirection,
            // Import/Export
            ImporterProjets = isEncadrement,
            ExporterUtilisateurs = isDirection
        };
    }
}
