// ========================================================================
// SCRIPT DO FRONT-END PARA O BOLETIM ESCOLAR
// ========================================================================

// --- CONFIGURAÇÃO ---
// !! IMPORTANTE !! COLE A URL DO SEU APP SCRIPT AQUI
const API_URL = "https://script.google.com/macros/s/AKfycbzj_AX2WdGVbhYg7LbWVra6bFDyAvNnFlkJ6M6fXlzSSugCiTaq_0y4kk-C1KWhUhYO/exec";

// Mapeamento de disciplinas para o layout e cores
const DISCIPLINAS = [
    { nome: "Biologia", id: "Bio", cor: "cor-azul" },
    { nome: "Física", id: "Fís", cor: "cor-azul" },
    { nome: "Matemática", id: "Mat", cor: "cor-azul" },
    { nome: "Química", id: "Quí", cor: "cor-azul" },
    { nome: "Filosofia", id: "Fil", cor: "cor-verde" },
    { nome: "Geografia", id: "Geo", cor: "cor-verde" },
    { nome: "História", id: "His", cor: "cor-verde" },
    { nome: "Sociologia", id: "Soc", cor: "cor-verde" },
    { nome: "Arte", id: "Art", cor: "cor-amarelo" },
    { nome: "Ed. Física", id: "EdF", cor: "cor-amarelo" },
    { nome: "Espanhol", id: "Esp", cor: "cor-amarelo" },
    { nome: "Inglês", id: "Ing", cor: "cor-amarelo" },
    { nome: "Português", id: "Por", cor: "cor-amarelo" },
    { nome: "Aprofundamento", id: "Apro", cor: "cor-turquesa" },
    { nome: "Eletiva", id: "Elet", cor: "cor-turquesa" },
    { nome: "Práticas Integradoras 1", id: "PI1", cor: "cor-turquesa" },
    { nome: "Práticas Integradoras 2", id: "PI2", cor: "cor-turquesa" },
    { nome: "Projeto de Vida", id: "PV", cor: "cor-turquesa" },
    { nome: "Produção Textual", id: "PT", cor: "cor-turquesa" },
    { nome: "Rec. da Apred. L. Port.", id: "RALP", cor: "cor-turquesa" },
    { nome: "Rec. da Apred. Mat.", id: "RAM", cor: "cor-turquesa" }
];

// --- ELEMENTOS DO DOM ---
const turmaSelect = document.getElementById('turma-select' );
const alunoSelect = document.getElementById('aluno-select');
const boletimContainer = document.getElementById('boletim-container');
const notasBody = document.getElementById('boletim-notas');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');

// --- FUNÇÕES ---

// Função genérica para fazer chamadas à API
async function fetchData(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.status === 'error') {
            throw new Error(result.message);
        }
        return result.data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        showError(error.message);
        throw error; // Re-lança o erro para que a chamada saiba que falhou
    }
}

// Mostra/esconde o loader
function toggleLoader(show) {
    loader.style.display = show ? 'block' : 'none';
}

// Mostra uma mensagem de erro
function showError(message) {
    errorMessage.textContent = `Ocorreu um erro: ${message}`;
    errorMessage.style.display = 'block';
}

// Limpa a mensagem de erro
function clearError() {
    errorMessage.style.display = 'none';
}

// Carrega as turmas no primeiro select
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

// Carrega os alunos baseado na turma selecionada
async function carregarAlunos(turma) {
    if (!turma) {
        alunoSelect.innerHTML = '<option>Aguardando seleção da turma...</option>';
        alunoSelect.disabled = true;
        return;
    }
    toggleLoader(true);
    clearError();
    alunoSelect.disabled = true;
    boletimContainer.style.display = 'none';

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
    } catch (error) {
        alunoSelect.innerHTML = '<option>Falha ao carregar alunos</option>';
    } finally {
        toggleLoader(false);
    }
}

// Busca os dados do boletim e preenche a tabela
async function carregarBoletim(turma, aluno) {
    if (!turma || !aluno) {
        boletimContainer.style.display = 'none';
        return;
    }
    toggleLoader(true);
    clearError();

    try {
        const data = await fetchData('getBoletim', { turma, aluno });
        
        // Preenche o cabeçalho
        document.getElementById('boletim-turma').textContent = data['S/T'];
        document.getElementById('boletim-protagonista').textContent = data['Protagonistas'];
        document.getElementById('boletim-matricula').textContent = data['Matrícula'];

        // Preenche as notas
        notasBody.innerHTML = ''; // Limpa a tabela
        DISCIPLINAS.forEach(disciplina => {
            const row = document.createElement('tr');
            
            // Célula da disciplina
            const cellDisciplina = document.createElement('td');
            cellDisciplina.textContent = disciplina.nome;
            cellDisciplina.className = disciplina.cor;
            row.appendChild(cellDisciplina);

            // Células das notas
            for (let i = 1; i <= 4; i++) {
                const cellNota = document.createElement('td');
                // Ajuste para o ID da disciplina (ex: PI11, PI12... vs PI21, PI22...)
                const notaKey = disciplina.id === 'PI1' ? `PI1${i}` : 
                              disciplina.id === 'PI2' ? `PI2${i}` : 
                              `${disciplina.id}${i}`;
                cellNota.textContent = data[notaKey] || '-';
                row.appendChild(cellNota);
            }
            notasBody.appendChild(row);
        });

        boletimContainer.style.display = 'block';
    } catch (error) {
        boletimContainer.style.display = 'none';
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
    carregarBoletim(turma, aluno);
});
