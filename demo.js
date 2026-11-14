/* ============================================================
   Lunox — demo interativa
   ============================================================ */
const SKILLS = [
  { id: 'variaveis', nome: 'Variáveis', icon: '⭐' },
  { id: 'condicoes', nome: 'Condições', icon: '🌟' },
  { id: 'lacos', nome: 'Laços', icon: '✨' },
  { id: 'funcoes', nome: 'Funções', icon: '💫' },
  { id: 'listas', nome: 'Listas', icon: '🔆' },
  { id: 'interfaces', nome: 'Interfaces', icon: '🪐' },
  { id: 'apis', nome: 'APIs', icon: '🛰️' },
  { id: 'arquivos', nome: 'Arquivos', icon: '📁' },
  { id: 'banco', nome: 'Banco de dados', icon: '🗄️' },
  { id: 'git', nome: 'Git', icon: '🌿' },
];

const ITENS = {
  variaveis: 'Coleira estrelada',
  condicoes: 'Óculos de decisão',
  lacos: 'Rastro de cometa',
  funcoes: 'Capa de mago',
  listas: 'Mochila de itens',
  git: 'Crachá de commit',
  interfaces: 'Óculos espaciais',
  apis: 'Antena orbital',
  arquivos: 'Bolsa de mapas',
  banco: 'Baú de dados',
};

