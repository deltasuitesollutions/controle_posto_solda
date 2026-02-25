import React from 'react'

interface FormCadastrarLinhaProps {
    nomeLinha: string
    onNomeLinhaChange: (nome: string) => void
    onSubmit: (e: React.FormEvent) => void
}

const FormCadastrarLinha: React.FC<FormCadastrarLinhaProps> = ({
    nomeLinha,
    onNomeLinhaChange,
    onSubmit
}) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Linha
                </label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Ex: Linha 1"
                    value={nomeLinha}
                    onChange={(e) => onNomeLinhaChange(e.target.value)}
                    autoFocus
                />
            </div>
            
            <div className="flex gap-3">
                <button 
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    style={{ backgroundColor: 'var(--bg-azul)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Cadastrar Linha</span>
                </button>
            </div>
        </form>
    )
}

export default FormCadastrarLinha

