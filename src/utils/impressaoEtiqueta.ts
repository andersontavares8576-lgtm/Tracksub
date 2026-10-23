import { Equipamento, Movimentacao } from '../types/tracksub.ts';
import { formatarData, formatarDataHora } from './formatters.ts';

/**
 * Utilitário de Impressão e Geração de PDF para Etiquetas e Fichas Técnicas do TRACKSUB
 * Totalmente compatível com iframes, dispositivos móveis e navegadores sem dependência de window.open
 */

export type FormatoEtiqueta = '60x40' | '80x50' | '100x60' | 'maxi-qr';

export interface FormatoEtiquetaConfig {
  id: FormatoEtiqueta;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  qrMm: number;
  descricao: string;
}

export const FORMATOS_ETIQUETA: FormatoEtiquetaConfig[] = [
  {
    id: '60x40',
    nome: '60 x 40 mm (Padrão - QR Code Ampliado)',
    larguraMm: 60,
    alturaMm: 40,
    qrMm: 29,
    descricao: 'Tamanho padrão para rolos térmicos com QR Code ampliado para 29mm (área +90% maior)',
  },
  {
    id: '80x50',
    nome: '80 x 50 mm (Médio Industrial)',
    larguraMm: 80,
    alturaMm: 50,
    qrMm: 39,
    descricao: 'QR Code gigante de 39mm para visualização aprimorada em painéis e cubículos',
  },
  {
    id: '100x60',
    nome: '100 x 60 mm (Grande / Pátio SE)',
    larguraMm: 100,
    alturaMm: 60,
    qrMm: 49,
    descricao: 'Tamanho máximo (10x6cm) com QR de quase 5cm, legível a metros de distância',
  },
  {
    id: 'maxi-qr',
    nome: 'Maxi QR Code (Foco Extremo no QR)',
    larguraMm: 60,
    alturaMm: 40,
    qrMm: 33,
    descricao: 'QR Code hiperdimensionado ocupando a altura total da etiqueta para escaneamento instantâneo',
  },
];

/**
 * Gera o documento HTML formatado com dimensões dinâmicas e QR Code superdimensionado e nítido
 */
