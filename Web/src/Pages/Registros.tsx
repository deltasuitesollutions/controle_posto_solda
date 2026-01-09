import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalFiltro from '../Components/Compartilhados/ModalFiltro'
import { registrosAPI, funcionariosAPI, modelosAPI } from '../api/api'

interface Registro {
    id: number
    data: string
    hora?: string
    operador?: string
    matricula?: string
    posto?: string
    produto?: string
    quantidade?: number
    turno?: string | number
}

const Registros = () => {
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [modalAberto, setModalAberto] = useState<string | null>(null)
    const [carregando, setCarregando] = useState(false)
    const [filtros, setFiltros] = useState({
        posto: [] as string[],
        horarioInicio: '',
        horarioFim: '',
        turno: [] as string[],
        data: '',
        produto: [] as string[],
        matricula: [] as string[],
        operador: [] as string[]
    })

    // Carrega registros ao montar e quando filtros mudam - chamada para registros_controller.py
    useEffect(() => {
        const carregarRegistros = async () => {
            try {
                setCarregando(true)
                const dados = await registrosAPI.listar({
                    limit: itensPorPagina,
                    offset: (paginaAtual - 1) * itensPorPagina,
                    data: filtros.data || undefined,
                    posto: filtros.posto.length > 0 ? filtros.posto[0] : undefined,
                    turno: filtros.turno.length > 0 ? filtros.turno[0].replace('Turno ', '') : undefined
                })
                
                // Mapear dados da API para o formato esperado
                const registrosList = dados?.registros || []
                const registrosMapeados = registrosList.map((r: any) => ({
                    id: r.id,
                    data: r.data_raw || r.data || '',
                    hora: r.hora_inicio || '',
                    operador: r.funcionario?.nome || '',
                    matricula: r.funcionario?.matricula || '',
                    posto: r.posto || '',
                    produto: r.modelo?.descricao || r.modelo?.codigo || '',
                    quantidade: undefined,
                    turno: r.turno ? `Turno ${r.turno}` : ''
                }))
                setRegistros(registrosMapeados)
            } catch (error) {
                console.error('Erro ao carregar registros:', error)
                setRegistros([])
            } finally {
                setCarregando(false)
            }
        }
        carregarRegistros()
    }, [paginaAtual, itensPorPagina, filtros.data, filtros.posto, filtros.turno])

    const [registros, setRegistros] = useState<Registro[]>([])
    const [opcoesPosto, setOpcoesPosto] = useState<{ id: string; label: string }[]>([])
    const [opcoesTurno, setOpcoesTurno] = useState<{ id: string; label: string }[]>([])
    const [opcoesProduto, setOpcoesProduto] = useState<{ id: string; label: string }[]>([])
    const [opcoesMatricula, setOpcoesMatricula] = useState<{ id: string; label: string }[]>([])
    const [opcoesOperador, setOpcoesOperador] = useState<{ id: string; label: string }[]>([])

    // Carrega opções de filtros dinamicamente
    useEffect(() => {
        const carregarOpcoesFiltros = async () => {
            try {
                // Carregar funcionários e modelos
                const [funcionariosData, modelosData] = await Promise.all([
                    funcionariosAPI.listar(),
                    modelosAPI.listar()
                ])

                // Mapear funcionários para opções de matrícula e operador
                const funcionarios = funcionariosData || []
                const matriculas = funcionarios.map((f: any) => ({
                    id: f.matricula,
                    label: f.matricula
                }))
                const operadores = funcionarios.map((f: any) => ({
                    id: f.nome,
                    label: f.nome
                }))
                setOpcoesMatricula(matriculas)
                setOpcoesOperador(operadores)

                // Mapear modelos para opções de produto
                const modelos = modelosData || []
                const produtos = modelos.map((m: any) => ({
                    id: m.codigo,
                    label: m.descricao || m.codigo
                }))
                setOpcoesProduto(produtos)

                // Carregar registros para extrair postos e turnos únicos
                const registrosData = await registrosAPI.listar({ limit: 1000, offset: 0 })
                const registrosList = registrosData?.registros || []
                
                // Extrair postos únicos
                const postosUnicos = new Set<string>()
                registrosList.forEach((r: any) => {
                    if (r.posto) postosUnicos.add(r.posto)
                })
                const postos = Array.from(postosUnicos).sort().map(p => ({
                    id: p,
                    label: p
                }))
                setOpcoesPosto(postos)

                // Extrair turnos únicos (são fixos: 1 e 2, mas extraímos dos dados)
                const turnosUnicos = new Set<string>()
                registrosList.forEach((r: any) => {
                    if (r.turno) turnosUnicos.add(String(r.turno))
                })
                // Garantir que sempre temos Turno 1 e Turno 2
                const turnos = ['1', '2'].map(t => ({
                    id: `Turno ${t}`,
                    label: `Turno ${t}`
                }))
                setOpcoesTurno(turnos)
            } catch (error) {
                console.error('Erro ao carregar opções de filtros:', error)
            }
        }
        carregarOpcoesFiltros()
    }, [])

    // Filtrar registros
    const registrosFiltrados = registros.filter(registro => {
        // Comparar data (formato YYYY-MM-DD)
        const dataMatch = !filtros.data || registro.data === filtros.data || registro.data?.startsWith(filtros.data)
        
        return (
            (filtros.posto.length === 0 || filtros.posto.includes(registro.posto || '')) &&
            (filtros.turno.length === 0 || filtros.turno.includes(String(registro.turno || ''))) &&
            dataMatch &&
            (filtros.produto.length === 0 || filtros.produto.includes(registro.produto || '')) &&
            (filtros.matricula.length === 0 || filtros.matricula.includes(registro.matricula || '')) &&
            (filtros.operador.length === 0 || filtros.operador.includes(registro.operador || '')) &&
            (!filtros.horarioInicio || (registro.hora || '') >= filtros.horarioInicio) &&
            (!filtros.horarioFim || (registro.hora || '') <= filtros.horarioFim)
        )
    })

    const getTextoFiltro = (valores: string[]) => {
        if (valores.length === 0) return 'Selecione'
        if (valores.length === 1) return valores[0]
        return `${valores.length} selecionados`
    }

    const handleConfirmarFiltro = (tipo: string, valores: string[]) => {
        setFiltros({ ...filtros, [tipo]: valores })
        setModalAberto(null)
    }

    // Paginação
    const totalItens = registrosFiltrados.length
    const indiceInicial = totalItens > 0 ? (paginaAtual - 1) * itensPorPagina + 1 : 0
    const indiceFinal = Math.min(paginaAtual * itensPorPagina, totalItens)
    const registrosPagina = registrosFiltrados.slice(indiceInicial - 1, indiceFinal)
    const totalPaginas = Math.ceil(totalItens / itensPorPagina)

    const formatarData = (data: string) => {
        if (!data) return ''
        const date = new Date(data)
        return date.toLocaleDateString('pt-BR')
    }

    const handleExportar = () => {
        // TODO: Implementar exportação de planilha
        console.log('Exportar planilha')
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 md:pl-20">
                    <div className="w-full mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Filtros no topo */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                    {/* POSTO */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            POSTO
                                        </label>
                                        <button
                                            onClick={() => setModalAberto('posto')}
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative bg-white"
                                        >
                                            <span className={filtros.posto.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                                                {getTextoFiltro(filtros.posto)}
                                            </span>
                                            <i className="bi bi-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </button>
                                    </div>

                                    {/* Horário Início */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Horário Início
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="HH:MM"
                                            value={filtros.horarioInicio}
                                            onChange={(e) => {
                                                let valor = e.target.value.replace(/[^0-9:]/g, '')
                                                // Limita a 5 caracteres (HH:MM)
                                                if (valor.length > 5) valor = valor.slice(0, 5)
                                                // Adiciona : automaticamente após 2 dígitos
                                                if (valor.length === 2 && !valor.includes(':')) {
                                                    valor = valor + ':'
                                                }
                                                setFiltros({ ...filtros, horarioInicio: valor })
                                            }}
                                            maxLength={5}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Horário Fim */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Horário Fim
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="HH:MM"
                                            value={filtros.horarioFim}
                                            onChange={(e) => {
                                                let valor = e.target.value.replace(/[^0-9:]/g, '')
                                                // Limita a 5 caracteres (HH:MM)
                                                if (valor.length > 5) valor = valor.slice(0, 5)
                                                // Adiciona : automaticamente após 2 dígitos
                                                if (valor.length === 2 && !valor.includes(':')) {
                                                    valor = valor + ':'
                                                }
                                                setFiltros({ ...filtros, horarioFim: valor })
                                            }}
                                            maxLength={5}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* TURNO */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            TURNO
                                        </label>
                                        <button
                                            onClick={() => setModalAberto('turno')}
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative bg-white"
                                        >
                                            <span className={filtros.turno.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                                                {getTextoFiltro(filtros.turno)}
                                            </span>
                                            <i className="bi bi-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </button>
                                    </div>

                                    {/* DATA */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            DATA
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={filtros.data}
                                                onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="dd/mm/aaaa"
                                            />
                                        </div>
                                    </div>

                                    {/* Produto */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Produto
                                        </label>
                                        <button
                                            onClick={() => setModalAberto('produto')}
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative bg-white"
                                        >
                                            <span className={filtros.produto.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                                                {getTextoFiltro(filtros.produto)}
                                            </span>
                                            <i className="bi bi-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </button>
                                    </div>

                                    {/* MATRÍCULA */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            MATRÍCULA
                                        </label>
                                        <button
                                            onClick={() => setModalAberto('matricula')}
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative bg-white"
                                        >
                                            <span className={filtros.matricula.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                                                {getTextoFiltro(filtros.matricula)}
                                            </span>
                                            <i className="bi bi-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </button>
                                    </div>

                                    {/* OPERADOR */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            OPERADOR
                                        </label>
                                        <button
                                            onClick={() => setModalAberto('operador')}
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative bg-white"
                                        >
                                            <span className={filtros.operador.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                                                {getTextoFiltro(filtros.operador)}
                                            </span>
                                            <i className="bi bi-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Área de conteúdo - Tabela ou mensagem vazia */}
                            <div className="p-12">
                                {carregando ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <p className="text-gray-500 text-lg font-medium">Carregando...</p>
                                    </div>
                                ) : registrosPagina.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Data/Hora
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Operador
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Posto
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Produto
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantidade
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Turno
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {registrosPagina.map((registro) => (
                                                    <tr key={registro.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatarData(registro.data)} {registro.hora || ''}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.operador || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.posto || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.produto || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.quantidade || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.turno || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <p className="text-gray-500 text-lg font-medium">
                                            Nenhum registro encontrado
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Rodapé com paginação e exportação */}
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    {/* Paginação */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                                            disabled={paginaAtual === 1}
                                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            ◄ Anterior
                                        </button>
                                        <button
                                            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                                            disabled={paginaAtual >= totalPaginas}
                                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            Próximo ►
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700">Itens por página</span>
                                            <select
                                                value={itensPorPagina}
                                                onChange={(e) => {
                                                    setItensPorPagina(Number(e.target.value))
                                                    setPaginaAtual(1)
                                                }}
                                                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="10">10</option>
                                                <option value="20">20</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Botão Exportar e Contador */}
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={handleExportar}
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
                                            style={{ backgroundColor: 'var(--bg-azul)' }}
                                        >
                                            <i className="bi bi-file-earmark-spreadsheet"></i>
                                            Exportar planilha
                                        </button>
                                        <span className="text-sm text-gray-700">
                                            Mostrando {indiceInicial} - {indiceFinal} de {totalItens}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modais de Filtro */}
            {modalAberto === 'posto' && (
                <ModalFiltro
                    titulo="Posto"
                    opcoes={opcoesPosto}
                    valoresSelecionados={filtros.posto}
                    onConfirmar={(valores) => handleConfirmarFiltro('posto', valores)}
                    onCancelar={() => setModalAberto(null)}
                    onFechar={() => setModalAberto(null)}
                />
            )}

            {modalAberto === 'turno' && (
                <ModalFiltro
                    titulo="Turno"
                    opcoes={opcoesTurno}
                    valoresSelecionados={filtros.turno}
                    onConfirmar={(valores) => handleConfirmarFiltro('turno', valores)}
                    onCancelar={() => setModalAberto(null)}
                    onFechar={() => setModalAberto(null)}
                />
            )}

            {modalAberto === 'produto' && (
                <ModalFiltro
                    titulo="Produto"
                    opcoes={opcoesProduto}
                    valoresSelecionados={filtros.produto}
                    onConfirmar={(valores) => handleConfirmarFiltro('produto', valores)}
                    onCancelar={() => setModalAberto(null)}
                    onFechar={() => setModalAberto(null)}
                />
            )}

            {modalAberto === 'matricula' && (
                <ModalFiltro
                    titulo="Matrícula"
                    opcoes={opcoesMatricula}
                    valoresSelecionados={filtros.matricula}
                    onConfirmar={(valores) => handleConfirmarFiltro('matricula', valores)}
                    onCancelar={() => setModalAberto(null)}
                    onFechar={() => setModalAberto(null)}
                />
            )}

            {modalAberto === 'operador' && (
                <ModalFiltro
                    titulo="Operador"
                    opcoes={opcoesOperador}
                    valoresSelecionados={filtros.operador}
                    onConfirmar={(valores) => handleConfirmarFiltro('operador', valores)}
                    onCancelar={() => setModalAberto(null)}
                    onFechar={() => setModalAberto(null)}
                />
            )}
        </div>
    )
}

export default Registros
