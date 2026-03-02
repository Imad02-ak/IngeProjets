using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Services;

/// <summary>
/// Service de gestion financière pour un projet (devis, tâches, situations, avenants, factures).
/// </summary>
public sealed class ProjectMontantService
{
    private readonly ApplicationDbContext _context;

    public ProjectMontantService(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── Devis ─────────────────────────────────────────────

    /// <summary>
    /// Récupère les lignes de devis d'un projet.
    /// </summary>
    public async Task<List<DevisLigne>> GetDevisLignesAsync(int projetId, CancellationToken ct = default)
    {
        return await _context.DevisLignes
            .Where(d => d.ProjetId == projetId)
            .OrderBy(d => d.Ordre)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    /// <summary>
    /// Calcule le montant TTC d'un projet (devis + avenants, TVA 19%).
    /// </summary>
    public async Task<(decimal MontantHT, decimal TVA, decimal MontantTTC)> CalculerDevisTotalAsync(
        int projetId, CancellationToken ct = default)
    {
        var totalHT = await _context.DevisLignes
            .Where(d => d.ProjetId == projetId)
            .SumAsync(d => d.MontantHT, ct);

        var totalAvenants = await _context.Avenants
            .Where(a => a.ProjetId == projetId)
            .SumAsync(a => a.Montant, ct);

        var montantHT = totalHT + totalAvenants;
        var tva = Math.Round(montantHT * 0.19m, 2);
        var ttc = montantHT + tva;

        return (montantHT, tva, ttc);
    }

    // ── Tâches Projet ─────────────────────────────────────

    /// <summary>
    /// Récupère les tâches (planning) d'un projet avec leurs données financières.
    /// </summary>
    public async Task<List<Tache>> GetTachesAsync(int projetId, CancellationToken ct = default)
    {
        return await _context.Taches
            .Where(t => t.ProjetId == projetId && !t.EstArchive)
            .OrderBy(t => t.DateEcheance)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    // ── Situations ────────────────────────────────────────

    /// <summary>
    /// Récupère les situations de paiement d'un projet.
    /// </summary>
    public async Task<List<SituationPaiement>> GetSituationsAsync(int projetId, CancellationToken ct = default)
    {
        return await _context.SituationsPaiement
            .Where(s => s.ProjetId == projetId)
            .OrderBy(s => s.Numero)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    /// <summary>
    /// Calcule le montant restant à payer pour un projet.
    /// </summary>
    public async Task<decimal> CalculerMontantRestantAsync(int projetId, CancellationToken ct = default)
    {
        var (montantHT, _, _) = await CalculerDevisTotalAsync(projetId, ct);
        var totalValide = await _context.SituationsPaiement
            .Where(s => s.ProjetId == projetId)
            .SumAsync(s => s.MontantValide, ct);

        return montantHT - totalValide;
    }

    // ── Avenants ──────────────────────────────────────────

    /// <summary>
    /// Récupère les avenants d'un projet.
    /// </summary>
    public async Task<List<Avenant>> GetAvenantsAsync(int projetId, CancellationToken ct = default)
    {
        return await _context.Avenants
            .Where(a => a.ProjetId == projetId)
            .OrderBy(a => a.Numero)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    // ── Factures ──────────────────────────────────────────

    /// <summary>
    /// Récupère les factures d'un projet.
    /// </summary>
    public async Task<List<Facture>> GetFacturesAsync(int projetId, CancellationToken ct = default)
    {
        return await _context.Factures
            .Where(f => f.ProjetId == projetId)
            .Include(f => f.SituationPaiement)
            .OrderByDescending(f => f.Date)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    // ── Résumé global ─────────────────────────────────────

    /// <summary>
    /// Retourne le résumé financier complet pour un projet.
    /// </summary>
    public async Task<ProjectMontantSummary> GetSummaryAsync(int projetId, CancellationToken ct = default)
    {
        var projet = await _context.Projets
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projetId, ct);

        if (projet is null)
            throw new InvalidOperationException($"Projet {projetId} introuvable.");

        var devisLignes = await GetDevisLignesAsync(projetId, ct);
        var (montantHT, tva, montantTTC) = await CalculerDevisTotalAsync(projetId, ct);
        var taches = await GetTachesAsync(projetId, ct);
        var situations = await GetSituationsAsync(projetId, ct);
        var avenants = await GetAvenantsAsync(projetId, ct);
        var factures = await GetFacturesAsync(projetId, ct);
        var montantRestant = await CalculerMontantRestantAsync(projetId, ct);

        var totalPrevu = taches.Sum(t => t.MontantPrevu);
        var totalRealise = taches.Sum(t => t.MontantRealise);
        var avancementGlobal = taches.Count > 0
            ? Math.Round((decimal)taches.Average(t => t.Progression), 1)
            : 0;

        return new ProjectMontantSummary
        {
            ProjetId = projet.Id,
            ProjetNom = projet.Nom,
            DevisLignes = devisLignes,
            MontantHT = montantHT,
            TVA = tva,
            MontantTTC = montantTTC,
            Taches = taches,
            TotalPrevu = totalPrevu,
            TotalRealise = totalRealise,
            AvancementGlobal = avancementGlobal,
            Situations = situations,
            MontantRestant = montantRestant,
            Avenants = avenants,
            Factures = factures
        };
    }
}

/// <summary>
/// Résumé financier complet d'un projet.
/// </summary>
public sealed class ProjectMontantSummary
{
    public int ProjetId { get; init; }
    public string ProjetNom { get; init; } = default!;

    public List<DevisLigne> DevisLignes { get; init; } = [];
    public decimal MontantHT { get; init; }
    public decimal TVA { get; init; }
    public decimal MontantTTC { get; init; }

    public List<Tache> Taches { get; init; } = [];
    public decimal TotalPrevu { get; init; }
    public decimal TotalRealise { get; init; }
    public decimal AvancementGlobal { get; init; }

    public List<SituationPaiement> Situations { get; init; } = [];
    public decimal MontantRestant { get; init; }

    public List<Avenant> Avenants { get; init; } = [];
    public List<Facture> Factures { get; init; } = [];
}
