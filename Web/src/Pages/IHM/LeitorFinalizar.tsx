import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ihmAPI, producaoAPI } from "../../api/api"
import { InputWithKeyboard } from "../../Components/VirtualKeyboard"

type StatusAcesso = 'idle' | 'success' | 'error'

const LeitorFinalizar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { posto, funcionario_matricula, operador } = (location.state as { 
        posto?: string; 
        funcionario_matricula?: string; 
        operador?: string 
    }) || {};

    const [rfidInput, setRfidInput] = useState('')
    const [status, setStatus] = useState<StatusAcesso>('idle')
    const [colaborador, setColaborador] = useState<string | null>(null)
    const [mensagem, setMensagem] = useState<string>('')

    useEffect(() => {
        // Se não tiver os dados necessários, redirecionar para o leitor inicial
        if (!posto || !funcionario_matricula) {
            navigate('/ihm/leitor', { replace: true });
        }
    }, [posto, funcionario_matricula, navigate]);

    // Verificar periodicamente se o registro foi cancelado
    useEffect(() => {
        if (!posto || !funcionario_matricula) {
            return;
        }

        const verificarRegistroCancelado = async () => {
            try {
                const registroResponse = await producaoAPI.buscarRegistroAberto(posto, funcionario_matricula);
                if (!registroResponse.registro) {
                    // Registro foi cancelado, redirecionar para o leitor
                    setStatus('error');
                    setMensagem('Operação foi cancelada');
                    setTimeout(() => {
                        navigate('/ihm/leitor', { replace: true });
                    }, 2000);
                }
            } catch (error) {
                // Se não encontrar registro, pode ter sido cancelado
                setStatus('error');
                setMensagem('Operação foi cancelada');
                setTimeout(() => {
                    navigate('/ihm/leitor', { replace: true });
                }, 2000);
            }
        };

        // Verificar a cada 5 segundos se o registro foi cancelado
        const interval = setInterval(verificarRegistroCancelado, 5000);
        return () => clearInterval(interval);
    }, [posto, funcionario_matricula, navigate]);

    const resetarEstado = () => {
        setStatus('idle')
        setColaborador(null)
        setRfidInput('')
        setMensagem('')
    }

    const processarRfid = async (codigo: string) => {
        const codigoLimpo = codigo.trim()
        
        if (!posto || !funcionario_matricula) {
            setStatus('error')
            setMensagem('Dados insuficientes para finalizar')
            setTimeout(() => {
                navigate('/ihm/leitor', { replace: true });
            }, 2000);
            return;
        }
        
        try {
            // Validar RFID
            const response = await ihmAPI.validarRfid(codigoLimpo)
            
            if (response.status === 'success' && response.funcionario) {
                const funcionarioValidado = response.funcionario
                
                // Verificar se é o mesmo funcionário que iniciou o trabalho
                if (funcionarioValidado.matricula !== funcionario_matricula) {
                    setStatus('error')
                    setMensagem('Apenas o operador que iniciou pode finalizar')
                    setTimeout(resetarEstado, 2000)
                    return
                }

                // Verificar se ainda há registro aberto
                try {
                    const registroResponse = await producaoAPI.buscarRegistroAberto(posto, funcionario_matricula);
                    if (!registroResponse.registro) {
                        // Registro foi cancelado ou não existe mais, redirecionar para o leitor
                        setStatus('error')
                        setMensagem('Operação foi cancelada')
                        setTimeout(() => {
                            navigate('/ihm/leitor', { replace: true });
                        }, 2000);
                        return;
                    }
                } catch (error) {
                    // Se não encontrar registro, pode ter sido cancelado
                    setStatus('error')
                    setMensagem('Operação foi cancelada')
                    setTimeout(() => {
                        navigate('/ihm/leitor', { replace: true });
                    }, 2000);
                    return;
                }

                // Concluir o trabalho
                try {
                    await producaoAPI.registrarSaida({
                        posto: posto,
                        funcionario_matricula: funcionario_matricula
                    });

                    setColaborador(funcionarioValidado.nome)
                    setStatus('success')
                    setMensagem('Operação finalizada com sucesso')
                    
                    // Redirecionar para o leitor inicial após 2 segundos
                    setTimeout(() => {
                        navigate('/ihm/leitor', { replace: true });
                    }, 2000);
                } catch (error: any) {
                    console.error('Erro ao finalizar trabalho:', error);
                    setStatus('error')
                    setMensagem(error.message || 'Erro ao finalizar trabalho')
                    setTimeout(resetarEstado, 2000)
                }
                return
            }
            
            setStatus('error')
            setMensagem('Acesso negado')
            setTimeout(resetarEstado, 2000)
        } catch (error: any) {
            console.error('Erro ao validar RFID:', error)
            setStatus('error')
            setMensagem('Erro ao validar crachá')
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
                    <span className="text-white text-5xl font-bold mb-6 animate-fade-in text-center px-4">
                        {isSuccess ? 'OPERAÇÃO FINALIZADA' : 'ACESSO NEGADO'}
                    </span>
                    {mensagem && (
                        <span className="text-white text-2xl animate-fade-in text-center px-4">
                            {mensagem}
                        </span>
                    )}
                    {isSuccess && colaborador && (
                        <span className="text-white text-xl mt-4 animate-fade-in text-center px-4">
                            {colaborador}
                        </span>
                    )}
                </div>
            )}

            <div className="pt-8 px-6 pb-6 flex items-center justify-center">
                <span className="text-gray-700 font-sans text-2xl py-6 text-center">
                    Finalize a operação passando o crachá
                </span>
            </div>

            <div className="pt-8 px-6 pb-20 flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 flex items-center border-2 rounded-lg px-4 py-4"
                                style={{
                                    borderColor: '#4C79AF',
                                    boxShadow: '0 0 0 3px rgba(76, 121, 175, 0.1)'
                                }}
                            >
                                <InputWithKeyboard
                                    type="text"
                                    className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400"
                                    placeholder="Passe o crachá RFID para finalizar"
                                    autoComplete="off"
                                    value={rfidInput}
                                    onChange={setRfidInput}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    disabled={status !== 'idle'}
                                />
                            </div>
                            <button
                                onClick={() => rfidInput.trim() && processarRfid(rfidInput)}
                                disabled={!rfidInput.trim() || status !== 'idle'}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 whitespace-nowrap"
                            >
                                Concluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeitorFinalizar

