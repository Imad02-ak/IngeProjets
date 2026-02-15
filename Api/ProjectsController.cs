using IngeProjets.Api.Dtos;
using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProjectsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var projets = await _context.Projets
            .AsNoTracking()
            .OrderByDescending(p => p.DateCreation)
            .Select(p => new ProjetSummaryDto(
                p.Id,
                p.Nom,
                p.Code,
                p.Description,
                p.Type.ToString(),
                p.Priorite.ToString(),
                p.Statut.ToString(),
                p.DateDebut,
                p.DateFinPrevue,
                p.DateFinReelle,
                p.BudgetAlloue,
                p.PropositionPrix,
                p.Avancement,
                p.Localisation,
                p.MaitreOuvrage,
                p.ChefProjet != null ? p.ChefProjet.NomComplet : null,
                p.ChefProjetId,
                p.DateCreation))
            .ToListAsync(cancellationToken);

        return Ok(projets);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var projet = await _context.Projets
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProjetDetailDto(
                p.Id,
                p.Nom,
                p.Code,
                p.Description,
                p.Type.ToString(),
                p.Priorite.ToString(),
                p.Statut.ToString(),
                p.DateDebut,
                p.DateFinPrevue,
                p.DateFinReelle,
                p.BudgetAlloue,
                p.PropositionPrix,
                p.Avancement,
                p.Localisation,
                p.MaitreOuvrage,
                p.ChefProjet != null ? p.ChefProjet.NomComplet : null,
                p.ChefProjetId,
                p.DateCreation,
                p.Transactions
                    .Where(t => t.Type == TypeTransaction.Depense)
                    .Sum(t => t.Montant),
                p.Taches.Select(t => new ProjetTacheDto(
                    t.Id,
                    t.Titre,
                    t.Statut.ToString(),
                    t.Priorite.ToString(),
                    t.DateDebut,
                    t.DateEcheance,
                    t.Progression,
                    t.AssigneA != null ? t.AssigneA.NomComplet : null,
                    t.AssigneAId)),
                p.Documents
                    .OrderByDescending(d => d.DateAjout)
                    .Select(d => new ProjetDocumentDto(
                        d.Id,
                        d.NomOriginal,
                        d.ContentType,
                        d.TailleFichier,
                        d.DateAjout,
                        d.AjoutePar != null ? d.AjoutePar.NomComplet : null))))
            .FirstOrDefaultAsync(cancellationToken);

        if (projet is null)
            return NotFound();

        return Ok(projet);
    }

    [HttpPost]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> Create([FromBody] CreateProjetRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!Enum.TryParse<TypeProjet>(request.Type, true, out var type))
            return BadRequest("Type de projet invalide.");

        if (!Enum.TryParse<Priorite>(request.Priorite, true, out var priorite))
            return BadRequest("Priorité invalide.");

        var projet = new Projet
        {
            Nom = request.Nom,
            Code = request.Code,
            Description = request.Description,
            Type = type,
            Priorite = priorite,
            DateDebut = request.DateDebut,
            DateFinPrevue = request.DateFinPrevue,
            BudgetAlloue = request.BudgetAlloue,
            PropositionPrix = request.PropositionPrix,
            Localisation = request.Localisation,
            MaitreOuvrage = request.MaitreOuvrage,
            ChefProjetId = request.ChefProjetId,
            DateCreation = DateTime.UtcNow
        };

        _context.Projets.Add(projet);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = projet.Id }, new { projet.Id, projet.Nom });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjetRequest request, CancellationToken cancellationToken)
    {
        var projet = await _context.Projets.FindAsync([id], cancellationToken);
        if (projet is null)
            return NotFound();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!Enum.TryParse<TypeProjet>(request.Type, true, out var type))
            return BadRequest("Type de projet invalide.");

        if (!Enum.TryParse<Priorite>(request.Priorite, true, out var priorite))
            return BadRequest("Priorité invalide.");

        if (!Enum.TryParse<StatutProjet>(request.Statut, true, out var statut))
            return BadRequest("Statut invalide.");

        projet.Nom = request.Nom;
        projet.Code = request.Code;
        projet.Description = request.Description;
        projet.Type = type;
        projet.Priorite = priorite;
        projet.Statut = statut;
        projet.DateDebut = request.DateDebut;
        projet.DateFinPrevue = request.DateFinPrevue;
        projet.BudgetAlloue = request.BudgetAlloue;
        projet.PropositionPrix = request.PropositionPrix;
        projet.Localisation = request.Localisation;
        projet.MaitreOuvrage = request.MaitreOuvrage;
        projet.ChefProjetId = request.ChefProjetId;
        projet.Avancement = request.Avancement;
        projet.DateModification = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { projet.Id, projet.Nom });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var projet = await _context.Projets.FindAsync([id], cancellationToken);
        if (projet is null)
            return NotFound();

        _context.Projets.Remove(projet);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var projetStats = await _context.Projets
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                EnCours = g.Count(p => p.Statut == StatutProjet.EnCours),
                EnRetard = g.Count(p => p.Statut == StatutProjet.EnRetard),
                Termines = g.Count(p => p.Statut == StatutProjet.Termine),
                EnPlanification = g.Count(p => p.Statut == StatutProjet.EnPlanification),
                EnPause = g.Count(p => p.Statut == StatutProjet.EnPause),
                BudgetTotal = g.Sum(p => p.BudgetAlloue)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var depensesTotales = await _context.TransactionsBudget
            .Where(t => t.Type == TypeTransaction.Depense)
            .SumAsync(t => t.Montant, cancellationToken);

        var parType = await _context.Projets
            .GroupBy(p => p.Type)
            .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            Total = projetStats?.Total ?? 0,
            EnCours = projetStats?.EnCours ?? 0,
            EnRetard = projetStats?.EnRetard ?? 0,
            Termines = projetStats?.Termines ?? 0,
            EnPlanification = projetStats?.EnPlanification ?? 0,
            EnPause = projetStats?.EnPause ?? 0,
            BudgetTotal = projetStats?.BudgetTotal ?? 0m,
            DepensesTotales = depensesTotales,
            ParType = parType
        });
    }
}
