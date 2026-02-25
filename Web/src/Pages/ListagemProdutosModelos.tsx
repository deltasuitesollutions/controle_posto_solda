import { useState, useEffect, useMemo } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { modelosAPI, produtosAPI } from '../api/api'

interface Modelo {
    id: number
    nome: string
    codigo?: string
    produto_id?: number
    data_criacao?: string
}

interface Produto {
    id: number
    nome: string
    data_criacao?: string
    modelos?: Modelo[]
}

const ListagemProdutosModelos = () => {
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [filtroProduto, setFiltroProduto] = useState('')
    const [filtroModelo, setFiltroModelo] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [erro, setErro] = useState<string | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [modalEdicaoProdutoAberto, setModalEdicaoProdutoAberto] = useState(false)
    const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
    const [modalEdicaoModeloAberto, setModalEdicaoModeloAberto] = useState(false)
    const [modeloEditando, setModeloEditando] = useState<Modelo | null>(null)
    const [modalConfirmacao, setModalConfirmacao] = useState(false)
    const [itemParaDeletar, setItemParaDeletar] = useState<{ tipo: 'produto' | 'modelo'; item: Produto | Modelo } | null>(null)
    const [modalErroDuplicado, setModalErroDuplicado] = useState(false)
    const [mensagemErroDuplicado, setMensagemErroDuplicado] = useState('')
    const [produtoExpandido, setProdutoExpandido] = useState<number | null>(null)

    const itensPorPagina = 10

    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            setCarregando(true)
            setErro(null)
            
            const [produtosData, modelosData] = await Promise.all([
                produtosAPI.listar(),
                modelosAPI.listarTodos()
            ])

            // Agrupar modelos por produto
            const produtosComModelos = produtosData.map((produto: Produto) => {
                const modelosDoProduto = modelosData.filter((modelo: Modelo) => modelo.produto_id === produto.id)
                return {
                    ...produto,
                    modelos: modelosDoProduto
                }
            })

            setProdutos(produtosComModelos)
            setModelos(modelosData)
        } catch (err) {
            console.error('Erro ao carregar dados:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao carregar dados')
        } finally {
            setCarregando(false)
        }
    }

    const produtosFiltrados = useMemo(() => {
        return produtos.filter(produto => {
            const matchProduto = !filtroProduto || produto.nome.toLowerCase().includes(filtroProduto.toLowerCase())
            
            if (!matchProduto) return false
            
            if (filtroModelo) {
                const temModeloMatch = produto.modelos?.some(modelo => 
                    modelo.nome.toLowerCase().includes(filtroModelo.toLowerCase())
                )
                return temModeloMatch || false
            }
            
            return true
        })
    }, [produtos, filtroProduto, filtroModelo])

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const produtosPaginaAtual = produtosFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroProduto, filtroModelo])

    useEffect(() => {
        const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [produtosFiltrados.length, paginaAtual])

    const limparFiltros = () => {
        setFiltroProduto('')
        setFiltroModelo('')
    }

    const formatarData = (data: string | undefined) => {
        if (!data) return '-'
        try {
            const date = new Date(data)
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        } catch {
            return data
        }
    }

    const handleEditarProduto = (produto: Produto) => {
        setProdutoEditando(produto)
        setModalEdicaoProdutoAberto(true)
    }

    const handleSalvarProduto = async (dados: Record<string, any>) => {
        if (!produtoEditando) return

        try {
            setErro(null)
            
            const nomeProduto = dados.nome_produto && dados.nome_produto.trim() !== '' 
                ? dados.nome_produto.trim() 
                : produtoEditando.nome
            
            if (!nomeProduto) {
                setErro('O nome do produto não pode estar vazio')
                return
            }

            // Verificar se o nome já existe em outro produto (ignorando o produto atual)
            const produtoExistente = produtos.find(p => 
                p.nome.toLowerCase() === nomeProduto.toLowerCase() && p.id !== produtoEditando.id
            )
            
            if (produtoExistente) {
                setMensagemErroDuplicado(`O produto "${nomeProduto}" já está cadastrado no sistema.`)
                setModalErroDuplicado(true)
                return
            }

            await produtosAPI.atualizar(produtoEditando.id, { nome: nomeProduto })
            
            await carregarDados()
            
            setModalEdicaoProdutoAberto(false)
            setProdutoEditando(null)
        } catch (err) {
            console.error('Erro ao salvar produto:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar produto')
            await carregarDados()
        }
    }

    const handleEditarModelo = (modelo: Modelo) => {
        setModeloEditando(modelo)
        setModalEdicaoModeloAberto(true)
    }

    const handleSalvarModelo = async (dados: Record<string, any>) => {
        if (!modeloEditando) return

        try {
            setErro(null)
            
            const nomeModelo = dados.nome_modelo && dados.nome_modelo.trim() !== '' 
                ? dados.nome_modelo.trim() 
                : modeloEditando.nome
            
            if (!nomeModelo) {
                setErro('O nome do modelo não pode estar vazio')
                return
            }

            // Verificar se o nome já existe em outro modelo (ignorando o modelo atual)
            const modeloExistente = modelos.find(m => 
                m.nome.toLowerCase() === nomeModelo.toLowerCase() && m.id !== modeloEditando.id
            )
            
            if (modeloExistente) {
                setMensagemErroDuplicado(`O modelo "${nomeModelo}" já está cadastrado no sistema.`)
                setModalErroDuplicado(true)
                return
            }

            const dadosModelo: { nome: string; produto_id?: number } = { nome: nomeModelo }
            if (dados.produto_id && dados.produto_id !== '') {
                dadosModelo.produto_id = Number(dados.produto_id)
            }

            await modelosAPI.atualizar(modeloEditando.id, dadosModelo)
            
            await carregarDados()
            
            setModalEdicaoModeloAberto(false)
            setModeloEditando(null)
        } catch (err) {
            console.error('Erro ao salvar modelo:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar modelo')
            await carregarDados()
        }
    }

    const handleDeletarProduto = (produto: Produto) => {
        setItemParaDeletar({ tipo: 'produto', item: produto })
        setModalConfirmacao(true)
    }

    const handleDeletarModelo = (modelo: Modelo) => {
        setItemParaDeletar({ tipo: 'modelo', item: modelo })
        setModalConfirmacao(true)
    }

    const handleConfirmarDeletar = async () => {
        if (!itemParaDeletar) return
        
        try {
            setErro(null)
            
            if (itemParaDeletar.tipo === 'produto') {
                const produto = itemParaDeletar.item as Produto
                await produtosAPI.deletar(produto.id)
            } else {
                const modelo = itemParaDeletar.item as Modelo
                await modelosAPI.deletar(modelo.id)
            }
            
            await carregarDados()
            
            setModalConfirmacao(false)
            setItemParaDeletar(null)
        } catch (err) {
            console.error('Erro ao deletar:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao deletar')
            await carregarDados()
            setModalConfirmacao(false)
        }
    }

    const toggleExpandirProduto = (produtoId: number) => {
        setProdutoExpandido(produtoExpandido === produtoId ? null : produtoId)
    }

    const temFiltros = filtroProduto || filtroModelo
    const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="flex flex-col gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="text-white px-6 py-4" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <i className="bi bi-box-seam"></i>
                                        Listagem de Produtos e Modelos
                                    </h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                            <i className="bi bi-funnel"></i>
                                            Filtros de Busca
                                        </h4>
                                        {temFiltros && (
                                            <button
                                                onClick={limparFiltros}
                                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <i className="bi bi-x-circle"></i>
                                                Limpar Filtros
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Produto
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Buscar por produto..."
                                                value={filtroProduto}
                                                onChange={(e) => setFiltroProduto(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Modelo
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Buscar por modelo..."
                                                value={filtroModelo}
                                                onChange={(e) => setFiltroModelo(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {erro && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="bi bi-exclamation-triangle"></i>
                                        <span>{erro}</span>
                                        <button
                                            onClick={() => setErro(null)}
                                            className="ml-auto text-red-500 hover:text-red-700"
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {carregando ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                        <p className="text-gray-500 text-lg font-medium">Carregando produtos e modelos...</p>
                                    </div>
                                </div>
                            ) : produtosFiltrados.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            {temFiltros 
                                                ? 'Nenhum produto encontrado com os filtros aplicados'
                                                : 'Nenhum produto cadastrado'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-8"></th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Produto</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data de Criação</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Modelos</th>
                                                        <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {produtosPaginaAtual.map((produto) => (
                                                        <>
                                                            <tr key={produto.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => toggleExpandirProduto(produto.id)}
                                                                        className="text-gray-600 hover:text-gray-800"
                                                                    >
                                                                        <i className={`bi ${produtoExpandido === produto.id ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{formatarData(produto.data_criacao)}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {produto.modelos?.length || 0} modelo(s)
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarProduto(produto)}
                                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                            title="Editar Produto"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeletarProduto(produto)}
                                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                                            title="Deletar Produto"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {produtoExpandido === produto.id && produto.modelos && produto.modelos.length > 0 && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                                        <div className="ml-8">
                                                                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Modelos do Produto:</h5>
                                                                            <table className="w-full">
                                                                                <thead>
                                                                                    <tr className="border-b border-gray-300">
                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Modelo</th>
                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Data de Criação</th>
                                                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase">Ações</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {produto.modelos.map((modelo) => (
                                                                                        <tr key={modelo.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                                                            <td className="px-4 py-2">
                                                                                                <div className="text-sm text-gray-900">{modelo.nome}</div>
                                                                                            </td>
                                                                                            <td className="px-4 py-2">
                                                                                                <div className="text-sm text-gray-900">{formatarData(modelo.data_criacao)}</div>
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-center">
                                                                                                <div className="flex items-center justify-center gap-2">
                                                                                                    <button
                                                                                                        onClick={() => handleEditarModelo(modelo)}
                                                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                                                        title="Editar Modelo"
                                                                                                    >
                                                                                                        <i className="bi bi-pencil-square"></i>
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => handleDeletarModelo(modelo)}
                                                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                                                        title="Deletar Modelo"
                                                                                                    >
                                                                                                        <i className="bi bi-trash"></i>
                                                                                                    </button>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {produtosFiltrados.length > itensPorPagina && (
                                        <Paginacao
                                            totalItens={produtosFiltrados.length}
                                            itensPorPagina={itensPorPagina}
                                            paginaAtual={paginaAtual}
                                            onPageChange={setPaginaAtual}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ModalFormulario
                isOpen={modalEdicaoProdutoAberto}
                onClose={() => {
                    setModalEdicaoProdutoAberto(false)
                    setProdutoEditando(null)
                    setErro(null)
                }}
                onSave={handleSalvarProduto}
                itemEditando={produtoEditando ? {
                    nome_produto: produtoEditando.nome
                } : null}
                tituloNovo="Novo Produto"
                tituloEditar="Editar Produto"
                campos={[
                    {
                        nome: 'nome_produto',
                        label: 'Nome do Produto',
                        tipo: 'text',
                        placeholder: 'Ex: Produto A',
                        required: true
                    }
                ]}
                textoBotao="Salvar"
                icone="bi bi-tag"
                secaoTitulo="Informações do Produto"
            />

            <ModalFormulario
                isOpen={modalEdicaoModeloAberto}
                onClose={() => {
                    setModalEdicaoModeloAberto(false)
                    setModeloEditando(null)
                    setErro(null)
                }}
                onSave={handleSalvarModelo}
                itemEditando={modeloEditando ? {
                    nome_modelo: modeloEditando.nome,
                    produto_id: modeloEditando.produto_id ? modeloEditando.produto_id.toString() : ''
                } : null}
                tituloNovo="Novo Modelo"
                tituloEditar="Editar Modelo"
                campos={[
                    {
                        nome: 'nome_modelo',
                        label: 'Nome do Modelo',
                        tipo: 'text',
                        placeholder: 'Ex: Modelo A',
                        required: true
                    },
                    {
                        nome: 'produto_id',
                        label: 'Associar a Produto',
                        tipo: 'select',
                        placeholder: 'Selecione o produto',
                        required: false,
                        opcoes: [
                            { valor: '', label: 'Nenhum' },
                            ...produtos.map(p => ({ valor: p.id.toString(), label: p.nome }))
                        ]
                    }
                ]}
                textoBotao="Salvar"
                icone="bi bi-box-seam"
                secaoTitulo="Informações do Modelo"
            />

            <ModalConfirmacao
                isOpen={modalConfirmacao}
                onClose={() => {
                    setModalConfirmacao(false)
                    setItemParaDeletar(null)
                }}
                onConfirm={handleConfirmarDeletar}
                titulo="Confirmar Exclusão"
                mensagem={
                    itemParaDeletar?.tipo === 'produto'
                        ? 'Tem certeza que deseja deletar este produto? Todos os modelos associados também serão deletados. Esta ação não pode ser desfeita.'
                        : 'Tem certeza que deseja deletar este modelo? Esta ação não pode ser desfeita.'
                }
                textoConfirmar="Deletar"
                textoCancelar="Cancelar"
                corHeader="vermelho"
                item={itemParaDeletar ? {
                    nome: itemParaDeletar.tipo === 'produto' 
                        ? (itemParaDeletar.item as Produto).nome
                        : (itemParaDeletar.item as Modelo).nome,
                    tipo: itemParaDeletar.tipo
                } : undefined}
                camposItem={['nome', 'tipo']}
                mostrarDetalhes={true}
            />

            <ModalConfirmacao
                isOpen={modalErroDuplicado}
                onClose={() => {
                    setModalErroDuplicado(false)
                    setMensagemErroDuplicado('')
                }}
                onConfirm={() => {
                    setModalErroDuplicado(false)
                    setMensagemErroDuplicado('')
                }}
                titulo="Item Já Cadastrado"
                mensagem={mensagemErroDuplicado}
                textoConfirmar="OK"
                textoCancelar=""
                corHeader="vermelho"
            />
        </div>
    )
}

export default ListagemProdutosModelos
