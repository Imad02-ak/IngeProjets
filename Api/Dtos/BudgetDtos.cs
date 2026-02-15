namespace IngeProjets.Api.Dtos;

/// <summary>
/// Budget overview for all projects.
/// </summary>
public sealed record BudgetOverviewDto(
    decimal BudgetTotal,
    decimal DepensesTotales,
    decimal Restant,
    decimal PourcentageUtilise,
    int Depassements,
    IReadOnlyList<BudgetParProjetDto> ParProjet);

/// <summary>
/// Budget breakdown for a single project.
/// </summary>
public sealed record BudgetParProjetDto(
    int Id,
    string Nom,
    decimal BudgetAlloue,
    decimal Depense,
    decimal Restant,
    decimal Pourcentage);

/// <summary>
/// Transaction summary returned by the list endpoint.
/// </summary>
public sealed record TransactionDto(
    int Id,
    string Libelle,
    decimal Montant,
    string Type,
    string Categorie,
    DateTime Date,
    string? Notes,
    int ProjetId,
    string Projet);
