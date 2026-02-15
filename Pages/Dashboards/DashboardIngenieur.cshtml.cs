using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages.Dashboards
{
    [Authorize(Policy = "RequireIngenieur")]
    public class DashboardIngenieurModel : PageModel
    {
        public void OnGet()
        {
        }
    }
}
