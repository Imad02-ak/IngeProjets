using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages
{
    public class LoginModel : PageModel
    {
        [BindProperty] public required string Email { get; set; }
        [BindProperty] public required string Password { get; set; }

        public required string ErrorMessage { get; set; }

        public IActionResult OnPost()
        {
            // Simulation sans base de données
            if (Email == "admin@test.com" && Password == "1234")
            {
                return RedirectToPage("/Dashboard");
            }

            ErrorMessage = "Email ou mot de passe incorrect";
            return Page();
        }
    }
}
