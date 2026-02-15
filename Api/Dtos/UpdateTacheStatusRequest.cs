using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Api.Dtos;

public sealed class UpdateTacheStatusRequest
{
    [Required(ErrorMessage = "Le statut est requis.")]
    public string Statut { get; init; } = default!;
}
