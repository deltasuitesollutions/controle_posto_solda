import React, { useState, useEffect } from 'react'

interface Peca {
    id: string
    modeloId: string
    codigo: string
    nome: string
}

interface Modelo {
    id: string
    nome: string
    pecas: Peca[]
}

interface ModalModeloProps {
    isOpen: boolean
    onClose: () => void
    onSave: (modelo: Omit<Modelo, 'id'>) => void
    modeloEditando?: Modelo | null
}

const ModalModelo: React.FC<ModalModeloProps> = ({ isOpen, onClose, onSave, modeloEditando }) => {
    const [nome, setNome] = useState('')
    const [pecasTemp, setPecasTemp] = useState<Peca[]>([])
    const [pecaCodigo, setPecaCodigo] = useState('')
    const [pecaNome, setPecaNome] = useState('')
    const [modeloIdTemp, setModeloIdTemp] = useState<string>('')

    // Carregar dados do modelo quando estiver editando
    useEffect(() => {
        if (modeloEditando) {
            setNome(modeloEditando.nome)
            setPecasTemp(modeloEditando.pecas)
            setModeloIdTemp(modeloEditando.id)
        } else {
            setNome('')
            setPecasTemp([])
            setModeloIdTemp(Date.now().toString()) // ID temporário para novos modelos
        }
        setPecaCodigo('')
        setPecaNome('')
    }, [modeloEditando, isOpen])

    const adicionarPecaTemp = () => {
        if (!pecaCodigo.trim() || !pecaNome.trim() || !modeloIdTemp) {
            return
        }

        const novaPeca: Peca = {
            id: Date.now().toString(),
            modeloId: modeloIdTemp,
            codigo: pecaCodigo.trim(),
            nome: pecaNome.trim()
        }

        setPecasTemp([...pecasTemp, novaPeca])
        setPecaCodigo('')
        setPecaNome('')
    }

    const removerPecaTemp = (id: string) => {
        setPecasTemp(pecasTemp.filter(p => p.id !== id))
    }

    const handleSalvar = () => {
        if (!nome.trim()) {
            return
        }

        const novoModelo = {
            nome: nome.trim(),
            pecas: [...pecasTemp]
        }

        onSave(novoModelo)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header do Modal */}
                <div className="text-white px-6 py-4 flex shrink-0" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <i className="bi bi-box-seam"></i>
                            {modeloEditando ? 'Editar Modelo' : 'Novo Modelo'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white hover:bg-opacity-20"
                            title="Fechar modal"
                        >
                            <i className="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                </div>
                
                {/* Conteúdo do Modal - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Formulário do Modelo */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <i className="bi bi-info-circle"></i>
                            Informações do Modelo
                        </h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome *
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Modelo de Produto A"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Seção de Peças */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <i className="bi bi-boxes"></i>
                                Peças ({pecasTemp.length})
                            </h4>
                        </div>

                        {/* Formulário para adicionar peça */}
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                adicionarPecaTemp()
                            }}>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Modelo *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                                            value={nome || 'Novo Modelo'}
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Código da Peça *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: PEC001"
                                            value={pecaCodigo}
                                            onChange={(e) => setPecaCodigo(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Nome da Peça *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: Peça A"
                                            value={pecaNome}
                                            onChange={(e) => setPecaNome(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && pecaCodigo.trim() && pecaNome.trim()) {
                                                    e.preventDefault()
                                                    adicionarPecaTemp()
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: 'var(--bg-azul)' }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.opacity = '0.9'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.opacity = '1'
                                        }
                                    }}
                                    disabled={!pecaCodigo.trim() || !pecaNome.trim()}
                                >
                                    <i className="bi bi-plus-circle-fill"></i>
                                    <span>Adicionar Peça</span>
                                </button>
                            </form>
                        </div>

                        {/* Lista de Peças Temporárias */}
                        {pecasTemp.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {pecasTemp.map((peca) => (
                                    <div 
                                        key={peca.id} 
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500">Modelo:</span>
                                                <p className="font-medium text-gray-900">{nome || 'Novo Modelo'}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Código:</span>
                                                <p className="font-medium text-gray-900">{peca.codigo}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Nome:</span>
                                                <p className="font-medium text-gray-900">{peca.nome}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removerPecaTemp(peca.id)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors ml-4"
                                            title="Remover peça"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões do Modal - Fixed Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSalvar}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--bg-azul)' }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '0.9'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '1'
                            }
                        }}
                        disabled={!nome.trim()}
                    >
                        <i className="bi bi-check-circle-fill"></i>
                        <span>Salvar Modelo</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalModelo
