import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const MenuLateral = () => {
    // Menu começa fechado no desktop, mas pode ser aberto
    const [menuAberto, setMenuAberto] = useState(false);
    const { isOperador, isAdmin, user } = useAuth();

    // Escuta evento de toggle do menu
    useEffect(() => {
        const handleMenuToggle = () => {
            setMenuAberto(prev => !prev);
        };

        window.addEventListener('menu-toggle', handleMenuToggle);
        return () => {
            window.removeEventListener('menu-toggle', handleMenuToggle);
        };
    }, []);

    // Adiciona/remove classe no body quando menu abre/fecha
    useEffect(() => {
        const isDesktop = window.innerWidth >= 768; // md breakpoint do Tailwind
        
        if (menuAberto) {
            document.body.classList.add('menu-open');
            // Só adiciona menu-desktop-open se estiver em desktop
            if (isDesktop) {
                document.body.classList.add('menu-desktop-open');
            }
        } else {
            document.body.classList.remove('menu-open');
            document.body.classList.remove('menu-desktop-open');
        }

        // Cleanup ao desmontar
        return () => {
            document.body.classList.remove('menu-open');
            document.body.classList.remove('menu-desktop-open');
        };
    }, [menuAberto]);

    const handleClose = () => {
        setMenuAberto(false);
    };

    // Menu items baseado no role
    const menuItems = [];
    
    // Dashboard - sempre visível
    menuItems.push({ to: '/', title: 'Dashboard', icon: 'bi-building', label: 'Dashboard' });
    
    // Se não há usuário logado, mostra apenas dashboard
    if (!user) {
        // Menu vazio além do dashboard
    } else if (isOperador) {
        // Rotas IHM apenas para operadores - apenas leitor (fluxo sequencial)
        menuItems.push(
            { to: '/ihm/leitor', title: 'Leitor IHM', icon: 'bi-person-badge', label: 'Leitor IHM' }
        );
    } else if (isAdmin) {
        // Rotas admin
        menuItems.push(
            { to: '/registros', title: 'Registros', icon: 'bi-clipboard-data', label: 'Registro de Produção' },
            { to: '/funcionarios', title: 'Funcionarios', icon: 'bi-people', label: 'Cadastrar Funcionário' },
            { to: '/modelos', title: 'Modelos', icon: 'bi-puzzle', label: 'Cadastro de Modelos' },
            { to: '/produtos', title: 'Produtos', icon: 'bi-building-gear', label: 'Cadastro de Produtos' },
            { to: '/linhas', title: 'Linhas', icon: 'bi-layers', label: 'Cadastro de Linhas' },
            { to: '/postos', title: 'Postos', icon: 'bi-pin-map-fill', label: 'Cadastro de Postos' },
            { to: '/operacoes', title: 'Operacoes', icon: 'bi-gear', label: 'Cadastro de Operações' }
        );
    }

    // Menu vertical para tablets e desktop (apenas ícones) - lateral esquerda
    const menuHorizontal = (
        <div 
            className={`hidden md:flex fixed top-0 left-0 z-100 h-screen flex-col items-center justify-start gap-4 pt-4 shadow-lg transition-all duration-300 overflow-hidden ${
                menuAberto ? 'w-64' : 'w-16'
            }`}
            style={{ backgroundColor: 'var(--bg-azul)' }}
        >
            {/* Botão de toggle no desktop */}
            <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="p-2 rounded-md transition-colors text-white flex items-center justify-center min-w-12 mb-2"
                title={menuAberto ? "Fechar menu" : "Abrir menu"}
                type="button"
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <i className={`bi ${menuAberto ? 'bi-chevron-left' : 'bi-chevron-right'} text-2xl`}></i>
            </button>

            <div className="flex flex-col gap-2 w-full px-2">
                {menuItems.map((item) => (
                    <Link 
                        key={item.to}
                        to={item.to} 
                        title={item.title}
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors text-white ${
                            menuAberto ? 'justify-start' : 'justify-center'
                        }`}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <i className={`bi ${item.icon} ${menuAberto ? 'text-2xl' : 'text-4xl'} flex-shrink-0`}></i>
                        {menuAberto && (
                            <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );

    // Menu lateral para mobile (completo)
    const menuLateral = (
        <>
            {/* Backdrop para mobile */}
            <div 
                className="fixed inset-0 z-55 md:hidden top-0"
                style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }}
                onClick={handleClose}
            ></div>
            
            {/* Menu */}
            <div className="fixed left-0 top-0 h-screen z-100 md:hidden">
                <div className="shadow-lg h-full w-64 flex flex-col transition-all duration-300 rounded-tr-lg rounded-br-lg overflow-hidden relative" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    {/* Botão de fechar */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-md transition-colors text-white flex items-center justify-center z-10"
                        title="Fechar menu"
                        type="button"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                    
                    <section className="flex-1 flex flex-col overflow-y-auto">
                        <nav className="flex flex-col h-full">
                            <ul className="flex-1 flex flex-col gap-2 p-4 pt-14">
                                {menuItems.map((item) => (
                                    <li key={item.to}>
                                        <Link 
                                            to={item.to} 
                                            title={item.title}
                                            className="flex items-center gap-3 p-3 rounded-md transition-colors text-white"
                                            onClick={handleClose}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <i className={`bi ${item.icon} text-xl`}></i>
                                            <p className="font-medium">{item.label}</p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </section>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Menu horizontal para tablets - sempre visível */}
            {menuHorizontal}
            
            {/* Menu lateral para mobile - apenas quando menuAberto */}
            {menuAberto && menuLateral}
        </>
    )
}

export default MenuLateral
