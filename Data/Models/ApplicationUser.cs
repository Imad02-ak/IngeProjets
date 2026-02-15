using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace IngeProjets.Data.Models;

public class ApplicationUser : IdentityUser
{
    [Required(ErrorMessage = "Le nom est requis.")]
    [StringLength(100)]
    [Display(Name = "Nom")]
    public string Nom { get; set; } = default!;

    [Required(ErrorMessage = "Le prénom est requis.")]
    [StringLength(100)]
    [Display(Name = "Prénom")]
    public string Prenom { get; set; } = default!;

    [Display(Name = "Nom complet")]
    public string NomComplet => $"{Prenom} {Nom}";

    [Display(Name = "Date de création")]
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    [Display(Name = "Actif")]
    public bool EstActif { get; set; } = true;

    // Navigation
    public ICollection<Projet> ProjetsGeres { get; set; } = [];
    public ICollection<Tache> TachesAssignees { get; set; } = [];
    public ICollection<Rapport> RapportsGeneres { get; set; } = [];
}
