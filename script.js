// =================================================================== */
//             PRESTIGE EDITION - SCRIPT & LOGIC (v4.2 Final)          */
// =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & STATE ---
    const API_URL = "https://script.google.com/macros/s/AKfycbyHy85ntOV28SOyj3ielE_RPuAlT1YOsGKS8Lo5EFmws_i6I5f00iE-HsCMr6Omdh36/exec"; // !! IMPORTANTE !!
    const state = {
        theme: localStorage.getItem('theme') || 'light',
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

    // --- 2. DOM ELEMENTS ---
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

    // --- 3. UI MODULE ---
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
        renderBoletim(html) {
            DOMElements.boletimContainer.innerHTML = html;
            DOMElements.printBtn.style.display = html ? 'flex' : 'none';
        },
        resetSelect(select, message) {
            select.innerHTML = `<option>${message}</option>`;
            select.disabled = true;
        },
        populateSelect(select, data, placeholder) {
            select.innerHTML = `<option value="">${placeholder}</option>`;
            data.forEach(item => select.add(new Option(item, item)));
            select.disabled = false;
        }
    };

    // --- 4. API MODULE ---
    const API = {
        async fetchData(action, params = {}) {
            const url = new URL(API_URL);
            url.searchParams.append('action', action);
            for (const key in params) { if(params[key]) url.searchParams.append(key, params[key]); }
            try {
                const response = await fetch(url);
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

    // --- 5. APP LOGIC ---
    const App = {
        async init() {
            UI.applyTheme(state.theme);
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

            UI.toggleLoader(true, "Iniciando geração...");
            UI.clearError();
            UI.renderBoletim('');

            try {
                const { alunos: alunosParaGerar } = await API.fetchData('getFilteredData', { matricula, turma, aluno });
                if (alunosParaGerar.length === 0) throw new Error("Nenhum aluno encontrado com os filtros selecionados.");

                let boletinsHTML = '';
                for (let i = 0; i < alunosParaGerar.length; i++) {
                    UI.toggleLoader(true, `Gerando boletim ${i + 1} de ${alunosParaGerar.length}...`);
                    const data = await API.fetchData('getBoletim', { matricula, turma, aluno: alunosParaGerar[i] });
                    if(data) boletinsHTML += this.getBoletimHTML(data);
                }
                UI.renderBoletim(boletinsHTML);
            } catch (error) {
                UI.renderBoletim('');
            } finally {
                UI.toggleLoader(false);
            }
        },

        getBoletimHTML(data) {
            const notasHTML = DISCIPLINAS.map(d => {
                const notas = [1, 2, 3, 4].map(i => {
                    const key = d.id === 'PI1' ? `PI1${i}` : d.id === 'PI2' ? `PI2${i}` : `${d.id}${i}`;
                    return `<td>${data[key] || '–'}</td>`;
                }).join('');
                return `<tr><td class="disciplina-col">${d.nome}</td>${notas}</tr>`;
            }).join('');

            return `
                <div class="boletim-wrapper">
                    <header class="boletim-header">
                        <img src="logo.png" alt="Logo da Escola" class="logo">
                        <div class="titulo">
                            <h2>Boletim de Desempenho Acadêmico</h2>
                            <p>Ano Letivo: 2025</p>
                        </div>
                        <div class="header-extra-info">
                            <div class="info-item"><strong>Matrícula:</strong> ${data.Matrícula || ''}</div>
                            <div class="info-item"><strong>Turma:</strong> ${data['S/T'] || ''}</div>
                        </div>
                    </header>
                    <section class="boletim-info-aluno">
                        <div class="info-item-aluno">
                            <strong>PROTAGONISTA</strong>
                            <span>${data.Protagonistas || ''}</span>
                        </div>
                    </section>
                    <main class="boletim-main">
                        <table>
                            <thead><tr><th>Disciplina</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th></tr></thead>
                            <tbody>${notasHTML}</tbody>
                        </table>
                    </main>
                </div>
            `;
        }
    };

    // --- 6. EVENT LISTENERS ---
    DOMElements.themeToggle.addEventListener('click', () => UI.toggleTheme());
    DOMElements.printBtn.addEventListener('click', () => window.print());
    DOMElements.matriculaSelect.addEventListener('change', (e) => App.handleMatriculaChange(e.target.value));
    DOMElements.turmaSelect.addEventListener('change', (e) => App.handleTurmaChange(DOMElements.matriculaSelect.value, e.target.value));
    DOMElements.gerarBtn.addEventListener('click', () => App.handleGerarClick());

    // --- INITIALIZE APP ---
    App.init();
});
