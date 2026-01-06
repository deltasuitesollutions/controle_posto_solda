// Sistema de Roteamento SPA
class AppRouter {
    constructor() {
        this.currentPage = 'registros';
        this.pages = {
            'postos-lider': {
                title: 'Postos de Liderança',
                container: 'page-postos-lider',
                load: () => this.loadPostosLiderPage()
            },
            'leitor-rfid': {
                title: 'Leitor RFID',
                container: 'page-leitor-rfid',
                load: () => this.loadLeitorRFIDPage()
            },
            'simulator': {
                title: 'Simulador RFID',
                container: 'page-simulator',
                load: () => this.loadSimulator()
            },
            'registros': {
                title: 'Registros de Produção',
                container: 'page-registros',
                load: () => this.loadRegistrosPage()
            },
            'tags': {
                title: 'Cadastro de Tags RFID',
                container: 'page-tags',
                load: () => this.loadTagsPage()
            },
            'funcionarios': {
                title: 'Cadastro de Funcionários',
                container: 'page-funcionarios',
                load: () => this.loadFuncionariosPage()
            },
            'modelos': {
                title: 'Cadastro de Modelos',
                container: 'page-modelos',
                load: () => this.loadModelosPage()
            }
        };
        
        this.init();
    }
    
    init() {
        // Verificar role do usuário e configurar acesso
        this.configurarAcessoPorRole();
        
        // Navegação por hash
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
        
        // Menu lateral
        this.setupMenu();
        
        // Atualizar hora
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);
    }
    
    configurarAcessoPorRole() {
        // Verificar role do usuário
        const role = window.usuarioRole || 'admin';
        
        if (role === 'operador') {
            // Esconder itens do menu que não são permitidos para operadores
            const menuItemsToHide = [
                'postos-lider',
                'registros',
                'funcionarios',
                'modelos',
                'tags'
            ];
            
            menuItemsToHide.forEach(pageName => {
                const menuItem = document.querySelector(`[data-page="${pageName}"]`);
                if (menuItem) {
                    menuItem.style.display = 'none';
                }
            });
            
            // Esconder páginas que não são permitidas
            const pagesToHide = [
                'page-postos-lider',
                'page-registros',
                'page-funcionarios',
                'page-modelos',
                'page-tags',
                'page-simulator'
            ];
            
            pagesToHide.forEach(pageId => {
                const page = document.getElementById(pageId);
                if (page) {
                    page.style.display = 'none';
                }
            });
            
            // Redirecionar automaticamente para o leitor RFID se não estiver lá
            const currentHash = window.location.hash.slice(1);
            if (currentHash !== 'leitor-rfid' && currentHash !== '') {
                window.location.hash = 'leitor-rfid';
            }
        }
    }
    
    handleRoute() {
        const hash = window.location.hash.slice(1);
        const role = window.usuarioRole || 'admin';
        
        // Se for operador, só permitir acesso ao leitor RFID
        if (role === 'operador') {
            if (hash !== 'leitor-rfid' && hash !== '') {
                window.location.hash = 'leitor-rfid';
                return;
            }
            // Se não tem hash ou está vazio, redirecionar para leitor-rfid
            if (!hash || hash === '') {
                window.location.hash = 'leitor-rfid';
                return;
            }
        }
        
        // Para outros usuários, usar página padrão
        const defaultPage = role === 'operador' ? 'leitor-rfid' : 'registros';
        const pageHash = hash || defaultPage;
        const page = this.pages[pageHash];
        
        if (page) {
            // Verificar se operador está tentando acessar página não permitida
            if (role === 'operador' && pageHash !== 'leitor-rfid') {
                window.location.hash = 'leitor-rfid';
                return;
            }
            this.navigateTo(pageHash);
        } else {
            this.navigateTo(defaultPage);
        }
    }
    
    navigateTo(pageName) {
        // Esconder todas as páginas
        document.querySelectorAll('.page-container').forEach(page => {
            page.classList.remove('active');
        });
        
        // Atualizar menu ativo
        document.querySelectorAll('.sidebar-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const menuItem = document.querySelector(`[data-page="${pageName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
        
        // Mostrar página atual
        const page = this.pages[pageName];
        if (page) {
            this.currentPage = pageName;
            document.getElementById('page-title').textContent = page.title;
            
            const container = document.getElementById(page.container);
            container.classList.add('active');
            
            // Carregar conteúdo se necessário
            if (page.load) {
                page.load();
            }
        }
    }
    
    setupMenu() {
        document.querySelectorAll('.sidebar-menu-item a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = e.currentTarget.closest('.sidebar-menu-item').dataset.page;
                window.location.hash = pageName;
            });
        });
    }
    
    async loadPage(url, containerId) {
        const container = document.getElementById(containerId);
        
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extrair apenas o conteúdo principal (sem sidebar e topbar duplicados)
            let mainContent = doc.querySelector('.content-area');
            
            // Se não encontrar .content-area, tenta .main-content
            if (!mainContent) {
                mainContent = doc.querySelector('.main-content');
                if (mainContent) {
                    // Remove sidebar e topbar se existirem
                    const sidebar = mainContent.querySelector('.sidebar');
                    const topbar = mainContent.querySelector('.topbar');
                    if (sidebar) sidebar.remove();
                    if (topbar) topbar.remove();
                }
            }
            
            // Se ainda não encontrou, tenta pegar conteúdo dentro de .main-layout
            if (!mainContent) {
                const mainLayout = doc.querySelector('.main-layout');
                if (mainLayout) {
                    mainContent = mainLayout.querySelector('.main-content');
                    if (mainContent) {
                        const sidebar = mainContent.querySelector('.sidebar');
                        const topbar = mainContent.querySelector('.topbar');
                        if (sidebar) sidebar.remove();
                        if (topbar) topbar.remove();
                    }
                }
            }
            
            // Se ainda não encontrou, pega o body inteiro mas remove scripts e head
            if (!mainContent) {
                mainContent = doc.body;
                // Remove scripts, head, etc
                mainContent.querySelectorAll('script, style, link').forEach(el => el.remove());
            }
            
            // Limpar container e adicionar novo conteúdo
            container.innerHTML = '';
            
            // Copiar elementos relevantes
            if (mainContent) {
                // Clonar e adicionar todos os filhos
                Array.from(mainContent.children).forEach(child => {
                    container.appendChild(child.cloneNode(true));
                });
            }
            
            // Reinicializar scripts se necessário
            this.reinitializeScripts(containerId);
            
        } catch (error) {
            console.error('Erro ao carregar página:', error);
            container.innerHTML = `<div style="padding: 20px; background: white; border-radius: 8px;"><h2>Erro ao carregar página</h2><p>${error.message}</p></div>`;
        }
    }
    
    loadPageContent(pageName) {
        const container = document.getElementById(`page-${pageName}`);
        if (!container) return;
        
        const titles = {
            'funcionarios': 'Funcionários',
            'postos': 'Postos',
            'configuracoes': 'Configurações'
        };
        
        container.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 8px;">
                <h2>${titles[pageName] || pageName}</h2>
                <p>Esta página está em desenvolvimento.</p>
            </div>
        `;
    }
    
    loadPostosLiderPage() {
        // A página de postos de liderança já está no HTML
        const container = document.getElementById('page-postos-lider');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Carregar dados se as funções estiverem disponíveis
        if (typeof carregarFuncionariosSimulator === 'function') {
            carregarFuncionariosSimulator();
        }
        if (typeof carregarModelosParaPostos === 'function') {
            carregarModelosParaPostos();
        }
        if (typeof carregarConfiguracoesPostos === 'function') {
            carregarConfiguracoesPostos();
        }
    }
    
    loadLeitorRFIDPage() {
        // A página de leitor RFID já está no HTML
        const container = document.getElementById('page-leitor-rfid');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Garantir que o leitor RFID está inicializado
        if (typeof initRFIDReader === 'function') {
            // O leitor já deve estar inicializado, mas vamos garantir que o input existe
            const rfidInput = document.getElementById('rfid-reader-input');
            if (rfidInput) {
                // Focar no input quando a página for carregada
                setTimeout(() => {
                    rfidInput.focus();
                }, 100);
            }
        }
    }
    
    loadSimulator() {
        // O simulador já está no HTML, apenas garantir que está visível
        const container = document.getElementById('page-simulator');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Carregar dados do simulador se as funções estiverem disponíveis
        if (typeof carregarFuncionariosSimulator === 'function') {
            carregarFuncionariosSimulator();
        }
        if (typeof carregarModelosParaPostos === 'function') {
            carregarModelosParaPostos();
        }
        if (typeof carregarConfiguracoesPostos === 'function') {
            carregarConfiguracoesPostos();
        }
    }
    
    loadRegistrosPage() {
        // A página de registros já está no HTML
        const container = document.getElementById('page-registros');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Inicializar tabela de registros
        setTimeout(() => {
            // Verificar se a classe RegistrosTable está disponível
            if (typeof RegistrosTable !== 'undefined') {
                if (!window.registrosTableInstance) {
                    window.registrosTableInstance = new RegistrosTable();
                } else {
                    window.registrosTableInstance.loadRegistros();
                }
            } else {
                // Se não estiver disponível, tentar carregar novamente
                console.log('RegistrosTable não encontrado, tentando novamente...');
                setTimeout(() => {
                    if (typeof RegistrosTable !== 'undefined') {
                        if (!window.registrosTableInstance) {
                            window.registrosTableInstance = new RegistrosTable();
                        } else {
                            window.registrosTableInstance.loadRegistros();
                        }
                    }
                }, 500);
            }
        }, 100);
    }
    
    loadTagsPage() {
        // A página de tags já está no HTML
        const container = document.getElementById('page-tags');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Carregar dados se as funções estiverem disponíveis
        if (typeof carregarTags === 'function') {
            carregarTags();
        }
        if (typeof carregarFuncionariosParaTags === 'function') {
            carregarFuncionariosParaTags();
        }
    }
    
    loadFuncionariosPage() {
        // A página de funcionários já está no HTML
        const container = document.getElementById('page-funcionarios');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Carregar dados se a função estiver disponível
        if (typeof carregarFuncionarios === 'function') {
            carregarFuncionarios();
        }
    }
    
    loadModelosPage() {
        // A página de modelos já está no HTML
        const container = document.getElementById('page-modelos');
        if (!container.classList.contains('active')) {
            container.classList.add('active');
        }
        
        // Carregar dados se a função estiver disponível
        if (typeof carregarModelos === 'function') {
            carregarModelos();
        }
    }
    
    
    reinitializeScripts(containerId) {
        // Reinicializar scripts específicos da página
        if (containerId === 'page-registros') {
            // Recarregar scripts de registros se necessário
            if (typeof filtersManager !== 'undefined') {
                // Reconfigurar filtros
            }
        }
    }
    
    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        document.getElementById('current-time').textContent = `${timeStr} - ${dateStr}`;
    }
}

// Expor classe globalmente
window.AppRouter = AppRouter;

