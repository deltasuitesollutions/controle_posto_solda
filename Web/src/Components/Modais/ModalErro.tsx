interface ModalErroProps {
    isOpen: boolean
    onClose: () => void
    mensagem: string
    titulo?: string
}

const ModalErro = ({ isOpen, onClose, mensagem, titulo = 'Erro!' }: ModalErroProps) => {
    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                        <i className="bi bi-exclamation-triangle-fill text-red-600 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
                </div>
                <p className="text-gray-600 mb-6">{mensagem}</p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalErro

