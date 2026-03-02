using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddMontantModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Avenants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjetId = table.Column<int>(type: "int", nullable: false),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    Motif = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avenants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avenants_Projets_ProjetId",
                        column: x => x.ProjetId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DevisLignes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjetId = table.Column<int>(type: "int", nullable: false),
                    Designation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MontantHT = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Ordre = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DevisLignes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DevisLignes_Projets_ProjetId",
                        column: x => x.ProjetId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SituationsPaiement",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjetId = table.Column<int>(type: "int", nullable: false),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MontantValide = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PourcentageCumule = table.Column<decimal>(type: "decimal(5,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SituationsPaiement", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SituationsPaiement_Projets_ProjetId",
                        column: x => x.ProjetId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TachesProjet",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjetId = table.Column<int>(type: "int", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    MontantPrevu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontantRealise = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PourcentageAvancement = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TachesProjet", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TachesProjet_Projets_ProjetId",
                        column: x => x.ProjetId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Factures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjetId = table.Column<int>(type: "int", nullable: false),
                    SituationPaiementId = table.Column<int>(type: "int", nullable: true),
                    Numero = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Factures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Factures_Projets_ProjetId",
                        column: x => x.ProjetId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Factures_SituationsPaiement_SituationPaiementId",
                        column: x => x.SituationPaiementId,
                        principalTable: "SituationsPaiement",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avenants_ProjetId",
                table: "Avenants",
                column: "ProjetId");

            migrationBuilder.CreateIndex(
                name: "IX_DevisLignes_ProjetId",
                table: "DevisLignes",
                column: "ProjetId");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_ProjetId",
                table: "Factures",
                column: "ProjetId");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_SituationPaiementId",
                table: "Factures",
                column: "SituationPaiementId");

            migrationBuilder.CreateIndex(
                name: "IX_SituationsPaiement_ProjetId",
                table: "SituationsPaiement",
                column: "ProjetId");

            migrationBuilder.CreateIndex(
                name: "IX_TachesProjet_ProjetId",
                table: "TachesProjet",
                column: "ProjetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Avenants");

            migrationBuilder.DropTable(
                name: "DevisLignes");

            migrationBuilder.DropTable(
                name: "Factures");

            migrationBuilder.DropTable(
                name: "TachesProjet");

            migrationBuilder.DropTable(
                name: "SituationsPaiement");
        }
    }
}
