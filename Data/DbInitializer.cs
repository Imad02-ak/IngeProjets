using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IngeProjets.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DbInitializer));

        try
        {
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database migration failed");
            throw;
        }

        // --- Création des rôles ---
        string[] roles = ["Gerant", "CoGerant", "DirecteurTechnique", "Ingenieur", "Secretaire"];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                if (!result.Succeeded)
                {
                    logger.LogWarning("Failed to create role {Role}: {Errors}", role,
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }

        // --- Création des utilisateurs par défaut ---
        var defaultUsers = new[]
        {
            new { Email = "gerant@test.com",      Nom = "AKKO",     Prenom = "Imad",    Role = "Gerant" },
            new { Email = "cogerant@test.com",     Nom = "Martin",   Prenom = "Sarah",   Role = "CoGerant" },
            new { Email = "directeur@test.com",    Nom = "Dubois",   Prenom = "Pierre",  Role = "DirecteurTechnique" },
            new { Email = "ingenieur@test.com",    Nom = "Laurent",  Prenom = "Marie",   Role = "Ingenieur" },
            new { Email = "secretaire@test.com",   Nom = "Bernard",  Prenom = "Julie",   Role = "Secretaire" },
        };

        foreach (var u in defaultUsers)
        {
            if (await userManager.FindByEmailAsync(u.Email) is not null)
                continue;

            var user = new ApplicationUser
            {
                UserName = u.Email,
                Email = u.Email,
                Nom = u.Nom,
                Prenom = u.Prenom,
                EmailConfirmed = true,
                EstActif = true
            };

            var result = await userManager.CreateAsync(user, "Test1234");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, u.Role);
            }
            else
            {
                logger.LogWarning("Failed to create user {Email}: {Errors}", u.Email,
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        // --- Seed des projets, tâches et transactions ---
        if (await context.Projets.AnyAsync())
            return;

        var allUsers = await userManager.Users.ToListAsync();
        var gerant = allUsers.Find(u => u.Email == "gerant@test.com");
        var cogerant = allUsers.Find(u => u.Email == "cogerant@test.com");
        var directeur = allUsers.Find(u => u.Email == "directeur@test.com");
        var ingenieur = allUsers.Find(u => u.Email == "ingenieur@test.com");
        var secretaire = allUsers.Find(u => u.Email == "secretaire@test.com");

        var now = DateTime.UtcNow;

        var projets = new List<Projet>
        {
            new()
            {
                Nom = "Autoroute Est-Ouest Tronçon 3",
                Code = "AEO-T3",
                Description = "Construction du tronçon 3 de l'autoroute, 45 km de chaussée.",
                Type = TypeProjet.Route,
                Priorite = Priorite.Urgente,
                Statut = StatutProjet.EnCours,
                DateDebut = now.AddDays(-60),
                DateFinPrevue = now.AddDays(120),
                BudgetAlloue = 12_500_000m,
                Localisation = "Sétif - Bordj Bou Arréridj",
                MaitreOuvrage = "Ministère des Travaux Publics",
                ChefProjetId = gerant?.Id,
                Avancement = 35,
                DateCreation = now.AddDays(-65)
            },
            new()
            {
                Nom = "Pont Sidi M'Cid - Réhabilitation",
                Code = "PSM-RH",
                Description = "Réhabilitation et renforcement du pont Sidi M'Cid.",
                Type = TypeProjet.Pont,
                Priorite = Priorite.Haute,
                Statut = StatutProjet.EnCours,
                DateDebut = now.AddDays(-30),
                DateFinPrevue = now.AddDays(90),
                BudgetAlloue = 4_200_000m,
                Localisation = "Constantine",
                MaitreOuvrage = "Wilaya de Constantine",
                ChefProjetId = directeur?.Id,
                Avancement = 20,
                DateCreation = now.AddDays(-35)
            },
            new()
            {
                Nom = "Lycée Polyvalent El Harrach",
                Code = "LPH-01",
                Description = "Construction d'un lycée polyvalent de 1200 places.",
                Type = TypeProjet.Batiment,
                Priorite = Priorite.Moyenne,
                Statut = StatutProjet.EnPlanification,
                DateDebut = now.AddDays(15),
                DateFinPrevue = now.AddDays(300),
                BudgetAlloue = 8_000_000m,
                Localisation = "El Harrach, Alger",
                MaitreOuvrage = "Ministère de l'Éducation",
                ChefProjetId = cogerant?.Id,
                Avancement = 0,
                DateCreation = now.AddDays(-10)
            },
            new()
            {
                Nom = "Station d'épuration Oued Smar",
                Code = "SEP-OS",
                Description = "Station d'épuration des eaux usées pour 50 000 habitants.",
                Type = TypeProjet.Assainissement,
                Priorite = Priorite.Haute,
                Statut = StatutProjet.EnRetard,
                DateDebut = now.AddDays(-90),
                DateFinPrevue = now.AddDays(-5),
                BudgetAlloue = 6_800_000m,
                Localisation = "Oued Smar, Alger",
                MaitreOuvrage = "ONA",
                ChefProjetId = ingenieur?.Id,
                Avancement = 70,
                DateCreation = now.AddDays(-95)
            },
            new()
            {
                Nom = "Réseau Électrique HT Blida",
                Code = "RE-BL",
                Description = "Extension du réseau électrique haute tension zone industrielle.",
                Type = TypeProjet.Energie,
                Priorite = Priorite.Basse,
                Statut = StatutProjet.Termine,
                DateDebut = now.AddDays(-180),
                DateFinPrevue = now.AddDays(-20),
                DateFinReelle = now.AddDays(-15),
                BudgetAlloue = 3_500_000m,
                Localisation = "Blida",
                MaitreOuvrage = "Sonelgaz",
                ChefProjetId = directeur?.Id,
                Avancement = 100,
                DateCreation = now.AddDays(-185)
            }
        };

        context.Projets.AddRange(projets);
        await context.SaveChangesAsync();

        var p1 = projets[0];
        var p2 = projets[1];
        var p3 = projets[2];
        var p4 = projets[3];

        var taches = new List<Tache>
        {
            new() { Titre = "Étude géotechnique du sol", ProjetId = p1.Id, Priorite = Priorite.Haute, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-55), DateEcheance = now.AddDays(-40), DateFinReelle = now.AddDays(-38), Progression = 100, AssigneAId = ingenieur?.Id },
            new() { Titre = "Terrassement phase 1 (km 0-15)", ProjetId = p1.Id, Priorite = Priorite.Urgente, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-35), DateEcheance = now.AddDays(10), Progression = 65, AssigneAId = directeur?.Id },
            new() { Titre = "Pose des enrobés bitumineux", ProjetId = p1.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(11), DateEcheance = now.AddDays(60), Progression = 0, AssigneAId = ingenieur?.Id },
            new() { Titre = "Signalisation et marquage routier", ProjetId = p1.Id, Priorite = Priorite.Basse, Statut = StatutTache.AFaire, DateDebut = now.AddDays(55), DateEcheance = now.AddDays(110), Progression = 0 },

            new() { Titre = "Inspection structurelle du tablier", ProjetId = p2.Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-28), DateEcheance = now.AddDays(-18), DateFinReelle = now.AddDays(-17), Progression = 100, AssigneAId = directeur?.Id },
            new() { Titre = "Remplacement câbles porteurs", ProjetId = p2.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-15), DateEcheance = now.AddDays(30), Progression = 40, AssigneAId = ingenieur?.Id },
            new() { Titre = "Application peinture anti-corrosion", ProjetId = p2.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(25), DateEcheance = now.AddDays(80), Progression = 0 },

            new() { Titre = "Élaboration du cahier des charges", ProjetId = p3.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-5), DateEcheance = now.AddDays(20), Progression = 30, AssigneAId = cogerant?.Id },
            new() { Titre = "Appel d'offres entreprises BTP", ProjetId = p3.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(21), DateEcheance = now.AddDays(50), Progression = 0, AssigneAId = secretaire?.Id },
            new() { Titre = "Validation plans architecturaux", ProjetId = p3.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnRevue, DateDebut = now.AddDays(-3), DateEcheance = now.AddDays(15), Progression = 75, AssigneAId = gerant?.Id },

            new() { Titre = "Installation bassins de décantation", ProjetId = p4.Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-80), DateEcheance = now.AddDays(-40), DateFinReelle = now.AddDays(-35), Progression = 100, AssigneAId = ingenieur?.Id },
            new() { Titre = "Raccordement réseau collecteur", ProjetId = p4.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-30), DateEcheance = now.AddDays(-2), Progression = 85, AssigneAId = directeur?.Id },
            new() { Titre = "Tests de conformité et mise en service", ProjetId = p4.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(1), DateEcheance = now.AddDays(25), Progression = 0, AssigneAId = gerant?.Id },
        };

        context.Taches.AddRange(taches);
        await context.SaveChangesAsync();

        var transactions = new List<TransactionBudget>
        {
            new() { Libelle = "Achat granulats et ciment", Montant = 1_200_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-50), ProjetId = p1.Id, CreePar = gerant?.Email },
            new() { Libelle = "Location engins terrassement", Montant = 800_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Equipements, Date = now.AddDays(-40), ProjetId = p1.Id, CreePar = gerant?.Email },
            new() { Libelle = "Main d'œuvre terrassement Q1", Montant = 650_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-30), ProjetId = p1.Id, CreePar = gerant?.Email },
            new() { Libelle = "Sous-traitance topographie", Montant = 180_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.SousTraitance, Date = now.AddDays(-25), ProjetId = p1.Id, CreePar = directeur?.Email },

            new() { Libelle = "Câbles acier haute résistance", Montant = 450_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-20), ProjetId = p2.Id, CreePar = directeur?.Email },
            new() { Libelle = "Échafaudages et nacelles", Montant = 120_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Equipements, Date = now.AddDays(-15), ProjetId = p2.Id, CreePar = directeur?.Email },
            new() { Libelle = "Équipe spécialisée ponts", Montant = 380_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-10), ProjetId = p2.Id, CreePar = ingenieur?.Email },

            new() { Libelle = "Cuves et bassins en béton", Montant = 2_100_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-70), ProjetId = p4.Id, CreePar = ingenieur?.Email },
            new() { Libelle = "Pompes et équipements filtration", Montant = 1_500_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Equipements, Date = now.AddDays(-50), ProjetId = p4.Id, CreePar = ingenieur?.Email },
            new() { Libelle = "Main d'œuvre installation", Montant = 900_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-35), ProjetId = p4.Id, CreePar = directeur?.Email },
            new() { Libelle = "Transport matériel lourd", Montant = 250_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Transport, Date = now.AddDays(-60), ProjetId = p4.Id, CreePar = gerant?.Email },

            new() { Libelle = "Câbles HT et transformateurs", Montant = 1_800_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-150), ProjetId = projets[4].Id, CreePar = directeur?.Email },
            new() { Libelle = "Sous-traitance pose pylônes", Montant = 700_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.SousTraitance, Date = now.AddDays(-120), ProjetId = projets[4].Id, CreePar = directeur?.Email },
            new() { Libelle = "Main d'œuvre électriciens", Montant = 500_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-90), ProjetId = projets[4].Id, CreePar = ingenieur?.Email },
        };

        context.TransactionsBudget.AddRange(transactions);
        await context.SaveChangesAsync();
    }
}
