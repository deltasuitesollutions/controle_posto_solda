/**
 * Sistema de Leitura RFID
 * Processa automaticamente quando um código RFID é lido
 */

let rfidInputTimeout = null;
let isProcessingRFID = false;

/**
 * Inicializar o sistema de leitura RFID
 */
function initRFIDReader() {
    console.log('[RFID Reader] Inicializando leitor RFID...');
    
    // Verificar se o input já existe
    let rfidInput = document.getElementById('rfid-reader-input');
    
    if (!rfidInput) {
        // Se não existe, criar campo de input para RFID (fallback)
        rfidInput = document.createElement('input');
        rfidInput.type = 'text';
        rfidInput.id = 'rfid-reader-input';
        rfidInput.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 200px;
            height: 30px;
            opacity: 0.7;
            z-index: 10001;
            border: 2px solid #28a745;
            padding: 5px;
            font-size: 14px;
            background: white;
        `;
        rfidInput.autocomplete = 'off';
        rfidInput.placeholder = 'Passe o crachá RFID aqui';
        rfidInput.title = 'Leitor RFID - Passe o crachá aqui';
        
        document.body.appendChild(rfidInput);
        console.log('[RFID Reader] Input criado e adicionado ao DOM (fallback)');
    } else {
        console.log('[RFID Reader] Input encontrado no DOM');
    }
    
    // Verificar se um elemento é interativo (não deve ter foco forçado no RFID)
    function isInteractiveElement(element) {
        if (!element) return false;
        
        // Se é o próprio input RFID, não é considerado interativo para bloqueio
        if (element === rfidInput || element.id === 'rfid-reader-input') {
            return false;
        }
        
        const tagName = element.tagName.toLowerCase();
        const interactiveTags = ['select', 'input', 'textarea', 'button', 'a', 'option'];
        
        // Se é um elemento interativo
        if (interactiveTags.includes(tagName)) {
            return true;
        }
        
        // Verificar se está dentro de um elemento interativo ou dentro de um container de formulário
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            const parentTag = parent.tagName.toLowerCase();
            // Verificar tags interativas, classes específicas, ou se está dentro de um form
            if (interactiveTags.includes(parentTag) || 
                parent.classList.contains('simulator-select') ||
                parent.classList.contains('simulator-form-group') ||
                parentTag === 'form') {
                return true;
            }
            parent = parent.parentElement;
        }
        
        return false;
    }
    
    // Focar no input quando a página carregar e após eventos
    function focusInput() {
        // Verificar se algum elemento interativo está com foco
        const activeElement = document.activeElement;
        if (isInteractiveElement(activeElement)) {
            console.log('[RFID Reader] Elemento interativo com foco, não forçando foco no RFID');
            return false;
        }
        
        if (rfidInput && document.activeElement !== rfidInput) {
            rfidInput.focus();
            console.log('[RFID Reader] Input focado');
            return true;
        }
        return false;
    }
    
    // Focar imediatamente (apenas na inicialização)
    setTimeout(focusInput, 100);
    
    // Focar quando clicar em qualquer lugar da página (exceto elementos interativos)
    document.addEventListener('click', (e) => {
        // Se clicou no próprio input RFID, não fazer nada
        if (e.target === rfidInput || rfidInput.contains(e.target)) {
            return;
        }
        
        // Se clicou em um elemento interativo, aguardar um pouco antes de focar novamente
        if (isInteractiveElement(e.target)) {
            // Aguardar mais tempo para permitir interação com selects/dropdowns
            setTimeout(focusInput, 300);
            return;
        }
        
        // Se clicou em qualquer outro lugar, focar no RFID imediatamente
        setTimeout(focusInput, 50);
    });
    
    // Listener para capturar o código RFID
    rfidInput.addEventListener('input', handleRFIDInput);
    rfidInput.addEventListener('keydown', (e) => {
        console.log('[RFID Reader] Tecla pressionada:', e.key, 'Valor atual:', rfidInput.value);
        // Se pressionar Enter, processar imediatamente
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = rfidInput.value.trim();
            if (value.length >= 5) {
                console.log('[RFID Reader] Processando via Enter:', value);
                processRFIDCode(value);
                rfidInput.value = '';
            }
        }
    });
    
    // Listener para quando o input recebe foco
    rfidInput.addEventListener('focus', () => {
        console.log('[RFID Reader] Input recebeu foco');
    });
    
    // Listener para quando o input perde foco
    rfidInput.addEventListener('blur', (e) => {
        // Aguardar um pouco para que o novo elemento receba foco (especialmente para selects)
        setTimeout(() => {
            // Verificar se o elemento que recebeu foco é interativo
            const activeElement = document.activeElement;
            if (isInteractiveElement(activeElement)) {
                console.log('[RFID Reader] Input perdeu foco para elemento interativo, aguardando...');
                // Aguardar mais um pouco e tentar focar novamente
                setTimeout(() => {
                    if (!isInteractiveElement(document.activeElement)) {
                        console.log('[RFID Reader] Elemento interativo perdeu foco, restaurando foco no RFID');
                        rfidInput.focus();
                    }
                }, 500); // Aguardar 500ms após elemento interativo perder foco
                return;
            }
            
            console.log('[RFID Reader] Input perdeu foco - restaurando foco imediatamente...');
            rfidInput.focus();
        }, 100); // Reduzido para restaurar foco mais rapidamente
    });
    
    // Verificação periódica AGGRESSIVA para garantir que o campo RFID está sempre focado
    // quando não há elementos interativos ativos
    setInterval(() => {
        const activeElement = document.activeElement;
        
        // Se está em um elemento interativo, não fazer nada
        if (isInteractiveElement(activeElement)) {
            return;
        }
        
        // Se o campo RFID não está focado, focar nele
        if (rfidInput && document.activeElement !== rfidInput) {
            console.log('[RFID Reader] Campo RFID não está focado, focando automaticamente');
            rfidInput.focus();
        }
    }, 200); // Verificar a cada 200ms para ser mais responsivo
    
    // Não precisamos mais do listener global de teclado porque o campo sempre estará focado
    // A verificação periódica garante que o campo RFID está sempre focado
    
    // Adicionar indicador visual na página
    addRFIDIndicator();
    
    console.log('[RFID Reader] Leitor RFID inicializado com sucesso');
}


/**
 * Adiciona um indicador visual na página mostrando o status do leitor RFID
 */
function addRFIDIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'rfid-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-size: 14px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <i class="bi bi-rfid" style="font-size: 18px;"></i>
            <span></span>
        </div>
    `;
    document.body.appendChild(indicator);
}

/**
 * Manipula a entrada do código RFID
 * Detecta quando o código completo foi digitado (geralmente muito rápido)
 */
function handleRFIDInput(e) {
    const input = e.target;
    const value = input.value.trim();
    
    console.log('[RFID Reader] Input detectado - Valor:', value, 'Tamanho:', value.length);
    
    // Limpar timeout anterior
    if (rfidInputTimeout) {
        clearTimeout(rfidInputTimeout);
        console.log('[RFID Reader] Timeout anterior cancelado');
    }
    
    // Se o valor tiver mais de 5 caracteres, provavelmente é um código RFID completo
    // Aguardar um pouco para ver se mais caracteres chegam
    rfidInputTimeout = setTimeout(() => {
        const finalValue = input.value.trim();
        console.log('[RFID Reader] Timeout executado - Valor final:', finalValue, 'Tamanho:', finalValue.length);
        
        if (finalValue.length >= 5) {
            console.log('[RFID Reader] Código RFID válido detectado:', finalValue);
            // Registrar no log que um código foi detectado
            if (typeof log === 'function') {
                log(`Código RFID lido: ${finalValue}`);
            }
            processRFIDCode(finalValue);
            input.value = '';
        } else if (finalValue.length > 0) {
            console.log('[RFID Reader] Código RFID muito curto, ignorando:', finalValue);
            if (typeof log === 'function') {
                log(`Código RFID muito curto, ignorando: ${finalValue}`, 'error');
            }
            input.value = '';
        }
    }, 300); // Aguardar 300ms após a última digitação
}

/**
 * Processa o código RFID lido
 */
async function processRFIDCode(tagId) {
    console.log('[RFID Reader] processRFIDCode chamado com tagId:', tagId);
    
    if (!tagId || tagId.length < 5) {
        console.warn('[RFID Reader] Código RFID muito curto:', tagId);
        if (typeof log === 'function') {
            log(`Código RFID muito curto: ${tagId}`, 'error');
        }
        return;
    }
    
    if (isProcessingRFID) {
        console.warn('[RFID Reader] Já processando um código RFID... ignorando');
        if (typeof log === 'function') {
            log('Já processando um código RFID, ignorando...', 'error');
        }
        return;
    }
    
    console.log('[RFID Reader] Iniciando processamento do código RFID:', tagId);
    isProcessingRFID = true;
    updateRFIDIndicator('processando');
    
    // Registrar no log que o crachá foi detectado
    if (typeof log === 'function') {
        log(`🔍 Crachá RFID detectado: ${tagId} - Verificando e processando...`);
    }
    
    try {
        // Mostrar notificação
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(`Processando crachá RFID: ${tagId}...`, 'info');
        }
        
        const requestBody = {
            tag_id: tagId
        };
        
        console.log('[RFID Reader] Enviando requisição POST para /api/tags/processar');
        console.log('[RFID Reader] Body da requisição:', JSON.stringify(requestBody));
        
        // Chamar API para processar o RFID (o backend vai buscar o posto automaticamente)
        const response = await fetch('/api/tags/processar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('[RFID Reader] Resposta recebida - Status HTTP:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Resultado do processamento:', result);
        
        if (result.status === 'success') {
            // Sucesso!
            const tipo = result.tipo; // 'entrada' ou 'saida'
            const funcionario = result.funcionario;
            const posto = result.posto; // Posto usado no registro
            const message = result.message;
            const registroId = result.registro_id;
            
            console.log('Registro criado/atualizado:', {
                tipo: tipo,
                registro_id: registroId,
                posto: posto,
                funcionario: funcionario
            });
            
            updateRFIDIndicator('success');
            
            // Registrar no log com informações detalhadas
            if (typeof log === 'function') {
                const funcionarioNome = funcionario?.nome || 'Desconhecido';
                const funcionarioMatricula = funcionario?.matricula || tagId;
                
                // Mensagem principal de entrada/saída
                let logMessage = `✓ ${message}`;
                log(logMessage, 'success');
                
                // Detalhes completos em uma segunda linha
                let detalhes = `   → Funcionário: ${funcionarioNome} (${funcionarioMatricula})`;
                detalhes += ` | Posto: ${posto}`;
                
                if (tipo === 'entrada') {
                    if (result.data) {
                        detalhes += ` | Data: ${result.data}`;
                    }
                    if (result.hora_inicio) {
                        detalhes += ` | Hora: ${result.hora_inicio}`;
                    }
                    if (result.turno) {
                        detalhes += ` | Turno: ${result.turno}`;
                    }
                    if (result.produto) {
                        detalhes += ` | Produto: ${result.produto}`;
                    }
                } else if (tipo === 'saida') {
                    if (result.hora_fim) {
                        detalhes += ` | Hora fim: ${result.hora_fim}`;
                    }
                    if (result.duracao_minutos) {
                        const horas = Math.floor(result.duracao_minutos / 60);
                        const minutos = result.duracao_minutos % 60;
                        detalhes += ` | Duração: ${horas}h ${minutos}min`;
                    }
                }
                
                if (registroId) {
                    detalhes += ` | ID: ${registroId}`;
                }
                
                log(detalhes);
            }
            
            // Mostrar notificação de sucesso com informações detalhadas
            let messageCompleto = `${message} (Posto: ${posto}`;
            if (registroId) {
                messageCompleto += `, ID: ${registroId}`;
            }
            messageCompleto += ')';
            
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(messageCompleto, 'success');
            } else {
                alert(messageCompleto);
            }
            
            // Função para recarregar registros (se estiver na página de registros)
            const recarregarRegistros = () => {
                // Tentar usar instância existente
                if (window.registrosTableInstance && typeof window.registrosTableInstance.loadRegistros === 'function') {
                    window.registrosTableInstance.loadRegistros();
                    return true;
                }
                
                // Se não existe instância, tentar criar uma
                if (typeof RegistrosTable !== 'undefined') {
                    if (!window.registrosTableInstance) {
                        window.registrosTableInstance = new RegistrosTable();
                        return true;
                    }
                }
                
                return false;
            };
            
            // Tentar recarregar registros - múltiplas tentativas com delays progressivos
            // Primeira tentativa imediata (caso já esteja na página)
            if (!recarregarRegistros()) {
                // Segunda tentativa após navegação
                setTimeout(() => {
                    if (!recarregarRegistros()) {
                        // Terceira tentativa após mais tempo
                        setTimeout(() => {
                            if (!recarregarRegistros()) {
                                // Última tentativa - forçar criação se necessário
                                setTimeout(() => {
                                    if (typeof RegistrosTable !== 'undefined') {
                                        if (!window.registrosTableInstance) {
                                            window.registrosTableInstance = new RegistrosTable();
                                        } else {
                                            window.registrosTableInstance.loadRegistros();
                                        }
                                    }
                                }, 1000);
                            }
                        }, 500);
                    }
                }, 300);
            }
            
        } else {
            // Erro
            updateRFIDIndicator('error');
            
            // Registrar erro no log
            if (typeof log === 'function') {
                log(`ERRO ao processar RFID ${tagId}: ${result.message || 'Erro desconhecido'}`, 'error');
            }
            
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(result.message || 'Erro ao processar RFID', 'error');
            } else {
                alert(result.message || 'Erro ao processar RFID');
            }
        }
        
    } catch (error) {
        console.error('Erro ao processar RFID:', error);
        updateRFIDIndicator('error');
        
        // Registrar erro no log
        if (typeof log === 'function') {
            log(`ERRO de conexão ao processar RFID ${tagId}: ${error.message || error}`, 'error');
        }
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro de conexão ao processar RFID', 'error');
        } else {
            alert('Erro de conexão ao processar RFID');
        }
    } finally {
        isProcessingRFID = false;
        setTimeout(() => {
            updateRFIDIndicator('active');
            // Refocar no input apenas se não houver elemento interativo com foco
            const rfidInput = document.getElementById('rfid-reader-input');
            const activeElement = document.activeElement;
            if (rfidInput && activeElement) {
                // Verificar se elemento interativo está com foco
                const tagName = activeElement.tagName.toLowerCase();
                const interactiveTags = ['select', 'input', 'textarea', 'button', 'a', 'option'];
                const isInteractive = interactiveTags.includes(tagName) || 
                                     activeElement.classList.contains('simulator-select') ||
                                     (activeElement.closest && (activeElement.closest('.simulator-form-group') || activeElement.closest('form')));
                
                // Se não é interativo ou é o próprio input RFID, focar
                if (!isInteractive || activeElement === rfidInput || activeElement.id === 'rfid-reader-input') {
                    rfidInput.focus();
                }
            } else if (rfidInput) {
                // Se não há elemento ativo, focar no RFID
                rfidInput.focus();
            }
        }, 2000);
    }
}

/**
 * Atualiza o indicador visual do leitor RFID
 */
function updateRFIDIndicator(status) {
    const indicator = document.getElementById('rfid-indicator');
    if (!indicator) return;
    
    const icon = indicator.querySelector('i');
    const text = indicator.querySelector('span');
    
    switch (status) {
        case 'processando':
            indicator.style.background = '#ffc107';
            if (icon) icon.className = 'bi bi-hourglass-split';
            if (text) text.textContent = 'Processando...';
            break;
        case 'success':
            indicator.style.background = '#28a745';
            if (icon) icon.className = 'bi bi-check-circle-fill';
            if (text) text.textContent = 'Registrado com sucesso!';
            break;
        case 'error':
            indicator.style.background = '#dc3545';
            if (icon) icon.className = 'bi bi-x-circle-fill';
            if (text) text.textContent = 'Erro ao processar';
            break;
        case 'active':
        default:
            indicator.style.background = '#28a745';
            if (icon) icon.className = 'bi bi-rfid';
            if (text) text.textContent = '';
            break;
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRFIDReader);
} else {
    initRFIDReader();
}

// Exportar função globalmente para uso manual se necessário
window.processarRFID = processRFIDCode;

