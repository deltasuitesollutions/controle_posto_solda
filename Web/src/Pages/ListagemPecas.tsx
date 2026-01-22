import { useState, useEffect, useMemo } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { pecasAPI, modelosAPI, produtosAPI } from '../api/api'

interface Peca {
    id: number
    codigo: string
    nome: string
    modelo_id?: number
    modelo_nome?: string
    produto_nome?: string
    produto_id?: number
}

interface Modelo {
    id: number
    nome: string
    produto_id?: number
}

interface Produto {
    id: number
    nome: string
}

const ListagemPecas = () => {
    const [pecas, setPecas] = useState<Peca[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [filtroCodigo, setFiltroCodigo] = useState('')
    const [filtroProduto, setFiltroProduto] = useState('')
    const [filtroModelo, setFiltroModelo] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [erro, setErro] = useState<string | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
    const [pecaEditando, setPecaEditando] = useState<Peca | null>(null)
    const [modalEdicaoModeloAberto, setModalEdicaoModeloAberto] = useState(false)
    const [modeloEditando, setModeloEditando] = useState<{ id: number; nome: string; produto_id?: number } | null>(null)
    const [modalEdicaoProdutoAberto, setModalEdicaoProdutoAberto] = useState(false)
    const [produtoEditando, setProdutoEditando] = useState<{ id: number; nome: string } | null>(null)
    const [modalConfirmacao, setModalConfirmacao] = useState(false)
    const [itemParaDeletar, setItemParaDeletar] = useState<Peca | null>(null)
    const [modalErroDuplicado, setModalErroDuplicado] = useState(false)
    const [mensagemErroDuplicado, setMensagemErroDuplicado] = useState('')

    const itensPorPagina = 10

    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            setCarregando(true)
            setErro(null)
            
            // Usar endpoint otimizado que retorna tudo em uma única requisição
            const [pecasEnriquecidas, modelosData, produtosData] = await Promise.all([
                pecasAPI.listarTodosComRelacoes(),
                modelosAPI.listarTodos(),
                produtosAPI.listar()
            ])

            setPecas(pecasEnriquecidas)
            setModelos(modelosData)
            setProdutos(produtosData)
        } catch (err) {
            console.error('Erro ao carregar dados:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao carregar dados')
        } finally {
            setCarregando(false)
        }
    }

    const pecasFiltradas = useMemo(() => {
        return pecas.filter(peca => {
            const matchCodigo = !filtroCodigo || peca.codigo.toLowerCase().includes(filtroCodigo.toLowerCase())
            const matchModelo = !filtroModelo || (peca.modelo_nome?.toLowerCase().includes(filtroModelo.toLowerCase()) ?? false)
            const matchProduto = !filtroProduto || (peca.produto_nome?.toLowerCase().includes(filtroProduto.toLowerCase()) ?? false)
            return matchCodigo && matchModelo && matchProduto
        })
    }, [pecas, filtroCodigo, filtroModelo, filtroProduto])

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const pecasPaginaAtual = pecasFiltradas.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroCodigo, filtroModelo, filtroProduto])

    useEffect(() => {
        const totalPaginas = Math.ceil(pecasFiltradas.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [pecasFiltradas.length, paginaAtual])

    const limparFiltros = () => {
        setFiltroCodigo('')
        setFiltroProduto('')
        setFiltroModelo('')
    }

    const handleEditar = (peca: Peca) => {
        setPecaEditando(peca)
        setModalEdicaoAberto(true)
    }

    const handleSalvarPeca = async (dados: Record<string, any>) => {
        if (!pecaEditando) return

        try {
            setErro(null)
            
            // Atualizar apenas a peça (código e nome)
            if (pecaEditando.modelo_id) {
                await pecasAPI.atualizar(pecaEditando.id, {
                    modelo_id: pecaEditando.modelo_id,
                    codigo: dados.codigo_peca,
                    nome: dados.nome_peca
                })
                
                // Atualizar estado local otimisticamente
                setPecas(pecas.map(p => 
                    p.id === pecaEditando.id 
                        ? {
                            ...p,
                            codigo: dados.codigo_peca,
                            nome: dados.nome_peca
                        }
                        : p
                ))
            }
            
            setModalEdicaoAberto(false)
            setPecaEditando(null)
        } catch (err) {
            console.error('Erro ao salvar peça:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar peça')
            // Em caso de erro, recarregar dados para garantir consistência
            await carregarDados()
        }
    }

    const handleEditarModelo = (peca: Peca) => {
        if (!peca.modelo_id) return
        const modelo = modelos.find(m => m.id === peca.modelo_id)
        if (modelo) {
            setModeloEditando({
                id: modelo.id,
                nome: modelo.nome || peca.modelo_nome || '',
                produto_id: peca.produto_id
            })
            setModalEdicaoModeloAberto(true)
        }
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

            // Verificar se o usuário alterou o produto_id
            const produtoIdFoiAlterado = 'produto_id' in dados
            let produtoIdFinal: number | undefined = undefined
            
            if (produtoIdFoiAlterado) {
                // Usuário interagiu com o campo
                if (dados.produto_id === '' || dados.produto_id === null || dados.produto_id === undefined) {
                    // Tentou remover produto (selecionou "Nenhum")
                    if (modeloEditando.produto_id) {
                        setErro('O produto não pode ser removido do modelo. Selecione um produto ou mantenha o atual.')
                        return
                    }
                    produtoIdFinal = undefined
                } else {
                    // Selecionou um produto válido
                    produtoIdFinal = Number(dados.produto_id)
                }
            } else {
                // Não alterou o campo, manter o original
                produtoIdFinal = modeloEditando.produto_id
            }

            const dadosModelo: { nome: string; produto_id?: number } = { nome: nomeModelo }
            if (produtoIdFinal) {
                dadosModelo.produto_id = produtoIdFinal
            }

            await modelosAPI.atualizar(modeloEditando.id, dadosModelo)
            
            // Recarregar dados para garantir que tudo está sincronizado
            await carregarDados()
            
            setModalEdicaoModeloAberto(false)
            setModeloEditando(null)
        } catch (err) {
            console.error('Erro ao salvar modelo:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar modelo')
            await carregarDados()
        }
    }

    const handleEditarProduto = (peca: Peca) => {
        if (!peca.produto_id) return
        const produto = produtos.find(p => p.id === peca.produto_id)
        if (produto) {
            setProdutoEditando({
                id: produto.id,
                nome: produto.nome
            })
            setModalEdicaoProdutoAberto(true)
        }
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
            
            // Atualizar estado local otimisticamente
            setProdutos(produtos.map(p => p.id === produtoEditando.id ? { ...p, nome: nomeProduto } : p))
            
            // Atualizar peças que usam este produto
            setPecas(pecas.map(p => 
                p.produto_id === produtoEditando.id
                    ? {
                        ...p,
                        produto_nome: nomeProduto
                    }
                    : p
            ))
            
            setModalEdicaoProdutoAberto(false)
            setProdutoEditando(null)
        } catch (err) {
            console.error('Erro ao salvar produto:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar produto')
            await carregarDados()
        }
    }

    const handleDeletar = (peca: Peca) => {
        setItemParaDeletar(peca)
        setModalConfirmacao(true)
    }

    const handleConfirmarDeletar = async () => {
        if (!itemParaDeletar) return
        
        try {
            setErro(null)
            
            // Guardar referência para atualização otimista
            const pecaId = itemParaDeletar.id
            
            // Atualizar estado local otimisticamente (remover peça imediatamente)
            setPecas(pecas.filter(p => p.id !== pecaId))
            
            try {
                await pecasAPI.deletar(pecaId)
            } catch (err) {
                setErro(`Erro ao deletar peça: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
                // Reverter atualização otimista em caso de erro
                await carregarDados()
            }
            
            setModalConfirmacao(false)
            setItemParaDeletar(null)
        } catch (err) {
            console.error('Erro ao deletar:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao deletar')
            // Recarregar dados em caso de erro
            await carregarDados()
            setModalConfirmacao(false)
        }
    }

    const temFiltros = filtroCodigo || filtroProduto || filtroModelo
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
                                        <i className="bi bi-boxes"></i>
                                        Listagem de Peças
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
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Código da Peça
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Buscar por código..."
                                                value={filtroCodigo}
                                                onChange={(e) => setFiltroCodigo(e.target.value)}
                                            />
                                        </div>
                                        
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
                                        <p className="text-gray-500 text-lg font-medium">Carregando peças...</p>
                                    </div>
                                </div>
                            ) : pecasFiltradas.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            {temFiltros 
                                                ? 'Nenhuma peça encontrada com os filtros aplicados'
                                                : 'Nenhuma peça cadastrada'}
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
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Código</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nome da Peça</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Modelo</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Produto</th>
                                                        <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {pecasPaginaAtual.map((peca) => (
                                                        <tr key={peca.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{peca.codigo}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{peca.nome}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-900">{peca.modelo_nome || '-'}</span>
                                                                    {peca.modelo_id && (
                                                                        <button
                                                                            onClick={() => handleEditarModelo(peca)}
                                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                            title="Editar Modelo"
                                                                        >
                                                                            <i className="bi bi-pencil-square text-xs"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-900">{peca.produto_nome || '-'}</span>
                                                                    {peca.produto_id && (
                                                                        <button
                                                                            onClick={() => handleEditarProduto(peca)}
                                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                            title="Editar Produto"
                                                                        >
                                                                            <i className="bi bi-pencil-square text-xs"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditar(peca)}
                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                        title="Editar Peça"
                                                                    >
                                                                        <i className="bi bi-pencil-square"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletar(peca)}
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                        title="Deletar"
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
                                    </div>
                                    
                                    {pecasFiltradas.length > itensPorPagina && (
                                        <Paginacao
                                            totalItens={pecasFiltradas.length}
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
                isOpen={modalEdicaoAberto}
                onClose={() => {
                    setModalEdicaoAberto(false)
                    setPecaEditando(null)
                    setErro(null)
                }}
                onSave={handleSalvarPeca}
                itemEditando={pecaEditando ? {
                    codigo_peca: pecaEditando.codigo,
                    nome_peca: pecaEditando.nome
                } : null}
                tituloNovo="Nova Peça"
                tituloEditar="Editar Peça"
                campos={[
                    {
                        nome: 'codigo_peca',
                        label: 'Código da Peça',
                        tipo: 'text',
                        placeholder: 'Ex: PEC001',
                        required: true
                    },
                    {
                        nome: 'nome_peca',
                        label: 'Nome da Peça',
                        tipo: 'text',
                        placeholder: 'Ex: Peça Principal',
                        required: true
                    }
                ]}
                textoBotao="Salvar"
                icone="bi bi-boxes"
                secaoTitulo="Informações da Peça"
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

            <ModalConfirmacao
                isOpen={modalConfirmacao}
                onClose={() => {
                    setModalConfirmacao(false)
                    setItemParaDeletar(null)
                }}
                onConfirm={handleConfirmarDeletar}
                titulo="Confirmar Exclusão"
                mensagem="Tem certeza que deseja deletar esta peça? Esta ação não pode ser desfeita."
                textoConfirmar="Deletar"
                textoCancelar="Cancelar"
                corHeader="vermelho"
                item={itemParaDeletar ? { 
                    peca: `${itemParaDeletar.codigo} - ${itemParaDeletar.nome}`,
                    modelo: itemParaDeletar.modelo_nome || '-',
                    produto: itemParaDeletar.produto_nome || '-'
                } : undefined}
                camposItem={['peca', 'modelo', 'produto']}
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

export default ListagemPecas
