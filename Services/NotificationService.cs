using IngeProjets.Data;
using IngeProjets.Data.Models;

namespace IngeProjets.Services;

/// <summary>Centralizes notification creation for platform events.</summary>
public class NotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Creates a notification and persists it.</summary>
    public async Task CreateAsync(
        NotificationType type,
        string message,
        string? icon = null,
        string? couleur = null,
        string? entityType = null,
        int? entityId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            Type = type,
            Message = message,
            Icon = icon,
            Couleur = couleur,
            EntityType = entityType,
            EntityId = entityId,
            DateCreation = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Creates a notification for a project event.</summary>
    public Task NotifyProjetAsync(NotificationType type, string projetNom, int projetId, CancellationToken cancellationToken = default)
    {
        var (message, icon, couleur) = type switch
        {
            NotificationType.ProjetCree => ($"Nouveau projet créé : {projetNom}", "fa-folder-plus", "primary"),
            NotificationType.ProjetModifie => ($"Projet modifié : {projetNom}", "fa-pen-to-square", "info"),
            NotificationType.ProjetArchive => ($"Projet archivé : {projetNom}", "fa-box-archive", "warning"),
            NotificationType.ProjetRestaure => ($"Projet restauré : {projetNom}", "fa-rotate-left", "success"),
            NotificationType.ProjetSupprime => ($"Projet supprimé : {projetNom}", "fa-trash", "danger"),
            _ => ($"Événement projet : {projetNom}", "fa-folder", "info")
        };

        return CreateAsync(type, message, icon, couleur, "projet", projetId, cancellationToken);
    }

    /// <summary>Creates a notification for a task event.</summary>
    public Task NotifyTacheAsync(NotificationType type, string tacheTitre, string projetNom, int tacheId, CancellationToken cancellationToken = default)
    {
        var (message, icon, couleur) = type switch
        {
            NotificationType.TacheCree => ($"Nouvelle tâche : {tacheTitre} ({projetNom})", "fa-list-check", "primary"),
            NotificationType.TacheModifiee => ($"Tâche modifiée : {tacheTitre} ({projetNom})", "fa-pen", "info"),
            NotificationType.TacheTerminee => ($"Tâche terminée : {tacheTitre} ({projetNom})", "fa-check-circle", "success"),
            NotificationType.TacheArchivee => ($"Tâche archivée : {tacheTitre} ({projetNom})", "fa-box-archive", "warning"),
            NotificationType.TacheSupprimee => ($"Tâche supprimée : {tacheTitre} ({projetNom})", "fa-trash", "danger"),
            _ => ($"Événement tâche : {tacheTitre}", "fa-tasks", "info")
        };

        return CreateAsync(type, message, icon, couleur, "tache", tacheId, cancellationToken);
    }

    /// <summary>Creates a notification for a report event.</summary>
    public Task NotifyRapportAsync(string rapportTitre, int? projetId, CancellationToken cancellationToken = default)
    {
        return NotifyRapportAsync(NotificationType.RapportGenere, rapportTitre, projetId, cancellationToken);
    }

    /// <summary>Creates a notification for a report event with a specific type.</summary>
    public Task NotifyRapportAsync(NotificationType type, string rapportTitre, int? projetId, CancellationToken cancellationToken = default)
    {
        var (message, icon, couleur) = type switch
        {
            NotificationType.RapportGenere => ($"Rapport généré : {rapportTitre}", "fa-file-lines", "info"),
            NotificationType.RapportArchive => ($"Rapport archivé : {rapportTitre}", "fa-box-archive", "warning"),
            NotificationType.RapportRestaure => ($"Rapport restauré : {rapportTitre}", "fa-rotate-left", "success"),
            NotificationType.RapportSupprime => ($"Rapport supprimé : {rapportTitre}", "fa-trash", "danger"),
            _ => ($"Événement rapport : {rapportTitre}", "fa-file-lines", "info")
        };

        return CreateAsync(type, message, icon, couleur, "rapport", projetId, cancellationToken);
    }

    /// <summary>Creates a notification for a document event.</summary>
    public Task NotifyDocumentAsync(string docNom, string projetNom, int projetId, CancellationToken cancellationToken = default)
    {
        return NotifyDocumentAsync(NotificationType.DocumentAjoute, docNom, projetNom, projetId, cancellationToken);
    }

    /// <summary>Creates a notification for a document event with a specific type.</summary>
    public Task NotifyDocumentAsync(NotificationType type, string docNom, string projetNom, int projetId, CancellationToken cancellationToken = default)
    {
        var (message, icon, couleur) = type switch
        {
            NotificationType.DocumentAjoute => ($"Document ajouté : {docNom} ({projetNom})", "fa-cloud-arrow-up", "info"),
            NotificationType.DocumentArchive => ($"Document archivé : {docNom} ({projetNom})", "fa-box-archive", "warning"),
            NotificationType.DocumentRestaure => ($"Document restauré : {docNom} ({projetNom})", "fa-rotate-left", "success"),
            NotificationType.DocumentSupprime => ($"Document supprimé : {docNom} ({projetNom})", "fa-trash", "danger"),
            _ => ($"Événement document : {docNom}", "fa-file", "info")
        };

        return CreateAsync(type, message, icon, couleur, "projet", projetId, cancellationToken);
    }

    /// <summary>Creates a notification for a budget transaction event.</summary>
    public Task NotifyTransactionAsync(NotificationType type, string libelle, string projetNom, int projetId, CancellationToken cancellationToken = default)
    {
        var (message, icon, couleur) = type switch
        {
            NotificationType.TransactionCreee => ($"Transaction créée : {libelle} ({projetNom})", "fa-money-bill-transfer", "info"),
            NotificationType.TransactionSupprimee => ($"Transaction supprimée : {libelle} ({projetNom})", "fa-trash", "danger"),
            _ => ($"Événement budget : {libelle}", "fa-sack-dollar", "info")
        };

        return CreateAsync(type, message, icon, couleur, "projet", projetId, cancellationToken);
    }

    /// <summary>Creates a notification for a user event.</summary>
    public Task NotifyUtilisateurAsync(NotificationType type, string userName, CancellationToken cancellationToken = default)
    {
        var (message, icon, couleur) = type switch
        {
            NotificationType.UtilisateurInscrit => ($"Nouvel utilisateur inscrit : {userName}", "fa-user-plus", "info"),
            NotificationType.UtilisateurApprouve => ($"Utilisateur approuvé : {userName}", "fa-user-check", "success"),
            NotificationType.UtilisateurRefuse => ($"Inscription refusée : {userName}", "fa-user-xmark", "danger"),
            _ => ($"Événement utilisateur : {userName}", "fa-user", "info")
        };

        return CreateAsync(type, message, icon, couleur, entityType: null, entityId: null, cancellationToken: cancellationToken);
    }
}
