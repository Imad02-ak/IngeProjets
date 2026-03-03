using System.Text.Json;
using IngeProjets.Data.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace IngeProjets.Services;

/// <summary>
/// Generates professional PDF documents for all rapport types.
/// </summary>
public sealed class PvPdfService
{
    private readonly IWebHostEnvironment _env;

    public PvPdfService(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// Generates a PDF byte array for the given rapport.
    /// </summary>
    public byte[] GeneratePdf(Rapport rapport)
    {
        ArgumentNullException.ThrowIfNull(rapport);

        return rapport.Type switch
        {
            TypeRapport.ReceptionProvisoire => GenerateDemandeProvisoire(rapport),
            TypeRapport.ReceptionDefinitive => GenerateDemandeDefinitive(rapport),
            TypeRapport.Qualite => GenerateControleQualite(rapport),
            TypeRapport.Bordereau => GenerateBordereau(rapport),
            TypeRapport.Courrier => GenerateCourrier(rapport),
            TypeRapport.Personnalise => GeneratePersonnalise(rapport),
            _ => throw new InvalidOperationException($"PDF generation is not supported for type {rapport.Type}.")
        };
    }

    // ── Réception Provisoire ──

    private byte[] GenerateDemandeProvisoire(Rapport rapport)
    {
        var data = Deserialize<ReceptionProvisoireData>(rapport.DonneesFormulaire);

        return CreateDocument(page =>
        {
            page.Header().Element(c => ComposeHeader(c, "DEMANDE DE RÉCEPTION PROVISOIRE"));

            page.Content().Element(c =>
            {
                c.PaddingTop(10).Column(col =>
                {
                    col.Spacing(6);
                    ComposeDateLieu(col, data.LieuProjet, data.DateDemande);

                    col.Item().PaddingTop(12).Text(text =>
                    {
                        text.Span("Objet : ").Bold();
                        text.Span("Demande de réception provisoire des travaux du projet ");
                        text.Span($"« {data.NomProjet ?? "—"} »").Bold();
                    });

                    col.Item().PaddingTop(14).Text("Monsieur le Maître d'ouvrage,");
                    col.Item().PaddingTop(8).Text(text =>
                    {
                        text.Span("Nous avons l'honneur de vous informer que les travaux relatifs au projet ");
                        text.Span($"« {data.NomProjet ?? "—"} »").Bold();
                        text.Span(", situé à "); text.Span(data.LieuProjet ?? "—").Bold();
                        text.Span(", ont été achevés conformément aux clauses du marché.");
                    });
                    col.Item().PaddingTop(8).Text(text =>
                    {
                        text.Span("En conséquence, nous vous prions de bien vouloir procéder à la ");
                        text.Span("réception provisoire").Bold();
                        text.Span(" des travaux réalisés.");
                    });

                    col.Item().PaddingTop(16).Element(e => SectionTitle(e, "Informations du Projet"));
                    col.Item().Element(e => InfoTable(e, new[]
                    {
                        ("Nom du projet", data.NomProjet),
                        ("Maître d'ouvrage", data.MaitreOuvrage),
                        ("Entreprise réalisatrice", data.Entreprise),
                        ("Lieu du projet", data.LieuProjet),
                        ("Date de début des travaux", FormatDate(data.DateDebut)),
                        ("Date de fin prévue", FormatDate(data.DateFin)),
                        ("Montant du marché", FormatCurrency(data.MontantMarche)),
                    }));

                    ComposeObservations(col, data.Observations);
                    ComposeClosing(col);
                    ComposeSingleSignature(col, "L'Entreprise réalisatrice");
                });
            });

            page.Footer().Element(ComposeFooter);
        });
    }

    // ── Réception Définitive ──

    private byte[] GenerateDemandeDefinitive(Rapport rapport)
    {
        var data = Deserialize<ReceptionDefinitiveData>(rapport.DonneesFormulaire);

        return CreateDocument(page =>
        {
            page.Header().Element(c => ComposeHeader(c, "DEMANDE DE RÉCEPTION DÉFINITIVE"));

            page.Content().Element(c =>
            {
                c.PaddingTop(10).Column(col =>
                {
                    col.Spacing(6);
                    ComposeDateLieu(col, data.LieuProjet, data.DateDemande);

                    col.Item().PaddingTop(12).Text(text =>
                    {
                        text.Span("Objet : ").Bold();
                        text.Span("Demande de réception définitive des travaux du projet ");
                        text.Span($"« {data.NomProjet ?? "—"} »").Bold();
                    });

                    col.Item().PaddingTop(14).Text("Monsieur le Maître d'ouvrage,");
                    col.Item().PaddingTop(8).Text(text =>
                    {
                        text.Span("Suite à la réception provisoire");
                        if (!string.IsNullOrWhiteSpace(data.DateReceptionProvisoire))
                        {
                            text.Span(" prononcée le "); text.Span(FormatDate(data.DateReceptionProvisoire)).Bold();
                        }
                        text.Span(" et à l'expiration du délai de garantie");
                        if (!string.IsNullOrWhiteSpace(data.DureeGarantie))
                        {
                            text.Span(" de "); text.Span($"{data.DureeGarantie} mois").Bold();
                        }
                        text.Span(", nous avons l'honneur de vous informer que l'ensemble des réserves " +
                                  "émises ont été levées et que les ouvrages sont en parfait état.");
                    });
                    col.Item().PaddingTop(8).Text(text =>
                    {
                        text.Span("En conséquence, nous vous prions de bien vouloir procéder à la ");
                        text.Span("réception définitive").Bold();
                        text.Span(" des travaux du projet ");
                        text.Span($"« {data.NomProjet ?? "—"} »").Bold();
                        text.Span(", situé à "); text.Span(data.LieuProjet ?? "—").Bold(); text.Span(".");
                    });

                    var infoRows = new List<(string, string?)>
                    {
                        ("Nom du projet", data.NomProjet),
                        ("Maître d'ouvrage", data.MaitreOuvrage),
                        ("Entreprise réalisatrice", data.Entreprise),
                        ("Lieu du projet", data.LieuProjet),
                        ("Date de fin prévue", FormatDate(data.DateFin)),
                        ("Montant du marché", FormatCurrency(data.MontantMarche)),
                    };
                    if (!string.IsNullOrWhiteSpace(data.DateReceptionProvisoire))
                        infoRows.Add(("Date de réception provisoire", FormatDate(data.DateReceptionProvisoire)));
                    if (!string.IsNullOrWhiteSpace(data.DureeGarantie))
                        infoRows.Add(("Durée de garantie", $"{data.DureeGarantie} mois"));

                    col.Item().PaddingTop(16).Element(e => SectionTitle(e, "Informations du Projet"));
                    col.Item().Element(e => InfoTable(e, infoRows.ToArray()));

                    col.Item().PaddingTop(10).Element(e => SectionTitle(e, "État des Réserves"));
                    col.Item().PaddingHorizontal(5).Text(data.ReservesLevees ?? "Toutes les réserves ont été levées");

                    ComposeObservations(col, data.Observations);
                    ComposeClosing(col);
                    ComposeSingleSignature(col, "L'Entreprise réalisatrice");
                });
            });

            page.Footer().Element(ComposeFooter);
        });
    }

    // ── Contrôle Qualité ──

    private byte[] GenerateControleQualite(Rapport rapport)
    {
        var data = Deserialize<ControleQualiteData>(rapport.DonneesFormulaire);

        return CreateDocument(page =>
        {
            page.Header().Element(c => ComposeHeader(c, "RAPPORT DE CONTRÔLE QUALITÉ"));

            page.Content().Element(c =>
            {
                c.PaddingTop(10).Column(col =>
                {
                    col.Spacing(6);

                    col.Item().PaddingTop(4).Element(e => SectionTitle(e, "Informations du Projet"));
                    col.Item().Element(e => InfoTable(e, new[]
                    {
                        ("Nom du projet", data.NomProjet),
                        ("Maître d'ouvrage", data.MaitreOuvrage),
                        ("Lieu du projet", data.LieuProjet),
                    }));

                    col.Item().PaddingTop(10).Element(e => SectionTitle(e, "Détail du Contrôle"));
                    col.Item().Element(e => InfoTable(e, new[]
                    {
                        ("Objet du contrôle", data.ObjetControle),
                        ("Date du contrôle", FormatDate(data.DateControle)),
                        ("Contrôleur", data.Controleur),
                        ("Résultat", data.Resultat),
                    }));

                    ComposeObservations(col, data.Observations);

                    if (!string.IsNullOrWhiteSpace(data.Actions))
                    {
                        col.Item().PaddingTop(10).Element(e => SectionTitle(e, "Actions correctives recommandées"));
                        col.Item().PaddingHorizontal(5).Text(data.Actions);
                    }

                    col.Item().PaddingTop(35).Row(row =>
                    {
                        row.RelativeItem().AlignCenter().Column(sig =>
                        {
                            sig.Item().AlignCenter().Text("Le Contrôleur").Bold().FontSize(10);
                            sig.Item().PaddingTop(40).AlignCenter().Width(160).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                            sig.Item().AlignCenter().Text("Signature").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                        row.ConstantItem(40);
                        row.RelativeItem().AlignCenter().Column(sig =>
                        {
                            sig.Item().AlignCenter().Text("Le Responsable du projet").Bold().FontSize(10);
                            sig.Item().PaddingTop(40).AlignCenter().Width(160).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                            sig.Item().AlignCenter().Text("Signature & Cachet").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                    });
                });
            });

            page.Footer().Element(ComposeFooter);
        });
    }

    // ── Bordereau d'Envoi ──

    private byte[] GenerateBordereau(Rapport rapport)
    {
        var data = Deserialize<BordereauData>(rapport.DonneesFormulaire);

        return CreateDocument(page =>
        {
            page.Header().Element(c => ComposeHeader(c, "BORDEREAU D'ENVOI"));

            page.Content().Element(c =>
            {
                c.PaddingTop(10).Column(col =>
                {
                    col.Spacing(6);

                    if (!string.IsNullOrWhiteSpace(data.NumeroBordereau))
                    {
                        col.Item().AlignCenter().Text($"N° : {data.NumeroBordereau}")
                            .FontSize(10).FontColor(Colors.Grey.Medium);
                    }

                    ComposeDateLieu(col, data.LieuProjet, data.DateBordereau);

                    col.Item().PaddingTop(10).Element(e => SectionTitle(e, "Informations"));
                    col.Item().Element(e => InfoTable(e, new[]
                    {
                        ("Projet", data.NomProjet),
                        ("Maître d'ouvrage", data.MaitreOuvrage),
                        ("Destinataire", data.Destinataire),
                        ("Objet", data.ObjetBordereau),
                    }));

                    if (!string.IsNullOrWhiteSpace(data.PiecesJointes))
                    {
                        col.Item().PaddingTop(10).Element(e => SectionTitle(e, "Pièces jointes"));
                        col.Item().PaddingHorizontal(5).Text(data.PiecesJointes);
                    }

                    ComposeObservations(col, data.Observations);

                    col.Item().PaddingTop(35).Row(row =>
                    {
                        row.RelativeItem().AlignCenter().Column(sig =>
                        {
                            sig.Item().AlignCenter().Text("L'Expéditeur").Bold().FontSize(10);
                            sig.Item().PaddingTop(40).AlignCenter().Width(160).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                            sig.Item().AlignCenter().Text("Signature & Cachet").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                        row.ConstantItem(40);
                        row.RelativeItem().AlignCenter().Column(sig =>
                        {
                            sig.Item().AlignCenter().Text("Le Destinataire").Bold().FontSize(10);
                            sig.Item().PaddingTop(40).AlignCenter().Width(160).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                            sig.Item().AlignCenter().Text("Reçu le : ____/____/________").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                    });
                });
            });

            page.Footer().Element(ComposeFooter);
        });
    }

    // ── Courrier Officiel ──

    private byte[] GenerateCourrier(Rapport rapport)
    {
        var data = Deserialize<CourrierData>(rapport.DonneesFormulaire);

        return CreateDocument(page =>
        {
            page.Header().Element(c => ComposeHeader(c, "COURRIER OFFICIEL"));

            page.Content().Element(c =>
            {
                c.PaddingTop(10).Column(col =>
                {
                    col.Spacing(6);

                    if (!string.IsNullOrWhiteSpace(data.RefCourrier))
                    {
                        col.Item().AlignCenter().Text($"Réf. : {data.RefCourrier}")
                            .FontSize(10).FontColor(Colors.Grey.Medium);
                    }

                    ComposeDateLieu(col, data.LieuProjet, data.DateCourrier);

                    col.Item().PaddingTop(10).Text(text =>
                    {
                        text.Span("Destinataire : ").Bold();
                        text.Span(data.Destinataire ?? "—");
                    });

                    if (!string.IsNullOrWhiteSpace(data.NomProjet))
                    {
                        col.Item().Text(text =>
                        {
                            text.Span("Projet : ").Bold();
                            text.Span(data.NomProjet);
                        });
                    }

                    col.Item().PaddingTop(10).Text(text =>
                    {
                        text.Span("Objet : ").Bold();
                        text.Span(data.Objet ?? "—");
                    });

                    if (!string.IsNullOrWhiteSpace(data.Corps))
                    {
                        col.Item().PaddingTop(14).Text(data.Corps);
                    }

                    if (!string.IsNullOrWhiteSpace(data.PiecesJointes))
                    {
                        col.Item().PaddingTop(10).Text(text =>
                        {
                            text.Span("PJ : ").Bold();
                            text.Span(data.PiecesJointes);
                        });
                    }

                    col.Item().PaddingTop(14).Text(
                        "Veuillez agréer, Monsieur/Madame, l'expression de nos salutations distinguées.");

                    ComposeSingleSignature(col, "L'Expéditeur");
                });
            });

            page.Footer().Element(ComposeFooter);
        });
    }

    // ── Rapport Personnalisé ──

    private byte[] GeneratePersonnalise(Rapport rapport)
    {
        var data = Deserialize<PersonnaliseData>(rapport.DonneesFormulaire);
        var contenu = data.Contenu ?? rapport.Contenu ?? "";

        return CreateDocument(page =>
        {
            page.Header().Element(c => ComposeHeader(c, rapport.Titre?.ToUpperInvariant() ?? "RAPPORT"));

            page.Content().Element(c =>
            {
                c.PaddingTop(14).Column(col =>
                {
                    col.Spacing(6);
                    col.Item().Text(contenu);

                    ComposeSingleSignature(col, "Le Rédacteur");
                });
            });

            page.Footer().Element(ComposeFooter);
        });
    }

    // ── Shared composable components ──

    private byte[] CreateDocument(Action<PageDescriptor> pageConfig)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(35);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));
                pageConfig(page);
            });
        });
        return doc.GeneratePdf();
    }

    private void ComposeHeader(IContainer container, string title)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                var logoPath = Path.Combine(_env.WebRootPath, "images", "logo.png");
                if (File.Exists(logoPath))
                {
                    row.ConstantItem(60).Image(logoPath);
                }

                row.RelativeItem().AlignCenter().Column(c =>
                {
                    c.Item().AlignCenter().Text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE")
                        .FontSize(9).Bold();
                    c.Item().AlignCenter().Text("MINISTÈRE DE L'HABITAT, DE L'URBANISME ET DE LA VILLE")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                });

                row.ConstantItem(60);
            });

