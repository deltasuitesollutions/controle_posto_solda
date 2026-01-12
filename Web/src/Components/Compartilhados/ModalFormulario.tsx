import React, { useState, useEffect } from 'react'
import ModalBase from './ModalBase'

interface CampoFormulario {
    nome: string
    label: string
    tipo: 'text' | 'number' | 'select' | 'checkbox'
    placeholder?: string
    required?: boolean
    opcoes?: Array<{ valor: string; label: string }>
    valorInicial?: any
}

interface ModalFormularioProps {
    isOpen: boolean
    onClose: () => void
    onSave: (dados: Record<string, any>) => void
    itemEditando?: Record<string, any> | null
    tituloNovo: string
    tituloEditar: string
    campos: CampoFormulario[]
    textoBotao: string
    icone?: string
    validacao?: (dados: Record<string, any>) => boolean
    secaoTitulo?: string
}

const ModalFormulario: React.FC<ModalFormularioProps> = ({
    isOpen,
    onClose,
    onSave,
    itemEditando,
    tituloNovo,
    tituloEditar,
    campos,
    textoBotao,
    icone,
    validacao,
    secaoTitulo = 'Informações'
}) => {
    const [valores, setValores] = useState<Record<string, any>>({})

    useEffect(() => {
        if (itemEditando) {
            const valoresIniciais: Record<string, any> = {}
            campos.forEach((campo) => {
                valoresIniciais[campo.nome] =
                    itemEditando[campo.nome] !== undefined
                        ? itemEditando[campo.nome]
                        : campo.valorInicial !== undefined
                        ? campo.valorInicial
                        : campo.tipo === 'checkbox'
                        ? false
                        : ''
            })
            setValores(valoresIniciais)
        } else {
            const valoresIniciais: Record<string, any> = {}
            campos.forEach((campo) => {
                valoresIniciais[campo.nome] =
                    campo.valorInicial !== undefined
                        ? campo.valorInicial
                        : campo.tipo === 'checkbox'
                        ? false
                        : ''
            })
            setValores(valoresIniciais)
        }
    }, [itemEditando, isOpen, campos])

    const handleChange = (nome: string, valor: any) => {
        setValores((prev) => ({
            ...prev,
            [nome]: valor
        }))
    }

    const handleSalvar = () => {
        // Validação de campos obrigatórios
        const camposObrigatorios = campos.filter((c) => c.required)
        const todosPreenchidos = camposObrigatorios.every((campo) => {
            const valor = valores[campo.nome]
            if (campo.tipo === 'checkbox') {
                return true // checkbox sempre tem valor (true/false)
            }
            return valor !== undefined && valor !== null && String(valor).trim() !== ''
        })

        if (!todosPreenchidos) {
            return
        }

        // Validação customizada
        if (validacao && !validacao(valores)) {
            return
        }

        // Limpar valores vazios de strings
        const dadosLimpos: Record<string, any> = {}
        Object.entries(valores).forEach(([key, value]) => {
            if (typeof value === 'string') {
                dadosLimpos[key] = value.trim()
            } else {
                dadosLimpos[key] = value
            }
        })

        onSave(dadosLimpos)
        onClose()
    }

    const titulo = itemEditando ? tituloEditar : tituloNovo

    // Verificar se o formulário é válido
    const camposObrigatorios = campos.filter((c) => c.required)
    const isValid =
        camposObrigatorios.every((campo) => {
            const valor = valores[campo.nome]
            if (campo.tipo === 'checkbox') {
                return true
            }
            return valor !== undefined && valor !== null && String(valor).trim() !== ''
        }) && (!validacao || validacao(valores))

    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
                Cancelar
            </button>
            <button
                onClick={handleSalvar}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!isValid}
            >
                <i className="bi bi-check-circle-fill"></i>
                <span>{textoBotao}</span>
            </button>
        </>
    )

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            titulo={titulo}
            icone={icone}
            corHeader="azul"
            maxWidth="lg"
            footer={footer}
        >
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="bi bi-info-circle"></i>
                    {secaoTitulo}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    {campos.map((campo) => (
                        <div key={campo.nome}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {campo.label} {campo.required && '*'}
                            </label>
                            {campo.tipo === 'text' || campo.tipo === 'number' ? (
                                <input
                                    type={campo.tipo}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={campo.placeholder}
                                    value={valores[campo.nome] || ''}
                                    onChange={(e) =>
                                        handleChange(
                                            campo.nome,
                                            campo.tipo === 'number' ? Number(e.target.value) : e.target.value
                                        )
                                    }
                                    required={campo.required}
                                    autoFocus={campo.nome === campos[0]?.nome}
                                />
                            ) : campo.tipo === 'select' ? (
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={valores[campo.nome] || ''}
                                    onChange={(e) => handleChange(campo.nome, e.target.value)}
                                    required={campo.required}
                                >
                                    <option value="">Selecione...</option>
                                    {campo.opcoes?.map((opcao) => (
                                        <option key={opcao.valor} value={opcao.valor}>
                                            {opcao.label}
                                        </option>
                                    ))}
                                </select>
                            ) : campo.tipo === 'checkbox' ? (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={valores[campo.nome] || false}
                                        onChange={(e) => handleChange(campo.nome, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{campo.label}</span>
                                </label>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </ModalBase>
    )
}

export default ModalFormulario

