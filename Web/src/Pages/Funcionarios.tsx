import React, { useState, useRef, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalEditarFuncionario from '../Components/Funcionarios/ModalEditarFuncionario'
import ModalExcluirFuncionario from '../Components/Funcionarios/ModalExcluirFuncionario'
import { Paginacao } from '../Components/Compartilhados/paginacao'

interface Funcionario {
    id: string
    matricula: string
    nome: string
    tagRfid: string
    ativo: boolean
}

const Funcionarios = () => {
    const [menuAberto, setMenuAberto] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tagRfid, setTagRfid] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
    const [modalEditarAberto, setModalEditarAberto] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const rfidInputRef = useRef<HTMLInputElement>(null)

    // Helper para fechar modais
    const fecharModal = () => {
        setModalEditarAberto(false)
        setModalExcluirAberto(false)
        setFuncionarioSelecionado(null)
    }

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
        
        // Modo criação - adiciona novo funcionário
        const novoFuncionario: Funcionario = {
            id: Date.now().toString(),
            matricula,
            nome,
            tagRfid,
            ativo
        }
        
        setFuncionarios([...funcionarios, novoFuncionario])
        console.log('Funcionário cadastrado:', novoFuncionario)
        //  chamada API para salvar o funcionário
        
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

    const handleEditarFuncionario = (funcionario: Funcionario) => {
        setFuncionarioSelecionado(funcionario)
        setModalEditarAberto(true)
    }

    const handleSalvarEdicao = (funcionarioAtualizado: Omit<Funcionario, 'id'>) => {
        if (!funcionarioSelecionado) return
        setFuncionarios(funcionarios.map(f => 
            f.id === funcionarioSelecionado.id 
                ? { ...funcionarioAtualizado, id: funcionarioSelecionado.id }
                : f
        ))
        console.log('Funcionário atualizado:', { id: funcionarioSelecionado.id, ...funcionarioAtualizado })
        //  chamada API para atualizar o funcionário
        fecharModal()
    }

    const handleExcluirFuncionario = (funcionario: Funcionario) => {
        setFuncionarioSelecionado(funcionario)
        setModalExcluirAberto(true)
    }

    const handleConfirmarExclusao = () => {
        if (!funcionarioSelecionado) return
        setFuncionarios(funcionarios.filter(f => f.id !== funcionarioSelecionado.id))
        console.log('Funcionário excluído:', funcionarioSelecionado.id)
        //  chamada API para excluir o funcionário
        fecharModal()
    }

    const handleMudarStatus = (funcionario: Funcionario) => {
        // Muda o status diretamente sem abrir modal
        setFuncionarios(funcionarios.map(f => 
            f.id === funcionario.id 
                ? { ...f, ativo: !f.ativo }
                : f
        ))
        console.log('Status alterado:', funcionario.id, 'Novo status:', !funcionario.ativo)
        //  chamada API para atualizar o status
    }

    // Calcular funcionários da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const funcionariosPaginaAtual = funcionarios.slice(indiceInicio, indiceFim)

    // Resetar página quando necessário
    useEffect(() => {
        const totalPaginas = Math.ceil(funcionarios.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [funcionarios.length, itensPorPagina, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral menuAberto={menuAberto} onClose={() => setMenuAberto(false)} />
            <div className="flex-1 flex flex-col">
                <TopBar menuAberto={menuAberto} onToggleMenu={() => setMenuAberto(!menuAberto)} />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Abas */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setAbaAtiva('cadastrar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-person-plus-fill mr-2"></i>
                                    Cadastrar Funcionário
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('listar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'listar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'listar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-list-ul mr-2"></i>
                                    Listar Funcionários
                                </button>
                            </div>

                            {/* Conteúdo das Abas */}
                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    /* Aba de Cadastro */
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
                                                placeholder='Passe o crachá na marcação abaixo'
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
                                        
                                        {/* Funcionário Ativo */}
                                        <div className="mb-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type='checkbox'
                                                    id='funcionario-ativo'
                                                    checked={ativo}
                                                    onChange={(e) => setAtivo(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Funcionário Ativo</span>
                                            </label>
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
                                                <i className="bi bi-person-plus-fill"></i>
                                                <span>Cadastrar Funcionário</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Aba de Listagem */
                                    <div>
                                        {funcionarios.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Matrícula
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Nome
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Tag RFID
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Ações
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {funcionariosPaginaAtual.map((funcionario) => (
                                                            <tr key={funcionario.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.matricula}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.nome}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {funcionario.tagRfid}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        funcionario.ativo 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {funcionario.ativo ? 'Ativo' : 'Inativo'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarFuncionario(funcionario)}
                                                                            className="p-2 rounded transition-colors hover:opacity-80"
                                                                            style={{ color: 'var(--bg-azul)' }}
                                                                            title="Editar funcionário"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleMudarStatus(funcionario)}
                                                                            className={`p-2 rounded transition-colors hover:opacity-80 ${
                                                                                funcionario.ativo 
                                                                                    ? 'text-orange-600 hover:text-orange-800' 
                                                                                    : 'text-green-600 hover:text-green-800'
                                                                            }`}
                                                                            title={funcionario.ativo ? 'Desativar funcionário' : 'Ativar funcionário'}
                                                                        >
                                                                            <i className={`bi ${funcionario.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcluirFuncionario(funcionario)}
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                            title="Excluir funcionário"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {funcionarios.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={funcionarios.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-info-circle text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Nenhum funcionário cadastrado
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modais */}
            <ModalEditarFuncionario
                isOpen={modalEditarAberto}
                onClose={fecharModal}
                onSave={handleSalvarEdicao}
                funcionarioEditando={funcionarioSelecionado}
            />

            <ModalExcluirFuncionario
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
            />

        </div>
    )
}

export default Funcionarios