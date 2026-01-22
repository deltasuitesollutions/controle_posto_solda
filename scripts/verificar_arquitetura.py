
#!/usr/bin/env python3
"""
Script de verificação da arquitetura API-First

Este script verifica se o frontend não está acessando o banco de dados diretamente
e se todas as comunicações passam pela API.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# Diretórios a verificar
FRONTEND_DIR = Path(__file__).parent.parent / 'Web' / 'src'
BACKEND_DIR = Path(__file__).parent.parent / 'Server'

# Padrões proibidos no frontend
# Formato: (padrão_regex, descrição, flags_regex)
PROIBIDOS_FRONTEND = [
    (r'import.*from.*[\'"]Server', 'Importação do backend no frontend', 0),
    (r'import.*from.*[\'"]database', 'Importação de database no frontend', 0),
    (r'import.*from.*[\'"]\.\.\/\.\.\/Server', 'Importação relativa do backend', 0),
    (r'psycopg2', 'Biblioteca de banco de dados PostgreSQL', 0),
    (r'sqlalchemy', 'ORM SQLAlchemy', 0),
    (r'DatabaseConnection', 'Classe de conexão com banco', 0),
    (r'execute_query', 'Execução direta de queries', 0),
    (r'get_connection', 'Obtenção de conexão com banco', 0),
    (r'\.db\s*=', 'Atribuição de banco de dados', 0),
    (r'SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM', 'Queries SQL diretas', re.IGNORECASE),
]

# Padrões que devem existir no frontend
OBRIGATORIOS_FRONTEND = [
    (r'fetchAPI', 'Uso da função fetchAPI para comunicação com API'),
    (r'from.*api.*api', 'Importação do arquivo api.ts'),
]

# Padrões proibidos nos controllers
PROIBIDOS_CONTROLLERS = [
    (r'DatabaseConnection\.execute_query', 'Acesso direto ao banco no controller', 0),
    (r'DatabaseConnection\.get_connection', 'Conexão direta no controller', 0),
]

# Padrões proibidos nos services
PROIBIDOS_SERVICES = [
    (r'DatabaseConnection\.execute_query', 'Acesso direto ao banco no service', 0),
    (r'DatabaseConnection\.get_connection', 'Conexão direta no service', 0),
]


def verificar_arquivos(diretorio: Path, extensoes: List[str], padroes: List[Tuple], 
                       descricao: str) -> List[Tuple[str, str, int, str]]:
    """
    Verifica arquivos em um diretório contra padrões proibidos
    
    Returns:
        Lista de (arquivo, linha, numero_linha, descricao_erro)
    """
    erros = []
    
    if not diretorio.exists():
        return erros
    
    for ext in extensoes:
        for arquivo in diretorio.rglob(f'*.{ext}'):
            # Ignorar node_modules e outros diretórios
            if 'node_modules' in str(arquivo) or '__pycache__' in str(arquivo):
                continue
            
            try:
                with open(arquivo, 'r', encoding='utf-8') as f:
                    linhas = f.readlines()
                    
                for num_linha, linha in enumerate(linhas, 1):
                    # Ignorar comentários e strings (documentação)
                    linha_limpa = linha.strip()
                    if linha_limpa.startswith('//') or linha_limpa.startswith('*') or linha_limpa.startswith('#'):
                        continue
                    # Ignorar se estiver dentro de comentários de bloco
                    if '/*' in linha or '*/' in linha:
                        continue
                    
                    for item in padroes:
                        if len(item) == 3:
                            padrao, desc, flag = item
                        elif len(item) == 2:
                            padrao, desc = item
                            flag = 0
                        else:
                            continue
                        if re.search(padrao, linha, flag):
                            erros.append((str(arquivo.relative_to(diretorio.parent.parent)), 
                                         linha.strip(), num_linha, desc))
            except Exception as e:
                print(f"⚠️  Erro ao ler {arquivo}: {e}")
    
    return erros


def verificar_obrigatorios(diretorio: Path, extensoes: List[str], padroes: List[Tuple[str, str]]) -> List[str]:
    """
    Verifica se padrões obrigatórios existem nos arquivos
    """
    arquivos_sem_padrao = []
    
    if not diretorio.exists():
        return arquivos_sem_padrao
    
    for ext in extensoes:
        for arquivo in diretorio.rglob(f'*.{ext}'):
            if 'node_modules' in str(arquivo) or '__pycache__' in str(arquivo):
                continue
            
            # Ignorar arquivos de configuração
            if arquivo.name in ['api.ts', 'vite.config.ts', 'tsconfig.json']:
                continue
            
            try:
                with open(arquivo, 'r', encoding='utf-8') as f:
                    conteudo = f.read()
                
                # Verificar se é um arquivo que faz chamadas à API
                if 'API' in conteudo or 'fetch' in conteudo or 'axios' in conteudo:
                    tem_padrao = False
                    for padrao, desc in padroes:
                        if re.search(padrao, conteudo):
                            tem_padrao = True
                            break
                    
                    if not tem_padrao:
                        arquivos_sem_padrao.append(str(arquivo.relative_to(diretorio.parent.parent)))
            except Exception as e:
                print(f"⚠️  Erro ao ler {arquivo}: {e}")
    
    return arquivos_sem_padrao


def verificar_package_json():
    """Verifica se o package.json do frontend não tem dependências de banco"""
    package_json = FRONTEND_DIR.parent / 'package.json'
    erros = []
    
    if not package_json.exists():
        return erros
    
    dependencias_proibidas = ['psycopg2', 'sqlalchemy', 'pg', 'postgres', 'mysql', 'sqlite3']
    
    try:
        with open(package_json, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        for dep in dependencias_proibidas:
            if dep in conteudo.lower():
                erros.append(f"Dependência proibida encontrada: {dep}")
    except Exception as e:
        print(f"⚠️  Erro ao ler package.json: {e}")
    
    return erros


def main():
    print("=" * 70)
    print("🔍 VERIFICAÇÃO DE ARQUITETURA API-FIRST")
    print("=" * 70)
    print()
    
    erros_total = 0
    avisos_total = 0
    
    # 1. Verificar frontend
    print("📱 Verificando Frontend (Web/src/)...")
    erros_frontend = verificar_arquivos(
        FRONTEND_DIR, 
        ['ts', 'tsx', 'js', 'jsx'],
        PROIBIDOS_FRONTEND,
        'Frontend'
    )
    
    if erros_frontend:
        print(f"  ❌ {len(erros_frontend)} erro(s) encontrado(s):")
        for arquivo, linha, num, desc in erros_frontend:
            print(f"     • {arquivo}:{num} - {desc}")
            print(f"       {linha[:80]}")
        erros_total += len(erros_frontend)
    else:
        print("  ✅ Nenhum acesso direto ao banco encontrado no frontend")
    
    # 2. Verificar package.json
    print("\n📦 Verificando package.json do frontend...")
    erros_package = verificar_package_json()
    if erros_package:
        print(f"  ❌ {len(erros_package)} erro(s) encontrado(s):")
        for erro in erros_package:
            print(f"     • {erro}")
        erros_total += len(erros_package)
    else:
        print("  ✅ Nenhuma dependência de banco encontrada")
    
    # 3. Verificar controllers
    print("\n🎮 Verificando Controllers (Server/controller/)...")
    erros_controllers = verificar_arquivos(
        BACKEND_DIR / 'controller',
        ['py'],
        PROIBIDOS_CONTROLLERS,
        'Controller'
    )
    
    if erros_controllers:
        print(f"  ⚠️  {len(erros_controllers)} aviso(s) encontrado(s):")
        for arquivo, linha, num, desc in erros_controllers:
            print(f"     • {arquivo}:{num} - {desc}")
            print(f"       {linha[:80]}")
        avisos_total += len(erros_controllers)
    else:
        print("  ✅ Controllers não acessam banco diretamente")
    
    # 4. Verificar services
    print("\n⚙️  Verificando Services (Server/services/)...")
    erros_services = verificar_arquivos(
        BACKEND_DIR / 'services',
        ['py'],
        PROIBIDOS_SERVICES,
        'Service'
    )
    
    if erros_services:
        print(f"  ⚠️  {len(erros_services)} aviso(s) encontrado(s):")
        for arquivo, linha, num, desc in erros_services:
            print(f"     • {arquivo}:{num} - {desc}")
            print(f"       {linha[:80]}")
        avisos_total += len(erros_services)
    else:
        print("  ✅ Services não acessam banco diretamente (usam models)")
    
    # 5. Verificar uso de API no frontend
    print("\n🔌 Verificando uso de API no frontend...")
    arquivos_sem_api = verificar_obrigatorios(
        FRONTEND_DIR,
        ['ts', 'tsx'],
        OBRIGATORIOS_FRONTEND
    )
    
    if arquivos_sem_api:
        print(f"  ⚠️  {len(arquivos_sem_api)} arquivo(s) podem não estar usando a API:")
        for arquivo in arquivos_sem_api[:10]:  # Limitar a 10
            print(f"     • {arquivo}")
        if len(arquivos_sem_api) > 10:
            print(f"     ... e mais {len(arquivos_sem_api) - 10} arquivo(s)")
        avisos_total += len(arquivos_sem_api)
    else:
        print("  ✅ Arquivos estão usando a API corretamente")
    
    # Resumo
    print("\n" + "=" * 70)
    print("📊 RESUMO")
    print("=" * 70)
    print(f"  ❌ Erros críticos: {erros_total}")
    print(f"  ⚠️  Avisos: {avisos_total}")
    
    if erros_total == 0 and avisos_total == 0:
        print("\n  ✅ Arquitetura API-First está correta!")
        return 0
    elif erros_total == 0:
        print("\n  ⚠️  Arquitetura está correta, mas há avisos a revisar")
        return 0
    else:
        print("\n  ❌ Arquitetura violada! Corrija os erros acima.")
        return 1


if __name__ == '__main__':
    exit(main())

