import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Cpu,
  MapPin,
  Calendar,
  Clock,
  Printer,
  ArrowRightLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Send,
  Building2,
  Grid3X3,
  Warehouse,
  History,
  QrCode as QrIcon,
  Trash2,
} from 'lucide-react';
import { Equipamento, Movimentacao, Usuario } from '../../types/tracksub.ts';
import { formatarData, formatarDataHora, getEquipamentoQrUrl } from '../../utils/formatters.ts';

interface ModalFichaEquipamentoProps {
  equipamento: Equipamento | null;
  movimentacoes: Movimentacao[];
  aberto: boolean;
  onFechar: () => void;
  onAbrirEtiqueta: (eqp: Equipamento) => void;
  onAbrirMovimentacao: (eqp: Equipamento, operacaoPadrao: Movimentacao['tipoOperacao']) => void;
  usuarioAtual: Usuario | null;
  onExcluir?: (id: string) => Promise<void>;
}

export const ModalFichaEquipamento: React.FC<ModalFichaEquipamentoProps> = ({
  equipamento,
  movimentacoes,
  aberto,
  onFechar,
  onAbrirEtiqueta,
  onAbrirMovimentacao,
  usuarioAtual,
  onExcluir,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (equipamento) {
      const qrAlvo = getEquipamentoQrUrl(equipamento);
      QRCode.toDataURL(qrAlvo, { width: 180, margin: 1 }, (err, url) => {
        if (!err && url) setQrUrl(url);
      });
    }
  }, [equipamento]);

  if (!aberto || !equipamento) return null;

  const movsEquipamento = movimentacoes.filter((m) => m.equipamentoId === equipamento.id);

  const getStatusBadge = (status: Equipamento['estadoOperacional']) => {
    switch (status) {
      case 'Em Operação':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Sobressalente / Estoque':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Em Manutenção':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Em Ensaio':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Retirado':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'Baixado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const podeMovimentar = usuarioAtual?.perfil !== 'consulta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                  {equipamento.codigoPatrimonial}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(equipamento.estadoOperacional)}`}>
                  {equipamento.estadoOperacional}
                </span>
              </div>
              <h2 className="font-bold text-lg text-white mt-0.5 leading-snug">
                {equipamento.descricao}
              </h2>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Cartão de Resumo e QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="md:col-span-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Tipo</span>
                  <span className="font-semibold text-slate-800">{equipamento.tipo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Fabricante</span>
                  <span className="font-semibold text-slate-800">{equipamento.fabricante}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Modelo</span>
                  <span className="font-semibold text-slate-800 font-mono">{equipamento.modelo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Número de Série</span>
                  <span className="font-semibold text-slate-800 font-mono">{equipamento.numeroSerie}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Conservação</span>
                  <span className="font-semibold text-slate-800">{equipamento.estadoConservacao}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Responsável</span>
                  <span className="font-semibold text-slate-800">{equipamento.responsavel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Data da Retirada</span>
                  <span className="font-semibold text-slate-800">
                    {equipamento.dataRetirada
                      ? formatarData(equipamento.dataRetirada)
                      : 'Não informada / Em serviço'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Data de Instalação</span>
                  <span className="font-semibold text-slate-800">
                    {equipamento.dataInstalacao
                      ? formatarData(equipamento.dataInstalacao)
                      : (equipamento.dataAquisicao ? formatarData(equipamento.dataAquisicao) : 'Não informada')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Cadastro</span>
                  <span className="font-semibold text-slate-800">{formatarData(equipamento.criadoEm)}</span>
                </div>
              </div>

              {/* Localização Atual em destaque */}
              <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-lg flex items-start space-x-2 text-xs text-blue-950">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block">
                    Localização Atual Confirmada
                  </span>
                  <span className="font-semibold text-blue-900">{equipamento.localizacaoDescricao}</span>
                </div>
              </div>
            </div>

            {/* Imagem do QR Code e Ações */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200 text-center">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-24 h-24 object-contain" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 rounded flex items-center justify-center">
                  <QrIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="font-mono text-[10px] text-blue-700 font-bold mt-1 truncate max-w-[130px]" title={equipamento.codigoPatrimonial}>
                {equipamento.codigoPatrimonial}
              </div>
              <button
                onClick={() => onAbrirEtiqueta(equipamento)}
                className="mt-2 w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium flex items-center justify-center space-x-1 transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>

          {/* Barra de Ações Rápidas de Movimentação */}
          {podeMovimentar && (
            <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                Ações Operacionais de Movimentação
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Instalação')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instalar em Painel</span>
                </button>
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Retirada')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Retirar de Operação</span>
                </button>
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Transferência de Painel')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Transferir</span>
                </button>
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Envio para Manutenção')}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Enviar Manutenção</span>
                </button>
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Envio para Ensaios')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para Ensaios</span>
                </button>
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Retorno ao Almoxarifado')}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Retorno ao Estoque</span>
                </button>
                <button
                  onClick={() => onAbrirMovimentacao(equipamento, 'Baixa Patrimonial')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition flex items-center space-x-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Baixa Patrimonial</span>
                </button>
              </div>
            </div>
          )}

          {/* Histórico e Linha do Tempo Cronológica */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                Linha do Tempo de Rastreabilidade ({movsEquipamento.length} eventos registrados)
              </h3>
            </div>

            {movsEquipamento.length === 0 ? (
              <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-center text-xs">
                Nenhuma movimentação registrada no histórico até o momento.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
                {movsEquipamento.map((mov, idx) => (
                  <div key={mov.id} className="relative group">
                    {/* Marcador no trilho */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex items-center justify-center" />

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">
                            {mov.tipoOperacao}
                          </span>
                          {mov.ordemServicoNumero && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {mov.ordemServicoNumero}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatarDataHora(mov.dataHora)}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 text-xs text-slate-700 space-y-1.5">
                        <p className="font-medium text-slate-800">
                          <strong>Motivo:</strong> {mov.motivo}
                        </p>

                        {(mov.origemSubestacaoNome || mov.destinoSubestacaoNome || mov.destinoAlmoxarifadoNome) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 rounded text-[11px] text-slate-600 mt-2">
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Origem:
                              </span>
                              <span>
                                {mov.origemSubestacaoNome || 'Depósito / Almoxarifado'}
                                {mov.origemPainelNome ? ` / ${mov.origemPainelNome}` : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Destino:
                              </span>
                              <span className="font-semibold text-slate-800">
                                {mov.destinoSubestacaoNome || mov.destinoAlmoxarifadoNome || 'Oficina / Destinação'}
                                {mov.destinoPainelNome ? ` / ${mov.destinoPainelNome}` : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                          <span>
                            Executado por: <strong>{mov.usuarioNome}</strong> ({mov.usuarioPerfil})
                          </span>
                          {mov.responsavelAutorizacao && (
                            <span>
                              Autorizado por: <strong>{mov.responsavelAutorizacao}</strong>
                            </span>
                          )}
                        </div>

                        {mov.observacoes && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                            "{mov.observacoes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-t border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-mono">
              ID: {equipamento.id}
            </span>
            {onExcluir && (
              <button
                onClick={async () => {
                  if (confirm(`Deseja realmente excluir o equipamento patrimônio ${equipamento.codigoPatrimonial} (${equipamento.descricao})?`)) {
                    await onExcluir(equipamento.id);
                    onFechar();
                  }
                }}
                className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Equipamento</span>
              </button>
            )}
          </div>
          <button
            onClick={onFechar}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
