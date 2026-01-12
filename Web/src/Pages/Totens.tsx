import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import CardToten from '../Components/Totens/CardToten'
import ModalFormularioSimples from '../Components/Compartilhados/ModalFormularioSimples'
import { Paginacao } from '../Components/Compartilhados/paginacao'

interface Toten {
    id: string
    nome: string
}

const Totens = () => {
    const [totens, setTotens] = useState<Toten[]>([])
    const [modalAberto, setModalAberto] = useState(false)
    const [totenEditando, setTotenEditando] = useState<Toten | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    const handleAdicionarToten = (novoToten: Omit<Toten, 'id'>) => {
        if (totenEditando) {
            // Modo edição - atualiza o toten existente
            setTotens(totens.map(t => 
                t.id === totenEditando.id 
                    ? { ...novoToten, id: totenEditando.id }
                    : t
            ))
            setTotenEditando(null)
        } else {
            // Modo criação - adiciona novo toten
            const totenComId: Toten = {
                ...novoToten,
                id: Date.now().toString()
            }
            setTotens([...totens, totenComId])
        }
        setModalAberto(false)
    }

    const handleEditarToten = (toten: Toten) => {
        setTotenEditando(toten)
        setModalAberto(true)
    }

    const handleFecharModal = () => {
        setModalAberto(false)
        setTotenEditando(null)
    }

    const handleAbrirModalNovo = () => {
        setTotenEditando(null)
        setModalAberto(true)
    }

    const handleRemoverToten = (totenId: string) => {
        setTotens(totens.filter(t => t.id !== totenId))
    }

    // Calcular totens da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const totensPaginaAtual = totens.slice(indiceInicio, indiceFim)

    // Resetar página quando necessário
    useEffect(() => {
        const totalPaginas = Math.ceil(totens.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [totens.length, itensPorPagina, paginaAtual])

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
                                        <i className="bi bi-display"></i>
                                        ID/Totens
                                    </h3>
                                    <button
                                        onClick={handleAbrirModalNovo}
                                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-md hover:bg-gray-100 transition-colors"
                                        style={{ color: 'var(--bg-azul)' }}
                                    >
                                        <i className="bi bi-plus-circle-fill"></i>
                                        <span>Novo ID/Toten</span>
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Totens */}
                            {totens.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            Nenhum ID/Toten cadastrado
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            Clique em "Novo ID/Toten" para começar
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {totensPaginaAtual.map((toten) => (
                                            <CardToten
                                                key={toten.id}
                                                toten={toten}
                                                onRemoverToten={() => handleRemoverToten(toten.id)}
                                                onEditarToten={() => handleEditarToten(toten)}
                                            />
                                        ))}
                                    </div>
                                    {totens.length > itensPorPagina && (
                                        <Paginacao
                                            totalItens={totens.length}
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

            {/* Modal para adicionar/editar toten */}
            <ModalFormularioSimples
                isOpen={modalAberto}
                onClose={handleFecharModal}
                onSave={handleAdicionarToten}
                itemEditando={totenEditando}
                tituloNovo="Novo ID/Toten"
                tituloEditar="Editar ID/Toten"
                labelCampo="Nome do ID/Toten"
                placeholder="Ex: Toten 1"
                textoBotao="Salvar ID/Toten"
                icone="bi bi-display"
            />
        </div>
    )
}

export default Totens

