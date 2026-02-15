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
              <div class="month">${date.toLocaleDateString("fr-FR", { month: "short" })}</div>
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
                const budgetM = (data.kpis.budgetTotal / 1000000).toFixed(1);
                kpiValues[3].textContent = `${budgetM}M €`;
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
        renderCalendar();
        renderKanban();
        // Gantt is rendered only when its tab is active (needs visible container)
        const ganttViewEl = $("ganttView");
        if (ganttViewEl && ganttViewEl.classList.contains("active")) {
            renderGantt();
        }
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
            periodEl.textContent = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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
              <div class="kanban-card-due"><i class="fa-solid fa-clock"></i> ${new Date(t.dateEcheance).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
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
                    // Small delay so container becomes visible before DHTMLX init
                    setTimeout(() => renderGantt(), 50);
                }
                if (view === "timeline") renderTimeline();
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
                { name: "text", label: "Tâche / Projet", width: 220, tree: true },
                { name: "start_date", label: "Début", align: "center", width: 90 },
                { name: "duration", label: "Jours", align: "center", width: 60 },
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
            gantt.config.grid_width = 430;
            gantt.config.show_progress = true;
            gantt.config.readonly = true;

            // Default scale (month view)
            gantt.config.scale_unit = "month";
            gantt.config.date_scale = "%F %Y";
            gantt.config.subscales = [{ unit: "day", step: 1, date: "%d" }];
            gantt.config.min_column_width = 30;

            // Today marker (requires marker plugin)
            if (typeof gantt.addMarker === "function") {
                gantt.addMarker({
                    start_date: new Date(),
                    css: "gantt-today-line",
                    text: "Aujourd'hui"
                });
            }

            // Task bar class by priority
            gantt.templates.task_class = function (start, end, task) {
                var cls = [];
                if (task.type === "project") cls.push("gantt-project-task");
                if (task.priority === "Urgente") cls.push("gantt-priority-urgent");
                else if (task.priority === "Haute") cls.push("gantt-priority-high");
                else if (task.priority === "Moyenne") cls.push("gantt-priority-medium");
                else cls.push("gantt-priority-low");
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
                return "<b>" + task.text + "</b><br/>" +
                    "Début: " + gantt.templates.tooltip_date_format(start) + "<br/>" +
                    "Fin: " + gantt.templates.tooltip_date_format(end) + "<br/>" +
                    "Progression: " + Math.round((task.progress || 0) * 100) + "%";
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
            const key = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
        });

        let html = '';
        Object.keys(grouped).forEach(monthLabel => {
            html += `<div class="timeline-month">
                <div class="timeline-month-header">${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</div>`;

            grouped[monthLabel].forEach(t => {
                const d = new Date(t.dateEcheance);
                const dayStr = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
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
                kpis[0].textContent = `${(budgetData.budgetTotal / 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;
                kpis[1].textContent = `${(budgetData.depensesTotales / 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;
                kpis[2].textContent = `${(budgetData.restant / 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;
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
            <td>${(p.budgetAlloue / 1000000).toFixed(2)} M€</td>
            <td>${(p.depense / 1000000).toFixed(2)} M€</td>
            <td>${(p.restant / 1000000).toFixed(2)} M€</td>
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
            <div class="transaction-date">${new Date(t.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
          <div class="transaction-amount ${isExpense ? "negative" : "positive"}">
            ${isExpense ? "-" : "+"}${t.montant.toLocaleString("fr-FR")} €
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
                            title: { display: true, text: "Millions €" },
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
    async function renderReports() {
        const projects = await loadProjects();

        const performanceList = $("performanceList");
        if (performanceList) {
            const topProjects = projects
                .filter(p => p.statut !== "EnPlanification")
                .sort((a, b) => b.avancement - a.avancement)
                .slice(0, 5);
            performanceList.innerHTML = topProjects.map((p, i) => `
        <div class="performance-item">
          <div class="performance-rank ${i < 3 ? "rank-" + (i + 1) : ""}">${i + 1}</div>
          <div class="performance-info">
            <div class="performance-name">${p.nom}</div>
            <div class="performance-value">${p.avancement}% complété</div>
          </div>
          <div class="performance-score">${p.avancement}%</div>
        </div>`).join("");
        }

        initReportsCharts();
    }

    function initReportsCharts() {
        const trendsChartEl = $("trendsChart");
        if (trendsChartEl && window.Chart) {
            const ctx = trendsChartEl.getContext("2d");

            if (trendsChartEl.chartInstance) {
                trendsChartEl.chartInstance.destroy();
            }

            trendsChartEl.chartInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
                    datasets: [
                        {
                            label: "Projets démarrés",
                            data: [3, 2, 4, 1, 3, 2],
                            backgroundColor: "#3b82f6",
                        },
                        {
                            label: "Projets terminés",
                            data: [2, 3, 2, 3, 4, 3],
                            backgroundColor: "#10b981",
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
    // RENDER USERS
    // ===========================
    async function renderUsers() {
        const users = await loadUsers();
        const usersGrid = $("usersGrid");
        if (usersGrid) {
            usersGrid.innerHTML = users.map(u => {
                const initials = u.nomComplet.split(" ").map(n => n[0]).join("");
                return `
        <div class="user-card">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${u.nomComplet}</div>
            <div class="user-role">${u.role}</div>
            <div class="user-meta">
              <span><i class="fa-solid fa-envelope"></i> ${u.email}</span>
            </div>
            <span class="user-status ${u.estActif ? 'online' : 'offline'}">${u.estActif ? 'Actif' : 'Inactif'}</span>
          </div>
        </div>`;
            }).join("");
        }

        const statValues = $$(".user-stat-value");
        if (statValues.length >= 2) {
            statValues[0].textContent = users.length;
            statValues[1].textContent = users.filter(u => u.estActif).length;
        }
    }

    // Users tabs
    $$(".users-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$(".users-tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            const tabName = tab.dataset.tab;
            $$(".users-panel").forEach((p) => p.classList.remove("active"));
            $(`${tabName}Panel`)?.classList.add("active");
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
            $$(".settings-panel").forEach((p) => p.classList.remove("active"));
            $(`setting-${setting}`)?.classList.add("active");
        });
    });

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
                        <div><i class="fa-solid fa-euro-sign"></i> ${(p.budgetAlloue / 1000000).toFixed(1)}M €</div>
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
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-calendar-plus"></i> Début</span><span class="view-detail-value">${new Date(p.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                        <div class="view-detail-row"><span class="view-detail-label"><i class="fa-solid fa-calendar-check"></i> Échéance</span><span class="view-detail-value">${new Date(p.dateFinPrevue).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                    </div>
                </div>
                <div class="view-project-section">
                    <h4><i class="fa-solid fa-coins"></i> Budget</h4>
                    <div class="view-budget-cards">
                        <div class="view-budget-card"><span class="view-budget-label">Alloué</span><span class="view-budget-value">${(p.budgetAlloue / 1000000).toFixed(2)} M€</span></div>
                        <div class="view-budget-card"><span class="view-budget-label">Dépensé</span><span class="view-budget-value view-budget--spent">${(depense / 1000000).toFixed(2)} M€</span></div>
                        <div class="view-budget-card"><span class="view-budget-label">Restant</span><span class="view-budget-value view-budget--${budgetStatus}">${(remaining / 1000000).toFixed(2)} M€</span></div>
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
                                <span class="view-task-due"><i class="fa-solid fa-calendar"></i> ${new Date(t.dateEcheance).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
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
    document.addEventListener("click", (e) => {
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
                showToast("success", "Projet archivé", "Le projet a été déplacé dans les archives");
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
            dateEl.textContent = new Date().toLocaleDateString("fr-FR", options);
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
            p.dateDebut ? new Date(p.dateDebut).toLocaleDateString("fr-FR") : "",
            p.dateFinPrevue ? new Date(p.dateFinPrevue).toLocaleDateString("fr-FR") : "",
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
            const text = await file.text();

            if (file.name.endsWith(".json")) {
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
                showToast("error", "Format non supporté", "Veuillez utiliser un fichier JSON pour l'import.");
            }

            cachedProjects = [];
            await renderProjects();
        } catch (err) {
            showToast("error", "Erreur d'import", "Le fichier est invalide ou corrompu.");
            console.error("Import error:", err);
        }

        e.target.value = "";
    });

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
            <span><i class="fa-solid fa-calendar"></i> ${new Date(p.dateFinPrevue).toLocaleDateString("fr-FR")}</span>
            <span><i class="fa-solid fa-euro-sign"></i> ${(p.budgetAlloue / 1000000).toFixed(1)}M €</span>
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
        <td>${(p.budgetAlloue / 1000000).toFixed(1)}M €</td>
        <td>
          <div class="progress-bar" style="width: 80px;"><div class="progress-fill" style="width: ${p.avancement}%"></div></div>
          ${p.avancement}%
        </td>
        <td><span class="project-status status--${sc}">${esc(statusLabels[p.statut] || p.statut)}</span></td>
        <td>${new Date(p.dateFinPrevue).toLocaleDateString("fr-FR")}</td>
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
            const date = new Date(d.dateAjout).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
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

    handleHash();
});
