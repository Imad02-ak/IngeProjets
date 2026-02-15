using IngeProjets.Data;
using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public UsersController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Where(u => ((ApplicationUser)u).EstActif)
            .Cast<ApplicationUser>()
            .OrderBy(u => u.Nom)
            .ToListAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToHashSet();

        var userRoles = await _context.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name })
            .ToListAsync(cancellationToken);

        var rolesByUserId = userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => g.First().RoleName ?? "Inconnu");

        var result = users.Select(user => new
        {
            user.Id,
            user.Nom,
            user.Prenom,
            user.NomComplet,
            user.Email,
            Role = rolesByUserId.GetValueOrDefault(user.Id, "Inconnu"),
            user.EstActif,
            user.DateCreation
        });

        return Ok(result);
    }

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
            user.EstActif,
            user.DateCreation
        });
    }
}
