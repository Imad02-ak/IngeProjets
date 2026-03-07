using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Pages
{
    [AllowAnonymous]
    public class RegisterModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<RegisterModel> _logger;

        public RegisterModel(
            UserManager<ApplicationUser> userManager,
            ILogger<RegisterModel> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        [BindProperty]
        [Required(ErrorMessage = "Le nom est requis.")]
        [StringLength(100)]
        [Display(Name = "Nom")]
        public string Nom { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "Le pr\u00e9nom est requis.")]
        [StringLength(100)]
        [Display(Name = "Pr\u00e9nom")]
        public string Prenom { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "L'email est requis.")]
        [EmailAddress(ErrorMessage = "Format d'email invalide.")]
        [Display(Name = "Email")]
        public string Email { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "Le mot de passe est requis.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caract\u00e8res, avec une majuscule, un chiffre et un caract\u00e8re sp\u00e9cial.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mot de passe")]
        public string Password { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "La confirmation est requise.")]
        [DataType(DataType.Password)]
        [Compare(nameof(Password), ErrorMessage = "Les mots de passe ne correspondent pas.")]
        [Display(Name = "Confirmer le mot de passe")]
        public string ConfirmPassword { get; set; } = default!;

        [BindProperty]
        [StringLength(200)]
        [Display(Name = "Poste")]
        public string? Poste { get; set; }

        public string? Message { get; set; }
        public bool IsSuccess { get; set; }

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            var user = new ApplicationUser
            {
                UserName = Email,
                Email = Email,
                Nom = Nom,
                Prenom = Prenom,
                Poste = Poste,
                EmailConfirmed = true,
                EstActif = true,
                EstApprouve = false
            };

            var result = await _userManager.CreateAsync(user, Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                Message = "Erreur lors de la cr\u00e9ation du compte.";
                IsSuccess = false;
                return Page();
            }

            _logger.LogInformation("Nouveau compte cr\u00e9\u00e9 : {Email}, En attente d'approbation", user.Email);

            Message = "Votre demande d'inscription a \u00e9t\u00e9 envoy\u00e9e. Un administrateur doit l'approuver.";
            IsSuccess = true;
            return Page();
        }
    }
}
