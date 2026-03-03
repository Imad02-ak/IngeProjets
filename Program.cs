using IngeProjets.Data;
using IngeProjets.Data.Models;
using IngeProjets.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// --- Entity Framework Core + SQL Server ---
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- ASP.NET Core Identity ---
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Mot de passe : minimum 8 caractères, majuscule, chiffre, caractère spécial
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredUniqueChars = 4;

    // Verrouillage du compte
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // Utilisateur
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// --- Configuration des cookies d'authentification ---
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Login";
    options.LogoutPath = "/Logout";
    options.AccessDeniedPath = "/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.IsEssential = true;
    options.Cookie.Name = "IngeProjets.Auth";
});

// --- Authorization Policies (Rôles / Policies) ---
builder.Services.AddAuthorization(options =>
{
    // --- Policies par rôle individuel ---
    options.AddPolicy("RequireGerant", policy =>
        policy.RequireRole("Gerant"));

    options.AddPolicy("RequireGerantOuCoGerant", policy =>
        policy.RequireRole("Gerant", "CoGerant"));

    options.AddPolicy("RequireDirecteurTechnique", policy =>
        policy.RequireRole("DirecteurTechnique"));

    options.AddPolicy("RequireIngenieur", policy =>
        policy.RequireRole("Ingenieur"));

    options.AddPolicy("RequireSecretaire", policy =>
        policy.RequireRole("Secretaire"));

    // --- Policies fonctionnelles ---

    // Direction + DirecteurTechnique : gestion projets, archivage tâches
    options.AddPolicy("RequireEncadrement", policy =>
        policy.RequireRole("Gerant", "CoGerant", "DirecteurTechnique"));

    options.AddPolicy("RequireAuthenticated", policy =>
        policy.RequireAuthenticatedUser());

    // Création/modification de tâches : encadrement + ingénieur
    options.AddPolicy("RequireTechnique", policy =>
        policy.RequireRole("Gerant", "CoGerant", "DirecteurTechnique", "Ingenieur"));

    // Gestion financière (montants, devis, situations, factures)
    options.AddPolicy("RequireGestionFinanciere", policy =>
        policy.RequireRole("Gerant", "CoGerant", "DirecteurTechnique", "Secretaire"));

    // Création/gestion de rapports et documents
    options.AddPolicy("RequireRapports", policy =>
        policy.RequireRole("Gerant", "CoGerant", "DirecteurTechnique", "Secretaire"));

    // Archives : uniquement direction
    options.AddPolicy("RequireArchives", policy =>
        policy.RequireRole("Gerant", "CoGerant"));

    // Gestion utilisateurs : uniquement direction
    options.AddPolicy("RequireGestionUtilisateurs", policy =>
        policy.RequireRole("Gerant", "CoGerant"));
});

// --- Anti-forgery (CSRF) ---
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// --- Razor Pages ---
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Dashboards");
    options.Conventions.AllowAnonymousToPage("/Login");
    options.Conventions.AllowAnonymousToPage("/Register");
    options.Conventions.AllowAnonymousToPage("/AccessDenied");
    options.Conventions.AllowAnonymousToPage("/Logout");
    options.Conventions.AllowAnonymousToPage("/Index");
});

builder.Services.AddControllers();
builder.Services.AddScoped<ProjetProgressionService>();
builder.Services.AddScoped<ProjectMontantService>();
builder.Services.AddScoped<PvPdfService>();
builder.Services.AddScoped<NotificationService>();

var app = builder.Build();

// --- Seed : rôles + utilisateurs par défaut ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await DbInitializer.SeedAsync(services);
}

// --- Middleware Pipeline ---
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

// --- Security headers ---
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
});

app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();

app.Run();
