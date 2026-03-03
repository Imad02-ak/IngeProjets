using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddMaitreOeuvreEtNombrePropositionsPrix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PropositionPrix",
                table: "Projets");

            migrationBuilder.AddColumn<string>(
                name: "MaitreOeuvre",
                table: "Projets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NombrePropositionsPrix",
                table: "Projets",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaitreOeuvre",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "NombrePropositionsPrix",
                table: "Projets");

            migrationBuilder.AddColumn<decimal>(
                name: "PropositionPrix",
                table: "Projets",
                type: "decimal(18,2)",
                nullable: true);
        }
    }
}
