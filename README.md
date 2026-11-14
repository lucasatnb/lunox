# Lunox

Site de ensino de programação em forma de mapa de estrelas: cada estrela é uma
habilidade, cada grupo é uma aula (vídeo + desafio). O aluno monta a própria
trilha e só acende a estrela quando resolve todos os exercícios.

- **No ar:** <https://lunox.lunoxdemo.workers.dev>
- **Código:** <https://github.com/lucasatnb/lunox>

## Como o site é feito

| Peça | O que é |
|---|---|
| `worker/index.js` | Worker da Cloudflare: muro de login, rotas `/api/*`, IA (Workers AI), publicação da admin |
| arquivos `.html/.css/.js` da raiz | o site em si, servido como assets estáticos |
| `estrelas-conteudo.js` | conteúdo das estrelas (aulas e desafios) publicado pela admin |
| KV `728e602742ba40e5ad71390967aa055c` | contas, sessões, estado sincronizado e `conteudo:estrelas` |
| `docs/` | documentação e prompts (não vão para o site) |
| `ferramentas/` | servidor local da admin e script de deploy com backup |

O site inteiro exige login. Sem sessão, só `conta.html` (cadastro livre) abre.

## Rodar localmente

Não há `package.json`: o Wrangler roda via `npx`.

```powershell
# admin local (grava estrelas-conteudo.js e roda o deploy de verdade)
node ferramentas/servidor-admin.mjs
# abra http://127.0.0.1:8788/admin.html
```

```powershell
# Worker local (para testar as rotas /api)
Copy-Item .dev.vars.example .dev.vars   # preencha o que precisar
npx wrangler dev
```

## Publicar

**Automático (recomendado):** todo push na `main` dispara
`.github/workflows/deploy.yml` e publica o Worker. O passo a passo da ponte
Git → Cloudflare está em [`docs/deploy-git.md`](docs/deploy-git.md).

**Manual, com backup:**

```powershell
python ferramentas/deployer.py --deploy --projeto "C:\Users\lucas\Downloads\novolunox\lunox" --manter 3
```

## Aba Admin: publicar de verdade

A aba **Admin** (`admin.html`) monta as aulas de cada estrela. Existem três
formas de levar o conteúdo para o site:

| Onde | Botão | O que acontece |
|---|---|---|
| servidor local | **Salvar no arquivo** | grava `estrelas-conteudo.js` no projeto |
| servidor local | **Publicar no site** | grava o arquivo e roda `wrangler deploy` |
| site publicado | **Publicar para todos** | grava no KV do Worker (vale na hora) e cria um commit no GitHub, se `GITHUB_TOKEN` existir |
| qualquer lugar | **Baixar .js** / **Copiar código** | reserva manual: substituir o arquivo e dar deploy |

Quem pode publicar é definido em `wrangler.jsonc`:

```jsonc
"vars": {
  "ADMIN_USERS": "lucasatnb",          // aceita lista: "lucasatnb,outraconta"
  "GITHUB_REPO": "lucasatnb/lunox",
  "GITHUB_BRANCH": "main",
  "GITHUB_ARQUIVO": "estrelas-conteudo.js"
}
```

Para o commit automático no GitHub, crie um **fine-grained PAT** com
`Contents: Read and write` no repositório `lucasatnb/lunox` e guarde como
segredo do Worker:

```powershell
npx wrangler secret put GITHUB_TOKEN
```

Sem esse segredo a publicação **continua funcionando** (fica no KV e é servida
na hora); o repositório é que não recebe o commit.

### Desfazer o conteúdo publicado no KV

O KV tem prioridade sobre o arquivo do repositório. Para voltar ao
`estrelas-conteudo.js` versionado:

```powershell
npx wrangler kv key delete --namespace-id 728e602742ba40e5ad71390967aa055c --remote "conteudo:estrelas"
```

## O que não vai para o Git

`node_modules/`, `.wrangler/`, `backups/`, `_backup/`, `*.zip`, `*.exe`,
`*.log`, `.env*` e `.dev.vars` (veja `.gitignore`). Os arquivos grandes
(`lunox.zip`, `LunoxDeploy.exe`, o PDF de esboço) ficam só na máquina.
