let registrosEmAndamento = {};

function log(mensagem, tipo = '') {
    const logDiv = document.getElementById('log');
    if (!logDiv) return;
    const timestamp = new Date().toLocaleTimeString();
    const className = tipo === 'error' ? 'error' : tipo === 'success' ? 'success' : '';
    logDiv.innerHTML += `<div class="${className}">[${timestamp}] ${mensagem}</div>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Chamada ao controller: GET /api/funcionarios
async function carregarFuncionariosSimulator() {
    // Não carregar se não estiver autenticado
    if (!window.usuarioAutenticado && window.location.pathname !== '/login.html' && window.location.pathname !== '/cadastro.html') {
        return;
    }
    
    try {
        const response = await fetch('/api/funcionarios');
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, será redirecionado pelo auth.js
                return;
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const funcionarios = await response.json();
        
        ['p1', 'p2', 'p3', 'p4'].forEach(posto => {
            // Carregar nos selects de configuração
            const configSelect = document.getElementById(`config-funcionario-${posto}`);
            if (configSelect) {
                configSelect.innerHTML = '<option value="">-- Selecione o operador --</option>';
                funcionarios.forEach(func => {
                    const option = document.createElement('option');
                    option.value = func.matricula;
                    option.textContent = `${func.nome} (${func.matricula})`;
                    configSelect.appendChild(option);
                });
            }
        });
    } catch (error) {
        // Não mostrar erro se for erro de rede durante redirecionamento
        if (error.message.includes('Failed to fetch') && !window.usuarioAutenticado) {
            return;
        }
        log(`Erro ao carregar funcionários: ${error}`, 'error');
        console.error('Erro ao carregar funcionários:', error);
    }
}

// Chamada ao controller: GET /api/modelos
async function carregarModelosParaPostos() {
    // Não carregar se não estiver autenticado
    if (!window.usuarioAutenticado && window.location.pathname !== '/login.html' && window.location.pathname !== '/cadastro.html') {
        return;
    }
    
    try {
        const response = await fetch('/api/modelos');
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, será redirecionado pelo auth.js
                return;
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const modelos = await response.json();
        
        ['p1', 'p2', 'p3', 'p4'].forEach(posto => {
            // Carregar nos selects de configuração
            const configSelect = document.getElementById(`config-modelo-${posto}`);
            if (configSelect) {
                configSelect.innerHTML = '<option value="">-- Selecione a peça --</option>';
                modelos.forEach(modelo => {
                    const option = document.createElement('option');
                    option.value = modelo.codigo;
                    option.textContent = `${modelo.codigo} - ${modelo.descricao}`;
                    configSelect.appendChild(option);
                });
            }
        });
    } catch (error) {
        // Não mostrar erro se for erro de rede durante redirecionamento
        if (error.message.includes('Failed to fetch') && !window.usuarioAutenticado) {
            return;
        }
        log(`Erro ao carregar modelos: ${error}`, 'error');
        console.error('Erro ao carregar modelos:', error);
    }
}

// Chamada ao controller: POST /api/producao/entrada
async function registrarEntrada(posto) {
    const postoLower = posto.toLowerCase();
    const funcionarioSelect = document.getElementById(`funcionario-${postoLower}`);
    
    if (!funcionarioSelect) {
        log(`Erro: Elementos do posto ${posto} não encontrados no HTML`, 'error');
        alert(`Erro: Elementos do posto ${posto} não encontrados. Verifique o HTML.`);
        return;
    }
    
    let funcionarioMatricula = funcionarioSelect.value;
    let modeloCodigo = null;
    
    // Buscar configuração do posto (peça já está configurada pelo líder)
    try {
        const configResponse = await fetch(`/api/posto-configuracao/${posto}`);
        const configData = await configResponse.json();
        
        if (configData.status === 'success' && configData.configuracao) {
            // Se não foi selecionado operador, usar da configuração
            if (!funcionarioMatricula && configData.configuracao.funcionario_matricula) {
                funcionarioMatricula = configData.configuracao.funcionario_matricula;
                funcionarioSelect.value = funcionarioMatricula;
                log(`Usando operador da configuração: ${funcionarioMatricula}`, 'success');
            }
            // Sempre usar a peça da configuração
            if (configData.configuracao.modelo_codigo) {
                modeloCodigo = configData.configuracao.modelo_codigo;
                log(`Usando peça da configuração: ${modeloCodigo}`, 'success');
            }
        }
    } catch (error) {
        log(`Aviso: Não foi possível carregar configuração do posto: ${error}`, 'error');
    }
    
    if (!funcionarioMatricula) {
        alert('Selecione o operador ou configure o posto previamente!');
        return;
    }
    
    if (!modeloCodigo) {
        alert('Configure a peça para este posto na seção "Configuração do Líder"!');
        return;
    }
    
    log(`Registrando entrada: ${funcionarioMatricula} no posto ${posto} para produzir ${modeloCodigo}`);
    
    try {
        const response = await fetch('/api/producao/entrada', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                posto: posto,
                funcionario_matricula: funcionarioMatricula,
                modelo_codigo: modeloCodigo
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            log(`Entrada registrada: ${result.message}`, 'success');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Entrada registrada com sucesso!', 'success');
            }
            const key = `${posto}-${funcionarioMatricula}`;
            registrosEmAndamento[key] = {
                registro_id: result.registro_id,
                posto: posto,
                funcionario_matricula: funcionarioMatricula,
                modelo_codigo: modeloCodigo,
                hora_inicio: result.hora_inicio
            };
            funcionarioSelect.value = '';
        } else {
            log(`Erro: ${result.message}`, 'error');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(result.message, 'error');
            } else {
                alert(result.message);
            }
        }
    } catch (error) {
        log(`Erro de conexão: ${error}`, 'error');
        alert('Erro ao registrar entrada. Verifique a conexão.');
    }
}

// Chamada ao controller: POST /api/producao/saida
async function registrarSaida(posto) {
    const postoLower = posto.toLowerCase();
    const funcionarioSelect = document.getElementById(`funcionario-${postoLower}`);
    
    if (!funcionarioSelect) {
        log(`Erro: Elementos do posto ${posto} não encontrados no HTML`, 'error');
        return;
    }
    
    const funcionarioMatricula = funcionarioSelect.value;
    
    if (!funcionarioMatricula) {
        alert('Selecione o operador para registrar a saída!');
        return;
    }
    
    const key = `${posto}-${funcionarioMatricula}`;
    let registro = registrosEmAndamento[key];
    
    if (!registro) {
        try {
            log(`Buscando registro em aberto na API...`);
            const response = await fetch('/api/registros?limit=100');
            const data = await response.json();
            const registros = data.registros || data || [];
            
            const emAndamento = registros.find(reg => 
                reg.posto === posto && 
                reg.funcionario.matricula === funcionarioMatricula &&
                !reg.hora_fim
            );
            
            if (emAndamento) {
                registro = {
                    registro_id: emAndamento.id,
                    posto: emAndamento.posto,
                    funcionario_matricula: funcionarioMatricula,
                    modelo_codigo: emAndamento.modelo.codigo,
                    hora_inicio: emAndamento.hora_inicio
                };
                registrosEmAndamento[key] = registro;
            }
        } catch (error) {
            log(`Erro ao buscar registro: ${error}`, 'error');
        }
    }
    
    if (!registro) {
        alert('Não há registro em aberto para este operador neste posto!\n\nCertifique-se de registrar a entrada primeiro.');
        return;
    }
    
    log(`Registrando saída: ${funcionarioMatricula} do posto ${posto}`);
    
    try {
        const response = await fetch('/api/producao/saida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                posto: posto,
                funcionario_matricula: funcionarioMatricula,
                registro_id: registro.registro_id
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            log(`Saída registrada: ${result.message}`, 'success');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Saída registrada com sucesso!', 'success');
            }
            delete registrosEmAndamento[key];
            funcionarioSelect.value = '';
        } else {
            log(`Erro: ${result.message}`, 'error');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(result.message, 'error');
            } else {
                alert(result.message);
            }
        }
    } catch (error) {
        log(`Erro de conexão: ${error}`, 'error');
        alert('Erro ao registrar saída. Verifique a conexão.');
    }
}

function limparLog() {
    const logDiv = document.getElementById('log');
    if (logDiv) logDiv.innerHTML = '';
}

// Chamada ao controller: DELETE /api/limpeza/registros
async function apagarTodosRegistros() {
    const confirmacao = confirm(
        'ATENÇÃO: Esta ação irá apagar TODOS os registros de produção do banco de dados!\n\n' +
        'Esta ação NÃO pode ser desfeita!\n\n' +
        'Tem certeza que deseja continuar?\n\n' +
        'OK = Apagar tudo\n' +
        'Cancelar = Cancelar'
    );
    
    if (!confirmacao) {
        log('Ação cancelada pelo usuário');
        return;
    }
    
    const confirmacao2 = confirm(
        'ÚLTIMA CONFIRMAÇÃO!\n\n' +
        'Você realmente deseja apagar TODOS os registros?\n\n' +
        'Esta ação é IRREVERSÍVEL!'
    );
    
    if (!confirmacao2) {
        log('Ação cancelada pelo usuário');
        return;
    }
    
    log('Apagando todos os registros...', 'error');
    
    try {
        const response = await fetch('/api/limpeza/registros', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            log(`Sucesso: ${result.message}`, 'success');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(result.message, 'success');
            } else {
                alert(result.message);
            }
            registrosEmAndamento = {};
        } else {
            log(`Erro: ${result.error}`, 'error');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Erro: ' + result.error, 'error');
            } else {
                alert('Erro: ' + result.error);
            }
        }
    } catch (error) {
        log(`Erro de conexão: ${error}`, 'error');
        alert('Erro ao apagar registros. Verifique a conexão.');
    }
}

// Carregar configurações dos postos
async function carregarConfiguracoesPostos() {
    // Não carregar se não estiver autenticado
    if (!window.usuarioAutenticado && window.location.pathname !== '/login.html' && window.location.pathname !== '/cadastro.html') {
        return;
    }
    
    try {
        const response = await fetch('/api/posto-configuracao/');
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, será redirecionado pelo auth.js
                return;
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success' && data.configuracoes) {
            data.configuracoes.forEach(config => {
                const postoLower = config.posto.toLowerCase();
                const funcionarioSelect = document.getElementById(`config-funcionario-${postoLower}`);
                const modeloSelect = document.getElementById(`config-modelo-${postoLower}`);
                const turnoSelect = document.getElementById(`config-turno-${postoLower}`);
                const configText = document.getElementById(`config-text-${postoLower}`);
                
                if (funcionarioSelect && config.funcionario_matricula) {
                    funcionarioSelect.value = config.funcionario_matricula;
                }
                if (modeloSelect && config.modelo_codigo) {
                    modeloSelect.value = config.modelo_codigo;
                }
                if (turnoSelect && config.turno) {
                    turnoSelect.value = config.turno.toString();
                }
                
                // Atualizar texto informativo no card do posto
                if (configText) {
                    if (config.modelo_codigo && config.modelo_descricao) {
                        configText.textContent = `Peça configurada: ${config.modelo_codigo} - ${config.modelo_descricao}`;
                        configText.parentElement.style.backgroundColor = '#e8f5e9';
                        configText.parentElement.style.color = '#2e7d32';
                    } else {
                        configText.textContent = 'Configure o posto na seção "Configuração do Líder"';
                        configText.parentElement.style.backgroundColor = '#f0f0f0';
                        configText.parentElement.style.color = '#666';
                    }
                }
            });
        }
        
    } catch (error) {
        log(`Erro ao carregar configurações: ${error}`, 'error');
        console.error('Erro ao carregar configurações:', error);
    }
}

// Salvar configuração de um posto
async function salvarConfiguracaoPosto(posto) {
    const postoLower = posto.toLowerCase();
    const funcionarioSelect = document.getElementById(`config-funcionario-${postoLower}`);
    const modeloSelect = document.getElementById(`config-modelo-${postoLower}`);
    const turnoSelect = document.getElementById(`config-turno-${postoLower}`);
    
    if (!funcionarioSelect || !modeloSelect || !turnoSelect) {
        alert('Elementos não encontrados!');
        return;
    }
    
    const funcionarioMatricula = funcionarioSelect.value || null;
    const modeloCodigo = modeloSelect.value || null;
    const turno = turnoSelect.value ? parseInt(turnoSelect.value) : null;
    
    if (!funcionarioMatricula || !modeloCodigo || !turno) {
        if (confirm('Deseja remover a configuração deste posto? (deixar vazio)')) {
            // Remover configuração
            try {
                const response = await fetch(`/api/posto-configuracao/${posto}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.status === 'success') {
                    log(`Configuração do ${posto} removida`, 'success');
                    funcionarioSelect.value = '';
                    modeloSelect.value = '';
                    turnoSelect.value = '';
                    if (typeof mostrarNotificacao === 'function') {
                        mostrarNotificacao('Configuração removida!', 'success');
                    }
                    // Atualizar texto informativo
                    const configText = document.getElementById(`config-text-${postoLower}`);
                    if (configText) {
                        configText.textContent = 'Configure o posto na seção "Configuração do Líder"';
                        configText.parentElement.style.backgroundColor = '#f0f0f0';
                        configText.parentElement.style.color = '#666';
                    }
                }
            } catch (error) {
                log(`Erro ao remover configuração: ${error}`, 'error');
            }
        }
        return;
    }
    
    try {
        const response = await fetch('/api/posto-configuracao/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                posto: posto,
                funcionario_matricula: funcionarioMatricula,
                modelo_codigo: modeloCodigo,
                turno: turno
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            log(`Configuração do ${posto} salva: ${funcionarioMatricula} -> ${modeloCodigo} (Turno ${turno})`, 'success');
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Configuração salva com sucesso!', 'success');
            } else {
                alert('Configuração salva com sucesso!');
            }
            // Recarregar configurações para atualizar os cards
            carregarConfiguracoesPostos();
        } else {
            log(`Erro: ${result.message}`, 'error');
            alert(result.message);
        }
    } catch (error) {
        log(`Erro de conexão: ${error}`, 'error');
        alert('Erro ao salvar configuração. Verifique a conexão.');
    }
}

