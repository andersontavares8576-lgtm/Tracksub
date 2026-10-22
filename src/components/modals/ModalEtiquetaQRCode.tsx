import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, X, QrCode as QrIcon, Check, Copy, Eye, ExternalLink } from 'lucide-react';
import { Equipamento } from '../../types/tracksub.ts';
import { getEquipamentoQrUrl } from '../../utils/formatters.ts';

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

  const qrAlvo = equipamento ? getEquipamentoQrUrl(equipamento) : '';

  useEffect(() => {
    if (equipamento && qrAlvo) {
      QRCode.toDataURL(
        qrAlvo,
        {
          width: 320,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta QR Code - ${equipamento.codigoPatrimonial}</title>
        <style>
          @page { size: 60mm 40mm; margin: 0; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 4mm;
            width: 52mm;
            height: 32mm;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            color: #000;
          }
          .info {
            width: 60%;
            font-size: 7pt;
            line-height: 1.15;
          }
          .title {
            font-weight: bold;
            font-size: 8pt;
            margin-bottom: 2px;
          }
          .patrimonio {
            font-size: 9pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin: 2px 0;
          }
          .sub {
            font-size: 6pt;
            color: #333;
          }
          .qr {
            width: 38%;
            text-align: right;
          }
          .qr img {
            width: 25mm;
            height: 25mm;
          }
        </style>
      </head>
      <body>
        <div class="info">
          <div class="title">TRACKSUB • SUBESTAÇÃO</div>
          <div class="patrimonio">${equipamento.codigoPatrimonial}</div>
          <div><strong>S/N:</strong> ${equipamento.numeroSerie}</div>
          <div><strong>Fab:</strong> ${equipamento.fabricante}</div>
          <div><strong>Mod:</strong> ${equipamento.modelo}</div>
          <div class="sub">Loc: ${equipamento.localizacaoDescricao.substring(0, 32)}...</div>
        </div>
        <div class="qr">
          <img src="${qrDataUrl}" alt="QR Code" />
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadImagem = () => {
    const link = document.createElement('a');
    link.download = `etiqueta-${equipamento.codigoPatrimonial}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Topo do modal */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <QrIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-base">Etiqueta e QR Code Industrial</h3>
          </div>
          <button
            onClick={onFechar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prévia da Etiqueta Física 60x40mm */}
        <div className="p-6 bg-slate-50 flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Pré-visualização da Etiqueta (Padrão 60 x 40 mm)
          </div>

          <div className="w-full max-w-sm bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-between">
            <div className="flex-1 pr-3 text-left">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                TRACKSUB • SIN BR
              </div>
              <div className="font-mono text-base font-black text-slate-900 tracking-tight">
                {equipamento.codigoPatrimonial}
              </div>
              <div className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">
                {equipamento.modelo}
              </div>
              <div className="text-[11px] text-slate-600 line-clamp-1">
                {equipamento.fabricante}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                S/N: {equipamento.numeroSerie}
              </div>
              <div className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                {equipamento.localizacaoDescricao}
              </div>
            </div>

            {/* Imagem do QR Code */}
            <div className="w-28 h-28 bg-white p-1 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="animate-pulse bg-slate-200 w-full h-full rounded" />
              )}
            </div>
          </div>

          {/* Dados do Conteúdo Embutido */}
          <div className="w-full mt-4 bg-slate-100 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <span>Link Direto da Ficha (QR Code):</span>
              </span>
              <button
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
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center space-x-1">
              <span>Ao escanear com a câmera do celular ou leitor industrial, o técnico é direcionado instantaneamente para a ficha deste ativo.</span>
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200">
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
                <span>Testar Ficha Técnica</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadImagem}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PNG</span>
            </button>
            <button
              onClick={handleImprimir}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
