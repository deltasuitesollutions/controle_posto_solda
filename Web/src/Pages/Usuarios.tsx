import React, { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalEditarUsuario from '../Components/Usuarios/ModalEditarUsuario'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { usuariosAPI } from '../api/api'

interface Usuario {
    id: number
    username: string
    nome: string
    role: 'admin' | 'operador' | 'master'
    ativo: boolean
}

const Usuarios = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('listar')
    const [username, setUsername] = useState('')
    const [nome, setNome] = useState('')
    const [senha, setSenha] = useState('')
    const [role, setRole] = useState<'admin' | 'operador' | 'master'>('admin')
    const [ativo, setAtivo] = useState(true)
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [carregando, setCarregando] = useState(false)
    const [modalEditarAberto, setModalEditarAberto] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalStatusAberto, setModalStatusAberto] = useState(false)
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [modalConfirmarEdicaoAberto, setModalConfirmarEdicaoAberto] = useState(false)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [dadosParaSalvar, setDadosParaSalvar] = useState<any>(null)
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    const fecharModal = () => {
        setModalEditarAberto(false)
        setModalExcluirAberto(false)
        setModalStatusAberto(false)
        setModalCadastrarAberto(false)
        setModalConfirmarEdicaoAberto(false)
        setUsuarioSelecionado(null)
        setDadosParaSalvar(null)
    }

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarUsuarios()
        }
    }, [abaAtiva])

    const carregarUsuarios = async () => {
        setCarregando(true)
        try {
            const dados = await usuariosAPI.listarTodos()
            
            if (!Array.isArray(dados)) {
                setUsuarios([])
                return
            }
            
            const dadosNormalizados = dados.map((user: any) => ({
                ...user,
                id: user.id || user.usuario_id,
                ativo: user.ativo !== undefined ? user.ativo : true
            }))
            setUsuarios(dadosNormalizados)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao carregar usuários: ${error?.message || 'Erro desconhecido'}`)
            setModalErroAberto(true)
            setUsuarios([])
        } finally {
            setCarregando(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setModalCadastrarAberto(true)
    }

    const handleConfirmarCadastro = async () => {
        try {
            await usuariosAPI.criar({
                username,
                nome,
                senha,
                role,
                ativo
            })
            
            setUsername('')
            setNome('')
            setSenha('')
            setRole('admin')
            setAtivo(true)
            
            if (abaAtiva === 'listar') {
                await carregarUsuarios()
            }
            
            fecharModal()
            setMensagemSucesso('Usuário cadastrado com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao cadastrar usuário. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao cadastrar usuário: ${errorMessage}`)
            setModalErroAberto(true)
            fecharModal()
        }
    }

    const handleEditarUsuario = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario)
        setModalEditarAberto(true)
    }

    const handleSalvarEdicao = (dados: any) => {
        setDadosParaSalvar(dados)
        setModalConfirmarEdicaoAberto(true)
    }

    const handleConfirmarEdicao = async () => {
        if (!usuarioSelecionado || !dadosParaSalvar) return
        
        const usuarioId = usuarioSelecionado.id
        if (!usuarioId) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do usuário não encontrado')
            setModalErroAberto(true)
            setModalConfirmarEdicaoAberto(false)
            return
        }
        
        try {
            await usuariosAPI.atualizar(usuarioId, dadosParaSalvar)
            await carregarUsuarios()
            setModalConfirmarEdicaoAberto(false)
            setModalEditarAberto(false)
            setMensagemSucesso('Usuário atualizado com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao atualizar usuário. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao atualizar usuário: ${errorMessage}`)
            setModalErroAberto(true)
            setModalConfirmarEdicaoAberto(false)
        }
    }

    const handleExcluirUsuario = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario)
        setModalExcluirAberto(true)
    }

    const handleAbrirModalStatus = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario)
        setModalStatusAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!usuarioSelecionado) return
        
        const usuarioId = usuarioSelecionado.id
        if (!usuarioId) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do usuário não encontrado')
            setModalErroAberto(true)
            fecharModal()
            return
        }
        
        try {
            await usuariosAPI.deletar(usuarioId)
            await carregarUsuarios()
            fecharModal()
            setMensagemSucesso('Usuário excluído com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao excluir usuário. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao excluir usuário: ${errorMessage}`)
            setModalErroAberto(true)
            fecharModal()
        }
    }

    const handleConfirmarMudancaStatus = async () => {
        if (!usuarioSelecionado) return
        
        const usuarioId = usuarioSelecionado.id
        if (!usuarioId) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do usuário não encontrado')
            setModalErroAberto(true)
            fecharModal()
            return
        }
        
        try {
            const novoStatus = !usuarioSelecionado.ativo
            await usuariosAPI.atualizar(usuarioId, {
                username: usuarioSelecionado.username,
                nome: usuarioSelecionado.nome,
                role: usuarioSelecionado.role,
                ativo: novoStatus
            })
            await carregarUsuarios()
            fecharModal()
            setMensagemSucesso(`Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
            setModalSucessoAberto(true)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao alterar status do usuário. Tente novamente.'
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao alterar status: ${errorMessage}`)
            setModalErroAberto(true)
            fecharModal()
        }
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const usuariosPaginaAtual = usuarios.slice(indiceInicio, indiceFim)

    useEffect(() => {
        const totalPaginas = Math.ceil(usuarios.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [usuarios.length, itensPorPagina, paginaAtual])

    const getRoleLabel = (role: string) => {
        const labels: { [key: string]: string } = {
            'admin': 'Administrador',
            'operador': 'Operador',
            'master': 'Master'
        }
        return labels[role] || role
    }

    const getRoleColor = (role: string) => {
        const colors: { [key: string]: string } = {
            'admin': 'bg-blue-100 text-blue-800',
            'operador': 'bg-green-100 text-green-800',
            'master': 'bg-purple-100 text-purple-800'
        }
        return colors[role] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                                    Cadastrar Usuário
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
                                    Listar Usuários
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    <form onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Username
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: joao.silva'
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome
                                                </label>
                                                <input
                                                    type='text'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: João Silva'
                                                    value={nome}
                                                    onChange={(e) => setNome(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Senha
                                                </label>
                                                <input
                                                    type="password"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Digite a senha'
                                                    value={senha}
                                                    onChange={(e) => setSenha(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tipo de Usuário
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={role}
                                                    onChange={(e) => setRole(e.target.value as 'admin' | 'operador' | 'master')}
                                                >
                                                    <option value="admin">Administrador</option>
                                                    <option value="operador">Operador</option>
                                                    <option value="master">Master</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type='checkbox'
                                                    checked={ativo}
                                                    onChange={(e) => setAtivo(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                                            </label>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button 
                                                type='submit' 
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className="bi bi-person-plus-fill"></i>
                                                <span>Cadastrar Usuário</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        {carregando ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600">Carregando usuários...</p>
                                            </div>
                                        ) : usuarios.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Username
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Nome
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Tipo
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
                                                        {usuariosPaginaAtual.map((usuario) => (
                                                            <tr key={usuario.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {usuario.username}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {usuario.nome}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(usuario.role)}`}>
                                                                        {getRoleLabel(usuario.role)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        usuario.ativo 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarUsuario(usuario)}
                                                                            className="p-2 rounded transition-colors hover:opacity-80"
                                                                            style={{ color: 'var(--bg-azul)' }}
                                                                            title="Editar usuário"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAbrirModalStatus(usuario)}
                                                                            className={`p-2 rounded transition-colors hover:opacity-80 ${
                                                                                usuario.ativo 
                                                                                    ? 'text-orange-600 hover:text-orange-800' 
                                                                                    : 'text-green-600 hover:text-green-800'
                                                                            }`}
                                                                            title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                                                                        >
                                                                            <i className={`bi ${usuario.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcluirUsuario(usuario)}
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                            title="Excluir usuário"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {usuarios.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={usuarios.length}
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
                                                    Nenhum usuário cadastrado
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

            <ModalEditarUsuario
                isOpen={modalEditarAberto}
                onClose={fecharModal}
                onSave={handleSalvarEdicao}
                usuarioEditando={usuarioSelecionado}
            />

            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir Usuário"
                mensagem="Tem certeza que deseja excluir este usuário?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="laranja"
            />

            <ModalConfirmacao
                isOpen={modalStatusAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarMudancaStatus}
                titulo="Alterar Status"
                mensagem="Deseja alterar o status deste usuário?"
                textoConfirmar="Confirmar"
                textoCancelar="Cancelar"
                corHeader={usuarioSelecionado?.ativo ? 'laranja' : 'azul'}
                item={usuarioSelecionado ? {
                    username: usuarioSelecionado.username,
                    nome: usuarioSelecionado.nome,
                    status: usuarioSelecionado.ativo ? 'Ativo' : 'Inativo',
                    novoStatus: usuarioSelecionado.ativo ? 'Inativo' : 'Ativo'
                } : undefined}
                camposItem={['username', 'nome']}
                mostrarDetalhes={true}
            />

            <ModalConfirmacao
                isOpen={modalCadastrarAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarCadastro}
                titulo="Cadastrar Usuário"
                mensagem="Tem certeza que deseja cadastrar este usuário?"
                textoConfirmar="Cadastrar"
                textoCancelar="Cancelar"
                corHeader="azul"
                item={{
                    username,
                    nome,
                    role: getRoleLabel(role),
                    ativo: ativo ? 'Sim' : 'Não'
                }}
                camposItem={['username', 'nome', 'role', 'ativo']}
                mostrarDetalhes={true}
            />

            <ModalConfirmacao
                isOpen={modalConfirmarEdicaoAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarEdicao}
                titulo="Editar Usuário"
                mensagem="Tem certeza que deseja salvar as alterações neste usuário?"
                textoConfirmar="Salvar"
                textoCancelar="Cancelar"
                corHeader="azul"
                item={usuarioSelecionado && dadosParaSalvar ? {
                    username: dadosParaSalvar.username || usuarioSelecionado.username,
                    nome: dadosParaSalvar.nome || usuarioSelecionado.nome,
                    role: getRoleLabel(dadosParaSalvar.role || usuarioSelecionado.role),
                    ativo: dadosParaSalvar.ativo !== undefined ? (dadosParaSalvar.ativo ? 'Sim' : 'Não') : (usuarioSelecionado.ativo ? 'Sim' : 'Não')
                } : undefined}
                camposItem={['username', 'nome', 'role', 'ativo']}
                mostrarDetalhes={true}
            />

            <ModalSucesso
                isOpen={modalSucessoAberto}
                onClose={() => setModalSucessoAberto(false)}
                mensagem={mensagemSucesso}
                titulo="Sucesso!"
            />
            <ModalErro
                isOpen={modalErroAberto}
                onClose={() => setModalErroAberto(false)}
                mensagem={mensagemErro}
                titulo={tituloErro}
            />
        </div>
    )
}

export default Usuarios

