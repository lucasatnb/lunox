/* ============================================================
   Sua trilha — a jornada do projeto, estrela por estrela.
   - Cria a jornada pela IA (POST /api/montar-trilha) e, se a IA falhar,
     monta um plano local por palavras-chave.
   - Valida tudo que vem da IA: só estrelas reais, pré-requisitos antes.
   - Cada estrela abre a aula: vídeo do YouTube (aulas-yt.js) + exercício.
   ============================================================ */
(function () {
  'use strict';
  const L = window.LUNOX;
  const { $, esc, toast } = L;

  L.montarNav('jornada');

  const CHAVE = 'lunox_jornada';
  const MAX = 30;
  // lido na hora: o endereço muda quando abrimos uma estrela ou criamos outra jornada
  const pedida = () => new URLSearchParams(location.search).get('estrela');

  const SUGESTOES = [
    'Um bot de Discord', 'Um site de portfólio', 'Um jogo 2D',
    'Classificar imagens com IA', 'Um sistema de cadastro com banco de dados', 'Um app de celular',
  ];
  const NIVEIS = [['nunca_programei', 'Nunca programei'], ['sei_o_basico', 'Sei o básico'], ['ja_programo', 'Já programo']];

  let jor = ler();
  let nivel = (jor && jor.nivel) || 'nunca_programei';
  let criando = false;
  let ocupado = false;
  // pergunta da IA esperando resposta: { projeto, detalhes, rodada }
  let pendente = null;
  let aberta = null;
  // veio do botão "Nova trilha": abre direto o formulário de criação
  const abrirCriacao = new URLSearchParams(location.search).get('nova') === '1';

  /* ---------------- utilidades ---------------- */

  function ler() {
    try {
      const j = JSON.parse(localStorage.getItem(CHAVE));
      return j && Array.isArray(j.marcos) && j.marcos.length ? j : null;
    } catch { return null; }
  }
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(jor)); } catch {} }
  const txt = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cor = (e) => (L.CONSTELACOES[e.raiz] || {}).cor || '#ffd666';

  const acesaE = (sid) => { const s = L.skillDaEstrela(sid); return !!(s && L.acesa(s.id)); };
  const acesasIds = () => L.ESTRELAS_LISTA.filter((e) => acesaE(e.id)).map((e) => e.id);
  const etapasDe = () => (jor ? jor.marcos.flatMap((m) => m.etapas).filter((et) => L.estrela(et.estrela)) : []);
  const etapaDe = (sid) => etapasDe().find((et) => et.estrela === sid) || null;
  const proxima = () => { const e = etapasDe().find((et) => !acesaE(et.estrela)); return e ? e.estrela : null; };

  /* ---------------- conteúdo das estrelas (grupos: vídeo + desafio) ---------------- */

  const AULAS = window.LUNOX_AULAS_API;

  const grupoAberto = {};   // sid -> índice do grupo aberto (-1 = todos fechados)
  const parteAtual = {};    // "sid:grupo" -> vídeo selecionado

  const exerciciosDe = (sid) => (AULAS && AULAS.exerciciosDe ? AULAS.exerciciosDe(sid) : []);
  const exFeito = (sid, chave) => !!(L.exercicioOk && L.exercicioOk(sid, chave));
  const pendentesDe = (sid) => exerciciosDe(sid).filter((e) => !exFeito(sid, e.chave));

  /* resposta escrita das estrelas dissertativas (salva neste navegador) */
  const chaveResposta = (sid, i) => 'lunox_resposta_' + sid + '_' + i;
  function lerResposta(sid, i) {
    try { return localStorage.getItem(chaveResposta(sid, i)) || ''; } catch { return ''; }
  }
  function salvarResposta(sid, i, valor) {
    try { localStorage.setItem(chaveResposta(sid, i), valor); } catch { /* sem localStorage */ }
  }

  function iframe(v) {
    return '<iframe src="' + AULAS.srcEmbed(v) + '" title="' + esc(v.titulo || 'Aula em vídeo') + '" loading="lazy" ' +
      'allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  }

  function animacao(el, entrada) {
    if (!el || typeof el.animate !== 'function') return null;
    const quadros = entrada
      ? [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }]
      : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }];
    try {
      return el.animate(quadros, { duration: entrada ? 240 : 150, easing: entrada ? 'cubic-bezier(.2,.7,.3,1)' : 'ease-in', fill: 'both' });
    } catch { return null; }
  }

  /** Troca o HTML de `el` com fade out → fade in (sem animação quando pedido). */
  function fadeSwap(el, html, comFade) {
    if (!el) return;
    const aplicar = () => { el.innerHTML = html; if (comFade) animacao(el, true); };
    if (!comFade) { aplicar(); return; }
    let feito = false;
    const fim = () => { if (feito) return; feito = true; aplicar(); };
    const a = animacao(el, false);
    if (a) { a.onfinish = fim; setTimeout(fim, 260); } else fim();
  }

  function gruposHtml(sid) {
    const grupos = AULAS.gruposDe(sid);
    if (!grupos.length) return null;
    const aberto = grupoAberto[sid] === undefined ? 0 : grupoAberto[sid];
    return grupos.map((g, i) => grupoHtml(sid, g, i, i === aberto)).join('');
  }

  /** Desafio final ainda travado: mostra o que falta em vez dos botões do editor. */
  function blocoFinalTravado(sid, ex) {
    const daAula = exerciciosDe(sid).filter((e) => e.tipo === 'grupo');
    const feitos = daAula.filter((e) => exFeito(sid, e.chave)).length;
    const falta = daAula.filter((e) => !exFeito(sid, e.chave));
    const primeiro = falta[0];
    const link = primeiro
      ? 'programar.html?estrela=' + encodeURIComponent(sid) + '&grupo=' + primeiro.indice
      : 'sua-trilha.html?estrela=' + encodeURIComponent(sid);
    return '<section class="desafio exercicio desafio-final final-travado">' +
      '<div class="desafio-head"><span class="desafio-selo">🔒 Desafio final</span>' +
      (ex.titulo ? '<b>' + esc(ex.titulo) + '</b>' : '') +
      '<span class="chip dim">' + feitos + '/' + daAula.length + ' exercícios</span>' +
      '</div>' +
      '<p class="desafio-enunciado">Conclua os exercícios das aulas para destravar o desafio final.</p>' +
      '<p class="final-travado-nota">' + (falta.length === 1 ? 'Falta 1 exercício:' : 'Faltam ' + falta.length + ' exercícios:') + '</p>' +
      '<ul class="desafio-reqs final-travado-lista">' + falta.map((e) => '<li>' + esc(e.titulo) + '</li>').join('') + '</ul>' +
      '<div class="desafio-acoes">' +
        '<a class="btn small primary" href="' + link + '">' + (primeiro ? 'Ir para o primeiro pendente' : 'Voltar para a trilha') + '</a>' +
      '</div>' +
    '</section>';
  }

  /** Exercício de código/escrito criado na admin. */
  function blocoExercicio(sid, ex, chave, indice, ehFinal) {
    const feito = exFeito(sid, chave);
    if (ehFinal && L.finalLiberado && !L.finalLiberado(sid)) return blocoFinalTravado(sid, ex);
    const pts = L.pontosDoExercicio ? L.pontosDoExercicio(sid, chave) : 0;
    const q = 'estrela=' + encodeURIComponent(sid) + (ehFinal ? '&final=1' : '&grupo=' + indice);
    const rotuloLing = ex.linguagem === 'blocos' ? 'Blocos'
      : ex.linguagem === 'python' ? 'Python'
        : ex.linguagem === 'typescript' ? 'TypeScript' : 'JavaScript';
    const ehBlocos = ex.linguagem === 'blocos';
    let h = '<section class="desafio exercicio' + (ehFinal ? ' desafio-final' : '') + '">' +
      '<div class="desafio-head"><span class="desafio-selo">' + (ehFinal ? 'Desafio final' : 'Exercício') + '</span>' +
      (ex.titulo ? '<b>' + esc(ex.titulo) + '</b>' : '') +
      (ex.testes.trim() ? '<span class="chip dim">' + rotuloLing + '</span>' : '') +
      (pts ? '<span class="chip pontos" title="pontos ao concluir">⭐ +' + pts + ' pts</span>' : '') +
      (feito ? '<span class="chip ok">concluído ✓</span>' : '') +
      '</div>' +
      (ex.enunciado ? '<p class="desafio-enunciado">' + esc(ex.enunciado) + '</p>' : '') +
      (ex.requisitos.length ? '<ul class="desafio-reqs">' + ex.requisitos.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '') +
      (ex.dica ? '<p class="desafio-dica"><b>Dica:</b> ' + esc(ex.dica) + '</p>' : '') +
      (ex.arquivos && ex.arquivos.length
        ? '<p class="tiny" style="margin:8px 0 0;color:var(--dim2)">Arquivos: ' + esc(ex.arquivos.map((a) => a.nome + (a.principal ? ' (principal)' : '')).join(', ')) + '</p>'
        : '');

    if (ex.testes.trim()) {
      h += '<div class="desafio-acoes">' +
        '<a class="btn small ' + (feito ? 'ghost' : 'primary') + '" href="programar.html?' + q + '&full=1">' +
          (feito ? 'Rever em tela cheia' : 'Abrir em tela cheia') + '</a>' +
        '<a class="btn small ghost" href="programar.html?' + q + '">' +
          (feito ? 'Rever ' : 'Abrir ') + (ehBlocos ? 'os blocos' : 'no editor') + '</a>' +
      '</div>';
    } else if (!feito) {
      h += '<div class="desafio-acoes">' +
        '<button class="btn small primary" type="button" data-marcar-exercicio="' + esc(chave) + '" data-star="' + esc(sid) + '">Marcar como concluído</button>' +
      '</div>';
    }
    return h + '</section>';
  }

  function grupoHtml(sid, g, i, aberto) {
    const chave = sid + ':' + i;
    const varios = g.videos.length > 1;
    const parte = Math.min(parteAtual[chave] || 0, Math.max(0, g.videos.length - 1));
    const v = g.videos[parte];

    let h = '';
    if (v) {
      if (varios) {
        h += '<div class="video-partes">' + g.videos.map((_v, k) =>
          '<button type="button" data-parte="' + k + '" data-grupo-idx="' + i + '" data-star="' + esc(sid) + '" aria-pressed="' + (k === parte) + '">Parte ' + (k + 1) + '</button>').join('') + '</div>';
      }
      h += '<div class="video">' + iframe(v) + '</div>';
      h += '<p class="video-meta">' + (v.titulo ? esc(v.titulo) + ' · ' : '') +
        '<a href="' + esc(v.url) + '" target="_blank" rel="noopener">abrir no YouTube</a></p>';
    } else {
      h += '<div class="video-vazio video-vazio-mini"><div><b>Vídeo deste grupo em breve</b>O desafio já está aqui embaixo.</div></div>';
    }
    if (g.resumo) h += '<p class="no-resumo">' + esc(g.resumo) + '</p>';

    if (g.exercicio) {
      h += blocoExercicio(sid, g.exercicio, 'g' + i, i, false);
    } else if (g.desafio) {
      h += '<section class="desafio">' +
        '<div class="desafio-head"><span class="desafio-selo">Desafio</span>' +
        (g.desafio.titulo ? '<b>' + esc(g.desafio.titulo) + '</b>' : '') + '</div>' +
        (g.desafio.enunciado ? '<p class="desafio-enunciado">' + esc(g.desafio.enunciado) + '</p>' : '') +
        (g.desafio.requisitos.length ? '<ul class="desafio-reqs">' + g.desafio.requisitos.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '') +
        (g.desafio.dica ? '<p class="desafio-dica"><b>Dica:</b> ' + esc(g.desafio.dica) + '</p>' : '');
      if (AULAS.tipoDe(sid) === 'dissertativa') {
        const resposta = lerResposta(sid, i);
        h += '<label class="desafio-resposta"><span>Sua resposta</span>' +
          '<textarea data-resposta="' + i + '" data-star="' + esc(sid) + '" rows="4" maxlength="4000" ' +
            'placeholder="Escreva com suas palavras. A resposta fica salva neste navegador.">' + esc(resposta) + '</textarea>' +
          '<span class="desafio-resposta-nota" data-resposta-nota="' + i + '">' +
            (resposta.trim() ? 'Salvo neste navegador ✓' : 'Salva sozinha enquanto você escreve') +
          '</span></label>';
      } else {
        const sk = L.skillDaEstrela(sid);
        if (sk && L.temExercicio(sk.id)) {
          const url = 'programar.html?skill=' + encodeURIComponent(sk.id);
          h += '<div class="desafio-acoes">' +
            '<a class="btn small primary" href="' + url + '&full=1">Abrir desafio em tela cheia</a>' +
            '<a class="btn small ghost" href="' + url + '">Abrir no editor</a>' +
          '</div>';
        }
      }
      h += '</section>';
    } else {
      h += '<div class="desafio-vazio">' +
        '<div><b>Sem desafio ainda</b><span class="tiny">A IA monta um a partir do objetivo da sua trilha.</span></div>' +
        '<button class="btn small ghost" type="button" data-gerar-desafio="' + i + '" data-star="' + esc(sid) + '">Pedir desafio à IA</button>' +
        '</div>';
    }

    const tags = (g.videos.length ? '<span class="chip dim">vídeo</span>' : '') +
      (g.exercicio ? '<span class="chip dim">exercício</span>' : '') +
      (g.desafio ? '<span class="chip dim">desafio</span>' : '') +
      (AULAS.tipoDe(sid) === 'dissertativa' ? '<span class="chip dim">dissertativa</span>' : '');

    return '<div class="grupo' + (aberto ? ' aberto' : '') + '">' +
      '<button class="grupo-head" type="button" data-grupo="' + i + '" data-star="' + esc(sid) + '" aria-expanded="' + (aberto ? 'true' : 'false') + '">' +
        '<span class="grupo-n">' + (i + 1) + '</span>' +
        '<span class="grupo-titulo">' + esc(g.titulo) + '</span>' +
        '<span class="grupo-tags">' + tags + '</span>' +
        '<span class="no-seta">▾</span>' +
      '</button>' +
      '<div class="grupo-body"' + (aberto ? '' : ' hidden') + '>' + h + '</div>' +
    '</div>';
  }

  function renderGrupos(sid, comFade) {
    const li = noEl(sid);
    if (!li) return;
    const wrap = li.querySelector('.grupos');
    if (!wrap) return;
    fadeSwap(wrap, gruposHtml(sid), comFade);
  }

  /* ---------------- validação da jornada (IA ou local) ---------------- */

  // só estrelas reais, sem repetir, sem as já acesas, com os pré-requisitos antes
  function normalizar(raw, acesas) {
    const sabidas = new Set(acesas);
    acesas.forEach((a) => L.ancestrais(a).forEach((x) => sabidas.add(x)));
    const vistas = new Set();
    const marcos = [];
    let total = 0;
    const lista = raw && Array.isArray(raw.marcos) ? raw.marcos : [];

    lista.forEach((m) => {
      const etapas = [];
      (m && Array.isArray(m.etapas) ? m.etapas : []).forEach((et) => {
        const sid = String((et && et.estrela) || '').trim().toUpperCase();
        if (!L.estrela(sid) || vistas.has(sid) || acesas.indexOf(sid) >= 0 || total >= MAX) return;
        L.ancestrais(sid).reverse().forEach((anc) => {
          if (vistas.has(anc) || sabidas.has(anc) || total >= MAX) return;
          vistas.add(anc);
          total++;
          etapas.push({ estrela: anc, porque: 'Pré-requisito de ' + L.estrela(sid).nome + '.', entrega: '' });
        });
        if (total >= MAX) return;
        vistas.add(sid);
        total++;
        etapas.push({ estrela: sid, porque: txt(et.porque, 200), entrega: txt(et.entrega, 140) });
      });
      if (etapas.length) marcos.push({ titulo: txt(m.titulo, 80) || 'Próximo passo', descricao: txt(m.descricao, 200), etapas });
    });
    return marcos;
  }

  /* ---------------- plano local (quando a IA não responde) ---------------- */

  // [regex sobre o texto sem acento, título do marco, estrelas, tipo]
  const INTENTS = [
    [/bot|discord|telegram/, 'O bot ganha vida', ['BO1', 'BO6', 'BE1', 'BE2']],
    [/whatsapp|zap/, 'O bot no WhatsApp', ['BO1', 'BO6', 'BO7', 'BE2', 'BE18']],
    [/\bsite\b|pagina|landing|portfolio|curriculo|loja|blog/, 'A página no ar', ['FE1', 'FE2', 'FE5', 'FE6', 'FE3', 'FE4', 'FE7'], 'web'],
    [/react|\bspa\b|app web|aplicativo web/, 'A interface com React', ['FE3', 'FE4', 'FE10', 'FE11', 'FE8'], 'web'],
    [/\bapi\b|servidor|backend|back-end|rest\b/, 'O servidor e a API', ['BE1', 'BE2', 'BE3', 'BE11']],
    [/login|autentic|senha|usuario/, 'Login seguro', ['BE2', 'BE7', 'SE2', 'BE8']],
    [/banco|crud|cadastro|sistema|estoque|aluno|\bsql\b/, 'Os dados ficam guardados', ['DB1', 'DB2', 'DB3', 'DB6']],
    [/jogo|game|plataforma|fase/, 'O jogo roda', ['JG1', 'JG2', 'JG3', 'JG4', 'JG9']],
    [/godot/, 'O jogo no Godot', ['JG1', 'JG5', 'JG9']],
    [/unity/, 'O jogo no Unity', ['JG1', 'JG6', 'JG9']],
    [/mobile|celular|android|flutter|app de/, 'O app no celular', ['MO1', 'MO2', 'MO5', 'MO6', 'MO7']],
    [/\bia\b|inteligencia artificial|machine learning|modelo|prever|previsao|classific|reconhec|predicao/, 'O modelo aprende', ['IA4', 'IA1', 'IA2', 'IA6', 'IA8']],
    [/imagem|imagens|foto|visao|cnn/, 'O modelo enxerga', ['IA16', 'IA9', 'IA10']],
    [/chatbot|llm|gpt|rag\b|assistente/, 'A IA conversa', ['IA13', 'IA14', 'IA15']],
    [/arduino|esp32|iot|sensor|robo|raspberry/, 'O hardware responde', ['EM1', 'EM2', 'EM4', 'EM5']],
    [/scraping|raspar|automa|planilha|excel|script/, 'A tarefa roda sozinha', ['BO1', 'BO2', 'BO3', 'BO4', 'BO5']],
    [/streamlit|painel|dashboard|grafico/, 'O painel aparece', ['BO9', 'IA2', 'IA3']],
    [/seguranca|hacker|pentest|vulnerab/, 'Proteger o sistema', ['SE1', 'SE5', 'SE2', 'SE6', 'SE7']],
    [/deploy|docker|nuvem|publicar|hospedar/, 'O projeto vai ao ar', ['DO4', 'DO8', 'DO9', 'DO16']],
  ];

  function marcoLocal(titulo, descricao, ids) {
    return {
      titulo, descricao,
      etapas: ids.map((id) => ({ estrela: id, porque: 'Seu projeto precisa de ' + L.estrela(id).nome + '.', entrega: '' })),
    };
  }

  function planoLocal(projeto) {
    const t = norm(projeto);
    const achados = INTENTS.filter((i) => i[0].test(t));
    if (!achados.length) {
      return {
        marcos: [],
        pergunta: 'Não consegui entender o que o projeto faz. Conte em uma frase, por exemplo: "um bot de Discord", "um site de portfólio", "um jogo 2D" ou "classificar imagens com IA".',
      };
    }
    const soWeb = achados.every((i) => i[3] === 'web');
    const marcos = [];
    if (!soWeb) marcos.push(marcoLocal('Fundamentos do seu projeto', 'Lógica e Python para o resto funcionar.', ['FU1', 'FU20', 'FU2', 'FU3', 'FU4', 'FU6', 'FU5']));
    achados.forEach((i) => marcos.push(marcoLocal(i[1], '', i[2])));
    const fim = ['FU15', 'FU16'];
    if (/portfolio|curriculo|site/.test(t)) fim.push('ES10');
    marcos.push(marcoLocal('Versionar e publicar', 'Guardar a história do código.', fim));
    return {
      projeto: txt(projeto, 60),
      resumo: 'Trilha montada por palavras-chave do seu pedido. Quando a IA estiver disponível, crie outra para uma versão mais certeira.',
      marcos,
    };
  }

  /* ---------------- IA ---------------- */

  function extrair(data) {
    // pergunta/aviso também são respostas válidas: quem decide é o montar()
    if (data && (Array.isArray(data.marcos) || data.pergunta || data.aviso)) return data;
    if (data && data.jornada) return data.jornada;
    const c = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof c === 'string') {
      const i = c.indexOf('{');
      const j = c.lastIndexOf('}');
      if (i >= 0 && j > i) {
        const obj = JSON.parse(c.slice(i, j + 1));
        if (obj && (Array.isArray(obj.marcos) || obj.pergunta || obj.aviso)) return obj;
      }
    }
    throw new Error('resposta sem jornada');
  }

  async function pedirIA(projeto, detalhes, acesas) {
    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 70000);
    try {
      const r = await fetch('/api/montar-trilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({ session: L.sessao(), projeto, nivel, acesas, detalhes }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok || !data) throw new Error('HTTP ' + r.status);
      return extrair(data);
    } finally {
      clearTimeout(abort);
    }
  }

  /* ---------------- criar ---------------- */

  function aviso(msg, erro) {
    const el = $('#jor-aviso');
    if (!msg) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.className = 'jor-aviso' + (erro ? ' erro' : '');
    el.textContent = msg;
  }

  function spin(on) {
    $('#jor-spin').hidden = !on;
    $('#btn-montar').disabled = on;
    $('#btn-responder-ia').disabled = on;
    $('#btn-plano-local').disabled = on;
  }

  /* ---------------- pergunta da IA (não trava mais) ---------------- */

  function mostrarPergunta(texto) {
    const box = $('#jor-pergunta');
    if (!box) return;
    box.hidden = false;
    $('#jor-pergunta-txt').textContent = texto;
    $('#resposta-ia').value = '';
    setTimeout(() => {
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#resposta-ia').focus();
    }, 150);
  }

  function limparPergunta() {
    const box = $('#jor-pergunta');
    if (box) box.hidden = true;
    const campo = $('#resposta-ia');
    if (campo) campo.value = '';
    pendente = null;
  }

  function salvarJornada(raw, marcos, origem, projeto) {
    jor = {
      projeto: txt(raw.projeto, 60) || txt(projeto, 60),
      resumo: txt(raw.resumo, 300),
      origem, nivel, criada: Date.now(), marcos,
    };
    gravar();
    criando = false;
    aberta = null;
    limparPergunta();
    history.replaceState(null, '', location.pathname);
    render();
    toast(origem === 'ia' ? 'Sua jornada está pronta' : 'Jornada montada localmente: a IA não respondeu');
  }

  /** Monta a jornada. `extra` é a resposta dada à pergunta da IA. */
  async function montar(extra) {
    if (ocupado) return;
    const base = pendente;
    const projeto = base ? base.projeto : txt($('#projeto').value, 400);
    if (projeto.length < 4) { aviso('Conte em uma frase o que você quer construir.', true); return; }
    const detalhesBase = base ? base.detalhes : txt($('#detalhes').value, 200);
    const rodada = base ? base.rodada + 1 : 0;
    const detalhes = [detalhesBase, txt(extra, 400)].filter(Boolean).join(' | ').slice(0, 600);
    const acesas = acesasIds();

    ocupado = true;
    aviso('');
    spin(true);
    let seg = 0;
    $('#jor-spin-txt').textContent = 'o Lunox está montando a sua jornada… 0s';
    const timer = setInterval(() => { seg++; $('#jor-spin-txt').textContent = 'o Lunox está montando a sua jornada… ' + seg + 's'; }, 1000);

    let raw;
    let origem = 'ia';
    try {
      raw = await pedirIA(projeto, detalhes, acesas);
    } catch (e) {
      origem = 'local';
      raw = planoLocal(projeto + ' ' + detalhes);
    }
    let marcos = normalizar(raw, acesas);

    // a IA fez uma pergunta: guarda o pedido e abre o campo de resposta
    if (!marcos.length && origem === 'ia' && raw.pergunta && rodada < 2) {
      clearInterval(timer);
      spin(false);
      ocupado = false;
      pendente = { projeto, detalhes, rodada };
      aviso('');
      mostrarPergunta(txt(raw.pergunta, 400));
      return;
    }

    // respondeu sem trilha (ou já perguntou duas vezes): cai no plano local
    if (!marcos.length) {
      origem = 'local';
      raw = planoLocal(projeto + ' ' + detalhes);
      marcos = normalizar(raw, acesas);
    }

    clearInterval(timer);
    spin(false);
    ocupado = false;

    if (!marcos.length) {
      aviso(txt(raw.pergunta || raw.aviso, 500) || 'Não consegui montar uma trilha com esse pedido. Tente descrever o projeto de outro jeito.', true);
      return;
    }

    salvarJornada(raw, marcos, origem, projeto);
  }

  /** "Montar sem responder": pula a IA e usa o plano por palavras-chave. */
  function montarSemIA() {
    if (ocupado) return;
    const base = pendente;
    const projeto = base ? base.projeto : txt($('#projeto').value, 400);
    if (projeto.length < 4) { aviso('Conte em uma frase o que você quer construir.', true); return; }
    const detalhes = base ? base.detalhes : txt($('#detalhes').value, 200);
    const raw = planoLocal(projeto + ' ' + detalhes);
    const marcos = normalizar(raw, acesasIds());
    if (!marcos.length) {
      aviso(txt(raw.pergunta, 500) || 'Não consegui montar uma trilha com esse pedido.', true);
      return;
    }
    salvarJornada(raw, marcos, 'local', projeto);
  }

  /* ---------------- render ---------------- */

  function noHtml(sid, et, cls) {
    const e = L.estrela(sid);
    return '<li class="no ' + cls + '" data-star="' + esc(sid) + '" style="--cor:' + esc(cor(e)) + '">' +
      '<button class="no-head" type="button" data-abrir="' + esc(sid) + '" aria-expanded="false">' +
        '<span class="no-star">✦</span>' +
        '<span class="no-nome">' + esc(e.nome) + '</span>' +
        '<span class="chip dim">' + esc(e.nivelNome) + '</span>' +
        (cls.indexOf('acesa') >= 0 ? '<span class="chip gold"><span class="dot"></span>acesa</span>'
          : cls.indexOf('proxima') >= 0 ? '<span class="chip violet">próxima</span>' : '') +
        '<span class="no-seta">▾</span>' +
      '</button>' +
      '<div class="no-body" hidden></div>' +
    '</li>';
  }

  function corpo(sid, et) {
    const sk = L.skillDaEstrela(sid);
    const acesa = acesaE(sid);
    const dissertativa = AULAS.tipoDe(sid) === 'dissertativa';
    const exercicios = exerciciosDe(sid);
    const feitos = exercicios.filter((e) => exFeito(sid, e.chave)).length;
    const finalEx = AULAS.desafioFinalDe(sid);
    const temCustom = exercicios.length > 0;
    const temEx = !temCustom && !dissertativa && !!(sk && L.temExercicio(sk.id));
    const grupos = gruposHtml(sid);
    let h = '';

    if (et.porque) h += '<p class="no-porque">' + esc(et.porque) + '</p>';
    if (et.entrega) h += '<p class="no-entrega"><b>Sua entrega:</b> ' + esc(et.entrega) + '</p>';

    if (grupos) {
      h += '<div class="grupos">' + grupos + '</div>';
      if (AULAS.gruposDe(sid).length > 1) {
        h += '<p class="grupos-nota">Esta estrela tem ' + AULAS.gruposDe(sid).length + ' grupos — dá para estudar em partes.</p>';
      }
    }
    if (finalEx) {
      h += '<div class="desafio-final-bloco">' + blocoExercicio(sid, finalEx, 'final', -1, true) + '</div>';
    }
    if (!grupos && !finalEx) {
      h += '<div class="video-vazio"><div><b>Conteúdo desta estrela em breve</b>' +
        (temEx ? 'O exercício já está liberado.' : 'Se você já domina o assunto, pode acender a estrela.') + '</div></div>';
    }

    h += '<div class="no-acoes">';
    if (acesa) {
      h += '<span class="chip gold"><span class="dot"></span>estrela acesa</span>';
      if (temEx) {
        if (sid === 'FU1') h += '<span class="chip dim">Blocos</span>';
        h += '<a class="btn small ghost" href="programar.html?skill=' + encodeURIComponent(sk.id) + '">Rever exercício</a>';
      }
    } else if (temCustom) {
      h += '<span class="chip ' + (feitos === exercicios.length ? 'ok' : 'dim') + '">' +
        feitos + '/' + exercicios.length + ' exercícios</span>';
      if (feitos === exercicios.length) {
        h += '<button class="btn primary small" type="button" data-acender="' + esc(sid) + '">Concluir e acender estrela</button>';
      } else {
        h += '<span class="tiny" style="color:var(--dim2)">Resolva todos os exercícios para acender a estrela.</span>';
      }
    } else if (temEx) {
      if (sid === 'FU1') h += '<span class="chip dim">Blocos</span>';
      h += '<a class="btn primary small" href="programar.html?skill=' + encodeURIComponent(sk.id) + '">Fazer o exercício</a>';
    } else if (sk) {
      h += '<button class="btn primary small" type="button" data-acender="' + esc(sid) + '">Entendi, acender estrela</button>';
    }
    h += '<a class="btn small ghost" href="habilidades.html">Ver no mapa</a></div>';
    return h;
  }

  function noEl(sid) { return document.querySelector('.no[data-star="' + sid + '"]'); }

  function fechar(sid, comFade) {
    const li = noEl(sid);
    if (!li) return;
    const b = li.querySelector('.no-body');
    li.classList.remove('aberta');
    li.querySelector('.no-head').setAttribute('aria-expanded', 'false');
    const limpar = () => {
      if (aberta === sid) return;
      b.hidden = true;
      b.innerHTML = '';   // descarrega o vídeo
    };
    if (!comFade) { limpar(); return; }
    const a = animacao(b, false);
    if (a) { a.onfinish = limpar; setTimeout(limpar, 260); } else limpar();
  }

  function abrir(sid, rolar, comFade) {
    const li = noEl(sid);
    const et = etapaDe(sid) || { porque: 'Você abriu esta estrela pelo mapa.', entrega: '' };
    if (!li) return;
    // troca aberta ANTES de fechar a anterior: o guard do limpar() compara com o
    // valor novo (senão o caminho sem Web Animations API nunca esconde o painel)
    const anterior = aberta !== sid ? aberta : null;
    aberta = sid;
    if (anterior) fechar(anterior, comFade);
    li.classList.add('aberta');
    const b = li.querySelector('.no-body');
    b.innerHTML = corpo(sid, et);
    b.hidden = false;
    if (comFade) animacao(b, true);
    li.querySelector('.no-head').setAttribute('aria-expanded', 'true');
    if (rolar) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    try { history.replaceState(null, '', '?estrela=' + encodeURIComponent(sid)); } catch {}
  }

  /* ---------------- minhas trilhas (catálogo) ---------------- */

  function renderMinhas() {
    const box = $('#jor-trilhas');
    if (!box) return;
    const lista = $('#lista-trilhas-jor');
    const ts = L.estado && Array.isArray(L.estado.trilhas) ? L.estado.trilhas : [];
    box.hidden = false;
    if (!ts.length) {
      lista.innerHTML = '<p class="jor-minhas-vazio">Nenhuma trilha do catálogo ainda. ' +
        '<a href="index.html">Escolha uma trilha</a> e o progresso dela aparece aqui.</p>';
      return;
    }
    lista.innerHTML = ts.map((t) => {
      const p = L.progressoTrilha(t.id);
      return '<a class="jor-minha" href="index.html?trail=' + encodeURIComponent(t.id) + '" title="abrir as aulas desta trilha">' +
        '<span class="jor-minha-icone">' + (t.icone || '🌙') + '</span>' +
        '<span class="jor-minha-info"><b>' + esc(t.nome) + '</b>' +
          '<span class="tiny">' + p.feitas + '/' + p.total + ' aulas · ' + p.pct + '%</span>' +
          '<span class="jor-minha-barra"><i style="width:' + p.pct + '%"></i></span>' +
        '</span>' +
        '<span class="jor-minha-seta">→</span>' +
      '</a>';
    }).join('');
  }

  function render() {
    const temJor = !!jor;
    renderMinhas();
    $('#jor-criar').hidden = temJor && !criando;
    $('#jor-pergunta').hidden = !(pendente && criando);
    $('#jor-lista').hidden = !temJor;
    $('#btn-cancelar').hidden = !(temJor && criando);
    $('#criar-nota').hidden = !(temJor && criando);
    $('#criar-titulo').textContent = temJor ? 'Montar uma nova jornada' : 'Monte sua jornada';

    $('#jor-titulo').textContent = temJor ? jor.projeto : 'O que você quer construir?';
    $('#jor-resumo').textContent = temJor && jor.resumo
      ? jor.resumo
      : 'Conte o projeto e o Lunox escolhe, no mapa, só as estrelas que ele precisa, na ordem em que fazem sentido.';
    $('#jor-acoes').innerHTML = temJor
      ? '<span class="chip ' + (jor.origem === 'ia' ? 'violet' : 'dim') + '">' + (jor.origem === 'ia' ? 'montada pela IA' : 'montada localmente') + '</span>' +
        '<button class="btn ghost" type="button" data-nova>Nova jornada</button>'
      : '';

    renderAvulsa();
    if (!temJor) return;

    const etapas = etapasDe();
    const feitas = etapas.filter((et) => acesaE(et.estrela)).length;
    const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0;
    $('#jor-progresso').innerHTML =
      '<span class="chip gold"><span class="dot"></span>' + feitas + ' de ' + etapas.length + ' estrelas acesas</span>' +
      '<div class="jor-barra" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
      (feitas === etapas.length ? '<span class="chip ok">jornada completa ✦</span>' : '');

    const prox = proxima();
    $('#jor-marcos').innerHTML = jor.marcos.map((m, n) => {
      const nos = m.etapas.filter((et) => L.estrela(et.estrela));
      if (!nos.length) return '';
      const ok = nos.filter((et) => acesaE(et.estrela)).length;
      return '<section class="marco">' +
        '<div class="marco-head"><span class="marco-n">Marco ' + (n + 1) + '</span><h2>' + esc(m.titulo) + '</h2>' +
          '<span class="chip ' + (ok === nos.length ? 'ok' : 'dim') + '">' + ok + '/' + nos.length + '</span></div>' +
        (m.descricao ? '<p class="marco-desc">' + esc(m.descricao) + '</p>' : '') +
        '<ol class="nos">' + nos.map((et) =>
          noHtml(et.estrela, et, acesaE(et.estrela) ? 'acesa' : et.estrela === prox ? 'proxima' : '')).join('') + '</ol>' +
      '</section>';
    }).join('');

    const ped = pedida();
    if (!aberta) aberta = (ped && etapaDe(ped)) ? ped : prox;
    if (aberta && noEl(aberta)) abrir(aberta, false);
  }

  // estrela aberta pelo mapa que não faz parte da jornada
  function renderAvulsa() {
    const box = $('#jor-avulsa');
    const sid = pedida();
    if (!sid || !L.estrela(sid) || etapaDe(sid)) { box.hidden = true; box.innerHTML = ''; return; }
    const e = L.estrela(sid);
    box.hidden = false;
    box.innerHTML = '<div class="marco"><div class="marco-head"><span class="marco-n">Aula avulsa</span><h2>' + esc(e.nome) + '</h2></div>' +
      '<ol class="nos">' + noHtml(sid, null, acesaE(sid) ? 'acesa aberta' : 'aberta') + '</ol></div>';
    const li = box.querySelector('.no');
    const b = li.querySelector('.no-body');
    b.innerHTML = corpo(sid, { porque: 'Você abriu esta estrela pelo mapa.', entrega: '' });
    b.hidden = false;
  }

  /* ---------------- desafio por IA ---------------- */

  async function gerarDesafio(sid, indice, btn) {
    const original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'a IA está montando…'; }
    try {
      const grupo = (AULAS.gruposDe(sid)[indice] || {});
      const r = await AULAS.gerarDesafio({
        sid,
        objetivo: jor ? jor.projeto : '',
        contexto: jor ? jor.resumo : '',
        molde: AULAS.MOLDE_PADRAO,
        session: L.sessao(),
        tipo: AULAS.tipoDe(sid),
        grupo: grupo.titulo || '',
        aulaResumo: grupo.resumo || '',
      });
      AULAS.salvarDesafio(sid, indice, r.desafio, r.resumo);
      toast('Desafio criado. Ele fica salvo neste navegador — a página admin publica no arquivo.');
    } catch (err) {
      toast('A IA não montou o desafio: ' + (err.message || 'falha de rede'));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = original; }
      renderGrupos(sid, true);
    }
  }

  /* ---------------- eventos ---------------- */

  function acender(sid) {
    const sk = L.skillDaEstrela(sid);
    if (!sk) return;
    if (L.podeAcender && !L.podeAcender(sid)) {
      toast('Resolva todos os exercícios desta estrela antes de acender.');
      aberta = sid;
      render();
      return;
    }
    const nova = L.acender(sk.id);
    L.montarNav('jornada');
    toast(nova ? '⭐ Estrela acesa: ' + L.estrela(sid).nome + ' — veja no mapa' : 'Essa estrela já estava acesa');
    aberta = null;
    render();
    const prox = proxima();
    if (prox) abrir(prox, true);
  }

  /** Exercício escrito (sem testes) marcado como concluído na trilha. */
  function concluirExercicio(sid, chave) {
    if (exFeito(sid, chave)) return;
    const pts = L.pontosDoExercicio ? L.pontosDoExercicio(sid, chave) : 0;
    if (!L.marcarExercicio(sid, chave)) return;
    const sk = L.skillDaEstrela(sid);
    const pend = pendentesDe(sid);
    const nova = sk && !pend.length ? L.acender(sk.id) : false;
    const extra = pts ? ' · +' + pts + ' pts' : '';
    toast(nova
      ? '⭐ Estrela acesa: ' + L.estrela(sid).nome + extra
      : (pend.length ? 'Exercício concluído ✓ Faltam ' + pend.length + ' nesta estrela' + extra : 'Exercício concluído ✓' + extra));
    L.montarNav('jornada');
    aberta = sid;
    render();
    if (noEl(sid)) abrir(sid, false);
  }

  document.addEventListener('click', (e) => {
    const alvo = (sel) => e.target.closest(sel);

    const a = alvo('[data-abrir]');
    if (a) {
      const sid = a.getAttribute('data-abrir');
      if (aberta === sid) { aberta = null; fechar(sid, true); } else abrir(sid, true, true);
      return;
    }
    const ac = alvo('[data-acender]');
    if (ac) { acender(ac.getAttribute('data-acender')); return; }

    const me = alvo('[data-marcar-exercicio]');
    if (me) {
      concluirExercicio(me.getAttribute('data-star'), me.getAttribute('data-marcar-exercicio'));
      return;
    }

    // abrir/fechar um grupo (vídeo + desafio) da estrela
    const g = alvo('[data-grupo]');
    if (g) {
      const sid = g.getAttribute('data-star');
      const idx = Number(g.getAttribute('data-grupo')) || 0;
      const atual = grupoAberto[sid] === undefined ? 0 : grupoAberto[sid];
      grupoAberto[sid] = atual === idx ? -1 : idx;
      renderGrupos(sid, true);
      return;
    }

    const p = alvo('[data-parte]');
    if (p) {
      const sid = p.getAttribute('data-star');
      const gi = Number(p.getAttribute('data-grupo-idx')) || 0;
      parteAtual[sid + ':' + gi] = Number(p.getAttribute('data-parte')) || 0;
      renderGrupos(sid, false);
      return;
    }

    const gd = alvo('[data-gerar-desafio]');
    if (gd) { gerarDesafio(gd.getAttribute('data-star'), Number(gd.getAttribute('data-gerar-desafio')) || 0, gd); return; }

    if (alvo('[data-nova]')) {
      criando = true;
      limparPergunta();
      aviso('');
      render();
      $('#jor-criar').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => $('#projeto').focus(), 250);
      return;
    }
    const s = alvo('[data-sug]');
    if (s) { $('#projeto').value = s.getAttribute('data-sug'); $('#projeto').focus(); return; }

    const n = alvo('[data-nivel]');
    if (n) { nivel = n.getAttribute('data-nivel'); pintarNivel(); }
  });

  document.addEventListener('input', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('[data-resposta]') : null;
    if (!t) return;
    const sid = t.getAttribute('data-star');
    const i = Number(t.getAttribute('data-resposta')) || 0;
    salvarResposta(sid, i, t.value);
    const nota = t.parentElement.querySelector('[data-resposta-nota]');
    if (nota) nota.textContent = t.value.trim() ? 'Salvo neste navegador ✓' : 'Salva sozinha enquanto você escreve';
  });

  function pintarNivel() {
    $('#jor-nivel').innerHTML = NIVEIS.map((n) =>
      '<button type="button" role="radio" data-nivel="' + n[0] + '" aria-checked="' + (n[0] === nivel) + '">' + n[1] + '</button>').join('');
  }

  $('#btn-montar').addEventListener('click', () => montar());
  $('#btn-responder-ia').addEventListener('click', () => {
    const r = txt($('#resposta-ia').value, 400);
    if (r.length < 2) {
      aviso('Escreva uma resposta para o Lunox — ou monte sem responder.', true);
      $('#resposta-ia').focus();
      return;
    }
    aviso('');
    montar(r);
  });
  $('#btn-plano-local').addEventListener('click', montarSemIA);
  $('#resposta-ia').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#btn-responder-ia').click();
  });
  $('#btn-cancelar').addEventListener('click', () => { criando = false; aviso(''); limparPergunta(); render(); });
  $('#projeto').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) montar(); });

  // voltou do exercício (cache do navegador): relê o estado das estrelas
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

  /* ---------------- boot ---------------- */

  $('#jor-sugs').innerHTML = SUGESTOES.map((s) => '<button class="jor-sug" type="button" data-sug="' + esc(s) + '">' + esc(s) + '</button>').join('');
  pintarNivel();
  render();

  if (abrirCriacao) {
    criando = true;
    render();
    const q = new URLSearchParams(location.search);
    q.delete('nova');
    try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '')); } catch {}
    setTimeout(() => {
      const campo = $('#projeto');
      if (!campo) return;
      campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      campo.focus();
    }, 200);
  }
})();
