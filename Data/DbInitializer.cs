using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

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
            var existing = await userManager.FindByEmailAsync(u.Email);
            if (existing is not null)
            {
                // Fix existing seed users that were created before EstApprouve was added
                if (!existing.EstApprouve)
                {
                    existing.EstApprouve = true;
                    await userManager.UpdateAsync(existing);
                }
                continue;
            }

            var user = new ApplicationUser
            {
                UserName = u.Email,
                Email = u.Email,
                Nom = u.Nom,
                Prenom = u.Prenom,
                EmailConfirmed = true,
                EstActif = true,
                EstApprouve = true
            };

            var result = await userManager.CreateAsync(user, "Test1234!");
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
        var now = DateTime.UtcNow;
        var hasProjets = await context.Projets.AnyAsync();

        if (hasProjets)
        {
            // Existing DB — only seed data that's missing (devis, situations, rapports, etc.)
            await SeedMissingFinancialDataAsync(context, userManager, now);
            return;
        }

        var allUsers = await userManager.Users.ToListAsync();
        var gerant = allUsers.Find(u => u.Email == "gerant@test.com");
        var cogerant = allUsers.Find(u => u.Email == "cogerant@test.com");
        var directeur = allUsers.Find(u => u.Email == "directeur@test.com");
        var ingenieur = allUsers.Find(u => u.Email == "ingenieur@test.com");
        var secretaire = allUsers.Find(u => u.Email == "secretaire@test.com");

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
            // --- P1: Autoroute Est-Ouest (budget 12.5M) ---
            new() { Titre = "Étude géotechnique du sol", ProjetId = p1.Id, Priorite = Priorite.Haute, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-55), DateEcheance = now.AddDays(-40), DateFinReelle = now.AddDays(-38), Progression = 100, AssigneAId = ingenieur?.Id, MontantPrevu = 500_000m, MontantRealise = 480_000m },
            new() { Titre = "Terrassement phase 1 (km 0-15)", ProjetId = p1.Id, Priorite = Priorite.Urgente, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-35), DateEcheance = now.AddDays(10), Progression = 65, AssigneAId = directeur?.Id, MontantPrevu = 3_000_000m, MontantRealise = 1_950_000m },
            new() { Titre = "Pose des enrobés bitumineux", ProjetId = p1.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(11), DateEcheance = now.AddDays(60), Progression = 0, AssigneAId = ingenieur?.Id, MontantPrevu = 4_500_000m, MontantRealise = 0m },
            new() { Titre = "Signalisation et marquage routier", ProjetId = p1.Id, Priorite = Priorite.Basse, Statut = StatutTache.AFaire, DateDebut = now.AddDays(55), DateEcheance = now.AddDays(110), Progression = 0, MontantPrevu = 1_200_000m, MontantRealise = 0m },

            // --- P2: Pont Sidi M'Cid (budget 4.2M) ---
            new() { Titre = "Inspection structurelle du tablier", ProjetId = p2.Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-28), DateEcheance = now.AddDays(-18), DateFinReelle = now.AddDays(-17), Progression = 100, AssigneAId = directeur?.Id, MontantPrevu = 350_000m, MontantRealise = 340_000m },
            new() { Titre = "Remplacement câbles porteurs", ProjetId = p2.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-15), DateEcheance = now.AddDays(30), Progression = 40, AssigneAId = ingenieur?.Id, MontantPrevu = 1_800_000m, MontantRealise = 720_000m },
            new() { Titre = "Application peinture anti-corrosion", ProjetId = p2.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(25), DateEcheance = now.AddDays(80), Progression = 0, MontantPrevu = 900_000m, MontantRealise = 0m },

            // --- P3: Lycée El Harrach (budget 8M) ---
            new() { Titre = "Élaboration du cahier des charges", ProjetId = p3.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-5), DateEcheance = now.AddDays(20), Progression = 30, AssigneAId = cogerant?.Id, MontantPrevu = 200_000m, MontantRealise = 60_000m },
            new() { Titre = "Appel d'offres entreprises BTP", ProjetId = p3.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(21), DateEcheance = now.AddDays(50), Progression = 0, AssigneAId = secretaire?.Id, MontantPrevu = 50_000m, MontantRealise = 0m },
            new() { Titre = "Validation plans architecturaux", ProjetId = p3.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnRevue, DateDebut = now.AddDays(-3), DateEcheance = now.AddDays(15), Progression = 75, AssigneAId = gerant?.Id, MontantPrevu = 300_000m, MontantRealise = 225_000m },

            // --- P4: Station épuration (budget 6.8M) ---
            new() { Titre = "Installation bassins de décantation", ProjetId = p4.Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-80), DateEcheance = now.AddDays(-40), DateFinReelle = now.AddDays(-35), Progression = 100, AssigneAId = ingenieur?.Id, MontantPrevu = 2_500_000m, MontantRealise = 2_400_000m },
            new() { Titre = "Raccordement réseau collecteur", ProjetId = p4.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-30), DateEcheance = now.AddDays(-2), Progression = 85, AssigneAId = directeur?.Id, MontantPrevu = 1_800_000m, MontantRealise = 1_530_000m },
            new() { Titre = "Tests de conformité et mise en service", ProjetId = p4.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(1), DateEcheance = now.AddDays(25), Progression = 0, AssigneAId = gerant?.Id, MontantPrevu = 600_000m, MontantRealise = 0m },
        };

        context.Taches.AddRange(taches);
        await context.SaveChangesAsync();

        // --- Set task dependencies (Fin → Début chains) ---
        // P1: Étude → Terrassement → Enrobés → Signalisation
        taches[1].DependanceId = taches[0].Id;
        taches[2].DependanceId = taches[1].Id;
        taches[3].DependanceId = taches[2].Id;
        // P2: Inspection → Câbles → Peinture
        taches[5].DependanceId = taches[4].Id;
        taches[6].DependanceId = taches[5].Id;
        // P3: Cahier des charges → Appel d'offres
        taches[8].DependanceId = taches[7].Id;
        // P4: Bassins → Raccordement → Tests
        taches[11].DependanceId = taches[10].Id;
        taches[12].DependanceId = taches[11].Id;
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

        // ── Devis Lignes (lots) ──────────────────────────────
        var devisLignes = new List<DevisLigne>
        {
            // P1: Autoroute (HT total ≈ 10.5M, + TVA 19% → cohérent avec budget 12.5M)
            new() { ProjetId = p1.Id, Designation = "Lot 1 – Terrassements généraux", MontantHT = 3_200_000m, Ordre = 1 },
            new() { ProjetId = p1.Id, Designation = "Lot 2 – Chaussée et enrobés", MontantHT = 4_500_000m, Ordre = 2 },
            new() { ProjetId = p1.Id, Designation = "Lot 3 – Ouvrages d'art courants", MontantHT = 1_600_000m, Ordre = 3 },
            new() { ProjetId = p1.Id, Designation = "Lot 4 – Signalisation et sécurité", MontantHT = 1_200_000m, Ordre = 4 },

            // P2: Pont (HT total ≈ 3.5M → budget 4.2M)
            new() { ProjetId = p2.Id, Designation = "Lot 1 – Inspection et diagnostic", MontantHT = 400_000m, Ordre = 1 },
            new() { ProjetId = p2.Id, Designation = "Lot 2 – Remplacement câbles et haubans", MontantHT = 1_800_000m, Ordre = 2 },
            new() { ProjetId = p2.Id, Designation = "Lot 3 – Protection anti-corrosion", MontantHT = 900_000m, Ordre = 3 },
            new() { ProjetId = p2.Id, Designation = "Lot 4 – Essais et réception", MontantHT = 430_000m, Ordre = 4 },

            // P4: Station épuration (HT ≈ 5.7M → budget 6.8M)
            new() { ProjetId = p4.Id, Designation = "Lot 1 – Génie civil bassins", MontantHT = 2_500_000m, Ordre = 1 },
            new() { ProjetId = p4.Id, Designation = "Lot 2 – Équipements de filtration", MontantHT = 1_500_000m, Ordre = 2 },
            new() { ProjetId = p4.Id, Designation = "Lot 3 – Réseau collecteur", MontantHT = 1_200_000m, Ordre = 3 },
            new() { ProjetId = p4.Id, Designation = "Lot 4 – Mise en service et essais", MontantHT = 500_000m, Ordre = 4 },
        };
        context.DevisLignes.AddRange(devisLignes);

        // ── Situations de Paiement ───────────────────────────
        var situations = new List<SituationPaiement>
        {
            // P1: 2 situations validées (cumul ≈ 25% du HT)
            new() { ProjetId = p1.Id, Numero = 1, Date = now.AddDays(-45), MontantValide = 1_500_000m, PourcentageCumule = 14.3m },
            new() { ProjetId = p1.Id, Numero = 2, Date = now.AddDays(-15), MontantValide = 1_330_000m, PourcentageCumule = 26.9m },

            // P2: 1 situation
            new() { ProjetId = p2.Id, Numero = 1, Date = now.AddDays(-12), MontantValide = 950_000m, PourcentageCumule = 26.9m },

            // P4: 3 situations (project well advanced)
            new() { ProjetId = p4.Id, Numero = 1, Date = now.AddDays(-65), MontantValide = 1_800_000m, PourcentageCumule = 31.6m },
            new() { ProjetId = p4.Id, Numero = 2, Date = now.AddDays(-40), MontantValide = 1_600_000m, PourcentageCumule = 59.6m },
            new() { ProjetId = p4.Id, Numero = 3, Date = now.AddDays(-10), MontantValide = 1_350_000m, PourcentageCumule = 83.3m },
        };
        context.SituationsPaiement.AddRange(situations);
        await context.SaveChangesAsync();

        // ── Avenants ─────────────────────────────────────────
        var avenants = new List<Avenant>
        {
            // P1: un avenant en plus (travaux supplémentaires drainage)
            new() { ProjetId = p1.Id, Numero = 1, Motif = "Travaux supplémentaires de drainage latéral suite étude hydrogéologique", Montant = 800_000m, Date = now.AddDays(-20) },

            // P4: un avenant en retrait (optimisation pompage)
            new() { ProjetId = p4.Id, Numero = 1, Motif = "Optimisation du système de pompage – réduction des équipements prévus", Montant = -150_000m, Date = now.AddDays(-25) },
        };
        context.Avenants.AddRange(avenants);

        // ── Factures ─────────────────────────────────────────
        var factures = new List<Facture>
        {
            // P1: 2 factures liées aux situations
            new() { ProjetId = p1.Id, Numero = "FA-AEO-001", Date = now.AddDays(-43), Montant = 1_500_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[0].Id },
            new() { ProjetId = p1.Id, Numero = "FA-AEO-002", Date = now.AddDays(-13), Montant = 1_330_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[1].Id },

            // P2: 1 facture
            new() { ProjetId = p2.Id, Numero = "FA-PSM-001", Date = now.AddDays(-10), Montant = 950_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[2].Id },

            // P4: 3 factures
            new() { ProjetId = p4.Id, Numero = "FA-SEP-001", Date = now.AddDays(-63), Montant = 1_800_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[3].Id },
            new() { ProjetId = p4.Id, Numero = "FA-SEP-002", Date = now.AddDays(-38), Montant = 1_600_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[4].Id },
            new() { ProjetId = p4.Id, Numero = "FA-SEP-003", Date = now.AddDays(-8), Montant = 1_350_000m, Statut = StatutFacture.Elaboree, SituationPaiementId = situations[5].Id },
        };
        context.Factures.AddRange(factures);
        await context.SaveChangesAsync();

        // ── Rapports (with DonneesFormulaire JSON) ───────────
        var jsonOpts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        var rapports = new List<Rapport>
        {
            // Contrôle qualité – P1
            new()
            {
                Titre = "Contrôle qualité – Terrassement tronçon 3",
                Type = TypeRapport.Qualite,
                Statut = StatutRapport.Genere,
                ProjetId = p1.Id,
                GenereParId = directeur?.Id,
                DateGeneration = now.AddDays(-18),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = "Autoroute Est-Ouest Tronçon 3",
                    MaitreOuvrage = "Ministère des Travaux Publics",
                    LieuProjet = "Sétif - Bordj Bou Arréridj",
                    ObjetControle = "Vérification de la compacité des couches de fondation (km 0-8)",
                    DateControle = now.AddDays(-19).ToString("yyyy-MM-dd"),
                    Controleur = "Pierre Dubois – Directeur Technique",
                    Resultat = "Conforme – Compacité ≥ 95% Proctor modifié sur l'ensemble des sondages",
                    Observations = "Deux points de contrôle au km 5.2 présentent un taux d'humidité élevé. Surveillance renforcée recommandée.",
                    Actions = "Réaliser un contrôle complémentaire au km 5.2 après 7 jours de séchage."
                }, jsonOpts)
            },
            // Bordereau – P2
            new()
            {
                Titre = "Bordereau d'envoi – Plans de réhabilitation",
                Type = TypeRapport.Bordereau,
                Statut = StatutRapport.Genere,
                ProjetId = p2.Id,
                GenereParId = secretaire?.Id,
                DateGeneration = now.AddDays(-22),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = "Pont Sidi M'Cid - Réhabilitation",
                    MaitreOuvrage = "Wilaya de Constantine",
                    LieuProjet = "Constantine",
                    NumeroBordereau = "BE-PSM-2026-001",
                    DateBordereau = now.AddDays(-22).ToString("yyyy-MM-dd"),
                    Destinataire = "Bureau de contrôle technique – CTC Est",
                    ObjetBordereau = "Transmission des plans d'exécution pour remplacement des câbles porteurs",
                    PiecesJointes = "1. Plans d'exécution (15 planches A1)\n2. Note de calcul structure\n3. Planning prévisionnel d'intervention",
                    Observations = "Prière de retourner les plans visés dans un délai de 15 jours ouvrables."
                }, jsonOpts)
            },
            // Courrier – P3
            new()
            {
                Titre = "Courrier – Demande d'autorisation de construire",
                Type = TypeRapport.Courrier,
                Statut = StatutRapport.Genere,
                ProjetId = p3.Id,
                GenereParId = cogerant?.Id,
                DateGeneration = now.AddDays(-8),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = "Lycée Polyvalent El Harrach",
                    MaitreOuvrage = "Ministère de l'Éducation",
                    LieuProjet = "El Harrach, Alger",
                    RefCourrier = "CR-LPH-2026-003",
                    DateCourrier = now.AddDays(-8).ToString("yyyy-MM-dd"),
                    Destinataire = "Monsieur le Directeur de l'Urbanisme – Wilaya d'Alger",
                    Objet = "Demande de permis de construire pour le lycée polyvalent d'El Harrach",
                    Corps = "Monsieur le Directeur,\n\nDans le cadre du programme sectoriel d'équipement scolaire, nous avons l'honneur de solliciter la délivrance du permis de construire relatif au projet de construction d'un lycée polyvalent de 1 200 places, sis à El Harrach.\n\nLe dossier technique complet est joint au présent courrier conformément à la réglementation en vigueur.\n\nNous restons à votre disposition pour toute information complémentaire.",
                    PiecesJointes = "1. Plans architecturaux\n2. Étude de sol\n3. Certificat de conformité urbanistique"
                }, jsonOpts)
            },
            // Réception provisoire – P5 (terminé)
            new()
            {
                Titre = "Demande de réception provisoire – Réseau HT Blida",
                Type = TypeRapport.ReceptionProvisoire,
                Statut = StatutRapport.Genere,
                ProjetId = projets[4].Id,
                GenereParId = gerant?.Id,
                DateGeneration = now.AddDays(-14),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = "Réseau Électrique HT Blida",
                    MaitreOuvrage = "Sonelgaz",
                    LieuProjet = "Blida",
                    MontantMarche = "3500000",
                    DateDebut = projets[4].DateDebut.ToString("yyyy-MM-dd"),
                    DateFin = projets[4].DateFinReelle?.ToString("yyyy-MM-dd"),
                    DateDemande = now.AddDays(-14).ToString("yyyy-MM-dd"),
                    Entreprise = "IngeProjets SARL",
                    Observations = "Tous les essais de mise sous tension ont été réalisés avec succès. Les équipements sont opérationnels."
                }, jsonOpts)
            },
            // Rapport personnalisé – P4
            new()
            {
                Titre = "Note de suivi – Station épuration Oued Smar",
                Type = TypeRapport.Personnalise,
                Statut = StatutRapport.Genere,
                ProjetId = p4.Id,
                GenereParId = ingenieur?.Id,
                DateGeneration = now.AddDays(-5),
                Contenu = "Le projet de la station d'épuration d'Oued Smar connaît un retard de livraison de 5 jours dû aux intempéries survenues entre le 15 et le 20 du mois courant.\n\nÉtat d'avancement :\n• Bassins de décantation : 100% – réception effectuée\n• Raccordement collecteur : 85% – en cours de finalisation\n• Mise en service : prévue dans 25 jours\n\nLe raccordement au réseau collecteur principal est en voie d'achèvement. Les essais de conformité seront programmés dès la fin des travaux de raccordement.\n\nAction requise : demander une prolongation de délai de 10 jours au maître d'ouvrage.",
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    Contenu = (string?)null
                }, jsonOpts)
            },
            // Contrôle qualité – P4
            new()
            {
                Titre = "Contrôle qualité – Étanchéité bassins",
                Type = TypeRapport.Qualite,
                Statut = StatutRapport.Genere,
                ProjetId = p4.Id,
                GenereParId = directeur?.Id,
                DateGeneration = now.AddDays(-30),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = "Station d'épuration Oued Smar",
                    MaitreOuvrage = "ONA",
                    LieuProjet = "Oued Smar, Alger",
                    ObjetControle = "Test d'étanchéité des bassins de décantation n°1 et n°2",
                    DateControle = now.AddDays(-31).ToString("yyyy-MM-dd"),
                    Controleur = "Marie Laurent – Ingénieur",
                    Resultat = "Conforme – Aucune fuite détectée après 72h de mise en eau",
                    Observations = "Le bassin n°2 présente une micro-fissure superficielle en paroi nord. Sans incidence sur l'étanchéité mais à surveiller.",
                    Actions = "Appliquer un enduit de protection complémentaire sur la fissure du bassin n°2."
                }, jsonOpts)
            },
        };
        context.Rapports.AddRange(rapports);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds missing financial data (devis, situations, avenants, factures, rapports)
    /// for databases that already have projects from a previous seed run.
    /// </summary>
    private static async Task SeedMissingFinancialDataAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        DateTime now)
    {
        var allUsers = await userManager.Users.ToListAsync();
        var gerant = allUsers.Find(u => u.Email == "gerant@test.com");
        var cogerant = allUsers.Find(u => u.Email == "cogerant@test.com");
        var directeur = allUsers.Find(u => u.Email == "directeur@test.com");
        var ingenieur = allUsers.Find(u => u.Email == "ingenieur@test.com");
        var secretaire = allUsers.Find(u => u.Email == "secretaire@test.com");

        // Look up projects by code
        var p1 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "AEO-T3");
        var p2 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "PSM-RH");
        var p3 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "LPH-01");
        var p4 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "SEP-OS");
        var p5 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "RE-BL");

        // --- Seed task MontantPrevu/MontantRealise + DependanceId if missing ---
        if (p1 is not null)
        {
            var p1Taches = await context.Taches
                .Where(t => t.ProjetId == p1.Id && !t.EstArchive)
                .OrderBy(t => t.DateDebut ?? t.DateEcheance)
                .ToListAsync();

            if (p1Taches.Count > 0 && p1Taches[0].MontantPrevu == 0)
            {
                var montants = new[] { (500_000m, 480_000m), (3_000_000m, 1_950_000m), (4_500_000m, 0m), (1_200_000m, 0m) };
                for (int i = 0; i < Math.Min(p1Taches.Count, montants.Length); i++)
                {
                    p1Taches[i].MontantPrevu = montants[i].Item1;
                    p1Taches[i].MontantRealise = montants[i].Item2;
                }
                // Set dependencies
                if (p1Taches.Count >= 4)
                {
                    p1Taches[1].DependanceId = p1Taches[0].Id;
                    p1Taches[2].DependanceId = p1Taches[1].Id;
                    p1Taches[3].DependanceId = p1Taches[2].Id;
                }
                await context.SaveChangesAsync();
            }
        }

        if (p2 is not null)
        {
            var p2Taches = await context.Taches
                .Where(t => t.ProjetId == p2.Id && !t.EstArchive)
                .OrderBy(t => t.DateDebut ?? t.DateEcheance)
                .ToListAsync();

            if (p2Taches.Count > 0 && p2Taches[0].MontantPrevu == 0)
            {
                var montants = new[] { (350_000m, 340_000m), (1_800_000m, 720_000m), (900_000m, 0m) };
                for (int i = 0; i < Math.Min(p2Taches.Count, montants.Length); i++)
                {
                    p2Taches[i].MontantPrevu = montants[i].Item1;
                    p2Taches[i].MontantRealise = montants[i].Item2;
                }
                if (p2Taches.Count >= 3)
                {
                    p2Taches[1].DependanceId = p2Taches[0].Id;
                    p2Taches[2].DependanceId = p2Taches[1].Id;
                }
                await context.SaveChangesAsync();
            }
        }

        if (p3 is not null)
        {
            var p3Taches = await context.Taches
                .Where(t => t.ProjetId == p3.Id && !t.EstArchive)
                .OrderBy(t => t.DateDebut ?? t.DateEcheance)
                .ToListAsync();

            if (p3Taches.Count > 0 && p3Taches[0].MontantPrevu == 0)
            {
                var montants = new[] { (200_000m, 60_000m), (50_000m, 0m), (300_000m, 225_000m) };
                for (int i = 0; i < Math.Min(p3Taches.Count, montants.Length); i++)
                {
                    p3Taches[i].MontantPrevu = montants[i].Item1;
                    p3Taches[i].MontantRealise = montants[i].Item2;
                }
                if (p3Taches.Count >= 2)
                    p3Taches[1].DependanceId = p3Taches[0].Id;
                await context.SaveChangesAsync();
            }
        }

        if (p4 is not null)
        {
            var p4Taches = await context.Taches
                .Where(t => t.ProjetId == p4.Id && !t.EstArchive)
                .OrderBy(t => t.DateDebut ?? t.DateEcheance)
                .ToListAsync();

            if (p4Taches.Count > 0 && p4Taches[0].MontantPrevu == 0)
            {
                var montants = new[] { (2_500_000m, 2_400_000m), (1_800_000m, 1_530_000m), (600_000m, 0m) };
                for (int i = 0; i < Math.Min(p4Taches.Count, montants.Length); i++)
                {
                    p4Taches[i].MontantPrevu = montants[i].Item1;
                    p4Taches[i].MontantRealise = montants[i].Item2;
                }
                if (p4Taches.Count >= 3)
                {
                    p4Taches[1].DependanceId = p4Taches[0].Id;
                    p4Taches[2].DependanceId = p4Taches[1].Id;
                }
                await context.SaveChangesAsync();
            }
        }

        // --- Seed DevisLignes if missing ---
        if (!await context.DevisLignes.AnyAsync())
        {
            var devisLignes = new List<DevisLigne>();

            if (p1 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p1.Id, Designation = "Lot 1 – Terrassements généraux", MontantHT = 3_200_000m, Ordre = 1 },
                    new() { ProjetId = p1.Id, Designation = "Lot 2 – Chaussée et enrobés", MontantHT = 4_500_000m, Ordre = 2 },
                    new() { ProjetId = p1.Id, Designation = "Lot 3 – Ouvrages d'art courants", MontantHT = 1_600_000m, Ordre = 3 },
                    new() { ProjetId = p1.Id, Designation = "Lot 4 – Signalisation et sécurité", MontantHT = 1_200_000m, Ordre = 4 },
                ]);
            }
            if (p2 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p2.Id, Designation = "Lot 1 – Inspection et diagnostic", MontantHT = 400_000m, Ordre = 1 },
                    new() { ProjetId = p2.Id, Designation = "Lot 2 – Remplacement câbles et haubans", MontantHT = 1_800_000m, Ordre = 2 },
                    new() { ProjetId = p2.Id, Designation = "Lot 3 – Protection anti-corrosion", MontantHT = 900_000m, Ordre = 3 },
                    new() { ProjetId = p2.Id, Designation = "Lot 4 – Essais et réception", MontantHT = 430_000m, Ordre = 4 },
                ]);
            }
            if (p4 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p4.Id, Designation = "Lot 1 – Génie civil bassins", MontantHT = 2_500_000m, Ordre = 1 },
                    new() { ProjetId = p4.Id, Designation = "Lot 2 – Équipements de filtration", MontantHT = 1_500_000m, Ordre = 2 },
                    new() { ProjetId = p4.Id, Designation = "Lot 3 – Réseau collecteur", MontantHT = 1_200_000m, Ordre = 3 },
                    new() { ProjetId = p4.Id, Designation = "Lot 4 – Mise en service et essais", MontantHT = 500_000m, Ordre = 4 },
                ]);
            }

            if (devisLignes.Count > 0)
            {
                context.DevisLignes.AddRange(devisLignes);
                await context.SaveChangesAsync();
            }
        }

        // --- Seed SituationsPaiement if missing ---
        if (!await context.SituationsPaiement.AnyAsync())
        {
            var situations = new List<SituationPaiement>();

            if (p1 is not null)
            {
                situations.AddRange([
                    new() { ProjetId = p1.Id, Numero = 1, Date = now.AddDays(-45), MontantValide = 1_500_000m, PourcentageCumule = 14.3m },
                    new() { ProjetId = p1.Id, Numero = 2, Date = now.AddDays(-15), MontantValide = 1_330_000m, PourcentageCumule = 26.9m },
                ]);
            }
            if (p2 is not null)
            {
                situations.Add(new() { ProjetId = p2.Id, Numero = 1, Date = now.AddDays(-12), MontantValide = 950_000m, PourcentageCumule = 26.9m });
            }
            if (p4 is not null)
            {
                situations.AddRange([
                    new() { ProjetId = p4.Id, Numero = 1, Date = now.AddDays(-65), MontantValide = 1_800_000m, PourcentageCumule = 31.6m },
                    new() { ProjetId = p4.Id, Numero = 2, Date = now.AddDays(-40), MontantValide = 1_600_000m, PourcentageCumule = 59.6m },
                    new() { ProjetId = p4.Id, Numero = 3, Date = now.AddDays(-10), MontantValide = 1_350_000m, PourcentageCumule = 83.3m },
                ]);
            }

            if (situations.Count > 0)
            {
                context.SituationsPaiement.AddRange(situations);
                await context.SaveChangesAsync();
            }

            // --- Seed Avenants if missing ---
            if (!await context.Avenants.AnyAsync())
            {
                var avenants = new List<Avenant>();
                if (p1 is not null)
                    avenants.Add(new() { ProjetId = p1.Id, Numero = 1, Motif = "Travaux supplémentaires de drainage latéral suite étude hydrogéologique", Montant = 800_000m, Date = now.AddDays(-20) });
                if (p4 is not null)
                    avenants.Add(new() { ProjetId = p4.Id, Numero = 1, Motif = "Optimisation du système de pompage – réduction des équipements prévus", Montant = -150_000m, Date = now.AddDays(-25) });

                if (avenants.Count > 0)
                {
                    context.Avenants.AddRange(avenants);
                    await context.SaveChangesAsync();
                }
            }

            // --- Seed Factures if missing ---
            if (!await context.Factures.AnyAsync() && situations.Count > 0)
            {
                var factures = new List<Facture>();

                if (p1 is not null && situations.Count >= 2)
                {
                    factures.AddRange([
                        new() { ProjetId = p1.Id, Numero = "FA-AEO-001", Date = now.AddDays(-43), Montant = 1_500_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[0].Id },
                        new() { ProjetId = p1.Id, Numero = "FA-AEO-002", Date = now.AddDays(-13), Montant = 1_330_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[1].Id },
                    ]);
                }
                if (p2 is not null && situations.Count >= 3)
                {
                    factures.Add(new() { ProjetId = p2.Id, Numero = "FA-PSM-001", Date = now.AddDays(-10), Montant = 950_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[2].Id });
                }
                if (p4 is not null && situations.Count >= 6)
                {
                    factures.AddRange([
                        new() { ProjetId = p4.Id, Numero = "FA-SEP-001", Date = now.AddDays(-63), Montant = 1_800_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[3].Id },
                        new() { ProjetId = p4.Id, Numero = "FA-SEP-002", Date = now.AddDays(-38), Montant = 1_600_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[4].Id },
                        new() { ProjetId = p4.Id, Numero = "FA-SEP-003", Date = now.AddDays(-8), Montant = 1_350_000m, Statut = StatutFacture.Elaboree, SituationPaiementId = situations[5].Id },
                    ]);
                }

                if (factures.Count > 0)
                {
                    context.Factures.AddRange(factures);
                    await context.SaveChangesAsync();
                }
            }
        }

        // --- Seed Rapports if missing ---
        if (!await context.Rapports.AnyAsync())
        {
            var jsonOpts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var rapports = new List<Rapport>();

            if (p1 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Contrôle qualité – Terrassement tronçon 3",
                    Type = TypeRapport.Qualite,
                    Statut = StatutRapport.Genere,
                    ProjetId = p1.Id,
                    GenereParId = directeur?.Id,
                    DateGeneration = now.AddDays(-18),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p1.Nom,
                        MaitreOuvrage = p1.MaitreOuvrage,
                        LieuProjet = p1.Localisation,
                        ObjetControle = "Vérification de la compacité des couches de fondation (km 0-8)",
                        DateControle = now.AddDays(-19).ToString("yyyy-MM-dd"),
                        Controleur = "Pierre Dubois – Directeur Technique",
                        Resultat = "Conforme – Compacité ≥ 95% Proctor modifié sur l'ensemble des sondages",
                        Observations = "Deux points de contrôle au km 5.2 présentent un taux d'humidité élevé. Surveillance renforcée recommandée.",
                        Actions = "Réaliser un contrôle complémentaire au km 5.2 après 7 jours de séchage."
                    }, jsonOpts)
                });
            }

            if (p2 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Bordereau d'envoi – Plans de réhabilitation",
                    Type = TypeRapport.Bordereau,
                    Statut = StatutRapport.Genere,
                    ProjetId = p2.Id,
                    GenereParId = secretaire?.Id,
                    DateGeneration = now.AddDays(-22),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p2.Nom,
                        MaitreOuvrage = p2.MaitreOuvrage,
                        LieuProjet = p2.Localisation,
                        NumeroBordereau = "BE-PSM-2026-001",
                        DateBordereau = now.AddDays(-22).ToString("yyyy-MM-dd"),
                        Destinataire = "Bureau de contrôle technique – CTC Est",
                        ObjetBordereau = "Transmission des plans d'exécution pour remplacement des câbles porteurs",
                        PiecesJointes = "1. Plans d'exécution (15 planches A1)\n2. Note de calcul structure\n3. Planning prévisionnel d'intervention",
                        Observations = "Prière de retourner les plans visés dans un délai de 15 jours ouvrables."
                    }, jsonOpts)
                });
            }

            if (p3 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Courrier – Demande d'autorisation de construire",
                    Type = TypeRapport.Courrier,
                    Statut = StatutRapport.Genere,
                    ProjetId = p3.Id,
                    GenereParId = cogerant?.Id,
                    DateGeneration = now.AddDays(-8),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p3.Nom,
                        MaitreOuvrage = p3.MaitreOuvrage,
                        LieuProjet = p3.Localisation,
                        RefCourrier = "CR-LPH-2026-003",
                        DateCourrier = now.AddDays(-8).ToString("yyyy-MM-dd"),
                        Destinataire = "Monsieur le Directeur de l'Urbanisme – Wilaya d'Alger",
                        Objet = "Demande de permis de construire pour le lycée polyvalent d'El Harrach",
                        Corps = "Monsieur le Directeur,\n\nDans le cadre du programme sectoriel d'équipement scolaire, nous avons l'honneur de solliciter la délivrance du permis de construire relatif au projet de construction d'un lycée polyvalent de 1 200 places, sis à El Harrach.\n\nLe dossier technique complet est joint au présent courrier conformément à la réglementation en vigueur.\n\nNous restons à votre disposition pour toute information complémentaire.",
                        PiecesJointes = "1. Plans architecturaux\n2. Étude de sol\n3. Certificat de conformité urbanistique"
                    }, jsonOpts)
                });
            }

            if (p5 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Demande de réception provisoire – Réseau HT Blida",
                    Type = TypeRapport.ReceptionProvisoire,
                    Statut = StatutRapport.Genere,
                    ProjetId = p5.Id,
                    GenereParId = gerant?.Id,
                    DateGeneration = now.AddDays(-14),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p5.Nom,
                        MaitreOuvrage = p5.MaitreOuvrage,
                        LieuProjet = p5.Localisation,
                        MontantMarche = p5.BudgetAlloue.ToString("F0"),
                        DateDebut = p5.DateDebut.ToString("yyyy-MM-dd"),
                        DateFin = p5.DateFinReelle?.ToString("yyyy-MM-dd"),
                        DateDemande = now.AddDays(-14).ToString("yyyy-MM-dd"),
                        Entreprise = "IngeProjets SARL",
                        Observations = "Tous les essais de mise sous tension ont été réalisés avec succès. Les équipements sont opérationnels."
                    }, jsonOpts)
                });
            }

            if (p4 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Note de suivi – Station épuration Oued Smar",
                    Type = TypeRapport.Personnalise,
                    Statut = StatutRapport.Genere,
                    ProjetId = p4.Id,
                    GenereParId = ingenieur?.Id,
                    DateGeneration = now.AddDays(-5),
                    Contenu = "Le projet de la station d'épuration d'Oued Smar connaît un retard de livraison de 5 jours dû aux intempéries survenues entre le 15 et le 20 du mois courant.\n\nÉtat d'avancement :\n• Bassins de décantation : 100% – réception effectuée\n• Raccordement collecteur : 85% – en cours de finalisation\n• Mise en service : prévue dans 25 jours\n\nLe raccordement au réseau collecteur principal est en voie d'achèvement. Les essais de conformité seront programmés dès la fin des travaux de raccordement.\n\nAction requise : demander une prolongation de délai de 10 jours au maître d'ouvrage.",
                    DonneesFormulaire = JsonSerializer.Serialize(new { Contenu = (string?)null }, jsonOpts)
                });

                rapports.Add(new()
                {
                    Titre = "Contrôle qualité – Étanchéité bassins",
                    Type = TypeRapport.Qualite,
                    Statut = StatutRapport.Genere,
                    ProjetId = p4.Id,
                    GenereParId = directeur?.Id,
                    DateGeneration = now.AddDays(-30),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p4.Nom,
                        MaitreOuvrage = p4.MaitreOuvrage,
                        LieuProjet = p4.Localisation,
                        ObjetControle = "Test d'étanchéité des bassins de décantation n°1 et n°2",
                        DateControle = now.AddDays(-31).ToString("yyyy-MM-dd"),
                        Controleur = "Marie Laurent – Ingénieur",
                        Resultat = "Conforme – Aucune fuite détectée après 72h de mise en eau",
                        Observations = "Le bassin n°2 présente une micro-fissure superficielle en paroi nord. Sans incidence sur l'étanchéité mais à surveiller.",
                        Actions = "Appliquer un enduit de protection complémentaire sur la fissure du bassin n°2."
                    }, jsonOpts)
                });
            }

            if (rapports.Count > 0)
            {
                context.Rapports.AddRange(rapports);
                await context.SaveChangesAsync();
            }
        }
    }
}
