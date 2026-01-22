import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { produtosAPI, modelosAPI, pecasAPI } from '../api/api'

interface Produto {
    id: number
    nome: string
}

interface Modelo {
    id: number
    nome: string
    produto_id?: number
}

const CadastroProdutoModelo = () => {
    const [abaAtiva, setAbaAtiva] = useState<'produto-modelo' | 'pecas'>('produto-modelo')
    
    // Estados para aba Produto/Modelo
    const [modoCadastro, setModoCadastro] = useState<'novo' | 'existente'>('novo')
    const [produtoNome, setProdutoNome] = useState('')
    const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<number | null>(null)
    const [modeloNome, setModeloNome] = useState('')
    const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([])
    const [mostrarModalErroProdutoModelo, setMostrarModalErroProdutoModelo] = useState(false)
    const [mensagemErroProdutoModelo, setMensagemErroProdutoModelo] = useState('')
    const [mostrarModalSucessoProdutoModelo, setMostrarModalSucessoProdutoModelo] = useState(false)
    const [carregando, setCarregando] = useState(false)
    const [carregandoProdutos, setCarregandoProdutos] = useState(false)

    // Estados para aba Peças
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [produtoSelecionado, setProdutoSelecionado] = useState<number | null>(null)
    const [modeloSelecionado, setModeloSelecionado] = useState<number | null>(null)
    const [pecaCodigo, setPecaCodigo] = useState('')
    const [pecaNome, setPecaNome] = useState('')
    const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false)
    const [mostrarModalErro, setMostrarModalErro] = useState(false)
    const [mensagemModal, setMensagemModal] = useState('')
    const [erroPeca, setErroPeca] = useState<string | null>(null)
    const [carregandoPeca, setCarregandoPeca] = useState(false)

    // Carregar produtos e modelos quando mudar para aba de peças
    useEffect(() => {
        if (abaAtiva === 'pecas') {
            carregarProdutos()
            carregarModelos()
        }
    }, [abaAtiva])

    // Carregar produtos e modelos disponíveis quando entrar na aba de produto/modelo
    useEffect(() => {
        if (abaAtiva === 'produto-modelo') {
            carregarProdutosDisponiveis()
            carregarModelos()
        }
    }, [abaAtiva])

    // Limpar campo de modelo quando produto for apagado (modo novo)
    useEffect(() => {
        if (modoCadastro === 'novo' && !produtoNome.trim()) {
            setModeloNome('')
        }
    }, [produtoNome, modoCadastro])

    // Limpar campo de modelo quando produto for deselecionado (modo existente)
    useEffect(() => {
        if (modoCadastro === 'existente' && !produtoSelecionadoId) {
            setModeloNome('')
        }
    }, [produtoSelecionadoId, modoCadastro])

    // Filtrar modelos quando produto for selecionado
    useEffect(() => {
        if (produtoSelecionado) {
            const modelosDoProduto = modelos.filter(m => m.produto_id === produtoSelecionado)
            if (modelosDoProduto.length === 0) {
                setModeloSelecionado(null)
            }
        } else {
            setModeloSelecionado(null)
        }
    }, [produtoSelecionado, modelos])

    const carregarProdutos = async () => {
        try {
            const dados = await produtosAPI.listar()
            setProdutos(dados)
        } catch (err) {
            console.error('Erro ao carregar produtos:', err)
        }
    }

    const carregarModelos = async () => {
        try {
            const dados = await modelosAPI.listarTodos()
            setModelos(dados)
        } catch (err) {
            console.error('Erro ao carregar modelos:', err)
        }
    }

    const carregarProdutosDisponiveis = async () => {
        try {
            setCarregandoProdutos(true)
            const dados = await produtosAPI.listar()
            setProdutosDisponiveis(dados)
        } catch (err) {
            console.error('Erro ao carregar produtos:', err)
        } finally {
            setCarregandoProdutos(false)
        }
    }

    const modelosFiltrados = produtoSelecionado 
        ? modelos.filter(m => m.produto_id === produtoSelecionado)
        : []

    // Função para finalizar cadastro (criar produto e modelo)
    const handleFinalizarCadastro = async () => {
        setCarregando(true)

        try {
            let produtoId: number | null = null

            // Obter ou criar produto
            if (modoCadastro === 'novo') {
                if (!produtoNome.trim()) {
                    setMensagemErroProdutoModelo('Nome do produto é obrigatório')
                    setMostrarModalErroProdutoModelo(true)
                    setCarregando(false)
                    return
                }

                // Verificar se produto já existe (case-insensitive)
                const produtoExiste = produtosDisponiveis.some(
                    p => p.nome.toLowerCase().trim() === produtoNome.toLowerCase().trim()
                )

                if (produtoExiste) {
                    setMensagemErroProdutoModelo('Produto já cadastrado')
                    setMostrarModalErroProdutoModelo(true)
                    setCarregando(false)
                    return
                }

                try {
                    const novoProduto = await produtosAPI.criar({ nome: produtoNome.trim() })
                    produtoId = novoProduto.id || novoProduto.produto_id

                    if (!produtoId) {
                        setMensagemErroProdutoModelo('Não foi possível criar o produto')
                        setMostrarModalErroProdutoModelo(true)
                        setCarregando(false)
                        return
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : ''
                    // Verificar se é erro de duplicação
                    if (errorMessage.includes('duplicar') || errorMessage.includes('já existe') || errorMessage.includes('unicidade')) {
                        setMensagemErroProdutoModelo('Produto já cadastrado')
                    } else {
                        setMensagemErroProdutoModelo('Não foi possível criar o produto')
                    }
                    setMostrarModalErroProdutoModelo(true)
                    setCarregando(false)
                    return
                }
            } else {
                if (!produtoSelecionadoId) {
                    setMensagemErroProdutoModelo('Selecione um produto')
                    setMostrarModalErroProdutoModelo(true)
                    setCarregando(false)
                    return
                }
                produtoId = produtoSelecionadoId
            }

            // Validar modelo
            if (!modeloNome.trim()) {
                setMensagemErroProdutoModelo('Nome do modelo é obrigatório')
                setMostrarModalErroProdutoModelo(true)
                setCarregando(false)
                return
            }

            // Verificar se modelo já existe para este produto (case-insensitive)
            const modelosDoProduto = modelos.filter(m => m.produto_id === produtoId)
            const modeloExiste = modelosDoProduto.some(
                m => m.nome.toLowerCase().trim() === modeloNome.toLowerCase().trim()
            )

            if (modeloExiste) {
                setMensagemErroProdutoModelo('Modelo já cadastrado')
                setMostrarModalErroProdutoModelo(true)
                setCarregando(false)
                return
            }

            // Criar modelo
            try {
                const novoModelo = await modelosAPI.criar({ 
                    nome: modeloNome.trim(),
                    produto_id: produtoId
                })

                const modeloId = novoModelo.id || novoModelo.modelo_id
                if (!modeloId) {
                    setMensagemErroProdutoModelo('Não foi possível criar o modelo')
                    setMostrarModalErroProdutoModelo(true)
                    setCarregando(false)
                    return
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : ''
                // Verificar se é erro de duplicação
                if (errorMessage.includes('duplicar') || errorMessage.includes('já existe') || errorMessage.includes('unicidade') || errorMessage.includes('modelos_nome_key')) {
                    setMensagemErroProdutoModelo('Modelo já cadastrado')
                } else {
                    setMensagemErroProdutoModelo('Não foi possível criar o modelo')
                }
                setMostrarModalErroProdutoModelo(true)
                setCarregando(false)
                return
            }

            // Recarregar dados
            await carregarProdutosDisponiveis()
            await carregarProdutos()
            await carregarModelos()

            // Limpar formulário
            setModoCadastro('novo')
            setProdutoNome('')
            setProdutoSelecionadoId(null)
            setModeloNome('')
            
            // Mostrar modal de sucesso
            setMostrarModalSucessoProdutoModelo(true)
        } catch (err) {
            console.error('Erro ao salvar:', err)
            const errorMessage = err instanceof Error ? err.message : ''
            // Verificar se é erro de duplicação
            if (errorMessage.includes('duplicar') || errorMessage.includes('já existe') || errorMessage.includes('unicidade')) {
                setMensagemErroProdutoModelo('Produto ou Modelo já cadastrado')
            } else {
                setMensagemErroProdutoModelo('Erro ao salvar cadastro')
            }
            setMostrarModalErroProdutoModelo(true)
        } finally {
            setCarregando(false)
        }
    }

    // Função para salvar Peça
    const handleSalvarPeca = async () => {
        setErroPeca(null)
        setCarregandoPeca(true)

        try {
            if (!modeloSelecionado) {
                setErroPeca('Selecione um modelo')
                setCarregandoPeca(false)
                return
            }

            if (!pecaCodigo.trim() || !pecaNome.trim()) {
                setErroPeca('Preencha código e nome da peça')
                setCarregandoPeca(false)
                return
            }

            await pecasAPI.criar({
                modelo_id: modeloSelecionado,
                codigo: pecaCodigo.trim(),
                nome: pecaNome.trim()
            })

            setMensagemModal('Peça cadastrada com sucesso!')
            setMostrarModalSucesso(true)
            
            // Limpar formulário
            setPecaCodigo('')
            setPecaNome('')
        } catch (err) {
            console.error('Erro ao salvar peça:', err)
            const mensagemErro = err instanceof Error ? err.message : 'Erro ao cadastrar peça'
            setMensagemModal(mensagemErro)
            setMostrarModalErro(true)
        } finally {
            setCarregandoPeca(false)
        }
    }

    const fecharModal = () => {
        setMostrarModalSucesso(false)
        setMostrarModalErro(false)
        setMensagemModal('')
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="w-full">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Abas */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setAbaAtiva('produto-modelo')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'produto-modelo'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'produto-modelo' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-box-seam mr-2"></i>
                                    Cadastrar Produto/Modelo
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('pecas')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'pecas'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'pecas' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-boxes mr-2"></i>
                                    Cadastrar Peças
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'produto-modelo' ? (
                                    // ABA 1: Cadastro de Produto e Modelo
                                    <div className="space-y-6">

                                        {/* Passo 1: Seleção/Criação de Produto */}
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex items-center justify-center w-8 h-8 bg-gray-600 text-white rounded-full font-bold text-sm">
                                                    1
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-200 rounded-lg">
                                                        <i className="bi bi-box text-gray-700"></i>
                                                    </div>
                                                    <h4 className="text-base font-semibold text-gray-800">
                                                        Produto
                                                    </h4>
                                                </div>
                                            </div>
                                            
                                            {/* Toggle entre novo e existente */}
                                            <div className="mb-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModoCadastro('novo')
                                                            setProdutoSelecionadoId(null)
                                                            setProdutoNome('')
                                                        }}
                                                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                                            modoCadastro === 'novo'
                                                                ? 'bg-gray-600 text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                    >
                                                        <i className="bi bi-plus-circle mr-2"></i>
                                                        Novo Produto
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModoCadastro('existente')
                                                            setProdutoNome('')
                                                        }}
                                                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                                            modoCadastro === 'existente'
                                                                ? 'bg-gray-600 text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                    >
                                                        <i className="bi bi-list-ul mr-2"></i>
                                                        Produto Existente
                                                    </button>
                                                </div>
                                            </div>

                                            {modoCadastro === 'novo' ? (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Nome do Produto <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                                                        placeholder="Ex: Produto A"
                                                        value={produtoNome}
                                                        onChange={(e) => setProdutoNome(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Selecione o Produto <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={produtoSelecionadoId || ''}
                                                        onChange={(e) => {
                                                            const id = e.target.value ? parseInt(e.target.value) : null
                                                            setProdutoSelecionadoId(id)
                                                            setModelosAdicionados([])
                                                        }}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                                                        disabled={carregandoProdutos}
                                                    >
                                                        <option value="">Selecione um produto</option>
                                                        {produtosDisponiveis.map((produto) => (
                                                            <option key={produto.id} value={produto.id}>
                                                                {produto.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Passo 2: Adicionar Modelos */}
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex items-center justify-center w-8 h-8 bg-gray-600 text-white rounded-full font-bold text-sm">
                                                    2
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-200 rounded-lg">
                                                        <i className="bi bi-box-seam text-gray-700"></i>
                                                    </div>
                                                    <h4 className="text-base font-semibold text-gray-800">
                                                        Modelos do Produto
                                                    </h4>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nome do Modelo <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    placeholder="Ex: Modelo X"
                                                    value={modeloNome}
                                                    onChange={(e) => setModeloNome(e.target.value)}
                                                    disabled={
                                                        (modoCadastro === 'novo' && !produtoNome.trim()) ||
                                                        (modoCadastro === 'existente' && !produtoSelecionadoId)
                                                    }
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && !carregando) {
                                                            e.preventDefault()
                                                            handleFinalizarCadastro()
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Botão Finalizar */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={handleFinalizarCadastro}
                                                disabled={
                                                    carregando ||
                                                    !modeloNome.trim() ||
                                                    ((modoCadastro === 'novo' && !produtoNome.trim()) ||
                                                    (modoCadastro === 'existente' && !produtoSelecionadoId))
                                                }
                                                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                            >
                                                {carregando ? (
                                                    <>
                                                        <i className="bi bi-arrow-repeat animate-spin"></i>
                                                        <span>Salvando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle-fill"></i>
                                                        <span>Finalizar Cadastro</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // ABA 2: Cadastro de Peças
                                    <div className="space-y-6">
                                        {/* Mensagem de erro */}
                                        {erroPeca && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <i className="bi bi-exclamation-triangle"></i>
                                                    <span>{erroPeca}</span>
                                                    <button
                                                        onClick={() => setErroPeca(null)}
                                                        className="ml-auto text-red-500 hover:text-red-700"
                                                    >
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Seleção de Produto e Modelo */}
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Produto <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={produtoSelecionado || ''}
                                                        onChange={(e) => setProdutoSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                                                    >
                                                        <option value="">Selecione um produto</option>
                                                        {produtos.map((produto) => (
                                                            <option key={produto.id} value={produto.id}>
                                                                {produto.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Modelo <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={modeloSelecionado || ''}
                                                        onChange={(e) => setModeloSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        disabled={!produtoSelecionado || modelosFiltrados.length === 0}
                                                    >
                                                        <option value="">
                                                            {!produtoSelecionado 
                                                                ? 'Selecione um produto primeiro'
                                                                : modelosFiltrados.length === 0
                                                                ? 'Nenhum modelo encontrado'
                                                                : 'Selecione um modelo'}
                                                        </option>
                                                        {modelosFiltrados.map((modelo) => (
                                                            <option key={modelo.id} value={modelo.id}>
                                                                {modelo.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Formulário de Peça */}
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-1.5 bg-gray-200 rounded-lg">
                                                    <i className="bi bi-boxes text-gray-700"></i>
                                                </div>
                                                <h4 className="text-base font-semibold text-gray-800">
                                                    Cadastrar Peça
                                                </h4>
                                            </div>

                                            <form onSubmit={(e) => {
                                                e.preventDefault()
                                                handleSalvarPeca()
                                            }}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Código da Peça <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            placeholder="Ex: PEC001"
                                                            value={pecaCodigo}
                                                            onChange={(e) => setPecaCodigo(e.target.value)}
                                                            disabled={!modeloSelecionado}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Nome da Peça <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            placeholder="Ex: Peça A"
                                                            value={pecaNome}
                                                            onChange={(e) => setPecaNome(e.target.value)}
                                                            disabled={!modeloSelecionado}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={carregandoPeca || !modeloSelecionado || !pecaCodigo.trim() || !pecaNome.trim()}
                                                        className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                                                        style={{ backgroundColor: 'var(--bg-azul)' }}
                                                    >
                                                        {carregandoPeca ? (
                                                            <>
                                                                <i className="bi bi-arrow-repeat animate-spin"></i>
                                                                <span>Salvando...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-plus-circle-fill"></i>
                                                                <span>Cadastrar Peça</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Sucesso */}
            {mostrarModalSucesso && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={fecharModal}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                                <i className="bi bi-check-circle-fill text-green-600 text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Sucesso!</h3>
                        </div>
                        <p className="text-gray-600 mb-6">{mensagemModal}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={fecharModal}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Erro - Produto/Modelo */}
            <ModalErro
                isOpen={mostrarModalErroProdutoModelo}
                onClose={() => setMostrarModalErroProdutoModelo(false)}
                mensagem={mensagemErroProdutoModelo}
            />

            {/* Modal de Sucesso - Produto/Modelo */}
            <ModalSucesso
                isOpen={mostrarModalSucessoProdutoModelo}
                onClose={() => setMostrarModalSucessoProdutoModelo(false)}
                mensagem="Produto/Modelo cadastrado com sucesso"
            />

            {/* Modal de Erro */}
            {mostrarModalErro && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={fecharModal}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                                <i className="bi bi-exclamation-triangle-fill text-red-600 text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Atenção!</h3>
                        </div>
                        <p className="text-gray-600 mb-6">{mensagemModal}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={fecharModal}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CadastroProdutoModelo