const TRILHAS = {
  'bot-discord': {
    nome: 'Bot de Discord',
    estrelas: ['variaveis', 'condicoes', 'funcoes', 'apis', 'listas'],
    jaAcesas: [],
    aulas: [
      {
        titulo: 'Guardar quem falou com o bot',
        passos: [
          'Aula: o que é uma variável e por que o bot precisa lembrar do usuário',
          'Programação: você cria a variável <code>usuario</code> e imprime o nome',
          'Programação com IA: pede à IA uma lista de membros, revisa e corrige',
        ],
        why: 'Sem isso o bot não sabe com quem está falando. É o primeiro tijolo do seu projeto.',
      },
      {
        titulo: 'Responder só quando for chamado',
        passos: [
          'Aula: condições e eventos — o bot reage a uma mensagem',
          'Programação: escreve o <code>if</code> que checa se a mensagem é para ele',
          'Programação com IA: pede o tratamento de erro e explica linha por linha',
        ],
        why: 'É aqui que o bot deixa de ser um script parado e passa a conversar.',
      },
      {
        titulo: 'Conectar o bot ao Discord',
        passos: [
          'Aula: o que é uma API e por que você não precisa inventar a conexão',
          'Programação: envia a primeira mensagem de verdade no servidor',
          'Programação com IA: revisa o token, os escopos e o que nunca deve ir pro Git',
        ],
        why: 'Seu projeto sai do arquivo local e vira algo que outras pessoas usam.',
      },
    ],
  },
  'crud-alunos': {
    nome: 'CRUD de alunos',
    estrelas: ['banco', 'apis'],
    jaAcesas: ['variaveis', 'interfaces'],
    aulas: [
      {
        titulo: 'Modelar o aluno e guardar de verdade',
        passos: [
          'Aula: tabela, chave primária e o que é persistência',
          'Programação: cria a tabela e insere o primeiro aluno',
          'Programação com IA: pede o modelo e questiona cada campo escolhido',
        ],
        why: 'Interfaces você já sabe — pulamos. Aqui entra só o que falta para o CRUD existir.',
      },
      {
        titulo: 'Ler, criar e apagar sem perder dados',
        passos: [
          'Aula: as quatro operações e por que DELETE pede cuidado',
          'Programação: implementa o listar e o excluir com confirmação',
          'Programação com IA: gera os casos de teste e prova que o dado sumiu mesmo',
        ],
        why: 'É o coração do CRUD: manipular o dado sem quebrar o que já existe.',
      },
      {
        titulo: 'Ligar a tela à API',
        passos: [
          'Aula: rota, requisição e resposta — o que viaja entre as camadas',
          'Programação: conecta o formulário ao endpoint que você criou',
          'Programação com IA: revisa o contrato da API e o que acontece quando falha',
        ],
        why: 'Fecha o ciclo: o usuário clica e o banco muda. Seu projeto está de pé.',
      },
    ],
  },
  'portfolio-web': {
    nome: 'Portfólio web',
    estrelas: ['variaveis', 'condicoes', 'interfaces', 'git'],
    jaAcesas: [],
    aulas: [
      {
        titulo: 'Estruturar a página',
        passos: [
          'Aula: HTML semântico — cada parte tem um papel',
          'Programação: escreve as seções do seu portfólio',
          'Programação com IA: pede uma revisão de acessibilidade e corrige',
        ],
        why: 'A base do seu site: o que existe na página antes de qualquer estilo.',
      },
      {
        titulo: 'Dar forma e identidade',
        passos: [
          'Aula: layout, espaçamento e contraste',
          'Programação: aplica a paleta e organiza os blocos',
          'Programação com IA: pede variações de layout e escolhe com critério',
        ],
        why: 'É o que faz alguém confiar no seu trabalho em 5 segundos.',
      },
      {
        titulo: 'Publicar no Git',
        passos: [
          'Aula: commit, repositório e o que é versionamento',
          'Programação: faz o primeiro commit e publica',
          'Programação com IA: revisa o README e o que não pode vazar',
        ],
        why: 'Projeto que ninguém vê não conta. Publicar é parte da entrega.',
      },
    ],
  },
  'jogo': {
    nome: 'Jogo 2D',
    estrelas: ['variaveis', 'condicoes', 'lacos', 'funcoes', 'listas'],
    jaAcesas: [],
    aulas: [
      {
        titulo: 'O personagem se move',
        passos: [
          'Aula: coordenadas e variáveis de estado',
          'Programação: move o personagem com o teclado',
          'Programação com IA: pede ajuste de velocidade e compara as opções',
        ],
        why: 'Movimento é o primeiro sinal de vida do seu jogo.',
      },
      {
        titulo: 'Colisão e regras',
        passos: [
          'Aula: condições que rodam a cada quadro',
          'Programação: detecta quando o personagem bate no obstáculo',
          'Programação com IA: revisa os casos de borda que você esqueceu',
        ],
        why: 'Sem regra, não existe jogo — existe animação.',
      },
      {
        titulo: 'Pontuação e fases',
        passos: [
          'Aula: laços e coleções para guardar inimigos e fases',
          'Programação: adiciona pontuação e uma segunda fase',
          'Programação com IA: pede ideias de balanceamento e testa',
        ],
        why: 'Aqui o protótipo vira algo que dá vontade de jogar de novo.',
      },
    ],
  },
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const STORE = 'lunox_demo_stars';
const skillById = (id) => SKILLS.find((s) => s.id === id);

/* ---------------- estado das estrelas ---------------- */
let acesas = new Set();
try { acesas = new Set(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch {}

function salvar() {
  try { localStorage.setItem(STORE, JSON.stringify(Array.from(acesas))); } catch {}
}

function nivelGato() {
  const n = acesas.size;
  if (n >= 7) return 3;
  if (n >= 4) return 2;
  return 1;
}

function renderEstrelas() {
  $$('.star-btn').forEach((b) => b.classList.toggle('on', acesas.has(b.dataset.skill)));
  const n = acesas.size;
  const bar = $('#progress-bar');
  if (bar) bar.style.width = (n / SKILLS.length) * 100 + '%';
  const cnt = $('#constel-count');
  if (cnt) cnt.textContent = n + ' de ' + SKILLS.length;

  const lvl = nivelGato();
  const gato = $('#gato-evolucao');
  if (gato) {
    gato.src = 'lunox' + lvl + '.png';
    const cap = $('#gato-caption');
    if (cap) {
      cap.textContent = lvl === 3 ? 'Lunox completo — todas as estrelas' : lvl === 2 ? 'Lunox explorador — 4+ estrelas' : 'Lunox aprendiz — comece acendendo uma estrela';
    }
  }
  renderItens();
}

function renderItens() {
  $$('.pet-card').forEach((card) => {
    card.querySelectorAll('.items span').forEach((el) => {
      el.classList.toggle('lock', !acesas.has(el.dataset.item));
    });
  });
}

/* ---------------- demo da trilha ---------------- */
let trilhaAtual = null;

function montarTrilha(chave) {
  const t = TRILHAS[chave];
  if (!t) return;
  trilhaAtual = { chave, ...t };

  const alvo = $('#trail');
  const nome = $('#trail-nome');
  if (nome) nome.textContent = t.nome;

  alvo.innerHTML = '';
  t.jaAcesas.forEach((id) => {
    const s = skillById(id);
    const div = document.createElement('div');
    div.className = 'aula skip';
    div.innerHTML =
      '<div class="h"><span class="tag">já acesa</span><h4>' + s.nome + '</h4></div>' +
      '<p style="margin:0;font-size:12.5px;color:#8ef0b4">Você já demonstrou essa habilidade — pulamos essa parte.</p>';
    alvo.appendChild(div);
    requestAnimationFrame(() => div.classList.add('show'));
  });

  t.aulas.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = 'aula';
    div.innerHTML =
      '<div class="h"><span class="tag">aula ' + (i + 1) + '</span><h4>' + a.titulo + '</h4></div>' +
      '<ul>' + a.passos.map((p) => '<li>' + p + '</li>').join('') + '</ul>' +
      '<div class="why">' + a.why + '</div>';
    alvo.appendChild(div);
    setTimeout(() => div.classList.add('show'), 260 * (i + 1));
  });

  atualizarPreviewEstrelas();
}

function atualizarPreviewEstrelas() {
  if (!trilhaAtual) return;
  const novas = trilhaAtual.estrelas;
  $$('#skills-preview .skill-mini').forEach((el) => {
    const id = el.dataset.skill;
    const on = acesas.has(id) || novas.includes(id);
    el.classList.toggle('on', on);
    const tag = el.querySelector('.estado');
    if (tag) tag.textContent = acesas.has(id) ? 'já sua' : novas.includes(id) ? 'nesta trilha' : '';
  });
}

function concluirTrilha() {
  if (!trilhaAtual) return;
  trilhaAtual.estrelas.forEach((id) => acesas.add(id));
  salvar();
  renderEstrelas();
  atualizarPreviewEstrelas();
  const lvl = nivelGato();
  const img = $('#pet-preview');
  if (img) {
    img.src = 'lunox' + lvl + '.png';
    img.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 520 });
  }
  mostrarToast('⭐ ' + trilhaAtual.estrelas.length + ' estrelas acenderam! Seu Lunox evoluiu.');
}

