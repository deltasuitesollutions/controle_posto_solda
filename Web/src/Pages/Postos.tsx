import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import CardPosto from '../Components/Postos/CardPosto'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { postosAPI, sublinhasAPI } from '../api/api'

interface Posto {
    posto_id: number
    nome: string
    sublinha_id: number
    toten_id: number
}

interface Sublinha {
    sublinha_id: number
    linha_id: number
    nome: string
    linha_nome?: string
}

interface Toten {
    id: number
    nome: string
}

const Postos = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [nome, setNome] = useState('')
    const [sublinhaId, setSublinhaId] = useState<number>(0)
    const [totenId, setTotenId] = useState<number>(0)
    const [postos, setPostos] = useState<Posto[]>([])
    const [sublinhas, setSublinhas] = useState<Sublinha[]>([])
    const [totens, setTotens] = useState<Toten[]>([])
    const [carregando, setCarregando] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [postoSelecionado, setPostoSelecionado] = useState<Posto | null>(null)
    const [postoEditando, setPostoEditando] = useState<Posto | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    useEffect(() => {
        carregarSublinhas()
        carregarTotens()
        if (abaAtiva === 'listar') {
            carregarPostos()
        }
    }, [abaAtiva])

    const carregarSublinhas = async () => {
        try {
            const dados = await sublinhasAPI.listarTodos(true)
            setSublinhas(dados.map((s: any) => ({
                sublinha_id: s.sublinha_id,
                linha_id: s.linha_id,
                nome: s.nome,
                linha_nome: s.linha_nome
            })))
            if (dados.length > 0 && sublinhaId === 0) {
                setSublinhaId(dados[0].sublinha_id)
            }
        } catch (error) {
            console.error('Erro ao carregar sublinhas:', error)
        }
    }

    const carregarTotens = async () => {
        try {
            const dados = await postosAPI.listarTotensDisponiveis()
            setTotens(dados)
            if (dados.length > 0 && totenId === 0) {
                setTotenId(dados[0].id)
            }
        } catch (error) {
            console.error('Erro ao carregar totens:', error)
        }
    }

    const carregarPostos = async () => {
        setCarregando(true)
        try {
            const dados = await postosAPI.listarTodos()
            
            if (!Array.isArray(dados)) {
                setPostos([])
                return
            }
            
            const dadosNormalizados = dados.map((p: any) => ({
                posto_id: p.posto_id,
                nome: p.nome,
                sublinha_id: p.sublinha_id,
                toten_id: p.toten_id
            }))
            setPostos(dadosNormalizados)
        } catch (error: any) {
            alert(`Erro ao carregar postos: ${error?.message || 'Erro desconhecido'}`)
            setPostos([])
        } finally {
            setCarregando(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!nome.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome do posto')
            setModalErroAberto(true)
            return
        }

        if (!sublinhaId) {
            setTituloErro('Erro!')
            setMensagemErro('Selecione uma sublinha')
            setModalErroAberto(true)
            return
        }

        if (!totenId) {
            setTituloErro('Erro!')
            setMensagemErro('Selecione um toten')
            setModalErroAberto(true)
            return
        }

        try {
            if (postoEditando) {
                // Atualizar posto existente
                await postosAPI.atualizar(postoEditando.posto_id, {
                    nome: nome.trim(),
                    sublinha_id: sublinhaId,
                    toten_id: totenId
                })
                setPostoEditando(null)
                setMensagemSucesso('Posto atualizado com sucesso!')
                setModalSucessoAberto(true)
            } else {
                // Criar novo posto
                await postosAPI.criar({
                    nome: nome.trim(),
                    sublinha_id: sublinhaId,
                    toten_id: totenId
                })
                setMensagemSucesso('Posto cadastrado com sucesso!')
                setModalSucessoAberto(true)
            }
            
            // Limpar formulário
            setNome('')
            if (sublinhas.length > 0) {
                setSublinhaId(sublinhas[0].sublinha_id)
            }
            if (totens.length > 0) {
                setTotenId(totens[0].id)
            }
            
            if (abaAtiva === 'listar') {
                await carregarPostos()
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao cadastrar posto. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro: ${errorMessage}`)
            setModalErroAberto(true)
        }
    }

    const handleEditarPosto = (posto: Posto) => {
        setPostoEditando(posto)
        setNome(posto.nome)
        setSublinhaId(posto.sublinha_id)
        setTotenId(posto.toten_id)
        setAbaAtiva('cadastrar')
    }

    const handleExcluirPosto = (posto: Posto) => {
        setPostoSelecionado(posto)
        setModalExcluirAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!postoSelecionado) return
        
        try {
            await postosAPI.deletar(postoSelecionado.posto_id)
            await carregarPostos()
            fecharModal()
            alert('Posto excluído com sucesso!')
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao excluir posto. Tente novamente.'
            alert(`Erro ao excluir posto: ${errorMessage}`)
        }
    }

    const fecharModal = () => {
        setModalExcluirAberto(false)
        setPostoSelecionado(null)
    }

    const cancelarEdicao = () => {
        setPostoEditando(null)
        setNome('')
        if (sublinhas.length > 0) {
            setSublinhaId(sublinhas[0].sublinha_id)
        }
        if (totens.length > 0) {
            setTotenId(totens[0].id)
        }
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const postosPaginaAtual = postos.slice(indiceInicio, indiceFim)

    useEffect(() => {
        const totalPaginas = Math.ceil(postos.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [postos.length, itensPorPagina, paginaAtual])

    const obterNomeSublinha = (sublinhaId: number) => {
        const sublinha = sublinhas.find(s => s.sublinha_id === sublinhaId)
        return sublinha ? sublinha.nome : 'Não encontrada'
    }

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
                                    onClick={() => {
                                        setAbaAtiva('cadastrar')
                                        cancelarEdicao()
                                    }}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-geo-alt-fill mr-2"></i>
                                    {postoEditando ? 'Editar Posto' : 'Cadastrar Posto'}
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('listar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'listar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'listar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-list-ul mr-2"></i>
                                    Listar Postos
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    <form id="form-posto" onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nome do Posto
                                            </label>
                                            <input
                                                type="text"
                                                id="posto-nome"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                                placeholder="Ex: Posto 1"
                                                value={nome}
                                                onChange={(e) => setNome(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Sublinha
                                                </label>
                                                <select
                                                    id="posto-sublinha"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    value={sublinhaId}
                                                    onChange={(e) => setSublinhaId(Number(e.target.value))}
                                                >
                                                    <option value={0}>Selecione uma sublinha</option>
                                                    {sublinhas.map((sublinha) => (
                                                        <option key={sublinha.sublinha_id} value={sublinha.sublinha_id}>
                                                            {sublinha.linha_nome ? `${sublinha.linha_nome} - ${sublinha.nome}` : sublinha.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Totem/Raspberry
                                                </label>
                                                <select
                                                    id="posto-toten"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    value={totenId}
                                                    onChange={(e) => setTotenId(Number(e.target.value))}
                                                >
                                                    <option value={0}>Selecione um toten</option>
                                                    {totens.map((toten) => (
                                                        <option key={toten.id} value={toten.id}>
                                                            {toten.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className="bi bi-geo-alt-fill"></i>
                                                <span>{postoEditando ? 'Atualizar Posto' : 'Cadastrar Posto'}</span>
                                            </button>
                                            {postoEditando && (
                                                <button
                                                    type="button"
                                                    onClick={cancelarEdicao}
                                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                    <span>Cancelar</span>
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        {carregando ? (
                                            <div className="flex justify-center items-center py-12">
                                                <p className="text-gray-500">Carregando postos...</p>
                                            </div>
                                        ) : postos.length > 0 ? (
                                            <div className="space-y-4">
                                                {postosPaginaAtual.map((posto) => (
                                                    <CardPosto
                                                        key={posto.posto_id}
                                                        posto={posto}
                                                        nomeSublinha={obterNomeSublinha(posto.sublinha_id)}
                                                        onRemoverPosto={() => handleExcluirPosto(posto)}
                                                        onEditarPosto={() => handleEditarPosto(posto)}
                                                    />
                                                ))}
                                                {postos.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={postos.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-info-circle text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Nenhum posto cadastrado
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

            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir Posto"
                mensagem="Tem certeza que deseja excluir este posto?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="laranja"
            />

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
        </div>
    )
}

export default Postos
