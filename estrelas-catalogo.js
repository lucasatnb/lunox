/* GERADO por ferramentas/gerar_trilha_assets.py a partir de mapa_dados.json. Não edite à mão.
   Carregar DEPOIS de app-core.js e estrelas-extra.js.
   Catálogo das estrelas + uma habilidade automática para cada estrela que ainda não tem exercício,
   para que TODA estrela possa acender (por exercício ou por aula em vídeo). */
(function () {
  'use strict';
  const L = window.LUNOX;
  if (!L) return;

  const ICONES = { FU: '⭐', FE: '🪐', MO: '📱', BE: '🛰️', DB: '🗄️', DO: '☁️', SE: '🛡️', EM: '🔌', IA: '🧠', BO: '🤖', JG: '🎮', ES: '🧱' };
  const NIVEIS = { 1: 'essencial', 2: 'importante', 3: 'avançada' };

  // [id, nome, constelação, nível, pré-requisito]
  const D = [
    ["FU1", "Lógica de programação", "FU", 1, ""],
    ["FU20", "Python", "FU", 1, "FU1"],
    ["FU2", "Variáveis e tipos", "FU", 1, "FU20"],
    ["FU3", "Condicionais", "FU", 1, "FU2"],
    ["FU4", "Laços de repetição", "FU", 1, "FU3"],
    ["FU5", "Funções", "FU", 1, "FU4"],
    ["FU6", "Listas e dicionários", "FU", 1, "FU4"],
    ["FU7", "Strings e texto", "FU", 2, "FU2"],
    ["FU8", "Arquivos e I/O", "FU", 2, "FU5"],
    ["FU9", "Erros e exceções", "FU", 2, "FU5"],
    ["FU10", "Orientação a objetos", "FU", 2, "FU5"],
    ["FU11", "Algoritmos básicos", "FU", 2, "FU6"],
    ["FU12", "Estruturas de dados", "FU", 2, "FU11"],
    ["FU13", "Complexidade (Big-O)", "FU", 3, "FU12"],
    ["FU14", "Recursão", "FU", 3, "FU5"],
    ["FU15", "Terminal (CLI)", "FU", 1, "FU1"],
    ["FU16", "Git e GitHub", "FU", 1, "FU15"],
    ["FU17", "Depuração (debug)", "FU", 1, "FU9"],
    ["FU18", "Ler documentação", "FU", 2, "FU1"],
    ["FU19", "Testes automatizados", "FU", 2, "FU9"],
    ["FE1", "HTML", "FE", 1, ""],
    ["FE2", "CSS", "FE", 1, "FE1"],
    ["FE3", "JavaScript", "FE", 1, "FE2"],
    ["FE4", "DOM e eventos", "FE", 1, "FE3"],
    ["FE5", "Flexbox e Grid", "FE", 2, "FE2"],
    ["FE6", "Design responsivo", "FE", 2, "FE5"],
    ["FE7", "Acessibilidade", "FE", 2, "FE1"],
    ["FE8", "Fetch e APIs", "FE", 2, "FE4"],
    ["FE9", "TypeScript", "FE", 2, "FE3"],
    ["FE10", "React", "FE", 2, "FE4"],
    ["FE11", "Estado e hooks", "FE", 2, "FE10"],
    ["FE12", "Rotas (SPA)", "FE", 3, "FE10"],
    ["FE13", "Tailwind CSS", "FE", 3, "FE5"],
    ["FE14", "Next.js e SSR", "FE", 3, "FE12"],
    ["FE15", "Vite e bundlers", "FE", 3, "FE3"],
    ["FE16", "Testes de front-end", "FE", 3, "FE10"],
    ["FE17", "Performance web", "FE", 3, "FE15"],
    ["FE18", "UX/UI e Figma", "FE", 2, "FE6"],
    ["FE19", "Animações", "FE", 3, "FE2"],
    ["FE20", "PWA", "FE", 3, "FE17"],
    ["BE1", "HTTP e a web", "BE", 1, ""],
    ["BE2", "APIs REST", "BE", 1, "BE1"],
    ["BE3", "Flask", "BE", 2, "BE1"],
    ["BE4", "FastAPI", "BE", 2, "BE3"],
    ["BE5", "Node.js", "BE", 2, "BE1"],
    ["BE6", "Express", "BE", 2, "BE5"],
    ["BE7", "Autenticação", "BE", 2, "BE2"],
    ["BE8", "JWT e sessões", "BE", 3, "BE7"],
    ["BE9", "OAuth", "BE", 3, "BE8"],
    ["BE10", "ORM", "BE", 3, "BE3"],
    ["BE11", "Validação de dados", "BE", 2, "BE2"],
    ["BE12", "WebSockets", "BE", 3, "BE2"],
    ["BE13", "Filas e tarefas", "BE", 3, "BE12"],
    ["BE14", "Cache", "BE", 3, "BE2"],
    ["BE15", "Arquitetura em camadas", "BE", 2, "BE2"],
    ["BE16", "Microsserviços", "BE", 3, "BE15"],
    ["BE17", "GraphQL", "BE", 3, "BE2"],
    ["BE18", "Webhooks", "BE", 2, "BE2"],
    ["BE19", "OpenAPI / Swagger", "BE", 3, "BE2"],
    ["DB1", "SQL básico", "DB", 1, ""],
    ["DB2", "Modelagem relacional", "DB", 1, "DB1"],
    ["DB3", "JOINs", "DB", 2, "DB1"],
    ["DB4", "Índices", "DB", 3, "DB3"],
    ["DB5", "Transações (ACID)", "DB", 3, "DB3"],
    ["DB6", "SQLite", "DB", 2, "DB1"],
    ["DB7", "PostgreSQL", "DB", 2, "DB2"],
    ["DB8", "MongoDB (NoSQL)", "DB", 3, "DB2"],
    ["DB9", "Redis", "DB", 3, "DB8"],
    ["DB10", "Migrações", "DB", 3, "DB7"],
    ["DB11", "Normalização", "DB", 2, "DB2"],
    ["DB12", "Backup e restauração", "DB", 3, "DB7"],
    ["DB13", "Bancos vetoriais", "DB", 3, "DB8"],
    ["DO1", "Linux", "DO", 1, ""],
    ["DO2", "Shell script", "DO", 2, "DO1"],
    ["DO3", "Redes (TCP/IP)", "DO", 2, "DO1"],
    ["DO4", "Docker", "DO", 1, "DO1"],
    ["DO5", "Docker Compose", "DO", 2, "DO4"],
    ["DO6", "CI/CD", "DO", 2, "DO5"],
    ["DO7", "GitHub Actions", "DO", 2, "DO6"],
    ["DO8", "Nuvem (AWS/GCP)", "DO", 2, "DO3"],
    ["DO9", "Deploy", "DO", 1, "DO8"],
    ["DO10", "Nginx", "DO", 3, "DO3"],
    ["DO11", "Kubernetes", "DO", 3, "DO5"],
    ["DO12", "Terraform (IaC)", "DO", 3, "DO8"],
    ["DO13", "Monitoramento", "DO", 3, "DO9"],
    ["DO14", "Logs", "DO", 3, "DO13"],
    ["DO15", "DNS e HTTPS", "DO", 2, "DO3"],
    ["DO16", "Variáveis de ambiente", "DO", 2, "DO9"],
    ["SE1", "Princípios (CIA)", "SE", 2, ""],
    ["SE2", "Senhas e hash", "SE", 1, "SE1"],
    ["SE3", "Criptografia", "SE", 2, "SE1"],
    ["SE4", "HTTPS / TLS", "SE", 2, "SE3"],
    ["SE5", "OWASP Top 10", "SE", 1, "SE1"],
    ["SE6", "SQL Injection", "SE", 2, "SE5"],
    ["SE7", "XSS e CSRF", "SE", 2, "SE5"],
    ["SE8", "Gestão de segredos", "SE", 2, "SE5"],
    ["SE9", "Pentest básico", "SE", 3, "SE5"],
    ["SE10", "Hardening de servidor", "SE", 3, "SE4"],
    ["IA1", "NumPy", "IA", 2, ""],
    ["IA2", "Pandas", "IA", 2, "IA1"],
    ["IA3", "Visualização de dados", "IA", 2, "IA2"],
    ["IA4", "Estatística", "IA", 1, ""],
    ["IA5", "Álgebra linear", "IA", 2, ""],
    ["IA6", "scikit-learn", "IA", 2, "IA2"],
    ["IA7", "KNN", "IA", 2, "IA6"],
    ["IA8", "Avaliação de modelos", "IA", 1, "IA6"],
    ["IA9", "Redes neurais (MLP)", "IA", 2, "IA6"],
    ["IA10", "CNN e visão", "IA", 2, "IA9"],
    ["IA11", "PyTorch / TensorFlow", "IA", 2, "IA9"],
    ["IA12", "NLP", "IA", 3, "IA9"],
    ["IA13", "LLMs e prompts", "IA", 2, "IA12"],
    ["IA14", "APIs de LLM", "IA", 2, "IA13"],
    ["IA15", "RAG", "IA", 3, "IA14"],
    ["IA16", "Extração de características", "IA", 3, "IA6"],
    ["IA17", "MLOps", "IA", 3, "IA11"],
    ["MO1", "Design mobile", "MO", 2, ""],
    ["MO2", "Flutter (Dart)", "MO", 2, "MO1"],
    ["MO3", "React Native", "MO", 2, "MO1"],
    ["MO4", "Android (Kotlin)", "MO", 3, "MO1"],
    ["MO5", "Navegação de telas", "MO", 2, "MO2"],
    ["MO6", "Consumo de API", "MO", 2, "MO5"],
    ["MO7", "Armazenamento local", "MO", 2, "MO5"],
    ["MO8", "Publicar na loja", "MO", 3, "MO7"],
    ["MO9", "Notificações push", "MO", 3, "MO6"],
    ["BO1", "Scripts de automação", "BO", 1, ""],
    ["BO2", "Web scraping", "BO", 2, "BO1"],
    ["BO3", "Regex", "BO", 2, "BO1"],
    ["BO4", "Planilhas (Excel)", "BO", 2, "BO1"],
    ["BO5", "Agendamento (cron)", "BO", 3, "BO1"],
    ["BO6", "Bots de Discord", "BO", 2, "BO1"],
    ["BO7", "Bots de WhatsApp", "BO", 2, "BO6"],
    ["BO8", "APIs de mensageria", "BO", 3, "BO7"],
    ["BO9", "Streamlit", "BO", 2, "BO1"],
    ["BO10", "Interfaces Tkinter", "BO", 3, "BO1"],
    ["JG1", "Game loop", "JG", 1, ""],
    ["JG2", "Pygame", "JG", 2, "JG1"],
    ["JG3", "Sprites e colisão", "JG", 2, "JG2"],
    ["JG4", "Física 2D", "JG", 3, "JG3"],
    ["JG5", "Godot", "JG", 2, "JG1"],
    ["JG6", "Unity (C#)", "JG", 3, "JG1"],
    ["JG7", "IA de NPCs", "JG", 3, "JG4"],
    ["JG8", "Mods de Minecraft", "JG", 2, "JG1"],
    ["JG9", "Game design", "JG", 2, ""],
    ["JG10", "Áudio e efeitos", "JG", 3, "JG3"],
    ["EM1", "Eletrônica básica", "EM", 1, ""],
    ["EM2", "Arduino", "EM", 2, "EM1"],
    ["EM3", "C/C++", "EM", 2, "EM2"],
    ["EM4", "Sensores e atuadores", "EM", 2, "EM2"],
    ["EM5", "ESP32", "EM", 2, "EM4"],
    ["EM6", "MQTT", "EM", 3, "EM5"],
    ["EM7", "TinyML", "EM", 3, "EM5"],
    ["EM8", "I2C e SPI", "EM", 3, "EM4"],
    ["EM9", "Raspberry Pi", "EM", 2, "EM1"],
    ["ES1", "Código limpo", "ES", 1, ""],
    ["ES2", "Padrões de projeto", "ES", 3, "ES1"],
    ["ES3", "Princípios SOLID", "ES", 3, "ES1"],
    ["ES4", "Metodologias ágeis", "ES", 2, ""],
    ["ES5", "Code review", "ES", 2, "ES1"],
    ["ES6", "Documentação técnica", "ES", 2, ""],
    ["ES7", "UML e diagramas", "ES", 3, "ES6"],
    ["ES8", "Gestão de projetos", "ES", 2, "ES4"],
    ["ES9", "Pensamento de produto", "ES", 2, "ES4"],
    ["ES10", "Portfólio e GitHub", "ES", 2, "ES6"]
  ];

  const POR_ID = {};
  D.forEach((d) => { POR_ID[d[0]] = { id: d[0], nome: d[1], raiz: d[2], nivel: d[3], nivelNome: NIVEIS[d[3]], pai: d[4] || null }; });

  L.ESTRELAS = POR_ID;
  L.ESTRELAS_LISTA = D.map((d) => POR_ID[d[0]]);
  L.estrela = (id) => POR_ID[id] || null;

  // pré-requisitos em ordem: do mais próximo ao mais distante
  L.ancestrais = (id) => {
    const out = [];
    let cur = POR_ID[id];
    while (cur && cur.pai && POR_ID[cur.pai]) { cur = POR_ID[cur.pai]; out.push(cur.id); }
    return out;
  };

  L.skillDaEstrela = (id) => L.SKILLS.find((s) => s.star === id) || null;

  // true se a habilidade tem exercício no editor Programar
  L.temExercicio = (skillId) => Object.keys(L.TRILHAS_BASE).some((k) => L.TRILHAS_BASE[k].aulas.some((a) => a.skill === skillId));

  D.forEach((d) => {
    if (L.SKILLS.some((s) => s.star === d[0])) return;
    L.SKILLS.push({ id: 'st-' + d[0].toLowerCase(), nome: d[1], star: d[0], root: d[2], icon: ICONES[d[2]] || '⭐', item: '' });
  });
})();
