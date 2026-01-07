interface Funcionario {
    id: string
    matricula: string
    nome: string
    tag: string
    ativo: boolean
}

interface ModalMudarStatusProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    funcionario?: Funcionario | null
}

const ModalMudarStatus = ({ isOpen, onClose, onConfirm, funcionario }: ModalMudarStatusProps) => {
    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const novoStatus = funcionario ? !funcionario.ativo : true
    const statusTexto = novoStatus ? 'Ativo' : 'Inativo'
    const statusCor = novoStatus ? 'var(--bg-azul)' : 'var(--bg-laranja)'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }} onClick={onClose}>
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 text-white flex justify-between items-center rounded-t-lg" style={{ backgroundColor: statusCor }}>
                    <h3 className="font-semibold">Alterar Status</h3>
                    <button onClick={onClose} className="text-white hover:opacity-80 text-xl leading-none">×</button>
                </div>
                
                <div className="p-4">
                    <p className="mb-3 text-gray-700">Deseja alterar o status deste funcionário?</p>
                    
                    {funcionario && (
                        <div className="bg-gray-100 p-3 rounded mb-3">
                            <p className="text-sm"><strong>Matrícula:</strong> {funcionario.matricula}</p>
                            <p className="text-sm"><strong>Nome:</strong> {funcionario.nome}</p>
                            <p className="text-sm mt-2">
                                <strong>Status:</strong> {funcionario.ativo ? 'Ativo' : 'Inativo'} → {statusTexto}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleConfirm} className="px-4 py-2 text-white rounded hover:opacity-90" style={{ backgroundColor: statusCor }}>
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalMudarStatus

