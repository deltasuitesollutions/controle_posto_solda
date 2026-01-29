import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ihmAPI } from "../../api/api"
import { useAuth } from "../../contexts/AuthContext"
import { InputWithKeyboard } from "../../Components/VirtualKeyboard"

type StatusAcesso = 'idle' | 'success' | 'error'

const LeitorRfid = () => {
    const [rfidInput, setRfidInput] = useState('')
    const [status, setStatus] = useState<StatusAcesso>('idle')
    const [colaborador, setColaborador] = useState<string | null>(null)
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const resetarEstado = () => {
        setStatus('idle')
        setColaborador(null)
        setRfidInput('')
    }

    const processarRfid = async (codigo: string) => {
        const codigoLimpo = codigo.trim()
        
        try {
            const response = await ihmAPI.validarRfid(codigoLimpo)
            
            if (response.status === 'success' && response.funcionario) {
                const nomeOperador = response.funcionario.nome
                setColaborador(nomeOperador)
                setStatus('success')
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

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            {status !== 'idle' && (
                <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`}>
                    <div className="flex flex-col items-center text-center">
                        <div className="text-white text-5xl font-bold animate-fade-in">
                            ACESSO
                        </div>
                        <div className="text-white text-5xl font-bold animate-fade-in mt-6">
                            {isSuccess ? 'LIBERADO' : 'NEGADO'}
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-12 px-6 pb-4 flex flex-row items-center relative">
                <span className="text-gray-700 font-sans text-5xl font-bold tracking-wide flex-1 text-center">
                    Seja Bem Vindo!
                </span>
                <button
                    onClick={handleLogout}
                    className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity absolute right-6"
                    style={{ backgroundColor: '#DC2626' }}
                >
                    Sair
                </button>
            </div>

            <div className="pt-10 px-6 pb-20 flex items-center justify-center">
                <div className="w-full max-w-3xl">
                    <div className="bg-white rounded-lg shadow-lg p-10">
                        <div
                            className="flex items-center border-2 rounded-lg px-6 py-5"
                            style={{
                                borderColor: '#4C79AF',
                                boxShadow: '0 0 0 3px rgba(76, 121, 175, 0.1)'
                            }}
                        >
                            <InputWithKeyboard
                                type="text"
                                className="flex-1 text-2xl outline-none bg-transparent placeholder-gray-400"
                                placeholder="Passe o crachá RFID abaixo"
                                autoComplete="off"
                                value={rfidInput}
                                onChange={setRfidInput}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                disabled={status !== 'idle'}
                                keyboardSize="large"
                            />
                            <button
                                type="button"
                                onClick={() => rfidInput.trim() && processarRfid(rfidInput)}
                                disabled={status !== 'idle' || !rfidInput.trim()}
                                className="ml-3 w-12 h-12 flex items-center justify-center rounded-lg text-white text-2xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: '#4C79AF' }}
                                title="Confirmar"
                            >
                                ✓
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeitorRfid
