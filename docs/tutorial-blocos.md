# Tutorial — Programação em blocos do Lunox

**Estrela:** Lógica de programação (FU1) — a única do Lunox em blocos.
**Para quem:** quem está começando a programar e quem cria exercícios na aba **Admin**.
**Formato:** roteiro de vídeo (cenas com fala e ação) + referência rápida para consulta.

> Regra de ouro: só a estrela **Lógica de programação** usa blocos. Todas as outras
> continuam em código (Python por padrão, com JavaScript e TypeScript disponíveis).

---

## Antes de gravar

- Abra `https://lunox.lunoxdemo.workers.dev`, entre na conta e vá em **Sua trilha**.
- Deixe a estrela **Lógica de programação** visível no mapa (ela fica na primeira constelação).
- Se for mostrar a criação de exercício, abra também a aba **Admin** em outra janela.
- Aumente o zoom do navegador para 110–125%: os blocos ficam mais legíveis no vídeo.

---

## Parte 1 — Roteiro do vídeo (aluno)

### Cena 1 — Onde ficam os blocos (0:00–0:40)

**Fala:**
> “No Lunox, a estrela **Lógica de programação** é especial: em vez de escrever código,
> você monta o programa encaixando blocos. É o mesmo raciocínio de um programa de verdade,
> só que sem se preocupar com a sintaxe.”

**Ação:**
1. Abra **Sua trilha**.
2. Clique na estrela **Lógica de programação**.
3. Mostre o selo **Blocos** e o botão **Fazer o exercício**.
4. Clique em **Fazer o exercício**.

**Texto na tela:** “Exercício · Par ou ímpar, passo a passo”.

---

### Cena 2 — Conhecendo a tela (0:40–1:40)

**Fala:**
> “A tela tem três partes: a paleta, a área do programa e o painel de testes.
> Na paleta ficam os blocos: **diga**, **defina**, **mude**, **repita**, **se** e **enquanto**.
> Na área do programa a gente monta. Embaixo, os testes dizem se o programa está certo.”

**Ação (aponte cada item):**
- **Paleta** (à esquerda): grupos **Mostrar**, **Variáveis** e **Controle**.
- **Área do programa** (centro): onde os blocos aparecem empilhados.
- **+** no fim de cada lista: escolhe **onde** o próximo bloco entra (a lista fica destacada).
- **↑ ↓ ✕** em cada bloco: mover para cima, mover para baixo e apagar.
- Campos de texto dentro dos blocos: é onde ficam os valores e as condições.
- **Rodar testes**: executa o programa e mostra quantos testes passaram, por exemplo `(1/2)`.
- **Console**: mostra o que o programa “disse”, linha por linha.
- **Status**: começa em *código ainda não validado* e vira *exercício concluído ✓* quando tudo passa.

**Dica para falar:** “Cada bloco tem uma cor: roxo mostra, laranja guarda valores, verde controla o fluxo.”

---

### Cena 3 — O primeiro programa (1:40–3:10)

**Fala:**
> “Vamos fazer o programa mostrar os números de 1 a 5. Primeiro eu crio uma variável
> para contar. Depois peço para repetir cinco vezes: mostrar o número e somar um.”

**Ação, bloco por bloco:**
1. Na paleta, clique em **defina … como …**.
2. No bloco, preencha: **defina** `n` **como** `1`.
3. Clique no **+** da lista principal e depois em **repita … vezes**.
4. Preencha: **repita** `5` **vezes**.
5. Clique no **+** de dentro do “repita” (a lista interna fica destacada).
6. Adicione **diga …** e escreva `n`.
7. Ainda dentro do “repita”, adicione **mude … em …** e preencha: **mude** `n` **em** `1`.

**Programa até aqui:**

```
defina n como 1
repita 5 vezes:
  diga n
  mude n em 1
```

**Ação:** clique em **Rodar testes**.

**Fala:**
> “Olha só: o console mostrou 1, 2, 3, 4 e 5. Mas os testes ainda não passaram todos,
> porque o exercício também pede para dizer se cada número é par ou ímpar.”

**Texto na tela:** `(1/2)` e as linhas `[console] 1`, `[console] 2`… no console.

---

### Cena 4 — A decisão (3:10–4:40)

**Fala:**
> “Para decidir, uso o bloco **se**. Um número é par quando o resto da divisão por 2 é zero.
> Em blocos, o resto é o `%`. Então: se `n % 2 == 0`, digo que é par; senão, digo que é ímpar.”

**Ação:**
1. Clique no **+** de dentro do “repita” e adicione **se … então**.
   Ele entra no fim da lista interna: use **↑** duas vezes para ficar antes do “diga n”.
2. No campo da condição, escreva `n % 2 == 0`.
3. No **+** logo abaixo do “então”, adicione **diga …** e escreva `n + " é par"`.
4. No **+** logo abaixo do “senão”, adicione **diga …** e escreva `n + " é ímpar"`.

