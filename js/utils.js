// Utilitários e funções auxiliares

/**
 * Exibe mensagem de loading em um elemento
 */
function mostrarLoading(elementId, mensagem = 'Carregando...') {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>${mensagem}</p></div>`;
    }
}

/**
 * Exibe mensagem de erro em um elemento
 */
function mostrarErro(elementId, mensagem) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">${mensagem}</p>
            </div>
        `;
    }
}

/**
 * Formata data no padrão brasileiro
 */
function formatarData(dataStr) {
    if (!dataStr) return '-';
    try {
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR');
    } catch {
        return dataStr;
    }
}

/**
 * Formata hora
 */
function formatarHora(horaStr) {
    if (!horaStr) return '-';
    return horaStr;
}

/**
 * Calcula duração entre duas horas (em minutos)
 */
function calcularDuracao(horaInicio, horaFim) {
    if (!horaInicio || !horaFim) return 0;
    
    try {
        const [h1, m1] = horaInicio.split(':').map(Number);
        const [h2, m2] = horaFim.split(':').map(Number);
        
        const minutosInicio = h1 * 60 + m1;
        const minutosFim = h2 * 60 + m2;
        
        let duracao = minutosFim - minutosInicio;
        if (duracao < 0) {
            duracao += 24 * 60; // Passou meia-noite
        }
        
        return duracao;
    } catch {
        return 0;
    }
}

/**
 * Formata duração em minutos para "Xh Ymin"
 */
function formatarDuracao(minutos) {
    if (!minutos || minutos === 0) return '-';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0 && mins > 0) {
        return `${horas}h ${mins}min`;
    } else if (horas > 0) {
        return `${horas}h`;
    } else {
        return `${mins}min`;
    }
}

/**
 * Debounce para funções
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Valida se uma data é válida
 */
function validarData(dataStr) {
    if (!dataStr) return false;
    const data = new Date(dataStr);
    return !isNaN(data.getTime());
}

/**
 * Sanitiza HTML para prevenir XSS
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Exibe notificação toast
 */
function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `toast-notification toast-${tipo}`;
    notificacao.textContent = mensagem;
    
    // Adicionar ao body
    document.body.appendChild(notificacao);
    
    // Animar entrada
    setTimeout(() => {
        notificacao.classList.add('show');
    }, 10);
    
    // Remover após duração
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 300);
    }, duracao);
}

/**
 * Trata erros de resposta da API
 */
async function tratarRespostaAPI(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
        throw new Error(error.message || error.error || `Erro HTTP: ${response.status}`);
    }
    return response.json();
}

// Expor funções globalmente
window.mostrarLoading = mostrarLoading;
window.mostrarErro = mostrarErro;
window.formatarData = formatarData;
window.formatarHora = formatarHora;
window.calcularDuracao = calcularDuracao;
window.formatarDuracao = formatarDuracao;
window.debounce = debounce;
window.validarData = validarData;
window.sanitizeHTML = sanitizeHTML;
window.mostrarNotificacao = mostrarNotificacao;
window.tratarRespostaAPI = tratarRespostaAPI;