/* ---------------- toast ---------------- */
let toastTimer;
function mostrarToast(msg) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText =
      'position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);z-index:50;' +
      'padding:12px 20px;border-radius:12px;font-size:13.5px;font-weight:600;color:#12101f;' +
      'background:linear-gradient(135deg,#ffe680,#ffd700);box-shadow:0 12px 34px rgba(255,215,0,.3);' +
      'opacity:0;transition:.3s;pointer-events:none;max-width:90vw;text-align:center';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,0)';
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%,20px)';
  }, 3200);
}

/* ---------------- chat demo ---------------- */
const CHAT_RESPOSTAS = [
  { re: /\b(oi|ola|olá|eai|e ai|bom dia|boa tarde|boa noite|opa)\b/i, r: 'Miau! 🌙 Sou o Lunox. Me diz o que você quer construir que eu monto a trilha — do jeito que o seu projeto pede.' },
  { re: /\b(bot|discord)\b/i, r: 'Bot de Discord, ótima escolha! 🐾\nSua trilha tem 3 aulas: guardar quem falou com o bot (Variáveis), responder só quando for chamado (Condições) e conectar com o Discord (APIs).\nVocê já sabe o básico de variáveis?' },
  { re: /\b(crud|banco|jdbc|aluno)\b/i, r: 'Boa! Pelo que você já construiu, a estrela de Interfaces já está acesa — então pulei essa parte.\nSua trilha foca só no que falta: Banco de dados e a conexão com a API.' },
  { re: /\b(site|portifolio|portfólio|html|css|landing)\b/i, r: 'Portfólio é um projeto ótimo para acender estrelas rápido 🌟\nTrilha: estruturar a página (HTML), dar forma e identidade (Interfaces) e publicar no Git.' },
  { re: /\b(jogo|game|unity|godot)\b/i, r: 'Jogo! 🎮 A trilha começa no movimento do personagem, passa por colisão e regras, e termina em pontuação e fases — usando variáveis, condições, laços e listas.' },
  { re: /\b(quanto tempo|demora|tempo)\b/i, r: 'Depende do que você já sabe. Por isso eu pergunto antes: o que já está aceso na sua constelação entra como aula pulada, não como revisão.' },
  { re: /\b(como funciona|o que voce (faz|é)|quem é você|quem e voce)\b/i, r: 'Eu transformo o seu objetivo em uma trilha curta: no máximo 3 aulas, cada uma com conceito, código e uso de IA.\nNo fim de cada projeto tem um teste de refino — você prova que entendeu, não só copiou.' },
  { re: /\b(obrigad|valeu|vlw)\b/i, r: 'Miau! ✨ Quando terminar a primeira aula, me conta — a gente acende a estrela.' },
  { re: /\b(sim|já sei|ja sei|claro)\b/i, r: 'Perfeito! Então eu encurto: as aulas do que você já sabe saem da trilha. Vamos direto ao que falta.' },
  { re: /\b(nao|não|nunca|zero)\b/i, r: 'Sem problema, a gente começa do começo — mas já dentro do seu projeto, não em exercício solto. 🐾' },
];
let usandoIAReal = false;

