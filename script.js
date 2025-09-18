// ========================================================================
// SCRIPT DO FRONT-END PARA O BOLETIM ESCOLAR (v2)
// ========================================================================

// --- CONFIGURAÇÃO ---
const API_URL = "https://script.google.com/macros/s/AKfycbzj_AX2WdGVbhYg7LbWVra6bFDyAvNnFlkJ6M6fXlzSSugCiTaq_0y4kk-C1KWhUhYO/exec";

const DISCIPLINAS = [
    { nome: "Biologia", id: "Bio", cor: "cor-azul" }, { nome: "Física", id: "Fís", cor: "cor-azul" },
    { nome: "Matemática", id: "Mat", cor: "cor-azul" }, { nome: "Química", id: "Quí", cor: "cor-azul" },
    { nome: "Filosofia", id: "Fil", cor: "cor-verde" }, { nome: "Geografia", id: "Geo", cor: "cor-verde" },
    { nome: "História", id: "His", cor: "cor-verde" }, { nome: "Sociologia", id: "Soc", cor: "cor-verde" },
    { nome: "Arte", id: "Art", cor: "cor-amarelo" }, { nome: "Ed. Física", id: "EdF", cor: "cor-amarelo" },
    { nome: "Espanhol", id: "Esp", cor: "cor-amarelo" }, { nome: "Inglês", id: "Ing", cor: "cor-amarelo" },
    { nome: "Português", id: "Por", cor: "cor-amarelo" }, { nome: "Aprofundamento", id: "Apro", cor: "cor-turquesa" },
    { nome: "Eletiva", id: "Elet", cor: "cor-turquesa" }, { nome: "Práticas Integradoras 1", id: "PI1", cor: "cor-turquesa" },
    { nome: "Práticas Integradoras 2", id: "PI2", cor: "cor-turquesa" }, { nome: "Projeto de Vida", id: "PV", cor: "cor-turquesa" },
    { nome: "Produção Textual", id: "PT", cor: "cor-turquesa" }, { nome: "Rec. da Apred. L. Port.", id: "RALP", cor: "cor-turquesa" },
    { nome: "Rec. da Apred. Mat.", id: "RAM", cor: "cor-turquesa" }
];

// --- ELEMENTOS DO DOM ---
const turmaSelect = document.getElementById('turma-select' );
const alunoSelect = document.getElementById('aluno-select');
const boletimContainer = document.getElementById('boletim-container');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const gerarTurmaBtn = document.getElementById('gerar-turma-btn');
const printBtn = document.getElementById('print-btn');

// --- FUNÇÕES ---

async function fetchData(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
        return result.data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        showError(error.message);
        throw error;
    }
}

function toggleLoader(show) { loader.style.display = show ? 'block' : 'none'; }
function showError(message) { errorMessage.textContent = `Ocorreu um erro: ${message}`; errorMessage.style.display = 'block'; }
function clearError() { errorMessage.style.display = 'none'; }
function clearBoletins() { boletimContainer.innerHTML = ''; printBtn.style.display = 'none'; }

async function carregarTurmas() {
    toggleLoader(true);
    clearError();
    try {
        const turmas = await fetchData('getTurmas');
        turmaSelect.innerHTML = '<option value="">-- Selecione uma turma --</option>';
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            turmaSelect.appendChild(option);
        });
        turmaSelect.disabled = false;
    } catch (error) {
        turmaSelect.innerHTML = '<option>Falha ao carregar turmas</option>';
    } finally {
        toggleLoader(false);
    }
}

async function carregarAlunos(turma) {
    clearBoletins();
    if (!turma) {
        alunoSelect.innerHTML = '<option>Aguardando seleção da turma...</option>';
        alunoSelect.disabled = true;
        gerarTurmaBtn.disabled = true;
        return;
    }
    toggleLoader(true);
    clearError();
    alunoSelect.disabled = true;
    gerarTurmaBtn.disabled = true;

    try {
        const alunos = await fetchData('getAlunos', { turma });
        alunoSelect.innerHTML = '<option value="">-- Selecione um aluno --</option>';
        alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno;
            option.textContent = aluno;
            alunoSelect.appendChild(option);
        });
        alunoSelect.disabled = false;
        gerarTurmaBtn.disabled = false;
    } catch (error) {
        alunoSelect.innerHTML = '<option>Falha ao carregar alunos</option>';
    } finally {
        toggleLoader(false);
    }
}

