import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import CardModelo from '../Components/Modelos/CardModelo'
import ModalModelo from '../Components/Modelos/AdicionarModelo'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { modelosAPI, pecasAPI } from '../api/api'

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

const Modelos = () => {
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [modeloExpandido, setModeloExpandido] = useState<number | null>(null)
    const [modalAberto, setModalAberto] = useState(false)
    const [modeloEditando, setModeloEditando] = useState<Modelo | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    // Carregar modelos ao montar o componente
    useEffect(() => {
        carregarModelos()
    }, [])

    const carregarModelos = async () => {
        try {
            setCarregando(true)
            setErro(null)
            const dados = await modelosAPI.listarTodos()
            setModelos(dados)
        } catch (err) {
            console.error('Erro ao carregar modelos:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao carregar modelos')
        } finally {
            setCarregando(false)
        }
    }

    const handleAdicionarModelo = async (novoModelo: { nome: string; pecas?: Array<{codigo: string; nome: string}> }) => {
        try {
            setErro(null)
            if (modeloEditando) {
                // Modo edição - atualiza o modelo existente
                await modelosAPI.atualizar(modeloEditando.id, {
                    nome: novoModelo.nome,
                    pecas: novoModelo.pecas || []
                })
            } else {
                // Modo criação - cria novo modelo
                await modelosAPI.criar({
                    nome: novoModelo.nome,
                    pecas: novoModelo.pecas || []
                })
            }
            // Recarregar modelos após salvar
            await carregarModelos()
            setModalAberto(false)
            setModeloEditando(null)
        } catch (err) {
            console.error('Erro ao salvar modelo:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar modelo')
        }
    }

    const handleEditarModelo = (modelo: Modelo) => {
        setModeloEditando(modelo)
        setModalAberto(true)
    }

    const handleFecharModal = () => {
        setModalAberto(false)
        setModeloEditando(null)
    }

    const handleAbrirModalNovo = () => {
        setModeloEditando(null)
        setModalAberto(true)
    }

    const handleRemoverModelo = async (modeloId: number) => {
        if (!window.confirm('Tem certeza que deseja remover este modelo?')) {
            return
        }
        try {
            setErro(null)
            await modelosAPI.deletar(modeloId)
            // Recarregar modelos após deletar
            await carregarModelos()
            if (modeloExpandido === modeloId) {
                setModeloExpandido(null)
            }
        } catch (err) {
            console.error('Erro ao remover modelo:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao remover modelo')
        }
    }

    const handleToggleExpandir = (modeloId: number) => {
        setModeloExpandido(modeloExpandido === modeloId ? null : modeloId)
    }

    const handleRemoverPeca = async (_modeloId: number, pecaId: number): Promise<void> => {
        if (!window.confirm('Tem certeza que deseja remover esta peça?')) {
            return
        }
        try {
            setErro(null)
            await pecasAPI.deletar(pecaId)
            // Recarregar modelos após deletar peça
            await carregarModelos()
        } catch (err) {
            console.error('Erro ao remover peça:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao remover peça')
        }
    }

    // Calcular modelos da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const modelosPaginaAtual = modelos.slice(indiceInicio, indiceFim)

    // Resetar página quando necessário
    useEffect(() => {
        const totalPaginas = Math.ceil(modelos.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [modelos.length, itensPorPagina, paginaAtual])

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
                                        <i className="bi bi-box-seam"></i>
                                        Modelos de Produtos
                                    </h3>
                                    <button
                                        onClick={handleAbrirModalNovo}
                                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-md hover:bg-gray-100 transition-colors"
                                        style={{ color: 'var(--bg-azul)' }}
                                    >
                                        <i className="bi bi-plus-circle-fill"></i>
                                        <span>Novo Modelo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mensagem de erro */}
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

                            {/* Lista de Modelos */}
                            {carregando ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-arrow-repeat text-gray-300 text-5xl mb-4 animate-spin"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            Carregando modelos...
                                        </p>
                                    </div>
                                </div>
                            ) : modelos.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            Nenhum modelo cadastrado
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            Clique em "Novo Modelo" para começar
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {modelosPaginaAtual.map((modelo) => (
                                            <CardModelo
                                                key={modelo.id}
                                                modelo={modelo}
                                                estaExpandido={modeloExpandido === modelo.id}
                                                onToggleExpandir={() => handleToggleExpandir(modelo.id)}
                                                onRemoverModelo={() => handleRemoverModelo(modelo.id)}
                                                onEditarModelo={() => handleEditarModelo(modelo)}
                                                onRemoverPeca={(pecaId) => handleRemoverPeca(modelo.id, pecaId)}
                                            />
                                        ))}
                                    </div>
                                    {modelos.length > itensPorPagina && (
                                        <Paginacao
                                            totalItens={modelos.length}
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

            {/* Modal para adicionar/editar modelo */}
            <ModalModelo
                isOpen={modalAberto}
                onClose={handleFecharModal}
                onSave={handleAdicionarModelo}
                modeloEditando={modeloEditando}
            />
        </div>
    )
}

export default Modelos