using IngeProjets.Api.Dtos;
using IngeProjets.Data;
using IngeProjets.Data.Models;
using IngeProjets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private static readonly Expression<Func<Tache, TacheSummaryDto>> TacheSummaryProjection =
        t => new TacheSummaryDto(
            t.Id,
            t.Titre,
            t.Description,
            t.Priorite.ToString(),
            t.Statut.ToString(),
            t.DateDebut,
            t.DateEcheance,
            t.DateFinReelle,
            t.Progression,
            t.ProjetId,
            t.Projet.Nom,
            t.Projet.Type.ToString(),
            t.Projet.Statut.ToString(),
            t.AssigneA != null ? t.AssigneA.NomComplet : null,
            t.AssigneAId);

    private readonly ApplicationDbContext _context;
    private readonly ProjetProgressionService _progressionService;

    public TasksController(ApplicationDbContext context, ProjetProgressionService progressionService)
    {
        _context = context;
        _progressionService = progressionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? projetId, CancellationToken cancellationToken)
    {
        var query = _context.Taches.AsNoTracking().AsQueryable();

        if (projetId.HasValue)
            query = query.Where(t => t.ProjetId == projetId.Value);

        var taches = await query
            .OrderBy(t => t.DateEcheance)
            .Select(TacheSummaryProjection)
            .ToListAsync(cancellationToken);

        return Ok(taches);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var tache = await _context.Taches
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(TacheSummaryProjection)
            .FirstOrDefaultAsync(cancellationToken);

        if (tache is null)
            return NotFound();

        return Ok(tache);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTacheRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!await _context.Projets.AnyAsync(p => p.Id == request.ProjetId, cancellationToken))
            return BadRequest("Projet introuvable.");

        if (!Enum.TryParse<Priorite>(request.Priorite, true, out var priorite))
            return BadRequest("Priorité invalide.");

        var tache = new Tache
        {
            Titre = request.Titre,
            Description = request.Description,
            Priorite = priorite,
            DateDebut = request.DateDebut,
            DateEcheance = request.DateEcheance,
            Progression = request.Progression,
            ProjetId = request.ProjetId,
            AssigneAId = request.AssigneAId,
            DateCreation = DateTime.UtcNow
        };

        _context.Taches.Add(tache);
        await _context.SaveChangesAsync(cancellationToken);

        await _progressionService.RecalculerAvancementAsync(tache.ProjetId, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = tache.Id }, new { tache.Id, tache.Titre });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTacheRequest request, CancellationToken cancellationToken)
    {
        var tache = await _context.Taches.FindAsync([id], cancellationToken);
        if (tache is null)
            return NotFound();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!Enum.TryParse<Priorite>(request.Priorite, true, out var priorite))
            return BadRequest("Priorité invalide.");

        if (!Enum.TryParse<StatutTache>(request.Statut, true, out var statut))
            return BadRequest("Statut invalide.");

        tache.Titre = request.Titre;
        tache.Description = request.Description;
        tache.Priorite = priorite;
        tache.Statut = statut;
        tache.DateDebut = request.DateDebut;
        tache.DateEcheance = request.DateEcheance;
        tache.Progression = request.Progression;
        tache.AssigneAId = request.AssigneAId;

        if (statut == StatutTache.Terminee && tache.DateFinReelle is null)
        {
            tache.DateFinReelle = DateTime.UtcNow;
            tache.Progression = 100;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _progressionService.RecalculerAvancementAsync(tache.ProjetId, cancellationToken);

        return Ok(new { tache.Id, tache.Titre });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTacheStatusRequest request, CancellationToken cancellationToken)
    {
        var tache = await _context.Taches.FindAsync([id], cancellationToken);
        if (tache is null)
            return NotFound();

        if (!Enum.TryParse<StatutTache>(request.Statut, true, out var statut))
            return BadRequest("Statut invalide.");

        tache.Statut = statut;

        if (statut == StatutTache.Terminee && tache.DateFinReelle is null)
        {
            tache.DateFinReelle = DateTime.UtcNow;
            tache.Progression = 100;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _progressionService.RecalculerAvancementAsync(tache.ProjetId, cancellationToken);

        return Ok(new { tache.Id, Statut = tache.Statut.ToString() });
    }

    [HttpGet("gantt")]
    public async Task<IActionResult> GetGanttData([FromQuery] int? projetId, CancellationToken cancellationToken)
    {
        var projetsQuery = _context.Projets.AsNoTracking().AsQueryable();

        if (projetId.HasValue)
            projetsQuery = projetsQuery.Where(p => p.Id == projetId.Value);

        var projets = await projetsQuery
            .Select(p => new
            {
                p.Id,
                p.Nom,
                p.DateDebut,
                p.DateFinPrevue,
                p.Avancement,
                p.Priorite,
                p.Statut,
                p.Localisation,
                ChefNomComplet = p.ChefProjet != null ? p.ChefProjet.NomComplet : "",
                Taches = p.Taches
                    .OrderBy(t => t.DateDebut ?? t.DateEcheance)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titre,
                        t.DateDebut,
                        t.DateEcheance,
                        t.Progression,
                        t.Priorite,
                        t.Statut,
                        t.AssigneAId,
                        AssigneNomComplet = t.AssigneA != null ? t.AssigneA.NomComplet : "Non assigné"
                    })
            })
            .ToListAsync(cancellationToken);

        var data = new List<object>();
        var links = new List<object>();
        int linkId = 1;

        foreach (var projet in projets)
        {
            var projDuration = Math.Max(1, (int)(projet.DateFinPrevue - projet.DateDebut).TotalDays);
            data.Add(new
            {
                id = $"p{projet.Id}",
                text = projet.Nom,
                start_date = projet.DateDebut.ToString("dd-MM-yyyy"),
                duration = projDuration,
                progress = projet.Avancement / 100.0,
                open = true,
                type = "project",
                parent = 0,
                color = projet.Priorite switch
                {
                    Priorite.Urgente => "#e50908",
                    Priorite.Haute => "#f59e0b",
                    Priorite.Moyenne => "#3b82f6",
                    _ => "#10b981"
                },
                priority = projet.Priorite.ToString(),
                statut = projet.Statut.ToString(),
                chef = projet.ChefNomComplet,
                localisation = projet.Localisation ?? ""
            });

            int? prevTaskId = null;

            foreach (var t in projet.Taches)
            {
                var startDate = t.DateDebut ?? t.DateEcheance.AddDays(-7);
                var taskDuration = Math.Max(1, (int)(t.DateEcheance - startDate).TotalDays);
                data.Add(new
                {
                    id = t.Id,
                    text = t.Titre,
                    start_date = startDate.ToString("dd-MM-yyyy"),
                    duration = taskDuration,
                    progress = t.Progression / 100.0,
                    parent = $"p{projet.Id}",
                    open = true,
                    color = t.Priorite switch
                    {
                        Priorite.Urgente => "#e50908",
                        Priorite.Haute => "#f59e0b",
                        Priorite.Moyenne => "#3b82f6",
                        _ => "#10b981"
                    },
                    priority = t.Priorite.ToString(),
                    statut = t.Statut.ToString(),
                    assignee = t.AssigneNomComplet,
                    assigneeId = t.AssigneAId ?? "",
                    projetId = projet.Id
                });

                if (prevTaskId.HasValue)
                {
                    links.Add(new
                    {
                        id = linkId++,
                        source = prevTaskId.Value,
                        target = t.Id,
                        type = "0"
                    });
                }
                prevTaskId = t.Id;
            }
        }

        return Ok(new { data, links });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var tache = await _context.Taches.FindAsync([id], cancellationToken);
        if (tache is null)
            return NotFound();

        var projetId = tache.ProjetId;
        _context.Taches.Remove(tache);
        await _context.SaveChangesAsync(cancellationToken);

        await _progressionService.RecalculerAvancementAsync(projetId, cancellationToken);

        return NoContent();
    }
}