export function gerarHtmlEtiqueta(
  equipamento: Equipamento,
  qrDataUrl: string,
  formato: FormatoEtiqueta = '60x40'
): string {
  const config = FORMATOS_ETIQUETA.find((f) => f.id === formato) || FORMATOS_ETIQUETA[0];
  const wMm = config.larguraMm;
  const hMm = config.alturaMm;
  const qrMm = config.qrMm;

  // Ajustes tipográficos proporcionais ao tamanho da etiqueta
  const escala = formato === '100x60' ? 1.4 : formato === '80x50' ? 1.2 : 1.0;
  const fontSizeBrand = (7.5 * escala).toFixed(1);
  const fontSizePatrimonio = (11.5 * escala).toFixed(1);
  const fontSizeDesc = (6.8 * escala).toFixed(1);
  const fontSizeMeta = (6.0 * escala).toFixed(1);
  const fontSizeFooter = (5.2 * escala).toFixed(1);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Etiqueta QR Code - ${equipamento.codigoPatrimonial}</title>
  <style>
    @page {
      size: ${wMm}mm ${hMm}mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      width: ${wMm}mm;
      height: ${hMm}mm;
      padding: 2mm 2.5mm;
      background: #ffffff;
      color: #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .header {
      border-bottom: 1.5px solid #000000;
      padding-bottom: 0.8mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1;
    }
    .brand {
      font-size: ${fontSizeBrand}pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #000000;
    }
    .sin {
      font-size: ${(parseFloat(fontSizeBrand) * 0.75).toFixed(1)}pt;
      font-weight: bold;
      color: #334155;
    }
    .body {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      flex: 1;
      padding: 1mm 0;
      gap: 1.5mm;
      overflow: hidden;
    }
    .info {
      width: calc(100% - ${qrMm + 3}mm);
      display: flex;
      flex-direction: column;
      gap: 0.6mm;
      overflow: hidden;
    }
    .patrimonio {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSizePatrimonio}pt;
      font-weight: 900;
      line-height: 1;
      color: #000000;
      letter-spacing: 0.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .desc {
      font-size: ${fontSizeDesc}pt;
      font-weight: 800;
      line-height: 1.12;
      max-height: ${(6.5 * escala).toFixed(1)}mm;
      overflow: hidden;
      color: #000000;
    }
    .meta {
      font-size: ${fontSizeMeta}pt;
      line-height: 1.15;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta strong {
      color: #000000;
    }
    .qr-container {
      width: ${qrMm + 1.5}mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qr-frame {
      border: 1.5px solid #000000;
      padding: 0.6mm;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 1mm;
    }
    .qr-frame img {
      width: ${qrMm}mm;
      height: ${qrMm}mm;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: pixelated;
      display: block;
    }
    .footer {
      border-top: 1px dashed #000000;
      padding-top: 0.8mm;
      font-size: ${fontSizeFooter}pt;
      color: #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1;
    }
    .footer-loc {
      max-width: ${wMm - 18}mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="brand">TRACKSUB</span>
    <span class="sin">GESTÃO DE SUBESTAÇÕES</span>
  </div>

  <div class="body">
    <div class="info">
      <div class="patrimonio">${equipamento.codigoPatrimonial}</div>
      <div class="desc">${equipamento.descricao}</div>
      <div class="meta"><strong>Mod:</strong> ${equipamento.modelo || 'Padrão'}</div>
      <div class="meta"><strong>Fab:</strong> ${equipamento.fabricante || 'Homologado'}</div>
      <div class="meta"><strong>S/N:</strong> ${equipamento.numeroSerie || '-'}</div>
      <div class="meta"><strong>Status:</strong> ${equipamento.estadoOperacional}</div>
      ${equipamento.dataInstalacao ? `<div class="meta"><strong>Instalado:</strong> ${formatarData(equipamento.dataInstalacao)}</div>` : ''}
    </div>

    <div class="qr-container">
      <div class="qr-frame">
        <img src="${qrDataUrl}" alt="QR Code" />
      </div>
    </div>
  </div>

  <div class="footer">
    <span class="footer-loc">Loc: ${equipamento.localizacaoDescricao || 'Subestação Central'}</span>
    <span>${wMm}x${hMm}mm</span>
  </div>
</body>
</html>`;
}

/**
 * Dispara a impressão da etiqueta no navegador via iframe invisível (100% à prova de bloqueador de popups)
 */
export function imprimirEtiquetaViaIframe(
  equipamento: Equipamento,
  qrDataUrl: string,
  formato: FormatoEtiqueta = '60x40'
): void {
  const html = gerarHtmlEtiqueta(equipamento, qrDataUrl, formato);

  const idAntigo = 'tracksub-print-frame';
  const iframeExistente = document.getElementById(idAntigo);
  if (iframeExistente) {
    iframeExistente.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = idAntigo;
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Aguarda renderização da imagem do QR Code
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Fallback para window.print:', err);
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 4000);
    }
  }, 350);
}

/**
 * Converte a etiqueta para um arquivo PDF nativo em alta resolução (400 DPI) e efetua download
 */
export async function baixarPdfEtiqueta(
  equipamento: Equipamento,
  qrDataUrl: string,
  formato: FormatoEtiqueta = '60x40'
): Promise<void> {
  const config = FORMATOS_ETIQUETA.find((f) => f.id === formato) || FORMATOS_ETIQUETA[0];
  const dpi = 400; // Ultra alta definição para máxima nitidez térmica e laser

  // Resolução em pixels baseada no tamanho físico em milímetros
  const widthPx = Math.round((config.larguraMm / 25.4) * dpi);
  const heightPx = Math.round((config.alturaMm / 25.4) * dpi);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar o contexto gráfico 2D.');

  // Desativa interpolação de suavização para manter os blocos do QR Code 100% nítidos e retos
  ctx.imageSmoothingEnabled = false;

  // Fundo Branco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Borda guia de corte externa
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, widthPx - 20, heightPx - 20);

  const escala = widthPx / 945;

  // Cabeçalho
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.round(30 * escala)}px Arial, Helvetica, sans-serif`;
  ctx.fillText('TRACKSUB', Math.round(30 * escala), Math.round(52 * escala));

  ctx.fillStyle = '#334155';
  ctx.font = `bold ${Math.round(20 * escala)}px Arial, Helvetica, sans-serif`;
  ctx.fillText('GESTÃO E RASTREABILIDADE', Math.round(230 * escala), Math.round(52 * escala));

  // Linha divisória preta
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.round(3.5 * escala);
  ctx.beginPath();
  ctx.moveTo(Math.round(30 * escala), Math.round(68 * escala));
  ctx.lineTo(widthPx - Math.round(30 * escala), Math.round(68 * escala));
  ctx.stroke();

  // Dimensões do QR Code no Canvas (ampliado e proporcional ao formato)
  const qrSizePx = Math.round((config.qrMm / 25.4) * dpi);
  const qrX = widthPx - qrSizePx - Math.round(35 * escala);
  const qrY = Math.round(85 * escala);

  // Código Patrimonial em grande destaque
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(50 * escala)}px "Courier New", Courier, monospace`;
  ctx.fillText(equipamento.codigoPatrimonial, Math.round(30 * escala), Math.round(128 * escala));

  // Descrição do Equipamento
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.round(24 * escala)}px Arial, Helvetica, sans-serif`;
  const maxLarguraTexto = qrX - Math.round(50 * escala);
  const descLinhas = quebrarTexto(ctx, equipamento.descricao, maxLarguraTexto);
  let yPos = Math.round(168 * escala);
  descLinhas.slice(0, 2).forEach((l) => {
    ctx.fillText(l, Math.round(30 * escala), yPos);
    yPos += Math.round(28 * escala);
  });

  // Metadados técnicos com alto contraste
  ctx.font = `bold ${Math.round(21 * escala)}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = '#1e293b';

  yPos = Math.max(yPos + Math.round(10 * escala), Math.round(240 * escala));
  const espacamentoLinha = Math.round(32 * escala);

  ctx.fillText(`Mod: ${equipamento.modelo || 'Padrão'}`, Math.round(30 * escala), yPos);
  yPos += espacamentoLinha;
  ctx.fillText(`Fab: ${equipamento.fabricante || 'Homologado'}`, Math.round(30 * escala), yPos);
  yPos += espacamentoLinha;
  ctx.fillText(`S/N: ${equipamento.numeroSerie || '-'}`, Math.round(30 * escala), yPos);
  yPos += espacamentoLinha;
  ctx.fillText(`Status: ${equipamento.estadoOperacional}`, Math.round(30 * escala), yPos);
  yPos += espacamentoLinha;

  if (equipamento.dataInstalacao) {
    ctx.fillText(`Instalado: ${formatarData(equipamento.dataInstalacao)}`, Math.round(30 * escala), yPos);
  }

  // Linha inferior de separação
  const rodapeY = heightPx - Math.round(55 * escala);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = Math.round(2 * escala);
  ctx.setLineDash([Math.round(8 * escala), Math.round(5 * escala)]);
  ctx.beginPath();
  ctx.moveTo(Math.round(30 * escala), rodapeY);
  ctx.lineTo(widthPx - Math.round(30 * escala), rodapeY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rodapé com Localização e Formato
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.round(18 * escala)}px Arial, Helvetica, sans-serif`;
  const locTexto = `Loc: ${equipamento.localizacaoDescricao || 'Subestação Central'}`;
  ctx.fillText(locTexto.length > 55 ? locTexto.substring(0, 52) + '...' : locTexto, Math.round(30 * escala), heightPx - Math.round(22 * escala));

  ctx.fillStyle = '#475569';
  ctx.font = `bold ${Math.round(17 * escala)}px Arial, Helvetica, sans-serif`;
  ctx.fillText(`${config.larguraMm}x${config.alturaMm}mm`, widthPx - Math.round(125 * escala), heightPx - Math.round(22 * escala));

  // Desenha moldura e QR Code com máxima nitidez
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Moldura externa preta ao redor do QR Code
      const paddingFrame = Math.round(6 * escala);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - paddingFrame, qrY - paddingFrame, qrSizePx + paddingFrame * 2, qrSizePx + paddingFrame * 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.round(3 * escala);
      ctx.strokeRect(qrX - paddingFrame, qrY - paddingFrame, qrSizePx + paddingFrame * 2, qrSizePx + paddingFrame * 2);

      // Desenha o QR Code sem anti-aliasing borrado
      ctx.drawImage(img, qrX, qrY, qrSizePx, qrSizePx);
      resolve();
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem do QR Code no canvas.'));
    img.src = qrDataUrl;
  });

  // Converte o canvas para Blob JPEG de máxima qualidade
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Falha ao gerar blob de imagem do canvas.'));
      },
      'image/jpeg',
      0.98
    );
  });

  const jpegArrayBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(jpegArrayBuffer);

  // Dimensões em pontos PDF (72 pt / polegada, 1 pol = 25.4mm)
  const widthPt = (config.larguraMm / 25.4) * 72;
  const heightPt = (config.alturaMm / 25.4) * 72;

  const pdfBytes = compilarPdfUnicoObjetoJpeg(widthPt, heightPt, widthPx, heightPx, jpegBytes);
  const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  // Dispara o download automático do arquivo .pdf
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `etiqueta-${equipamento.codigoPatrimonial}-${config.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Gera o relatório impresso completo da Ficha Técnica do Equipamento em tamanho A4
 */
export function imprimirFichaTecnicaCompleta(
  equipamento: Equipamento,
  movimentacoes: Movimentacao[],
  qrDataUrl: string
): void {
  const movs = movimentacoes.filter((m) => m.equipamentoId === equipamento.id);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ficha Técnica - ${equipamento.codigoPatrimonial}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 10pt; line-height: 1.4; }
    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 4mm; margin-bottom: 5mm; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { font-size: 16pt; margin: 0; color: #1e3a8a; }
    .header p { font-size: 8.5pt; color: #475569; margin: 1mm 0 0; }
    .badge-pat { font-family: monospace; font-size: 12pt; font-weight: bold; background: #e0e7ff; color: #1e3a8a; padding: 2px 8px; border-radius: 4px; }
    .section-title { font-size: 11pt; font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 1.5mm; margin: 4mm 0 2.5mm; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-bottom: 4mm; }
    .field { padding: 2mm 3mm; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
    .field-label { font-size: 7.5pt; text-transform: uppercase; font-weight: bold; color: #64748b; }
    .field-value { font-size: 9.5pt; font-weight: 600; color: #0f172a; margin-top: 0.5mm; }
    .highlight { background: #eff6ff; border-color: #bfdbfe; }
    .qr-box { display: flex; align-items: center; gap: 4mm; padding: 3mm; background: #f1f5f9; border-radius: 6px; margin-bottom: 4mm; }
    .qr-box img { width: 28mm; height: 28mm; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 2mm; }
    th { background: #f1f5f9; text-align: left; padding: 2mm; font-weight: bold; border-bottom: 1.5px solid #cbd5e1; }
    td { padding: 2mm; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 8mm; padding-top: 3mm; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>TRACKSUB • Ficha Técnica do Ativo Elétrico</h1>
      <p>Sistema de Gestão, Controle Patrimonial e Rastreabilidade Indelével</p>
    </div>
    <div style="text-align: right;">
      <span class="badge-pat">${equipamento.codigoPatrimonial}</span>
      <p style="margin-top: 2mm;">Status: <strong>${equipamento.estadoOperacional}</strong></p>
    </div>
  </div>

  <div class="qr-box">
    <img src="${qrDataUrl}" alt="QR Code" />
    <div>
      <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">${equipamento.descricao}</div>
      <div style="font-size: 9pt; color: #334155; margin-top: 1mm;">
        <strong>Localização:</strong> ${equipamento.localizacaoDescricao}
      </div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 1mm;">
        Etiqueta QR Code escaneável com direcionamento automático em campo
      </div>
    </div>
  </div>

  <div class="section-title">Especificações e Dados Cadastrais</div>
  <div class="grid">
    <div class="field"><div class="field-label">Tipo</div><div class="field-value">${equipamento.tipo}</div></div>
    <div class="field"><div class="field-label">Fabricante</div><div class="field-value">${equipamento.fabricante}</div></div>
    <div class="field"><div class="field-label">Modelo</div><div class="field-value font-mono">${equipamento.modelo}</div></div>
    <div class="field"><div class="field-label">Nº de Série</div><div class="field-value font-mono">${equipamento.numeroSerie}</div></div>
    <div class="field"><div class="field-label">Conservação</div><div class="field-value">${equipamento.estadoConservacao}</div></div>
    <div class="field"><div class="field-label">Responsável</div><div class="field-value">${equipamento.responsavel}</div></div>
    <div class="field"><div class="field-label">Data de Instalação</div><div class="field-value">${equipamento.dataInstalacao ? formatarData(equipamento.dataInstalacao) : '-'}</div></div>
    <div class="field"><div class="field-label">Data de Retirada</div><div class="field-value">${equipamento.dataRetirada ? formatarData(equipamento.dataRetirada) : 'Em operação'}</div></div>
    <div class="field"><div class="field-label">Cadastrado em</div><div class="field-value">${formatarData(equipamento.criadoEm)}</div></div>
  </div>

  <div class="section-title">Histórico Indelével de Movimentações (${movs.length} Registros)</div>
  ${movs.length === 0 ? '<p style="color: #64748b; font-size: 9pt; font-style: italic;">Nenhuma movimentação registrada até o momento.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Data / Hora</th>
        <th>Operação</th>
        <th>Origem</th>
        <th>Destino</th>
        <th>Responsável</th>
        <th>Motivo / Justificativa</th>
      </tr>
    </thead>
    <tbody>
      ${movs.map((m) => {
        const origem = [m.origemSubestacaoNome, m.origemPainelNome, m.origemModuloNome].filter(Boolean).join(' / ') || 'Almoxarifado / Fábrica';
        const destino = [m.destinoSubestacaoNome, m.destinoPainelNome, m.destinoModuloNome, m.destinoAlmoxarifadoNome].filter(Boolean).join(' / ') || '-';
        const responsavel = m.usuarioNome || m.responsavelAutorizacao || 'Operador';
        return `
        <tr>
          <td style="white-space: nowrap; font-family: monospace;">${formatarDataHora(m.dataHora)}</td>
          <td><strong>${m.tipoOperacao}</strong></td>
          <td>${origem}</td>
          <td>${destino}</td>
          <td>${responsavel}</td>
          <td>${m.motivo || '-'}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  `}

  <div class="footer">
    <span>Documento gerado pelo TRACKSUB em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
    <span>Página 1 de 1</span>
  </div>
</body>
</html>`;

  const idAntigo = 'tracksub-print-frame-ficha';
  const iframeExistente = document.getElementById(idAntigo);
  if (iframeExistente) iframeExistente.remove();

  const iframe = document.createElement('iframe');
  iframe.id = idAntigo;
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Erro ao imprimir ficha:', err);
      window.print();
    } finally {
      setTimeout(() => iframe.remove(), 4000);
    }
  }, 350);
}

