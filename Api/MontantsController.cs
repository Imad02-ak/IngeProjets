using IngeProjets.Data;
using IngeProjets.Data.Models;
using IngeProjets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MontantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ProjectMontantService _montantService;

    public MontantsController(ApplicationDbContext context, ProjectMontantService montantService)
    {
        _context = context;
        _montantService = montantService;
    }

    /// <summary>
    /// Liste des projets avec résumé financier rapide.
    /// </summary>
    [HttpGet("projets")]
    public async Task<IActionResult> GetProjets(CancellationToken ct)
    {
        var projets = await _context.Projets
            .Where(p => !p.EstArchive)
            .Select(p => new
            {
                p.Id,
                p.Nom,
                p.BudgetAlloue
            })
            .OrderBy(p => p.Nom)
            .ToListAsync(ct);

        return Ok(projets);
    }

    /// <summary>
    /// Résumé financier complet d'un projet.
    /// </summary>
    [HttpGet("projets/{projetId:int}/summary")]
    public async Task<IActionResult> GetSummary(int projetId, CancellationToken ct)
    {
        if (!await _context.Projets.AnyAsync(p => p.Id == projetId, ct))
            return NotFound("Projet introuvable.");

        var summary = await _montantService.GetSummaryAsync(projetId, ct);
        return Ok(summary);
    }

    // ── Devis Lignes ──────────────────────────────────────

    [HttpPost("projets/{projetId:int}/devis")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> AddDevisLigne(int projetId, [FromBody] DevisLigneRequest req, CancellationToken ct)
    {
        if (!await _context.Projets.AnyAsync(p => p.Id == projetId, ct))
            return NotFound("Projet introuvable.");

        var ligne = new DevisLigne
        {
            ProjetId = projetId,
            Designation = req.Designation,
            MontantHT = req.MontantHT,
            Ordre = req.Ordre
        };

        _context.DevisLignes.Add(ligne);
        await _context.SaveChangesAsync(ct);
        return Ok(new { ligne.Id });
    }

    [HttpDelete("devis/{id:int}")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> DeleteDevisLigne(int id, CancellationToken ct)
    {
        var ligne = await _context.DevisLignes.FindAsync([id], ct);
        if (ligne is null) return NotFound();
        _context.DevisLignes.Remove(ligne);
        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Tâches (mise à jour financière) ─────────────────────

    /// <summary>
    /// Met à jour les champs financiers d'une tâche existante (planning).
    /// </summary>
    [HttpPut("taches/{id:int}/montants")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> UpdateTacheMontants(int id, [FromBody] UpdateTacheMontantsRequest req, CancellationToken ct)
    {
        var tache = await _context.Taches.FindAsync([id], ct);
        if (tache is null)
            return NotFound("Tâche introuvable.");

        tache.MontantPrevu = req.MontantPrevu;
        tache.MontantRealise = req.MontantRealise;
        await _context.SaveChangesAsync(ct);
        return Ok(new { tache.Id });
    }

    // ── Situations ────────────────────────────────────────

    [HttpPost("projets/{projetId:int}/situations")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> AddSituation(int projetId, [FromBody] SituationRequest req, CancellationToken ct)
    {
        if (!await _context.Projets.AnyAsync(p => p.Id == projetId, ct))
            return NotFound("Projet introuvable.");

        var situation = new SituationPaiement
        {
            ProjetId = projetId,
            Numero = req.Numero,
            Date = req.Date ?? DateTime.UtcNow,
            MontantValide = req.MontantValide,
            PourcentageCumule = req.PourcentageCumule
        };

        _context.SituationsPaiement.Add(situation);
        await _context.SaveChangesAsync(ct);
        return Ok(new { situation.Id });
    }

    [HttpDelete("situations/{id:int}")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> DeleteSituation(int id, CancellationToken ct)
    {
        var situation = await _context.SituationsPaiement.FindAsync([id], ct);
        if (situation is null) return NotFound();
        _context.SituationsPaiement.Remove(situation);
        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Avenants ──────────────────────────────────────────

    [HttpPost("projets/{projetId:int}/avenants")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> AddAvenant(int projetId, [FromBody] AvenantRequest req, CancellationToken ct)
    {
        if (!await _context.Projets.AnyAsync(p => p.Id == projetId, ct))
            return NotFound("Projet introuvable.");

        var avenant = new Avenant
        {
            ProjetId = projetId,
            Numero = req.Numero,
            Motif = req.Motif,
            Montant = req.Montant,
            Date = req.Date ?? DateTime.UtcNow
        };

        _context.Avenants.Add(avenant);
        await _context.SaveChangesAsync(ct);
        return Ok(new { avenant.Id });
    }

    [HttpDelete("avenants/{id:int}")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> DeleteAvenant(int id, CancellationToken ct)
    {
        var avenant = await _context.Avenants.FindAsync([id], ct);
        if (avenant is null) return NotFound();
        _context.Avenants.Remove(avenant);
        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Factures ──────────────────────────────────────────

    [HttpPost("projets/{projetId:int}/factures")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> AddFacture(int projetId, [FromBody] FactureRequest req, CancellationToken ct)
    {
        if (!await _context.Projets.AnyAsync(p => p.Id == projetId, ct))
            return NotFound("Projet introuvable.");

        var facture = new Facture
        {
            ProjetId = projetId,
            Numero = req.Numero,
            Date = req.Date ?? DateTime.UtcNow,
            Montant = req.Montant,
            Statut = Enum.TryParse<StatutFacture>(req.Statut, true, out var st) ? st : StatutFacture.Elaboree,
            SituationPaiementId = req.SituationPaiementId
        };

        _context.Factures.Add(facture);
        await _context.SaveChangesAsync(ct);
        return Ok(new { facture.Id });
    }

    [HttpPut("factures/{id:int}/statut")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> UpdateFactureStatut(int id, [FromBody] UpdateFactureStatutRequest req, CancellationToken ct)
    {
        var facture = await _context.Factures.FindAsync([id], ct);
        if (facture is null) return NotFound();

        if (!Enum.TryParse<StatutFacture>(req.Statut, true, out var statut))
            return BadRequest("Statut invalide.");

        facture.Statut = statut;
        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("factures/{id:int}")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> DeleteFacture(int id, CancellationToken ct)
    {
        var facture = await _context.Factures.FindAsync([id], ct);
        if (facture is null) return NotFound();
        _context.Factures.Remove(facture);
        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

}

// ── Request DTOs ──────────────────────────────────────────

public sealed record DevisLigneRequest(string Designation, decimal MontantHT, int Ordre);
public sealed record UpdateTacheMontantsRequest(decimal MontantPrevu, decimal MontantRealise);
public sealed record SituationRequest(int Numero, DateTime? Date, decimal MontantValide, decimal PourcentageCumule);
public sealed record AvenantRequest(int Numero, string Motif, decimal Montant, DateTime? Date);
public sealed record FactureRequest(string Numero, DateTime? Date, decimal Montant, string Statut, int? SituationPaiementId);
public sealed record UpdateFactureStatutRequest(string Statut);