// NOVO: Gera o HTML de um único boletim
function gerarBoletimHTML(data) {
    const notasHTML = DISCIPLINAS.map(disciplina => {
        const notasBimestre = [1, 2, 3, 4].map(i => {
            const notaKey = disciplina.id === 'PI1' ? `PI1${i}` : 
                          disciplina.id === 'PI2' ? `PI2${i}` : 
                          `${disciplina.id}${i}`;
            return `<td>${data[notaKey] || '-'}</td>`;
        }).join('');
        return `
            <tr>
                <td class="${disciplina.cor}">${disciplina.nome}</td>
                ${notasBimestre}
            </tr>
        `;
    }).join('');

    return `
        <div class="boletim-wrapper">
            <header class="boletim-header">
                <div class="header-info">
                    <h1>BOLETIM ESCOLAR 2025</h1>
                    <p><strong>Série/Turma:</strong> <span>${data['S/T']}</span></p>
                    <p><strong>Protagonista:</strong> <span>${data['Protagonistas']}</span></p>
                </div>
                <div class="header-logo">
                    <p><strong>Matrícula:</strong> <span>${data['Matrícula']}</span></p>
                </div>
            </header>
            <main class="boletim-main">
                <table>
                    <thead>
                        <tr>
                            <th class="disciplina-header">Disciplinas</th>
                            <th colspan="4" class="bimestres-header">Bimestres</th>
                        </tr>
                        <tr class="bimestre-numeros">
                            <th></th><th>1º</th><th>2º</th><th>3º</th><th>4º</th>
                        </tr>
                    </thead>
                    <tbody>${notasHTML}</tbody>
                </table>
            </main>
        </div>
    `;
}

async function gerarBoletimIndividual(turma, aluno) {
    if (!turma || !aluno) {
        clearBoletins();
        return;
    }
    toggleLoader(true);
    clearError();
    clearBoletins();

    try {
        const data = await fetchData('getBoletim', { turma, aluno });
        boletimContainer.innerHTML = gerarBoletimHTML(data);
        printBtn.style.display = 'block';
    } catch (error) {
        // O erro já é mostrado pela fetchData
    } finally {
        toggleLoader(false);
    }
}

// NOVO: Gera boletins para todos os alunos da turma
async function gerarBoletinsDaTurma(turma) {
    if (!turma) return;

    toggleLoader(true);
    clearError();
    clearBoletins();
    alunoSelect.value = ""; // Limpa a seleção de aluno individual

    try {
        // 1. Pega a lista de todos os alunos da turma
        const alunos = await fetchData('getAlunos', { turma });
        if (!alunos || alunos.length === 0) {
            showError("Nenhum aluno encontrado para esta turma.");
            return;
        }

        // 2. Para cada aluno, busca os dados do boletim e gera o HTML
        // Usamos Promise.all para fazer as requisições em paralelo (mais rápido)
        const promessas = alunos.map(aluno => fetchData('getBoletim', { turma, aluno }));
        const todosOsBoletins = await Promise.all(promessas);

        // 3. Adiciona todos os boletins gerados ao container
        todosOsBoletins.forEach(data => {
            boletimContainer.innerHTML += gerarBoletimHTML(data);
        });
        
        printBtn.style.display = 'block';

    } catch (error) {
        // O erro já é mostrado pela fetchData
    } finally {
        toggleLoader(false);
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', carregarTurmas);

turmaSelect.addEventListener('change', (e) => {
    carregarAlunos(e.target.value);
});

alunoSelect.addEventListener('change', (e) => {
    const turma = turmaSelect.value;
    const aluno = e.target.value;
    gerarBoletimIndividual(turma, aluno);
});

gerarTurmaBtn.addEventListener('click', () => {
    const turma = turmaSelect.value;
    gerarBoletinsDaTurma(turma);
});

printBtn.addEventListener('click', () => {
    window.print(); // Aciona a funcionalidade de impressão do navegador
});
