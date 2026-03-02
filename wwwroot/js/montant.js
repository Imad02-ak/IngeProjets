/**
 * montant.js – Module de gestion financière (Montants)
 * Gère l'affichage et l'interaction côté client pour le suivi financier des projets.
 */
(function () {
    'use strict';

    // ── State ─────────────────────────────────────────────
    let currentProjetId = null;
    let currentSummary = null;
    let pieChart = null;
    let barChart = null;

    // ── Helpers ───────────────────────────────────────────
    function fmt(n) {
        return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(n) + ' DA';
    }

    function fmtDate(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('fr-FR');
    }

    function todayISO() {
        return new Date().toISOString().split('T')[0];
    }

    function showToast(msg, type) {
        const c = document.getElementById('toastContainer');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'toast toast-' + (type || 'info');
        t.innerHTML = '<i class="fa-solid fa-' + (type === 'error' ? 'circle-xmark' : 'circle-check') + '"></i> ' + msg;
        c.appendChild(t);
        setTimeout(() => { t.classList.add('toast-hide'); setTimeout(() => t.remove(), 400); }, 3000);
    }

    async function apiFetch(url, options) {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || res.statusText);
        }
        if (res.status === 204) return null;
        return res.json();
    }

    function esc(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // ── Modal helpers ─────────────────────────────────────
    function openModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.add('active');
    }

    function closeModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.remove('active');
    }

    function resetForm(formId) {
        const f = document.getElementById(formId);
        if (f) f.reset();
    }

    function wireModal(modalId, closeIds, formId) {
        closeIds.forEach(cid => {
            const btn = document.getElementById(cid);
            if (btn) btn.addEventListener('click', () => { closeModal(modalId); resetForm(formId); });
        });
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) { closeModal(modalId); resetForm(formId); }
            });
        }
    }

    // ── Init ──────────────────────────────────────────────
    function init() {
        initTabs();
        initProjectSelector();
        initPrintAll();
        initDevisModal();
        initTacheModal();
        initSituationModal();
        initAvenantModal();
        initFactureModal();
    }

    // ── Tab switching ─────────────────────────────────────
    function initTabs() {
        document.querySelectorAll('[data-montant-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-montant-tab]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.montantTab;
                document.querySelectorAll('#montantContent > .users-panel, #montantContent > .budget-charts-wrap, #montantContent > div[id^="montant-"]').forEach(p => {
                    p.classList.add('hidden');
                    p.classList.remove('active');
                });
                const panel = document.getElementById('montant-' + tab);
                if (panel) {
                    panel.classList.remove('hidden');
                    panel.classList.add('active');
                }
                if (tab === 'graphique') renderCharts();
            });
        });
    }

    // ── Project selector ──────────────────────────────────
    function initProjectSelector() {
        const sel = document.getElementById('montantProjetSelect');
        if (!sel) return;
        loadProjects(sel);
        sel.addEventListener('change', () => {
            currentProjetId = sel.value ? parseInt(sel.value) : null;
            if (currentProjetId) {
                loadSummary(currentProjetId);
            } else {
                document.getElementById('montantContent').style.display = 'none';
                document.getElementById('montantPlaceholder').style.display = '';
            }
        });
    }

    // ── Print all factures ────────────────────────────────
    function initPrintAll() {
        const btn = document.getElementById('printAllFacturesBtn');
        if (btn) {
            btn.addEventListener('click', () => {
                if (!currentSummary || !currentSummary.factures.length) { showToast('Aucune facture à imprimer.', 'error'); return; }
                printFactures(currentSummary.factures);
            });
        }
    }

    // ══════════════════════════════════════════════════════
    // MODAL: Devis (Lot)
    // ══════════════════════════════════════════════════════
    function initDevisModal() {
        wireModal('montantDevisModal', ['closeMontantDevisModal', 'cancelMontantDevisBtn'], 'montantDevisForm');

        document.getElementById('addDevisLigneBtn')?.addEventListener('click', () => {
            if (!currentProjetId) { showToast('Sélectionnez un projet d\'abord.', 'error'); return; }
            resetForm('montantDevisForm');
            openModal('montantDevisModal');
        });

        document.getElementById('saveMontantDevisBtn')?.addEventListener('click', async () => {
            const designation = document.getElementById('mDevisDesignation').value.trim();
            const montantHT = parseFloat(document.getElementById('mDevisMontantHT').value);
            if (!designation) { showToast('La désignation est requise.', 'error'); return; }
            if (isNaN(montantHT) || montantHT < 0) { showToast('Montant HT invalide.', 'error'); return; }
            const ordre = (currentSummary?.devisLignes?.length || 0) + 1;
            try {
                await apiFetch('/api/montants/projets/' + currentProjetId + '/devis', {
                    method: 'POST',
                    body: JSON.stringify({ designation, montantHT, ordre })
                });
                closeModal('montantDevisModal');
                resetForm('montantDevisForm');
                showToast('Lot ajouté avec succès.', 'success');
                loadSummary(currentProjetId);
            } catch (e) {
                showToast('Erreur : ' + e.message, 'error');
            }
        });
    }

    // ══════════════════════════════════════════════════════
    // MODAL: Édition montants d'une tâche
    // ══════════════════════════════════════════════════════
    let editingTacheId = null;

    function initTacheModal() {
        wireModal('montantTacheModal', ['closeMontantTacheModal', 'cancelMontantTacheBtn'], 'montantTacheForm');

        document.getElementById('saveMontantTacheBtn')?.addEventListener('click', async () => {
            if (!editingTacheId) return;
            const montantPrevu = parseFloat(document.getElementById('mTacheMontantPrevu').value);
            const montantRealise = parseFloat(document.getElementById('mTacheMontantRealise').value) || 0;

            if (isNaN(montantPrevu) || montantPrevu < 0) { showToast('Montant prévu invalide.', 'error'); return; }

            try {
                await apiFetch('/api/montants/taches/' + editingTacheId + '/montants', {
                    method: 'PUT',
                    body: JSON.stringify({ montantPrevu, montantRealise })
                });
                closeModal('montantTacheModal');
                resetForm('montantTacheForm');
                editingTacheId = null;
                showToast('Montants mis à jour.', 'success');
                loadSummary(currentProjetId);
            } catch (e) {
                showToast('Erreur : ' + e.message, 'error');
            }
        });
    }

    // ══════════════════════════════════════════════════════
    // MODAL: Situation de Paiement
    // ══════════════════════════════════════════════════════
    function initSituationModal() {
        wireModal('montantSituationModal', ['closeMontantSituationModal', 'cancelMontantSituationBtn'], 'montantSituationForm');

        document.getElementById('addSituationBtn')?.addEventListener('click', () => {
            if (!currentProjetId) { showToast('Sélectionnez un projet d\'abord.', 'error'); return; }
            resetForm('montantSituationForm');
            const nextNum = (currentSummary?.situations?.length || 0) + 1;
            document.getElementById('mSituationNumero').value = nextNum;
            document.getElementById('mSituationDate').value = todayISO();
            openModal('montantSituationModal');
        });

        document.getElementById('saveMontantSituationBtn')?.addEventListener('click', async () => {
            const numero = parseInt(document.getElementById('mSituationNumero').value);
            const date = document.getElementById('mSituationDate').value || null;
            const montantValide = parseFloat(document.getElementById('mSituationMontant').value);
            const pourcentageCumule = parseFloat(document.getElementById('mSituationPourcentage').value);

            if (isNaN(numero) || numero < 1) { showToast('Numéro invalide.', 'error'); return; }
            if (isNaN(montantValide) || montantValide < 0) { showToast('Montant invalide.', 'error'); return; }
            if (isNaN(pourcentageCumule)) { showToast('Pourcentage invalide.', 'error'); return; }

            try {
                await apiFetch('/api/montants/projets/' + currentProjetId + '/situations', {
                    method: 'POST',
                    body: JSON.stringify({ numero, date, montantValide, pourcentageCumule })
                });
                closeModal('montantSituationModal');
                resetForm('montantSituationForm');
                showToast('Situation ajoutée avec succès.', 'success');
                loadSummary(currentProjetId);
            } catch (e) {
                showToast('Erreur : ' + e.message, 'error');
            }
        });
    }

    // ══════════════════════════════════════════════════════
    // MODAL: Avenant
    // ══════════════════════════════════════════════════════
    function initAvenantModal() {
        wireModal('montantAvenantModal', ['closeMontantAvenantModal', 'cancelMontantAvenantBtn'], 'montantAvenantForm');

        document.getElementById('addAvenantBtn')?.addEventListener('click', () => {
            if (!currentProjetId) { showToast('Sélectionnez un projet d\'abord.', 'error'); return; }
            resetForm('montantAvenantForm');
            const nextNum = (currentSummary?.avenants?.length || 0) + 1;
            document.getElementById('mAvenantNumero').value = nextNum;
            document.getElementById('mAvenantDate').value = todayISO();
            openModal('montantAvenantModal');
        });

        document.getElementById('saveMontantAvenantBtn')?.addEventListener('click', async () => {
            const numero = parseInt(document.getElementById('mAvenantNumero').value);
            const date = document.getElementById('mAvenantDate').value || null;
            const motif = document.getElementById('mAvenantMotif').value.trim();
            const montant = parseFloat(document.getElementById('mAvenantMontant').value);

            if (isNaN(numero) || numero < 1) { showToast('Numéro invalide.', 'error'); return; }
            if (!motif) { showToast('Le motif est requis.', 'error'); return; }
            if (isNaN(montant)) { showToast('Montant invalide.', 'error'); return; }

            try {
                await apiFetch('/api/montants/projets/' + currentProjetId + '/avenants', {
                    method: 'POST',
                    body: JSON.stringify({ numero, motif, montant, date })
                });
                closeModal('montantAvenantModal');
                resetForm('montantAvenantForm');
                showToast('Avenant ajouté avec succès.', 'success');
                loadSummary(currentProjetId);
            } catch (e) {
                showToast('Erreur : ' + e.message, 'error');
            }
        });
    }

    // ══════════════════════════════════════════════════════
    // MODAL: Facture
    // ══════════════════════════════════════════════════════
    function initFactureModal() {
        wireModal('montantFactureModal', ['closeMontantFactureModal', 'cancelMontantFactureBtn'], 'montantFactureForm');

        document.getElementById('addFactureBtn')?.addEventListener('click', () => {
            if (!currentProjetId) { showToast('Sélectionnez un projet d\'abord.', 'error'); return; }
            resetForm('montantFactureForm');
            document.getElementById('mFactureDate').value = todayISO();
            populateSituationDropdown();
            openModal('montantFactureModal');
        });

        document.getElementById('saveMontantFactureBtn')?.addEventListener('click', async () => {
            const numero = document.getElementById('mFactureNumero').value.trim();
            const date = document.getElementById('mFactureDate').value || null;
            const montant = parseFloat(document.getElementById('mFactureMontant').value);
            const statut = document.getElementById('mFactureStatut').value;
            const sitVal = document.getElementById('mFactureSituation').value;
            const situationPaiementId = sitVal ? parseInt(sitVal) : null;

            if (!numero) { showToast('Le numéro est requis.', 'error'); return; }
            if (isNaN(montant) || montant < 0) { showToast('Montant invalide.', 'error'); return; }

            try {
                await apiFetch('/api/montants/projets/' + currentProjetId + '/factures', {
                    method: 'POST',
                    body: JSON.stringify({ numero, date, montant, statut, situationPaiementId })
                });
                closeModal('montantFactureModal');
                resetForm('montantFactureForm');
                showToast('Facture ajoutée avec succès.', 'success');
                loadSummary(currentProjetId);
            } catch (e) {
                showToast('Erreur : ' + e.message, 'error');
            }
        });
    }

    function populateSituationDropdown() {
        const sel = document.getElementById('mFactureSituation');
        if (!sel) return;
        sel.innerHTML = '<option value="">Aucune</option>';
        if (currentSummary && currentSummary.situations) {
            currentSummary.situations.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = 'Situation n°' + s.numero + ' – ' + fmt(s.montantValide);
                sel.appendChild(opt);
            });
        }
    }

    // ── Load Projects ─────────────────────────────────────
    async function loadProjects(sel) {
        try {
            const projets = await apiFetch('/api/montants/projets');
            projets.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nom;
                sel.appendChild(opt);
            });
        } catch (e) {
            console.error('Erreur chargement projets:', e);
        }
    }

    // ── Load Summary ──────────────────────────────────────
    async function loadSummary(projetId) {
        try {
            const data = await apiFetch('/api/montants/projets/' + projetId + '/summary');
            currentSummary = data;
            document.getElementById('montantPlaceholder').style.display = 'none';
            document.getElementById('montantContent').style.display = '';

            // Reset to devis tab on project load
            document.querySelectorAll('[data-montant-tab]').forEach(b => b.classList.remove('active'));
            var devisBtn = document.querySelector('[data-montant-tab="devis"]');
            if (devisBtn) devisBtn.classList.add('active');
            document.querySelectorAll('#montantContent > .users-panel, #montantContent > .budget-charts-wrap, #montantContent > div[id^="montant-"]').forEach(p => {
                p.classList.add('hidden');
                p.classList.remove('active');
            });
            var devisPanel = document.getElementById('montant-devis');
            if (devisPanel) {
                devisPanel.classList.remove('hidden');
                devisPanel.classList.add('active');
            }

            renderKPIs(data);
            renderDevis(data);
            renderTaches(data);
            renderSituations(data);
            renderAvenants(data);
            renderFactures(data);
        } catch (e) {
            showToast('Erreur : ' + e.message, 'error');
        }
    }

    // ── Render KPIs ───────────────────────────────────────
    function renderKPIs(d) {
        document.getElementById('kpiMontantHT').textContent = fmt(d.montantHT);
        document.getElementById('kpiTVA').textContent = fmt(d.tva);
        document.getElementById('kpiMontantTTC').textContent = fmt(d.montantTTC);
        document.getElementById('kpiRestant').textContent = fmt(d.montantRestant);
        document.getElementById('kpiAvancement').textContent = 'Avancement : ' + d.avancementGlobal + '%';
    }

    // ── Render Devis ──────────────────────────────────────
    function renderDevis(d) {
        const tbody = document.getElementById('devisTableBody');
        tbody.innerHTML = '';
        d.devisLignes.forEach((l, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (i + 1) + '</td>' +
                '<td>' + esc(l.designation) + '</td>' +
                '<td>' + fmt(l.montantHT) + '</td>' +
                '<td><button class="btn btn-sm btn-danger" data-del-devis="' + l.id + '" title="Supprimer"><i class="fa-solid fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });

        const totalHT = d.devisLignes.reduce((s, l) => s + l.montantHT, 0);
        const tva = totalHT * 0.19;
        document.getElementById('devisTotalHT').textContent = fmt(totalHT);
        document.getElementById('devisTVA').textContent = fmt(tva);
        document.getElementById('devisTTC').textContent = fmt(totalHT + tva);

        tbody.querySelectorAll('[data-del-devis]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Supprimer cette ligne de devis ?')) return;
                try {
                    await apiFetch('/api/montants/devis/' + btn.dataset.delDevis, { method: 'DELETE' });
                    showToast('Lot supprimé.', 'success');
                    loadSummary(currentProjetId);
                } catch (e) { showToast('Erreur : ' + e.message, 'error'); }
            });
        });
    }

    // ── Render Tâches ─────────────────────────────────────
    function renderTaches(d) {
        const tbody = document.getElementById('tachesTableBody');
        tbody.innerHTML = '';
        if (!d.taches || !d.taches.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);">Aucune tâche dans le planning de ce projet. Ajoutez des tâches via la page Planning.</td></tr>';
        } else {
            d.taches.forEach(t => {
                const statutMap = { AFaire: 'À faire', EnCours: 'En cours', EnRevue: 'En revue', Terminee: 'Terminée' };
                const statutClassMap = { Terminee: 'kpi-change--positive', EnCours: 'kpi-change--neutral', EnRevue: 'kpi-change--neutral', AFaire: 'kpi-change--negative' };
                const statutLabel = statutMap[t.statut] || t.statut;
                const statutClass = statutClassMap[t.statut] || 'kpi-change--neutral';
                const prog = t.progression || 0;
                const barColor = prog >= 80 ? '#10b981' : prog >= 40 ? '#f59e0b' : '#e50908';
                const tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + esc(t.titre) + '</td>' +
                    '<td>' + esc(t.description || '—') + '</td>' +
                    '<td>' + fmt(t.montantPrevu) + '</td>' +
                    '<td>' + fmt(t.montantRealise) + '</td>' +
                    '<td><div class="budget-progress" style="width:100px;height:8px;"><div class="budget-progress-bar" style="width:' + prog + '%;background:' + barColor + '"></div></div> ' + prog + '%</td>' +
                    '<td><span class="' + statutClass + '">' + statutLabel + '</span></td>' +
                    '<td><button class="btn btn-sm btn-outline" data-edit-tache="' + t.id + '" data-prevu="' + t.montantPrevu + '" data-realise="' + t.montantRealise + '" title="Modifier montants"><i class="fa-solid fa-pen"></i></button></td>';
                tbody.appendChild(tr);
            });
        }

        document.getElementById('tachesTotalPrevu').textContent = fmt(d.totalPrevu);
        document.getElementById('tachesTotalRealise').textContent = fmt(d.totalRealise);
        document.getElementById('tachesAvancementGlobal').textContent = d.avancementGlobal + '%';

        tbody.querySelectorAll('[data-edit-tache]').forEach(btn => {
            btn.addEventListener('click', () => {
                editingTacheId = parseInt(btn.dataset.editTache);
                document.getElementById('mTacheMontantPrevu').value = btn.dataset.prevu;
                document.getElementById('mTacheMontantRealise').value = btn.dataset.realise;
                openModal('montantTacheModal');
            });
        });
    }

    // ── Render Situations ─────────────────────────────────
    function renderSituations(d) {
        const tbody = document.getElementById('situationsTableBody');
        tbody.innerHTML = '';
        d.situations.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>Situation n°' + s.numero + '</td>' +
                '<td>' + fmtDate(s.date) + '</td>' +
                '<td>' + fmt(s.montantValide) + '</td>' +
                '<td>' + s.pourcentageCumule + '%</td>' +
                '<td><button class="btn btn-sm btn-danger" data-del-sit="' + s.id + '" title="Supprimer"><i class="fa-solid fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });

        document.getElementById('situationsRestant').textContent = fmt(d.montantRestant);

        tbody.querySelectorAll('[data-del-sit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Supprimer cette situation ?')) return;
                try {
                    await apiFetch('/api/montants/situations/' + btn.dataset.delSit, { method: 'DELETE' });
                    showToast('Situation supprimée.', 'success');
                    loadSummary(currentProjetId);
                } catch (e) { showToast('Erreur : ' + e.message, 'error'); }
            });
        });
    }

    // ── Render Avenants ───────────────────────────────────
    function renderAvenants(d) {
        const tbody = document.getElementById('avenantsTableBody');
        tbody.innerHTML = '';
        d.avenants.forEach(a => {
            const sign = a.montant >= 0 ? '+' : '';
            const color = a.montant >= 0 ? 'color:var(--color-green)' : 'color:var(--color-red)';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>Avenant n°' + a.numero + '</td>' +
                '<td>' + fmtDate(a.date) + '</td>' +
                '<td>' + esc(a.motif) + '</td>' +
                '<td style="' + color + ';font-weight:bold;">' + sign + fmt(a.montant) + '</td>' +
                '<td><button class="btn btn-sm btn-danger" data-del-av="' + a.id + '" title="Supprimer"><i class="fa-solid fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });

        document.getElementById('avenantsNewTotal').textContent = fmt(d.montantHT);

        tbody.querySelectorAll('[data-del-av]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Supprimer cet avenant ?')) return;
                try {
                    await apiFetch('/api/montants/avenants/' + btn.dataset.delAv, { method: 'DELETE' });
                    showToast('Avenant supprimé.', 'success');
                    loadSummary(currentProjetId);
                } catch (e) { showToast('Erreur : ' + e.message, 'error'); }
            });
        });
    }

    // ── Render Factures ───────────────────────────────────
    function renderFactures(d) {
        const tbody = document.getElementById('facturesTableBody');
        tbody.innerHTML = '';
        d.factures.forEach(f => {
            const statutBadge = f.statut === 'Signee' ? '<span class="kpi-change--positive">Signée</span>'
                : f.statut === 'Validee' ? '<span class="kpi-change--neutral">Validée</span>'
                : '<span class="kpi-change--negative">Élaborée</span>';
            const sitLabel = f.situationPaiement ? 'Situation n°' + f.situationPaiement.numero : '—';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + esc(f.numero) + '</td>' +
                '<td>' + fmtDate(f.date) + '</td>' +
                '<td>' + fmt(f.montant) + '</td>' +
                '<td>' + statutBadge + '</td>' +
                '<td>' + sitLabel + '</td>' +
                '<td>' +
                    '<button class="btn btn-sm btn-outline" data-print-facture="' + f.id + '" title="Imprimer"><i class="fa-solid fa-print"></i></button> ' +
                    '<button class="btn btn-sm btn-danger" data-del-fac="' + f.id + '" title="Supprimer"><i class="fa-solid fa-trash"></i></button>' +
                '</td>';
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('[data-print-facture]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fId = parseInt(btn.dataset.printFacture);
                const facture = d.factures.find(f => f.id === fId);
                if (facture) printFactures([facture]);
            });
        });

        tbody.querySelectorAll('[data-del-fac]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Supprimer cette facture ?')) return;
                try {
                    await apiFetch('/api/montants/factures/' + btn.dataset.delFac, { method: 'DELETE' });
                    showToast('Facture supprimée.', 'success');
                    loadSummary(currentProjetId);
                } catch (e) { showToast('Erreur : ' + e.message, 'error'); }
            });
        });
    }

    // ── Print Factures ────────────────────────────────────
    function printFactures(factures) {
        const projetNom = currentSummary ? currentSummary.projetNom : 'Projet';
        let html = '';
        factures.forEach((f, idx) => {
            const statutLabel = f.statut === 'Signee' ? 'Signée' : f.statut === 'Validee' ? 'Validée' : 'Élaborée';
            html += '<div class="facture-print-page' + (idx > 0 ? ' page-break' : '') + '">' +
                '<div class="facture-header">' +
                    '<div><h2>Ingé-Projets</h2><p>Entreprise de Travaux Publics</p></div>' +
                    '<div style="text-align:right;"><h3>FACTURE</h3><p>N° ' + esc(f.numero) + '</p></div>' +
                '</div>' +
                '<hr/>' +
                '<div class="facture-meta">' +
                    '<p><strong>Projet :</strong> ' + esc(projetNom) + '</p>' +
                    '<p><strong>Date :</strong> ' + fmtDate(f.date) + '</p>' +
                    '<p><strong>Statut :</strong> ' + statutLabel + '</p>' +
                '</div>' +
                '<table class="facture-table">' +
                    '<thead><tr><th>Désignation</th><th style="text-align:right;">Montant</th></tr></thead>' +
                    '<tbody>' +
                        '<tr><td>Travaux conformes au contrat</td><td style="text-align:right;">' + fmt(f.montant) + '</td></tr>' +
                    '</tbody>' +
                    '<tfoot>' +
                        '<tr><td><strong>Montant HT</strong></td><td style="text-align:right;"><strong>' + fmt(f.montant) + '</strong></td></tr>' +
                        '<tr><td>TVA (19%)</td><td style="text-align:right;">' + fmt(f.montant * 0.19) + '</td></tr>' +
                        '<tr><td><strong>Montant TTC</strong></td><td style="text-align:right;"><strong>' + fmt(f.montant * 1.19) + '</strong></td></tr>' +
                    '</tfoot>' +
                '</table>' +
                '<div class="facture-footer">' +
                    '<p>Signature & Cachet</p>' +
                    '<div class="signature-box"></div>' +
                '</div>' +
            '</div>';
        });

        const printWin = window.open('', '_blank');
        printWin.document.write('<!DOCTYPE html><html><head><title>Facture(s) – ' + esc(projetNom) + '</title>' +
            '<link rel="stylesheet" href="/css/montant-print.css"/>' +
            '</head><body>' + html + '<script>window.onload=function(){window.print();}<\/script></body></html>');
        printWin.document.close();
    }

    // ── Charts ────────────────────────────────────────────
    function renderCharts() {
        if (!currentSummary) return;
        const d = currentSummary;

        if (pieChart) { pieChart.destroy(); pieChart = null; }
        if (barChart) { barChart.destroy(); barChart = null; }

        // Pie Chart – Avancement Global
        const pieCtx = document.getElementById('montantPieChart');
        if (pieCtx) {
            const realise = d.totalRealise;
            const restant = d.totalPrevu - d.totalRealise;
            pieChart = new Chart(pieCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Réalisé', 'Restant'],
                    datasets: [{
                        data: [realise, Math.max(0, restant)],
                        backgroundColor: ['#10b981', '#e5e7eb'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: {
                            display: true,
                            text: 'Avancement : ' + d.avancementGlobal + '%',
                            font: { size: 18 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    return ctx.label + ' : ' + fmt(ctx.parsed);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Bar Chart – Répartition par tâches
        const barCtx = document.getElementById('montantBarChart');
        if (barCtx && d.taches.length) {
            const labels = d.taches.map(t => t.titre);
            const prevus = d.taches.map(t => t.montantPrevu);
            const realises = d.taches.map(t => t.montantRealise);
            barChart = new Chart(barCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Montant Prévu',
                            data: prevus,
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        },
                        {
                            label: 'Montant Réalisé',
                            data: realises,
                            backgroundColor: '#10b981',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    return ctx.dataset.label + ' : ' + fmt(ctx.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (v) { return (v / 1000000).toFixed(1) + 'M'; }
                            }
                        }
                    }
                }
            });
        }
    }

    // ── Boot ──────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
