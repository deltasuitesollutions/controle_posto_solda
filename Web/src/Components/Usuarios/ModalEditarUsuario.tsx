import React, { useState, useEffect } from 'react'
import ModalBase from '../Compartilhados/ModalBase'

interface Usuario {
    id: number
    username: string
    nome: string
    role: 'admin' | 'operador' | 'master'
    ativo: boolean
}

interface ModalEditarUsuarioProps {
    isOpen: boolean
    onClose: () => void
    onSave: (dados: {
        username: string
        nome: string
        senha?: string
        role: 'admin' | 'operador' | 'master'
        ativo: boolean
    }) => void
    usuarioEditando: Usuario | null
}

const ModalEditarUsuario: React.FC<ModalEditarUsuarioProps> = ({
    isOpen,
    onClose,
    onSave,
    usuarioEditando
}) => {
    const [username, setUsername] = useState('')
    const [nome, setNome] = useState('')
    const [senha, setSenha] = useState('')
    const [role, setRole] = useState<'admin' | 'operador' | 'master'>('admin')
    const [ativo, setAtivo] = useState(true)

    useEffect(() => {
        if (usuarioEditando) {
            setUsername(usuarioEditando.username)
            setNome(usuarioEditando.nome)
            setSenha('')
            setRole(usuarioEditando.role)
            setAtivo(usuarioEditando.ativo)
        } else {
            setUsername('')
            setNome('')
            setSenha('')
            setRole('admin')
            setAtivo(true)
        }
    }, [usuarioEditando, isOpen])

    const handleSalvar = () => {
        if (!username.trim() || !nome.trim()) {
            return
        }

        const dados: {
            username: string
            nome: string
            senha?: string
            role: 'admin' | 'operador' | 'master'
            ativo: boolean
        } = {
            username: username.trim(),
            nome: nome.trim(),
            role,
            ativo
        }

        if (senha.trim()) {
            dados.senha = senha.trim()
        }

        onSave(dados)
        // Não fechar automaticamente - deixar o componente pai controlar
    }

    const isValid = username.trim() !== '' && nome.trim() !== ''

    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
                Cancelar
            </button>
            <button
                onClick={handleSalvar}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-azul)' }}
                onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                        e.currentTarget.style.opacity = '0.9'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                        e.currentTarget.style.opacity = '1'
                    }
                }}
                disabled={!isValid}
            >
                <i className="bi bi-check-circle-fill"></i>
                <span>Salvar</span>
            </button>
        </>
    )

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            titulo="Editar Usuário"
            icone="bi-person-check-fill"
            corHeader="azul"
            maxWidth="lg"
            footer={footer}
        >
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="bi bi-info-circle"></i>
                    Informações do Usuário
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username *
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: joao.silva"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome *
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: João Silva"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nova Senha (deixe em branco para não alterar)
                        </label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite a nova senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
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
                        >
                            <option value="admin">Administrador</option>
                            <option value="operador">Operador</option>
                            <option value="master">Master</option>
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ativo}
                                onChange={(e) => setAtivo(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                        </label>
                    </div>
                </div>
            </div>
        </ModalBase>
    )
}

export default ModalEditarUsuario

