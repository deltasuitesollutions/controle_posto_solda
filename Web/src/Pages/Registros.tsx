import { useState, useEffect, useCallback } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalFiltro from '../Components/Compartilhados/ModalFiltro'
import { registrosAPI } from '../api/api'
import { postosAPI } from '../api/api'
import { funcionariosAPI } from '../api/api'
import { modelosAPI } from '../api/api'

interface Registro {
    id: number
    data: string
    data_inicio?: string
    data_fim?: string
    hora?: string
    operador?: string
    matricula?: string
    posto?: string
    totem?: string
    produto?: string
    modelo?: string
    modelo_codigo?: string
    quantidade?: number
    turno?: string | number
    hora_inicio?: string
    hora_fim?: string
    operacao?: string
    comentarios?: string
    peca?: string
    pecas?: Array<{ id: number; codigo: string; nome: string }>
    codigo_producao?: string
}

const Registros = () => {
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [modalAberto, setModalAberto] = useState<string | null>(null)
    const [filtros, setFiltros] = useState({
        processo: ['subsolda1'] as string[],
        horarioInicio: '',
        horarioFim: '',
        turno: [] as string[],
        data: '',
        produto: [] as string[],
        matricula: [] as string[],
        operador: [] as string[]
    })

    const [registros, setRegistros] = useState<Registro[]>([])
    const [registrosSelecionados, setRegistrosSelecionados] = useState<Set<number>>(new Set())
    const [carregando, setCarregando] = useState(false)
    const [totalRegistros, setTotalRegistros] = useState(0)

    // Opções de filtros dinâmicas
    const [opcoesProcesso, setOpcoesProcesso] = useState<{ id: string; label: string }[]>([])
    const [opcoesTurno] = useState<{ id: string; label: string }[]>([
        { id: 'Turno 1', label: 'Turno 1' },
        { id: 'Turno 2', label: 'Turno 2' }
    ])
    const [opcoesProduto, setOpcoesProduto] = useState<{ id: string; label: string }[]>([])
    const [opcoesMatricula, setOpcoesMatricula] = useState<{ id: string; label: string }[]>([])
    const [opcoesOperador, setOpcoesOperador] = useState<{ id: string; label: string }[]>([])

    // Carregar opções de filtros
    useEffect(() => {
        const carregarOpcoesFiltros = async () => {
            try {
                // Carregar postos (processos)
                const postos = await postosAPI.listar()
                setOpcoesProcesso(postos.map((p: any) => ({ id: p.nome, label: p.nome })))

                // Carregar funcionários (operadores e matrículas)
                const funcionarios = await funcionariosAPI.listarTodos()
                setOpcoesOperador(funcionarios.map((f: any) => ({ id: f.nome, label: f.nome })))
                setOpcoesMatricula(funcionarios.map((f: any) => ({ id: f.matricula, label: f.matricula })))

                // Carregar modelos (produtos)
                const modelos = await modelosAPI.listarTodos()
                setOpcoesProduto(modelos.map((m: any) => ({ id: m.descricao || m.codigo, label: m.descricao || m.codigo })))
            } catch (error) {
                console.error('Erro ao carregar opções de filtros:', error)
            }
        }

        carregarOpcoesFiltros()
    }, [])

    // Buscar registros do backend
    const buscarRegistros = useCallback(async () => {
        setCarregando(true)
        try {
            const offset = (paginaAtual - 1) * itensPorPagina
            const params: any = {
                limit: itensPorPagina,
                offset: offset
            }

            if (filtros.data) {
                params.data = filtros.data
            }

            if (filtros.processo.length > 0) {
                params.posto = filtros.processo[0]
            }

            const resposta = await registrosAPI.listar(params)
            
            // Mapear dados do backend para o formato esperado
            const registrosMapeados: Registro[] = resposta.registros.map((reg: any) => ({
                id: reg.id,
                data: reg.data_inicio || '',
                data_inicio: reg.data_inicio || '',
                data_fim: reg.data_fim || '',
                hora: reg.hora_inicio || '',
                hora_inicio: reg.hora_inicio || '',
                hora_fim: reg.hora_fim || '',
                operador: reg.funcionario?.nome || '',
                matricula: reg.funcionario?.matricula || '',
                posto: reg.posto?.nome || reg.posto || '',
                totem: reg.totem?.nome || reg.totem?.id ? `Totem ${reg.totem.id}` : '',
                produto: reg.produto?.nome || reg.modelo?.descricao || reg.modelo?.codigo || '',
                modelo: reg.modelo?.descricao || reg.modelo?.codigo || '',
                modelo_codigo: reg.modelo?.codigo || '',
                quantidade: reg.quantidade || 0,
                turno: reg.funcionario?.turno || '',
                operacao: reg.operacao?.nome || reg.operacao?.codigo || '-',
                comentarios: reg.comentarios || '-',
                peca: reg.peca?.nome || reg.peca?.codigo || '',
                pecas: reg.pecas || [],
                codigo_producao: reg.codigo_producao || ''
            }))

            setRegistros(registrosMapeados)
            setTotalRegistros(resposta.total || 0)
        } catch (error) {
            console.error('Erro ao buscar registros:', error)
            setRegistros([])
            setTotalRegistros(0)
        } finally {
            setCarregando(false)
        }
    }, [paginaAtual, itensPorPagina, filtros.data, filtros.processo])

    // Buscar registros quando filtros ou paginação mudarem
    useEffect(() => {
        buscarRegistros()
    }, [buscarRegistros])

    // Filtrar registros localmente (filtros adicionais que não são suportados pelo backend)
    const registrosFiltrados = registros.filter(registro => {
        return (
            (filtros.turno.length === 0 || filtros.turno.includes(String(registro.turno || ''))) &&
            (filtros.produto.length === 0 || filtros.produto.includes(registro.produto || '')) &&
            (filtros.matricula.length === 0 || filtros.matricula.includes(registro.matricula || '')) &&
            (filtros.operador.length === 0 || filtros.operador.includes(registro.operador || '')) &&
            (!filtros.horarioInicio || (registro.hora_inicio || '') >= filtros.horarioInicio) &&
            (!filtros.horarioFim || (registro.hora_fim || registro.hora_inicio || '') <= filtros.horarioFim)
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
        // Resetar para primeira página quando filtros mudarem
        setPaginaAtual(1)
    }

    // Paginação (usando dados do backend, não precisa slice local)
    const totalItens = totalRegistros > 0 ? totalRegistros : registrosFiltrados.length
    const indiceInicial = totalItens > 0 ? (paginaAtual - 1) * itensPorPagina + 1 : 0
    const indiceFinal = Math.min(paginaAtual * itensPorPagina, totalItens)
    const registrosPagina = registrosFiltrados
    const totalPaginas = Math.ceil(totalItens / itensPorPagina)

    // Calcular estado de seleção da página atual
    const todosSelecionadosNaPagina = registrosPagina.length > 0 && 
        registrosPagina.every(reg => registrosSelecionados.has(reg.id))
    const algunsSelecionadosNaPagina = registrosPagina.some(reg => registrosSelecionados.has(reg.id))

    // Funções para gerenciar seleção de registros
    const handleToggleSelecionarTodos = () => {
        if (todosSelecionadosNaPagina) {
            // Desmarcar todos da página atual
            const novosSelecionados = new Set(registrosSelecionados)
            registrosPagina.forEach(reg => novosSelecionados.delete(reg.id))
            setRegistrosSelecionados(novosSelecionados)
        } else {
            // Marcar todos da página atual
            const novosSelecionados = new Set(registrosSelecionados)
            registrosPagina.forEach(reg => novosSelecionados.add(reg.id))
            setRegistrosSelecionados(novosSelecionados)
        }
    }

    const handleToggleSelecionarRegistro = (id: number) => {
        const novosSelecionados = new Set(registrosSelecionados)
        if (novosSelecionados.has(id)) {
            novosSelecionados.delete(id)
        } else {
            novosSelecionados.add(id)
        }
        setRegistrosSelecionados(novosSelecionados)
    }

    // Função para exportar registros selecionados
    const handleExportar = () => {
        // Se houver registros selecionados, exportar apenas eles
        // Caso contrário, exportar todos os registros filtrados
        const registrosParaExportar = registrosSelecionados.size > 0
            ? registrosFiltrados.filter(reg => registrosSelecionados.has(reg.id))
            : registrosFiltrados

        if (registrosParaExportar.length === 0) {
            alert('Nenhum registro para exportar')
            return
        }

        // Criar CSV
        const headers = [
            'Data Início', 
            'Data Fim', 
            'Totem', 
            'Posto', 
            'Operador', 
            'Matrícula', 
            'Turno', 
            'Operação', 
            'Produto', 
            'Modelo', 
            'Peça', 
            'Código Produção', 
            'Hora Início', 
            'Hora Fim', 
            'Quantidade', 
            'Comentários'
        ]
        const rows = registrosParaExportar.map(reg => [
            reg.data_inicio ? new Date(reg.data_inicio).toLocaleDateString('pt-BR') : '',
            reg.data_fim ? new Date(reg.data_fim).toLocaleDateString('pt-BR') : '',
            reg.totem || '',
            reg.posto || '',
            reg.operador || '',
            reg.matricula || '',
            String(reg.turno || ''),
            reg.operacao || '',
            reg.produto || '',
            reg.modelo || '',
            reg.peca || '',
            reg.codigo_producao || '',
            reg.hora_inicio || reg.hora || '',
            reg.hora_fim || '',
            String(reg.quantidade || ''),
            reg.comentarios || ''
        ])

        // Converter para CSV
        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\r\n')

        // Adicionar BOM para Excel reconhecer UTF-8
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        link.setAttribute('href', url)
        link.setAttribute('download', `registros_${timestamp}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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
                                    {/* PROCESSO */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            PROCESSO
                                        </label>
                                        <button
                                            onClick={() => setModalAberto('processo')}
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative bg-white"
                                        >
                                            <span className={filtros.processo.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                                                {getTextoFiltro(filtros.processo)}
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
                            <div className="p-4">
                                {carregando ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <p className="text-gray-500 text-sm font-medium">
                                            Carregando registros...
                                        </p>
                                    </div>
                                ) : registrosPagina.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                                        <input
                                                            type="checkbox"
                                                            checked={todosSelecionadosNaPagina}
                                                            ref={(input) => {
                                                                if (input) input.indeterminate = algunsSelecionadosNaPagina && !todosSelecionadosNaPagina
                                                            }}
                                                            onChange={handleToggleSelecionarTodos}
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Data Início
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Data Fim
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Totem
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Posto
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Operador
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Matrícula
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Turno
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Operação
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Produto
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Modelo
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Peça
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Código Produção
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Hora Início
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Hora Fim
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantidade
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Comentários
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {registrosPagina.map((registro) => (
                                                    <tr key={registro.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={registrosSelecionados.has(registro.id)}
                                                                onChange={() => handleToggleSelecionarRegistro(registro.id)}
                                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.data_inicio ? (() => {
                                                                try {
                                                                    const date = new Date(registro.data_inicio)
                                                                    return isNaN(date.getTime()) ? registro.data_inicio : date.toLocaleDateString('pt-BR')
                                                                } catch {
                                                                    return registro.data_inicio
                                                                }
                                                            })() : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.data_fim ? (() => {
                                                                try {
                                                                    const date = new Date(registro.data_fim)
                                                                    return isNaN(date.getTime()) ? registro.data_fim : date.toLocaleDateString('pt-BR')
                                                                } catch {
                                                                    return registro.data_fim
                                                                }
                                                            })() : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.totem || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.posto || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.operador || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.matricula || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.turno || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.operacao || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.produto || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.modelo || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.peca || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.codigo_producao || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.hora_inicio || registro.hora || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.hora_fim || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.quantidade || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {registro.comentarios || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <p className="text-gray-500 text-sm font-medium">
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
                                        {registrosSelecionados.size > 0 && (
                                            <span className="text-sm text-gray-700 font-medium">
                                                {registrosSelecionados.size} registro(s) selecionado(s)
                                            </span>
                                        )}
                                        <button
                                            onClick={handleExportar}
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
                                            style={{ backgroundColor: 'var(--bg-azul)' }}
                                        >
                                            <i className="bi bi-file-earmark-spreadsheet"></i>
                                            {registrosSelecionados.size > 0 
                                                ? `Exportar selecionados (${registrosSelecionados.size})`
                                                : 'Exportar planilha'
                                            }
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
            {modalAberto === 'processo' && (
                <ModalFiltro
                    titulo="Processo"
                    opcoes={opcoesProcesso}
                    valoresSelecionados={filtros.processo}
                    onConfirmar={(valores) => handleConfirmarFiltro('processo', valores)}
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
