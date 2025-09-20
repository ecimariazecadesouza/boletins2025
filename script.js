// ===================================================================
//  Portal de Boletins — Front-end (HTML/CSS/JS puros)
//  Ajustes: sem rodapé no PDF e "–" em bimestres sem nota (0 tratado)
//  Ajustes de paginação para PDF ocupar uma página A4 retrato
// ===================================================================

const DIVISOR_MANUAL = 0; // 0 = automático, 1..4 = forçado

const API_URL = "https://script.google.com/macros/s/AKfycbx_N2LwDzDGJkDAYy_wjfprxVXPOHrAYpEUDEu9TqoqyzajbDpBqahco5KQsQMerRKt/exec"; // ex.: https://script.google.com/macros/s/XXXX/exec

document.addEventListener('DOMContentLoaded', () => {
  const state = { theme: localStorage.getItem('theme') || 'dark', currentAlunos: [] };

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

  const $ = (sel) => document.querySelector(sel);
  const DOM = {
    html: document.documentElement,
    loader: $('#loader-overlay'),
    loaderMsg: $('#loader-message'),
    matriculaSelect: $('#matricula-select'),
    turmaSelect: $('#turma-select'),
    alunosCard: $('#alunos-card'),
    alunosList: $('#alunos-list-container'),
    gerarPdfTodosBtn: $('#gerar-pdf-todos-btn'),
    boletim: $('#boletim-container'),
    error: $('#error-message'),
    themeToggle: $('#theme-toggle'),
    iconSun: $('#theme-icon-sun'),
    iconMoon: $('#theme-icon-moon')
  };

  const UI = {
    loader(show, msg = "Processando…"){ DOM.loader.style.display = show ? 'flex' : 'none'; DOM.loaderMsg.textContent = msg; },
    error(msg){ DOM.error.textContent = msg; DOM.error.style.display = 'block'; },
    clearError(){ DOM.error.style.display = 'none'; DOM.error.textContent = ''; },
    applyTheme(theme){ DOM.html.className = theme; DOM.iconSun.style.display = theme === 'light' ? 'block' : 'none'; DOM.iconMoon.style.display = theme === 'dark' ? 'block' : 'none'; state.theme = theme; localStorage.setItem('theme', theme); },
    toggleTheme(){ this.applyTheme(state.theme === 'dark' ? 'light' : 'dark'); },
    resetSelect(select, placeholder){ select.innerHTML = `<option value="">${placeholder}</option>`; select.disabled = true; },
    fillSelect(select, items, placeholder){
      select.innerHTML = `<option value="">${placeholder}</option>`;
      items.forEach(v => select.add(new Option(v, v)));
      select.disabled = false;
    },
    renderAlunos(alunos){
      state.currentAlunos = alunos.slice();
      DOM.alunosCard.style.display = alunos.length ? 'block' : 'none';
      DOM.alunosList.innerHTML = alunos.map(a => `
        <div class="aluno-item" data-aluno="${a}">
          <span>${a}</span>
          <div class="aluno-actions">
            <button class="button-icon action-view" title="Visualizar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="button-icon action-pdf" title="Gerar PDF">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </button>
          </div>
        </div>
      `).join('');
    },
    setBoletimHTML(html){ DOM.boletim.innerHTML = html; }
  };

  const API = {
    async request(action, params = {}, method = 'GET'){
      const url = new URL(API_URL);
      const options = { method, redirect:'follow' };
      if (method === 'GET'){
        url.searchParams.append('action', action);
        Object.entries(params).forEach(([k,v]) => url.searchParams.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
      } else {
        options.headers = { 'Content-Type':'text/plain;charset=utf-8' };
        options.body = JSON.stringify({ action, params });
      }
      let res;
      try { res = await fetch(url.toString(), options); }
      catch { throw new Error('Falha de rede ou CORS ao contatar a API.'); }
      if(!res.ok) throw new Error(`Erro de rede: HTTP ${res.status} ${res.statusText}`);
      let json; try { json = await res.json(); } catch { throw new Error('Resposta da API não é JSON válido.'); }
      if(json.status !== 'ok') throw new Error(json.message || 'Erro desconhecido na API.');
      return json.data;
    }
  };

  // ======= notas: 0 e vazios contam como "sem lançamento" =======
  function parseNota(v){
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim();
    if (s === '' || s === '-' || s === '–') return NaN;
    const n = Number(s.replace(',', '.'));
    if (!Number.isFinite(n)) return NaN;
    if (n === 0) return NaN;        // 0 tratado como "sem nota"
    return n;
  }
  function displayNota(v){
    const n = parseNota(v);
    return Number.isNaN(n) ? '–' : (v === 0 ? '–' : v);
  }
  function mediaNotas(notas){
    const nums = notas.map(parseNota).filter(n => !Number.isNaN(n));
    const divisor = (DIVISOR_MANUAL >= 1 && DIVISOR_MANUAL <= 4) ? DIVISOR_MANUAL : nums.length;
    if (divisor === 0) return null;
    const soma = nums.reduce((a,b) => a + b, 0);
    return soma / divisor;
  }
  function statusDesempenho(media){
    if (media === null) return '–';
    if (media >= 8) return 'Ótimo';
    if (media >= 6) return 'Satisfatório';
    if (media >= 5) return 'Regular';
    return 'Insuficiente';
  }
  function statusClass(status){
    const s = (status || '').toLowerCase();
    if (s === 'ótimo' || s === 'otimo') return 'status-otimo';
    if (s === 'satisfatório' || s === 'satisfatorio') return 'status-satisfatorio';
    if (s === 'regular') return 'status-regular';
    if (s === 'insuficiente') return 'status-insuficiente';
    if (s === '–' || s === '-' || s === '') return 'status-vazio';
    return 'status-vazio';
  }

  const App = {
    async init(){
      UI.applyTheme(state.theme);
      UI.loader(true, 'Carregando dados…'); UI.clearError();
      try{
        const matriculas = await API.request('getMatriculas');
        UI.fillSelect(DOM.matriculaSelect, matriculas, 'Selecione um tipo');
      }catch(err){ UI.error(err.message); console.error(err); }
      finally{ UI.loader(false); }
    },

    async onMatriculaChange(matricula){
      UI.renderAlunos([]); UI.resetSelect(DOM.turmaSelect, 'Carregando turmas…');
      if(!matricula) { UI.resetSelect(DOM.turmaSelect, 'Selecione um tipo primeiro'); return; }
      UI.loader(true, 'Filtrando turmas…'); UI.clearError();
      try{
        const { turmas } = await API.request('getFilteredData', { matricula });
        UI.fillSelect(DOM.turmaSelect, turmas, 'Selecione uma turma');
      }catch(err){ UI.error(err.message); }
      finally{ UI.loader(false); }
    },

    async onTurmaChange(matricula, turma){
      UI.renderAlunos([]); if(!turma) return;
      UI.loader(true, 'Buscando alunos…'); UI.clearError();
      try{
        const { alunos } = await API.request('getFilteredData', { matricula, turma });
        UI.renderAlunos(alunos);
      }catch(err){ UI.error(err.message); }
      finally{ UI.loader(false); }
    },

    async viewBoletim(aluno, matricula, turma){
      UI.loader(true, `Carregando boletim de ${aluno}…`); UI.clearError();
      try{
        const data = await API.request('getBoletim', { aluno, matricula, turma });
        const html = this.buildBoletimHTML(data);
        UI.setBoletimHTML(html);
      }catch(err){ UI.error(err.message); }
      finally{ UI.loader(false); }
    },

    async gerarPdf(alunos, matricula, turma){
      UI.loader(true, `Gerando PDF para ${alunos.length} aluno(s)…`); UI.clearError();
      try{
        const { pdfUrl } = await API.request('generatePdf',
          { alunos, matricula, turma, divisorManual: DIVISOR_MANUAL }, 'POST');
        window.open(pdfUrl, '_blank');
      }catch(err){ UI.error(err.message); }
      finally{ UI.loader(false); }
    },

    buildBoletimHTML(row){
      const linhas = DISCIPLINAS.map(d => {
        const n1 = row[`${d.id}1`], n2 = row[`${d.id}2`], n3 = row[`${d.id}3`], n4 = row[`${d.id}4`];
        const m = mediaNotas([n1,n2,n3,n4]);
        const stat = statusDesempenho(m);
        const cls = statusClass(stat);
        const td = v => `<td>${displayNota(v)}</td>`;
        return `<tr>
          <td class="disciplina-col">${d.nome}</td>
          ${td(n1)}${td(n2)}${td(n3)}${td(n4)}
          <td class="status ${cls}">${stat}</td>
        </tr>`;
      }).join('');

      return `
      <div class="boletim-wrapper">
        <header class="boletim-header">
          <img src="logo.png" alt="Logo" class="logo"/>
          <div class="titulo">
            <h2>Boletim de Desempenho Escolar</h2>
            <p>Ano letivo: ${row.Ano || new Date().getFullYear()}</p>
          </div>
          <div class="header-extra-info">
            <div><strong>Matrícula:</strong> ${row['Matrícula'] ?? row['Matricula'] ?? row['ID'] ?? '-'}</div>
            <div><strong>Turma:</strong> ${row['S/T'] ?? row['Turma'] ?? '-'}</div>
          </div>
        </header>

        <section class="boletim-info-aluno">
          <div class="info-item-aluno">
            <strong>PROTAGONISTA</strong>
            <span>${row['Protagonistas'] ?? row['Aluno'] ?? row['Nome'] ?? '-'}</span>
          </div>
        </section>

        <main class="boletim-main">
          <table>
            <thead>
              <tr>
                <th style="text-align:left">Disciplina</th>
                <th>1º Bim</th>
                <th>2º Bim</th>
                <th>3º Bim</th>
                <th>4º Bim</th>
                <th>Desempenho</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </main>
      </div>`;
    }
  };

  // Events
  DOM.themeToggle.addEventListener('click', () => UI.toggleTheme());
  DOM.matriculaSelect.addEventListener('change', e => App.onMatriculaChange(e.target.value));
  DOM.turmaSelect.addEventListener('change', e => App.onTurmaChange(DOM.matriculaSelect.value, e.target.value));
  DOM.alunosList.addEventListener('click', (e) => {
    const item = e.target.closest('.aluno-item'); if(!item) return;
    const aluno = item.dataset.aluno, matricula = DOM.matriculaSelect.value, turma = DOM.turmaSelect.value;
    if (e.target.closest('.action-pdf')) App.gerarPdf([aluno], matricula, turma);
    else if (e.target.closest('.action-view')) App.viewBoletim(aluno, matricula, turma);
  });
  DOM.gerarPdfTodosBtn.addEventListener('click', () => {
    const matricula = DOM.matriculaSelect.value, turma = DOM.turmaSelect.value;
    if (turma && state.currentAlunos.length) App.gerarPdf(state.currentAlunos, matricula, turma);
  });

  App.init();
});