function respostaLocal(texto) {
  for (const c of CHAT_RESPOSTAS) if (c.re.test(texto)) return c.r;
  return 'Miau! Entendi: "' + texto.slice(0, 60) + '".\nPara montar uma trilha curta eu preciso saber o que você quer construir — um bot, um CRUD, um site, um jogo?';
}

function addMsg(txt, tipo) {
  const log = $('#chat-log');
  const div = document.createElement('div');
  div.className = 'msg ' + tipo;
  div.textContent = txt;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

let sessao = (() => {
  try {
    let s = localStorage.getItem('lunox_demo_sessao');
    if (!s) { s = 'demo-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('lunox_demo_sessao', s); }
    return s;
  } catch { return 'demo-anon'; }
})();

async function enviar() {
  const input = $('#chat-input');
  const texto = input.value.trim();
  if (!texto) return;
  input.value = '';
  addMsg(texto, 'user');
  const t = addMsg('Lunox está pensando…', 'lunox typing');

  if (!usandoIAReal) {
    setTimeout(() => {
      t.classList.remove('typing');
      t.textContent = respostaLocal(texto);
      $('#chat-log').scrollTop = 1e6;
    }, 550 + Math.random() * 400);
    return;
  }

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessao, mensagem: texto, messages: [{ role: 'user', content: texto }] }),
    });
    const d = await r.json();
    t.classList.remove('typing');
    const camada = d.lunox ? d.lunox.layer : '?';
    t.textContent = (d.choices && d.choices[0] ? d.choices[0].message.content : 'Não consegui responder agora.') + '\n\n— camada L' + camada;
    $('#chat-log').scrollTop = 1e6;
  } catch (e) {
    t.classList.remove('typing');
    t.textContent = 'Sem conexão com o servidor. (no demo, o modo local continua funcionando)';
  }
}

