import React from 'react'

interface Linha {
    id: number
    nome: string
}

interface FormCadastrarSublinhaProps {
    linhaSelecionada: number
    onLinhaSelecionadaChange: (linhaId: number) => void
    nomeSublinha: string
    onNomeSublinhaChange: (nome: string) => void
    linhasDisponiveis: Linha[]
    onSubmit: (e: React.FormEvent) => void
}

const FormCadastrarSublinha: React.FC<FormCadastrarSublinhaProps> = ({
    linhaSelecionada,
    onLinhaSelecionadaChange,
    nomeSublinha,
    onNomeSublinhaChange,
    linhasDisponiveis,
    onSubmit
}) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linha
                </label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    value={linhaSelecionada}
                    onChange={(e) => onLinhaSelecionadaChange(Number(e.target.value))}
                >
                    <option value={0}>Selecione uma linha</option>
                    {linhasDisponiveis.map((linha) => (
                        <option key={linha.id} value={linha.id}>
                            {linha.nome}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Sublinha
                </label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Ex: Sublinha A"
                    value={nomeSublinha}
                    onChange={(e) => onNomeSublinhaChange(e.target.value)}
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
                    <span>Cadastrar Sublinha</span>
                </button>
            </div>
        </form>
    )
}

export default FormCadastrarSublinha

