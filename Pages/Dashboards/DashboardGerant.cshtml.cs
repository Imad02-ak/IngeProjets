using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages.Dashboards
{
    [Authorize(Policy = "RequireGerantOuCoGerant")]
    public class DashboardGerantModel : PageModel
    {
        public void OnGet()
        {
        }
    }
}
