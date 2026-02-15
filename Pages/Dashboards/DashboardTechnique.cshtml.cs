using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages.Dashboards
{
    [Authorize(Policy = "RequireDirecteurTechnique")]
    public class DashboardTechniqueModel : PageModel
    {
        public void OnGet()
        {
        }
    }
}