/* ---------------- teste rápido ---------------- */
let testeFila = [];
let testeTotal = 3;
function iniciarTeste() {
  const pool = SKILLS.filter((s) => !acesas.has(s.id)).slice(0, 3);
  if (!pool.length) { mostrarToast('Você já acendeu todas as estrelas ✨'); return; }
  testeFila = pool;
  testeTotal = pool.length;
  renderTeste();
}
function renderTeste() {
  const box = $('#teste-box');
  if (!testeFila.length) {
    box.style.display = 'none';
    return;
  }
  const s = testeFila[0];
  box.style.display = 'block';
  box.innerHTML =
    '<div style="font-size:12px;color:var(--dim);margin-bottom:8px">teste rápido · ' + (testeTotal - testeFila.length + 1) + ' de ' + testeTotal + '</div>' +
    '<div style="font-size:14px;margin-bottom:12px">Você já usou <b style="color:var(--gold)">' + s.nome + '</b> em algum projeto?</div>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn" data-resp="1" style="padding:8px 16px;font-size:13px">Sim, já usei</button>' +
    '<button class="btn ghost" data-resp="0" style="padding:8px 16px;font-size:13px">Ainda não</button>' +
    '</div>';
  box.querySelectorAll('[data-resp]').forEach((b) => {
    b.onclick = () => {
      if (b.dataset.resp === '1') acesas.add(s.id);
      testeFila.shift();
      salvar();
      renderEstrelas();
      atualizarPreviewEstrelas();
      renderTeste();
      if (!testeFila.length) mostrarToast('Teste concluído — trilha ajustada ao seu nível ✨');
    };
  });
}

/* ---------------- boot ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  $$('.star-btn').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.skill;
      if (acesas.has(id)) acesas.delete(id); else acesas.add(id);
      salvar();
      renderEstrelas();
      atualizarPreviewEstrelas();
    };
  });

  $$('[data-trilha]').forEach((b) => {
    b.onclick = () => {
      montarTrilha(b.dataset.trilha);
      document.getElementById('demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  });

  const form = $('#demo-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const v = $('#demo-input').value.toLowerCase();
      let chave = 'portfolio-web';
      if (/bot|discord/.test(v)) chave = 'bot-discord';
      else if (/crud|banco|aluno|jdbc/.test(v)) chave = 'crud-alunos';
      else if (/jogo|game/.test(v)) chave = 'jogo';
      montarTrilha(chave);
    };
  }

  const concluir = $('#btn-concluir');
  if (concluir) concluir.onclick = concluirTrilha;

  const teste = $('#btn-teste');
  if (teste) teste.onclick = iniciarTeste;

  const teste2 = $('#btn-teste-constel');
  if (teste2) teste2.onclick = iniciarTeste;

  const chatForm = $('#chat-form');
  if (chatForm) chatForm.onsubmit = (e) => { e.preventDefault(); enviar(); };

  const toggle = $('#toggle-ia');
  if (toggle) {
    toggle.onchange = () => {
      usandoIAReal = toggle.checked;
      const m = $('#chat-mode');
      m.textContent = usandoIAReal ? 'IA real (L0→L1→L2)' : 'respostas instantâneas';
      m.classList.toggle('real', usandoIAReal);
    };
  }

  $$('.nav a[href^="#"], .hero a[href^="#"]').forEach((a) => {
    a.onclick = (e) => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (alvo) { e.preventDefault(); alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    };
  });

  renderEstrelas();
  montarTrilha('bot-discord');
  setTimeout(() => { $$('#skills-preview .skill-mini').forEach((el, i) => setTimeout(() => el.classList.add('vis'), i * 120)); }, 300);
});
