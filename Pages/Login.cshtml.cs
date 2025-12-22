using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages
{
    public class LoginModel : PageModel
    {
        [BindProperty]
        public required string Email { get; set; }

        [BindProperty]
        public required string Password { get; set; }

        public required string ErrorMessage { get; set; }

        public IActionResult OnPost()
        {
            // Authentification temporaire (sans BD)
            if (Email == "admin@test.com" && Password == "1234")
            {
                HttpContext.Session.SetString("User", Email);
                return RedirectToPage("/Dashboard");
            }

            ErrorMessage = "Email ou mot de passe incorrect";
            return Page();
        }
    }
}
