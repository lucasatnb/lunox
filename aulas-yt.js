/* ============================================================
   Aulas em vídeo — UM link do YouTube por estrela.

   Para cadastrar uma aula, descomente (ou crie) uma linha com o id da
   estrela e cole o link. Só isso:

     FU7: 'https://youtu.be/XXXXXXXXXXX',

   Aceita qualquer formato de link do YouTube (youtu.be, watch?v=, shorts,
   embed). Para começar em um ponto do vídeo, use ?t=90 (segundos).

   Opcional, quando precisar de mais:
     FU7: { yt: 'https://youtu.be/XXXXXXXXXXX', titulo: 'Strings na prática', resumo: 'O que você vai ver' },
     FU7: ['https://youtu.be/AAAAAAAAAAA', 'https://youtu.be/BBBBBBBBBBB'],   // aula em partes

   Os ids das estrelas (FU7, BE2, IA9...) estão em estrelas-catalogo.js e em
   docs/system-prompt-trilha.md. Quem não tem link aparece como "vídeo em breve".
   ============================================================ */
window.LUNOX_AULAS = {
  // ---- Fundamentos
  // FU1: '',   // Lógica de programação
  // FU20: '',  // Python
  // FU2: '',   // Variáveis e tipos
  // FU3: '',   // Condicionais
  // FU4: '',   // Laços de repetição
  // FU5: '',   // Funções
  // FU6: '',   // Listas e dicionários
  // FU7: '',   // Strings e texto
  // FU15: '',  // Terminal (CLI)
  // FU16: '',  // Git e GitHub

  // ---- Front-end
  // FE1: '',   // HTML
  // FE2: '',   // CSS
  // FE3: '',   // JavaScript

  // ---- Bots e Automação
  // BO1: '',   // Scripts de automação
  // BO6: '',   // Bots de Discord

  // ---- Back-end e Banco
  // BE1: '',   // HTTP e a web
  // BE2: '',   // APIs REST
  // DB1: '',   // SQL básico
};
