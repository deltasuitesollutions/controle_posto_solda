import React, { useState, useEffect } from 'react'

interface Peca {
    id: number
    modelo_id: number
    codigo: string
    nome: string
}

interface Modelo {
    id: number
    codigo?: string
    nome: string
    pecas: Peca[]
}

interface ModalModeloProps {
    isOpen: boolean
    onClose: () => void
    onSave: (modelo: { nome: string; pecas?: Array<{codigo: string; nome: string}> }) => void
    modeloEditando?: Modelo | null
}

const ModalModelo: React.FC<ModalModeloProps> = ({ isOpen, onClose, onSave, modeloEditando }) => {
    const [nome, setNome] = useState('')
    const [pecasTemp, setPecasTemp] = useState<Array<{codigo: string; nome: string; id?: number}>>([])
    const [pecaCodigo, setPecaCodigo] = useState('')
    const [pecaNome, setPecaNome] = useState('')
    const [pecaEditandoIndex, setPecaEditandoIndex] = useState<number | null>(null)

    // Carregar dados do modelo quando estiver editando
    useEffect(() => {
        if (isOpen) {
            if (modeloEditando) {
                setNome(modeloEditando.nome || '')
                // Carregar peças com seus IDs para poder identificar quais já existem
                const pecasCarregadas = (modeloEditando.pecas || []).map(p => ({ 
                    id: p.id,
                    codigo: p.codigo || '', 
                    nome: p.nome || '' 
                }))
                setPecasTemp(pecasCarregadas)
            } else {
                setNome('')
                setPecasTemp([])
            }
            setPecaCodigo('')
            setPecaNome('')
            setPecaEditandoIndex(null)
        }
    }, [modeloEditando, isOpen])

    const adicionarPecaTemp = () => {
        if (!pecaCodigo.trim() || !pecaNome.trim()) {
            return
        }

        if (pecaEditandoIndex !== null) {
            // Modo edição - atualizar peça existente
            const novasPecas = [...pecasTemp]
            novasPecas[pecaEditandoIndex] = {
                ...novasPecas[pecaEditandoIndex],
                codigo: pecaCodigo.trim(),
                nome: pecaNome.trim()
            }
            setPecasTemp(novasPecas)
            setPecaEditandoIndex(null)
        } else {
            // Modo adição - adicionar nova peça
            const novaPeca = {
                codigo: pecaCodigo.trim(),
                nome: pecaNome.trim()
            }
            setPecasTemp([...pecasTemp, novaPeca])
        }
        
        setPecaCodigo('')
        setPecaNome('')
    }

    const removerPecaTemp = (index: number) => {
        setPecasTemp(pecasTemp.filter((_, i) => i !== index))
        if (pecaEditandoIndex === index) {
            setPecaEditandoIndex(null)
            setPecaCodigo('')
            setPecaNome('')
        } else if (pecaEditandoIndex !== null && pecaEditandoIndex > index) {
            setPecaEditandoIndex(pecaEditandoIndex - 1)
        }
    }

    const iniciarEdicaoPeca = (index: number) => {
        const peca = pecasTemp[index]
        setPecaEditandoIndex(index)
        setPecaCodigo(peca.codigo)
        setPecaNome(peca.nome)
        // Scroll para o formulário azul
        setTimeout(() => {
            const formElement = document.querySelector('.bg-blue-50')
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
        }, 100)
    }

    const cancelarEdicaoPeca = () => {
        setPecaEditandoIndex(null)
        setPecaCodigo('')
        setPecaNome('')
    }

    const handleSalvar = () => {
        if (!nome.trim()) {
            return
        }

        // Preparar peças para envio, incluindo IDs quando existirem
        const pecasParaEnviar = pecasTemp.map(peca => ({
            ...(peca.id && { id: peca.id }), // Incluir ID apenas se existir
            codigo: peca.codigo,
            nome: peca.nome
        }))

        const novoModelo = {
            nome: nome.trim(),
            pecas: pecasParaEnviar.length > 0 ? pecasParaEnviar : undefined
        }

        onSave(novoModelo)
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all" onClick={(e) => e.stopPropagation()}>
                {/* Header do Modal */}
                <div className="text-white px-6 py-5 flex shrink-0" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <i className="bi bi-box-seam text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    {modeloEditando ? 'Editar Modelo' : 'Novo Modelo'}
                                </h3>
                                <p className="text-sm text-white text-opacity-90 mt-0.5">
                                    {modeloEditando ? 'Atualize as informações do modelo' : 'Preencha os dados para criar um novo modelo'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                            title="Fechar modal (ESC)"
                        >
                            <i className="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                </div>
                
                {/* Conteúdo do Modal - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Formulário do Modelo */}
                    <div className="bg-white rounded-lg p-5 mb-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <i className="bi bi-info-circle text-blue-600"></i>
                            </div>
                            <h4 className="text-base font-semibold text-gray-800">
                                Informações do Modelo
                            </h4>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do Modelo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Ex: Modelo de Produto A"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                Digite um nome descritivo para identificar este modelo
                            </p>
                        </div>
                    </div>

                    {/* Seção de Peças */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <i className="bi bi-boxes text-purple-600"></i>
                                </div>
                                <h4 className="text-base font-semibold text-gray-800">
                                    Peças do Modelo
                                </h4>
                                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    {pecasTemp.length} {pecasTemp.length === 1 ? 'peça' : 'peças'}
                                </span>
                            </div>
                        </div>

                        {/* Formulário para adicionar/editar peça */}
                        <div className={`mb-4 p-4 rounded-lg border-2 transition-all ${
                            pecaEditandoIndex !== null 
                                ? 'bg-yellow-50 border-yellow-300' 
                                : 'bg-blue-50 border-blue-200'
                        }`}>
                            {pecaEditandoIndex !== null && (
                                <div className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="bi bi-pencil-square text-yellow-700"></i>
                                        <p className="text-sm font-medium text-yellow-800">
                                            Editando: <span className="font-bold">{pecasTemp[pecaEditandoIndex]?.nome}</span>
                                        </p>
                                    </div>
                                    <p className="text-xs text-yellow-700 mt-1 ml-6">
                                        Modifique os campos abaixo e clique em "Salvar Edição"
                                    </p>
                                </div>
                            )}
                            {pecaEditandoIndex === null && (
                                <div className="mb-3">
                                    <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                                        <i className="bi bi-plus-circle"></i>
                                        Adicione as peças que compõem este modelo
                                    </p>
                                </div>
                            )}
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                adicionarPecaTemp()
                            }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Código da Peça <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                            placeholder="Ex: PEC001"
                                            value={pecaCodigo}
                                            onChange={(e) => setPecaCodigo(e.target.value)}
                                            autoFocus={pecaEditandoIndex !== null}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Nome da Peça <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                            placeholder="Ex: Peça A"
                                            value={pecaNome}
                                            onChange={(e) => setPecaNome(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && pecaCodigo.trim() && pecaNome.trim()) {
                                                    e.preventDefault()
                                                    adicionarPecaTemp()
                                                } else if (e.key === 'Escape' && pecaEditandoIndex !== null) {
                                                    e.preventDefault()
                                                    cancelarEdicaoPeca()
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                                            pecaEditandoIndex !== null 
                                                ? 'bg-yellow-600 hover:bg-yellow-700' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                        disabled={!pecaCodigo.trim() || !pecaNome.trim()}
                                    >
                                        <i className={pecaEditandoIndex !== null ? "bi bi-check-circle-fill" : "bi bi-plus-circle-fill"}></i>
                                        <span>{pecaEditandoIndex !== null ? 'Salvar Edição' : 'Adicionar Peça'}</span>
                                    </button>
                                    {pecaEditandoIndex !== null && (
                                        <button
                                            type="button"
                                            onClick={cancelarEdicaoPeca}
                                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            <i className="bi bi-x-lg"></i>
                                            <span>Cancelar</span>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Lista de Peças Temporárias */}
                        {pecasTemp.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {pecasTemp.map((peca, index) => (
                                    <div 
                                        key={peca.id || index} 
                                        className={`flex items-center justify-between p-4 rounded-lg transition-all border-2 ${
                                            pecaEditandoIndex === index 
                                                ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Código</span>
                                                <p className="font-semibold text-gray-900 mt-0.5">{peca.codigo}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</span>
                                                <p className="font-semibold text-gray-900 mt-0.5">{peca.nome}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => iniciarEdicaoPeca(index)}
                                                className={`p-2.5 rounded-lg transition-all ${
                                                    pecaEditandoIndex === index
                                                        ? 'text-yellow-800 bg-yellow-200 shadow-sm'
                                                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                                                }`}
                                                title="Editar peça"
                                            >
                                                <i className="bi bi-pencil text-base"></i>
                                            </button>
                                            <button
                                                onClick={() => removerPecaTemp(index)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2.5 rounded-lg transition-all"
                                                title="Remover peça"
                                            >
                                                <i className="bi bi-trash text-base"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <i className="bi bi-inbox text-4xl mb-2"></i>
                                <p className="text-sm">Nenhuma peça adicionada ainda</p>
                                <p className="text-xs mt-1">Use o formulário acima para adicionar peças</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões do Modal - Fixed Footer */}
                <div className="flex justify-between items-center gap-3 p-5 border-t border-gray-200 bg-white shrink-0">
                    <div className="text-sm text-gray-500">
                        {pecasTemp.length > 0 && (
                            <span className="flex items-center gap-1.5">
                                <i className="bi bi-check-circle text-green-500"></i>
                                {pecasTemp.length} {pecasTemp.length === 1 ? 'peça adicionada' : 'peças adicionadas'}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSalvar}
                            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
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
                            <span>{modeloEditando ? 'Salvar Alterações' : 'Criar Modelo'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalModelo
