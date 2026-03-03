using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IngeProjets.Data.Models;

public class Projet
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Le nom du projet est requis.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Le nom doit contenir entre 3 et 200 caractères.")]
    [Display(Name = "Nom du projet")]
    public string Nom { get; set; } = default!;

    [StringLength(20)]
    [Display(Name = "Code projet")]
    public string? Code { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Le type de projet est requis.")]
    [Display(Name = "Type de projet")]
    public TypeProjet Type { get; set; }

    [Display(Name = "Priorité")]
    public Priorite Priorite { get; set; } = Priorite.Moyenne;

    [Display(Name = "Statut")]
    public StatutProjet Statut { get; set; } = StatutProjet.EnPlanification;

    [Required(ErrorMessage = "La date de démarrage est requise.")]
    [DataType(DataType.Date)]
    [Display(Name = "Date de démarrage")]
    public DateTime DateDebut { get; set; }

    [Required(ErrorMessage = "La date de fin prévue est requise.")]
    [DataType(DataType.Date)]
    [Display(Name = "Date de fin prévue")]
    public DateTime DateFinPrevue { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Date de fin réelle")]
    public DateTime? DateFinReelle { get; set; }

    [Required(ErrorMessage = "Le montant du projet est requis.")]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0, double.MaxValue, ErrorMessage = "Le montant doit être positif.")]
    [Display(Name = "Montant du projet (€)")]
    public decimal BudgetAlloue { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Le nombre de propositions des prix doit être positif.")]
    [Display(Name = "Nombre des propositions des prix")]
    public int? NombrePropositionsPrix { get; set; }

    [Range(0, 100)]
    [Display(Name = "Avancement (%)")]
    public int Avancement { get; set; }

    [StringLength(300)]
    public string? Localisation { get; set; }

    [StringLength(200)]
    [Display(Name = "Maître de l'ouvrage")]
    public string? MaitreOuvrage { get; set; }

    [StringLength(200)]
    [Display(Name = "Maître d'œuvre")]
    public string? MaitreOeuvre { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateModification { get; set; }

    [Display(Name = "Archivé")]
    public bool EstArchive { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Date d'archivage")]
    public DateTime? DateArchivage { get; set; }

    // Navigation
    [Display(Name = "Chef de projet")]
    public string? ChefProjetId { get; set; }

    [ForeignKey(nameof(ChefProjetId))]
    public ApplicationUser? ChefProjet { get; set; }

    public ICollection<Tache> Taches { get; set; } = [];
    public ICollection<TransactionBudget> Transactions { get; set; } = [];
    public ICollection<Rapport> Rapports { get; set; } = [];
    public ICollection<DocumentProjet> Documents { get; set; } = [];
    public ICollection<DevisLigne> DevisLignes { get; set; } = [];
    public ICollection<TacheProjet> TachesProjet { get; set; } = [];
    public ICollection<SituationPaiement> Situations { get; set; } = [];
    public ICollection<Avenant> Avenants { get; set; } = [];
    public ICollection<Facture> Factures { get; set; } = [];
}

public enum TypeProjet
{
    [Display(Name = "Routes & Autoroutes")]
    Route,

    [Display(Name = "Ponts & Viaducs")]
    Pont,

    [Display(Name = "Bâtiments Publics")]
    Batiment,

    [Display(Name = "Assainissement")]
    Assainissement,

    [Display(Name = "Énergie & Réseaux")]
    Energie
}

public enum StatutProjet
{
    [Display(Name = "En planification")]
    EnPlanification,

    [Display(Name = "En cours")]
    EnCours,

    [Display(Name = "En pause")]
    EnPause,

    [Display(Name = "En retard")]
    EnRetard,

    [Display(Name = "Terminé")]
    Termine
}

public enum Priorite
{
    [Display(Name = "Basse")]
    Basse,

    [Display(Name = "Moyenne")]
    Moyenne,

    [Display(Name = "Haute")]
    Haute,

    [Display(Name = "Urgente")]
    Urgente
}
