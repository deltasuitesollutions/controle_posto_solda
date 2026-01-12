import React from 'react'

interface Produto {
    id: string
    nome: string
    codigo: string
}

interface CardProdutoProps {
    produto: Produto
    onRemoverProduto: () => void
    onEditarProduto: () => void
}

const CardProduto: React.FC<CardProdutoProps> = ({
    produto,
    onRemoverProduto,
    onEditarProduto
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div>
                                <h4 className="font-semibold text-gray-900">{produto.nome}</h4>
                                <p className="text-sm text-gray-600">Código: {produto.codigo}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEditarProduto}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar produto"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>
                        <button
                            onClick={onRemoverProduto}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Remover produto"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardProduto

