import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const MenuLateral = () => {
    const [menuAberto, setMenuAberto] = useState(false);

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
        if (menuAberto) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }

        // Cleanup ao desmontar
        return () => {
            document.body.classList.remove('menu-open');
        };
    }, [menuAberto]);

    const handleClose = () => {
        setMenuAberto(false);
    };
    // Menu vertical para tablets e desktop (apenas ícones) - lateral esquerda
    const menuHorizontal = (
        <div className="hidden md:flex fixed top-0 left-0 z-100 w-16 h-screen flex-col items-center justify-start gap-4 pt-4 shadow-lg" style={{ backgroundColor: 'var(--bg-azul)' }}>
            <Link 
                to="/" 
                title="Dashboard"
                className="flex items-center justify-center p-2 rounded-md transition-colors text-white min-w-12"
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <i className="bi bi-building text-4xl"></i>
            </Link>
            <Link 
                to="/leitor" 
                title="Leitor"
                className="flex items-center justify-center p-2 rounded-md transition-colors text-white min-w-12"
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <i className="bi bi-person-badge text-4xl"></i>
            </Link>
            <Link 
                to="/registros" 
                title="Registros"
                className="flex items-center justify-center p-2 rounded-md transition-colors text-white min-w-12"
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <i className="bi bi-clipboard-data text-4xl"></i>
            </Link>
            <Link 
                to="/funcionarios" 
                title="Funcionarios"
                className="flex items-center justify-center p-2 rounded-md transition-colors text-white min-w-12"
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <i className="bi bi-people text-4xl"></i>
            </Link>
            <Link 
                to="/modelos" 
                title="Modelos"
                className="flex items-center justify-center p-2 rounded-md transition-colors text-white min-w-12"
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <i className="bi bi-puzzle text-4xl"></i>
            </Link>
        </div>
    );

    // Menu lateral para mobile (completo)
    const menuLateral = (
        <>
            {/* Backdrop para mobile */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-55 md:hidden top-0"
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
                                <li>
                                    <Link 
                                        to="/" 
                                        title="Dashboard"
                                        className="flex items-center gap-3 p-3 rounded-md transition-colors text-white"
                                        onClick={handleClose}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <i className="bi bi-building text-xl"></i>
                                        <p className="font-medium">Dashboard</p>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/leitor" 
                                        title="Leitor"
                                        className="flex items-center gap-3 p-3 rounded-md transition-colors text-white"
                                        onClick={handleClose}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <i className="bi bi-person-badge text-xl"></i>
                                        <p className="font-medium">Leitor Rfid</p>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/registros" 
                                        title="Registros"
                                        className="flex items-center gap-3 p-3 rounded-md transition-colors text-white"
                                        onClick={handleClose}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <i className="bi bi-clipboard-data text-xl"></i>
                                        <p className="font-medium">Registro de Produção</p>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/funcionarios" 
                                        title="Funcionarios"
                                        className="flex items-center gap-3 p-3 rounded-md transition-colors text-white"
                                        onClick={handleClose}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <i className="bi bi-people text-xl"></i>
                                        <p className="font-medium">Cadastrar Funcionário</p>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/modelos" 
                                        title="Modelos"
                                        className="flex items-center gap-3 p-3 rounded-md transition-colors text-white"
                                        onClick={handleClose}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <i className="bi bi-puzzle text-xl"></i>
                                        <p className="font-medium">Cadastro de Modelos</p>
                                    </Link>
                                </li>
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
