using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Pages
{
    [AllowAnonymous]
    public class LoginModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public LoginModel(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        [BindProperty]
        [Required(ErrorMessage = "L'email est requis.")]
        [EmailAddress(ErrorMessage = "Format d'email invalide.")]
        [Display(Name = "Email")]
        public string Email { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "Le mot de passe est requis.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mot de passe")]
        public string Password { get; set; } = default!;

        public string? ErrorMessage { get; set; }

        public void OnGet() { }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                ErrorMessage = "Veuillez remplir tous les champs correctement.";
                return Page();
            }

            var user = await _userManager.FindByEmailAsync(Email);
            if (user is null || !user.EstActif)
            {
                ErrorMessage = "Email ou mot de passe incorrect.";
                return Page();
            }

            var result = await _signInManager.PasswordSignInAsync(
                user, Password, isPersistent: false, lockoutOnFailure: true);

            if (result.IsLockedOut)
            {
                ErrorMessage = "Compte verrouillé suite à trop de tentatives. Réessayez plus tard.";
                return Page();
            }

            if (!result.Succeeded)
            {
                ErrorMessage = "Email ou mot de passe incorrect.";
                return Page();
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault();

            return role switch
            {
                "Gerant" or "CoGerant" => RedirectToPage("/Dashboards/DashboardGerant"),
                "DirecteurTechnique" => RedirectToPage("/Dashboards/DashboardTechnique"),
                "Ingenieur" => RedirectToPage("/Dashboards/DashboardIngenieur"),
                "Secretaire" => RedirectToPage("/Dashboards/DashboardSecretaire"),
                _ => RedirectToPage("/Login")
            };
        }
    }
}
