/**
 * Script para gerenciar autenticação (login e cadastro)
 */

const API_BASE_URL = '/api/auth';

/**
 * Função para mostrar mensagens de erro
 */
function mostrarErro(elementId, mensagem) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = mensagem;
        errorElement.style.display = 'block';
    }
}

/**
 * Função para ocultar mensagens de erro
 */
function ocultarErro(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Função para mostrar mensagem de sucesso
 */
function mostrarSucesso(elementId, mensagem) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = mensagem;
        successElement.style.display = 'block';
    }
}

/**
 * Função para ocultar mensagem de sucesso
 */
function ocultarSucesso(elementId) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.style.display = 'none';
    }
}

/**
 * Carregar informações do usuário atual
 */
async function carregarUsuarioAtual() {
    // Evitar múltiplos redirecionamentos
    if (window.redirecionandoParaLogin) {
        return null;
    }

    try {
        const response = await fetch('/api/auth/usuario', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.data) {
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = data.data.nome || data.data.username;
                }
                // Armazenar role do usuário globalmente
                window.usuarioRole = data.data.role || 'admin';
                return data.data;
            }
        } else if (response.status === 401) {
            // Usuário não autenticado, redirecionar para login
            window.redirecionandoParaLogin = true;
            window.location.href = '/login.html';
            return null;
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        // Para erros de rede, assumir que não está autenticado e redirecionar
        if (!window.redirecionandoParaLogin && 
            (window.location.pathname !== '/login.html' && 
             window.location.pathname !== '/cadastro.html' && 
             window.location.pathname !== '/recuperar_senha.html')) {
            window.redirecionandoParaLogin = true;
            window.location.href = '/login.html';
        }
    }
    return null;
}

// Variável global para indicar se o usuário está autenticado
window.usuarioAutenticado = false;
window.authVerificado = false;

/**
 * Inicializar funcionalidades de autenticação na página principal
 * Esta função deve ser executada ANTES de qualquer outra inicialização
 */
async function inicializarAuth() {
    try {
        // Verificar se estamos na página de login/cadastro/recuperação - não precisa verificar autenticação
        if (window.location.pathname === '/login.html' || 
            window.location.pathname === '/cadastro.html' || 
            window.location.pathname === '/recuperar_senha.html') {
            window.authVerificado = true;
            return;
        }

        // Para a página principal, verificar autenticação ANTES de qualquer coisa
        const usuario = await carregarUsuarioAtual();
        
        if (usuario) {
            window.usuarioAutenticado = true;
            // Garantir que o role está definido
            window.usuarioRole = usuario.role || 'admin';
            
            // Configurar botão de logout
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (confirm('Tem certeza que deseja sair?')) {
                        try {
                            await fazerLogout();
                        } catch (error) {
                            console.error('Erro ao fazer logout:', error);
                            window.location.href = '/login.html';
                        }
                    }
                });
            }
            
            // Marcar como verificado e disparar evento
            window.authVerificado = true;
            document.dispatchEvent(new CustomEvent('usuarioAutenticado'));
        } else {
            // Não autenticado - redirecionamento já foi feito no carregarUsuarioAtual
            window.usuarioAutenticado = false;
            window.authVerificado = true; // Marcar como verificado mesmo sem autenticação (para evitar loop)
            return; // Não continuar - já redirecionou
        }
    } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        window.usuarioAutenticado = false;
        window.authVerificado = true;
        // Em caso de erro, redirecionar para login como medida de segurança
        if (window.location.pathname !== '/login.html' && 
            window.location.pathname !== '/cadastro.html' && 
            window.location.pathname !== '/recuperar_senha.html') {
            window.location.href = '/login.html';
        }
    }
}

// Executar IMEDIATAMENTE quando o script carregar (antes de DOMContentLoaded)
// Isso garante que a verificação aconteça antes de qualquer outra coisa
// Mas se o documento ainda não estiver pronto, aguardar um pouco
if (document.readyState === 'loading') {
    // Se ainda está carregando, executar assim que o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', inicializarAuth, { once: true });
} else {
    // Se já está pronto, executar imediatamente
    inicializarAuth();
}

/**
 * Função para fazer login
 */
