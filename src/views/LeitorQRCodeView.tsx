import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  Search,
  Upload,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Eye,
  Printer,
  History,
  X,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Equipamento, Movimentacao, Usuario } from '../types/tracksub.ts';
import { api } from '../services/api.ts';
import { formatarDataHora } from '../utils/formatters.ts';

interface LeitorQRCodeViewProps {
  onAbrirFicha: (eqp: Equipamento) => void;
  onAbrirEtiqueta: (eqp: Equipamento) => void;
  onAbrirMovimentacao: (eqp: Equipamento, operacaoPadrao: any) => void;
  usuarioAtual: Usuario | null;
  equipamentosPrecarregados: Equipamento[];
}

export const LeitorQRCodeView: React.FC<LeitorQRCodeViewProps> = ({
  onAbrirFicha,
  onAbrirEtiqueta,
  onAbrirMovimentacao,
  usuarioAtual,
  equipamentosPrecarregados,
}) => {
  const [codigoManual, setCodigoManual] = useState('');
  const [equipamentoLocalizado, setEquipamentoLocalizado] = useState<Equipamento | null>(null);
  const [historicoEquipamento, setHistoricoEquipamento] = useState<Movimentacao[]>([]);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const containerId = 'qr-reader-container';

  // Buscar equipamento por código QR ou patrimônio
  const processarCodigo = async (codigoLido: string) => {
    if (!codigoLido.trim()) return;
    setCarregando(true);
    setErroCamera(null);
    setMensagemSucesso(null);

    try {
      // Normalizar código
      let clean = codigoLido.trim();
      const eqp = await api.buscarEquipamentoPorCodigo(clean);
      setEquipamentoLocalizado(eqp);
      setMensagemSucesso(`Equipamento ${eqp.codigoPatrimonial} identificado! Redirecionando para a ficha técnica...`);

      // Carregar histórico dele
      const movs = await api.getMovimentacoes(eqp.id);
      setHistoricoEquipamento(movs);

      // DIRECIONAR IMEDIATAMENTE PARA A FICHA DO EQUIPAMENTO ESCANEADO
      onAbrirFicha(eqp);
    } catch (err: any) {
      setEquipamentoLocalizado(null);
      setHistoricoEquipamento([]);
      setErroCamera(err.message || 'Equipamento não localizado no banco de dados.');
    } finally {
      setCarregando(false);
    }
  };

  const iniciarCamera = async () => {
    setErroCamera(null);
    try {
      setCameraAtiva(true);
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Leu com sucesso
          processarCodigo(decodedText);
          pararCamera();
        },
        () => {
          // Erro de frame normal quando não há QR visível, ignora
        }
      );
    } catch (err: any) {
      setCameraAtiva(false);
      setErroCamera(
        'Não foi possível acessar a câmera do dispositivo. Verifique as permissões de vídeo ou utilize a pesquisa manual abaixo.'
      );
    }
  };

  const pararCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Erro ao parar câmera:', e);
      }
    }
    setCameraAtiva(false);
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCarregando(true);
      setErroCamera(null);
      const html5QrCode = new Html5Qrcode('qr-reader-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      processarCodigo(decodedText);
    } catch (err) {
      setErroCamera('Nenhum QR Code válido foi identificado na imagem enviada.');
    } finally {
      setCarregando(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const podeMovimentar = usuarioAtual?.perfil !== 'consulta';

  return (
    <div className="space-y-6">
      {/* Elemento oculto para processar uploads de imagem */}
      <div id="qr-reader-temp" style={{ display: 'none' }} />

      {/* Topo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leitor de QR Code de Equipamentos</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificação instantânea em campo via câmera do celular/tablet ou código patrimonial
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Leitura e Métodos de Entrada */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-xs">
              Métodos de Identificação
            </h3>

            {/* Leitor de Câmera em Tempo Real */}
            <div className="p-4 bg-slate-900 rounded-xl text-center text-white space-y-3">
              <div
                id={containerId}
                className="w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-slate-950 min-h-[200px] flex items-center justify-center border border-slate-800"
              >
                {!cameraAtiva && (
                  <div className="p-6 text-center text-slate-400">
                    <Camera className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                    <p className="text-xs">Câmera desativada</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Clique no botão abaixo para abrir a câmera traseira do seu celular
                    </p>
                  </div>
                )}
              </div>

              {!cameraAtiva ? (
                <button
                  onClick={iniciarCamera}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ativar Câmera e Escanear</span>
                </button>
              ) : (
                <button
                  onClick={pararCamera}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs"
                >
                  <X className="w-4 h-4" />
                  <span>Encerrar Câmera</span>
                </button>
              )}
            </div>

            {/* Alternativa: Upload de Arquivo / Foto */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ou Envie Foto da Etiqueta
              </label>
              <label className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Carregar Imagem com QR Code</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImagem}
                  className="hidden"
                />
              </label>
            </div>

            {/* Alternativa: Digitação Manual de Código */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ou Digite o Código Patrimonial / QR Code
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processarCodigo(codigoManual);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value)}
                  placeholder="Ex: PAT-2024-8841 ou TRACKSUB-PAT-2024-8841"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={carregando}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 transition"
                >
                  {carregando ? 'Buscando...' : 'Buscar'}
                </button>
              </form>
            </div>

            {/* Sugestões Rápidas de Teste com Dados Existentes */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Atalhos Rápidos de Demonstração (Clique para testar):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {equipamentosPrecarregados.slice(0, 4).map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => {
                      setCodigoManual(eq.codigoPatrimonial);
                      processarCodigo(eq.codigoPatrimonial);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded text-[10px] font-mono text-slate-700 border border-slate-200 transition"
                  >
                    {eq.codigoPatrimonial}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas */}
          {erroCamera && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{erroCamera}</span>
            </div>
          )}

          {mensagemSucesso && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{mensagemSucesso}</span>
            </div>
          )}
        </div>

        {/* Ficha Instantânea do Equipamento Escaneado */}
        <div className="lg:col-span-7">
          {equipamentoLocalizado ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95 duration-150">
              {/* Cabeçalho do Ativo Identificado */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-200">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {equipamentoLocalizado.codigoPatrimonial}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                        {equipamentoLocalizado.estadoOperacional}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {equipamentoLocalizado.descricao}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {equipamentoLocalizado.fabricante} • {equipamentoLocalizado.modelo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => onAbrirEtiqueta(equipamentoLocalizado)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Imprimir Etiqueta"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAbrirFicha(equipamentoLocalizado)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ficha Completa</span>
                  </button>
                </div>
              </div>

              {/* Informações de Localização e Especificações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Localização Físico-Elétrica Atual</span>
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">
                    {equipamentoLocalizado.localizacaoDescricao}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Número de Série e Conservação
                  </span>
                  <div className="font-mono text-slate-900 font-semibold">
                    S/N: {equipamentoLocalizado.numeroSerie}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Conservação: <strong>{equipamentoLocalizado.estadoConservacao}</strong> • Resp: {equipamentoLocalizado.responsavel}
                  </div>
                </div>
              </div>

              {/* Ações Imediatas de Movimentação */}
              {podeMovimentar && (
                <div className="p-4 bg-slate-900 rounded-xl text-white space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Ações Imediatas para este Equipamento
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => onAbrirMovimentacao(equipamentoLocalizado, 'Instalação')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Instalar</span>
                    </button>
                    <button
                      onClick={() => onAbrirMovimentacao(equipamentoLocalizado, 'Retirada')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Retirar</span>
                    </button>
                    <button
                      onClick={() => onAbrirMovimentacao(equipamentoLocalizado, 'Transferência de Painel')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transferir</span>
                    </button>
                    <button
                      onClick={() => onAbrirMovimentacao(equipamentoLocalizado, 'Envio para Manutenção')}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <span>Oficina / Manutenção</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Prévia do Histórico de Rastreabilidade */}
              <div className="pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1 mb-2">
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Histórico Recente de Movimentações ({historicoEquipamento.length})</span>
                </h4>

                <div className="space-y-2">
                  {historicoEquipamento.slice(0, 3).map((mov) => (
                    <div
                      key={mov.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{mov.tipoOperacao}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {formatarDataHora(mov.dataHora)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{mov.motivo}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {mov.usuarioNome}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[360px] bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <QrCode className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhum Equipamento Lido no Momento</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Aponte a câmera para a etiqueta QR Code ou digite o código de patrimônio para abrir a ficha técnica, histórico e opções de movimentação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
