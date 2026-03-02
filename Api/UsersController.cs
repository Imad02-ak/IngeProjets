using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _context;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
    }

    /// <summary>
    /// Returns all approved and active users.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Cast<ApplicationUser>()
            .Where(u => u.EstActif && u.EstApprouve)
            .OrderBy(u => u.Nom)
            .ToListAsync(cancellationToken);

        var roleMap = await GetRoleMap(users.Select(u => u.Id), cancellationToken);

        var result = users.Select(user => new
        {
            user.Id,
            user.Nom,
            user.Prenom,
            user.NomComplet,
            user.Email,
            Role = roleMap.GetValueOrDefault(user.Id, "Inconnu"),
            user.Poste,
            user.EstActif,
            user.EstApprouve,
            user.DateCreation
        });

        return Ok(result);
    }

    /// <summary>
    /// Returns pending registration requests (not approved).
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> GetPending(CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Cast<ApplicationUser>()
            .Where(u => u.EstActif && !u.EstApprouve)
            .OrderByDescending(u => u.DateCreation)
            .ToListAsync(cancellationToken);

        var result = users.Select(user => new
        {
            user.Id,
            user.Nom,
            user.Prenom,
            user.NomComplet,
            user.Email,
            user.Poste,
            user.DateCreation
        });

        return Ok(result);
    }

    /// <summary>
    /// Approves a pending user and assigns a role.
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> Approve(string id, [FromBody] ApproveUserRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(id))
            return BadRequest();

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound();

        if (user.EstApprouve)
            return BadRequest("L'utilisateur est déjà approuvé.");

        if (string.IsNullOrWhiteSpace(request.Role))
            return BadRequest("Le rôle est requis.");

        if (!await _roleManager.RoleExistsAsync(request.Role))
            return BadRequest("Rôle invalide.");

        user.EstApprouve = true;
        user.Poste = request.Poste;
        await _userManager.UpdateAsync(user);
        await _userManager.AddToRoleAsync(user, request.Role);

        return Ok(new { message = "Utilisateur approuvé avec succès." });
    }

    /// <summary>
    /// Refuses and deletes a pending user.
    /// </summary>
    [HttpDelete("{id}/refuse")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> Refuse(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest();

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound();

        if (user.EstApprouve)
            return BadRequest("Impossible de refuser un utilisateur déjà approuvé.");

        await _userManager.DeleteAsync(user);
        return NoContent();
    }

    /// <summary>
    /// Updates a user's role and poste.
    /// </summary>
    [HttpPut("{id}/role")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(id))
            return BadRequest();

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            if (!await _roleManager.RoleExistsAsync(request.Role))
                return BadRequest("Rôle invalide.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
                await _userManager.RemoveFromRolesAsync(user, currentRoles);

            await _userManager.AddToRoleAsync(user, request.Role);
        }

        if (request.Poste is not null)
            user.Poste = request.Poste;

        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Utilisateur mis à jour." });
    }

    /// <summary>
    /// Returns a single user by id.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest();

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.Nom,
            user.Prenom,
            user.NomComplet,
            user.Email,
            Role = roles.FirstOrDefault() ?? "Inconnu",
            user.Poste,
            user.EstActif,
            user.EstApprouve,
            user.DateCreation
        });
    }

    /// <summary>
    /// Exports all approved users as an Excel file.
    /// </summary>
    [HttpGet("export")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Cast<ApplicationUser>()
            .Where(u => u.EstActif && u.EstApprouve)
            .OrderBy(u => u.Nom)
            .ToListAsync(cancellationToken);

        var roleMap = await GetRoleMap(users.Select(u => u.Id), cancellationToken);

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Utilisateurs");

        ws.Cells[1, 1].Value = "Nom";
        ws.Cells[1, 2].Value = "Prénom";
        ws.Cells[1, 3].Value = "Email";
        ws.Cells[1, 4].Value = "Rôle";
        ws.Cells[1, 5].Value = "Poste";
        ws.Cells[1, 6].Value = "Statut";
        ws.Cells[1, 7].Value = "Date de création";

        using (var header = ws.Cells[1, 1, 1, 7])
        {
            header.Style.Font.Bold = true;
        }

        for (int i = 0; i < users.Count; i++)
        {
            var u = users[i];
            var row = i + 2;
            ws.Cells[row, 1].Value = u.Nom;
            ws.Cells[row, 2].Value = u.Prenom;
            ws.Cells[row, 3].Value = u.Email;
            ws.Cells[row, 4].Value = roleMap.GetValueOrDefault(u.Id, "Inconnu");
            ws.Cells[row, 5].Value = u.Poste ?? "";
            ws.Cells[row, 6].Value = u.EstActif ? "Actif" : "Inactif";
            ws.Cells[row, 7].Value = u.DateCreation.ToString("dd/MM/yyyy");
        }

        ws.Cells[ws.Dimension.Address].AutoFitColumns();

        var content = package.GetAsByteArray();
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Utilisateurs.xlsx");
    }

    /// <summary>
    /// Imports users from an Excel file.
    /// </summary>
    [HttpPost("import")]
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public async Task<IActionResult> Import(IFormFile file, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(file);

        if (file.Length == 0)
            return BadRequest("Le fichier est vide.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not ".xlsx" and not ".xls")
            return BadRequest("Format non supporté. Utilisez un fichier Excel (.xlsx).");

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;

        using var package = new ExcelPackage(stream);
        var ws = package.Workbook.Worksheets.FirstOrDefault();
        if (ws is null)
            return BadRequest("Aucune feuille trouvée.");

        int rowCount = ws.Dimension?.Rows ?? 0;
        int imported = 0;
        var errors = new List<string>();

        for (int row = 2; row <= rowCount; row++)
        {
            var nom = ws.Cells[row, 1].Text?.Trim();
            var prenom = ws.Cells[row, 2].Text?.Trim();
            var email = ws.Cells[row, 3].Text?.Trim();
            var role = ws.Cells[row, 4].Text?.Trim();
            var poste = ws.Cells[row, 5].Text?.Trim();

            if (string.IsNullOrWhiteSpace(nom) || string.IsNullOrWhiteSpace(email))
                continue;

            if (await _userManager.FindByEmailAsync(email) is not null)
            {
                errors.Add($"Ligne {row}: {email} existe déjà.");
                continue;
            }

            if (!string.IsNullOrWhiteSpace(role) && !await _roleManager.RoleExistsAsync(role))
            {
                errors.Add($"Ligne {row}: Rôle '{role}' invalide.");
                continue;
            }

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                Nom = nom,
                Prenom = prenom ?? "",
                Poste = string.IsNullOrWhiteSpace(poste) ? null : poste,
                EmailConfirmed = true,
                EstActif = true,
                EstApprouve = true
            };

            var result = await _userManager.CreateAsync(user, "Temp1234!");
            if (!result.Succeeded)
            {
                errors.Add($"Ligne {row}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                continue;
            }

            if (!string.IsNullOrWhiteSpace(role))
                await _userManager.AddToRoleAsync(user, role);

            imported++;
        }

        return Ok(new { imported, errors });
    }

    /// <summary>
    /// Returns all available roles.
    /// </summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
    {
        var roles = await _context.Roles.OrderBy(r => r.Name).ToListAsync(cancellationToken);
        return Ok(roles.Select(r => new { r.Id, r.Name }));
    }

    /// <summary>
    /// Changes the current user's password.
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest("Tous les champs sont requis.");

        if (request.NewPassword != request.ConfirmPassword)
            return BadRequest("Le nouveau mot de passe et la confirmation ne correspondent pas.");

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            return BadRequest(errors);
        }

        return Ok(new { message = "Mot de passe modifié avec succès." });
    }

    private async Task<Dictionary<string, string>> GetRoleMap(IEnumerable<string> userIds, CancellationToken cancellationToken)
    {
        var ids = userIds.ToHashSet();

        var userRoles = await _context.UserRoles
            .Where(ur => ids.Contains(ur.UserId))
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name })
            .ToListAsync(cancellationToken);

        return userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => g.First().RoleName ?? "Inconnu");
    }
}

public record ApproveUserRequest
{
    public string Role { get; init; } = default!;
    public string? Poste { get; init; }
}

public record UpdateUserRoleRequest
{
    public string? Role { get; init; }
    public string? Poste { get; init; }
}

public record ChangePasswordRequest
{
    public string CurrentPassword { get; init; } = default!;
    public string NewPassword { get; init; } = default!;
    public string ConfirmPassword { get; init; } = default!;
}
