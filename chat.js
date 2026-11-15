/* ============================================================
   Página Chat — só sobre trilhas
   - Responde a partir do estado real (jornada + trilhas + estrelas)
   - Sugere trilhas novas e projetos
   - Modo IA real: manda o contexto e cai no roteiro local se falhar
   ============================================================ */
(function () {
  'use strict';
  const L = window.LUNOX;
  const { $, esc, toast } = L;

  L.montarNav('chat');

  const logEl = $('#chat-log');
  const inputEl = $('#input');
  const formEl = $('#form');
  const toggle = $('#modo-ia');

  const CHAVE = (L.CHAVES && L.CHAVES.chat) || 'lunox_chat_historico';
  const MAX_HIST = 24;

  let historico = carregarHistorico();
  let ocupado = false;

  /* ---------------- utilidades ---------------- */

  function norm(s) {
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function carregarHistorico() {
    try {
      const h = JSON.parse(localStorage.getItem(CHAVE));
      return Array.isArray(h) ? h.filter((m) => m && m.role && m.content).slice(-MAX_HIST) : [];
    } catch {
      return [];
    }
  }

  function salvarHistorico() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(historico.slice(-MAX_HIST)));
    } catch {}
  }

  function limparHistorico() {
    historico = [];
    try { localStorage.removeItem(CHAVE); } catch {}
    logEl.innerHTML = '';
    boasVindas();
    definirSugestoes(chips());
    toast('Conversa limpa');
  }

  function scrollFim() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  function addMsg(quem, texto, opts) {
    const el = document.createElement('div');
    el.className = 'msg ' + quem + (opts && opts.typing ? ' typing' : '');
    el.textContent = texto;

    if (opts && opts.layer != null) {
      const tag = document.createElement('span');
      tag.className = 'layer-tag';
      tag.textContent =
        opts.layer === 0 ? 'L0 · regras/fuzzy' :
        opts.layer === 1 ? 'L1 · Groq 27B' :
        opts.layer === 2 ? 'L2 · NVIDIA nemotron' : 'roteiro local';
      el.appendChild(tag);
    }

    logEl.appendChild(el);
    scrollFim();
    return el;
  }

  function addCard(presetId, existenteId) {
    const b = L.TRILHAS_BASE[presetId];
    if (!b) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg lunox';
    wrap.style.maxWidth = '96%';
    wrap.style.background = 'transparent';
    wrap.style.border = '0';
    wrap.style.padding = '0';

    const aulas = b.aulas.map((a, i) =>
      '<li><span class="n">' + (i + 1) + '</span><span>' + esc(a.titulo) + '</span></li>'
    ).join('');

    const estrelas = b.estrelas.map((id) => {
      const s = L.skill(id);
      return s ? s.icon + ' ' + esc(s.nome) : '';
    }).filter(Boolean).join(' · ');

    const acoes = existenteId
      ? '<button class="btn primary small" type="button" data-abrir="' + esc(existenteId) + '">Abrir trilha</button>' +
        '<button class="btn small ghost" type="button" data-criar="' + esc(presetId) + '">Criar nova versão</button>'
      : '<button class="btn primary small" type="button" data-criar="' + esc(presetId) + '">Começar esta trilha</button>' +
        '<a class="btn small ghost" href="sua-trilha.html">Montar a minha</a>';

    wrap.innerHTML =
      '<div class="trail-card">' +
        '<div class="tc-head"><span style="font-size:17px">' + b.icone + '</span>' +
          '<b>' + esc(b.nome) + '</b>' +
          '<span class="chip gold">' + b.aulas.length + ' aulas</span>' +
        '</div>' +
        '<ul class="tc-aulas">' + aulas + '</ul>' +
        '<div class="tc-stars">Acende: ' + estrelas + '</div>' +
        '<div class="row">' + acoes + '</div>' +
      '</div>';

    logEl.appendChild(wrap);
    scrollFim();
  }

  function typing(texto) {
    return addMsg('lunox', texto || 'Lunox está pensando…', { typing: true });
  }

  function definirSugestoes(lista) {
    $('#sugestoes').innerHTML = lista.map((s) =>
      '<button class="sug" type="button" data-chip="' + esc(s) + '">' + esc(s) + '</button>'
    ).join('');
  }

  /* ---------------- contexto real ---------------- */

  function nomeEstrela(sid) {
    const s = L.SKILLS.find((x) => x.star === sid);
    return s ? s.nome : sid;
  }

  function contexto() {
    const j = L.resumoJornada();
    const trilhas = L.estado.trilhas.map((t) => {
      const p = L.progressoTrilha(t.id);
      return {
        nome: t.nome,
        projeto: t.projeto,
        aulas: p.total,
        feitas: p.feitas,
        pct: p.pct,
        concluida: !!t.concluidaEm,
        atual: t.id === L.estado.atual,
      };
    });
    const acesas = L.SKILLS.filter((s) => L.acesa(s.id)).map((s) => s.nome);
    return {
      jornada: j
        ? {
            projeto: j.projeto,
            resumo: j.resumo,
            total: j.total,
            feitas: j.feitas,
            proxima: j.proxima ? { nome: nomeEstrela(j.proxima.estrela), porque: j.proxima.porque } : null,
          }
        : null,
      trilhas,
      atual: (L.atualObj() || {}).nome || null,
      estrelasAcesas: acesas,
    };
  }

  function listaTrilhas() {
    if (!L.estado.trilhas.length) return '';
    return L.estado.trilhas.map((t) => {
      const p = L.progressoTrilha(t.id);
      return '• ' + (t.icone || '🌙') + ' ' + t.nome + ' — ' + p.feitas + '/' + p.total +
        ' aulas (' + p.pct + '%)' + (t.concluidaEm ? ' · concluída ✓' : '') +
        (t.id === L.estado.atual ? ' · é a sua trilha atual' : '');
    }).join('\n');
  }

  function resumoProgresso() {
    const j = L.resumoJornada();
    const partes = [];
    if (j) {
      partes.push('Sua jornada é "' + j.projeto + '": ' + j.feitas + ' de ' + j.total + ' estrelas acesas.');
      if (j.proxima) {
        partes.push('A próxima estrela é ' + nomeEstrela(j.proxima.estrela) +
          (j.proxima.porque ? ' — ' + j.proxima.porque : '') + '.');
      } else if (j.total) {
        partes.push('Você já acendeu todas as estrelas dessa jornada ✦');
      }
    }
    const lista = listaTrilhas();
    if (lista) {
      partes.push((j ? 'Nas trilhas do catálogo:\n' : 'Suas trilhas do catálogo:\n') + lista);
    }
    if (!partes.length) {
      return 'Você ainda não tem nenhuma trilha. Eu trabalho só com trilhas: posso te mostrar as do catálogo (bot de Discord, CRUD de alunos, portfólio web, jogo 2D) ou você descreve um projeto e eu monto a jornada.';
    }
    return partes.join('\n\n');
  }

  function proximoPasso() {
    const j = L.resumoJornada();
    if (j && j.proxima) {
      return 'Seu próximo passo é a estrela ' + nomeEstrela(j.proxima.estrela) + ' 🐾\n\n' +
        (j.proxima.porque ? j.proxima.porque + '\n\n' : '') +
        'Ela está na sua jornada em "Sua trilha", com a aula e o exercício prontos.';
    }
    const t = L.atualObj();
    if (t) {
      const p = L.progressoTrilha(t.id);
      const proximaAula = t.aulas.find((_a, i) => {
        const pr = L.progressoDe(t.id)[i] || {};
        return !pr.editor;
      });
      if (proximaAula) {
        return 'Na trilha "' + t.nome + '" você fez ' + p.feitas + ' de ' + p.total + ' aulas.\n\n' +
          'A próxima é "' + proximaAula.titulo + '". Abra em Trilhas e continue de onde parou.';
      }
      return 'A trilha "' + t.nome + '" está com todas as aulas feitas (' + p.total + '). Quer concluir o projeto ou montar uma trilha nova?';
    }
    if (j) {
      return 'Sua jornada "' + j.projeto + '" está completa (' + j.feitas + '/' + j.total + ' estrelas). Quer montar outra em "Sua trilha"?';
    }
    return 'Você ainda não tem trilha. Quer começar por um bot de Discord, um CRUD de alunos, um portfólio web ou um jogo 2D?';
  }

  const PROJETOS = [
    { re: /bot|discord/, preset: 'bot-discord' },
    { re: /crud|aluno|cadastro|escola|sql|banco de dados/, preset: 'crud-alunos' },
    { re: /portfolio|site pessoal|meu site|landing|curriculo/, preset: 'portfolio-web' },
    { re: /jogo|game|2d|plataforma|personagem/, preset: 'jogo' },
  ];

  function respostaTrilha(preset) {
    const b = L.TRILHAS_BASE[preset];
    const existente = L.acharPorPreset(preset);
    const texto = existente
      ? 'Você já tem a trilha "' + existente.nome + '". Posso abrir de onde você parou ou montar uma versão nova — as duas ficam salvas.'
      : 'Boa escolha! A trilha de ' + b.nome + ' tem ' + b.aulas.length + ' aulas: conceito, código do projeto e validação. Você começa pelo que ainda não sabe.';
    return { texto, card: preset, existenteId: existente ? existente.id : null };
  }

  function sugestoes() {
    const base = Object.keys(L.TRILHAS_BASE)
      .filter((k) => !L.TRILHAS_BASE[k].oculta)
      .map((k) => {
        const b = L.TRILHAS_BASE[k];
        return '• ' + b.icone + ' ' + b.nome + ' — ' + b.descricao;
      });
    return 'Trilhas do catálogo:\n' + base.join('\n') + '\n\n' +
      'Quer algo diferente? Descreva o projeto em "Sua trilha" (ex.: um app de celular, um painel de dados, um bot de WhatsApp) e a IA monta a jornada com as estrelas certas. Eu também posso te dizer qual trilha combina com o que você quer construir.';
  }

  function foraDoTema() {
    return 'Eu fico só nas trilhas 🐾 Posso te mostrar seu progresso, qual é a próxima estrela, as trilhas do catálogo ou ideias de trilhas novas. O que você quer construir?';
  }

  function responder(texto) {
    const t = norm(texto);

    if (/\b(oi|ola|eae|eai|opa|salve|bom dia|boa tarde|boa noite|hey|hi|hello)\b/.test(t) && t.length < 24) {
      const j = L.resumoJornada();
      return {
        texto: 'Oi! Eu sou o Lunox 🐾 Eu falo das suas trilhas: progresso, próxima estrela e ideias de trilhas novas.' +
          (j ? '\n\nSua jornada atual é "' + j.projeto + '" (' + j.feitas + '/' + j.total + ' estrelas).' : '') +
          '\n\nQuer ver o que já existe ou montar uma trilha nova?',
      };
    }
    if (/obrigad|valeu|vlw|brigad/.test(t)) {
      return { texto: 'De nada! Miau. Quando terminar a próxima aula, volta aqui e me conta como foi.' };
    }
    if (/o que eu (ja )?sei|minhas habilidades|meu nivel|meu progresso|como estou|meu avanco/.test(t)) {
      return { texto: resumoProgresso() };
    }
    if (/proxim[ao]|o que (faco|estudo|aprendo) agora|por onde (comeco|continuo)|qual (e )?o proximo/.test(t)) {
      return { texto: proximoPasso() };
    }
    if (/minhas trilhas|listar trilhas|quais trilhas|trilhas que eu tenho|trilha atual/.test(t)) {
      const lista = listaTrilhas();
      return {
        texto: lista
          ? 'Estas são as suas trilhas do catálogo:\n\n' + lista + '\n\nAbrir uma delas leva direto para as aulas, com o progresso salvo.'
          : 'Você ainda não criou nenhuma trilha do catálogo. Quer ver as opções ou descrever um projeto para eu montar a jornada?',
      };
    }
    if (/sugest|ideia|trilha nova|novas trilhas|o que posso (fazer|construir|aprender)|opcoes|quais projetos/.test(t)) {
      return { texto: sugestoes() };
    }
    if (/como funciona|o que voce faz|me ajuda|nao sei o que fazer|como comeco/.test(t)) {
      return {
        texto: 'É simples:\n\n1. Você escolhe uma trilha do catálogo ou descreve um projeto em "Sua trilha".\n2. Eu monto o caminho só com o que falta.\n3. Cada aula tem conceito, código e validação — e as estrelas acendem no mapa.\n\nQuer começar por qual projeto?',
      };
    }

    for (const p of PROJETOS) {
      if (p.re.test(t)) return respostaTrilha(p.preset);
    }

    if (/trilha|plano de estudo|aprender|estudar|quero fazer|quero criar|monta|projeto/.test(t)) {
      return {
        texto: 'Eu trabalho com trilhas. As do catálogo são: bot de Discord, CRUD de alunos, portfólio web e jogo 2D. ' +
          'Se o seu projeto é outro, descreva em "Sua trilha" que eu monto a jornada. Qual chega mais perto do que você quer construir?',
      };
    }

    return { texto: foraDoTema() };
  }

  function chips() {
    const j = L.resumoJornada();
    if (j && j.proxima) {
      return ['Qual é a próxima estrela?', 'Como está meu progresso?', 'Sugestões de trilhas novas', 'Quero um bot de Discord'];
    }
    if (L.estado.trilhas.length) {
      return ['Como está meu progresso?', 'Sugestões de trilhas novas', 'Quero um jogo 2D', 'Montar trilha para meu projeto'];
    }
    return ['Sugestões de trilhas novas', 'Quero um bot de Discord', 'Quero um site de portfólio', 'Como o Lunox monta a trilha?'];
  }

  /* ---------------- IA real ---------------- */

  async function falarComIA(texto) {
    const el = typing('Lunox está pensando… 0s');
    let seg = 0;
    const timer = setInterval(() => {
      seg++;
      el.textContent = 'Lunox está pensando… ' + seg + 's';
    }, 1000);

    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 60000);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          mensagem: texto,
          session: L.sessao(),
          messages: historico.slice(-8),
          contexto: contexto(),
        }),
      });
      const data = await r.json().catch(() => null);
      clearTimeout(abort);
      clearInterval(timer);
      el.remove();

      if (!r.ok || !data) {
        const detalhe = (data && data.error && (data.error.message || data.error.detail)) || ('HTTP ' + r.status);
        throw new Error(detalhe);
      }

      const conteudo = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      if (!conteudo.trim()) throw new Error('resposta vazia');
      const layer = data.lunox ? data.lunox.layer : null;
      addMsg('lunox', conteudo, { layer });
      historico.push({ role: 'assistant', content: conteudo });
      salvarHistorico();
      scrollFim();
    } catch (e) {
      clearTimeout(abort);
      clearInterval(timer);
      el.remove();
      // a IA falhou: responde pelo roteiro local, sem deixar o chat vazio
      const out = responder(texto);
      addMsg('lunox', out.texto, { layer: -1 });
      if (out.card) addCard(out.card, out.existenteId);
      historico.push({ role: 'assistant', content: out.texto });
      salvarHistorico();
      registrarFalha(texto, e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'falha de rede', e);
    }
  }

  function registrarFalha(prompt, motivo, e) {
    try {
      fetch('/api/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: e && e.status ? e.status : null,
          kind: e && e.name === 'AbortError' ? 'timeout' : 'error',
          ms: null,
          model: 'router',
          prompt: prompt,
          message: motivo,
          label: 'Falha no chat do navegador',
        }),
      });
    } catch {}
  }

  /* ---------------- envio ---------------- */

  async function enviar(texto) {
    const limpo = String(texto || '').trim();
    if (!limpo || ocupado) return;
    ocupado = true;

    addMsg('user', limpo);
    historico.push({ role: 'user', content: limpo });
    salvarHistorico();
    inputEl.value = '';
    scrollFim();

    if (L.estado.ia) {
      await falarComIA(limpo);
      ocupado = false;
      return;
    }

    const el = typing('Lunox está digitando…');
    await new Promise((res) => setTimeout(res, 280));
    const out = responder(limpo);
    el.remove();
    addMsg('lunox', out.texto, { layer: null });
    if (out.card) addCard(out.card, out.existenteId);
    historico.push({ role: 'assistant', content: out.texto });
    salvarHistorico();
    scrollFim();
    ocupado = false;
  }

  /* ---------------- painel lateral ---------------- */

  function renderLado() {
    const nivel = L.nivelGato();
    $('#gato').src = L.imgGato(nivel);
    $('#chat-gato').src = L.imgGato(nivel);
    $('#gato-cap').textContent = nivel === 3
      ? 'Lunox completo — constelação quase inteira'
      : nivel === 2
        ? 'Lunox explorador — 4+ estrelas'
        : 'Lunox aprendiz — acenda a primeira estrela';
    $('#estrelas-count').textContent = L.estado.acesas.size;

    const j = L.resumoJornada();
    let html = '';
    if (j) {
      html += '<a class="mini-trail' + (j.proxima ? '' : ' ativo') + '" href="sua-trilha.html" style="text-decoration:none">' +
        '<span>✦</span><span>' + esc(j.projeto) + '</span>' +
        '<span style="margin-left:auto;font-size:10px;color:var(--dim2)">' + j.feitas + '/' + j.total + '</span>' +
      '</a>';
    }
    html += L.estado.trilhas.map((t) => {
      const p = L.progressoTrilha(t.id);
      return '<button class="mini-trail' + (t.id === L.estado.atual ? ' ativo' : '') + '" type="button" data-mini="' + esc(t.id) + '">' +
        '<span>' + (t.icone || '🌙') + '</span>' +
        '<span>' + esc(t.nome) + '</span>' +
        '<span style="margin-left:auto;font-size:10px;color:var(--dim2)">' + p.feitas + '/' + p.total + '</span>' +
      '</button>';
    }).join('');
    $('#mini-trilhas').innerHTML = html || '<p class="tiny">Nenhuma trilha ainda.</p>';
  }

  function pintarModo() {
    const on = !!L.estado.ia;
    toggle.checked = on;
    $('#chat-mode').textContent = on ? 'IA real' : 'roteiro';
    $('#chat-mode').classList.toggle('real', on);
    $('#modo-badge').textContent = on ? 'roteador ao vivo' : 'modo roteiro';
    $('#chat-status').textContent = on
      ? 'online · respostas com IA e plano B local'
      : 'online · respostas instantâneas';
  }

  function boasVindas() {
    const j = L.resumoJornada();
    const msg = j
      ? 'Oi de novo! 🐾 Sua jornada é "' + j.projeto + '" com ' + j.feitas + ' de ' + j.total + ' estrelas acesas. ' +
        'Quer saber a próxima, ver o progresso das trilhas ou pensar em uma trilha nova?'
      : 'Oi! Eu sou o Lunox 🐾 Eu falo só das trilhas: seu progresso, a próxima estrela e ideias de trilhas novas. ' +
        'Quer ver o catálogo ou montar uma trilha para o seu projeto?';
    addMsg('lunox', msg);
    historico.push({ role: 'assistant', content: msg });
    salvarHistorico();
  }

  /* ---------------- eventos ---------------- */

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    enviar(inputEl.value);
  });

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      inputEl.value = chip.getAttribute('data-chip');
      enviar(inputEl.value);
      return;
    }

    const criar = e.target.closest('[data-criar]');
    if (criar) {
      const preset = criar.getAttribute('data-criar');
      const t = L.criar(preset);
      if (!t) return;
      renderLado();
      addMsg('lunox', 'Trilha "' + t.nome + '" criada! Abrindo as aulas…');
      setTimeout(() => { location.href = 'index.html?nova=1'; }, 600);
      return;
    }

    const abrir = e.target.closest('[data-abrir]');
    if (abrir) {
      L.setAtual(abrir.getAttribute('data-abrir'));
      renderLado();
      addMsg('lunox', 'Abrindo sua trilha…');
      setTimeout(() => { location.href = 'index.html'; }, 450);
      return;
    }

    const mini = e.target.closest('[data-mini]');
    if (mini) {
      L.setAtual(mini.getAttribute('data-mini'));
      renderLado();
      toast('Trilha atual trocada');
      return;
    }

    if (e.target.closest('[data-limpar]')) limparHistorico();
  });

  toggle.addEventListener('change', () => {
    L.estado.ia = toggle.checked;
    L.salvar();
    pintarModo();
    addMsg('lunox', toggle.checked
      ? 'IA real ligada 🐾 Continuo falando só de trilhas — agora com respostas da IA e o roteiro local como plano B.'
      : 'Modo roteiro ligado: respostas instantâneas, sempre sobre trilhas.');
    definirSugestoes(chips());
  });

  /* ---------------- boot ---------------- */

  renderLado();
  pintarModo();
  definirSugestoes(chips());

  // retoma a conversa salva; se não houver, dá as boas-vindas
  const salvas = historico.slice();
  historico = [];
  if (salvas.length) {
    salvas.forEach((m) => {
      addMsg(m.role === 'user' ? 'user' : 'lunox', m.content);
      historico.push(m);
    });
  } else {
    boasVindas();
  }
})();
