using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IngeProjets.Data.Models;

public class TransactionBudget
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Le libellé est requis.")]
    [StringLength(300)]
    [Display(Name = "Libellé")]
    public string Libelle { get; set; } = default!;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant (€)")]
    public decimal Montant { get; set; }

    [Required]
    [Display(Name = "Type")]
    public TypeTransaction Type { get; set; }

    [Display(Name = "Catégorie")]
    public CategorieDepense Categorie { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    [StringLength(1000)]
    [Display(Name = "Notes")]
    public string? Notes { get; set; }

    // Navigation
    [Required]
    [Display(Name = "Projet")]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    [Display(Name = "Créé par")]
    public string? CreePar { get; set; }
}

public enum TypeTransaction
{
    [Display(Name = "Dépense")]
    Depense,

    [Display(Name = "Recette")]
    Recette,

    [Display(Name = "Provision")]
    Provision
}

public enum CategorieDepense
{
    [Display(Name = "Main d'œuvre")]
    MainOeuvre,

    [Display(Name = "Matériaux")]
    Materiaux,

    [Display(Name = "Équipements")]
    Equipements,

    [Display(Name = "Sous-traitance")]
    SousTraitance,

    [Display(Name = "Transport")]
    Transport,

    [Display(Name = "Autres")]
    Autres
}
