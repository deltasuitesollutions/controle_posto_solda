import React from 'react'

interface Sublinha {
    id: number
    linha_id: number
    nome: string
}

interface Linha {
    id: number
    nome: string
    sublinhas: Sublinha[]
}

interface CardLinhaProps {
    linha: Linha
    estaExpandida: boolean
    estaEditandoLinha: boolean
    nomeLinhaEditando: string
    sublinhaEditando: number | null
    nomeSublinhaEditando: string
    onToggleExpandir: () => void
    onIniciarEdicaoLinha: () => void
    onSalvarEdicaoLinha: () => void
    onCancelarEdicaoLinha: () => void
    onNomeLinhaEditandoChange: (nome: string) => void
    onExcluirLinha: () => void
    onIniciarEdicaoSublinha: (sublinha: Sublinha) => void
    onSalvarEdicaoSublinha: (sublinha: Sublinha) => void
    onCancelarEdicaoSublinha: () => void
    onNomeSublinhaEditandoChange: (nome: string) => void
    onExcluirSublinha: (sublinhaId: number) => void
}

const CardLinha: React.FC<CardLinhaProps> = ({
    linha,
    estaExpandida,
    estaEditandoLinha,
    nomeLinhaEditando,
    sublinhaEditando,
    nomeSublinhaEditando,
    onToggleExpandir,
    onIniciarEdicaoLinha,
    onSalvarEdicaoLinha,
    onCancelarEdicaoLinha,
    onNomeLinhaEditandoChange,
    onExcluirLinha,
    onIniciarEdicaoSublinha,
    onSalvarEdicaoSublinha,
    onCancelarEdicaoSublinha,
    onNomeSublinhaEditandoChange,
    onExcluirSublinha
}) => {
    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <button
                        onClick={onToggleExpandir}
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={!linha.sublinhas || linha.sublinhas.length === 0}
                    >
                        <i className={`bi bi-chevron-${estaExpandida ? 'down' : 'right'}`}></i>
                    </button>
                    {estaEditandoLinha ? (
                        <input
                            type="text"
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={nomeLinhaEditando}
                            onChange={(e) => onNomeLinhaEditandoChange(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <>
                            <h4 className="font-semibold text-gray-900 text-lg">
                                {linha.nome}
                            </h4>
                            {linha.sublinhas && linha.sublinhas.length > 0 && (
                                <span className="text-sm text-gray-500">
                                    ({linha.sublinhas.length} {linha.sublinhas.length === 1 ? 'sublinha' : 'sublinhass'})
                                </span>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {estaEditandoLinha ? (
                        <>
                            <button
                                onClick={onSalvarEdicaoLinha}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded transition-colors"
                                title="Salvar"
                            >
                                <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                                onClick={onCancelarEdicaoLinha}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded transition-colors"
                                title="Cancelar"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onIniciarEdicaoLinha}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                                title="Editar linha"
                            >
                                <i className="bi bi-pencil"></i>
                            </button>
                            <button
                                onClick={onExcluirLinha}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                title="Excluir linha"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {estaExpandida && linha.sublinhas && linha.sublinhas.length > 0 && (
                <div className="ml-8 mt-3 pt-3 border-t border-gray-200">
                    <div className="space-y-2">
                        {linha.sublinhas.map((sublinha) => {
                            const estaEditandoSublinha = sublinhaEditando === sublinha.id
                            return (
                                <div 
                                    key={sublinha.id} 
                                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                >
                                    {estaEditandoSublinha ? (
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={nomeSublinhaEditando}
                                            onChange={(e) => onNomeSublinhaEditandoChange(e.target.value)}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-700">
                                            {sublinha.nome}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2 ml-2">
                                        {estaEditandoSublinha ? (
                                            <>
                                                <button
                                                    onClick={() => onSalvarEdicaoSublinha(sublinha)}
                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition-colors"
                                                    title="Salvar"
                                                >
                                                    <i className="bi bi-check-lg text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={onCancelarEdicaoSublinha}
                                                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-1 rounded transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <i className="bi bi-x-lg text-sm"></i>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onIniciarEdicaoSublinha(sublinha)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                                                    title="Editar sublinha"
                                                >
                                                    <i className="bi bi-pencil text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={() => onExcluirSublinha(sublinha.id)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                                    title="Excluir sublinha"
                                                >
                                                    <i className="bi bi-trash text-sm"></i>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CardLinha

