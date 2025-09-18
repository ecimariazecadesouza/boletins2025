// =================================================================== */
//             PRESTIGE EDITION - SCRIPT & LOGIC (v4.1 Final)          */
// =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & STATE ---
    const API_URL = "https://script.google.com/macros/s/AKfycbx4LsPvWhADUyy6DLQZICv_TYoJQb8p4_m24zKa9D4zUJKYQaS_eIwrRPl_k7-JLQ0/exec"; // !! IMPORTANTE !!
    const state = {
        allStudents: [],
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
        turmaSelect: document.getElementById('turma-select'),
        searchInput: document.getElementById('search-input'),
        searchResults: document.getElementById('search-results'),
        gerarTurmaBtn: document.getElementById('gerar-turma-btn'),
        printBtn: document.getElementById('print-btn'),
        boletimContainer: document.getElementById('boletim-container'),
        errorMessage: document.getElementById('error-message'),
        themeToggle: document.getElementById('theme-toggle'),
        themeIconSun: document.getElementById('theme-icon-sun'),
        themeIconMoon: document.getElementById('theme-icon-moon'),
        html: document.documentElement,
    };

    // --- 3. UI & THEME MODULE ---
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
        }
    };

    // --- 4. API MODULE ---
    const API = {
        async fetchData(action, params = {}) {
            const url = new URL(API_URL);
            url.searchParams.append('action', action);
            for (const key in params) { url.searchParams.append(key, params[key]); }
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
            UI.toggleLoader(true, "Carregando dados da instituição...");
            try {
                const [turmas, allStudents] = await Promise.all([
                    API.fetchData('getTurmas'),
                    API.fetchData('getAllStudents') // Assume a new API endpoint
                ]);
                state.allStudents = allStudents;

                DOMElements.turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
                turmas.forEach(turma => DOMElements.turmaSelect.add(new Option(turma, turma)));
                DOMElements.turmaSelect.disabled = false;
            } catch (error) {
                UI.showError("Falha crítica ao carregar dados iniciais. O portal não pode operar.");
            } finally {
                UI.toggleLoader(false);
            }
        },

        handleSearch(query) {
            if (query.length < 2) {
                DOMElements.searchResults.innerHTML = '';
                return;
            }
            const lowerQuery = query.toLowerCase();
            const results = state.allStudents
                .filter(s => s.Protagonistas.toLowerCase().includes(lowerQuery) || s.Matrícula.toString().includes(lowerQuery))
                .slice(0, 5); // Limit results for performance

            let resultsHTML = '';
            if (results.length > 0) {
                resultsHTML = results.map(s => `
                    <div class="search-result-item" data-matricula="${s.Matrícula}">
                        <strong>${s.Protagonistas}</strong>
                        <span>Matrícula: ${s.Matrícula} | Turma: ${s['S/T']}</span>
                    </div>
                `).join('');
            }
            DOMElements.searchResults.innerHTML = resultsHTML;
        },

        async generateBoletimByMatricula(matricula) {
            UI.toggleLoader(true, "Gerando boletim...");
            UI.clearError();
            DOMElements.searchResults.innerHTML = '';
            DOMElements.searchInput.value = '';
            try {
                const data = await API.fetchData('getBoletim', { matricula });
                if (!data) throw new Error("Aluno não encontrado.");
                UI.renderBoletim(this.getBoletimHTML(data));
            } catch (error) {
                UI.renderBoletim('');
            } finally {
                UI.toggleLoader(false);
            }
        },

        async generateBoletinsByTurma(turma) {
            if (!turma) return;
            UI.toggleLoader(true, "Iniciando geração em massa...");
            UI.clearError();
            UI.renderBoletim('');
            try {
                const alunosDaTurma = state.allStudents.filter(s => s['S/T'] === turma);
                if (alunosDaTurma.length === 0) throw new Error("Nenhum aluno encontrado para esta turma.");

                let boletinsHTML = '';
                for (let i = 0; i < alunosDaTurma.length; i++) {
                    UI.toggleLoader(true, `Gerando boletim ${i + 1} de ${alunosDaTurma.length}...`);
                    const data = await API.fetchData('getBoletim', { matricula: alunosDaTurma[i].Matrícula });
                    boletinsHTML += this.getBoletimHTML(data);
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
    DOMElements.turmaSelect.addEventListener('change', () => {
        DOMElements.gerarTurmaBtn.disabled = !DOMElements.turmaSelect.value;
    });
    DOMElements.gerarTurmaBtn.addEventListener('click', () => App.generateBoletinsByTurma(DOMElements.turmaSelect.value));
    DOMElements.searchInput.addEventListener('input', (e) => App.handleSearch(e.target.value));
    DOMElements.searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            const matricula = item.dataset.matricula;
            App.generateBoletimByMatricula(matricula);
        }
    });

    // --- INITIALIZE APP ---
    App.init();
});
