import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'

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

const Operacoes = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [operacoes, setOperacoes] = useState<Operacao[]>([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    const [operacao, setOperacao] = useState('')
    const [produto, setProduto] = useState('')
    const [modelo, setModelo] = useState('')
    const [linha, setLinha] = useState('')
    const [posto, setPosto] = useState('')
    const [totens, setTotens] = useState<string[]>([])
    const [pecas, setPecas] = useState<string[]>([])
    const [codigos, setCodigos] = useState<string[]>([])
    const [totenTemp, setTotenTemp] = useState('')
    const [pecaTemp, setPecaTemp] = useState('')
    const [codigoTemp, setCodigoTemp] = useState('')
    const [operacaoEditandoId, setOperacaoEditandoId] = useState<string | null>(null)

    const produtos = ['Produto A', 'Produto B', 'Produto C']
    const modelos = ['Modelo 1', 'Modelo 2', 'Modelo 3']
    const linhas = ['Linha 1', 'Linha 2', 'Linha 3']
    const postos = ['Posto 1', 'Posto 2', 'Posto 3']
    const totensDisponiveis = ['Toten 1', 'Toten 2', 'Toten 3', 'ID-001', 'ID-002']

    const adicionarToten = () => {
        if (!totenTemp.trim() || totens.includes(totenTemp.trim())) return
        setTotens([...totens, totenTemp.trim()])
        setTotenTemp('')
    }

    const removerToten = (index: number) => {
        setTotens(totens.filter((_, i) => i !== index))
    }

    const adicionarPeca = () => {
        if (!pecaTemp.trim() || pecas.includes(pecaTemp.trim())) return
        setPecas([...pecas, pecaTemp.trim()])
        setPecaTemp('')
    }

    const removerPeca = (index: number) => {
        setPecas(pecas.filter((_, i) => i !== index))
    }

    const adicionarCodigo = () => {
        if (!codigoTemp.trim() || codigos.includes(codigoTemp.trim())) return
        setCodigos([...codigos, codigoTemp.trim()])
        setCodigoTemp('')
    }

    const removerCodigo = (index: number) => {
        setCodigos(codigos.filter((_, i) => i !== index))
    }

    const limparFormulario = () => {
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
        setOperacaoEditandoId(null)
    }

    const handleSalvar = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!operacao.trim() || !produto || !modelo || !linha || !posto) {
            return
        }

        if (operacaoEditandoId) {
            setOperacoes(operacoes.map(o => 
                o.id === operacaoEditandoId 
                    ? {
                        id: operacaoEditandoId,
                        operacao: operacao.trim(),
                        produto,
                        modelo,
                        linha,
                        posto,
                        totens: [...totens],
                        pecas: [...pecas],
                        codigos: [...codigos]
                    }
                    : o
            ))
            setOperacaoEditandoId(null)
        } else {
            const novaOperacao: Operacao = {
                id: Date.now().toString(),
                operacao: operacao.trim(),
                produto,
                modelo,
                linha,
                posto,
                totens: [...totens],
                pecas: [...pecas],
                codigos: [...codigos]
            }
            setOperacoes([...operacoes, novaOperacao])
        }

        limparFormulario()
        setAbaAtiva('listar')
    }

    const handleRemoverOperacao = (operacaoId: string) => {
        setOperacoes(operacoes.filter(o => o.id !== operacaoId))
    }

    const handleEditarOperacao = (op: Operacao) => {
        setOperacao(op.operacao)
        setProduto(op.produto)
        setModelo(op.modelo)
        setLinha(op.linha)
        setPosto(op.posto)
        setTotens([...op.totens])
        setPecas([...op.pecas])
        setCodigos([...op.codigos])
        setOperacaoEditandoId(op.id)
        setAbaAtiva('cadastrar')
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const operacoesPaginaAtual = operacoes.slice(indiceInicio, indiceFim)

    useEffect(() => {
        const totalPaginas = Math.ceil(operacoes.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [operacoes.length, itensPorPagina, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setAbaAtiva('cadastrar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-plus-circle-fill mr-2"></i>
                                    Cadastrar
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('listar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium ${
                                        abaAtiva === 'listar'
                                            ? 'text-white'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'listar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-list-ul mr-2"></i>
                                    Listar
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    <form onSubmit={handleSalvar}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Operação *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ex: Soldagem da coluna"
                                                    value={operacao}
                                                    onChange={(e) => setOperacao(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Produto *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={produto}
                                                    onChange={(e) => setProduto(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecione</option>
                                                    {produtos.map((p) => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Modelo *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={modelo}
                                                    onChange={(e) => setModelo(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecione</option>
                                                    {modelos.map((m) => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Linha *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={linha}
                                                    onChange={(e) => setLinha(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecione</option>
                                                    {linhas.map((l) => (
                                                        <option key={l} value={l}>{l}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Posto *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={posto}
                                                    onChange={(e) => setPosto(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecione</option>
                                                    {postos.map((p) => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Toten/ID
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={totenTemp}
                                                        onChange={(e) => setTotenTemp(e.target.value)}
                                                    >
                                                        <option value="">Selecione</option>
                                                        {totensDisponiveis.map((t) => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={adicionarToten}
                                                        disabled={!totenTemp.trim() || totens.includes(totenTemp.trim())}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <i className="bi bi-plus-lg"></i>
                                                    </button>
                                                </div>
                                                {totens.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {totens.map((toten, index) => (
                                                            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
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
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Peça
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Nome da peça"
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
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <i className="bi bi-plus-lg"></i>
                                                    </button>
                                                </div>
                                                {pecas.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {pecas.map((peca, index) => (
                                                            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
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

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Código
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Ex: AAA-B5550-10"
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
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <i className="bi bi-plus-lg"></i>
                                                    </button>
                                                </div>
                                                {codigos.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {codigos.map((codigo, index) => (
                                                            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
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
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-white rounded-md disabled:opacity-50"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                disabled={!operacao.trim() || !produto || !modelo || !linha || !posto}
                                            >
                                                {operacaoEditandoId ? 'Atualizar' : 'Salvar'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        {operacoes.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operação</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {operacoesPaginaAtual.map((op) => (
                                                            <tr key={op.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{op.operacao}</td>
                                                                <td className="px-4 py-4 text-sm text-gray-900">{op.produto}</td>
                                                                <td className="px-4 py-4 text-sm text-gray-900">{op.modelo}</td>
                                                                <td className="px-4 py-4 text-sm text-gray-900">{op.linha}</td>
                                                                <td className="px-4 py-4 text-sm text-gray-900">{op.posto}</td>
                                                                <td className="px-4 py-4 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarOperacao(op)}
                                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                        >
                                                                            <i className="bi bi-pencil"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRemoverOperacao(op.id)}
                                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {operacoes.length > itensPorPagina && (
                                                    <div className="mt-4">
                                                        <Paginacao
                                                            totalItens={operacoes.length}
                                                            itensPorPagina={itensPorPagina}
                                                            paginaAtual={paginaAtual}
                                                            onPageChange={setPaginaAtual}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Nenhuma operação cadastrada
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Operacoes
