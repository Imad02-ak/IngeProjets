using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddDonneesFormulaireToRapport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DonneesFormulaire",
                table: "Rapports",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DonneesFormulaire",
                table: "Rapports");
        }
    }
}
