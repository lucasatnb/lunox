/* ============================================================
   Lunox — núcleo compartilhado (dados, estado, navegação)
   Carregado por todas as páginas do app.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- dados fixos ---------------- */

  const SKILLS = [
    { id: 'variaveis',  nome: 'Variáveis',      star: 'FU2',  root: 'FU', icon: '⭐', item: 'Coleira estrelada' },
    { id: 'condicoes',  nome: 'Condições',      star: 'FU3',  root: 'FU', icon: '🌟', item: 'Óculos de decisão' },
    { id: 'lacos',      nome: 'Laços',          star: 'FU4',  root: 'FU', icon: '✨', item: 'Rastro de cometa' },
    { id: 'funcoes',    nome: 'Funções',        star: 'FU5',  root: 'FU', icon: '💫', item: 'Capa de mago' },
    { id: 'listas',     nome: 'Listas',         star: 'FU6',  root: 'FU', icon: '🔆', item: 'Mochila de itens' },
    { id: 'interfaces', nome: 'Interfaces',     star: 'FE1',  root: 'FE', icon: '🪐', item: 'Óculos espaciais' },
    { id: 'apis',       nome: 'APIs',           star: 'BE2',  root: 'BE', icon: '🛰️', item: 'Antena orbital' },
    { id: 'arquivos',   nome: 'Arquivos',       star: 'FU8',  root: 'FU', icon: '📁', item: 'Bolsa de mapas' },
    { id: 'banco',      nome: 'Banco de dados', star: 'DB1',  root: 'DB', icon: '🗄️', item: 'Baú de dados' },
    { id: 'git',        nome: 'Git',            star: 'FU16', root: 'FU', icon: '🌿', item: 'Crachá de commit' },
  ];

  const CONSTELACOES = {
    FU: { nome: 'Fundamentos',             cor: '#ffd666' },
    FE: { nome: 'Front-end',               cor: '#78c8ff' },
    MO: { nome: 'Mobile',                  cor: '#ff82ff' },
    BE: { nome: 'Back-end',                cor: '#ff8c78' },
    DB: { nome: 'Banco de Dados',          cor: '#6ee6c8' },
    DO: { nome: 'DevOps e Nuvem',          cor: '#ffaa50' },
    SE: { nome: 'Segurança',               cor: '#ff78aa' },
    EM: { nome: 'Embarcados e IoT',        cor: '#d7ff78' },
    IA: { nome: 'Dados e IA',              cor: '#be96ff' },
    BO: { nome: 'Bots e Automação',        cor: '#ffcda0' },
    JG: { nome: 'Jogos',                   cor: '#8c96ff' },
    ES: { nome: 'Engenharia de Software',  cor: '#f0f0f0' },
  };

  const TRILHAS_BASE = {
    'bot-discord': {
      nome: 'Bot de Discord',
      projeto: 'um bot de Discord',
      descricao: 'Um bot que responde no servidor e lembra de quem falou com ele.',
      icone: '🤖',
      estrelas: ['variaveis', 'condicoes', 'funcoes', 'apis', 'listas', 'arquivos'],
      jaAcesas: [],
      aulas: [
        {
          titulo: 'Guardar quem falou com o bot',
          skill: 'variaveis',
          ex: 'variaveis',
          texto: 'Antes de responder, o bot precisa guardar o nome de quem mandou a mensagem. Isso é uma variável: um espaço com nome para guardar um valor.',
          passos: [
            'Aula: o que é uma variável e por que o bot precisa lembrar do usuário',
            'Programação: crie a variável <code>usuario</code> e monte a saudação',
            'Programação com IA: peça à IA uma lista de membros, revise e corrija',
          ],
          why: 'Sem isso o bot não sabe com quem está falando. É o primeiro tijolo do seu projeto.',
        },
        {
          titulo: 'Responder só quando for chamado',
          skill: 'condicoes',
          ex: 'condicoes',
          texto: 'Um bot não responde a tudo: ele checa se a mensagem é para ele. Isso é uma condição — um if que decide o caminho.',
          passos: [
            'Aula: condições e eventos — o bot reage a uma mensagem',
            'Programação: escreva o if que responde só quando a mensagem é "oi"',
            'Programação com IA: peça o tratamento de erro e explique linha por linha',
          ],
          why: 'É aqui que o bot deixa de ser um script parado e passa a conversar.',
        },
        {
          titulo: 'Comandos que reaproveitam código',
          skill: 'funcoes',
          ex: 'funcoes',
          texto: 'Seu bot vai ter uma loja de moedas, e vários comandos calculam preço com desconto. Em vez de repetir a conta em cada comando, você cria uma função e chama onde precisar.',
          passos: [
            'Aula: função, parâmetros e retorno — escrever uma vez, usar em todo comando',
            'Programação: crie a função que aplica o desconto de um comando da loja',
            'Programação com IA: peça para dividir um comando grande em funções menores',
          ],
          why: 'Sem funções cada comando vira um bloco gigante e copiado. Com elas o bot cresce sem virar bagunça.',
        },
        {
          titulo: 'Lembrar de todos os membros',
          skill: 'listas',
          ex: 'listas',
          texto: 'Um servidor tem muitos membros. O bot guarda todos em uma lista e filtra quem importa — por exemplo, quem passou do nível mínimo.',
          passos: [
            'Aula: listas e objetos — guardar vários membros e consultar cada um',
            'Programação: filtre a lista e devolva só os nomes de quem passou da nota de corte',
            'Programação com IA: peça variações de filtro e confira se a lista original continua igual',
          ],
          why: 'Quase todo dado do Discord chega em lista. É a estrutura que você mais vai usar daqui para frente.',
        },
        {
          titulo: 'Conectar o bot ao Discord',
          skill: 'apis',
          ex: 'apis',
          texto: 'A conexão com o Discord é uma API: um contrato pronto para enviar e receber dados, sem você inventar a rede.',
          passos: [
            'Aula: o que é uma API e por que você não precisa inventar a conexão',
            'Programação: simule a resposta da API e leia o nome que voltou',
            'Programação com IA: revise o token, os escopos e o que nunca deve ir pro Git',
          ],
          why: 'Seu projeto sai do arquivo local e vira algo que outras pessoas usam.',
        },
        {
          titulo: 'Ler a configuração do bot',
          skill: 'arquivos',
          ex: 'arquivos',
          texto: 'O bot guarda suas configurações em um arquivo de texto. Ler esse arquivo e entender as linhas é o que deixa o projeto organizado.',
          passos: [
            'Aula: arquivos, linhas e por que a configuração não fica dentro do código',
            'Programação: conte as linhas não vazias de um arquivo de configuração',
            'Programação com IA: revise onde o arquivo de segredos mora e o que vai no .gitignore',
          ],
          why: 'Configuração fora do código é o primeiro passo para um projeto que você consegue manter.',
        },
      ],
    },

    'crud-alunos': {
      nome: 'CRUD de alunos',
      projeto: 'um CRUD de alunos',
      descricao: 'Criar, listar, editar e apagar alunos sem perder dados.',
      icone: '🗄️',
      estrelas: ['banco', 'apis'],
      jaAcesas: ['variaveis', 'interfaces'],
      aulas: [
        {
          titulo: 'Modelar o aluno e guardar de verdade',
          skill: 'banco',
          ex: 'banco',
          texto: 'Um CRUD começa pelo dado: o que é um aluno, quais campos ele tem e onde isso fica guardado.',
          passos: [
            'Aula: tabela, chave primária e o que é persistência',
            'Programação: crie a lista de alunos e filtre os aprovados',
            'Programação com IA: peça o modelo e questione cada campo escolhido',
          ],
          why: 'Interfaces você já sabe — pulamos. Aqui entra só o que falta para o CRUD existir.',
        },
        {
          titulo: 'Ler, criar e apagar sem perder dados',
          skill: 'banco',
          ex: 'banco2',
          texto: 'As quatro operações do CRUD: criar, ler, atualizar e apagar. O cuidado está em não quebrar o que já existe.',
          passos: [
            'Aula: as quatro operações e por que DELETE pede cuidado',
            'Programação: adicione um aluno, remova outro e conte quantos ficaram',
            'Programação com IA: gere os casos de teste e prove que o dado sumiu mesmo',
          ],
          why: 'É o coração do CRUD: manipular o dado sem quebrar o que já existe.',
        },
        {
          titulo: 'Ligar a tela à API',
          skill: 'apis',
          ex: 'apis',
          texto: 'A tela conversa com o servidor por rotas: um pedido sai, uma resposta volta. É o contrato da sua aplicação.',
          passos: [
            'Aula: rota, requisição e resposta — o que viaja entre as camadas',
            'Programação: simule a resposta da API e leia o dado que voltou',
            'Programação com IA: revise o contrato da API e o que acontece quando falha',
          ],
          why: 'Fecha o ciclo: o usuário clica e o banco muda. Seu projeto está de pé.',
        },
      ],
    },

    'portfolio-web': {
      nome: 'Portfólio web',
      projeto: 'um portfólio web',
      descricao: 'Uma página com a sua cara para mostrar seus projetos.',
      icone: '🪐',
      estrelas: ['variaveis', 'condicoes', 'interfaces', 'git'],
      jaAcesas: [],
      aulas: [
        {
          titulo: 'Estruturar a página',
          skill: 'interfaces',
          ex: 'interfaces',
          texto: 'Uma interface começa pela estrutura: o que existe na tela e qual é o papel de cada parte.',
          passos: [
            'Aula: HTML semântico — cada parte tem um papel',
            'Programação: descreva a tela do portfólio com título e seções',
            'Programação com IA: peça uma revisão de acessibilidade e corrija',
          ],
          why: 'A base do seu site: o que existe na página antes de qualquer estilo.',
        },
        {
          titulo: 'Dar forma e identidade',
          skill: 'interfaces',
          ex: 'design',
          texto: 'Depois da estrutura vem o visual: cores, contraste e hierarquia. É o que faz alguém confiar no seu trabalho.',
          passos: [
            'Aula: layout, espaçamento e contraste',
            'Programação: defina o tema visual com fundo, texto e destaque',
            'Programação com IA: peça variações de layout e escolha com critério',
          ],
          why: 'É o que faz alguém confiar no seu trabalho em 5 segundos.',
        },
        {
          titulo: 'Publicar no Git',
          skill: 'git',
          ex: 'git',
          texto: 'Publicar é parte da entrega: versionar o projeto e colocar no GitHub para o mundo ver.',
          passos: [
            'Aula: commit, repositório e o que é versionamento',
            'Programação: monte os comandos do primeiro commit',
            'Programação com IA: revise o README e o que não pode vazar',
          ],
          why: 'Projeto que ninguém vê não conta. Publicar é parte da entrega.',
        },
      ],
    },

    'jogo': {
      nome: 'Jogo 2D',
      projeto: 'um jogo 2D',
      descricao: 'Um personagem que anda, colide e marca pontos em fases.',
      icone: '🎮',
      estrelas: ['variaveis', 'condicoes', 'lacos', 'funcoes', 'listas'],
      jaAcesas: [],
      aulas: [
        {
          titulo: 'O personagem se move',
          skill: 'variaveis',
          ex: 'movimento',
          texto: 'Movimento é estado: a posição do personagem é uma variável que muda a cada quadro.',
          passos: [
            'Aula: coordenadas e variáveis de estado',
            'Programação: crie posição e velocidade e atualize a posição',
            'Programação com IA: peça ajuste de velocidade e compara as opções',
          ],
          why: 'Movimento é o primeiro sinal de vida do seu jogo.',
        },
        {
          titulo: 'Colisão e regras',
          skill: 'condicoes',
          ex: 'colisao',
          texto: 'Sem regra não existe jogo: uma condição decide o que acontece quando o personagem bate em algo.',
          passos: [
            'Aula: condições que rodam a cada quadro',
            'Programação: use if/else para decidir o estado do jogo',
            'Programação com IA: revisa os casos de borda que você esqueceu',
          ],
          why: 'Sem regra, não existe jogo — existe animação.',
        },
        {
          titulo: 'Pontuação e fases',
          skill: 'lacos',
          ex: 'lacos',
          texto: 'As fases são uma coleção: um laço percorre cada uma e acumula os pontos.',
          passos: [
            'Aula: laços e coleções para guardar inimigos e fases',
            'Programação: some os pontos de cada fase com um for',
            'Programação com IA: peça ideias de balanceamento e testa',
          ],
          why: 'Aqui o protótipo vira algo que dá vontade de jogar de novo.',
        },
      ],
    },
  };

  /* ---------------- utilidades ---------------- */

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function uid() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function imgGato(nivel) {
    return 'lunox' + (nivel >= 3 ? 3 : nivel === 2 ? 2 : 1) + '.png';
  }

  function tempoRelativo(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    const min = Math.floor(d / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    const h = Math.floor(min / 60);
    if (h < 24) return 'há ' + h + ' h';
    const dias = Math.floor(h / 24);
    if (dias === 1) return 'ontem';
    if (dias < 30) return 'há ' + dias + ' dias';
    return 'em ' + new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  let toastTimer = null;
  function toast(msg) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText =
        'position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);z-index:80;' +
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

  /* ---------------- estado ---------------- */

  const CHAVES = {
    stars: 'lunox_demo_stars',
    trilhas: 'lunox_trilhas',
    atual: 'lunox_trilha_atual',
    progresso: 'lunox_progresso',
    codigo: 'lunox_codigo',
    exercicios: 'lunox_exercicios_ok',
    ofensiva: 'lunox_ofensiva',
    jornada: 'lunox_jornada',
    ia: 'lunox_ia_mode',
    chat: 'lunox_chat_historico',
    anim: 'lunox_anim_pendente',
  };

  /* Pontos por exercício concluído. O desafio final vale mais. */
  const PONTOS_EXERCICIO = 10;
  const PONTOS_FINAL = 30;
  const MAX_DIAS_OFENSIVA = 60;

  function ler(chave, padrao) {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto == null ? padrao : JSON.parse(bruto);
    } catch {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {}
  }

  function montar(presetId, quando, idFixo) {
    const base = TRILHAS_BASE[presetId];
    return {
      id: idFixo || uid(),
      preset: presetId,
      nome: base.nome,
      projeto: base.projeto,
      descricao: base.descricao,
      icone: base.icone,
      estrelas: base.estrelas.slice(),
      jaAcesas: base.jaAcesas.slice(),
      aulas: JSON.parse(JSON.stringify(base.aulas)),
      criadaEm: quando || Date.now(),
      concluidaEm: null,
    };
  }

  /* Toda conta começa limpa: nenhuma trilha, estrela ou progresso herdado.
     As trilhas nascem quando a pessoa cria a primeira (ou quando a IA monta a jornada). */
  function carregar() {
    let trilhas = ler(CHAVES.trilhas, null);
    let acesas = new Set(ler(CHAVES.stars, []));
    let progresso = ler(CHAVES.progresso, {}) || {};
    let codigo = ler(CHAVES.codigo, {}) || {};
    let exercicios = ler(CHAVES.exercicios, {}) || {};
    let ofensiva = normalizarOfensiva(ler(CHAVES.ofensiva, null));
    let atual = ler(CHAVES.atual, null);
    let ia = !!ler(CHAVES.ia, false);
    let anim = ler(CHAVES.anim, []);
    if (!Array.isArray(anim)) anim = [];

    if (!Array.isArray(trilhas)) {
      trilhas = [];
      atual = null;
      gravar(CHAVES.trilhas, trilhas);
      gravar(CHAVES.atual, atual);
    }
    if (trilhas.length && !trilhas.some((t) => t.id === atual)) atual = trilhas[0].id;
    if (!trilhas.length) atual = null;

    return { trilhas, acesas, atual, progresso, codigo, exercicios, ofensiva, ia, anim };
  }

  const estado = carregar();

  function salvar() {
    gravar(CHAVES.trilhas, estado.trilhas);
    gravar(CHAVES.atual, estado.atual);
    gravar(CHAVES.stars, Array.from(estado.acesas));
    gravar(CHAVES.progresso, estado.progresso);
    gravar(CHAVES.codigo, estado.codigo);
    gravar(CHAVES.exercicios, estado.exercicios);
    gravar(CHAVES.ofensiva, estado.ofensiva);
    gravar(CHAVES.ia, estado.ia);
    gravar(CHAVES.anim, estado.anim);
  }

  /* ---------------- ofensiva (dias seguidos voltando) ---------------- */

  /** Data local no formato AAAA-MM-DD (o dia da pessoa, não UTC). */
  function diaDe(ts) {
    const d = ts ? new Date(ts) : new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function diaAnterior(dia) {
    const p = String(dia || '').split('-').map(Number);
    if (p.length !== 3 || p.some((n) => !isFinite(n))) return '';
    const d = new Date(p[0], p[1] - 1, p[2]);
    d.setDate(d.getDate() - 1);
    return diaDe(d.getTime());
  }

  function normalizarOfensiva(bruto) {
    const o = bruto && typeof bruto === 'object' ? bruto : {};
    const dias = Array.isArray(o.dias)
      ? o.dias.filter((d) => typeof d === 'string' && d).slice(-MAX_DIAS_OFENSIVA)
      : [];
    const atual = Math.max(0, Number(o.atual) || 0);
    return {
      atual,
      recorde: Math.max(atual, Number(o.recorde) || 0),
      ultimoDia: typeof o.ultimoDia === 'string' ? o.ultimoDia : '',
      dias,
    };
  }

  /** Conta 1 visita por dia. Se ontem também veio, a sequência cresce. */
  function registrarVisita() {
    const hoje = diaDe();
    const o = estado.ofensiva || (estado.ofensiva = normalizarOfensiva(null));
    if (o.ultimoDia === hoje) return o;
    const ontem = o.ultimoDia ? diaAnterior(hoje) : '';
    o.atual = o.ultimoDia && o.ultimoDia === ontem ? o.atual + 1 : 1;
    o.ultimoDia = hoje;
    o.recorde = Math.max(o.recorde || 0, o.atual);
    o.dias = (o.dias || []).filter((d) => d !== hoje).concat(hoje).slice(-MAX_DIAS_OFENSIVA);
    salvar();
    return o;
  }

  function ofensiva() {
    return registrarVisita();
  }

  // Conta a visita do dia assim que o app abre (uma vez por dia).
  registrarVisita();

  /* ---------------- pontos ---------------- */

  function pontosDoExercicio(_sid, chave) {
    return chave === 'final' ? PONTOS_FINAL : PONTOS_EXERCICIO;
  }

  /** Pontos derivados do estado: nunca somam o mesmo exercício duas vezes. */
  function pontosTotais() {
    let total = 0;
    const ex = estado.exercicios || {};
    Object.keys(ex).forEach((sid) => {
      const mapa = ex[sid] || {};
      Object.keys(mapa).forEach((chave) => {
        if (mapa[chave]) total += pontosDoExercicio(sid, chave);
      });
    });
    // exercícios embutidos das aulas (marcados em progresso[id][aula].editor)
    const pr = estado.progresso || {};
    Object.keys(pr).forEach((id) => {
      if (id.indexOf('estrela:') === 0) return; // exercício avulso já contado acima
      const p = pr[id] || {};
      Object.keys(p).forEach((aula) => {
        if (p[aula] && p[aula].editor) total += PONTOS_EXERCICIO;
      });
    });
    return total;
  }

  function achar(id) {
    return estado.trilhas.find((t) => t.id === id) || null;
  }

  function atualObj() {
    return achar(estado.atual) || estado.trilhas[0] || null;
  }

  function setAtual(id) {
    if (!achar(id)) return;
    estado.atual = id;
    salvar();
  }

  function criar(presetId) {
    if (!TRILHAS_BASE[presetId]) return null;
    const t = montar(presetId, Date.now());
    estado.trilhas.unshift(t);
    estado.atual = t.id;
    salvar();
    return t;
  }

  function acharPorPreset(presetId) {
    return estado.trilhas.find((t) => t.preset === presetId) || null;
  }

  function remover(id) {
    const i = estado.trilhas.findIndex((t) => t.id === id);
    if (i < 0) return;
    estado.trilhas.splice(i, 1);
    delete estado.progresso[id];
    Object.keys(estado.codigo).forEach((k) => {
      if (k.startsWith(id + ':')) delete estado.codigo[k];
    });
    if (estado.atual === id) estado.atual = estado.trilhas[0] ? estado.trilhas[0].id : null;
    salvar();
  }

  function concluir(id) {
    const t = achar(id);
    if (!t) return 0;
    let novas = 0;
    t.estrelas.forEach((s) => {
      if (acender(s)) novas++;
    });
    t.concluidaEm = t.concluidaEm || Date.now();
    salvar();
    return novas;
  }

  function skill(id) {
    return SKILLS.find((s) => s.id === id) || null;
  }

  function acesa(skillId) {
    return estado.acesas.has(skillId);
  }

  function alternarEstrela(skillId) {
    if (!skill(skillId)) return false;
    if (estado.acesas.has(skillId)) estado.acesas.delete(skillId);
    else estado.acesas.add(skillId);
    salvar();
    return estado.acesas.has(skillId);
  }

  /* Acende a estrela e coloca na fila: o mapa toca a animação de desbloqueio
     na próxima vez que for aberto. Devolve true se a estrela era nova. */
  function acender(skillId) {
    const s = skill(skillId);
    if (!s || estado.acesas.has(skillId)) return false;
    // estrela com exercícios só acende quando todos estiverem resolvidos
    if (s.star && !podeAcender(s.star)) return false;
    estado.acesas.add(skillId);
    if (estado.anim.indexOf(skillId) < 0) estado.anim.push(skillId);
    salvar();
    return true;
  }

  function pendentesAnim() {
    return estado.anim.filter((id) => estado.acesas.has(id) && skill(id));
  }

  function limparAnim(skillId) {
    estado.anim = estado.anim.filter((id) => id !== skillId);
    salvar();
  }

  /* Acha a aula que ensina essa habilidade: trilha atual primeiro, depois as
     outras; se nenhuma tiver, cria a trilha-modelo que tem. */
  function acharAulaPorSkill(skillId) {
    const ordem = [];
    const atual = atualObj();
    if (atual) ordem.push(atual);
    estado.trilhas.forEach((t) => { if (t !== atual) ordem.push(t); });
    for (const t of ordem) {
      const i = t.aulas.findIndex((a) => a.skill === skillId);
      if (i >= 0) return { trilha: t, idx: i };
    }
    const preset = Object.keys(TRILHAS_BASE).find((k) =>
      TRILHAS_BASE[k].aulas.some((a) => a.skill === skillId));
    if (!preset) return null;
    const t = criar(preset);
    if (!t) return null;
    return { trilha: t, idx: t.aulas.findIndex((a) => a.skill === skillId) };
  }

  /* Roda o código do aluno com os testes num Worker (isolado, com timeout). */
  const WORKER_SRC = [
    'self.onmessage = function (e) {',
    '  var data = e.data || {}; var logs = [];',
    '  function fmt(v) { if (typeof v === "string") return v; try { return JSON.stringify(v); } catch (err) { return String(v); } }',
    '  function fake(p) { return function () { var a = Array.prototype.slice.call(arguments); logs.push((p || "") + a.map(fmt).join(" ")); }; }',
    '  var c = { log: fake(""), warn: fake("[warn] "), error: fake("[erro] ") };',
    '  try {',
    '    var fn = new Function("console", data.codigo + "\\n;return typeof solucao !== \\"undefined\\" ? solucao : undefined;");',
    '    var solucao = fn(c);',
    '    var testFn = new Function("solucao", "console", data.testes);',
    '    var resultados = testFn(solucao, c) || [];',
    '    self.postMessage({ ok: true, resultados: resultados, logs: logs });',
    '  } catch (err) { self.postMessage({ ok: false, erro: (err && err.message) || String(err), logs: logs }); }',
    '};',
  ].join('\n');

  function rodarCodigo(codigo, testes, limiteMs) {
    return new Promise((resolve) => {
      let url = null;
      let worker = null;
      let timer = null;
      let fim = false;
      const encerrar = (r) => {
        if (fim) return;
        fim = true;
        clearTimeout(timer);
        try { if (worker) worker.terminate(); } catch {}
        try { if (url) URL.revokeObjectURL(url); } catch {}
        resolve(r);
      };
      try {
        url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
        worker = new Worker(url);
      } catch (e) {
        encerrar({ ok: false, erro: 'Seu navegador não conseguiu iniciar o executor de testes.', logs: [] });
        return;
      }
      timer = setTimeout(() => encerrar({ ok: false, erro: 'Timeout: o código demorou demais (loop infinito?)', logs: [] }), limiteMs || 2800);
      worker.onmessage = (e) => encerrar(e.data);
      worker.onerror = (e) => encerrar({ ok: false, erro: 'Erro ao executar: ' + (e.message || 'falha'), logs: [] });
      worker.postMessage({ codigo, testes });
    });
  }

  function nivelGato() {
    const n = estado.acesas.size;
    if (n >= 7) return 3;
    if (n >= 4) return 2;
    return 1;
  }

  function progressoDe(id) {
    if (!estado.progresso[id]) estado.progresso[id] = {};
    return estado.progresso[id];
  }

  function marcar(id, aulaIdx, passo) {
    const p = progressoDe(id);
    if (!p[aulaIdx]) p[aulaIdx] = {};
    p[aulaIdx][passo] = true;
    salvar();
  }

  function aulaOk(id, aulaIdx) {
    const p = progressoDe(id)[aulaIdx];
    return !!(p && p.editor);
  }

  /* ---------------- exercícios por estrela (vídeos/grupos + desafio final) ---------------- */

  function exerciciosDaEstrela(sid) {
    const A = global.LUNOX_AULAS_API;
    return A && A.exerciciosDe ? A.exerciciosDe(sid) : [];
  }

  function exercicioOk(sid, chave) {
    const m = estado.exercicios[sid];
    return !!(m && m[chave]);
  }

  function marcarExercicio(sid, chave) {
    if (!sid || !chave) return false;
    if (!estado.exercicios[sid]) estado.exercicios[sid] = {};
    estado.exercicios[sid][chave] = true;
    salvar();
    return true;
  }

  function desmarcarExercicio(sid, chave) {
    const m = estado.exercicios[sid];
    if (!m || !m[chave]) return false;
    delete m[chave];
    salvar();
    return true;
  }

  function exerciciosPendentes(sid) {
    return exerciciosDaEstrela(sid).filter((e) => !exercicioOk(sid, e.chave));
  }

  /** Exercícios das aulas (grupos). O desafio final fica de fora. */
  function exerciciosDaAula(sid) {
    return exerciciosDaEstrela(sid).filter((e) => e.tipo === 'grupo');
  }

  /**
   * O desafio final só abre depois dos exercícios das aulas.
   * Também fica liberado se a estrela já foi acesa, se o final já foi feito,
   * ou se a estrela não tem exercícios de aula (não há o que concluir antes).
   */
  function finalLiberado(sid) {
    if (!sid) return true;
    if (exercicioOk(sid, 'final')) return true;
    const sk = SKILLS.find((s) => s.star === sid);
    if (sk && estado.acesas.has(sk.id)) return true;
    const daAula = exerciciosDaAula(sid);
    if (!daAula.length) return true;
    return daAula.every((e) => exercicioOk(sid, e.chave));
  }

  /* Sem exercícios cadastrados, a estrela acende como antes.
     Com exercícios, só acende quando todos estiverem resolvidos. */
  function podeAcender(sid) {
    return exerciciosPendentes(sid).length === 0;
  }

  function progressoTrilha(id) {
    const t = achar(id);
    if (!t) return { feitas: 0, total: 0, pct: 0 };
    const p = progressoDe(id);
    const feitas = t.aulas.reduce((n, _a, i) => n + (p[i] && p[i].editor ? 1 : 0), 0);
    return { feitas, total: t.aulas.length, pct: t.aulas.length ? Math.round((feitas / t.aulas.length) * 100) : 0 };
  }

  function codigoDe(id, aulaIdx) {
    return estado.codigo[id + ':' + aulaIdx] || '';
  }

  /* ---------------- jornada (trilha montada pela IA) ---------------- */

  /** Lê a jornada salva em Sua trilha. Devolve null se não existe/está quebrada. */
  function jornadaSalva() {
    try {
      const j = JSON.parse(localStorage.getItem(CHAVES.jornada));
      return j && Array.isArray(j.marcos) && j.marcos.length ? j : null;
    } catch {
      return null;
    }
  }

  /**
   * Resumo da jornada para o topo/chat: quantas estrelas a pessoa já acendeu,
   * qual é a próxima e o motivo dela estar na trilha.
   */
  function resumoJornada() {
    const j = jornadaSalva();
    if (!j) return null;
    const etapas = j.marcos
      .flatMap((m) => (Array.isArray(m.etapas) ? m.etapas : []))
      .filter((et) => et && et.estrela)
      .map((et) => {
        const sk = SKILLS.find((s) => s.star === et.estrela) || null;
        return { estrela: et.estrela, porque: et.porque || '', entrega: et.entrega || '', skill: sk ? sk.id : '' };
      });
    const feitas = etapas.filter((et) => et.skill && estado.acesas.has(et.skill));
    const proxima = etapas.find((et) => et.skill && !estado.acesas.has(et.skill)) || null;
    return {
      projeto: j.projeto || 'Sua jornada',
      resumo: j.resumo || '',
      total: etapas.length,
      feitas: feitas.length,
      proxima,
      etapas,
    };
  }

  function salvarCodigo(id, aulaIdx, texto) {
    estado.codigo[id + ':' + aulaIdx] = texto;
    gravar(CHAVES.codigo, estado.codigo);
  }

  /* ---------------- navegação ---------------- */

  const NAV = [
    { href: 'index.html', rotulo: 'Trilhas', chave: 'trilha' },
    { href: 'sua-trilha.html', rotulo: 'Sua trilha', chave: 'jornada' },
    { href: 'chat.html', rotulo: 'Chat', chave: 'chat' },
    { href: 'habilidades.html', rotulo: 'Habilidades', chave: 'habilidades' },
    { href: 'programar.html', rotulo: 'Programar', chave: 'programar' },
    { href: 'conta.html', rotulo: 'Conta', chave: 'conta' },
  ];

  function montarNav(ativo) {
    const el = document.getElementById('topbar');
    if (!el) return;
    const nivel = nivelGato();
    const of = estado.ofensiva || { atual: 0, recorde: 0 };
    const pts = pontosTotais();
    const dias = of.atual || 0;
    el.className = 'topbar';
    el.innerHTML =
      '<div class="topbar-in">' +
        '<a class="brand" href="index.html"><span class="moon">🌙</span><span>Lunox</span></a>' +
        '<nav class="tabs">' +
          NAV.map((n) =>
            '<a class="tab' + (n.chave === ativo ? ' ativo' : '') + '" href="' + n.href + '">' + n.rotulo + '</a>'
          ).join('') +
        '</nav>' +
        '<div class="top-meta">' +
          '<span class="chip ofensiva" title="' +
            (dias > 0 ? dias + ' dia(s) seguidos voltando ao Lunox · recorde: ' + (of.recorde || dias) : 'Volte amanhã para começar uma ofensiva') +
          '">🔥 ' + dias + (dias === 1 ? ' dia' : ' dias') + '</span>' +
          '<span class="chip pontos" title="' + pts + ' pontos por exercícios concluídos">⭐ ' + pts + ' pts</span>' +
          '<span class="badge-demo">demo</span>' +
          '<a href="habilidades.html" title="seu Lunox"><img class="top-gato" src="' + imgGato(nivel) + '" alt="Lunox"></a>' +
        '</div>' +
      '</div>';
    // o conta.js escuta este evento para recolocar o chip do usuário
    try { document.dispatchEvent(new CustomEvent('lunox:nav')); } catch {}
  }

  function sessao() {
    try {
      let s = localStorage.getItem('lunox_demo_sessao');
      if (!s) {
        s = 'demo-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('lunox_demo_sessao', s);
      }
      return s;
    } catch {
      return 'demo-anon';
    }
  }

  /* ---------------- exporta ---------------- */

  global.LUNOX = {
    SKILLS, CONSTELACOES, TRILHAS_BASE, CHAVES,
    $, $$, esc, uid, imgGato, tempoRelativo, toast, sessao,
    estado, salvar, achar, atualObj, setAtual, criar, acharPorPreset, remover, concluir,
    skill, acesa, alternarEstrela, nivelGato,
    acender, pendentesAnim, limparAnim, acharAulaPorSkill, rodarCodigo,
    progressoDe, marcar, aulaOk, progressoTrilha, codigoDe, salvarCodigo,
    jornadaSalva, resumoJornada,
    exerciciosDaEstrela, exercicioOk, marcarExercicio, desmarcarExercicio,
    exerciciosPendentes, exerciciosDaAula, finalLiberado, podeAcender,
    ofensiva, registrarVisita, pontosDoExercicio, pontosTotais,
    PONTOS_EXERCICIO, PONTOS_FINAL,
    montarNav,
  };
})(window);
