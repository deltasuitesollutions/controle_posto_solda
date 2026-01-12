import React from 'react'

interface ModalBaseProps {
    isOpen: boolean
    onClose: () => void
    titulo: string
    icone?: string
    corHeader?: 'azul' | 'laranja' | 'vermelho' | 'verde'
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    children: React.ReactNode
    footer?: React.ReactNode
}

const ModalBase: React.FC<ModalBaseProps> = ({
    isOpen,
    onClose,
    titulo,
    icone,
    corHeader = 'azul',
    maxWidth = 'lg',
    children,
    footer
}) => {
    if (!isOpen) return null

    const coresHeader = {
        azul: 'var(--bg-azul)',
        laranja: 'var(--bg-laranja)',
        vermelho: '#dc2626',
        verde: '#16a34a'
    }

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl'
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                className={`bg-white rounded-lg shadow-xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header do Modal */}
                <div
                    className="text-white px-6 py-4 flex shrink-0"
                    style={{ backgroundColor: coresHeader[corHeader] }}
                >
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            {icone && <i className={icone}></i>}
                            {titulo}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white hover:bg-opacity-20"
                            title="Fechar modal"
                        >
                            <i className="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Conteúdo do Modal - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer do Modal */}
                {footer && (
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ModalBase

