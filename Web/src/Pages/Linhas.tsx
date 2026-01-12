import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import CardLinha from '../Components/Linhas/CardLinha'
import ModalFormularioSimples from '../Components/Compartilhados/ModalFormularioSimples'
import { Paginacao } from '../Components/Compartilhados/paginacao'

interface Linha {
    id: string
    nome: string
}

const Linhas = () => {
    const [linhas, setLinhas] = useState<Linha[]>([])
    const [modalAberto, setModalAberto] = useState(false)
    const [linhaEditando, setLinhaEditando] = useState<Linha | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    const handleAdicionarLinha = (novaLinha: Omit<Linha, 'id'>) => {
        if (linhaEditando) {
            // Modo edição - atualiza a linha existente
            setLinhas(linhas.map(l => 
                l.id === linhaEditando.id 
                    ? { ...novaLinha, id: linhaEditando.id }
                    : l
            ))
            setLinhaEditando(null)
        } else {
            // Modo criação - adiciona nova linha
            const linhaComId: Linha = {
                ...novaLinha,
                id: Date.now().toString()
            }
            setLinhas([...linhas, linhaComId])
        }
        setModalAberto(false)
    }

    const handleEditarLinha = (linha: Linha) => {
        setLinhaEditando(linha)
        setModalAberto(true)
    }

    const handleFecharModal = () => {
        setModalAberto(false)
        setLinhaEditando(null)
    }

    const handleAbrirModalNovo = () => {
        setLinhaEditando(null)
        setModalAberto(true)
    }

    const handleRemoverLinha = (linhaId: string) => {
        setLinhas(linhas.filter(l => l.id !== linhaId))
    }

    // Calcular linhas da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const linhasPaginaAtual = linhas.slice(indiceInicio, indiceFim)

    // Resetar página quando necessário
    useEffect(() => {
        const totalPaginas = Math.ceil(linhas.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [linhas.length, itensPorPagina, paginaAtual])

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
                                        <i className="bi bi-diagram-3"></i>
                                        Linhas
                                    </h3>
                                    <button
                                        onClick={handleAbrirModalNovo}
                                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-md hover:bg-gray-100 transition-colors"
                                        style={{ color: 'var(--bg-azul)' }}
                                    >
                                        <i className="bi bi-plus-circle-fill"></i>
                                        <span>Nova Linha</span>
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Linhas */}
                            {linhas.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            Nenhuma linha cadastrada
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            Clique em "Nova Linha" para começar
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {linhasPaginaAtual.map((linha) => (
                                            <CardLinha
                                                key={linha.id}
                                                linha={linha}
                                                onRemoverLinha={() => handleRemoverLinha(linha.id)}
                                                onEditarLinha={() => handleEditarLinha(linha)}
                                            />
                                        ))}
                                    </div>
                                    {linhas.length > itensPorPagina && (
                                        <Paginacao
                                            totalItens={linhas.length}
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

            {/* Modal para adicionar/editar linha */}
            <ModalFormularioSimples
                isOpen={modalAberto}
                onClose={handleFecharModal}
                onSave={handleAdicionarLinha}
                itemEditando={linhaEditando}
                tituloNovo="Nova Linha"
                tituloEditar="Editar Linha"
                labelCampo="Nome da Linha"
                placeholder="Ex: Linha 1"
                textoBotao="Salvar Linha"
                icone="bi bi-diagram-3"
            />
        </div>
    )
}

export default Linhas

