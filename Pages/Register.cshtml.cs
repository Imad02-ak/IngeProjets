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
        private readonly SignInManager<ApplicationUser> _signInManager;

        public RegisterModel(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [BindProperty]
        [Required(ErrorMessage = "Le nom est requis.")]
        [StringLength(100)]
        [Display(Name = "Nom")]
        public string Nom { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "Le prénom est requis.")]
        [StringLength(100)]
        [Display(Name = "Prénom")]
        public string Prenom { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "L'email est requis.")]
        [EmailAddress(ErrorMessage = "Format d'email invalide.")]
        [Display(Name = "Email")]
        public string Email { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "Le mot de passe est requis.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Le mot de passe doit contenir au moins 6 caractères.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mot de passe")]
        public string Password { get; set; } = default!;

        [BindProperty]
        [Required(ErrorMessage = "La confirmation est requise.")]
        [DataType(DataType.Password)]
        [Compare(nameof(Password), ErrorMessage = "Les mots de passe ne correspondent pas.")]
        [Display(Name = "Confirmer le mot de passe")]
        public string ConfirmPassword { get; set; } = default!;

        public string? Message { get; set; }
        public bool IsSuccess { get; set; }

        public void OnGet() { }

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
                EmailConfirmed = true,
                EstActif = true
            };

            var result = await _userManager.CreateAsync(user, Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                Message = "Erreur lors de la création du compte.";
                IsSuccess = false;
                return Page();
            }

            // Par défaut, les nouveaux utilisateurs sont ingénieurs
            await _userManager.AddToRoleAsync(user, "Ingenieur");

            Message = "Compte créé avec succès ! Vous pouvez maintenant vous connecter.";
            IsSuccess = true;
            return Page();
        }
    }
}
