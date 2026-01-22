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
    const [itensPorPagina] = useState(10)
    const [erro, setErro] = useState<string | null>(null)

    // Estados para modal de edição unificado
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
    const [pecaEditando, setPecaEditando] = useState<Peca | null>(null)

    // Estados para modal de confirmação de exclusão
    const [modalConfirmacao, setModalConfirmacao] = useState(false)
    const [itemParaDeletar, setItemParaDeletar] = useState<Peca | null>(null)

    // Carregar dados ao montar
    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            setErro(null)
            
            // Carregar peças, modelos e produtos em paralelo
            const [pecasData, modelosData, produtosData] = await Promise.all([
                pecasAPI.listarTodos(),
                modelosAPI.listarTodos(),
                produtosAPI.listar()
            ])

            // Criar mapa de modelo -> produto através da tabela produto_modelo
            const modeloProdutoMap = new Map<number, string>()
            const produtosMap = new Map<number, Produto>()
            produtosData.forEach((p: any) => {
                produtosMap.set(p.id, p)
            })
            
            // Criar mapa de modelo -> produto_id
            const modeloProdutoIdMap = new Map<number, number>()
            
            // Buscar relacionamento modelo-produto através da tabela produto_modelo
            modelosData.forEach((modelo: any) => {
                if (modelo.produto_id) {
                    const produto = produtosMap.get(modelo.produto_id)
                    if (produto) {
                        modeloProdutoMap.set(modelo.id, produto.nome)
                        modeloProdutoIdMap.set(modelo.id, modelo.produto_id)
                    }
                }
            })

            // Enriquecer peças com informações de modelo
            // Buscar peças por modelo para saber qual peça pertence a qual modelo
            const pecasEnriquecidas: Peca[] = []
            
            for (const modelo of modelosData) {
                try {
                    const pecasModelo = await pecasAPI.buscarPorModelo(modelo.id)
                    pecasModelo.forEach((peca: any) => {
                        pecasEnriquecidas.push({
                            id: peca.id,
                            codigo: peca.codigo,
                            nome: peca.nome,
                            modelo_id: modelo.id,
                            modelo_nome: modelo.nome || modelo.descricao || '',
                            produto_nome: modeloProdutoMap.get(modelo.id),
                            produto_id: modeloProdutoIdMap.get(modelo.id)
                        })
                    })
                } catch (err) {
                    console.error(`Erro ao buscar peças do modelo ${modelo.id}:`, err)
                }
            }

            setPecas(pecasEnriquecidas)
            setModelos(modelosData)
            setProdutos(produtosData)
        } catch (err) {
            console.error('Erro ao carregar dados:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao carregar dados')
        }
    }

    // Filtrar peças
    const pecasFiltradas = useMemo(() => {
        return pecas.filter(peca => {
            const matchCodigo = !filtroCodigo || 
                peca.codigo.toLowerCase().includes(filtroCodigo.toLowerCase())
            
            const matchModelo = !filtroModelo || 
                (peca.modelo_nome && peca.modelo_nome.toLowerCase().includes(filtroModelo.toLowerCase()))
            
            const matchProduto = !filtroProduto || 
                (peca.produto_nome && peca.produto_nome.toLowerCase().includes(filtroProduto.toLowerCase()))
            
            return matchCodigo && matchModelo && matchProduto
        })
    }, [pecas, filtroCodigo, filtroModelo, filtroProduto])

    // Calcular peças da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const pecasPaginaAtual = pecasFiltradas.slice(indiceInicio, indiceFim)

    // Resetar página quando filtros mudarem
    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroCodigo, filtroModelo, filtroProduto])

    // Resetar página quando necessário
    useEffect(() => {
        const totalPaginas = Math.ceil(pecasFiltradas.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [pecasFiltradas.length, itensPorPagina, paginaAtual])

    const limparFiltros = () => {
        setFiltroCodigo('')
        setFiltroProduto('')
        setFiltroModelo('')
    }

    // Função para editar tudo (peça, modelo e produto)
    const handleEditar = (peca: Peca) => {
        setPecaEditando(peca)
        setModalEdicaoAberto(true)
    }

    const handleSalvarTudo = async (dados: Record<string, any>) => {
        try {
            setErro(null)
            if (!pecaEditando) {
                throw new Error('Dados incompletos')
            }

            // Determinar qual produto será usado
            let produtoIdFinal: number | undefined = undefined
            if (dados.produto_id && dados.produto_id !== '') {
                produtoIdFinal = Number(dados.produto_id)
            } else if (pecaEditando.produto_id) {
                produtoIdFinal = pecaEditando.produto_id
            }

            // 1. Atualizar produto (se existe produto associado e nome foi alterado)
            if (produtoIdFinal && dados.nome_produto) {
                const produto = produtos.find(p => p.id === produtoIdFinal)
                if (produto && produto.nome !== dados.nome_produto) {
                    await produtosAPI.atualizar(produto.id, {
                        nome: dados.nome_produto
                    })
                }
            }

            // 2. Atualizar modelo (se existir)
            if (pecaEditando.modelo_id) {
                const modelo = modelos.find(m => m.id === pecaEditando.modelo_id)
                if (modelo) {
                    const dadosAtualizacaoModelo: { nome: string; produto_id?: number } = {
                        nome: dados.nome_modelo
                    }
                    
                    // Associar produto ao modelo se foi selecionado
                    if (produtoIdFinal) {
                        dadosAtualizacaoModelo.produto_id = produtoIdFinal
                    }
                    
                    await modelosAPI.atualizar(modelo.id, dadosAtualizacaoModelo)
                }
            }

            // 3. Atualizar peça por último
            if (pecaEditando.modelo_id) {
                await pecasAPI.atualizar(pecaEditando.id, {
                    modelo_id: pecaEditando.modelo_id,
                    codigo: dados.codigo_peca,
                    nome: dados.nome_peca
                })
            }
            
            await carregarDados()
            setModalEdicaoAberto(false)
            setPecaEditando(null)
        } catch (err) {
            console.error('Erro ao salvar:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao salvar')
        }
    }

    // Função para deletar tudo (peça, modelo e produto)
    const handleDeletar = (peca: Peca) => {
        setItemParaDeletar(peca)
        setModalConfirmacao(true)
    }

    const handleConfirmarDeletar = async () => {
        if (!itemParaDeletar) return
        
        try {
            setErro(null)
            const erros: string[] = []
            
            // 1. Deletar peça primeiro
            try {
                await pecasAPI.deletar(itemParaDeletar.id)
            } catch (err) {
                erros.push(`Erro ao deletar peça: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
            }
            
            // 2. Deletar modelo se existir (pode deletar outras peças relacionadas)
            if (itemParaDeletar.modelo_id) {
                try {
                    await modelosAPI.deletar(itemParaDeletar.modelo_id)
                } catch (err) {
                    erros.push(`Erro ao deletar modelo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
                }
            }
            
            // 3. Deletar produto por último (pode ter modelos relacionados, mas já deletamos o modelo)
            if (itemParaDeletar.produto_id) {
                try {
                    await produtosAPI.deletar(itemParaDeletar.produto_id)
                } catch (err) {
                    erros.push(`Erro ao deletar produto: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
                }
            }
            
            if (erros.length > 0) {
                setErro(erros.join('; '))
            }
            
            await carregarDados()
            setModalConfirmacao(false)
            setItemParaDeletar(null)
        } catch (err) {
            console.error('Erro ao deletar:', err)
            setErro(err instanceof Error ? err.message : 'Erro ao deletar')
            setModalConfirmacao(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="flex flex-col gap-6">
                            {/* Cabeçalho */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="text-white px-6 py-4" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <i className="bi bi-boxes"></i>
                                        Listagem de Peças
                                    </h3>
                                </div>
                            </div>

                            {/* Filtros */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                            <i className="bi bi-funnel"></i>
                                            Filtros de Busca
                                        </h4>
                                        {(filtroCodigo || filtroProduto || filtroModelo) && (
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Buscar por modelo..."
                                                value={filtroModelo}
                                                onChange={(e) => setFiltroModelo(e.target.value)}
                                            />
                                        </div>
                                    </div>
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

                            {/* Lista de Peças */}
                            {pecasFiltradas.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-12 flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            {filtroCodigo || filtroProduto || filtroModelo 
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
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                                            Código
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                                            Nome da Peça
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                                            Modelo
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                                            Produto
                                                        </th>
                                                        <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                                                            Ações
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {pecasPaginaAtual.map((peca) => (
                                                        <tr key={peca.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {peca.codigo}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {peca.nome}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {peca.modelo_nome || '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {peca.produto_nome || '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditar(peca)}
                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                        title="Editar Tudo"
                                                                    >
                                                                        <i className="bi bi-pencil-square"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletar(peca)}
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                        title="Deletar Tudo"
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

            {/* Modal de edição unificado */}
            <ModalFormulario
                isOpen={modalEdicaoAberto}
                onClose={() => {
                    setModalEdicaoAberto(false)
                    setPecaEditando(null)
                    setErro(null)
                }}
                onSave={handleSalvarTudo}
                itemEditando={pecaEditando ? {
                    codigo_peca: pecaEditando.codigo,
                    nome_peca: pecaEditando.nome,
                    nome_modelo: pecaEditando.modelo_nome || '',
                    nome_produto: pecaEditando.produto_nome || '',
                    produto_id: pecaEditando.produto_id?.toString() || ''
                } : null}
                tituloNovo="Nova Peça"
                tituloEditar="Editar Peça, Modelo e Produto"
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
                    },
                    {
                        nome: 'nome_modelo',
                        label: 'Nome do Modelo',
                        tipo: 'text',
                        placeholder: 'Ex: Modelo A',
                        required: true
                    },
                    {
                        nome: 'nome_produto',
                        label: 'Nome do Produto',
                        tipo: 'text',
                        placeholder: 'Ex: Produto A',
                        required: false
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
                textoBotao="Salvar Tudo"
                icone="bi bi-boxes"
                secaoTitulo="Informações Completas"
            />

            {/* Modal de confirmação de exclusão */}
            <ModalConfirmacao
                isOpen={modalConfirmacao}
                onClose={() => {
                    setModalConfirmacao(false)
                    setItemParaDeletar(null)
                }}
                onConfirm={handleConfirmarDeletar}
                titulo="Confirmar Exclusão"
                mensagem="Tem certeza que deseja deletar esta peça, modelo e produto? Esta ação não pode ser desfeita."
                textoConfirmar="Deletar Tudo"
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
        </div>
    )
}

export default ListagemPecas

