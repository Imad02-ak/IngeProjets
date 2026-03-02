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

        const recentProjectsEl = $("recentProjects");
        if (recentProjectsEl && data?.projetsRecents) {
            recentProjectsEl.innerHTML = data.projetsRecents.map(p => `
        <div class="project-item">
          <div class="project-info">
            <div class="project-name">${p.nom}</div>
            <div class="project-meta">
              <i class="fa-solid fa-map-marker-alt"></i> ${p.localisation || "Non défini"}
            </div>
          </div>
          <span class="project-status status--${statusCssMap[p.statut] || "info"}">
            ${statusLabels[p.statut] || p.statut}
          </span>
        </div>
      `).join("");
        }

        const upcomingEl = $("upcomingTasks");
        if (upcomingEl && data?.echeancesProches) {
            upcomingEl.innerHTML = data.echeancesProches.map(t => {
                const date = new Date(t.dateEcheance);
                return `
          <div class="upcoming-item">
            <div class="upcoming-date">
              <div class="day">${date.getDate()}</div>
              <div class="month">${date.toLocaleDateString(appLocale(), { month: "short" })}</div>
            </div>
            <div class="upcoming-info">
              <div class="upcoming-title">${t.titre}</div>
              <div class="upcoming-project">${t.projet}</div>
            </div>
          </div>
        `;
            }).join("");
        }

        if (data?.kpis) {
            const kpiValues = $$(".kpi-value");
            if (kpiValues.length >= 4) {
                kpiValues[0].textContent = data.kpis.chantiersActifs;
                kpiValues[1].textContent = data.kpis.projetsTermines;
                kpiValues[2].textContent = data.kpis.alertes;
                kpiValues[3].textContent = fmtBudgetM(data.kpis.budgetTotal);
            }
        }

        initDashboardCharts(data);
    }

    function initDashboardCharts(data) {
        // Projects Evolution Chart
        const projectsChartEl = $("projectsChart");
        if (projectsChartEl && window.Chart) {
            const ctx = projectsChartEl.getContext("2d");

            // Détruire le graphique existant si présent
            if (projectsChartEl.chartInstance) {
                projectsChartEl.chartInstance.destroy();
            }

            projectsChartEl.chartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
                    datasets: [
                        {
                            label: "Projets actifs",
                            data: [18, 20, 22, 21, 23, 24],
                            borderColor: "#e50908",
                            backgroundColor: "rgba(229, 9, 8, 0.1)",
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: "Projets terminés",
                            data: [140, 144, 147, 150, 153, 156],
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            fill: true,
                            tension: 0.4,
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
                        y: { beginAtZero: false },
                    },
                },
            });
        }

        // Type Distribution Chart
        const typeChartEl = $("typeChart");
        if (typeChartEl && window.Chart) {
            const ctx = typeChartEl.getContext("2d");

            if (typeChartEl.chartInstance) {
                typeChartEl.chartInstance.destroy();
            }

            typeChartEl.chartInstance = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ["Routes", "Ponts", "Bâtiments", "Assainissement", "Énergie"],
                    datasets: [
                        {
                            data: [8, 5, 6, 3, 2],
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
        // Populate dependency dropdown for create modal
        populateTaskDependencyDropdown("taskDependance", null);
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

    function populateTaskDependencyDropdown(selectId, excludeTaskId) {
        const sel = $(selectId);
        if (!sel) return;
        sel.innerHTML = '<option value="">Aucune dépendance</option>' +
            cachedTasks
                .filter(t => t.id !== excludeTaskId)
                .map(t => `<option value="${t.id}">${t.titre} (${t.projet})</option>`)
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
                    <div class="form-group"><label class="form-label">Objet du contrôle *</label><input type="text" class="form-input" id="rf_objetControle" required placeholder="Ex: Vérification béton – Bloc A" /></div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Date du contrôle *</label><input type="date" class="form-input" id="rf_dateControle" required /></div>
                        <div class="form-group"><label class="form-label">Lieu du contrôle</label><input type="text" class="form-input" id="rf_lieuControle" placeholder="Ex: Chantier Lot 3" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Contrôleur</label><input type="text" class="form-input" id="rf_controleur" placeholder="Nom du contrôleur" /></div>
                    <div class="form-group"><label class="form-label">Résultat du contrôle *</label>
                        <select class="form-select" id="rf_resultat">
                            <option value="Conforme">Conforme</option>
                            <option value="Non conforme">Non conforme</option>
                            <option value="Partiellement conforme">Partiellement conforme</option>
                        </select>
                    </div>
                    <div class="form-group"><label class="form-label">Observations / Non-conformités</label><textarea class="form-textarea" id="rf_observations" rows="4" placeholder="Détail des observations..."></textarea></div>
                    <div class="form-group"><label class="form-label">Actions correctives recommandées</label><textarea class="form-textarea" id="rf_actions" rows="3" placeholder="Actions à entreprendre..."></textarea></div>`;
            case "Bordereau":
                return `
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Numéro du bordereau</label><input type="text" class="form-input" id="rf_numeroBordereau" placeholder="Ex: BRD-2026-001" /></div>
                        <div class="form-group"><label class="form-label">Date du bordereau *</label><input type="date" class="form-input" id="rf_dateBordereau" required /></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Destinataire *</label><input type="text" class="form-input" id="rf_destinataire" required placeholder="Ex: Maître d'ouvrage" /></div>
                        <div class="form-group"><label class="form-label">Expéditeur</label><input type="text" class="form-input" id="rf_expediteur" placeholder="Ex: Entreprise XYZ" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Objet *</label><input type="text" class="form-input" id="rf_objetBordereau" required placeholder="Objet du bordereau d'envoi" /></div>
                    <div class="form-group"><label class="form-label">Liste des pièces jointes</label><textarea class="form-textarea" id="rf_piecesJointes" rows="4" placeholder="1. Plan d'exécution\n2. Note de calcul\n3. ..."></textarea></div>
                    <div class="form-group"><label class="form-label">Observations</label><textarea class="form-textarea" id="rf_observationsBordereau" rows="3" placeholder="Observations éventuelles..."></textarea></div>`;
            case "Courrier":
                return `
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Numéro de référence</label><input type="text" class="form-input" id="rf_refCourrier" placeholder="Ex: COR-2026-045" /></div>
                        <div class="form-group"><label class="form-label">Date du courrier *</label><input type="date" class="form-input" id="rf_dateCourrier" required /></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Destinataire *</label><input type="text" class="form-input" id="rf_destCourrier" required placeholder="Nom et qualité du destinataire" /></div>
                        <div class="form-group"><label class="form-label">Expéditeur *</label><input type="text" class="form-input" id="rf_expCourrier" required placeholder="Nom et qualité de l'expéditeur" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Objet *</label><input type="text" class="form-input" id="rf_objetCourrier" required placeholder="Objet du courrier" /></div>
                    <div class="form-group"><label class="form-label">Corps du courrier *</label><textarea class="form-textarea" id="rf_corpsCourrier" rows="8" required placeholder="Monsieur / Madame,\n\nNous avons l'honneur de..."></textarea></div>
                    <div class="form-group"><label class="form-label">Pièces jointes</label><input type="text" class="form-input" id="rf_pjCourrier" placeholder="Liste des pièces jointes" /></div>`;
            case "ReceptionProvisoire":
                return `
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Numéro de référence</label><input type="text" class="form-input" id="rf_refRP" placeholder="Ex: RP-2026-001" /></div>
                        <div class="form-group"><label class="form-label">Date de la demande *</label><input type="date" class="form-input" id="rf_dateRP" required /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Maître d'ouvrage *</label><input type="text" class="form-input" id="rf_moRP" required placeholder="Nom du maître d'ouvrage" /></div>
                    <div class="form-group"><label class="form-label">Entreprise réalisatrice *</label><input type="text" class="form-input" id="rf_entrepriseRP" required placeholder="Nom de l'entreprise" /></div>
                    <div class="form-group"><label class="form-label">Désignation des travaux *</label><textarea class="form-textarea" id="rf_designationRP" rows="3" required placeholder="Description des travaux réalisés..."></textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Date début des travaux</label><input type="date" class="form-input" id="rf_dateDebutRP" /></div>
                        <div class="form-group"><label class="form-label">Date fin des travaux</label><input type="date" class="form-input" id="rf_dateFinRP" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Montant des travaux (€)</label><input type="number" class="form-input" id="rf_montantRP" placeholder="Montant en euros" /></div>
                    <div class="form-group"><label class="form-label">Réserves éventuelles</label><textarea class="form-textarea" id="rf_reservesRP" rows="3" placeholder="Réserves constatées lors de la visite..."></textarea></div>
                    <div class="form-group"><label class="form-label">Observations</label><textarea class="form-textarea" id="rf_observationsRP" rows="3" placeholder="Observations complémentaires..."></textarea></div>`;
            case "ReceptionDefinitive":
                return `
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Numéro de référence</label><input type="text" class="form-input" id="rf_refRD" placeholder="Ex: RD-2026-001" /></div>
                        <div class="form-group"><label class="form-label">Date de la demande *</label><input type="date" class="form-input" id="rf_dateRD" required /></div>
                    </div>
                    <div class="form-group"><label class="form-label">Maître d'ouvrage *</label><input type="text" class="form-input" id="rf_moRD" required placeholder="Nom du maître d'ouvrage" /></div>
                    <div class="form-group"><label class="form-label">Entreprise réalisatrice *</label><input type="text" class="form-input" id="rf_entrepriseRD" required placeholder="Nom de l'entreprise" /></div>
                    <div class="form-group"><label class="form-label">Désignation des travaux *</label><textarea class="form-textarea" id="rf_designationRD" rows="3" required placeholder="Description des travaux réalisés..."></textarea></div>
                    <div class="form-group"><label class="form-label">Date de réception provisoire</label><input type="date" class="form-input" id="rf_dateRProvRD" /></div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Durée de garantie (mois)</label><input type="number" class="form-input" id="rf_dureeGarantieRD" placeholder="Ex: 12" /></div>
                        <div class="form-group"><label class="form-label">Montant des travaux (€)</label><input type="number" class="form-input" id="rf_montantRD" placeholder="Montant en euros" /></div>
                    </div>
                    <div class="form-group"><label class="form-label">État des réserves levées</label>
                        <select class="form-select" id="rf_reservesLeveesRD">
                            <option value="Toutes les réserves ont été levées">Toutes les réserves ont été levées</option>
                            <option value="Réserves partiellement levées">Réserves partiellement levées</option>
                            <option value="Aucune réserve">Aucune réserve</option>
                        </select>
                    </div>
                    <div class="form-group"><label class="form-label">Observations</label><textarea class="form-textarea" id="rf_observationsRD" rows="3" placeholder="Observations complémentaires..."></textarea></div>`;
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
            case "Qualite":
                return JSON.stringify({
                    objetControle: val("rf_objetControle"),
                    dateControle: val("rf_dateControle"),
                    lieuControle: val("rf_lieuControle"),
                    controleur: val("rf_controleur"),
                    resultat: val("rf_resultat"),
                    observations: val("rf_observations"),
                    actions: val("rf_actions")
                });
            case "Bordereau":
                return JSON.stringify({
                    numeroBordereau: val("rf_numeroBordereau"),
                    dateBordereau: val("rf_dateBordereau"),
                    destinataire: val("rf_destinataire"),
                    expediteur: val("rf_expediteur"),
                    objetBordereau: val("rf_objetBordereau"),
                    piecesJointes: val("rf_piecesJointes"),
                    observations: val("rf_observationsBordereau")
                });
            case "Courrier":
                return JSON.stringify({
                    refCourrier: val("rf_refCourrier"),
                    dateCourrier: val("rf_dateCourrier"),
                    destinataire: val("rf_destCourrier"),
                    expediteur: val("rf_expCourrier"),
                    objet: val("rf_objetCourrier"),
                    corps: val("rf_corpsCourrier"),
                    piecesJointes: val("rf_pjCourrier")
                });
            case "ReceptionProvisoire":
                return JSON.stringify({
                    reference: val("rf_refRP"),
                    dateDemande: val("rf_dateRP"),
                    maitreOuvrage: val("rf_moRP"),
                    entreprise: val("rf_entrepriseRP"),
                    designation: val("rf_designationRP"),
                    dateDebut: val("rf_dateDebutRP"),
                    dateFin: val("rf_dateFinRP"),
                    montant: val("rf_montantRP"),
                    reserves: val("rf_reservesRP"),
                    observations: val("rf_observationsRP")
                });
            case "ReceptionDefinitive":
                return JSON.stringify({
                    reference: val("rf_refRD"),
                    dateDemande: val("rf_dateRD"),
                    maitreOuvrage: val("rf_moRD"),
                    entreprise: val("rf_entrepriseRD"),
                    designation: val("rf_designationRD"),
                    dateReceptionProvisoire: val("rf_dateRProvRD"),
                    dureeGarantie: val("rf_dureeGarantieRD"),
                    montant: val("rf_montantRD"),
                    reservesLevees: val("rf_reservesLeveesRD"),
                    observations: val("rf_observationsRD")
                });
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
                    <table class="rapport-table">
                        <tr><th>Objet du contrôle</th><td>${esc(d.objetControle)}</td></tr>
                        <tr><th>Date du contrôle</th><td>${formatAppDate(d.dateControle)}</td></tr>
                        <tr><th>Lieu</th><td>${esc(d.lieuControle)}</td></tr>
                        <tr><th>Contrôleur</th><td>${esc(d.controleur)}</td></tr>
                        <tr><th>Résultat</th><td><strong>${esc(d.resultat)}</strong></td></tr>
                    </table>
                    ${d.observations ? `<h3>Observations / Non-conformités</h3><p class="rapport-text">${esc(d.observations).replace(/\n/g, '<br>')}</p>` : ''}
                    ${d.actions ? `<h3>Actions correctives recommandées</h3><p class="rapport-text">${esc(d.actions).replace(/\n/g, '<br>')}</p>` : ''}`;
                break;
            case "Bordereau":
                bodyHTML = `
                    <table class="rapport-table">
                        <tr><th>N° Bordereau</th><td>${esc(d.numeroBordereau)}</td></tr>
                        <tr><th>Date</th><td>${formatAppDate(d.dateBordereau)}</td></tr>
                        <tr><th>Destinataire</th><td>${esc(d.destinataire)}</td></tr>
                        <tr><th>Expéditeur</th><td>${esc(d.expediteur)}</td></tr>
                        <tr><th>Objet</th><td>${esc(d.objetBordereau)}</td></tr>
                    </table>
                    ${d.piecesJointes ? `<h3>Pièces jointes</h3><p class="rapport-text">${esc(d.piecesJointes).replace(/\n/g, '<br>')}</p>` : ''}
                    ${d.observations ? `<h3>Observations</h3><p class="rapport-text">${esc(d.observations).replace(/\n/g, '<br>')}</p>` : ''}`;
                break;
            case "Courrier":
                bodyHTML = `
                    <table class="rapport-table">
                        <tr><th>Référence</th><td>${esc(d.refCourrier)}</td></tr>
                        <tr><th>Date</th><td>${formatAppDate(d.dateCourrier)}</td></tr>
                        <tr><th>Destinataire</th><td>${esc(d.destinataire)}</td></tr>
                        <tr><th>Expéditeur</th><td>${esc(d.expediteur)}</td></tr>
                        <tr><th>Objet</th><td>${esc(d.objet)}</td></tr>
                    </table>
                    <div class="rapport-courrier-body">
                        <p class="rapport-text">${esc(d.corps).replace(/\n/g, '<br>')}</p>
                    </div>
                    ${d.piecesJointes ? `<p class="rapport-pj"><strong>PJ :</strong> ${esc(d.piecesJointes)}</p>` : ''}`;
                break;
            case "ReceptionProvisoire":
                bodyHTML = `
                    <table class="rapport-table">
                        <tr><th>Référence</th><td>${esc(d.reference)}</td></tr>
                        <tr><th>Date de la demande</th><td>${formatAppDate(d.dateDemande)}</td></tr>
                        <tr><th>Maître d'ouvrage</th><td>${esc(d.maitreOuvrage)}</td></tr>
                        <tr><th>Entreprise réalisatrice</th><td>${esc(d.entreprise)}</td></tr>
                        <tr><th>Désignation des travaux</th><td>${esc(d.designation)}</td></tr>
                        <tr><th>Date début des travaux</th><td>${formatAppDate(d.dateDebut)}</td></tr>
                        <tr><th>Date fin des travaux</th><td>${formatAppDate(d.dateFin)}</td></tr>
                        <tr><th>Montant des travaux</th><td>${d.montant ? formatAppCurrency(parseFloat(d.montant)) : "—"}</td></tr>
                    </table>
                    ${d.reserves ? `<h3>Réserves éventuelles</h3><p class="rapport-text">${esc(d.reserves).replace(/\n/g, '<br>')}</p>` : ''}
                    ${d.observations ? `<h3>Observations</h3><p class="rapport-text">${esc(d.observations).replace(/\n/g, '<br>')}</p>` : ''}
                    <div class="rapport-signatures">
                        <div class="rapport-signature-block"><p>Le Maître d'ouvrage</p><div class="signature-line"></div></div>
                        <div class="rapport-signature-block"><p>L'Entreprise</p><div class="signature-line"></div></div>
                    </div>`;
                break;
            case "ReceptionDefinitive":
                bodyHTML = `
                    <table class="rapport-table">
                        <tr><th>Référence</th><td>${esc(d.reference)}</td></tr>
                        <tr><th>Date de la demande</th><td>${formatAppDate(d.dateDemande)}</td></tr>
                        <tr><th>Maître d'ouvrage</th><td>${esc(d.maitreOuvrage)}</td></tr>
                        <tr><th>Entreprise réalisatrice</th><td>${esc(d.entreprise)}</td></tr>
                        <tr><th>Désignation des travaux</th><td>${esc(d.designation)}</td></tr>
                        <tr><th>Date de réception provisoire</th><td>${formatAppDate(d.dateReceptionProvisoire)}</td></tr>
                        <tr><th>Durée de garantie</th><td>${d.dureeGarantie ? d.dureeGarantie + " mois" : "—"}</td></tr>
                        <tr><th>Montant des travaux</th><td>${d.montant ? formatAppCurrency(parseFloat(d.montant)) : "—"}</td></tr>
                        <tr><th>État des réserves</th><td>${esc(d.reservesLevees)}</td></tr>
                    </table>
                    ${d.observations ? `<h3>Observations</h3><p class="rapport-text">${esc(d.observations).replace(/\n/g, '<br>')}</p>` : ''}
                    <div class="rapport-signatures">
                        <div class="rapport-signature-block"><p>Le Maître d'ouvrage</p><div class="signature-line"></div></div>
                        <div class="rapport-signature-block"><p>L'Entreprise</p><div class="signature-line"></div></div>
                    </div>`;
                break;
            case "Personnalise":
                bodyHTML = `<div class="rapport-text">${esc(d.contenu || rapport.contenu || "").replace(/\n/g, '<br>')}</div>`;
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
        .rapport-signature-block { text-align: center; flex: 1; }
        .rapport-signature-block p { font-weight: 600; margin-bottom: 50px; font-size: 12px; }
        .signature-line { border-top: 1px solid #9ca3af; width: 200px; margin: 0 auto; }
        @@media print { body { padding: 15px 20px; } }
    </style>
</head>
<body>${printArea.innerHTML}</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 300);
    });

    // Delete rapport
    async function deleteRapport(rapportId) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) return;
        const result = await api(`/api/rapports/${rapportId}`, { method: "DELETE" });
        if (result !== null) {
            showToast("success", "Rapport supprimé", "Le rapport a été supprimé");
            cachedRapports = [];
            await loadRapports();
            renderRapportsList();
        } else {
            showToast("error", "Erreur", "Impossible de supprimer le rapport.");
        }
    }

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
            propositionPrix: parseFloat($("projectPriceProposal")?.value) || null,
            localisation: getGeoLocalisation("projectWilaya", "projectDaira", "projectCommune"),
            maitreOuvrage: $("projectClient").value || null,
            chefProjetId: $("projectManager").value || null,
        };
        const result = await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
        if (result) {
            showToast("success", "Projet créé", "Le projet a été créé avec succès");
            $("projectForm").reset();
            cachedProjects = [];
            await renderProjects();
        } else {
            showToast("error", "Erreur", "Impossible de créer le projet. Vérifiez les champs.");
        }
        projectModal?.classList.remove("active");
    });

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
    const badge = state.notif.btn?.querySelector(".badge");
    const notifItems = () =>
        state.notif.menu?.querySelectorAll(".notif-item") ?? [];

    const renderBadge = () => {
        if (!badge) return;
        const unread = [...notifItems()].filter(
            (it) => it.dataset.read !== "true",
        ).length;
        badge.textContent = String(unread);
        badge.style.display = unread > 0 ? "flex" : "none";
    };

    // Notifications
    if (state.notif.btn && state.notif.menu) {
        state.notif.btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleMenu("notif");
        });

        state.notif.menu.addEventListener("click", (e) => {
            const item = e.target.closest(".notif-item");
            if (item && item.dataset.read !== "true") {
                item.dataset.read = "true";
                renderBadge();
            }
        });

        state.notif.clearBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            notifItems().forEach((it) => (it.dataset.read = "true"));
            renderBadge();
            closeMenu("notif");
        });

        renderBadge();
    }

    // Profile
    if (state.profile.btn && state.profile.menu) {
        state.profile.btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleMenu("profile");
        });
    }

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
        setGeoFromLocalisation(p.localisation || '', "editProjectWilaya", "editProjectDaira", "editProjectCommune");
        $("editProjectStatus").value = p.statut;

        // Store fields not in edit form to preserve them on save
        modal.dataset.avancement = p.avancement;
        modal.dataset.chefProjetId = p.chefProjetId || '';
        modal.dataset.maitreOuvrage = p.maitreOuvrage || '';
        modal.dataset.description = p.description || '';

        modal.classList.add("active");
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
                localisation: getGeoLocalisation("editProjectWilaya", "editProjectDaira", "editProjectCommune"),
                maitreOuvrage: modal?.dataset.maitreOuvrage || null,
                chefProjetId: modal?.dataset.chefProjetId || null,
                avancement: parseInt(modal?.dataset.avancement) || 0,
            };
            const result = await api(`/api/projects/${editingProjectId}`, { method: "PUT", body: JSON.stringify(body) });
            if (result) {
                showToast("success", "Projet modifié", "Les modifications ont été enregistrées");
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
        const headers = ["Nom", "Code", "Type", "Priorité", "Statut", "Date début", "Date fin prévue", "Budget alloué", "Avancement", "Localisation", "Maître d'ouvrage", "Chef de projet"];
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
                        propositionPrix: p.propositionPrix || p.PropositionPrix || null,
                        localisation: p.localisation || p.Localisation || null,
                        maitreOuvrage: p.maitreOuvrage || p.MaitreOuvrage || null,
                        chefProjetId: p.chefProjetId || p.ChefProjetId || null,
                    };
                    if (!body.nom) continue;
                    const result = await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
                    if (result) created++;
                }
                showToast("success", "Import réussi", `${created} projet(s) importé(s) depuis le fichier JSON.`);
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
            const ppEl = $("projectPriceProposal");
            if (ppEl) ppEl.value = data.propositionPrix;
        }
        if (data.localisation) {
            setGeoFromLocalisation(data.localisation, "projectWilaya", "projectDaira", "projectCommune");
        }
        if (data.maitreOuvrage) $("projectClient").value = data.maitreOuvrage;

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
    $("globalSearch")?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length > 2) {
            console.log("Recherche:", query);
        }
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

        // Populate dependency dropdown (exclude current task)
        populateTaskDependencyDropdown("editTaskDependance", taskId);
        if ($("editTaskDependance")) $("editTaskDependance").value = t.dependanceId || "";

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
            cachedTasks = [];
            await renderArchives();
        } else {
            showToast("error", "Erreur", "Impossible de restaurer la tâche.");
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
            $("archiveProjectsPanel")?.classList.toggle("active", tab === "projects");
            $("archiveProjectsPanel")?.classList.toggle("hidden", tab !== "projects");
            $("archiveTasksPanel")?.classList.toggle("active", tab === "tasks");
            $("archiveTasksPanel")?.classList.toggle("hidden", tab !== "tasks");
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
    });

    async function renderArchives() {
        const [stats, projects, tasks] = await Promise.all([
            api("/api/archives/stats"),
            api("/api/archives/projects"),
            api("/api/archives/tasks"),
        ]);

        // Stats
        if (stats) {
            const el = (id, val) => { const e = $(id); if (e) e.textContent = val; };
            el("archiveProjetsCount", stats.projetsArchives);
            el("archiveTachesCount", stats.tachesArchivees);
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
    }

    handleHash();
});
