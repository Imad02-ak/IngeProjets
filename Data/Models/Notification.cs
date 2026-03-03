using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Data.Models;

public enum NotificationType
{
    ProjetCree,
    ProjetModifie,
    ProjetArchive,
    ProjetRestaure,
    ProjetSupprime,
    TacheCree,
    TacheModifiee,
    TacheTerminee,
    TacheArchivee,
    TacheSupprimee,
    RapportGenere,
    RapportArchive,
    RapportRestaure,
    RapportSupprime,
    DocumentAjoute,
    DocumentArchive,
    DocumentRestaure,
    DocumentSupprime,
    TransactionCreee,
    TransactionSupprimee,
    UtilisateurInscrit,
    UtilisateurApprouve,
    UtilisateurRefuse
}

public class Notification
{
    public int Id { get; set; }

    [Required]
    [StringLength(500)]
    public string Message { get; set; } = default!;

    public NotificationType Type { get; set; }

    [StringLength(50)]
    public string? Icon { get; set; }

    [StringLength(20)]
    public string? Couleur { get; set; }

    [StringLength(50)]
    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    public bool EstLue { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
}
