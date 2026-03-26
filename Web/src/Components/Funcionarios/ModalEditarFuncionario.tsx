import { useState, useEffect, useRef } from 'react'
import { operacoesAPI, tagsTemporariasAPI } from '../../api/api'
import ModalConfirmacao from '../Compartilhados/ModalConfirmacao'
import ModalSucesso from '../Modais/ModalSucesso'
import ModalErro from '../Modais/ModalErro'

interface OperacaoHabilitada {
    operacao_habilitada_id: number
    operacao_id: number
    data_habilitacao?: string
    codigo_operacao: string
    nome: string
    habilitada?: boolean
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
    turnos?: string[]
    operacoes_habilitadas?: OperacaoHabilitada[]
}

interface ModalEditarFuncionarioProps {
    isOpen: boolean
    onClose: () => void
    onSave: (funcionario: Omit<Funcionario, 'id'> & { operacoes_ids?: number[]; turnos?: string[] }) => void
    funcionarioEditando?: Funcionario | null
}

const ModalEditarFuncionario = ({ isOpen, onClose, onSave, funcionarioEditando }: ModalEditarFuncionarioProps) => {
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tag, setTag] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [turno, setTurno] = useState('')
    const [turnosSelecionados, setTurnosSelecionados] = useState<string[]>([])
    const [operacoesDisponiveis, setOperacoesDisponiveis] = useState<Array<{id: number; operacao: string}>>([])
    const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<number[]>([])
    const [operacoesDropdownAberto, setOperacoesDropdownAberto] = useState(false)
    const operacoesDropdownRef = useRef<HTMLDivElement>(null)
    const [tagTemporaria, setTagTemporaria] = useState('')
    const [tagsTemporariasAtivas, setTagsTemporariasAtivas] = useState<Array<{id: number; tag_id: string; data_expiracao: string}>>([])
    const [carregandoTags, setCarregandoTags] = useState(false)
    const [criandoTag, setCriandoTag] = useState(false)
    const [modalExcluirTagAberto, setModalExcluirTagAberto] = useState(false)
    const [tagParaExcluir, setTagParaExcluir] = useState<string | null>(null)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const normalizarTagRfid = (valor: string) => valor.replace(/[\r\n\t\0]/g, '').trim()

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
            // Usar turnos se disponível, senão usar turno (compatibilidade)
            if (funcionarioEditando.turnos && funcionarioEditando.turnos.length > 0) {
                setTurnosSelecionados(funcionarioEditando.turnos)
            } else if (funcionarioEditando.turno) {
                setTurnosSelecionados([funcionarioEditando.turno])
            } else {
                setTurnosSelecionados([])
            }
            setTagTemporaria('')
            // Carregar operações habilitadas (filtrar apenas as que têm habilitada = true)
            if (funcionarioEditando.operacoes_habilitadas) {
                const ids = funcionarioEditando.operacoes_habilitadas
                    .filter(op => op.habilitada !== false)  // Filtrar apenas operações habilitadas
                    .map(op => op.operacao_id)
                setOperacoesSelecionadas(ids)
            } else {
                setOperacoesSelecionadas([])
            }
            // Carregar tags temporárias ativas
            carregarTagsTemporarias()
        } else {
            setMatricula('')
            setNome('')
            setTag('')
            setAtivo(true)
            setTurno('')
            setTurnosSelecionados([])
            setOperacoesSelecionadas([])
            setTagTemporaria('')
            setTagsTemporariasAtivas([])
        }
    }, [funcionarioEditando])

    const carregarTagsTemporarias = async () => {
        if (!funcionarioEditando?.id) return
        
        setCarregandoTags(true)
        try {
            const tags = await tagsTemporariasAPI.listarPorFuncionario(funcionarioEditando.id)
            console.log('Tags temporárias carregadas:', tags)
            // Garantir que é um array e tem a estrutura correta
            if (Array.isArray(tags)) {
                const tagsValidadas = tags.filter(tag => tag && tag.tag_id && tag.data_expiracao)
                setTagsTemporariasAtivas(tagsValidadas)
                console.log('Tags validadas:', tagsValidadas)
            } else {
                console.warn('Resposta da API não é um array:', tags)
                setTagsTemporariasAtivas([])
            }
        } catch (error: any) {
            console.error('Erro ao carregar tags temporárias:', error)
            setTagsTemporariasAtivas([])
        } finally {
            setCarregandoTags(false)
        }
    }

    const handleCriarTagTemporaria = async () => {
        if (!funcionarioEditando?.id) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do funcionário não encontrado')
            setModalErroAberto(true)
            return
        }

        const tagNormalizada = normalizarTagRfid(tagTemporaria)

        if (!tagNormalizada) {
            setTituloErro('Atenção!')
            setMensagemErro('Por favor, informe o código da tag temporária')
            setModalErroAberto(true)
            return
        }

        setCriandoTag(true)
        try {
            const tagCriada = await tagsTemporariasAPI.criar({
                funcionario_id: funcionarioEditando.id,
                tag_id: tagNormalizada,
                horas_duracao: 10
            })
            
            console.log('Tag criada com sucesso:', tagCriada)
            
            // Limpar o campo
            setTagTemporaria('')
            
            // Aguardar um pouco para garantir que o banco processou
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Recarregar as tags
            await carregarTagsTemporarias()
        } catch (error: any) {
            console.error('Erro ao criar tag temporária:', error)
            const errorMessage = error?.message || 'Erro ao cadastrar tag temporária. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao cadastrar tag temporária: ${errorMessage}`)
            setModalErroAberto(true)
        } finally {
            setCriandoTag(false)
        }
    }

    const handleExcluirTagTemporaria = (tagId: string) => {
        setTagParaExcluir(tagId)
        setModalExcluirTagAberto(true)
    }

    const handleConfirmarExclusaoTag = async () => {
        if (!tagParaExcluir) return

        try {
            await tagsTemporariasAPI.excluir(tagParaExcluir)
            await carregarTagsTemporarias()
            setModalExcluirTagAberto(false)
            setTagParaExcluir(null)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao excluir tag temporária. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao excluir tag temporária: ${errorMessage}`)
            setModalErroAberto(true)
            setModalExcluirTagAberto(false)
            setTagParaExcluir(null)
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (operacoesDropdownRef.current && !operacoesDropdownRef.current.contains(event.target as Node)) {
                setOperacoesDropdownAberto(false)
            }
        }

        if (operacoesDropdownAberto) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [operacoesDropdownAberto])

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
            turnos: turnosSelecionados,
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
                <form id="funcionario-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50" style={{ overflowX: 'visible' }}>
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
                                        Código da tag RFID permanente do funcionário (opcional)
                                    </p>
                                </div>

                                {/* Seção de Tag Temporária */}
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tag Temporária
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                            placeholder="Código da tag temporária"
                                            value={tagTemporaria}
                                            onChange={(e) => setTagTemporaria(normalizarTagRfid(e.target.value))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    if (!criandoTag) {
                                                        handleCriarTagTemporaria()
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCriarTagTemporaria}
                                            disabled={criandoTag}
                                            className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {criandoTag ? (
                                                <>
                                                    <i className="bi bi-hourglass-split mr-1"></i>
                                                    Criando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-plus-circle mr-1"></i>
                                                    Cadastrar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Tag temporária válida por 10 horas. Use quando o operador esquecer o crachá.
                                    </p>
                                    
                                    {/* Lista de tags temporárias ativas */}
                                    {carregandoTags || criandoTag ? (
                                        <p className="text-xs text-gray-500 mt-2">
                                            {criandoTag ? 'Criando tag...' : 'Carregando...'}
                                        </p>
                                    ) : tagsTemporariasAtivas.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            {tagsTemporariasAtivas.map((tagTemp) => {
                                                // Função auxiliar para parsear data com timezone
                                                const parsearData = (dataStr: string): Date => {
                                                    try {
                                                        // Verificar se já tem timezone (formato ISO com timezone: "2024-01-15T14:30:00-04:00" ou "2024-01-15T14:30:00+00:00")
                                                        const temTimezone = /[+-]\d{2}:\d{2}$/.test(dataStr) || dataStr.endsWith('Z')
                                                        
                                                        if (temTimezone) {
                                                            return new Date(dataStr)
                                                        }
                                                        
                                                        // Se não tem timezone, assumir que está em UTC e adicionar 'Z'
                                                        // Formato ISO sem timezone: "2024-01-15T14:30:00"
                                                        if (dataStr.includes('T')) {
                                                            return new Date(dataStr + 'Z')
                                                        }
                                                        
                                                        // Fallback: tentar parsear diretamente
                                                        return new Date(dataStr)
                                                    } catch (e) {
                                                        console.error('Erro ao parsear data:', dataStr, e)
                                                        return new Date()
                                                    }
                                                }

                                                const dataExpiracao = parsearData(tagTemp.data_expiracao)
                                                const agora = new Date()
                                                const diferencaMs = dataExpiracao.getTime() - agora.getTime()
                                                
                                                // Calcular horas e minutos restantes
                                                const horasRestantes = Math.max(0, Math.floor(diferencaMs / (1000 * 60 * 60)))
                                                const minutosRestantes = Math.max(0, Math.floor((diferencaMs % (1000 * 60 * 60)) / (1000 * 60)))
                                                
                                                // Usar uma chave única combinando id e tag_id
                                                const chaveUnica = `${tagTemp.id || 'temp'}-${tagTemp.tag_id}`
                                                
                                                return (
                                                    <div key={chaveUnica} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-800">{tagTemp.tag_id}</span>
                                                            <span className="text-xs text-gray-500">•</span>
                                                            <span className="text-xs text-gray-600">
                                                                {diferencaMs > 0 ? (
                                                                    `${horasRestantes}h ${minutosRestantes}m`
                                                                ) : (
                                                                    <span className="text-red-600">Expirada</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleExcluirTagTemporaria(tagTemp.tag_id)}
                                                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                            title="Excluir tag temporária"
                                                        >
                                                            <i className="bi bi-trash text-sm"></i>
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : null}
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
                                        Turnos
                                    </label>
                                    <div className="flex gap-4 px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
                                        {['matutino', 'vespertino', 'noturno'].map((turnoOption) => (
                                            <label
                                                key={turnoOption}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={turnosSelecionados.includes(turnoOption)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTurnosSelecionados([...turnosSelecionados, turnoOption])
                                                        } else {
                                                            setTurnosSelecionados(turnosSelecionados.filter(t => t !== turnoOption))
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 capitalize">{turnoOption}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Selecione um ou mais turnos de trabalho do funcionário
                                    </p>
                                </div>

                                <div className="relative z-[9999]" ref={operacoesDropdownRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Habilitado na Operação
                                    </label>
                                    <button
                                        type="button"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white flex items-center justify-between text-left"
                                        onClick={() => setOperacoesDropdownAberto(!operacoesDropdownAberto)}
                                    >
                                        <span className={operacoesSelecionadas.length === 0 ? 'text-gray-500' : ''}>
                                            {operacoesSelecionadas.length === 0 
                                                ? 'Selecione as operações' 
                                                : operacoesSelecionadas.length === 1
                                                    ? operacoesDisponiveis.find(op => op.id === operacoesSelecionadas[0])?.operacao || '1 operação selecionada'
                                                    : `${operacoesSelecionadas.length} operações selecionadas`
                                            }
                                        </span>
                                        <i className={`bi bi-chevron-${operacoesDropdownAberto ? 'up' : 'down'} text-gray-500`}></i>
                                    </button>
                                                {operacoesDropdownAberto && (
                                                    <div className="absolute z-[9999] w-full top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {operacoesDisponiveis.length > 0 ? (
                                                            operacoesDisponiveis.map((op) => (
                                                                <label
                                                                    key={op.id}
                                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-4 py-2.5"
                                                                >
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
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <span className="text-sm text-gray-700">{op.operacao}</span>
                                                                </label>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2.5 text-sm text-gray-500">Carregando operações...</div>
                                                        )}
                                                    </div>
                                                )}
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

            {/* Modal de Confirmação de Exclusão de Tag Temporária */}
            <ModalConfirmacao
                isOpen={modalExcluirTagAberto}
                onClose={() => {
                    setModalExcluirTagAberto(false)
                    setTagParaExcluir(null)
                }}
                onConfirm={handleConfirmarExclusaoTag}
                titulo="Excluir Tag Temporária"
                mensagem="Tem certeza que deseja excluir esta tag temporária?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="laranja"
            />

            {/* Modal de Sucesso */}
            <ModalSucesso
                isOpen={modalSucessoAberto}
                onClose={() => setModalSucessoAberto(false)}
                mensagem={mensagemSucesso}
                titulo="Sucesso!"
            />

            {/* Modal de Erro */}
            <ModalErro
                isOpen={modalErroAberto}
                onClose={() => setModalErroAberto(false)}
                mensagem={mensagemErro}
                titulo={tituloErro}
            />
        </div>
    )
}

export default ModalEditarFuncionario

