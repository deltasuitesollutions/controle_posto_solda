import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import FormCadastrarLinha from '../Components/Linhas/FormCadastrarLinha'
import FormCadastrarSublinha from '../Components/Linhas/FormCadastrarSublinha'
import CardLinha from '../Components/Linhas/CardLinha'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { linhasAPI, sublinhasAPI } from '../api/api'

interface Sublinha {
    id: number
    linha_id: number
    nome: string
}

interface Linha {
    id: number
    nome: string
    sublinhas: Sublinha[]
}

const Linhas = () => {
    const [abaAtiva, setAbaAtiva] = useState<'linha' | 'sublinha' | 'listar'>('linha')
    
    // Estados para cadastro de linha
    const [nomeLinha, setNomeLinha] = useState('')
    
    // Estados para cadastro de sublinha
    const [linhaSelecionada, setLinhaSelecionada] = useState<number>(0)
    const [nomeSublinha, setNomeSublinha] = useState('')
    const [linhasDisponiveis, setLinhasDisponiveis] = useState<Linha[]>([])
    
    // Estados para listagem
    const [linhas, setLinhas] = useState<Linha[]>([])
    const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null)
    const [linhaEditando, setLinhaEditando] = useState<number | null>(null)
    const [nomeLinhaEditando, setNomeLinhaEditando] = useState('')
    const [sublinhaEditando, setSublinhaEditando] = useState<number | null>(null)
    const [nomeSublinhaEditando, setNomeSublinhaEditando] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarLinhas()
        } else if (abaAtiva === 'sublinha') {
            carregarLinhasDisponiveis()
        }
    }, [abaAtiva])

    const carregarLinhasDisponiveis = async () => {
        try {
            const dados = await linhasAPI.listarTodos()
            setLinhasDisponiveis(dados.map((l: any) => ({ id: l.linha_id, nome: l.nome, sublinhas: [] })))
            if (dados.length > 0 && linhaSelecionada === 0) {
                setLinhaSelecionada(dados[0].linha_id)
            }
        } catch (error) {
            console.error('Erro ao carregar linhas:', error)
        }
    }

    const carregarLinhas = async () => {
        try {
            const dadosLinhas = await linhasAPI.listarTodos()
            
            const linhasComSublinhas = await Promise.all(
                dadosLinhas.map(async (linha: any) => {
                    const sublinhas = await sublinhasAPI.buscarPorLinha(linha.linha_id)
                    return {
                        id: linha.linha_id,
                        nome: linha.nome,
                        sublinhas: sublinhas.map((s: any) => ({
                            id: s.sublinha_id,
                            linha_id: s.linha_id,
                            nome: s.nome
                        }))
                    }
                })
            )
            
            setLinhas(linhasComSublinhas)
        } catch (error) {
            console.error('Erro ao carregar linhas:', error)
            alert('Erro ao carregar linhas. Tente novamente.')
        }
    }

    const handleCadastrarLinha = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!nomeLinha.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da linha')
            setModalErroAberto(true)
            return
        }

        try {
            await linhasAPI.criar({ nome: nomeLinha.trim() })
            setNomeLinha('')
            setMensagemSucesso('Linha cadastrada com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao cadastrar linha: ${error?.message || 'Tente novamente.'}`)
            setModalErroAberto(true)
        }
    }

    const handleCadastrarSublinha = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!nomeSublinha.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da sublinha')
            setModalErroAberto(true)
            return
        }

        if (!linhaSelecionada) {
            setTituloErro('Erro!')
            setMensagemErro('Selecione uma linha')
            setModalErroAberto(true)
            return
        }

        try {
            await sublinhasAPI.criar({
                nome: nomeSublinha.trim(),
                linha_id: linhaSelecionada
            })
            setNomeSublinha('')
            setMensagemSucesso('Sublinha cadastrada com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao cadastrar sublinha: ${error?.message || 'Tente novamente.'}`)
            setModalErroAberto(true)
        }
    }

    const handleExcluirLinha = async (linhaId: number) => {
        if (!window.confirm('Tem certeza que deseja excluir esta linha? Todas as sublinhas associadas também serão excluídas.')) {
            return
        }

        try {
            const resposta = await linhasAPI.deletar(linhaId)
            await carregarLinhas()
            const mensagem = resposta?.mensagem || 'Linha excluída com sucesso!'
            alert(mensagem)
        } catch (error: any) {
            alert(`Erro ao excluir linha: ${error?.message || 'Tente novamente.'}`)
        }
    }

    const handleExcluirSublinha = async (sublinhaId: number) => {
        if (!window.confirm('Tem certeza que deseja excluir esta sublinha?')) {
            return
        }

        try {
            await sublinhasAPI.deletar(sublinhaId)
            await carregarLinhas()
            alert('Sublinha excluída com sucesso!')
        } catch (error: any) {
            alert(`Erro ao excluir sublinha: ${error?.message || 'Tente novamente.'}`)
        }
    }

    const handleIniciarEdicaoLinha = (linha: Linha) => {
        setLinhaEditando(linha.id)
        setNomeLinhaEditando(linha.nome)
        setSublinhaEditando(null)
    }

    const handleSalvarEdicaoLinha = async (linhaId: number) => {
        if (!nomeLinhaEditando.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da linha')
            setModalErroAberto(true)
            return
        }

        try {
            await linhasAPI.atualizar(linhaId, { nome: nomeLinhaEditando.trim() })
            await carregarLinhas()
            setLinhaEditando(null)
            setNomeLinhaEditando('')
            setMensagemSucesso('Linha atualizada com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao atualizar linha: ${error?.message || 'Tente novamente.'}`)
            setModalErroAberto(true)
        }
    }

    const handleCancelarEdicaoLinha = () => {
        setLinhaEditando(null)
        setNomeLinhaEditando('')
    }

    const handleIniciarEdicaoSublinha = (sublinha: Sublinha) => {
        setSublinhaEditando(sublinha.id)
        setNomeSublinhaEditando(sublinha.nome)
        setLinhaEditando(null)
    }

    const handleSalvarEdicaoSublinha = async (sublinha: Sublinha) => {
        if (!nomeSublinhaEditando.trim()) {
            alert('Informe o nome da sublinha')
            return
        }

        try {
            await sublinhasAPI.atualizar(sublinha.id, {
                nome: nomeSublinhaEditando.trim(),
                linha_id: sublinha.linha_id
            })
            await carregarLinhas()
            setSublinhaEditando(null)
            setNomeSublinhaEditando('')
            alert('Sublinha atualizada com sucesso!')
        } catch (error: any) {
            alert(`Erro ao atualizar sublinha: ${error?.message || 'Tente novamente.'}`)
        }
    }

    const handleCancelarEdicaoSublinha = () => {
        setSublinhaEditando(null)
        setNomeSublinhaEditando('')
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const linhasPaginaAtual = linhas.slice(indiceInicio, indiceFim)

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
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setAbaAtiva('linha')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'linha'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'linha' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-diagram-3 mr-2"></i>
                                    Cadastrar Linha
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('sublinha')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'sublinha'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'sublinha' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-diagram-2 mr-2"></i>
                                    Cadastrar Sublinha
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
                                    Listar
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'linha' && (
                                    <FormCadastrarLinha
                                        nomeLinha={nomeLinha}
                                        onNomeLinhaChange={setNomeLinha}
                                        onSubmit={handleCadastrarLinha}
                                    />
                                )}

                                {abaAtiva === 'sublinha' && (
                                    <FormCadastrarSublinha
                                        linhaSelecionada={linhaSelecionada}
                                        onLinhaSelecionadaChange={setLinhaSelecionada}
                                        nomeSublinha={nomeSublinha}
                                        onNomeSublinhaChange={setNomeSublinha}
                                        linhasDisponiveis={linhasDisponiveis}
                                        onSubmit={handleCadastrarSublinha}
                                    />
                                )}

                                {abaAtiva === 'listar' && (
                                    <div>
                                        {linhas.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Nenhuma linha cadastrada
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {linhasPaginaAtual.map((linha) => {
                                                    const estaExpandida = linhaExpandida === linha.id
                                                    const estaEditandoLinha = linhaEditando === linha.id
                                                    return (
                                                        <CardLinha
                                                            key={linha.id}
                                                            linha={linha}
                                                            estaExpandida={estaExpandida}
                                                            estaEditandoLinha={estaEditandoLinha}
                                                            nomeLinhaEditando={nomeLinhaEditando}
                                                            sublinhaEditando={sublinhaEditando}
                                                            nomeSublinhaEditando={nomeSublinhaEditando}
                                                            onToggleExpandir={() => setLinhaExpandida(estaExpandida ? null : linha.id)}
                                                            onIniciarEdicaoLinha={() => handleIniciarEdicaoLinha(linha)}
                                                            onSalvarEdicaoLinha={() => handleSalvarEdicaoLinha(linha.id)}
                                                            onCancelarEdicaoLinha={handleCancelarEdicaoLinha}
                                                            onNomeLinhaEditandoChange={setNomeLinhaEditando}
                                                            onExcluirLinha={() => handleExcluirLinha(linha.id)}
                                                            onIniciarEdicaoSublinha={handleIniciarEdicaoSublinha}
                                                            onSalvarEdicaoSublinha={handleSalvarEdicaoSublinha}
                                                            onCancelarEdicaoSublinha={handleCancelarEdicaoSublinha}
                                                            onNomeSublinhaEditandoChange={setNomeSublinhaEditando}
                                                            onExcluirSublinha={handleExcluirSublinha}
                                                        />
                                                    )
                                                })}
                                                
                                                {linhas.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={linhas.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
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
        </div>
    )
}

export default Linhas
