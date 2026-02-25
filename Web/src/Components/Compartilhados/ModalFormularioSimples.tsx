import React, { useState, useEffect } from 'react'
import ModalBase from './ModalBase'

interface Item {
    id: string
    nome: string
}

interface ModalFormularioSimplesProps {
    isOpen: boolean
    onClose: () => void
    onSave: (dados: { nome: string }) => void
    itemEditando?: Item | null
    tituloNovo: string
    tituloEditar: string
    labelCampo: string
    placeholder: string
    textoBotao: string
    icone?: string
    validacao?: (valor: string) => boolean
}

const ModalFormularioSimples: React.FC<ModalFormularioSimplesProps> = ({
    isOpen,
    onClose,
    onSave,
    itemEditando,
    tituloNovo,
    tituloEditar,
    labelCampo,
    placeholder,
    textoBotao,
    icone,
    validacao
}) => {
    const [nome, setNome] = useState('')

    useEffect(() => {
        if (itemEditando) {
            setNome(itemEditando.nome)
        } else {
            setNome('')
        }
    }, [itemEditando, isOpen])

    const handleSalvar = () => {
        const valorTrimmed = nome.trim()
        
        if (!valorTrimmed) {
            return
        }

        if (validacao && !validacao(valorTrimmed)) {
            return
        }

        onSave({ nome: valorTrimmed })
        onClose()
    }

    const titulo = itemEditando ? tituloEditar : tituloNovo
    const isValid = nome.trim() !== '' && (!validacao || validacao(nome.trim()))

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
                    Informações
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {labelCampo} *
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={placeholder}
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                </div>
            </div>
        </ModalBase>
    )
}

export default ModalFormularioSimples

