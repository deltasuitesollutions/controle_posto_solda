interface Subproduto {
    id: string
    codigo: string
    descricao: string
}

interface Modelo {
    id: string
    codigo: string
    descricao: string
    subprodutos: Subproduto[]
}

interface CardModeloProps {
    modelo: Modelo
    estaExpandido: boolean
    onToggleExpandir: () => void
    onRemoverModelo: () => void
    onEditarModelo: () => void
    onRemoverSubproduto: (subprodutoId: string) => void
}

const CardModelo = ({
    modelo,
    estaExpandido,
    onToggleExpandir,
    onRemoverModelo,
    onEditarModelo,
    onRemoverSubproduto
}: CardModeloProps) => {

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Cabeçalho do Modelo */}
            <div 
                className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={onToggleExpandir}
            >
                <div className="flex items-center gap-4 flex-1">
                    <i className={`bi ${estaExpandido ? 'bi-chevron-down' : 'bi-chevron-right'} text-gray-600 text-lg`}></i>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-gray-500">Código:</span>
                            <p className="font-semibold text-gray-900">{modelo.codigo}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Descrição:</span>
                            <p className="font-semibold text-gray-900">{modelo.descricao}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ color: 'var(--bg-azul)', backgroundColor: 'rgba(76, 121, 175, 0.1)' }}>
                            <i className="bi bi-boxes mr-1"></i>
                            {modelo.subprodutos.length} subproduto{modelo.subprodutos.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEditarModelo()
                        }}
                        className="p-2 rounded transition-colors hover:opacity-80"
                        style={{ color: 'var(--bg-azul)' }}
                        title="Editar modelo"
                    >
                        <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoverModelo()
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Remover modelo"
                    >
                        <i className="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            {/* Conteúdo Expandido - Subprodutos */}
            {estaExpandido && (
                <div className="p-4 bg-white border-t border-gray-200">
                    {/* Lista de Subprodutos */}
                    {modelo.subprodutos.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <i className="bi bi-inbox text-3xl mb-2"></i>
                            <p>Nenhum subproduto cadastrado</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <i className="bi bi-list-check"></i>
                                Subprodutos ({modelo.subprodutos.length}):
                            </h4>
                            {modelo.subprodutos.map((subproduto) => (
                                <div 
                                    key={subproduto.id} 
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500">Código:</span>
                                            <p className="font-medium text-gray-900">{subproduto.codigo}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Descrição:</span>
                                            <p className="font-medium text-gray-900">{subproduto.descricao}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onRemoverSubproduto(subproduto.id)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors ml-4"
                                        title="Remover subproduto"
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default CardModelo

