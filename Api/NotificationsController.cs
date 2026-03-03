using IngeProjets.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngeProjets.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Returns the latest notifications (max 20).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var notifications = await _context.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.DateCreation)
            .Take(20)
            .Select(n => new
            {
                n.Id,
                n.Message,
                Type = n.Type.ToString(),
                n.Icon,
                n.Couleur,
                n.EntityType,
                n.EntityId,
                n.EstLue,
                n.DateCreation
            })
            .ToListAsync(cancellationToken);

        return Ok(notifications);
    }

    /// <summary>Returns the count of unread notifications.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var count = await _context.Notifications
            .CountAsync(n => !n.EstLue, cancellationToken);

        return Ok(new { count });
    }

    /// <summary>Marks a single notification as read.</summary>
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken)
    {
        var notification = await _context.Notifications.FindAsync([id], cancellationToken);
        if (notification is null)
            return NotFound();

        notification.EstLue = true;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok();
    }

    /// <summary>Marks all notifications as read.</summary>
    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        await _context.Notifications
            .Where(n => !n.EstLue)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.EstLue, true), cancellationToken);

        return Ok();
    }
}