/**
 * Constrói a estrutura binária em conformidade com a especificação PDF 1.4
 */
function compilarPdfUnicoObjetoJpeg(
  widthPt: number,
  heightPt: number,
  imgWidthPx: number,
  imgHeightPx: number,
  jpegBytes: Uint8Array
): Uint8Array {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];

  const encoder = new TextEncoder();
  function addString(str: string) {
    chunks.push(encoder.encode(str));
  }

  function addBytes(bytes: Uint8Array) {
    chunks.push(bytes);
  }

  function getCurrentOffset(): number {
    return chunks.reduce((acc, c) => acc + c.length, 0);
  }

  // Header PDF 1.4
  addString('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  function startObj(num: number) {
    offsets[num] = getCurrentOffset();
    addString(`${num} 0 obj\n`);
  }
  function endObj() {
    addString('endobj\n');
  }

  // 1: Catalog
  startObj(1);
  addString('<< /Type /Catalog /Pages 2 0 R >>\n');
  endObj();

  // 2: Pages
  startObj(2);
  addString('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
  endObj();

  // 3: Page (Tamanho 60mm x 40mm)
  startObj(3);
  addString(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt.toFixed(2)} ${heightPt.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\n`
  );
  endObj();

  // 4: Content Stream
  const content = `q ${widthPt.toFixed(2)} 0 0 ${heightPt.toFixed(2)} 0 0 cm /Im1 Do Q\n`;
  startObj(4);
  addString(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`);
  endObj();

  // 5: XObject Image JPEG
  startObj(5);
  addString(
    `<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${heightPt > 0 ? imgHeightPx : 400} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  addBytes(jpegBytes);
  addString('\nendstream\n');
  endObj();

  // xref table
  const xrefOffset = getCurrentOffset();
  addString('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    addString(`${offStr} 00000 n \n`);
  }

  // trailer
  addString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  // Junta todos os pedaços em um único Uint8Array
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

/**
 * Função utilitária para quebrar texto em linhas no canvas
 */
function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, maxLargura: number): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let linhaAtual = '';

  for (const palavra of palavras) {
    const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    const largura = ctx.measureText(teste).width;
    if (largura > maxLargura && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = teste;
    }
  }
  if (linhaAtual) {
    linhas.push(linhaAtual);
  }
  return linhas;
}
