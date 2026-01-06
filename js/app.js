// Chamada ao controller: GET /api/exportar/excel
async function exportarPlanilha() {
    try {
        const filtros = {
            data_inicio: document.getElementById('filter-data')?.value || '',
            data_fim: document.getElementById('filter-data')?.value || '',
            posto: document.getElementById('filter-posto')?.value || '',
            turno: document.getElementById('filter-turno')?.value || ''
        };
        
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        
        const response = await fetch(`/api/exportar/excel?${params.toString()}`);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erro ao exportar Excel' }));
            throw new Error(error.error || 'Erro ao exportar Excel');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        const now = new Date();
        const dataFormatada = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
        const horaFormatada = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        let filename = `registros_producao_${dataFormatada}_${horaFormatada}.xlsx`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch) {
                let extracted = filenameMatch[1];
                extracted = extracted.replace(/^["']|["']$/g, '');
                extracted = extracted.replace(/_\.xlsx$/, '.xlsx');
                if (!extracted.endsWith('.xlsx')) {
                    extracted = extracted.replace(/\.(csv|xls)_?$/, '.xlsx');
                }
                filename = extracted || filename;
            }
        }
        
        if (!filename.endsWith('.xlsx')) {
            filename = filename.replace(/\.(csv|xls)_?$/, '') + '.xlsx';
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Planilha Excel exportada com sucesso!', 'success');
        } else {
            alert('Planilha Excel exportada com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro ao exportar Excel: ' + error.message, 'error');
        } else {
            alert('Erro ao exportar Excel: ' + error.message);
        }
    }
}

window.exportarPlanilha = exportarPlanilha;

function inicializarRouter() {
    // Verificar se estamos em página de login/cadastro - não inicializar router
    if (window.location.pathname.includes('login') || window.location.pathname.includes('cadastro')) {
        return;
    }

    function criarRouter() {
        // Aguardar um pouco para garantir que o role foi carregado
        if (!window.usuarioRole) {
            // Se o role ainda não foi carregado, aguardar um pouco mais
            setTimeout(() => {
                if (window.usuarioRole || window.usuarioAutenticado) {
                    const router = new AppRouter();
                    window.router = router;
                }
            }, 100);
        } else {
            const router = new AppRouter();
            window.router = router;
        }
    }

    // Se já verificou e está autenticado, criar imediatamente
    if (window.authVerificado && window.usuarioAutenticado) {
        criarRouter();
    } else {
        // Aguardar verificação de autenticação
        const verificarAuth = setInterval(() => {
            if (window.authVerificado) {
                clearInterval(verificarAuth);
                if (window.usuarioAutenticado) {
                    criarRouter();
                }
                // Se não autenticado, auth.js já redirecionou
            }
        }, 50);

        // Timeout de segurança
        setTimeout(() => {
            clearInterval(verificarAuth);
        }, 2000);
    }
}

window.addEventListener('DOMContentLoaded', inicializarRouter);

