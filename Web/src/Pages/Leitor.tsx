import { useState } from "react"
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'

type StatusAcesso = 'idle' | 'success' | 'error'

const MOCK_COLABORADORES = [
    { rfid: '123456', nome: 'Juliana Pereira' },
    { rfid: '654321', nome: 'Carlos Silva' },
]

const LeitorRfid = () => {
    const [menuAberto, setMenuAberto] = useState(false)
    const [rfidInput, setRfidInput] = useState('')
    const [status, setStatus] = useState<StatusAcesso>('idle')
    const [colaborador, setColaborador] = useState<string | null>(null)

    const handleRfidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRfidInput(e.target.value)
    }

    const validarRfidMock = (codigo: string) => {
        const colaboradorEncontrado = MOCK_COLABORADORES.find(
            (c) => c.rfid === codigo
        )

        if (colaboradorEncontrado) {
            setColaborador(colaboradorEncontrado.nome)
            setStatus('success')
        } else {
            setColaborador(null)
            setStatus('error')
        }

        setTimeout(() => {
            setStatus('idle')
            setColaborador(null)
            setRfidInput('')
        }, 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && rfidInput.trim()) {
            validarRfidMock(rfidInput.trim())
        }
    }

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">

            {/* Overlay de sucesso / erro */}
            {status !== 'idle' && (
                <div
                    className={`fixed inset-0 z-50 flex flex-col items-center justify-center
                    ${status === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                >
                    <span className="text-white text-5xl font-bold mb-6">
                        {status === 'success' ? 'ACESSO LIBERADO' : 'ACESSO NEGADO'}
                    </span>

                    {status === 'success' && colaborador && (
                        <span className="text-white text-2xl">
                            Ótimo turno de trabalho, {colaborador}
                        </span>
                     )}

                     {status === 'error' && (
                        <span className="text-white text-2xl">
                            Verifique a liberação com o seu líder
                        </span>
                    )}
                </div>
            )}

            <TopBar
                menuAberto={menuAberto}
                onToggleMenu={() => setMenuAberto(!menuAberto)}
            />

            <MenuLateral
                menuAberto={menuAberto}
                onClose={() => setMenuAberto(false)}
            />

            <div className="pt-20 px-6 pb-6 md:pl-20 transition-all duration-300">
                <span className="text-gray-700 font-sans text-2xl py-6 flex items-center justify-center">
                    Seja Bem Vindo, colaborador!
                </span>
            </div>

            <div className="pt-8 px-6 pb-20 md:pb-24 md:pl-20 transition-all duration-300 flex items-center justify-center">
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
                                onChange={handleRfidChange}
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
