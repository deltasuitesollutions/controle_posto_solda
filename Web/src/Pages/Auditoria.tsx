import { useState, useEffect, useCallback } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { cancelamentoAPI } from '../api/api'

const Auditoria = () => {
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(20)
    const [modalAberto, setModalAberto] = useState<string | null>(null)
    const [dataFiltroOperacoes, setDataFiltroOperacoes] = useState<string>(() => {
        const hoje = new Date()
        return hoje.toISOString().split('T')[0]
    })
    const [motivoCancelamento, setMotivoCancelamento] = useState('')
    const [registroParaCancelar, setRegistroParaCancelar] = useState<number | null>(null)

    const [operacoes, setOperacoes] = useState<any[]>([])
    const [carregandoOperacoes, setCarregandoOperacoes] = useState(false)
    const [totalOperacoes, setTotalOperacoes] = useState(0)

    // Buscar operações iniciadas
    const buscarOperacoes = useCallback(async () => {
        setCarregandoOperacoes(true)
        try {
            const offset = (paginaAtual - 1) * itensPorPagina
            const resultado = await cancelamentoAPI.listarOperacoesIniciadas({
                data: dataFiltroOperacoes,
                limit: itensPorPagina,
                offset: offset
            })
            setOperacoes(resultado.operacoes || [])
            setTotalOperacoes(resultado.total || 0)
        } catch (error: any) {
            console.error('Erro ao buscar operações:', error)
            alert(error.message || 'Erro ao buscar operações iniciadas')
        } finally {
            setCarregandoOperacoes(false)
        }
    }, [paginaAtual, itensPorPagina, dataFiltroOperacoes])

    useEffect(() => {
        buscarOperacoes()
    }, [buscarOperacoes])

    const handleCancelarOperacao = async () => {
        if (!registroParaCancelar) return
        if (!motivoCancelamento.trim()) {
            alert('Por favor, informe o motivo do cancelamento')
            return
        }

        try {
            await cancelamentoAPI.cancelar({
                registro_id: registroParaCancelar,
                motivo: motivoCancelamento.trim()
            })
            alert('Operação cancelada com sucesso!')
            setModalAberto(null)
            setMotivoCancelamento('')
            setRegistroParaCancelar(null)
            buscarOperacoes()
        } catch (error: any) {
            alert(error.message || 'Erro ao cancelar operação')
        }
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
                                <i className="bi bi-shield-check text-blue-600"></i>
                                Operações do dia
                            </h1>
                            <p className="text-gray-600">
                                Operações iniciadas por dia - Cancelar operações com erro
                            </p>
                        </div>

                        {/* Conteúdo - Operações Iniciadas */}
                        <>
                                {/* Barra de ações - Operações */}
                                <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="date"
                                            value={dataFiltroOperacoes}
                                            onChange={(e) => {
                                                setDataFiltroOperacoes(e.target.value)
                                                setPaginaAtual(1)
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={buscarOperacoes}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            <i className="bi bi-arrow-clockwise"></i>
                                            Atualizar
                                        </button>
                                        <button
                                            onClick={() => cancelamentoAPI.exportarCSV({ data_inicio: dataFiltroOperacoes })}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <i className="bi bi-download"></i>
                                            Exportar Cancelamentos CSV
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 font-medium">
                                            Total: <span className="text-blue-600">{totalOperacoes}</span> operações
                                        </span>
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

                                {/* Tabela de operações */}
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    {carregandoOperacoes ? (
                                        <div className="p-8 text-center">
                                            <i className="bi bi-arrow-repeat animate-spin text-3xl text-blue-600"></i>
                                            <p className="mt-2 text-gray-600">Carregando operações...</p>
                                        </div>
                                    ) : operacoes.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <i className="bi bi-inbox text-4xl text-gray-400 mb-2"></i>
                                            <p className="text-gray-600">Nenhuma operação encontrada para esta data</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Data/Hora
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Funcionário
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Posto
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Modelo
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Operação
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Ações
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {operacoes.map((operacao) => (
                                                        <tr key={operacao.registro_id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {operacao.data_inicio} {operacao.hora_inicio}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                <div>
                                                                    <span className="text-gray-900 font-medium">
                                                                        {operacao.funcionario?.nome || '-'}
                                                                    </span>
                                                                    {operacao.funcionario?.matricula && (
                                                                        <span className="text-xs text-gray-500 ml-2">
                                                                            ({operacao.funcionario.matricula})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {operacao.posto?.nome || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {operacao.modelo?.nome || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {operacao.operacao?.nome || operacao.operacao?.codigo || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                {operacao.cancelado ? (
                                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                        Cancelado
                                                                    </span>
                                                                ) : operacao.fim ? (
                                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                        Finalizado
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                        Em Andamento
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                                {!operacao.cancelado && !operacao.fim && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setRegistroParaCancelar(operacao.registro_id)
                                                                            setModalAberto('cancelar')
                                                                        }}
                                                                        className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                                                                        title="Cancelar operação"
                                                                    >
                                                                        <i className="bi bi-x-circle"></i>
                                                                    </button>
                                                                )}
                                                                {operacao.cancelado && (
                                                                    <div className="text-xs text-gray-500">
                                                                        <div>Motivo: {operacao.motivo_cancelamento}</div>
                                                                        {operacao.usuario_cancelou && (
                                                                            <div>Por: {operacao.usuario_cancelou.nome}</div>
                                                                        )}
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
                                {totalOperacoes > 0 && (
                                    <Paginacao
                                        totalItens={totalOperacoes}
                                        itensPorPagina={itensPorPagina}
                                        paginaAtual={paginaAtual}
                                        onPageChange={setPaginaAtual}
                                    />
                                )}
                        </>
                    </div>
                </div>
            </div>

            {/* Modais */}
            {/* Modal de Cancelamento */}
            {modalAberto === 'cancelar' && registroParaCancelar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        {/* Cabeçalho */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <i className="bi bi-x-circle text-red-600"></i>
                                Cancelar Operação
                            </h3>
                            <button
                                onClick={() => {
                                    setModalAberto(null)
                                    setMotivoCancelamento('')
                                    setRegistroParaCancelar(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i className="bi bi-x-lg text-xl"></i>
                            </button>
                        </div>

                        {/* Conteúdo */}
                        <div className="px-6 py-4 space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    <i className="bi bi-exclamation-triangle mr-2"></i>
                                    Você está prestes a cancelar uma operação. Esta ação não pode ser desfeita.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo do Cancelamento <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={motivoCancelamento}
                                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                                    placeholder="Descreva o motivo do cancelamento..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>

                        {/* Rodapé */}
                        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setModalAberto(null)
                                    setMotivoCancelamento('')
                                    setRegistroParaCancelar(null)
                                }}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCancelarOperacao}
                                disabled={!motivoCancelamento.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Auditoria

