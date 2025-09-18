// ========================================================================
// SCRIPT DO FRONT-END PARA O BOLETIM ESCOLAR (v3 - Profissional)
// ========================================================================

// --- CONFIGURAÇÃO ---
const API_URL = "https://script.google.com/macros/s/AKfycbzj_AX2WdGVbhYg7LbWVra6bFDyAvNnFlkJ6M6fXlzSSugCiTaq_0y4kk-C1KWhUhYO/exec"; // !! IMPORTANTE !!

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

// --- ELEMENTOS DO DOM ---
const turmaSelect = document.getElementById('turma-select');
const alunoSelect = document.getElementById('aluno-select');
const matriculaInput = document.getElementById('matricula-input');
const buscarMatriculaBtn = document.getElementById('buscar-matricula-btn');
const gerarTurmaBtn = document.getElementById('gerar-turma-btn');
const printBtn = document.getElementById('print-btn');
const boletimContainer = document.getElementById('boletim-container');
const errorMessage = document.getElementById('error-message');
const loaderOverlay = document.getElementById('loader-overlay');
const loaderMessage = document.getElementById('loader-message');

// --- FUNÇÕES DE CONTROLE DA UI ---
function toggleLoader(show, message = "Carregando...") {
    loaderMessage.textContent = message;
    loaderOverlay.style.display = show ? 'flex' : 'none';
}
function showError(message) { errorMessage.textContent = message; errorMessage.style.display = 'block'; }
function clearError() { errorMessage.style.display = 'none'; }
function clearBoletins() { boletimContainer.innerHTML = ''; printBtn.style.display = 'none'; }
function resetFilters() {
    turmaSelect.value = "";
    alunoSelect.innerHTML = '<option>Aguarde a turma...</option>';
    alunoSelect.disabled = true;
    matriculaInput.value = "";
    gerarTurmaBtn.disabled = true;
}

// --- FUNÇÕES DE API ---
async function fetchData(action, params = {}) {
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
        console.error('Erro ao buscar dados:', error);
        showError(error.message);
        throw error;
    }
}

// --- LÓGICA PRINCIPAL ---
async function carregarTurmas() {
    toggleLoader(true, "Carregando dados iniciais...");
    try {
        const turmas = await fetchData('getTurmas');
        turmaSelect.innerHTML = '<option value="">-- Selecione uma turma --</option>';
        turmas.forEach(turma => {
            turmaSelect.add(new Option(turma, turma));
        });
        turmaSelect.disabled = false;
    } catch (error) {
        turmaSelect.innerHTML = '<option>Falha ao carregar</option>';
    } finally {
        toggleLoader(false);
    }
}

async function carregarAlunos(turma) {
    clearBoletins();
    if (!turma) {
        resetFilters();
        return;
    }
    toggleLoader(true, "Carregando alunos da turma...");
    clearError();
    alunoSelect.disabled = true;
    gerarTurmaBtn.disabled = true;
    try {
        const alunos = await fetchData('getAlunos', { turma });
        alunoSelect.innerHTML = '<option value="">-- Selecione um aluno --</option>';
        alunos.forEach(aluno => {
            alunoSelect.add(new Option(aluno, aluno));
        });
        alunoSelect.disabled = false;
        gerarTurmaBtn.disabled = false;
    } catch (error) {
        alunoSelect.innerHTML = '<option>Falha ao carregar</option>';
    } finally {
        toggleLoader(false);
    }
}

function gerarBoletimHTML(data) {
    const notasHTML = DISCIPLINAS.map(d => {
        const notas = [1, 2, 3, 4].map(i => {
            const key = d.id === 'PI1' ? `PI1${i}` : d.id === 'PI2' ? `PI2${i}` : `${d.id}${i}`;
            return `<td>${data[key] || '-'}</td>`;
        }).join('');
        return `<tr><td class="disciplina-col">${d.nome}</td>${notas}</tr>`;
    }).join('');

    return `
        <div class="boletim-wrapper">
            <header class="boletim-header">
                <img src="logo.png" alt="Logo da Escola" class="logo">
                <div class="titulo">
                    <h2>Boletim de Desempenho</h2>
                    <p>Ano Letivo: 2025</p>
                </div>
                <div class="placeholder"></div>
            </header>
            <section class="boletim-info-aluno">
                <div class="info-item"><strong>PROTAGONISTA</strong><span>${data.Protagonistas || ''}</span></div>
                <div class="info-item"><strong>MATRÍCULA</strong><span>${data.Matrícula || ''}</span></div>
                <div class="info-item"><strong>SÉRIE/TURMA</strong><span>${data['S/T'] || ''}</span></div>
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

async function gerarBoletim(params) {
    toggleLoader(true, "Gerando boletim...");
    clearError();
    clearBoletins();
    try {
        const data = await fetchData('getBoletim', params);
        if (!data) throw new Error("Aluno não encontrado com os parâmetros fornecidos.");
        boletimContainer.innerHTML = gerarBoletimHTML(data);
        printBtn.style.display = 'block';
    } catch (error) {
        // Erro já tratado em fetchData
    } finally {
        toggleLoader(false);
    }
}

async function gerarBoletinsDaTurma(turma) {
    if (!turma) return;
    toggleLoader(true, "Iniciando geração em massa...");
    clearError();
    clearBoletins();
    resetFilters();
    turmaSelect.value = turma; // Mantém a turma selecionada
    gerarTurmaBtn.disabled = false;

    try {
        const alunos = await fetchData('getAlunos', { turma });
        if (!alunos || alunos.length === 0) throw new Error("Nenhum aluno encontrado para esta turma.");

        let count = 0;
        for (const aluno of alunos) {
            count++;
            toggleLoader(true, `Gerando boletim ${count} de ${alunos.length}...`);
            const data = await fetchData('getBoletim', { turma, aluno });
            boletimContainer.innerHTML += gerarBoletimHTML(data);
        }
        printBtn.style.display = 'block';
    } catch (error) {
        // Erro já tratado
    } finally {
        toggleLoader(false);
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', carregarTurmas);

turmaSelect.addEventListener('change', () => carregarAlunos(turmaSelect.value));

alunoSelect.addEventListener('change', () => {
    if (alunoSelect.value) {
        matriculaInput.value = ""; // Limpa o outro filtro
        gerarBoletim({ turma: turmaSelect.value, aluno: alunoSelect.value });
    }
});

buscarMatriculaBtn.addEventListener('click', () => {
    if (matriculaInput.value) {
        resetFilters(); // Limpa os outros filtros
        gerarBoletim({ matricula: matriculaInput.value });
    }
});

gerarTurmaBtn.addEventListener('click', () => gerarBoletinsDaTurma(turmaSelect.value));

printBtn.addEventListener('click', () => window.print());
