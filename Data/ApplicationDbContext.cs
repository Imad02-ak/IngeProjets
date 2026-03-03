using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Projet> Projets => Set<Projet>();
    public DbSet<Tache> Taches => Set<Tache>();
    public DbSet<TransactionBudget> TransactionsBudget => Set<TransactionBudget>();
    public DbSet<Rapport> Rapports => Set<Rapport>();
    public DbSet<DocumentProjet> Documents => Set<DocumentProjet>();
    public DbSet<DevisLigne> DevisLignes => Set<DevisLigne>();
    public DbSet<TacheProjet> TachesProjet => Set<TacheProjet>();
    public DbSet<SituationPaiement> SituationsPaiement => Set<SituationPaiement>();
    public DbSet<Avenant> Avenants => Set<Avenant>();
    public DbSet<Facture> Factures => Set<Facture>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // --- Projet ---
        builder.Entity<Projet>(entity =>
        {
            entity.HasIndex(p => p.Code).IsUnique().HasFilter("[Code] IS NOT NULL");
            entity.HasIndex(p => p.Statut);
            entity.HasIndex(p => p.Type);
            entity.HasIndex(p => p.EstArchive);

            entity.HasOne(p => p.ChefProjet)
                  .WithMany(u => u.ProjetsGeres)
                  .HasForeignKey(p => p.ChefProjetId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // --- Tache ---
        builder.Entity<Tache>(entity =>
        {
            entity.HasIndex(t => t.Statut);
            entity.HasIndex(t => t.DateEcheance);
            entity.HasIndex(t => t.EstArchive);

            entity.HasOne(t => t.Projet)
                  .WithMany(p => p.Taches)
                  .HasForeignKey(t => t.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.AssigneA)
                  .WithMany(u => u.TachesAssignees)
                  .HasForeignKey(t => t.AssigneAId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.Dependance)
                  .WithMany(t => t.TachesDependantes)
                  .HasForeignKey(t => t.DependanceId)
                  .OnDelete(DeleteBehavior.NoAction); // ← Remplacer SetNull par NoAction
        });

        // --- TransactionBudget ---
        builder.Entity<TransactionBudget>(entity =>
        {
            entity.HasIndex(t => t.Date);

            entity.HasOne(t => t.Projet)
                  .WithMany(p => p.Transactions)
                  .HasForeignKey(t => t.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- DocumentProjet ---
        builder.Entity<DocumentProjet>(entity =>
        {
            entity.HasIndex(d => d.ProjetId);

            entity.HasOne(d => d.Projet)
                  .WithMany(p => p.Documents)
                  .HasForeignKey(d => d.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.AjoutePar)
                  .WithMany()
                  .HasForeignKey(d => d.AjouteParId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // --- Rapport ---
        builder.Entity<Rapport>(entity =>
        {
            entity.HasIndex(r => r.Type);

            entity.HasOne(r => r.Projet)
                  .WithMany(p => p.Rapports)
                  .HasForeignKey(r => r.ProjetId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.GenerePar)
                  .WithMany(u => u.RapportsGeneres)
                  .HasForeignKey(r => r.GenereParId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // --- DevisLigne ---
        builder.Entity<DevisLigne>(entity =>
        {
            entity.HasOne(d => d.Projet)
                  .WithMany(p => p.DevisLignes)
                  .HasForeignKey(d => d.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- TacheProjet ---
        builder.Entity<TacheProjet>(entity =>
        {
            entity.HasOne(t => t.Projet)
                  .WithMany(p => p.TachesProjet)
                  .HasForeignKey(t => t.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- SituationPaiement ---
        builder.Entity<SituationPaiement>(entity =>
        {
            entity.HasOne(s => s.Projet)
                  .WithMany(p => p.Situations)
                  .HasForeignKey(s => s.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Avenant ---
        builder.Entity<Avenant>(entity =>
        {
            entity.HasOne(a => a.Projet)
                  .WithMany(p => p.Avenants)
                  .HasForeignKey(a => a.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Facture ---
        builder.Entity<Facture>(entity =>
        {
            entity.HasOne(f => f.Projet)
                  .WithMany(p => p.Factures)
                  .HasForeignKey(f => f.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.SituationPaiement)
                  .WithMany()
                  .HasForeignKey(f => f.SituationPaiementId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // --- Notification ---
        builder.Entity<Notification>(entity =>
        {
            entity.HasIndex(n => n.EstLue);
            entity.HasIndex(n => n.DateCreation);
        });
    }
}