async function fazerLogin(username, senha) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Importante para cookies/sessão
            body: JSON.stringify({
                username: username,
                senha: senha
            })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            // Redirecionar para a página principal
            window.location.href = '/';
        } else {
            throw new Error(data.error || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
}

/**
 * Função para fazer cadastro
 */
async function fazerCadastro(nome, username, email, senha) {
    try {
        const response = await fetch(`${API_BASE_URL}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                nome: nome,
                username: username,
                email: email,
                senha: senha
            })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            return data;
        } else {
            throw new Error(data.error || 'Erro ao fazer cadastro');
        }
    } catch (error) {
        console.error('Erro ao fazer cadastro:', error);
        throw error;
    }
}

/**
 * Função para fazer logout
 */
async function fazerLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            window.location.href = '/login.html';
        } else {
            throw new Error(data.error || 'Erro ao fazer logout');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
    }
}

/**
 * Verificar se há formulário de login na página
 */
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        ocultarErro('login-error');
        
        const username = document.getElementById('username').value.trim();
        const senha = document.getElementById('senha').value;
        
        if (!username || !senha) {
            mostrarErro('login-error', 'Por favor, preencha todos os campos');
            return;
        }
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Entrando...';
        
        try {
            await fazerLogin(username, senha);
        } catch (error) {
            mostrarErro('login-error', error.message || 'Erro ao fazer login. Verifique suas credenciais.');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Entrar';
        }
    });
}

/**
 * Verificar se há formulário de cadastro na página
 */
if (document.getElementById('cadastro-form')) {
    const cadastroForm = document.getElementById('cadastro-form');
    
    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        ocultarErro('cadastro-error');
        ocultarSucesso('cadastro-success');
        
        const nome = document.getElementById('nome').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const senhaConfirm = document.getElementById('senha-confirm').value;
        
        // Validações
        if (!nome || !username || !email || !senha || !senhaConfirm) {
            mostrarErro('cadastro-error', 'Por favor, preencha todos os campos');
            return;
        }
        
        if (senha.length < 6) {
            mostrarErro('cadastro-error', 'A senha deve ter no mínimo 6 caracteres');
            return;
        }
        
        if (senha !== senhaConfirm) {
            mostrarErro('cadastro-error', 'As senhas não coincidem');
            return;
        }
        
        const submitButton = cadastroForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Cadastrando...';
        
        try {
            await fazerCadastro(nome, username, email, senha);
            mostrarSucesso('cadastro-success', 'Cadastro realizado com sucesso! Redirecionando para login...');
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } catch (error) {
            mostrarErro('cadastro-error', error.message || 'Erro ao fazer cadastro. Tente novamente.');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-person-plus-fill"></i> Cadastrar';
        }
    });
}

/**
 * Função para redefinir senha
 */
async function redefinirSenha(username, novaSenha) {
    try {
        const response = await fetch(`${API_BASE_URL}/redefinir-senha`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                nova_senha: novaSenha
            })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            return data;
        } else {
            throw new Error(data.error || 'Erro ao redefinir senha');
        }
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        throw error;
    }
}

/**
 * Verificar se há formulário de recuperação de senha na página
 */
if (document.getElementById('recuperar-senha-form')) {
    const recuperarSenhaForm = document.getElementById('recuperar-senha-form');
    
    recuperarSenhaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        ocultarErro('recuperar-senha-error');
        ocultarSucesso('recuperar-senha-success');
        
        const username = document.getElementById('username').value.trim();
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;
        
        // Validações
        if (!username || !novaSenha || !confirmarSenha) {
            mostrarErro('recuperar-senha-error', 'Por favor, preencha todos os campos');
            return;
        }
        
        if (novaSenha.length < 6) {
            mostrarErro('recuperar-senha-error', 'A senha deve ter no mínimo 6 caracteres');
            return;
        }
        
        if (novaSenha !== confirmarSenha) {
            mostrarErro('recuperar-senha-error', 'As senhas não coincidem');
            return;
        }
        
        const submitButton = recuperarSenhaForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Redefinindo...';
        
        try {
            await redefinirSenha(username, novaSenha);
            mostrarSucesso('recuperar-senha-success', 'Senha redefinida com sucesso! Redirecionando para login...');
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } catch (error) {
            mostrarErro('recuperar-senha-error', error.message || 'Erro ao redefinir senha. Verifique se o usuário existe.');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-key-fill"></i> Redefinir Senha';
        }
    });
}


