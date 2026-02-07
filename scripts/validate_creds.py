import os
import sys
import requests
import re
from datetime import datetime

# ==========================================
# CONFIGURAÇÕES
# ==========================================
CRE_FILE = "cre.txt"
ENV_FILE = ".env"
SUPABASE_CONFIG = "supabase/config.toml"

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, type="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    color = {
        "INFO": Colors.BLUE,
        "SUCCESS": Colors.GREEN,
        "ERROR": Colors.FAIL,
        "WARN": Colors.WARNING,
        "HEADER": Colors.HEADER
    }.get(type, Colors.ENDC)
    
    icon = {
        "INFO": "ℹ️ ",
        "SUCCESS": "✅",
        "ERROR": "❌",
        "WARN": "⚠️ ",
        "HEADER": "🔍"
    }.get(type, "•")

    print(f"{Colors.BOLD}[{timestamp}]{Colors.ENDC} {color}{icon} {msg}{Colors.ENDC}")

def parse_cre_file():
    """Lê cre.txt e extrai credenciais."""
    creds = {}
    if not os.path.exists(CRE_FILE):
        log(f"Arquivo {CRE_FILE} não encontrado!", "ERROR")
        return creds

    with open(CRE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex patterns
    creds['sb_project_id'] = re.search(r'Project ID:\s*(\w+)', content)
    creds['sb_url'] = re.search(r'URL:\s*(https://[\w\.-]+)', content)
    creds['sb_anon'] = re.search(r'Anon Key.*?\n(ey\w[\w\.-]+)', content, re.MULTILINE)
    creds['sb_service'] = re.search(r'Service Role.*?\n(ey\w[\w\.-]+)', content, re.MULTILINE)
    creds['sb_token'] = re.search(r'Access Token.*?\n(sbp_\w+)', content, re.MULTILINE)
    creds['gh_token'] = re.search(r'\[GITHUB\].*?Token:\s*(ghp_\w+)', content, re.DOTALL)
    
    # Extract values
    for k, v in creds.items():
        if v:
            creds[k] = v.group(1).strip()
        else:
            creds[k] = None
            
    return creds

def validate_supabase(url, anon_key):
    """Testa conexão com Supabase."""
    if not url or not anon_key:
        return False, "Credenciais ausentes"
        
    try:
        # Tenta acessar um endpoint público ou health check
        resp = requests.get(f"{url}/rest/v1/", headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        }, timeout=5)
        
        # 200 OK ou 404 (rota raiz não existe mas conectou) são sinais de vida
        # Geralmente a raiz retorna JSON documentando endpoints
        if resp.status_code in [200, 404]: 
            return True, "Conexão OK"
        return False, f"Status Code: {resp.status_code}"
    except Exception as e:
        return False, str(e)

def validate_github(token):
    """Testa token do GitHub."""
    if not token:
        return False, "Token ausente"
        
    try:
        resp = requests.get("https://api.github.com/user", headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }, timeout=5)
        
        if resp.status_code == 200:
            user = resp.json().get('login', 'Unknown')
            return True, f"Logado como: {user}"
        return False, f"Status Code: {resp.status_code}"
    except Exception as e:
        return False, str(e)

def check_env_file(expected_creds):
    """Verifica se .env está alinhado."""
    if not os.path.exists(ENV_FILE):
        return False, "Arquivo .env ausente"
        
    with open(ENV_FILE, "r") as f:
        env_content = f.read()
        
    issues = []
    if expected_creds['sb_url'] and expected_creds['sb_url'] not in env_content:
        issues.append("VITE_SUPABASE_URL incorreto")
    if expected_creds['sb_anon'] and expected_creds['sb_anon'] not in env_content:
        issues.append("VITE_SUPABASE_PUBLISHABLE_KEY incorreto")
        
    if not issues:
        return True, "Alinhado com cre.txt"
    return False, ", ".join(issues)

def main():
    print(f"\n{Colors.HEADER}{'='*60}")
    print("   🛡️  VALIDADOR DE CREDENCIAIS — LOCACARE")
    print(f"{'='*60}{Colors.ENDC}")

    # 1. Parse Credentials
    log("Lendo cre.txt...", "INFO")
    creds = parse_cre_file()
    
    if not creds.get('sb_project_id'):
        log("Não foi possível ler as credenciais básicas do cre.txt", "ERROR")
        return

    log(f"Project ID detectado: {creds['sb_project_id']}", "INFO")

    # 2. Validate Supabase
    print(f"\n{Colors.HEADER}--- SUPABASE ---{Colors.ENDC}")
    ok_sb, msg_sb = validate_supabase(creds['sb_url'], creds['sb_anon'])
    if ok_sb:
        log(f"Conexão REST: {msg_sb}", "SUCCESS")
    else:
        log(f"Falha na conexão: {msg_sb}", "ERROR")

    # 3. Validate GitHub
    print(f"\n{Colors.HEADER}--- GITHUB ---{Colors.ENDC}")
    ok_gh, msg_gh = validate_github(creds['gh_token'])
    if ok_gh:
        log(f"Token GitHub: {msg_gh}", "SUCCESS")
    else:
        log(f"Falha no token GitHub: {msg_gh}", "ERROR")

    # 4. Check Environment Alignment
    print(f"\n{Colors.HEADER}--- AMBIENTE (.env) ---{Colors.ENDC}")
    ok_env, msg_env = check_env_file(creds)
    if ok_env:
        log(msg_env, "SUCCESS")
    else:
        log(msg_env, "WARN")
        
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")

if __name__ == "__main__":
    main()
