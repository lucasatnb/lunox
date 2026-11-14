/* ============================================================
   Página Trilha — aulas, passos e trilhas salvas
   ============================================================ */
(function () {
  'use strict';
  const L = window.LUNOX;
  const { $, esc, toast } = L;

  L.montarNav('trilha');

  const abertas = new Set([0]);

  /* ---------------- helpers ---------------- */

  function chipEstrela(id) {
    const s = L.skill(id);
    if (!s) return '';
    const on = L.acesa(id);
    return '<span class="chip ' + (on ? 'gold' : '') + '" title="' + (on ? 'estrela acesa' : 'estrela a acender') + '">' +
      '<span class="dot"></span>' + esc(s.nome) + '</span>';
  }

  function passo(n, rotulo, texto, acao) {
    return '<li class="passo">' +
      '<span class="p-n">' + n + '</span>' +
      '<div class="p-body"><span class="p-label">' + rotulo + '</span><span class="p-txt">' + texto + '</span></div>' +
      (acao ? '<div class="p-act">' + acao + '</div>' : '') +
      '</li>';
  }

  function trailItem(t) {
    const p = L.progressoTrilha(t.id);
    const ativo = t.id === L.estado.atual;
    return '<div class="trail-item' + (ativo ? ' ativo' : '') + '" data-id="' + t.id + '" role="button" tabindex="0">' +
      '<span style="font-size:16px">' + (t.icone || '🌙') + '</span>' +
      '<span class="ti-info">' +
        '<span class="ti-name">' + esc(t.nome) + '</span>' +
        '<span class="ti-meta">' + p.feitas + '/' + p.total + ' aulas · ' +
          (t.concluidaEm ? 'concluída ' + L.tempoRelativo(t.concluidaEm) : L.tempoRelativo(t.criadaEm)) +
        '</span>' +
      '</span>' +
      (ativo ? '<span class="ti-check" title="trilha atual">●</span>' : '') +
      '<button class="ti-del" data-del="' + t.id + '" title="remover trilha" aria-label="remover trilha">✕</button>' +
    '</div>';
  }

  function aulaCard(t, a, i) {
    const pr = L.progressoDe(t.id)[i] || {};
    const s = L.skill(a.skill);
    const jaTem = L.acesa(a.skill);
    const aberta = abertas.has(i);

    return '<article class="aula-card' + (jaTem ? ' skip' : '') + (aberta ? ' aberta' : '') + '" data-aula="' + i + '">' +
      '<div class="aula-head" data-toggle="' + i + '">' +
        '<span class="aula-num">' + (i + 1) + '</span>' +
        '<div class="aula-title">' +
          '<h3>' + esc(a.titulo) + '</h3>' +
          '<div class="aula-tags">' +
            '<span class="chip ' + (jaTem ? 'ok' : '') + '"><span class="dot"></span>' +
              (s ? s.icon + ' ' + esc(s.nome) : 'habilidade') + (jaTem ? ' · já acesa' : '') +
            '</span>' +
            '<span class="passos-dots">' +
              '<span class="dot-step' + (pr.lida ? ' on gold' : '') + '" title="aula"></span>' +
              '<span class="dot-step' + (pr.editor ? ' on' : '') + '" title="código validado"></span>' +
              '<span class="dot-step' + (pr.ia ? ' on' : '') + '" title="teste de refino"></span>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<span class="aula-chev">▾</span>' +
      '</div>' +
      '<div class="aula-body">' +
        '<p class="conceito">' + esc(a.texto) + '</p>' +
        '<ol class="passos">' +
          passo(1, 'Aula', a.passos[0], '') +
          passo(2, 'Programação', a.passos[1],
            '<a class="btn small" href="programar.html?trilha=' + t.id + '&aula=' + i + '&passo=1">Abrir editor</a>') +
          passo(3, 'Programação com IA', a.passos[2],
            '<a class="btn small ghost" href="programar.html?trilha=' + t.id + '&aula=' + i + '&passo=2">Abrir com IA</a>') +
        '</ol>' +
        '<div class="why">' + esc(a.why) + '</div>' +
        '<div class="aula-foot">' +
          '<label class="check-lida"><input type="checkbox" data-lida="' + i + '"' + (pr.lida ? ' checked' : '') + '> li a aula</label>' +
          '<span class="spacer"></span>' +
          (pr.editor ? '<span class="chip ok">código validado</span>' : '<span class="tiny">testes pendentes</span>') +
          (pr.ia ? '<span class="chip gold">refino ok</span>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------------- render ---------------- */

  function render() {
    const t = L.atualObj();
    $('#conta-trilhas').textContent = '(' + L.estado.trilhas.length + ')';
    $('#lista-trilhas').innerHTML = L.estado.trilhas.map(trailItem).join('');

    const nivel = L.nivelGato();
    $('#gato').src = L.imgGato(nivel);
    $('#gato-cap').textContent = nivel === 3
      ? 'Lunox completo — constelação quase inteira'
      : nivel === 2
        ? 'Lunox explorador — 4+ estrelas'
        : 'Lunox aprendiz — acenda a primeira estrela';
    $('#estrelas-count').textContent = L.estado.acesas.size;

    const btn = $('#btn-concluir');

    if (!t) {
      $('#titulo').textContent = 'Nenhuma trilha ainda';
      $('#sub').textContent = 'Crie uma trilha para começar — ou peça ao Lunox para montar a partir do seu objetivo.';
      $('#meta').innerHTML = '';
      $('#aulas').innerHTML = '<div class="panel"><h3>Você está no início</h3>' +
        '<p class="lead" style="margin:8px 0 14px">Escolha um projeto e o Lunox monta as aulas. Cada projeto acende novas estrelas.</p>' +
        '<a class="btn primary" href="sua-trilha.html?nova=1">Criar minha primeira trilha</a></div>';
      $('#feitas').textContent = '0';
      $('#total').textContent = '0';
      $('#pct').textContent = '0%';
      $('#barra').style.width = '0%';
      btn.disabled = true;
      btn.textContent = 'Concluir projeto';
      return;
    }

    $('#titulo').textContent = t.nome;
    $('#sub').textContent = t.projeto.charAt(0).toUpperCase() + t.projeto.slice(1) +
      ' · criada ' + L.tempoRelativo(t.criadaEm) +
      (t.concluidaEm ? ' · concluída ' + L.tempoRelativo(t.concluidaEm) : '');
    $('#meta').innerHTML = t.estrelas.map(chipEstrela).join('') +
      '<span class="chip dim">' + t.aulas.length + ' aulas</span>';

    if (t.concluidaEm) {
      btn.disabled = true;
      btn.textContent = 'Projeto concluído ✓';
    } else {
      btn.disabled = false;
      btn.textContent = 'Concluir projeto';
    }

    const p = L.progressoTrilha(t.id);
    $('#feitas').textContent = p.feitas;
    $('#total').textContent = p.total;
    $('#pct').textContent = p.pct + '%';
    $('#barra').style.width = p.pct + '%';

    $('#aulas').innerHTML = t.aulas.map((a, i) => aulaCard(t, a, i)).join('');
  }

  /* ---------------- eventos ---------------- */

  document.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      const id = del.getAttribute('data-del');
      const alvo = L.achar(id);
      if (!alvo) return;
      if (confirm('Remover a trilha "' + alvo.nome + '"? As estrelas que ela acendeu continuam acesas.')) {
        L.remover(id);
        abertas.clear();
        abertas.add(0);
        render();
        toast('Trilha removida');
      }
      return;
    }

    const item = e.target.closest('.trail-item');
    if (item) {
      L.setAtual(item.getAttribute('data-id'));
      abertas.clear();
      abertas.add(0);
      render();
      return;
    }

    const head = e.target.closest('.aula-head');
    if (head) {
      const i = Number(head.getAttribute('data-toggle'));
      const card = head.parentElement;
      if (abertas.has(i)) abertas.delete(i);
      else abertas.add(i);
      card.classList.toggle('aberta');
    }
  });

  document.addEventListener('change', (e) => {
    const lida = e.target.closest('[data-lida]');
    if (!lida) return;
    const t = L.atualObj();
    if (!t) return;
    L.marcar(t.id, Number(lida.getAttribute('data-lida')), 'lida');
    render();
  });

  $('#btn-concluir').addEventListener('click', () => {
    const t = L.atualObj();
    if (!t || t.concluidaEm) return;
    const p = L.progressoTrilha(t.id);
    if (p.feitas < p.total && !confirm('Ainda faltam ' + (p.total - p.feitas) + ' aulas. Concluir o projeto mesmo assim?')) return;
    const novas = L.concluir(t.id);
    render();
    toast(novas ? '⭐ ' + novas + (novas === 1 ? ' estrela acendeu' : ' estrelas acenderam') + '! Abrindo o mapa…' : 'Projeto concluído ✓');
    if (novas) setTimeout(() => { location.href = 'habilidades.html'; }, 1300);
  });

  /* ---------------- boot ---------------- */

  render();

  if (location.search.indexOf('nova=1') >= 0) {
    const t = L.atualObj();
    if (t) toast('Trilha criada: ' + t.nome + ' ✨');
    history.replaceState(null, '', location.pathname);
  }
})();
