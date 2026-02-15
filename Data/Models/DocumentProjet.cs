using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IngeProjets.Data.Models;

public class DocumentProjet
{
    public int Id { get; set; }

    [Required]
    [StringLength(255)]
    public string NomFichier { get; set; } = default!;

    [Required]
    [StringLength(255)]
    public string NomOriginal { get; set; } = default!;

    [StringLength(100)]
    public string? ContentType { get; set; }

    public long TailleFichier { get; set; }

    public DateTime DateAjout { get; set; } = DateTime.UtcNow;

    public string? AjouteParId { get; set; }

    [ForeignKey(nameof(AjouteParId))]
    public ApplicationUser? AjoutePar { get; set; }

    public int ProjetId { get; set; }

    [ForeignKey(nameof(ProjetId))]
    public Projet Projet { get; set; } = default!;
}
