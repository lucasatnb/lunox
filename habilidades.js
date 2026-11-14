/* ============================================================
   Habilidades — o céu do Lunox
   Só o mapa. As estrelas aparecem aos poucos e o teste é um pop-up.
   ============================================================ */
(function () {
  'use strict';
  const L = window.LUNOX;
  const { $, $$, esc, toast } = L;

  L.montarNav('habilidades');

  const MAPA_W = 1684;
  const MAPA_H = 1191;
  const ZOOM_MIN = 0.38;
  const ZOOM_MAX = 2.6;
  const CHAVE_QUIZ = 'lunox_quiz_visto';

  let mapaDados = null;
  let byId = new Map();
  let kids = new Map();
  let visiveis = new Set();
  let cam = { x: 0, y: 0, s: 1 };
  let sel = null;
  let tocando = false;

  // estrelas já acesas no estado, mas cuja animação de desbloqueio ainda não
  // tocou: o mapa as mostra apagadas até a animação rodar
  const excluidas = new Set(L.pendentesAnim());
  const reduzMov = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- índice da árvore ---------------- */

  function indexar() {
    byId = new Map();
    kids = new Map();
    mapaDados.estrelas.forEach((e) => byId.set(e.id, e));
    mapaDados.estrelas.forEach((e) => {
      if (!e.pai) return;
      if (!kids.has(e.pai)) kids.set(e.pai, []);
      kids.get(e.pai).push(e.id);
    });
  }

  function estrelasAcesas() {
    const s = new Set();
    L.SKILLS.forEach((sk) => { if (L.acesa(sk.id) && !excluidas.has(sk.id)) s.add(sk.star); });
    return s;
  }

  function skillDaEstrela(id) {
    return L.SKILLS.find((s) => s.star === id) || null;
  }

  function raizInfo(raizId) {
    if (!mapaDados) return null;
    return mapaDados.raizes.find((r) => r.id === raizId) || null;
  }

  function nivelLabel(d) {
    if (!d) return '';
    if (d.nivel === 0) return 'raiz';
    if (mapaDados.niveis && mapaDados.niveis[String(d.nivel)]) return mapaDados.niveis[String(d.nivel)];
    return ['raiz', 'essencial', 'importante', 'avançada'][d.nivel] || 'essencial';
  }

  /* ---------------- revelação ---------------- */

  function calcularVisiveis() {
    const acesas = estrelasAcesas();
    const vis = new Set();

    // as raízes são sempre o chão do céu
    mapaDados.estrelas.forEach((e) => {
      const pai = e.pai ? byId.get(e.pai) : null;
      if (e.nivel === 0 || (pai && pai.nivel === 0)) vis.add(e.id);
    });

    // tudo que leva até uma estrela acesa já precisa estar visível
    acesas.forEach((id) => {
      let cur = byId.get(id);
      while (cur && cur.pai) {
        vis.add(cur.pai);
        cur = byId.get(cur.pai);
      }
    });

    // o raio de descoberta cresce com o que você já acendeu
    const raio = acesas.size >= 9 ? 3 : acesas.size >= 6 ? 2 : 1;
    const fila = Array.from(acesas, (id) => [id, 0]);

    while (fila.length) {
      const [id, dep] = fila.shift();
      vis.add(id);
      if (dep >= raio) continue;
      (kids.get(id) || []).forEach((k) => {
        if (!vis.has(k)) {
          vis.add(k);
          fila.push([k, dep + 1]);
        }
      });
    }

    return vis;
  }

  // distância (em saltos da árvore) de cada estrela até a que acabou de acender
  function distancias(origem) {
    const dist = new Map([[origem, 0]]);
    const fila = [origem];
    while (fila.length) {
      const id = fila.shift();
      const d = dist.get(id);
      const viz = (kids.get(id) || []).slice();
      const dado = byId.get(id);
      if (dado && dado.pai && byId.has(dado.pai)) viz.push(dado.pai);
      viz.forEach((v) => {
        if (!dist.has(v)) { dist.set(v, d + 1); fila.push(v); }
      });
    }
    return dist;
  }

  const PASSO_MS = 420;   // intervalo entre cada "salto" da animação
  const BASE_MS = 520;    // espera antes da primeira linha crescer

  function desenharLinha(l, de, para, dist) {
    const dDe = dist.has(de) ? dist.get(de) : 9;
    const dPara = dist.has(para) ? dist.get(para) : 9;
    const reverso = dPara < dDe;                  // a linha cresce a partir da estrela acesa
    const atraso = BASE_MS + Math.min(dDe, dPara) * PASSO_MS;
    let len = 0;
    try { len = l.getTotalLength(); } catch {}
    if (!len) return;

    l.style.transition = 'none';
    l.style.opacity = '1';
    l.style.strokeDasharray = len + ' ' + len;
    l.style.strokeDashoffset = String(reverso ? -len : len);
    void l.getBoundingClientRect();
    l.style.transition = 'stroke-dashoffset .8s cubic-bezier(.22,.61,.36,1) ' + atraso + 'ms';
    l.style.strokeDashoffset = '0';
    setTimeout(() => {
      l.style.transition = l.style.opacity = l.style.strokeDasharray = l.style.strokeDashoffset = '';
    }, atraso + 1000);
  }

  function pintarMapa(opts) {
    opts = opts || {};
    const origem = opts.origem || null;
    const animar = opts.animar !== false && !reduzMov();
    const antes = visiveis;
    const vis = calcularVisiveis();
    visiveis = vis;

    const dist = origem ? distancias(origem) : null;
    const acesas = estrelasAcesas();
    const novas = [];

    $$('#mapa .star').forEach((g) => {
      const id = g.getAttribute('data-id');
      const dentro = vis.has(id);
      const acesa = acesas.has(id);

      g.classList.toggle('oculta', !dentro);
      g.classList.toggle('apagada', dentro && !acesa);
      g.classList.toggle('acesa', dentro && acesa);
      g.classList.remove('nova');

      if (dentro && !antes.has(id) && antes.size) novas.push(g);
    });

    $$('#mapa .lbl').forEach((t) => {
      t.classList.toggle('lbl-fora', !vis.has(t.getAttribute('data-id')));
    });

    $$('#mapa .trilha').forEach((l) => {
      const de = l.getAttribute('data-de');
      const para = l.getAttribute('data-para');
      const on = vis.has(de) && vis.has(para);
      const era = l.classList.contains('on');
      l.classList.toggle('on', on);
      if (on && !era && animar && dist && antes.size) desenharLinha(l, de, para, dist);
    });

    $$('#mapa .ponte').forEach((p) => {
      p.classList.toggle('on', vis.has(p.getAttribute('data-a')) && vis.has(p.getAttribute('data-b')));
    });

    if (animar && novas.length) {
      novas.forEach((g, i) => {
        const id = g.getAttribute('data-id');
        const atraso = dist && dist.has(id)
          ? BASE_MS + dist.get(id) * PASSO_MS
          : Math.min(i * 55, 900);
        g.style.animationDelay = atraso + 'ms';
        g.classList.add('nova');
      });
      setTimeout(() => novas.forEach((g) => { g.classList.remove('nova'); g.style.animationDelay = ''; }), 4200);
    }

    const contador = $('#sky-count');
    if (contador) contador.textContent = vis.size;

    if (sel && !vis.has(sel)) fecharPop();
    return { novas: novas.map((g) => g.getAttribute('data-id')) };
  }

  /* ---------------- desbloqueio ---------------- */

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function explosao(d) {
    const svg = $('#mapa svg');
    if (!svg) return;
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'explosao');
    g.setAttribute('transform', 'translate(' + d.x + ' ' + d.y + ')');
    for (let k = 0; k < 2; k++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('class', 'burst');
      c.setAttribute('r', '6');
      c.style.animationDelay = (k * 220) + 'ms';
      g.appendChild(c);
    }
    for (let k = 0; k < 12; k++) {
      const ang = (Math.PI * 2 * k) / 12 + Math.random() * 0.3;
      const dist = 34 + Math.random() * 34;
      const f = document.createElementNS(SVG_NS, 'circle');
      f.setAttribute('class', 'faisca');
      f.setAttribute('r', String(1.3 + Math.random() * 1.4));
      f.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      f.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      f.style.animationDelay = (Math.random() * 160) + 'ms';
      g.appendChild(f);
    }
    svg.appendChild(g);
    setTimeout(() => g.remove(), 2200);
  }

  function aviso(sk, vizinhas) {
    const sky = $('#sky');
    if (!sky) return;
    const el = document.createElement('div');
    el.className = 'unlock-banner';
    el.innerHTML =
      '<span class="ub-spark">✦</span>' +
      '<div><b>' + esc(sk.nome) + ' acesa</b>' +
      '<i>' + (vizinhas > 0
        ? vizinhas + (vizinhas === 1 ? ' estrela nova' : ' estrelas novas') + ' no seu céu'
        : 'o céu já mostrava tudo por aqui') + '</i></div>';
    sky.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3800);
  }

  function focarEm(d, escala) {
    const sky = $('#sky');
    cam.s = escala;
    cam.x = sky.clientWidth / 2 - d.x * escala;
    cam.y = sky.clientHeight / 2 - d.y * escala;
    limitarCamera();
    aplicarCamera(true);
  }

  // toca o desbloqueio de uma estrela: câmera → explosão → linhas → vizinhas
  function desbloquear(sk) {
    return new Promise((resolve) => {
      const d = byId.get(sk.star);
      excluidas.delete(sk.id);

      if (!d || reduzMov()) {
        pintarMapa({ animar: false });
        enquadrarVisiveis(false);
        L.limparAnim(sk.id);
        aviso(sk, 0);
        resolve();
        return;
      }

      fecharPop();
      focarEm(d, Math.max(cam.s, 1.15));

      setTimeout(() => {
        const r = pintarMapa({ animar: true, origem: sk.star });
        const g = $('#mapa .star[data-id="' + sk.star + '"]');
        if (g) { g.classList.add('ignite'); setTimeout(() => g.classList.remove('ignite'), 1500); }
        explosao(d);
        aviso(sk, r.novas.filter((id) => id !== sk.star).length);

        setTimeout(() => enquadrarVisiveis(true), 2600);
        setTimeout(() => { L.limparAnim(sk.id); resolve(); }, 3500);
      }, 700);
    });
  }

  async function reproduzirPendentes() {
    if (tocando) return;
    tocando = true;
    try {
      const fila = L.pendentesAnim();
      for (const id of fila) {
        const sk = L.skill(id);
        if (!sk) { L.limparAnim(id); excluidas.delete(id); continue; }
        await desbloquear(sk);
      }
      if (!fila.length) enquadrarVisiveis(true);
    } finally {
      tocando = false;
    }
  }

  /* ---------------- câmera ---------------- */

  function enquadrarVisiveis(animar) {
    const sky = $('#sky');
    const vw = sky.clientWidth;
    const vh = sky.clientHeight;
    if (!vw || !vh) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visiveis.forEach((id) => {
      const d = byId.get(id);
      if (!d) return;
      minX = Math.min(minX, d.x);
      minY = Math.min(minY, d.y);
      maxX = Math.max(maxX, d.x);
      maxY = Math.max(maxY, d.y);
    });
    if (minX === Infinity) { minX = 0; minY = 0; maxX = MAPA_W; maxY = MAPA_H; }

    const pad = 96;
    const bw = Math.max(280, maxX - minX);
    const bh = Math.max(220, maxY - minY);
    let s = Math.min((vw - pad) / bw, (vh - pad) / bh);
    s = Math.max(ZOOM_MIN, Math.min(1.35, s));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    cam.s = s;
    cam.x = vw / 2 - cx * s;
    cam.y = vh / 2 - cy * s;
    aplicarCamera(animar !== false);
  }

  function aplicarCamera(animar) {
    const mapa = $('#mapa');
    if (!mapa) return;
    mapa.classList.toggle('sem-anim', !animar);
    mapa.style.transform = 'translate(' + cam.x + 'px,' + cam.y + 'px) scale(' + cam.s + ')';
  }

  function limitarCamera() {
    const sky = $('#sky');
    const vw = sky.clientWidth;
    const vh = sky.clientHeight;
    const mw = MAPA_W * cam.s;
    const mh = MAPA_H * cam.s;
    const folga = 90;

    if (mw <= vw) cam.x = (vw - mw) / 2;
    else cam.x = Math.max(vw - mw - folga, Math.min(folga, cam.x));

    if (mh <= vh) cam.y = (vh - mh) / 2;
    else cam.y = Math.max(vh - mh - folga, Math.min(folga, cam.y));
  }

  function zoomEm(fator, px, py) {
    const sky = $('#sky');
    const r = sky.getBoundingClientRect();
    const cx = px == null ? r.width / 2 : px - r.left;
    const cy = py == null ? r.height / 2 : py - r.top;

    const novo = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, cam.s * fator));
    if (novo === cam.s) return;

    const wx = (cx - cam.x) / cam.s;
    const wy = (cy - cam.y) / cam.s;

    cam.s = novo;
    cam.x = cx - wx * novo;
    cam.y = cy - wy * novo;
    limitarCamera();
    aplicarCamera(true);
  }

  /* ---------------- popover de estrela ---------------- */

  function abrirPop(id, ev) {
    const d = byId.get(id);
    if (!d) return;
    sel = id;

    const raiz = raizInfo(d.raiz);
    const cor = raiz ? raiz.cor : '#ffd666';
    const sk = skillDaEstrela(id);
    const acesa = !!(sk && L.acesa(sk.id));
    const pai = d.pai ? byId.get(d.pai) : null;

    $('#pop-kicker').innerHTML =
      '<i style="background:' + esc(cor) + '"></i>' +
      esc(raiz ? raiz.nome : d.raiz) + ' · ' + esc(nivelLabel(d));

    const nome = $('#pop-name');
    nome.textContent = d.nome;
    nome.style.color = acesa ? cor : '';

    $('#pop-meta').textContent = pai
      ? 'Vem de ' + pai.nome + (sk && sk.item ? ' · ' + sk.item : '')
      : (raiz ? raiz.descricao : 'Começo de uma constelação.');

    const estado = $('#pop-state');
    estado.className = 'chip ' + (acesa ? 'gold' : '');
    estado.innerHTML = acesa ? '<span class="dot"></span>acesa' : sk ? '<span class="dot"></span>' + (L.temExercicio && L.temExercicio(sk.id) ? 'a acender · passe no exercício' : 'a acender · veja a aula') : '<span class="dot"></span>começo da constelação';

    const acao = $('#pop-acao');
    acao.removeAttribute('data-ir-ex');
    acao.removeAttribute('data-ir-aula');
    if (sk && L.temExercicio && L.temExercicio(sk.id)) {
      acao.hidden = false;
      acao.textContent = acesa ? 'Rever exercício' : 'Fazer o exercício';
      acao.setAttribute('data-ir-ex', sk.id);
    } else if (sk) {
      acao.hidden = false;
      acao.textContent = acesa ? 'Rever aula' : 'Ver a aula';
      acao.setAttribute('data-ir-aula', id);
    } else {
      acao.hidden = true;
    }

    const pop = $('#pop');
    pop.hidden = false;

    const sky = $('#sky').getBoundingClientRect();
    const r = pop.getBoundingClientRect();
    const px = ev && ev.clientX ? ev.clientX - sky.left : 40;
    const py = ev && ev.clientY ? ev.clientY - sky.top : 80;
    let left = px + 18;
    let top = py - r.height / 2;
    left = Math.max(12, Math.min(sky.width - r.width - 12, left));
    top = Math.max(12, Math.min(sky.height - r.height - 12, top));
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    pop.classList.add('on');

    $$('#mapa .star').forEach((g) => g.classList.toggle('sel', g.getAttribute('data-id') === id));
  }

  function fecharPop() {
    const pop = $('#pop');
    if (!pop) return;
    pop.classList.remove('on');
    pop.hidden = true;
    sel = null;
    $$('#mapa .star.sel').forEach((g) => g.classList.remove('sel'));
  }

  /* ---------------- teste: mini-exercícios corrigidos pela IA ---------------- */

  function suite(corpo) {
    return 'var out = [];\n' +
      'function check(nome, fn) {\n' +
      '  try { var r = fn(); out.push({ nome: nome, ok: r === true, detalhe: r === true ? "" : String(r || "falhou") }); }\n' +
      '  catch (e) { out.push({ nome: nome, ok: false, detalhe: e.message }); }\n' +
      '}\n' + corpo + '\nreturn out;';
  }

  const MINI = [
    {
      skill: 'lacos',
      titulo: 'Soma até N',
      enunciado: 'Complete <code>solucao(n)</code> para devolver a soma de 1 até <code>n</code>, usando um laço.',
      reqs: ['Use for ou while', 'Para n = 0, devolva 0'],
      starter: 'function solucao(n) {\n  // some 1 + 2 + ... + n com um laço\n\n}\n',
      testes: suite('check("soma até 3", function () { return solucao(3) === 6; });\ncheck("soma até 10", function () { return solucao(10) === 55; });\ncheck("n = 0 devolve 0", function () { return solucao(0) === 0; });'),
    },
    {
      skill: 'funcoes',
      titulo: 'Função que reaproveita função',
      enunciado: 'Crie uma função <code>quadrado(x)</code> e use ela dentro de <code>solucao(a, b)</code> para devolver <code>quadrado(a) + quadrado(b)</code>.',
      reqs: ['Declare a função quadrado', 'Chame quadrado dentro de solucao'],
      starter: 'function quadrado(x) {\n  // devolva x ao quadrado\n}\n\nfunction solucao(a, b) {\n  // use quadrado aqui\n\n}\n',
      testes: suite('check("3 e 4 dão 25", function () { return solucao(3, 4) === 25; });\ncheck("0 e 5 dão 25", function () { return solucao(0, 5) === 25; });\ncheck("1 e 1 dão 2", function () { return solucao(1, 1) === 2; });'),
    },
    {
      skill: 'listas',
      titulo: 'Último item da lista',
      enunciado: 'Complete <code>solucao(lista)</code> para devolver o último item da lista, ou <code>null</code> se ela estiver vazia.',
      reqs: ['Acesse o item pela posição', 'Lista vazia devolve null'],
      starter: 'function solucao(lista) {\n  // devolva o último item\n\n}\n',
      testes: suite('check("último de [1,2,3]", function () { return solucao([1, 2, 3]) === 3; });\ncheck("lista de um item", function () { return solucao(["a"]) === "a"; });\ncheck("lista vazia devolve null", function () { return solucao([]) === null; });'),
    },
    {
      skill: 'apis',
      titulo: 'Nomes que vieram da API',
      enunciado: 'A API devolveu um texto JSON como <code>{"usuarios":[{"nome":"Ana"},{"nome":"Bia"}]}</code>. Complete <code>solucao(texto)</code> para devolver a lista só com os nomes.',
      reqs: ['Transforme o texto em objeto (JSON.parse)', 'Devolva uma lista com os nomes'],
      starter: 'function solucao(texto) {\n  // leia o JSON e devolva ["Ana", "Bia"]\n\n}\n',
      testes: suite('check("dois usuários", function () { return JSON.stringify(solucao(\'{"usuarios":[{"nome":"Ana"},{"nome":"Bia"}]}\')) === \'["Ana","Bia"]\'; });\ncheck("um usuário", function () { return JSON.stringify(solucao(\'{"usuarios":[{"nome":"Caio"}]}\')) === \'["Caio"]\'; });\ncheck("nenhum usuário", function () { return solucao(\'{"usuarios":[]}\').length === 0; });'),
    },
    {
      skill: 'banco',
      titulo: 'Atualizar uma nota (UPDATE)',
      enunciado: 'Complete <code>solucao(alunos, id, nota)</code> para devolver uma lista nova com a nota do aluno daquele <code>id</code> atualizada, <b>sem alterar a lista original</b>.',
      reqs: ['Encontre o aluno pelo id', 'Não modifique a lista recebida', 'Id inexistente mantém tudo igual'],
      starter: 'function solucao(alunos, id, nota) {\n  // devolva a lista com a nota atualizada\n\n}\n',
      testes: suite('var alunos = [{ id: 1, nota: 8 }, { id: 2, nota: 5 }];\ncheck("atualiza o aluno 2", function () { var r = solucao(alunos, 2, 9); return r.length === 2 && r[1].nota === 9 && r[0].nota === 8; });\ncheck("não altera a lista original", function () { solucao(alunos, 2, 9); return alunos[1].nota === 5; });\ncheck("id inexistente mantém as notas", function () { var r = solucao(alunos, 99, 10); return r[0].nota === 8 && r[1].nota === 5; });'),
    },
    {
      skill: 'arquivos',
      titulo: 'Extensão do arquivo',
      enunciado: 'Complete <code>solucao(nome)</code> para devolver a extensão do arquivo, sem o ponto. Se não tiver extensão, devolva <code>""</code>.',
      reqs: ['Considere o último ponto do nome', 'Sem ponto devolve texto vazio'],
      starter: 'function solucao(nome) {\n  // "foto.final.png" -> "png"\n\n}\n',
      testes: suite('check("foto.final.png", function () { return solucao("foto.final.png") === "png"; });\ncheck("app.js", function () { return solucao("app.js") === "js"; });\ncheck("README sem extensão", function () { return solucao("README") === ""; });'),
    },
  ];

  const quiz = { lista: [], i: 0, res: [], busy: false, codigos: {}, passou: false };

  function plain(html) { return String(html || '').replace(/<[^>]+>/g, ''); }

  function abrirQuiz() {
    quiz.lista = MINI.filter((m) => !L.acesa(m.skill));
    quiz.i = 0;
    quiz.res = [];
    quiz.busy = false;
    const dlg = $('#quiz');
    renderQuiz();
    if (!dlg.open) dlg.showModal();
    try { localStorage.setItem(CHAVE_QUIZ, '1'); } catch {}
  }

  function fbQuiz(tipo, html) {
    const el = $('#quiz-fb');
    if (!tipo) { el.hidden = true; el.innerHTML = ''; el.className = 'quiz-fb'; return; }
    el.hidden = false;
    el.className = 'quiz-fb ' + tipo;
    el.innerHTML = html;
  }

  function ocupadoQuiz(on, texto) {
    quiz.busy = on;
    $('#quiz-enviar').disabled = on;
    $('#quiz-pular').disabled = on;
    $('#quiz-code').readOnly = on;
    const sp = $('#quiz-spin');
    sp.hidden = !on;
    if (texto) $('#quiz-spin-txt').textContent = texto;
  }

  function renderQuiz() {
    const dots = $('#quiz-dots');
    const num = $('#quiz-num');
    const body = $('#quiz-body');
    const res = $('#quiz-result');
    const dlg = $('#quiz');
    const total = quiz.lista.length;

    if (quiz.i < total) {
      dots.innerHTML = quiz.lista.map((_m, i) =>
        '<i class="' + (i < quiz.i ? 'done' : i === quiz.i ? 'now' : '') + '"></i>'
      ).join('');
      num.textContent = (quiz.i + 1) + ' / ' + total;
      body.hidden = false;
      res.hidden = true;
      dlg.classList.remove('fim');

      const m = quiz.lista[quiz.i];
      const sk = L.skill(m.skill);
      $('#quiz-kicker').textContent = 'teste · ' + (sk ? sk.nome : 'habilidade');
      $('#quiz-q').textContent = m.titulo;
      $('#quiz-sub').innerHTML = m.enunciado;
      $('#quiz-reqs').innerHTML = m.reqs.map((r) => '<li>' + esc(r) + '</li>').join('');
      $('#quiz-code').value = quiz.codigos[m.skill] || m.starter;
      fbQuiz(null);
      ocupadoQuiz(false);
      $('#quiz-spin').hidden = true;
      quiz.passou = false;
      $('#quiz-enviar').hidden = false;
      $('#quiz-pular').hidden = false;
      $('#quiz-pular').textContent = 'Ainda não sei';
      $('#quiz-prox').hidden = true;
      setTimeout(() => { try { $('#quiz-code').focus(); } catch {} }, 60);
      return;
    }

    // resultado
    const novas = quiz.res.filter((r) => r.ok).map((r) => L.skill(r.skill)).filter(Boolean);
    L.montarNav('habilidades');

    dots.innerHTML = quiz.lista.map(() => '<i class="done"></i>').join('');
    num.textContent = 'resultado';
    $('#quiz-kicker').textContent = 'teste · resultado';
    body.hidden = true;
    res.hidden = false;
    dlg.classList.add('fim');

    const faltam = MINI.filter((m) => !L.acesa(m.skill)).length;
    let titulo, sub;
    if (!total) {
      titulo = 'Você já passou em tudo';
      sub = 'Todas as estrelas que o teste cobre já estão acesas. As próximas vêm das aulas e dos projetos.';
    } else if (novas.length) {
      titulo = 'Acendi ' + novas.length + (novas.length === 1 ? ' estrela' : ' estrelas');
      sub = novas.map((s) => esc(s.nome)).join(' · ') +
        ' — a IA conferiu o seu código. Feche para ver o céu reagir.';
    } else {
      titulo = 'Tudo começa na raiz';
      sub = 'Sem problema: nenhuma estrela foi acesa agora. Cada uma tem um exercício esperando por você no mapa, e as aulas da trilha levam até elas.';
    }

    $('#quiz-result').innerHTML =
      '<div class="qr-top"><span class="qr-spark">✦</span><div>' +
        '<div class="kicker">seu céu agora</div><h3>' + titulo + '</h3></div></div>' +
      '<p class="qr-sub">' + sub + '</p>' +
      '<p class="qr-count"><b>' + L.estado.acesas.size + '</b> acesas · <b>' + faltam + '</b> ainda no teste</p>' +
      '<div class="quiz-actions">' +
        '<button class="btn primary" type="button" data-quiz-fechar>' + (novas.length ? 'Ver as estrelas acenderem' : 'Ver meu mapa') + '</button>' +
        '<a class="btn ghost" href="chat.html">Montar trilha com o Lunox</a>' +
        (faltam ? '<button class="btn ghost small" type="button" data-quiz-reset>' + (total ? 'Tentar as que faltam' : 'Refazer') + '</button>' : '') +
      '</div>';
  }

  function avancarQuiz() {
    if (quiz.busy) return;
    quiz.i++;
    renderQuiz();
  }

  async function corrigirComIA(m, codigo, resultadosLocais) {
    const sk = L.skill(m.skill) || {};
    const testesTxt = resultadosLocais.map((r) => 'OK - ' + r.nome).join('\n');
    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 45000);
    try {
      const r = await fetch('/api/teste-mapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          session: L.sessao(),
          skill: m.skill,
          skillNome: sk.nome || m.skill,
          titulo: m.titulo,
          enunciado: plain(m.enunciado),
          requisitos: m.reqs,
          codigo: codigo,
          testes: testesTxt,
          testesOk: true,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok || !data || typeof data.aprovado !== 'boolean') {
        throw new Error((data && data.error && (data.error.message || data.error.detail)) || ('HTTP ' + r.status));
      }
      return { aprovado: data.aprovado, comentario: String(data.comentario || data.texto || ''), local: false };
    } catch (e) {
      // sem a IA o teste não trava: vale a correção pelos testes do navegador
      return {
        aprovado: true,
        comentario: 'A IA não respondeu agora, então valeu a correção pelos testes do navegador.',
        local: true,
        motivo: e.name === 'AbortError' ? 'timeout' : (e.message || 'falha de rede'),
      };
    } finally {
      clearTimeout(abort);
    }
  }

  async function enviarResposta() {
    if (quiz.busy) return;
    const m = quiz.lista[quiz.i];
    if (!m) return;
    const codigo = $('#quiz-code').value;
    if (!codigo.trim()) { toast('Escreva sua solução primeiro'); return; }
    quiz.codigos[m.skill] = codigo;
    fbQuiz(null);

    ocupadoQuiz(true, 'rodando os testes…');
    const exec = await L.rodarCodigo(codigo, m.testes);

    if (!exec.ok) {
      ocupadoQuiz(false);
      fbQuiz('bad', '<b>Não consegui executar o código.</b><br><span class="tiny">' + esc(exec.erro) + '</span>');
      return;
    }
    const rs = exec.resultados || [];
    const falhas = rs.filter((r) => !r.ok);
    if (!rs.length || falhas.length) {
      ocupadoQuiz(false);
      fbQuiz('bad',
        '<b>Passou em ' + (rs.length - falhas.length) + ' de ' + rs.length + ' testes.</b><br>' +
        falhas.map((r) => '<span class="tiny">✗ ' + esc(r.nome) + (r.detalhe ? ' — ' + esc(r.detalhe) : '') + '</span>').join('<br>'));
      return;
    }

    // testes ok: agora a IA confere se o conceito foi usado de verdade
    let seg = 0;
    ocupadoQuiz(true, 'a IA está conferindo o seu código… 0s');
    const timer = setInterval(() => {
      seg++;
      $('#quiz-spin-txt').textContent = 'a IA está conferindo o seu código… ' + seg + 's';
    }, 1000);
    const r = await corrigirComIA(m, codigo, rs);
    clearInterval(timer);
    ocupadoQuiz(false);

    if (r.aprovado) {
      const acendeu = L.acender(m.skill);
      if (acendeu) excluidas.add(m.skill);
      const sk = L.skill(m.skill);
      const pend = sk && L.exerciciosPendentes ? L.exerciciosPendentes(sk.star).length : 0;
      quiz.res.push({ skill: m.skill, ok: true });
      quiz.passou = true;
      fbQuiz('ok', '<b>Passou ✓</b> ' +
        (acendeu
          ? esc(r.comentario || 'Boa! A estrela acendeu.')
          : pend
            ? 'Faltam ' + pend + ' exercício(s) na trilha para acender a estrela.'
            : esc(r.comentario || 'Boa!')) +
        (r.local ? '<br><span class="tiny">correção local</span>' : ''));
      $('#quiz-enviar').hidden = true;
      $('#quiz-pular').hidden = true;
      const ultima = quiz.i >= quiz.lista.length - 1;
      $('#quiz-prox').textContent = ultima ? 'Ver resultado' : 'Próxima →';
      $('#quiz-prox').hidden = false;
    } else {
      fbQuiz('bad', '<b>Quase.</b> ' + esc(r.comentario || 'A IA pediu um ajuste antes de acender a estrela.') +
        '<br><span class="tiny">Ajuste o código e envie de novo, ou pule.</span>');
      $('#quiz-pular').textContent = 'Pular';
    }
  }

  function pularQuiz() {
    if (quiz.busy) return;
    const m = quiz.lista[quiz.i];
    if (m) quiz.res.push({ skill: m.skill, ok: false });
    avancarQuiz();
  }

  /* ---------------- carregamento ---------------- */

  async function carregarMapa() {
    const box = $('#mapa');
    try {
      const [svgRes, dadosRes] = await Promise.all([
        fetch('lunox_assets_mapa/mapa/mapa_estrelas.svg'),
        fetch('lunox_assets_mapa/dados/mapa_dados.json'),
      ]);
      if (!svgRes.ok) throw new Error('mapa HTTP ' + svgRes.status);
      if (!dadosRes.ok) throw new Error('dados HTTP ' + dadosRes.status);

      const svg = await svgRes.text();
      mapaDados = await dadosRes.json();
      indexar();

      box.innerHTML = svg;
      const s = box.querySelector('svg');
      if (s) {
        s.setAttribute('width', MAPA_W);
        s.setAttribute('height', MAPA_H);
        s.removeAttribute('style');
      }

      pintarMapa({ animar: false });
      enquadrarVisiveis(false);
      ligarInteracoes();
      if (excluidas.size) {
        // veio de uma aula/projeto concluído: toca o desbloqueio das estrelas novas
        setTimeout(() => reproduzirPendentes().then(abrirQuizUmaVezSo), 900);
      } else {
        abrirQuizUmaVezSo();
      }
    } catch (e) {
      box.innerHTML = '<div class="sky-fail"><p>Não consegui abrir o céu agora.</p>' +
        '<p class="tiny">' + esc(e.message) + '</p>' +
        '<button class="btn small" type="button" onclick="location.reload()">Tentar de novo</button></div>';
    }
  }

  function abrirQuizUmaVezSo() {
    let visto = false;
    try { visto = !!localStorage.getItem(CHAVE_QUIZ); } catch {}
    if (visto) return;
    setTimeout(() => {
      if (!$('#quiz').open) abrirQuiz();
    }, 1300);
  }

  function ligarInteracoes() {
    const sky = $('#sky');
    const mapa = $('#mapa');
    let arrastando = false;
    let moveu = false;
    let ini = null;

    sky.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.sky-brand, .sky-tools, .sky-cta, .sky-foot, .star-pop')) return;
      arrastando = true;
      moveu = false;
      ini = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
      sky.classList.add('arrastando');
    });

    window.addEventListener('pointermove', (e) => {
      if (!arrastando) return;
      const dx = e.clientX - ini.x;
      const dy = e.clientY - ini.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moveu = true;
      cam.x = ini.cx + dx;
      cam.y = ini.cy + dy;
      limitarCamera();
      mapa.classList.add('sem-anim');
      mapa.style.transform = 'translate(' + cam.x + 'px,' + cam.y + 'px) scale(' + cam.s + ')';
    });

    window.addEventListener('pointerup', () => {
      if (!arrastando) return;
      arrastando = false;
      sky.classList.remove('arrastando');
      mapa.classList.remove('sem-anim');
    });

    sky.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomEm(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY);
    }, { passive: false });

    // clique em estrela (só se não houve arrasto)
    sky.addEventListener('click', (e) => {
      const star = e.target.closest('#mapa .star');
      if (!star) {
        if (!e.target.closest('.star-pop') && moveu) return;
        if (!e.target.closest('.star-pop')) fecharPop();
        return;
      }
      if (moveu) { moveu = false; return; }
      abrirPop(star.getAttribute('data-id'), e);
    });

    window.addEventListener('resize', () => {
      limitarCamera();
      aplicarCamera(false);
    });
  }

  /* ---------------- controles ---------------- */

  function ligarControles() {
    $('#zoom-in').addEventListener('click', () => zoomEm(1.18));
    $('#zoom-out').addEventListener('click', () => zoomEm(1 / 1.18));
    $('#recentrar').addEventListener('click', () => {
      fecharPop();
      enquadrarVisiveis(true);
    });

    $('#btn-teste').addEventListener('click', abrirQuiz);
    $('#quiz-x').addEventListener('click', () => $('#quiz').close());
    $('#quiz-enviar').addEventListener('click', enviarResposta);
    $('#quiz-pular').addEventListener('click', pularQuiz);
    $('#quiz-prox').addEventListener('click', avancarQuiz);
    $('#quiz-code').addEventListener('input', () => {
      const m = quiz.lista[quiz.i];
      if (m) quiz.codigos[m.skill] = $('#quiz-code').value;
    });
    $('#quiz').addEventListener('close', () => {
      if (excluidas.size) reproduzirPendentes();
      else enquadrarVisiveis(true);
    });
    $('#quiz').addEventListener('click', (e) => {
      const dlg = $('#quiz');
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-quiz-fechar]')) {
        $('#quiz').close();
        return;
      }

      if (e.target.closest('[data-quiz-reset]')) {
        quiz.i = 0;
        quiz.respostas = [];
        renderQuiz();
        return;
      }

      const aula = e.target.closest('[data-ir-aula]');
      if (aula) {
        location.href = 'sua-trilha.html?estrela=' + encodeURIComponent(aula.getAttribute('data-ir-aula'));
        return;
      }

      const ir = e.target.closest('[data-ir-ex]');
      if (ir) {
        location.href = 'programar.html?skill=' + encodeURIComponent(ir.getAttribute('data-ir-ex'));
        return;
      }

      // clique numa estrela abre o popover no handler do céu
      if (e.target.closest('#mapa .star')) return;

      if (!e.target.closest('#pop')) fecharPop();
    });

    document.addEventListener('keydown', (e) => {
      const digitando = /^(TEXTAREA|INPUT|SELECT)$/.test((e.target && e.target.tagName) || '') ||
        $('#quiz').open;
      if (e.key === 'Escape') fecharPop();
      if (digitando) return;
      if (e.key === '+' || e.key === '=') zoomEm(1.15);
      if (e.key === '-') zoomEm(1 / 1.15);
    });
  }

  /* ---------------- boot ---------------- */

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && L.pendentesAnim().length) location.reload();
  });

  ligarControles();
  carregarMapa();
})();
