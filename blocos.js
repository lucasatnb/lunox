/* ============================================================
   blocos.js — programação em blocos do Lunox

   Usado pela estrela FU1 (Lógica de programação): é a única estrela
   que programa com blocos em vez de texto.

   API: window.LUNOX_BLOCOS
     criar(host, { programa, onChange, compacto }) -> {
       programa(), definir(p), paraTexto(), destruir()
     }
     interpretar(programa) -> { ok, saida: [..], erro }
     rodarTestes(programa, testes) -> { ok, resultados, logs, erro }
     paraTexto(programa)
     programaVazio()
     deJSON(texto)
     paraJSON(programa)

   O programa é uma lista de blocos:
     { tipo: 'diga', valor: '"Olá"' }
     { tipo: 'definir', nome: 'n', valor: '1' }
     { tipo: 'mudar', nome: 'n', valor: '1' }
     { tipo: 'repetir', vezes: '3', corpo: [...] }
     { tipo: 'se', cond: 'n % 2 == 0', corpo: [...], senao: [...] }
     { tipo: 'enquanto', cond: 'n < 5', corpo: [...] }

   Os valores são expressões curtas: "texto", 12, n, n + 1, n % 2 == 0,
   n > 3 e n < 9, nao terminou, (n + 1) * 2.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- tipos de bloco ---------------- */

  const TIPOS = {
    diga: { grupo: 'mostrar', cor: '#6d4bff' },
    definir: { grupo: 'variaveis', cor: '#c98116' },
    mudar: { grupo: 'variaveis', cor: '#c98116' },
    repetir: { grupo: 'controle', cor: '#1f9d63' },
    se: { grupo: 'controle', cor: '#1f9d63' },
    enquanto: { grupo: 'controle', cor: '#1f9d63' },
  };

  const PALETA = [
    {
      grupo: 'Mostrar', classe: 't-mostrar', itens: [
        { tipo: 'diga', texto: 'diga …' },
      ],
    },
    {
      grupo: 'Variáveis', classe: 't-variaveis', itens: [
        { tipo: 'definir', texto: 'defina … como …' },
        { tipo: 'mudar', texto: 'mude … em …' },
      ],
    },
    {
      grupo: 'Controle', classe: 't-controle', itens: [
        { tipo: 'repetir', texto: 'repita … vezes' },
        { tipo: 'se', texto: 'se … então' },
        { tipo: 'enquanto', texto: 'enquanto …' },
      ],
    },
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function novoBloco(tipo) {
    if (tipo === 'diga') return { tipo: 'diga', valor: '"Olá"' };
    if (tipo === 'definir') return { tipo: 'definir', nome: 'n', valor: '1' };
    if (tipo === 'mudar') return { tipo: 'mudar', nome: 'n', valor: '1' };
    if (tipo === 'repetir') return { tipo: 'repetir', vezes: '3', corpo: [] };
    if (tipo === 'se') return { tipo: 'se', cond: 'n % 2 == 0', corpo: [], senao: [] };
    return { tipo: 'enquanto', cond: 'n < 5', corpo: [] };
  }

  /* ---------------- normalização ---------------- */

  function normalizarPrograma(p) {
    let lista = p;
    if (typeof lista === 'string') {
      try { lista = JSON.parse(lista); } catch (e) { lista = []; }
    }
    if (!Array.isArray(lista)) return [];
    return lista.map(normalizarBloco).filter(Boolean);
  }

  function normalizarBloco(b) {
    if (!b || typeof b !== 'object' || !TIPOS[b.tipo]) return null;
    const out = { tipo: b.tipo };
    if (b.tipo === 'diga') {
      out.valor = String(b.valor == null ? '' : b.valor);
    } else if (b.tipo === 'definir' || b.tipo === 'mudar') {
      out.nome = String(b.nome == null ? 'n' : b.nome);
      out.valor = String(b.valor == null ? '' : b.valor);
    } else if (b.tipo === 'repetir') {
      out.vezes = String(b.vezes == null ? '3' : b.vezes);
      out.corpo = normalizarPrograma(b.corpo);
    } else if (b.tipo === 'se') {
      out.cond = String(b.cond == null ? '' : b.cond);
      out.corpo = normalizarPrograma(b.corpo);
      out.senao = normalizarPrograma(b.senao);
    } else {
      out.cond = String(b.cond == null ? '' : b.cond);
      out.corpo = normalizarPrograma(b.corpo);
    }
    return out;
  }

  function paraJSON(programa) {
    return JSON.stringify(normalizarPrograma(programa));
  }

  function deJSON(texto) {
    if (texto == null || String(texto).trim() === '') return [];
    return normalizarPrograma(texto);
  }

  /* ---------------- expressões ---------------- */

  const OPS = ['==', '!=', '>=', '<=', '>', '<', '=', '+', '-', '*', '/', '%', '(', ')', '!'];

  function tokenizar(src) {
    const t = [];
    const s = String(src == null ? '' : src);
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }

      if (c === '"' || c === "'") {
        const q = c;
        let v = '';
        let fechou = false;
        i++;
        while (i < s.length) {
          const d = s[i];
          if (d === '\\') { v += s[i + 1] || ''; i += 2; continue; }
          if (d === q) { i++; fechou = true; break; }
          v += d;
          i++;
        }
        if (!fechou) throw new Error('faltou fechar as aspas');
        t.push({ k: 'txt', v: v });
        continue;
      }

      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const bruto = s.slice(i, j);
        const num = Number(bruto);
        if (!isFinite(num)) throw new Error('número inválido: ' + bruto);
        t.push({ k: 'num', v: num });
        i = j;
        continue;
      }

      if (/[A-Za-zÀ-ÿ_]/.test(c)) {
        let j = i;
        while (j < s.length && /[A-Za-zÀ-ÿ0-9_]/.test(s[j])) j++;
        t.push({ k: 'id', v: s.slice(i, j) });
        i = j;
        continue;
      }

      const op = OPS.find((o) => s.startsWith(o, i));
      if (op) { t.push({ k: 'op', v: op }); i += op.length; continue; }
      throw new Error('não entendi o símbolo "' + c + '"');
    }
    t.push({ k: 'fim' });
    return t;
  }

  function analisar(src) {
    const t = tokenizar(src);
    let p = 0;
    const peek = () => t[p];
    const come = () => t[p++];
    const ehOp = (v) => { const x = peek(); return x.k === 'op' && x.v === v; };
    const ehId = (v) => { const x = peek(); return x.k === 'id' && x.v.toLowerCase() === v; };

    function expressao() { return ou(); }

    function ou() {
      let a = e();
      while (ehId('ou')) { come(); a = { t: 'ou', a: a, b: e() }; }
      return a;
    }

    function e() {
      let a = cmp();
      while (ehId('e')) { come(); a = { t: 'e', a: a, b: cmp() }; }
      return a;
    }

    function cmp() {
      const a = soma();
      const x = peek();
      if (x.k === 'op' && ['==', '!=', '>=', '<=', '>', '<', '='].indexOf(x.v) >= 0) {
        come();
        return { t: 'cmp', op: x.v === '=' ? '==' : x.v, a: a, b: soma() };
      }
      return a;
    }

    function soma() {
      let a = mult();
      while (peek().k === 'op' && (peek().v === '+' || peek().v === '-')) {
        const op = come().v;
        a = { t: 'op', op: op, a: a, b: mult() };
      }
      return a;
    }

    function mult() {
      let a = unario();
      while (peek().k === 'op' && ['*', '/', '%'].indexOf(peek().v) >= 0) {
        const op = come().v;
        a = { t: 'op', op: op, a: a, b: unario() };
      }
      return a;
    }

    function unario() {
      if (ehOp('-')) { come(); return { t: 'neg', a: unario() }; }
      if (ehId('nao') || ehId('não') || ehOp('!')) { come(); return { t: 'nao', a: unario() }; }
      return primario();
    }

    function primario() {
      const x = come();
      if (x.k === 'num') return { t: 'num', v: x.v };
      if (x.k === 'txt') return { t: 'txt', v: x.v };
      if (x.k === 'id') {
        const l = x.v.toLowerCase();
        if (l === 'verdadeiro' || l === 'true') return { t: 'bool', v: true };
        if (l === 'falso' || l === 'false') return { t: 'bool', v: false };
        return { t: 'var', v: x.v };
      }
      if (x.k === 'op' && x.v === '(') {
        const a = expressao();
        if (!ehOp(')')) throw new Error('faltou fechar o parêntese');
        come();
        return a;
      }
      throw new Error(x.k === 'fim' ? 'falta um valor' : 'falta um valor perto de "' + (x.v || '') + '"');
    }

    const arvore = expressao();
    if (peek().k !== 'fim') throw new Error('sobrou "' + (peek().v || '') + '" na expressão');
    return arvore;
  }

  function fmt(v) {
    if (v === true) return 'verdadeiro';
    if (v === false) return 'falso';
    if (v == null) return '';
    if (typeof v === 'number') {
      if (!isFinite(v)) return String(v);
      return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e10) / 1e10);
    }
    return String(v);
  }

  function num(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const n = Number(fmt(v).trim().replace(',', '.'));
    return isFinite(n) ? n : 0;
  }

  function verdade(v) {
    if (typeof v === 'string') return v.trim() !== '' && v.trim().toLowerCase() !== 'falso';
    return !!v;
  }

  function avaliarNo(no, vars) {
    switch (no.t) {
      case 'num': return no.v;
      case 'txt': return no.v;
      case 'bool': return no.v;
      case 'var':
        if (!(no.v in vars)) {
          throw new Error('a variável "' + no.v + '" ainda não existe — crie com "defina ' + no.v + ' como …"');
        }
        return vars[no.v];
      case 'neg': return -num(avaliarNo(no.a, vars));
      case 'nao': return !verdade(avaliarNo(no.a, vars));
      case 'e': return verdade(avaliarNo(no.a, vars)) && verdade(avaliarNo(no.b, vars));
      case 'ou': return verdade(avaliarNo(no.a, vars)) || verdade(avaliarNo(no.b, vars));
      case 'op': {
        const a = avaliarNo(no.a, vars);
        const b = avaliarNo(no.b, vars);
        if (no.op === '+') {
          return (typeof a === 'string' || typeof b === 'string') ? fmt(a) + fmt(b) : num(a) + num(b);
        }
        if (no.op === '-') return num(a) - num(b);
        if (no.op === '*') return num(a) * num(b);
        if (no.op === '/') {
          if (num(b) === 0) throw new Error('divisão por zero');
          return num(a) / num(b);
        }
        if (no.op === '%') {
          if (num(b) === 0) throw new Error('resto de divisão por zero');
          return num(a) % num(b);
        }
        break;
      }
      case 'cmp': {
        const a = avaliarNo(no.a, vars);
        const b = avaliarNo(no.b, vars);
        const numeros = typeof a === 'number' && typeof b === 'number';
        switch (no.op) {
          case '==': return numeros ? a === b : fmt(a) === fmt(b);
          case '!=': return numeros ? a !== b : fmt(a) !== fmt(b);
          case '>': return numeros ? a > b : fmt(a) > fmt(b);
          case '<': return numeros ? a < b : fmt(a) < fmt(b);
          case '>=': return numeros ? a >= b : fmt(a) >= fmt(b);
          case '<=': return numeros ? a <= b : fmt(a) <= fmt(b);
        }
        break;
      }
    }
    throw new Error('expressão não suportada');
  }

  /* ---------------- interpretador ---------------- */

  const MAX_PASSOS = 200000;
  const MAX_SAIDA = 5000;

  function interpretar(programa) {
    const prog = normalizarPrograma(programa);
    const saida = [];
    const vars = Object.create(null);
    const cache = Object.create(null);
    let passos = 0;

    function arvore(src) {
      const k = String(src == null ? '' : src);
      if (!(k in cache)) cache[k] = analisar(k);
      return cache[k];
    }

    function valor(src) { return avaliarNo(arvore(src), vars); }

    function executarLista(lista) {
      for (let i = 0; i < lista.length; i++) executar(lista[i]);
    }

    function executar(b) {
      passos++;
      if (passos > MAX_PASSOS) {
        throw new Error('O programa ficou preso num laço — verifique se ele tem fim.');
      }
      switch (b.tipo) {
        case 'diga':
          if (saida.length >= MAX_SAIDA) throw new Error('O programa mostrou coisa demais.');
          saida.push(fmt(valor(b.valor)));
          return;
        case 'definir': {
          const nome = String(b.nome || '').trim();
          if (!nome) throw new Error('Escolha um nome para a variável.');
          vars[nome] = valor(b.valor);
          return;
        }
        case 'mudar': {
          const nome = String(b.nome || '').trim();
          if (!nome) throw new Error('Escolha um nome para a variável.');
          vars[nome] = num(vars[nome] == null ? 0 : vars[nome]) + num(valor(b.valor));
          return;
        }
        case 'repetir': {
          const n = Math.floor(num(valor(b.vezes)));
          if (!isFinite(n)) throw new Error('O número de repetições não é válido.');
          if (n < 0) throw new Error('O número de repetições não pode ser negativo.');
          for (let i = 0; i < n; i++) executarLista(b.corpo);
          return;
        }
        case 'se':
          if (verdade(valor(b.cond))) executarLista(b.corpo);
          else executarLista(b.senao);
          return;
        case 'enquanto': {
          let voltas = 0;
          while (verdade(valor(b.cond))) {
            executarLista(b.corpo);
            if (++voltas > 10000) {
              throw new Error('O "enquanto" não está terminando — a condição nunca fica falsa.');
            }
          }
          return;
        }
        default:
          return;
      }
    }

    try {
      executarLista(prog);
      return { ok: true, saida: saida, programa: prog };
    } catch (e) {
      return { ok: false, erro: (e && e.message) || 'erro ao executar', saida: saida, programa: prog };
    }
  }

  /* ---------------- testes ---------------- */

  function rodarTestes(programa, testes) {
    const r = interpretar(programa);
    if (!r.ok) return { ok: false, resultados: [], logs: [], erro: r.erro };
    const logs = r.saida.slice();

    let corpo = String(testes == null ? '' : testes).replace(/\r\n?/g, '\n');
    if (!corpo.trim()) return { ok: false, resultados: [], logs: logs, erro: 'o exercício não tem testes' };

    const A = global.LUNOX_AULAS_API;
    if (A && A.testesComSuite) corpo = A.testesComSuite(corpo);

    let resultados;
    try {
      const fn = new Function('saida', 'console', corpo);
      resultados = fn(r.saida, { log: function () {}, warn: function () {}, error: function () {} }) || [];
    } catch (e) {
      return { ok: false, resultados: [], logs: logs, erro: (e && e.message) || 'falha nos testes' };
    }
    if (!Array.isArray(resultados) || !resultados.length) {
      return { ok: false, resultados: [], logs: logs, erro: 'os testes não devolveram resultados' };
    }
    return { ok: true, resultados: resultados, logs: logs };
  }

  /* ---------------- texto (para IA e tela cheia) ---------------- */

  function paraTexto(programa, nivel) {
    const n = nivel || 0;
    const pad = '  '.repeat(n);
    const lista = normalizarPrograma(programa);
    if (!lista.length) return pad + '(programa vazio)';
    return lista.map((b) => {
      if (b.tipo === 'diga') return pad + 'diga ' + b.valor;
      if (b.tipo === 'definir') return pad + 'defina ' + b.nome + ' como ' + b.valor;
      if (b.tipo === 'mudar') return pad + 'mude ' + b.nome + ' em ' + b.valor;
      if (b.tipo === 'repetir') {
        return pad + 'repita ' + b.vezes + ' vezes:\n' + paraTexto(b.corpo, n + 1);
      }
      if (b.tipo === 'enquanto') {
        return pad + 'enquanto ' + b.cond + ':\n' + paraTexto(b.corpo, n + 1);
      }
      if (b.tipo === 'se') {
        let h = pad + 'se ' + b.cond + ' então:\n' + paraTexto(b.corpo, n + 1);
        if (b.senao && b.senao.length) h += '\n' + pad + 'senão:\n' + paraTexto(b.senao, n + 1);
        return h;
      }
      return pad + b.tipo;
    }).join('\n');
  }

  /* ---------------- interface ---------------- */

  function criar(host, opts) {
    const o = opts || {};
    let prog = normalizarPrograma(o.programa);
    let alvoPath = '';
    const aoMudar = typeof o.onChange === 'function' ? o.onChange : function () {};

    function marcar() {
      try { aoMudar(prog); } catch (e) { /* não deixa a interface quebrar */ }
    }

    function listaEm(path) {
      if (!path) return prog;
      const partes = String(path).split('/');
      let lista = prog;
      for (let k = 0; k < partes.length; k += 2) {
        const bloco = lista[Number(partes[k])];
        if (!bloco) return prog;
        const chave = partes[k + 1];
        if (!Array.isArray(bloco[chave])) bloco[chave] = [];
        lista = bloco[chave];
      }
      return lista;
    }

    function acharBloco(base) {
      const partes = String(base).split('/');
      const i = Number(partes.pop());
      const lista = listaEm(partes.join('/'));
      return { lista: lista, i: i, bloco: lista[i] };
    }

    function campo(b, chave, base, ph, extra) {
      return '<input class="bloco-campo' + (extra ? ' ' + extra : '') + '"' +
        ' data-bloco="' + esc(base) + '" data-campo="' + esc(chave) + '"' +
        ' value="' + esc(b[chave] == null ? '' : b[chave]) + '"' +
        ' placeholder="' + esc(ph) + '" spellcheck="false" autocomplete="off">';
    }

    function acoes(base) {
      return '<span class="bloco-acoes">' +
        '<button type="button" data-acao="subir" data-bloco="' + esc(base) + '" title="Subir">↑</button>' +
        '<button type="button" data-acao="descer" data-bloco="' + esc(base) + '" title="Descer">↓</button>' +
        '<button type="button" data-acao="apagar" data-bloco="' + esc(base) + '" title="Apagar">✕</button>' +
        '</span>';
    }

    function listaHtml(lista, path) {
      let h = '<div class="blocos-lista' + (path === alvoPath ? ' alvo' : '') + '">';
      if (!lista.length) h += '<span class="blocos-vazio">arraste um bloco da paleta para cá</span>';
      lista.forEach((b, i) => { h += blocoHtml(b, i, path); });
      h += '<button class="blocos-mais" type="button" data-alvo="' + esc(path) + '" title="Adicionar bloco aqui">+</button>';
      h += '</div>';
      return h;
    }

    function blocoHtml(b, i, path) {
      const base = (path ? path + '/' : '') + i;
      const meta = TIPOS[b.tipo] || TIPOS.diga;
      let linha = '';

      if (b.tipo === 'diga') {
        linha = '<span class="bloco-nome">diga</span>' + campo(b, 'valor', base, 'valor ou conta');
      } else if (b.tipo === 'definir' || b.tipo === 'mudar') {
        linha = '<span class="bloco-nome">' + (b.tipo === 'definir' ? 'defina' : 'mude') + '</span>' +
          campo(b, 'nome', base, 'nome', 'bloco-campo-nome') +
          '<span class="bloco-nome">' + (b.tipo === 'definir' ? 'como' : 'em') + '</span>' +
          campo(b, 'valor', base, 'valor ou conta');
      } else if (b.tipo === 'repetir') {
        linha = '<span class="bloco-nome">repita</span>' + campo(b, 'vezes', base, 'vezes') +
          '<span class="bloco-nome">vezes</span>';
      } else if (b.tipo === 'se') {
        linha = '<span class="bloco-nome">se</span>' + campo(b, 'cond', base, 'condição') +
          '<span class="bloco-nome">então</span>';
      } else {
        linha = '<span class="bloco-nome">enquanto</span>' + campo(b, 'cond', base, 'condição');
      }

      let corpo = '';
      if (b.tipo === 'repetir' || b.tipo === 'enquanto') {
        corpo = '<div class="bloco-corpo">' + listaHtml(b.corpo, base + '/corpo') + '</div>';
      } else if (b.tipo === 'se') {
        corpo = '<div class="bloco-corpo">' + listaHtml(b.corpo, base + '/corpo') + '</div>' +
          '<div class="bloco-senao"><span class="bloco-nome">senão</span></div>' +
          '<div class="bloco-corpo">' + listaHtml(b.senao, base + '/senao') + '</div>';
      }

      return '<div class="bloco bloco-' + esc(b.tipo) + '" data-tipo="' + esc(b.tipo) + '" style="border-left-color:' + esc(meta.cor) + '">' +
        '<div class="bloco-linha">' + linha + acoes(base) + '</div>' +
        corpo +
      '</div>';
    }

    function paletaHtml() {
      return PALETA.map((g) =>
        '<div class="blocos-grupo"><span class="blocos-grupo-nome">' + esc(g.grupo) + '</span>' +
          g.itens.map((it) =>
            '<button class="bloco-add ' + g.classe + '" type="button" data-add="' + esc(it.tipo) + '">' +
              esc(it.texto) + '</button>'
          ).join('') +
        '</div>'
      ).join('');
    }

    function render() {
      host.innerHTML =
        '<div class="blocos' + (o.compacto ? ' compacto' : '') + '">' +
          '<div class="blocos-topo">' +
            '<div class="blocos-paleta">' + paletaHtml() + '</div>' +
            '<div class="blocos-dica">Valores: <code>"texto"</code>, <code>12</code>, <code>n</code>, ' +
              '<code>n + 1</code>, <code>n % 2 == 0</code>, <code>e</code> / <code>ou</code> / <code>nao</code></div>' +
          '</div>' +
          '<div class="blocos-area">' + listaHtml(prog, '') + '</div>' +
        '</div>';
    }

    function adicionar(tipo) {
      const lista = listaEm(alvoPath);
      lista.push(novoBloco(tipo));
      render();
      marcar();
    }

    function mover(base, direcao) {
      const alvo = acharBloco(base);
      const j = direcao === 'subir' ? alvo.i - 1 : alvo.i + 1;
      if (!alvo.bloco || j < 0 || j >= alvo.lista.length) return;
      const tmp = alvo.lista[alvo.i];
      alvo.lista[alvo.i] = alvo.lista[j];
      alvo.lista[j] = tmp;
      render();
      marcar();
    }

    function apagar(base) {
      const alvo = acharBloco(base);
      if (!alvo.bloco) return;
      alvo.lista.splice(alvo.i, 1);
      if (alvoPath.indexOf(base) === 0) alvoPath = '';
      render();
      marcar();
    }

    function aoClicar(e) {
      const add = e.target.closest ? e.target.closest('[data-add]') : null;
      if (add) { adicionar(add.getAttribute('data-add')); return; }

      const alvo = e.target.closest ? e.target.closest('[data-alvo]') : null;
      if (alvo) {
        alvoPath = alvo.getAttribute('data-alvo') || '';
        render();
        return;
      }

      const acao = e.target.closest ? e.target.closest('[data-acao]') : null;
      if (acao) {
        const base = acao.getAttribute('data-bloco');
        const tipo = acao.getAttribute('data-acao');
        if (tipo === 'apagar') apagar(base);
        else mover(base, tipo);
      }
    }

    function aoDigitar(e) {
      const el = e.target.closest ? e.target.closest('[data-campo][data-bloco]') : null;
      if (!el) return;
      const alvo = acharBloco(el.getAttribute('data-bloco'));
      if (!alvo.bloco) return;
      alvo.bloco[el.getAttribute('data-campo')] = el.value;
      marcar();
    }

    host.addEventListener('click', aoClicar);
    host.addEventListener('input', aoDigitar);
    render();

    return {
      programa: function () { return prog; },
      definir: function (p) {
        prog = normalizarPrograma(p);
        alvoPath = '';
        render();
      },
      paraTexto: function () { return paraTexto(prog); },
      vazio: function () { return prog.length === 0; },
      destruir: function () {
        host.removeEventListener('click', aoClicar);
        host.removeEventListener('input', aoDigitar);
        host.innerHTML = '';
      },
    };
  }

  global.LUNOX_BLOCOS = {
    criar: criar,
    interpretar: interpretar,
    rodarTestes: rodarTestes,
    paraTexto: paraTexto,
    normalizar: normalizarPrograma,
    programaVazio: function () { return []; },
    deJSON: deJSON,
    paraJSON: paraJSON,
    TIPOS: TIPOS,
  };
})(window);
