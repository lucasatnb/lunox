/* ============================================================
   admin.js — cadastro de vídeos e desafios por estrela.

   Fluxo:
   - escolhe a estrela, adiciona grupos (vídeo + desafio), gera desafio pela IA
   - o que você edita fica num rascunho do navegador (aparece na hora na trilha)
   - "Salvar no arquivo" só existe no servidor local (ferramentas/servidor-admin.mjs)
   - "Publicar no site" (servidor local) grava o arquivo e roda o wrangler deploy
   - "Publicar para todos" (site publicado) grava o conteúdo no KV do Worker, que
     passa a servir /estrelas-conteudo.js na hora; se GITHUB_TOKEN estiver
     configurado, o Worker também cria o commit no repositório
   - "Baixar .js" / "Copiar código" funcionam em qualquer lugar
   ============================================================ */
(function () {
  'use strict';

  const L = window.LUNOX;
  const A = window.LUNOX_AULAS_API;
  const LG = window.LUNOX_LANGS || {};
  const BLOCOS = window.LUNOX_BLOCOS;
  const { $, esc, toast } = L;

  const CHAVE_OBJETIVO = 'lunox_admin_objetivo';
  const CHAVE_MOLDE = 'lunox_admin_molde';

  let dados = clonar(A.dados());
  let sid = null;
  let objetivo = localStorage.getItem(CHAVE_OBJETIVO) || projetoSalvo();
  let molde = localStorage.getItem(CHAVE_MOLDE) || A.MOLDE_PADRAO;
  let relogio = null;

  /* ---------------- utilidades ---------------- */

  function clonar(o) { return JSON.parse(JSON.stringify(o || {})); }

  function projetoSalvo() {
    try {
      const j = JSON.parse(localStorage.getItem('lunox_jornada'));
      return (j && j.projeto) || '';
    } catch { return ''; }
  }

  function status(msg) {
    const el = $('#status');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(status.t);
    status.t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function aviso(tipo, msg) {
    const el = $('#aviso');
    if (!msg) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.className = 'adm-aviso' + (tipo ? ' ' + tipo : '');
    el.textContent = msg;
  }

  function gruposDe(id, criar) {
    if (!dados.estrelas) dados.estrelas = {};
    let alvo = dados.estrelas[id];
    if (!alvo) {
      if (!criar) return null;
      alvo = dados.estrelas[id] = { grupos: [] };
    }
    if (!Array.isArray(alvo.grupos)) alvo.grupos = [];
    return alvo.grupos;
  }

  function contarGrupos() {
    const out = {};
    Object.keys(dados.estrelas || {}).forEach((k) => {
      const g = (dados.estrelas[k] && dados.estrelas[k].grupos) || [];
      const n = g.filter((x) => x && (x.titulo || (x.videos && x.videos.length) ||
        (x.desafio && x.desafio.enunciado) || x.exercicio)).length;
      if (n) out[k] = n;
    });
    return out;
  }

  /** Tipo da estrela no rascunho: 'codigo' (padrão) ou 'dissertativa'. */
  function tipoDe(id) {
    const alvo = dados.estrelas && dados.estrelas[id];
    return alvo && alvo.tipo === 'dissertativa' ? 'dissertativa' : 'codigo';
  }

  /** Um grupo tem conteúdo para a IA usar: título ou um vídeo do YouTube válido. */
  function temConteudo(g) {
    return !!g && !!(String(g.titulo || '').trim() || (g.videos || []).some((v) => A.ytId(v)));
  }

  /** Grupos com conteúdo que ainda não têm desafio. */
  function semDesafio(grupos) {
    return (grupos || []).map((g, i) => ({ g, i }))
      .filter(({ g }) => temConteudo(g) && !(g.desafio && (g.desafio.enunciado || g.desafio.titulo)));
  }

  /* ---------------- exercícios (por grupo e desafio final) ---------------- */

  /** A estrela FU1 (Lógica de programação) é a única em blocos. */
  function ehBlocos(id) {
    return (id || sid) === 'FU1';
  }

  function programaInicialBlocos() {
    return JSON.stringify([{ tipo: 'diga', valor: '"Olá!"' }]);
  }

  function programaValido(s) {
    try {
      return Array.isArray(JSON.parse(String(s || '')));
    } catch (e) {
      return false;
    }
  }

  function exercicioVazio(g) {
    const d = (g && g.desafio) || {};
    const blocos = ehBlocos();
    return {
      titulo: d.titulo || (g && g.titulo) || '',
      enunciado: d.enunciado || '',
      requisitos: Array.isArray(d.requisitos)
        ? d.requisitos.slice(0, 8)
        : String(d.requisitos || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8),
      dica: d.dica || '',
      linguagem: blocos ? 'blocos' : 'python',
      starter: blocos ? programaInicialBlocos() : 'def solucao():\n    # TODO: escreva sua solução\n    pass\n',
      solucao: blocos ? programaInicialBlocos() : '',
      testes: blocos
        ? 'check("mostra a mensagem", function () { return saida[0] === "Olá!"; });\n'
        : 'check("a solução roda", lambda: callable(solucao))\n',
      arquivos: [],
    };
  }

  function exercicioCru(i) {
    const g = gruposDe(sid, false);
    return g && g[i] ? (g[i].exercicio || null) : null;
  }

  function alvoFinal(criar) {
    if (!sid) return null;
    const alvo = dados.estrelas && dados.estrelas[sid];
    if (!alvo) {
      if (!criar) return null;
      dados.estrelas = dados.estrelas || {};
      dados.estrelas[sid] = { grupos: [] };
    }
    const estrela = dados.estrelas[sid];
    if (!estrela.desafioFinal && criar) estrela.desafioFinal = exercicioVazio(null);
    return estrela.desafioFinal || null;
  }

  function escreverExercicio(obj, campo, valorBruto) {
    if (!obj) return;
    if (campo === 'requisitos') {
      obj.requisitos = String(valorBruto).split('\n').map((s) => s.trim()).filter(Boolean);
      return;
    }
    obj[campo] = valorBruto;
  }

  function campoExercicio(rotulo, valor, caminho, o) {
    const opts = o || {};
    const attr = 'data-campo="' + caminho + '"' + (opts.final ? ' data-final="1"' : ' data-g="' + opts.g + '"');
    const classe = opts.code ? ' class="adm-code"' : '';
    const extra = opts.code ? ' wrap="off" spellcheck="false"' : '';
    const dica = opts.dica ? '<span class="dica">' + esc(opts.dica) + '</span>' : '';
    if (opts.linha) {
      return '<label class="adm-campo"><span>' + esc(rotulo) + '</span>' +
        '<input ' + attr + ' type="text" value="' + esc(valor) + '" maxlength="' + (opts.max || 300) + '" placeholder="' + esc(opts.placeholder || '') + '">' + dica + '</label>';
    }
    return '<label class="adm-campo"><span>' + esc(rotulo) + '</span>' +
      '<textarea ' + attr + classe + extra + ' rows="' + (opts.rows || 4) + '" maxlength="' + (opts.max || 2000) + '" placeholder="' + esc(opts.placeholder || '') + '">' + esc(valor) + '</textarea>' + dica + '</label>';
  }

  function campoBlocos(rotulo, valor, caminho, o) {
    const opts = o || {};
    const attr = 'data-blocos="' + caminho + '"' + (opts.final ? ' data-final="1"' : ' data-g="' + opts.g + '"');
    return '<div class="adm-campo"><span>' + esc(rotulo) + '</span>' +
      '<div class="adm-blocos-editor" ' + attr + '></div>' +
      '<span class="dica">Monte o programa com os blocos. Use a paleta para adicionar e as setas para ordenar.</span>' +
    '</div>';
  }

  function htmlExercicio(ex, o) {
    const opts = o || {};
    const pre = opts.final ? 'desafioFinal' : 'exercicio';
    const attrG = opts.final ? ' data-final="1"' : ' data-g="' + opts.g + '"';
    const chaveTeste = opts.final ? 'final' : String(opts.g);
    const reqs = Array.isArray(ex.requisitos)
      ? ex.requisitos
      : String(ex.requisitos || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const blocos = ehBlocos();
    if (blocos) {
      ex.linguagem = 'blocos';
      if (!programaValido(ex.starter)) ex.starter = programaInicialBlocos();
      if (!programaValido(ex.solucao)) ex.solucao = ex.starter;
    }
    const ling = blocos ? 'blocos' : (A.linguagemDe ? A.linguagemDe(ex)
      : ex.linguagem === 'typescript' ? 'typescript'
        : ex.linguagem === 'javascript' ? 'javascript' : 'python');
    const seletorLing = blocos
      ? '<label class="adm-campo"><span>Linguagem do exercício</span>' +
          '<select data-campo="' + pre + '.linguagem"' + attrG + ' disabled>' +
            '<option value="blocos" selected>Blocos (visual)</option>' +
          '</select>' +
          '<span class="dica">Lógica de programação é a única estrela em blocos.</span>' +
        '</label>'
      : '<label class="adm-campo"><span>Linguagem do exercício</span>' +
          '<select data-campo="' + pre + '.linguagem"' + attrG + '>' +
            '<option value="python"' + (ling === 'python' ? ' selected' : '') + '>Python</option>' +
            '<option value="javascript"' + (ling === 'javascript' ? ' selected' : '') + '>JavaScript</option>' +
            '<option value="typescript"' + (ling === 'typescript' ? ' selected' : '') + '>TypeScript</option>' +
          '</select>' +
          '<span class="dica">Python é o padrão. JavaScript e TypeScript também rodam no navegador.</span>' +
        '</label>';

    return '<div class="adm-duas">' +
        seletorLing +
        campoExercicio('Título do exercício', ex.titulo || '', pre + '.titulo', {
          final: opts.final, g: opts.g, linha: true, max: A.LIMITES.titulo, placeholder: 'Ex.: Somar a pontuação das fases',
        }) +
      '</div>' +
      campoExercicio('Enunciado', ex.enunciado || '', pre + '.enunciado', {
        final: opts.final, g: opts.g, rows: 4, max: A.LIMITES.enunciado,
        placeholder: 'O que a pessoa precisa fazer, ligado ao projeto dela.',
      }) +
      campoExercicio('Requisitos — um por linha', reqs.join('\n'), pre + '.requisitos', {
        final: opts.final, g: opts.g, rows: 3, max: 900, placeholder: 'Use um laço\nDevolva um número',
      }) +
      campoExercicio('Dica', ex.dica || '', pre + '.dica', {
        final: opts.final, g: opts.g, linha: true, max: A.LIMITES.dica, placeholder: 'Uma pista curta, sem entregar a solução',
      }) +
      (blocos
        ? campoBlocos('Programa inicial (blocos)', ex.starter || '[]', pre + '.starter', { final: opts.final, g: opts.g }) +
          campoBlocos('Solução (blocos)', ex.solucao || '[]', pre + '.solucao', { final: opts.final, g: opts.g })
        : campoExercicio('Código inicial', ex.starter || '', pre + '.starter', {
            final: opts.final, g: opts.g, rows: 7, max: A.LIMITES.codigo, code: true,
            placeholder: 'def solucao(...):\n    # TODO\n    pass',
          }) +
          campoExercicio('Solução (para "Ver solução" e para o teste abaixo)', ex.solucao || '', pre + '.solucao', {
            final: opts.final, g: opts.g, rows: 7, max: A.LIMITES.codigo, code: true,
            placeholder: 'def solucao(...):\n    return ...',
          })) +
      campoExercicio('Testes — use check("nome", lambda: ...) ou assert', ex.testes || '', pre + '.testes', {
        final: opts.final, g: opts.g, rows: 7, max: A.LIMITES.codigo, code: true,
        dica: blocos
          ? 'Em blocos, os testes recebem saida (lista do que o programa mostrou). Ex.: check("mostra", function () { return saida[0] === "Olá!"; });'
          : 'Deixe vazio para um exercício escrito: a pessoa lê e marca como concluído na trilha.',
      }) +
      '<div class="adm-teste-linha">' +
        '<button class="btn primary small" type="button" data-testar="' + chaveTeste + '">Testar solução</button>' +
        '<span class="tiny">' + (blocos
          ? 'Roda a solução em blocos no navegador, sem internet.'
          : 'Roda a solução e os testes antes de publicar. Python usa o compilador remoto.') + '</span>' +
      '</div>' +
      '<div class="adm-teste-resultado" data-teste-resultado="' + chaveTeste + '"></div>';
  }

  const WORKER_TESTE = `
self.onmessage = function (e) {
  var data = e.data || {};
  try {
    var fn = new Function("console", data.codigo + "\\n;return (function () {\\n" + data.testes + "\\n})();");
    var resultados = fn({ log: function () {}, warn: function () {}, error: function () {} }) || [];
    self.postMessage({ ok: true, resultados: resultados });
  } catch (err) {
    self.postMessage({ ok: false, erro: (err && err.message) || String(err) });
  }
};
`;

  function pintarTeste(box, data) {
    if (!box) return;
    if (!data || !data.ok) {
      box.innerHTML = '<span class="bad">✗ ' + esc((data && data.erro) || 'erro ao executar') + '</span>';
      return;
    }
    const rs = data.resultados || [];
    const ok = rs.filter((r) => r.ok).length;
    box.innerHTML = '<b class="' + (rs.length && ok === rs.length ? 'ok' : 'bad') + '">' +
        ok + '/' + rs.length + ' testes passaram</b>' +
      rs.map((r) => '<div class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✓' : '✗') + ' ' +
        esc(r.nome) + (r.detalhe ? ' — ' + esc(r.detalhe) : '') + '</div>').join('');
  }

  /** Roda código JS no Worker isolado (mesmo caminho do editor). */
  function rodarNoWorker(codigo, testes) {
    return new Promise((ok) => {
      const url = URL.createObjectURL(new Blob([WORKER_TESTE], { type: 'text/javascript' }));
      const worker = new Worker(url);
      let fim = false;
      const encerrar = (data) => {
        if (fim) return;
        fim = true;
        clearTimeout(timer);
        try { worker.terminate(); } catch {}
        try { URL.revokeObjectURL(url); } catch {}
        ok(data);
      };
      const timer = setTimeout(() => encerrar({ ok: false, erro: 'Timeout: a solução demorou mais de 2,5s (loop infinito?)' }), 2800);
      worker.onmessage = (e) => encerrar(e.data);
      worker.onerror = (e) => encerrar({ ok: false, erro: e.message || 'falha de execução' });
      worker.postMessage({ codigo: codigo, testes: testes });
    });
  }

  async function testarExercicio(chave, btn) {
    const ex = chave === 'final' ? alvoFinal(false) : exercicioCru(Number(chave));
    const box = document.querySelector('[data-teste-resultado="' + chave + '"]');
    if (!ex || !box) return;
    if (!String(ex.testes || '').trim()) {
      box.innerHTML = '<span class="bad">Adicione pelo menos um teste para testar a solução.</span>';
      return;
    }
    if (!String(ex.solucao || '').trim()) {
      box.innerHTML = '<span class="bad">Preencha a solução para rodar os testes.</span>';
      return;
    }

    const rotulo = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'testando…';
    box.innerHTML = '<span class="tiny">rodando…</span>';

    try {
      const ling = ehBlocos() ? 'blocos' : (A.linguagemDe ? A.linguagemDe(ex)
        : ex.linguagem === 'typescript' ? 'typescript'
          : ex.linguagem === 'javascript' ? 'javascript' : 'python');
      let data;
      if (ling === 'blocos') {
        if (!BLOCOS) throw new Error('editor de blocos indisponível nesta página');
        data = BLOCOS.rodarTestes(BLOCOS.deJSON(ex.solucao), ex.testes);
      } else if (ling === 'python') {
        if (!LG.rodarTestesPython) throw new Error('compilador Python indisponível nesta página');
        data = await LG.rodarTestesPython(ex.solucao, ex.testes);
      } else {
        const codigo = ling === 'typescript' ? await LG.transpilarTS(ex.solucao) : ex.solucao;
        data = await rodarNoWorker(codigo, A.testesComSuite(ex.testes));
      }
      pintarTeste(box, data);
    } catch (e) {
      pintarTeste(box, { ok: false, erro: e.message || 'falha ao executar' });
    } finally {
      btn.disabled = false;
      btn.textContent = rotulo;
    }
  }

  /** Mantém o botão "gerar todos" com a contagem atual, mesmo antes de re-renderizar. */
  function atualizarBotaoIA() {
    const btn = $('#btn-ia-todos');
    if (!btn) return;
    const grupos = gruposDe(sid, false) || [];
    const pend = semDesafio(grupos);
    btn.disabled = !pend.length;
    btn.textContent = pend.length
      ? 'Gerar ' + pend.length + (pend.length === 1 ? ' desafio' : ' desafios') + ' com IA'
      : 'Gerar com IA';
    const resumo = $('#adm-ia-resumo');
    if (resumo) {
      const faltamResumo = grupos.filter((g) => temConteudo(g) && !String(g.resumo || '').trim()).length;
      resumo.textContent = pend.length
        ? pend.length + (pend.length === 1 ? ' grupo está sem desafio' : ' grupos estão sem desafio') +
          (faltamResumo ? ' — ' + faltamResumo + ' também sem resumo.' : '.')
        : 'Todos os grupos desta estrela já têm desafio.';
    }
  }

  function sujo() {
    $('#selo-rascunho').hidden = false;
    clearTimeout(relogio);
    relogio = setTimeout(() => {
      A.salvarRascunho(dados);
      status('Rascunho salvo neste navegador');
    }, 600);
    atualizarBotaoIA();
  }

  /* ---------------- lista de estrelas ---------------- */

  function preencherFiltro() {
    const raizes = Object.keys(L.CONSTELACOES);
    $('#filtro-const').innerHTML = '<option value="">Todas as constelações</option>' +
      raizes.map((r) => '<option value="' + r + '">' + esc(L.CONSTELACOES[r].nome) + '</option>').join('');
  }

  function renderLista() {
    const busca = String($('#busca').value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const raiz = $('#filtro-const').value;
    const contagem = contarGrupos();

    const itens = L.ESTRELAS_LISTA.filter((e) => {
      if (raiz && e.raiz !== raiz) return false;
      if (!busca) return true;
      const alvo = (e.nome + ' ' + e.id).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return alvo.indexOf(busca) >= 0;
    });

    if (!itens.length) {
      $('#ests').innerHTML = '<p class="tiny" style="color:var(--dim2)">Nenhuma estrela encontrada.</p>';
      return;
    }

    let h = '';
    let atual = null;
    itens.forEach((e) => {
      if (e.raiz !== atual) {
        atual = e.raiz;
        const c = L.CONSTELACOES[e.raiz] || { nome: e.raiz };
        h += '<div class="adm-const">' + esc(c.nome) + '</div>';
      }
      const n = contagem[e.id] || 0;
      h += '<button type="button" class="adm-item' + (e.id === sid ? ' ativo' : '') + '" data-estrela="' + esc(e.id) + '" ' +
        'style="--cor:' + esc((L.CONSTELACOES[e.raiz] || {}).cor || '#7c5cff') + '">' +
        '<span class="ponto"></span><span class="nome">' + esc(e.nome) + '</span>' +
        (n ? '<span class="n">' + n + '</span>' : '') +
      '</button>';
    });
    $('#ests').innerHTML = h;
  }

  /* ---------------- editor ---------------- */

  function selecionar(id) {
    sid = id;
    // estrela que só tem vídeo no formato antigo: importa para poder editar
    const g = gruposDe(id, false);
    if (!g || !g.length) {
      const legado = A.gruposLegado(id);
      if (legado.length) {
        const alvo = gruposDe(id, true);
        legado.forEach((l) => alvo.push({
          id: l.id,
          titulo: l.titulo,
          resumo: l.resumo,
          videos: l.videos.map((v) => v.url),
          desafio: l.desafio || null,
        }));
        sujo();
      }
    }
    renderLista();
    renderEditor();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function campo(rotulo, valor, opts) {
    const o = opts || {};
    const attr = 'data-g="' + (o.g != null ? o.g : '') + '" data-campo="' + o.campo + '"';
    const temDica = Object.prototype.hasOwnProperty.call(o, 'dica');
    const dica = temDica
      ? '<span class="dica' + (o.dicaClasse ? ' ' + o.dicaClasse : '') + '">' + esc(o.dica || '') + '</span>'
      : '';
    if (o.linha) {
      return '<label class="adm-campo"><span>' + esc(rotulo) + '</span>' +
        '<input ' + attr + ' type="text" value="' + esc(valor) + '" maxlength="' + (o.max || 200) + '" placeholder="' + esc(o.placeholder || '') + '">' + dica + '</label>';
    }
    return '<label class="adm-campo"><span>' + esc(rotulo) + '</span>' +
      '<textarea ' + attr + ' rows="' + (o.rows || 3) + '" maxlength="' + (o.max || 2000) + '" placeholder="' + esc(o.placeholder || '') + '">' + esc(valor) + '</textarea>' + dica + '</label>';
  }

  /** Monta os editores de blocos dos campos starter/solucao depois do render. */
  function montarEditoresBlocos() {
    if (!BLOCOS) return;
    const hosts = document.querySelectorAll('[data-blocos]');
    for (let k = 0; k < hosts.length; k++) {
      const host = hosts[k];
      const caminho = host.getAttribute('data-blocos') || '';
      let ex = null;
      let campo = '';
      if (caminho.indexOf('desafioFinal.') === 0) {
        ex = alvoFinal(false);
        campo = caminho.slice('desafioFinal.'.length);
      } else if (caminho.indexOf('exercicio.') === 0) {
        ex = exercicioCru(Number(host.getAttribute('data-g')));
        campo = caminho.slice('exercicio.'.length);
      }
      if (!ex || !campo) continue;
      BLOCOS.criar(host, {
        programa: BLOCOS.deJSON(ex[campo] || '[]'),
        compacto: true,
        onChange: function (p) {
          ex[campo] = BLOCOS.paraJSON(p);
          sujo();
        },
      });
    }
  }

  function renderEditor() {
    if (!sid) {
      $('#editor').innerHTML = '<div class="adm-vazio">Escolha uma estrela na lista para cadastrar os vídeos e desafios.</div>';
      return;
    }
    const e = L.estrela(sid);
    const c = L.CONSTELACOES[e.raiz] || {};
    const grupos = gruposDe(sid, false) || [];

    let h = '<div class="adm-estrela-head">' +
      '<span class="ponto" style="width:9px;height:9px;border-radius:50%;background:' + esc(c.cor || '#7c5cff') + '"></span>' +
      '<h1>' + esc(e.nome) + '</h1><span class="id">' + esc(e.id) + '</span>' +
      '<span class="chip dim">' + esc(c.nome || e.raiz) + ' · ' + esc(e.nivelNome) + '</span>' +
      '<a class="btn small ghost" href="sua-trilha.html?estrela=' + encodeURIComponent(e.id) + '" target="_blank" rel="noopener">ver na trilha</a>' +
    '</div>' +
    '<p class="adm-estrela-sub">Cada grupo é uma aula dessa estrela: um vídeo e um desafio. A pessoa vê os grupos ao clicar na estrela.</p>' +

    '<div class="adm-bloco">' +
      '<div class="adm-bloco-head"><span class="selo">contexto</span><b>Objetivo, tipo e molde do desafio</b></div>' +
      '<label class="adm-campo"><span>Objetivo da pessoa (a IA usa para contextualizar)</span>' +
        '<textarea id="adm-objetivo" rows="2" maxlength="400" placeholder="Ex.: um bot de Discord que registra presença">' + esc(objetivo) + '</textarea>' +
      '</label>' +
      '<label class="adm-campo"><span>Tipo da estrela</span>' +
        '<select id="adm-tipo">' +
          '<option value="codigo"' + (tipoDe(sid) === 'codigo' ? ' selected' : '') + '>Código — a pessoa programa</option>' +
          '<option value="dissertativa"' + (tipoDe(sid) === 'dissertativa' ? ' selected' : '') + '>Dissertativa — a pessoa escreve</option>' +
        '</select>' +
        '<span class="dica">Dissertativa troca o editor de código por um campo de resposta escrita na trilha.</span>' +
      '</label>' +
      '<label class="adm-campo"><span>Molde do desafio</span>' +
        '<textarea id="adm-molde" rows="4" maxlength="600">' + esc(molde) + '</textarea>' +
        '<span class="dica">A IA segue este molde. Ajuste o tom, o tamanho ou o tipo de entrega.</span>' +
      '</label>' +
    '</div>';

    const pendentes = semDesafio(grupos);
    const faltamResumo = grupos.filter((g) => temConteudo(g) && !String(g.resumo || '').trim()).length;
    h += '<div class="adm-bloco adm-ia-todos">' +
      '<div class="adm-bloco-head"><span class="selo">IA</span><b>Gerar os desafios que faltam</b></div>' +
      '<p class="tiny" id="adm-ia-resumo">' +
        (pendentes.length
          ? pendentes.length + (pendentes.length === 1 ? ' grupo está sem desafio' : ' grupos estão sem desafio') +
            (faltamResumo ? ' — ' + faltamResumo + ' também sem resumo.' : '.')
          : 'Todos os grupos desta estrela já têm desafio.') +
      '</p>' +
      '<button class="btn primary small" type="button" id="btn-ia-todos"' + (pendentes.length ? '' : ' disabled') + '>' +
        (pendentes.length ? 'Gerar ' + pendentes.length + (pendentes.length === 1 ? ' desafio' : ' desafios') + ' com IA' : 'Gerar com IA') +
      '</button>' +
      '<span class="dica" id="adm-ia-dica">Um por vez, usando o título e o resumo do grupo, o tipo da estrela e as habilidades já acesas. Resumo vazio também é preenchido. Limite de 40 por hora.</span>' +
    '</div>';

    h += '<div class="adm-bloco adm-playlist">' +
      '<div class="adm-bloco-head"><span class="selo">atalho</span><b>Playlist do YouTube</b></div>' +
      '<label class="adm-campo"><span>Cole o link de uma playlist — cria um grupo por vídeo, com o link e o título já preenchidos</span>' +
        '<div class="adm-playlist-linha">' +
          '<input id="adm-playlist-url" type="text" maxlength="300" placeholder="https://www.youtube.com/playlist?list=PL…">' +
          '<button class="btn primary small" type="button" id="btn-playlist">Criar grupos</button>' +
        '</div>' +
        '<span class="dica" id="adm-playlist-dica">Depois é só preencher os resumos e os desafios (ou pedir à IA).</span>' +
      '</label>' +
    '</div>';

    if (!grupos.length) {
      h += '<p class="tiny" style="color:var(--dim2);margin:0 0 12px">Nenhum grupo ainda. Adicione o primeiro abaixo — ou cole uma playlist acima.</p>';
    }

    grupos.forEach((g, i) => {
      const videos = (g.videos || []).join('\n');
      const d = g.desafio || {};
      const reqs = (d.requisitos || []).join('\n');
      h += '<div class="adm-grupo" data-grupo="' + i + '">' +
        '<div class="adm-grupo-head">' +
          '<span class="num">' + (i + 1) + '</span><b>Grupo ' + (i + 1) + '</b>' +
          '<button class="btn ghost small" type="button" data-mover="cima" data-g="' + i + '" title="Subir">↑</button>' +
          '<button class="btn ghost small" type="button" data-mover="baixo" data-g="' + i + '" title="Descer">↓</button>' +
          '<button class="btn ghost small" type="button" data-remover="' + i + '">Remover</button>' +
        '</div>' +
        campo('Título do grupo', g.titulo || '', { g: i, campo: 'titulo', linha: true, max: A.LIMITES.titulo, placeholder: 'Ex.: Strings na prática' }) +
        campo('Resumo (opcional)', g.resumo || '', { g: i, campo: 'resumo', linha: true, max: A.LIMITES.resumo, placeholder: 'O que você vai ver neste vídeo' }) +
        campo('Vídeos — um por linha (link ou código de incorporação)', videos, {
          g: i, campo: 'videos', rows: 3, max: 4000,
          placeholder: 'https://youtu.be/XXXXXXXXXXX\n<iframe width="560" ... src="https://www.youtube.com/embed/XXXXXXXXXXX" ...></iframe>',
          dica: '', dicaId: 'video-' + i,
        }) +
        '<div class="adm-video-prev" data-video-prev="' + i + '"></div>' +
        '<div class="adm-desafio">' +
          '<div class="adm-desafio-titulo"><span>desafio</span>' +
            '<button class="btn ghost small" type="button" data-ia="' + i + '">Gerar com IA</button>' +
          '</div>' +
          campo('Título do desafio', d.titulo || '', { g: i, campo: 'desafio.titulo', linha: true, max: A.LIMITES.titulo, placeholder: 'Ex.: Inverter uma palavra' }) +
          campo('Enunciado', d.enunciado || '', { g: i, campo: 'desafio.enunciado', rows: 4, max: A.LIMITES.enunciado, placeholder: 'O que a pessoa precisa fazer, ligado ao projeto dela.' }) +
          campo('Requisitos — um por linha', reqs, { g: i, campo: 'desafio.requisitos', rows: 3, max: 800, placeholder: 'Use um laço\nDevolva uma string' }) +
          campo('Dica', d.dica || '', { g: i, campo: 'desafio.dica', linha: true, max: A.LIMITES.dica, placeholder: 'Uma pista curta, sem entregar a solução' }) +
        '</div>' +
        '<div class="adm-exercicio">' +
          '<div class="adm-desafio-titulo"><span>exercício</span><span style="flex:1"></span>' +
            (g.exercicio
              ? '<button class="btn ghost small" type="button" data-remover-exercicio="' + i + '">Remover exercício</button>'
              : '<button class="btn primary small" type="button" data-criar-exercicio="' + i + '">Criar exercício</button>') +
          '</div>' +
          (g.exercicio
            ? htmlExercicio(g.exercicio, { g: i })
            : '<p class="tiny" style="margin:0;color:var(--dim2)">Opcional: um exercício de código corrigido por testes. Com exercícios, a estrela só acende quando todos os exercícios da estrela forem resolvidos.</p>') +
        '</div>' +
      '</div>';
    });

    const finalEx = alvoFinal(false);
    h += '<div class="adm-bloco adm-final">' +
      '<div class="adm-bloco-head"><span class="selo">desafio final</span><b>Desafio final da estrela</b>' +
        '<span style="flex:1"></span>' +
        (finalEx ? '<button class="btn ghost small" type="button" data-remover-final>Remover desafio final</button>' : '') +
      '</div>' +
      '<p class="tiny" style="margin:0 0 10px;color:var(--dim)">Opcional — este é o desafio que você escreve para fechar a estrela. Ele entra na conta depois dos exercícios dos grupos. Sem testes, a pessoa lê e marca como concluído na trilha.</p>' +
      (finalEx
        ? htmlExercicio(finalEx, { final: true })
        : '<button class="btn primary small" type="button" data-criar-final>Criar desafio final</button>') +
    '</div>';

    h += '<button class="btn primary small" type="button" id="add-grupo">+ Adicionar grupo</button>';
    $('#editor').innerHTML = h;

    // editores de blocos (estrela FU1) são montados depois do HTML
    montarEditoresBlocos();

    // a dica de vídeo é recalculada a cada edição
    grupos.forEach((g, i) => dicaVideo(i, g.videos || []));
  }

  function dicaVideo(i, videos) {
    const el = document.querySelector('[data-campo="videos"][data-g="' + i + '"]');
    if (!el) return;
    const dica = el.parentElement.querySelector('.dica');
    if (!dica) return;
    const lista = [].concat(videos).map((v) => String(v || '').trim()).filter(Boolean);
    const id = lista.length ? A.ytId(lista[0]) : null;

    // prévia do primeiro vídeo: dá para assistir e se inspirar no desafio
    const prev = document.querySelector('[data-video-prev="' + i + '"]');
    if (prev) {
      prev.innerHTML = id
        ? '<a href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener" title="Abrir no YouTube">' +
            '<img src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg" alt="" loading="lazy">' +
            '<span>Assistir ao vídeo para se inspirar</span></a>'
        : '';
    }

    if (!lista.length) {
      dica.className = 'dica';
      dica.textContent = 'Sem vídeo: o grupo aparece com o desafio e o aviso "vídeo em breve".';
      return;
    }
    if (lista.some((v) => /[?&]list=/.test(v))) {
      dica.className = 'dica erro';
      dica.textContent = 'Isso é um link de playlist — cole no atalho "Playlist do YouTube" acima para criar um grupo por vídeo.';
      return;
    }
    const ruins = lista.filter((v) => !A.ytId(v));
    if (ruins.length) {
      dica.className = 'dica erro';
      dica.textContent = ruins.length + ' vídeo(s) sem id do YouTube reconhecido. Cole o link ou o iframe inteiro.';
    } else {
      dica.className = 'dica ok';
      dica.textContent = lista.length === 1
        ? 'Vídeo reconhecido: ' + A.ytId(lista[0])
        : lista.length + ' vídeos reconhecidos (partes).';
    }
  }

  /* ---------------- edição dos campos ---------------- */

  function escrever(grupo, caminho, valorBruto) {
    const partes = caminho.split('.');
    if (partes[0] === 'desafio') {
      grupo.desafio = grupo.desafio || { titulo: '', enunciado: '', requisitos: [], dica: '' };
      const campo = partes[1];
      if (campo === 'requisitos') {
        grupo.desafio.requisitos = String(valorBruto).split('\n').map((s) => s.trim()).filter(Boolean);
      } else {
        grupo.desafio[campo] = valorBruto;
      }
      return;
    }
    if (caminho === 'videos') {
      grupo.videos = String(valorBruto).split('\n').map((s) => s.trim()).filter(Boolean);
      return;
    }
    grupo[caminho] = valorBruto;
  }

  function ler(grupo, caminho) {
    if (caminho.indexOf('desafio.') === 0) {
      const d = grupo.desafio || {};
      const c = caminho.slice(8);
      return Array.isArray(d[c]) ? d[c].join('\n') : (d[c] || '');
    }
    if (caminho === 'videos') return (grupo.videos || []).join('\n');
    return grupo[caminho] || '';
  }

  /* ---------------- ações ---------------- */

  function adicionarGrupo() {
    const g = gruposDe(sid, true);
    g.push({ id: sid.toLowerCase() + '-' + (g.length + 1), titulo: '', resumo: '', videos: [], desafio: null });
    sujo();
    renderLista();
    renderEditor();
    const ultimo = document.querySelector('.adm-grupo[data-grupo="' + (g.length - 1) + '"]');
    if (ultimo) ultimo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function removerGrupo(i) {
    const g = gruposDe(sid, false);
    if (!g || !g[i]) return;
    if (!confirm('Remover o grupo ' + (i + 1) + ' de ' + L.estrela(sid).nome + '?')) return;
    g.splice(i, 1);
    if (!g.length && dados.estrelas[sid]) delete dados.estrelas[sid];
    sujo();
    renderLista();
    renderEditor();
  }

  function moverGrupo(i, direcao) {
    const g = gruposDe(sid, false);
    const j = direcao === 'cima' ? i - 1 : i + 1;
    if (!g || !g[i] || j < 0 || j >= g.length) return;
    const tmp = g[i];
    g[i] = g[j];
    g[j] = tmp;
    sujo();
    renderEditor();
  }

  /* ---------------- exercícios: criar, remover e testar ---------------- */

  function criarExercicio(i) {
    const g = gruposDe(sid, false);
    if (!g || !g[i]) return;
    if (g[i].exercicio) return;
    g[i].exercicio = exercicioVazio(g[i]);
    sujo();
    renderLista();
    renderEditor();
    const bloco = document.querySelector('.adm-grupo[data-grupo="' + i + '"] .adm-exercicio');
    if (bloco) bloco.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function removerExercicio(i) {
    const g = gruposDe(sid, false);
    if (!g || !g[i] || !g[i].exercicio) return;
    if (!confirm('Remover o exercício do grupo ' + (i + 1) + '? O desafio em texto continua.')) return;
    delete g[i].exercicio;
    sujo();
    renderLista();
    renderEditor();
  }

  function criarFinal() {
    if (!sid || alvoFinal(false)) return;
    alvoFinal(true);
    sujo();
    renderLista();
    renderEditor();
    const bloco = document.querySelector('.adm-final');
    if (bloco) bloco.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function removerFinal() {
    const alvo = dados.estrelas && dados.estrelas[sid];
    if (!alvo || !alvo.desafioFinal) return;
    if (!confirm('Remover o desafio final desta estrela?')) return;
    delete alvo.desafioFinal;
    sujo();
    renderLista();
    renderEditor();
  }

  /** Descobre o exercício (do grupo ou final) e o campo que um input está editando. */
  function exercicioDoCampo(el) {
    if (!sid) return null;
    const caminho = String(el.getAttribute('data-campo') || '');
    if (caminho.indexOf('exercicio.') === 0) {
      const ex = exercicioCru(Number(el.getAttribute('data-g')));
      return ex ? { ex, campo: caminho.slice('exercicio.'.length) } : null;
    }
    if (caminho.indexOf('desafioFinal.') === 0) {
      const ex = alvoFinal(false);
      return ex ? { ex, campo: caminho.slice('desafioFinal.'.length) } : null;
    }
    return null;
  }

  function salvarCampoExercicio(el) {
    const alvo = exercicioDoCampo(el);
    if (!alvo) return false;
    escreverExercicio(alvo.ex, alvo.campo, el.value);
    sujo();
    return true;
  }

  /* ---------------- playlist -> grupos ---------------- */

  function idDePlaylist(s) {
    const t = String(s || '').trim();
    const m = t.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    return /^(PL|OL|FL)[A-Za-z0-9_-]{10,}$/.test(t) ? t : null;
  }

  async function criarDaPlaylist() {
    const entrada = $('#adm-playlist-url');
    const btn = $('#btn-playlist');
    const dica = $('#adm-playlist-dica');
    if (!entrada || !btn) return;
    const url = (entrada.value || '').trim();
    if (!idDePlaylist(url)) {
      dica.className = 'dica erro';
      dica.textContent = 'Não achei a playlist nesse link — precisa de ?list=… (ex.: youtube.com/playlist?list=PL…)';
      entrada.focus();
      return;
    }

    const rotulo = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'lendo…';
    dica.className = 'dica';
    dica.textContent = 'Lendo a playlist no YouTube…';
    try {
      const r = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, session: L.sessao() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error((d && d.error && d.error.message) || ('HTTP ' + r.status));
      const videos = (d.videos || []).filter((v) => v && v.id);
      if (!videos.length) throw new Error('a playlist não tem vídeos legíveis');
      if (videos.length > 10 && !confirm('A playlist tem ' + videos.length + ' vídeos — criar ' + videos.length + ' grupos nesta estrela?')) {
        dica.textContent = 'Cancelado — nenhum grupo criado.';
        return;
      }

      const g = gruposDe(sid, true);
      const inicio = g.length;
      videos.forEach((v) => {
        g.push({
          id: sid.toLowerCase() + '-' + (g.length + 1),
          titulo: String(v.titulo || '').slice(0, A.LIMITES.titulo),
          resumo: '',
          videos: ['https://youtu.be/' + v.id],
          desafio: null,
        });
      });
      sujo();
      renderLista();
      renderEditor();

      aviso('ok', videos.length + ' grupos criados da playlist' + (d.truncado ? ' (primeiros ' + videos.length + ' da lista)' : '') +
        '. Falta preencher resumos e desafios — depois "Salvar no arquivo" ou "Publicar no site".');
      const novo = document.querySelector('.adm-grupo[data-grupo="' + inicio + '"]');
      if (novo) novo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (e) {
      dica.className = 'dica erro';
      dica.textContent = 'Não deu: ' + ((e && e.message) || e);
    } finally {
      btn.disabled = false;
      btn.textContent = rotulo;
    }
  }

  async function gerarIA(i, btn) {
    const g = gruposDe(sid, false);
    if (!g || !g[i]) return;
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'gerando…';
    try {
      const r = await A.gerarDesafio({
        sid, objetivo, contexto: '', molde, session: L.sessao(),
        tipo: tipoDe(sid), grupo: g[i].titulo, aulaResumo: g[i].resumo || '',
      });
      g[i].desafio = r.desafio;
      if (!String(g[i].resumo || '').trim() && r.resumo) g[i].resumo = r.resumo;
      sujo();
      renderEditor();
      status('Desafio gerado — revise o texto e salve');
    } catch (err) {
      status('A IA não respondeu: ' + (err.message || 'falha de rede'));
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  /** Gera, um por vez, os desafios que faltam na estrela aberta. */
  async function gerarTodos(btn) {
    const g = gruposDe(sid, false);
    if (!g || !g.length) return;
    const alvos = semDesafio(g).map((x) => x.i);
    if (!alvos.length) { status('Todos os grupos já têm desafio'); return; }
    if (alvos.length > 8 && !confirm('Gerar ' + alvos.length + ' desafios de uma vez? Cada um leva alguns segundos.')) return;

    const rotulo = btn.textContent;
    btn.disabled = true;
    let feitos = 0;
    const erros = [];
    for (let k = 0; k < alvos.length; k++) {
      const i = alvos[k];
      btn.textContent = 'gerando ' + (k + 1) + ' de ' + alvos.length + '…';
      try {
        const r = await A.gerarDesafio({
          sid, objetivo, contexto: '', molde, session: L.sessao(),
          tipo: tipoDe(sid), grupo: g[i].titulo, aulaResumo: g[i].resumo || '',
        });
        g[i].desafio = r.desafio;
        if (!String(g[i].resumo || '').trim() && r.resumo) g[i].resumo = r.resumo;
        feitos++;
      } catch (err) {
        const msg = (err && err.message) || 'falha de rede';
        erros.push(msg);
        // estourou o limite da hora: não adianta insistir
        if (/muitos desafios/i.test(msg)) break;
      }
    }

    btn.disabled = false;
    btn.textContent = rotulo;
    A.salvarRascunho(dados);
    renderLista();
    renderEditor();

    if (!erros.length) {
      status(feitos + (feitos === 1 ? ' desafio gerado' : ' desafios gerados') + ' — revise e salve');
    } else {
      const ultimo = erros[erros.length - 1];
      aviso(feitos ? 'ok' : 'erro',
        feitos + (feitos === 1 ? ' desafio gerado' : ' desafios gerados') +
        (erros.length ? ' — ' + erros.length + ' falharam: ' + ultimo : '') + '.');
      status('Geração parcial: veja o aviso');
    }
  }

  /* ---------------- salvar / publicar ---------------- */

  function nomeArquivo() { return 'estrelas-conteudo.js'; }

  /* Como esta página consegue publicar:
     - 'local'  -> servidor-admin.mjs: grava o arquivo e roda o wrangler deploy;
     - 'remoto' -> site publicado: o Worker grava no KV (vale na hora para todos)
                   e, se GITHUB_TOKEN estiver configurado, cria o commit no Git;
     - 'nenhum' -> só "Baixar .js" / "Copiar código".                       */
  let modoPublicacao = 'nenhum';
  let souAdmin = false;
  let githubLigado = false;

  function atualizarBotoes() {
    const bArq = $('#btn-arquivo');
    const bDep = $('#btn-deploy');
    const podePublicar = modoPublicacao === 'local' || (modoPublicacao === 'remoto' && souAdmin);
    if (bArq) bArq.hidden = modoPublicacao !== 'local';
    if (bDep) {
      bDep.hidden = !podePublicar;
      bDep.textContent = modoPublicacao === 'local' ? 'Publicar no site' : 'Publicar para todos';
      bDep.title = modoPublicacao === 'local'
        ? 'Salva o arquivo e roda o deploy do site'
        : (githubLigado
          ? 'Publica o conteúdo agora — vale para todos os usuários e vira um commit no GitHub'
          : 'Publica o conteúdo agora — vale para todos os usuários (GitHub não configurado)');
    }
  }

  async function detectarPublicacao() {
    if (typeof fetch !== 'function') return;

    try {
      const local = await fetch('/__admin/deploy', { method: 'HEAD' });
      if (local.ok) {
        modoPublicacao = 'local';
        atualizarBotoes();
        return;
      }
    } catch { /* não é o servidor local */ }

    try {
      const r = await fetch('/api/admin/status', { headers: { Accept: 'application/json' } });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        modoPublicacao = 'remoto';
        souAdmin = !!(d && d.admin);
        githubLigado = !!(d && d.github);
        atualizarBotoes();
        if (!souAdmin) {
          aviso('', 'Você pode editar, mas só um administrador publica para todos. ' +
            'Use "Baixar .js" ou "Copiar código" para enviar a mudança.');
        }
        return;
      }
    } catch { /* offline */ }

    modoPublicacao = 'nenhum';
    atualizarBotoes();
  }

  /** Grava estrelas-conteudo.js no projeto (precisa do servidor local). */
  async function gravarArquivo() {
    A.salvarRascunho(dados);
    const conteudo = A.exportarArquivo();
    const r = await fetch('/__admin/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error((d && d.erro) || ('HTTP ' + r.status));
    return d;
  }

  /** Publica pelo Worker (site publicado): KV na hora + commit no GitHub. */
  async function publicarRemoto() {
    A.salvarRascunho(dados);
    const r = await fetch('/api/admin/publicar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: A.exportarArquivo() }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) {
      throw new Error((d && d.error && d.error.message) || ('HTTP ' + r.status));
    }
    return d;
  }

  async function salvarNoArquivo() {
    try {
      const d = await gravarArquivo();
      aviso('ok', 'Arquivo ' + nomeArquivo() + ' atualizado no projeto' + (d.arquivo ? ' (' + d.arquivo + ')' : '') + '.' +
        ' Clique em "Publicar no site" para o deploy.');
    } catch {
      aviso('erro', 'Não achei o servidor local para gravar o arquivo. Baixei o ' + nomeArquivo() +
        ' — substitua o arquivo na pasta do projeto e rode npx wrangler deploy.');
      baixar();
    }
  }

  /** Botão "Publicar": local roda o deploy; remoto grava no KV + GitHub. */
  async function publicar() {
    const btn = $('#btn-deploy');
    const rotulo = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'publicando…';

    try {
      if (modoPublicacao === 'remoto') {
        aviso('', 'Publicando para todos os usuários…');
        const d = await publicarRemoto();
        const g = d.github;
        const msg = 'Publicado!' +
          (d.publicado ? ' ' + d.publicado.estrelas + ' estrela(s) no ar' : '') +
          (g && g.commit ? ' · commit ' + g.commit.slice(0, 7) + ' no GitHub' : '') +
          (d.aviso ? ' — ' + d.aviso : '');
        aviso('ok', msg);
        status('Conteúdo publicado');
        // O conteúdo agora vem do KV: descarta o rascunho e recarrega para a
        // página ler o que está no ar (senão ela ficaria com o arquivo antigo).
        try { sessionStorage.setItem('lunox_admin_publicado', msg); } catch { /* sem sessionStorage */ }
        A.descartarRascunho();
        setTimeout(() => location.reload(), 1600);
        return;
      }

      aviso('', 'Salvando o arquivo e publicando o site — leva uns 15 segundos, pode deixar a aba aberta…');
      let d = null;
      await gravarArquivo();
      const r = await fetch('/__admin/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error((d && d.erro) || ('HTTP ' + r.status));
      aviso('ok', 'Publicado!' + (d.url ? ' ' + d.url : '') + (d.versao ? ' (versão ' + d.versao + ')' : ''));
      status('Site atualizado');
    } catch (e) {
      aviso('erro', 'A publicação não terminou: ' + ((e && e.message) || e) +
        ' — use "Baixar .js" ou "Copiar código" como reserva.');
    } finally {
      btn.disabled = false;
      btn.textContent = rotulo;
    }
  }

  function baixar() {
    A.salvarRascunho(dados);
    const blob = new Blob([A.exportarArquivo()], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    status('Download pronto: ' + nomeArquivo());
  }

  async function copiar() {
    A.salvarRascunho(dados);
    const texto = A.exportarArquivo();
    try {
      await navigator.clipboard.writeText(texto);
      status('Código copiado — cole em ' + nomeArquivo());
    } catch {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); status('Código copiado'); } catch { status('Não consegui copiar — use Baixar .js'); }
      ta.remove();
    }
  }

  function descartar() {
    if (!A.temRascunho()) { status('Não há rascunho para descartar'); return; }
    if (!confirm('Descartar o rascunho deste navegador e voltar para o conteúdo do arquivo?')) return;
    A.descartarRascunho();
    dados = clonar(A.dados());
    $('#selo-rascunho').hidden = true;
    renderLista();
    renderEditor();
    aviso('', '');
    status('Rascunho descartado');
  }

  /* ---------------- eventos ---------------- */

  document.addEventListener('click', (e) => {
    const alvo = (sel) => e.target.closest(sel);

    const est = alvo('[data-estrela]');
    if (est) { selecionar(est.getAttribute('data-estrela')); return; }

    if (alvo('#btn-playlist')) { criarDaPlaylist(); return; }
    if (alvo('#btn-ia-todos')) { gerarTodos(alvo('#btn-ia-todos')); return; }
    if (alvo('#add-grupo')) { adicionarGrupo(); return; }

    const criarEx = alvo('[data-criar-exercicio]');
    if (criarEx) { criarExercicio(Number(criarEx.getAttribute('data-criar-exercicio')) || 0); return; }

    const removerEx = alvo('[data-remover-exercicio]');
    if (removerEx) { removerExercicio(Number(removerEx.getAttribute('data-remover-exercicio')) || 0); return; }

    if (alvo('[data-criar-final]')) { criarFinal(); return; }
    if (alvo('[data-remover-final]')) { removerFinal(); return; }

    const testar = alvo('[data-testar]');
    if (testar) { testarExercicio(testar.getAttribute('data-testar'), testar); return; }

    const rem = alvo('[data-remover]');
    if (rem) { removerGrupo(Number(rem.getAttribute('data-remover')) || 0); return; }

    const mov = alvo('[data-mover]');
    if (mov) { moverGrupo(Number(mov.getAttribute('data-g')) || 0, mov.getAttribute('data-mover')); return; }

    const ia = alvo('[data-ia]');
    if (ia) { gerarIA(Number(ia.getAttribute('data-ia')) || 0, ia); return; }
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    // campos internos do editor de blocos são tratados pelo próprio componente
    if (el && (el.hasAttribute('data-bloco') || (el.closest && el.closest('.adm-blocos-editor')))) return;

    if (el.id === 'adm-objetivo') { objetivo = el.value; localStorage.setItem(CHAVE_OBJETIVO, objetivo); return; }
    if (el.id === 'adm-molde') { molde = el.value; localStorage.setItem(CHAVE_MOLDE, molde); return; }

    if (salvarCampoExercicio(el)) return;

    const campo = el.getAttribute('data-campo');
    if (!campo) return;
    const i = Number(el.getAttribute('data-g'));
    const g = gruposDe(sid, false);
    if (!g || !g[i]) return;
    escrever(g[i], campo, el.value);
    if (campo === 'videos') dicaVideo(i, g[i].videos);
    sujo();
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el) return;
    if (el.hasAttribute('data-bloco') || (el.closest && el.closest('.adm-blocos-editor'))) return;
    if (salvarCampoExercicio(el)) return;
    if (el.id !== 'adm-tipo' || !sid) return;
    if (!dados.estrelas) dados.estrelas = {};
    const alvo = dados.estrelas[sid] || (dados.estrelas[sid] = { grupos: [] });
    alvo.tipo = el.value === 'dissertativa' ? 'dissertativa' : 'codigo';
    sujo();
    status('Tipo da estrela: ' + (alvo.tipo === 'dissertativa' ? 'dissertativa' : 'código'));
  });

  $('#busca').addEventListener('input', renderLista);
  $('#filtro-const').addEventListener('change', renderLista);
  $('#btn-arquivo').addEventListener('click', salvarNoArquivo);
  $('#btn-deploy').addEventListener('click', publicar);
  $('#btn-baixar').addEventListener('click', baixar);
  $('#btn-copiar').addEventListener('click', copiar);
  $('#btn-descartar').addEventListener('click', descartar);

  /* ---------------- boot ---------------- */

  detectarPublicacao();
  preencherFiltro();
  $('#selo-rascunho').hidden = !A.temRascunho();
  renderLista();
  renderEditor();

  try {
    const publicado = sessionStorage.getItem('lunox_admin_publicado');
    if (publicado) {
      sessionStorage.removeItem('lunox_admin_publicado');
      aviso('ok', publicado);
    } else if (A.temRascunho()) {
      aviso('', 'Existe um rascunho salvo neste navegador. Ele já aparece na trilha; para publicar para todos, use "Publicar para todos" ou envie o arquivo.');
    }
  } catch {
    if (A.temRascunho()) {
      aviso('', 'Existe um rascunho salvo neste navegador. Ele já aparece na trilha; para publicar para todos, use "Publicar para todos" ou envie o arquivo.');
    }
  }
})();
