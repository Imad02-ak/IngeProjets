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
        private readonly ILogger<LoginModel> _logger;

        public LoginModel(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ILogger<LoginModel> logger)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _logger = logger;
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
                _logger.LogWarning("Tentative de connexion \u00e9chou\u00e9e : utilisateur introuvable ou inactif ({Email})", Email);
                ErrorMessage = "Email ou mot de passe incorrect.";
                return Page();
            }

            if (!user.EstApprouve)
            {
                _logger.LogWarning("Tentative de connexion d'un compte non approuv\u00e9 ({Email})", Email);
                ErrorMessage = "Votre inscription est en attente d'approbation par le g\u00e9rant.";
                return Page();
            }

            var result = await _signInManager.PasswordSignInAsync(
                user, Password, isPersistent: false, lockoutOnFailure: true);

            if (result.IsLockedOut)
            {
                _logger.LogWarning("Compte verrouill\u00e9 apr\u00e8s trop de tentatives ({Email})", Email);
                ErrorMessage = "Compte verrouill\u00e9 suite \u00e0 trop de tentatives. R\u00e9essayez plus tard.";
                return Page();
            }

            if (!result.Succeeded)
            {
                _logger.LogWarning("Tentative de connexion \u00e9chou\u00e9e : mot de passe incorrect ({Email})", Email);
                ErrorMessage = "Email ou mot de passe incorrect.";
                return Page();
            }

            _logger.LogInformation("Connexion r\u00e9ussie pour {Email}", Email);

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
