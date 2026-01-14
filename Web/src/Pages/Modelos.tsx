import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import CardModelo from '../Components/Modelos/CardModelo'
import ModalModelo from '../Components/Modelos/AdicionarModelo'
import { Paginacao } from '../Components/Compartilhados/paginacao'

interface Peca {
    id: string
    modeloId: string
    codigo: string
    nome: string
}

interface Modelo {
    id: string
    nome: string
    pecas: Peca[]
}

const Modelos = () => {
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [modeloExpandido, setModeloExpandido] = useState<string | null>(null)
    const [modalAberto, setModalAberto] = useState(false)
    const [modeloEditando, setModeloEditando] = useState<Modelo | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    const handleAdicionarModelo = (novoModelo: Omit<Modelo, 'id'>) => {
        if (modeloEditando) {
            // Modo edição - atualiza o modelo existente
            const modeloAtualizado: Modelo = {
                ...novoModelo,
                id: modeloEditando.id,
                pecas: novoModelo.pecas.map(peca => ({
                    ...peca,
                    modeloId: modeloEditando.id
                }))
            }
            setModelos(modelos.map(m => 
                m.id === modeloEditando.id 
                    ? modeloAtualizado
                    : m
            ))
            setModeloEditando(null)
        } else {
            // Modo criação - adiciona novo modelo
            const modeloId = Date.now().toString()
            const modeloComId: Modelo = {
                ...novoModelo,
                id: modeloId,
                pecas: novoModelo.pecas.map(peca => ({
                    ...peca,
                    modeloId: modeloId
                }))
            }
            setModelos([...modelos, modeloComId])
        }
        setModalAberto(false)
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

    const handleRemoverModelo = (modeloId: string) => {
        setModelos(modelos.filter(m => m.id !== modeloId))
        if (modeloExpandido === modeloId) {
            setModeloExpandido(null)
        }
    }

    const handleToggleExpandir = (modeloId: string) => {
        setModeloExpandido(modeloExpandido === modeloId ? null : modeloId)
    }

    const handleRemoverPeca = (modeloId: string, pecaId: string): void => {
        setModelos(modelos.map(modelo => {
            if (modelo.id === modeloId) {
                return {
                    ...modelo,
                    pecas: modelo.pecas.filter(p => p.id !== pecaId)
                }
            }
            return modelo
        }))
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

                            {/* Lista de Modelos */}
                            {modelos.length === 0 ? (
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