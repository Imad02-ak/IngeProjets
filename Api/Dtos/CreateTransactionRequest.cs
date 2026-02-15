using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Api.Dtos;

public sealed class CreateTransactionRequest
{
    [Required(ErrorMessage = "Le libellé est requis.")]
    [StringLength(300, ErrorMessage = "Le libellé ne doit pas dépasser 300 caractères.")]
    public string Libelle { get; init; } = default!;

    [Required(ErrorMessage = "Le montant est requis.")]
    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Le montant doit être supérieur à zéro.")]
    public decimal Montant { get; init; }

    [Required(ErrorMessage = "Le type de transaction est requis.")]
    public string Type { get; init; } = default!;

    public string Categorie { get; init; } = "Autres";

    public DateTime? Date { get; init; }

    [StringLength(1000, ErrorMessage = "Les notes ne doivent pas dépasser 1000 caractères.")]
    public string? Notes { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Le projet est requis.")]
    public int ProjetId { get; init; }
}
