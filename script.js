// =================================================================== */
//             PRESTIGE EDITION - SCRIPT & LOGIC (v4.5 Final)          */
// =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & STATE ---
    const API_URL = "https://script.google.com/macros/s/AKfycbyVEtjUPXzp9zqx7OnCA86FT77DyQaew__rytHQnURF1qIhcnCwxnsSEEqhmz6AnLvf/exec"; // !! IMPORTANTE !!
    const state = {
        theme: localStorage.getItem('theme') || 'light',
    };

    // --- 2. DOM ELEMENTS (sem alterações) ---
    const DOMElements = {
        loader: document.getElementById('loader-overlay'),
        loaderMessage: document.getElementById('loader-message'),
        matriculaSelect: document.getElementById('matricula-select'),
        turmaSelect: document.getElementById('turma-select'),
        alunoSelect: document.getElementById('aluno-select'),
        gerarBtn: document.getElementById('gerar-btn'),
        printBtn: document.getElementById('print-btn'),
        boletimContainer: document.getElementById('boletim-container'),
        errorMessage: document.getElementById('error-message'),
        themeToggle: document.getElementById('theme-toggle'),
        themeIconSun: document.getElementById('theme-icon-sun'),
        themeIconMoon: document.getElementById('theme-icon-moon'),
        html: document.documentElement,
    };

    // --- 3. UI MODULE (sem alterações) ---
    const UI = {
        toggleLoader(show, message = "Processando...") {
            DOMElements.loaderMessage.textContent = message;
            DOMElements.loader.style.display = show ? 'flex' : 'none';
        },
        showError(message) {
            DOMElements.errorMessage.textContent = message;
            DOMElements.errorMessage.style.display = 'block';
        },
        clearError() { DOMElements.errorMessage.style.display = 'none'; },
        applyTheme(theme) {
            DOMElements.html.classList.remove('light', 'dark');
            DOMElements.html.classList.add(theme);
            DOMElements.themeIconSun.style.display = theme === 'light' ? 'block' : 'none';
            DOMElements.themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none';
            localStorage.setItem('theme', theme);
            state.theme = theme;
        },
        toggleTheme() {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
        },
        resetSelect(select, message) {
            select.innerHTML = `<option value="">${message}</option>`;
            select.disabled = true;
        },
        populateSelect(select, data, placeholder) {
            select.innerHTML = `<option value="">${placeholder}</option>`;
            data.forEach(item => select.add(new Option(item, item)));
            select.disabled = false;
        }
    };

    // --- 4. API MODULE (simplificado) ---
    const API = {
        async fetchData(action, params = {}, method = 'GET', body = null) {
            const url = new URL(API_URL);
            const options = { method, redirect: 'follow' };

            if (method === 'GET') {
                url.searchParams.append('action', action);
                for (const key in params) { if (params[key]) url.searchParams.append(key, params[key]); }
            } else { // POST
                options.body = JSON.stringify({ action, params: body }); // Simplificado
                options.headers = { 'Content-Type': 'text/plain;charset=utf-8' }; // Necessário para Apps Script
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

    // --- 5. APP LOGIC (lógica de geração simplificada) ---
    const App = {
        async init() {
            UI.applyTheme(state.theme);
            DOMElements.printBtn.style.display = 'none';
            UI.toggleLoader(true, "Carregando dados...");
            try {
                const matriculas = await API.fetchData('getMatriculas');
                UI.populateSelect(DOMElements.matriculaSelect, matriculas, 'Selecione um tipo');
            } catch (error) {
                UI.showError("Falha crítica ao carregar dados iniciais.");
            } finally {
                UI.toggleLoader(false);
            }
        },

        async handleMatriculaChange(matricula) {
            UI.resetSelect(DOMElements.turmaSelect, 'Aguardando...');
            UI.resetSelect(DOMElements.alunoSelect, 'Aguardando...');
            DOMElements.gerarBtn.disabled = true;
            if (!matricula) return;

            UI.toggleLoader(true, "Filtrando turmas...");
            try {
                const { turmas } = await API.fetchData('getFilteredData', { matricula });
                UI.populateSelect(DOMElements.turmaSelect, turmas, 'Todas as turmas');
                DOMElements.gerarBtn.disabled = false;
            } finally {
                UI.toggleLoader(false);
            }
        },

        async handleTurmaChange(matricula, turma) {
            UI.resetSelect(DOMElements.alunoSelect, 'Aguardando...');
            if (!matricula) return;

            UI.toggleLoader(true, "Filtrando alunos...");
            try {
                const { alunos } = await API.fetchData('getFilteredData', { matricula, turma });
                UI.populateSelect(DOMElements.alunoSelect, alunos, 'Todos os alunos');
            } finally {
                UI.toggleLoader(false);
            }
        },

        async handleGerarClick() {
            const matricula = DOMElements.matriculaSelect.value;
            const turma = DOMElements.turmaSelect.value;
            const aluno = DOMElements.alunoSelect.value;

            if (!matricula) return;

            UI.toggleLoader(true, "Iniciando geração do PDF...");
            UI.clearError();
            DOMElements.boletimContainer.innerHTML = `<div class="placeholder-view"><p>Gerando PDF, por favor aguarde...</p></div>`;

            try {
                // Envia os filtros diretamente para a API gerar o PDF
                const { pdfUrl } = await API.fetchData('generatePdf', {}, 'POST', { matricula, turma, aluno });

                UI.toggleLoader(false);
                DOMElements.boletimContainer.innerHTML = `<div class="placeholder-view"><h3>PDF Gerado com Sucesso!</h3><p>Seu download começará em breve. Caso não comece, <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">clique aqui</a>.</p></div>`;
                
                window.open(pdfUrl, '_blank');

            } catch (error) {
                DOMElements.boletimContainer.innerHTML = `<div class="placeholder-view"><h3>Ocorreu um erro</h3><p>Não foi possível gerar o PDF. Tente novamente.</p></div>`;
            } finally {
                UI.toggleLoader(false);
            }
        },
    };

    // --- 6. EVENT LISTENERS ---
    DOMElements.themeToggle.addEventListener('click', () => UI.toggleTheme());
    DOMElements.matriculaSelect.addEventListener('change', (e) => App.handleMatriculaChange(e.target.value));
    DOMElements.turmaSelect.addEventListener('change', (e) => App.handleTurmaChange(DOMElements.matriculaSelect.value, e.target.value));
    DOMElements.gerarBtn.addEventListener('click', () => App.handleGerarClick());

    // --- INITIALIZE APP ---
    App.init();
});
