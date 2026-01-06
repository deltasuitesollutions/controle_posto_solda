interface TopBarProps {
    menuAberto: boolean;
    onToggleMenu: () => void;
}

const TopBar = ({ menuAberto, onToggleMenu }: TopBarProps) => {
    return (
        <header className={`bg-white shadow-md fixed top-0 left-0 right-0 ${menuAberto ? 'z-40' : 'z-50'} h-20 flex items-center px-6 md:pl-20 overflow-visible`}>
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleMenu}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center md:hidden"
                        title="Abrir menu"
                        type="button"
                    >
                        <i className="bi bi-list text-2xl text-gray-700"></i>
                    </button>
                    <h1 className="text-black font-medium text-xl flex shrink-0">Controle Operacional</h1>
                </div>
        
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-black font-medium text-sm" id="user-name"></span>
                    <button
                        className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap min-h-9 cursor-pointer"
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
                </div>
            </div>
        </header>
    )
}

export default TopBar