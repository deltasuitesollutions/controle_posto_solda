import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { operacoesAPI, produtosAPI, modelosAPI, linhasAPI, postosAPI, sublinhasAPI, pecasAPI } from '../api/api'

interface Operacao {
    id: string
    operacao: string
    produto: string
    modelo: string
    linha: string
    posto: string
    totens: string[]
    pecas: string[]
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

interface Sublinha {
    sublinha_id: number
    linha_id: number
    nome: string
    linha_nome?: string
}

interface LinhaComSublinha {
    linha_id: number
    linha_nome: string
    sublinha_id: number
    sublinha_nome: string
    display: string
}

interface Peca {
    id: number
    codigo: string
    nome: string
    modelo_id: number
}

interface Posto {
    posto_id: number
    nome: string
}

interface Toten {
    id: number
    nome: string
    serial?: string
    nome?: string
    dispositivo_id?: number
}

const Operacoes = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [operacoes, setOperacoes] = useState<Operacao[]>([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)
    const [operacaoParaRemover, setOperacaoParaRemover] = useState<Operacao | null>(null)

    const [operacao, setOperacao] = useState('')
    const [produto, setProduto] = useState('')
    const [modelo, setModelo] = useState('')
    const [linha, setLinha] = useState('')
    const [posto, setPosto] = useState('')
    const [totens, setTotens] = useState<string[]>([])
    const [pecas, setPecas] = useState<string[]>([])
    const [totenTemp, setTotenTemp] = useState('')
    const [pecaTemp, setPecaTemp] = useState('')
    const [operacaoEditandoId, setOperacaoEditandoId] = useState<string | null>(null)

    // Dados para os dropdowns
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [linhasComSublinhas, setLinhasComSublinhas] = useState<LinhaComSublinha[]>([])
    const [postos, setPostos] = useState<Posto[]>([])
    const [totensDisponiveis, setTotensDisponiveis] = useState<Toten[]>([])
    const [pecasDisponiveis, setPecasDisponiveis] = useState<Peca[]>([])

    // Carregar dados ao montar o componente
    useEffect(() => {
        carregarDadosDropdowns()
        if (abaAtiva === 'listar') {
            carregarOperacoes()
        }
    }, [abaAtiva])

    // Carregar peças quando modelo mudar
    useEffect(() => {
        if (modelo) {
            carregarPecasPorModelo()
            // Limpar peças selecionadas quando modelo mudar
            setPecas([])
            setPecaTemp('')
        } else {
            setPecasDisponiveis([])
            setPecas([])
            setPecaTemp('')
        }
    }, [modelo])

    const carregarDadosDropdowns = async () => {
        try {
            // Carregar produtos
            const produtosData = await produtosAPI.listar()
            setProdutos(produtosData.map((p: any) => ({ id: p.id, nome: p.nome })))

            // Carregar modelos
            const modelosData = await modelosAPI.listarTodos()
            setModelos(modelosData.map((m: any) => ({ id: m.id, nome: m.nome })))

            // Carregar linhas e sublinhas
            await carregarLinhasComSublinhas()

            // Carregar postos
            const postosData = await postosAPI.listarTodos()
            setPostos(postosData.map((p: any) => ({ posto_id: p.posto_id, nome: p.nome })))

            // Carregar totens (usuários Raspberry)
            const totensData = await postosAPI.listarUsuariosRaspberry()
            console.log('Totens carregados:', totensData)
            if (Array.isArray(totensData)) {
                setTotensDisponiveis(totensData)
            } else {
                console.warn('Totens não retornou um array:', totensData)
                setTotensDisponiveis([])
            }
        } catch (error) {
            console.error('Erro ao carregar dados dos dropdowns:', error)
            setTotensDisponiveis([])
        }
    }

    const carregarLinhasComSublinhas = async () => {
        try {
            // Carregar linhas
            const linhasData = await linhasAPI.listarTodos()
            
            // Carregar sublinhas com informações de linha
            const sublinhasData = await sublinhasAPI.listarTodos(true)
            
            // Combinar linhas e sublinhas
            const linhasComSublinhasList: LinhaComSublinha[] = []
            
            // Adicionar linhas sem sublinhas
            for (const linha of linhasData) {
                const sublinhasDaLinha = sublinhasData.filter((s: Sublinha) => s.linha_id === linha.linha_id)
                
                if (sublinhasDaLinha.length === 0) {
                    // Linha sem sublinhas
                    linhasComSublinhasList.push({
                        linha_id: linha.linha_id,
                        linha_nome: linha.nome,
                        sublinha_id: 0,
                        sublinha_nome: '',
                        display: linha.nome
                    })
                } else {
                    // Linha com sublinhas
                    for (const sublinha of sublinhasDaLinha) {
                        linhasComSublinhasList.push({
                            linha_id: linha.linha_id,
                            linha_nome: linha.nome,
                            sublinha_id: sublinha.sublinha_id,
                            sublinha_nome: sublinha.nome,
                            display: `${linha.nome} - ${sublinha.nome}`
                        })
                    }
                }
            }
            
            setLinhasComSublinhas(linhasComSublinhasList)
        } catch (error) {
            console.error('Erro ao carregar linhas com sublinhas:', error)
        }
    }

    const carregarPecasPorModelo = async () => {
        try {
            if (!modelo) {
                setPecasDisponiveis([])
                return
            }

            // Encontrar o modelo selecionado
            const modeloSelecionado = modelos.find(m => m.nome === modelo)
            if (!modeloSelecionado) {
                setPecasDisponiveis([])
                return
            }

            // Buscar peças do modelo
            const pecasData = await pecasAPI.buscarPorModelo(modeloSelecionado.id)
            setPecasDisponiveis(pecasData.map((p: any) => ({
                id: p.id,
                codigo: p.codigo,
                nome: p.nome,
                modelo_id: p.modelo_id
            })))
        } catch (error) {
            console.error('Erro ao carregar peças do modelo:', error)
            setPecasDisponiveis([])
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
                serial: op.serial || '',
                nome: op.nome || ''
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
        if (!pecaTemp.trim()) return
        
        // pecaTemp está no formato "nome|codigo"
        const [nome, codigo] = pecaTemp.split('|')
        if (!nome || !codigo) return
        
        const display = `${nome} - ${codigo}`
        
        // Verificar se já existe (comparar pelo display completo)
        if (pecas.includes(display)) return
        
        setPecas([...pecas, display])
        setPecaTemp('')
    }

    const removerPeca = (index: number) => {
        setPecas(pecas.filter((_, i) => i !== index))
    }

    const limparFormulario = () => {
        setOperacao('')
        setProduto('')
        setModelo('')
        setLinha('')
        setPosto('')
        setTotens([])
        setPecas([])
        setTotenTemp('')
        setPecaTemp('')
        setOperacaoEditandoId(null)
    }


    const extrairNomeLinha = (display: string): string => {
        // Se o display contém " - ", extrair apenas a parte da linha (antes do " - ")
        // Caso contrário, retornar o display completo
        if (display.includes(' - ')) {
            return display.split(' - ')[0]
        }
        return display
    }

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!operacao.trim() || !produto || !modelo || !linha || !posto) {
            setTituloErro('Erro!')
            setMensagemErro('Preencha todos os campos obrigatórios')
            setModalErroAberto(true)
            return
        }

        try {
            setErro(null)
            setCarregando(true)

            // Extrair apenas o nome da linha do display
            const nomeLinha = extrairNomeLinha(linha)

            const dadosOperacao = {
                operacao: operacao.trim(),
                produto,
                modelo,
                linha: nomeLinha,
                posto,
                totens: totens.length > 0 ? totens : undefined,
                pecas: pecas.length > 0 ? pecas : undefined
            }

            if (operacaoEditandoId) {
                // Atualizar operação existente
                await operacoesAPI.atualizar(parseInt(operacaoEditandoId), dadosOperacao)
                setMensagemSucesso('Operação atualizada com sucesso!')
                setModalSucessoAberto(true)
            } else {
                // Criar nova operação
                await operacoesAPI.criar(dadosOperacao)
                setMensagemSucesso('Operação cadastrada com sucesso!')
                setModalSucessoAberto(true)
            }

            limparFormulario()
            setAbaAtiva('listar')
            await carregarOperacoes()
        } catch (error) {
            console.error('Erro ao salvar operação:', error)
            const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar operação'
            setErro(errorMessage)
            setTituloErro('Erro!')
            setMensagemErro(`Erro: ${errorMessage}`)
            setModalErroAberto(true)
        } finally {
            setCarregando(false)
        }
    }

