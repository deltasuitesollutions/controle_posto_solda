import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { operacoesAPI, produtosAPI, modelosAPI, linhasAPI, postosAPI } from '../api/api'

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

interface Produto {
    id: number
    nome: string
}

interface Modelo {
    id: number
    nome: string
}

interface Linha {
    linha_id: number
    nome: string
}

interface Posto {
    posto_id: number
    nome: string
}

interface Toten {
    id: number
    nome: string
}

const Operacoes = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [operacoes, setOperacoes] = useState<Operacao[]>([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const [operacao, setOperacao] = useState('')
    const [operacaoSelecionadaId, setOperacaoSelecionadaId] = useState('')
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

    // Dados para os dropdowns
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [linhas, setLinhas] = useState<Linha[]>([])
    const [postos, setPostos] = useState<Posto[]>([])
    const [totensDisponiveis, setTotensDisponiveis] = useState<Toten[]>([])

    // Carregar dados ao montar o componente
    useEffect(() => {
        carregarDadosDropdowns()
        if (abaAtiva === 'listar') {
            carregarOperacoes()
        }
    }, [abaAtiva])

    // Carregar operações quando mudar para aba de cadastrar para popular o dropdown
    useEffect(() => {
        if (abaAtiva === 'cadastrar') {
            carregarOperacoes()
        }
    }, [abaAtiva])

    const carregarDadosDropdowns = async () => {
        try {
            // Carregar produtos
            const produtosData = await produtosAPI.listar()
            setProdutos(produtosData.map((p: any) => ({ id: p.id, nome: p.nome })))

            // Carregar modelos
            const modelosData = await modelosAPI.listarTodos()
            setModelos(modelosData.map((m: any) => ({ id: m.id, nome: m.nome })))

            // Carregar linhas
            const linhasData = await linhasAPI.listarTodos()
            setLinhas(linhasData.map((l: any) => ({ linha_id: l.linha_id, nome: l.nome })))

            // Carregar postos
            const postosData = await postosAPI.listarTodos()
            setPostos(postosData.map((p: any) => ({ posto_id: p.posto_id, nome: p.nome })))

            // Carregar totens
            const totensData = await postosAPI.listarTotensDisponiveis()
            setTotensDisponiveis(totensData)
        } catch (error) {
            console.error('Erro ao carregar dados dos dropdowns:', error)
        }
    }

    const carregarOperacoes = async () => {
        try {
            setCarregando(true)
            setErro(null)
            const dados = await operacoesAPI.listarTodos()
            setOperacoes(dados.map((op: any) => ({
                id: op.id,
                operacao: op.operacao,
                produto: op.produto,
                modelo: op.modelo,
                linha: op.linha,
                posto: op.posto,
                totens: op.totens || [],
                pecas: op.pecas || [],
                codigos: op.codigos || []
            })))
        } catch (error) {
            console.error('Erro ao carregar operações:', error)
            setErro(error instanceof Error ? error.message : 'Erro ao carregar operações')
        } finally {
            setCarregando(false)
        }
    }

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
        setOperacaoSelecionadaId('')
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

    const carregarDadosOperacao = async (operacaoId: string) => {
        if (!operacaoId) {
            limparFormulario()
            return
        }

        try {
            setCarregando(true)
            const dados = await operacoesAPI.buscarPorId(parseInt(operacaoId))
            
            if (dados && !dados.erro) {
                setOperacao(dados.operacao || '')
                setProduto(dados.produto || '')
                setModelo(dados.modelo || '')
                setLinha(dados.linha || '')
                setPosto(dados.posto || '')
                setTotens(dados.totens || [])
                setPecas(dados.pecas || [])
                setCodigos(dados.codigos || [])
                setOperacaoEditandoId(operacaoId)
            } else {
                alert('Erro ao carregar dados da operação')
                limparFormulario()
            }
        } catch (error) {
            console.error('Erro ao carregar dados da operação:', error)
            alert(`Erro ao carregar dados da operação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            limparFormulario()
        } finally {
            setCarregando(false)
        }
    }

    const handleSelecionarOperacao = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const operacaoId = e.target.value
        setOperacaoSelecionadaId(operacaoId)
        if (operacaoId) {
            carregarDadosOperacao(operacaoId)
        } else {
            limparFormulario()
        }
    }

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!operacao.trim() || !produto || !modelo || !linha || !posto) {
            alert('Preencha todos os campos obrigatórios')
            return
        }

        try {
            setErro(null)
            setCarregando(true)

            const dadosOperacao = {
                operacao: operacao.trim(),
                produto,
                modelo,
                linha,
                posto,
                totens: totens.length > 0 ? totens : undefined,
                pecas: pecas.length > 0 ? pecas : undefined,
                codigos: codigos.length > 0 ? codigos : undefined
            }

            if (operacaoEditandoId) {
                // Atualizar operação existente
                await operacoesAPI.atualizar(parseInt(operacaoEditandoId), dadosOperacao)
                alert('Operação atualizada com sucesso!')
            } else {
                // Criar nova operação
                await operacoesAPI.criar(dadosOperacao)
                alert('Operação cadastrada com sucesso!')
            }

            limparFormulario()
            setAbaAtiva('listar')
            await carregarOperacoes()
        } catch (error) {
            console.error('Erro ao salvar operação:', error)
            setErro(error instanceof Error ? error.message : 'Erro ao salvar operação')
            alert(`Erro: ${error instanceof Error ? error.message : 'Erro ao salvar operação'}`)
        } finally {
            setCarregando(false)
        }
    }

    const handleRemoverOperacao = async (operacaoId: string) => {
        if (!window.confirm('Tem certeza que deseja remover esta operação?')) {
            return
        }

        try {
            setErro(null)
            await operacoesAPI.deletar(parseInt(operacaoId))
            alert('Operação removida com sucesso!')
            await carregarOperacoes()
        } catch (error) {
            console.error('Erro ao remover operação:', error)
            setErro(error instanceof Error ? error.message : 'Erro ao remover operação')
            alert(`Erro: ${error instanceof Error ? error.message : 'Erro ao remover operação'}`)
        }
    }

    const handleEditarOperacao = (op: Operacao) => {
        setOperacaoSelecionadaId(op.id)
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
                                                    Selecionar Operação Existente
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                                    value={operacaoSelecionadaId}
                                                    onChange={handleSelecionarOperacao}
                                                >
                                                    <option value="">Selecione uma operação para editar ou deixe em branco para criar nova</option>
                                                    {operacoes.map((op) => (
                                                        <option key={op.id} value={op.id}>{op.operacao}</option>
                                                    ))}
                                                </select>
                                            </div>

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
                                                        <option key={p.id} value={p.nome}>{p.nome}</option>
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
                                                        <option key={m.id} value={m.nome}>{m.nome}</option>
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
                                                        <option key={l.linha_id} value={l.nome}>{l.nome}</option>
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
                                                        <option key={p.posto_id} value={p.nome}>{p.nome}</option>
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
                                                            <option key={t.id} value={t.nome}>{t.nome}</option>
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
                                                disabled={!operacao.trim() || !produto || !modelo || !linha || !posto || carregando}
                                            >
                                                {carregando ? 'Salvando...' : (operacaoEditandoId ? 'Atualizar' : 'Salvar')}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        {erro && (
                                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                                {erro}
                                            </div>
                                        )}
                                        {carregando ? null : operacoes.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operação</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Totens</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peças</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Códigos</th>
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
                                                                <td className="px-4 py-4 text-sm text-gray-900">
                                                                    {op.totens && op.totens.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {op.totens.map((toten, idx) => (
                                                                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                                                    {toten}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-gray-900">
                                                                    {op.pecas && op.pecas.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {op.pecas.map((peca, idx) => (
                                                                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                                                    {peca}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-gray-900">
                                                                    {op.codigos && op.codigos.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {op.codigos.map((codigo, idx) => (
                                                                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                                                                    {codigo}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
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
