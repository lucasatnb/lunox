# Ponte Git → Cloudflare

Objetivo: **qualquer pessoa com acesso ao repositório dá push na `main` e o site
publicado atualiza sozinho** — sem rodar nada na máquina.

- Repositório: <https://github.com/lucasatnb/lunox> (branch `main`)
- Worker: `lunox` · conta `918cc8378be899276af90ca19e19e325`
- Site: <https://lunox.lunoxdemo.workers.dev>

Existem dois caminhos. **Use só um deles** — os dois juntos publicam duas vezes
(a última execução vence, mas gera confusão e gasto à toa).

| Caminho | Precisa de | Vantagem |
|---|---|---|
| **A. GitHub Actions** (arquivo já incluído) | 2 segredos no GitHub | fica tudo versionado no repositório |
| **B. Workers Builds** (dashboard) | conectar no painel | não precisa criar token |

---

## Caminho A — GitHub Actions

O workflow está em `.github/workflows/deploy.yml` e roda `npx wrangler deploy`
a cada push na `main`.

### 1. Criar o token da Cloudflare

1. Abra <https://dash.cloudflare.com/profile/api-tokens>.
2. **Create Token** → use o modelo **Edit Cloudflare Workers**.
3. Confirme as permissões:
   - `Account` → **Workers Scripts** → *Edit*
   - `Account` → **Workers KV Storage** → *Edit*
   - `Account` → **Account Settings** → *Read*
   - `Zone` → **Workers Routes** → *Edit* (só se usar domínio próprio)
4. Em **Account Resources**, escolha a conta `Lucasatnb1@gmail.com's Account`.
5. Crie e **copie o token** (ele só aparece uma vez).

### 2. Pegar o Account ID

Painel da Cloudflare → **Workers & Pages** → barra lateral direita, ou na URL:
`dash.cloudflare.com/<ACCOUNT_ID>/...`. O desta conta é
`918cc8378be899276af90ca19e19e325`.

### 3. Guardar os segredos no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository
secret**.

| Nome | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | o token do passo 1 |
| `CLOUDFLARE_ACCOUNT_ID` | `918cc8378be899276af90ca19e19e325` |

### 4. Testar

```powershell
git push origin main
```

Em **Actions → Publicar no Cloudflare** dá para acompanhar. No fim, o log mostra
a versão publicada e a URL. Abra o site e confira.

---

## Caminho B — Workers Builds (sem token)

1. Painel da Cloudflare → **Workers & Pages** → worker **lunox**.
2. Aba **Settings** → **Build** → **Connect** (GitHub).
3. Autorize o GitHub e escolha o repositório `lucasatnb/lunox`.
4. Preencha:
   - **Branch:** `main`
   - **Root directory:** `/`
   - **Build command:** *(vazio)*
   - **Deploy command:** `npx wrangler deploy`
5. Salve. Cada push na `main` dispara o build.

> Se escolher este caminho, **apague** `.github/workflows/deploy.yml` (ou
> desative o workflow em Actions) para não publicar duas vezes.

---

## Ligar o commit automático da aba Admin

A publicação da admin tem duas camadas:

1. **KV** (`conteudo:estrelas`) — vale na hora, para todos os usuários;
2. **GitHub** (opcional) — o mesmo conteúdo vira um commit em
   `estrelas-conteudo.js`, para o repositório não ficar diferente do que está
   no ar.

Para a camada 2, crie um **fine-grained PAT**:

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Repository access:** *Only select repositories* → `lucasatnb/lunox`.
3. **Permissions → Repository permissions → Contents:** *Read and write*.
4. Gere e copie o token (`github_pat_...`).
5. Guarde como segredo do Worker:

```powershell
cd "C:\Users\lucas\Downloads\novolunox\lunox"
npx wrangler secret put GITHUB_TOKEN
# cole o token quando pedir
```

6. Confirme que o segredo existe:

```powershell
npx wrangler secret list
```

Pronto: ao clicar em **Publicar para todos** na admin, o Worker grava no KV e
cria o commit. O commit leva `[skip ci]` na mensagem, então **não** dispara
outro deploy (o conteúdo já está no ar pelo KV). Se o build ignorar o marcador,
o pior caso é publicar o mesmo conteúdo duas vezes.

> **Sem o `GITHUB_TOKEN`** a publicação continua real: o site muda na hora para
> todo mundo. Só o repositório não recebe o commit.

---

## Quem pode publicar

Definido em `wrangler.jsonc`:

```jsonc
"vars": {
  "ADMIN_USERS": "lucasatnb",
  "GITHUB_REPO": "lucasatnb/lunox",
  "GITHUB_BRANCH": "main",
  "GITHUB_ARQUIVO": "estrelas-conteudo.js"
}
```

- `ADMIN_USERS` aceita lista separada por vírgula: `"lucasatnb,maria"`.
- O nome é o **usuário do Lunox** (o mesmo do login), não o do GitHub.
- Contas fora da lista recebem `403` e a admin esconde o botão de publicar.

Depois de mudar `vars`, é preciso publicar de novo (`git push` ou
`npx wrangler deploy`).

---

## Checklist de verificação

- [ ] `git push origin main` dispara o workflow (ou o Workers Build).
- [ ] O log termina com `Deployed lunox triggers` e uma versão nova.
- [ ] `https://lunox.lunoxdemo.workers.dev` abre a versão nova.
- [ ] Na admin publicada, logado como `lucasatnb`, aparece **Publicar para todos**.
- [ ] Ao publicar, a mensagem mostra `N estrela(s) no ar` e, se o token existir,
      `commit xxxxxxx no GitHub`.
- [ ] O commit aparece em <https://github.com/lucasatnb/lunox/commits/main>.
- [ ] Uma conta que não está em `ADMIN_USERS` não vê o botão e recebe `403` na API.

---

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Actions falha com `Authentication error [code: 10000]` | token inválido/sem permissão | recrie o token com o modelo *Edit Cloudflare Workers* e atualize o segredo |
| `Could not detect a Worker` / `Missing entry-point` | rodou fora da raiz do repo | confira **Root directory** = `/` e se `wrangler.jsonc` está na raiz |
| Site não muda depois do push | workflow desativado ou Workers Builds não conectado | veja **Actions** e **Settings → Build** |
| Publica duas vezes | Actions **e** Workers Builds ligados | escolha um; apague o workflow ou desconecte o build |
| Admin diz `só os administradores...` | conta fora de `ADMIN_USERS` | ajuste a lista e republique |
| Admin publica mas o commit falha | token sem `Contents: Read and write` ou expirado | crie outro PAT e rode `npx wrangler secret put GITHUB_TOKEN` |
| Conteúdo antigo voltou | KV tem prioridade sobre o arquivo | apague a chave (abaixo) e recarregue |

### Voltar ao conteúdo do repositório

```powershell
npx wrangler kv key delete --namespace-id 728e602742ba40e5ad71390967aa055c --remote "conteudo:estrelas"
```

### Ver o que está publicado

```powershell
npx wrangler deployments list
npx wrangler versions list
```

Para reverter, publique de novo a partir de um commit anterior
(`git revert <sha>` + push) ou rode `npx wrangler rollback`.