    const abrirModalRemover = (op: Operacao) => {
        setOperacaoParaRemover(op)
        setModalConfirmacaoAberto(true)
    }

    const handleRemoverOperacao = async () => {
        if (!operacaoParaRemover) return

        try {
            setErro(null)
            await operacoesAPI.deletar(parseInt(operacaoParaRemover.id))
            setMensagemSucesso('Operação removida com sucesso!')
            setModalSucessoAberto(true)
            await carregarOperacoes()
        } catch (error) {
            console.error('Erro ao remover operação:', error)
            const msg = error instanceof Error ? error.message : 'Erro ao remover operação'
            setErro(msg)
            setTituloErro('Erro!')
            setMensagemErro(`Erro: ${msg}`)
            setModalErroAberto(true)
        } finally {
            setOperacaoParaRemover(null)
        }
    }

    const handleEditarOperacao = async (op: Operacao) => {
        // Garantir que as linhas com sublinhas estejam carregadas
        if (linhasComSublinhas.length === 0) {
            await carregarLinhasComSublinhas()
        }
        
        setOperacao(op.operacao)
        setProduto(op.produto)
        setModelo(op.modelo)
        
        // Encontrar o display correspondente ao nome da linha salvo
        // Se a linha salva for apenas o nome, tentar encontrar o display completo
        const linhaSalva = op.linha
        const linhaEncontrada = linhasComSublinhas.find(l => 
            l.linha_nome === linhaSalva || l.display === linhaSalva
        )
        // Se encontrou, usar o display. Se não, usar o primeiro item que corresponde à linha
        // ou apenas o nome da linha se não houver sublinhas
        if (linhaEncontrada) {
            setLinha(linhaEncontrada.display)
        } else {
            // Tentar encontrar qualquer item com o mesmo nome de linha
            const primeiraLinha = linhasComSublinhas.find(l => l.linha_nome === linhaSalva)
            setLinha(primeiraLinha ? primeiraLinha.display : linhaSalva)
        }
        
        setPosto(op.posto)
        setTotens([...op.totens])
        setPecas([...op.pecas])
        setOperacaoEditandoId(op.id)
        setAbaAtiva('cadastrar')
        
        // Carregar peças do modelo se houver modelo selecionado
        if (op.modelo) {
            const modeloSelecionado = modelos.find(m => m.nome === op.modelo)
            if (modeloSelecionado) {
                await carregarPecasPorModelo()
            }
        }
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
                                                    {linhasComSublinhas.map((l) => (
                                                        <option key={`${l.linha_id}-${l.sublinha_id}`} value={l.display}>
                                                            {l.display}
                                                        </option>
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
                                                        <option value="">
                                                            {totensDisponiveis.length === 0 
                                                                ? 'Nenhum toten disponível' 
                                                                : 'Selecione'}
                                                        </option>
                                                        {totensDisponiveis.map((t) => (
                                                            <option key={t.id} value={t.nome}>
                                                                {t.nome} {t.serial ? `(Serial: ${t.serial})` : ''}
                                                            </option>
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
                                                    <select
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={pecaTemp}
                                                        onChange={(e) => setPecaTemp(e.target.value)}
                                                        disabled={!modelo || pecasDisponiveis.length === 0}
                                                    >
                                                        <option value="">
                                                            {!modelo 
                                                                ? 'Selecione um modelo primeiro' 
                                                                : pecasDisponiveis.length === 0 
                                                                ? 'Nenhuma peça disponível para este modelo'
                                                                : 'Selecione uma peça'}
                                                        </option>
                                                        {pecasDisponiveis.map((p) => {
                                                            const display = `${p.nome} - ${p.codigo}`
                                                            const value = `${p.nome}|${p.codigo}`
                                                            return (
                                                                <option key={p.id} value={value}>
                                                                    {display}
                                                                </option>
                                                            )
                                                        })}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={adicionarPeca}
                                                        disabled={!pecaTemp.trim()}
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
                                                                <td className="px-4 py-4 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarOperacao(op)}
                                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                        >
                                                                            <i className="bi bi-pencil"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => abrirModalRemover(op)}
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

            <ModalSucesso
                isOpen={modalSucessoAberto}
                onClose={() => setModalSucessoAberto(false)}
                mensagem={mensagemSucesso}
                titulo="Sucesso!"
            />

            <ModalErro
                isOpen={modalErroAberto}
                onClose={() => setModalErroAberto(false)}
                mensagem={mensagemErro}
                titulo={tituloErro}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false)
                    setOperacaoParaRemover(null)
                }}
                onConfirm={handleRemoverOperacao}
                titulo="Remover Operação"
                mensagem="Tem certeza que deseja remover esta operação?"
                textoConfirmar="Remover"
                textoCancelar="Cancelar"
                corHeader="vermelho"
                item={operacaoParaRemover ? {
                    Operação: operacaoParaRemover.operacao,
                    Produto: operacaoParaRemover.produto,
                    Modelo: operacaoParaRemover.modelo,
                    Linha: operacaoParaRemover.linha,
                    Posto: operacaoParaRemover.posto
                } : undefined}
            />
        </div>
    )
}

export default Operacoes
