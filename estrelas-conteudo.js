/* ============================================================
   Conteúdo das estrelas — AULAS E DESAFIOS (arquivo de dados)

   Este é o arquivo que a página admin.html gera/atualiza. Cada estrela
   pode ter vários GRUPOS; cada grupo tem um vídeo e um desafio.

   Formato:
     window.LUNOX_CONTEUDO = {
       versao: 1,
       atualizado: '2026-11-11',
       estrelas: {
         FU7: {
           grupos: [
             {
               id: 'fu7-1',
               titulo: 'Strings na prática',
               resumo: 'O que você vai ver neste vídeo',
               videos: ['https://youtu.be/XXXXXXXXXXX'],
               desafio: {
                 titulo: 'Inverter uma palavra',
                 enunciado: 'Peça uma palavra e mostre ela ao contrário.',
                 requisitos: ['Use um laço', 'Devolva uma string'],
                 dica: 'Comece pela última letra e vá voltando.'
               }
             }
           ]
         }
       }
     };

   - `videos` aceita link do YouTube OU o código de incorporação inteiro
     (<iframe ... src="...">), um por linha/posição.
   - `desafio` é opcional: sem ele, o painel oferece "pedir um desafio à IA".

   NÃO edite à mão se puder: abra admin.html, edite e salve.
   O arquivo antigo aulas-yt.js continua valendo como fallback para as
   estrelas que ainda não têm grupos aqui.
   ============================================================ */
window.LUNOX_CONTEUDO = {
  versao: 1,
  atualizado: '2026-11-11',
  estrelas: {
    // FU7: {
    //   grupos: [
    //     {
    //       id: 'fu7-1',
    //       titulo: 'Strings na prática',
    //       resumo: '',
    //       videos: ['https://youtu.be/XXXXXXXXXXX'],
    //       desafio: {
    //         titulo: '',
    //         enunciado: '',
    //         requisitos: [],
    //         dica: ''
    //       }
    //     }
    //   ]
    // }
  }
};
