using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IngeProjets.Data.Models;

public class Tache
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Le titre de la tâche est requis.")]
    [StringLength(200, MinimumLength = 3)]
    [Display(Name = "Titre")]
    public string Titre { get; set; } = default!;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Display(Name = "Priorité")]
    public Priorite Priorite { get; set; } = Priorite.Moyenne;

    [Display(Name = "Statut")]
    public StatutTache Statut { get; set; } = StatutTache.AFaire;

    [DataType(DataType.Date)]
    [Display(Name = "Date de début")]
    public DateTime? DateDebut { get; set; }

    [Required(ErrorMessage = "La date d'échéance est requise.")]
    [DataType(DataType.Date)]
    [Display(Name = "Date d'échéance")]
    public DateTime DateEcheance { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Date de fin réelle")]
    public DateTime? DateFinReelle { get; set; }

    [Range(0, 100)]
    [Display(Name = "Progression (%)")]
    public int Progression { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation
    [Required]
    [Display(Name = "Projet")]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    [Display(Name = "Assigné à")]
    public string? AssigneAId { get; set; }

    [ForeignKey(nameof(AssigneAId))]
    public ApplicationUser? AssigneA { get; set; }
}

public enum StatutTache
{
    [Display(Name = "À faire")]
    AFaire,

    [Display(Name = "En cours")]
    EnCours,

    [Display(Name = "En revue")]
    EnRevue,

    [Display(Name = "Terminée")]
    Terminee
}
