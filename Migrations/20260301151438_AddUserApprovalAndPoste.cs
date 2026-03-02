using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IngeProjets.Migrations
{
    /// <inheritdoc />
    public partial class AddUserApprovalAndPoste : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EstApprouve",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Poste",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstApprouve",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Poste",
                table: "AspNetUsers");
        }
    }
}
