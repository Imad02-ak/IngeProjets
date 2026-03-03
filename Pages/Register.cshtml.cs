using IngeProjets.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Pages
{
    [AllowAnonymous]
    public class RegisterModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<RegisterModel> _logger;

        private static readonly string[] AllRoles =
            ["Gerant", "CoGerant", "DirecteurTechnique", "Ingenieur", "Secretaire"];

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

        /// <summary>
        /// Role selected by admin during registration. Only usable when a Gerant is logged in.
        /// </summary>
        [BindProperty]
        [Display(Name = "R\u00f4le")]
        public string? SelectedRole { get; set; }

        public string? Message { get; set; }
        public bool IsSuccess { get; set; }

        /// <summary>True when the current user is a Gerant (can assign roles and auto-approve).</summary>
        public bool IsAdmin { get; set; }

        public List<SelectListItem> RoleOptions { get; set; } = [];

        public async Task OnGetAsync()
        {
            await PreparePageAsync();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            await PreparePageAsync();

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
                EstApprouve = IsAdmin
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

            var role = IsAdmin && !string.IsNullOrWhiteSpace(SelectedRole) && AllRoles.Contains(SelectedRole)
                ? SelectedRole
                : "Ingenieur";

            await _userManager.AddToRoleAsync(user, role);

            _logger.LogInformation("Nouveau compte cr\u00e9\u00e9 : {Email}, R\u00f4le : {Role}, Approuv\u00e9 : {Approved}",
                user.Email, role, user.EstApprouve);

            Message = IsAdmin
                ? $"Compte cr\u00e9\u00e9 et approuv\u00e9 avec le r\u00f4le {role}."
                : "Votre demande d'inscription a \u00e9t\u00e9 envoy\u00e9e. Un administrateur doit l'approuver.";
            IsSuccess = true;
            return Page();
        }

        private async Task PreparePageAsync()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser is not null)
                {
                    var roles = await _userManager.GetRolesAsync(currentUser);
                    IsAdmin = roles.Contains("Gerant");
                }
            }

            RoleOptions = AllRoles
                .Select(r => new SelectListItem(r, r))
                .ToList();
        }
    }
}
