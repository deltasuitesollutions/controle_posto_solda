import { useState, useEffect } from 'react'

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
    modeloEditando?: Modelo | null
}

const ModalModelo = ({ isOpen, onClose, onSave, modeloEditando }: ModalModeloProps) => {
    const [codigo, setCodigo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [subprodutos, setSubprodutos] = useState<Subproduto[]>([])
    const [subCodigo, setSubCodigo] = useState('')
    const [subDescricao, setSubDescricao] = useState('')
    const [subprodutoEditando, setSubprodutoEditando] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && modeloEditando) {
            // Modo edição - carrega os dados do modelo
            setCodigo(modeloEditando.codigo)
            setDescricao(modeloEditando.descricao)
            setSubprodutos([...modeloEditando.subprodutos])
            setSubCodigo('')
            setSubDescricao('')
        } else if (!isOpen) {
            // Fecha o modal - limpa os campos
            setCodigo('')
            setDescricao('')
            setSubprodutos([])
            setSubCodigo('')
            setSubDescricao('')
            setSubprodutoEditando(null)
        }
    }, [isOpen, modeloEditando])

    const addSub = () => {
        if (!subCodigo.trim() || !subDescricao.trim()) return
        
        if (subprodutoEditando) {
            // Modo edição - atualiza o subproduto
            setSubprodutos(subprodutos.map(s => 
                s.id === subprodutoEditando 
                    ? { ...s, codigo: subCodigo.trim(), descricao: subDescricao.trim() }
                    : s
            ))
            setSubprodutoEditando(null)
        } else {
            // Modo criação - adiciona novo subproduto
            setSubprodutos([...subprodutos, {
                id: Date.now().toString(),
                codigo: subCodigo.trim(),
                descricao: subDescricao.trim()
            }])
        }
        setSubCodigo('')
        setSubDescricao('')
    }

    const editarSub = (sub: Subproduto) => {
        setSubCodigo(sub.codigo)
        setSubDescricao(sub.descricao)
        setSubprodutoEditando(sub.id)
    }

    const cancelarEdicaoSub = () => {
        setSubCodigo('')
        setSubDescricao('')
        setSubprodutoEditando(null)
    }

    const removeSub = (id: string) => {
        setSubprodutos(subprodutos.filter(s => s.id !== id))
        if (subprodutoEditando === id) {
            setSubprodutoEditando(null)
            setSubCodigo('')
            setSubDescricao('')
        }
    }

    const salvar = () => {
        if (!codigo.trim() || !descricao.trim()) return
        
        onSave({
            codigo: codigo.trim(),
            descricao: descricao.trim(),
            subprodutos
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 text-white flex items-center justify-between" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <i className={`bi ${modeloEditando ? 'bi-pencil-square' : 'bi-box-seam'}`}></i>
                        {modeloEditando ? 'Editar Modelo' : 'Novo Modelo'}
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Informações do Modelo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4C79AF]"
                                    placeholder="Ex: PROD001"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4C79AF]"
                                    placeholder="Ex: Modelo de Produto A"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">
                            Subprodutos ({subprodutos.length})
                        </h4>

                        <div className={`mb-4 p-4 rounded-lg border ${!modeloEditando ? 'bg-blue-50' : 'bg-white'}`} style={!modeloEditando ? { borderColor: 'rgba(76, 121, 175, 0.2)' } : { borderColor: '#e5e7eb' }}>
                            <form onSubmit={(e) => { e.preventDefault(); addSub() }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4C79AF]"
                                            placeholder="Ex: SUB001"
                                            value={subCodigo}
                                            onChange={(e) => setSubCodigo(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4C79AF]"
                                            placeholder="Ex: Subproduto A"
                                            value={subDescricao}
                                            onChange={(e) => setSubDescricao(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && subCodigo.trim() && subDescricao.trim()) {
                                                    e.preventDefault()
                                                    addSub()
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm hover:opacity-90 disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--bg-azul)' }}
                                        disabled={!subCodigo.trim() || !subDescricao.trim()}
                                    >
                                        <i className={`bi ${subprodutoEditando ? 'bi-check-circle-fill' : 'bi-plus-circle-fill'}`}></i>
                                        {subprodutoEditando ? 'Salvar Alterações' : 'Adicionar Subproduto'}
                                    </button>
                                    {subprodutoEditando && (
                                        <button
                                            type="button"
                                            onClick={cancelarEdicaoSub}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {subprodutos.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {subprodutos.map((sub) => (
                                    <div key={sub.id} className={`flex items-center justify-between p-3 rounded-md transition-colors ${subprodutoEditando === sub.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500">Código:</span>
                                                <p className="font-medium text-gray-900">{sub.codigo}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Descrição:</span>
                                                <p className="font-medium text-gray-900">{sub.descricao}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => editarSub(sub)}
                                                className="p-2 rounded transition-colors hover:opacity-80"
                                                style={{ color: 'var(--bg-azul)' }}
                                                title="Editar subproduto"
                                                disabled={subprodutoEditando !== null && subprodutoEditando !== sub.id}
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                onClick={() => removeSub(sub.id)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                title="Remover subproduto"
                                                disabled={subprodutoEditando !== null && subprodutoEditando !== sub.id}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={salvar}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--bg-azul)' }}
                        disabled={!codigo.trim() || !descricao.trim()}
                    >
                        <i className="bi bi-check-circle-fill"></i>
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalModelo
