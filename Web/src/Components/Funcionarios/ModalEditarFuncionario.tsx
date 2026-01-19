import { useState, useEffect } from 'react'
import { operacoesAPI } from '../../api/api'

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

interface ModalEditarFuncionarioProps {
    isOpen: boolean
    onClose: () => void
    onSave: (funcionario: Omit<Funcionario, 'id'> & { operacoes_ids?: number[] }) => void
    funcionarioEditando?: Funcionario | null
}

const ModalEditarFuncionario = ({ isOpen, onClose, onSave, funcionarioEditando }: ModalEditarFuncionarioProps) => {
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tag, setTag] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [turno, setTurno] = useState('')
    const [operacoesDisponiveis, setOperacoesDisponiveis] = useState<Array<{id: number; operacao: string}>>([])
    const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<number[]>([])

    useEffect(() => {
        carregarOperacoes()
    }, [])

    useEffect(() => {
        if (funcionarioEditando) {
            setMatricula(funcionarioEditando.matricula || '')
            setNome(funcionarioEditando.nome || '')
            setTag(funcionarioEditando.tag || '')
            setAtivo(funcionarioEditando.ativo !== undefined ? funcionarioEditando.ativo : true)
            setTurno(funcionarioEditando.turno || '')
            // Carregar operações habilitadas
            if (funcionarioEditando.operacoes_habilitadas) {
                const ids = funcionarioEditando.operacoes_habilitadas.map(op => op.operacao_id)
                setOperacoesSelecionadas(ids)
            } else {
                setOperacoesSelecionadas([])
            }
        } else {
            setMatricula('')
            setNome('')
            setTag('')
            setAtivo(true)
            setTurno('')
            setOperacoesSelecionadas([])
        }
    }, [funcionarioEditando])

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ 
            matricula, 
            nome, 
            tag, 
            ativo, 
            turno,
            operacoes_ids: operacoesSelecionadas
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header do Modal */}
                <div className="text-white px-6 py-5 flex shrink-0" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <i className="bi bi-person-gear text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    Editar Funcionário
                                </h3>
                                <p className="text-sm text-white text-opacity-90 mt-0.5">
                                    Atualize as informações do funcionário
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                            title="Fechar modal (ESC)"
                        >
                            <i className="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                </div>
                
                {/* Conteúdo do Modal - Scrollable */}
                <form id="funcionario-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="space-y-4">
                        {/* Seção: Informações Básicas */}
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <i className="bi bi-info-circle text-blue-600"></i>
                                </div>
                                <h4 className="text-base font-semibold text-gray-800">
                                    Informações Básicas
                                </h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tag RFID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ex: 1234567890"
                                        value={tag || ''}
                                        onChange={(e) => setTag(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Código da tag RFID do funcionário (opcional)
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Matrícula <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ex: 12345"
                                        required
                                        value={matricula}
                                        onChange={(e) => setMatricula(e.target.value)}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome Completo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ex: João Silva"
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                    />
                                </div>
                                
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={ativo}
                                            onChange={(e) => setAtivo(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Funcionário Ativo</span>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Funcionários inativos não podem realizar operações
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Seção: Operação e Turno */}
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <i className="bi bi-briefcase text-purple-600"></i>
                                </div>
                                <h4 className="text-base font-semibold text-gray-800">
                                    Operação e Turno
                                </h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Turno
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                        value={turno}
                                        onChange={(e) => setTurno(e.target.value)}
                                    >
                                        <option value="">Selecione o turno</option>
                                        <option value="matutino">Matutino</option>
                                        <option value="vespertino">Vespertino</option>
                                        <option value="noturno">Noturno</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Turno de trabalho do funcionário
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Habilitado na Operação
                                    </label>
                                    <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto">
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
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Selecione as operações em que o funcionário está habilitado
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Botões do Modal - Fixed Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="funcionario-form"
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--bg-azul)' }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '0.9'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '1'
                            }
                        }}
                    >
                        <i className="bi bi-check-circle-fill"></i>
                        <span>Salvar Alterações</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalEditarFuncionario

