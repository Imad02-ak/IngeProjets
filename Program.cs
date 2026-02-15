using IngeProjets.Data;
using IngeProjets.Data.Models;
using IngeProjets.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Entity Framework Core + SQL Server ---
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- ASP.NET Core Identity ---
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Mot de passe
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = true;

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
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// --- Authorization Policies (Rôles / Policies) ---
builder.Services.AddAuthorization(options =>
{
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

    options.AddPolicy("RequireEncadrement", policy =>
        policy.RequireRole("Gerant", "CoGerant", "DirecteurTechnique"));

    options.AddPolicy("RequireAuthenticated", policy =>
        policy.RequireAuthenticatedUser());
});

// --- Razor Pages ---
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Dashboards");
    options.Conventions.AllowAnonymousToPage("/Login");
    options.Conventions.AllowAnonymousToPage("/Register");
    options.Conventions.AllowAnonymousToPage("/AccessDenied");
    options.Conventions.AllowAnonymousToPage("/Logout");
});

builder.Services.AddControllers();
builder.Services.AddScoped<ProjetProgressionService>();

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
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();

app.Run();