// Aguardar autenticação antes de carregar dados
function inicializarSimulator() {
    // Verificar se estamos em página de login/cadastro - não inicializar
    if (window.location.pathname.includes('login') || window.location.pathname.includes('cadastro')) {
        return;
    }

    function carregarDados() {
        carregarFuncionariosSimulator();
        carregarModelosParaPostos();
        carregarConfiguracoesPostos();
        log('Sistema RFID iniciado!');
    }

    // Se já verificou e está autenticado, carregar imediatamente
    if (window.authVerificado && window.usuarioAutenticado) {
        carregarDados();
    } else {
        // Aguardar verificação de autenticação
        const verificarAuth = setInterval(() => {
            if (window.authVerificado) {
                clearInterval(verificarAuth);
                if (window.usuarioAutenticado) {
                    carregarDados();
                }
                // Se não autenticado, auth.js já redirecionou
            }
        }, 50);

        // Timeout de segurança (se após 2 segundos não verificou, assumir que não está autenticado)
        setTimeout(() => {
            clearInterval(verificarAuth);
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    inicializarSimulator();
});

window.log = log;
window.registrarEntrada = registrarEntrada;
window.registrarSaida = registrarSaida;
window.limparLog = limparLog;
window.apagarTodosRegistros = apagarTodosRegistros;
window.salvarConfiguracaoPosto = salvarConfiguracaoPosto;
window.carregarFuncionariosSimulator = carregarFuncionariosSimulator;
window.carregarModelosParaPostos = carregarModelosParaPostos;
window.carregarConfiguracoesPostos = carregarConfiguracoesPostos;
