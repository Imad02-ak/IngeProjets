using IngeProjets.Api.Validation;
using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Api.Dtos;

public sealed class CreateProjetRequest
{
    [Required(ErrorMessage = "Le nom du projet est requis.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Le nom doit contenir entre 3 et 200 caractères.")]
    public string Nom { get; init; } = default!;

    [StringLength(20, ErrorMessage = "Le code ne doit pas dépasser 20 caractères.")]
    public string? Code { get; init; }

    [StringLength(2000, ErrorMessage = "La description ne doit pas dépasser 2000 caractères.")]
    public string? Description { get; init; }

    [Required(ErrorMessage = "Le type de projet est requis.")]
    public string Type { get; init; } = default!;

    public string Priorite { get; init; } = "Moyenne";

    [Required(ErrorMessage = "La date de début est requise.")]
    public DateTime DateDebut { get; init; }

    [Required(ErrorMessage = "La date de fin prévue est requise.")]
    [DateGreaterThan(nameof(DateDebut), ErrorMessage = "La date de fin prévue doit être postérieure à la date de début.")]
    public DateTime DateFinPrevue { get; init; }

    [Required(ErrorMessage = "Le budget est requis.")]
    [Range(0, (double)decimal.MaxValue, ErrorMessage = "Le budget doit être positif.")]
    public decimal BudgetAlloue { get; init; }

    [Range(0, (double)decimal.MaxValue, ErrorMessage = "La proposition de prix doit être positive.")]
    public decimal? PropositionPrix { get; init; }

    [StringLength(300, ErrorMessage = "La localisation ne doit pas dépasser 300 caractères.")]
    public string? Localisation { get; init; }

    [StringLength(200, ErrorMessage = "Le maître d'ouvrage ne doit pas dépasser 200 caractères.")]
    public string? MaitreOuvrage { get; init; }

    public string? ChefProjetId { get; init; }
}
