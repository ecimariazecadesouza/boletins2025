// =================================================================== */
//         PRESTIGE EDITION - SCRIPT & LOGIC (v5.1 Final Fix)          */
// =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & STATE ---
    const API_URL = "https://script.google.com/macros/s/AKfycbw-5-GbFP-YVUdkZB3drIA-EITem1uCOfdSeDvLV-6T1Z4lCW6KB-lXDm-8GIke2h8Y/exec"; // !! IMPORTANTE !!
    const state = {
        theme: localStorage.getItem('theme') || 'light',
        currentAlunos: [],
    };

    const DISCIPLINAS = [
        { nome: "Biologia", id: "Bio" }, { nome: "Física", id: "Fís" }, { nome: "Matemática", id: "Mat" },
        { nome: "Química", id: "Quí" }, { nome: "Filosofia", id: "Fil" }, { nome: "Geografia", id: "Geo" },
        { nome: "História", id: "His" }, { nome: "Sociologia", id: "Soc" }, { nome: "Arte", id: "Art" },
        { nome: "Ed. Física", id: "EdF" }, { nome: "Espanhol", id: "Esp" }, { nome: "Inglês", id: "Ing" },
        { nome: "Português", id: "Por" }, { nome: "Aprofundamento", id: "Apro" }, { nome: "Eletiva", id: "Elet" },
        { nome: "Práticas Integradoras 1", id: "PI1" }, { nome: "Práticas Integradoras 2", id: "PI2" },
        { nome: "Projeto de Vida", id: "PV" }, { nome: "Produção Textual", id: "PT" },
        { nome: "Rec. da Apred. L. Port.", id: "RALP" }, { nome: "Rec. da Apred. Mat.", id: "RAM" }
    ];

    // --- 2. DOM ELEMENTS (sem alterações) ---
    const DOMElements = {
        loader: document.getElementById('loader-overlay'),
        loaderMessage: document.getElementById('loader-message'),
        matriculaSelect: document.getElementById('matricula-select'),
        turmaSelect: document.getElementById('turma-select'),
        alunosCard: document.getElementById('alunos-card'),
        alunosListContainer: document.getElementById('alunos-list-container'),
        gerarPdfTodosBtn: document.getElementById('gerar-pdf-todos-btn'),
        boletimContainer: document.getElementById('boletim-container'),
        errorMessage: document.getElementById('error-message'),
        themeToggle: document.getElementById('theme-toggle'),
        themeIconSun: document.getElementById('theme-icon-sun'),
        themeIconMoon: document.getElementById('theme-icon-moon'),
        html: document.documentElement,
    };

    // --- 3. UI MODULE (sem alterações) ---
    const UI = {
        toggleLoader(show, message = "Processando...") { DOMElements.loader.style.display = show ? 'flex' : 'none'; DOMElements.loaderMessage.textContent = message; },
        showError(message) { DOMElements.errorMessage.textContent = message; DOMElements.errorMessage.style.display = 'block'; },
        clearError() { DOMElements.errorMessage.style.display = 'none'; },
        applyTheme(theme) { DOMElements.html.className = theme; DOMElements.themeIconSun.style.display = theme === 'light' ? 'block' : 'none'; DOMElements.themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none'; localStorage.setItem('theme', theme); state.theme = theme; },
        toggleTheme() { this.applyTheme(state.theme === 'light' ? 'dark' : 'light'); },
        resetSelect(select, message) { select.innerHTML = `<option value="">${message}</option>`; select.disabled = true; },
        populateSelect(select, data, placeholder) { select.innerHTML = `<option value="">${placeholder}</option>`; data.forEach(item => select.add(new Option(item, item))); select.disabled = false; },
        renderAlunosList(alunos) {
            state.currentAlunos = alunos;
            DOMElements.alunosCard.style.display = alunos.length > 0 ? 'block' : 'none';
            if (alunos.length === 0) { DOMElements.alunosListContainer.innerHTML = ''; return; }
            DOMElements.alunosListContainer.innerHTML = alunos.map(aluno => `
                <div class="aluno-item" data-aluno-nome="${aluno}">
                    <span>${aluno}</span>
                    <div class="aluno-actions">
                        <button class="button-icon action-view" title="Visualizar Boletim">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="button-icon action-pdf" title="Gerar PDF do Boletim">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            ` ).join('');
        },
        renderBoletimHTML(html) { DOMElements.boletimContainer.innerHTML = html; }
    };

    // --- 4. API MODULE (CORRIGIDO) ---
    const API = {
        async fetchData(action, params = {}, method = 'GET') {
            const url = new URL(API_URL);
            const options = { method, redirect: 'follow' };

            if (method === 'GET') {
                // CORREÇÃO: Envia parâmetros GET da forma que o Apps Script espera
                url.searchParams.append('action', action);
                for (const key in params) {
                    if (params.hasOwnProperty(key)) {
                        url.searchParams.append(key, params[key]);
                    }
                }
            } else { // POST
                // A lógica POST está correta e permanece a mesma
                const payload = { action, params };
                options.body = JSON.stringify(payload);
                options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
            }

            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
                const result = await response.json();
                if (result.status === 'error') throw new Error(result.message);
                return result.data;
            } catch (error) {
                console.error('API Error:', error);
                UI.showError(error.message);
                throw error;
            }
        }
    };

    // --- 5. APP LOGIC (sem alterações) ---
    const App = {
        async init() {
            UI.applyTheme(state.theme);
            UI.toggleLoader(true, "Carregando dados...");
            try {
                // Esta chamada GET agora funcionará
                const matriculas = await API.fetchData('getMatriculas');
                UI.populateSelect(DOMElements.matriculaSelect, matriculas, 'Selecione um tipo');
            } catch (error) { UI.showError("Falha crítica ao carregar dados iniciais."); }
            finally { UI.toggleLoader(false); }
        },
        async handleMatriculaChange(matricula) {
            UI.renderAlunosList([]);
            if (!matricula) return;
            UI.toggleLoader(true, "Filtrando turmas...");
            try {
                const { turmas } = await API.fetchData('getFilteredData', { matricula });
                UI.populateSelect(DOMElements.turmaSelect, turmas, 'Selecione uma turma');
            } finally { UI.toggleLoader(false); }
        },
        async handleTurmaChange(matricula, turma) {
            UI.renderAlunosList([]);
            if (!turma) return;
            UI.toggleLoader(true, "Buscando alunos...");
            try {
                const { alunos } = await API.fetchData('getFilteredData', { matricula, turma });
                UI.renderAlunosList(alunos);
            } finally { UI.toggleLoader(false); }
        },
        async handleActionClick(target) {
            const alunoItem = target.closest('.aluno-item');
            if (!alunoItem) return;
            const aluno = alunoItem.dataset.alunoNome;
            const isPdf = target.closest('.action-pdf');
            const matricula = DOMElements.matriculaSelect.value;
            const turma = DOMElements.turmaSelect.value;
            
            if (isPdf) {
                this.generatePdf([aluno], matricula, turma);
            } else { // Visualizar
                this.viewBoletim(aluno, matricula, turma);
            }
        },
        async viewBoletim(aluno, matricula, turma) {
            UI.toggleLoader(true, `Visualizando boletim de ${aluno}...`);
            try {
                const boletimData = await API.fetchData('getBoletim', { matricula, turma, aluno });
                const html = this.getBoletimHTML(boletimData);
                UI.renderBoletimHTML(html);
            } finally { UI.toggleLoader(false); }
        },
        async generatePdf(alunos, matricula, turma) {
            UI.toggleLoader(true, `Gerando PDF para ${alunos.length} aluno(s)...`);
            try {
                const { pdfUrl } = await API.fetchData('generatePdf', { alunos, matricula, turma }, 'POST');
                window.open(pdfUrl, '_blank');
            } finally { UI.toggleLoader(false); }
        },
        getBoletimHTML(data) {
            const notasHTML = DISCIPLINAS.map(d => {
                const notas = [1, 2, 3, 4].map(i => `<td>${data[`${d.id}${i}`] || '–'}</td>`).join('');
                return `<tr><td class="disciplina-col">${d.nome}</td>${notas}</tr>`;
            }).join('');
            return `<div class="boletim-wrapper">
                <header class="boletim-header">
                    <img src="logo.png" alt="Logo da Escola" class="logo">
                    <div class="titulo"><h2>Boletim de Desempenho Escolar</h2><p>Ano Letivo: 2025</p></div>
                    <div class="header-extra-info"><div><strong>Matrícula:</strong> ${data.Matrícula}</div><div><strong>Turma:</strong> ${data['S/T']}</div></div>
                </header>
                <section class="boletim-info-aluno">
                    <div class="info-item-aluno"><strong>PROTAGONISTA</strong><span>${data.Protagonistas}</span></div>
                </section>
                <main class="boletim-main"><table><thead><tr><th>Disciplina</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th></tr></thead><tbody>${notasHTML}</tbody></table></main>
            </div>`;
        }
    };

    // --- 6. EVENT LISTENERS ---
    DOMElements.themeToggle.addEventListener('click', () => UI.toggleTheme());
    DOMElements.matriculaSelect.addEventListener('change', (e) => App.handleMatriculaChange(e.target.value));
    DOMElements.turmaSelect.addEventListener('change', (e) => App.handleTurmaChange(DOMElements.matriculaSelect.value, e.target.value));
    DOMElements.alunosListContainer.addEventListener('click', (e) => App.handleActionClick(e.target));
    DOMElements.gerarPdfTodosBtn.addEventListener('click', () => {
        const matricula = DOMElements.matriculaSelect.value;
        const turma = DOMElements.turmaSelect.value;
        if (turma && state.currentAlunos.length > 0) {
            App.generatePdf(state.currentAlunos, matricula, turma);
        }
    });

    App.init();
});
