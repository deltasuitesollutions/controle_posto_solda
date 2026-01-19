import React, { useState, useRef, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalEditarFuncionario from '../Components/Funcionarios/ModalEditarFuncionario'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { funcionariosAPI, operacoesAPI } from '../api/api'

interface OperacaoHabilitada {
    operacao_habilitada_id: number
    operacao_id: number
    data_habilitacao?: string
    codigo_operacao: string
    nome: string
}

interface Funcionario {
    id: number
    matricula: string
    nome: string
    tag?: string
    ativo: boolean
    habilitado_operacao?: boolean
    operacao?: string
    turno?: string
    operacoes_habilitadas?: OperacaoHabilitada[]
}

const Funcionarios = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tag, setTag] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [turno, setTurno] = useState('')
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
    const [carregando, setCarregando] = useState(false)
    const [modalEditarAberto, setModalEditarAberto] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalStatusAberto, setModalStatusAberto] = useState(false)
    const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const rfidInputRef = useRef<HTMLInputElement>(null)
    const [operacoesDisponiveis, setOperacoesDisponiveis] = useState<Array<{id: number; operacao: string}>>([])
    const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<number[]>([])

    const fecharModal = () => {
        setModalEditarAberto(false)
        setModalExcluirAberto(false)
        setModalStatusAberto(false)
        setFuncionarioSelecionado(null)
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement
            const isInputField = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'
            
            if (!isInputField && rfidInputRef.current && (e.key.length === 1 || e.key === 'Enter')) {
                rfidInputRef.current.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarFuncionarios()
        }
    }, [abaAtiva])

    useEffect(() => {
        carregarOperacoes()
    }, [])

    const carregarOperacoes = async () => {
        try {
            const dados = await operacoesAPI.listarTodos()
            // Converter para formato com id numérico
            const operacoesFormatadas = dados.map((op: any) => {
                // O id pode vir como número ou string
                const id = typeof op.id === 'string' ? parseInt(op.id) : (op.id || op.operacao_id || 0)
                const nome = op.operacao || op.nome || op.codigo_operacao || ''
                return {
                    id: id,
                    operacao: nome
                }
            }).filter((op: any) => op.id > 0 && op.operacao)
            setOperacoesDisponiveis(operacoesFormatadas)
        } catch (error: any) {
            console.error('Erro ao carregar operações:', error)
            setOperacoesDisponiveis([])
        }
    }

    const carregarFuncionarios = async () => {
        setCarregando(true)
        try {
            const dados = await funcionariosAPI.listarTodos()
            
            if (!Array.isArray(dados)) {
                setFuncionarios([])
                return
            }
            
            const dadosNormalizados = dados.map((func: any) => ({
                ...func,
                id: func.id || func.funcionario_id,
                tag: func.tag || func.tag_id || '',
                ativo: func.ativo !== undefined ? func.ativo : true
            }))
            setFuncionarios(dadosNormalizados)
        } catch (error: any) {
            alert(`Erro ao carregar funcionários: ${error?.message || 'Erro desconhecido'}`)
            setFuncionarios([])
        } finally {
            setCarregando(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            const dadosFuncionario: { matricula: string; nome: string; ativo?: boolean; tag?: string; turno: string; operacoes_ids?: number[] } = {
                matricula,
                nome,
                ativo,
                turno: turno || '',
            }
            if (tag.trim()) {
                dadosFuncionario.tag = tag.trim()
            }
            if (operacoesSelecionadas.length > 0) {
                dadosFuncionario.operacoes_ids = operacoesSelecionadas
            }
            
            await funcionariosAPI.criar(dadosFuncionario)
            
            setMatricula('')
            setNome('')
            setTag('')
            setAtivo(true)
            setTurno('')
            setOperacoesSelecionadas([])
            
            if (abaAtiva === 'listar') {
                await carregarFuncionarios()
            }
            
            setTimeout(() => {
                rfidInputRef.current?.focus()
            }, 100)
            
            alert('Funcionário cadastrado com sucesso!')
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao cadastrar funcionário. Tente novamente.'
            
            if (errorMessage.toLowerCase().includes('tag rfid') && 
                (errorMessage.toLowerCase().includes('já está cadastrada') || 
                 errorMessage.toLowerCase().includes('já está associada'))) {
                alert(`ATENÇÃO: ${errorMessage}\n\nEssa tag RFID já está cadastrada no sistema.`)
            } else {
                alert(`Erro ao cadastrar funcionário: ${errorMessage}`)
            }
        }
    }

    const handleEditarFuncionario = (funcionario: Funcionario) => {
        const funcionarioCompleto = {
            ...funcionario,
            id: funcionario.id || (funcionario as any).funcionario_id,
            tag: funcionario.tag || (funcionario as any).tag_id || ''
        }
        setFuncionarioSelecionado(funcionarioCompleto)
        setModalEditarAberto(true)
    }

    const handleSalvarEdicao = async (funcionarioAtualizado: Omit<Funcionario, 'id'> & { operacoes_ids?: number[] }) => {
        if (!funcionarioSelecionado) return
        
        const funcionarioId = funcionarioSelecionado.id || (funcionarioSelecionado as any).funcionario_id
        if (!funcionarioId) {
            alert('Erro: ID do funcionário não encontrado')
            return
        }
        
        try {
            const dadosAtualizacao: { nome: string; ativo?: boolean; tag?: string; turno: string; operacoes_ids?: number[] } = {
                nome: funcionarioAtualizado.nome,
                ativo: funcionarioAtualizado.ativo,
                turno: funcionarioAtualizado.turno || '',
            }
            if (funcionarioAtualizado.tag !== undefined) {
                dadosAtualizacao.tag = funcionarioAtualizado.tag || ''
            }
            if (funcionarioAtualizado.operacoes_ids !== undefined) {
                dadosAtualizacao.operacoes_ids = funcionarioAtualizado.operacoes_ids
            }
            
            await funcionariosAPI.atualizar(funcionarioId, dadosAtualizacao)
            
            await carregarFuncionarios()
            fecharModal()
            alert('Funcionário atualizado com sucesso!')
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao atualizar funcionário. Tente novamente.'
            
            if (errorMessage.toLowerCase().includes('tag rfid') && 
                (errorMessage.toLowerCase().includes('já está cadastrada') || 
                 errorMessage.toLowerCase().includes('já está associada'))) {
                alert(`ATENÇÃO: ${errorMessage}\n\nEssa tag RFID já está cadastrada no sistema.`)
            } else {
                alert(`Erro ao atualizar funcionário: ${errorMessage}`)
            }
        }
    }

    const handleExcluirFuncionario = (funcionario: Funcionario) => {
        const funcionarioCompleto = {
            ...funcionario,
            id: funcionario.id || (funcionario as any).funcionario_id
        }
        setFuncionarioSelecionado(funcionarioCompleto)
        setModalExcluirAberto(true)
    }

    const handleAbrirModalStatus = (funcionario: Funcionario) => {
        const funcionarioCompleto = {
            ...funcionario,
            id: funcionario.id || (funcionario as any).funcionario_id
        }
        setFuncionarioSelecionado(funcionarioCompleto)
        setModalStatusAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!funcionarioSelecionado) return
        
        const funcionarioId = funcionarioSelecionado.id || (funcionarioSelecionado as any).funcionario_id
        if (!funcionarioId) {
            alert('Erro: ID do funcionário não encontrado')
            return
        }
        
        try {
            await funcionariosAPI.deletar(funcionarioId)
            await carregarFuncionarios()
            fecharModal()
            alert('Funcionário excluído com sucesso!')
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao excluir funcionário. Tente novamente.'
            alert(`Erro ao excluir funcionário: ${errorMessage}`)
        }
    }

    const handleConfirmarMudancaStatus = async () => {
        if (!funcionarioSelecionado) return
        
        const funcionarioId = funcionarioSelecionado.id || (funcionarioSelecionado as any).funcionario_id
        if (!funcionarioId) {
            alert('Erro: ID do funcionário não encontrado')
            return
        }
        
        try {
            const novoStatus = !funcionarioSelecionado.ativo
            const dadosAtualizacao: { nome: string; ativo: boolean; turno: string; tag?: string } = {
                nome: funcionarioSelecionado.nome,
                ativo: novoStatus,
                turno: funcionarioSelecionado.turno || '',
            }
            const tagAtual = funcionarioSelecionado.tag || (funcionarioSelecionado as any).tag_id
            if (tagAtual) {
                dadosAtualizacao.tag = tagAtual
            }
            await funcionariosAPI.atualizar(funcionarioId, dadosAtualizacao)
            await carregarFuncionarios()
            fecharModal()
            alert(`Funcionário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao alterar status do funcionário. Tente novamente.'
            alert(`Erro ao alterar status: ${errorMessage}`)
        }
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const funcionariosPaginaAtual = funcionarios.slice(indiceInicio, indiceFim)

    useEffect(() => {
        const totalPaginas = Math.ceil(funcionarios.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [funcionarios.length, itensPorPagina, paginaAtual])

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
                                    onClick={() => setAbaAtiva('cadastrar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-person-plus-fill mr-2"></i>
                                    Cadastrar Funcionário
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
                                    Listar Funcionários
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    <form id="form-funcionario" onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tag RFID
                                            </label>
                                            <input
                                                ref={rfidInputRef}
                                                type="text"
                                                id='funcionario-tag-rfid'
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder='Passe o crachá na marcação abaixo'
                                                value={tag}
                                                onChange={(e) => setTag(e.target.value)}
                                                autoFocus
                                                autoComplete="off"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Matrícula
                                                </label>
                                                <input
                                                    type="text"
                                                    id='funcionario-matricula'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: 12345'
                                                    value={matricula}
                                                    onChange={(e) => setMatricula(e.target.value)}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome
                                                </label>
                                                <input
                                                    type='text'
                                                    id='funcionario-nome'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: João Silva'
                                                    value={nome}
                                                    onChange={(e) => setNome(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type='checkbox'
                                                    id='funcionario-ativo'
                                                    checked={ativo}
                                                    onChange={(e) => setAtivo(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Funcionário Ativo</span>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Turno
                                                </label>
                                                <select
                                                    id='funcionario-turno'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={turno}
                                                    onChange={(e) => setTurno(e.target.value)}
                                                >
                                                    <option value="">Selecione o turno</option>
                                                    <option value="matutino">Matutino</option>
                                                    <option value="vespertino">Vespertino</option>
                                                    <option value="noturno">Noturno</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Habilitado na Operação
                                                </label>
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white max-h-40 overflow-y-auto">
                                                    {operacoesDisponiveis.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {operacoesDisponiveis.map((op) => (
                                                                <label key={op.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={operacoesSelecionadas.includes(op.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setOperacoesSelecionadas([...operacoesSelecionadas, op.id])
                                                                            } else {
                                                                                setOperacoesSelecionadas(operacoesSelecionadas.filter(id => id !== op.id))
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">{op.operacao}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 text-sm">Carregando operações...</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Selecione as operações em que o funcionário está habilitado
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button 
                                                type='submit' 
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className="bi bi-person-plus-fill"></i>
                                                <span>Cadastrar Funcionário</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        {carregando ? null : funcionarios.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Matrícula
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Nome
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Tag RFID
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Operação
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Turno
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Ações
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {funcionariosPaginaAtual.map((funcionario) => {
                                                            const funcionarioId = funcionario.id || (funcionario as any).funcionario_id || funcionario.matricula
                                                            return (
                                                            <tr key={funcionarioId} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.matricula}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.nome}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.tag || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        funcionario.ativo 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {funcionario.ativo ? 'Ativo' : 'Inativo'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    {funcionario.operacoes_habilitadas && funcionario.operacoes_habilitadas.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {funcionario.operacoes_habilitadas.map((op) => (
                                                                                <span 
                                                                                    key={op.operacao_habilitada_id}
                                                                                    className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                                                                                >
                                                                                    {op.nome || op.codigo_operacao}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                            Não habilitado
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.turno ? (
                                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                                                                            {funcionario.turno}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                            Não definido
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarFuncionario(funcionario)}
                                                                            className="p-2 rounded transition-colors hover:opacity-80"
                                                                            style={{ color: 'var(--bg-azul)' }}
                                                                            title="Editar funcionário"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAbrirModalStatus(funcionario)}
                                                                            className={`p-2 rounded transition-colors hover:opacity-80 ${
                                                                                funcionario.ativo 
                                                                                    ? 'text-orange-600 hover:text-orange-800' 
                                                                                    : 'text-green-600 hover:text-green-800'
                                                                            }`}
                                                                            title={funcionario.ativo ? 'Desativar funcionário' : 'Ativar funcionário'}
                                                                        >
                                                                            <i className={`bi ${funcionario.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcluirFuncionario(funcionario)}
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                            title="Excluir funcionário"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                                {funcionarios.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={funcionarios.length}
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
                                                    Nenhum funcionário cadastrado
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

            <ModalEditarFuncionario
                isOpen={modalEditarAberto}
                onClose={fecharModal}
                onSave={handleSalvarEdicao}
                funcionarioEditando={funcionarioSelecionado}
            />

            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir Funcionário"
                mensagem="Tem certeza que deseja excluir este funcionário?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="laranja"
            />

            <ModalConfirmacao
                isOpen={modalStatusAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarMudancaStatus}
                titulo="Alterar Status"
                mensagem="Deseja alterar o status deste funcionário?"
                textoConfirmar="Confirmar"
                textoCancelar="Cancelar"
                corHeader={funcionarioSelecionado?.ativo ? 'laranja' : 'azul'}
                item={funcionarioSelecionado ? {
                    matricula: funcionarioSelecionado.matricula,
                    nome: funcionarioSelecionado.nome,
                    status: funcionarioSelecionado.ativo ? 'Ativo' : 'Inativo',
                    novoStatus: funcionarioSelecionado.ativo ? 'Inativo' : 'Ativo'
                } : undefined}
                camposItem={['matricula', 'nome']}
                mostrarDetalhes={true}
            />

        </div>
    )
}

export default Funcionarios