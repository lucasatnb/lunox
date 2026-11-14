/* ============================================================
   Lunox — estrelas extras (exercícios do mapa além das 10 originais)
   Carregar DEPOIS de app-core.js, em habilidades.html e programar.html.

   Para criar uma estrela nova, basta uma linha no fim da lista E(...):
   E(id, 'ID_NO_MAPA', 'Nome', 'Título', 'conceito', 'enunciado',
     'params', 'corpo da solução', [casos], 'dica')
   - id: slug único (vira o id da habilidade e a chave do exercício)
   - ID_NO_MAPA: o id da estrela em mapa_dados.json (ex.: 'FU7')
   - casos: [['nome do teste', [argumentos], esperado], ...]
   Os mesmos casos geram os testes de JS/TS e os das outras linguagens.
   ============================================================ */
(function () {
  'use strict';
  const L = window.LUNOX;
  if (!L) return;

  const ICONES = { FU: '⭐', FE: '🪐', MO: '📱', BE: '🛰️', DB: '🗄️', DO: '☁️', SE: '🛡️', EM: '🔌', IA: '🧠', BO: '🤖', JG: '🎮', ES: '🧱' };

  function __eq(a, e) {
    if (e === null || typeof e !== 'object') return typeof e === 'number' ? (typeof a === 'number' && Math.abs(a - e) < 1e-9) : a === e;
    if (Array.isArray(e)) return Array.isArray(a) && a.length === e.length && e.every(function (x, i) { return __eq(a[i], x); });
    if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
    const ks = Object.keys(e);
    return Object.keys(a).length === ks.length && ks.every(function (k) { return __eq(a[k], e[k]); });
  }

  function suite(corpo) {
    return 'var out = [];\n' +
      'function check(nome, fn) {\n' +
      '  try {\n    var r = fn();\n' +
      '    out.push({ nome: nome, ok: r === true, detalhe: r === true ? "" : String(r || "falhou") });\n' +
      '  } catch (e) {\n    out.push({ nome: nome, ok: false, detalhe: e.message });\n  }\n}\n' +
      __eq.toString() + '\n' + corpo + '\nreturn out;';
  }

  function testesDe(casos) {
    return suite(casos.map(function (c) {
      return 'check(' + JSON.stringify(c[0]) + ', function () { var r = solucao.apply(null, ' + JSON.stringify(c[1]) +
        '); return __eq(r, ' + JSON.stringify(c[2]) + ') ? true : "recebeu " + JSON.stringify(r); });';
    }).join('\n'));
  }

  const EX = {};
  const CASOS = {};
  const NOVAS = [];

  function E(id, star, nome, titulo, conceito, enunciado, params, corpo, casos, dica) {
    const raiz = star.replace(/[0-9]+$/, '');
    L.SKILLS.push({ id: id, nome: nome, star: star, root: raiz, icon: ICONES[raiz] || '⭐', item: '' });
    NOVAS.push({ id: id, raiz: raiz, titulo: titulo, conceito: conceito });
    EX[id] = {
      titulo: titulo,
      enunciado: enunciado,
      reqs: ['Faça todos os testes passarem', 'Devolva o resultado com return'],
      dica: dica,
      starter: 'function solucao(' + params + ') {\n  // escreva aqui\n\n}\n',
      solucao: 'function solucao(' + params + ') {\n  ' + corpo + '\n}\n',
      testes: testesDe(casos),
    };
    CASOS[id] = casos;
  }

  /* ---------------- as estrelas ---------------- */

  E('logica', 'FU1', 'Lógica de programação', 'FizzBuzz do bot', 'Pensar em passos e decisões antes de escrever código.',
    'Complete <code>solucao(n)</code>: devolva <code>"FizzBuzz"</code> se n divide por 3 e por 5, <code>"Fizz"</code> se só por 3, <code>"Buzz"</code> se só por 5. Nos outros casos, devolva o próprio n.',
    'n', 'if (n % 15 === 0) return "FizzBuzz";\n  if (n % 3 === 0) return "Fizz";\n  if (n % 5 === 0) return "Buzz";\n  return n;',
    [['15 é FizzBuzz', [15], 'FizzBuzz'], ['9 é Fizz', [9], 'Fizz'], ['10 é Buzz', [10], 'Buzz'], ['7 volta 7', [7], 7]],
    'Teste primeiro o caso mais específico (divisível por 3 e por 5).');

  E('strings', 'FU7', 'Strings e texto', 'Nome com maiúsculas', 'Texto é uma sequência de caracteres que você corta, troca e junta.',
    'Complete <code>solucao(texto)</code> para devolver o texto com a primeira letra de cada palavra maiúscula e o resto minúsculo.',
    'texto', 'return texto.split(" ").map(function (p) { return p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p; }).join(" ");',
    [['ana maria', ['ana maria'], 'Ana Maria'], ['LUCAS', ['LUCAS'], 'Lucas'], ['texto vazio', [''], '']],
    'split(" ") separa as palavras; map muda cada uma; join(" ") junta de volta.');

  E('excecoes', 'FU9', 'Erros e exceções', 'Ler JSON sem quebrar', 'Erros acontecem: try/catch deixa o programa continuar em vez de parar.',
    'Complete <code>solucao(texto)</code> para devolver o objeto do JSON, ou <code>null</code> se o texto for inválido. Use <code>try/catch</code>.',
    'texto', 'try { return JSON.parse(texto); } catch (e) { return null; }',
    [['JSON válido', ['{"a":1}'], { a: 1 }], ['JSON quebrado', ['{quebrado'], null], ['texto vazio', [''], null]],
    'JSON.parse lança erro quando o texto é inválido: capture com catch.');

  E('algoritmos', 'FU11', 'Algoritmos básicos', 'Maior da lista (sem Math.max)', 'Um algoritmo é um passo a passo: aqui, percorrer e guardar o melhor até agora.',
    'Complete <code>solucao(lista)</code> para devolver o maior número da lista, ou <code>null</code> se ela estiver vazia. Não use <code>Math.max</code>.',
    'lista', 'if (!lista.length) return null;\n  var maior = lista[0];\n  for (var i = 1; i < lista.length; i++) { if (lista[i] > maior) maior = lista[i]; }\n  return maior;',
    [['maior de [3,9,2]', [[3, 9, 2]], 9], ['só negativos', [[-5, -1, -8]], -1], ['lista vazia', [[]], null]],
    'Comece com o primeiro item como "maior" e compare com os demais.');

  E('recursao', 'FU14', 'Recursão', 'Fatorial', 'Recursão é a função chamar a si mesma com um problema menor, até chegar no caso base.',
    'Complete <code>solucao(n)</code> para devolver o fatorial de n (5! = 5·4·3·2·1) usando <b>recursão</b>.',
    'n', 'if (n <= 1) return 1;\n  return n * solucao(n - 1);',
    [['5! = 120', [5], 120], ['0! = 1', [0], 1], ['1! = 1', [1], 1], ['6! = 720', [6], 720]],
    'Caso base: n <= 1 devolve 1. Senão: n * solucao(n - 1).');

  E('css', 'FE2', 'CSS', 'Estilos em texto CSS', 'CSS descreve o visual como pares propriedade: valor.',
    'Complete <code>solucao(estilos)</code> para transformar um objeto como <code>{color: "red"}</code> em texto CSS: <code>"color: red;"</code>. Com várias propriedades, separe por um espaço.',
    'estilos', 'return Object.keys(estilos).map(function (k) { return k + ": " + estilos[k] + ";"; }).join(" ");',
    [['uma propriedade', [{ color: 'red' }], 'color: red;'], ['duas propriedades', [{ color: 'red', 'font-size': '16px' }], 'color: red; font-size: 16px;'], ['objeto vazio', [{}], '']],
    'Object.keys(obj) lista as propriedades; map monta cada "chave: valor;".');

  E('acessibilidade', 'FE7', 'Acessibilidade', 'Imagem com texto alternativo', 'Toda imagem precisa de texto alternativo para quem usa leitor de tela.',
    'Complete <code>solucao(src, alt)</code> para devolver <code>&lt;img src="..." alt="..."&gt;</code>. Se o <code>alt</code> estiver vazio, devolva <code>null</code> (imagem sem descrição não vale).',
    'src, alt', 'if (!alt) return null;\n  return \'<img src="\' + src + \'" alt="\' + alt + \'">\';',
    [['imagem com alt', ['gato.png', 'Gato dormindo'], '<img src="gato.png" alt="Gato dormindo">'], ['sem alt devolve null', ['gato.png', ''], null]],
    'Cheque o alt antes de montar o texto da tag.');

  E('http', 'BE1', 'HTTP e a web', 'Classe do status HTTP', 'Todo pedido na web volta com um código de status que diz o que aconteceu.',
    'Complete <code>solucao(status)</code>: 200–299 → <code>"sucesso"</code>, 300–399 → <code>"redirecionamento"</code>, 400–499 → <code>"erro do cliente"</code>, 500 ou mais → <code>"erro do servidor"</code>.',
    'status', 'if (status >= 500) return "erro do servidor";\n  if (status >= 400) return "erro do cliente";\n  if (status >= 300) return "redirecionamento";\n  return "sucesso";',
    [['200', [200], 'sucesso'], ['301', [301], 'redirecionamento'], ['404', [404], 'erro do cliente'], ['503', [503], 'erro do servidor']],
    'Comece pelo maior intervalo e desça com if.');

  E('autenticacao', 'BE7', 'Autenticação', 'Conferir login', 'Autenticar é provar quem você é: o servidor confere nome e senha.',
    'Complete <code>solucao(usuarios, nome, senha)</code> para devolver <code>true</code> só se existir um usuário com esse nome <b>e</b> essa senha. (Aqui a senha está em texto puro só para treinar. Em Senhas e hash você aprende a nunca fazer isso de verdade.)',
    'usuarios, nome, senha', 'return usuarios.some(function (u) { return u.nome === nome && u.senha === senha; });',
    [['login certo', [[{ nome: 'ana', senha: '123' }, { nome: 'bia', senha: 'abc' }], 'ana', '123'], true], ['senha errada', [[{ nome: 'ana', senha: '123' }], 'ana', '999'], false], ['usuário inexistente', [[{ nome: 'ana', senha: '123' }], 'caio', '123'], false]],
    'some(...) devolve true se algum item cumprir a condição.');

  E('validacao', 'BE11', 'Validação de dados', 'Validar e-mail', 'Nunca confie no que o usuário manda: valide antes de usar.',
    'Complete <code>solucao(email)</code> para devolver <code>true</code> se o texto tem algo antes do <code>@</code>, algo depois e um ponto no domínio, sem espaços.',
    'email', 'return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);',
    [['e-mail válido', ['ana@mail.com'], true], ['sem ponto no domínio', ['ana@mail'], false], ['sem @', ['ana mail.com'], false], ['vazio', [''], false]],
    'Uma expressão regular resolve; ou confira @ e ponto com indexOf.');

  E('joins', 'DB3', 'JOINs', 'JOIN de alunos e cursos', 'JOIN junta linhas de duas tabelas pela chave que elas compartilham.',
    'Complete <code>solucao(alunos, cursos)</code>. Cada aluno tem <code>cursoId</code>. Devolva uma lista de <code>{aluno, curso}</code> (nomes) só dos alunos cujo curso existe — como um INNER JOIN.',
    'alunos, cursos', 'var saida = [];\n  alunos.forEach(function (a) {\n    var c = cursos.find(function (x) { return x.id === a.cursoId; });\n    if (c) saida.push({ aluno: a.nome, curso: c.nome });\n  });\n  return saida;',
    [['junta quem tem curso', [[{ nome: 'Ana', cursoId: 1 }, { nome: 'Bia', cursoId: 2 }, { nome: 'Caio', cursoId: 9 }], [{ id: 1, nome: 'SQL' }, { id: 2, nome: 'Git' }]], [{ aluno: 'Ana', curso: 'SQL' }, { aluno: 'Bia', curso: 'Git' }]], ['sem alunos', [[], [{ id: 1, nome: 'SQL' }]], []], ['curso inexistente', [[{ nome: 'Caio', cursoId: 9 }], [{ id: 1, nome: 'SQL' }]], []]],
    'Para cada aluno, procure o curso com find; só adicione se achar.');

  E('linux', 'DO1', 'Linux', 'Permissão chmod', 'No Linux, cada arquivo tem permissões de leitura (r), escrita (w) e execução (x).',
    'Complete <code>solucao(modo)</code> para converter o modo numérico em texto: <code>"755"</code> vira <code>"rwxr-xr-x"</code>. Cada dígito é 4 (r) + 2 (w) + 1 (x), e uma permissão ausente vira <code>-</code>.',
    'modo', 'var letras = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];\n  return modo.split("").map(function (d) { return letras[Number(d)]; }).join("");',
    [['755', ['755'], 'rwxr-xr-x'], ['644', ['644'], 'rw-r--r--'], ['700', ['700'], 'rwx------']],
    'Cada dígito (0–7) é um índice numa tabela de 8 combinações.');

  E('cia', 'SE1', 'Princípios (CIA)', 'Qual pilar foi atingido?', 'Segurança se apoia em três pilares: confidencialidade, integridade e disponibilidade.',
    'Complete <code>solucao(evento)</code>: se o texto tiver <code>vazou</code> devolva <code>"confidencialidade"</code>; se tiver <code>alterad</code> (alterado/alterada), <code>"integridade"</code>; se tiver <code>fora do ar</code>, <code>"disponibilidade"</code>. Senão, <code>null</code>.',
    'evento', 'var t = evento.toLowerCase();\n  if (t.indexOf("vazou") >= 0) return "confidencialidade";\n  if (t.indexOf("alterad") >= 0) return "integridade";\n  if (t.indexOf("fora do ar") >= 0) return "disponibilidade";\n  return null;',
    [['vazamento', ['A lista de clientes vazou'], 'confidencialidade'], ['alteração', ['O saldo foi alterado por um invasor'], 'integridade'], ['indisponível', ['O site ficou fora do ar'], 'disponibilidade'], ['dia normal', ['Dia normal'], null]],
    'indexOf devolve -1 quando não acha o trecho.');

  E('eletronica', 'EM1', 'Eletrônica básica', 'Corrente do LED (Lei de Ohm)', 'Lei de Ohm: corrente = tensão ÷ resistência.',
    'Complete <code>solucao(tensao, resistencia)</code> para devolver a corrente em amperes (I = V / R). Com resistência 0, devolva <code>null</code>.',
    'tensao, resistencia', 'if (resistencia === 0) return null;\n  return tensao / resistencia;',
    [['5 V e 1000 Ω', [5, 1000], 0.005], ['9 V e 3 Ω', [9, 3], 3], ['resistência zero', [5, 0], null]],
    'Divisão por zero não existe: trate esse caso antes.');

  E('numpy', 'IA1', 'NumPy', 'Soma de vetores', 'NumPy trabalha com vetores inteiros de uma vez: somar vetores é somar posição por posição.',
    'Complete <code>solucao(a, b)</code> para devolver um vetor novo em que cada posição é a soma das posições de a e b.',
    'a, b', 'return a.map(function (x, i) { return x + b[i]; });',
    [['[1,2,3] + [4,5,6]', [[1, 2, 3], [4, 5, 6]], [5, 7, 9]], ['um zero', [[0], [0]], [0]], ['vetores vazios', [[], []], []]],
    'map te dá o valor e o índice: use o índice para pegar o item de b.');

  E('estatistica', 'IA4', 'Estatística', 'Mediana', 'A mediana é o valor do meio da lista ordenada — resiste a valores extremos.',
    'Complete <code>solucao(lista)</code> para devolver a mediana (se o tamanho for par, a média dos dois do meio). Lista vazia devolve <code>null</code>. Não altere a lista original.',
    'lista', 'if (!lista.length) return null;\n  var o = lista.slice().sort(function (a, b) { return a - b; });\n  var m = Math.floor(o.length / 2);\n  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;',
    [['tamanho ímpar', [[3, 1, 2]], 2], ['tamanho par', [[4, 1, 3, 2]], 2.5], ['lista vazia', [[]], null]],
    'sort sem função compara como texto: use (a, b) => a - b.');

  E('algebra', 'IA5', 'Álgebra linear', 'Produto escalar', 'O produto escalar multiplica posição por posição e soma tudo — base de quase todo modelo de IA.',
    'Complete <code>solucao(a, b)</code> para devolver o produto escalar de dois vetores do mesmo tamanho: a[0]·b[0] + a[1]·b[1] + …',
    'a, b', 'var soma = 0;\n  for (var i = 0; i < a.length; i++) soma += a[i] * b[i];\n  return soma;',
    [['[1,2,3]·[4,5,6]', [[1, 2, 3], [4, 5, 6]], 32], ['zeros', [[0, 0], [5, 5]], 0], ['com negativo', [[-1, 2], [3, 4]], 5]],
    'Acumule em uma variável dentro de um laço.');

  E('automacao', 'BO1', 'Scripts de automação', 'Padronizar nomes de arquivos', 'Automação é pegar uma tarefa chata e repetitiva e deixar o código fazer.',
    'Complete <code>solucao(nomes)</code> para devolver a lista com cada nome em minúsculas, sem espaços nas pontas e com os espaços do meio trocados por <code>_</code>.',
    'nomes', 'return nomes.map(function (n) { return n.trim().toLowerCase().replace(/\\s+/g, "_"); });',
    [['um arquivo', [['Foto Final.PNG']], ['foto_final.png']], ['espaços nas pontas e repetidos', [[' Notas  Aula.txt ']], ['notas_aula.txt']], ['lista vazia', [[]], []]],
    'trim, toLowerCase e replace com /\\s+/g resolvem.');

  E('gameloop', 'JG1', 'Game loop', 'Quadros até o game over', 'O game loop repete: ler entrada, atualizar o estado, desenhar. Aqui, só o "atualizar".',
    'Complete <code>solucao(vidas, danoPorQuadro)</code>: a cada quadro o jogador perde <code>danoPorQuadro</code> de vida. Devolva quantos quadros passam até as vidas chegarem a 0 ou menos. Se o dano for 0 ou negativo, devolva <code>null</code>.',
    'vidas, danoPorQuadro', 'if (danoPorQuadro <= 0) return null;\n  var quadros = 0;\n  while (vidas > 0) {\n    vidas -= danoPorQuadro;\n    quadros++;\n  }\n  return quadros;',
    [['10 de vida, 3 por quadro', [10, 3], 4], ['9 de vida, 3 por quadro', [9, 3], 3], ['já começa sem vida', [0, 5], 0], ['sem dano devolve null', [5, 0], null]],
    'Um while que diminui a vida e conta os quadros.');

  E('gamedesign', 'JG9', 'Game design', 'Nível pelo XP', 'Progressão é o que prende o jogador: XP vira nível.',
    'Complete <code>solucao(xp, xpPorNivel)</code> para devolver o nível do jogador. Com 0 de XP ele está no nível 1, e sobe um nível a cada <code>xpPorNivel</code>.',
    'xp, xpPorNivel', 'return Math.floor(xp / xpPorNivel) + 1;',
    [['0 de XP', [0, 100], 1], ['99 de XP', [99, 100], 1], ['100 de XP', [100, 100], 2], ['250 de XP', [250, 100], 3]],
    'Divisão arredondada para baixo, mais 1.');

  E('mobile', 'MO1', 'Design mobile', 'Botões pequenos demais', 'No celular o dedo é grosso: botões precisam de pelo menos 44 px de lado.',
    'Complete <code>solucao(botoes)</code>. Cada botão é <code>{nome, lado}</code>. Devolva só os <b>nomes</b> dos botões com lado menor que 44.',
    'botoes', 'return botoes.filter(function (b) { return b.lado < 44; }).map(function (b) { return b.nome; });',
    [['um botão pequeno', [[{ nome: 'ok', lado: 48 }, { nome: 'x', lado: 30 }, { nome: 'menu', lado: 44 }]], ['x']], ['lista vazia', [[]], []], ['dois pequenos', [[{ nome: 'a', lado: 20 }, { nome: 'b', lado: 43 }]], ['a', 'b']]],
    'filter escolhe os botões; map pega só os nomes.');

  E('codigolimpo', 'ES1', 'Código limpo', 'snake_case para camelCase', 'Código limpo segue convenções de nome para qualquer pessoa ler rápido.',
    'Complete <code>solucao(nome)</code> para converter <code>total_de_itens</code> em <code>totalDeItens</code>: a primeira parte fica igual e cada parte seguinte começa com maiúscula.',
    'nome', 'return nome.split("_").map(function (p, i) { return i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1); }).join("");',
    [['total_de_itens', ['total_de_itens'], 'totalDeItens'], ['uma palavra só', ['nome'], 'nome'], ['preco_final', ['preco_final'], 'precoFinal']],
    'split("_") separa; a primeira fica, as outras ganham maiúscula.');

  E('ageis', 'ES4', 'Metodologias ágeis', 'O que cabe na sprint', 'Em metodologias ágeis, a equipe só compromete o que cabe na capacidade da sprint.',
    'Complete <code>solucao(tarefas, capacidade)</code>. Cada tarefa é <code>{nome, pontos}</code>, já em ordem de prioridade. Pegue as tarefas na ordem até a próxima não caber e devolva os <b>nomes</b> das escolhidas.',
    'tarefas, capacidade', 'var usados = 0;\n  var feitas = [];\n  for (var i = 0; i < tarefas.length; i++) {\n    if (usados + tarefas[i].pontos > capacidade) break;\n    usados += tarefas[i].pontos;\n    feitas.push(tarefas[i].nome);\n  }\n  return feitas;',
    [['cabem duas', [[{ nome: 'login', pontos: 5 }, { nome: 'perfil', pontos: 3 }, { nome: 'chat', pontos: 8 }], 10], ['login', 'perfil']], ['cabem todas', [[{ nome: 'login', pontos: 5 }, { nome: 'perfil', pontos: 3 }, { nome: 'chat', pontos: 8 }], 20], ['login', 'perfil', 'chat']], ['não cabe nenhuma', [[{ nome: 'login', pontos: 5 }], 2], []]],
    'Some os pontos e pare (break) quando a próxima estourar a capacidade.');

  E('docs', 'ES6', 'Documentação técnica', 'Linha de documentação da função', 'Documentação boa mostra o nome da função e o que ela recebe.',
    'Complete <code>solucao(nome, params)</code> para devolver um título em Markdown: <code>"### soma(a, b)"</code>. Os parâmetros ficam separados por vírgula e espaço.',
    'nome, params', 'return "### " + nome + "(" + params.join(", ") + ")";',
    [['soma(a, b)', ['soma', ['a', 'b']], '### soma(a, b)'], ['sem parâmetros', ['ola', []], '### ola()'], ['três parâmetros', ['area', ['l', 'a', 'p']], '### area(l, a, p)']],
    'join(", ") junta a lista de parâmetros.');

  /* ---------------- trilhas por constelação (abertas a partir do mapa) ---------------- */

  const POR_RAIZ = {};
  NOVAS.forEach((n) => { (POR_RAIZ[n.raiz] = POR_RAIZ[n.raiz] || []).push(n); });

  Object.keys(POR_RAIZ).forEach((raiz) => {
    const c = L.CONSTELACOES[raiz] || { nome: raiz };
    const lista = POR_RAIZ[raiz];
    L.TRILHAS_BASE['const-' + raiz] = {
      nome: 'Constelação · ' + c.nome,
      projeto: 'a constelação ' + c.nome,
      descricao: 'Exercícios das estrelas de ' + c.nome + ' abertas pelo mapa.',
      icone: ICONES[raiz] || '⭐',
      oculta: true,
      estrelas: lista.map((n) => n.id),
      jaAcesas: [],
      aulas: lista.map((n) => ({
        titulo: n.titulo,
        skill: n.id,
        ex: n.id,
        texto: n.conceito,
        passos: [
          'Aula: ' + n.conceito,
          'Programação: resolva "' + n.titulo + '"',
          'Programação com IA: peça uma revisão do seu código e explique cada linha',
        ],
        why: 'Cada estrela acesa em ' + c.nome + ' revela as vizinhas no seu céu.',
      })),
    };
  });

  /* ---------------- ganchos para os outros arquivos ---------------- */

  L.EX_EXTRA = EX;
  window.LUNOX_CASOS_EXTRA = CASOS;
})();
