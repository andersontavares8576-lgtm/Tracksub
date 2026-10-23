import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  QrCode as QrIcon,
  Check,
  Copy,
  Eye,
  FileText,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { Equipamento } from '../../types/tracksub.ts';
import { getEquipamentoQrUrl } from '../../utils/formatters.ts';
import {
  FormatoEtiqueta,
  FORMATOS_ETIQUETA,
  imprimirEtiquetaViaIframe,
  baixarPdfEtiqueta,
} from '../../utils/impressaoEtiqueta.ts';

interface ModalEtiquetaQRCodeProps {
  equipamento: Equipamento | null;
  aberto: boolean;
  onFechar: () => void;
  onAbrirFicha?: (eqp: Equipamento) => void;
}

export const ModalEtiquetaQRCode: React.FC<ModalEtiquetaQRCodeProps> = ({
  equipamento,
  aberto,
  onFechar,
  onAbrirFicha,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [formato, setFormato] = useState<FormatoEtiqueta>('60x40');

  const qrAlvo = equipamento ? getEquipamentoQrUrl(equipamento) : '';
  const formatoConfig = FORMATOS_ETIQUETA.find((f) => f.id === formato) || FORMATOS_ETIQUETA[0];

  useEffect(() => {
    if (equipamento && qrAlvo) {
      // Gera em 800px a nível de redundância 'M' para módulos de QR Code mais espessos, nítidos e fáceis de escanear
      QRCode.toDataURL(
        qrAlvo,
        {
          width: 800,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
  }, [equipamento, qrAlvo]);

  if (!aberto || !equipamento) return null;

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(qrAlvo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleImprimir = () => {
    if (qrDataUrl) {
      imprimirEtiquetaViaIframe(equipamento, qrDataUrl, formato);
    }
  };

  const handleBaixarPdf = async () => {
    if (qrDataUrl) {
      await baixarPdfEtiqueta(equipamento, qrDataUrl, formato);
    }
  };

  const handleDownloadImagem = () => {
    const link = document.createElement('a');
    link.download = `etiqueta-${equipamento.codigoPatrimonial}-${formato}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Topo do modal */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Etiqueta e QR Code Industrial</h3>
              <p className="text-xs text-slate-400">Impressão térmica de alta definição ou arquivo PDF vetorial</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="p-5 bg-slate-50 overflow-y-auto space-y-4">
          {/* Seletor de Tamanho / Formato da Etiqueta */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Escolha o Tamanho da Etiqueta:</span>
              </label>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                QR Code: {formatoConfig.qrMm} mm ({formatoConfig.larguraMm}x{formatoConfig.alturaMm}mm)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMATOS_ETIQUETA.map((f) => {
                const ativo = formato === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormato(f.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      ativo
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${ativo ? 'text-blue-900' : 'text-slate-800'}`}>
                        {f.id === 'maxi-qr' ? 'Maxi QR' : `${f.larguraMm} x ${f.alturaMm} mm`}
                      </span>
                      {ativo && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {f.id === '60x40' ? 'Rolo Padrão (QR +90%)' : f.id === '80x50' ? 'Painéis / Cubículos' : f.id === '100x60' ? 'Pátio SE (Grande)' : 'QR Code 33mm Max'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prévia da Etiqueta Física Formatada */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-white p-4 rounded-xl border-2 border-slate-900 shadow-md flex items-center justify-between gap-4">
              <div className="flex-1 pr-1 text-left min-w-0">
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                  <span>TRACKSUB</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 text-[9px]">SIN BR</span>
                </div>
                <div className="font-mono text-base font-black text-slate-950 tracking-tight truncate mt-0.5" title={equipamento.codigoPatrimonial}>
                  {equipamento.codigoPatrimonial}
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {equipamento.descricao}
                </div>
                <div className="text-[11px] text-slate-700 line-clamp-1 mt-0.5 font-medium">
                  Mod: {equipamento.modelo} • {equipamento.fabricante}
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                  S/N: {equipamento.numeroSerie}
                </div>
                <div className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                  Status: {equipamento.estadoOperacional}
                </div>
                {equipamento.dataInstalacao && (
                  <div className="text-[10px] text-slate-600 truncate mt-0.5">
                    Instalado: {equipamento.dataInstalacao}
                  </div>
                )}
                <div className="text-[9px] text-slate-500 line-clamp-1 mt-1 pt-1 border-t border-dashed border-slate-200">
                  Loc: {equipamento.localizacaoDescricao}
                </div>
              </div>

              {/* Imagem do QR Code Super Dimensionada */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="p-1.5 bg-white rounded-lg border-2 border-slate-900 shadow-xs flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      className="w-32 h-32 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="animate-pulse bg-slate-200 w-32 h-32 rounded" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-blue-700 mt-1 font-mono">
                  QR {formatoConfig.qrMm}mm
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>
                QR Code com blocos espessados e alta nitidez (400 DPI) para leitura instantânea por câmeras de campo.
              </span>
            </p>
          </div>

          {/* Dados do Conteúdo Embutido no QR Code */}
          <div className="w-full bg-slate-100 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Link Direto Gravado no QR Code:</span>
              <button
                type="button"
                onClick={handleCopiarCodigo}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-blue-900 bg-white p-2 rounded mt-1.5 border border-slate-200 select-all truncate">
              {qrAlvo}
            </div>
          </div>
        </div>

        {/* Ações inferiores */}
        <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200 shrink-0">
          <div>
            {onAbrirFicha && (
              <button
                type="button"
                onClick={() => {
                  onFechar();
                  onAbrirFicha(equipamento);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver Ficha Técnica</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImagem}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition"
              title="Baixar imagem PNG do QR Code"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>

            <button
              type="button"
              onClick={handleBaixarPdf}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow-xs transition"
              title={`Baixar Etiqueta ${formatoConfig.nome} em arquivo PDF`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Baixar PDF ({formatoConfig.larguraMm}x{formatoConfig.alturaMm}mm)</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
              title="Imprimir Etiqueta na impressora térmica ou salvar PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta ({formatoConfig.larguraMm}x{formatoConfig.alturaMm}mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