**Programa final:**

```
defina n como 1
repita 5 vezes:
  se n % 2 == 0 então:
    diga n + " é par"
  senão:
    diga n + " é ímpar"
  mude n em 1
```

**Fala:**
> “Repare nas aspas: texto sempre entre aspas. E o `+` com texto junta as partes —
> é assim que o número vira uma frase.”

**Ação:** clique em **Rodar testes**.

**Resultado esperado:** `(2/2)`, console com:

```
1 é ímpar
2 é par
3 é ímpar
4 é par
5 é ímpar
```

---

### Cena 5 — Testes, console e status (4:40–5:30)

**Fala:**
> “Quando todos os testes passam, o Lunox marca o exercício como concluído.
> O status muda para **exercício concluído ✓** e o progresso é salvo sozinho.”

**Ação:**
- Mostre o painel de testes com os dois ✓.
- Mostre o status **exercício concluído ✓**.
- Volte para **Sua trilha** e mostre o contador de exercícios da estrela.

**Fala:**
> “A estrela só acende quando **todos** os exercícios dela estiverem resolvidos.
> Se faltar algum, o botão de acender nem aparece — aparece o contador, tipo `1/2`.”

---

### Cena 6 — Tela cheia (5:30–6:10)

**Fala:**
> “Para se concentrar, use a tela cheia. O enunciado fica fixo do lado esquerdo,
> os blocos no meio e o terminal à direita.”

**Ação:**
1. Clique em **⛶ Tela cheia**.
2. Mostre o enunciado como comentário (`// DESAFIO · …`).
3. Rode os testes dentro da tela cheia.
4. Saia com **Sair (Esc)** ou pela tecla **Esc**.

---

### Cena 7 — Ver solução, limpar e concluir (6:10–7:00)

**Fala:**
> “Se travar, o **Ver solução** mostra uma solução possível — mas tente antes.
> O **Limpar** volta para o programa inicial do exercício.”

**Ação:**
- Clique em **Ver solução** e comente a diferença (o “se/senão” aparece montado — isso substitui o que está na tela).
- Clique em **Limpar** e mostre que o programa inicial volta.
- Volte para a trilha e mostre a estrela acesa (quando todos os exercícios estiverem feitos).

**Fala de encerramento:**
> “Isso é programar em blocos: montar, testar, ajustar. Quando você dominar aqui,
> a passagem para o código em texto fica muito mais fácil.”

---

## Parte 2 — Referência rápida

### Os blocos

| Bloco | Para que serve | Exemplo |
|---|---|---|
| **diga …** | mostra um valor no console | `diga "Olá"` · `diga n` · `diga n + " é par"` |
| **defina … como …** | cria uma variável | `defina n como 1` |
| **mude … em …** | soma um valor à variável (não substitui) | `mude n em 1` |
| **repita … vezes** | repete um trecho um número fixo de vezes | `repita 5 vezes` |
| **se … então / senão** | escolhe um caminho | `se n % 2 == 0` |
| **enquanto …** | repete enquanto a condição for verdadeira | `enquanto n < 5` |

### Valores e expressões

| Você escreve | O programa entende |
|---|---|
| `"texto"` ou `'texto'` | texto (precisa de aspas) |
| `12`, `2.5` | número |
| `n` | o valor da variável `n` |
| `n + 1`, `n * 2`, `n / 2`, `n % 2` | contas (o `%` é o resto) |
| `n % 2 == 0` | comparação (verdadeiro/falso) |
| `n > 3 e n < 9` | “e” — as duas coisas |
| `n < 0 ou n > 10` | “ou” — uma coisa ou outra |
| `nao terminou` | “não” — inverte |
| `verdadeiro`, `falso` | valores lógicos |
| `(n + 1) * 2` | parênteses mudam a ordem |

### Regras que evitam erro

- Texto **sempre** entre aspas; sem aspas, o Lunox procura uma variável com aquele nome.
- Crie a variável com **defina** antes de usá-la.
- Nomes de variável não têm espaço: `n`, `contador`, `total`.
- O **+** com texto junta (“concatena”): `n + " é par"`.
- **mude n em 1** soma 1 ao valor atual; para guardar outro valor, use **defina** de novo.
- A divisão `/` pode dar decimal; para resto use `%`.
- Todo **repita** e todo **enquanto** precisam ter fim. Se a condição nunca ficar falsa, o Lunox para com um aviso.
- O programa mostra no máximo 5.000 linhas e executa até 200.000 passos — proteção contra laço infinito.

---

## Parte 3 — Mensagens de erro e o que fazer

