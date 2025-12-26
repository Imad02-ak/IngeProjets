using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IngeProjets.Pages
{
    public class RegisterModel : PageModel
    {
        [BindProperty] public required string Nom { get; set; }
        [BindProperty] public required string Prenom { get; set; }
        [BindProperty] public required string Email { get; set; }
        [BindProperty] public required string Password { get; set; }
        [BindProperty] public required string ConfirmPassword { get; set; }

        public required string Message { get; set; }

        public IActionResult OnPost()
        {
            if (Password != ConfirmPassword)
            {
                Message = "Les mots de passe ne correspondent pas";
                return Page();
            }

            Message = "Compte créé avec succès (simulation)";
            return Page();
        }
    }
}
