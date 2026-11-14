/* ============================================================
   Lunox — linguagens e compiladores do editor Programar
   - JavaScript: Web Worker no navegador (como antes)
   - TypeScript: transpila no navegador (typescript.js) e roda no worker
   - Python, Ruby, PHP, Perl: rodam os MESMOS testes via harness (Judge0)
   - Exercícios criados na admin: Python é o padrão e os testes autorais
     (check("nome", lambda: ...) ou assert) rodam no Judge0
   - C, C++, Java, C#, Go, Rust, Kotlin, Swift e outras: compilam e
     executam no Judge0 (execução livre: passou se compilou e rodou sem erro)
   Para usar seu próprio Judge0:  window.LUNOX_JUDGE0_URL = 'https://...'
   (chave opcional em window.LUNOX_JUDGE0_KEY, enviada como X-Auth-Token)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- casos de teste neutros (mesmos testes do JS, como dados) ---------- */
  const A = [{ id: 1, nome: 'Ana', nota: 8 }, { id: 2, nome: 'Bia', nota: 5 }, { id: 3, nome: 'Caio', nota: 7 }];
  const SEM = (id) => A.filter((a) => a.id !== id).map((a) => ({ id: a.id, nome: a.nome, nota: a.nota }));
  const R = { x: 0, y: 0, w: 10, h: 10 };
  const T3 = ['fundo', 'texto', 'destaque'];

  const CASOS = {
    variaveis: [['devolve a saudação para Ana', ['Ana'], 'Olá, Ana!'], ['devolve a saudação para Lucas', ['Lucas'], 'Olá, Lucas!'], ['funciona com outro nome', ['Bia'], 'Olá, Bia!']],
    condicoes: [['responde quando a mensagem é oi', ['oi'], { $str: 1 }], ['ignora tchau', ['tchau'], null], ['ignora bom dia', ['bom dia'], null]],
    lacos: [['soma 1 + 2 + 3', [[1, 2, 3]], 6], ['lista vazia soma 0', [[]], 0], ['soma com números negativos', [[10, -2, 5]], 13]],
    funcoes: [['100 com 10% vira 90', [100, 10], 90], ['200 com 25% vira 150', [200, 25], 150], ['desconto 0 mantém o preço', [50, 0], 50]],
    listas: [['devolve os dois aprovados', [[{ nome: 'Ana', nota: 8 }, { nome: 'Bia', nota: 5 }, { nome: 'Caio', nota: 7 }]], ['Ana', 'Caio']], ['lista vazia devolve lista vazia', [[]], []], ['nota 7 conta como aprovado', [[{ nome: 'Duda', nota: 7 }]], ['Duda']]],
    interfaces: [['monta o h1 completo', ['Meu portfólio'], '<h1>Meu portfólio</h1>'], ['inclui o título recebido', ['Lunox'], '<h1>Lunox</h1>'], ['funciona com título vazio', [''], '<h1></h1>']],
    apis: [['lê o nome Ana', ['{"nome":"Ana","id":1}'], 'Ana'], ['lê o nome Caio', ['{"nome":"Caio"}'], 'Caio'], ['funciona com espaços no JSON', ['{ "nome": "Bia" }'], 'Bia']],
    arquivos: [['conta 3 linhas', ['a\nb\nc'], 3], ['ignora linhas vazias', ['a\n\nb\n'], 2], ['texto vazio conta 0', [''], 0]],
    banco: [['filtra os aprovados', [A, 7], [A[0], A[2]]], ['nota mínima 9 não acha ninguém', [A, 9], []], ['nota mínima 0 devolve todos', [A, 0], A]],
    banco2: [['remove o aluno 2', [A, 2], SEM(2)], ['id inexistente mantém todos', [A, 99], A], ['remove o aluno 1', [A, 1], SEM(1)]],
    design: [['tem as três chaves', ['#ffd700'], { $chaves: T3 }], ['usa a cor recebida no destaque', ['#ffd700'], { $campo: ['destaque', '#ffd700'] }], ['funciona com outra cor', ['#00ffff'], { $campo: ['destaque', '#00ffff'] }]],
    git: [['inicia o repositório', [], { $contem: 'git init' }], ['adiciona os arquivos', [], { $contem: 'git add' }], ['commita com mensagem', [], { $contem: 'git commit' }]],
    movimento: [['anda 6 a partir de 10', [10, 2, 3], 16], ['velocidade negativa volta', [0, -5, 2], -10], ['funciona com decimais', [2.5, 1, 2], 4.5]],
    colisao: [['detecta sobreposição', [R, { x: 5, y: 5, w: 10, h: 10 }], true], ['detecta que estão longe', [R, { x: 20, y: 20, w: 5, h: 5 }], false], ['um dentro do outro colide', [R, { x: 2, y: 2, w: 3, h: 3 }], true]],
  };
  Object.assign(CASOS, window.LUNOX_CASOS_EXTRA || {});

  /* ---------- comparação ---------- */
  function eq(a, e) {
    if (e && typeof e === 'object' && !Array.isArray(e) && ('$str' in e || '$contem' in e || '$chaves' in e || '$campo' in e)) {
      if ('$str' in e) return typeof a === 'string' && a.length > 0;
      if ('$contem' in e) return (Array.isArray(a) ? a.join(' ') : String(a)).indexOf(e.$contem) >= 0;
      if ('$chaves' in e) return !!a && typeof a === 'object' && e.$chaves.every((k) => !!a[k]);
      return !!a && a[e.$campo[0]] === e.$campo[1];
    }
    if (typeof e === 'boolean') return !!a === e && (typeof a === 'boolean' || a === 0 || a === 1 || a === '');
    if (typeof e === 'number') return typeof a === 'number' && Math.abs(a - e) < 1e-9;
    if (e === null) return a === null;
    if (Array.isArray(e)) return Array.isArray(a) && a.length === e.length && e.every((x, i) => eq(a[i], x));
    if (typeof e === 'object') {
      const ks = Object.keys(e);
      return !!a && typeof a === 'object' && ks.every((k) => eq(a[k], e[k]));
    }
    return a === e;
  }

  /* ---------- harness por linguagem (imprime @@R@@json ou @@E@@erro) ---------- */
  const H = {
    python: (cod, j) => 'import json\n' + cod + '\n\n_casos = json.loads(r\'\'\'' + j + '\'\'\')\nfor _a in _casos:\n    try:\n        print("@@R@@" + json.dumps(solucao(*_a)))\n    except Exception as _e:\n        print("@@E@@" + str(_e))\n',
    ruby: (cod, j) => 'require "json"\n' + cod + '\n\n__c = JSON.parse(<<\'__J__\')\n' + j + '\n__J__\n__c.each do |a|\n  begin\n    puts "@@R@@" + JSON.generate(solucao(*a))\n  rescue Exception => e\n    puts "@@E@@" + e.message\n  end\nend\n',
    php: (cod, j) => '<?php\n' + cod.replace(/^\s*<\?php/, '') + '\n\n$__c = json_decode(<<<\'J\'\n' + j + '\nJ\n, true);\nforeach ($__c as $a) {\n  try { echo "@@R@@" . json_encode(solucao(...$a)) . "\\n"; }\n  catch (Throwable $e) { echo "@@E@@" . $e->getMessage() . "\\n"; }\n}\n',
    perl: (cod, j) => 'use strict; use warnings; use JSON::PP;\n' + cod + '\n\nmy $__c = decode_json(<<\'J\');\n' + j + '\nJ\nmy $__j = JSON::PP->new->allow_nonref->canonical;\nforeach my $__a (@$__c) {\n  my $r = eval { solucao(@$__a) };\n  if ($@) { my $m = $@; $m =~ s/\\n.*//s; print(\'@@E@\' . \'@\' . $m . "\\n"); }\n  else { print(\'@@R@\' . \'@\' . $__j->encode($r) . "\\n"); }\n}\n',
  };

  /* ---------- starters ---------- */
  const FN = {
    typescript: (p) => 'function solucao(' + p.map((x) => x + ': any').join(', ') + '): any {\n  // TODO\n\n}\n',
    python: (p) => 'def solucao(' + p.join(', ') + '):\n    # TODO\n    pass\n',
    ruby: (p) => 'def solucao(' + p.join(', ') + ')\n  # TODO\n\nend\n',
    php: (p) => 'function solucao(' + p.map((x) => '$' + x).join(', ') + ') {\n  // TODO\n\n}\n',
    perl: (p) => 'sub solucao {\n  my (' + p.map((x) => '$' + x).join(', ') + ') = @_;\n  # TODO\n\n}\n',
  };

  const OLA = 'Olá, Lunox!';
  const LIVRE = {
    c: '#include <stdio.h>\n\nint main(void) {\n    printf("' + OLA + '\\n");\n    return 0;\n}\n',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "' + OLA + '" << std::endl;\n    return 0;\n}\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("' + OLA + '");\n    }\n}\n',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("' + OLA + '");\n    }\n}\n',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("' + OLA + '")\n}\n',
    rust: 'fn main() {\n    println!("' + OLA + '");\n}\n',
    kotlin: 'fun main() {\n    println("' + OLA + '")\n}\n',
    swift: 'print("' + OLA + '")\n',
    scala: 'object Main extends App {\n  println("' + OLA + '")\n}\n',
    dart: 'void main() {\n  print(\'' + OLA + '\');\n}\n',
    groovy: 'println "' + OLA + '"\n',
    lua: 'print("' + OLA + '")\n',
    r: 'cat("' + OLA + '\\n")\n',
    bash: '#!/bin/bash\necho "' + OLA + '"\n',
    haskell: 'main :: IO ()\nmain = putStrLn "' + OLA + '"\n',
    ocaml: 'let () = print_endline "' + OLA + '"\n',
    elixir: 'IO.puts("' + OLA + '")\n',
    clojure: '(println "' + OLA + '")\n',
    fsharp: 'printfn "' + OLA + '"\n',
    vbnet: 'Module Program\n    Sub Main()\n        Console.WriteLine("' + OLA + '")\n    End Sub\nEnd Module\n',
    d: 'import std.stdio;\n\nvoid main() {\n    writeln("' + OLA + '");\n}\n',
    fortran: 'program ola\n  print *, "' + OLA + '"\nend program ola\n',
    pascal: 'program Ola;\nbegin\n  writeln(\'' + OLA + '\');\nend.\n',
    lisp: '(print "' + OLA + '")\n',
    octave: 'disp(\'' + OLA + '\')\n',
  };

  /* id = identificador | j0 = language_id do Judge0 CE | modo: teste (harness) ou livre */
  const LINGS = [
    { id: 'javascript', nome: 'JavaScript', ext: 'js', c: '//', modo: 'teste', nativo: true },
    { id: 'typescript', nome: 'TypeScript', ext: 'ts', c: '//', modo: 'teste', nativo: true },
    { id: 'python', nome: 'Python', ext: 'py', c: '#', modo: 'teste', j0: 71 },
    { id: 'ruby', nome: 'Ruby', ext: 'rb', c: '#', modo: 'teste', j0: 72 },
    { id: 'php', nome: 'PHP', ext: 'php', c: '//', modo: 'teste', j0: 68 },
    { id: 'perl', nome: 'Perl', ext: 'pl', c: '#', modo: 'teste', j0: 85 },
    { id: 'c', nome: 'C', ext: 'c', c: '//', modo: 'livre', j0: 50 },
    { id: 'cpp', nome: 'C++', ext: 'cpp', c: '//', modo: 'livre', j0: 54 },
    { id: 'java', nome: 'Java', ext: 'java', c: '//', modo: 'livre', j0: 62 },
    { id: 'csharp', nome: 'C#', ext: 'cs', c: '//', modo: 'livre', j0: 51 },
    { id: 'go', nome: 'Go', ext: 'go', c: '//', modo: 'livre', j0: 60 },
    { id: 'rust', nome: 'Rust', ext: 'rs', c: '//', modo: 'livre', j0: 73 },
    { id: 'kotlin', nome: 'Kotlin', ext: 'kt', c: '//', modo: 'livre', j0: 78 },
    { id: 'swift', nome: 'Swift', ext: 'swift', c: '//', modo: 'livre', j0: 83 },
    { id: 'scala', nome: 'Scala', ext: 'scala', c: '//', modo: 'livre', j0: 81 },
    { id: 'dart', nome: 'Dart', ext: 'dart', c: '//', modo: 'livre', j0: 90 },
    { id: 'groovy', nome: 'Groovy', ext: 'groovy', c: '//', modo: 'livre', j0: 88 },
    { id: 'lua', nome: 'Lua', ext: 'lua', c: '--', modo: 'livre', j0: 64 },
    { id: 'r', nome: 'R', ext: 'r', c: '#', modo: 'livre', j0: 80 },
    { id: 'bash', nome: 'Bash', ext: 'sh', c: '#', modo: 'livre', j0: 46 },
    { id: 'haskell', nome: 'Haskell', ext: 'hs', c: '--', modo: 'livre', j0: 61 },
    { id: 'ocaml', nome: 'OCaml', ext: 'ml', c: '(*', modo: 'livre', j0: 65 },
    { id: 'elixir', nome: 'Elixir', ext: 'exs', c: '#', modo: 'livre', j0: 57 },
    { id: 'clojure', nome: 'Clojure', ext: 'clj', c: ';;', modo: 'livre', j0: 86 },
    { id: 'fsharp', nome: 'F#', ext: 'fs', c: '//', modo: 'livre', j0: 87 },
    { id: 'vbnet', nome: 'VB.NET', ext: 'vb', c: "'", modo: 'livre', j0: 84 },
    { id: 'd', nome: 'D', ext: 'd', c: '//', modo: 'livre', j0: 56 },
    { id: 'fortran', nome: 'Fortran', ext: 'f90', c: '!', modo: 'livre', j0: 59 },
    { id: 'pascal', nome: 'Pascal', ext: 'pas', c: '//', modo: 'livre', j0: 67 },
    { id: 'lisp', nome: 'Common Lisp', ext: 'lisp', c: ';;', modo: 'livre', j0: 55 },
    { id: 'octave', nome: 'Octave', ext: 'm', c: '%', modo: 'livre', j0: 66 },
  ];
  const porId = (id) => LINGS.find((l) => l.id === id) || LINGS[0];

  /* ---------- utilidades ---------- */
  const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
  const deb64 = (s) => { try { return decodeURIComponent(escape(atob(s || ''))); } catch (e) { return ''; } };

  function paramsDe(ex) {
    const m = /function\s+solucao\s*\(([^)]*)\)/.exec(ex.starter || '');
    return m && m[1].trim() ? m[1].split(',').map((s) => s.trim()) : [];
  }

  function comentar(l, txt) {
    const fim = l.c === '(*' ? ' *)' : '';
    return txt.split('\n').map((x) => l.c + ' ' + x + fim).join('\n');
  }

  function starter(lang, ex, key) {
    const l = porId(lang);
    if (l.id === 'javascript') return ex.starter;
    const enun = String(ex.enunciado || '').replace(/<[^>]+>/g, '');
    if (FN[l.id]) return FN[l.id](paramsDe(ex));
    return comentar(l, 'Exercício: ' + ex.titulo + '\n' + enun + '\n(execução livre: o compilador roda seu programa e mostra a saída)') + '\n\n' + (LIVRE[l.id] || '');
  }

  function solucaoRef(lang, ex) {
    const l = porId(lang);
    if (l.id === 'javascript') return ex.solucao;
    return starter(lang, ex) + '\n' + comentar(l, 'Referência em JavaScript:\n' + String(ex.solucao || '').trim());
  }

  /* ---------- execução remota (Judge0) ---------- */
  async function judge0(l, fonte) {
    const base = String(window.LUNOX_JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');
    const h = { 'Content-Type': 'application/json' };
    if (window.LUNOX_JUDGE0_KEY) h['X-Auth-Token'] = window.LUNOX_JUDGE0_KEY;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 40000);
    try {
      const r = await fetch(base + '/submissions?base64_encoded=true&wait=true', {
        method: 'POST', headers: h, signal: ctrl.signal,
        body: JSON.stringify({ source_code: b64(fonte), language_id: l.j0, cpu_time_limit: 5, wall_time_limit: 10 }),
      });
      if (!r.ok) throw new Error('compilador remoto respondeu HTTP ' + r.status);
      const d = await r.json();
      return {
        status: d.status || {}, stdout: deb64(d.stdout), stderr: deb64(d.stderr),
        compile: deb64(d.compile_output), msg: deb64(d.message),
      };
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'o compilador remoto demorou demais' : (e.message || 'falha de rede ao chamar o compilador'));
    } finally { clearTimeout(t); }
  }

  /* TypeScript no navegador: carrega o transpilador sob demanda */
  let tsPromise = null;
  function carregarTS() {
    if (window.ts) return Promise.resolve(window.ts);
    if (!tsPromise) {
      tsPromise = new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.4.5/typescript.min.js';
        s.onload = () => ok(window.ts);
        s.onerror = () => { tsPromise = null; no(new Error('não consegui carregar o compilador TypeScript')); };
        document.head.appendChild(s);
      });
    }
    return tsPromise;
  }

  async function transpilarTS(codigo) {
    const ts = await carregarTS();
    const r = ts.transpileModule(codigo, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.None } });
    const erros = (r.diagnostics || []).filter((d) => d.category === 1);
    if (erros.length) throw new Error('TypeScript: ' + ts.flattenDiagnosticMessageText(erros[0].messageText, '\n'));
    return r.outputText;
  }

  /* ---------- testes autorais em Python (Judge0) ---------- */
  /* O autor escreve `check("nome", lambda: ...)`; `assert` puro também vale. */
  async function rodarTestesPython(codigo, testes) {
    const l = porId('python');
    const suite = String(testes == null ? '' : testes).replace(/\r\n?/g, '\n');
    if (!suite.trim()) return { ok: false, resultados: [], logs: [], erro: 'o exercício não tem testes' };

    const fonte =
      'import json, base64\n' +
      '_lunox_out = []\n' +
      'def check(nome, fn):\n' +
      '    try:\n' +
      '        r = fn()\n' +
      '        _lunox_out.append({"nome": nome, "ok": bool(r), "detalhe": "" if r else "falhou"})\n' +
      '    except Exception as e:\n' +
      '        _lunox_out.append({"nome": nome, "ok": False, "detalhe": str(e)})\n' +
      String(codigo == null ? '' : codigo) + '\n\n' +
      '_lunox_testes = base64.b64decode("' + b64(suite) + '").decode("utf-8")\n' +
      'try:\n' +
      '    exec(compile(_lunox_testes, "<testes>", "exec"), globals())\n' +
      '    if not _lunox_out:\n' +
      '        _lunox_out.append({"nome": "verificações passaram", "ok": True, "detalhe": ""})\n' +
      '    print("@@T@@" + json.dumps(_lunox_out))\n' +
      'except Exception as _e:\n' +
      '    print("@@E@@" + str(_e))\n';

    const r = await judge0(l, fonte);
    const logs = [];
    let resultados = null;
    let erro = '';
    let temErro = false;
    String(r.stdout || '').split('\n').forEach((ln) => {
      if (ln.indexOf('@@T@@') === 0) {
        try { resultados = JSON.parse(ln.slice(5)); } catch (e) { temErro = true; erro = 'resultado ilegível'; }
      } else if (ln.indexOf('@@E@@') === 0) {
        temErro = true;
        erro = ln.slice(5) || 'a verificação falhou';
      } else if (ln.trim()) {
        logs.push(ln);
      }
    });
    if (temErro) return { ok: false, resultados: [], logs, erro: erro.trim() };
    if (!Array.isArray(resultados)) {
      const motivo = r.compile || r.stderr || r.msg || (r.status && r.status.description) || 'o programa não devolveu resultados';
      return { ok: false, resultados: [], logs, erro: String(motivo).trim() };
    }
    return { ok: true, resultados, logs };
  }

  /* roda e devolve {ok, resultados, logs, erro} no mesmo formato do worker */
  async function rodarRemoto(lang, codigo, exKey) {
    const l = porId(lang);
    const logs = [];
    if (l.modo === 'livre') {
      const r = await judge0(l, codigo);
      if (r.stdout) logs.push(r.stdout.replace(/\n$/, ''));
      if (r.stderr) logs.push('[erro] ' + r.stderr.replace(/\n$/, ''));
      if (r.status.id === 3) return { ok: true, livre: true, logs, resultados: [{ nome: 'compilou e executou sem erros', ok: true, detalhe: '' }] };
      const motivo = r.compile || r.stderr || r.msg || (r.status.description || 'falha na execução');
      return { ok: false, logs: r.stdout ? [r.stdout.replace(/\n$/, '')] : [], erro: (r.status.description ? r.status.description + ': ' : '') + motivo.trim() };
    }
    const casos = CASOS[exKey] || CASOS.variaveis;
    const fonte = H[l.id](codigo, JSON.stringify(casos.map((c) => c[1])));
    const r = await judge0(l, fonte);
    const linhas = r.stdout.split('\n');
    const saida = [];
    linhas.forEach((ln) => {
      if (ln.indexOf('@@R@@') === 0 || ln.indexOf('@@E@@') === 0) saida.push(ln);
      else if (ln.trim()) logs.push(ln);
    });
    if (saida.length !== casos.length) {
      const motivo = r.compile || r.stderr || r.msg || (r.status.description || 'o programa não devolveu resultados');
      return { ok: false, logs, erro: motivo.trim() };
    }
    const resultados = casos.map((c, i) => {
      const ln = saida[i];
      if (ln.indexOf('@@E@@') === 0) return { nome: c[0], ok: false, detalhe: ln.slice(5) };
      let v;
      try { v = JSON.parse(ln.slice(5)); } catch (e) { return { nome: c[0], ok: false, detalhe: 'resultado ilegível' }; }
      const ok = eq(v, c[2]);
      return { nome: c[0], ok, detalhe: ok ? '' : 'devolveu ' + JSON.stringify(v) };
    });
    return { ok: true, resultados, logs };
  }

  window.LUNOX_LANGS = { LINGS, porId, starter, solucaoRef, transpilarTS, rodarRemoto, rodarTestesPython, CASOS };
})();
