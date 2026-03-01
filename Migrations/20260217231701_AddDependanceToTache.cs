using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddDependanceToTache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Commentaire",
                table: "Taches",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DependanceId",
                table: "Taches",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phase",
                table: "Taches",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Taches_DependanceId",
                table: "Taches",
                column: "DependanceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Taches_Taches_DependanceId",
                table: "Taches",
                column: "DependanceId",
                principalTable: "Taches",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Taches_Taches_DependanceId",
                table: "Taches");

            migrationBuilder.DropIndex(
                name: "IX_Taches_DependanceId",
                table: "Taches");

            migrationBuilder.DropColumn(
                name: "Commentaire",
                table: "Taches");

            migrationBuilder.DropColumn(
                name: "DependanceId",
                table: "Taches");

            migrationBuilder.DropColumn(
                name: "Phase",
                table: "Taches");
        }
    }
}