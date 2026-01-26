import React from 'react'

interface Operacao {
    id: string
    operacao: string
    produto: string
    modelo: string
    linha: string
    posto: string
    totens: string[]
    pecas: string[]
    codigos: string[]
    serial?: string
    hostname?: string
}

interface CardOperacaoProps {
    operacao: Operacao
    estaExpandido: boolean
    onToggleExpandir: () => void
    onRemoverOperacao: () => void
    onEditarOperacao: () => void
}

const CardOperacao: React.FC<CardOperacaoProps> = ({
    operacao,
    estaExpandido,
    onToggleExpandir,
    onRemoverOperacao,
    onEditarOperacao
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
                                <h4 className="font-semibold text-gray-900">{operacao.operacao}</h4>
                                <p className="text-sm text-gray-600">
                                    {operacao.produto} • {operacao.modelo} • {operacao.linha} • {operacao.posto}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEditarOperacao}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar operação"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>
                        <button
                            onClick={onRemoverOperacao}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Remover operação"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            {estaExpandido && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <span className="text-xs text-gray-500">Produto:</span>
                            <p className="font-medium text-gray-900">{operacao.produto}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Modelo:</span>
                            <p className="font-medium text-gray-900">{operacao.modelo}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Linha:</span>
                            <p className="font-medium text-gray-900">{operacao.linha}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Posto:</span>
                            <p className="font-medium text-gray-900">{operacao.posto}</p>
                        </div>
                    </div>

                    {(operacao.serial || operacao.hostname) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {operacao.serial && (
                                <div>
                                    <span className="text-xs text-gray-500">Serial:</span>
                                    <p className="font-medium text-gray-900">{operacao.serial}</p>
                                </div>
                            )}
                            {operacao.hostname && (
                                <div>
                                    <span className="text-xs text-gray-500">Hostname:</span>
                                    <p className="font-medium text-gray-900">{operacao.hostname}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {operacao.totens.length > 0 && (
                        <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                Totens/IDs ({operacao.totens.length})
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {operacao.totens.map((toten, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                                    >
                                        {toten}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {operacao.pecas.length > 0 && (
                        <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                Peças ({operacao.pecas.length})
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {operacao.pecas.map((peca, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                                    >
                                        {peca}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {operacao.codigos.length > 0 && (
                        <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                Códigos ({operacao.codigos.length})
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {operacao.codigos.map((codigo, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm"
                                    >
                                        {codigo}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {operacao.totens.length === 0 && operacao.pecas.length === 0 && operacao.codigos.length === 0 && (
                        <p className="text-sm text-gray-500">Nenhum toten, peça ou código cadastrado</p>
                    )}
                </div>
            )}
        </div>
    )
}

export default CardOperacao

