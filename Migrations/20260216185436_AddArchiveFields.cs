using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddArchiveFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateArchivage",
                table: "Taches",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EstArchive",
                table: "Taches",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateArchivage",
                table: "Projets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EstArchive",
                table: "Projets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Taches_EstArchive",
                table: "Taches",
                column: "EstArchive");

            migrationBuilder.CreateIndex(
                name: "IX_Projets_EstArchive",
                table: "Projets",
                column: "EstArchive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Taches_EstArchive",
                table: "Taches");

            migrationBuilder.DropIndex(
                name: "IX_Projets_EstArchive",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "DateArchivage",
                table: "Taches");

            migrationBuilder.DropColumn(
                name: "EstArchive",
                table: "Taches");

            migrationBuilder.DropColumn(
                name: "DateArchivage",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "EstArchive",
                table: "Projets");
        }
    }
}
