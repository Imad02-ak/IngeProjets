using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Api.Dtos;

public sealed class UpdateTacheRequest : IValidatableObject
{
    [Required(ErrorMessage = "Le titre de la tâche est requis.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Le titre doit contenir entre 3 et 200 caractères.")]
    public string Titre { get; init; } = default!;

    [StringLength(2000, ErrorMessage = "La description ne doit pas dépasser 2000 caractères.")]
    public string? Description { get; init; }

    public string Priorite { get; init; } = "Moyenne";

    [Required(ErrorMessage = "Le statut est requis.")]
    public string Statut { get; init; } = "AFaire";

    public DateTime? DateDebut { get; init; }

    [Required(ErrorMessage = "La date d'échéance est requise.")]
    public DateTime DateEcheance { get; init; }

    [Range(0, 100, ErrorMessage = "La progression doit être comprise entre 0 et 100.")]
    public int Progression { get; init; }

    public string? AssigneAId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DateDebut.HasValue && DateEcheance <= DateDebut.Value)
        {
            yield return new ValidationResult(
                "La date d'échéance doit être postérieure à la date de début.",
                [nameof(DateEcheance)]);
        }
    }
}
