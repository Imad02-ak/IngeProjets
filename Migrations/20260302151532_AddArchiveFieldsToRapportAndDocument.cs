using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddArchiveFieldsToRapportAndDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateArchivage",
                table: "Rapports",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EstArchive",
                table: "Rapports",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateArchivage",
                table: "Documents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EstArchive",
                table: "Documents",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateArchivage",
                table: "Rapports");

            migrationBuilder.DropColumn(
                name: "EstArchive",
                table: "Rapports");

            migrationBuilder.DropColumn(
                name: "DateArchivage",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "EstArchive",
                table: "Documents");
        }
    }
}