| Mensagem | O que aconteceu | Como resolver |
|---|---|---|
| `a variável "x" ainda não existe` | usou antes de criar | adicione **defina x como …** antes |
| `divisão por zero` / `resto de divisão por zero` | dividiu por 0 | confira o valor do divisor |
| `O "enquanto" não está terminando` | a condição nunca fica falsa | mude a variável dentro do laço |
| `O programa ficou preso num laço` | passou de 200.000 passos | garanta que o laço tem fim |
| `O programa mostrou coisa demais` | mais de 5.000 linhas | reduza o laço ou o que é mostrado |
| `faltou fechar as aspas` | texto sem aspas no fim | feche com `"` ou `'` |
| `faltou fechar o parêntese` | abriu `(` e não fechou | feche o parêntese |
| `sobrou "…" na expressão` | escreveu algo a mais | apague o que sobrou |
| `O número de repetições não pode ser negativo` | `repita -1 vezes` | use zero ou positivo |
| `Escolha um nome para a variável` | campo do nome vazio | dê um nome, como `n` |

---

## Parte 4 — Para quem cria exercícios (Admin)

### Passo a passo

1. Abra a aba **Admin** e escolha a estrela **Lógica de programação (FU1)**.
2. Clique em **+ Adicionar grupo** (cada grupo é uma aula: vídeo + desafio).
3. Clique em **Criar exercício**.
4. A linguagem já vem travada em **Blocos (visual)** — não dá para trocar, porque a FU1 é a única em blocos.
5. Preencha **Título**, **Enunciado**, **Requisitos** (um por linha) e **Dica**.
6. Monte o **Programa inicial (blocos)**: é o que a pessoa vê ao abrir. Deixe incompleto de propósito.
7. Monte a **Solução (blocos)**: é o que aparece em “Ver solução” e o que o botão **Testar solução** executa.
8. Escreva os **Testes**. Em blocos, o teste recebe `saida` — a lista do que o programa mostrou.
9. Clique em **Testar solução**. Roda no navegador, sem internet.
10. Clique em **Salvar no arquivo** e depois em **Publicar no site** (no servidor local).
    No site publicado, use **Baixar .js** ou **Copiar código** e faça o deploy.

> Enquanto você edita, tudo fica num **rascunho local** e já aparece na trilha deste navegador.
> O selo **rascunho local** no topo avisa disso.

### Exemplo de testes em blocos

```js
check("mostra 1 a 5 com par ou ímpar", function () {
  return saida.join(" | ") === "1 é ímpar | 2 é par | 3 é ímpar | 4 é par | 5 é ímpar";
});
check("mostra cinco linhas", function () {
  return saida.length === 5;
});
```

- `saida` é uma lista de textos, na ordem em que o programa mostrou.
- `check("nome", function () { return condição; })` — um teste por `check`.
- Se deixar os **Testes** vazios, o exercício vira uma atividade escrita: a pessoa lê e marca **Marcar como concluído** na trilha.
- Use 2 ou 3 testes: um para o resultado principal e outro para uma condição extra (quantidade de linhas, primeira linha, etc.).

### Cuidados ao montar o exercício

- O **programa inicial** deve rodar sem erro, mas falhar em pelo menos um teste.
- A **solução** precisa passar em todos os testes — confirme com **Testar solução**.
- Evite pedir texto exato demais sem mostrar o formato no enunciado.
- Em blocos, não há arquivos de apoio (diferente de Python/JS/TS).
- O desafio final da estrela também é em blocos, pelo botão **Criar desafio final**.

---

## Parte 5 — Resumo para a lousa (10 passos)

1. Abra **Sua trilha** → estrela **Lógica de programação**.
2. Clique em **Fazer o exercício**.
3. Leia o enunciado e os requisitos.
4. Escolha um bloco na **paleta**.
5. Use o **+** para escolher onde ele entra.
6. Preencha os campos (valores, condições, nomes).
7. Use **↑ ↓** para ordenar e **✕** para apagar.
8. Clique em **Rodar testes**.
9. Leia o **console** e o painel de testes; ajuste o que falhou.
10. Quando der `(2/2)`, o exercício está concluído — a estrela acende ao resolver todos.

---

## Parte 6 — Checklist final do tutorial

- [ ] A estrela FU1 abre com o selo **Blocos**.
- [ ] O editor de texto não aparece: só a paleta e a área de blocos.
- [ ] O select de linguagem mostra **Blocos** e está travado.
- [ ] “Rodar testes” mostrou `(1/2)` no programa inicial e `(2/2)` na solução.
- [ ] O console mostrou uma linha por número.
- [ ] O status virou **exercício concluído ✓**.
- [ ] A tela cheia manteve os blocos e o enunciado em `//`.
- [ ] Na trilha, o contador de exercícios e o botão de acender apareceram só no fim.
- [ ] No Admin da FU1, a linguagem ficou travada em **Blocos (visual)** e **Testar solução** deu `1/1`.
