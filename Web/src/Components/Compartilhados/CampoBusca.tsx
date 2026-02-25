interface CampoBuscaProps {
    placeholder?: string
    valor: string
    onChange: (valor: string) => void
    largura?: 'completa' | 'fixa'
    className?: string
}

const CampoBusca = ({ 
    placeholder = "Buscar...", 
    valor, 
    onChange,
    largura = 'fixa',
    className = ''
}: CampoBuscaProps) => {
    const larguraClasse = largura === 'completa' ? 'w-full' : 'w-full md:w-64'
    
    return (
        <div className={`flex-1 ${largura === 'fixa' ? 'md:flex-initial' : ''}`}>
            <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                    type="text"
                    placeholder={placeholder}
                    className={`${larguraClasse} pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    )
}

export default CampoBusca

