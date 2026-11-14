/* ============================================================
   aulas-estrelas.js — leitura/normalização do conteúdo das estrelas.

   Junta duas fontes:
     1. estrelas-conteudo.js  (window.LUNOX_CONTEUDO — grupos: vídeo + desafio)
     2. aulas-yt.js           (window.LUNOX_AULAS — formato antigo, 1 vídeo)

   E ainda aceita um RASCUNHO salvo no navegador (o que a admin.html edita
   antes de você baixar/salvar o arquivo). O rascunho tem prioridade.

   API: window.LUNOX_AULAS_API
   ============================================================ */
(function (global) {
  'use strict';

  const CHAVE_RASCUNHO = 'lunox_conteudo_v1';
  const LIMITES = { titulo: 120, resumo: 300, enunciado: 1200, requisito: 160, dica: 300, codigo: 20000, arquivo: 60 };

  const txt = (s, n) => String(s == null ? '' : s).replace(/[ \t]+/g, ' ').trim().slice(0, n || 500);
  const bloco = (s, n) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').slice(0, n || LIMITES.codigo);

  /* ---------------- YouTube ---------------- */

  function ytId(fonte) {
    const s = String(fonte || '');
    const m = s.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/|\/v\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(s.trim()) ? s.trim() : null;
  }

  function ytInicio(fonte) {
    const m = String(fonte || '').match(/[?&#](?:t|start)=(\d+)/);
    return m ? Number(m[1]) : 0;
  }

  function normalizarVideo(v) {
    const bruto = typeof v === 'string' ? v : (v && (v.yt || v.url || v.embed || v.src)) || '';
    const id = ytId(bruto);
    if (!id) return null;
    return {
      id,
      inicio: ytInicio(bruto),
      titulo: txt(v && v.titulo, LIMITES.titulo),
      url: 'https://www.youtube.com/watch?v=' + id,
    };
  }

  function srcEmbed(video) {
    return 'https://www.youtube-nocookie.com/embed/' + video.id +
      '?rel=0&modestbranding=1' + (video.inicio ? '&start=' + video.inicio : '');
  }

  /* ---------------- grupos ---------------- */

  function normalizarDesafio(d) {
    if (!d || typeof d !== 'object') return null;
    const desafio = {
      titulo: txt(d.titulo, LIMITES.titulo),
      enunciado: String(d.enunciado == null ? '' : d.enunciado).trim().slice(0, LIMITES.enunciado),
      requisitos: (Array.isArray(d.requisitos) ? d.requisitos : [])
        .map((r) => txt(r, LIMITES.requisito)).filter(Boolean).slice(0, 8),
      dica: txt(d.dica, LIMITES.dica),
    };
    return desafio.titulo || desafio.enunciado ? desafio : null;
  }

  /** Linguagem do exercício. O padrão novo é Python; o código antigo é detectado. */
  function linguagemDe(x) {
    const bruta = String((x && x.linguagem) || '').trim().toLowerCase();
    if (bruta === 'python' || bruta === 'javascript' || bruta === 'typescript' || bruta === 'blocos') return bruta;
    const codigo = String((x && (x.starter || x.solucao)) || '');
    if (/\bdef\s+solucao\s*\(/.test(codigo)) return 'python';
    if (/\bfunction\s+solucao\s*\(/.test(codigo)) return 'javascript';
    return 'python';
  }

  /** Arquivos de apoio de um exercício (o principal é concatenado por último). */
  function normalizarArquivos(lista, linguagem) {
    if (!Array.isArray(lista) || linguagem === 'blocos') return [];
    const ext = linguagem === 'python' ? '.py' : linguagem === 'typescript' ? '.ts' : '.js';
    const out = lista.slice(0, 6).map((a, i) => {
      const bruto = a && typeof a === 'object' ? a : {};
      return {
        nome: txt(bruto.nome, LIMITES.arquivo) || 'arquivo' + (i + 1) + ext,
        principal: !!bruto.principal,
        starter: bloco(bruto.starter),
        solucao: bloco(bruto.solucao || bruto.starter),
      };
    }).filter((a) => a.starter || a.solucao);
    if (out.length && !out.some((a) => a.principal)) out[out.length - 1].principal = true;
    return out;
  }

  /**
   * Exercício de código ou escrito.
   * - com `testes`: o editor abre e corrige automaticamente;
   * - sem `testes`: a pessoa lê e marca como concluído na trilha.
   */
  function normalizarExercicio(x) {
    if (!x || typeof x !== 'object') return null;
    const requisitos = Array.isArray(x.requisitos)
      ? x.requisitos
      : String(x.requisitos == null ? '' : x.requisitos).split('\n');
    const linguagem = linguagemDe(x);
    const ex = {
      titulo: txt(x.titulo, LIMITES.titulo),
      enunciado: String(x.enunciado == null ? '' : x.enunciado).trim().slice(0, LIMITES.enunciado),
      requisitos: requisitos.map((r) => txt(r, LIMITES.requisito)).filter(Boolean).slice(0, 8),
      dica: txt(x.dica, LIMITES.dica),
      linguagem: linguagem,
      starter: bloco(x.starter),
      solucao: bloco(x.solucao),
      testes: bloco(x.testes),
      arquivos: normalizarArquivos(x.arquivos, linguagem),
    };
    const temCodigo = !!(ex.starter.trim() || ex.solucao.trim() || ex.testes.trim());
    const temTexto = !!(ex.titulo || ex.enunciado);
    return temCodigo || temTexto ? ex : null;
  }

  /** Completa os testes com o helper `check` quando o autor escreveu só as verificações. */
  function testesComSuite(testes) {
    const t = String(testes == null ? '' : testes).replace(/\r\n?/g, '\n');
    if (!t.trim() || /function\s+check\s*\(/.test(t)) return t;
    return 'var out = [];\n' +
      'function check(nome, fn) {\n' +
      '  try {\n' +
      '    var r = fn();\n' +
      '    out.push({ nome: nome, ok: r === true, detalhe: r === true ? "" : String(r || "falhou") });\n' +
      '  } catch (e) {\n' +
      '    out.push({ nome: nome, ok: false, detalhe: e.message });\n' +
      '  }\n' +
      '}\n' + t + '\nreturn out;';
  }

  function normalizarGrupo(g, indice) {
    if (!g || typeof g !== 'object') return null;
    const videos = []
      .concat(g.videos || g.video || g.yt || [])
      .map(normalizarVideo)
      .filter(Boolean);
    const grupo = {
      id: txt(g.id, 40) || 'g' + (indice + 1),
      titulo: txt(g.titulo, LIMITES.titulo) || 'Aula ' + (indice + 1),
      resumo: txt(g.resumo, LIMITES.resumo),
      videos,
      desafio: normalizarDesafio(g.desafio),
      exercicio: normalizarExercicio(g.exercicio),
    };
    return grupo.videos.length || grupo.desafio || grupo.exercicio ? grupo : null;
  }

  /** Converte o formato antigo (aulas-yt.js) em grupos. */
  function gruposLegado(sid) {
    const bruto = (global.LUNOX_AULAS || {})[sid];
    if (!bruto) return [];
    if (typeof bruto === 'string') {
      const g = normalizarGrupo({ videos: [bruto] }, 0);
      return g ? [g] : [];
    }
    if (Array.isArray(bruto)) {
      const g = normalizarGrupo({ videos: bruto }, 0);
      return g ? [g] : [];
    }
    const g = normalizarGrupo(bruto, 0);
    return g ? [g] : [];
  }

  /* ---------------- dados ---------------- */

  function vazio() {
    return { versao: 1, atualizado: '', estrelas: {} };
  }

  function arquivo() {
    const c = global.LUNOX_CONTEUDO;
    return c && typeof c === 'object' && c.estrelas ? c : vazio();
  }

  function rascunho() {
    try {
      const d = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO));
      return d && typeof d === 'object' && d.estrelas ? d : null;
    } catch {
      return null;
    }
  }

  function dados() {
    const r = rascunho();
    if (r) return r;
    const a = arquivo();
    return { versao: a.versao || 1, atualizado: a.atualizado || '', estrelas: a.estrelas || {} };
  }

  function salvarRascunho(obj) {
    const limpo = { versao: 1, atualizado: new Date().toISOString().slice(0, 10), estrelas: (obj && obj.estrelas) || {} };
    try { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(limpo)); } catch { /* sem localStorage */ }
    return limpo;
  }

  function descartarRascunho() {
    try { localStorage.removeItem(CHAVE_RASCUNHO); } catch { /* ignore */ }
  }

  function temRascunho() { return !!rascunho(); }

  /** Grupos publicados/editados de uma estrela (rascunho > arquivo > legado). */
  function gruposDe(sid) {
    const d = dados();
    const alvo = d.estrelas && d.estrelas[sid];
    if (alvo && Array.isArray(alvo.grupos)) {
      const grupos = alvo.grupos.map(normalizarGrupo).filter(Boolean);
      if (grupos.length) return grupos;
    }
    return gruposLegado(sid);
  }

  /** Quantos grupos cada estrela tem (para os selos da admin). */
  function resumo() {
    const d = dados();
    const out = {};
    Object.keys(d.estrelas || {}).forEach((sid) => {
      const g = (d.estrelas[sid] && d.estrelas[sid].grupos) || [];
      const n = g.map(normalizarGrupo).filter(Boolean).length;
      if (n) out[sid] = n;
    });
    return out;
  }

  /** Exercício de um grupo (índice), já normalizado. */
  function exercicioDe(sid, indice) {
    const grupo = gruposDe(sid)[indice];
    const ex = grupo ? grupo.exercicio : null;
    // a estrela FU1 (Lógica de programação) é sempre em blocos
    if (ex && sid === 'FU1') ex.linguagem = 'blocos';
    return ex;
  }

  /** Desafio final da estrela (opcional), já normalizado. */
  function desafioFinalDe(sid) {
    const d = dados();
    const alvo = d.estrelas && d.estrelas[sid];
    const ex = alvo ? normalizarExercicio(alvo.desafioFinal) : null;
    if (ex && sid === 'FU1') ex.linguagem = 'blocos';
    return ex;
  }

  /**
   * Todos os exercícios que contam para acender a estrela.
   * Cada item: { chave, tipo: 'grupo'|'final', indice, titulo, linguagem, codigo }
   */
  function exerciciosDe(sid) {
    const out = [];
    gruposDe(sid).forEach((g, i) => {
      if (!g.exercicio) return;
      out.push({
        chave: 'g' + i,
        tipo: 'grupo',
        indice: i,
        titulo: g.exercicio.titulo || g.titulo || 'Exercício ' + (i + 1),
        linguagem: g.exercicio.linguagem || 'python',
        codigo: !!g.exercicio.testes.trim(),
      });
    });
    const final = desafioFinalDe(sid);
    if (final) {
      out.push({
        chave: 'final',
        tipo: 'final',
        indice: -1,
        titulo: final.titulo || 'Desafio final',
        linguagem: final.linguagem || 'python',
        codigo: !!final.testes.trim(),
      });
    }
    return out;
  }

  function temExercicios(sid) {
    return exerciciosDe(sid).length > 0;
  }

  /** Salva um desafio gerado dentro do grupo (rascunho). */
  function salvarDesafio(sid, indice, desafio, resumo) {
    const d = JSON.parse(JSON.stringify(dados()));
    d.estrelas = d.estrelas || {};
    const alvo = d.estrelas[sid] || (d.estrelas[sid] = { grupos: [] });
    if (!Array.isArray(alvo.grupos) || !alvo.grupos.length) {
      const legado = gruposLegado(sid);
      alvo.grupos = legado.length ? JSON.parse(JSON.stringify(legado)) : [{ titulo: 'Aula 1', videos: [] }];
    }
    const g = alvo.grupos[indice];
    if (!g) return null;
    g.desafio = desafio;
    // o resumo da aula também vem da IA — só entra se ainda estiver vazio
    if (resumo && !String(g.resumo || '').trim()) g.resumo = txt(resumo, LIMITES.resumo);
    return salvarRascunho(d);
  }

  /** Tipo da estrela: 'codigo' (padrão) ou 'dissertativa'. */
  function tipoDe(sid) {
    const d = dados();
    const alvo = d.estrelas && d.estrelas[sid];
    return alvo && alvo.tipo === 'dissertativa' ? 'dissertativa' : 'codigo';
  }

  /* ---------------- arquivo gerado ---------------- */

  function exportarArquivo() {
    const d = dados();
    const corpo = JSON.stringify({ versao: 1, atualizado: new Date().toISOString().slice(0, 10), estrelas: d.estrelas || {} }, null, 2);
    return [
      '/* ============================================================',
      '   Conteúdo das estrelas — AULAS E DESAFIOS',
      '',
      '   Gerado pela página admin.html. Cada estrela pode ter vários grupos;',
      '   cada grupo tem um vídeo do YouTube, um desafio e, opcionalmente, um',
      '   exercício de código. A estrela também pode ter um desafio final.',
      '',
      '   A estrela só acende quando todos os exercícios forem resolvidos.',
      '   Substitua este arquivo pelo que a admin baixou e faça o deploy.',
      '   ============================================================ */',
      'window.LUNOX_CONTEUDO = ' + corpo + ';',
      '',
    ].join('\n');
  }

  /* ---------------- IA ---------------- */

  const MOLDE_PADRAO = [
    'Um mini-exercício no nível da aula, que a pessoa resolve em 15–30 minutos.',
    'Use só o que as aulas anteriores e esta já ensinaram — nada de recursos que ela ainda não viu.',
    'Situação ligada ao projeto dela, depois o que precisa devolver.',
    'De 2 a 4 requisitos curtos e verificáveis.',
    'Uma dica que orienta sem entregar a solução.',
  ].join('\n');

  /** Habilidades que a pessoa já acendeu (nomes), para a IA não pedir o que ela não sabe. */
  function habilidadesSabidas() {
    const L = global.LUNOX;
    if (!L || !L.estado || !L.estado.acesas) return [];
    const out = [];
    L.estado.acesas.forEach((id) => {
      const s = L.skill && L.skill(id);
      if (s && s.nome) out.push(s.nome);
    });
    return out.slice(0, 40);
  }

  async function gerarDesafio({ sid, objetivo, contexto, linguagem, molde, session, tipo, grupo, aulaResumo }) {
    const e = (global.LUNOX && global.LUNOX.estrela && global.LUNOX.estrela(sid)) || { id: sid, nome: sid };
    const constelacao = (global.LUNOX && global.LUNOX.CONSTELACOES && global.LUNOX.CONSTELACOES[e.raiz]) || {};
    const r = await fetch('/api/desafio-estrela', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: session || 'admin',
        estrela: { id: e.id, nome: e.nome, nivel: e.nivelNome || '', constelacao: constelacao.nome || e.raiz || '' },
        objetivo: txt(objetivo, 400),
        contexto: txt(contexto, 400),
        linguagem: txt(linguagem, 40),
        molde: String(molde || '').slice(0, 600),
        tipo: tipo === 'dissertativa' ? 'dissertativa' : 'codigo',
        grupo: txt(grupo, 120),
        aulaResumo: txt(aulaResumo, 400),
        sabidas: habilidadesSabidas(),
      }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data || !data.desafio) {
      throw new Error((data && data.error && data.error.message) || ('HTTP ' + r.status));
    }
    return {
      desafio: data.desafio,
      resumo: txt(data.resumo, LIMITES.resumo),
      tipo: data.tipo === 'dissertativa' ? 'dissertativa' : 'codigo',
    };
  }

  global.LUNOX_AULAS_API = {
    LIMITES,
    MOLDE_PADRAO,
    ytId, ytInicio, srcEmbed,
    normalizarGrupo, normalizarVideo, normalizarDesafio, normalizarExercicio,
    linguagemDe, testesComSuite,
    gruposDe, gruposLegado, tipoDe,
    exercicioDe, desafioFinalDe, exerciciosDe, temExercicios,
    dados, arquivo, salvarRascunho, descartarRascunho, temRascunho,
    resumo, salvarDesafio, exportarArquivo, gerarDesafio,
  };
})(window);
