/* ============================================================
   conta.js — login leve + sincronização do progresso (Workers KV)

   - A aba "Conta" (conta.html) cadastra/entra com usuário e senha.
     A senha vira hash PBKDF2 dentro do Worker; aqui só circula o
     token de sessão (localStorage).
   - Enquanto logado, o snapshot do localStorage (chaves "lunox*"
     do app: trilha, estrelas, progresso, códigos, conversas, o
     rascunho do admin...) sobe sozinho: ~30s depois de cada
     mudança e ao trocar de página.
   - Ao abrir o site: se a conta no servidor estiver mais nova que
     o navegador, o estado é aplicado (uma recarga, no máximo).

   API: window.LUNOX.conta  (e window.LUNOX_CONTA)
   ============================================================ */
(function () {
  'use strict';

  const L = window.LUNOX;

  const CH_TOKEN = 'lunox_token';
  const CH_USUARIO = 'lunox_usuario';
  const CH_SYNC_EM = 'lunox_sync_em';
  const CH_SUJO = 'lunox_sync_sujo';
  const CH_COPIA = 'lunox_sync_copia';
  const EXCLUIR = /^lunox_(token|usuario|demo_sessao|session|sync_)/;
  const DEBOUNCE = 30000;
  const MARCA_RELOAD = 'lunox_sync_recarregou';

  let aplicando = false;   // aplicando o estado do servidor: não conta como mudança local
  let relogio = null;
  let emVoo = false;      // um PUT por vez

  /* ---------------- base ---------------- */

  const ls = (ch, padrao) => { try { const v = localStorage.getItem(ch); return v == null ? padrao : v; } catch { return padrao; } };
  const lsSet = (ch, v) => { try { localStorage.setItem(ch, String(v)); } catch {} };
  const lsDel = (ch) => { try { localStorage.removeItem(ch); } catch {} };

  /* O Worker planta o token também num cookie (Path=/) — serve de reserva
     quando o localStorage foi limpo e é o que abre as páginas do muro. */
  const NOME_COOKIE = 'lunox_sessao';

  function cookieLer(nome) {
    try {
      const partes = document.cookie ? document.cookie.split(';') : [];
      for (const parte of partes) {
        const i = parte.indexOf('=');
        if (i < 0) continue;
        if (parte.slice(0, i).trim() === nome) return parte.slice(i + 1).trim();
      }
    } catch {}
    return '';
  }

  function cookieApagar() {
    try { document.cookie = NOME_COOKIE + '=; Path=/; Max-Age=0'; } catch {}
  }

  const token = () => ls(CH_TOKEN, '') || cookieLer(NOME_COOKIE);
  const usuario = () => ls(CH_USUARIO, '');
  const logado = () => !!token();

  function cabecalho(tok) {
    return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (tok || token()) };
  }

  async function chamar(url, corpo, metodo, tok) {
    const r = await fetch(url, {
      method: metodo || (corpo ? 'POST' : 'GET'),
      headers: cabecalho(tok),
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, dados };
  }

  /* ---------------- snapshot do localStorage ---------------- */

  /* Conta nova começa limpa: apaga o progresso local (mas mantém a sessão). */
  function limparProgressoLocal() {
    try {
      const apagar = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k.indexOf('lunox') !== 0 || EXCLUIR.test(k)) continue;
        apagar.push(k);
      }
      apagar.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  function capturar() {
    const dados = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k.indexOf('lunox') !== 0 || EXCLUIR.test(k)) continue;
        const v = localStorage.getItem(k);
        if (v != null) dados[k] = v;
      }
    } catch {}
    return dados;
  }

  function aplicar(dados) {
    let mudou = false;
    aplicando = true;
    try {
      const remotas = Object.keys(dados || {});
      const conjunto = new Set(remotas);
      const atuais = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('lunox') === 0 && !EXCLUIR.test(k)) atuais.push(k);
      }
      atuais.forEach((k) => {
        if (!conjunto.has(k)) { lsDel(k); mudou = true; }
      });
      remotas.forEach((k) => {
        const v = dados[k];
        if (ls(k, null) !== v) {
          try { localStorage.setItem(k, v); } catch {}
          mudou = true;
        }
      });
    } finally { aplicando = false; }
    return mudou;
  }

  /* ---------------- subir (autosave) ---------------- */

  function marcarSujo() {
    lsSet(CH_SUJO, Date.now());
    if (logado() && !aplicando) agendar();
  }

  function agendar() {
    clearTimeout(relogio);
    relogio = setTimeout(() => { empurrar().catch(() => {}); }, DEBOUNCE);
  }

  async function empurrar() {
    if (!logado() || emVoo) return { ok: false, pulou: true };
    emVoo = true;
    try {
      const dados = capturar();
      const assinatura = JSON.stringify(dados);
      if (assinatura === ls(CH_COPIA, null)) {
        // nada mudou desde a última sincronização — não gasta escrita do KV
        lsSet(CH_SYNC_EM, Number(ls(CH_SYNC_EM, 0)) || Date.now());
        lsSet(CH_SUJO, 0);
        pintar();
        return { ok: true, pulou: true };
      }
      const r = await chamar('/api/estado', { estado: dados }, 'PUT');
      if (r.status === 401) { encerrarLocal(); throw new Error('sessão expirada'); }
      if (!r.ok || !r.dados || !r.dados.ok) {
        throw new Error((r.dados && r.dados.error && r.dados.error.message) || ('HTTP ' + r.status));
      }
      lsSet(CH_COPIA, assinatura);
      lsSet(CH_SYNC_EM, r.dados.salvo_em || Date.now());
      lsSet(CH_SUJO, 0);
      pintar();
      return { ok: true, salvo_em: r.dados.salvo_em };
    } finally {
      emVoo = false;
    }
  }

  /** Ao trocar de página / esconder a aba: manda o que falta. */
  function descarregar() {
    if (!logado() || Number(ls(CH_SUJO, 0)) === 0) return;
    const dados = capturar();
    const assinatura = JSON.stringify(dados);
    if (assinatura === ls(CH_COPIA, null)) return;
    const corpo = JSON.stringify({ estado: dados });
    try {
      // keepalive aguenta até 64 KB; acima disso, dispara sem esperar
      const opcoes = { method: 'PUT', headers: cabecalho(), body: corpo };
      if (corpo.length < 60000) opcoes.keepalive = true;
      fetch('/api/estado', opcoes).catch(() => {});
    } catch {}
  }

  /* ---------------- descer / reconciliar ---------------- */

  function recarregou() {
    try { return sessionStorage.getItem(MARCA_RELOAD) === '1'; } catch { return false; }
  }

  async function puxarAplicar() {
    if (!logado()) return { ok: false, pulou: true };

    let r;
    try {
      r = await chamar('/api/estado', null, 'GET');
    } catch {
      agendar();   // sem rede agora: o autosave tenta de novo
      return { ok: false, erro: 'sem conexão' };
    }

    if (r.status === 401) {
      encerrarLocal();
      return { ok: false, erro: 'sessão expirada' };
    }
    if (!r.ok || !r.dados || !r.dados.ok) return { ok: false, erro: 'HTTP ' + r.status };

    const salvoEm = r.dados.salvo_em || 0;
    const localEm = Number(ls(CH_SYNC_EM, 0));
    const sujo = Number(ls(CH_SUJO, 0));

    if (r.dados.estado && salvoEm > Math.max(localEm, sujo)) {
      // o servidor está mais novo (outra máquina, ou este navegador nunca sincronizou)
      const mudou = aplicar(r.dados.estado);
      lsSet(CH_SYNC_EM, salvoEm);
      lsSet(CH_SUJO, 0);
      lsSet(CH_COPIA, JSON.stringify(capturar()));
      pintar();
      if (mudou && !recarregou()) {
        try { sessionStorage.setItem(MARCA_RELOAD, '1'); } catch {}
        location.reload();
      }
      return { ok: true, aplicou: true, salvo_em: salvoEm };
    }

    // nada mais novo lá em cima: sobe o que mudou por aqui
    return await empurrar();
  }

  /* ---------------- conta ---------------- */

  async function entrar(nome, senha, criar) {
    const r = await chamar(criar ? '/api/conta/criar' : '/api/conta/entrar', {
      usuario: String(nome || '').trim(),
      senha: String(senha || ''),
      session: L && L.sessao ? L.sessao() : '',
    });
    if (!r.ok || !r.dados || !r.dados.token) {
      throw new Error((r.dados && r.dados.error && r.dados.error.message) || ('HTTP ' + r.status));
    }
    lsSet(CH_TOKEN, r.dados.token);
    lsSet(CH_USUARIO, r.dados.usuario || String(nome || '').trim());
    if (criar) limparProgressoLocal();
    const sync = await puxarAplicar().catch((e) => ({ ok: false, erro: e.message }));
    pintar();
    return { usuario: r.dados.usuario, sync };
  }

  async function sair() {
    const tok = token();
    lsDel(CH_TOKEN);
    lsDel(CH_USUARIO);
    cookieApagar();
    clearTimeout(relogio);
    pintar();
    if (tok) {
      try { await fetch('/api/conta/sair', { method: 'POST', headers: cabecalho(tok), body: '{}' }); } catch {}
    }
    return { ok: true };
  }

  async function apagar(senha) {
    const r = await chamar('/api/conta/apagar', { senha: String(senha || '') });
    if (!r.ok || !r.dados || !r.dados.ok) {
      throw new Error((r.dados && r.dados.error && r.dados.error.message) || ('HTTP ' + r.status));
    }
    lsDel(CH_TOKEN); lsDel(CH_USUARIO);
    lsDel(CH_SYNC_EM); lsDel(CH_SUJO); lsDel(CH_COPIA);
    cookieApagar();
    pintar();
    return { ok: true };
  }

  function encerrarLocal() {
    lsDel(CH_TOKEN);
    lsDel(CH_USUARIO);
    cookieApagar();
    clearTimeout(relogio);
    pintar();
    if (L && L.toast) L.toast('Sua sessão expirou — entre de novo na aba Conta');
  }

  /* ---------------- para onde voltar depois do login ---------------- */

  /** O muro manda pra cá com ?proximo=/caminho; depois de entrar, volta. */
  function proximoDestino() {
    try {
      const v = new URLSearchParams(location.search).get('proximo') || '';
      if (v.indexOf('/') !== 0 || v.indexOf('//') === 0) return '';   // só caminhos internos
      if (/^\/conta(\.html)?([/?#]|$)/.test(v)) return '';           // evita voltar pra cá
      return v;
    } catch { return ''; }
  }

  /* ---------------- detectar mudanças no localStorage ---------------- */

  function instalarGancho() {
    if (instalarGancho.feito) return;
    instalarGancho.feito = true;
    const setOriginal = localStorage.setItem.bind(localStorage);
    const delOriginal = localStorage.removeItem.bind(localStorage);
    const limparOriginal = localStorage.clear.bind(localStorage);

    localStorage.setItem = function (k, v) {
      setOriginal(k, v);
      k = String(k);
      if (k.indexOf('lunox') === 0 && !EXCLUIR.test(k)) marcarSujo();
    };
    localStorage.removeItem = function (k) {
      delOriginal(k);
      k = String(k);
      if (k.indexOf('lunox') === 0 && !EXCLUIR.test(k)) marcarSujo();
    };
    localStorage.clear = function () {
      const antes = Object.keys(capturar());
      limparOriginal();
      if (antes.length) marcarSujo();
    };

    // outra aba do mesmo navegador escreveu alguma coisa
    window.addEventListener('storage', (ev) => {
      if (!ev || !ev.key) return;
      if (ev.key.indexOf('lunox') === 0 && !EXCLUIR.test(ev.key)) marcarSujo();
    });

    window.addEventListener('pagehide', descarregar);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') descarregar();
    });
  }

  /* ---------------- interface ---------------- */

  function chipTopbar() {
    if (!logado()) return;
    const meta = document.querySelector('.top-meta');
    if (!meta || meta.querySelector('.conta-chip')) return;
    const a = document.createElement('a');
    a.className = 'chip conta-chip';
    a.href = 'conta.html';
    a.title = 'sua conta — ' + usuario();
    a.textContent = '👤 ' + usuario();
    meta.insertBefore(a, meta.firstChild);
  }

  function tempoSync() {
    const em = Number(ls(CH_SYNC_EM, 0));
    if (!em) return logado() ? 'sincronizando…' : '';
    return 'sincronizado ' + ((L && L.tempoRelativo) ? L.tempoRelativo(em) : new Date(em).toLocaleString('pt-BR'));
  }

  /** Renderiza a aba Conta (só em conta.html) e o chip do topo. */
  function pintar() {
    const chip = document.querySelector('.conta-chip');
    if (chip) chip.remove();
    chipTopbar();

    const root = document.getElementById('conta-root');
    if (!root) return;

    if (!logado()) {
      root.innerHTML =
        '<div class="conta-grid">' +
          '<form class="panel conta-card" data-conta="entrar" novalidate>' +
            '<div class="panel-head"><span class="panel-title">Já tenho conta</span></div>' +
            campoUsuario() +
            '<label class="conta-campo"><span>Senha</span><input type="password" name="senha" autocomplete="current-password" required></label>' +
            '<p class="conta-erro" data-erro hidden></p>' +
            '<button class="btn primary" type="submit">Entrar</button>' +
          '</form>' +
          '<form class="panel conta-card" data-conta="criar" novalidate>' +
            '<div class="panel-head"><span class="panel-title">Criar conta</span></div>' +
            campoUsuario() +
            '<label class="conta-campo"><span>Senha (mínimo 6)</span><input type="password" name="senha" autocomplete="new-password" required></label>' +
            '<label class="conta-campo"><span>Repita a senha</span><input type="password" name="senha2" autocomplete="new-password" required></label>' +
            '<p class="conta-erro" data-erro hidden></p>' +
            '<button class="btn primary" type="submit">Criar e entrar</button>' +
          '</form>' +
        '</div>' +
        '<p class="conta-nota">Ao entrar, o progresso salvo na sua conta é usado neste navegador — e passa a subir sozinho (a cada mudança, depois de ~30s). ' +
        'É uma conta de demonstração: a senha é guardada só como hash, mas os dados ficam legíveis no servidor.</p>';
      return;
    }

    root.innerHTML =
      '<div class="panel conta-card conta-logado">' +
        '<div class="panel-head"><span class="panel-title">Sua conta</span>' +
          '<span class="chip violet" title="' + esc(usuario()) + '">👤 ' + esc(usuario()) + '</span></div>' +
        '<p class="conta-sync" id="conta-sync">' + esc(tempoSync()) + '</p>' +
        '<p class="conta-nota">Sobe sozinho: trilha e jornada, estrelas acesas, progresso das aulas, códigos salvos no editor, ' +
        'conversas com o Lunox e o rascunho do admin de aulas. Funciona entre navegadores/dispositivos com a mesma conta.</p>' +
        '<div class="conta-acoes">' +
          '<button class="btn ghost" type="button" data-conta-acao="sincronizar">Sincronizar agora</button>' +
          '<button class="btn ghost" type="button" data-conta-acao="sair">Sair (mantém os dados aqui)</button>' +
          '<button class="btn danger ghost" type="button" data-conta-acao="apagar">Apagar conta…</button>' +
        '</div>' +
        '<form class="conta-apagar" data-conta="apagar" hidden novalidate>' +
          '<p>Apagar a conta apaga também o que está salvo nela no servidor (os dados deste navegador ficam). Digite sua senha para confirmar:</p>' +
          '<label class="conta-campo"><span>Senha</span><input type="password" name="senha" required></label>' +
          '<p class="conta-erro" data-erro hidden></p>' +
          '<button class="btn danger" type="submit">Apagar definitivamente</button>' +
        '</form>' +
      '</div>';
  }

  function campoUsuario() {
    return '<label class="conta-campo"><span>Usuário</span>' +
      '<input type="text" name="usuario" autocomplete="username" required minlength="3" maxlength="24" ' +
      'pattern="[A-Za-z0-9._\\-]{3,24}" placeholder="ex.: lucas"></label>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function mostrarErro(form, msg) {
    const el = form.querySelector('[data-erro]');
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
  }

  /* ---------------- eventos da aba Conta ---------------- */

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-conta]');
    if (!form) return;
    e.preventDefault();

    const modo = form.getAttribute('data-conta');
    const dados = new FormData(form);
    const nome = String(dados.get('usuario') || '').trim();
    const senha = String(dados.get('senha') || '');

    if (!/^[A-Za-z0-9._\-]{3,24}$/.test(nome)) { mostrarErro(form, 'Usuário: 3 a 24 caracteres (letras, números, ponto, hífen ou _).'); return; }
    if (senha.length < 6) { mostrarErro(form, 'A senha precisa de pelo menos 6 caracteres.'); return; }
    if (modo === 'criar' && senha !== String(dados.get('senha2') || '')) { mostrarErro(form, 'As senhas não batem.'); return; }

    const btn = form.querySelector('button[type="submit"]');
    const rotulo = btn.textContent;
    btn.disabled = true;
    btn.textContent = modo === 'apagar' ? 'apagando…' : 'um instante…';
    try {
      if (modo === 'apagar') {
        await apagar(senha);
        if (L && L.toast) L.toast('Conta apagada. O que está neste navegador continua por aqui.');
      } else {
        const r = await entrar(nome, senha, modo === 'criar');
        if (L && L.toast) L.toast(modo === 'criar' ? 'Conta criada — você começa do zero' : 'Bem-vindo de volta, ' + r.usuario);
        const destino = proximoDestino();
        if (destino) {
          // veio do muro (?proximo=…) e acabou de entrar: volta pra onde queria
          try { location.replace(destino); } catch {}
          return;
        }
      }
    } catch (err) {
      mostrarErro(form, err.message || 'Não deu — tente de novo.');
      btn.disabled = false;
      btn.textContent = rotulo;
      return;
    }
    pintar();
  });

  document.addEventListener('click', async (e) => {
    const botao = e.target.closest('[data-conta-acao]');
    if (!botao) return;
    const acao = botao.getAttribute('data-conta-acao');

    if (acao === 'apagar') {
      const form = document.querySelector('form[data-conta="apagar"]');
      if (form) { form.hidden = !form.hidden; if (!form.hidden) form.querySelector('input[name="senha"]').focus(); }
      return;
    }
    if (acao === 'sair') { await sair(); if (L && L.toast) L.toast('Você saiu — os dados ficaram neste navegador'); return; }
    if (acao === 'sincronizar') {
      botao.disabled = true;
      botao.textContent = 'sincronizando…';
      try {
        const r = await puxarAplicar();
        if (L && L.toast) L.toast(r.ok && !r.erro ? 'Sincronizado' : 'Não sincronizou: ' + (r.erro || 'tente mais tarde'));
      } finally {
        botao.disabled = false;
        botao.textContent = 'Sincronizar agora';
      }
    }
  });

  /* ---------------- boot ---------------- */

  instalarGancho();

  // em conta.html ninguém montou o topo ainda
  const topo = document.getElementById('topbar');
  if (topo && !topo.innerHTML.trim() && L && L.montarNav) L.montarNav('conta');

  pintar();
  if (logado()) puxarAplicar().catch(() => {});

  // já logado e o muro trouxe um destino (?proximo=…): volta pra lá
  // (a página atende em /conta.html e também na URL bonita /conta)
  const destino = proximoDestino();
  if (destino && logado() && /^\/conta(\.html)?$/.test(location.pathname)) {
    try { location.replace(destino); } catch {}
  }

  /* ---------------- exporta ---------------- */

  const api = {
    logado, usuario,
    entrar: (nome, senha) => entrar(nome, senha, false),
    criar: (nome, senha) => entrar(nome, senha, true),
    sair, apagar,
    sincronizar: puxarAplicar,
    empurrar,
    capturar,
  };
  window.LUNOX_CONTA = api;
  if (L) L.conta = api;
})();
