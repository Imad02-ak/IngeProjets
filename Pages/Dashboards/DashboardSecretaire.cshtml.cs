using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages.Dashboards
{
    [Authorize(Policy = "RequireSecretaire")]
    public class DashboardSecretaireModel : PageModel
    {
        public void OnGet()
        {
        }
    }
}
