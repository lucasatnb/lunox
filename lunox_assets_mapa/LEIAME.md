# Assets do Mapa de Estrelas (Lunox)

## O que tem aqui
- `mapa/mapa_estrelas.svg`: o mapa completo (175 estrelas, trilhas e pontes) com fundo transparente. Cada estrela é um `<g class="star t1 r-FE" id="star-FE3" data-id data-label>`, então dá para estilizar e ouvir cliques/hover via CSS/JS (inline no HTML).
- `mapa/mapa_estrelas_sem_rotulos.svg`: o mesmo sem os textos, para você colocar seus próprios rótulos/tooltips em HTML.
- `mapa/mapa_estrelas_transparente.png` (3368x2382) e `mapa/mapa_estrelas_com_fundo.png`: versões em imagem.
- `estrelas/`: 48 ícones (SVG + PNG 256x256 transparente): 12 constelações x 4 tamanhos (`raiz`, `essencial`, `importante`, `avancada`). Nome: `estrela_<sigla>_<tamanho>`.
- `elementos/lua.svg|png`: a lua crescente do centro. `elementos/fundo_estrelado_tile.svg`: céu estrelado que repete sem emenda (800x800).
- `dados/mapa_dados.json`: estrelas (id, nome, constelação, nível, pai, x, y, `por_que` nas essenciais), constelações com cores e pontes. Use para montar a árvore de habilidades de verdade (desbloqueio, progresso, etc.).

## Cores das constelações
| Constelação | Sigla | Cor |
|---|---|---|
| Fundamentos | `fu` | `#ffd666` |
| Front-end | `fe` | `#78c8ff` |
| Mobile | `mo` | `#ff82ff` |
| Back-end | `be` | `#ff8c78` |
| Banco de Dados | `db` | `#6ee6c8` |
| DevOps e Nuvem | `do` | `#ffaa50` |
| Segurança | `se` | `#ff78aa` |
| Embarcados e IoT | `em` | `#d7ff78` |
| Dados e IA | `ia` | `#be96ff` |
| Bots e Automação | `bo` | `#ffcda0` |
| Jogos | `jg` | `#8c96ff` |
| Engenharia de Software | `es` | `#f0f0f0` |

Fundo sugerido: `background: linear-gradient(#0f0a2b, #34236b);` com o `fundo_estrelado_tile.svg` repetido por cima.

## Exemplo
```html
<div id="mapa"><!-- cole o conteúdo do mapa_estrelas.svg aqui --></div>
<style>
  .star.r-BE polygon { filter: drop-shadow(0 0 4px #ff8c78); }
  .star:hover { transform-box: fill-box; transform-origin: center; transform: scale(1.4); }
</style>
<script>
  document.querySelectorAll('.star').forEach(s =>
    s.addEventListener('click', () => console.log(s.dataset.id, s.dataset.label)));
</script>
```
