// ==========================================
// INGÉ-PROJETS - GESTION TRAVAUX PUBLICS
// Application SPA JavaScript
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // ===========================
    // HELPERS
    // ===========================
    const $ = (id) => document.getElementById(id);
    const $$ = (selector) => document.querySelectorAll(selector);
    const $q = (selector) => document.querySelector(selector);

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    // ===========================
    // API HELPERS & DATA CACHE
    // ===========================
    async function api(url, options = {}) {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json", ...options.headers },
            ...options,
        });
        if (res.status === 401) { window.location.href = "/Login"; return null; }
        if (!res.ok) return null;
        if (res.status === 204) return true;
        return res.json();
    }

    // Resolve the locale string for the current language setting
    function appLocale() {
        return window._appLang === "en" ? "en-GB" : "fr-FR";
    }

    // Global date formatting utility (uses settings)
    window.formatAppDate = function (dateStr, opts) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        if (isNaN(d)) return "—";
        if (opts) return d.toLocaleDateString(appLocale(), opts);
        const fmt = window._appDateFormat || "dd/MM/yyyy";
        if (fmt === "yyyy-MM-dd") return d.toISOString().slice(0, 10);
        if (fmt === "MM/dd/yyyy") {
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${mm}/${dd}/${d.getFullYear()}`;
        }
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getFullYear()}`;
    };

    // Global currency formatting utility
    window.formatAppCurrency = function (amount) {
        if (amount == null || isNaN(amount)) return "—";
        const sym = window._appCurrencySymbol || "DA";
        const num = Number(amount).toLocaleString(appLocale(), { maximumFractionDigits: 0 });
        return `${num} ${sym}`;
    };

    // Budget display helper: shows value in millions with currency symbol
    function fmtBudgetM(amount, decimals) {
        const d = decimals ?? 1;
        const sym = window._appCurrencySymbol || "DA";
        return `${(amount / 1000000).toFixed(d)}M ${sym}`;
    }

    // Currency icon class based on current setting
    function currencyIconClass() {
        return (window._appCurrency || "DZD") === "EUR" ? "fa-euro-sign" : "fa-coins";
    }

    let cachedProjects = [];
    let cachedTasks = [];
    let cachedUsers = [];
    let cachedBudgetData = null;

    const typeLabels = { Route: "Routes & Autoroutes", Pont: "Ponts & Viaducs", Batiment: "Bâtiments Publics", Assainissement: "Assainissement", Energie: "Énergie & Réseaux" };
    const statusLabels = { EnPlanification: "En planification", EnCours: "En cours", EnPause: "En pause", EnRetard: "En retard", Termine: "Terminé" };
    const prioriteLabels = { Basse: "Basse", Moyenne: "Moyenne", Haute: "Haute", Urgente: "Urgent" };
    const statusCssMap = { EnCours: "progress", EnRetard: "warning", Termine: "success", EnPlanification: "info", EnPause: "info" };
    const prioriteCssMap = { Basse: "low", Moyenne: "medium", Haute: "high", Urgente: "urgent" };
    const taskStatusMap = { AFaire: "todo", EnCours: "progress", EnRevue: "review", Terminee: "done" };
    const typeIconMap = { Route: "road", Pont: "bridge", Batiment: "building", Assainissement: "droplet", Energie: "bolt" };

    async function loadProjects() {
        const data = await api("/api/projects");
        if (data) cachedProjects = data;
        return cachedProjects;
    }
    async function loadTasks() {
        const data = await api("/api/tasks");
        if (data) cachedTasks = data;
        return cachedTasks;
    }
    async function loadUsers() {
        const data = await api("/api/users");
        if (data) cachedUsers = data;
        return cachedUsers;
    }
    async function loadBudgetData() {
        const data = await api("/api/budgets");
        if (data) cachedBudgetData = data;
        return cachedBudgetData;
    }

    async function populateDropdowns() {
        const users = await loadUsers();
        const projects = await loadProjects();
        const managerSel = $("projectManager");
        const assigneeSel = $("taskAssignee");
        const taskProjectSel = $("taskProject");
        if (managerSel) {
            managerSel.innerHTML = '<option value="">Sélectionner...</option>' +
                users.map(u => `<option value="${u.id}">${u.nomComplet}</option>`).join("");
        }
        if (assigneeSel) {
            assigneeSel.innerHTML = '<option value="">Non assigné</option>' +
                users.map(u => `<option value="${u.id}">${u.nomComplet}</option>`).join("");
        }
        if (taskProjectSel) {
            taskProjectSel.innerHTML = '<option value="">Sélectionner...</option>' +
                projects.map(p => `<option value="${p.id}">${p.nom}</option>`).join("");
        }
    }

    // ===========================
    // NAVIGATION SPA
    // ===========================
    const pages = {
        dashboard: "page-dashboard",
        projets: "page-projets",
        planning: "page-planning",
        budgets: "page-budgets",
        rapports: "page-rapports",
        archives: "page-archives",
        utilisateurs: "page-utilisateurs",
        parametres: "page-parametres",
        support: "page-support",
    };

    const welcomeTitle = $("pageTitle")?.textContent || "Tableau de bord";

    // ===========================
    // MOBILE SIDEBAR TOGGLE
    // ===========================
    const mobileMenuBtn = $("mobileMenuBtn");
    const sidebarOverlay = $("sidebarOverlay");
    const sidebar = $("sidebar");

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarOverlay) sidebarOverlay.classList.add("active");
        if (mobileMenuBtn) {
            mobileMenuBtn.querySelector("i").className = "fa-solid fa-xmark";
        }
        document.body.style.overflow = "hidden";
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
        if (mobileMenuBtn) {
            mobileMenuBtn.querySelector("i").className = "fa-solid fa-bars";
        }
        document.body.style.overflow = "";
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            if (sidebar && sidebar.classList.contains("open")) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeMobileSidebar);
    }

    function navigateTo(page) {
        // Désactiver tous les nav-items
        $$(".nav-item").forEach((item) => item.classList.remove("active"));

        // Activer le nav-item correspondant
        const activeNav = $q(`.nav-item[data-page="${page}"]`);
        if (activeNav) activeNav.classList.add("active");

        // Masquer toutes les pages
        $$(".page-section").forEach((section) =>
            section.classList.remove("active"),
        );

        // Afficher la page cible
        const targetPage = $(pages[page]);
        if (targetPage) targetPage.classList.add("active");

        // Garder toujours le titre de bienvenue
        const pageTitle = $("pageTitle");
        if (pageTitle)
            pageTitle.textContent = welcomeTitle;

        // Mettre à jour l'URL
        window.history.pushState({ page }, "", `#${page}`);

        // Fermer le menu mobile après navigation
        closeMobileSidebar();

        // Charger les données de la page
        loadPageData(page);
    }

    async function loadPageData(page) {
        switch (page) {
            case "dashboard":
                await renderDashboard();
                break;
            case "projets":
                await renderProjects();
                break;
            case "planning":
                await renderPlanning();
                break;
            case "budgets":
                await renderBudgets();
                break;
            case "rapports":
                await renderReports();
                break;
            case "archives":
                await renderArchives();
                break;
            case "utilisateurs":
                await renderUsers();
                break;
        }
    }

    // Navigation par clic sur sidebar
    const sidebarNav = $q(".sidebar-nav");
    if (sidebarNav) {
        sidebarNav.addEventListener("click", (e) => {
            const item = e.target.closest(".nav-item");
            if (!item) return;
            e.preventDefault();
            const page = item.dataset.page;
            if (page) navigateTo(page);
        });
    }

    // Navigation par liens internes
    document.addEventListener("click", (e) => {
        const link = e.target.closest("[data-nav]");
        if (link) {
            e.preventDefault();
            navigateTo(link.dataset.nav);
        }
    });

    // Gestion du hash URL
    function handleHash() {
        const hash = window.location.hash.slice(1) || "dashboard";
        if (pages[hash]) navigateTo(hash);
    }

    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);

    // ===========================
    // RENDER DASHBOARD
    // ===========================
    async function renderDashboard() {
        const data = await api("/api/dashboard");
        if (!data) return;

        // --- KPIs ---
        const dashKpis = document.querySelectorAll("#page-dashboard .kpi-card");
        if (dashKpis.length >= 4 && data.kpis) {
            const k = data.kpis;
            // Chantiers Actifs
            dashKpis[0].querySelector(".kpi-value").textContent = k.chantiersActifs;
            dashKpis[0].querySelector(".kpi-change").textContent = k.nouveauxCeMois > 0 ? `+${k.nouveauxCeMois} ce mois` : "Aucun nouveau";
            dashKpis[0].querySelector(".kpi-change").className = `kpi-change ${k.nouveauxCeMois > 0 ? 'kpi-change--positive' : 'kpi-change--neutral'}`;
            dashKpis[0].style.cursor = "pointer";
            dashKpis[0].onclick = () => { navigateTo("projets"); setTimeout(() => { const sel = $("filterStatus"); if (sel) { sel.value = "progress"; sel.dispatchEvent(new Event("change")); } }, 300); };

            // Projets Terminés
            dashKpis[1].querySelector(".kpi-value").textContent = k.projetsTermines;
            dashKpis[1].querySelector(".kpi-change").textContent = k.projetsTermines > 0 ? `${k.projetsTermines} terminé(s)` : "Aucun terminé";
            dashKpis[1].querySelector(".kpi-change").className = `kpi-change ${k.projetsTermines > 0 ? 'kpi-change--positive' : 'kpi-change--neutral'}`;
            dashKpis[1].style.cursor = "pointer";
            dashKpis[1].onclick = () => { navigateTo("projets"); setTimeout(() => { const sel = $("filterStatus"); if (sel) { sel.value = "completed"; sel.dispatchEvent(new Event("change")); } }, 300); };

            // Alertes (En Retard)
            dashKpis[2].querySelector(".kpi-value").textContent = k.alertes;
            dashKpis[2].querySelector(".kpi-change").textContent = k.alertes > 0 ? `${k.alertes} en retard` : "Aucune alerte";
            dashKpis[2].querySelector(".kpi-change").className = `kpi-change ${k.alertes > 0 ? 'kpi-change--negative' : 'kpi-change--positive'}`;
            dashKpis[2].style.cursor = "pointer";
            dashKpis[2].onclick = () => { navigateTo("projets"); setTimeout(() => { const sel = $("filterStatus"); if (sel) { sel.value = "delayed"; sel.dispatchEvent(new Event("change")); } }, 300); };

            // Montant Total (replace Budget Total)
            dashKpis[3].querySelector(".kpi-value").textContent = formatAppCurrency(k.montantTotal);
            dashKpis[3].querySelector(".kpi-change").textContent = `${k.budgetUtilise}% utilisé`;
            dashKpis[3].querySelector(".kpi-change").className = `kpi-change ${k.budgetUtilise > 90 ? 'kpi-change--negative' : k.budgetUtilise > 70 ? 'kpi-change--warning' : 'kpi-change--neutral'}`;
            dashKpis[3].style.cursor = "pointer";
            dashKpis[3].onclick = () => { navigateTo("budgets"); };
        }

        // --- Chantiers Récents ---
        const recentProjectsEl = $("recentProjects");
        if (recentProjectsEl && data.projetsRecents) {
            if (data.projetsRecents.length === 0) {
                recentProjectsEl.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;"><p style="color:var(--text-tertiary)">Aucun chantier récent</p></div>';
            } else {
                recentProjectsEl.innerHTML = data.projetsRecents.map(p => {
                    const ti = typeIconMap[p.type] || "folder";
                    return `
                    <div class="project-item" style="cursor:pointer" data-nav-project="${p.id}">
                      <div class="project-info">
                        <div class="project-name"><i class="fa-solid fa-${ti}" style="margin-right:6px;opacity:.6"></i>${esc(p.nom)}</div>
                        <div class="project-meta">
                          <span><i class="fa-solid fa-map-marker-alt"></i> ${esc(p.localisation || 'Non défini')}</span>
                          <span style="margin-left:10px"><i class="fa-solid fa-chart-line"></i> ${p.avancement}%</span>
                          ${p.chefProjet ? `<span style="margin-left:10px"><i class="fa-solid fa-user"></i> ${esc(p.chefProjet)}</span>` : ''}
                        </div>
                      </div>
                      <span class="project-status status--${statusCssMap[p.statut] || 'info'}">
                        ${statusLabels[p.statut] || p.statut}
                      </span>
                    </div>`;
                }).join("");
            }
        }

        // --- Activité Récente ---
        const activityEl = $("activityTimeline");
        if (activityEl && data.activites) {
            if (data.activites.length === 0) {
                activityEl.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;"><p style="color:var(--text-tertiary)">Aucune activité récente</p></div>';
            } else {
                activityEl.innerHTML = data.activites.map(a => {
                    const timeAgo = getTimeAgo(a.date);
                    const hasNav = a.entityType && a.entityId;
                    return `
                    <div class="activity-item${hasNav ? ' activity-item--clickable' : ''}" ${hasNav ? `data-activity-type="${a.entityType}" data-activity-id="${a.entityId}"` : ''} style="${hasNav ? 'cursor:pointer' : ''}">
                      <div class="activity-icon activity-icon--${a.couleur}">
                        <i class="fa-solid ${a.icon}"></i>
                      </div>
                      <div class="activity-content">
                        <div class="activity-text">${esc(a.texte)}</div>
                        <div class="activity-time">${timeAgo}</div>
                      </div>
                      ${hasNav ? '<div class="activity-arrow"><i class="fa-solid fa-chevron-right"></i></div>' : ''}
                    </div>`;
                }).join("");
            }
        }

        // --- Échéances Proches ---
        const upcomingEl = $("upcomingTasks");
        if (upcomingEl && data.echeancesProches) {
            if (data.echeancesProches.length === 0) {
                upcomingEl.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;"><p style="color:var(--text-tertiary)">Aucune échéance proche</p></div>';
            } else {
                upcomingEl.innerHTML = data.echeancesProches.map(t => {
                    const date = new Date(t.dateEcheance);
                    const pc = prioriteCssMap[t.priorite] || "medium";
                    const daysLeft = Math.ceil((date - new Date()) / 86400000);
                    const urgency = daysLeft <= 2 ? 'urgent' : daysLeft <= 7 ? 'soon' : 'normal';
                    return `
                    <div class="upcoming-item upcoming-item--${urgency}" data-upcoming-task-id="${t.id}" style="cursor:pointer">
                      <div class="upcoming-date">
                        <div class="day">${date.getDate()}</div>
                        <div class="month">${date.toLocaleDateString(appLocale(), { month: "short" })}</div>
                      </div>
                      <div class="upcoming-info">
                        <div class="upcoming-title">${esc(t.titre)}</div>
                        <div class="upcoming-project">
                          <span><i class="fa-solid fa-folder"></i> ${esc(t.projet)}</span>
                          ${t.assigneA ? `<span style="margin-left:8px"><i class="fa-solid fa-user"></i> ${esc(t.assigneA)}</span>` : ''}
                        </div>
                      </div>
                      <div class="upcoming-meta">
                        <span class="project-card-priority priority-${pc}" style="font-size:10px;padding:1px 6px">${prioriteLabels[t.priorite] || t.priorite}</span>
                        <span class="upcoming-days-left">${daysLeft <= 0 ? "Aujourd'hui" : daysLeft === 1 ? 'Demain' : daysLeft + 'j'}</span>
                      </div>
                    </div>`;
                }).join("");
            }
        }

        initDashboardCharts(data);
    }

    // Time-ago helper for activity feed
    function getTimeAgo(dateStr) {
        if (!dateStr) return "";
        // Server returns UTC dates; ensure the string is parsed as UTC
        const raw = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
        const d = new Date(raw);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMs / 3600000);
        const diffD = Math.floor(diffMs / 86400000);
        if (diffMin < 1) return "À l'instant";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffH < 24) return `Il y a ${diffH}h`;
        if (diffD === 1) return "Hier";
        if (diffD < 7) return `Il y a ${diffD} jours`;
        return formatAppDate(dateStr, { day: "numeric", month: "short" });
    }

    // Evolution chart: load from dedicated filtered endpoint
    async function loadEvolutionChart(period) {
        const projectsChartEl = $("projectsChart");
        if (!projectsChartEl || !window.Chart) return;

        const evoData = await api(`/api/dashboard/evolution?period=${period}`);
        if (!evoData) return;

        const ctx = projectsChartEl.getContext("2d");
        if (projectsChartEl.chartInstance) {
            projectsChartEl.chartInstance.destroy();
        }

        const evoLabels = evoData.map(e => e.label);
        const evoActifs = evoData.map(e => e.actifs);
        const evoTermines = evoData.map(e => e.termines);
        const evoEnRetard = evoData.map(e => e.enRetard);
        const evoEnPause = evoData.map(e => e.enPause);

        projectsChartEl.chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: evoLabels,
                datasets: [
                    {
                        label: "Projets actifs",
                        data: evoActifs,
                        borderColor: "#e50908",
                        backgroundColor: "rgba(229, 9, 8, 0.1)",
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: "Projets terminés",
                        data: evoTermines,
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: "En retard",
                        data: evoEnRetard,
                        borderColor: "#f59e0b",
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: "En pause",
                        data: evoEnPause,
                        borderColor: "#6b7280",
                        backgroundColor: "rgba(107, 114, 128, 0.08)",
                        fill: true,
                        tension: 0.4,
                        borderDash: [5, 5],
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" },
                },
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });
    }

    // Wire chart period filter
    $("chartPeriod")?.addEventListener("change", (e) => {
        loadEvolutionChart(e.target.value);
    });

    function initDashboardCharts(data) {
        // Load evolution chart with current filter value
        const period = $("chartPeriod")?.value || "month";
        loadEvolutionChart(period);

        // Type Distribution Chart - with real data from API
        const typeChartEl = $("typeChart");
        if (typeChartEl && window.Chart) {
            const ctx = typeChartEl.getContext("2d");

            if (typeChartEl.chartInstance) {
                typeChartEl.chartInstance.destroy();
            }

            const typeColorMap = {
                Route: "#e50908",
                Pont: "#f1d00e",
                Batiment: "#3b82f6",
                Assainissement: "#10b981",
                Energie: "#8b5cf6"
            };

            const chartLabels = data?.parType ? data.parType.map(t => typeLabels[t.type] || t.type) : [];
            const chartData = data?.parType ? data.parType.map(t => t.count) : [];
            const chartColors = data?.parType ? data.parType.map(t => typeColorMap[t.type] || "#9ca3af") : [];

            // Map API type keys to filter dropdown values
            const typeToFilter = { Route: "route", Pont: "pont", Batiment: "batiment", Assainissement: "assainissement", Energie: "energie" };
            const typeApiKeys = data?.parType ? data.parType.map(t => t.type) : [];

            typeChartEl.chartInstance = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: chartLabels,
                    datasets: [
                        {
                            data: chartData,
                            backgroundColor: chartColors,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom" },
                    },
                    onClick: (evt, elements) => {
                        if (elements.length > 0) {
                            const idx = elements[0].index;
                            const apiType = typeApiKeys[idx];
                            const filterVal = typeToFilter[apiType];
                            if (filterVal) {
                                navigateTo("projets");
                                setTimeout(() => {
                                    const sel = $("filterType");
                                    if (sel) { sel.value = filterVal; sel.dispatchEvent(new Event("change")); }
                                }, 300);
                            }
                        }
                    },
                },
            });
            typeChartEl.style.cursor = "pointer";
        }
    }

    // ===========================
    // RENDER PROJECTS
    // ===========================
    async function renderProjects() {
        const projects = await loadProjects();
        const filtered = getFilteredProjects();
        renderProjectCards(filtered);
        renderProjectsTableFiltered(filtered);
        updateProjectStats(filtered);
    }

    function updateProjectStats(projects) {
        const el = (id, val) => { const e = $(id); if (e) e.textContent = val; };
        el("totalProjectsCount", projects.length);
        el("progressProjectsCount", projects.filter(p => p.statut === "EnCours").length);
        el("delayedProjectsCount", projects.filter(p => p.statut === "EnRetard").length);
        el("completedProjectsCount", projects.filter(p => p.statut === "Termine").length);
    }

    // ===========================
    // RENDER PLANNING
    // ===========================
    let calendarYear = new Date().getFullYear();
    let calendarMonth = new Date().getMonth();

    async function renderPlanning() {
        await Promise.all([loadTasks(), loadProjects()]);
        renderPlanningStats();
        renderPlanningKpis();
        renderCalendar();
        renderKanban();
        // Gantt is default active view
        const ganttViewEl = $("ganttView");
        if (ganttViewEl && (ganttViewEl.classList.contains("active") || !document.querySelector('.planning-view.active'))) {
            renderGantt();
        }
        // Populate dependency dropdown for create modal (filtered by selected project)
        const selectedProjectId = $("taskProject")?.value ? parseInt($("taskProject").value) : null;
        populateTaskDependencyDropdown("taskDependance", null, selectedProjectId);
    }

    function renderPlanningKpis() {
        const total = cachedTasks.length;
        const done = cachedTasks.filter(t => t.statut === "Terminee").length;
        const now = new Date(); now.setHours(0,0,0,0);
        const overdue = cachedTasks.filter(t => new Date(t.dateEcheance) < now && t.statut !== "Terminee").length;
        const completedPct = total > 0 ? Math.round(done / total * 100) : 0;

        const upcoming = cachedTasks
            .filter(t => t.statut !== "Terminee" && new Date(t.dateEcheance) >= now)
            .sort((a, b) => new Date(a.dateEcheance) - new Date(b.dateEcheance));
        const nextDeadline = upcoming.length > 0
            ? formatAppDate(upcoming[0].dateEcheance, { day: "numeric", month: "short" })
            : "—";

        const el = (id, val) => { const e = $(id); if (e) e.textContent = val; };
        el("kpiTotalTasks", total);
        el("kpiCompletedPct", completedPct + "%");
        el("kpiDelayedCount", overdue);
        el("kpiNextDeadline", nextDeadline);
    }

    function populateTaskDependencyDropdown(selectId, excludeTaskId, projetId) {
        const sel = $(selectId);
        if (!sel) return;
        const filtered = cachedTasks.filter(t => t.id !== excludeTaskId && (!projetId || t.projetId === projetId));
        sel.innerHTML = '<option value="">Aucune dépendance</option>' +
            filtered
                .map(t => `<option value="${t.id}">${t.titre}</option>`)
                .join("");
    }

    function renderPlanningStats() {
        const total = cachedTasks.length;
        const todo = cachedTasks.filter(t => t.statut === "AFaire").length;
        const progress = cachedTasks.filter(t => t.statut === "EnCours").length;
        const review = cachedTasks.filter(t => t.statut === "EnRevue").length;
        const done = cachedTasks.filter(t => t.statut === "Terminee").length;
        const overdue = cachedTasks.filter(t => new Date(t.dateEcheance) < new Date() && t.statut !== "Terminee").length;

        const statsEl = $("planningStats");
        if (statsEl) {
            statsEl.innerHTML = `
                <div class="planning-stat"><span class="planning-stat-value">${total}</span><span class="planning-stat-label">Total</span></div>
                <div class="planning-stat stat-todo"><span class="planning-stat-value">${todo}</span><span class="planning-stat-label">À faire</span></div>
                <div class="planning-stat stat-progress"><span class="planning-stat-value">${progress}</span><span class="planning-stat-label">En cours</span></div>
                <div class="planning-stat stat-review"><span class="planning-stat-value">${review}</span><span class="planning-stat-label">En revue</span></div>
                <div class="planning-stat stat-done"><span class="planning-stat-value">${done}</span><span class="planning-stat-label">Terminées</span></div>
                ${overdue > 0 ? `<div class="planning-stat stat-overdue"><span class="planning-stat-value">${overdue}</span><span class="planning-stat-label">En retard</span></div>` : ''}
            `;
        }
    }

    function updateCalendarHeader() {
        const periodEl = $("currentPeriod");
        if (periodEl) {
            const d = new Date(calendarYear, calendarMonth, 1);
            periodEl.textContent = d.toLocaleDateString(appLocale(), { month: "long", year: "numeric" });
            periodEl.style.textTransform = "capitalize";
        }
    }

    $("prevMonth")?.addEventListener("click", () => {
        calendarMonth--;
        if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
        updateCalendarHeader();
        renderCalendar();
    });

    $("nextMonth")?.addEventListener("click", () => {
        calendarMonth++;
        if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
        updateCalendarHeader();
        renderCalendar();
    });

    $("todayBtn")?.addEventListener("click", () => {
        calendarYear = new Date().getFullYear();
        calendarMonth = new Date().getMonth();
        updateCalendarHeader();
        renderCalendar();
    });

    function renderCalendar() {
        const calendarGrid = $("calendarGrid");
        if (!calendarGrid) return;

        updateCalendarHeader();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = calendarYear;
        const month = calendarMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay() || 7; // Lundi = 1
        const daysInMonth = lastDay.getDate();

        let html = "";

        // Jours du mois précédent
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i > 0; i--) {
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${prevMonthLastDay - i + 1}</span></div>`;
        }

        // Jours du mois courant
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);
            const isToday = cellDate.getTime() === today.getTime();
            const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            // Tasks due on this day
            const dayTasks = cachedTasks.filter(t => t.dateEcheance && t.dateEcheance.substring(0, 10) === dateStr);
            // Tasks starting on this day
            const startTasks = cachedTasks.filter(t => t.dateDebut && t.dateDebut.substring(0, 10) === dateStr);

            const allDayTasks = [...new Map([...startTasks, ...dayTasks].map(t => [t.id, t])).values()];

            const tasksHtml = allDayTasks.slice(0, 3).map(t => {
                const pc = prioriteCssMap[t.priorite] || "medium";
                const isDue = t.dateEcheance && t.dateEcheance.substring(0, 10) === dateStr;
                const isOverdue = isDue && cellDate < today && t.statut !== "Terminee";
                return `<div class="calendar-event event-${pc}${isOverdue ? ' event-overdue' : ''}" data-task-id="${t.id}" title="${t.titre}">
                    ${isDue ? '<i class="fa-solid fa-flag" style="font-size:8px;margin-right:2px"></i>' : '<i class="fa-solid fa-play" style="font-size:7px;margin-right:2px"></i>'}${t.titre.length > 18 ? t.titre.substring(0, 18) + '…' : t.titre}
                </div>`;
            }).join("");

            const moreCount = allDayTasks.length - 3;
            const moreHtml = moreCount > 0 ? `<div class="calendar-event-more">+${moreCount} de plus</div>` : '';

            html += `<div class="calendar-day${isToday ? " today" : ""}${isWeekend ? " weekend" : ""}">
                <span class="calendar-day-number">${day}</span>
                ${tasksHtml}${moreHtml}
            </div>`;
        }

        // Jours du mois suivant
        const totalCells = startDay - 1 + daysInMonth;
        const rows = Math.ceil(totalCells / 7);
        const remainingDays = rows * 7 - totalCells;
        for (let i = 1; i <= remainingDays; i++) {
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${i}</span></div>`;
        }

        calendarGrid.innerHTML = html;
    }

    const uiStatusToApi = { todo: "AFaire", progress: "EnCours", review: "EnRevue", done: "Terminee" };

    function renderKanban() {
        const kanbanMapping = {
            todo: "kanbanTodo",
            progress: "kanbanProgress",
            review: "kanbanReview",
            done: "kanbanDone",
        };

        Object.keys(kanbanMapping).forEach((uiStatus) => {
            const container = $(kanbanMapping[uiStatus]);
            if (container) {
                const tasks = cachedTasks.filter(t => taskStatusMap[t.statut] === uiStatus);
                container.innerHTML = tasks.map(t => {
                    const initials = (t.assigneA || "?").split(" ").map(n => n[0]).join("");
                    const pc = prioriteCssMap[t.priorite] || "medium";
                    const prog = t.progression || 0;
                    return `
          <div class="kanban-card" draggable="true" data-id="${t.id}">
            <div class="kanban-card-header">
              <span class="kanban-card-priority priority-dot-${pc}"></span>
              <span class="kanban-card-actions-btn" data-task-id="${t.id}"><i class="fa-solid fa-ellipsis"></i></span>
            </div>
            <div class="kanban-card-title">${t.titre}</div>
            <div class="kanban-card-project"><i class="fa-solid fa-folder"></i> ${t.projet}</div>
            <div class="kanban-card-progress">
              <div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div>
              <span>${prog}%</span>
            </div>
            <div class="kanban-card-footer">
              <div class="kanban-card-assignee" title="${t.assigneA || 'Non assigné'}">${initials}</div>
              <div class="kanban-card-due"><i class="fa-solid fa-clock"></i> ${formatAppDate(t.dateEcheance, { day: "numeric", month: "short" })}</div>
            </div>
          </div>`;
                }).join("");
                const countEl = $(`kanban${uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1)}Count`);
                if (countEl) countEl.textContent = tasks.length;
            }
        });

        initKanbanDragDrop();
    }

    // Kanban drag & drop
    function initKanbanDragDrop() {
        let draggedCard = null;

        document.querySelectorAll(".kanban-card[draggable]").forEach(card => {
            card.addEventListener("dragstart", (e) => {
                draggedCard = card;
                card.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", card.dataset.id);
            });
            card.addEventListener("dragend", () => {
                card.classList.remove("dragging");
                draggedCard = null;
                document.querySelectorAll(".kanban-column").forEach(col => col.classList.remove("drag-over"));
            });
        });

        document.querySelectorAll(".kanban-cards").forEach(container => {
            container.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                const col = container.closest(".kanban-column");
                if (col) col.classList.add("drag-over");

                const afterElement = getDragAfterElement(container, e.clientY);
                if (draggedCard) {
                    if (afterElement) {
                        container.insertBefore(draggedCard, afterElement);
                    } else {
                        container.appendChild(draggedCard);
                    }
                }
            });

            container.addEventListener("dragleave", (e) => {
                const col = container.closest(".kanban-column");
                if (col && !col.contains(e.relatedTarget)) col.classList.remove("drag-over");
            });

            container.addEventListener("drop", async (e) => {
                e.preventDefault();
                const col = container.closest(".kanban-column");
                if (col) col.classList.remove("drag-over");

                if (!draggedCard) return;
                const taskId = parseInt(draggedCard.dataset.id);
                const newUiStatus = col?.dataset.status;
                const newApiStatus = uiStatusToApi[newUiStatus];

                if (newApiStatus) {
                    const result = await api(`/api/tasks/${taskId}/status`, {
                        method: "PUT",
                        body: JSON.stringify({ statut: newApiStatus })
                    });
                    if (result) {
                        showToast("success", "Tâche mise à jour", `Statut changé vers "${newApiStatus === 'AFaire' ? 'À faire' : newApiStatus === 'EnCours' ? 'En cours' : newApiStatus === 'EnRevue' ? 'En revue' : 'Terminée'}"`);
                        refreshNotifBadge();
                        cachedTasks = [];
                        cachedProjects = [];
                        await loadTasks();
                        renderKanban();
                        renderGantt();
                    }
                }
            });
        });
    }

    function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll(".kanban-card:not(.dragging)")];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Synchronize planning data
    $("syncCalendarBtn")?.addEventListener("click", async () => {
        const btn = $("syncCalendarBtn");
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-sync fa-spin"></i> Synchronisation...';

        try {
            // Force-refresh cached data
            cachedTasks = [];
            cachedProjects = [];
            await Promise.all([loadTasks(), loadProjects()]);

            // Re-render all planning views
            renderPlanningKpis();
            renderPlanningStats();
            renderCalendar();
            renderKanban();
            renderGantt();

            // Re-render timeline/delayed if they are the active view
            const activeView = document.querySelector(".planning-view.active");
            if (activeView?.id === "timelineView") renderTimeline();
            if (activeView?.id === "delayedView") await renderDelayedTasks();

            showToast("success", "Synchronisation réussie", "Les données du planning ont été mises à jour");
        } catch {
            showToast("error", "Erreur de synchronisation", "Impossible de synchroniser les données. Réessayez.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    });

    // Planning tabs
    $$(".planning-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$(".planning-tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            const view = tab.dataset.view;
            $$(".planning-view").forEach((v) => {
                v.classList.remove("active");
                v.classList.add("hidden");
            });
            const viewEl = $(`${view}View`);
            if (viewEl) {
                viewEl.classList.remove("hidden");
                viewEl.classList.add("active");
                if (view === "gantt") {
                    setTimeout(() => renderGantt(), 50);
                }
                if (view === "timeline") renderTimeline();
                if (view === "delayed") renderDelayedTasks();
            }
        });
    });

    // ===========================
    // GANTT CHART (DHTMLX)
    // ===========================
    let dhtmlxGanttInited = false;
    let ganttZoom = "week";

    // Zoom buttons
    document.addEventListener("click", (e) => {
        const zb = e.target.closest(".gantt-zoom-btn");
        if (zb) {
            $$(".gantt-zoom-btn").forEach(b => b.classList.remove("active"));
            zb.classList.add("active");
            ganttZoom = zb.dataset.zoom;
            applyGanttZoom(ganttZoom);
        }
    });

    $("ganttTodayBtn")?.addEventListener("click", () => {
        if (window.gantt) gantt.showDate(new Date());
    });

    $("ganttExpandAllBtn")?.addEventListener("click", () => {
        if (window.gantt) { gantt.eachTask(t => gantt.open(t.id)); }
    });

    $("ganttCollapseAllBtn")?.addEventListener("click", () => {
        if (window.gantt) { gantt.eachTask(t => gantt.close(t.id)); }
    });

    $("ganttProjectFilter")?.addEventListener("change", () => renderGantt());

    function applyGanttZoom(level) {
        if (!window.gantt) return;
        switch (level) {
            case "day":
                gantt.config.scale_unit = "day";
                gantt.config.date_scale = "%d %M";
                gantt.config.subscales = [];
                gantt.config.min_column_width = 60;
                break;
            case "week":
                gantt.config.scale_unit = "week";
                gantt.config.date_scale = "Semaine %W";
                gantt.config.subscales = [{ unit: "day", step: 1, date: "%d %D" }];
                gantt.config.min_column_width = 50;
                break;
            case "month":
                gantt.config.scale_unit = "month";
                gantt.config.date_scale = "%F %Y";
                gantt.config.subscales = [{ unit: "week", step: 1, date: "S%W" }];
                gantt.config.min_column_width = 60;
                break;
            case "year":
                gantt.config.scale_unit = "year";
                gantt.config.date_scale = "%Y";
                gantt.config.subscales = [{ unit: "month", step: 1, date: "%M" }];
                gantt.config.min_column_width = 50;
                break;
        }
        if (dhtmlxGanttInited) gantt.render();
    }

    function initDhtmlxGantt() {
        if (!window.gantt || dhtmlxGanttInited) return;

        try {
            gantt.config.date_format = "%d-%m-%Y";

            // Columns
            gantt.config.columns = [
                { name: "text", label: "Tâche / Projet", width: 200, tree: true },
                { name: "start_date", label: "Début", align: "center", width: 90 },
                { name: "duration", label: "Durée", align: "center", width: 55 },
                {
                    name: "assignee", label: "Responsable", align: "center", width: 110,
                    template: function (task) { return task.assignee || ""; }
                },
                {
                    name: "statut", label: "Statut", align: "center", width: 80,
                    template: function (task) {
                        if (task.type === "project") return "";
                        var s = task.statut;
                        var label = s === "AFaire" ? "À faire" : s === "EnCours" ? "En cours" : s === "EnRevue" ? "En revue" : s === "Terminee" ? "Terminée" : s;
                        var color = task.isOverdue ? "#e50908" : s === "Terminee" ? "#10b981" : s === "EnCours" ? "#1a1a2e" : s === "EnRevue" ? "#f59e0b" : "#d4b70c";
                        return '<span style="color:' + color + ';font-weight:600;font-size:11px">' + label + '</span>';
                    }
                },
                {
                    name: "progress", label: "%", align: "center", width: 50,
                    template: function (task) {
                        return Math.round((task.progress || 0) * 100) + "%";
                    }
                }
            ];

            // Layout
            gantt.config.row_height = 36;
            gantt.config.bar_height = 24;
            gantt.config.fit_tasks = true;
            gantt.config.auto_scheduling = false;
            gantt.config.drag_move = false;
            gantt.config.drag_resize = false;
            gantt.config.drag_progress = false;
            gantt.config.drag_links = false;
            gantt.config.show_links = true;
            gantt.config.show_markers = true;
            gantt.config.open_tree_initially = true;
            gantt.config.autofit = false;
            gantt.config.grid_width = 590;
            gantt.config.show_progress = true;
            gantt.config.readonly = true;

            // Default scale (week view)
            gantt.config.scale_unit = "week";
            gantt.config.date_scale = "Semaine %W";
            gantt.config.subscales = [{ unit: "day", step: 1, date: "%d %D" }];
            gantt.config.min_column_width = 50;

            // Today marker (requires marker plugin)
            if (typeof gantt.addMarker === "function") {
                gantt.addMarker({
                    start_date: new Date(),
                    css: "gantt-today-line",
                    text: "Aujourd'hui"
                });
            }

            // Task bar class by status
            gantt.templates.task_class = function (start, end, task) {
                var cls = [];
                if (task.type === "project") { cls.push("gantt-project-task"); return cls.join(" "); }
                if (task.isOverdue) cls.push("gantt-task-overdue");
                else if (task.statut === "Terminee") cls.push("gantt-task-done");
                else if (task.statut === "EnCours") cls.push("gantt-task-inprogress");
                else if (task.statut === "EnRevue") cls.push("gantt-task-review");
                else cls.push("gantt-task-todo");
                return cls.join(" ");
            };

            gantt.templates.grid_row_class = function (start, end, task) {
                if (task.type === "project") return "gantt-grid-project-row";
                return "";
            };

            gantt.templates.task_text = function (start, end, task) {
                if (task.type === "project") return "<b>" + task.text + "</b>";
                return task.text;
            };

            // Tooltip - simple inline, no plugin needed
            gantt.templates.tooltip_text = function (start, end, task) {
                var html = "<b>" + task.text + "</b><br/>" +
                    "Début: " + gantt.templates.tooltip_date_format(start) + "<br/>" +
                    "Fin: " + gantt.templates.tooltip_date_format(end) + "<br/>" +
                    "Progression: " + Math.round((task.progress || 0) * 100) + "%";
                if (task.assignee) html += "<br/>Responsable: " + task.assignee;
                if (task.phase) html += "<br/>Phase: " + task.phase;
                if (task.isOverdue) html += "<br/><span style='color:#e50908;font-weight:bold'>⚠ En retard de " + task.joursRetard + " jour(s)</span>";
                return html;
            };

            // Weekend highlighting
            gantt.templates.scale_cell_class = function (date) {
                if (date.getDay() === 0 || date.getDay() === 6) return "gantt-weekend-cell";
                return "";
            };
            gantt.templates.timeline_cell_class = function (item, date) {
                if (date.getDay() === 0 || date.getDay() === 6) return "gantt-weekend-cell";
                return "";
            };

            // Disable lightbox
            gantt.config.details_on_dblclick = false;
            gantt.config.details_on_create = false;

            // Double-click opens our edit modal
            gantt.attachEvent("onTaskDblClick", function (id, e) {
                var task = gantt.getTask(id);
                if (task.type === "project") return true;
                var numId = parseInt(id);
                if (!isNaN(numId)) openTaskEdit(numId);
                return false;
            });

            console.log("[Gantt] Calling gantt.init('dhtmlxGantt')...");
            gantt.init("dhtmlxGantt");
            dhtmlxGanttInited = true;
            console.log("[Gantt] gantt.init() completed successfully");
        } catch (err) {
            console.error("[Gantt] Error during initDhtmlxGantt:", err);
        }
    }

    async function renderGantt() {
        var container = $("dhtmlxGantt");
        if (!container) { console.log("[Gantt] No #dhtmlxGantt container"); return; }

        // Check if ganttView is visible
        var ganttViewEl = $("ganttView");
        if (!ganttViewEl) { console.log("[Gantt] No #ganttView"); return; }

        // Check computed display
        var style = window.getComputedStyle(ganttViewEl);
        console.log("[Gantt] ganttView display=" + style.display + ", classes=" + ganttViewEl.className);
        if (style.display === "none") { console.log("[Gantt] ganttView hidden, skip"); return; }

        try {
            if (!dhtmlxGanttInited) {
                console.log("[Gantt] First init...");
                initDhtmlxGantt();
            }
            if (!dhtmlxGanttInited) { console.log("[Gantt] Init failed, aborting"); return; }

            // Populate project filter
            var pFilter = $("ganttProjectFilter");
            if (pFilter && pFilter.options.length <= 1 && cachedTasks.length > 0) {
                var seen = {};
                cachedTasks.forEach(function (t) {
                    if (!seen[t.projetId]) {
                        seen[t.projetId] = true;
                        var opt = document.createElement("option");
                        opt.value = t.projetId;
                        opt.textContent = t.projet;
                        pFilter.appendChild(opt);
                    }
                });
            }

            var projectFilterVal = pFilter ? pFilter.value : "";
            var url = projectFilterVal ? "/api/tasks/gantt?projetId=" + projectFilterVal : "/api/tasks/gantt";
            console.log("[Gantt] Fetching " + url);
            var ganttData = await api(url);
            if (!ganttData) { console.log("[Gantt] API returned null"); return; }

            console.log("[Gantt] Data received:", JSON.stringify(ganttData).substring(0, 200));
            console.log("[Gantt] Tasks count:", ganttData.data ? ganttData.data.length : 0, "Links:", ganttData.links ? ganttData.links.length : 0);

            gantt.clearAll();
            gantt.parse(ganttData);
            console.log("[Gantt] Parsed OK, task count in gantt:", gantt.getTaskCount());

            // Force redraw
            setTimeout(function () {
                gantt.render();
                gantt.showDate(new Date());
                console.log("[Gantt] Render complete");
            }, 200);
        } catch (err) {
            console.error("[Gantt] Error in renderGantt:", err);
        }
    }

    // ===========================
    // TIMELINE VIEW
    // ===========================
    function renderTimeline() {
        const container = $("timelineContainer");
        if (!container) return;

        const tasks = [...cachedTasks].sort((a, b) => new Date(a.dateEcheance) - new Date(b.dateEcheance));

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>Aucune tâche planifiée</p></div>';
            return;
        }

        // Group tasks by month
        const grouped = {};
        tasks.forEach(t => {
            const d = new Date(t.dateEcheance);
            const key = d.toLocaleDateString(appLocale(), { month: "long", year: "numeric" });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
        });

        let html = '';
        Object.keys(grouped).forEach(monthLabel => {
            html += `<div class="timeline-month">
                <div class="timeline-month-header">${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</div>`;

            grouped[monthLabel].forEach(t => {
                const d = new Date(t.dateEcheance);
                const dayStr = d.toLocaleDateString(appLocale(), { weekday: "short", day: "numeric" });
                const sc = taskStatusMap[t.statut] || "todo";
                const pc = prioriteCssMap[t.priorite] || "medium";
                const statusLabel = t.statut === "AFaire" ? "À faire" : t.statut === "EnCours" ? "En cours" : t.statut === "EnRevue" ? "En revue" : "Terminée";
                const prog = t.progression || 0;
                const isOverdue = new Date(t.dateEcheance) < new Date() && t.statut !== "Terminee";
                const initials = (t.assigneA || "?").split(" ").map(n => n[0]).join("").substring(0, 2);

                html += `<div class="timeline-item ${isOverdue ? 'timeline-overdue' : ''}">
                    <div class="timeline-date">
                        <span class="timeline-day">${dayStr}</span>
                    </div>
                    <div class="timeline-dot timeline-dot-${sc}"></div>
                    <div class="timeline-content">
                        <div class="timeline-card">
                            <div class="timeline-card-header">
                                <span class="timeline-card-title">${t.titre}</span>
                                <span class="project-card-priority priority-${pc}">${prioriteLabels[t.priorite] || t.priorite}</span>
                            </div>
                            <div class="timeline-card-meta">
                                <span><i class="fa-solid fa-folder"></i> ${t.projet}</span>
                                <span><i class="fa-solid fa-user"></i> ${t.assigneA || "Non assigné"}</span>
                                <span class="timeline-status timeline-status-${sc}">${statusLabel}</span>
                            </div>
                            <div class="timeline-card-progress">
                                <div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div>
                                <span>${prog}%</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            });

            html += `</div>`;
        });

        container.innerHTML = html;
    }

    // ===========================
    // RENDER BUDGETS
    // ===========================
    async function renderBudgets() {
        const budgetData = await loadBudgetData();
        const transactions = await api("/api/budgets/transactions");

        if (budgetData) {
            const kpis = $$(".budget-kpi-value");
            if (kpis.length >= 4) {
                kpis[0].textContent = fmtBudgetM(budgetData.budgetTotal, 0);
                kpis[1].textContent = fmtBudgetM(budgetData.depensesTotales, 0);
                kpis[2].textContent = fmtBudgetM(budgetData.restant, 0);
                kpis[3].textContent = `${budgetData.depassements} projets`;
            }
        }

        const budgetTableBody = $("budgetTableBody");
        if (budgetTableBody && budgetData?.parProjet) {
            budgetTableBody.innerHTML = budgetData.parProjet.map(p => {
                const pct = p.pourcentage;
                const st = pct > 100 ? "danger" : pct > 80 ? "warning" : "success";
                return `<tr>
            <td><strong>${p.nom}</strong></td>
            <td>${fmtBudgetM(p.budgetAlloue, 2)}</td>
            <td>${fmtBudgetM(p.depense, 2)}</td>
            <td>${fmtBudgetM(p.restant, 2)}</td>
            <td>
              <div class="progress-bar" style="width: 100px;"><div class="progress-fill" style="width: ${Math.min(pct, 100)}%; background: ${st === "danger" ? "var(--color-red)" : st === "warning" ? "var(--color-warning)" : "var(--color-success)"}"></div></div>
              <small>${pct}%</small>
            </td>
            <td><span class="project-status status--${st === "danger" ? "warning" : st}">${st === "danger" ? "Dépassé" : st === "warning" ? "Attention" : "OK"}</span></td>
            <td><button class="btn btn-sm btn-outline"><i class="fa-solid fa-eye"></i></button></td>
          </tr>`;
            }).join("");
        }

        const transactionsList = $("transactionsList");
        if (transactionsList && transactions) {
            transactionsList.innerHTML = transactions.slice(0, 5).map(t => {
                const isExpense = t.type === "Depense";
                return `<div class="transaction-item">
          <div class="transaction-icon ${isExpense ? "expense" : "income"}">
            <i class="fa-solid fa-${isExpense ? "arrow-down" : "arrow-up"}"></i>
          </div>
          <div class="transaction-info">
            <div class="transaction-title">${t.libelle}</div>
            <div class="transaction-date">${formatAppDate(t.date, { day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
          <div class="transaction-amount ${isExpense ? "negative" : "positive"}">
            ${isExpense ? "-" : "+"}${formatAppCurrency(t.montant)}
          </div>
        </div>`;
            }).join("");
        }

        initBudgetCharts();
    }

    function initBudgetCharts() {
        // Budget Evolution Chart
        const budgetEvolutionEl = $("budgetEvolutionChart");
        if (budgetEvolutionEl && window.Chart) {
            const ctx = budgetEvolutionEl.getContext("2d");

            if (budgetEvolutionEl.chartInstance) {
                budgetEvolutionEl.chartInstance.destroy();
            }

            budgetEvolutionEl.chartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
                    datasets: [
                        {
                            label: "Budget prévu",
                            data: [45, 45, 45, 45, 45, 45],
                            borderColor: "#3b82f6",
                            borderDash: [5, 5],
                            fill: false,
                        },
                        {
                            label: "Dépenses réelles",
                            data: [5, 12, 20, 26, 32, 35.2],
                            borderColor: "#e50908",
                            backgroundColor: "rgba(229, 9, 8, 0.1)",
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: `Millions ${window._appCurrencySymbol || "DA"}` },
                        },
                    },
                },
            });
        }

        // Expenses Distribution Chart
        const expensesEl = $("expensesChart");
        if (expensesEl && window.Chart) {
            const ctx = expensesEl.getContext("2d");

            if (expensesEl.chartInstance) {
                expensesEl.chartInstance.destroy();
            }

            expensesEl.chartInstance = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: [
                        "Main d'œuvre",
                        "Matériaux",
                        "Équipements",
                        "Sous-traitance",
                        "Autres",
                    ],
                    datasets: [
                        {
                            data: [35, 30, 18, 12, 5],
                            backgroundColor: [
                                "#e50908",
                                "#f1d00e",
                                "#3b82f6",
                                "#10b981",
                                "#8b5cf6",
                            ],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom" },
                    },
                },
            });
        }
    }

    // ===========================
    // RENDER REPORTS
    // ===========================
    let cachedRapports = [];

    async function loadRapports() {
        const data = await api("/api/rapports");
        if (data) cachedRapports = data;
        return cachedRapports;
    }

    async function renderReports() {
        const projects = await loadProjects();
        await loadRapports();
        renderRapportsList();
    }

    function renderRapportsList() {
        const reportsList = $("reportsList");
        if (!reportsList) return;

        if (cachedRapports.length === 0) {
            reportsList.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;"><i class="fa-solid fa-file-circle-xmark" style="font-size:48px;color:var(--text-tertiary);display:block;margin-bottom:12px;"></i><p>Aucun rapport généré</p></div>';
            return;
        }

        reportsList.innerHTML = cachedRapports.map(r => {
            const typeIcons = {
                Qualite: "fa-clipboard-check",
                Personnalise: "fa-wand-magic-sparkles",
                Bordereau: "fa-file-invoice",
                Courrier: "fa-envelope-open-text",
                ReceptionProvisoire: "fa-file-signature",
                ReceptionDefinitive: "fa-file-circle-check"
            };
            const typeLabelsMap = {
                Qualite: "Contrôle Qualité",
                Personnalise: "Personnalisé",
                Bordereau: "Bordereau",
                Courrier: "Courrier",
                ReceptionProvisoire: "Réception Provisoire",
                ReceptionDefinitive: "Réception Définitive"
            };
            const icon = typeIcons[r.type] || "fa-file";
            const typeLabel = typeLabelsMap[r.type] || r.type;
            const date = formatAppDate(r.dateGeneration, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

            return `<div class="rapport-list-item">
                <div class="rapport-list-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="rapport-list-info">
                    <div class="rapport-list-title">${esc(r.titre)}</div>
                    <div class="rapport-list-meta">
                        <span class="rapport-list-type">${typeLabel}</span>
                        ${r.projet ? `<span><i class="fa-solid fa-folder"></i> ${esc(r.projet)}</span>` : ''}
                        <span><i class="fa-solid fa-calendar"></i> ${date}</span>
                        ${r.generePar ? `<span><i class="fa-solid fa-user"></i> ${esc(r.generePar)}</span>` : ''}
                    </div>
                </div>
                <div class="rapport-list-actions">
                    <button class="btn btn-sm btn-outline" data-view-rapport-id="${r.id}" title="Voir / Imprimer"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline" data-archive-rapport-id="${r.id}" title="Archiver"><i class="fa-solid fa-box-archive"></i></button>
                    <button class="btn btn-sm btn-outline btn-danger-outline" data-delete-rapport-id="${r.id}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
        }).join("");
    }

    // --- Dynamic form fields per rapport type ---
    function getRapportFormFields(type) {
        switch (type) {
            case "Qualite":
                return `
                    <div class="pv-info-note" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.9em;color:#92400e;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Les informations du projet seront récupérées automatiquement depuis le projet sélectionné ci-dessus.
                    </div>
                    <div class="form-group"><label class="form-label">Objet du contrôle *</label><input type="text" class="form-input" id="rf_objetControle" required placeholder="Ex: Vérification béton – Bloc A" /></div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Date du contrôle *</label><input type="date" class="form-input" id="rf_dateControle" required /></div>
                        <div class="form-group"><label class="form-label">Contrôleur</label><input type="text" class="form-input" id="rf_controleur" placeholder="Nom du contrôleur" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Résultat du contrôle *</label>
                        <select class="form-select" id="rf_resultat">
                            <option value="Conforme">Conforme</option>
                            <option value="Non conforme">Non conforme</option>
                            <option value="Partiellement conforme">Partiellement conforme</option>
                        </select>
                    </div>
                    <div class="form-group"><label class="form-label">Observations / Non-conformités</label><textarea class="form-textarea" id="rf_observations" rows="3" placeholder="Détail des observations..."></textarea></div>
                    <div class="form-group"><label class="form-label">Actions correctives recommandées</label><textarea class="form-textarea" id="rf_actions" rows="3" placeholder="Actions à entreprendre..."></textarea></div>`;
            case "Bordereau":
                return `
                    <div class="pv-info-note" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.9em;color:#92400e;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Les informations du projet seront récupérées automatiquement depuis le projet sélectionné ci-dessus.
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Numéro du bordereau</label><input type="text" class="form-input" id="rf_numeroBordereau" placeholder="Ex: BRD-2026-001" /></div>
                        <div class="form-group"><label class="form-label">Date du bordereau *</label><input type="date" class="form-input" id="rf_dateBordereau" required /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Destinataire *</label><input type="text" class="form-input" id="rf_destinataire" required placeholder="Nom et qualité du destinataire" /></div>
                    <div class="form-group"><label class="form-label">Objet *</label><input type="text" class="form-input" id="rf_objetBordereau" required placeholder="Objet du bordereau d'envoi" /></div>
                    <div class="form-group"><label class="form-label">Liste des pièces jointes *</label><textarea class="form-textarea" id="rf_piecesJointes" rows="4" required placeholder="1. Plan d'exécution\n2. Note de calcul\n3. ..."></textarea></div>
                    <div class="form-group"><label class="form-label">Observations</label><textarea class="form-textarea" id="rf_observationsBordereau" rows="3" placeholder="Observations éventuelles..."></textarea></div>`;
            case "Courrier":
                return `
                    <div class="pv-info-note" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.9em;color:#92400e;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Les informations du projet seront récupérées automatiquement depuis le projet sélectionné ci-dessus.
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Numéro de référence</label><input type="text" class="form-input" id="rf_refCourrier" placeholder="Ex: COR-2026-045" /></div>
                        <div class="form-group"><label class="form-label">Date du courrier *</label><input type="date" class="form-input" id="rf_dateCourrier" required /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Destinataire *</label><input type="text" class="form-input" id="rf_destCourrier" required placeholder="Nom et qualité du destinataire" /></div>
                    <div class="form-group"><label class="form-label">Objet *</label><input type="text" class="form-input" id="rf_objetCourrier" required placeholder="Objet du courrier" /></div>
                    <div class="form-group"><label class="form-label">Corps du courrier *</label><textarea class="form-textarea" id="rf_corpsCourrier" rows="8" required placeholder="Monsieur / Madame,\n\nNous avons l'honneur de..."></textarea></div>
                    <div class="form-group"><label class="form-label">Pièces jointes</label><input type="text" class="form-input" id="rf_pjCourrier" placeholder="Liste des pièces jointes" /></div>`;
            case "ReceptionProvisoire":
                return `
                    <div class="pv-info-note" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.9em;color:#92400e;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Les informations du projet (nom, lieu, maître d'ouvrage, montant, dates) seront récupérées automatiquement depuis le projet sélectionné ci-dessus.
                    </div>
                    <div class="form-group"><label class="form-label">Date de la demande *</label><input type="date" class="form-input" id="rf_dateRP" required /></div>
                    <div class="form-group"><label class="form-label">Entreprise réalisatrice *</label><input type="text" class="form-input" id="rf_entrepriseRP" required placeholder="Nom de l'entreprise" /></div>
                    <div class="form-group"><label class="form-label">Observations</label><textarea class="form-textarea" id="rf_observationsRP" rows="3" placeholder="Observations complémentaires (facultatif)..."></textarea></div>`;
            case "ReceptionDefinitive":
                return `
                    <div class="pv-info-note" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.9em;color:#92400e;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Les informations du projet seront récupérées automatiquement depuis le projet sélectionné ci-dessus.
                    </div>
                    <div class="form-group"><label class="form-label">Date de la demande *</label><input type="date" class="form-input" id="rf_dateRD" required /></div>
                    <div class="form-group"><label class="form-label">Entreprise réalisatrice *</label><input type="text" class="form-input" id="rf_entrepriseRD" required placeholder="Nom de l'entreprise" /></div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Date de réception provisoire</label><input type="date" class="form-input" id="rf_dateRProvRD" /></div>
                        <div class="form-group"><label class="form-label">Durée de garantie (mois)</label><input type="number" class="form-input" id="rf_dureeGarantieRD" placeholder="Ex: 12" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">État des réserves levées</label>
                        <select class="form-select" id="rf_reservesLeveesRD">
                            <option value="Toutes les réserves ont été levées">Toutes les réserves ont été levées</option>
                            <option value="Réserves partiellement levées">Réserves partiellement levées</option>
                            <option value="Aucune réserve">Aucune réserve</option>
                        </select>
                    </div>
                    <div class="form-group"><label class="form-label">Observations</label><textarea class="form-textarea" id="rf_observationsRD" rows="3" placeholder="Observations complémentaires (facultatif)..."></textarea></div>`;
            case "Personnalise":
                return `
                    <div class="form-group"><label class="form-label">Contenu du rapport *</label><textarea class="form-textarea" id="rf_contenuPerso" rows="12" required placeholder="Rédigez le contenu de votre rapport personnalisé..."></textarea></div>`;
            default:
                return '';
        }
    }

    // --- Collect form data as JSON per type ---
    function collectRapportFormData(type) {
        const val = (id) => $(id)?.value?.trim() || "";
        switch (type) {
            case "Qualite": {
                const projQ = cachedProjects.find(p => p.id === parseInt($('rapportProjet')?.value));
                return JSON.stringify({
                    objetControle: val("rf_objetControle"),
                    dateControle: val("rf_dateControle"),
                    controleur: val("rf_controleur"),
                    resultat: val("rf_resultat"),
                    observations: val("rf_observations"),
                    actions: val("rf_actions"),
                    nomProjet: projQ?.nom || "",
                    lieuProjet: projQ?.localisation || "",
                    maitreOuvrage: projQ?.maitreOuvrage || ""
                });
            }
            case "Bordereau": {
                const projB = cachedProjects.find(p => p.id === parseInt($('rapportProjet')?.value));
                return JSON.stringify({
                    numeroBordereau: val("rf_numeroBordereau"),
                    dateBordereau: val("rf_dateBordereau"),
                    destinataire: val("rf_destinataire"),
                    objetBordereau: val("rf_objetBordereau"),
                    piecesJointes: val("rf_piecesJointes"),
                    observations: val("rf_observationsBordereau"),
                    nomProjet: projB?.nom || "",
                    lieuProjet: projB?.localisation || "",
                    maitreOuvrage: projB?.maitreOuvrage || ""
                });
            }
            case "Courrier": {
                const projC = cachedProjects.find(p => p.id === parseInt($('rapportProjet')?.value));
                return JSON.stringify({
                    refCourrier: val("rf_refCourrier"),
                    dateCourrier: val("rf_dateCourrier"),
                    destinataire: val("rf_destCourrier"),
                    objet: val("rf_objetCourrier"),
                    corps: val("rf_corpsCourrier"),
                    piecesJointes: val("rf_pjCourrier"),
                    nomProjet: projC?.nom || "",
                    lieuProjet: projC?.localisation || "",
                    maitreOuvrage: projC?.maitreOuvrage || ""
                });
            }
            case "ReceptionProvisoire": {
                const projRP = cachedProjects.find(p => p.id === parseInt($('rapportProjet')?.value));
                return JSON.stringify({
                    dateDemande: val("rf_dateRP"),
                    entreprise: val("rf_entrepriseRP"),
                    observations: val("rf_observationsRP"),
                    nomProjet: projRP?.nom || "",
                    maitreOuvrage: projRP?.maitreOuvrage || "",
                    lieuProjet: projRP?.localisation || "",
                    montantMarche: projRP?.budgetAlloue?.toString() || "",
                    dateDebut: projRP?.dateDebut?.split('T')[0] || "",
                    dateFin: projRP?.dateFinPrevue?.split('T')[0] || ""
                });
            }
            case "ReceptionDefinitive": {
                const projRD = cachedProjects.find(p => p.id === parseInt($('rapportProjet')?.value));
                return JSON.stringify({
                    dateDemande: val("rf_dateRD"),
                    entreprise: val("rf_entrepriseRD"),
                    dateReceptionProvisoire: val("rf_dateRProvRD"),
                    dureeGarantie: val("rf_dureeGarantieRD"),
                    reservesLevees: val("rf_reservesLeveesRD"),
                    observations: val("rf_observationsRD"),
                    nomProjet: projRD?.nom || "",
                    maitreOuvrage: projRD?.maitreOuvrage || "",
                    lieuProjet: projRD?.localisation || "",
                    montantMarche: projRD?.budgetAlloue?.toString() || "",
                    dateFin: projRD?.dateFinPrevue?.split('T')[0] || ""
                });
            }
            case "Personnalise":
                return JSON.stringify({ contenu: val("rf_contenuPerso") });
            default:
                return "{}";
        }
    }

    // --- Generate printable HTML per type ---
    function generateRapportHTML(rapport) {
        const d = rapport.donneesFormulaire ? JSON.parse(rapport.donneesFormulaire) : {};
        const projet = rapport.projet || "—";
        const date = formatAppDate(rapport.dateGeneration, { day: "numeric", month: "long", year: "numeric" });
        const generePar = rapport.generePar || "—";

        let headerHTML = `
            <div class="rapport-header">
                <div class="rapport-logo"><img src="/images/logo.png" alt="Logo" style="height:50px;" /></div>
                <div class="rapport-header-info">
                    <h1 class="rapport-main-title">${esc(rapport.titre)}</h1>
                    <p class="rapport-sub">${esc(getTypeLabel(rapport.type))}</p>
                </div>
                <div class="rapport-date-block">
                    <span>${date}</span>
                </div>
            </div>
            <div class="rapport-meta-bar">
                <span><strong>Projet :</strong> ${esc(projet)}</span>
                <span><strong>Généré par :</strong> ${esc(generePar)}</span>
            </div>
            <hr class="rapport-divider" />`;

        let bodyHTML = "";

        switch (rapport.type) {
            case "Qualite":
                bodyHTML = `
                    <div class="pv-republic-header">
                        <p class="pv-republic-title">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                        <p class="pv-ministry">Ministère de l'Habitat, de l'Urbanisme et de la Ville</p>
                    </div>
                    <div class="pv-document-title">
                        <h2>RAPPORT DE CONTRÔLE QUALITÉ</h2>
                    </div>

                    <h3>Informations du Projet</h3>
                    <table class="rapport-table">
                        <tr><th>Nom du projet</th><td>${esc(d.nomProjet || projet)}</td></tr>
                        <tr><th>Maître d'ouvrage</th><td>${esc(d.maitreOuvrage)}</td></tr>
                        <tr><th>Lieu du projet</th><td>${esc(d.lieuProjet)}</td></tr>
                    </table>

                    <h3>Détail du Contrôle</h3>
                    <table class="rapport-table">
                        <tr><th>Objet du contrôle</th><td>${esc(d.objetControle)}</td></tr>
                        <tr><th>Date du contrôle</th><td>${formatAppDate(d.dateControle)}</td></tr>
                        <tr><th>Contrôleur</th><td>${esc(d.controleur || '—')}</td></tr>
                        <tr><th>Résultat</th><td><strong style="color:${d.resultat === 'Conforme' ? '#10b981' : d.resultat === 'Non conforme' ? '#e50908' : '#f59e0b'}">${esc(d.resultat)}</strong></td></tr>
                    </table>

                    ${d.observations ? `<h3>Observations / Non-conformités</h3><div class="pv-formal-text"><p>${esc(d.observations).replace(/\n/g, '<br>')}</p></div>` : ''}
                    ${d.actions ? `<h3>Actions correctives recommandées</h3><div class="pv-formal-text"><p>${esc(d.actions).replace(/\n/g, '<br>')}</p></div>` : ''}

                    <div class="rapport-signatures" style="margin-top:30px;">
                        <div class="rapport-signature-block"><p>Le Contrôleur</p><div class="signature-line"></div><span class="signature-hint">Signature</span></div>
                        <div class="rapport-signature-block"><p>Le Responsable du projet</p><div class="signature-line"></div><span class="signature-hint">Signature & Cachet</span></div>
                    </div>`;
                break;
            case "Bordereau":
                bodyHTML = `
                    <div class="pv-republic-header">
                        <p class="pv-republic-title">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                        <p class="pv-ministry">Ministère de l'Habitat, de l'Urbanisme et de la Ville</p>
                    </div>
                    <div class="pv-document-title">
                        <h2>BORDEREAU D'ENVOI</h2>
                        ${d.numeroBordereau ? `<p class="pv-ref">N° : ${esc(d.numeroBordereau)}</p>` : ''}
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px;">
                        <p><strong>${esc(d.lieuProjet || '_______________')}</strong>, le <strong>${formatAppDate(d.dateBordereau)}</strong></p>
                    </div>

                    <h3>Informations</h3>
                    <table class="rapport-table">
                        <tr><th>Projet</th><td>${esc(d.nomProjet || projet)}</td></tr>
                        <tr><th>Maître d'ouvrage</th><td>${esc(d.maitreOuvrage)}</td></tr>
                        <tr><th>Destinataire</th><td>${esc(d.destinataire)}</td></tr>
                        <tr><th>Objet</th><td>${esc(d.objetBordereau)}</td></tr>
                    </table>

                    ${d.piecesJointes ? `<h3>Pièces jointes</h3><div class="pv-formal-text"><p>${esc(d.piecesJointes).replace(/\n/g, '<br>')}</p></div>` : ''}
                    ${d.observations ? `<h3>Observations</h3><div class="pv-formal-text"><p>${esc(d.observations).replace(/\n/g, '<br>')}</p></div>` : ''}

                    <div class="rapport-signatures" style="margin-top:30px;">
                        <div class="rapport-signature-block"><p>L'Expéditeur</p><div class="signature-line"></div><span class="signature-hint">Signature & Cachet</span></div>
                        <div class="rapport-signature-block"><p>Le Destinataire</p><div class="signature-line"></div><span class="signature-hint">Reçu le : ____/____/________</span></div>
                    </div>`;
                break;
            case "Courrier":
                bodyHTML = `
                    <div class="pv-republic-header">
                        <p class="pv-republic-title">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                        <p class="pv-ministry">Ministère de l'Habitat, de l'Urbanisme et de la Ville</p>
                    </div>
                    <div class="pv-document-title">
                        <h2>COURRIER OFFICIEL</h2>
                        ${d.refCourrier ? `<p class="pv-ref">Réf. : ${esc(d.refCourrier)}</p>` : ''}
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px;">
                        <p><strong>${esc(d.lieuProjet || '_______________')}</strong>, le <strong>${formatAppDate(d.dateCourrier)}</strong></p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:8px;">
                        <p><strong>Destinataire :</strong> ${esc(d.destinataire)}</p>
                        <p><strong>Projet :</strong> ${esc(d.nomProjet || projet)}</p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:8px;">
                        <p><strong>Objet :</strong> ${esc(d.objet)}</p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px; white-space:pre-line;">
                        <p>${esc(d.corps || '').replace(/\n/g, '<br>')}</p>
                    </div>

                    ${d.piecesJointes ? `<div class="pv-formal-text"><p><strong>PJ :</strong> ${esc(d.piecesJointes)}</p></div>` : ''}

                    <div class="pv-formal-text" style="margin-top:16px;">
                        <p>Veuillez agréer, Monsieur/Madame, l'expression de nos salutations distinguées.</p>
                    </div>

                    <div class="rapport-signatures" style="margin-top:30px;">
                        <div class="rapport-signature-block"><p>L'Expéditeur</p><div class="signature-line"></div><span class="signature-hint">Signature & Cachet</span></div>
                    </div>`;
                break;
            case "ReceptionProvisoire":
                bodyHTML = `
                    <div class="pv-republic-header">
                        <p class="pv-republic-title">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                        <p class="pv-ministry">Ministère de l'Habitat, de l'Urbanisme et de la Ville</p>
                    </div>
                    <div class="pv-document-title">
                        <h2>DEMANDE DE RÉCEPTION PROVISOIRE</h2>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px;">
                        <p><strong>${esc(d.lieuProjet || '_______________')}</strong>, le <strong>${formatAppDate(d.dateDemande)}</strong></p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:8px;">
                        <p><strong>Objet :</strong> Demande de réception provisoire des travaux du projet <strong>« ${esc(d.nomProjet || '—')} »</strong></p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px;">
                        <p>Monsieur le Maître d'ouvrage,</p>
                        <p style="margin-top:8px;">Nous avons l'honneur de vous informer que les travaux relatifs au projet <strong>« ${esc(d.nomProjet || '—')} »</strong>, situé à <strong>${esc(d.lieuProjet || '—')}</strong>, ont été achevés conformément aux clauses du marché.</p>
                        <p style="margin-top:8px;">En conséquence, nous vous prions de bien vouloir procéder à la <strong>réception provisoire</strong> des travaux réalisés.</p>
                    </div>

                    <h3>Informations du Projet</h3>
                    <table class="rapport-table">
                        <tr><th>Nom du projet</th><td>${esc(d.nomProjet)}</td></tr>
                        <tr><th>Maître d'ouvrage</th><td>${esc(d.maitreOuvrage)}</td></tr>
                        <tr><th>Entreprise réalisatrice</th><td>${esc(d.entreprise)}</td></tr>
                        <tr><th>Lieu du projet</th><td>${esc(d.lieuProjet)}</td></tr>
                        <tr><th>Date de début des travaux</th><td>${formatAppDate(d.dateDebut)}</td></tr>
                        <tr><th>Date de fin prévue</th><td>${formatAppDate(d.dateFin)}</td></tr>
                        <tr><th>Montant du marché</th><td>${d.montantMarche ? formatAppCurrency(parseFloat(d.montantMarche)) : '—'}</td></tr>
                    </table>

                    ${d.observations ? `<h3>Observations</h3><div class="pv-formal-text"><p>${esc(d.observations).replace(/\n/g, '<br>')}</p></div>` : ''}

                    <div class="pv-formal-text" style="margin-top:16px;">
                        <p>Dans l'attente de votre suite favorable, veuillez agréer, Monsieur, l'expression de nos salutations distinguées.</p>
                    </div>

                    <div class="rapport-signatures" style="margin-top:30px;">
                        <div class="rapport-signature-block"><p>L'Entreprise réalisatrice</p><div class="signature-line"></div><span class="signature-hint">Signature & Cachet</span></div>
                    </div>`;
                break;
            case "ReceptionDefinitive":
                bodyHTML = `
                    <div class="pv-republic-header">
                        <p class="pv-republic-title">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                        <p class="pv-ministry">Ministère de l'Habitat, de l'Urbanisme et de la Ville</p>
                    </div>
                    <div class="pv-document-title">
                        <h2>DEMANDE DE RÉCEPTION DÉFINITIVE</h2>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px;">
                        <p><strong>${esc(d.lieuProjet || '_______________')}</strong>, le <strong>${formatAppDate(d.dateDemande)}</strong></p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:8px;">
                        <p><strong>Objet :</strong> Demande de réception définitive des travaux du projet <strong>« ${esc(d.nomProjet || '—')} »</strong></p>
                    </div>

                    <div class="pv-formal-text" style="margin-bottom:16px;">
                        <p>Monsieur le Maître d'ouvrage,</p>
                        <p style="margin-top:8px;">Suite à la réception provisoire${d.dateReceptionProvisoire ? ` prononcée le <strong>${formatAppDate(d.dateReceptionProvisoire)}</strong>` : ''} et à l'expiration du délai de garantie${d.dureeGarantie ? ` de <strong>${esc(d.dureeGarantie)} mois</strong>` : ''}, nous avons l'honneur de vous informer que l'ensemble des réserves émises ont été levées et que les ouvrages sont en parfait état.</p>
                        <p style="margin-top:8px;">En conséquence, nous vous prions de bien vouloir procéder à la <strong>réception définitive</strong> des travaux du projet <strong>« ${esc(d.nomProjet || '—')} »</strong>, situé à <strong>${esc(d.lieuProjet || '—')}</strong>.</p>
                    </div>

                    <h3>Informations du Projet</h3>
                    <table class="rapport-table">
                        <tr><th>Nom du projet</th><td>${esc(d.nomProjet)}</td></tr>
                        <tr><th>Maître d'ouvrage</th><td>${esc(d.maitreOuvrage)}</td></tr>
                        <tr><th>Entreprise réalisatrice</th><td>${esc(d.entreprise)}</td></tr>
                        <tr><th>Lieu du projet</th><td>${esc(d.lieuProjet)}</td></tr>
                        <tr><th>Date de fin prévue</th><td>${formatAppDate(d.dateFin)}</td></tr>
                        <tr><th>Montant du marché</th><td>${d.montantMarche ? formatAppCurrency(parseFloat(d.montantMarche)) : '—'}</td></tr>
                        ${d.dateReceptionProvisoire ? `<tr><th>Date de réception provisoire</th><td>${formatAppDate(d.dateReceptionProvisoire)}</td></tr>` : ''}
                        ${d.dureeGarantie ? `<tr><th>Durée de garantie</th><td>${esc(d.dureeGarantie)} mois</td></tr>` : ''}
                    </table>

                    <h3>État des Réserves</h3>
                    <div class="pv-formal-text"><p>${esc(d.reservesLevees || 'Toutes les réserves ont été levées')}</p></div>

                    ${d.observations ? `<h3>Observations</h3><div class="pv-formal-text"><p>${esc(d.observations).replace(/\n/g, '<br>')}</p></div>` : ''}

                    <div class="pv-formal-text" style="margin-top:16px;">
                        <p>Dans l'attente de votre suite favorable, veuillez agréer, Monsieur, l'expression de nos salutations distinguées.</p>
                    </div>

                    <div class="rapport-signatures" style="margin-top:30px;">
                        <div class="rapport-signature-block"><p>L'Entreprise réalisatrice</p><div class="signature-line"></div><span class="signature-hint">Signature & Cachet</span></div>
                    </div>`;
                break;
            case "Personnalise":
                bodyHTML = `
                    <div class="pv-republic-header">
                        <p class="pv-republic-title">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                        <p class="pv-ministry">Ministère de l'Habitat, de l'Urbanisme et de la Ville</p>
                    </div>
                    <div class="pv-document-title">
                        <h2>RAPPORT</h2>
                    </div>
                    <div class="pv-formal-text" style="white-space:pre-line;">
                        <p>${esc(d.contenu || rapport.contenu || "").replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="rapport-signatures" style="margin-top:30px;">
                        <div class="rapport-signature-block"><p>Le Rédacteur</p><div class="signature-line"></div><span class="signature-hint">Signature & Cachet</span></div>
                    </div>`;
                break;
            default:
                bodyHTML = `<p>${esc(rapport.contenu || "")}</p>`;
        }

        return headerHTML + bodyHTML;
    }

    function getTypeLabel(type) {
        const map = {
            Qualite: "Contrôle Qualité",
            Personnalise: "Rapport Personnalisé",
            Bordereau: "Bordereau",
            Courrier: "Courrier",
            ReceptionProvisoire: "Demande de Réception Provisoire",
            ReceptionDefinitive: "Demande de Réception Définitive"
        };
        return map[type] || type;
    }

    // --- Open rapport form ---
    document.addEventListener("click", (e) => {
        const openBtn = e.target.closest("[data-open-rapport]");
        if (openBtn) {
            e.preventDefault();
            const type = openBtn.dataset.openRapport;
            openRapportForm(type);
            return;
        }

        const viewBtn = e.target.closest("[data-view-rapport-id]");
        if (viewBtn) {
            e.stopPropagation();
            viewRapport(parseInt(viewBtn.dataset.viewRapportId));
            return;
        }

        const archiveRapportBtn = e.target.closest("[data-archive-rapport-id]");
        if (archiveRapportBtn) {
            e.stopPropagation();
            archiveRapport(parseInt(archiveRapportBtn.dataset.archiveRapportId));
            return;
        }

        const deleteBtn = e.target.closest("[data-delete-rapport-id]");
        if (deleteBtn) {
            e.stopPropagation();
            deleteRapport(parseInt(deleteBtn.dataset.deleteRapportId));
            return;
        }
    });

    function openRapportForm(type) {
        const modal = $("rapportFormModal");
        if (!modal) return;

        $("rapportType").value = type;
        $("rapportFormTitle").innerHTML = `<i class="fa-solid fa-file-lines"></i> ${getTypeLabel(type)}`;
        $("rapportTitre").value = "";
        $("rapportDynamicFields").innerHTML = getRapportFormFields(type);

        // Populate project dropdown
        const projSel = $("rapportProjet");
        if (projSel) {
            projSel.innerHTML = '<option value="">Aucun projet</option>' +
                cachedProjects.map(p => `<option value="${p.id}">${p.nom}</option>`).join("");
        }

        modal.classList.add("active");
    }

    // Close rapport form modal
    $("closeRapportFormModal")?.addEventListener("click", () => $("rapportFormModal")?.classList.remove("active"));
    $("cancelRapportFormBtn")?.addEventListener("click", () => $("rapportFormModal")?.classList.remove("active"));
    $("rapportFormModal")?.addEventListener("click", (e) => { if (e.target.id === "rapportFormModal") $("rapportFormModal").classList.remove("active"); });

    // Save rapport
    $("saveRapportBtn")?.addEventListener("click", async () => {
        const type = $("rapportType").value;
        const titre = $("rapportTitre").value.trim();
        if (!titre) {
            showToast("error", "Erreur", "Le titre est requis.");
            return;
        }

        const donneesFormulaire = collectRapportFormData(type);
        const projetId = $("rapportProjet").value ? parseInt($("rapportProjet").value) : null;

        const body = {
            titre,
            type,
            contenu: type === "Personnalise" ? ($("rf_contenuPerso")?.value || "") : null,
            donneesFormulaire,
            projetId
        };

        const result = await api("/api/rapports", { method: "POST", body: JSON.stringify(body) });
        if (result) {
            showToast("success", "Rapport généré", "Le rapport a été créé avec succès");
            refreshNotifBadge();
            cachedRapports = [];
            await loadRapports();
            renderRapportsList();

            $("rapportFormModal")?.classList.remove("active");

            // Open the generated report for viewing
            viewRapportData(result);
        } else {
            showToast("error", "Erreur", "Impossible de créer le rapport.");
        }
    });

    // View rapport
    async function viewRapport(rapportId) {
        const rapport = await api(`/api/rapports/${rapportId}`);
        if (!rapport) return;
        viewRapportData(rapport);
    }

    function viewRapportData(rapport) {
        const modal = $("rapportViewModal");
        if (!modal) return;

        $("rapportViewTitle").innerHTML = `<i class="fa-solid fa-eye"></i> ${esc(rapport.titre)}`;
        $("rapportPrintArea").innerHTML = generateRapportHTML(rapport);

        // Show PDF button for all report types
        const pdfBtn = $("downloadPdfBtn");
        if (pdfBtn) {
            pdfBtn.style.display = "";
            pdfBtn.dataset.rapportId = rapport.id;
        }

        modal.classList.add("active");
    }

    // Close view modal
    $("closeRapportViewModal")?.addEventListener("click", () => $("rapportViewModal")?.classList.remove("active"));
    $("closeRapportViewBtn")?.addEventListener("click", () => $("rapportViewModal")?.classList.remove("active"));
    $("rapportViewModal")?.addEventListener("click", (e) => { if (e.target.id === "rapportViewModal") $("rapportViewModal").classList.remove("active"); });

    // Print rapport
    $("printRapportBtn")?.addEventListener("click", () => {
        const printArea = $("rapportPrintArea");
        if (!printArea) return;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <title>Impression Rapport</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px 40px; color: #1a1a2e; font-size: 13px; line-height: 1.6; }
        .rapport-header { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; border-bottom: 3px solid #e50908; padding-bottom: 16px; }
        .rapport-header img { height: 50px; }
        .rapport-header-info { flex: 1; }
        .rapport-main-title { font-size: 20px; font-weight: 700; color: #1a1a2e; }
        .rapport-sub { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .rapport-date-block { text-align: right; font-size: 12px; color: #6b7280; }
        .rapport-meta-bar { display: flex; gap: 32px; font-size: 12px; color: #4b5563; margin-bottom: 16px; padding: 8px 12px; background: #f9fafb; border-radius: 6px; }
        .rapport-divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
        .rapport-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .rapport-table th, .rapport-table td { padding: 10px 14px; text-align: left; border: 1px solid #d1d5db; font-size: 12px; }
        .rapport-table th { background: #f3f4f6; width: 220px; font-weight: 600; color: #374151; }
        .rapport-table td { color: #1a1a2e; }
        h3 { font-size: 14px; margin: 20px 0 8px; color: #1a1a2e; border-left: 3px solid #e50908; padding-left: 10px; }
        .rapport-text { font-size: 12px; color: #374151; white-space: pre-wrap; line-height: 1.7; }
        .rapport-courrier-body { padding: 20px 0; min-height: 200px; }
        .rapport-pj { margin-top: 16px; font-size: 11px; color: #6b7280; }
        .rapport-signatures { display: flex; justify-content: space-between; margin-top: 60px; gap: 40px; }
        .rapport-signatures-3 { gap: 20px; }
        .rapport-signature-block { text-align: center; flex: 1; }
        .rapport-signature-block p { font-weight: 600; margin-bottom: 50px; font-size: 12px; }
        .signature-line { border-top: 1px solid #9ca3af; width: 180px; margin: 0 auto; }
        .signature-hint { display: block; margin-top: 4px; font-size: 9px; color: #9ca3af; }

        /* PV Professional Styles */
        .pv-republic-header { text-align: center; margin-bottom: 8px; padding-top: 8px; }
        .pv-republic-title { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: #1a1a2e; }
        .pv-ministry { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .pv-document-title { text-align: center; margin: 16px 0; padding: 12px; border: 2px solid #1a1a2e; }
        .pv-document-title h2 { font-size: 16px; font-weight: 700; color: #1a1a2e; letter-spacing: 1px; }
        .pv-ref { font-size: 11px; color: #6b7280; margin-top: 4px; }
        .pv-formal-text { font-size: 12px; color: #374151; line-height: 1.8; padding: 0 5px; }
        .pv-formal-text p { margin-bottom: 8px; text-align: justify; }
        .pv-commission-list { margin: 8px 0 8px 24px; list-style: disc; }
        .pv-commission-list li { margin-bottom: 4px; font-size: 12px; }
        .pv-lieu-date { text-align: right; margin-top: 30px; font-size: 12px; padding-right: 10px; }

        @@media print {
            body { padding: 15px 20px; }
            .pv-document-title { border-width: 2px; }
        }
    </style>
</head>
<body>${printArea.innerHTML}</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 300);
    });

    // Download PDF for reception reports
    $("downloadPdfBtn")?.addEventListener("click", async () => {
        const btn = $("downloadPdfBtn");
        const rapportId = btn?.dataset.rapportId;
        if (!rapportId) return;

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Génération...';

        try {
            const res = await fetch(`/api/rapports/${rapportId}/pdf`);
            if (!res.ok) {
                showToast("error", "Erreur PDF", "Impossible de générer le PDF");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const disposition = res.headers.get("Content-Disposition") || "";
            const match = disposition.match(/filename="?([^"]+)"?/);
            a.download = match ? match[1] : `PV_${rapportId}.pdf`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast("success", "PDF généré", "Le document a été téléchargé");
        } catch {
            showToast("error", "Erreur", "Impossible de télécharger le PDF");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    });

    // Delete rapport – modal confirmation
    let pendingDeleteRapportId = null;

    function deleteRapport(rapportId) {
        pendingDeleteRapportId = rapportId;
        const rapport = cachedRapports.find(r => r.id === rapportId);
        const nameEl = $("deleteRapportName");
        if (nameEl) nameEl.textContent = rapport ? rapport.titre : `Rapport #${rapportId}`;
        $("deleteRapportConfirmModal")?.classList.add("active");
    }

    function closeDeleteRapportModal() {
        pendingDeleteRapportId = null;
        $("deleteRapportConfirmModal")?.classList.remove("active");
    }

    $("closeDeleteRapportModal")?.addEventListener("click", closeDeleteRapportModal);
    $("cancelDeleteRapportBtn")?.addEventListener("click", closeDeleteRapportModal);
    $("deleteRapportConfirmModal")?.addEventListener("click", (e) => {
        if (e.target.id === "deleteRapportConfirmModal") closeDeleteRapportModal();
    });

    $("confirmDeleteRapportBtn")?.addEventListener("click", async () => {
        if (!pendingDeleteRapportId) return;
        const rapportId = pendingDeleteRapportId;
        closeDeleteRapportModal();
        const result = await api(`/api/rapports/${rapportId}`, { method: "DELETE" });
        if (result !== null) {
            showToast("success", "Rapport supprimé", "Le rapport a été supprimé");
            refreshNotifBadge();
            cachedRapports = [];
            await loadRapports();
            renderRapportsList();
        } else {
            showToast("error", "Erreur", "Impossible de supprimer le rapport.");
        }
    });

    // ===========================
    // RENDER USERS
    // ===========================
    let cachedPendingUsers = [];

    const roleLabelsUser = {
        Gerant: "Gérant", CoGerant: "Co-Gérant", DirecteurTechnique: "Directeur Technique",
        Ingenieur: "Ingénieur", Secretaire: "Secrétaire", Inconnu: "Non défini"
    };

    const roleColors = {
        Gerant: "#e50908", CoGerant: "#f59e0b", DirecteurTechnique: "#3b82f6",
        Ingenieur: "#10b981", Secretaire: "#8b5cf6", Inconnu: "#9ca3af"
    };

    const rolePermissions = {
        Gerant: ["Gestion complète des projets", "Gestion des utilisateurs", "Approbation des inscriptions", "Gestion budgétaire", "Rapports et exports", "Configuration système"],
        CoGerant: ["Gestion des projets", "Approbation des inscriptions", "Gestion budgétaire", "Rapports et exports"],
        DirecteurTechnique: ["Supervision technique des projets", "Gestion du planning", "Contrôle qualité", "Rapports techniques"],
        Ingenieur: ["Suivi des tâches assignées", "Mise à jour progression", "Consultation des projets", "Rapports de terrain"],
        Secretaire: ["Gestion documentaire", "Saisie des données", "Consultation des projets", "Courriers et bordereaux"]
    };

    async function loadPendingUsers() {
        const data = await api("/api/users/pending");
        if (data) cachedPendingUsers = data;
        return cachedPendingUsers;
    }

    async function renderUsers() {
        const users = await loadUsers();
        await loadPendingUsers();
        renderUsersGrid(users);
        renderPendingList();
        renderTeams(users);
        renderRoles();
        updateUserStats(users);
    }

    function getFilteredUsers() {
        const search = ($("userSearch")?.value || "").toLowerCase();
        const roleFilter = $("filterRole")?.value || "";

        return cachedUsers.filter(u => {
            if (search && !u.nomComplet.toLowerCase().includes(search) && !u.email.toLowerCase().includes(search) && !(u.poste || "").toLowerCase().includes(search)) return false;
            if (roleFilter && u.role !== roleFilter) return false;
            return true;
        });
    }

    function renderUsersGrid(users) {
        const filtered = users || getFilteredUsers();
        const usersGrid = $("usersGrid");
        if (!usersGrid) return;

        if (filtered.length === 0) {
            usersGrid.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;grid-column:1/-1;"><i class="fa-solid fa-user-slash" style="font-size:48px;color:var(--text-tertiary);display:block;margin-bottom:12px;"></i><p>Aucun utilisateur trouvé</p></div>';
            return;
        }

        usersGrid.innerHTML = filtered.map(u => {
            const initials = u.nomComplet.split(" ").map(n => n[0]).join("").substring(0, 2);
            const roleLabel = roleLabelsUser[u.role] || u.role;
            const color = roleColors[u.role] || "#9ca3af";
            const date = formatAppDate(u.dateCreation, { day: "numeric", month: "short", year: "numeric" });
            return `
        <div class="user-card">
          <div class="user-avatar" style="background:${color}20;color:${color}">${initials}</div>
          <div class="user-info">
            <div class="user-name">${esc(u.nomComplet)}</div>
            <div class="user-role" style="color:${color}"><i class="fa-solid fa-shield-halved"></i> ${roleLabel}</div>
            ${u.poste ? `<div class="user-poste"><i class="fa-solid fa-briefcase"></i> ${esc(u.poste)}</div>` : ''}
            <div class="user-meta">
              <span><i class="fa-solid fa-envelope"></i> ${esc(u.email)}</span>
              <span><i class="fa-solid fa-calendar"></i> ${date}</span>
            </div>
            <span class="user-status online">Actif</span>
          </div>
        </div>`;
        }).join("");
    }

    function updateUserStats(users) {
        const el = (id, val) => { const e = $(id); if (e) e.textContent = val; };
        el("statTotalUsers", users.length);
        el("statActiveUsers", users.filter(u => u.estActif).length);
        el("statPendingUsers", cachedPendingUsers.length);

        const badge = $("pendingBadge");
        if (badge) {
            if (cachedPendingUsers.length > 0) {
                badge.textContent = cachedPendingUsers.length;
                badge.style.display = "inline-flex";
            } else {
                badge.style.display = "none";
            }
        }
    }

    // --- User search and filter ---
    $("userSearch")?.addEventListener("input", () => renderUsersGrid(getFilteredUsers()));
    $("filterRole")?.addEventListener("change", () => renderUsersGrid(getFilteredUsers()));

    // --- Pending registrations ---
    function renderPendingList() {
        const container = $("pendingList");
        if (!container) return;

        if (cachedPendingUsers.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;"><i class="fa-solid fa-check-circle" style="font-size:48px;color:#10b981;display:block;margin-bottom:12px;"></i><p>Aucune demande en attente</p></div>';
            return;
        }

        container.innerHTML = cachedPendingUsers.map(u => {
            const initials = u.nomComplet.split(" ").map(n => n[0]).join("").substring(0, 2);
            const date = formatAppDate(u.dateCreation, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
            return `
            <div class="pending-user-item" data-user-id="${u.id}">
                <div class="pending-user-avatar">${initials}</div>
                <div class="pending-user-info">
                    <div class="pending-user-name">${esc(u.nomComplet)}</div>
                    <div class="pending-user-email"><i class="fa-solid fa-envelope"></i> ${esc(u.email)}</div>
                    <div class="pending-user-date"><i class="fa-solid fa-clock"></i> Inscrit le ${date}</div>
                </div>
                <div class="pending-user-actions">
                    <select class="filter-select pending-role-select" id="pendingRole_${u.id}">
                        <option value="">Choisir un rôle...</option>
                        <option value="Ingenieur">Ingénieur</option>
                        <option value="DirecteurTechnique">Directeur Technique</option>
                        <option value="Secretaire">Secrétaire</option>
                        <option value="CoGerant">Co-Gérant</option>
                    </select>
                    <input type="text" class="form-input pending-poste-input" id="pendingPoste_${u.id}" placeholder="Poste (optionnel)" style="width:160px;" />
                    <button class="btn btn-sm btn-success" data-approve-user="${u.id}"><i class="fa-solid fa-check"></i> Accepter</button>
                    <button class="btn btn-sm btn-danger" data-refuse-user="${u.id}"><i class="fa-solid fa-times"></i> Refuser</button>
                </div>
            </div>`;
        }).join("");
    }

    // Approve / Refuse handlers
    document.addEventListener("click", async (e) => {
        const approveBtn = e.target.closest("[data-approve-user]");
        if (approveBtn) {
            const userId = approveBtn.dataset.approveUser;
            const role = $(`pendingRole_${userId}`)?.value;
            const poste = $(`pendingPoste_${userId}`)?.value?.trim() || null;

            if (!role) {
                showToast("error", "Erreur", "Veuillez choisir un rôle avant d'accepter.");
                return;
            }

            const result = await api(`/api/users/${userId}/approve`, {
                method: "POST",
                body: JSON.stringify({ role, poste })
            });

            if (result) {
                showToast("success", "Utilisateur approuvé", "L'inscription a été acceptée.");
                refreshNotifBadge();
                cachedUsers = []; cachedPendingUsers = [];
                await renderUsers();
            } else {
                showToast("error", "Erreur", "Impossible d'approuver l'utilisateur.");
            }
            return;
        }

        const refuseBtn = e.target.closest("[data-refuse-user]");
        if (refuseBtn) {
            const userId = refuseBtn.dataset.refuseUser;
            if (!confirm("Êtes-vous sûr de vouloir refuser cette inscription ?")) return;

            const result = await api(`/api/users/${userId}/refuse`, { method: "DELETE" });
            if (result !== null) {
                showToast("success", "Inscription refusée", "La demande a été supprimée.");
                refreshNotifBadge();
                cachedPendingUsers = [];
                await renderUsers();
            } else {
                showToast("error", "Erreur", "Impossible de refuser l'inscription.");
            }
            return;
        }
    });

    // --- Teams panel: group users by role ---
    function renderTeams(users) {
        const teamsGrid = $("teamsGrid");
        if (!teamsGrid) return;

        const groups = {};
        users.forEach(u => {
            const role = u.role || "Inconnu";
            if (!groups[role]) groups[role] = [];
            groups[role].push(u);
        });

        teamsGrid.innerHTML = Object.keys(groups).map(role => {
            const members = groups[role];
            const label = roleLabelsUser[role] || role;
            const color = roleColors[role] || "#9ca3af";
            return `
            <div class="card team-card">
                <div class="team-card-header" style="border-left:4px solid ${color};">
                    <div class="team-card-title"><i class="fa-solid fa-people-group" style="color:${color}"></i> ${label}</div>
                    <span class="team-card-count">${members.length} membre${members.length > 1 ? 's' : ''}</span>
                </div>
                <div class="team-members-list">
                    ${members.map(m => {
                        const init = m.nomComplet.split(" ").map(n => n[0]).join("").substring(0, 2);
                        return `<div class="team-member-item">
                            <div class="team-member-avatar" style="background:${color}20;color:${color}">${init}</div>
                            <div class="team-member-info">
                                <span class="team-member-name">${esc(m.nomComplet)}</span>
                                <span class="team-member-email">${esc(m.email)}</span>
                                ${m.poste ? `<span class="team-member-poste">${esc(m.poste)}</span>` : ''}
                            </div>
                        </div>`;
                    }).join("")}
                </div>
            </div>`;
        }).join("");
    }

    // --- Roles & Permissions panel ---
    function renderRoles() {
        const rolesList = $("rolesList");
        if (!rolesList) return;

        const roles = Object.keys(rolePermissions);
        rolesList.innerHTML = roles.map(role => {
            const label = roleLabelsUser[role] || role;
            const color = roleColors[role] || "#9ca3af";
            const perms = rolePermissions[role] || [];
            const count = cachedUsers.filter(u => u.role === role).length;

            return `
            <div class="card role-card">
                <div class="role-card-header">
                    <div class="role-card-title" style="color:${color}">
                        <i class="fa-solid fa-shield-halved"></i> ${label}
                    </div>
                    <span class="role-card-count">${count} utilisateur${count > 1 ? 's' : ''}</span>
                </div>
                <div class="role-permissions-list">
                    ${perms.map(p => `<div class="role-perm-item"><i class="fa-solid fa-check" style="color:#10b981"></i> ${esc(p)}</div>`).join("")}
                </div>
            </div>`;
        }).join("");
    }

    // --- Export users ---
    $("exportUsersBtn")?.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/users/export");
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Utilisateurs.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast("success", "Export réussi", "Le fichier Excel a été téléchargé.");
        } catch {
            showToast("error", "Erreur", "Impossible d'exporter les utilisateurs.");
        }
    });

    // --- Import users ---
    $("importUsersFile")?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/users/import", { method: "POST", body: formData });
            if (!res.ok) {
                const text = await res.text();
                showToast("error", "Erreur d'import", text || "Erreur inconnue.");
                return;
            }
            const data = await res.json();
            showToast("success", "Import réussi", `${data.imported} utilisateur(s) importé(s).`);
            if (data.errors && data.errors.length > 0) {
                showToast("warning", "Avertissements", data.errors.slice(0, 3).join("\n"));
            }
            cachedUsers = [];
            await renderUsers();
        } catch {
            showToast("error", "Erreur", "Impossible d'importer les utilisateurs.");
        } finally {
            e.target.value = "";
        }
    });

    // Users tabs (including new pending tab)
    $$(".users-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            // Handle archive tabs separately
            if (tab.dataset.archiveTab) return;

            // Skip montant tabs – handled by montant.js
            if (tab.dataset.montantTab) return;

            $$(".users-tab[data-tab]").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            const tabName = tab.dataset.tab;
            $$(".users-panel").forEach((p) => {
                p.classList.remove("active");
                p.classList.add("hidden");
            });
            const panel = $(`${tabName}Panel`);
            if (panel) {
                panel.classList.remove("hidden");
                panel.classList.add("active");
            }
        });
    });

    // ===========================
    // SETTINGS NAVIGATION
    // ===========================
    $$(".settings-nav-item").forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            $$(".settings-nav-item").forEach((i) => i.classList.remove("active"));
            item.classList.add("active");

            const setting = item.dataset.setting;
            $$(".settings-panel").forEach((p) => {
                p.classList.remove("active");
                p.classList.add("hidden");
            });
            const panel = $(`setting-${setting}`);
            if (panel) {
                panel.classList.remove("hidden");
                panel.classList.add("active");
            }
        });
    });

    // ===========================
    // SETTINGS LOGIC
    // ===========================
    const SETTINGS_KEY = "ingeprojets_settings";

    const defaultSettings = {
        lang: "fr",
        timezone: "Africa/Algiers",
        dateFormat: "dd/MM/yyyy",
        currency: "DZD",
        showKpi: true,
        animCharts: true,
        autoRefresh: false,
        notifEmail: true,
        notifPush: true,
        notifBudget: true,
        notifTasks: true,
        notifWeekly: false,
        theme: "light",
        density: "normal"
    };

    function loadSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
        } catch { return { ...defaultSettings }; }
    }

    function saveSettingsToStorage(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function applySettingsToUI(s) {
        const setVal = (id, val) => { const el = $(id); if (el) el.value = val; };
        const setChk = (id, val) => { const el = $(id); if (el) el.checked = val; };
        const setRadio = (name, val) => { const el = document.querySelector(`input[name="${name}"][value="${val}"]`); if (el) { el.checked = true; el.closest("label")?.click(); } };

        setVal("settingLang", s.lang);
        setVal("settingTimezone", s.timezone);
        setVal("settingDateFormat", s.dateFormat);
        setVal("settingCurrency", s.currency);
        setChk("settingShowKpi", s.showKpi);
        setChk("settingAnimCharts", s.animCharts);
        setChk("settingAutoRefresh", s.autoRefresh);
        setChk("settingNotifEmail", s.notifEmail);
        setChk("settingNotifPush", s.notifPush);
        setChk("settingNotifBudget", s.notifBudget);
        setChk("settingNotifTasks", s.notifTasks);
        setChk("settingNotifWeekly", s.notifWeekly);
        setRadio("theme", s.theme);
        setRadio("density", s.density);
    }

    function readSettingsFromUI() {
        const getVal = (id) => $(id)?.value ?? "";
        const getChk = (id) => $(id)?.checked ?? false;
        const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value ?? "";

        return {
            lang: getVal("settingLang"),
            timezone: getVal("settingTimezone"),
            dateFormat: getVal("settingDateFormat"),
            currency: getVal("settingCurrency"),
            showKpi: getChk("settingShowKpi"),
            animCharts: getChk("settingAnimCharts"),
            autoRefresh: getChk("settingAutoRefresh"),
            notifEmail: getChk("settingNotifEmail"),
            notifPush: getChk("settingNotifPush"),
            notifBudget: getChk("settingNotifBudget"),
            notifTasks: getChk("settingNotifTasks"),
            notifWeekly: getChk("settingNotifWeekly"),
            theme: getRadio("theme"),
            density: getRadio("density")
        };
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);

        $$(".theme-option").forEach(opt => {
            opt.classList.toggle("active", opt.querySelector("input")?.value === theme);
        });
    }

    function applyDensity(density) {
        document.documentElement.setAttribute("data-density", density);
        $$(".density-option").forEach(opt => {
            opt.classList.toggle("active", opt.querySelector("input")?.value === density);
        });
    }

    function applyDashboardSettings(s) {
        const kpiGrid = document.querySelector("#page-dashboard .kpi-grid");
        if (kpiGrid) kpiGrid.style.display = s.showKpi ? "" : "none";
    }

    function applyCurrencyGlobal(currency) {
        window._appCurrency = currency;
        window._appCurrencySymbol = currency === "DZD" ? "DA" : "€";
    }

    function applyDateFormatGlobal(format) {
        window._appDateFormat = format;
    }

    function applyLanguage(lang) {
        document.documentElement.lang = lang;
        window._appLang = lang;
    }

    function applyAllSettings(s) {
        applyTheme(s.theme);
        applyDensity(s.density);
        applyDashboardSettings(s);
        applyCurrencyGlobal(s.currency);
        applyDateFormatGlobal(s.dateFormat);
        applyLanguage(s.lang);
    }

    // Re-render the active page so date/currency/language changes are reflected
    function refreshActivePage() {
        updateDate();
        const hash = window.location.hash.slice(1) || "dashboard";
        if (pages[hash]) loadPageData(hash);
    }

    // Init settings on load
    const appSettings = loadSettings();
    applySettingsToUI(appSettings);
    applyAllSettings(appSettings);

    // Theme radios - apply immediately on click
    $$("input[name='theme']").forEach(radio => {
        radio.addEventListener("change", () => {
            applyTheme(radio.value);
        });
    });

    // Density radios - apply immediately
    $$("input[name='density']").forEach(radio => {
        radio.addEventListener("change", () => {
            applyDensity(radio.value);
            radio.closest("label")?.parentElement?.querySelectorAll(".density-option").forEach(opt => opt.classList.remove("active"));
            radio.closest("label")?.classList.add("active");
        });
    });

    // Save settings button
    $("saveSettingsBtn")?.addEventListener("click", () => {
        const s = readSettingsFromUI();
        saveSettingsToStorage(s);
        applyAllSettings(s);
        refreshActivePage();
        showToast("success", "Paramètres sauvegardés", "Vos préférences ont été enregistrées.");
    });

    // Reset/cancel settings
    $("resetSettingsBtn")?.addEventListener("click", () => {
        const s = loadSettings();
        applySettingsToUI(s);
        applyAllSettings(s);
        refreshActivePage();
        showToast("info", "Modifications annulées", "Les paramètres ont été restaurés.");
    });

    // Change password
    $("changePasswordBtn")?.addEventListener("click", async () => {
        const currentPassword = $("secCurrentPassword")?.value;
        const newPassword = $("secNewPassword")?.value;
        const confirmPassword = $("secConfirmPassword")?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("error", "Erreur", "Veuillez remplir tous les champs.");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("error", "Erreur", "Le nouveau mot de passe et la confirmation ne correspondent pas.");
            return;
        }
        if (newPassword.length < 6) {
            showToast("error", "Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        const result = await api("/api/users/change-password", {
            method: "POST",
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });

        if (result) {
            showToast("success", "Mot de passe modifié", "Votre mot de passe a été changé avec succès.");
            $("secCurrentPassword").value = "";
            $("secNewPassword").value = "";
            $("secConfirmPassword").value = "";
        } else {
            showToast("error", "Erreur", "Mot de passe actuel incorrect ou nouveau mot de passe invalide.");
        }
    });

    // Detect current session device
    (function detectSession() {
        const el = $("sessionCurrentDevice");
        if (!el) return;
        const ua = navigator.userAgent;
        let os = "Inconnu";
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac")) os = "macOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

        let browser = "Navigateur";
        if (ua.includes("Edg/")) browser = "Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari")) browser = "Safari";

        el.textContent = `${os} - ${browser}`;
    })();

    // Data export JSON
    $("dataExportJsonBtn")?.addEventListener("click", async () => {
        try {
            const projects = await api("/api/projects");
            const users = await api("/api/users");
            const data = { projects, users, exportDate: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "ingeprojets-export.json";
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            showToast("success", "Export réussi", "Données exportées en JSON.");
        } catch {
            showToast("error", "Erreur", "Impossible d'exporter les données.");
        }
    });

    // Data export Excel (users)
    $("dataExportExcelBtn")?.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/users/export");
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "Utilisateurs.xlsx";
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            showToast("success", "Export réussi", "Fichier Excel téléchargé.");
        } catch {
            showToast("error", "Erreur", "Impossible d'exporter.");
        }
    });

    // Backup now (save settings timestamp)
    $("dataBackupNowBtn")?.addEventListener("click", () => {
        const now = new Date().toLocaleString(appLocale(), { timeZone: "Africa/Algiers" });
        localStorage.setItem("ingeprojets_lastBackup", now);
        const el = $("dataLastBackup");
        if (el) el.textContent = `Dernière sauvegarde : ${now}`;
        showToast("success", "Sauvegarde effectuée", "Les paramètres ont été sauvegardés.");
    });

    // Restore last backup display
    (function restoreBackupDisplay() {
        const last = localStorage.getItem("ingeprojets_lastBackup");
        const el = $("dataLastBackup");
        if (el && last) el.textContent = `Dernière sauvegarde : ${last}`;
    })();

    // Reset all settings
    $('dataResetSettingsBtn')?.addEventListener('click', () => {
        if (!confirm('\u00cates-vous s\u00fbr de vouloir r\u00e9initialiser tous les param\u00e8tres ?')) return;
        localStorage.removeItem(SETTINGS_KEY);
        const s = { ...defaultSettings };
        applySettingsToUI(s);
        applyAllSettings(s);
        refreshActivePage();
        showToast('success', 'Param\u00e8tres r\u00e9initialis\u00e9s', 'Tous les param\u00e8tres ont \u00e9t\u00e9 remis par d\u00e9faut.');
    });

    // Auto refresh timer
    let autoRefreshInterval = null;
    function startAutoRefresh() {
        stopAutoRefresh();
        const s = loadSettings();
        if (s.autoRefresh) {
            autoRefreshInterval = setInterval(() => { location.reload(); }, 5 * 60 * 1000);
        }
    }
    function stopAutoRefresh() {
        if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
    }
    startAutoRefresh();

    // ===========================
    // FAQ ACCORDION
    // ===========================
    $$(".faq-question").forEach((question) => {
        question.addEventListener("click", () => {
            const item = question.parentElement;
            const isActive = item.classList.contains("active");

            // Fermer tous les autres
            $$(".faq-item").forEach((i) => i.classList.remove("active"));

            // Toggle celui-ci
            if (!isActive) item.classList.add("active");
        });
    });

    // ===========================
    // MODALS
    // ===========================
    const projectModal = $("projectModal");
    const taskModal = $("taskModal");

    // Open modals
    $("newProjectBtn")?.addEventListener("click", () =>
        projectModal?.classList.add("active"),
    );
    $("newTaskBtn")?.addEventListener("click", () =>
        taskModal?.classList.add("active"),
    );

    // Re-populate dependency dropdown when project changes in create modal
    $("taskProject")?.addEventListener("change", (e) => {
        const projetId = e.target.value ? parseInt(e.target.value) : null;
        populateTaskDependencyDropdown("taskDependance", null, projetId);
    });

    // Close modals
    $("closeProjectModal")?.addEventListener("click", () =>
        projectModal?.classList.remove("active"),
    );
    $("cancelProjectBtn")?.addEventListener("click", () =>
        projectModal?.classList.remove("active"),
    );
    $("closeTaskModal")?.addEventListener("click", () =>
        taskModal?.classList.remove("active"),
    );
    $("cancelTaskBtn")?.addEventListener("click", () =>
        taskModal?.classList.remove("active"),
    );

    // Close on overlay click
    [projectModal, taskModal].forEach((modal) => {
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("active");
        });
    });

    // Save handlers
    $("saveProjectBtn")?.addEventListener("click", async () => {
        const body = {
            nom: $("projectName").value,
            code: $("projectCode").value || null,
            description: $("projectDesc").value || null,
            type: $("projectType").value,
            priorite: $("projectPriority").value,
            dateDebut: $("projectStartDate").value,
            dateFinPrevue: $("projectEndDate").value,
            budgetAlloue: parseFloat($("projectBudget").value) || 0,
            nombrePropositionsPrix: parseInt($("projectNombrePropositions")?.value) || null,
            localisation: getGeoLocalisation("projectWilaya", "projectDaira", "projectCommune"),
            maitreOuvrage: $("projectClient").value || null,
            maitreOeuvre: $("projectMaitreOeuvre")?.value || null,
            chefProjetId: $("projectManager").value || null,
        };
        const result = await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
        if (result) {
            showToast("success", "Projet créé", "Le projet a été créé avec succès");
            $("projectForm").reset();
            cachedProjects = [];
            await renderProjects();
            refreshNotifBadge();
        } else {
            showToast("error", "Erreur", "Impossible de créer le projet. Vérifiez les champs.");
        }
        projectModal?.classList.remove("active");
    });

    // Auto-calculate Caution (5% of Montant) for create modal
    function updateProjectCaution() {
        const montant = parseFloat($("projectBudget")?.value) || 0;
        const cautionEl = $("projectCaution");
        if (cautionEl) cautionEl.value = montant > 0 ? formatAppCurrency(montant * 0.05) : "";
    }
    $("projectBudget")?.addEventListener("input", updateProjectCaution);

    // Auto-calculate Délai for create modal
    function updateProjectDelai() {
        const start = $("projectStartDate")?.value;
        const end = $("projectEndDate")?.value;
        const delaiEl = $("projectDelai");
        if (!delaiEl) return;
        if (start && end) {
            const diff = Math.ceil((new Date(end) - new Date(start)) / 86400000);
            delaiEl.value = diff > 0 ? diff + " jour(s)" : "";
        } else {
            delaiEl.value = "";
        }
    }
    $("projectStartDate")?.addEventListener("change", updateProjectDelai);
    $("projectEndDate")?.addEventListener("change", updateProjectDelai);

    // Auto-calculate Caution (5% of Montant) for edit modal
    function updateEditProjectCaution() {
        const montant = parseFloat($("editProjectBudget")?.value) || 0;
        const cautionEl = $("editProjectCaution");
        if (cautionEl) cautionEl.value = montant > 0 ? formatAppCurrency(montant * 0.05) : "";
    }
    $("editProjectBudget")?.addEventListener("input", updateEditProjectCaution);

    // Auto-calculate Délai for edit modal
    function updateEditProjectDelai() {
        const start = $("editProjectStartDate")?.value;
        const end = $("editProjectEndDate")?.value;
        const delaiEl = $("editProjectDelai");
        if (!delaiEl) return;
        if (start && end) {
            const diff = Math.ceil((new Date(end) - new Date(start)) / 86400000);
            delaiEl.value = diff > 0 ? diff + " jour(s)" : "";
        } else {
            delaiEl.value = "";
        }
    }
    $("editProjectStartDate")?.addEventListener("change", updateEditProjectDelai);
    $("editProjectEndDate")?.addEventListener("change", updateEditProjectDelai);

    $("saveTaskBtn")?.addEventListener("click", async () => {
        const body = {
            titre: $("taskTitle").value,
            description: $("taskDesc").value || null,
            priorite: $("taskPriority").value,
            dateDebut: $("taskStartDate").value || null,
            dateEcheance: $("taskDueDate").value,
            progression: parseInt($("taskProgression")?.value) || 0,
            projetId: parseInt($("taskProject").value),
            assigneAId: $("taskAssignee").value || null,
            phase: $("taskPhase")?.value || null,
            commentaire: $("taskCommentaire")?.value || null,
            dependanceId: $("taskDependance")?.value ? parseInt($("taskDependance").value) : null,
            montantPrevu: parseFloat($("taskMontantPrevu")?.value) || 0,
            montantRealise: parseFloat($("taskMontantRealise")?.value) || 0,
        };
        const result = await api("/api/tasks", { method: "POST", body: JSON.stringify(body) });
        if (result) {
            showToast("success", "Tâche créée", "La tâche a été ajoutée au planning");
            refreshNotifBadge();
            $("taskForm").reset();
            if ($("taskProgressionValue")) $("taskProgressionValue").textContent = "0%";
            cachedTasks = [];
            await renderPlanning();
        } else {
            showToast("error", "Erreur", "Impossible de créer la tâche.");
        }
        taskModal?.classList.remove("active");
    });

    // ===========================
    // TOAST NOTIFICATIONS
    // ===========================
    function showToast(type, title, message) {
        const container = $("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <i class="toast-icon fa-solid fa-${type === "success" ? "check-circle" : type === "error" ? "times-circle" : "exclamation-circle"}"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

        container.appendChild(toast);

        toast
            .querySelector(".toast-close")
            .addEventListener("click", () => toast.remove());

        setTimeout(() => toast.remove(), 5000);
    }

    // ===========================
    // DROPDOWNS (NOTIFICATIONS & PROFILE)
    // ===========================
    const state = {
        notif: {
            btn: $("notifBtn"),
            menu: $("notifMenu"),
            clearBtn: $("notifClearBtn"),
        },
        profile: {
            btn: $("profileBtn"),
            menu: $("profileMenu"),
            logoutBtn: $("logoutBtn"),
        },
    };

    const isOpen = (btn) => btn?.getAttribute("aria-expanded") === "true";
    const setExpanded = (btn, expanded) =>
        btn?.setAttribute("aria-expanded", expanded ? "true" : "false");

    const openMenu = (key) => {
        const { btn, menu } = state[key];
        if (!btn || !menu) return;
        const otherKey = key === "notif" ? "profile" : "notif";
        closeMenu(otherKey);
        menu.hidden = false;
        setExpanded(btn, true);
    };

    const closeMenu = (key) => {
        const { btn, menu } = state[key];
        if (!btn || !menu) return;
        menu.hidden = true;
        setExpanded(btn, false);
    };

    const toggleMenu = (key) => {
        const { btn } = state[key];
        if (!btn) return;
        isOpen(btn) ? closeMenu(key) : openMenu(key);
    };

    const closeAll = () => {
        closeMenu("notif");
        closeMenu("profile");
    };

    // Badge notifications
    const badge = $("notifBadge");

    async function loadNotifications() {
        const data = await api("/api/notifications");
        if (!data) return;
        const notifList = $("notifList");
        if (!notifList) return;

        if (data.length === 0) {
            notifList.innerHTML = '<div class="notif-empty" style="padding:24px;text-align:center;color:var(--text-tertiary);"><i class="fa-solid fa-bell-slash" style="font-size:24px;margin-bottom:8px;display:block;"></i>Aucune notification</div>';
        } else {
            notifList.innerHTML = data.map(n => {
                const timeAgo = getTimeAgo(n.dateCreation);
                return `<a class="notif-item" href="#" role="menuitem" data-read="${n.estLue}" data-notif-id="${n.id}" data-entity-type="${n.entityType || ''}" data-entity-id="${n.entityId || ''}">
                    <span class="notif-dot"></span>
                    <div class="notif-content">
                        <div class="notif-text">${esc(n.message)}</div>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                </a>`;
            }).join("");
        }

        updateNotifBadge(data);
    }

    function updateNotifBadge(data) {
        if (!badge) return;
        const unread = data ? data.filter(n => !n.estLue).length : 0;
        badge.textContent = String(unread);
        badge.style.display = unread > 0 ? "flex" : "none";
    }

    async function refreshNotifBadge() {
        const countData = await api("/api/notifications/unread-count");
        if (!countData) return;
        if (badge) {
            badge.textContent = String(countData.count);
            badge.style.display = countData.count > 0 ? "flex" : "none";
        }
    }

    // Notifications
    if (state.notif.btn && state.notif.menu) {
        state.notif.btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleMenu("notif");
            loadNotifications();
        });

        state.notif.menu.addEventListener("click", async (e) => {
            const item = e.target.closest(".notif-item");
            if (item && item.dataset.read !== "true") {
                item.dataset.read = "true";
                const notifId = item.dataset.notifId;
                if (notifId) await api(`/api/notifications/${notifId}/read`, { method: "POST" });
                refreshNotifBadge();
            }
        });

        state.notif.clearBtn?.addEventListener("click", async (e) => {
            e.stopPropagation();
            await api("/api/notifications/mark-all-read", { method: "POST" });
            state.notif.menu.querySelectorAll(".notif-item").forEach(it => it.dataset.read = "true");
            if (badge) { badge.textContent = "0"; badge.style.display = "none"; }
            closeMenu("notif");
        });

        refreshNotifBadge();
    }

    // Profile
    if (state.profile.btn && state.profile.menu) {
        state.profile.btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleMenu("profile");
        });
    }

    // Mon profil modal
    document.addEventListener("click", (e) => {
        const monProfilLink = e.target.closest('a.profile-item[href="#mon-profil"]');
        if (monProfilLink) {
            e.preventDefault();
            closeAll();
            openMyProfileModal();
            return;
        }
    });

    async function openMyProfileModal() {
        const modal = $("myProfileModal");
        if (!modal) return;

        const body = $("myProfileBody");
        body.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--text-tertiary);"></i><p style="color:var(--text-tertiary);margin-top:8px;">Chargement...</p></div>';
        modal.classList.add("active");

        const user = await api("/api/dashboard/me");
        if (!user) {
            body.innerHTML = '<div style="text-align:center;padding:40px;"><p style="color:var(--color-red);">Impossible de charger le profil.</p></div>';
            return;
        }

        const roleLabelsProfile = {
            Gerant: "Gérant", CoGerant: "Co-Gérant", DirecteurTechnique: "Directeur Technique",
            Ingenieur: "Ingénieur", Secretaire: "Secrétaire", Inconnu: "Non défini"
        };
        const roleColorsProfile = {
            Gerant: "#e50908", CoGerant: "#f59e0b", DirecteurTechnique: "#3b82f6",
            Ingenieur: "#10b981", Secretaire: "#8b5cf6", Inconnu: "#9ca3af"
        };
        const roleLabel = roleLabelsProfile[user.role] || user.role;
        const roleColor = roleColorsProfile[user.role] || "#9ca3af";
        const initials = (user.nomComplet || "?").split(" ").map(n => n[0]).join("").substring(0, 2);
        const dateCreation = user.dateCreation ? formatAppDate(user.dateCreation, { day: "numeric", month: "long", year: "numeric" }) : "—";

        body.innerHTML = `
            <div class="my-profile-content">
                <div class="my-profile-avatar" style="background:${roleColor}20;color:${roleColor};">${initials}</div>
                <h3 class="my-profile-name">${esc(user.nomComplet)}</h3>
                <span class="my-profile-role" style="background:${roleColor}15;color:${roleColor};">
                    <i class="fa-solid fa-shield-halved"></i> ${esc(roleLabel)}
                </span>
                <div class="my-profile-details">
                    <div class="my-profile-detail-row">
                        <span class="my-profile-detail-label"><i class="fa-solid fa-user"></i> Nom</span>
                        <span class="my-profile-detail-value">${esc(user.nom)}</span>
                    </div>
                    <div class="my-profile-detail-row">
                        <span class="my-profile-detail-label"><i class="fa-solid fa-user"></i> Prénom</span>
                        <span class="my-profile-detail-value">${esc(user.prenom)}</span>
                    </div>
                    <div class="my-profile-detail-row">
                        <span class="my-profile-detail-label"><i class="fa-solid fa-envelope"></i> Email</span>
                        <span class="my-profile-detail-value">${esc(user.email)}</span>
                    </div>
                    ${user.poste ? `<div class="my-profile-detail-row">
                        <span class="my-profile-detail-label"><i class="fa-solid fa-briefcase"></i> Poste</span>
                        <span class="my-profile-detail-value">${esc(user.poste)}</span>
                    </div>` : ''}
                    <div class="my-profile-detail-row">
                        <span class="my-profile-detail-label"><i class="fa-solid fa-calendar"></i> Membre depuis</span>
                        <span class="my-profile-detail-value">${dateCreation}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Close my profile modal
    $("closeMyProfileModal")?.addEventListener("click", () => $("myProfileModal")?.classList.remove("active"));
    $("myProfileModal")?.addEventListener("click", (e) => { if (e.target.id === "myProfileModal") $("myProfileModal").classList.remove("active"); });

    // Logout is handled by the <a href="/Logout"> link

    // Click outside
    document.addEventListener("click", (e) => {
        const inNotif =
            state.notif.menu?.contains(e.target) ||
            state.notif.btn?.contains(e.target);
        const inProfile =
            state.profile.menu?.contains(e.target) ||
            state.profile.btn?.contains(e.target);
        if (!inNotif && !inProfile) closeAll();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAll();
    });

    // ===========================
    // VIEW TOGGLE (PROJETS)
    // ===========================
    let projectsMapInstance = null;

    $$(".view-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            $$(".view-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const view = btn.dataset.view;
            const grid = $("projectsGrid");
            const table = $("projectsTable");
            const map = $("projectsMap");

            grid?.classList.add("hidden");
            table?.classList.add("hidden");
            map?.classList.add("hidden");

            if (view === "grid") {
                grid?.classList.remove("hidden");
            } else if (view === "list") {
                table?.classList.remove("hidden");
                renderProjectsTable();
            } else if (view === "map") {
                map?.classList.remove("hidden");
                renderProjectsMap();
            }
        });
    });

    function renderProjectsMap() {
        const mapContainer = $("projectsMapLeaflet");
        if (!mapContainer || !window.L) return;

        if (projectsMapInstance) {
            projectsMapInstance.remove();
            projectsMapInstance = null;
        }

        projectsMapInstance = L.map("projectsMapLeaflet").setView([28.0, 2.5], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
        }).addTo(projectsMapInstance);

        // Approximate coordinates for Algerian wilayas
        const wilayaCoords = {
            "Adrar": [27.87, -0.29], "Chlef": [36.16, 1.33], "Laghouat": [33.80, 2.88],
            "Oum El Bouaghi": [35.87, 7.11], "Batna": [35.56, 6.17], "Béjaïa": [36.75, 5.08],
            "Biskra": [34.85, 5.73], "Béchar": [31.62, -2.22], "Blida": [36.47, 2.83],
            "Bouira": [36.38, 3.90], "Tamanrasset": [22.79, 5.53], "Tébessa": [35.40, 8.12],
            "Tlemcen": [34.88, -1.31], "Tiaret": [35.37, 1.32], "Tizi Ouzou": [36.71, 4.05],
            "Alger": [36.74, 3.06], "Djelfa": [34.67, 3.25], "Jijel": [36.82, 5.77],
            "Sétif": [36.19, 5.41], "Saïda": [34.83, 0.15], "Skikda": [36.88, 6.91],
            "Sidi Bel Abbès": [35.19, -0.63], "Annaba": [36.90, 7.77], "Guelma": [36.46, 7.43],
            "Constantine": [36.37, 6.61], "Médéa": [36.26, 2.75], "Mostaganem": [35.93, 0.09],
            "M'Sila": [35.71, 4.54], "Mascara": [35.40, 0.14], "Ouargla": [31.95, 5.33],
            "Oran": [35.70, -0.63], "El Bayadh": [33.68, 1.02], "Illizi": [26.51, 8.48],
            "Bordj Bou Arréridj": [36.07, 4.76], "Boumerdès": [36.76, 3.47], "El Tarf": [36.77, 8.31],
            "Tindouf": [27.67, -8.15], "Tissemsilt": [35.61, 1.81], "El Oued": [33.37, 6.86],
            "Khenchela": [35.43, 7.14], "Souk Ahras": [36.29, 7.95], "Tipaza": [36.59, 2.45],
            "Mila": [36.45, 6.26], "Aïn Defla": [36.26, 1.97], "Naâma": [33.27, -0.31],
            "Aïn Témouchent": [35.30, -1.14], "Ghardaïa": [32.49, 3.67], "Relizane": [35.74, 0.56],
            "Timimoun": [29.26, 0.23], "Bordj Badji Mokhtar": [21.33, 0.95],
            "Ouled Djellal": [34.43, 5.07], "Béni Abbès": [30.13, -2.17],
            "In Salah": [27.19, 2.47], "In Guezzam": [19.57, 5.77],
            "Touggourt": [33.10, 6.06], "Djanet": [24.55, 9.48],
            "El M'Ghair": [33.95, 5.93], "El Meniaa": [30.58, 2.88]
        };

        cachedProjects.forEach((p) => {
            if (!p.localisation) return;

            const color = "#3b82f6";

            const markerIcon = L.divIcon({
                className: "map-marker-custom",
                html: `<div class="map-marker" style="background: ${color}; box-shadow: 0 2px 8px ${color}80;">
                         <i class="fa-solid fa-${typeIconMap[p.type] || "folder"}"></i>
                       </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            // Try to resolve coordinates from the wilaya name in localisation
            let lat = 28.0, lng = 2.5;
            const locParts = (p.localisation || '').split(',').map(s => s.trim());
            for (const part of locParts) {
                if (wilayaCoords[part]) { [lat, lng] = wilayaCoords[part]; break; }
            }
            // Add small random offset to avoid stacking markers
            lat += (Math.random() - 0.5) * 0.3;
            lng += (Math.random() - 0.5) * 0.3;

            const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(projectsMapInstance);

            marker.bindPopup(`
                <div class="map-popup">
                    <div class="map-popup-header">
                        <span class="map-popup-title">${esc(p.nom)}</span>
                        <span class="map-popup-badge">${esc(statusLabels[p.statut] || p.statut)}</span>
                    </div>
                    <div class="map-popup-info">
                        <div><i class="fa-solid fa-map-marker-alt"></i> ${esc(p.localisation)}</div>
                        <div><i class="fa-solid fa-user"></i> ${esc(p.chefProjet || "Non assigné")}</div>
                        <div><i class="fa-solid ${currencyIconClass()}"></i> ${fmtBudgetM(p.budgetAlloue)}</div>
                    </div>
                </div>
            `, { maxWidth: 280 });
        });

        setTimeout(() => {
            projectsMapInstance.invalidateSize();
        }, 200);
    }

    function renderProjectsTable() {
        const filtered = getFilteredProjects();
        renderProjectsTableFiltered(filtered);
    }

    // ===========================
    // PROJECT ACTIONS (Voir / Modifier / Plus)
    // ===========================

    // --- VIEW PROJECT DETAIL ---
    async function openProjectView(projectId) {
        const p = await api(`/api/projects/${projectId}`);
        if (!p) return;

        const depense = p.depense || 0;
        const budgetPct = p.budgetAlloue > 0 ? Math.round(depense / p.budgetAlloue * 100) : 0;
        const remaining = p.budgetAlloue - depense;
        const budgetStatus = budgetPct > 100 ? "danger" : budgetPct > 80 ? "warning" : "success";
        const ti = typeIconMap[p.type] || "folder";

        const modal = $("viewProjectModal");
        if (!modal) return;

        $("viewProjectBody").innerHTML = `
            <div class="view-project-top">
                <div class="view-project-title-row">
                    <div>
                        <h2 class="view-project-name">${p.nom}</h2>
                        <span class="view-project-code">${p.code || ''}</span>
                    </div>
                    <div class="view-project-badges">
                        <span class="project-status status--${statusCssMap[p.statut] || 'info'}">${statusLabels[p.statut] || p.statut}</span>
                        <span class="project-card-priority priority-${prioriteCssMap[p.priorite] || 'medium'}">${prioriteLabels[p.priorite] || p.priorite}</span>
                    </div>
                </div>
            </div>
            <div class="view-project-grid">
                <div class="view-project-section">
                    <h4><i class="fa-solid fa-circle-info"></i> Informations</h4>
                    <div class="view-project-details">
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-${ti}"></i> Type</span><span class="view-detail-value">${typeLabels[p.type] || p.type}</span></div>
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-map-marker-alt"></i> Localisation</span><span class="view-detail-value">${p.localisation || 'Non défini'}</span></div>
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-user"></i> Chef de projet</span><span class="view-detail-value">${p.chefProjet || 'Non assigné'}</span></div>
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-calendar-plus"></i> Début</span><span class="view-detail-value">${formatAppDate(p.dateDebut, { day: "numeric", month: "long", year: "numeric" })}</span></div>
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-calendar-check"></i> Échéance</span><span class="view-detail-value">${formatAppDate(p.dateFinPrevue, { day: "numeric", month: "long", year: "numeric" })}</span></div>
                    </div>
                </div>
                <div class="view-project-section">
                    <h4><i class="fa-solid fa-coins"></i> Budget</h4>
                    <div class="view-budget-cards">
                        <div class="view-budget-card"><span class="view-budget-label">Alloué</span><span class="view-budget-value">${fmtBudgetM(p.budgetAlloue, 2)}</span></div>
                        <div class="view-budget-card"><span class="view-budget-label">Dépensé</span><span class="view-budget-value view-budget--spent">${fmtBudgetM(depense, 2)}</span></div>
                        <div class="view-budget-card"><span class="view-budget-label">Restant</span><span class="view-budget-value view-budget--${budgetStatus}">${fmtBudgetM(remaining, 2)}</span></div>
                    </div>
                    <div class="view-budget-bar">
                        <div class="progress-header"><span>Consommation</span><span>${budgetPct}%</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(budgetPct, 100)}%"></div></div>
                    </div>
                </div>
            </div>
            <div class="view-project-section">
                <h4><i class="fa-solid fa-chart-line"></i> Avancement global</h4>
                <div class="view-progress-big">
                    <div class="view-progress-ring" style="--progress: ${p.avancement}"><span class="view-progress-pct">${p.avancement}%</span></div>
                    <div class="view-progress-info"><span>Progression du projet</span><div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${p.avancement}%"></div></div></div>
                </div>
            </div>
            <div class="view-project-section view-documents-section">
                <div class="view-documents-header">
                    <h4><i class="fa-solid fa-paperclip"></i> Documents associés</h4>
                    <button class="btn btn-primary" id="addDocumentBtn" data-projet-id="${p.id}">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Ajouter un fichier
                    </button>
                </div>
                <div class="view-documents-list" id="viewDocumentsList" data-projet-id="${p.id}">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Chargement...</div>
                </div>
            </div>
            <div class="view-project-section">
                <h4><i class="fa-solid fa-list-check"></i> Tâches (${p.taches?.length || 0})</h4>
                <div class="view-tasks-list">
                    ${p.taches && p.taches.length > 0 ? p.taches.map(t => {
                        const tsc = taskStatusMap[t.statut] || "todo";
                        const tpc = prioriteCssMap[t.priorite] || "medium";
                        const tprog = t.progression || 0;
                        const tStatusLabel = t.statut === "AFaire" ? "À faire" : t.statut === "EnCours" ? "En cours" : t.statut === "EnRevue" ? "En revue" : "Terminée";
                        return `<div class="view-task-item">
                            <div class="view-task-info">
                                <span class="view-task-dot view-task-dot-${tsc}"></span>
                                <span class="view-task-name">${t.titre}</span>
                                <span class="project-card-priority priority-${tpc}" style="font-size:10px;padding:1px 6px">${prioriteLabels[t.priorite] || t.priorite}</span>
                            </div>
                            <div class="view-task-meta">
                                <span class="view-task-assignee"><i class="fa-solid fa-user"></i> ${t.assigneA || 'Non assigné'}</span>
                                <span class="view-task-due"><i class="fa-solid fa-calendar"></i> ${formatAppDate(t.dateEcheance, { day: "numeric", month: "short" })}</span>
                                <div class="view-task-progress">
                                    <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${tprog}%"></div></div>
                                    <span>${tprog}%</span>
                                </div>
                                <span class="timeline-status timeline-status-${tsc}">${tStatusLabel}</span>
                            </div>
                            <div class="view-task-actions">
                                <button class="btn btn-sm btn-outline" data-edit-task-id="${t.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn btn-sm btn-outline" data-archive-task-id="${t.id}" title="Archiver"><i class="fa-solid fa-box-archive"></i></button>
                                <button class="btn btn-sm btn-outline btn-danger-outline" data-delete-task-id="${t.id}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>`;
                    }).join("") : '<div class="empty-state" style="padding:20px"><p>Aucune tâche pour ce projet</p></div>'}
                </div>
            </div>
        `;
        modal.classList.add("active");

        // Verify the documents section rendered
        console.log("[ProjectView] Documents section rendered:", !!document.getElementById("addDocumentBtn"), "projetId:", p.id);

        // Load documents for this project
        loadDocuments(p.id);
    }

    // --- EDIT PROJECT ---
    let editingProjectId = null;

    function openProjectEdit(projectId) {
        const p = cachedProjects.find(pr => pr.id === projectId);
        if (!p) return;
        editingProjectId = projectId;

        const modal = $("editProjectModal");
        if (!modal) return;

        $("editProjectName").value = p.nom;
        $("editProjectCode").value = p.code || '';
        $("editProjectType").value = p.type;
        $("editProjectPriority").value = p.priorite;
        $("editProjectStartDate").value = p.dateDebut ? p.dateDebut.substring(0, 10) : '';
        $("editProjectEndDate").value = p.dateFinPrevue ? p.dateFinPrevue.substring(0, 10) : '';
        $("editProjectBudget").value = p.budgetAlloue;
        if ($("editProjectNombrePropositions")) $("editProjectNombrePropositions").value = p.nombrePropositionsPrix || '';
        if ($("editProjectMaitreOeuvre")) $("editProjectMaitreOeuvre").value = p.maitreOeuvre || '';
        setGeoFromLocalisation(p.localisation || '', "editProjectWilaya", "editProjectDaira", "editProjectCommune");
        $("editProjectStatus").value = p.statut;

        // Store fields not in edit form to preserve them on save
        modal.dataset.avancement = p.avancement;
        modal.dataset.chefProjetId = p.chefProjetId || '';
        modal.dataset.maitreOuvrage = p.maitreOuvrage || '';
        modal.dataset.description = p.description || '';

        modal.classList.add("active");

        updateEditProjectCaution();
        updateEditProjectDelai();
    }

    // --- MORE MENU ---
    let activeMoreMenu = null;

    function openMoreMenu(btn, projectId) {
        closeMoreMenu();

        const menu = document.createElement("div");
        menu.className = "project-more-menu";
        menu.innerHTML = `
            <button class="project-more-item" data-more-action="duplicate" data-project-id="${projectId}">
                <i class="fa-solid fa-copy"></i> Dupliquer
            </button>
            <button class="project-more-item" data-more-action="archive" data-project-id="${projectId}">
                <i class="fa-solid fa-box-archive"></i> Archiver
            </button>
            <div class="project-more-divider"></div>
            <button class="project-more-item project-more-item--danger" data-more-action="delete" data-project-id="${projectId}">
                <i class="fa-solid fa-trash"></i> Supprimer
            </button>
        `;

        btn.closest(".project-card-actions, .table-actions-group").appendChild(menu);
        activeMoreMenu = menu;

        requestAnimationFrame(() => menu.classList.add("active"));
    }

    function closeMoreMenu() {
        if (activeMoreMenu) {
            activeMoreMenu.remove();
            activeMoreMenu = null;
        }
    }

    // --- DELETE CONFIRM ---
    function openDeleteConfirm(projectId) {
        const p = cachedProjects.find(pr => pr.id === projectId);
        if (!p) return;

        const modal = $("deleteConfirmModal");
        if (!modal) return;

        $("deleteProjectName").textContent = p.nom;
        modal.dataset.projectId = projectId;
        modal.classList.add("active");
    }

    // --- EVENT DELEGATION ---
    document.addEventListener("click", async (e) => {
        // Card action buttons
        const actionBtn = e.target.closest("[data-action]");
        if (actionBtn) {
            e.stopPropagation();
            const projectId = parseInt(actionBtn.dataset.projectId);
            const action = actionBtn.dataset.action;

            if (action === "view") openProjectView(projectId);
            else if (action === "edit") openProjectEdit(projectId);
            else if (action === "more") openMoreMenu(actionBtn, projectId);
            return;
        }

        // More menu items
        const moreItem = e.target.closest("[data-more-action]");
        if (moreItem) {
            e.stopPropagation();
            const projectId = parseInt(moreItem.dataset.projectId);
            const action = moreItem.dataset.moreAction;
            closeMoreMenu();

            if (action === "duplicate") {
                showToast("success", "Projet dupliqué", "Le projet a été dupliqué avec succès");
                refreshNotifBadge();
            } else if (action === "archive") {
                await archiveProject(projectId);
            } else if (action === "delete") {
                openDeleteConfirm(projectId);
            }
            return;
        }

        // Close more menu on outside click
        if (activeMoreMenu && !e.target.closest(".project-more-menu")) {
            closeMoreMenu();
        }
    });

    // View modal close
    $("closeViewProjectModal")?.addEventListener("click", () =>
        $("viewProjectModal")?.classList.remove("active"),
    );
    $("viewProjectModal")?.addEventListener("click", (e) => {
        if (e.target.id === "viewProjectModal") $("viewProjectModal").classList.remove("active");
    });

    // Edit modal close / save
    $("closeEditProjectModal")?.addEventListener("click", () =>
        $("editProjectModal")?.classList.remove("active"),
    );
    $("cancelEditProjectBtn")?.addEventListener("click", () =>
        $("editProjectModal")?.classList.remove("active"),
    );
    $("editProjectModal")?.addEventListener("click", (e) => {
        if (e.target.id === "editProjectModal") $("editProjectModal").classList.remove("active");
    });
    $("saveEditProjectBtn")?.addEventListener("click", async () => {
        if (editingProjectId) {
            const modal = $("editProjectModal");
            const body = {
                nom: $("editProjectName").value,
                code: $("editProjectCode").value || null,
                description: modal?.dataset.description || null,
                type: $("editProjectType").value,
                priorite: $("editProjectPriority").value,
                statut: $("editProjectStatus").value,
                dateDebut: $("editProjectStartDate").value,
                dateFinPrevue: $("editProjectEndDate").value,
                budgetAlloue: parseFloat($("editProjectBudget").value) || 0,
                nombrePropositionsPrix: parseInt($("editProjectNombrePropositions")?.value) || null,
                localisation: getGeoLocalisation("editProjectWilaya", "editProjectDaira", "editProjectCommune"),
                maitreOuvrage: modal?.dataset.maitreOuvrage || null,
                maitreOeuvre: $("editProjectMaitreOeuvre")?.value || null,
                chefProjetId: modal?.dataset.chefProjetId || null,
                avancement: parseInt(modal?.dataset.avancement) || 0,
            };
            const result = await api(`/api/projects/${editingProjectId}`, { method: "PUT", body: JSON.stringify(body) });
            if (result) {
            showToast("success", "Projet modifié", "Les modifications ont été enregistrées");
            refreshNotifBadge();
                cachedProjects = [];
                await renderProjects();
            } else {
                showToast("error", "Erreur", "Impossible de modifier le projet.");
            }
        }
        $("editProjectModal")?.classList.remove("active");
        editingProjectId = null;
    });

    // Delete confirm modal
    $("closeDeleteConfirmModal")?.addEventListener("click", () =>
        $("deleteConfirmModal")?.classList.remove("active"),
    );
    $("cancelDeleteBtn")?.addEventListener("click", () =>
        $("deleteConfirmModal")?.classList.remove("active"),
    );
    $("deleteConfirmModal")?.addEventListener("click", (e) => {
        if (e.target.id === "deleteConfirmModal") $("deleteConfirmModal").classList.remove("active");
    });
    $("confirmDeleteBtn")?.addEventListener("click", async () => {
        const modal = $("deleteConfirmModal");
        const projectId = parseInt(modal?.dataset.projectId);
        const result = await api(`/api/projects/${projectId}`, { method: "DELETE" });
        if (result !== null) {
            showToast("success", "Projet supprimé", "Le projet a été définitivement supprimé");
            refreshNotifBadge();
            cachedProjects = [];
            await renderProjects();
        } else {
            showToast("error", "Erreur", "Impossible de supprimer le projet.");
        }
        modal?.classList.remove("active");
    });

    // ===========================
    // DATE UPDATE
    // ===========================
    function updateDate() {
        const dateEl = $("currentDate");
        if (dateEl) {
            const options = { day: "numeric", month: "long", year: "numeric" };
            dateEl.textContent = new Date().toLocaleDateString(appLocale(), options);
        }
    }

    // ===========================
    // EXPORT / IMPORT PROJECTS
    // ===========================
    $("exportProjectsBtn")?.addEventListener("click", () => {
        if (cachedProjects.length === 0) {
            showToast("error", "Aucun projet", "Il n'y a aucun projet à exporter.");
            return;
        }
        const headers = ["Nom", "Code", "Type", "Priorité", "Statut", "Date de démarrage", "Date fin prévue", "Montant du projet", "Avancement", "Localisation", "Maître d'ouvrage", "Maître d'œuvre", "Chef de projet"];
        const rows = cachedProjects.map(p => [
            `"${(p.nom || '').replace(/"/g, '""')}"`,
            `"${(p.code || '').replace(/"/g, '""')}"`,
            `"${typeLabels[p.type] || p.type}"`,
            `"${prioriteLabels[p.priorite] || p.priorite}"`,
            `"${statusLabels[p.statut] || p.statut}"`,
            p.dateDebut ? formatAppDate(p.dateDebut) : "",
            p.dateFinPrevue ? formatAppDate(p.dateFinPrevue) : "",
            p.budgetAlloue,
            p.avancement + "%",
            `"${(p.localisation || '').replace(/"/g, '""')}"`,
            `"${(p.maitreOuvrage || '').replace(/"/g, '""')}"`,
            `"${(p.chefProjet || '').replace(/"/g, '""')}"`
        ]);
        const bom = "\uFEFF";
        const csv = bom + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `projets_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export réussi", `${cachedProjects.length} projets exportés en CSV.`);
    });

    $("importProjectsFile")?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

            if (isExcel) {
                await importExcelFile(file);
            } else if (file.name.endsWith(".json")) {
                const text = await file.text();
                const data = JSON.parse(text);
                const projects = Array.isArray(data) ? data : [data];
                let created = 0;
                for (const p of projects) {
                    const body = {
                        nom: p.nom || p.Nom || p.name,
                        code: p.code || p.Code || null,
                        description: p.description || p.Description || null,
                        type: p.type || p.Type || "Batiment",
                        priorite: p.priorite || p.Priorite || "Moyenne",
                        dateDebut: p.dateDebut || p.DateDebut || new Date().toISOString(),
                        dateFinPrevue: p.dateFinPrevue || p.DateFinPrevue || new Date().toISOString(),
                        budgetAlloue: parseFloat(p.budgetAlloue || p.BudgetAlloue || 0),
                        nombrePropositionsPrix: parseInt(p.nombrePropositionsPrix || p.NombrePropositionsPrix || 0) || null,
                        localisation: p.localisation || p.Localisation || null,
                        maitreOuvrage: p.maitreOuvrage || p.MaitreOuvrage || null,
                        maitreOeuvre: p.maitreOeuvre || p.MaitreOeuvre || null,
                        chefProjetId: p.chefProjetId || p.ChefProjetId || null,
                    };
                    if (!body.nom) continue;
                    const result = await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
                    if (result) created++;
                }
                showToast("success", "Import réussi", `${created} projet(s) importé(s) depuis le fichier JSON.`);
                refreshNotifBadge();
            } else {
                showToast("error", "Format non supporté", "Veuillez utiliser un fichier Excel (.xlsx) ou JSON.");
            }

            cachedProjects = [];
            await renderProjects();
        } catch (err) {
            showToast("error", "Erreur d'import", "Le fichier est invalide ou corrompu.");
            console.error("Import error:", err);
        }

        e.target.value = "";
    });

    // Excel import: sends file to backend, then auto-creates complete projects
    // and opens the create form pre-filled for incomplete ones
    let pendingImportQueue = [];

    async function importExcelFile(file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/import/excel", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            showToast("error", "Erreur d'import", errText || "Impossible de lire le fichier Excel.");
            return;
        }

        const results = await res.json();
        const created = results.filter(r => r.created);
        const incomplete = results.filter(r => !r.created);

        if (created.length > 0) {
            showToast("success", "Import réussi", `${created.length} projet(s) créé(s) automatiquement depuis Excel.`);
            refreshNotifBadge();
        }

        if (incomplete.length > 0) {
            pendingImportQueue = [...incomplete.map(r => r.data)];
            showToast("info", "Données incomplètes", `${incomplete.length} projet(s) nécessitent des informations supplémentaires. Le formulaire va s'ouvrir.`);
            // Open the form for the first incomplete project
            setTimeout(() => openImportFormForNext(), 500);
        }

        cachedProjects = [];
        await renderProjects();
    }

    function openImportFormForNext() {
        if (pendingImportQueue.length === 0) return;

        const data = pendingImportQueue.shift();
        prefillProjectForm(data);
        projectModal?.classList.add("active");

        // Show info about remaining items
        if (pendingImportQueue.length > 0) {
            showToast("info", "File d'import", `${pendingImportQueue.length} projet(s) restant(s) à compléter après celui-ci.`);
        }
    }

    function prefillProjectForm(data) {
        // Reset form first
        $("projectForm")?.reset();

        if (data.nom) $("projectName").value = data.nom;
        if (data.code) $("projectCode").value = data.code;
        if (data.description) $("projectDesc").value = data.description;
        if (data.type) $("projectType").value = data.type;
        if (data.priorite) $("projectPriority").value = data.priorite;
        if (data.dateDebut) $("projectStartDate").value = data.dateDebut;
        if (data.dateFinPrevue) $("projectEndDate").value = data.dateFinPrevue;
        if (data.budgetAlloue) $("projectBudget").value = data.budgetAlloue;
        if (data.propositionPrix) {
            const npEl = $("projectNombrePropositions");
            if (npEl) npEl.value = data.propositionPrix;
        }
        if (data.nombrePropositionsPrix) {
            const npEl = $("projectNombrePropositions");
            if (npEl) npEl.value = data.nombrePropositionsPrix;
        }
        if (data.localisation) {
            setGeoFromLocalisation(data.localisation, "projectWilaya", "projectDaira", "projectCommune");
        }
        if (data.maitreOuvrage) $("projectClient").value = data.maitreOuvrage;
        if (data.maitreOeuvre) {
            const moEl = $("projectMaitreOeuvre");
            if (moEl) moEl.value = data.maitreOeuvre;
        }

        // Trigger auto-calculations
        updateProjectCaution();
        updateProjectDelai();

        // Highlight missing required fields
        highlightMissingFields(data);
    }

    function highlightMissingFields(data) {
        const requiredMap = {
            projectName: data.nom,
            projectType: data.type,
            projectStartDate: data.dateDebut,
            projectEndDate: data.dateFinPrevue,
            projectBudget: data.budgetAlloue,
        };

        Object.entries(requiredMap).forEach(([fieldId, value]) => {
            const el = $(fieldId);
            if (!el) return;
            // Remove previous highlights
            el.style.removeProperty("border-color");
            el.style.removeProperty("box-shadow");

            if (!value) {
                el.style.borderColor = "#e50908";
                el.style.boxShadow = "0 0 0 2px rgba(229, 9, 8, 0.15)";
                // Remove highlight when user interacts
                const clearHighlight = () => {
                    el.style.removeProperty("border-color");
                    el.style.removeProperty("box-shadow");
                    el.removeEventListener("input", clearHighlight);
                    el.removeEventListener("change", clearHighlight);
                };
                el.addEventListener("input", clearHighlight);
                el.addEventListener("change", clearHighlight);
            }
        });
    }

    // Override save project to continue import queue after saving
    const originalSaveHandler = $("saveProjectBtn");
    if (originalSaveHandler) {
        const origClick = originalSaveHandler.onclick;
        // We'll hook into the modal close to check if there are more imports
        const observer = new MutationObserver(() => {
            if (projectModal && !projectModal.classList.contains("active") && pendingImportQueue.length > 0) {
                setTimeout(() => openImportFormForNext(), 600);
            }
        });
        if (projectModal) {
            observer.observe(projectModal, { attributes: true, attributeFilter: ["class"] });
        }
    }

    // ===========================
    // SEARCH FUNCTIONALITY
    // ===========================
    let searchTimeout = null;
    let searchResultsEl = null;

    function ensureSearchDropdown() {
        if (searchResultsEl) return searchResultsEl;
        searchResultsEl = document.createElement("div");
        searchResultsEl.className = "global-search-results";
        searchResultsEl.id = "globalSearchResults";
        const searchContainer = document.querySelector(".global-search");
        if (searchContainer) {
            searchContainer.style.position = "relative";
            searchContainer.appendChild(searchResultsEl);
        }
        return searchResultsEl;
    }

    function closeSearchResults() {
        if (searchResultsEl) {
            searchResultsEl.innerHTML = "";
            searchResultsEl.classList.remove("active");
        }
    }

    $("globalSearch")?.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (searchTimeout) clearTimeout(searchTimeout);
        if (query.length < 1) { closeSearchResults(); return; }

        searchTimeout = setTimeout(async () => {
            const results = await api(`/api/dashboard/search?q=${encodeURIComponent(query)}`);
            if (!results) { closeSearchResults(); return; }

            const dropdown = ensureSearchDropdown();
            let html = "";

            const hasResults = (results.projets?.length || 0) + (results.taches?.length || 0) + (results.utilisateurs?.length || 0);

            if (!hasResults) {
                html = '<div class="search-empty"><i class="fa-solid fa-search"></i> Aucun résultat pour "' + esc(query) + '"</div>';
            } else {
                if (results.projets?.length > 0) {
                    html += '<div class="search-group-title"><i class="fa-solid fa-folder-open"></i> Projets</div>';
                    results.projets.forEach(p => {
                        const ti = typeIconMap[p.type] || "folder";
                        html += `<a href="#" class="search-result-item" data-search-action="project" data-search-id="${p.id}">
                            <div class="search-result-icon"><i class="fa-solid fa-${ti}"></i></div>
                            <div class="search-result-info">
                                <span class="search-result-name">${esc(p.nom)}</span>
                                <span class="search-result-meta">${p.code ? esc(p.code) + ' · ' : ''}${esc(statusLabels[p.statut] || p.statut)}</span>
                            </div>
                        </a>`;
                    });
                }
                if (results.taches?.length > 0) {
                    html += '<div class="search-group-title"><i class="fa-solid fa-list-check"></i> Tâches</div>';
                    results.taches.forEach(t => {
                        html += `<a href="#" class="search-result-item" data-search-action="task" data-search-id="${t.id}">
                            <div class="search-result-icon"><i class="fa-solid fa-tasks"></i></div>
                            <div class="search-result-info">
                                <span class="search-result-name">${esc(t.nom)}</span>
                                <span class="search-result-meta">${esc(t.projet)}</span>
                            </div>
                        </a>`;
                    });
                }
                if (results.utilisateurs?.length > 0) {
                    html += '<div class="search-group-title"><i class="fa-solid fa-users"></i> Utilisateurs</div>';
                    results.utilisateurs.forEach(u => {
                        html += `<a href="#" class="search-result-item" data-search-action="user" data-search-id="${u.id}">
                            <div class="search-result-icon"><i class="fa-solid fa-user"></i></div>
                            <div class="search-result-info">
                                <span class="search-result-name">${esc(u.nom)}</span>
                                <span class="search-result-meta">${esc(u.email)}</span>
                            </div>
                        </a>`;
                    });
                }
            }

            dropdown.innerHTML = html;
            dropdown.classList.add("active");
        }, 300);
    });

    // Handle search result clicks
    document.addEventListener("click", (e) => {
        const item = e.target.closest(".search-result-item");
        if (item) {
            e.preventDefault();
            const action = item.dataset.searchAction;
            const id = item.dataset.searchId;
            closeSearchResults();
            $("globalSearch").value = "";

            if (action === "project") {
                navigateTo("projets");
                setTimeout(() => openProjectView(parseInt(id)), 300);
            } else if (action === "task") {
                navigateTo("planning");
                setTimeout(() => openTaskEdit(parseInt(id)), 300);
            } else if (action === "user") {
                navigateTo("utilisateurs");
            }
            return;
        }

        // Click on recent project item in dashboard
        const navProject = e.target.closest("[data-nav-project]");
        if (navProject) {
            e.preventDefault();
            const pId = parseInt(navProject.dataset.navProject);
            navigateTo("projets");
            setTimeout(() => openProjectView(pId), 300);
            return;
        }

        // Click on activity item in dashboard
        const actItem = e.target.closest("[data-activity-type]");
        if (actItem) {
            e.preventDefault();
            const entityType = actItem.dataset.activityType;
            const entityId = parseInt(actItem.dataset.activityId);
            if (entityType === "projet" && entityId) {
                navigateTo("projets");
                setTimeout(() => openProjectView(entityId), 300);
            } else if (entityType === "tache" && entityId) {
                navigateTo("planning");
                setTimeout(() => openTaskEdit(entityId), 300);
            } else if (entityType === "rapport" && entityId) {
                navigateTo("projets");
                setTimeout(() => openProjectView(entityId), 300);
            }
            return;
        }

        // Click on upcoming task item in dashboard
        const upcomingItem = e.target.closest("[data-upcoming-task-id]");
        if (upcomingItem) {
            e.preventDefault();
            const taskId = parseInt(upcomingItem.dataset.upcomingTaskId);
            if (taskId) {
                navigateTo("planning");
                setTimeout(() => openTaskEdit(taskId), 300);
            }
            return;
        }

        // Close search results on outside click
        if (!e.target.closest(".global-search")) {
            closeSearchResults();
        }
    });

    $("globalSearch")?.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { closeSearchResults(); $("globalSearch").value = ""; }
    });

    // ===========================
    // PROJECT SEARCH & FILTERS
    // ===========================
    function getFilteredProjects() {
        const searchQuery = ($("projectSearch")?.value || "").toLowerCase().trim();
        const statusFilter = $("filterStatus")?.value || "";
        const typeFilter = $("filterType")?.value || "";
        const priorityFilter = $("filterPriority")?.value || "";

        const statusApiMap = {
            planning: "EnPlanification",
            progress: "EnCours",
            paused: "EnPause",
            completed: "Termine",
            delayed: "EnRetard"
        };
        const typeApiMap = {
            route: "Route",
            pont: "Pont",
            batiment: "Batiment",
            assainissement: "Assainissement",
            energie: "Energie"
        };
        const priorityApiMap = {
            urgent: "Urgente",
            high: "Haute",
            medium: "Moyenne",
            low: "Basse"
        };

        return cachedProjects.filter(p => {
            if (searchQuery && !(
                (p.nom || "").toLowerCase().includes(searchQuery) ||
                (p.code || "").toLowerCase().includes(searchQuery) ||
                (p.localisation || "").toLowerCase().includes(searchQuery) ||
                (p.chefProjet || "").toLowerCase().includes(searchQuery) ||
                (p.maitreOuvrage || "").toLowerCase().includes(searchQuery)
            )) return false;
            if (statusFilter && p.statut !== statusApiMap[statusFilter]) return false;
            if (typeFilter && p.type !== typeApiMap[typeFilter]) return false;
            if (priorityFilter && p.priorite !== priorityApiMap[priorityFilter]) return false;
            return true;
        });
    }

    function applyProjectFilters() {
        const filtered = getFilteredProjects();
        renderProjectCards(filtered);
        renderProjectsTableFiltered(filtered);
        updateProjectStats(filtered);
    }

    function renderProjectCards(projects) {
        const projectsGrid = $("projectsGrid");
        if (!projectsGrid) return;
        if (projects.length === 0) {
            projectsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:40px;text-align:center;"><i class="fa-solid fa-folder-open" style="font-size:48px;color:var(--text-tertiary);margin-bottom:12px;display:block;"></i><p>Aucun projet ne correspond aux critères</p></div>';
            return;
        }
        projectsGrid.innerHTML = projects.map(p => {
            const tl = typeLabels[p.type] || p.type;
            const sl = statusLabels[p.statut] || p.statut;
            const pl = prioriteLabels[p.priorite] || p.priorite;
            const sc = statusCssMap[p.statut] || "info";
            const pc = prioriteCssMap[p.priorite] || "medium";
            const ti = typeIconMap[p.type] || "folder";
            return `
        <div class="card project-card" data-id="${p.id}">
          <div class="project-card-header">
            <div>
              <div class="project-card-title">${esc(p.nom)}</div>
              <div class="project-card-type">
                <i class="fa-solid fa-${ti}"></i> ${esc(tl)}
              </div>
            </div>
            <span class="project-card-priority priority-${pc}">${esc(pl)}</span>
          </div>
          <div class="project-card-progress">
            <div class="progress-header">
              <span>Avancement</span>
              <span>${p.avancement}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${p.avancement}%"></div>
            </div>
          </div>
          <div class="project-card-meta">
            <span><i class="fa-solid fa-user"></i> ${esc(p.chefProjet || "Non assigné")}</span>
            <span><i class="fa-solid fa-calendar"></i> ${formatAppDate(p.dateFinPrevue)}</span>
            <span><i class="fa-solid ${currencyIconClass()}"></i> ${fmtBudgetM(p.budgetAlloue)}</span>
          </div>
          <div class="project-card-footer">
            <div class="project-card-team">
              <span class="project-status status--${sc}">${esc(sl)}</span>
            </div>
            <div class="project-card-actions">
              <button title="Voir" data-action="view" data-project-id="${p.id}"><i class="fa-solid fa-eye"></i></button>
              <button title="Modifier" data-action="edit" data-project-id="${p.id}"><i class="fa-solid fa-pen"></i></button>
              <button title="Plus" data-action="more" data-project-id="${p.id}"><i class="fa-solid fa-ellipsis-v"></i></button>
            </div>
          </div>
        </div>`;
        }).join("");
    }

    function renderProjectsTableFiltered(projects) {
        const tbody = $("projectsTableBody");
        if (!tbody) return;
        tbody.innerHTML = projects.map(p => {
            const sc = statusCssMap[p.statut] || "info";
            return `
      <tr>
        <td><input type="checkbox" /></td>
        <td><strong>${esc(p.nom)}</strong><br><small>${esc(p.code || '')}</small></td>
        <td>${esc(typeLabels[p.type] || p.type)}</td>
        <td>${esc(p.chefProjet || 'Non assigné')}</td>
        <td>${fmtBudgetM(p.budgetAlloue)}</td>
        <td>
          <div class="progress-bar" style="width: 80px;"><div class="progress-fill" style="width: ${p.avancement}%"></div></div>
          ${p.avancement}%
        </td>
        <td><span class="project-status status--${sc}">${esc(statusLabels[p.statut] || p.statut)}</span></td>
        <td>${formatAppDate(p.dateFinPrevue)}</td>
        <td>
          <div class="table-actions-group">
            <button class="btn btn-sm btn-outline" data-action="view" data-project-id="${p.id}" title="Voir"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-sm btn-outline" data-action="edit" data-project-id="${p.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-outline" data-action="more" data-project-id="${p.id}" title="Plus"><i class="fa-solid fa-ellipsis-v"></i></button>
          </div>
        </td>
      </tr>`;
        }).join("");
    }

    $("projectSearch")?.addEventListener("input", () => applyProjectFilters());
    $("filterStatus")?.addEventListener("change", () => applyProjectFilters());
    $("filterType")?.addEventListener("change", () => applyProjectFilters());
    $("filterPriority")?.addEventListener("change", () => applyProjectFilters());

    // ===========================
    // INITIALIZATION
    // ===========================
    updateDate();
    populateDropdowns();

    // ===========================
    // ALGERIA GEO CASCADING DROPDOWNS
    // ===========================
    function initGeoDropdowns(wilayaId, dairaId, communeId) {
        const wilayaSel = $(wilayaId);
        const dairaSel = $(dairaId);
        const communeSel = $(communeId);
        if (!wilayaSel || !dairaSel || !communeSel) return;
        if (typeof ALGERIA_GEO === "undefined") return;

        wilayaSel.innerHTML = '<option value="">Sélectionner une wilaya...</option>' +
            ALGERIA_GEO.map(w => `<option value="${w.name}">${w.code} - ${w.name}</option>`).join("");

        wilayaSel.addEventListener("change", () => {
            const wName = wilayaSel.value;
            const wilaya = ALGERIA_GEO.find(w => w.name === wName);
            dairaSel.innerHTML = '<option value="">Sélectionner une daïra...</option>';
            communeSel.innerHTML = '<option value="">Sélectionner une commune...</option>';
            dairaSel.disabled = true;
            communeSel.disabled = true;
            if (wilaya) {
                dairaSel.innerHTML += wilaya.dairas.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
                dairaSel.disabled = false;
            }
        });

        dairaSel.addEventListener("change", () => {
            const wName = wilayaSel.value;
            const dName = dairaSel.value;
            const wilaya = ALGERIA_GEO.find(w => w.name === wName);
            communeSel.innerHTML = '<option value="">Sélectionner une commune...</option>';
            communeSel.disabled = true;
            if (wilaya) {
                const daira = wilaya.dairas.find(d => d.name === dName);
                if (daira) {
                    communeSel.innerHTML += daira.communes.map(c => `<option value="${c}">${c}</option>`).join("");
                    communeSel.disabled = false;
                }
            }
        });
    }

    function getGeoLocalisation(wilayaId, dairaId, communeId) {
        const w = $(wilayaId)?.value || "";
        const d = $(dairaId)?.value || "";
        const c = $(communeId)?.value || "";
        const parts = [c, d, w].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : null;
    }

    function setGeoFromLocalisation(localisation, wilayaId, dairaId, communeId) {
        if (!localisation || typeof ALGERIA_GEO === "undefined") return;
        const wilayaSel = $(wilayaId);
        const dairaSel = $(dairaId);
        const communeSel = $(communeId);
        if (!wilayaSel) return;

        const parts = localisation.split(",").map(s => s.trim());

        // Try to find matching wilaya in the parts
        let matchedWilaya = null;
        let matchedDaira = null;
        let matchedCommune = null;

        for (const part of parts) {
            const w = ALGERIA_GEO.find(w => w.name.toLowerCase() === part.toLowerCase());
            if (w) { matchedWilaya = w; break; }
        }

        if (!matchedWilaya) {
            // Try partial match
            for (const part of parts) {
                const w = ALGERIA_GEO.find(w => part.toLowerCase().includes(w.name.toLowerCase()) || w.name.toLowerCase().includes(part.toLowerCase()));
                if (w) { matchedWilaya = w; break; }
            }
        }

        if (matchedWilaya) {
            wilayaSel.value = matchedWilaya.name;
            wilayaSel.dispatchEvent(new Event("change"));

            // Try to match daira
            for (const part of parts) {
                const d = matchedWilaya.dairas.find(d => d.name.toLowerCase() === part.toLowerCase());
                if (d) { matchedDaira = d; break; }
            }
            if (matchedDaira && dairaSel) {
                dairaSel.value = matchedDaira.name;
                dairaSel.dispatchEvent(new Event("change"));

                // Try to match commune
                for (const part of parts) {
                    const c = matchedDaira.communes.find(c => c.toLowerCase() === part.toLowerCase());
                    if (c) { matchedCommune = c; break; }
                }
                if (matchedCommune && communeSel) {
                    communeSel.value = matchedCommune;
                }
            }
        }
    }

    initGeoDropdowns("projectWilaya", "projectDaira", "projectCommune");
    initGeoDropdowns("editProjectWilaya", "editProjectDaira", "editProjectCommune");

    // Task progression slider
    $("taskProgression")?.addEventListener("input", (e) => {
        const val = e.target.value;
        const label = $("taskProgressionValue");
        if (label) label.textContent = val + "%";
    });

    // Edit task progression slider
    $("editTaskProgression")?.addEventListener("input", (e) => {
        const val = e.target.value;
        const label = $("editTaskProgressionValue");
        if (label) label.textContent = val + "%";
    });

    // Duration auto-calculation
    function calcDuration(startId, endId, durationId) {
        const s = $(startId)?.value;
        const e = $(endId)?.value;
        const d = $(durationId);
        if (s && e && d) {
            const diff = Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000));
            d.value = diff;
        } else if (d) {
            d.value = "";
        }
    }

    $("taskStartDate")?.addEventListener("change", () => calcDuration("taskStartDate", "taskDueDate", "taskDuration"));
    $("taskDueDate")?.addEventListener("change", () => calcDuration("taskStartDate", "taskDueDate", "taskDuration"));
    $("editTaskStartDate")?.addEventListener("change", () => calcDuration("editTaskStartDate", "editTaskDueDate", "editTaskDuration"));
    $("editTaskDueDate")?.addEventListener("change", () => calcDuration("editTaskStartDate", "editTaskDueDate", "editTaskDuration"));

    // Delayed tasks view
    async function renderDelayedTasks() {
        const body = $("delayedTasksBody");
        if (!body) return;

        const tasks = await api("/api/tasks/delayed");
        if (!tasks || tasks.length === 0) {
            body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary);"><i class="fa-solid fa-check-circle" style="font-size:28px;display:block;margin-bottom:8px;color:var(--color-success)"></i>Aucune tâche en retard !</td></tr>';
            return;
        }

        body.innerHTML = tasks.map(t => {
            const echeance = formatAppDate(t.dateEcheance, { day: "numeric", month: "short", year: "numeric" });
            return `<tr>
                <td><strong>${esc(t.titre)}</strong></td>
                <td>${esc(t.projet)}</td>
                <td>${esc(t.assigneA)}</td>
                <td>${echeance}</td>
                <td><span style="color:#e50908;font-weight:700"><i class="fa-solid fa-triangle-exclamation"></i> ${t.joursRetard} jour(s)</span></td>
                <td>
                    <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${t.progression}%;background:#e50908"></div></div>
                    ${t.progression}%
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" data-edit-task-id="${t.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
                </td>
            </tr>`;
        }).join("");
    }

    // ===========================
    // TASK EDIT / DELETE
    // ===========================
    let editingTaskId = null;
    const editTaskModal = $("editTaskModal");
    const deleteTaskModal = $("deleteTaskConfirmModal");

    async function openTaskEdit(taskId) {
        const t = await api(`/api/tasks/${taskId}`);
        if (!t) return;

        editingTaskId = taskId;

        $("editTaskTitle").value = t.titre;
        $("editTaskDesc").value = t.description || "";
        $("editTaskPriority").value = t.priorite;
        $("editTaskStatus").value = t.statut;
        $("editTaskStartDate").value = t.dateDebut ? t.dateDebut.substring(0, 10) : "";
        $("editTaskDueDate").value = t.dateEcheance ? t.dateEcheance.substring(0, 10) : "";
        $("editTaskProgression").value = t.progression || 0;
        $("editTaskProgressionValue").textContent = (t.progression || 0) + "%";

        // New fields
        if ($("editTaskPhase")) $("editTaskPhase").value = t.phase || "";
        if ($("editTaskCommentaire")) $("editTaskCommentaire").value = t.commentaire || "";
        if ($("editTaskMontantPrevu")) $("editTaskMontantPrevu").value = t.montantPrevu || 0;
        if ($("editTaskMontantRealise")) $("editTaskMontantRealise").value = t.montantRealise || 0;

        // Auto-calc duration
        calcDuration("editTaskStartDate", "editTaskDueDate", "editTaskDuration");

        // Populate project dropdown
        const projSelect = $("editTaskProject");
        if (projSelect) {
            projSelect.innerHTML = cachedProjects.map(p => `<option value="${p.id}">${p.nom}</option>`).join("");
            projSelect.value = t.projetId;
        }

        // Populate assignee dropdown
        const assigneeSelect = $("editTaskAssignee");
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Non assigné</option>' +
                cachedUsers.map(u => `<option value="${u.id}">${u.nomComplet}</option>`).join("");
            assigneeSelect.value = t.assigneAId || "";
        }

        // Populate dependency dropdown filtered by project (exclude current task)
        populateTaskDependencyDropdown("editTaskDependance", taskId, t.projetId);
        if ($("editTaskDependance")) $("editTaskDependance").value = t.dependanceId || "";

        // Re-populate dependency dropdown when project changes in edit modal
        const editProjSelect = $("editTaskProject");
        if (editProjSelect) {
            editProjSelect.onchange = () => {
                const pid = editProjSelect.value ? parseInt(editProjSelect.value) : null;
                populateTaskDependencyDropdown("editTaskDependance", taskId, pid);
            };
        }

        editTaskModal?.classList.add("active");
    }

    function openTaskDeleteConfirm(taskId) {
        const t = cachedTasks.find(x => x.id === taskId);
        if (!t) return;
        $("deleteTaskName").textContent = t.titre;
        deleteTaskModal.dataset.taskId = taskId;
        deleteTaskModal?.classList.add("active");
    }

    // Close edit task modal
    $("closeEditTaskModal")?.addEventListener("click", () => editTaskModal?.classList.remove("active"));
    $("cancelEditTaskBtn")?.addEventListener("click", () => editTaskModal?.classList.remove("active"));
    editTaskModal?.addEventListener("click", (e) => { if (e.target === editTaskModal) editTaskModal.classList.remove("active"); });

    // Save edit task
    $("saveEditTaskBtn")?.addEventListener("click", async () => {
        if (!editingTaskId) return;

        const body = {
            titre: $("editTaskTitle").value,
            description: $("editTaskDesc").value || null,
            priorite: $("editTaskPriority").value,
            statut: $("editTaskStatus").value,
            dateDebut: $("editTaskStartDate").value || null,
            dateEcheance: $("editTaskDueDate").value,
            progression: parseInt($("editTaskProgression").value) || 0,
            assigneAId: $("editTaskAssignee").value || null,
            phase: $("editTaskPhase")?.value || null,
            commentaire: $("editTaskCommentaire")?.value || null,
            dependanceId: $("editTaskDependance")?.value ? parseInt($("editTaskDependance").value) : null,
            montantPrevu: parseFloat($("editTaskMontantPrevu")?.value) || 0,
            montantRealise: parseFloat($("editTaskMontantRealise")?.value) || 0,
        };

        const result = await api(`/api/tasks/${editingTaskId}`, { method: "PUT", body: JSON.stringify(body) });
        if (result) {
            showToast("success", "Tâche modifiée", "Les modifications ont été enregistrées");
            refreshNotifBadge();
            cachedTasks = [];
            cachedProjects = [];
            await Promise.all([loadTasks(), loadProjects()]);
            renderPlanningStats();
            renderCalendar();
            renderKanban();
            renderGantt();
            await refreshOpenViews();
        } else {
            showToast("error", "Erreur", "Impossible de modifier la tâche.");
        }

        editTaskModal?.classList.remove("active");
        editingTaskId = null;
    });

    // Close delete task modal
    $("closeDeleteTaskModal")?.addEventListener("click", () => deleteTaskModal?.classList.remove("active"));
    $("cancelDeleteTaskBtn")?.addEventListener("click", () => deleteTaskModal?.classList.remove("active"));
    deleteTaskModal?.addEventListener("click", (e) => { if (e.target === deleteTaskModal) deleteTaskModal.classList.remove("active"); });

    // Confirm delete task
    $("confirmDeleteTaskBtn")?.addEventListener("click", async () => {
        const taskId = parseInt(deleteTaskModal?.dataset.taskId);
        const result = await api(`/api/tasks/${taskId}`, { method: "DELETE" });
        if (result !== null) {
            showToast("success", "Tâche supprimée", "La tâche a été supprimée");
            refreshNotifBadge();
            cachedTasks = [];
            cachedProjects = [];
            await Promise.all([loadTasks(), loadProjects()]);
            renderPlanningStats();
            renderCalendar();
            renderKanban();
            renderGantt();
            await refreshOpenViews();
        } else {
            showToast("error", "Erreur", "Impossible de supprimer la tâche.");
        }
        deleteTaskModal?.classList.remove("active");
    });

    // Refresh open project detail modal and projects page after task changes
    async function refreshOpenViews() {
        const viewModal = $("viewProjectModal");
        if (viewModal?.classList.contains("active")) {
            const projetIdEl = viewModal.querySelector("[data-projet-id]");
            const projetId = projetIdEl ? parseInt(projetIdEl.dataset.projetId) : null;
            if (projetId) await openProjectView(projetId);
        }
        const projetsPage = $("page-projets");
        if (projetsPage?.classList.contains("active")) {
            await renderProjects();
        }
    }

    // Event delegation for task edit/delete buttons
    document.addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-edit-task-id]");
        if (editBtn) {
            e.stopPropagation();
            openTaskEdit(parseInt(editBtn.dataset.editTaskId));
            return;
        }
        const archiveTaskBtn = e.target.closest("[data-archive-task-id]");
        if (archiveTaskBtn) {
            e.stopPropagation();
            archiveTask(parseInt(archiveTaskBtn.dataset.archiveTaskId));
            return;
        }
        const deleteBtn = e.target.closest("[data-delete-task-id]");
        if (deleteBtn) {
            e.stopPropagation();
            openTaskDeleteConfirm(parseInt(deleteBtn.dataset.deleteTaskId));
            return;
        }
        // Kanban card action menu
        const kanbanAction = e.target.closest(".kanban-card-actions-btn");
        if (kanbanAction) {
            e.stopPropagation();
            const taskId = parseInt(kanbanAction.dataset.taskId);
            showKanbanCardMenu(kanbanAction, taskId);
            return;
        }
    });

    // Kanban card context menu
    let activeKanbanMenu = null;
    function showKanbanCardMenu(btn, taskId) {
        closeKanbanCardMenu();
        const menu = document.createElement("div");
        menu.className = "kanban-card-menu";
        menu.innerHTML = `
            <button class="kanban-menu-item" data-edit-task-id="${taskId}"><i class="fa-solid fa-pen"></i> Modifier</button>
            <button class="kanban-menu-item kanban-menu-danger" data-delete-task-id="${taskId}"><i class="fa-solid fa-trash"></i> Supprimer</button>
        `;
        btn.closest(".kanban-card").appendChild(menu);
        activeKanbanMenu = menu;
        requestAnimationFrame(() => menu.classList.add("active"));

        // Close on outside click (one-time)
        const closeHandler = (ev) => {
            if (!menu.contains(ev.target) && ev.target !== btn) {
                closeKanbanCardMenu();
                document.removeEventListener("click", closeHandler);
            }
        };
        setTimeout(() => document.addEventListener("click", closeHandler), 10);
    }

    function closeKanbanCardMenu() {
        if (activeKanbanMenu) { activeKanbanMenu.remove(); activeKanbanMenu = null; }
    }

    // ===========================
    // DOCUMENT MANAGEMENT
    // ===========================
    let currentDocProjetId = null;
    const uploadDocModal = $("uploadDocModal");
    const deleteDocModal = $("deleteDocConfirmModal");

    const docIconMap = {
        "application/pdf": "fa-file-pdf",
        "application/msword": "fa-file-word",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "fa-file-word",
        "application/vnd.ms-excel": "fa-file-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "fa-file-excel",
        "application/vnd.ms-powerpoint": "fa-file-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "fa-file-powerpoint",
        "image/png": "fa-file-image",
        "image/jpeg": "fa-file-image",
        "image/jpg": "fa-file-image",
        "application/zip": "fa-file-zipper",
        "application/x-rar-compressed": "fa-file-zipper",
        "text/plain": "fa-file-lines",
        "text/csv": "fa-file-csv",
    };

    function getDocIcon(contentType) {
        return docIconMap[contentType] || "fa-file";
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " o";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
        return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
    }

    async function loadDocuments(projetId) {
        const container = $("viewDocumentsList");
        if (!container) return;

        const docs = await api(`/api/projects/${projetId}/documents`);
        if (!docs || docs.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:16px;text-align:center;"><i class="fa-solid fa-folder-open" style="font-size:28px;color:var(--text-tertiary);display:block;margin-bottom:8px;"></i><p style="margin:0;color:var(--text-tertiary)">Aucun document</p></div>';
            return;
        }

        container.innerHTML = docs.map(d => {
            const icon = getDocIcon(d.contentType);
            const size = formatFileSize(d.tailleFichier);
            const date = formatAppDate(d.dateAjout, { day: "numeric", month: "short", year: "numeric" });
            return `<div class="view-document-item">
                <div class="view-document-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="view-document-info">
                    <span class="view-document-name">${esc(d.nomOriginal)}</span>
                    <span class="view-document-meta">${size} · ${date}${d.ajoutePar ? ' · ' + esc(d.ajoutePar) : ''}</span>
                </div>
                <div class="view-document-actions">
                    <a href="/api/projects/${projetId}/documents/${d.id}" class="btn btn-sm btn-outline" title="Télécharger" target="_blank"><i class="fa-solid fa-download"></i></a>
                    <button class="btn btn-sm btn-outline" data-archive-doc-id="${d.id}" data-archive-doc-projet="${projetId}" title="Archiver"><i class="fa-solid fa-box-archive"></i></button>
                    <button class="btn btn-sm btn-outline btn-danger-outline" data-delete-doc-id="${d.id}" data-delete-doc-name="${esc(d.nomOriginal)}" data-delete-doc-projet="${projetId}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
        }).join("");
    }

    // Open upload modal
    document.addEventListener("click", (e) => {
        const addBtn = e.target.closest("#addDocumentBtn");
        if (addBtn) {
            e.stopPropagation();
            currentDocProjetId = parseInt(addBtn.dataset.projetId);
            $("docFileInput").value = "";
            $("fileSelectedName").style.display = "none";
            $("fileDropZone").style.display = "";
            $("saveUploadDocBtn").disabled = true;
            uploadDocModal?.classList.add("active");
            return;
        }

        const archiveDocBtn = e.target.closest("[data-archive-doc-id]");
        if (archiveDocBtn) {
            e.stopPropagation();
            const docId = parseInt(archiveDocBtn.dataset.archiveDocId);
            const projetId = parseInt(archiveDocBtn.dataset.archiveDocProjet);
            archiveDocument(projetId, docId);
            return;
        }

        const deleteDocBtn = e.target.closest("[data-delete-doc-id]");
        if (deleteDocBtn) {
            e.stopPropagation();
            const docId = parseInt(deleteDocBtn.dataset.deleteDocId);
            const docName = deleteDocBtn.dataset.deleteDocName;
            const projetId = parseInt(deleteDocBtn.dataset.deleteDocProjet);
            $("deleteDocName").textContent = docName;
            deleteDocModal.dataset.docId = docId;
            deleteDocModal.dataset.projetId = projetId;
            deleteDocModal?.classList.add("active");
            return;
        }
    });

    // File drop zone
    const fileDropZone = $("fileDropZone");
    const docFileInput = $("docFileInput");

    fileDropZone?.addEventListener("click", () => docFileInput?.click());

    fileDropZone?.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileDropZone.classList.add("drag-over");
    });
    fileDropZone?.addEventListener("dragleave", () => {
        fileDropZone.classList.remove("drag-over");
    });
    fileDropZone?.addEventListener("drop", (e) => {
        e.preventDefault();
        fileDropZone.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) {
            docFileInput.files = e.dataTransfer.files;
            onFileSelected(e.dataTransfer.files[0]);
        }
    });

    docFileInput?.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            onFileSelected(e.target.files[0]);
        }
    });

    function onFileSelected(file) {
        $("fileDropZone").style.display = "none";
        $("fileSelectedName").style.display = "flex";
        $("fileSelectedText").textContent = file.name + " (" + formatFileSize(file.size) + ")";
        $("saveUploadDocBtn").disabled = false;
    }

    $("fileClearBtn")?.addEventListener("click", () => {
        docFileInput.value = "";
        $("fileDropZone").style.display = "";
        $("fileSelectedName").style.display = "none";
        $("saveUploadDocBtn").disabled = true;
    });

    // Close upload modal
    $("closeUploadDocModal")?.addEventListener("click", () => uploadDocModal?.classList.remove("active"));
    $("cancelUploadDocBtn")?.addEventListener("click", () => uploadDocModal?.classList.remove("active"));
    uploadDocModal?.addEventListener("click", (e) => { if (e.target === uploadDocModal) uploadDocModal.classList.remove("active"); });

    // Save upload
    $("saveUploadDocBtn")?.addEventListener("click", async () => {
        if (!currentDocProjetId || !docFileInput?.files[0]) return;

        const formData = new FormData();
        formData.append("file", docFileInput.files[0]);

        $("saveUploadDocBtn").disabled = true;
        $("saveUploadDocBtn").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';

        try {
            const res = await fetch(`/api/projects/${currentDocProjetId}/documents`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                showToast("success", "Document ajouté", "Le document a été uploadé avec succès");
                refreshNotifBadge();
                await loadDocuments(currentDocProjetId);
            } else {
                const err = await res.text();
                showToast("error", "Erreur", err || "Impossible d'uploader le document.");
            }
        } catch {
            showToast("error", "Erreur", "Erreur de connexion lors de l'upload.");
        }

        $("saveUploadDocBtn").disabled = false;
        $("saveUploadDocBtn").innerHTML = '<i class="fa-solid fa-upload"></i> Envoyer';
        uploadDocModal?.classList.remove("active");
    });

    // Close delete doc modal
    $("closeDeleteDocModal")?.addEventListener("click", () => deleteDocModal?.classList.remove("active"));
    $("cancelDeleteDocBtn")?.addEventListener("click", () => deleteDocModal?.classList.remove("active"));
    deleteDocModal?.addEventListener("click", (e) => { if (e.target === deleteDocModal) deleteDocModal.classList.remove("active"); });

    // Confirm delete doc
    $("confirmDeleteDocBtn")?.addEventListener("click", async () => {
        const docId = parseInt(deleteDocModal?.dataset.docId);
        const projetId = parseInt(deleteDocModal?.dataset.projetId);
        const result = await api(`/api/projects/${projetId}/documents/${docId}`, { method: "DELETE" });
        if (result !== null) {
            showToast("success", "Document supprimé", "Le document a été supprimé");
            refreshNotifBadge();
            await loadDocuments(projetId);
        } else {
            showToast("error", "Erreur", "Impossible de supprimer le document.");
        }
        deleteDocModal?.classList.remove("active");
    });

    // ===========================
    // ARCHIVE FUNCTIONALITY
    // ===========================
    async function archiveProject(projectId) {
        const result = await api(`/api/projects/${projectId}/archive`, { method: "POST" });
        if (result) {
            showToast("success", "Projet archivé", "Le projet et ses tâches ont été déplacés dans les archives");
            refreshNotifBadge();
            cachedProjects = [];
            cachedTasks = [];
            await renderProjects();
        } else {
            showToast("error", "Erreur", "Impossible d'archiver le projet.");
        }
    }

    async function restoreProject(projectId) {
        const result = await api(`/api/projects/${projectId}/restore`, { method: "POST" });
        if (result) {
            showToast("success", "Projet restauré", "Le projet a été restauré avec succès");
            refreshNotifBadge();
            cachedProjects = [];
            cachedTasks = [];
            await renderArchives();
        } else {
            showToast("error", "Erreur", "Impossible de restaurer le projet.");
        }
    }

    async function archiveTask(taskId) {
        const result = await api(`/api/tasks/${taskId}/archive`, { method: "POST" });
        if (result) {
            showToast("success", "Tâche archivée", "La tâche a été déplacée dans les archives");
            refreshNotifBadge();
            cachedTasks = [];
            await renderPlanning();
        } else {
            showToast("error", "Erreur", "Impossible d'archiver la tâche.");
        }
    }

    async function restoreTask(taskId) {
        const result = await api(`/api/tasks/${taskId}/restore`, { method: "POST" });
        if (result) {
            showToast("success", "Tâche restaurée", "La tâche a été restaurée avec succès");
            refreshNotifBadge();
            cachedTasks = [];
            await renderArchives();
        } else {
            showToast("error", "Erreur", "Impossible de restaurer la tâche.");
        }
    }

    async function archiveRapport(rapportId) {
        const result = await api(`/api/rapports/${rapportId}/archive`, { method: "POST" });
        if (result) {
            showToast("success", "Rapport archivé", "Le rapport a été déplacé dans les archives");
            refreshNotifBadge();
            cachedRapports = [];
            await renderReports();
        } else {
            showToast("error", "Erreur", "Impossible d'archiver le rapport.");
        }
    }

    async function restoreRapport(rapportId) {
        const result = await api(`/api/rapports/${rapportId}/restore`, { method: "POST" });
        if (result) {
            showToast("success", "Rapport restauré", "Le rapport a été restauré avec succès");
            refreshNotifBadge();
            await renderArchives();
        } else {
            showToast("error", "Erreur", "Impossible de restaurer le rapport.");
        }
    }

    async function archiveDocument(projetId, docId) {
        const result = await api(`/api/projects/${projetId}/documents/${docId}/archive`, { method: "POST" });
        if (result) {
            showToast("success", "Document archivé", "Le document a été déplacé dans les archives");
            refreshNotifBadge();
            loadDocuments(projetId);
        } else {
            showToast("error", "Erreur", "Impossible d'archiver le document.");
        }
    }

    async function restoreDocument(projetId, docId) {
        const result = await api(`/api/projects/${projetId}/documents/${docId}/restore`, { method: "POST" });
        if (result) {
            showToast("success", "Document restauré", "Le document a été restauré avec succès");
            refreshNotifBadge();
            await renderArchives();
        } else {
            showToast("error", "Erreur", "Impossible de restaurer le document.");
        }
    }

    // Archive tabs
    document.addEventListener("click", (e) => {
        const archiveTab = e.target.closest("[data-archive-tab]");
        if (archiveTab) {
            e.preventDefault();
            $$("[data-archive-tab]").forEach(t => t.classList.remove("active"));
            archiveTab.classList.add("active");

            const tab = archiveTab.dataset.archiveTab;
            $$("#page-archives .users-panel").forEach(p => {
                p.classList.add("hidden");
                p.classList.remove("active");
            });
            const panelMap = { projects: "archiveProjectsPanel", tasks: "archiveTasksPanel", rapports: "archiveRapportsPanel", documents: "archiveDocumentsPanel" };
            const panel = $(panelMap[tab]);
            if (panel) {
                panel.classList.remove("hidden");
                panel.classList.add("active");
            }
        }

        // Restore project button
        const restoreProjectBtn = e.target.closest("[data-restore-project-id]");
        if (restoreProjectBtn) {
            e.stopPropagation();
            restoreProject(parseInt(restoreProjectBtn.dataset.restoreProjectId));
            return;
        }

        // Restore task button
        const restoreTaskBtn = e.target.closest("[data-restore-task-id]");
        if (restoreTaskBtn) {
            e.stopPropagation();
            restoreTask(parseInt(restoreTaskBtn.dataset.restoreTaskId));
            return;
        }

        // Restore rapport button
        const restoreRapportBtn = e.target.closest("[data-restore-rapport-id]");
        if (restoreRapportBtn) {
            e.stopPropagation();
            restoreRapport(parseInt(restoreRapportBtn.dataset.restoreRapportId));
            return;
        }

        // Restore document button
        const restoreDocBtn = e.target.closest("[data-restore-doc-id]");
        if (restoreDocBtn) {
            e.stopPropagation();
            restoreDocument(parseInt(restoreDocBtn.dataset.restoreDocProjet), parseInt(restoreDocBtn.dataset.restoreDocId));
            return;
        }
    });

    // Archive search
    $("archiveSearch")?.addEventListener("input", () => {
        const query = ($("archiveSearch")?.value || "").toLowerCase().trim();
        $$("#archiveProjectsBody tr").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
        });
        $$("#archiveTasksBody tr").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
        });
        $$("#archiveRapportsBody tr").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
        });
        $$("#archiveDocumentsBody tr").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
        });
    });

    async function renderArchives() {
        const [stats, projects, tasks, rapports, documents] = await Promise.all([
            api("/api/archives/stats"),
            api("/api/archives/projects"),
            api("/api/archives/tasks"),
            api("/api/archives/rapports"),
            api("/api/archives/documents"),
        ]);

        // Stats
        if (stats) {
            const el = (id, val) => { const e = $(id); if (e) e.textContent = val; };
            el("archiveProjetsCount", stats.projetsArchives);
            el("archiveTachesCount", stats.tachesArchivees);
            el("archiveRapportsCount", stats.rapportsArchives);
            el("archiveDocumentsCount", stats.documentsArchives);
            el("archiveBudgetTotal", stats.budgetArchive > 0
                ? fmtBudgetM(stats.budgetArchive)
                : formatAppCurrency(0));
        }

        // Archived projects table
        const projBody = $("archiveProjectsBody");
        if (projBody && projects) {
            if (projects.length === 0) {
                projBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary);"><i class="fa-solid fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;"></i>Aucun projet archivé</td></tr>';
            } else {
                projBody.innerHTML = projects.map(p => {
                    const sc = statusCssMap[p.statut] || "info";
                    const archiveDate = p.dateArchivage
                        ? formatAppDate(p.dateArchivage, { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                    return `<tr>
                        <td><strong>${esc(p.nom)}</strong><br><small>${esc(p.code || "")}</small></td>
                        <td>${esc(typeLabels[p.type] || p.type)}</td>
                        <td><span class="project-status status--${sc}">${esc(statusLabels[p.statut] || p.statut)}</span></td>
                        <td>${fmtBudgetM(p.budgetAlloue)}</td>
                        <td>
                            <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${p.avancement}%"></div></div>
                            ${p.avancement}%
                        </td>
                        <td>${archiveDate}</td>
                        <td>
                            <div class="table-actions-group">
                                <button class="btn btn-sm btn-primary" data-restore-project-id="${p.id}" title="Restaurer">
                                    <i class="fa-solid fa-rotate-left"></i> Restaurer
                                </button>
                            </div>
                        </td>
                    </tr>`;
                }).join("");
            }
        }

        // Archived tasks table
        const taskBody = $("archiveTasksBody");
        if (taskBody && tasks) {
            if (tasks.length === 0) {
                taskBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary);"><i class="fa-solid fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;"></i>Aucune tâche archivée</td></tr>';
            } else {
                taskBody.innerHTML = tasks.map(t => {
                    const tsc = taskStatusMap[t.statut] || "todo";
                    const tpc = prioriteCssMap[t.priorite] || "medium";
                    const statusLabel = t.statut === "AFaire" ? "À faire" : t.statut === "EnCours" ? "En cours" : t.statut === "EnRevue" ? "En revue" : "Terminée";
                    const archiveDate = t.dateArchivage
                        ? formatAppDate(t.dateArchivage, { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                    const canRestore = !t.projetArchive;
                    return `<tr>
                        <td><strong>${esc(t.titre)}</strong></td>
                        <td>${esc(t.projet)}${t.projetArchive ? ' <small style="color:var(--text-tertiary)">(archivé)</small>' : ''}</td>
                        <td><span class="timeline-status timeline-status-${tsc}">${statusLabel}</span></td>
                        <td><span class="project-card-priority priority-${tpc}">${prioriteLabels[t.priorite] || t.priorite}</span></td>
                        <td>
                            <div class="progress-bar" style="width:60px;"><div class="progress-fill" style="width:${t.progression}%"></div></div>
                            ${t.progression}%
                        </td>
                        <td>${archiveDate}</td>
                        <td>
                            <div class="table-actions-group">
                                ${canRestore
                                    ? `<button class="btn btn-sm btn-primary" data-restore-task-id="${t.id}" title="Restaurer"><i class="fa-solid fa-rotate-left"></i> Restaurer</button>`
                                    : `<span style="color:var(--text-tertiary);font-size:var(--font-sm)">Restaurer le projet d'abord</span>`
                                }
                            </div>
                        </td>
                    </tr>`;
                }).join("");
            }
        }

        // Archived rapports table
        const rapportBody = $("archiveRapportsBody");
        if (rapportBody && rapports) {
            if (rapports.length === 0) {
                rapportBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary);"><i class="fa-solid fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;"></i>Aucun rapport archivé</td></tr>';
            } else {
                const rapportTypeLabels = { Qualite: "Contrôle Qualité", Personnalise: "Personnalisé", Bordereau: "Bordereau", Courrier: "Courrier", ReceptionProvisoire: "Réception Provisoire", ReceptionDefinitive: "Réception Définitive" };
                rapportBody.innerHTML = rapports.map(r => {
                    const archiveDate = r.dateArchivage
                        ? formatAppDate(r.dateArchivage, { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                    const genDate = r.dateGeneration
                        ? formatAppDate(r.dateGeneration, { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                    return `<tr>
                        <td><strong>${esc(r.titre)}</strong></td>
                        <td>${esc(rapportTypeLabels[r.type] || r.type)}</td>
                        <td>${esc(r.projet || "—")}</td>
                        <td>${esc(r.generePar || "—")}</td>
                        <td>${genDate}</td>
                        <td>${archiveDate}</td>
                        <td>
                            <div class="table-actions-group">
                                <button class="btn btn-sm btn-primary" data-restore-rapport-id="${r.id}" title="Restaurer">
                                    <i class="fa-solid fa-rotate-left"></i> Restaurer
                                </button>
                            </div>
                        </td>
                    </tr>`;
                }).join("");
            }
        }

        // Archived documents table
        const docBody = $("archiveDocumentsBody");
        if (docBody && documents) {
            if (documents.length === 0) {
                docBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary);"><i class="fa-solid fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;"></i>Aucun document archivé</td></tr>';
            } else {
                const fmtSize = (bytes) => {
                    if (bytes < 1024) return bytes + " o";
                    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " Ko";
                    return (bytes / 1048576).toFixed(1) + " Mo";
                };
                docBody.innerHTML = documents.map(d => {
                    const archiveDate = d.dateArchivage
                        ? formatAppDate(d.dateArchivage, { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                    const ext = (d.nomOriginal || "").split(".").pop()?.toUpperCase() || "—";
                    return `<tr>
                        <td><strong><i class="fa-solid fa-file"></i> ${esc(d.nomOriginal)}</strong></td>
                        <td>${esc(d.projet || "—")}</td>
                        <td>${ext}</td>
                        <td>${fmtSize(d.tailleFichier || 0)}</td>
                        <td>${esc(d.ajoutePar || "—")}</td>
                        <td>${archiveDate}</td>
                        <td>
                            <div class="table-actions-group">
                                <button class="btn btn-sm btn-primary" data-restore-doc-id="${d.id}" data-restore-doc-projet="${d.projetId}" title="Restaurer">
                                    <i class="fa-solid fa-rotate-left"></i> Restaurer
                                </button>
                            </div>
                        </td>
                    </tr>`;
                }).join("");
            }
        }
    }

    handleHash();

    // Periodically refresh notification badge (every 30 seconds)
    setInterval(() => { if (typeof refreshNotifBadge === "function") refreshNotifBadge(); }, 30000);
});
