# Guia de Empacotamento da Aplicação

## Arquivos que devem ser incluídos

Ao empacotar a aplicação (usando PyInstaller, cx_Freeze, ou similar), certifique-se de incluir:

### Páginas HTML
- `Frontend/main.html`
- `Frontend/login.html`
- `Frontend/cadastro.html`
- `Frontend/recuperar_senha.html`

### Arquivos estáticos
- `Frontend/css/` (todos os arquivos CSS)
- `Frontend/js/` (todos os arquivos JavaScript)
- `Frontend/image/` (todas as imagens)

### Estrutura de diretórios
A estrutura de diretórios do Frontend deve ser mantida:
```
Frontend/
├── main.html
├── login.html
├── cadastro.html
├── recuperar_senha.html
├── css/
│   ├── auth.css
│   ├── global.css
│   └── ...
├── js/
│   ├── auth.js
│   ├── app.js
│   └── ...
└── image/
    ├── logo.png
    └── ManpowerGroup_logo.png
```

## Exemplo com PyInstaller

Se estiver usando PyInstaller, crie um arquivo `.spec` ou use os seguintes parâmetros:

```bash
pyinstaller --name="RFIDManpowerControl" \
  --add-data "Frontend;Frontend" \
  --hidden-import=flask \
  --hidden-import=psycopg2 \
  backend/app.py
```

Ou crie um arquivo `app.spec`:

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['backend/app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('Frontend', 'Frontend'),
    ],
    hiddenimports=[
        'flask',
        'psycopg2',
        'flask_cors',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='RFIDManpowerControl',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
```

## Verificação

Após empacotar, verifique se:
1. Todas as páginas HTML são acessíveis
2. Os arquivos CSS e JS são carregados corretamente
3. As imagens são exibidas
4. As rotas de autenticação funcionam

## Notas

- O código foi ajustado para detectar automaticamente se está rodando em modo empacotado ou desenvolvimento
- Os caminhos são calculados dinamicamente usando `sys._MEIPASS` quando empacotado
- Todas as rotas incluem tratamento de erros e verificações de existência de arquivos

