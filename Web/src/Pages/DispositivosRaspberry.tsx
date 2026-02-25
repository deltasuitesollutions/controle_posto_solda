import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { dispositivosRaspberryAPI } from '../api/api'

interface DispositivoRaspberry {
    id: number
    serial: string
    nome: string
    data_registro?: string
}

const DispositivosRaspberry = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [dispositivos, setDispositivos] = useState<DispositivoRaspberry[]>([])
    const [carregando, setCarregando] = useState(false)

    const [serialNovo, setSerialNovo] = useState('')
    const [nomeNovo, setNomeNovo] = useState('')
    const [salvando, setSalvando] = useState(false)

    const [dispositivoEditando, setDispositivoEditando] = useState<DispositivoRaspberry | null>(null)

    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')

    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [dispositivoAExcluir, setDispositivoAExcluir] = useState<DispositivoRaspberry | null>(null)
    const [excluindo, setExcluindo] = useState(false)

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarDispositivos()
        }
    }, [abaAtiva])

    const carregarDispositivos = async () => {
        setCarregando(true)
        try {
            const dados = await dispositivosRaspberryAPI.listar()
            const raw = Array.isArray(dados) ? dados : []
            const lista = raw.map((d: any) => ({
                id: d.id || d.dispositivo_id,
                serial: d.serial || '',
                nome: d.nome || '',
                data_registro: d.data_registro
            }))
            setDispositivos(lista)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao carregar dispositivos: ${error?.message || 'Erro desconhecido'}`)
            setModalErroAberto(true)
        } finally {
            setCarregando(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (dispositivoEditando) {
            const nome = nomeNovo.trim()
            setSalvando(true)
            try {
                await dispositivosRaspberryAPI.atualizarNome(dispositivoEditando.id, nome)
                setMensagemSucesso('Dispositivo atualizado com sucesso!')
                setModalSucessoAberto(true)
                limparFormulario()
                setDispositivoEditando(null)
                if (abaAtiva === 'listar') await carregarDispositivos()
            } catch (error: any) {
                setTituloErro('Erro!')
                setMensagemErro(`Erro ao atualizar: ${error?.message || 'Erro desconhecido'}`)
                setModalErroAberto(true)
            } finally {
                setSalvando(false)
            }
        } else {
            const serial = serialNovo.trim()
            if (!serial) {
                setMensagemErro('Informe o serial do dispositivo.')
                setModalErroAberto(true)
                return
            }
            setSalvando(true)
            try {
                await dispositivosRaspberryAPI.criar(serial, nomeNovo.trim() || undefined)
                setMensagemSucesso('Dispositivo cadastrado com sucesso!')
                setModalSucessoAberto(true)
                limparFormulario()
                if (abaAtiva === 'listar') await carregarDispositivos()
            } catch (error: any) {
                setTituloErro('Erro!')
                setMensagemErro(error?.message || 'Erro ao cadastrar dispositivo.')
                setModalErroAberto(true)
            } finally {
                setSalvando(false)
            }
        }
    }

    const limparFormulario = () => {
        setSerialNovo('')
        setNomeNovo('')
    }

    const handleEditar = (dispositivo: DispositivoRaspberry) => {
        setDispositivoEditando(dispositivo)
        setSerialNovo(dispositivo.serial)
        setNomeNovo(dispositivo.nome || '')
        setAbaAtiva('cadastrar')
    }

    const cancelarEdicao = () => {
        setDispositivoEditando(null)
        limparFormulario()
    }

    const handleExcluir = (dispositivo: DispositivoRaspberry) => {
        setDispositivoAExcluir(dispositivo)
        setModalExcluirAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!dispositivoAExcluir) return
        setExcluindo(true)
        try {
            await dispositivosRaspberryAPI.remover(dispositivoAExcluir.id)
            setMensagemSucesso('Dispositivo excluído com sucesso!')
            setModalSucessoAberto(true)
            setDispositivoAExcluir(null)
            setModalExcluirAberto(false)
            await carregarDispositivos()
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao excluir: ${error?.message || 'Erro desconhecido'}`)
            setModalErroAberto(true)
        } finally {
            setExcluindo(false)
        }
    }

    const fecharModalExcluir = () => {
        setModalExcluirAberto(false)
        setDispositivoAExcluir(null)
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
                                    onClick={() => {
                                        setAbaAtiva('cadastrar')
                                        cancelarEdicao()
                                    }}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-cpu mr-2"></i>
                                    {dispositivoEditando ? 'Editar Dispositivo' : 'Cadastrar Dispositivo'}
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
                                    Listar Dispositivos
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Serial
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                value={serialNovo}
                                                onChange={(e) => setSerialNovo(e.target.value)}
                                                placeholder="Ex: 10000000abc12345"
                                                disabled={!!dispositivoEditando}
                                                required={!dispositivoEditando}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nome (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={nomeNovo}
                                                onChange={(e) => setNomeNovo(e.target.value)}
                                                placeholder="Ex: Posto 1, Solda Linha A"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={salvando || (!dispositivoEditando && !serialNovo.trim())}
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                            >
                                                <i className="bi bi-check-lg"></i>
                                                <span>{dispositivoEditando ? (salvando ? 'Salvando...' : 'Salvar') : (salvando ? 'Cadastrando...' : 'Cadastrar Dispositivo')}</span>
                                            </button>
                                            {dispositivoEditando && (
                                                <button
                                                    type="button"
                                                    onClick={cancelarEdicao}
                                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                    <span>Cancelar</span>
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <p className="text-gray-500 text-sm mb-4">
                                            Dispositivos Raspberry cadastrados. Use Editar para alterar o nome e Excluir para remover.
                                        </p>
                                        {carregando ? (
                                            <div className="flex justify-center items-center py-12">
                                                <p className="text-gray-500">Carregando...</p>
                                            </div>
                                        ) : dispositivos.length > 0 ? (
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {dispositivos.map((dispositivo) => (
                                                            <tr key={dispositivo.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 align-middle">
                                                                    {dispositivo.serial}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900 align-middle">
                                                                    {dispositivo.nome || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 align-middle">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditar(dispositivo)}
                                                                            className="p-2 rounded transition-colors hover:opacity-80"
                                                                            style={{ color: 'var(--bg-azul)' }}
                                                                            title="Editar dispositivo"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcluir(dispositivo)}
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                            title="Excluir dispositivo"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 border border-gray-200 rounded-lg bg-gray-50/50">
                                                <i className="bi bi-cpu text-gray-300 text-4xl mb-3"></i>
                                                <p className="text-gray-500 font-medium">Nenhum dispositivo cadastrado</p>
                                                <p className="text-gray-400 text-sm mt-1">Use a aba Cadastrar para adicionar um dispositivo.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModalExcluir}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir dispositivo"
                mensagem={dispositivoAExcluir
                    ? `Tem certeza que deseja excluir o dispositivo "${dispositivoAExcluir.nome || dispositivoAExcluir.serial}"? Esta ação não pode ser desfeita.`
                    : ''}
                textoConfirmar={excluindo ? 'Excluindo...' : 'Excluir'}
                textoCancelar="Cancelar"
                corHeader="laranja"
            />
        </div>
    )
}

export default DispositivosRaspberry
