import { useState, useEffect, useCallback } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { cancelamentoAPI } from '../api/api'

const OperacoesCanceladas = () => {
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(20)
    const [dataInicio, setDataInicio] = useState<string>(() => {
        const hoje = new Date()
        return hoje.toISOString().split('T')[0]
    })
    const [dataFim, setDataFim] = useState<string>(() => {
        const hoje = new Date()
        return hoje.toISOString().split('T')[0]
    })

    const [operacoes, setOperacoes] = useState<any[]>([])
    const [carregandoOperacoes, setCarregandoOperacoes] = useState(false)
    const [totalOperacoes, setTotalOperacoes] = useState(0)

    // Buscar operações canceladas
    const buscarOperacoes = useCallback(async () => {
        setCarregandoOperacoes(true)
        try {
            const offset = (paginaAtual - 1) * itensPorPagina
            const resultado = await cancelamentoAPI.listarCancelamentos({
                data_inicio: dataInicio,
                data_fim: dataFim,
                limit: itensPorPagina,
                offset: offset
            })
            setOperacoes(resultado.cancelamentos || [])
            setTotalOperacoes(resultado.total || 0)
        } catch (error: any) {
            console.error('Erro ao buscar operações canceladas:', error)
            alert(error.message || 'Erro ao buscar operações canceladas')
        } finally {
            setCarregandoOperacoes(false)
        }
    }, [paginaAtual, itensPorPagina, dataInicio, dataFim])

    useEffect(() => {
        buscarOperacoes()
    }, [buscarOperacoes])


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
                                Listagem de operações canceladas com filtros por data
                            </p>
                        </div>

                        {/* Conteúdo - Operações Canceladas */}
                        <>
                                {/* Barra de ações - Operações */}
                                <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-600">Data Início:</label>
                                            <input
                                                type="date"
                                                value={dataInicio}
                                                onChange={(e) => {
                                                    setDataInicio(e.target.value)
                                                    setPaginaAtual(1)
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-600">Data Fim:</label>
                                            <input
                                                type="date"
                                                value={dataFim}
                                                onChange={(e) => {
                                                    setDataFim(e.target.value)
                                                    setPaginaAtual(1)
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <button
                                            onClick={buscarOperacoes}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            <i className="bi bi-arrow-clockwise"></i>
                                            Atualizar
                                        </button>
                                        <button
                                            onClick={() => cancelamentoAPI.exportarCSV({ data_inicio: dataInicio, data_fim: dataFim })}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <i className="bi bi-download"></i>
                                            Exportar CSV
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
                                            <p className="text-gray-600">Nenhuma operação cancelada encontrada para o período selecionado</p>
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
                                                            Motivo Cancelamento
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Cancelado Por
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Data Cancelamento
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {operacoes.map((cancelamento) => (
                                                        <tr key={cancelamento.id || cancelamento.registro_id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {cancelamento.data_inicio || '-'} {cancelamento.hora_inicio || ''}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                <div>
                                                                    <span className="text-gray-900 font-medium">
                                                                        {cancelamento.funcionario?.nome || '-'}
                                                                    </span>
                                                                    {cancelamento.funcionario?.matricula && (
                                                                        <span className="text-xs text-gray-500 ml-2">
                                                                            ({cancelamento.funcionario.matricula})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {cancelamento.posto?.nome || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {cancelamento.modelo?.nome || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {cancelamento.operacao?.nome || cancelamento.operacao?.codigo || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                <div className="max-w-xs truncate" title={cancelamento.motivo || '-'}>
                                                                    {cancelamento.motivo || '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {cancelamento.usuario_cancelou?.nome || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {cancelamento.data_cancelamento || '-'}
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

        </div>
    )
}

export default OperacoesCanceladas

