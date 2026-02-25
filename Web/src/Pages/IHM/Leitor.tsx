import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ihmAPI } from "../../api/api"
import { useAuth } from "../../contexts/AuthContext"

type StatusAcesso = 'idle' | 'success' | 'error'

const LeitorRfid = () => {
    const [rfidInput, setRfidInput] = useState('')
    const [status, setStatus] = useState<StatusAcesso>('idle')
    const navigate = useNavigate()
    const { logout } = useAuth()

    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        inputRef.current?.focus()
    }, []);

    // Ao carregar, verificar se há sessão anterior (ex: Raspberry reiniciou)
    useEffect(() => {
        try {
            const sessao = localStorage.getItem('ihm_sessao')
            if (sessao) {
                const dados = JSON.parse(sessao)
                if (dados.operador) {
                    // Sessão encontrada — restaurar para a tela de operação
                    navigate('/ihm/operacao', { state: { operador: dados.operador } })
                }
            }
        } catch {
            localStorage.removeItem('ihm_sessao')
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('ihm_sessao') // Limpar sessão ao sair
        logout()
        navigate('/login')
    }

    const resetarEstado = () => {
        setStatus('idle')
        setRfidInput('')
    }

    const processarRfid = async (codigo: string) => {
        const codigoLimpo = codigo.trim()
        
        try {
            const response = await ihmAPI.validarRfid(codigoLimpo)
            
            if (response.status === 'success' && response.funcionario) {
                const nomeOperador = response.funcionario.nome
                setStatus('success')

                // Salvar sessão para restauração após reinicialização
                localStorage.setItem('ihm_sessao', JSON.stringify({ operador: nomeOperador }))

                setTimeout(() => {
                    navigate('/ihm/operacao', { state: { operador: nomeOperador } })
                }, 2000)
                return
            }
            
            setStatus('error')
            setTimeout(resetarEstado, 2000)
        } catch (error: any) {
            console.error('Erro ao validar RFID:', error)
            setStatus('error')
            setTimeout(resetarEstado, 2000)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && rfidInput.trim()) {
            processarRfid(rfidInput)
        }
    }

    const isSuccess = status === 'success'
    const isError = status === 'error'

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRfidInput(e.target.value)
    }

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center relative">
            {status !== 'idle' && (
                <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`}>
                    <div className="flex flex-col items-center text-center">
                        <div className="text-white text-9xl font-bold animate-fade-in">
                            ACESSO
                        </div>
                        <div className="text-white text-9xl font-bold animate-fade-in mt-6">
                            {isSuccess ? 'LIBERADO' : 'NEGADO'}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={handleLogout}
                className="px-12 py-4 text-white rounded-xl font-bold hover:opacity-90 transition-opacity absolute top-8 right-8 text-2xl shadow-lg"
                style={{ backgroundColor: '#DC2626' }}
            >
                Sair
            </button>

            <div className="flex flex-col items-center justify-center w-full px-6">
                <h1 className="text-gray-700 font-sans text-6xl font-bold tracking-wide mb-16 text-center">
                    Seja Bem Vindo!
                </h1>
                
                <div className="w-full max-w-6xl">
                    <div className="bg-white rounded-3xl shadow-2xl p-16">
                        <div
                            className="flex items-center border-3 rounded-2xl px-12 py-10"
                            style={{
                                borderColor: '#4C79AF',
                                borderWidth: '4px',
                                boxShadow: '0 0 0 6px rgba(76, 121, 175, 0.15)'
                            }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                className="flex-1 text-5xl outline-none bg-transparent placeholder-gray-400 text-center"
                                placeholder="Passe o crachá RFID abaixo"
                                autoComplete="off"
                                value={rfidInput}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                disabled={status !== 'idle'}
                            ></input>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeitorRfid
