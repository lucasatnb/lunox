/* ============================================================
   Página Chat — Lunox monta a trilha
   Modo roteiro (instantâneo) + modo IA real (roteador L0→L2)
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

  const historico = [];
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
        '<a class="btn small ghost" href="habilidades.html">Ver no mapa</a>';

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

  /* ---------------- roteiro ---------------- */

  const CONCEITOS = [
    {
      re: /variave|variavel|guardar (um )?valor/,
      txt: 'Variável é um nome para um valor. Em vez de repetir "Ana" em todo lugar, você guarda:\n\nconst usuario = "Ana";\n\nAgora o programa inteiro pode usar "usuario". Se o nome mudar, você muda em um lugar só.',
    },
    {
      re: /condicao|if |else|decidir/,
      txt: 'Condição é o programa escolhendo um caminho:\n\nif (mensagem === "oi") {\n  responder("Olá!");\n} else {\n  ficar quieto();\n}\n\nO if lê uma pergunta que só tem duas respostas: verdadeiro ou falso.',
    },
    {
      re: /laco|repeti|for |while/,
      txt: 'Laço é repetir sem copiar código. Em vez de escrever 100 linhas, você escreve uma e manda repetir:\n\nfor (let i = 0; i < fases.length; i++) {\n  pontos = pontos + fases[i].pontos;\n}\n\nÉ o que percorre listas, fases de jogo e páginas de dados.',
    },
    {
      re: /funcao|function|reaproveitar/,
      txt: 'Função é um bloco com nome que você chama quando precisa:\n\nfunction saudacao(nome) {\n  return "Olá, " + nome + "!";\n}\n\nEla recebe dados, faz uma tarefa e devolve um resultado. Serve para não repetir e para testar cada parte separada.',
    },
    {
      re: /lista|array|dicionario|objeto/,
      txt: 'Lista guarda vários valores em ordem:\n\nconst alunos = ["Ana", "Bia", "Caio"];\n\nDicionário (ou objeto) guarda valores com nome:\n\nconst aluno = { nome: "Ana", nota: 8 };\n\nQuase todo dado de API ou banco chega assim.',
    },
    {
      re: /\bapi\b|requisicao|http|json/,
      txt: 'API é um contrato pronto para pedir e receber dados. Você manda uma requisição para um endereço e recebe uma resposta — normalmente em JSON:\n\n{ "nome": "Ana", "id": 1 }\n\nO Discord, o banco e a IA conversam com o seu projeto por APIs.',
    },
    {
      re: /banco|sql|tabela|crud/,
      txt: 'Banco de dados é onde a informação fica guardada de verdade. Uma tabela tem colunas (nome, nota) e linhas (cada aluno).\n\nSQL é a língua para pedir:\n\nSELECT nome FROM alunos WHERE nota >= 7;\n\nCRUD é criar, ler, atualizar e apagar esses registros.',
    },
    {
      re: /git|github|commit|version/,
      txt: 'Git guarda a história do seu projeto. Cada commit é uma foto do código naquele momento:\n\ngit init\ngit add .\ngit commit -m "primeiro commit"\n\nSe algo quebrar, você volta para uma foto anterior. O GitHub guarda essas fotos online e vira seu portfólio.',
    },
    {
      re: /html|estrutura da pagina/,
      txt: 'HTML é a estrutura da página: cada parte tem um papel.\n\n<h1>Meu portfólio</h1>\n<section>Projetos</section>\n\nO CSS veste, o JavaScript dá comportamento. Sem estrutura, o resto não se sustenta.',
    },
    {
      re: /css|estilo|design|cor|layout/,
      txt: 'CSS é o visual: cor, espaço, tamanho e hierarquia. A regra prática é contraste (texto legível), respiro (não encostar tudo) e hierarquia (o mais importante maior).\n\nbody { background: #0b0b14; color: #f5f3ff; }\n\nDesign bom é o que faz alguém confiar no seu trabalho em 5 segundos.',
    },
  ];

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
      : 'Boa escolha! Montei uma trilha de ' + b.nome + ' com ' + b.aulas.length + ' aulas. Cada aula tem o conceito, o código do projeto e a validação com IA. Você começa pelo que ainda não sabe.';
    return { texto, card: preset, existenteId: existente ? existente.id : null };
  }

  function oQueSei() {
    const acesas = L.SKILLS.filter((s) => L.acesa(s.id));
    if (!acesas.length) {
      return 'Ainda não tem nenhuma estrela acesa — e tudo bem, é assim que começa. Sua primeira trilha vai acender variáveis, condições e o que o projeto pedir. Quer começar por um bot, CRUD, portfólio ou jogo?';
    }
    const nomes = acesas.map((s) => s.icon + ' ' + s.nome).join(', ');
    const proxima = L.SKILLS.find((s) => !L.acesa(s.id));
    return 'Você já acendeu ' + acesas.length + ' estrela(s): ' + nomes + '.\n\n' +
      (proxima
        ? 'Meu próximo passo sugerido é ' + proxima.nome + '. Você pode marcar no mapa o que já sabe e a trilha pula o que já está aceso.'
        : 'Você já acendeu todas as estrelas que o Lunox conhece por aqui. Agora é escolher um projeto novo e ver o mapa crescer com ele.');
  }

  function responder(texto) {
    const t = norm(texto);

    if (/\b(oi|ola|eae|eai|opa|salve|bom dia|boa tarde|boa noite|hey|hi|hello)\b/.test(t) && t.length < 24) {
      return {
        texto: 'Oi! Eu sou o Lunox 🐾 Me conta: o que você quer construir? Eu monto a trilha e te acompanho aula por aula.',
      };
    }
    if (/quem (e|eh) voce|o que voce (faz|e)|como voce funciona|seu nome/.test(t)) {
      return {
        texto: 'Sou o Lunox, um gatinho cósmico que ensina programação construindo. Eu olho o que você já sabe, monto uma trilha curta e cada aula termina com código rodando e uma revisão de IA.\n\nNo modo roteiro eu respondo na hora. No modo IA real eu passo pelo roteador em cascata: regras (L0), Groq (L1) e NVIDIA Nemotron (L2).',
      };
    }
    if (/obrigad|valeu|vlw|brigad/.test(t)) {
      return { texto: 'De nada! Miau. Quando terminar a aula, volta aqui e me conta o que aprendeu.' };
    }
    if (/o que eu (ja )?sei|minhas habilidades|meu nivel|meu progresso/.test(t)) {
      return { texto: oQueSei() };
    }
    if (/como funciona|o que voce faz|me ajuda|nao sei o que fazer|como comeco/.test(t)) {
      return {
        texto: 'É simples:\n\n1. Você diz o projeto (bot, CRUD, portfólio, jogo).\n2. Eu monto a trilha só com o que falta.\n3. Cada aula tem 3 passos: conceito, código e revisão com IA.\n\nNo fim, as estrelas acendem no mapa. Quer começar por qual projeto?',
      };
    }
    if (/ja sei o basico|sei o basico|ja programo|ja sei programar/.test(t)) {
      return {
        texto: 'Perfeito. Então não vou te prender no trivial. Vá em Habilidades e marque as estrelas que você já domina — a trilha mostra essas aulas como revisão e foca no que falta. Se quiser, eu monto um projeto novo já no nível intermediário.',
      };
    }

    for (const p of PROJETOS) {
      if (p.re.test(t)) return respostaTrilha(p.preset);
    }

    if (/trilha|plano de estudo|aprender|estudar|quero fazer|quero criar|monta/.test(t)) {
      return {
        texto: 'Consigo montar a trilha de quatro projetos: bot de Discord, CRUD de alunos, portfólio web ou jogo 2D. Qual deles chega mais perto do que você quer construir?',
      };
    }

    for (const c of CONCEITOS) {
      if (c.re.test(t)) {
        return {
          texto: c.txt + '\n\nQuer que eu monte uma trilha para praticar isso?',
        };
      }
    }

    if (/erro|bug|quebr|nao funciona|travou/.test(t)) {
      return {
        texto: 'Vamos depurar como programador:\n\n1. Leia a mensagem de erro de baixo para cima.\n2. Isole a menor parte que quebra.\n3. Confirme o que entra e o que sai de cada função.\n4. Só então mude uma coisa por vez.\n\nSe quiser, cole o erro no chat com a IA real ligada que eu analiso o caso.',
      };
    }
    if (/codigo|programar|editor|teste|validar/.test(t)) {
      return {
        texto: 'A página Programar é o seu editor: você escreve a solução, roda os testes no navegador e pede revisão/refino para o Nemotron. Cada aula da trilha leva direto para o exercício certo.',
      };
    }

    return {
      texto: 'Miau. Eu monto trilhas a partir do seu objetivo. Me diz qual projeto você quer construir — bot de Discord, CRUD, portfólio ou jogo — e eu mostro as aulas e as estrelas que ele acende.',
    };
  }

  /* ---------------- IA real ---------------- */

  function camada(n) {
    return n === 0 ? 'L0 · regras/fuzzy' : n === 1 ? 'L1 · Groq 27B' : n === 2 ? 'L2 · NVIDIA nemotron' : 'roteador';
  }

  async function falarComIA(texto) {
    const el = typing('Lunox está pensando… 0s');
    let seg = 0;
    const timer = setInterval(() => {
      seg++;
      el.textContent = 'Lunox está pensando… ' + seg + 's';
    }, 1000);

    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 75000);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          mensagem: texto,
          session: L.sessao(),
          messages: historico.slice(-8),
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

      const conteudo = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '(resposta vazia)';
      const layer = data.lunox ? data.lunox.layer : null;
      const msg = addMsg('lunox', conteudo, { layer });
      historico.push({ role: 'assistant', content: conteudo });
      scrollFim();

      if (layer === 2) {
        const dica = document.createElement('span');
        dica.className = 'layer-tag';
        dica.textContent = 'resposta pesada · pode ter levado alguns segundos';
        msg.appendChild(dica);
      }
    } catch (e) {
      clearTimeout(abort);
      clearInterval(timer);
      el.remove();
      const motivo = e.name === 'AbortError'
        ? 'A IA demorou mais de 75s e eu cancelei.'
        : (e.message || 'falha de rede');
      addMsg('lunox', 'A IA real não respondeu agora.\n\n' + motivo + '\n\nDesliga o modo IA no painel à direita que eu continuo no roteiro instantâneo.');
      registrarFalha(texto, motivo, e);
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
    inputEl.value = '';
    scrollFim();

    if (L.estado.ia) {
      await falarComIA(limpo);
      ocupado = false;
      return;
    }

    const el = typing('Lunox está digitando…');
    await new Promise((res) => setTimeout(res, 330));
    const out = responder(limpo);
    el.remove();
    addMsg('lunox', out.texto, { layer: null });
    if (out.card) addCard(out.card, out.existenteId);
    historico.push({ role: 'assistant', content: out.texto });
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

    $('#mini-trilhas').innerHTML = L.estado.trilhas.map((t) => {
      const p = L.progressoTrilha(t.id);
      return '<button class="mini-trail' + (t.id === L.estado.atual ? ' ativo' : '') + '" type="button" data-mini="' + esc(t.id) + '">' +
        '<span>' + (t.icone || '🌙') + '</span>' +
        '<span>' + esc(t.nome) + '</span>' +
        '<span style="margin-left:auto;font-size:10px;color:var(--dim2)">' + p.feitas + '/' + p.total + '</span>' +
      '</button>';
    }).join('') || '<p class="tiny">Nenhuma trilha ainda.</p>';
  }

  function aplicarModo() {
    const on = !!L.estado.ia;
    toggle.checked = on;
    $('#chat-mode').textContent = on ? 'IA real' : 'roteiro';
    $('#chat-mode').classList.toggle('real', on);
    $('#modo-badge').textContent = on ? 'roteador ao vivo' : 'modo roteiro';
    $('#chat-status').textContent = on
      ? 'online · L0 → L1 → L2 sob demanda'
      : 'online · respostas instantâneas';
    if (on) {
      addMsg('lunox', 'IA real ligada 🐾 Agora eu passo pelo roteador em cascata. Perguntas simples caem no Groq; trilha e código vão para o Nemotron. A latência pode subir para 10–30s nas respostas pesadas.', { layer: null });
      definirSugestoes(['Quero um bot de Discord', 'Me explica o que é uma API', 'Por que meu código quebra?', 'Monta uma trilha de jogo 2D']);
    } else {
      definirSugestoes(['Quero um bot de Discord', 'Me monta uma trilha de CRUD', 'O que eu já sei?', 'Me explica variáveis']);
    }
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
    }
  });

  toggle.addEventListener('change', () => {
    L.estado.ia = toggle.checked;
    L.salvar();
    aplicarModo();
  });

  /* ---------------- boot ---------------- */

  renderLado();
  definirSugestoes(['Quero um bot de Discord', 'Me monta uma trilha de CRUD', 'O que eu já sei?', 'Me explica variáveis']);
  addMsg('lunox', 'Oi! Eu sou o Lunox 🐾 Me conta o que você quer construir — um bot, um CRUD, um portfólio ou um jogo. Eu monto a trilha e a gente programa junto.');
  aplicarModoBase();

  function aplicarModoBase() {
    // não injeta a mensagem de boas-vindas do modo real no primeiro load
    const on = !!L.estado.ia;
    toggle.checked = on;
    $('#chat-mode').textContent = on ? 'IA real' : 'roteiro';
    $('#chat-mode').classList.toggle('real', on);
    $('#modo-badge').textContent = on ? 'roteador ao vivo' : 'modo roteiro';
    $('#chat-status').textContent = on
      ? 'online · L0 → L1 → L2 sob demanda'
      : 'online · respostas instantâneas';
  }
})();
