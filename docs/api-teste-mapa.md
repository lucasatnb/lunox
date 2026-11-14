# Contrato: `POST /api/teste-mapa`

Rota que o mapa de habilidades chama quando o aluno envia um mini-exercício do teste.
O navegador **já rodou os testes** (só chama a rota se todos passaram). A IA decide
se o aluno usou o conceito de verdade (ex.: laço de repetição, em vez de fórmula pronta
ou resposta fixa no código).

## Requisição (JSON)

| campo | tipo | exemplo |
|---|---|---|
| `session` | string | `"demo-k3j9x2ab"` (para limite de uso por sessão) |
| `skill` | string | `"lacos"` |
| `skillNome` | string | `"Laços"` |
| `titulo` | string | `"Soma até N"` |
| `enunciado` | string | texto do exercício, sem HTML |
| `requisitos` | string[] | `["Use for ou while", "Para n = 0, devolva 0"]` |
| `codigo` | string | código do aluno (JavaScript) |
| `testes` | string | testes que passaram, um por linha (`OK - nome`) |
| `testesOk` | boolean | sempre `true` |

## Resposta 200 (JSON)

```json
{ "aprovado": true, "comentario": "Usou o laço direitinho.", "modelo": "opcional", "ms": 1800 }
```

- `aprovado` (**boolean, obrigatório**): `true` acende a estrela. Se vier ausente ou de outro tipo, o front trata como falha da IA.
- `comentario` (string, 1 a 2 frases em português, tom de professor): mostrado ao aluno. Se reprovar, diga o que ajustar sem entregar o código pronto.

## Erros

Qualquer status diferente de 200 (ou timeout de 45 s) faz o front **cair na correção local**: vale o resultado dos testes do navegador, e o aluno vê "correção local". Então a rota pode falhar sem travar o teste.

## Sugestão de prompt

> Você corrige mini-exercícios de programação de iniciantes. Os testes automáticos já passaram.
> Aprove (`aprovado: true`) só se o código usa o conceito pedido em `skillNome` de forma real
> e não apenas devolve o resultado esperado (respostas fixas, fórmulas que contornam o conceito).
> Seja generoso com estilo: nomes, formatação e soluções diferentes mas corretas são aprovadas.
> Responda SOMENTE JSON: `{"aprovado": boolean, "comentario": "1 a 2 frases em português"}`.

## Cuidados

- Valide `codigo` (limite de ~4 KB) e trate-o como texto: nunca execute no servidor.
- Limite chamadas por `session`/IP (ex.: 30 por hora), porque a rota gasta cota de IA e é pública.
- A chave da IA fica só em variável secreta do servidor (`env.*`), nunca no front.
