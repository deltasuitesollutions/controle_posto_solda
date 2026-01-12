import React from 'react'

interface Toten {
    id: string
    nome: string
}

interface CardTotenProps {
    toten: Toten
    onRemoverToten: () => void
    onEditarToten: () => void
}

const CardToten: React.FC<CardTotenProps> = ({
    toten,
    onRemoverToten,
    onEditarToten
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div>
                                <h4 className="font-semibold text-gray-900">{toten.nome}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEditarToten}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar toten"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>
                        <button
                            onClick={onRemoverToten}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Remover toten"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardToten

