// ========================================================================
// SCRIPT DO FRONT-END PARA O BOLETIM ESCOLAR (v3.2 - Filtro Matrícula)
// ========================================================================

// --- CONFIGURAÇÃO ---
const API_URL = "https://script.google.com/macros/s/AKfycbwRhj7ZRZoBSUcOZrCtTvfzpHjp80FPa4fSYbAkLg28JHYJ1RuaNp2H6xCn6GN9vhnX/exec"; // !! IMPORTANTE !!

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
const alunoTurmaSelect = document.getElementById('aluno-turma-select');
const matriculaSelect = document.getElementById('matricula-select');
const alunoMatriculaSelect = document.getElementById('aluno-matricula-select');
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
function resetAllFilters() {
    turmaSelect.value = "";
    alunoTurmaSelect.innerHTML = '<option>Aguarde a turma...</option>';
    alunoTurmaSelect.disabled = true;
    matriculaSelect.value = "";
    alunoMatriculaSelect.innerHTML = '<option>Aguarde a matrícula...</option>';
    alunoMatriculaSelect.disabled = true;
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
async function carregarDadosIniciais() {
    toggleLoader(true, "Carregando dados iniciais...");
    try {
        const [turmas, matriculas] = await Promise.all([
            fetchData('getTurmas'),
            fetchData('getMatriculas')
        ]);

        turmaSelect.innerHTML = '<option value="">-- Selecione uma turma --</option>';
        turmas.forEach(turma => turmaSelect.add(new Option(turma, turma)));
        turmaSelect.disabled = false;

        matriculaSelect.innerHTML = '<option value="">-- Selecione um tipo --</option>';
        matriculas.forEach(mat => matriculaSelect.add(new Option(mat, mat)));
        matriculaSelect.disabled = false;

    } catch (error) {
        showError("Falha ao carregar dados iniciais. Verifique a API e a planilha.");
    } finally {
        toggleLoader(false);
    }
}

async function carregarAlunosPorTurma(turma) {
    clearBoletins();
    if (!turma) {
        resetAllFilters();
        return;
    }
    toggleLoader(true, "Carregando alunos da turma...");
    clearError();
    alunoTurmaSelect.disabled = true;
    gerarTurmaBtn.disabled = true;
    try {
        const alunos = await fetchData('getAlunos', { turma });
        alunoTurmaSelect.innerHTML = '<option value="">-- Selecione um aluno --</option>';
        alunos.forEach(aluno => alunoTurmaSelect.add(new Option(aluno, aluno)));
        alunoTurmaSelect.disabled = false;
        gerarTurmaBtn.disabled = false;
    } catch (error) {
        alunoTurmaSelect.innerHTML = '<option>Falha ao carregar</option>';
    } finally {
        toggleLoader(false);
    }
}

async function carregarAlunosPorMatricula(matricula) {
    clearBoletins();
    if (!matricula) {
        resetAllFilters();
        return;
    }
    toggleLoader(true, "Carregando alunos por matrícula...");
    clearError();
    alunoMatriculaSelect.disabled = true;
    try {
        const alunos = await fetchData('getAlunos', { matricula });
        alunoMatriculaSelect.innerHTML = '<option value="">-- Selecione um aluno --</option>';
        alunos.forEach(aluno => alunoMatriculaSelect.add(new Option(aluno, aluno)));
        alunoMatriculaSelect.disabled = false;
    } catch (error) {
        alunoMatriculaSelect.innerHTML = '<option>Falha ao carregar</option>';
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
    resetAllFilters();
    turmaSelect.value = turma;
    gerarTurmaBtn.disabled = false;

    try {
        const alunos = await fetchData('getAlunos', { turma });
        if (!alunos || alunos.length === 0) throw new Error("Nenhum aluno encontrado para esta turma.");

        for (let i = 0; i < alunos.length; i++) {
            toggleLoader(true, `Gerando boletim ${i + 1} de ${alunos.length}...`);
            const data = await fetchData('getBoletim', { turma, aluno: alunos[i] });
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
document.addEventListener('DOMContentLoaded', carregarDadosIniciais);

turmaSelect.addEventListener('change', () => {
    matriculaSelect.value = ""; // Limpa o outro filtro principal
    alunoMatriculaSelect.innerHTML = '<option>Aguarde a matrícula...</option>';
    alunoMatriculaSelect.disabled = true;
    carregarAlunosPorTurma(turmaSelect.value);
});

matriculaSelect.addEventListener('change', () => {
    turmaSelect.value = ""; // Limpa o outro filtro principal
    alunoTurmaSelect.innerHTML = '<option>Aguarde a turma...</option>';
    alunoTurmaSelect.disabled = true;
    gerarTurmaBtn.disabled = true;
    carregarAlunosPorMatricula(matriculaSelect.value);
});

alunoTurmaSelect.addEventListener('change', () => {
    if (alunoTurmaSelect.value) {
        gerarBoletim({ turma: turmaSelect.value, aluno: alunoTurmaSelect.value });
    }
});

alunoMatriculaSelect.addEventListener('change', () => {
    if (alunoMatriculaSelect.value) {
        gerarBoletim({ matricula: matriculaSelect.value, aluno: alunoMatriculaSelect.value });
    }
});

gerarTurmaBtn.addEventListener('click', () => gerarBoletinsDaTurma(turmaSelect.value));
printBtn.addEventListener('click', () => window.print());
