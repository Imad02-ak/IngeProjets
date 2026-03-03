namespace IngeProjets.Data.Models;

/// <summary>
/// Données du formulaire pour une demande de réception provisoire.
/// Les informations du projet (nom, lieu, maître d'ouvrage, budget, dates)
/// sont récupérées automatiquement depuis le projet associé.
/// </summary>
public record ReceptionProvisoireData
{
    public string? NomProjet { get; init; }
    public string? MaitreOuvrage { get; init; }
    public string? LieuProjet { get; init; }
    public string? MontantMarche { get; init; }
    public string? DateDebut { get; init; }
    public string? DateFin { get; init; }
    public string? DateDemande { get; init; }
    public string? Entreprise { get; init; }
    public string? Observations { get; init; }
}

/// <summary>
/// Données du formulaire pour une demande de réception définitive.
/// </summary>
public record ReceptionDefinitiveData
{
    public string? NomProjet { get; init; }
    public string? MaitreOuvrage { get; init; }
    public string? LieuProjet { get; init; }
    public string? MontantMarche { get; init; }
    public string? DateFin { get; init; }
    public string? DateDemande { get; init; }
    public string? Entreprise { get; init; }
    public string? DateReceptionProvisoire { get; init; }
    public string? DureeGarantie { get; init; }
    public string? ReservesLevees { get; init; }
    public string? Observations { get; init; }
}

/// <summary>
/// Données du formulaire pour un rapport de contrôle qualité.
/// </summary>
public record ControleQualiteData
{
    public string? NomProjet { get; init; }
    public string? MaitreOuvrage { get; init; }
    public string? LieuProjet { get; init; }
    public string? ObjetControle { get; init; }
    public string? DateControle { get; init; }
    public string? Controleur { get; init; }
    public string? Resultat { get; init; }
    public string? Observations { get; init; }
    public string? Actions { get; init; }
}

/// <summary>
/// Données du formulaire pour un bordereau d'envoi.
/// </summary>
public record BordereauData
{
    public string? NomProjet { get; init; }
    public string? MaitreOuvrage { get; init; }
    public string? LieuProjet { get; init; }
    public string? NumeroBordereau { get; init; }
    public string? DateBordereau { get; init; }
    public string? Destinataire { get; init; }
    public string? ObjetBordereau { get; init; }
    public string? PiecesJointes { get; init; }
    public string? Observations { get; init; }
}

/// <summary>
/// Données du formulaire pour un courrier officiel.
/// </summary>
public record CourrierData
{
    public string? NomProjet { get; init; }
    public string? MaitreOuvrage { get; init; }
    public string? LieuProjet { get; init; }
    public string? RefCourrier { get; init; }
    public string? DateCourrier { get; init; }
    public string? Destinataire { get; init; }
    public string? Objet { get; init; }
    public string? Corps { get; init; }
    public string? PiecesJointes { get; init; }
}

/// <summary>
/// Données du formulaire pour un rapport personnalisé.
/// </summary>
public record PersonnaliseData
{
    public string? Contenu { get; init; }
}
