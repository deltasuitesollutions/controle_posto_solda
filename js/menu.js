// Menu.js - Funcionalidades do menu lateral

window.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    // Verificar se os elementos existem
    if (!sidebar) {
        console.error('Sidebar não encontrada! Verifique se o elemento #sidebar existe no HTML.');
        return;
    }
    
    // Criar overlay para mobile
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    
    // Função para atualizar overlay (apenas mobile)
    const updateOverlay = () => {
        if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('mobile-show')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    };
    
    // Função para atualizar o margin-left do conteúdo baseado no estado do sidebar
    function updateContentMargin() {
        const mainLayout = document.querySelector('.main-layout');
        const mainContent = document.querySelector('.main-content');
        
        if (!mainLayout || !mainContent || !sidebar) return;
        
        // Apenas no desktop
        if (window.innerWidth > 992) {
            const isMenuOpen = mainLayout.classList.contains('menu-open');
            const isCollapsed = sidebar.classList.contains('collapsed');
            
            if (isMenuOpen) {
                // Atualiza a classe no main-layout para sincronizar com CSS
                if (isCollapsed) {
                    mainLayout.classList.add('sidebar-collapsed');
                } else {
                    mainLayout.classList.remove('sidebar-collapsed');
                }
                // Ajusta o margin-left baseado no estado collapsed
                mainContent.style.marginLeft = isCollapsed ? '70px' : '260px';
            } else {
                mainLayout.classList.remove('sidebar-collapsed');
                mainContent.style.marginLeft = '0';
            }
        } else {
            // Mobile: sempre 0
            mainLayout.classList.remove('sidebar-collapsed');
            mainContent.style.marginLeft = '0';
        }
    }
    
    // Função para alternar o estado collapsed do sidebar
    function toggleSidebarCollapse() {
        if (!sidebar) return;
        
        const mainLayout = document.querySelector('.main-layout');
        
        // Apenas funciona no desktop quando o menu está aberto
        if (window.innerWidth > 992 && mainLayout && mainLayout.classList.contains('menu-open')) {
            sidebar.classList.toggle('collapsed');
            updateContentMargin();
        }
    }
    
    // Função para abrir/fechar menu
    function toggleMenu() {
        if (!sidebar) return;
        
        const mainLayout = document.querySelector('.main-layout');
        const isOpen = sidebar.classList.contains('mobile-show');
        
        if (isOpen) {
            // Fechar menu
            sidebar.classList.remove('mobile-show');
            if (mainLayout && window.innerWidth > 992) {
                // Apenas no desktop remove a classe menu-open
                mainLayout.classList.remove('menu-open');
            }
        } else {
            // Abrir menu
            sidebar.classList.add('mobile-show');
            if (mainLayout && window.innerWidth > 992) {
                // Apenas no desktop adiciona a classe menu-open
                mainLayout.classList.add('menu-open');
            }
        }
        
        updateContentMargin();
        updateOverlay();
    }
    
   
    function initializeMenuForScreenSize() {
        if (window.innerWidth > 992) {
            // DESKTOP: Menu sempre visível, botão hambúrguer escondido
            sidebar.classList.remove('mobile-show');
            sidebar.style.transform = '';
            sidebar.style.display = '';
            sidebar.style.visibility = '';
            sidebar.style.opacity = '';
            
            if (mobileMenuToggle) {
                mobileMenuToggle.style.display = 'none';
            }
        } else {
            // MOBILE: Menu escondido por padrão, botão hambúrguer visível
            sidebar.classList.remove('mobile-show');
            
            if (mobileMenuToggle) {
                mobileMenuToggle.style.display = 'flex';
            }
        }
    }
    
    // Menu começa fechado tanto no mobile quanto no desktop
    const mainLayout = document.querySelector('.main-layout');
    if (sidebar) {
        sidebar.classList.remove('mobile-show');
        sidebar.classList.remove('collapsed');
    }
    if (mainLayout) {
        mainLayout.classList.remove('menu-open');
    }
    
    // Inicializar na carga
    initializeMenuForScreenSize();
    updateContentMargin();
    updateOverlay();
    
    // Botão hambúrguer funciona igual no mobile e desktop
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }
    
    // Fechar menu ao clicar no overlay (mobile)
    overlay.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('mobile-show');
            updateOverlay();
        }
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        const mainLayout = document.querySelector('.main-layout');
        if (sidebar && 
            !sidebar.contains(e.target) && 
            mobileMenuToggle && 
            !mobileMenuToggle.contains(e.target)) {
            sidebar.classList.remove('mobile-show');
            if (mainLayout && window.innerWidth > 992) {
                mainLayout.classList.remove('menu-open');
            }
            updateContentMargin();
            updateOverlay();
        }
    });
    
    // Função para o botão sidebar-toggle (dentro do sidebar)
    function handleSidebarToggle() {
        const mainLayout = document.querySelector('.main-layout');
        
        // No desktop, quando menu está aberto, colapsa/expande
        if (window.innerWidth > 992 && mainLayout && mainLayout.classList.contains('menu-open')) {
            toggleSidebarCollapse();
        } else {
            // Caso contrário, fecha o menu
            toggleMenu();
        }
    }
    
    // Adicionar listener para o botão de colapsar sidebar (desktop)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSidebarToggle();
        });
    }
    
    // Gerenciar resize da janela
    window.addEventListener('resize', () => {
        updateOverlay();
        
        // Se mudou de mobile para desktop ou vice-versa, ajustar
        if (window.innerWidth > 992) {
            overlay.classList.remove('active');
            if (sidebar && sidebar.classList.contains('mobile-show') && mainLayout) {
                mainLayout.classList.add('menu-open');
            }
        } else {
            // Mobile: remover menu-open, usar overlay
            if (mainLayout) {
                mainLayout.classList.remove('menu-open');
            }
            updateOverlay();
        }
        
        initializeMenuForScreenSize();
        updateContentMargin();
    });
    
    
    window.toggleMenu = toggleMenu;
    window.toggleSidebar = handleSidebarToggle;
    window.toggleSidebarCollapse = toggleSidebarCollapse; 
});
