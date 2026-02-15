namespace IngeProjets.Api.Dtos;

/// <summary>
/// Project summary returned by the list endpoint.
/// </summary>
public sealed record ProjetSummaryDto(
    int Id,
    string Nom,
    string? Code,
    string? Description,
    string Type,
    string Priorite,
    string Statut,
    DateTime DateDebut,
    DateTime DateFinPrevue,
    DateTime? DateFinReelle,
    decimal BudgetAlloue,
    decimal? PropositionPrix,
    int Avancement,
    string? Localisation,
    string? MaitreOuvrage,
    string? ChefProjet,
    string? ChefProjetId,
    DateTime DateCreation);

/// <summary>
/// Detailed project view including tasks, documents, and expenses.
/// </summary>
public sealed record ProjetDetailDto(
    int Id,
    string Nom,
    string? Code,
    string? Description,
    string Type,
    string Priorite,
    string Statut,
    DateTime DateDebut,
    DateTime DateFinPrevue,
    DateTime? DateFinReelle,
    decimal BudgetAlloue,
    decimal? PropositionPrix,
    int Avancement,
    string? Localisation,
    string? MaitreOuvrage,
    string? ChefProjet,
    string? ChefProjetId,
    DateTime DateCreation,
    decimal Depense,
    IEnumerable<ProjetTacheDto> Taches,
    IEnumerable<ProjetDocumentDto> Documents);

/// <summary>
/// Lightweight task info nested inside a project detail.
/// </summary>
public sealed record ProjetTacheDto(
    int Id,
    string Titre,
    string Statut,
    string Priorite,
    DateTime? DateDebut,
    DateTime DateEcheance,
    int Progression,
    string? AssigneA,
    string? AssigneAId);

/// <summary>
/// Document info nested inside a project detail.
/// </summary>
public sealed record ProjetDocumentDto(
    int Id,
    string NomOriginal,
    string? ContentType,
    long TailleFichier,
    DateTime DateAjout,
    string? AjoutePar);
