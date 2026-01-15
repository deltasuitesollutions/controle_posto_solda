import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import CardProduto from '../Components/Produtos/CardProduto'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { produtosAPI } from '../api/api';

interface Produto {
    id: number
    nome: string
}

const Produtos = () => {
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [modalAberto, setModalAberto] = useState(false)
    const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [erro, setErro] = useState<string | null>(null)
    const [carregado, setCarregado] = useState(false)

    // Carregar produtos ao montar o componente
    useEffect(() => {
        const carregarProdutos = async () => {
            try {
                const dados = await produtosAPI.listar()
                setProdutos(dados)
            } catch (err) {
                console.error('Erro ao carregar produtos:', err)
                setErro(err instanceof Error ? err.message : 'Erro ao carregar produtos')
            } finally {
                setCarregado(true)
            }
        }
        carregarProdutos()
    }, [])

    const handleAdicionarProduto = async (novoProduto: Record<string, any>) => {
        try {
            setErro(null)
            if (produtoEditando) {
                // edita
                await produtosAPI.atualizar(produtoEditando.id, {
                    nome: novoProduto.nome,
                })
            } else {
                // Cria
                await produtosAPI.criar({
                    nome: novoProduto.nome,
                })
            }
            // Recarregar produtos após salvar
            const dados = await produtosAPI.listar()
            setProdutos(dados)
            setModalAberto(false)
        } catch (err) {
            console.error('Erro ao salvar produto:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar produto')
        }
    }

    const handleEditarProduto = (produto: Produto) => {
        setProdutoEditando(produto)
        setModalAberto(true)
    }

    const handleFecharModal = () => {
        setModalAberto(false)
        setProdutoEditando(null)
        setErro(null)
    }

    const handleAbrirModalNovo = () => {
        setProdutoEditando(null)
        setModalAberto(true)
    }

    const handleRemoverProduto = async (produtoId: number) => {
        if (!window.confirm('Tem certeza que deseja remover este produto?')) {
            return
        }
        try {
            setErro(null)
            await produtosAPI.deletar(produtoId)
            // Recarregar produtos após deletar
            const dados = await produtosAPI.listar()
            setProdutos(dados)
        } catch (err) {
            console.error('Erro ao remover produto:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao remover produto')
        }
    }

    // Calcular produtos da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const produtosPaginaAtual = produtos.slice(indiceInicio, indiceFim)

    // Resetar página quando necessário
    useEffect(() => {
        const totalPaginas = Math.ceil(produtos.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [produtos.length, itensPorPagina, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="flex flex-col gap-6">
                            {/* Cabeçalho com botão de adicionar */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="text-white px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <i className="bi bi-box"></i>
                                        Produtos
                                    </h3>
                                    <button
                                        onClick={handleAbrirModalNovo}
                                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-md hover:bg-gray-100 transition-colors"
                                        style={{ color: 'var(--bg-azul)' }}
                                    >
                                        <i className="bi bi-plus-circle-fill"></i>
                                        <span>Novo Produto</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mensagem de erro */}
                            {erro && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                    <span className="block sm:inline">{erro}</span>
                                </div>
                            )}

                            {/* Lista de Produtos */}
                            {!carregado ? null : produtos.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            Nenhum produto cadastrado
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            Clique em "Novo Produto" para começar
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {produtosPaginaAtual.map((produto) => (
                                            <CardProduto
                                                key={produto.id}
                                                produto={produto}
                                                onRemoverProduto={() => handleRemoverProduto(produto.id)}
                                                onEditarProduto={() => handleEditarProduto(produto)}
                                            />
                                        ))}
                                    </div>
                                    {produtos.length > itensPorPagina && (
                                        <Paginacao
                                            totalItens={produtos.length}
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

            {/* Modal para adicionar/editar produto */}
            <ModalFormulario
                isOpen={modalAberto}
                onClose={handleFecharModal}
                onSave={handleAdicionarProduto}
                itemEditando={produtoEditando}
                tituloNovo="Novo Produto"
                tituloEditar="Editar Produto"
                campos={[
                    {
                        nome: 'nome',
                        label: 'Nome do Produto',
                        tipo: 'text',
                        placeholder: 'Ex: Produto A',
                        required: true
                    }
                ]}
                textoBotao="Salvar Produto"
                icone="bi bi-box"
                secaoTitulo="Informações do Produto"
            />
        </div>
    )
}

export default Produtos

