interface ModalExcluirFuncionarioProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

const ModalExcluirFuncionario = ({ isOpen, onClose, onConfirm }: ModalExcluirFuncionarioProps) => {
    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }} onClick={onClose}>
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 text-white flex justify-between items-center rounded-t-lg" style={{ backgroundColor: 'var(--bg-laranja)' }}>
                    <h3 className="font-semibold">Excluir Funcionário</h3>
                    <button onClick={onClose} className="text-white hover:opacity-80 text-xl leading-none">×</button>
                </div>
                
                <div className="p-4">
                    <p className="mb-4 text-gray-700">Tem certeza que deseja excluir este funcionário?</p>
                    <p className="text-sm text-red-600 mb-4">Esta ação não pode ser desfeita.</p>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleConfirm} className="px-4 py-2 text-white rounded hover:opacity-90" style={{ backgroundColor: 'var(--bg-laranja)' }}>
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalExcluirFuncionario

