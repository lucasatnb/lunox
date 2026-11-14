# Contrato: `POST /api/montar-trilha`

Rota que a página **Sua trilha** (`sua-trilha.html`) chama quando a pessoa conta o projeto.
A IA escolhe, entre as 163 estrelas do mapa, as que o projeto precisa e devolve a jornada em marcos.

O system prompt já está pronto em **`docs/system-prompt-trilha.md`** (inclui o catálogo das estrelas,
as pontes entre constelações e dois exemplos). Para regerar quando o mapa mudar:

```
python3 ferramentas/gerar_trilha_assets.py
```

## O que o servidor faz

1. Lê o texto de `docs/system-prompt-trilha.md` e usa como mensagem `system`.
2. Manda como mensagem `user` o JSON abaixo (já validado e com limites).
3. Chama o modelo forte (o mesmo da camada L2 do roteador). Sugestão: temperatura 0.3, `max_tokens` ~3000,
   modo JSON se o provedor tiver.
4. Devolve o objeto `jornada` no corpo da resposta.

## Requisição (JSON)

| campo | tipo | exemplo |
|---|---|---|
| `session` | string | `"demo-k3j9x2ab"` (limite de uso por sessão) |
| `projeto` | string, até 400 | `"um bot de Discord que registra presença"` |
| `nivel` | `"nunca_programei"` \| `"sei_o_basico"` \| `"ja_programo"` | `"sei_o_basico"` |
| `acesas` | string[] (ids de estrelas, ex.: `"FU2"`) | `["FU2","FU3"]` |
| `detalhes` | string, até 200, opcional | `"prefiro Python"` |

## Resposta 200

```json
{
  "jornada": {
    "projeto": "Bot de presença para Discord",
    "resumo": "2 frases.",
    "pergunta": null,
    "aviso": null,
    "marcos": [
      { "titulo": "O bot entra no Discord", "descricao": "1 frase",
        "etapas": [ { "estrela": "BO6", "porque": "…", "entrega": "…" } ] }
    ]
  }
}
```

O front também aceita o objeto da jornada direto no corpo, ou o formato `choices[0].message.content`
(texto JSON), igual ao `/api/chat`.

- `pergunta` ou `aviso` com texto e `marcos: []`: o front mostra o texto para a pessoa (pedido vago, fora do
  escopo ou ofensivo) e não troca a jornada atual.

## O que o front revalida (você não precisa confiar na IA)

Mesmo que o modelo erre, `sua-trilha.js` descarta ids que não existem, raízes de constelação (`FU`, `BE`…),
estrelas repetidas e estrelas já acesas. Insere os pré-requisitos que faltarem antes da estrela que
precisa deles e limita a 30 etapas.

## Erros

Qualquer status diferente de 200, resposta sem jornada ou timeout de 70 s faz o front **montar um plano local**
por palavras-chave e mostrar a etiqueta "montada localmente". A rota pode falhar sem travar a página.

## Cuidados

- Limite chamadas por `session`/IP (ex.: 20 por hora): a rota gasta cota de IA e é pública.
- A chave da IA fica só em variável secreta do servidor (`env.*`), nunca no front.
- `projeto` e `detalhes` são texto do usuário: o prompt trata esse conteúdo como dado, mas corte o tamanho
  e valide os tipos antes de montar a mensagem.
- Opcional: valide no servidor que todo `estrela` existe em `estrelas-catalogo.js` e tente de novo uma vez
  se a IA devolver JSON inválido.
