using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IngeProjets.Data.Models;

/// <summary>
/// Ligne de détail d'un devis projet (lot).
/// </summary>
public class DevisLigne
{
    public int Id { get; set; }

    [Required]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    [Required]
    [StringLength(200)]
    [Display(Name = "Désignation du lot")]
    public string Designation { get; set; } = default!;

    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant HT")]
    public decimal MontantHT { get; set; }

    [Display(Name = "Ordre d'affichage")]
    public int Ordre { get; set; }
}

/// <summary>
/// Tâche financière associée à un projet (suivi montant prévu/réalisé).
/// </summary>
public class TacheProjet
{
    public int Id { get; set; }

    [Required]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    [Required]
    [StringLength(200)]
    [Display(Name = "Nom de la tâche")]
    public string Nom { get; set; } = default!;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant prévu")]
    public decimal MontantPrevu { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant réalisé")]
    public decimal MontantRealise { get; set; }

    [Range(0, 100)]
    [Display(Name = "Avancement (%)")]
    public int PourcentageAvancement { get; set; }

    [Display(Name = "Statut")]
    public StatutTacheProjet Statut { get; set; } = StatutTacheProjet.EnCours;
}

public enum StatutTacheProjet
{
    [Display(Name = "En cours")]
    EnCours,

    [Display(Name = "Terminé")]
    Termine,

    [Display(Name = "Suspendu")]
    Suspendu
}

/// <summary>
/// Situation mensuelle de paiement.
/// </summary>
public class SituationPaiement
{
    public int Id { get; set; }

    [Required]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    [Display(Name = "Numéro de situation")]
    public int Numero { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant validé")]
    public decimal MontantValide { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    [Display(Name = "Pourcentage cumulé (%)")]
    public decimal PourcentageCumule { get; set; }
}

/// <summary>
/// Avenant au contrat d'un projet.
/// </summary>
public class Avenant
{
    public int Id { get; set; }

    [Required]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    [Display(Name = "Numéro d'avenant")]
    public int Numero { get; set; }

    [Required]
    [StringLength(500)]
    [Display(Name = "Motif")]
    public string Motif { get; set; } = default!;

    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant (+ ajout / - retrait)")]
    public decimal Montant { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Facture liée à un projet et éventuellement à une situation.
/// </summary>
public class Facture
{
    public int Id { get; set; }

    [Required]
    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;

    public int? SituationPaiementId { get; set; }

    [ForeignKey(nameof(SituationPaiementId))]
    public SituationPaiement? SituationPaiement { get; set; }

    [Required]
    [StringLength(50)]
    [Display(Name = "Numéro de facture")]
    public string Numero { get; set; } = default!;

    [DataType(DataType.Date)]
    [Display(Name = "Date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "Montant")]
    public decimal Montant { get; set; }

    [Display(Name = "Statut")]
    public StatutFacture Statut { get; set; } = StatutFacture.Elaboree;
}

public enum StatutFacture
{
    [Display(Name = "Élaborée")]
    Elaboree,

    [Display(Name = "Validée")]
    Validee,

    [Display(Name = "Signée")]
    Signee
}
