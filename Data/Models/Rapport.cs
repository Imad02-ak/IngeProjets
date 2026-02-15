using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IngeProjets.Data.Models;

public class Rapport
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Le titre est requis.")]
    [StringLength(200)]
    [Display(Name = "Titre")]
    public string Titre { get; set; } = default!;

    [Display(Name = "Type de rapport")]
    public TypeRapport Type { get; set; }

    [Display(Name = "Statut")]
    public StatutRapport Statut { get; set; } = StatutRapport.Brouillon;

    [StringLength(5000)]
    [Display(Name = "Contenu")]
    public string? Contenu { get; set; }

    [Display(Name = "Date de génération")]
    public DateTime DateGeneration { get; set; } = DateTime.UtcNow;

    [Display(Name = "Planifié")]
    public bool EstPlanifie { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Prochaine génération")]
    public DateTime? ProchaineGeneration { get; set; }

    // Navigation
    [Display(Name = "Projet")]
    public int? ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet? Projet { get; set; }

    [Display(Name = "Généré par")]
    public string? GenereParId { get; set; }

    [ForeignKey(nameof(GenereParId))]
    public ApplicationUser? GenerePar { get; set; }
}

public enum TypeRapport
{
    [Display(Name = "Performance")]
    Performance,

    [Display(Name = "Financier")]
    Financier,

    [Display(Name = "Avancement")]
    Avancement,

    [Display(Name = "Ressources")]
    Ressources,

    [Display(Name = "Qualité")]
    Qualite,

    [Display(Name = "Personnalisé")]
    Personnalise
}

public enum StatutRapport
{
    [Display(Name = "Brouillon")]
    Brouillon,

    [Display(Name = "Généré")]
    Genere,

    [Display(Name = "Archivé")]
    Archive
}
