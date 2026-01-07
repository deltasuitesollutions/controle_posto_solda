import React from 'react'

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

const CardModelo: React.FC<CardModeloProps> = ({
    modelo,
    estaExpandido,
    onToggleExpandir,
    onRemoverModelo,
    onEditarModelo,
    onRemoverSubproduto
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onToggleExpandir}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <i className={`bi bi-chevron-${estaExpandido ? 'down' : 'right'}`}></i>
                            </button>
                            <div>
                                <h4 className="font-semibold text-gray-900">{modelo.codigo}</h4>
                                <p className="text-sm text-gray-600">{modelo.descricao}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEditarModelo}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar modelo"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>
                        <button
                            onClick={onRemoverModelo}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Remover modelo"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            {estaExpandido && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                        Subprodutos ({modelo.subprodutos.length})
                    </h5>
                    {modelo.subprodutos.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhum subproduto cadastrado</p>
                    ) : (
                        <div className="space-y-2">
                            {modelo.subprodutos.map((subproduto) => (
                                <div
                                    key={subproduto.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200"
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
