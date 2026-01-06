import { useState, useEffect } from 'react'

interface Funcionario {
    id: string
    matricula: string
    nome: string
    tagRfid: string
    ativo: boolean
}

interface ModalEditarFuncionarioProps {
    isOpen: boolean
    onClose: () => void
    onSave: (funcionario: Omit<Funcionario, 'id'>) => void
    funcionarioEditando?: Funcionario | null
}

const ModalEditarFuncionario = ({ isOpen, onClose, onSave, funcionarioEditando }: ModalEditarFuncionarioProps) => {
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tagRfid, setTagRfid] = useState('')
    const [ativo, setAtivo] = useState(true)

    useEffect(() => {
        if (funcionarioEditando) {
            setMatricula(funcionarioEditando.matricula)
            setNome(funcionarioEditando.nome)
            setTagRfid(funcionarioEditando.tagRfid)
            setAtivo(funcionarioEditando.ativo)
        } else {
            setMatricula('')
            setNome('')
            setTagRfid('')
            setAtivo(true)
        }
    }, [funcionarioEditando])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ matricula, nome, tagRfid, ativo })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }} onClick={onClose}>
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 text-white flex justify-between items-center rounded-t-lg" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <h3 className="font-semibold">Editar Funcionário</h3>
                    <button onClick={onClose} className="text-white hover:opacity-80 text-xl leading-none">×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tag RFID</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={tagRfid}
                            onChange={(e) => setTagRfid(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            value={matricula}
                            onChange={(e) => setMatricula(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ativo}
                                onChange={(e) => setAtivo(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Ativo</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-white rounded hover:opacity-90" style={{ backgroundColor: 'var(--bg-azul)' }}>
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ModalEditarFuncionario

