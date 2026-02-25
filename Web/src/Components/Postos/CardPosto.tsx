import React from 'react'

interface Posto {
    posto_id: number
    nome: string
    sublinha_id: number
    toten_id: number
    serial?: string
    totem_nome?: string
}

interface CardPostoProps {
    posto: Posto
    nomeSublinha: string
    onRemoverPosto: () => void
    onEditarPosto: () => void
}

const CardPosto: React.FC<CardPostoProps> = ({
    posto,
    nomeSublinha,
    onRemoverPosto,
    onEditarPosto
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{posto.nome}</h4>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        <i className="bi bi-diagram-3 mr-1"></i>
                                        {nomeSublinha}
                                    </span>
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        <i className="bi bi-cpu mr-1"></i>
                                        {posto.totem_nome || `Totem ${posto.toten_id}`}
                                    </span>
                                    {posto.serial && (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                            <i className="bi bi-hash mr-1"></i>
                                            Serial: {posto.serial}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEditarPosto}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar posto"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>
                        <button
                            onClick={onRemoverPosto}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Remover posto"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardPosto
