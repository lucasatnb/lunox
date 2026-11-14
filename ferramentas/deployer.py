#!/usr/bin/env python3
"""Lunox Deploy — publica o site no Cloudflare com backup automático.

Uso normal: abra o LunoxDeploy.exe (interface gráfica).
Uso por linha de comando (para testes/automação):

    python ferramentas/deployer.py --verificar
    python ferramentas/deployer.py --backup
    python ferramentas/deployer.py --deploy
    python ferramentas/deployer.py --deploy --projeto "C:\\caminho\\lunox" --manter 5
"""

from __future__ import annotations

import argparse
import json
import os
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
import zipfile
from datetime import datetime
from pathlib import Path

APP_NOME = "Lunox Deploy"
MIN_BACKUPS = 3
BACKUP_PADRAO = 3
TIMEOUT_DEPLOY = 15 * 60  # segundos

# Pastas que nunca entram no zip de backup (nome em qualquer nível).
EXCLUIR_PASTAS = {
    ".wrangler",
    "node_modules",
    ".git",
    "backups",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    ".pytest_cache",
    ".idea",
    ".vscode",
}
# Caminhos específicos de build do próprio deployer.
EXCLUIR_CAMINHOS = (
    "ferramentas/build/",
    "ferramentas/dist/",
    "ferramentas/deployer.spec",
)
EXCLUIR_SUFIXOS = {".exe", ".zip", ".pyc", ".pyo", ".log", ".spec"}
EXCLUIR_NOMES = {"Thumbs.db", "desktop.ini", ".DS_Store"}

ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")


# --------------------------------------------------------------------------
# Configuração
# --------------------------------------------------------------------------

def pasta_do_programa() -> Path:
    """Pasta do .exe (ou da raiz do projeto quando roda como .py)."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def caminho_config() -> Path:
    base = os.environ.get("APPDATA") or str(Path.home())
    return Path(base) / "LunoxDeploy" / "config.json"


def ler_config() -> dict:
    try:
        dados = json.loads(caminho_config().read_text(encoding="utf-8"))
        if isinstance(dados, dict):
            return dados
    except Exception:
        pass
    return {}


def gravar_config(projeto: Path | None, backups: Path | None, manter: int) -> None:
    try:
        cfg = ler_config()
        if projeto:
            cfg["projeto"] = str(projeto)
        if backups:
            cfg["backups"] = str(backups)
        cfg["manter"] = max(MIN_BACKUPS, int(manter))
        destino = caminho_config()
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass


def projeto_padrao() -> Path:
    cfg = ler_config()
    candidatos = []
    if cfg.get("projeto"):
        candidatos.append(Path(cfg["projeto"]))
    aqui = pasta_do_programa()
    candidatos += [aqui, aqui.parent]
    for c in candidatos:
        if (c / "wrangler.jsonc").is_file() or (c / "wrangler.toml").is_file():
            return c
    return aqui


def backups_padrao(projeto: Path) -> Path:
    cfg = ler_config()
    if cfg.get("backups"):
        return Path(cfg["backups"])
    return projeto / "backups"


def manter_padrao() -> int:
    try:
        return max(MIN_BACKUPS, int(ler_config().get("manter", BACKUP_PADRAO)))
    except Exception:
        return BACKUP_PADRAO


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------

def limpar_ansi(texto: str) -> str:
    return ANSI.sub("", texto).replace("\r", "")


def formatar_tamanho(bytes_: int) -> str:
    if bytes_ >= 1024 * 1024:
        return f"{bytes_ / (1024 * 1024):.1f} MB".replace(".", ",")
    if bytes_ >= 1024:
        return f"{bytes_ / 1024:.0f} KB"
    return f"{bytes_} B"


def validar_projeto(projeto: Path) -> str | None:
    """Devolve uma mensagem de erro, ou None se a pasta parece ser o projeto."""
    if not projeto.is_dir():
        return "a pasta do projeto não existe"
    if not ((projeto / "wrangler.jsonc").is_file() or (projeto / "wrangler.toml").is_file()):
        return "não achei wrangler.jsonc/wrangler.toml nessa pasta"
    if not (projeto / "worker" / "index.js").is_file():
        return "não achei worker/index.js nessa pasta"
    return None


def achar_npx() -> str | None:
    return shutil.which("npx")


def versao_node() -> str:
    try:
        r = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        return (r.stdout or "").strip()
    except Exception:
        return ""


def arquivos_do_projeto(projeto: Path) -> list[Path]:
    arquivos: list[Path] = []
    for raiz, pastas, nomes in os.walk(projeto):
        raiz_p = Path(raiz)
        pastas[:] = [p for p in pastas if p not in EXCLUIR_PASTAS]
        for nome in nomes:
            caminho = raiz_p / nome
            try:
                rel = caminho.relative_to(projeto)
            except ValueError:
                continue
            rel_txt = rel.as_posix()
            if any(rel_txt == c.rstrip("/") or rel_txt.startswith(c) for c in EXCLUIR_CAMINHOS):
                continue
            if caminho.suffix.lower() in EXCLUIR_SUFIXOS:
                continue
            if nome in EXCLUIR_NOMES:
                continue
            if caminho.is_file():
                arquivos.append(caminho)
    return arquivos


# --------------------------------------------------------------------------
# Backups
# --------------------------------------------------------------------------

def criar_backup(projeto: Path, pasta_backups: Path, rotulo: str = "") -> dict:
    """Cria um zip com o projeto inteiro. Devolve {caminho, arquivos, bytes}."""
    pasta_backups.mkdir(parents=True, exist_ok=True)
    carimbo = datetime.now().strftime("%Y%m%d-%H%M%S")
    sufixo = f"-{rotulo}" if rotulo else ""
    destino = pasta_backups / f"lunox-{carimbo}{sufixo}.zip"
    n = 1
    while destino.exists():
        destino = pasta_backups / f"lunox-{carimbo}{sufixo}-{n}.zip"
        n += 1

    arquivos = arquivos_do_projeto(projeto)
    if not arquivos:
        raise RuntimeError("não encontrei arquivos para incluir no backup")

    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for caminho in arquivos:
            z.write(caminho, caminho.relative_to(projeto).as_posix())

    # Confere se o zip abre e se nenhum arquivo ficou corrompido.
    with zipfile.ZipFile(destino) as z:
        ruim = z.testzip()
        if ruim:
            raise RuntimeError(f"o backup ficou corrompido em {ruim}")
        total_no_zip = len(z.namelist())

    if total_no_zip != len(arquivos):
        raise RuntimeError("o backup não incluiu todos os arquivos")

    escrever_leia_me(pasta_backups, projeto)
    return {"caminho": destino, "arquivos": len(arquivos), "bytes": destino.stat().st_size}


def escrever_leia_me(pasta_backups: Path, projeto: Path) -> None:
    texto = f"""Backups do Lunox
================

Cada arquivo lunox-AAAAMMDD-HHMMSS.zip é uma cópia completa do projeto
feita antes de uma publicação (ou por você, no botão "Fazer backup agora").

Para restaurar manualmente:
  1. Feche o Lunox Deploy.
  2. Extraia o zip escolhido por cima desta pasta:
     {projeto}
  3. Abra o Lunox Deploy e clique em "Publicar no site".

O programa guarda no mínimo {MIN_BACKUPS} backups e apaga os mais antigos
depois de cada backup, mantendo sempre os mais recentes.
"""
    try:
        (pasta_backups / "LEIA-ME-backups.txt").write_text(texto, encoding="utf-8")
    except Exception:
        pass


def listar_backups(pasta_backups: Path) -> list[Path]:
    if not pasta_backups.is_dir():
        return []
    zips = [p for p in pasta_backups.glob("lunox-*.zip") if p.is_file()]
    return sorted(zips, key=lambda p: p.stat().st_mtime, reverse=True)


def podar_backups(pasta_backups: Path, manter: int) -> list[Path]:
    """Apaga os backups mais antigos, mantendo pelo menos `manter`."""
    manter = max(MIN_BACKUPS, int(manter))
    zips = listar_backups(pasta_backups)
    removidos = []
    for zip_ in zips[manter:]:
        try:
            zip_.unlink()
            removidos.append(zip_)
        except OSError:
            pass
    return removidos


def extrair_backup(zip_path: Path, projeto: Path) -> int:
    """Extrai o zip por cima do projeto, recusando caminhos suspeitos."""
    destino_base = projeto.resolve()
    extraidos = 0
    with zipfile.ZipFile(zip_path) as z:
        for info in z.infolist():
            alvo = (destino_base / info.filename).resolve()
            if alvo != destino_base and destino_base not in alvo.parents:
                raise RuntimeError(f"o backup tem um caminho inválido: {info.filename}")
            if info.is_dir():
                continue
            z.extract(info, destino_base)
            extraidos += 1
    return extraidos


# --------------------------------------------------------------------------
# Deploy
# --------------------------------------------------------------------------

def rodar_deploy(projeto: Path, ao_vivo=None, timeout: int = TIMEOUT_DEPLOY) -> dict:
    """Roda `npx wrangler deploy` e devolve {ok, codigo, versao, url, saida, erro}."""
    env = os.environ.copy()
    env.update(
        {
            "CI": "1",
            "WRANGLER_SEND_METRICS": "false",
            "FORCE_COLOR": "0",
            "NO_COLOR": "1",
        }
    )
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    comando = "npx --yes wrangler deploy"
    try:
        proc = subprocess.Popen(
            comando,
            cwd=str(projeto),
            shell=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env=env,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            creationflags=flags,
        )
    except Exception as e:
        return {"ok": False, "codigo": -1, "versao": "", "url": "", "saida": "",
                "erro": f"não consegui rodar o npx: {e}"}

    estourou = {"v": False}

    def matar():
        estourou["v"] = True
        try:
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    capture_output=True,
                    creationflags=flags,
                )
            else:
                proc.kill()
        except Exception:
            pass

    alarme = threading.Timer(timeout, matar)
    alarme.daemon = True
    alarme.start()

    linhas: list[str] = []
    try:
        assert proc.stdout is not None
        for bruta in proc.stdout:
            linha = limpar_ansi(bruta.rstrip("\r\n"))
            if not linha.strip():
                continue
            linhas.append(linha)
            if ao_vivo:
                ao_vivo(linha)
        codigo = proc.wait()
    except Exception as e:
        try:
            proc.kill()
        except Exception:
            pass
        codigo = -1
        linhas.append(f"erro ao ler a saída: {e}")
    finally:
        alarme.cancel()

    texto = "\n".join(linhas)
    versao = (re.search(r"Current Version ID:\s*([0-9a-fA-F-]+)", texto) or [None, ""])[1]
    url = (re.search(r"https://[a-z0-9.-]+\.workers\.dev", texto) or [""])[0]

    if estourou["v"]:
        erro = f"o deploy demorou mais de {timeout // 60} minutos e foi cancelado"
    elif codigo == 0:
        erro = None
    else:
        erro = f"o wrangler terminou com código {codigo}"
        if re.search(r"not authenticated|wrangler login|not logged in|não está logado", texto, re.I):
            erro += " — parece que você não está logado no Cloudflare"

    return {"ok": codigo == 0 and not estourou["v"], "codigo": codigo,
            "versao": versao, "url": url, "saida": texto, "erro": erro}


def publicar(projeto: Path, pasta_backups: Path, manter: int, log) -> dict:
    """Backup + deploy + limpeza. `log(texto, tag)` recebe o andamento."""
    erro = validar_projeto(projeto)
    if erro:
        return {"ok": False, "erro": erro}
    if not achar_npx():
        return {"ok": False, "erro": "não achei o npx no PATH — instale o Node.js (https://nodejs.org)"}

    log("")
    log(f"Projeto: {projeto}", "info")
    log(f"Backups: {pasta_backups}", "info")
    log("Criando backup antes de publicar…", "info")
    try:
        bkp = criar_backup(projeto, pasta_backups, "antes-do-deploy")
    except Exception as e:
        log(f"× Backup falhou: {e}", "erro")
        log("O deploy foi cancelado para não publicar sem backup.", "erro")
        return {"ok": False, "erro": f"backup falhou: {e}"}

    log(f"√ Backup criado: {bkp['caminho'].name} "
        f"({formatar_tamanho(bkp['bytes'])}, {bkp['arquivos']} arquivos)", "ok")

    log("")
    log("Publicando no Cloudflare (npx wrangler deploy)…", "info")
    log("Isso costuma levar de 10 a 60 segundos.", "info")
    log("")

    inicio = time.time()
    res = rodar_deploy(projeto, ao_vivo=lambda linha: log(linha))
    res["backup"] = str(bkp["caminho"])
    res["segundos"] = round(time.time() - inicio, 1)

    log("")
    if res["ok"]:
        removidos = podar_backups(pasta_backups, manter)
        res["removidos"] = [str(p) for p in removidos]
        log(f"√ Publicado com sucesso em {res['segundos']}s.", "ok")
        if res.get("versao"):
            log(f"  Versão: {res['versao']}", "ok")
        if res.get("url"):
            log(f"  Site: {res['url']}", "ok")
        log(f"  Backup guardado: {bkp['caminho']}", "info")
        if removidos:
            log(f"  Limpeza: {len(removidos)} backup(s) antigo(s) removido(s), "
                f"mantendo os {max(MIN_BACKUPS, manter)} mais recentes.", "aviso")
    else:
        res["removidos"] = []
        log(f"× O deploy falhou: {res.get('erro') or 'erro desconhecido'}", "erro")
        log(f"  O backup desta tentativa está em: {bkp['caminho']}", "aviso")
        texto = res.get("saida", "")
        if re.search(r"not authenticated|wrangler login|not logged in|não está logado", texto, re.I):
            log("", "")
            log("Como resolver o login (só precisa fazer uma vez):", "aviso")
            log("  1. Abra o Prompt de Comando nesta pasta do projeto.", "aviso")
            log("  2. Rode: npx wrangler login", "aviso")
            log("  3. Autorize no navegador e clique em Publicar de novo.", "aviso")
    return res


# --------------------------------------------------------------------------
# Interface gráfica
# --------------------------------------------------------------------------

def abrir_interface(projeto_inicial: Path | None = None,
                    backups_inicial: Path | None = None,
                    manter_inicial: int | None = None) -> int:
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk
    from tkinter.scrolledtext import ScrolledText

    projeto_cfg = projeto_inicial or projeto_padrao()
    backups_cfg = backups_inicial or backups_padrao(projeto_cfg)
    manter_cfg = manter_inicial or manter_padrao()

    raiz = tk.Tk()
    raiz.title(APP_NOME)
    raiz.geometry("820x600")
    raiz.minsize(680, 480)

    try:
        estilo = ttk.Style(raiz)
        if "vista" in estilo.theme_names():
            estilo.theme_use("vista")
        estilo.configure("Titulo.TLabel", font=("Segoe UI", 10, "bold"))
        estilo.configure("Dica.TLabel", font=("Segoe UI", 9), foreground="#64748b")
        estilo.configure("Status.TLabel", font=("Segoe UI", 9))
    except Exception:
        pass

    estado = {
        "ocupado": False,
        "projeto": projeto_cfg,
        "backups": backups_cfg,
        "manter": max(MIN_BACKUPS, int(manter_cfg)),
        "ultimo_url": "",
    }
    fila: queue.Queue = queue.Queue()

    # ---------------- variáveis ----------------
    var_projeto = tk.StringVar(value=str(projeto_cfg))
    var_backups = tk.StringVar(value=str(backups_cfg))
    var_manter = tk.IntVar(value=estado["manter"])
    var_status = tk.StringVar(value="Pronto.")

    # ---------------- layout ----------------
    moldura = ttk.Frame(raiz, padding=14)
    moldura.pack(fill="both", expand=True)

    cabecalho = ttk.Frame(moldura)
    cabecalho.pack(fill="x")
    ttk.Label(cabecalho, text="Lunox Deploy", style="Titulo.TLabel").pack(side="left")
    ttk.Label(cabecalho, text="  backup automático + publicação no Cloudflare",
              style="Dica.TLabel").pack(side="left", pady=(2, 0))

    # pasta do projeto
    linha1 = ttk.Frame(moldura)
    linha1.pack(fill="x", pady=(12, 0))
    ttk.Label(linha1, text="Pasta do projeto:", width=17).pack(side="left")
    entrada_projeto = ttk.Entry(linha1, textvariable=var_projeto)
    entrada_projeto.pack(side="left", fill="x", expand=True)
    btn_projeto = ttk.Button(linha1, text="Escolher…", command=lambda: escolher_projeto())
    btn_projeto.pack(side="left", padx=(8, 0))

    # pasta de backups + retenção
    linha2 = ttk.Frame(moldura)
    linha2.pack(fill="x", pady=(8, 0))
    ttk.Label(linha2, text="Backups em:", width=17).pack(side="left")
    entrada_backups = ttk.Entry(linha2, textvariable=var_backups)
    entrada_backups.pack(side="left", fill="x", expand=True)
    btn_backups = ttk.Button(linha2, text="Escolher…", command=lambda: escolher_backups())
    btn_backups.pack(side="left", padx=(8, 0))

    linha3 = ttk.Frame(moldura)
    linha3.pack(fill="x", pady=(8, 0))
    ttk.Label(linha3, text="Guardar pelo menos", width=17).pack(side="left")
    spin = ttk.Spinbox(linha3, from_=MIN_BACKUPS, to=50, width=5,
                       textvariable=var_manter, justify="center")
    spin.pack(side="left")
    ttk.Label(linha3, text=f" backups (mínimo {MIN_BACKUPS})", style="Dica.TLabel").pack(side="left")
    ttk.Label(linha3, text="  •  cada publicação cria um zip antes de enviar",
              style="Dica.TLabel").pack(side="left")

    ttk.Separator(moldura).pack(fill="x", pady=14)

    # botões
    botoes = ttk.Frame(moldura)
    botoes.pack(fill="x")
    btn_publicar = tk.Button(
        botoes,
        text="Publicar no site",
        command=lambda: publicar_agora(),
        bg="#2563eb",
        fg="white",
        activebackground="#1d4ed8",
        activeforeground="white",
        disabledforeground="#cbd5e1",
        relief="flat",
        cursor="hand2",
        font=("Segoe UI", 11, "bold"),
        padx=18,
        pady=7,
    )
    btn_publicar.pack(side="left")

    btn_backup = ttk.Button(botoes, text="Fazer backup agora", command=lambda: backup_agora())
    btn_backup.pack(side="left", padx=(10, 0))
    btn_restaurar = ttk.Button(botoes, text="Restaurar backup…", command=lambda: restaurar_agora())
    btn_restaurar.pack(side="left", padx=(8, 0))
    btn_abrir = ttk.Button(botoes, text="Abrir pasta de backups", command=lambda: abrir_pasta())
    btn_abrir.pack(side="left", padx=(8, 0))
    btn_site = ttk.Button(botoes, text="Abrir site", command=lambda: abrir_site(), state="disabled")
    btn_site.pack(side="right")

    # barra de progresso
    progresso = ttk.Progressbar(moldura, mode="indeterminate")
    progresso.pack(fill="x", pady=(12, 0))

    # log
    log_txt = ScrolledText(
        moldura,
        height=16,
        wrap="word",
        font=("Consolas", 9),
        bg="#0f172a",
        fg="#e2e8f0",
        insertbackground="#e2e8f0",
        relief="flat",
        borderwidth=0,
        padx=10,
        pady=8,
        state="disabled",
    )
    log_txt.pack(fill="both", expand=True, pady=(10, 0))
    log_txt.tag_configure("ok", foreground="#4ade80")
    log_txt.tag_configure("erro", foreground="#f87171")
    log_txt.tag_configure("aviso", foreground="#fbbf24")
    log_txt.tag_configure("info", foreground="#94a3b8")
    log_txt.tag_configure("cmd", foreground="#7dd3fc")

    status = ttk.Label(moldura, textvariable=var_status, style="Status.TLabel")
    status.pack(fill="x", pady=(8, 0))

    # ---------------- ações auxiliares ----------------
    def escrever(texto: str, tag: str = "") -> None:
        log_txt.configure(state="normal")
        log_txt.insert("end", texto + "\n", tag)
        log_txt.see("end")
        log_txt.configure(state="disabled")

    def enfileirar_log(texto: str, tag: str = "") -> None:
        fila.put(("log", texto, tag))

    def drenar() -> None:
        try:
            while True:
                item = fila.get_nowait()
                tipo = item[0]
                if tipo == "log":
                    escrever(item[1], item[2])
                elif tipo == "fim":
                    finalizar(item[1])
                elif tipo == "status":
                    var_status.set(item[1])
        except queue.Empty:
            pass
        raiz.after(80, drenar)

    def ocupar(ligado: bool) -> None:
        estado["ocupado"] = ligado
        for w in (btn_publicar, btn_backup, btn_restaurar, btn_abrir,
                  btn_projeto, btn_backups, spin):
            try:
                w.configure(state="disabled" if ligado else "normal")
            except Exception:
                pass
        if not ligado:
            btn_publicar.configure(state="normal")
        if ligado:
            progresso.start(12)
        else:
            progresso.stop()

    def projeto_atual() -> Path:
        return Path(var_projeto.get().strip().strip('"')).expanduser()

    def backups_atual() -> Path:
        return Path(var_backups.get().strip().strip('"')).expanduser()

    def manter_atual() -> int:
        try:
            n = int(var_manter.get())
        except Exception:
            n = MIN_BACKUPS
        n = max(MIN_BACKUPS, n)
        var_manter.set(n)
        return n

    def salvar_cfg() -> None:
        gravar_config(projeto_atual(), backups_atual(), manter_atual())

    def escolher_projeto() -> None:
        inicial = projeto_atual()
        escolhida = filedialog.askdirectory(
            title="Escolha a pasta do projeto (onde está o wrangler.jsonc)",
            initialdir=str(inicial if inicial.is_dir() else Path.home()),
        )
        if escolhida:
            var_projeto.set(escolhida)
            if var_backups.get().strip() in ("", str(projeto_cfg / "backups")):
                var_backups.set(str(Path(escolhida) / "backups"))
            var_status.set("Pasta do projeto alterada.")

    def escolher_backups() -> None:
        inicial = backups_atual()
        escolhida = filedialog.askdirectory(
            title="Escolha onde guardar os backups",
            initialdir=str(inicial if inicial.is_dir() else Path.home()),
        )
        if escolhida:
            var_backups.set(escolhida)

    def abrir_pasta() -> None:
        pasta = backups_atual()
        try:
            pasta.mkdir(parents=True, exist_ok=True)
            os.startfile(str(pasta))  # type: ignore[attr-defined]
        except Exception as e:
            messagebox.showerror(APP_NOME, f"Não consegui abrir a pasta:\n{e}")

    def abrir_site() -> None:
        if estado["ultimo_url"]:
            import webbrowser
            webbrowser.open(estado["ultimo_url"])

    def finalizar(res: dict) -> None:
        ocupar(False)
        if res.get("ok"):
            versao = res.get("versao") or ""
            var_status.set("√ Publicado" + (f" — versão {versao}" if versao else "") + ".")
            if res.get("url"):
                estado["ultimo_url"] = res["url"]
                btn_site.configure(state="normal")
            if not res.get("silencioso"):
                messagebox.showinfo(
                    APP_NOME,
                    "Site publicado com sucesso!\n\n"
                    + (f"Versão: {versao}\n" if versao else "")
                    + (f"Endereço: {res['url']}\n" if res.get("url") else "")
                    + f"\nBackup: {res.get('backup', '')}",
                )
        else:
            var_status.set("× Não foi possível publicar — veja o log abaixo.")
            if not res.get("silencioso"):
                messagebox.showerror(
                    APP_NOME,
                    "A publicação falhou.\n\n" + str(res.get("erro") or "Veja o log."),
                )

    def rodar_em_thread(funcao) -> None:
        if estado["ocupado"]:
            return
        ocupar(True)
        salvar_cfg()
        threading.Thread(target=funcao, daemon=True).start()

    # ---------------- ações principais ----------------
    def publicar_agora() -> None:
        projeto = projeto_atual()
        pasta_b = backups_atual()
        manter = manter_atual()
        erro = validar_projeto(projeto)
        if erro:
            messagebox.showerror(APP_NOME, f"Pasta do projeto inválida:\n{erro}")
            return

        def tarefa() -> None:
            try:
                res = publicar(projeto, pasta_b, manter, enfileirar_log)
            except Exception as e:
                res = {"ok": False, "erro": str(e)}
            fila.put(("fim", res))

        escrever("")
        escrever("=" * 62, "info")
        escrever("Publicação iniciada em " + datetime.now().strftime("%d/%m/%Y %H:%M:%S"), "cmd")
        var_status.set("Publicando… não feche esta janela.")
        rodar_em_thread(tarefa)

    def backup_agora() -> None:
        projeto = projeto_atual()
        pasta_b = backups_atual()
        manter = manter_atual()
        erro = validar_projeto(projeto)
        if erro:
            messagebox.showerror(APP_NOME, f"Pasta do projeto inválida:\n{erro}")
            return

        def tarefa() -> None:
            try:
                enfileirar_log("")
                enfileirar_log("Criando backup manual…", "info")
                bkp = criar_backup(projeto, pasta_b, "manual")
                enfileirar_log(
                    f"√ Backup criado: {bkp['caminho'].name} "
                    f"({formatar_tamanho(bkp['bytes'])}, {bkp['arquivos']} arquivos)",
                    "ok",
                )
                removidos = podar_backups(pasta_b, manter)
                if removidos:
                    enfileirar_log(
                        f"  Limpeza: {len(removidos)} backup(s) antigo(s) removido(s), "
                        f"mantendo os {max(MIN_BACKUPS, manter)} mais recentes.",
                        "aviso",
                    )
                fila.put(("fim", {"ok": True, "silencioso": True, "backup": str(bkp["caminho"])}))
            except Exception as e:
                enfileirar_log(f"× Backup falhou: {e}", "erro")
                fila.put(("fim", {"ok": False, "erro": f"backup falhou: {e}"}))

        var_status.set("Criando backup…")
        rodar_em_thread(tarefa)

    def restaurar_agora() -> None:
        pasta_b = backups_atual()
        pasta_b.mkdir(parents=True, exist_ok=True)
        escolhido = filedialog.askopenfilename(
            title="Escolha o backup para restaurar",
            initialdir=str(pasta_b),
            filetypes=[("Backups do Lunox", "lunox-*.zip"), ("Arquivos zip", "*.zip")],
        )
        if not escolhido:
            return
        zip_path = Path(escolhido)
        projeto = projeto_atual()
        erro = validar_projeto(projeto)
        if erro:
            messagebox.showerror(APP_NOME, f"Pasta do projeto inválida:\n{erro}")
            return

        if not messagebox.askyesno(
            APP_NOME,
            "Restaurar este backup?\n\n"
            f"{zip_path.name}\n\n"
            "Os arquivos do projeto com o mesmo nome serão substituídos.\n"
            "Um backup de segurança será criado antes.",
            icon="warning",
        ):
            return

        def tarefa() -> None:
            try:
                enfileirar_log("")
                enfileirar_log(f"Restaurando {zip_path.name}…", "info")
                seguranca = criar_backup(projeto, pasta_b, "antes-de-restaurar")
                enfileirar_log(
                    f"√ Backup de segurança: {seguranca['caminho'].name} "
                    f"({formatar_tamanho(seguranca['bytes'])})",
                    "ok",
                )
                total = extrair_backup(zip_path, projeto)
                enfileirar_log(f"√ {total} arquivo(s) restaurado(s) em {projeto}", "ok")
                enfileirar_log(
                    'Agora clique em "Publicar no site" para colocar essa versão no ar.',
                    "aviso",
                )
                fila.put(("fim", {"ok": True, "silencioso": True,
                                  "backup": str(seguranca["caminho"])}))
            except Exception as e:
                enfileirar_log(f"× Restauração falhou: {e}", "erro")
                fila.put(("fim", {"ok": False, "erro": f"restauração falhou: {e}"}))

        var_status.set("Restaurando backup…")
        rodar_em_thread(tarefa)

    def ao_fechar() -> None:
        if estado["ocupado"]:
            if not messagebox.askyesno(
                APP_NOME,
                "Há uma publicação em andamento. Fechar mesmo assim?",
                icon="warning",
            ):
                return
        salvar_cfg()
        raiz.destroy()

    raiz.protocol("WM_DELETE_WINDOW", ao_fechar)

    # ---------------- mensagem inicial ----------------
    npx = achar_npx()
    node = versao_node() if npx else ""
    escrever("Lunox Deploy", "cmd")
    escrever("Backup automático antes de cada publicação; no mínimo "
             f"{MIN_BACKUPS} backups guardados.", "info")
    escrever("", "")
    escrever(f"Node.js: {node or 'não encontrado'}", "ok" if node else "erro")
    escrever(f"npx: {npx or 'não encontrado'}", "ok" if npx else "erro")
    escrever(f"Projeto: {projeto_cfg}", "info")
    escrever(f"Backups: {backups_cfg}", "info")
    if not npx:
        escrever("", "")
        escrever("! Instale o Node.js para poder publicar: https://nodejs.org", "erro")
    if validar_projeto(projeto_cfg):
        escrever("", "")
        escrever(f"! {validar_projeto(projeto_cfg)}", "aviso")
        escrever('Use "Escolher…" para apontar para a pasta certa do Lunox.', "aviso")

    escrever("", "")
    escrever('Clique em "Publicar no site" quando quiser atualizar o site.', "info")

    raiz.after(80, drenar)
    raiz.mainloop()
    return 0


# --------------------------------------------------------------------------
# Linha de comando
# --------------------------------------------------------------------------

def saida(texto: str = "", arquivo_log: Path | None = None) -> None:
    if arquivo_log:
        try:
            with arquivo_log.open("a", encoding="utf-8") as f:
                f.write(texto + "\n")
        except Exception:
            pass
    try:
        if sys.stdout:
            print(texto)
    except Exception:
        pass


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Publica o Lunox no Cloudflare com backup.")
    parser.add_argument("--projeto", help="pasta do projeto (onde está wrangler.jsonc)")
    parser.add_argument("--backups", help="pasta onde guardar os zips")
    parser.add_argument("--manter", type=int, default=None, help=f"backups a manter (mínimo {MIN_BACKUPS})")
    parser.add_argument("--backup", action="store_true", help="só cria um backup")
    parser.add_argument("--deploy", action="store_true", help="cria backup e publica")
    parser.add_argument("--restaurar", metavar="ZIP", help="restaura um zip por cima do projeto")
    parser.add_argument("--listar", action="store_true", help="lista os backups existentes")
    parser.add_argument("--verificar", action="store_true", help="mostra o ambiente detectado")
    parser.add_argument("--log-arquivo", help="grava a saída também neste arquivo")
    args = parser.parse_args(argv)

    log_path = Path(args.log_arquivo).expanduser() if args.log_arquivo else None
    projeto = Path(args.projeto).expanduser() if args.projeto else projeto_padrao()
    pasta_b = Path(args.backups).expanduser() if args.backups else backups_padrao(projeto)
    manter = max(MIN_BACKUPS, args.manter if args.manter else manter_padrao())

    def log(texto: str, tag: str = "") -> None:
        saida(texto, log_path)

    if args.verificar:
        log(f"Projeto: {projeto}")
        log(f"Projeto válido: {'sim' if validar_projeto(projeto) is None else 'NÃO — ' + str(validar_projeto(projeto))}")
        log(f"Backups: {pasta_b}")
        log(f"Manter: {manter}")
        log(f"Node.js: {versao_node() or 'não encontrado'}")
        log(f"npx: {achar_npx() or 'não encontrado'}")
        log(f"Backups existentes: {len(listar_backups(pasta_b))}")
        return 0

    if args.listar:
        zips = listar_backups(pasta_b)
        if not zips:
            log("Nenhum backup encontrado em " + str(pasta_b))
            return 0
        for z in zips:
            log(f"{z.name}  ({formatar_tamanho(z.stat().st_size)})  "
                f"{datetime.fromtimestamp(z.stat().st_mtime).strftime('%d/%m/%Y %H:%M')}")
        return 0

    if args.restaurar:
        zip_path = Path(args.restaurar).expanduser()
        if not zip_path.is_file():
            log(f"× Backup não encontrado: {zip_path}")
            return 2
        try:
            seguranca = criar_backup(projeto, pasta_b, "antes-de-restaurar")
            log(f"√ Backup de segurança: {seguranca['caminho']}")
            total = extrair_backup(zip_path, projeto)
            log(f"√ {total} arquivo(s) restaurado(s) em {projeto}")
            return 0
        except Exception as e:
            log(f"× Restauração falhou: {e}")
            return 1

    if args.backup or args.deploy:
        if args.deploy:
            res = publicar(projeto, pasta_b, manter, log)
            return 0 if res.get("ok") else 1
        try:
            bkp = criar_backup(projeto, pasta_b, "manual")
            log(f"√ Backup criado: {bkp['caminho']} "
                f"({formatar_tamanho(bkp['bytes'])}, {bkp['arquivos']} arquivos)")
            podar_backups(pasta_b, manter)
            return 0
        except Exception as e:
            log(f"× Backup falhou: {e}")
            return 1

    return abrir_interface(
        projeto if args.projeto else None,
        pasta_b if args.backups else None,
        args.manter,
    )


if __name__ == "__main__":
    raise SystemExit(main())
