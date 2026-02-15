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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // --- Projet ---
        builder.Entity<Projet>(entity =>
        {
            entity.HasIndex(p => p.Code).IsUnique().HasFilter("[Code] IS NOT NULL");
            entity.HasIndex(p => p.Statut);
            entity.HasIndex(p => p.Type);

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

            entity.HasOne(t => t.Projet)
                  .WithMany(p => p.Taches)
                  .HasForeignKey(t => t.ProjetId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.AssigneA)
                  .WithMany(u => u.TachesAssignees)
                  .HasForeignKey(t => t.AssigneAId)
                  .OnDelete(DeleteBehavior.SetNull);
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
    }
}