            col.Item().PaddingTop(12).LineHorizontal(2).LineColor(Colors.Red.Medium);

            col.Item().PaddingTop(10).AlignCenter().Text(title)
                .FontSize(16).Bold().FontColor(Colors.Black);

            col.Item().PaddingTop(6).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);
        });
    }

    private static void SectionTitle(IContainer container, string title)
    {
        container.PaddingTop(12).PaddingBottom(4).Row(row =>
        {
            row.ConstantItem(4).Height(16).Background(Colors.Red.Medium);
            row.RelativeItem().PaddingLeft(8).Text(title).FontSize(12).Bold();
        });
    }

    private static void InfoTable(IContainer container, (string Label, string? Value)[] rows)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(200);
                cols.RelativeColumn();
            });

            foreach (var (label, value) in rows)
            {
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Lighten2)
                    .Background(Colors.Grey.Lighten4).Padding(6)
                    .Text(label).FontSize(10).SemiBold();

                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Lighten2)
                    .Padding(6)
                    .Text(value ?? "—").FontSize(10);
            }
        });
    }

    private static void ComposeDateLieu(ColumnDescriptor col, string? lieu, string? date)
    {
        col.Item().AlignRight().Text(text =>
        {
            text.Span(lieu ?? "_______________").Bold();
            text.Span(", le ");
            text.Span(FormatDate(date)).Bold();
        });
    }

    private static void ComposeObservations(ColumnDescriptor col, string? observations)
    {
        if (!string.IsNullOrWhiteSpace(observations))
        {
            col.Item().PaddingTop(10).Element(e => SectionTitle(e, "Observations"));
            col.Item().PaddingHorizontal(5).Text(observations);
        }
    }

    private static void ComposeClosing(ColumnDescriptor col)
    {
        col.Item().PaddingTop(16).Text(
            "Dans l'attente de votre suite favorable, veuillez agréer, Monsieur, " +
            "l'expression de nos salutations distinguées.");
    }

    private static void ComposeSingleSignature(ColumnDescriptor col, string label)
    {
        col.Item().PaddingTop(35).AlignRight().Column(sig =>
        {
            sig.Item().AlignCenter().Text(label).Bold().FontSize(10);
            sig.Item().PaddingTop(40).AlignCenter().Width(160).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
            sig.Item().AlignCenter().Text("Signature & Cachet").FontSize(8).FontColor(Colors.Grey.Medium);
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Medium));
            text.Span("Page ");
            text.CurrentPageNumber();
            text.Span(" / ");
            text.TotalPages();
        });
    }

    // ── Helpers ──

    private static T Deserialize<T>(string? json) where T : new()
    {
        if (string.IsNullOrWhiteSpace(json))
            return new T();
        return JsonSerializer.Deserialize<T>(json, JsonOpts) ?? new T();
    }

    private static string FormatDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr)) return "—";
        if (DateTime.TryParse(dateStr, out var d))
            return d.ToString("dd/MM/yyyy");
        return dateStr;
    }

    private static string FormatCurrency(string? amount)
    {
        if (string.IsNullOrWhiteSpace(amount)) return "—";
        if (decimal.TryParse(amount, out var val))
            return val.ToString("N0") + " DA";
        return amount + " DA";
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };
}
