# Lunox Deploy — o .exe de publicação

`LunoxDeploy.exe` fica na raiz do projeto:

```
C:\Users\lucas\Downloads\novolunox\lunox\LunoxDeploy.exe
```

Ele serve para publicar o site no Cloudflare depois de qualquer mudança manual,
criando um backup completo do projeto antes de cada envio.

## Como usar

1. Abra o `LunoxDeploy.exe` (dois cliques).
2. Confira a **Pasta do projeto** (deve ser a pasta onde está o `wrangler.jsonc`).
3. Confira a **pasta de backups** (por padrão, `lunox\backups`).
4. Clique em **Publicar no site**.
5. Espere o log terminar. No fim aparece a versão publicada e o endereço
   `https://lunox.lunoxdemo.workers.dev`.

Na primeira vez em uma máquina nova, o deploy pode pedir login no Cloudflare.
Se aparecer erro de login, abra o Prompt de Comando na pasta do projeto e rode
uma vez:

```
npx wrangler login
```

Depois clique em **Publicar no site** de novo.

## Backups

- Cada publicação cria um zip **antes** de enviar o site.
- O padrão é guardar os **3 backups mais recentes**; o campo
  “Guardar pelo menos” permite aumentar (mínimo 3).
- Os arquivos ficam em `lunox\backups\` com nome
  `lunox-AAAAMMDD-HHMMSS-antes-do-deploy.zip`.
- O botão **Fazer backup agora** cria um zip extra sem publicar.
- A limpeza só acontece depois de uma publicação bem-sucedida; se o deploy
  falhar, nenhum backup antigo é apagado.

### Restaurar

Pelo programa:

1. Clique em **Restaurar backup…**.
2. Escolha o zip.
3. Confirme. O programa cria antes um backup de segurança
   (`...-antes-de-restaurar.zip`) e extrai o zip por cima do projeto.
4. Clique em **Publicar no site** para colocar a versão restaurada no ar.

Manualmente: feche o programa, extraia o zip escolhido por cima da pasta do
projeto e abra o `LunoxDeploy.exe` para publicar. O arquivo
`backups\LEIA-ME-backups.txt` repete essas instruções.

## Linha de comando (opcional)

O mesmo `.exe` aceita argumentos, útil para testes:

```
LunoxDeploy.exe --verificar
LunoxDeploy.exe --backup
LunoxDeploy.exe --deploy
LunoxDeploy.exe --listar
LunoxDeploy.exe --deploy --projeto "C:\caminho\lunox" --manter 5
LunoxDeploy.exe --restaurar "C:\...\lunox-20261111-224245-antes-do-deploy.zip"
LunoxDeploy.exe --deploy --log-arquivo "%TEMP%\lunox-deploy.log"
```

## Como foi gerado

Fonte: `ferramentas/deployer.py` (Python + tkinter).
Ícone: `ferramentas/lunox.ico`.

Para gerar o `.exe` de novo depois de mexer no fonte:

```
python -m pip install pyinstaller
python -m PyInstaller --noconfirm --clean --onefile --noconsole ^
  --name LunoxDeploy --icon "ferramentas\lunox.ico" ^
  --distpath "ferramentas\dist" --workpath "ferramentas\build" ^
  --specpath "ferramentas" "ferramentas\deployer.py"
copy /Y "ferramentas\dist\LunoxDeploy.exe" "LunoxDeploy.exe"
```

## Observações

- Precisa do **Node.js** instalado (o programa usa `npx wrangler deploy`).
- O `.exe`, a pasta `backups/` e os `.zip` estão no `.assetsignore`, então não
  são publicados como parte do site.
- Por ser um executável gerado com PyInstaller, o Windows SmartScreen pode
  mostrar um aviso na primeira execução: **Mais informações → Executar assim
  mesmo**.
