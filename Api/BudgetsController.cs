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
public class BudgetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BudgetsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBudgetOverview(CancellationToken cancellationToken)
    {
        var budgetTotal = await _context.Projets.SumAsync(p => p.BudgetAlloue, cancellationToken);
        var depenses = await _context.TransactionsBudget
            .Where(t => t.Type == TypeTransaction.Depense)
            .SumAsync(t => t.Montant, cancellationToken);
        var restant = budgetTotal - depenses;

        var parProjet = await _context.Projets
            .Select(p => new
            {
                p.Id,
                p.Nom,
                p.BudgetAlloue,
                Depense = p.Transactions
                    .Where(t => t.Type == TypeTransaction.Depense)
                    .Sum(t => t.Montant),
            })
            .Select(p => new BudgetParProjetDto(
                p.Id,
                p.Nom,
                p.BudgetAlloue,
                p.Depense,
                p.BudgetAlloue - p.Depense,
                p.BudgetAlloue > 0
                    ? Math.Round(p.Depense / p.BudgetAlloue * 100, 0)
                    : 0))
            .ToListAsync(cancellationToken);

        var depassements = parProjet.Count(p => p.Pourcentage > 100);

        return Ok(new BudgetOverviewDto(
            budgetTotal,
            depenses,
            restant,
            budgetTotal > 0 ? Math.Round(depenses / budgetTotal * 100, 0) : 0,
            depassements,
            parProjet));
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int? projetId, CancellationToken cancellationToken)
    {
        var query = _context.TransactionsBudget.AsNoTracking().AsQueryable();

        if (projetId.HasValue)
            query = query.Where(t => t.ProjetId == projetId.Value);

        var transactions = await query
            .OrderByDescending(t => t.Date)
            .Select(t => new TransactionDto(
                t.Id,
                t.Libelle,
                t.Montant,
                t.Type.ToString(),
                t.Categorie.ToString(),
                t.Date,
                t.Notes,
                t.ProjetId,
                t.Projet.Nom))
            .ToListAsync(cancellationToken);

        return Ok(transactions);
    }

    [HttpPost("transactions")]
    [Authorize(Policy = "RequireEncadrement")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!Enum.TryParse<TypeTransaction>(request.Type, true, out var type))
            return BadRequest("Type de transaction invalide.");

        if (!Enum.TryParse<CategorieDepense>(request.Categorie, true, out var categorie))
            categorie = CategorieDepense.Autres;

        // Verify that the project exists
        if (!await _context.Projets.AnyAsync(p => p.Id == request.ProjetId, cancellationToken))
            return BadRequest("Projet introuvable.");

        var transaction = new TransactionBudget
        {
            Libelle = request.Libelle,
            Montant = request.Montant,
            Type = type,
            Categorie = categorie,
            Date = request.Date ?? DateTime.UtcNow,
            Notes = request.Notes,
            ProjetId = request.ProjetId,
            CreePar = User.Identity?.Name
        };

        _context.TransactionsBudget.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetTransactions), new { projetId = transaction.ProjetId },
            new { transaction.Id, transaction.Libelle });
    }

    [HttpDelete("transactions/{id}")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> DeleteTransaction(int id, CancellationToken cancellationToken)
    {
        var transaction = await _context.TransactionsBudget.FindAsync([id], cancellationToken);
        if (transaction is null)
            return NotFound();

        _context.TransactionsBudget.Remove(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
