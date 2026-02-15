namespace IngeProjets.Api.Dtos;

/// <summary>
/// Lightweight task summary returned by list and detail endpoints.
/// </summary>
public sealed record TacheSummaryDto(
    int Id,
    string Titre,
    string? Description,
    string Priorite,
    string Statut,
    DateTime? DateDebut,
    DateTime DateEcheance,
    DateTime? DateFinReelle,
    int Progression,
    int ProjetId,
    string Projet,
    string ProjetType,
    string ProjetStatut,
    string? AssigneA,
    string? AssigneAId);
