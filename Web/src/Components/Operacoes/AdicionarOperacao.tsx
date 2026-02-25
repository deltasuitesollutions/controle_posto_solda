import React, { useState, useEffect } from 'react'

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
}

interface ModalOperacaoProps {
    isOpen: boolean
    onClose: () => void
    onSave: (operacao: Omit<Operacao, 'id'>) => void
    operacaoEditando?: Operacao | null
}

const ModalOperacao: React.FC<ModalOperacaoProps> = ({ isOpen, onClose, onSave, operacaoEditando }) => {
    const [operacao, setOperacao] = useState('')
    const [produto, setProduto] = useState('')
    const [modelo, setModelo] = useState('')
    const [linha, setLinha] = useState('')
    const [posto, setPosto] = useState('')
    
    // Arrays para múltiplos valores
    const [totens, setTotens] = useState<string[]>([])
    const [pecas, setPecas] = useState<string[]>([])
    const [codigos, setCodigos] = useState<string[]>([])
    
    // Valores temporários para adicionar novos itens
    const [totenTemp, setTotenTemp] = useState('')
    const [pecaTemp, setPecaTemp] = useState('')
    const [codigoTemp, setCodigoTemp] = useState('')

    // Opções para os dropdowns (mock data - será substituído por dados reais quando houver backend)
    const produtos = ['Produto A', 'Produto B', 'Produto C']
    const modelos = ['Modelo 1', 'Modelo 2', 'Modelo 3']
    const linhas = ['Linha 1', 'Linha 2', 'Linha 3']
    const postos = ['Posto 1', 'Posto 2', 'Posto 3']
    const totensDisponiveis = ['Toten 1', 'Toten 2', 'Toten 3', 'ID-001', 'ID-002']

    // Carregar dados da operação quando estiver editando
    useEffect(() => {
        if (operacaoEditando) {
            setOperacao(operacaoEditando.operacao)
            setProduto(operacaoEditando.produto)
            setModelo(operacaoEditando.modelo)
            setLinha(operacaoEditando.linha)
            setPosto(operacaoEditando.posto)
            setTotens(operacaoEditando.totens)
            setPecas(operacaoEditando.pecas)
            setCodigos(operacaoEditando.codigos)
        } else {
            setOperacao('')
            setProduto('')
            setModelo('')
            setLinha('')
            setPosto('')
            setTotens([])
            setPecas([])
            setCodigos([])
        }
        setTotenTemp('')
        setPecaTemp('')
        setCodigoTemp('')
    }, [operacaoEditando, isOpen])

    const adicionarToten = () => {
        if (!totenTemp.trim()) return
        if (totens.includes(totenTemp.trim())) return // Evitar duplicatas
        setTotens([...totens, totenTemp.trim()])
        setTotenTemp('')
    }

    const removerToten = (index: number) => {
        setTotens(totens.filter((_, i) => i !== index))
    }

    const adicionarPeca = () => {
        if (!pecaTemp.trim()) return
        if (pecas.includes(pecaTemp.trim())) return // Evitar duplicatas
        setPecas([...pecas, pecaTemp.trim()])
        setPecaTemp('')
    }

    const removerPeca = (index: number) => {
        setPecas(pecas.filter((_, i) => i !== index))
    }

    const adicionarCodigo = () => {
        if (!codigoTemp.trim()) return
        if (codigos.includes(codigoTemp.trim())) return // Evitar duplicatas
        setCodigos([...codigos, codigoTemp.trim()])
        setCodigoTemp('')
    }

    const removerCodigo = (index: number) => {
        setCodigos(codigos.filter((_, i) => i !== index))
    }

    const handleSalvar = () => {
        if (!operacao.trim() || !produto || !modelo || !linha || !posto) {
            return
        }

        const novaOperacao = {
            operacao: operacao.trim(),
            produto,
            modelo,
            linha,
            posto,
            totens: [...totens],
            pecas: [...pecas],
            codigos: [...codigos]
        }

        onSave(novaOperacao)
        onClose()
    }

    const handleLimpar = () => {
        setOperacao('')
        setProduto('')
        setModelo('')
        setLinha('')
        setPosto('')
        setTotens([])
        setPecas([])
        setCodigos([])
        setTotenTemp('')
        setPecaTemp('')
        setCodigoTemp('')
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
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header do Modal */}
                <div className="text-white px-6 py-4 flex shrink-0" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            {operacaoEditando ? 'Editar Operação' : 'Cadastrar Operação'}
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
                    <div className="space-y-4">
                        {/* Operação */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Operação: *
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="(Ex.: Soldagem da coluna) string"
                                value={operacao}
                                onChange={(e) => setOperacao(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Produto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Produto: *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={produto}
                                onChange={(e) => setProduto(e.target.value)}
                                required
                            >
                                <option value="">Selecione um produto</option>
                                {produtos.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Modelo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modelo: *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                required
                            >
                                <option value="">Selecione um modelo</option>
                                {modelos.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Linha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Linha: *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={linha}
                                onChange={(e) => setLinha(e.target.value)}
                                required
                            >
                                <option value="">Selecione uma linha</option>
                                {linhas.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>

                        {/* Posto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Posto: *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={posto}
                                onChange={(e) => setPosto(e.target.value)}
                                required
                            >
                                <option value="">Selecione um posto</option>
                                {postos.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toten/ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Toten/ID:
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={totenTemp}
                                    onChange={(e) => setTotenTemp(e.target.value)}
                                >
                                    <option value="">Selecione um toten/ID</option>
                                    {totensDisponiveis.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={adicionarToten}
                                    disabled={!totenTemp.trim() || totens.includes(totenTemp.trim())}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Adicionar toten/ID"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                            </div>
                            {totens.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {totens.map((toten, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                                        >
                                            {toten}
                                            <button
                                                type="button"
                                                onClick={() => removerToten(index)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Deve ser possível adicionar mais peças e códigos a uma única operação
                            </p>
                        </div>

                        {/* Peça */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Peça:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nome (string)"
                                    value={pecaTemp}
                                    onChange={(e) => setPecaTemp(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && pecaTemp.trim()) {
                                            e.preventDefault()
                                            adicionarPeca()
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={adicionarPeca}
                                    disabled={!pecaTemp.trim() || pecas.includes(pecaTemp.trim())}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Adicionar peça"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                            </div>
                            {pecas.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {pecas.map((peca, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                                        >
                                            {peca}
                                            <button
                                                type="button"
                                                onClick={() => removerPeca(index)}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Código */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: ABC-2026-00"
                                    value={codigoTemp}
                                    onChange={(e) => setCodigoTemp(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && codigoTemp.trim()) {
                                            e.preventDefault()
                                            adicionarCodigo()
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={adicionarCodigo}
                                    disabled={!codigoTemp.trim() || codigos.includes(codigoTemp.trim())}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Adicionar código"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                            </div>
                            {codigos.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {codigos.map((codigo, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm"
                                        >
                                            {codigo}
                                            <button
                                                type="button"
                                                onClick={() => removerCodigo(index)}
                                                className="text-purple-600 hover:text-purple-800"
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Deve ser possível adicionar mais peças e códigos a uma única operação
                            </p>
                        </div>
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
                        disabled={!operacao.trim() || !produto || !modelo || !linha || !posto}
                    >
                        <i className="bi bi-check-circle-fill"></i>
                        <span>SALVAR</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalOperacao

