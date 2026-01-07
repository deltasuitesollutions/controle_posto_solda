import React, { useState, useEffect } from 'react'

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

interface ModalModeloProps {
    isOpen: boolean
    onClose: () => void
    onSave: (modelo: Omit<Modelo, 'id'>) => void
}

const ModalModelo: React.FC<ModalModeloProps> = ({ isOpen, onClose, onSave }) => {
    const [codigo, setCodigo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [subprodutosTemp, setSubprodutosTemp] = useState<Subproduto[]>([])
    const [subprodutoCodigo, setSubprodutoCodigo] = useState('')
    const [subprodutoDescricao, setSubprodutoDescricao] = useState('')

    // Resetar campos quando o modal abrir/fechar
    useEffect(() => {
        if (!isOpen) {
            setCodigo('')
            setDescricao('')
            setSubprodutosTemp([])
            setSubprodutoCodigo('')
            setSubprodutoDescricao('')
        }
    }, [isOpen])

    const adicionarSubprodutoTemp = () => {
        if (!subprodutoCodigo.trim() || !subprodutoDescricao.trim()) {
            return
        }

        const novoSubproduto: Subproduto = {
            id: Date.now().toString(),
            codigo: subprodutoCodigo.trim(),
            descricao: subprodutoDescricao.trim()
        }

        setSubprodutosTemp([...subprodutosTemp, novoSubproduto])
        setSubprodutoCodigo('')
        setSubprodutoDescricao('')
    }

    const removerSubprodutoTemp = (id: string) => {
        setSubprodutosTemp(subprodutosTemp.filter(sub => sub.id !== id))
    }

    const handleSalvar = () => {
        if (!codigo.trim() || !descricao.trim()) {
            return
        }

        const novoModelo = {
            codigo: codigo.trim(),
            descricao: descricao.trim(),
            subprodutos: [...subprodutosTemp]
        }

        onSave(novoModelo)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header do Modal */}
                <div className="text-white px-6 py-4 flex shrink-0" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <i className="bi bi-box-seam"></i>
                            Novo Modelo
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código do Produto *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: PROD001"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: Modelo de Produto A"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção de Subprodutos */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <i className="bi bi-boxes"></i>
                                Subprodutos ({subprodutosTemp.length})
                            </h4>
                        </div>

                        {/* Formulário para adicionar subproduto */}
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                adicionarSubprodutoTemp()
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Código do Subproduto
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: SUB001"
                                            value={subprodutoCodigo}
                                            onChange={(e) => setSubprodutoCodigo(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Descrição do Subproduto
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: Subproduto A"
                                            value={subprodutoDescricao}
                                            onChange={(e) => setSubprodutoDescricao(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && subprodutoCodigo.trim() && subprodutoDescricao.trim()) {
                                                    e.preventDefault()
                                                    adicionarSubprodutoTemp()
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
                                    disabled={!subprodutoCodigo.trim() || !subprodutoDescricao.trim()}
                                >
                                    <i className="bi bi-plus-circle-fill"></i>
                                    <span>Adicionar Subproduto</span>
                                </button>
                            </form>
                        </div>

                        {/* Lista de Subprodutos Temporários */}
                        {subprodutosTemp.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                                <i className="bi bi-inbox text-2xl mb-2"></i>
                                <p className="text-sm">Nenhum subproduto adicionado ainda</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {subprodutosTemp.map((subproduto) => (
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
                                            onClick={() => removerSubprodutoTemp(subproduto.id)}
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
                        disabled={!codigo.trim() || !descricao.trim()}
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
