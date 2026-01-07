import React, { useState, useRef, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'

const Funcionarios = () => {
    const [menuAberto, setMenuAberto] = useState(false);
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tagRfid, setTagRfid] = useState('')
    const [ativo, setAtivo] = useState(true)
    const rfidInputRef = useRef<HTMLInputElement>(null)

    // Detecta quando o crachá é passado e move o foco para o campo RFID
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement
            const isInputField = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'
            
            
            if (!isInputField && rfidInputRef.current && (e.key.length === 1 || e.key === 'Enter')) {
                rfidInputRef.current.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log({ matricula, nome, tagRfid, ativo })
        // Aqui você faria a chamada API para salvar o funcionário
        
        // Limpa os campos após salvar
        setMatricula('')
        setNome('')
        setTagRfid('')
        setAtivo(true)
        
        // Volta o foco para o campo RFID para o próximo funcionário
        setTimeout(() => {
            rfidInputRef.current?.focus()
        }, 100)
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral menuAberto={menuAberto} onClose={() => setMenuAberto(false)} />
            <div className="flex-1 flex flex-col">
                <TopBar menuAberto={menuAberto} onToggleMenu={() => setMenuAberto(!menuAberto)} />
                <div className="flex-1 p-6 pt-32">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col gap-6">
                            
                            {/* Card Novo Funcionário */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="text-white px-6 py-4" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <i className="bi bi-person-plus-fill"></i>
                                        Adicionar Colaborador
                                    </h3>
                                </div>
                                
                                <div className="p-6">
                                    <form id="form-funcionario" onSubmit={handleSubmit}>
                                        {/* Tag RFID */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tag RFID
                                            </label>
                                            <input
                                                ref={rfidInputRef}
                                                type="text"
                                                id='funcionario-tag-rfid'
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder='Passe o crachá RFID aqui'
                                                value={tagRfid}
                                                onChange={(e) => setTagRfid(e.target.value)}
                                                autoFocus
                                                autoComplete="off"
                                            />
                                        </div>
                                        
                                        {/* Matrícula e Nome na mesma linha */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {/* Matrícula */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Matrícula
                                                </label>
                                                <input
                                                    type="text"
                                                    id='funcionario-matricula'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: 12345'
                                                    value={matricula}
                                                    onChange={(e) => setMatricula(e.target.value)}
                                                />
                                            </div>
                                            
                                            {/* Nome */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome
                                                </label>
                                                <input
                                                    type='text'
                                                    id='funcionario-nome'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: João Silva'
                                                    value={nome}
                                                    onChange={(e) => setNome(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Botões de Ação */}
                                        <div className="flex gap-3">
                                            <button 
                                                type='submit' 
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className="bi bi-check-circle-fill"></i>
                                                <span>Adicionar Modelo</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Card Funcionários Cadastrados */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="text-white px-6 py-4" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <i className="bi bi-list-ul"></i>
                                        Modelos Cadastrados
                                    </h3>
                                </div>
                                
                                <div className="p-6">
                                    <div id='funcionarios-list' className="flex flex-col items-center justify-center py-12">
                                        <i className="bi bi-info-circle text-gray-300 text-5xl mb-4"></i>
                                        <p className="text-gray-500 text-lg font-medium">
                                            Nenhum Modelo cadastrado
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Funcionarios