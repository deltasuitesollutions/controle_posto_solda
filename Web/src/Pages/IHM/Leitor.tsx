import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ihmAPI } from "../../api/api"

type StatusAcesso = 'idle' | 'success' | 'error'

const LeitorRfid = () => {
    const [rfidInput, setRfidInput] = useState('')
    const [status, setStatus] = useState<StatusAcesso>('idle')
    const [colaborador, setColaborador] = useState<string | null>(null)
    const navigate = useNavigate()

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
                    <span className="text-white text-5xl font-bold mb-6 animate-fade-in">
                        {isSuccess ? 'ACESSO LIBERADO' : 'ACESSO NEGADO'}
                    </span>
                    {isSuccess && colaborador && (
                        <span className="text-white text-2xl animate-fade-in">
                            Ótimo turno de trabalho, {colaborador}
                        </span>
                    )}
                    {isError && (
                        <span className="text-white text-2xl animate-fade-in">
                            Verifique a liberação com o seu líder
                        </span>
                    )}
                </div>
            )}

            <div className="pt-8 px-6 pb-6 flex items-center justify-center">
                <span className="text-gray-700 font-sans text-2xl py-6">
                    Seja Bem Vindo, colaborador!
                </span>
            </div>

            <div className="pt-8 px-6 pb-20 flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div
                            className="flex items-center border-2 rounded-lg px-4 py-4"
                            style={{
                                borderColor: '#4C79AF',
                                boxShadow: '0 0 0 3px rgba(76, 121, 175, 0.1)'
                            }}
                        >
                            <input
                                type="text"
                                className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400"
                                placeholder="Passe o crachá RFID abaixo"
                                autoComplete="off"
                                value={rfidInput}
                                onChange={(e) => setRfidInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                disabled={status !== 'idle'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeitorRfid
