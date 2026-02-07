import argparse
import base64
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
from datetime import datetime

PROJECT_ID = "wwltjlnlutnuypmkwbuy"
TYPES_OUTPUT_PATH = "src/integrations/supabase/types.ts"
DEFAULT_TIMEOUT_NETWORK = 75
DEFAULT_TIMEOUT_GIT_PUSH = 180
LOCK_PATH = os.path.join("scripts", ".sync_full.lock")


class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def log(msg, type="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")

    if type == "INFO":
        icon = "ℹ️ "
        color = Colors.BLUE
    elif type == "SUCCESS":
        icon = "✅"
        color = Colors.GREEN
    elif type == "ERROR":
        icon = "❌"
        color = Colors.FAIL
    elif type == "WARN":
        icon = "⚠️ "
        color = Colors.WARNING
    elif type == "WAIT":
        icon = "⏳"
        color = Colors.CYAN
    else:
        icon = "•"
        color = Colors.ENDC

    print(f"{Colors.BOLD}[{timestamp}]{Colors.ENDC} {color}{icon} {msg}{Colors.ENDC}", flush=True)


def check_internet(host="8.8.8.8", port=53, timeout=3):
    try:
        socket.setdefaulttimeout(timeout)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((host, port))
        sock.close()
        return True
    except OSError:
        return False


def tool_exists(tool_name):
    return shutil.which(tool_name) is not None


def base_env():
    env = os.environ.copy()
    env.setdefault("CI", "1")
    env.setdefault("GIT_TERMINAL_PROMPT", "0")
    return env


def load_tokens():
    supabase_token = os.environ.get("SUPABASE_ACCESS_TOKEN")
    github_token = os.environ.get("GITHUB_TOKEN")

    if supabase_token and github_token:
        return supabase_token.strip(), github_token.strip()

    cre_path = os.path.join(os.getcwd(), "cre.txt")
    if not os.path.exists(cre_path):
        return supabase_token.strip() if supabase_token else None, github_token.strip() if github_token else None

    try:
        with open(cre_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read().splitlines()
    except Exception:
        return supabase_token.strip() if supabase_token else None, github_token.strip() if github_token else None

    if not supabase_token:
        for line in content:
            if line.strip().lower().startswith("token:"):
                value = line.split(":", 1)[1].strip()
                if value.startswith("sbp_"):
                    supabase_token = value
                    break

    if not github_token:
        for line in content:
            if "token classic" in line.lower() and ":" in line:
                value = line.split(":", 1)[1].strip()
                if value.startswith("ghp_"):
                    github_token = value
                    break

    return supabase_token.strip() if supabase_token else None, github_token.strip() if github_token else None


def git_push_with_token(timeout_seconds, token):
    creds = f"x-access-token:{token}".encode("utf-8")
    basic = base64.b64encode(creds).decode("utf-8")
    cmd = f'git -c http.https://github.com/.extraheader="AUTHORIZATION: basic {basic}" push'
    return run_command_non_interactive(cmd, "Git push autenticado (token)", timeout_seconds, env=base_env())


def _reader_thread(pipe, buffer, last_output_at):
    try:
        for line in iter(pipe.readline, ""):
            buffer.append(line)
            last_output_at[0] = time.time()
    finally:
        try:
            pipe.close()
        except Exception:
            pass


def run_command_non_interactive(command, description, timeout_seconds, env=None):
    log(description, "WAIT")
    env = env or base_env()

    proc = subprocess.Popen(
        command,
        shell=True,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )

    out_lines = []
    err_lines = []
    last_output_at = [time.time()]

    t_out = threading.Thread(target=_reader_thread, args=(proc.stdout, out_lines, last_output_at), daemon=True)
    t_err = threading.Thread(target=_reader_thread, args=(proc.stderr, err_lines, last_output_at), daemon=True)
    t_out.start()
    t_err.start()

    start = time.time()
    spinner = "|/-\\"
    spin_i = 0
    warned_silent = False

    while True:
        code = proc.poll()
        if code is not None:
            break

        elapsed = time.time() - start
        if elapsed > timeout_seconds:
            try:
                proc.kill()
            except Exception:
                pass
            log(f"Timeout ({timeout_seconds}s). Abortando: {description}", "ERROR")
            return 124, "".join(out_lines), "".join(err_lines) or "timeout"

        silent_for = time.time() - last_output_at[0]
        if silent_for > 8 and not warned_silent:
            log("Ainda executando… (sem saída recente)", "INFO")
            warned_silent = True

        if int(elapsed) % 2 == 0:
            sys.stdout.write(f"\r{Colors.CYAN}{spinner[spin_i % len(spinner)]} {description}…{Colors.ENDC}")
            sys.stdout.flush()
            spin_i += 1
        time.sleep(0.25)

    sys.stdout.write("\r" + " " * 80 + "\r")
    sys.stdout.flush()

    t_out.join(timeout=1)
    t_err.join(timeout=1)

    stdout = "".join(out_lines)
    stderr = "".join(err_lines)

    if proc.returncode == 0:
        log(f"OK: {description}", "SUCCESS")
    else:
        log(f"Falhou (code {proc.returncode}): {description}", "ERROR")
        if stderr.strip():
            log(stderr.strip()[:800], "WARN")
    return proc.returncode, stdout, stderr


def acquire_lock(force=False):
    os.makedirs(os.path.dirname(LOCK_PATH), exist_ok=True)

    if os.path.exists(LOCK_PATH) and not force:
        try:
            with open(LOCK_PATH, "r", encoding="utf-8") as f:
                payload = f.read().strip()
        except Exception:
            payload = "lock existente"
        log(f"Lock ativo. Se necessário, rode com --force. Detalhe: {payload}", "ERROR")
        return False

    try:
        with open(LOCK_PATH, "w", encoding="utf-8") as f:
            f.write(f"pid={os.getpid()} started_at={datetime.now().isoformat()}")
        return True
    except Exception as e:
        log(f"Não foi possível criar lock: {e}", "ERROR")
        return False


def release_lock():
    try:
        if os.path.exists(LOCK_PATH):
            os.remove(LOCK_PATH)
    except Exception:
        pass


def validate_environment():
    print(f"\n{Colors.HEADER}=== 1. VALIDAÇÃO (HEALTH CHECK) ==={Colors.ENDC}")
    ok = True

    if check_internet():
        log("Conexão com Internet: OK", "SUCCESS")
    else:
        log("Sem conexão com Internet.", "ERROR")
        ok = False

    for tool in ("git", "npm", "npx"):
        if tool_exists(tool):
            log(f"Ferramenta '{tool}': OK", "SUCCESS")
        else:
            log(f"Ferramenta '{tool}': NÃO ENCONTRADA", "ERROR")
            ok = False

    supabase_token, github_token = load_tokens()
    if supabase_token:
        log("Supabase token: OK", "SUCCESS")
    else:
        log("Supabase token: ausente (types pode falhar).", "WARN")

    if github_token:
        log("GitHub token: OK", "SUCCESS")
    else:
        log("GitHub token: ausente (push pode falhar).", "WARN")

    code, out, _err = run_command_non_interactive("git remote -v", "Verificando remote do Git", 10)
    if code == 0 and out.strip():
        log("Remote Git: OK", "SUCCESS")
    else:
        log("Remote Git ausente. Configure 'origin' antes de sincronizar.", "ERROR")
        ok = False

    return ok


def gen_supabase_types(timeout_seconds):
    print(f"\n{Colors.HEADER}=== 2. SUPABASE: GERAR TYPES ==={Colors.ENDC}")

    supabase_token, _github_token = load_tokens()
    env = base_env()
    if supabase_token:
        env["SUPABASE_ACCESS_TOKEN"] = supabase_token

    cmd_yes = f"npx --yes supabase gen types typescript --project-id {PROJECT_ID} --schema public"
    code, out, err = run_command_non_interactive(cmd_yes, "Gerando tipos TypeScript (Supabase)", timeout_seconds, env=env)

    if code != 0:
        cmd_fallback = f"npx supabase gen types typescript --project-id {PROJECT_ID} --schema public"
        code, out, err = run_command_non_interactive(cmd_fallback, "Gerando tipos TypeScript (fallback)", timeout_seconds, env=env)

    if code == 0 and out.strip():
        os.makedirs(os.path.dirname(TYPES_OUTPUT_PATH), exist_ok=True)
        with open(TYPES_OUTPUT_PATH, "w", encoding="utf-8") as f:
            f.write(out)
        log(f"Arquivo atualizado: {TYPES_OUTPUT_PATH}", "SUCCESS")
        return True

    log("Não foi possível gerar types automaticamente.", "WARN")
    if err.strip():
        log("Se for autenticação, rode: npx supabase login", "INFO")
    return False


def git_sync(timeout_push_seconds):
    print(f"\n{Colors.HEADER}=== 3. GIT: COMMIT & PUSH ==={Colors.ENDC}")

    _supabase_token, github_token = load_tokens()

    code, status, _ = run_command_non_interactive("git status --porcelain", "Verificando alterações", 15)
    if code != 0:
        return False

    if not status.strip():
        log("Workspace limpo. Nada para commitar.", "INFO")
        code, pending, _ = run_command_non_interactive("git cherry -v", "Verificando commits locais pendentes", 15)
        if code == 0 and pending.strip():
            run_command_non_interactive("git push", "Enviando commits pendentes", timeout_push_seconds, env=base_env())
        return True

    code, _out, _err = run_command_non_interactive("git add .", "Git add", 60)
    if code != 0:
        return False

    commit_msg = f"chore: ui+sync alignment {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    code, _out, err = run_command_non_interactive(f'git commit -m "{commit_msg}"', "Git commit", 30)
    if code != 0:
        if "nothing to commit" in err.lower() or "nothing to commit" in _out.lower():
            log("Sem mudanças para commitar.", "INFO")
        else:
            return False

    code, _out, err = run_command_non_interactive("git push", "Git push (dispara deploy Vercel)", timeout_push_seconds, env=base_env())
    if code != 0 and github_token:
        if "repository not found" in (err or "").lower() or "authentication" in (err or "").lower() or "403" in (err or "").lower():
            git_push_with_token(timeout_push_seconds, github_token)
    return True


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--check-only", action="store_true")
    p.add_argument("--skip-types", action="store_true")
    p.add_argument("--skip-git", action="store_true")
    p.add_argument("--timeout-network", type=int, default=DEFAULT_TIMEOUT_NETWORK)
    p.add_argument("--timeout-push", type=int, default=DEFAULT_TIMEOUT_GIT_PUSH)
    p.add_argument("--force", action="store_true")
    return p.parse_args()


def main():
    args = parse_args()

    print(f"{Colors.HEADER}{'='*64}{Colors.ENDC}")
    print(f"{Colors.HEADER}LocaCare Conecta — Sync Full (resiliente){Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*64}{Colors.ENDC}")

    if not acquire_lock(force=args.force):
        sys.exit(2)

    start = time.time()
    try:
        if not validate_environment():
            sys.exit(1)

        if args.check_only:
            log("Check concluído.", "SUCCESS")
            return

        if not args.skip_types:
            ok_types = gen_supabase_types(args.timeout_network)
            if not ok_types:
                log("Continuando mesmo sem types (modo resiliente).", "WARN")

        if not args.skip_git:
            git_sync(args.timeout_push)
    finally:
        release_lock()
        elapsed = time.time() - start
        log(f"Finalizado em {elapsed:.1f}s", "INFO")


if __name__ == "__main__":
    main()
