import React from 'react'
import ModalBase from './ModalBase'

interface ModalConfirmacaoProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    titulo: string
    mensagem: string
    textoConfirmar: string
    textoCancelar?: string
    corHeader?: 'azul' | 'laranja' | 'vermelho' | 'verde'
    item?: Record<string, any>
    camposItem?: string[]
    mostrarDetalhes?: boolean
}

const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
    isOpen,
    onClose,
    onConfirm,
    titulo,
    mensagem,
    textoConfirmar,
    textoCancelar = 'Cancelar',
    corHeader = 'azul',
    item,
    camposItem = [],
    mostrarDetalhes = false
}) => {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const footer = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
                {textoCancelar}
            </button>
            <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: corHeader === 'azul' ? 'var(--bg-azul)' : corHeader === 'laranja' ? 'var(--bg-laranja)' : corHeader === 'vermelho' ? '#dc2626' : '#16a34a' }}
            >
                {textoConfirmar}
            </button>
        </>
    )

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            titulo={titulo}
            corHeader={corHeader}
            maxWidth="md"
            footer={footer}
        >
            <div>
                <p className="mb-3 text-gray-700">{mensagem}</p>

                {mostrarDetalhes && item && camposItem.length > 0 && (
                    <div className="bg-gray-100 p-3 rounded mb-3">
                        {camposItem.map((campo) => (
                            <p key={campo} className="text-sm">
                                <strong>{campo.charAt(0).toUpperCase() + campo.slice(1)}:</strong>{' '}
                                {item[campo] !== undefined && item[campo] !== null
                                    ? String(item[campo])
                                    : '-'}
                            </p>
                        ))}
                        {item.status && item.novoStatus && (
                            <p className="text-sm mt-2">
                                <strong>Status:</strong> {item.status} → {item.novoStatus}
                            </p>
                        )}
                    </div>
                )}

                {item && !mostrarDetalhes && (
                    <div className="bg-gray-100 p-3 rounded mb-3">
                        {Object.entries(item).map(([key, value]) => {
                            // Não mostrar status e novoStatus juntos
                            if (key === 'novoStatus') return null
                            return (
                                <p key={key} className="text-sm">
                                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                                    {value !== undefined && value !== null ? String(value) : '-'}
                                </p>
                            )
                        })}
                        {item.status && item.novoStatus && (
                            <p className="text-sm mt-2">
                                <strong>Status:</strong> {item.status} → {item.novoStatus}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </ModalBase>
    )
}

export default ModalConfirmacao

