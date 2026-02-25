import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usuariosAPI } from '../api/api'

const CadastroUsuario = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [nome, setNome] = useState('')
    const [senha, setSenha] = useState('')
    const [role, setRole] = useState<'admin' | 'operador' | 'master'>('admin')
    const [ativo, setAtivo] = useState(true)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErro('')
        setSucesso(false)
        setCarregando(true)
        
        try {
            if (!username.trim() || !nome.trim() || !senha.trim()) {
                setErro('Por favor, preencha todos os campos obrigatórios')
                setCarregando(false)
                return
            }

            if (senha.length < 4) {
                setErro('A senha deve ter no mínimo 4 caracteres')
                setCarregando(false)
                return
            }

            await usuariosAPI.criar({
                username: username.trim(),
                nome: nome.trim(),
                senha: senha.trim(),
                role,
                ativo
            })
            
            setSucesso(true)
            setUsername('')
            setNome('')
            setSenha('')
            setRole('admin')
            setAtivo(true)
            
            // Limpar mensagem de sucesso após 3 segundos
            setTimeout(() => {
                setSucesso(false)
            }, 3000)
        } catch (error: any) {
            const errorMessage = error?.message || 'Erro ao cadastrar usuário. Tente novamente.'
            setErro(errorMessage)
        } finally {
            setCarregando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: '#4C79AF' }}>
                            <i className="bi bi-person-plus-fill mr-2"></i>
                            Cadastro de Usuário
                        </h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Preencha os dados para criar uma nova conta
                        </p>
                    </div>

                    {erro && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                            {erro}
                        </div>
                    )}

                    {sucesso && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                            <i className="bi bi-check-circle-fill mr-2"></i>
                            Usuário cadastrado com sucesso!
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username *
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                placeholder='Ex: joao.silva'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                disabled={carregando}
                            />
                            <p className="text-xs text-gray-500 mt-1">Nome de usuário único para login</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome *
                            </label>
                            <input
                                type='text'
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                placeholder='Ex: João Silva'
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                autoComplete="name"
                                disabled={carregando}
                            />
                            <p className="text-xs text-gray-500 mt-1">Nome completo do usuário</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Senha *
                            </label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                placeholder='Digite a senha'
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                minLength={4}
                                autoComplete="new-password"
                                disabled={carregando}
                            />
                            <p className="text-xs text-gray-500 mt-1">Mínimo de 4 caracteres</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Usuário *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'admin' | 'operador' | 'master')}
                                required
                                disabled={carregando}
                            >
                                <option value="master">Master</option>
                                <option value="admin">Administrador</option>
                                <option value="operador">Operador</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {role === 'master' && 'Acesso total ao sistema'}
                                {role === 'admin' && 'Acesso administrativo'}
                                {role === 'operador' && 'Acesso apenas ao IHM'}
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type='checkbox'
                                    checked={ativo}
                                    onChange={(e) => setAtivo(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={carregando}
                                />
                                <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-6">Usuários inativos não podem fazer login</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type='submit'
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#4C79AF' }}
                                disabled={carregando}
                            >
                                {carregando ? (
                                    <>
                                        <i className="bi bi-arrow-repeat animate-spin"></i>
                                        <span>Cadastrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-person-plus-fill"></i>
                                        <span>Cadastrar Usuário</span>
                                    </>
                                )}
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setUsername('')
                                    setNome('')
                                    setSenha('')
                                    setRole('admin')
                                    setAtivo(true)
                                    setErro('')
                                    setSucesso(false)
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={carregando}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-2"
                        >
                            <i className="bi bi-arrow-left"></i>
                            <span>Voltar para o login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CadastroUsuario

