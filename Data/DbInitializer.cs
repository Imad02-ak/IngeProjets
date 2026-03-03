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
            new { Email = "gerant@test.com",      Nom = "AKKOUCHE",  Prenom = "Imad",    Role = "Gerant" },
            new { Email = "cogerant@test.com",     Nom = "BENALI",    Prenom = "Yasmine", Role = "CoGerant" },
            new { Email = "directeur@test.com",    Nom = "RAHMANI",   Prenom = "Meriem",  Role = "DirecteurTechnique" },
            new { Email = "ingenieur@test.com",    Nom = "KHELIFI",   Prenom = "Amine",   Role = "Ingenieur" },
            new { Email = "secretaire@test.com",   Nom = "BOUZID",    Prenom = "Nadia",   Role = "Secretaire" },
        };

        foreach (var u in defaultUsers)
        {
            var existing = await userManager.FindByEmailAsync(u.Email);
            if (existing is not null)
            {
                if (!existing.EstApprouve || existing.Nom != u.Nom || existing.Prenom != u.Prenom)
                {
                    existing.EstApprouve = true;
                    existing.Nom = u.Nom;
                    existing.Prenom = u.Prenom;
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
            await SeedMissingFinancialDataAsync(context, userManager, now);
            return;
        }

        var allUsers = await userManager.Users.ToListAsync();
        var gerant = allUsers.Find(u => u.Email == "gerant@test.com");
        var cogerant = allUsers.Find(u => u.Email == "cogerant@test.com");
        var directeur = allUsers.Find(u => u.Email == "directeur@test.com");
        var ingenieur = allUsers.Find(u => u.Email == "ingenieur@test.com");
        var secretaire = allUsers.Find(u => u.Email == "secretaire@test.com");

        // ══════════════════════════════════════════════════════
        // PROJETS
        // ══════════════════════════════════════════════════════
        var projets = new List<Projet>
        {
            // P1 – Route nationale – En cours, priorité urgente
            new()
            {
                Nom = "RN12 – Dédoublement Tizi-Ouzou / Azazga",
                Code = "RN12-TO",
                Description = "Dédoublement de la route nationale n°12 sur 28 km entre Tizi-Ouzou et Azazga, incluant la réalisation de 3 ouvrages d'art et la mise en place du système d'éclairage public.",
                Type = TypeProjet.Route,
                Priorite = Priorite.Urgente,
                Statut = StatutProjet.EnCours,
                DateDebut = now.AddDays(-75),
                DateFinPrevue = now.AddDays(180),
                BudgetAlloue = 18_500_000m,
                NombrePropositionsPrix = 6,
                Localisation = "Tizi-Ouzou",
                MaitreOuvrage = "Direction des Travaux Publics – Wilaya de Tizi-Ouzou",
                MaitreOeuvre = "BET INFRATECH",
                ChefProjetId = gerant?.Id,
                Avancement = 30,
                DateCreation = now.AddDays(-80)
            },
            // P2 – Pont / Viaduc – En cours, haute priorité
            new()
            {
                Nom = "Viaduc de Oued El-Harrach – Réhabilitation",
                Code = "VOH-RH",
                Description = "Réhabilitation structurelle du viaduc de Oued El-Harrach : renforcement des piles, remplacement des joints de dilatation, réfection de l'étanchéité du tablier et mise aux normes parasismiques.",
                Type = TypeProjet.Pont,
                Priorite = Priorite.Haute,
                Statut = StatutProjet.EnCours,
                DateDebut = now.AddDays(-40),
                DateFinPrevue = now.AddDays(100),
                BudgetAlloue = 7_200_000m,
                NombrePropositionsPrix = 4,
                Localisation = "El Harrach, Alger",
                MaitreOuvrage = "Wilaya d'Alger – Direction de l'Urbanisme",
                MaitreOeuvre = "SAETI",
                ChefProjetId = directeur?.Id,
                Avancement = 25,
                DateCreation = now.AddDays(-45)
            },
            // P3 – Bâtiment public – En planification
            new()
            {
                Nom = "Centre Hospitalo-Universitaire de Béjaïa – Extension",
                Code = "CHU-BJ",
                Description = "Extension du CHU de Béjaïa : construction d'un nouveau bloc opératoire de 6 salles, d'un service de réanimation de 24 lits et d'un parking souterrain de 200 places.",
                Type = TypeProjet.Batiment,
                Priorite = Priorite.Haute,
                Statut = StatutProjet.EnPlanification,
                DateDebut = now.AddDays(20),
                DateFinPrevue = now.AddDays(420),
                BudgetAlloue = 25_000_000m,
                NombrePropositionsPrix = 8,
                Localisation = "Béjaïa",
                MaitreOuvrage = "Ministère de la Santé",
                MaitreOeuvre = "Groupement BET Santé / BEREG",
                ChefProjetId = cogerant?.Id,
                Avancement = 0,
                DateCreation = now.AddDays(-15)
            },
            // P4 – Assainissement – En retard
            new()
            {
                Nom = "Station d'Épuration – Reghaia",
                Code = "STEP-RG",
                Description = "Réalisation d'une station d'épuration des eaux usées d'une capacité de 80 000 équivalents-habitants, comprenant le prétraitement, le traitement biologique par boues activées et le traitement tertiaire.",
                Type = TypeProjet.Assainissement,
                Priorite = Priorite.Haute,
                Statut = StatutProjet.EnRetard,
                DateDebut = now.AddDays(-120),
                DateFinPrevue = now.AddDays(-10),
                BudgetAlloue = 14_500_000m,
                NombrePropositionsPrix = 5,
                Localisation = "Reghaia, Alger",
                MaitreOuvrage = "Office National de l'Assainissement (ONA)",
                MaitreOeuvre = "SEAAL",
                ChefProjetId = ingenieur?.Id,
                Avancement = 72,
                DateCreation = now.AddDays(-130)
            },
            // P5 – Énergie – Terminé
            new()
            {
                Nom = "Poste Électrique 220/60 kV – Bouira",
                Code = "PE-BO",
                Description = "Construction d'un poste de transformation électrique 220/60 kV pour l'alimentation de la zone industrielle de Bouira, incluant 2 transformateurs de 100 MVA et les lignes de raccordement.",
                Type = TypeProjet.Energie,
                Priorite = Priorite.Moyenne,
                Statut = StatutProjet.Termine,
                DateDebut = now.AddDays(-210),
                DateFinPrevue = now.AddDays(-25),
                DateFinReelle = now.AddDays(-18),
                BudgetAlloue = 9_800_000m,
                NombrePropositionsPrix = 3,
                Localisation = "Bouira",
                MaitreOuvrage = "Société Algérienne de Gestion du Réseau de Transport de l'Électricité (GRTE)",
                MaitreOeuvre = "Sonelgaz – Filiale KAHRAKIB",
                ChefProjetId = directeur?.Id,
                Avancement = 100,
                DateCreation = now.AddDays(-220)
            }
        };

        context.Projets.AddRange(projets);
        await context.SaveChangesAsync();

        var p1 = projets[0];
        var p2 = projets[1];
        var p3 = projets[2];
        var p4 = projets[3];

        // ══════════════════════════════════════════════════════
        // TÂCHES
        // ══════════════════════════════════════════════════════
        var taches = new List<Tache>
        {
            // ── P1 : RN12 Dédoublement (budget 18.5M) ──────
            new() { Titre = "Levé topographique et étude géotechnique", ProjetId = p1.Id, Priorite = Priorite.Haute, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-70), DateEcheance = now.AddDays(-50), DateFinReelle = now.AddDays(-48), Progression = 100, AssigneAId = ingenieur?.Id, Phase = "Études", MontantPrevu = 850_000m, MontantRealise = 820_000m },
            new() { Titre = "Terrassement et décapage – PK 0+000 à PK 12+000", ProjetId = p1.Id, Priorite = Priorite.Urgente, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-45), DateEcheance = now.AddDays(15), Progression = 60, AssigneAId = directeur?.Id, Phase = "Travaux", MontantPrevu = 4_200_000m, MontantRealise = 2_520_000m },
            new() { Titre = "Réalisation des ouvrages d'art (3 ponts-dalles)", ProjetId = p1.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-30), DateEcheance = now.AddDays(60), Progression = 20, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 3_500_000m, MontantRealise = 700_000m },
            new() { Titre = "Corps de chaussée et couche de roulement", ProjetId = p1.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(16), DateEcheance = now.AddDays(100), Progression = 0, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 5_800_000m, MontantRealise = 0m },
            new() { Titre = "Signalisation horizontale, verticale et éclairage", ProjetId = p1.Id, Priorite = Priorite.Basse, Statut = StatutTache.AFaire, DateDebut = now.AddDays(95), DateEcheance = now.AddDays(170), Progression = 0, Phase = "Finitions", MontantPrevu = 1_800_000m, MontantRealise = 0m },

            // ── P2 : Viaduc El-Harrach (budget 7.2M) ────────
            new() { Titre = "Diagnostic structurel et relevé de fissuration", ProjetId = p2.Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-38), DateEcheance = now.AddDays(-25), DateFinReelle = now.AddDays(-24), Progression = 100, AssigneAId = directeur?.Id, Phase = "Études", MontantPrevu = 600_000m, MontantRealise = 580_000m },
            new() { Titre = "Renforcement des piles par chemisage béton armé", ProjetId = p2.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-20), DateEcheance = now.AddDays(35), Progression = 35, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 2_800_000m, MontantRealise = 980_000m },
            new() { Titre = "Remplacement des joints de dilatation", ProjetId = p2.Id, Priorite = Priorite.Haute, Statut = StatutTache.AFaire, DateDebut = now.AddDays(30), DateEcheance = now.AddDays(65), Progression = 0, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 1_500_000m, MontantRealise = 0m },
            new() { Titre = "Étanchéité du tablier et essais de charge", ProjetId = p2.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(60), DateEcheance = now.AddDays(95), Progression = 0, Phase = "Réception", MontantPrevu = 1_100_000m, MontantRealise = 0m },

            // ── P3 : CHU Béjaïa (budget 25M) ────────────────
            new() { Titre = "Élaboration du programme technique détaillé", ProjetId = p3.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-10), DateEcheance = now.AddDays(25), Progression = 40, AssigneAId = cogerant?.Id, Phase = "Études", MontantPrevu = 600_000m, MontantRealise = 240_000m },
            new() { Titre = "Lancement de l'appel d'offres national restreint", ProjetId = p3.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(26), DateEcheance = now.AddDays(60), Progression = 0, AssigneAId = secretaire?.Id, Phase = "Études", MontantPrevu = 80_000m, MontantRealise = 0m },
            new() { Titre = "Validation des plans d'exécution par le CTC", ProjetId = p3.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnRevue, DateDebut = now.AddDays(-5), DateEcheance = now.AddDays(18), Progression = 70, AssigneAId = gerant?.Id, Phase = "Études", MontantPrevu = 350_000m, MontantRealise = 245_000m },

            // ── P4 : STEP Reghaia (budget 14.5M) ────────────
            new() { Titre = "Génie civil – Bassins de décantation et d'aération", ProjetId = p4.Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-110), DateEcheance = now.AddDays(-50), DateFinReelle = now.AddDays(-45), Progression = 100, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 5_200_000m, MontantRealise = 5_050_000m },
            new() { Titre = "Installation des équipements électromécaniques", ProjetId = p4.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-40), DateEcheance = now.AddDays(-5), Progression = 85, AssigneAId = directeur?.Id, Phase = "Travaux", MontantPrevu = 4_000_000m, MontantRealise = 3_400_000m },
            new() { Titre = "Raccordement au réseau collecteur principal", ProjetId = p4.Id, Priorite = Priorite.Haute, Statut = StatutTache.EnCours, DateDebut = now.AddDays(-25), DateEcheance = now.AddDays(5), Progression = 65, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 2_500_000m, MontantRealise = 1_625_000m },
            new() { Titre = "Essais de performance et mise en service", ProjetId = p4.Id, Priorite = Priorite.Moyenne, Statut = StatutTache.AFaire, DateDebut = now.AddDays(6), DateEcheance = now.AddDays(30), Progression = 0, AssigneAId = gerant?.Id, Phase = "Réception", MontantPrevu = 1_200_000m, MontantRealise = 0m },

            // ── P5 : Poste Électrique Bouira (budget 9.8M) ──
            new() { Titre = "Génie civil du poste et fondations transformateurs", ProjetId = projets[4].Id, Priorite = Priorite.Haute, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-200), DateEcheance = now.AddDays(-140), DateFinReelle = now.AddDays(-138), Progression = 100, AssigneAId = ingenieur?.Id, Phase = "Travaux", MontantPrevu = 2_800_000m, MontantRealise = 2_750_000m },
            new() { Titre = "Montage des transformateurs et appareillage HT", ProjetId = projets[4].Id, Priorite = Priorite.Urgente, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-135), DateEcheance = now.AddDays(-70), DateFinReelle = now.AddDays(-68), Progression = 100, AssigneAId = directeur?.Id, Phase = "Travaux", MontantPrevu = 4_200_000m, MontantRealise = 4_100_000m },
            new() { Titre = "Raccordement lignes 220 kV et essais de mise sous tension", ProjetId = projets[4].Id, Priorite = Priorite.Haute, Statut = StatutTache.Terminee, DateDebut = now.AddDays(-65), DateEcheance = now.AddDays(-20), DateFinReelle = now.AddDays(-18), Progression = 100, AssigneAId = ingenieur?.Id, Phase = "Réception", MontantPrevu = 2_200_000m, MontantRealise = 2_150_000m },
        };

        context.Taches.AddRange(taches);
        await context.SaveChangesAsync();

        // --- Dépendances entre tâches (Fin → Début) ---
        // P1: Levé → Terrassement → OA → Chaussée → Signalisation
        taches[1].DependanceId = taches[0].Id;
        taches[3].DependanceId = taches[1].Id;
        taches[4].DependanceId = taches[3].Id;
        // P2: Diagnostic → Piles → Joints → Étanchéité
        taches[6].DependanceId = taches[5].Id;
        taches[7].DependanceId = taches[6].Id;
        taches[8].DependanceId = taches[7].Id;
        // P3: Programme → Appel d'offres
        taches[11].DependanceId = taches[10].Id;
        // P4: GC → Équipements → Raccordement → Essais
        taches[14].DependanceId = taches[13].Id;
        taches[15].DependanceId = taches[14].Id;
        taches[16].DependanceId = taches[15].Id;
        // P5: GC → Montage → Raccordement
        taches[17].DependanceId = taches[16].Id;
        taches[18].DependanceId = taches[17].Id;
        await context.SaveChangesAsync();

        // ══════════════════════════════════════════════════════
        // TRANSACTIONS BUDGÉTAIRES
        // ══════════════════════════════════════════════════════
        var transactions = new List<TransactionBudget>
        {
            // P1 – RN12
            new() { Libelle = "Granulats, ciment et bitume", Montant = 1_800_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-60), ProjetId = p1.Id, CreePar = gerant?.Email },
            new() { Libelle = "Location engins de terrassement (pelles, bulldozers)", Montant = 1_200_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Equipements, Date = now.AddDays(-50), ProjetId = p1.Id, CreePar = gerant?.Email },
            new() { Libelle = "Main d'œuvre – Équipe terrassement", Montant = 950_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-35), ProjetId = p1.Id, CreePar = directeur?.Email },
            new() { Libelle = "Sous-traitance levé topographique", Montant = 320_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.SousTraitance, Date = now.AddDays(-65), ProjetId = p1.Id, CreePar = ingenieur?.Email },

            // P2 – Viaduc
            new() { Libelle = "Acier de ferraillage et coffrages", Montant = 680_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-25), ProjetId = p2.Id, CreePar = directeur?.Email },
            new() { Libelle = "Échafaudages et nacelles articulées", Montant = 220_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Equipements, Date = now.AddDays(-18), ProjetId = p2.Id, CreePar = directeur?.Email },
            new() { Libelle = "Équipe spécialisée ouvrages d'art", Montant = 480_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-12), ProjetId = p2.Id, CreePar = ingenieur?.Email },

            // P4 – STEP
            new() { Libelle = "Béton, acier et équipements de coffrage", Montant = 3_200_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-100), ProjetId = p4.Id, CreePar = ingenieur?.Email },
            new() { Libelle = "Pompes, aérateurs et équipements de filtration", Montant = 2_800_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Equipements, Date = now.AddDays(-60), ProjetId = p4.Id, CreePar = ingenieur?.Email },
            new() { Libelle = "Main d'œuvre – Génie civil et installation", Montant = 1_500_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-45), ProjetId = p4.Id, CreePar = directeur?.Email },
            new() { Libelle = "Transport matériel lourd (transformateurs, cuves)", Montant = 450_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Transport, Date = now.AddDays(-80), ProjetId = p4.Id, CreePar = gerant?.Email },

            // P5 – Poste Électrique
            new() { Libelle = "Transformateurs 100 MVA et appareillage HT", Montant = 3_800_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-170), ProjetId = projets[4].Id, CreePar = directeur?.Email },
            new() { Libelle = "Sous-traitance montage lignes 220 kV", Montant = 1_200_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.SousTraitance, Date = now.AddDays(-130), ProjetId = projets[4].Id, CreePar = directeur?.Email },
            new() { Libelle = "Main d'œuvre – Électriciens haute tension", Montant = 900_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.MainOeuvre, Date = now.AddDays(-100), ProjetId = projets[4].Id, CreePar = ingenieur?.Email },
            new() { Libelle = "Génie civil poste et VRD", Montant = 2_500_000m, Type = TypeTransaction.Depense, Categorie = CategorieDepense.Materiaux, Date = now.AddDays(-190), ProjetId = projets[4].Id, CreePar = gerant?.Email },
        };

        context.TransactionsBudget.AddRange(transactions);
        await context.SaveChangesAsync();

        // ══════════════════════════════════════════════════════
        // DEVIS – LIGNES (LOTS)
        // ══════════════════════════════════════════════════════
        var devisLignes = new List<DevisLigne>
        {
            // P1 – RN12 (HT ≈ 15.5M → TTC ≈ 18.5M avec TVA 19%)
            new() { ProjetId = p1.Id, Designation = "Lot 1 – Terrassements et décapage", MontantHT = 4_200_000m, Ordre = 1 },
            new() { ProjetId = p1.Id, Designation = "Lot 2 – Ouvrages d'art courants", MontantHT = 3_500_000m, Ordre = 2 },
            new() { ProjetId = p1.Id, Designation = "Lot 3 – Corps de chaussée et enrobés", MontantHT = 5_800_000m, Ordre = 3 },
            new() { ProjetId = p1.Id, Designation = "Lot 4 – Signalisation et éclairage", MontantHT = 1_800_000m, Ordre = 4 },

            // P2 – Viaduc (HT ≈ 6M → TTC ≈ 7.2M)
            new() { ProjetId = p2.Id, Designation = "Lot 1 – Diagnostic et études", MontantHT = 600_000m, Ordre = 1 },
            new() { ProjetId = p2.Id, Designation = "Lot 2 – Renforcement des piles", MontantHT = 2_800_000m, Ordre = 2 },
            new() { ProjetId = p2.Id, Designation = "Lot 3 – Joints de dilatation", MontantHT = 1_500_000m, Ordre = 3 },
            new() { ProjetId = p2.Id, Designation = "Lot 4 – Étanchéité et essais", MontantHT = 1_100_000m, Ordre = 4 },

            // P4 – STEP (HT ≈ 12.2M → TTC ≈ 14.5M)
            new() { ProjetId = p4.Id, Designation = "Lot 1 – Génie civil bassins et bâtiments", MontantHT = 5_200_000m, Ordre = 1 },
            new() { ProjetId = p4.Id, Designation = "Lot 2 – Équipements électromécaniques", MontantHT = 4_000_000m, Ordre = 2 },
            new() { ProjetId = p4.Id, Designation = "Lot 3 – Réseau collecteur", MontantHT = 2_500_000m, Ordre = 3 },
            new() { ProjetId = p4.Id, Designation = "Lot 4 – Mise en service et essais", MontantHT = 1_200_000m, Ordre = 4 },

            // P5 – Poste Électrique (HT ≈ 8.2M → TTC ≈ 9.8M)
            new() { ProjetId = projets[4].Id, Designation = "Lot 1 – Génie civil du poste", MontantHT = 2_800_000m, Ordre = 1 },
            new() { ProjetId = projets[4].Id, Designation = "Lot 2 – Fourniture et montage transformateurs", MontantHT = 4_200_000m, Ordre = 2 },
            new() { ProjetId = projets[4].Id, Designation = "Lot 3 – Raccordement et essais", MontantHT = 2_200_000m, Ordre = 3 },
        };
        context.DevisLignes.AddRange(devisLignes);

        // ══════════════════════════════════════════════════════
        // SITUATIONS DE PAIEMENT
        // ══════════════════════════════════════════════════════
        var situations = new List<SituationPaiement>
        {
            // P1 – 2 situations
            new() { ProjetId = p1.Id, Numero = 1, Date = now.AddDays(-55), MontantValide = 2_200_000m, PourcentageCumule = 14.2m },
            new() { ProjetId = p1.Id, Numero = 2, Date = now.AddDays(-20), MontantValide = 2_070_000m, PourcentageCumule = 27.5m },

            // P2 – 1 situation
            new() { ProjetId = p2.Id, Numero = 1, Date = now.AddDays(-15), MontantValide = 1_560_000m, PourcentageCumule = 26.0m },

            // P4 – 3 situations
            new() { ProjetId = p4.Id, Numero = 1, Date = now.AddDays(-90), MontantValide = 3_500_000m, PourcentageCumule = 27.1m },
            new() { ProjetId = p4.Id, Numero = 2, Date = now.AddDays(-55), MontantValide = 3_200_000m, PourcentageCumule = 51.9m },
            new() { ProjetId = p4.Id, Numero = 3, Date = now.AddDays(-15), MontantValide = 2_800_000m, PourcentageCumule = 73.6m },

            // P5 – 3 situations (terminé)
            new() { ProjetId = projets[4].Id, Numero = 1, Date = now.AddDays(-160), MontantValide = 2_800_000m, PourcentageCumule = 30.4m },
            new() { ProjetId = projets[4].Id, Numero = 2, Date = now.AddDays(-90), MontantValide = 3_500_000m, PourcentageCumule = 68.5m },
            new() { ProjetId = projets[4].Id, Numero = 3, Date = now.AddDays(-30), MontantValide = 2_900_000m, PourcentageCumule = 100.0m },
        };
        context.SituationsPaiement.AddRange(situations);
        await context.SaveChangesAsync();

        // ══════════════════════════════════════════════════════
        // AVENANTS
        // ══════════════════════════════════════════════════════
        var avenants = new List<Avenant>
        {
            new() { ProjetId = p1.Id, Numero = 1, Motif = "Travaux supplémentaires de drainage latéral suite à l'étude hydrogéologique complémentaire", Montant = 1_200_000m, Date = now.AddDays(-30) },
            new() { ProjetId = p4.Id, Numero = 1, Motif = "Remplacement du système de pompage initialement prévu par un modèle plus performant à moindre coût", Montant = -350_000m, Date = now.AddDays(-35) },
            new() { ProjetId = projets[4].Id, Numero = 1, Motif = "Ajout d'un 3ème départ 60 kV pour raccordement de la zone d'activité adjacente", Montant = 600_000m, Date = now.AddDays(-80) },
        };
        context.Avenants.AddRange(avenants);

        // ══════════════════════════════════════════════════════
        // FACTURES
        // ══════════════════════════════════════════════════════
        var factures = new List<Facture>
        {
            // P1
            new() { ProjetId = p1.Id, Numero = "FA-RN12-001", Date = now.AddDays(-53), Montant = 2_200_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[0].Id },
            new() { ProjetId = p1.Id, Numero = "FA-RN12-002", Date = now.AddDays(-18), Montant = 2_070_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[1].Id },
            // P2
            new() { ProjetId = p2.Id, Numero = "FA-VOH-001", Date = now.AddDays(-13), Montant = 1_560_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[2].Id },
            // P4
            new() { ProjetId = p4.Id, Numero = "FA-STEP-001", Date = now.AddDays(-88), Montant = 3_500_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[3].Id },
            new() { ProjetId = p4.Id, Numero = "FA-STEP-002", Date = now.AddDays(-53), Montant = 3_200_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[4].Id },
            new() { ProjetId = p4.Id, Numero = "FA-STEP-003", Date = now.AddDays(-13), Montant = 2_800_000m, Statut = StatutFacture.Elaboree, SituationPaiementId = situations[5].Id },
            // P5
            new() { ProjetId = projets[4].Id, Numero = "FA-PE-001", Date = now.AddDays(-158), Montant = 2_800_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[6].Id },
            new() { ProjetId = projets[4].Id, Numero = "FA-PE-002", Date = now.AddDays(-88), Montant = 3_500_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[7].Id },
            new() { ProjetId = projets[4].Id, Numero = "FA-PE-003", Date = now.AddDays(-28), Montant = 2_900_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[8].Id },
        };
        context.Factures.AddRange(factures);
        await context.SaveChangesAsync();

        // ══════════════════════════════════════════════════════
        // RAPPORTS
        // ══════════════════════════════════════════════════════
        var jsonOpts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        var rapports = new List<Rapport>
        {
            // Contrôle qualité – P1
            new()
            {
                Titre = "Contrôle qualité – Compacité couches de fondation RN12",
                Type = TypeRapport.Qualite,
                Statut = StatutRapport.Genere,
                ProjetId = p1.Id,
                GenereParId = directeur?.Id,
                DateGeneration = now.AddDays(-22),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = p1.Nom,
                    MaitreOuvrage = p1.MaitreOuvrage,
                    LieuProjet = p1.Localisation,
                    ObjetControle = "Vérification de la compacité des couches de fondation – PK 0+000 à PK 8+500",
                    DateControle = now.AddDays(-23).ToString("yyyy-MM-dd"),
                    Controleur = "Meriem RAHMANI – Directeur Technique",
                    Resultat = "Conforme – Compacité ≥ 95% Proctor modifié sur l'ensemble des 12 points de sondage",
                    Observations = "Deux points au PK 5+200 présentent un taux d'humidité légèrement élevé (12,3%). Surveillance renforcée recommandée après séchage naturel.",
                    Actions = "Réaliser un contrôle complémentaire au PK 5+200 après 7 jours de séchage."
                }, jsonOpts)
            },
            // Bordereau – P2
            new()
            {
                Titre = "Bordereau d'envoi – Plans d'exécution viaduc El-Harrach",
                Type = TypeRapport.Bordereau,
                Statut = StatutRapport.Genere,
                ProjetId = p2.Id,
                GenereParId = secretaire?.Id,
                DateGeneration = now.AddDays(-28),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = p2.Nom,
                    MaitreOuvrage = p2.MaitreOuvrage,
                    LieuProjet = p2.Localisation,
                    NumeroBordereau = "BE-VOH-2026-001",
                    DateBordereau = now.AddDays(-28).ToString("yyyy-MM-dd"),
                    Destinataire = "Bureau de contrôle technique – CTC Centre",
                    ObjetBordereau = "Transmission des plans d'exécution pour renforcement des piles du viaduc",
                    PiecesJointes = "1. Plans d'exécution renforcement piles (18 planches A1)\n2. Note de calcul structure – vérification parasismique\n3. Planning prévisionnel d'intervention\n4. PV de diagnostic structurel",
                    Observations = "Prière de retourner les plans visés dans un délai de 15 jours ouvrables conformément à l'article 12 du marché."
                }, jsonOpts)
            },
            // Courrier – P3
            new()
            {
                Titre = "Courrier – Demande de permis de construire CHU Béjaïa",
                Type = TypeRapport.Courrier,
                Statut = StatutRapport.Genere,
                ProjetId = p3.Id,
                GenereParId = cogerant?.Id,
                DateGeneration = now.AddDays(-10),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = p3.Nom,
                    MaitreOuvrage = p3.MaitreOuvrage,
                    LieuProjet = p3.Localisation,
                    RefCourrier = "CR-CHU-BJ-2026-001",
                    DateCourrier = now.AddDays(-10).ToString("yyyy-MM-dd"),
                    Destinataire = "Monsieur le Directeur de l'Urbanisme et de la Construction – Wilaya de Béjaïa",
                    Objet = "Demande de permis de construire pour l'extension du CHU de Béjaïa",
                    Corps = "Monsieur le Directeur,\n\nDans le cadre du programme sectoriel de modernisation des infrastructures de santé, nous avons l'honneur de solliciter la délivrance du permis de construire relatif au projet d'extension du Centre Hospitalo-Universitaire de Béjaïa.\n\nLe projet comprend la construction d'un nouveau bloc opératoire de 6 salles, d'un service de réanimation de 24 lits et d'un parking souterrain de 200 places.\n\nLe dossier technique complet est joint au présent courrier conformément aux dispositions réglementaires en vigueur.\n\nNous restons à votre disposition pour toute information complémentaire.",
                    PiecesJointes = "1. Plans architecturaux (APS + APD)\n2. Étude géotechnique du sol\n3. Étude d'impact environnemental\n4. Certificat de conformité urbanistique\n5. Attestation foncière"
                }, jsonOpts)
            },
            // Réception provisoire – P5
            new()
            {
                Titre = "Demande de réception provisoire – Poste électrique Bouira",
                Type = TypeRapport.ReceptionProvisoire,
                Statut = StatutRapport.Genere,
                ProjetId = projets[4].Id,
                GenereParId = gerant?.Id,
                DateGeneration = now.AddDays(-16),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = projets[4].Nom,
                    MaitreOuvrage = projets[4].MaitreOuvrage,
                    LieuProjet = projets[4].Localisation,
                    MontantMarche = projets[4].BudgetAlloue.ToString("F0"),
                    DateDebut = projets[4].DateDebut.ToString("yyyy-MM-dd"),
                    DateFin = projets[4].DateFinReelle?.ToString("yyyy-MM-dd"),
                    DateDemande = now.AddDays(-16).ToString("yyyy-MM-dd"),
                    Entreprise = "IngéProjets SARL",
                    Observations = "L'ensemble des essais de mise sous tension ont été réalisés avec succès. Les protections numériques et automates de conduite sont opérationnels."
                }, jsonOpts)
            },
            // Note de suivi – P4
            new()
            {
                Titre = "Note de suivi – STEP Reghaia – Retard de livraison",
                Type = TypeRapport.Personnalise,
                Statut = StatutRapport.Genere,
                ProjetId = p4.Id,
                GenereParId = ingenieur?.Id,
                DateGeneration = now.AddDays(-8),
                Contenu = "Le projet de la station d'épuration de Reghaia accuse un retard de 10 jours par rapport au planning contractuel.\n\nÉtat d'avancement par lot :\n• Lot 1 – Génie civil : 100%\n• Lot 2 – Équipements : 85%\n• Lot 3 – Réseau collecteur : 65%\n• Lot 4 – Mise en service : 0%\n\nAvancement global : 72%\n\nAction requise : demande de prolongation de délai de 15 jours au maître d'ouvrage (ONA).",
                DonneesFormulaire = JsonSerializer.Serialize(new { Contenu = (string?)null }, jsonOpts)
            },
            // Contrôle qualité – P4
            new()
            {
                Titre = "Contrôle qualité – Étanchéité bassins STEP Reghaia",
                Type = TypeRapport.Qualite,
                Statut = StatutRapport.Genere,
                ProjetId = p4.Id,
                GenereParId = directeur?.Id,
                DateGeneration = now.AddDays(-40),
                DonneesFormulaire = JsonSerializer.Serialize(new
                {
                    NomProjet = p4.Nom,
                    MaitreOuvrage = p4.MaitreOuvrage,
                    LieuProjet = p4.Localisation,
                    ObjetControle = "Test d'étanchéité des bassins de décantation n°1, n°2 et du bassin d'aération",
                    DateControle = now.AddDays(-42).ToString("yyyy-MM-dd"),
                    Controleur = "Meriem RAHMANI – Directeur Technique",
                    Resultat = "Conforme – Aucune fuite détectée après 72h de mise en eau",
                    Observations = "Micro-fissure superficielle en paroi nord du bassin n°2 (longueur 15 cm). Sans incidence sur l'étanchéité.",
                    Actions = "Appliquer un enduit d'imperméabilisation complémentaire avant la mise en eau définitive."
                }, jsonOpts)
            },
        };
        context.Rapports.AddRange(rapports);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds missing financial data for databases that already have projects from a previous seed run.
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

        var p1 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "RN12-TO");
        var p2 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "VOH-RH");
        var p3 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "CHU-BJ");
        var p4 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "STEP-RG");
        var p5 = await context.Projets.FirstOrDefaultAsync(p => p.Code == "PE-BO");

        // --- Seed DevisLignes if missing ---
        if (!await context.DevisLignes.AnyAsync())
        {
            var devisLignes = new List<DevisLigne>();

            if (p1 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p1.Id, Designation = "Lot 1 – Terrassements et décapage", MontantHT = 4_200_000m, Ordre = 1 },
                    new() { ProjetId = p1.Id, Designation = "Lot 2 – Ouvrages d'art courants", MontantHT = 3_500_000m, Ordre = 2 },
                    new() { ProjetId = p1.Id, Designation = "Lot 3 – Corps de chaussée et enrobés", MontantHT = 5_800_000m, Ordre = 3 },
                    new() { ProjetId = p1.Id, Designation = "Lot 4 – Signalisation et éclairage", MontantHT = 1_800_000m, Ordre = 4 },
                ]);
            }
            if (p2 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p2.Id, Designation = "Lot 1 – Diagnostic et études", MontantHT = 600_000m, Ordre = 1 },
                    new() { ProjetId = p2.Id, Designation = "Lot 2 – Renforcement des piles", MontantHT = 2_800_000m, Ordre = 2 },
                    new() { ProjetId = p2.Id, Designation = "Lot 3 – Joints de dilatation", MontantHT = 1_500_000m, Ordre = 3 },
                    new() { ProjetId = p2.Id, Designation = "Lot 4 – Étanchéité et essais", MontantHT = 1_100_000m, Ordre = 4 },
                ]);
            }
            if (p4 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p4.Id, Designation = "Lot 1 – Génie civil bassins et bâtiments", MontantHT = 5_200_000m, Ordre = 1 },
                    new() { ProjetId = p4.Id, Designation = "Lot 2 – Équipements électromécaniques", MontantHT = 4_000_000m, Ordre = 2 },
                    new() { ProjetId = p4.Id, Designation = "Lot 3 – Réseau collecteur", MontantHT = 2_500_000m, Ordre = 3 },
                    new() { ProjetId = p4.Id, Designation = "Lot 4 – Mise en service et essais", MontantHT = 1_200_000m, Ordre = 4 },
                ]);
            }
            if (p5 is not null)
            {
                devisLignes.AddRange([
                    new() { ProjetId = p5.Id, Designation = "Lot 1 – Génie civil du poste", MontantHT = 2_800_000m, Ordre = 1 },
                    new() { ProjetId = p5.Id, Designation = "Lot 2 – Fourniture et montage transformateurs", MontantHT = 4_200_000m, Ordre = 2 },
                    new() { ProjetId = p5.Id, Designation = "Lot 3 – Raccordement et essais", MontantHT = 2_200_000m, Ordre = 3 },
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
                    new() { ProjetId = p1.Id, Numero = 1, Date = now.AddDays(-55), MontantValide = 2_200_000m, PourcentageCumule = 14.2m },
                    new() { ProjetId = p1.Id, Numero = 2, Date = now.AddDays(-20), MontantValide = 2_070_000m, PourcentageCumule = 27.5m },
                ]);
            }
            if (p2 is not null)
            {
                situations.Add(new() { ProjetId = p2.Id, Numero = 1, Date = now.AddDays(-15), MontantValide = 1_560_000m, PourcentageCumule = 26.0m });
            }
            if (p4 is not null)
            {
                situations.AddRange([
                    new() { ProjetId = p4.Id, Numero = 1, Date = now.AddDays(-90), MontantValide = 3_500_000m, PourcentageCumule = 27.1m },
                    new() { ProjetId = p4.Id, Numero = 2, Date = now.AddDays(-55), MontantValide = 3_200_000m, PourcentageCumule = 51.9m },
                    new() { ProjetId = p4.Id, Numero = 3, Date = now.AddDays(-15), MontantValide = 2_800_000m, PourcentageCumule = 73.6m },
                ]);
            }
            if (p5 is not null)
            {
                situations.AddRange([
                    new() { ProjetId = p5.Id, Numero = 1, Date = now.AddDays(-160), MontantValide = 2_800_000m, PourcentageCumule = 30.4m },
                    new() { ProjetId = p5.Id, Numero = 2, Date = now.AddDays(-90), MontantValide = 3_500_000m, PourcentageCumule = 68.5m },
                    new() { ProjetId = p5.Id, Numero = 3, Date = now.AddDays(-30), MontantValide = 2_900_000m, PourcentageCumule = 100.0m },
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
                    avenants.Add(new() { ProjetId = p1.Id, Numero = 1, Motif = "Travaux supplémentaires de drainage latéral suite à l'étude hydrogéologique complémentaire", Montant = 1_200_000m, Date = now.AddDays(-30) });
                if (p4 is not null)
                    avenants.Add(new() { ProjetId = p4.Id, Numero = 1, Motif = "Remplacement du système de pompage initialement prévu par un modèle plus performant à moindre coût", Montant = -350_000m, Date = now.AddDays(-35) });
                if (p5 is not null)
                    avenants.Add(new() { ProjetId = p5.Id, Numero = 1, Motif = "Ajout d'un 3ème départ 60 kV pour raccordement de la zone d'activité adjacente", Montant = 600_000m, Date = now.AddDays(-80) });

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
                        new() { ProjetId = p1.Id, Numero = "FA-RN12-001", Date = now.AddDays(-53), Montant = 2_200_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[0].Id },
                        new() { ProjetId = p1.Id, Numero = "FA-RN12-002", Date = now.AddDays(-18), Montant = 2_070_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[1].Id },
                    ]);
                }
                if (p2 is not null && situations.Count >= 3)
                {
                    factures.Add(new() { ProjetId = p2.Id, Numero = "FA-VOH-001", Date = now.AddDays(-13), Montant = 1_560_000m, Statut = StatutFacture.Validee, SituationPaiementId = situations[2].Id });
                }
                if (p4 is not null && situations.Count >= 6)
                {
                    factures.AddRange([
                        new() { ProjetId = p4.Id, Numero = "FA-STEP-001", Date = now.AddDays(-88), Montant = 3_500_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[3].Id },
                        new() { ProjetId = p4.Id, Numero = "FA-STEP-002", Date = now.AddDays(-53), Montant = 3_200_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[4].Id },
                        new() { ProjetId = p4.Id, Numero = "FA-STEP-003", Date = now.AddDays(-13), Montant = 2_800_000m, Statut = StatutFacture.Elaboree, SituationPaiementId = situations[5].Id },
                    ]);
                }
                if (p5 is not null && situations.Count >= 9)
                {
                    factures.AddRange([
                        new() { ProjetId = p5.Id, Numero = "FA-PE-001", Date = now.AddDays(-158), Montant = 2_800_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[6].Id },
                        new() { ProjetId = p5.Id, Numero = "FA-PE-002", Date = now.AddDays(-88), Montant = 3_500_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[7].Id },
                        new() { ProjetId = p5.Id, Numero = "FA-PE-003", Date = now.AddDays(-28), Montant = 2_900_000m, Statut = StatutFacture.Signee, SituationPaiementId = situations[8].Id },
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
                    Titre = "Contrôle qualité – Compacité couches de fondation RN12",
                    Type = TypeRapport.Qualite,
                    Statut = StatutRapport.Genere,
                    ProjetId = p1.Id,
                    GenereParId = directeur?.Id,
                    DateGeneration = now.AddDays(-22),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p1.Nom,
                        MaitreOuvrage = p1.MaitreOuvrage,
                        LieuProjet = p1.Localisation,
                        ObjetControle = "Vérification de la compacité des couches de fondation – PK 0+000 à PK 8+500",
                        DateControle = now.AddDays(-23).ToString("yyyy-MM-dd"),
                        Controleur = "Meriem RAHMANI – Directeur Technique",
                        Resultat = "Conforme – Compacité ≥ 95% Proctor modifié sur l'ensemble des 12 points de sondage",
                        Observations = "Deux points au PK 5+200 présentent un taux d'humidité légèrement élevé (12,3%). Surveillance renforcée recommandée après séchage naturel.",
                        Actions = "Réaliser un contrôle complémentaire au PK 5+200 après 7 jours de séchage."
                    }, jsonOpts)
                });
            }

            if (p2 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Bordereau d'envoi – Plans d'exécution viaduc El-Harrach",
                    Type = TypeRapport.Bordereau,
                    Statut = StatutRapport.Genere,
                    ProjetId = p2.Id,
                    GenereParId = secretaire?.Id,
                    DateGeneration = now.AddDays(-28),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p2.Nom,
                        MaitreOuvrage = p2.MaitreOuvrage,
                        LieuProjet = p2.Localisation,
                        NumeroBordereau = "BE-VOH-2026-001",
                        DateBordereau = now.AddDays(-28).ToString("yyyy-MM-dd"),
                        Destinataire = "Bureau de contrôle technique – CTC Centre",
                        ObjetBordereau = "Transmission des plans d'exécution pour renforcement des piles du viaduc",
                        PiecesJointes = "1. Plans d'exécution renforcement piles (18 planches A1)\n2. Note de calcul structure – vérification parasismique\n3. Planning prévisionnel d'intervention\n4. PV de diagnostic structurel",
                        Observations = "Prière de retourner les plans visés dans un délai de 15 jours ouvrables conformément à l'article 12 du marché."
                    }, jsonOpts)
                });
            }

            if (p3 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Courrier – Demande de permis de construire CHU Béjaïa",
                    Type = TypeRapport.Courrier,
                    Statut = StatutRapport.Genere,
                    ProjetId = p3.Id,
                    GenereParId = cogerant?.Id,
                    DateGeneration = now.AddDays(-10),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p3.Nom,
                        MaitreOuvrage = p3.MaitreOuvrage,
                        LieuProjet = p3.Localisation,
                        RefCourrier = "CR-CHU-BJ-2026-001",
                        DateCourrier = now.AddDays(-10).ToString("yyyy-MM-dd"),
                        Destinataire = "Monsieur le Directeur de l'Urbanisme et de la Construction – Wilaya de Béjaïa",
                        Objet = "Demande de permis de construire pour l'extension du CHU de Béjaïa",
                        Corps = "Monsieur le Directeur,\n\nDans le cadre du programme sectoriel de modernisation des infrastructures de santé, nous avons l'honneur de solliciter la délivrance du permis de construire relatif au projet d'extension du Centre Hospitalo-Universitaire de Béjaïa.\n\nLe projet comprend la construction d'un nouveau bloc opératoire de 6 salles, d'un service de réanimation de 24 lits et d'un parking souterrain de 200 places.\n\nLe dossier technique complet est joint au présent courrier conformément aux dispositions réglementaires en vigueur.\n\nNous restons à votre disposition pour toute information complémentaire.",
                        PiecesJointes = "1. Plans architecturaux (APS + APD)\n2. Étude géotechnique du sol\n3. Étude d'impact environnemental\n4. Certificat de conformité urbanistique\n5. Attestation foncière"
                    }, jsonOpts)
                });
            }

            if (p5 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Demande de réception provisoire – Poste électrique Bouira",
                    Type = TypeRapport.ReceptionProvisoire,
                    Statut = StatutRapport.Genere,
                    ProjetId = p5.Id,
                    GenereParId = gerant?.Id,
                    DateGeneration = now.AddDays(-16),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p5.Nom,
                        MaitreOuvrage = p5.MaitreOuvrage,
                        LieuProjet = p5.Localisation,
                        MontantMarche = p5.BudgetAlloue.ToString("F0"),
                        DateDebut = p5.DateDebut.ToString("yyyy-MM-dd"),
                        DateFin = p5.DateFinReelle?.ToString("yyyy-MM-dd"),
                        DateDemande = now.AddDays(-16).ToString("yyyy-MM-dd"),
                        Entreprise = "IngéProjets SARL",
                        Observations = "L'ensemble des essais de mise sous tension ont été réalisés avec succès. Les protections numériques et automates de conduite sont opérationnels."
                    }, jsonOpts)
                });
            }

            if (p4 is not null)
            {
                rapports.Add(new()
                {
                    Titre = "Note de suivi – STEP Reghaia – Retard de livraison",
                    Type = TypeRapport.Personnalise,
                    Statut = StatutRapport.Genere,
                    ProjetId = p4.Id,
                    GenereParId = ingenieur?.Id,
                    DateGeneration = now.AddDays(-8),
                    Contenu = "Le projet de la station d'épuration de Reghaia accuse un retard de 10 jours par rapport au planning contractuel.\n\nÉtat d'avancement par lot :\n• Lot 1 – Génie civil : 100%\n• Lot 2 – Équipements : 85%\n• Lot 3 – Réseau collecteur : 65%\n• Lot 4 – Mise en service : 0%\n\nAvancement global : 72%\n\nAction requise : demande de prolongation de délai de 15 jours au maître d'ouvrage (ONA).",
                    DonneesFormulaire = JsonSerializer.Serialize(new { Contenu = (string?)null }, jsonOpts)
                });

                rapports.Add(new()
                {
                    Titre = "Contrôle qualité – Étanchéité bassins STEP Reghaia",
                    Type = TypeRapport.Qualite,
                    Statut = StatutRapport.Genere,
                    ProjetId = p4.Id,
                    GenereParId = directeur?.Id,
                    DateGeneration = now.AddDays(-40),
                    DonneesFormulaire = JsonSerializer.Serialize(new
                    {
                        NomProjet = p4.Nom,
                        MaitreOuvrage = p4.MaitreOuvrage,
                        LieuProjet = p4.Localisation,
                        ObjetControle = "Test d'étanchéité des bassins de décantation n°1, n°2 et du bassin d'aération",
                        DateControle = now.AddDays(-42).ToString("yyyy-MM-dd"),
                        Controleur = "Meriem RAHMANI – Directeur Technique",
                        Resultat = "Conforme – Aucune fuite détectée après 72h de mise en eau",
                        Observations = "Micro-fissure superficielle en paroi nord du bassin n°2 (longueur 15 cm). Sans incidence sur l'étanchéité.",
                        Actions = "Appliquer un enduit d'imperméabilisation complémentaire avant la mise en eau définitive."
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
