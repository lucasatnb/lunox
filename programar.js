/* ============================================================
   Página Programar — editor, testes no navegador e IA (Nemotron)
   ============================================================ */
(function () {
  'use strict';
  const L = window.LUNOX;
  const { $, esc, toast } = L;

  L.montarNav('programar');

  const LG = window.LUNOX_LANGS;
  const BLOCOS = window.LUNOX_BLOCOS;
  let lang = 'javascript';
  try { lang = localStorage.getItem('lunox-lang') || 'javascript'; } catch (e) {}
  if (LG.porId(lang).id !== lang) lang = 'javascript';
  let exKey = 'variaveis';

  /* ---------------- catálogo de exercícios ---------------- */

  function suite(corpo) {
    return 'var out = [];\n' +
      'function check(nome, fn) {\n' +
      '  try {\n' +
      '    var r = fn();\n' +
      '    out.push({ nome: nome, ok: r === true, detalhe: r === true ? "" : String(r || "falhou") });\n' +
      '  } catch (e) {\n' +
      '    out.push({ nome: nome, ok: false, detalhe: e.message });\n' +
      '  }\n' +
      '}\n' + corpo + '\nreturn out;';
  }

  const EXERCICIOS = {
    variaveis: {
      titulo: 'Guardar quem falou com o bot',
      enunciado: 'O bot precisa lembrar de quem mandou a mensagem antes de responder. Complete a função <code>solucao(nome)</code> para devolver <code>Olá, NOME!</code>.',
      reqs: ['Crie uma variável para guardar o nome recebido', 'Monte a saudação usando essa variável', 'Devolva a string terminando com "!"'],
      dica: 'const usuario = nome;\nreturn "Olá, " + usuario + "!";',
      starter: `function solucao(nome) {
  // TODO: guarde o nome em uma variável
  // e devolva a saudação

}
`,
      solucao: `function solucao(nome) {
  const usuario = nome;
  return "Olá, " + usuario + "!";
}
`,
      testes: suite(`check("devolve a saudação para Ana", function () { return solucao("Ana") === "Olá, Ana!"; });
check("devolve a saudação para Lucas", function () { return solucao("Lucas") === "Olá, Lucas!"; });
check("funciona com outro nome", function () { return solucao("Bia") === "Olá, Bia!"; });`),
    },

    condicoes: {
      titulo: 'Responder só quando for chamado',
      enunciado: 'Um bot não responde a tudo: ele checa se a mensagem é para ele. Complete <code>solucao(mensagem)</code>: se for <code>"oi"</code>, devolva uma saudação; senão, devolva <code>null</code>.',
      reqs: ['Use um if para testar a mensagem', 'Devolva uma string quando for "oi"', 'Devolva null para qualquer outra mensagem'],
      dica: 'if (mensagem === "oi") {\n  return "Olá! Como posso ajudar?";\n}\nreturn null;',
      starter: `function solucao(mensagem) {
  // TODO: se a mensagem for "oi", responda
  // senão devolva null

}
`,
      solucao: `function solucao(mensagem) {
  if (mensagem === "oi") {
    return "Olá! Como posso ajudar?";
  }
  return null;
}
`,
      testes: suite(`check("responde quando a mensagem é oi", function () { var r = solucao("oi"); return typeof r === "string" && r.length > 0; });
check("ignora tchau", function () { return solucao("tchau") === null; });
check("ignora bom dia", function () { return solucao("bom dia") === null; });`),
    },

    lacos: {
      titulo: 'Pontuação de todas as fases',
      enunciado: 'As fases do jogo são uma lista. Complete <code>solucao(numeros)</code> para somar todos os pontos usando um laço.',
      reqs: ['Crie uma variável para acumular a soma', 'Percorra a lista com for ou while', 'Devolva o total (lista vazia soma 0)'],
      dica: 'let soma = 0;\nfor (let i = 0; i < numeros.length; i++) {\n  soma = soma + numeros[i];\n}\nreturn soma;',
      starter: `function solucao(numeros) {
  // TODO: some os pontos com um laço

}
`,
      solucao: `function solucao(numeros) {
  let soma = 0;
  for (let i = 0; i < numeros.length; i++) {
    soma = soma + numeros[i];
  }
  return soma;
}
`,
      arquivos: [
        {
          nome: 'fases.js',
          starter: `// Fases do jogo: cada número é a pontuação de uma fase
var FASES = [120, 80, 45];
`,
          solucao: `// Fases do jogo: cada número é a pontuação de uma fase
var FASES = [120, 80, 45];
`,
        },
        {
          nome: 'solucao.js',
          principal: true,
          starter: `function solucao(numeros) {
  // TODO: some os pontos com um laço

}
`,
          solucao: `function solucao(numeros) {
  let soma = 0;
  for (let i = 0; i < numeros.length; i++) {
    soma = soma + numeros[i];
  }
  return soma;
}
`,
        },
      ],
      testes: suite(`check("soma as fases do arquivo fases.js", function () { return solucao(FASES) === 245; });
check("lista vazia soma 0", function () { return solucao([]) === 0; });
check("soma com números negativos", function () { return solucao([10, -2, 5]) === 13; });`),
    },

    funcoes: {
      titulo: 'Reaproveitar o cálculo de desconto',
      enunciado: 'Crie uma função que calcule o preço com desconto. <code>solucao(preco, desconto)</code> recebe o preço e a porcentagem (0 a 100) e devolve o valor final.',
      reqs: ['A função recebe dois números', 'Calcule preço menos o desconto em porcentagem', 'Devolva o resultado'],
      dica: 'return preco - (preco * desconto / 100);',
      starter: `function solucao(preco, desconto) {
  // TODO: aplique o desconto e devolva o preço final

}
`,
      solucao: `function solucao(preco, desconto) {
  return preco - (preco * desconto / 100);
}
`,
      testes: suite(`check("100 com 10% vira 90", function () { return solucao(100, 10) === 90; });
check("200 com 25% vira 150", function () { return solucao(200, 25) === 150; });
check("desconto 0 mantém o preço", function () { return solucao(50, 0) === 50; });`),
    },

    listas: {
      titulo: 'Listar só os aprovados',
      enunciado: 'Cada aluno é um objeto com <code>nome</code> e <code>nota</code>. Complete <code>solucao(alunos)</code> para devolver uma lista só com os nomes de quem tem nota maior ou igual a 7.',
      reqs: ['Percorra a lista de alunos', 'Filtre quem tem nota >= 7', 'Devolva uma lista de nomes'],
      dica: 'return alunos.filter(function (a) { return a.nota >= 7; }).map(function (a) { return a.nome; });',
      starter: `function solucao(alunos) {
  // TODO: devolva só os nomes dos aprovados

}
`,
      solucao: `function solucao(alunos) {
  return alunos.filter(function (a) { return a.nota >= 7; }).map(function (a) { return a.nome; });
}
`,
      testes: suite(`var alunos = [{ nome: "Ana", nota: 8 }, { nome: "Bia", nota: 5 }, { nome: "Caio", nota: 7 }];
check("devolve os dois aprovados", function () { return JSON.stringify(solucao(alunos)) === JSON.stringify(["Ana", "Caio"]); });
check("lista vazia devolve lista vazia", function () { return solucao([]).length === 0; });
check("nota 7 conta como aprovado", function () { return solucao([{ nome: "Duda", nota: 7 }])[0] === "Duda"; });`),
    },

    interfaces: {
      titulo: 'Estruturar a página do portfólio',
      enunciado: 'Uma interface começa pela estrutura. Complete <code>solucao(titulo)</code> para devolver um título HTML no formato <code>&lt;h1&gt;SEU TÍTULO&lt;/h1&gt;</code>.',
      reqs: ['Abra a tag h1', 'Coloque o título recebido dentro', 'Feche a tag h1'],
      dica: 'return "<h1>" + titulo + "</h1>";',
      starter: `function solucao(titulo) {
  // TODO: devolva o título dentro de uma tag h1

}
`,
      solucao: `function solucao(titulo) {
  return "<h1>" + titulo + "</h1>";
}
`,
      testes: suite(`check("abre a tag h1", function () { return solucao("Meu portfólio").indexOf("<h1>") >= 0; });
check("inclui o título recebido", function () { return solucao("Meu portfólio").indexOf("Meu portfólio") >= 0; });
check("fecha a tag h1", function () { return solucao("Meu portfólio").indexOf("</h1>") >= 0; });`),
    },

    apis: {
      titulo: 'Ler a resposta da API',
      enunciado: 'A API do Discord devolve JSON. Complete <code>solucao(resposta)</code>: transforme o texto JSON em objeto e devolva o campo <code>nome</code>.',
      reqs: ['Use JSON.parse para ler a resposta', 'Acesse o campo nome', 'Devolva o valor encontrado'],
      dica: 'const dados = JSON.parse(resposta);\nreturn dados.nome;',
      starter: `function solucao(resposta) {
  // TODO: leia o JSON e devolva o nome

}
`,
      solucao: `function solucao(resposta) {
  const dados = JSON.parse(resposta);
  return dados.nome;
}
`,
      arquivos: [
        {
          nome: 'resposta.js',
          starter: `// Resposta crua que a API do Discord devolveu
var RESPOSTA_API = '{"nome":"Ana","id":1}';
`,
          solucao: `// Resposta crua que a API do Discord devolveu
var RESPOSTA_API = '{"nome":"Ana","id":1}';
`,
        },
        {
          nome: 'solucao.js',
          principal: true,
          starter: `function solucao(resposta) {
  // TODO: leia o JSON e devolva o nome

}
`,
          solucao: `function solucao(resposta) {
  const dados = JSON.parse(resposta);
  return dados.nome;
}
`,
        },
      ],
      testes: suite(`check("lê o nome da resposta da API", function () { return solucao(RESPOSTA_API) === "Ana"; });
check("lê o nome Caio", function () { return solucao('{"nome":"Caio"}') === "Caio"; });
check("funciona com espaços no JSON", function () { return solucao('{ "nome": "Bia" }') === "Bia"; });`),
    },

    arquivos: {
      titulo: 'Contar linhas de um arquivo',
      enunciado: 'O bot lê um arquivo de configuração. Complete <code>solucao(texto)</code> para contar quantas linhas não vazias existem.',
      reqs: ['Separe o texto por quebra de linha', 'Ignore linhas vazias ou só com espaços', 'Devolva a quantidade'],
      dica: 'return texto.split("\\n").filter(function (l) { return l.trim() !== ""; }).length;',
      starter: `function solucao(texto) {
  // TODO: conte as linhas não vazias

}
`,
      solucao: `function solucao(texto) {
  return texto.split("\\n").filter(function (l) { return l.trim() !== ""; }).length;
}
`,
      arquivos: [
        {
          nome: 'config.js',
          starter: `// Configuração do bot: em um projeto real, este arquivo fica fora do código
var CONFIG_TEXTO = "token=abc123\\nprefixo=!\\n\\n# canal de avisos\\ncanal=geral";
`,
          solucao: `// Configuração do bot: em um projeto real, este arquivo fica fora do código
var CONFIG_TEXTO = "token=abc123\\nprefixo=!\\n\\n# canal de avisos\\ncanal=geral";
`,
        },
        {
          nome: 'solucao.js',
          principal: true,
          starter: `function solucao(texto) {
  // TODO: conte as linhas não vazias

}
`,
          solucao: `function solucao(texto) {
  return texto.split("\\n").filter(function (l) { return l.trim() !== ""; }).length;
}
`,
        },
      ],
      testes: suite(`check("conta as linhas do arquivo de configuração", function () { return solucao(CONFIG_TEXTO) === 4; });
check("ignora linhas vazias", function () { return solucao("a\\n\\nb\\n") === 2; });
check("texto vazio conta 0", function () { return solucao("") === 0; });`),
    },

    banco: {
      titulo: 'Filtrar alunos no banco',
      enunciado: 'O CRUD precisa listar quem passou. Complete <code>solucao(alunos, notaMinima)</code> devolvendo só os alunos com nota maior ou igual à mínima — sem alterar a lista original.',
      reqs: ['Receba a lista e a nota mínima', 'Filtre sem alterar a lista original', 'Devolva os objetos dos aprovados'],
      dica: 'return alunos.filter(function (a) { return a.nota >= notaMinima; });',
      starter: `function solucao(alunos, notaMinima) {
  // TODO: devolva os alunos com nota >= notaMinima

}
`,
      solucao: `function solucao(alunos, notaMinima) {
  return alunos.filter(function (a) { return a.nota >= notaMinima; });
}
`,
      testes: suite(`var alunos = [{ nome: "Ana", nota: 8 }, { nome: "Bia", nota: 5 }, { nome: "Caio", nota: 7 }];
check("filtra os aprovados", function () { return solucao(alunos, 7).length === 2; });
check("mantém a lista original", function () { return alunos.length === 3; });
check("nota mínima 9 não acha ninguém", function () { return solucao(alunos, 9).length === 0; });`),
    },

    banco2: {
      titulo: 'Apagar um aluno sem quebrar a lista',
      enunciado: 'No CRUD, apagar é a operação mais perigosa. Complete <code>solucao(alunos, id)</code> devolvendo uma lista sem o aluno daquele id.',
      reqs: ['Receba a lista e o id a remover', 'Devolva uma lista nova, sem o id', 'Se o id não existir, devolva todos'],
      dica: 'return alunos.filter(function (a) { return a.id !== id; });',
      starter: `function solucao(alunos, id) {
  // TODO: devolva a lista sem o aluno com esse id

}
`,
      solucao: `function solucao(alunos, id) {
  return alunos.filter(function (a) { return a.id !== id; });
}
`,
      arquivos: [
        {
          nome: 'alunos.js',
          starter: `// Alunos já cadastrados no "banco" do CRUD
var ALUNOS = [{ id: 1, nome: "Ana" }, { id: 2, nome: "Bia" }, { id: 3, nome: "Caio" }];
`,
          solucao: `// Alunos já cadastrados no "banco" do CRUD
var ALUNOS = [{ id: 1, nome: "Ana" }, { id: 2, nome: "Bia" }, { id: 3, nome: "Caio" }];
`,
        },
        {
          nome: 'solucao.js',
          principal: true,
          starter: `function solucao(alunos, id) {
  // TODO: devolva a lista sem o aluno com esse id

}
`,
          solucao: `function solucao(alunos, id) {
  return alunos.filter(function (a) { return a.id !== id; });
}
`,
        },
      ],
      testes: suite(`check("remove o aluno 2 do banco", function () { var r = solucao(ALUNOS, 2); return r.length === 2 && r[0].id === 1 && r[1].id === 3; });
check("não altera a lista original", function () { return ALUNOS.length === 3; });
check("id inexistente mantém todos", function () { return solucao(ALUNOS, 99).length === 3; });`),
    },

    design: {
      titulo: 'Definir o tema visual',
      enunciado: 'O portfólio precisa de um tema. Complete <code>solucao(cor)</code> devolvendo um objeto com <code>fundo</code>, <code>texto</code> e <code>destaque</code>. Use fundo escuro e texto claro.',
      reqs: ['Devolva um objeto', 'Tenha as chaves fundo, texto e destaque', 'Use a cor recebida como destaque'],
      dica: 'return { fundo: "#0b0b14", texto: "#f5f3ff", destaque: cor };',
      starter: `function solucao(cor) {
  // TODO: devolva o tema com fundo, texto e destaque

}
`,
      solucao: `function solucao(cor) {
  return { fundo: "#0b0b14", texto: "#f5f3ff", destaque: cor };
}
`,
      testes: suite(`check("tem as três chaves", function () { var t = solucao("#ffd700"); return !!t.fundo && !!t.texto && !!t.destaque; });
check("usa a cor recebida no destaque", function () { return solucao("#ffd700").destaque === "#ffd700"; });
check("fundo e texto são diferentes", function () { var t = solucao("#ffd700"); return t.fundo !== t.texto; });`),
    },

    git: {
      titulo: 'Montar o primeiro commit',
      enunciado: 'Publique o projeto. Complete <code>solucao()</code> devolvendo a sequência de comandos do primeiro commit: iniciar o repositório, adicionar os arquivos e commitar.',
      reqs: ['Inclua o comando git init', 'Inclua git add para todos os arquivos', 'Inclua git commit com uma mensagem'],
      dica: 'return ["git init", "git add .", "git commit -m \\"primeiro commit\\""];',
      starter: `function solucao() {
  // TODO: devolva os comandos na ordem certa

}
`,
      solucao: `function solucao() {
  return ["git init", "git add .", "git commit -m \\"primeiro commit\\""];
}
`,
      testes: suite(`check("devolve uma lista de comandos", function () { return Array.isArray(solucao()) && solucao().length >= 3; });
check("inicia o repositório", function () { return solucao().join(" ").indexOf("git init") >= 0; });
check("adiciona os arquivos", function () { return solucao().some(function (c) { return String(c).indexOf("git add") === 0; }); });
check("commita com mensagem", function () { return solucao().some(function (c) { return String(c).indexOf("git commit") === 0 && String(c).indexOf("-m") >= 0; }); });`),
    },

    movimento: {
      titulo: 'O personagem se move',
      enunciado: 'Movimento é estado: a posição muda a cada quadro. Complete <code>solucao(pos, vel, dt)</code> devolvendo a nova posição depois de <code>dt</code> segundos.',
      reqs: ['Multiplique a velocidade pelo tempo', 'Some à posição atual', 'Devolva a nova posição'],
      dica: 'return pos + vel * dt;',
      starter: `function solucao(pos, vel, dt) {
  // TODO: calcule a nova posição

}
`,
      solucao: `function solucao(pos, vel, dt) {
  return pos + vel * dt;
}
`,
      testes: suite(`check("anda 6 a partir de 10", function () { return solucao(10, 2, 3) === 16; });
check("velocidade negativa volta", function () { return solucao(0, -5, 2) === -10; });
check("funciona com decimais", function () { return solucao(2.5, 1, 2) === 4.5; });`),
    },

    colisao: {
      titulo: 'Detectar colisão',
      enunciado: 'Sem regra não existe jogo. Complete <code>solucao(a, b)</code> para devolver <code>true</code> quando dois retângulos se sobrepõem. Cada um tem <code>x</code>, <code>y</code>, <code>w</code> e <code>h</code>.',
      reqs: ['Compare os eixos x e y', 'Considere a largura e a altura dos dois', 'Devolva true só quando houver sobreposição'],
      dica: 'return a.x < b.x + b.w && a.x + a.w > b.x &&\n       a.y < b.y + b.h && a.y + a.h > b.y;',
      starter: `function solucao(a, b) {
  // TODO: devolva true se os retângulos se sobrepõem

}
`,
      solucao: `function solucao(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
`,
      testes: suite(`var a = { x: 0, y: 0, w: 10, h: 10 };
check("detecta sobreposição", function () { return solucao(a, { x: 5, y: 5, w: 10, h: 10 }) === true; });
check("detecta que estão longe", function () { return solucao(a, { x: 20, y: 20, w: 5, h: 5 }) === false; });
check("um dentro do outro colide", function () { return solucao(a, { x: 2, y: 2, w: 3, h: 3 }) === true; });`),
    },
  };
  Object.assign(EXERCICIOS, L.EX_EXTRA || {});

  /* FU1 — Lógica de programação é a ÚNICA estrela em blocos.
     O programa fica salvo como JSON em `starter`/`solucao`; os testes
     recebem `saida` (a lista do que o programa mostrou). */
  EXERCICIOS.logica = {
    titulo: 'Par ou ímpar, passo a passo',
    enunciado: 'Monte um programa em blocos que mostre os números de <b>1 a 5</b> e, em cada linha, ' +
      'diga se o número é <b>par</b> ou <b>ímpar</b>. Use um laço e uma decisão.',
    reqs: ['Use o bloco "repita"', 'Use "se" com o resto da divisão por 2', 'Mostre uma linha para cada número'],
    dica: 'Um número é par quando o resto da divisão por 2 é igual a 0: n % 2 == 0.',
    linguagem: 'blocos',
    starter: JSON.stringify([
      { tipo: 'definir', nome: 'n', valor: '1' },
      { tipo: 'repetir', vezes: '5', corpo: [
        { tipo: 'diga', valor: 'n' },
        { tipo: 'mudar', nome: 'n', valor: '1' },
      ] },
    ]),
    solucao: JSON.stringify([
      { tipo: 'definir', nome: 'n', valor: '1' },
      { tipo: 'repetir', vezes: '5', corpo: [
        { tipo: 'se', cond: 'n % 2 == 0', corpo: [
          { tipo: 'diga', valor: 'n + " é par"' },
        ], senao: [
          { tipo: 'diga', valor: 'n + " é ímpar"' },
        ] },
        { tipo: 'mudar', nome: 'n', valor: '1' },
      ] },
    ]),
    testes: 'check("mostra 1 a 5 com par ou ímpar", function () {\n' +
      '  return saida.join(" | ") === "1 é ímpar | 2 é par | 3 é ímpar | 4 é par | 5 é ímpar";\n' +
      '});\n' +
      'check("mostra cinco linhas", function () { return saida.length === 5; });',
  };

  /* ---------------- estado ---------------- */

  const WORKER_SRC = `
self.onmessage = function (e) {
  var data = e.data || {};
  var logs = [];
  function fmt(v) {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch (err) { return String(v); }
  }
  function fake(prefix) {
    return function () {
      var a = Array.prototype.slice.call(arguments);
      logs.push((prefix || "") + a.map(fmt).join(" "));
    };
  }
  var c = { log: fake(""), warn: fake("[warn] "), error: fake("[erro] ") };
  try {
    var fn = new Function("console", data.codigo + "\\n;return (function () {\\n" + data.testes + "\\n})();");
    var resultados = fn(c) || [];
    self.postMessage({ ok: true, resultados: resultados, logs: logs });
  } catch (err) {
    self.postMessage({ ok: false, erro: (err && err.message) || String(err), logs: logs });
  }
};
`;

  const params = new URLSearchParams(location.search);
  const AULAS = window.LUNOX_AULAS_API;

  // exercício criado na aba admin: ?estrela=FU7&grupo=0 (ou &final=1)
  const estrelaParam = String(params.get('estrela') || '').trim().toUpperCase();
  let custom = null;
  if (AULAS && estrelaParam && L.estrela(estrelaParam)) {
    const grupoParam = params.get('grupo');
    if (params.get('final') === '1') {
      const ex = AULAS.desafioFinalDe(estrelaParam);
      if (ex) custom = { sid: estrelaParam, chave: 'final', tipo: 'final', indice: -1, ex };
    } else if (grupoParam != null) {
      const i = Math.max(0, Number(grupoParam) || 0);
      const ex = AULAS.exercicioDe(estrelaParam, i);
      if (ex) custom = { sid: estrelaParam, chave: 'g' + i, tipo: 'grupo', indice: i, ex };
    }
  }
  // exercícios da admin usam a linguagem declarada (Python por padrão)
  if (custom) {
    lang = custom.ex.linguagem === 'javascript' || custom.ex.linguagem === 'typescript'
      ? custom.ex.linguagem
      : 'python';
  }

  // desafio final só abre depois dos exercícios das aulas da estrela
  if (custom && custom.tipo === 'final' && L.finalLiberado && !L.finalLiberado(custom.sid)) {
    const daAula = L.exerciciosDaAula ? L.exerciciosDaAula(custom.sid) : [];
    const falta = daAula.filter((e) => !L.exercicioOk(custom.sid, e.chave));
    const feitos = daAula.length - falta.length;
    const primeiro = falta[0];
    const link = primeiro
      ? 'programar.html?estrela=' + encodeURIComponent(custom.sid) + '&grupo=' + primeiro.indice
      : 'sua-trilha.html?estrela=' + encodeURIComponent(custom.sid);
    $('main').innerHTML = '<div class="panel final-bloqueio" style="max-width:640px;margin:50px auto;text-align:center">' +
      '<div class="kicker">Desafio final</div>' +
      '<h2>🔒 Desafio final bloqueado</h2>' +
      '<p class="lead" style="margin:10px auto 16px">Conclua os exercícios das aulas da estrela <b>' +
        esc(L.estrela(custom.sid).nome) + '</b> antes de fazer o desafio final.</p>' +
      '<span class="chip ' + (falta.length ? 'dim' : 'ok') + '">' + feitos + '/' + daAula.length + ' exercícios concluídos</span>' +
      (falta.length
        ? '<ul class="desafio-reqs" style="text-align:left;max-width:420px;margin:16px auto">' +
          falta.map((e) => '<li>' + esc(e.titulo) + '</li>').join('') + '</ul>'
        : '') +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px">' +
        '<a class="btn primary" href="' + link + '">' + (primeiro ? 'Ir para o primeiro pendente' : 'Voltar para a trilha') + '</a>' +
        '<a class="btn ghost" href="sua-trilha.html?estrela=' + encodeURIComponent(custom.sid) + '">Ver a estrela</a>' +
      '</div>' +
    '</div>';
    return;
  }

  // vindo do mapa: ?skill=funcoes abre a aula/exercício dessa estrela
  const skillParam = custom ? null : params.get('skill');
  const resolvido = skillParam ? L.acharAulaPorSkill(skillParam) : null;
  if (resolvido) L.setAtual(resolvido.trilha.id);

  function trilhaCustom() {
    const sk = L.skillDaEstrela(custom.sid);
    return {
      id: 'estrela:' + custom.sid + ':' + custom.chave,
      nome: L.estrela(custom.sid).nome,
      aulas: [{
        titulo: custom.ex.titulo || (custom.tipo === 'final' ? 'Desafio final' : 'Exercício'),
        skill: sk ? sk.id : '',
        ex: null,
      }],
    };
  }

  let trilha = custom ? trilhaCustom() : (resolvido ? resolvido.trilha : (L.achar(params.get('trilha') || '') || L.atualObj()));
  let aulaIdx = 0;
  let passo = Number(params.get('passo') || 1);

  if (!trilha) {
    $('main').innerHTML = '<div class="panel" style="max-width:640px;margin:50px auto;text-align:center">' +
      '<div class="kicker">Programar</div>' +
      '<h2>Você ainda não tem uma trilha</h2>' +
      '<p class="lead" style="margin:10px auto 16px">Crie um projeto no chat ou na trilha e o editor abre no exercício certo.</p>' +
      '<a class="btn primary" href="index.html">Criar trilha</a></div>';
    return;
  }

  aulaIdx = custom ? 0 : (resolvido
    ? resolvido.idx
    : Math.max(0, Math.min(trilha.aulas.length - 1, Number(params.get('aula') || 0))));

  const editor = $('#code');
  const selTrilha = $('#sel-trilha');
  const selAula = $('#sel-aula');
  const editorPanel = $('.editor-panel');
  const outGrid = $('.out-grid');
  const edTabs = $('#ed-tabs');
  const dfOverlay = $('#df-overlay');

  let exAtual = null;
  let codigoValidado = false;
  let ultimaExecucao = null;
  let rodando = false;
  let iaBusy = false;
  let saveTimer = null;
  let arquivosEx = null;   // desafios com mais de um arquivo (só JS/TS)
  let arqAtual = 0;
  let dfAberto = false;
  let dfHome = null;

  /* ---------------- blocos (estrela FU1) ---------------- */

  const blocosHost = $('#blocos-host');
  let blocosUI = null;

  /** Verdadeiro quando o exercício atual é em blocos. */
  function modoBlocos() {
    return !!(exAtual && exAtual.linguagem === 'blocos');
  }

  /** Texto do programa em blocos (JSON) — o que fica salvo. */
  function programaTexto() {
    if (!blocosUI) return '[]';
    return BLOCOS.paraJSON(blocosUI.programa());
  }

  function programaVazio() {
    return !blocosUI || blocosUI.programa().length === 0;
  }

  /** Código/programa em texto legível para a IA e para a tela cheia. */
  function textoParaIA() {
    return modoBlocos() ? BLOCOS.paraTexto(blocosUI ? blocosUI.programa() : []) : editor.value;
  }

  function montarBlocos(inicial) {
    if (!blocosHost || !BLOCOS) return;
    if (blocosUI) { blocosUI.destruir(); blocosUI = null; }
    blocosHost.hidden = false;
    blocosUI = BLOCOS.criar(blocosHost, {
      programa: inicial,
      onChange: function () {
        codigoValidado = false;
        atualizarStatus();
        salvarDebounced();
      },
    });
  }

  function desmontarBlocos() {
    if (blocosUI) { blocosUI.destruir(); blocosUI = null; }
    if (blocosHost) blocosHost.hidden = true;
  }

  /* ---------------- helpers ---------------- */

  function aulaAtual() {
    return trilha.aulas[aulaIdx];
  }

  function chaveCodigo() {
    if (modoBlocos()) return 'blocos:' + aulaIdx;
    return lang === 'javascript' ? aulaIdx : aulaIdx + '@' + lang;
  }

  function chaveArquivo(nome) {
    return chaveCodigo() + '::' + nome;
  }

  /* Um exercício pode declarar `arquivos` (mais de um arquivo). Os arquivos de
     apoio são concatenados antes do principal na hora de rodar. */
  function arquivosDoExercicio(ex) {
    if (ex && ex.linguagem === 'blocos') return null;
    if (lang !== 'javascript' && lang !== 'typescript') return null;
    if (!ex || !Array.isArray(ex.arquivos) || ex.arquivos.length < 2) return null;
    const lista = ex.arquivos.map((a) => ({
      nome: String(a.nome || 'arquivo.js'),
      principal: !!a.principal,
      starter: String(a.starter || ''),
      solucao: String(a.solucao || a.starter || ''),
      texto: '',
    }));
    if (!lista.some((a) => a.principal)) lista[lista.length - 1].principal = true;
    return lista;
  }

  function rotuloRodar() {
    if (modoBlocos()) return 'Rodar testes';
    return LG.porId(lang).modo === 'livre' ? 'Compilar e rodar' : 'Rodar testes';
  }

  function salvarAtual() {
    if (!trilha) return;
    if (modoBlocos()) {
      L.salvarCodigo(trilha.id, chaveCodigo(), programaTexto());
      return;
    }
    if (arquivosEx) {
      arquivosEx[arqAtual].texto = editor.value;
      L.salvarCodigo(trilha.id, chaveArquivo(arquivosEx[arqAtual].nome), editor.value);
      return;
    }
    L.salvarCodigo(trilha.id, chaveCodigo(), editor.value);
  }

  function salvarDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(salvarAtual, 350);
  }

  function codigoParaRodar() {
    if (!arquivosEx) return editor.value;
    arquivosEx[arqAtual].texto = editor.value;
    const principal = arquivosEx.find((a) => a.principal) || arquivosEx[arquivosEx.length - 1];
    const apoio = arquivosEx
      .filter((a) => a !== principal)
      .map((a) => a.texto)
      .join('\n');
    return apoio + '\n' + principal.texto;
  }

  function updateLines() {
    const n = editor.value.split('\n').length;
    let txt = '';
    for (let i = 1; i <= n; i++) txt += (i === 1 ? '' : '\n') + i;
    const lines = $('#lines');
    lines.textContent = txt;
    lines.scrollTop = editor.scrollTop;
  }

  function renderTabs() {
    if (!edTabs) return;
    if (!arquivosEx) {
      edTabs.hidden = true;
      edTabs.innerHTML = '';
      return;
    }
    edTabs.hidden = false;
    edTabs.innerHTML = arquivosEx.map((a, i) =>
      '<button class="ed-tab' + (i === arqAtual ? ' on' : '') + '" type="button" data-arq="' + i + '">' +
        esc(a.nome) + (a.principal ? '<span class="p">●</span>' : '') +
      '</button>'
    ).join('');
    const alvo = $('#ed-file');
    if (alvo) alvo.textContent = arquivosEx[arqAtual].nome;
  }

  function trocarArquivo(i) {
    if (!arquivosEx || i === arqAtual || !arquivosEx[i]) return;
    salvarAtual();
    arqAtual = i;
    editor.value = arquivosEx[i].texto;
    updateLines();
    renderTabs();
    codigoValidado = false;
    atualizarStatus();
  }

  function plain(html) {
    return String(html || '').replace(/<[^>]+>/g, '');
  }

  function syncURL() {
    if (custom) return;
    const q = new URLSearchParams();
    q.set('trilha', trilha.id);
    q.set('aula', String(aulaIdx));
    if (passo > 1) q.set('passo', String(passo));
    history.replaceState(null, '', location.pathname + '?' + q.toString());
  }

  function popularSelects() {
    const selLang = $('#sel-lang');
    if (modoBlocos()) {
      selLang.innerHTML = '<option value="blocos">Blocos (visual)</option>';
      selLang.value = 'blocos';
      selLang.disabled = true;
    } else {
      const lingEx = custom
        ? (custom.ex.linguagem === 'javascript' || custom.ex.linguagem === 'typescript' ? custom.ex.linguagem : 'python')
        : null;
      const lings = custom ? LG.LINGS.filter((l) => l.id === lingEx) : LG.LINGS;
      const grupo = (titulo, lista) => '<optgroup label="' + titulo + '">' + lista.map((l) =>
        '<option value="' + l.id + '">' + esc(l.nome) + '</option>').join('') + '</optgroup>';
      selLang.innerHTML =
        grupo('Com testes automáticos', lings.filter((l) => l.modo === 'teste')) +
        grupo('Compilar e executar', lings.filter((l) => l.modo === 'livre'));
      selLang.value = lang;
      selLang.disabled = !!custom;
    }

    if (custom) {
      selTrilha.innerHTML = '<option>' + esc(trilha.nome) + '</option>';
      selAula.innerHTML = '<option>' + esc(aulaAtual().titulo) + '</option>';
      [selTrilha, selAula].forEach((el) => {
        el.hidden = true;
        const rot = el.previousElementSibling;
        if (rot && rot.tagName === 'LABEL') rot.hidden = true;
      });
      return;
    }

    [selTrilha, selAula].forEach((el) => {
      el.hidden = false;
      const rot = el.previousElementSibling;
      if (rot && rot.tagName === 'LABEL') rot.hidden = false;
    });
    selTrilha.innerHTML = L.estado.trilhas.map((t) =>
      '<option value="' + esc(t.id) + '">' + esc((t.icone || '🌙') + ' ' + t.nome) + '</option>'
    ).join('');
    selTrilha.value = trilha.id;
    selAula.innerHTML = trilha.aulas.map((a, i) =>
      '<option value="' + i + '">' + (i + 1) + '. ' + esc(a.titulo) + '</option>'
    ).join('');
    selAula.value = String(aulaIdx);
  }

  function atualizarStatus() {
    const pr = L.progressoDe(trilha.id)[aulaIdx] || {};
    const feito = custom ? L.exercicioOk(custom.sid, custom.chave) : codigoValidado;

    const sc = $('#status-codigo');
    sc.textContent = custom
      ? (feito ? 'exercício concluído ✓' : 'exercício pendente')
      : (codigoValidado ? 'código validado ✓' : 'código ainda não validado');
    sc.className = 'chip' + (feito ? ' ok' : '');

    const si = $('#status-ia');
    si.textContent = custom
      ? (feito ? 'estrela em progresso' : 'refino opcional')
      : (pr.ia ? 'refino ok ✓' : 'refino pendente');
    si.className = 'chip' + ((custom ? feito : pr.ia) ? ' gold' : '');

    $('#btn-refino').disabled = !codigoValidado || iaBusy;
    $('#btn-concluir').disabled = !codigoValidado;
    $('#ia-hint').textContent = custom
      ? (feito ? 'a estrela acende quando todos os exercícios forem resolvidos' : 'rode os testes para concluir este exercício')
      : (codigoValidado ? 'a validação aprovada acende a estrela da aula' : 'rode os testes para liberar a validação');

    $('#passo-badge').textContent = custom
      ? (feito ? 'exercício concluído' : 'exercício em andamento')
      : pr.ia
        ? 'passo 3/3 · refino ok'
        : codigoValidado
          ? 'passo 2/3 · código ok'
          : 'passo 1/3 · conceito';
  }

  function renderMiniProgresso() {
    const pr = L.progressoDe(trilha.id)[aulaIdx] || {};
    const pts = custom && L.pontosDoExercicio ? L.pontosDoExercicio(custom.sid, custom.chave) : 0;
    $('#mini-progress').innerHTML =
      '<span class="chip' + (pr.lida ? ' gold' : '') + '">📖 aula</span>' +
      '<span class="chip' + (pr.editor ? ' ok' : '') + '">⌨ código</span>' +
      '<span class="chip' + (pr.ia ? ' gold' : '') + '">🐾 refino</span>' +
      (pts ? '<span class="chip pontos" title="pontos ao concluir">⭐ +' + pts + ' pts</span>' : '');
  }

  function resetSaidas() {
    $('#testes').innerHTML = '<p class="tiny">Ainda não rodou. ' +
      (modoBlocos() ? 'Monte seu programa com os blocos e clique em Rodar testes.' : 'Escreva sua solução e clique em Rodar testes.') +
      '</p>';
    $('#test-count').textContent = '';
    $('#console').textContent = '> pronto.';
    $('#ia-answer').classList.remove('show');
    $('#ia-answer').innerHTML = '';
    $('#ia-verdict').className = 'verdict';
    $('#ia-verdict').textContent = '';
    $('#ia-spin').classList.remove('show');
    $('#refino-pedido').value = '';
    ultimaExecucao = null;
  }

  /** Converte o exercício da admin no formato que a tela já usa. */
  function exercicioCustom() {
    const ex = custom.ex;
    const js = ex.linguagem === 'javascript' || ex.linguagem === 'typescript';
    return {
      titulo: ex.titulo || (custom.tipo === 'final' ? 'Desafio final' : 'Exercício'),
      enunciado: ex.enunciado || '',
      reqs: ex.requisitos || [],
      dica: ex.dica || '',
      linguagem: ex.linguagem || 'python',
      starter: ex.starter || '',
      solucao: ex.solucao || '',
      testes: js ? AULAS.testesComSuite(ex.testes || '') : (ex.testes || ''),
      arquivos: ex.arquivos || [],
    };
  }

  function carregar() {
    const aula = aulaAtual();
    if (custom) {
      exKey = 'custom';
      exAtual = exercicioCustom();
    } else {
      exKey = EXERCICIOS[aula.ex] ? aula.ex : (EXERCICIOS[aula.skill] ? aula.skill : 'variaveis');
      exAtual = EXERCICIOS[exKey];
    }

    const skill = custom ? L.skillDaEstrela(custom.sid) : L.skill(aula.skill);
    const pr = L.progressoDe(trilha.id)[aulaIdx] || {};

    $('#ex-title').textContent = exAtual.titulo;
    $('#ex-enunciado').innerHTML = exAtual.enunciado;
    $('#ex-reqs').innerHTML = exAtual.reqs.map((r) =>
      '<li><span class="m">▸</span><span>' + esc(r) + '</span></li>'
    ).join('');
    $('#ex-dica').textContent = exAtual.dica;
    $('#ex-level').textContent = skill ? skill.nome : 'prática';
    $('#ctx-skill').innerHTML = custom
      ? '<span class="dot"></span>✦ ' + esc(L.estrela(custom.sid).nome) +
        (custom.tipo === 'final' ? ' · desafio final' : ' · exercício ' + (custom.indice + 1))
      : (skill ? '<span class="dot"></span>' + skill.icon + ' ' + esc(skill.nome) : '');
    $('#btn-rodar').textContent = rotuloRodar();

    codigoValidado = custom ? L.exercicioOk(custom.sid, custom.chave) : !!pr.editor;
    const blocos = modoBlocos();
    arquivosEx = blocos ? null : arquivosDoExercicio(exAtual);
    arqAtual = 0;

    const editorBox = $('.editor');
    if (editorBox) editorBox.hidden = blocos;

    if (blocos) {
      $('#ed-file').textContent = 'blocos.lunox';
      if (edTabs) { edTabs.hidden = true; edTabs.innerHTML = ''; }
      const bruto = L.codigoDe(trilha.id, chaveCodigo());
      const inicial = bruto ? BLOCOS.deJSON(bruto) : BLOCOS.deJSON(exAtual.starter || '[]');
      montarBlocos(inicial);
    } else {
      desmontarBlocos();
      if (arquivosEx) {
        arquivosEx.forEach((a) => {
          const padrao = a.principal ? (a.starter || LG.starter(lang, exAtual)) : a.starter;
          a.texto = L.codigoDe(trilha.id, chaveArquivo(a.nome)) || padrao;
        });
        editor.value = arquivosEx[0].texto;
        renderTabs();
      } else {
        $('#ed-file').textContent = custom
          ? (custom.tipo === 'final' ? 'desafio-final' : 'exercicio-' + (custom.indice + 1)) + '.' + LG.porId(lang).ext
          : (lang === 'java' ? 'Main' : 'aula-' + (aulaIdx + 1)) + '.' + LG.porId(lang).ext;
        // exercício da admin: o código inicial é o que o autor escreveu
        const inicial = custom ? (exAtual.starter || LG.starter(lang, exAtual)) : LG.starter(lang, exAtual);
        editor.value = L.codigoDe(trilha.id, chaveCodigo()) || inicial;
        renderTabs();
      }
      updateLines();
    }
    resetSaidas();
    renderMiniProgresso();
    atualizarStatus();
    popularSelects();
    syncURL();
    if (dfAberto) atualizarCabecalhoFull();

    if (passo === 2) {
      setTimeout(() => {
        $('#ia-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 280);
    }
  }

  /* ---------------- testes ---------------- */

  function setConsole(txt) {
    $('#console').textContent = '> ' + txt;
  }

  function addConsole(logs) {
    if (!logs || !logs.length) return;
    logs.forEach((l) => {
      $('#console').textContent += '\n[console] ' + l;
    });
  }

  function renderTestes(resultados) {
    const total = resultados.length;
    const ok = resultados.filter((r) => r.ok).length;
    $('#test-count').textContent = '(' + ok + '/' + total + ')';
    $('#testes').innerHTML = resultados.map((r) =>
      '<div class="test-row ' + (r.ok ? 'ok' : 'bad') + '">' +
        '<span class="m">' + (r.ok ? '✓' : '✗') + '</span>' +
        '<span><b>' + esc(r.nome) + '</b>' +
          (r.detalhe ? '<br><span class="tiny">' + esc(r.detalhe) + '</span>' : '') +
        '</span>' +
      '</div>'
    ).join('') || '<p class="tiny">Nenhum teste definido.</p>';
    return { total, ok };
  }

  function renderErroExecucao(msg) {
    $('#test-count').textContent = '';
    $('#testes').innerHTML =
      '<div class="test-row bad">' +
        '<span class="m">✗</span>' +
        '<span><b>Não foi possível executar</b><br><span class="tiny">' + esc(msg) + '</span></span>' +
      '</div>';
    $('#console').textContent += '\n✗ ' + msg;
    codigoValidado = false;
    atualizarStatus();
    renderMiniProgresso();
  }

  function concluirCustom(mostrarAviso) {
    if (!custom) return;
    if (custom.tipo === 'final' && L.finalLiberado && !L.finalLiberado(custom.sid)) {
      toast('Conclua os exercícios das aulas antes do desafio final.');
      return;
    }
    const jaFeito = L.exercicioOk(custom.sid, custom.chave);
    const pts = !jaFeito && L.pontosDoExercicio ? L.pontosDoExercicio(custom.sid, custom.chave) : 0;
    L.marcarExercicio(custom.sid, custom.chave);
    const pend = L.exerciciosPendentes(custom.sid);
    const sk = L.skillDaEstrela(custom.sid);
    const nova = sk && !pend.length ? L.acender(sk.id) : false;
    const extra = pts ? ' · +' + pts + ' pts' : '';
    if (nova) {
      toast('⭐ Estrela acesa: ' + L.estrela(custom.sid).nome + ' — todos os exercícios resolvidos' + extra);
    } else if (mostrarAviso) {
      toast(pend.length
        ? 'Exercício concluído ✓ Faltam ' + pend.length + ' nesta estrela' + extra
        : 'Exercício concluído ✓' + extra);
    }
    if (nova || pts) L.montarNav('programar');
    atualizarStatus();
    renderMiniProgresso();
  }

  function tratarResultado(data) {
    if (!data || !data.ok) {
      addConsole(data && data.logs);
      renderErroExecucao((data && data.erro) || 'erro desconhecido ao executar o código');
      return;
    }

    const resultados = data.resultados || [];
    const { total, ok } = renderTestes(resultados);
    addConsole(data.logs);
    ultimaExecucao = resultados;

    if (total > 0 && ok === total) {
      codigoValidado = true;
      L.marcar(trilha.id, aulaIdx, 'editor');
      if (custom) concluirCustom(false);
      else L.montarNav('programar');
      $('#console').textContent += data.livre
        ? '\n✓ Compilou e executou sem erros. Peça o refino com IA.'
        : '\n✓ ' + total + ' teste(s) passaram. Peça o refino com IA.';
      if (!custom) L.toast('Testes ok — agora valide o refino com a IA');
    } else {
      codigoValidado = false;
      $('#console').textContent += '\n✗ ' + (total - ok) + ' teste(s) falharam.';
    }

    atualizarStatus();
    renderMiniProgresso();
  }

  function logClient(kind, modelo, msg, detalhe) {
    try {
      fetch('/api/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: kind,
          model: modelo,
          prompt: 'aula ' + (aulaIdx + 1) + ': ' + aulaAtual().titulo,
          message: msg,
          detail: detalhe || '',
          label: kind === 'timeout' ? 'Timeout no editor' : 'Falha no editor',
        }),
      });
    } catch {}
  }

  function rodarTestes() {
    if (rodando || iaBusy) return;

    if (modoBlocos()) {
      if (programaVazio()) {
        toast('Monte seu programa com os blocos primeiro');
        return;
      }
      salvarAtual();
      rodando = true;
      $('#btn-rodar').disabled = true;
      $('#btn-rodar').textContent = 'Rodando…';
      setConsole('executando os blocos…');
      try {
        tratarResultado(BLOCOS.rodarTestes(blocosUI.programa(), exAtual.testes));
      } catch (e) {
        renderErroExecucao(e.message || 'falha ao executar os blocos');
      } finally {
        rodando = false;
        $('#btn-rodar').disabled = false;
        $('#btn-rodar').textContent = rotuloRodar();
      }
      return;
    }

    const codigo = codigoParaRodar();
    if (!codigo.trim()) {
      toast('Escreva sua solução primeiro');
      return;
    }

    salvarAtual();
    rodando = true;
    $('#btn-rodar').disabled = true;
    $('#btn-rodar').textContent = 'Rodando…';
    setConsole('executando testes…');

    if (lang !== 'javascript') { rodarOutra(); return; }

    const blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    let done = false;

    const finalizar = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      rodando = false;
      $('#btn-rodar').disabled = false;
      $('#btn-rodar').textContent = rotuloRodar();
      fn();
    };

    const timer = setTimeout(() => {
      finalizar(() => {
        renderErroExecucao('Timeout: o código demorou mais de 2,5s (loop infinito?)');
        logClient('timeout', 'worker', 'Timeout de 2.5s no editor', '');
      });
    }, 2800);

    worker.onmessage = (e) => finalizar(() => tratarResultado(e.data));
    worker.onerror = (e) => finalizar(() => {
      renderErroExecucao('Erro no worker: ' + (e.message || 'falha de execução'));
      logClient('error', 'worker', e.message || 'erro no worker', '');
    });

    worker.postMessage({ codigo: codigo, testes: exAtual.testes });
  }

  async function rodarOutra() {
    const fim = () => {
      rodando = false;
      $('#btn-rodar').disabled = false;
      $('#btn-rodar').textContent = rotuloRodar();
    };
    try {
      let data;
      if (lang === 'typescript') {
        setConsole('compilando TypeScript…');
        const js = await LG.transpilarTS(codigoParaRodar());
        data = await new Promise((ok) => {
          const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
          const w = new Worker(url);
          const t = setTimeout(() => { w.terminate(); URL.revokeObjectURL(url); ok({ ok: false, erro: 'Timeout: o código demorou mais de 2,5s (loop infinito?)' }); }, 2800);
          w.onmessage = (e) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); ok(e.data); };
          w.onerror = (e) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); ok({ ok: false, erro: e.message || 'falha de execução' }); };
          w.postMessage({ codigo: js, testes: exAtual.testes });
        });
      } else if (custom && lang === 'python') {
        setConsole('rodando testes em Python…');
        data = await LG.rodarTestesPython(codigoParaRodar(), exAtual.testes);
      } else {
        setConsole('compilando e executando em ' + LG.porId(lang).nome + '…');
        data = await LG.rodarRemoto(lang, codigoParaRodar(), exKey);
      }
      tratarResultado(data);
    } catch (e) {
      renderErroExecucao(e.message || 'falha ao executar');
    } finally {
      fim();
    }
  }

  /* ---------------- IA ---------------- */

  function registrarFalhaIA(modoIA, motivo) {
    logClient('error', 'nvidia/nemotron-3-ultra-550b-a55b', motivo, 'modo=' + modoIA);
  }

  function marcarRefino() {
    const aula = aulaAtual();
    L.marcar(trilha.id, aulaIdx, 'ia');
    if (custom) { concluirCustom(true); return; }
    // acende na fila: o mapa toca a animação de desbloqueio quando for aberto
    const nova = L.acender(aula.skill);
    L.montarNav('programar');
    renderMiniProgresso();
    atualizarStatus();
    toast(nova ? '⭐ Estrela acesa: ' + (L.skill(aula.skill) || {}).nome + ' — veja no mapa' : 'Refino aprovado ✓');
  }

  function renderIA(data, modoIA) {
    const ans = $('#ia-answer');
    ans.classList.add('show');
    const d = data.dados;
    const meta = '<div class="tiny" style="margin-top:9px">' +
      esc(data.modelo || 'nemotron') + ' · ' + (Math.round((data.ms || 0) / 100) / 10) + 's' +
      (data.layer != null ? ' · L' + data.layer : '') + '</div>';

    if (d && (d.resumo || (Array.isArray(d.pontos) && d.pontos.length) || d.proximo_passo)) {
      let html = '';
      if (d.resumo) html += '<p style="margin:0 0 10px">' + esc(d.resumo) + '</p>';
      if (Array.isArray(d.pontos) && d.pontos.length) {
        html += '<div style="display:flex;flex-direction:column;gap:6px">' + d.pontos.map((p) => {
          const tipo = p.tipo || 'melhoria';
          const icone = tipo === 'bom' ? '✓' : tipo === 'erro' ? '✗' : '→';
          const cor = tipo === 'bom' ? '#4ade80' : tipo === 'erro' ? '#fb7185' : '#ffd700';
          return '<div style="font-size:12.5px;line-height:1.5"><span style="color:' + cor + '">' + icone + '</span> ' + esc(p.texto || '') + '</div>';
        }).join('') + '</div>';
      }
      if (d.proximo_passo) html += '<p class="tiny" style="margin:10px 0 0">Próximo passo: ' + esc(d.proximo_passo) + '</p>';
      if (d.nota != null) html += '<span class="chip gold" style="margin-top:9px">nota ' + esc(d.nota) + '/10</span>';
      ans.innerHTML = html + meta;
    } else {
      ans.innerHTML = '<div style="white-space:pre-wrap">' + esc(data.texto || '(sem resposta)') + '</div>' + meta;
    }

    if (modoIA === 'refino') {
      const v = $('#ia-verdict');
      if (data.aprovado) {
        v.className = 'verdict ok show';
        const pend = custom ? L.exerciciosPendentes(custom.sid).length : 0;
        v.innerHTML = custom
          ? 'Refino aprovado ✓ Exercício concluído.' +
            (pend ? ' Ainda faltam ' + pend + ' exercício(s) nesta estrela.' : ' A estrela foi acesa.') +
            ' <a href="sua-trilha.html?estrela=' + encodeURIComponent(custom.sid) + '" style="color:inherit;text-decoration:underline">Ver na trilha →</a>'
          : 'Refino aprovado ✓ A estrela da aula foi acesa. <a href="habilidades.html" style="color:inherit;text-decoration:underline">Ver no mapa →</a>';
        marcarRefino();
      } else {
        v.className = 'verdict no show';
        v.textContent = 'A IA pediu ajustes antes de aprovar.' + (d && d.proximo_passo ? ' ' + d.proximo_passo : '');
      }
    }
  }

  function renderIAErro(motivo) {
    const ans = $('#ia-answer');
    ans.classList.add('show');
    ans.innerHTML =
      '<b>Não consegui falar com o Nemotron.</b>' +
      '<div class="tiny" style="margin-top:6px">' + esc(motivo) + '</div>' +
      (codigoValidado
        ? '<div style="margin-top:10px"><button class="btn small" type="button" data-fallback>Validar com os testes locais</button></div>'
        : '');
  }

  async function pedirIA(modoIA) {
    if (iaBusy) return;
    if (modoBlocos() ? programaVazio() : !editor.value.trim()) {
      toast(modoBlocos() ? 'Monte seu programa com os blocos primeiro' : 'Escreva algum código primeiro');
      return;
    }
    if (modoIA === 'refino' && !codigoValidado) {
      toast('Rode os testes antes de validar');
      return;
    }

    iaBusy = true;
    passo = modoIA === 'refino' ? 3 : 2;
    syncURL();

    ansReset();
    $('#ia-spin').classList.add('show');
    $('#btn-revisao').disabled = true;
    $('#btn-refino').disabled = true;

    let seg = 0;
    const txt = $('#ia-spin-txt');
    txt.textContent = 'consultando o Nemotron… 0s';
    const timer = setInterval(() => {
      seg++;
      txt.textContent = 'consultando o Nemotron… ' + seg + 's';
    }, 1000);

    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 90000);
    const aula = aulaAtual();

    const testesTxt = ultimaExecucao
      ? ultimaExecucao.map((r) => (r.ok ? 'OK' : 'FALHOU') + ' - ' + r.nome + (r.detalhe ? ' (' + r.detalhe + ')' : '')).join('\n')
      : 'os testes não rodaram nesta sessão';

    try {
      const r = await fetch('/api/ia-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          modo: modoIA,
          codigo: textoParaIA(),
          enunciado: plain(exAtual.enunciado),
          requisitos: exAtual.reqs,
          testes: testesTxt,
          trilha: trilha.nome,
          aula: aula.titulo,
          skill: aula.skill,
          linguagem: modoBlocos() ? 'Blocos (programação visual)' : LG.porId(lang).nome,
          pedido: $('#refino-pedido').value.trim(),
          session: L.sessao(),
        }),
      });

      const data = await r.json().catch(() => null);
      if (!r.ok || !data) {
        const detalhe = (data && data.error && (data.error.message || data.error.detail)) || ('HTTP ' + r.status);
        throw new Error(detalhe);
      }
      renderIA(data, modoIA);
    } catch (e) {
      const motivo = e.name === 'AbortError'
        ? 'A IA demorou mais de 90s e a chamada foi cancelada.'
        : (e.message || 'falha de rede');
      renderIAErro(motivo);
      registrarFalhaIA(modoIA, motivo);
    } finally {
      clearTimeout(abort);
      clearInterval(timer);
      $('#ia-spin').classList.remove('show');
      iaBusy = false;
      $('#btn-revisao').disabled = false;
      atualizarStatus();
    }
  }

  function ansReset() {
    $('#ia-answer').classList.remove('show');
    $('#ia-answer').innerHTML = '';
    $('#ia-verdict').className = 'verdict';
    $('#ia-verdict').textContent = '';
  }

  /* ---------------- desafio em tela cheia ---------------- */

  function comentarioDesafio() {
    if (!exAtual) return '';
    const l = modoBlocos() ? { c: '//' } : LG.porId(lang);
    const prefixo = l.c === '(*' ? '(* ' : l.c + ' ';
    const fim = l.c === '(*' ? ' *)' : '';
    const linhas = [];
    const add = (t) => String(t == null ? '' : t).split('\n').forEach((x) => linhas.push(prefixo + x + fim));
    const sep = prefixo + '============================================================' + fim;

    linhas.push(sep);
    add('DESAFIO · ' + exAtual.titulo);
    linhas.push(sep);
    add(plain(exAtual.enunciado).replace(/\s+/g, ' ').trim());
    linhas.push(prefixo + fim);
    add('Requisitos:');
    (exAtual.reqs || []).forEach((r) => add('- ' + r));
    if (exAtual.dica) {
      linhas.push(prefixo + fim);
      add('Dica:');
      add(exAtual.dica);
    }
    if (arquivosEx) {
      linhas.push(prefixo + fim);
      add('Arquivos: ' + arquivosEx.map((a) => a.nome + (a.principal ? ' (principal)' : '')).join(', '));
    }
    linhas.push(sep);
    return linhas.join('\n');
  }

  function atualizarCabecalhoFull() {
    const skill = L.skill(aulaAtual().skill);
    $('#df-titulo').textContent = exAtual ? exAtual.titulo : '';
    $('#df-nivel').textContent = skill ? skill.nome : 'prática';
    $('#df-comentario').textContent = comentarioDesafio();
  }

  function abrirTelaCheia() {
    if (dfAberto || !exAtual) return;
    dfAberto = true;
    dfHome = {
      editor: { pai: editorPanel.parentNode, prox: editorPanel.nextSibling },
      out: { pai: outGrid.parentNode, prox: outGrid.nextSibling },
    };
    $('#df-editor-host').appendChild(editorPanel);
    $('#df-terminal').appendChild(outGrid);
    atualizarCabecalhoFull();
    dfOverlay.hidden = false;
    document.body.classList.add('df-aberto');
    $('#btn-full').textContent = '⛶ Sair';
    try {
      if (dfOverlay.requestFullscreen) {
        const p = dfOverlay.requestFullscreen();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* segue no modo fixo */ }
    setTimeout(() => {
      if (modoBlocos()) {
        const alvo = blocosHost && blocosHost.querySelector('input, button');
        if (alvo) alvo.focus();
      } else {
        updateLines();
        editor.focus();
      }
    }, 60);
  }

  function fecharTelaCheia() {
    if (!dfAberto) return;
    dfAberto = false;
    const o = dfHome && dfHome.out;
    if (o) {
      if (o.prox && o.prox.parentNode === o.pai) o.pai.insertBefore(outGrid, o.prox);
      else o.pai.appendChild(outGrid);
    }
    const e = dfHome && dfHome.editor;
    if (e) {
      if (e.prox && e.prox.parentNode === e.pai) e.pai.insertBefore(editorPanel, e.prox);
      else e.pai.appendChild(editorPanel);
    }
    dfHome = null;
    dfOverlay.hidden = true;
    document.body.classList.remove('df-aberto');
    $('#btn-full').textContent = '⛶ Tela cheia';
    if (document.fullscreenElement) {
      try {
        const p = document.exitFullscreen();
        if (p && p.catch) p.catch(() => {});
      } catch (err) {}
    }
    setTimeout(updateLines, 0);
  }

  function alternarTelaCheia() {
    if (dfAberto) fecharTelaCheia();
    else abrirTelaCheia();
  }

  /* ---------------- eventos ---------------- */

  editor.addEventListener('input', () => {
    if (arquivosEx) arquivosEx[arqAtual].texto = editor.value;
    updateLines();
    codigoValidado = false;
    atualizarStatus();
    salvarDebounced();
  });

  editor.addEventListener('scroll', () => {
    $('#lines').scrollTop = editor.scrollTop;
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      const en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
      updateLines();
      salvarDebounced();
    }
  });

  selTrilha.addEventListener('change', () => {
    if (iaBusy) { selTrilha.value = trilha.id; toast('Espere a IA terminar'); return; }
    salvarAtual();
    const t = L.achar(selTrilha.value);
    if (!t) return;
    trilha = t;
    aulaIdx = 0;
    passo = 1;
    carregar();
  });

  selAula.addEventListener('change', () => {
    if (iaBusy) { selAula.value = String(aulaIdx); toast('Espere a IA terminar'); return; }
    salvarAtual();
    aulaIdx = Number(selAula.value) || 0;
    passo = 1;
    carregar();
  });

  $('#sel-lang').addEventListener('change', (e) => {
    if (custom || modoBlocos()) { $('#sel-lang').value = modoBlocos() ? 'blocos' : lang; return; }
    if (iaBusy || rodando) { $('#sel-lang').value = lang; toast('Espere terminar a execução'); return; }
    salvarAtual();
    lang = e.target.value;
    try { localStorage.setItem('lunox-lang', lang); } catch (err) {}
    carregar();
    const l = LG.porId(lang);
    toast(l.modo === 'livre' ? l.nome + ': compila e executa seu programa' : l.nome + ': mesmos testes do JavaScript');
  });

  $('#btn-rodar').addEventListener('click', rodarTestes);

  $('#btn-console').addEventListener('click', () => setConsole('pronto.'));

  $('#btn-solucao').addEventListener('click', () => {
    if (iaBusy) return;
    if (modoBlocos()) {
      blocosUI.definir(BLOCOS.deJSON(exAtual.solucao || exAtual.starter || '[]'));
      codigoValidado = false;
      atualizarStatus();
      salvarAtual();
      toast('Solução carregada — rode os testes');
      return;
    }
    if (arquivosEx) {
      const a = arquivosEx[arqAtual];
      const ref = custom
        ? (a.solucao || (a.principal ? exAtual.solucao : '') || a.starter || '')
        : (a.solucao || LG.solucaoRef(lang, exAtual));
      editor.value = a.principal ? ref : (a.solucao || a.starter || '');
      a.texto = editor.value;
    } else {
      editor.value = custom
        ? (exAtual.solucao || exAtual.starter || '')
        : LG.solucaoRef(lang, exAtual);
    }
    updateLines();
    codigoValidado = false;
    atualizarStatus();
    salvarAtual();
    toast('Solução carregada — rode os testes');
  });

  $('#btn-limpar').addEventListener('click', () => {
    if (iaBusy) return;
    if (modoBlocos()) {
      blocosUI.definir(BLOCOS.deJSON(exAtual.starter || '[]'));
      codigoValidado = false;
      atualizarStatus();
      salvarAtual();
      toast('Editor limpo');
      return;
    }
    if (arquivosEx) {
      const a = arquivosEx[arqAtual];
      editor.value = a.starter || '';
      a.texto = editor.value;
    } else {
      editor.value = custom ? (exAtual.starter || '') : LG.starter(lang, exAtual);
    }
    updateLines();
    codigoValidado = false;
    atualizarStatus();
    salvarAtual();
    toast('Editor limpo');
  });

  edTabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-arq]');
    if (!b) return;
    trocarArquivo(Number(b.getAttribute('data-arq')) || 0);
  });

  $('#btn-full').addEventListener('click', alternarTelaCheia);
  $('#df-sair').addEventListener('click', fecharTelaCheia);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dfAberto) {
      e.preventDefault();
      fecharTelaCheia();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (dfAberto && !document.fullscreenElement) fecharTelaCheia();
  });

  $('#btn-revisao').addEventListener('click', () => pedirIA('revisao'));
  $('#btn-refino').addEventListener('click', () => pedirIA('refino'));

  $('#btn-concluir').addEventListener('click', () => {
    if (!codigoValidado) return;
    salvarAtual();
    toast('Aula concluída ✓');
    // se uma estrela acabou de acender, leva o aluno para ver o desbloqueio no mapa
    const destino = custom
      ? 'sua-trilha.html?estrela=' + encodeURIComponent(custom.sid)
      : (L.pendentesAnim().length ? 'habilidades.html' : 'index.html');
    setTimeout(() => { location.href = destino; }, 450);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-fallback]')) return;
    if (!codigoValidado) return;

    marcarRefino();
    $('#ia-answer').innerHTML = '<b>Validação local aplicada.</b><div class="tiny" style="margin-top:6px">Todos os testes passaram. O erro do Nemotron ficou registrado no painel de logs.</div>';
    const v = $('#ia-verdict');
    v.className = 'verdict ok show';
    const pend = custom ? L.exerciciosPendentes(custom.sid).length : 0;
    v.innerHTML = custom
      ? 'Exercício validado com os testes locais.' +
        (pend ? ' Ainda faltam ' + pend + ' exercício(s) nesta estrela.' : ' A estrela foi acesa.') +
        ' <a href="sua-trilha.html?estrela=' + encodeURIComponent(custom.sid) + '" style="color:inherit;text-decoration:underline">Ver na trilha →</a>'
      : 'Aula validada com os testes locais. A estrela foi acesa. <a href="habilidades.html" style="color:inherit;text-decoration:underline">Ver no mapa →</a>';
  });

  window.addEventListener('beforeunload', salvarAtual);

  /* ---------------- boot ---------------- */

  carregar();
  if (params.get('full') === '1') setTimeout(abrirTelaCheia, 250);
})();
