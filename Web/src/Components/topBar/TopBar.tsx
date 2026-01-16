import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TopBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const getPageName = () => {
        const routeMap: { [key: string]: string } = {
            '/': 'Dashboard',
            '/leitor': 'Leitor',
            '/funcionarios': 'Funcionários',
            '/modelos': 'Modelos',
            '/registros': 'Registros',
            '/ihm/leitor': 'Leitor IHM',
            '/ihm/operacao': 'Operação IHM',
            '/produtos': 'Produtos',
            '/linhas': 'Linhas',
            '/postos': 'Postos',
            '/operacoes': 'Operações'
        };
        return routeMap[location.pathname] || 'Dashboard';
    };

    const handleToggleMenu = () => {
        // Dispara evento customizado para o MenuLateral escutar
        window.dispatchEvent(new CustomEvent('menu-toggle'));
    };

    return (
        <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-6 overflow-visible menu-topbar transition-all duration-300">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleToggleMenu}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center md:hidden"
                        title="Abrir menu"
                        type="button"
                    >
                        <i className="bi bi-list text-2xl text-gray-700"></i>
                    </button>
                    <h1 className="text-black font-medium text-xl flex shrink-0">{getPageName()}</h1>
                </div>
        
                <div className="flex items-center gap-3 shrink-0">
                    {user && (
                        <span className="text-black font-medium text-sm" id="user-name">
                            {user.nome} ({user.role})
                        </span>
                    )}
                    {user && (
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap min-h-9 cursor-pointer hover:opacity-90"
                            style={{ 
                                backgroundColor:'var(--bg-laranja)',
                                display: 'flex',
                                visibility: 'visible',
                                opacity: 1
                            }}
                            id="logout-button"
                            title="Sair"
                            type="button"
                        >
                            <i className="bi bi-power text-base" style={{ display: 'inline-block' }}></i>
                            <span style={{ display: 'inline-block' }}>Sair</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}

export default TopBar