import { useState, useEffect, useCallback } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { cancelamentoAPI } from '../api/api'
import ModalBase from '../Components/Compartilhados/ModalBase'

const OperacoesCanceladas = () => {
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(20)
    const [cancelamentos, setCancelamentos] = useState<any[]>([])
    const [carregando, setCarregando] = useState(false)
    const [total, setTotal] = useState(0)
    const [data, setData] = useState<string>('')
    
    // Estados para edição de motivo
    const [editandoMotivo, setEditandoMotivo] = useState<number | null>(null)
    const [novoMotivo, setNovoMotivo] = useState<string>('')
    const [salvandoMotivo, setSalvandoMotivo] = useState(false)
    
    // Estados para modal de mensagem
    const [modalMensagem, setModalMensagem] = useState({
        isOpen: false,
        mensagem: '',
        tipo: 'sucesso' as 'sucesso' | 'erro' | 'aviso'
    })

    // Função para aplicar filtros rápidos
    const aplicarFiltroRapido = (tipo: string) => {
        const hoje = new Date()
        
        switch (tipo) {
            case 'hoje':
                setData(hoje.toISOString().split('T')[0])
                break
            case 'semana':
                const semana = new Date()
                semana.setDate(hoje.getDate() - 7)
                setData(semana.toISOString().split('T')[0])
                break
            case 'mes':
                const mes = new Date()
                mes.setMonth(hoje.getMonth() - 1)
                setData(mes.toISOString().split('T')[0])
                break
            case '30dias':
                const dias30 = new Date()
                dias30.setDate(hoje.getDate() - 30)
                setData(dias30.toISOString().split('T')[0])
                break
            case 'limpar':
                setData('')
                break
        }
        setPaginaAtual(1)
    }

    // Buscar cancelamentos
    const buscarCancelamentos = useCallback(async () => {
        setCarregando(true)
        try {
            const offset = (paginaAtual - 1) * itensPorPagina
            const params: any = {
                limit: itensPorPagina,
                offset: offset
            }
            
            // Adicionar filtro de data se selecionado
            if (data) {
                params.data = data
            }
            
            const resultado = await cancelamentoAPI.listarCancelamentos(params)
            setCancelamentos(resultado.cancelamentos || [])
            setTotal(resultado.total || 0)
        } catch (error: any) {
            console.error('Erro ao buscar cancelamentos:', error)
            alert(error.message || 'Erro ao buscar cancelamentos')
        } finally {
            setCarregando(false)
        }
    }, [paginaAtual, itensPorPagina, data])

    useEffect(() => {
        buscarCancelamentos()
    }, [buscarCancelamentos])

    // Função para iniciar edição do motivo
    const iniciarEdicaoMotivo = (cancelamento: any) => {
        setEditandoMotivo(cancelamento.id)
        // Preencher com o motivo anterior, se existir
        setNovoMotivo(cancelamento.motivo && cancelamento.motivo.trim() ? cancelamento.motivo : '')
    }

    // Função para cancelar edição
    const cancelarEdicao = () => {
        setEditandoMotivo(null)
        setNovoMotivo('')
    }

    // Função para salvar motivo
    const salvarMotivo = async (cancelamentoId: number) => {
        if (!novoMotivo.trim()) {
            setModalMensagem({
                isOpen: true,
                mensagem: 'O motivo não pode estar vazio',
                tipo: 'aviso'
            })
            return
        }

        setSalvandoMotivo(true)
        try {
            await cancelamentoAPI.atualizarMotivo(cancelamentoId, novoMotivo.trim())
            // Atualizar a lista
            await buscarCancelamentos()
            setEditandoMotivo(null)
            setNovoMotivo('')
            setModalMensagem({
                isOpen: true,
                mensagem: 'Motivo atualizado com sucesso!',
                tipo: 'sucesso'
            })
        } catch (error: any) {
            console.error('Erro ao salvar motivo:', error)
            setModalMensagem({
                isOpen: true,
                mensagem: error.message || 'Erro ao salvar motivo',
                tipo: 'erro'
            })
        } finally {
            setSalvandoMotivo(false)
        }
    }
    
    // Função para fechar modal de mensagem
    const fecharModalMensagem = () => {
        setModalMensagem({
            isOpen: false,
            mensagem: '',
            tipo: 'sucesso'
        })
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        {/* Cabeçalho */}
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <i className="bi bi-x-circle text-red-600"></i>
                                Operações Canceladas
                            </h1>
                            <p className="text-gray-600">
                                Listagem de operações canceladas
                            </p>
                        </div>

                        {/* Barra de filtros */}
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <div className="flex flex-col gap-4">
                                {/* Filtros rápidos */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Filtros rápidos:</span>
                                    <button
                                        onClick={() => aplicarFiltroRapido('hoje')}
                                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        Hoje
                                    </button>
                                    <button
                                        onClick={() => aplicarFiltroRapido('semana')}
                                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        Últimos 7 dias
                                    </button>
                                    <button
                                        onClick={() => aplicarFiltroRapido('30dias')}
                                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        Últimos 30 dias
                                    </button>
                                    <button
                                        onClick={() => aplicarFiltroRapido('mes')}
                                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        Último mês
                                    </button>
                                    {data && (
                                        <button
                                            onClick={() => aplicarFiltroRapido('limpar')}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <i className="bi bi-x-circle mr-1"></i>
                                            Limpar filtro
                                        </button>
                                    )}
                                </div>

                                {/* Filtro por data */}
                                <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                            Data:
                                        </label>
                                        <input
                                            type="date"
                                            value={data}
                                            onChange={(e) => {
                                                setData(e.target.value)
                                                setPaginaAtual(1)
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <select
                                            value={itensPorPagina}
                                            onChange={(e) => {
                                                setItensPorPagina(Number(e.target.value))
                                                setPaginaAtual(1)
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value={10}>10 por página</option>
                                            <option value={20}>20 por página</option>
                                            <option value={50}>50 por página</option>
                                            <option value={100}>100 por página</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabela de cancelamentos */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {carregando ? (
                                <div className="p-8 text-center">
                                    <i className="bi bi-arrow-repeat animate-spin text-3xl text-blue-600"></i>
                                    <p className="mt-2 text-gray-600">Carregando cancelamentos...</p>
                                </div>
                            ) : cancelamentos.length === 0 ? (
                                <div className="p-8 text-center">
                                    <i className="bi bi-inbox text-4xl text-gray-400 mb-2"></i>
                                    <p className="text-gray-600">Nenhum cancelamento encontrado</p>
                                    {data && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Tente ajustar o filtro de data
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Funcionário
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Operação
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Data Cancelamento
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Motivo
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {cancelamentos.map((cancelamento) => (
                                                <tr key={cancelamento.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {cancelamento.funcionario_nome || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {cancelamento.operacao_nome || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {cancelamento.data_cancelamento || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                            {cancelamento.status || 'Cancelado'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {editandoMotivo === cancelamento.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={novoMotivo}
                                                                    onChange={(e) => setNovoMotivo(e.target.value)}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                    placeholder="Digite o motivo do cancelamento..."
                                                                    disabled={salvandoMotivo}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => salvarMotivo(cancelamento.id)}
                                                                    disabled={salvandoMotivo}
                                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-1"
                                                                    title="Salvar"
                                                                >
                                                                    <i className="bi bi-check-lg"></i>
                                                                    {salvandoMotivo ? 'Salvando...' : 'Salvar'}
                                                                </button>
                                                                <button
                                                                    onClick={cancelarEdicao}
                                                                    disabled={salvandoMotivo}
                                                                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 flex items-center gap-1"
                                                                    title="Cancelar"
                                                                >
                                                                    <i className="bi bi-x-lg"></i>
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-900 flex-1">
                                                                    {cancelamento.motivo && cancelamento.motivo.trim() ? (
                                                                        cancelamento.motivo
                                                                    ) : (
                                                                        <span className="text-gray-400 italic">Sem motivo informado</span>
                                                                    )}
                                                                </span>
                                                                <button
                                                                    onClick={() => iniciarEdicaoMotivo(cancelamento)}
                                                                    className="px-2 py-1 text-blue-600 hover:text-blue-800 transition-colors"
                                                                    title="Editar motivo"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Paginação */}
                        {total > 0 && (
                            <Paginacao
                                totalItens={total}
                                itensPorPagina={itensPorPagina}
                                paginaAtual={paginaAtual}
                                onPageChange={setPaginaAtual}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modal de Mensagem */}
            <ModalBase
                isOpen={modalMensagem.isOpen}
                onClose={fecharModalMensagem}
                titulo={modalMensagem.tipo === 'sucesso' ? 'Sucesso' : modalMensagem.tipo === 'erro' ? 'Erro' : 'Aviso'}
                icone={modalMensagem.tipo === 'sucesso' ? 'bi bi-check-circle-fill' : modalMensagem.tipo === 'erro' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-info-circle-fill'}
                corHeader={modalMensagem.tipo === 'sucesso' ? 'verde' : modalMensagem.tipo === 'erro' ? 'vermelho' : 'laranja'}
                maxWidth="sm"
                footer={
                    <button
                        onClick={fecharModalMensagem}
                        className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity"
                        style={{ 
                            backgroundColor: modalMensagem.tipo === 'sucesso' ? '#16a34a' : 
                                           modalMensagem.tipo === 'erro' ? '#dc2626' : 
                                           'var(--bg-laranja)' 
                        }}
                    >
                        OK
                    </button>
                }
            >
                <p className="text-gray-700">{modalMensagem.mensagem}</p>
            </ModalBase>
        </div>
    )
}

export default OperacoesCanceladas
