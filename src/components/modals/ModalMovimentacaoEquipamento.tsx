import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  Grid3X3,
  Warehouse,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';
import {
  Equipamento,
  Subestacao,
  Painel,
  Modulo,
  Almoxarifado,
  OrdemServico,
  TipoOperacaoMovimentacao,
  EstadoConservacao,
} from '../../types/tracksub.ts';

interface ModalMovimentacaoEquipamentoProps {
  equipamento: Equipamento | null;
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (payload: {
    equipamentoId: string;
    tipoOperacao: TipoOperacaoMovimentacao;
    destinoSubestacaoId?: string;
    destinoPainelId?: string;
    destinoModuloId?: string;
    destinoAlmoxarifadoId?: string;
    motivo: string;
    ordemServicoId?: string;
    responsavelAutorizacao?: string;
    observacoes?: string;
    novoEstadoConservacao?: EstadoConservacao;
  }) => Promise<void>;
  subestacoes: Subestacao[];
  paineis: Painel[];
  modulos: Modulo[];
  almoxarifados: Almoxarifado[];
  ordensServico: OrdemServico[];
  operacaoPadrao?: TipoOperacaoMovimentacao;
}

export const ModalMovimentacaoEquipamento: React.FC<ModalMovimentacaoEquipamentoProps> = ({
  equipamento,
  aberto,
  onFechar,
  onConfirmar,
  subestacoes,
  paineis,
  modulos,
  almoxarifados,
  ordensServico,
  operacaoPadrao = 'Instalação',
}) => {
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacaoMovimentacao>(operacaoPadrao);
  const [destinoSubestacaoId, setDestinoSubestacaoId] = useState<string>('');
  const [destinoPainelId, setDestinoPainelId] = useState<string>('');
  const [destinoModuloId, setDestinoModuloId] = useState<string>('');
  const [destinoAlmoxarifadoId, setDestinoAlmoxarifadoId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [ordemServicoId, setOrdemServicoId] = useState<string>('');
  const [responsavelAutorizacao, setResponsavelAutorizacao] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [novoEstadoConservacao, setNovoEstadoConservacao] = useState<EstadoConservacao>('Bom');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto && equipamento) {
      setTipoOperacao(operacaoPadrao);
      setDestinoSubestacaoId(equipamento.subestacaoId || subestacoes[0]?.id || '');
      setDestinoPainelId(equipamento.painelId || '');
      setDestinoModuloId(equipamento.moduloId || '');
      setDestinoAlmoxarifadoId(equipamento.almoxarifadoId || almoxarifados[0]?.id || '');
      setNovoEstadoConservacao(equipamento.estadoConservacao);
      setMotivo('');
      setObservacoes('');
      setErro(null);
    }
  }, [aberto, equipamento, operacaoPadrao]);

  if (!aberto || !equipamento) return null;

  // Filtrar painéis pela subestação de destino selecionada
  const paineisFiltrados = paineis.filter((p) => p.subestacaoId === destinoSubestacaoId);
  // Filtrar módulos pelo painel selecionado
  const modulosFiltrados = modulos.filter((m) => m.painelId === destinoPainelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!motivo.trim()) {
      setErro('Preencha os campos obrigatórios: informe o motivo da operação.');
      return;
    }

    if (
      (tipoOperacao === 'Instalação' || tipoOperacao === 'Transferência de Painel' || tipoOperacao === 'Transferência de Subestação') &&
      !destinoSubestacaoId
    ) {
      setErro('Selecione a subestação de destino para a instalação/transferência.');
      return;
    }

    try {
      setSalvando(true);

      // Verifica se o destinoModuloId corresponde a algum painel já cadastrado
      const painelCorrespondente = paineis.find(
        (p) =>
          (!destinoSubestacaoId || p.subestacaoId === destinoSubestacaoId) &&
          p.identificacao.trim().toLowerCase() === destinoModuloId.trim().toLowerCase()
      );

      await onConfirmar({
        equipamentoId: equipamento.id,
        tipoOperacao,
        destinoSubestacaoId: destinoSubestacaoId || undefined,
        destinoPainelId: painelCorrespondente ? painelCorrespondente.id : undefined,
        destinoModuloId: destinoModuloId.trim() || undefined,
        destinoAlmoxarifadoId: destinoAlmoxarifadoId || undefined,
        motivo,
        ordemServicoId: ordemServicoId || undefined,
        responsavelAutorizacao: responsavelAutorizacao || undefined,
        observacoes,
        novoEstadoConservacao,
      });
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Ocorreu um erro ao registrar a movimentação.');
    } finally {
      setSalvando(false);
    }
  };

  const requerDestinoSubestacao =
    tipoOperacao === 'Instalação' ||
    tipoOperacao === 'Transferência de Painel' ||
    tipoOperacao === 'Transferência de Subestação';

  const requerDestinoAlmoxarifado =
    tipoOperacao === 'Retirada' ||
    tipoOperacao === 'Envio para Manutenção' ||
    tipoOperacao === 'Envio para Ensaios' ||
    tipoOperacao === 'Retorno ao Almoxarifado' ||
    tipoOperacao === 'Entrada de Estoque';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base">Registrar Movimentação de Equipamento</h3>
              <p className="text-xs text-slate-400">
                {equipamento.codigoPatrimonial} • {equipamento.descricao}
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Localização Atual do Equipamento */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Localização e Situação Atual
            </span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {equipamento.localizacaoDescricao}
            </div>
            <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-600">
              <span>
                Estado Operacional: <strong>{equipamento.estadoOperacional}</strong>
              </span>
              <span>•</span>
              <span>
                Conservação: <strong>{equipamento.estadoConservacao}</strong>
              </span>
            </div>
          </div>

          {/* Tipo de Operação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Movimentação *
            </label>
            <select
              value={tipoOperacao}
              onChange={(e) => setTipoOperacao(e.target.value as TipoOperacaoMovimentacao)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="Instalação">Instalação em Painel / Subestação</option>
              <option value="Retirada">Retirada de Operação</option>
              <option value="Transferência de Painel">Transferência entre Painéis da mesma SE</option>
              <option value="Transferência de Subestação">Transferência entre Subestações</option>
              <option value="Envio para Manutenção">Envio para Oficina / Manutenção</option>
              <option value="Envio para Ensaios">Envio para Laboratório de Ensaios / Calibração</option>
              <option value="Retorno ao Almoxarifado">Retorno ao Almoxarifado (Sobressalente)</option>
              <option value="Baixa Patrimonial">Baixa Patrimonial Autorizada (Descarte/Sucata)</option>
            </select>
          </div>

          {/* Destino em Subestação / Painel / Módulo */}
          {requerDestinoSubestacao && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3.5">
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Destino da Instalação / Transferência</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subestação de Destino *
                  </label>
                  <select
                    value={destinoSubestacaoId}
                    onChange={(e) => {
                      setDestinoSubestacaoId(e.target.value);
                      setDestinoPainelId('');
                      setDestinoModuloId('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                    required
                  >
                    <option value="">Selecione a Subestação</option>
                    {subestacoes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.tensaoPrimaria})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Painel / Módulo de Destino
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                      Editável
                    </span>
                  </div>
                  <input
                    type="text"
                    list="lista-painel-modulos-mov"
                    value={destinoModuloId}
                    onChange={(e) => setDestinoModuloId(e.target.value)}
                    placeholder="Digite ou selecione o Painel / Módulo de destino..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  <datalist id="lista-painel-modulos-mov">
                    {paineis
                      .filter((p) => !destinoSubestacaoId || p.subestacaoId === destinoSubestacaoId)
                      .map((p) => (
                        <option key={p.id} value={p.identificacao}>
                          {p.funcao ? `Painel: ${p.funcao}` : 'Painel Cadastrado'}
                        </option>
                      ))}
                    {modulos
                      .filter((m) => !destinoSubestacaoId || m.subestacaoId === destinoSubestacaoId)
                      .map((m) => (
                        <option key={m.id} value={m.identificacao}>
                          {m.posicao ? `Posição: ${m.posicao}` : 'Módulo Cadastrado'}
                        </option>
                      ))}
                    <option value="Painel 01 - Proteção Principal Linha (21/87L)" />
                    <option value="Painel 02 - Proteção Diferencial Barra (87B)" />
                    <option value="Painel 03 - Bastidor Telecom &amp; Switches IEC 61850" />
                    <option value="Painel 04 - Medição &amp; Faturamento" />
                    <option value="Painel 05 - Serviços Auxiliares CC (125Vcc)" />
                    <option value="Vão 01 - Linha de Transmissão 230kV" />
                    <option value="Vão 02 - Transformador de Força 230/138kV" />
                    <option value="Vão 03 - Barramento e Seccionamento" />
                    <option value="Cubículo Metal-Clad 13.8kV" />
                    <option value="Gaveta 01 (Superior)" />
                    <option value="Gaveta 02" />
                    <option value="Rack 19&quot; - Unidade U01 a U04" />
                  </datalist>
                </div>
              </div>
            </div>
          )}

          {/* Destino em Almoxarifado / Oficina */}
          {requerDestinoAlmoxarifado && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
              <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Warehouse className="w-4 h-4 text-emerald-600" />
                <span>Almoxarifado ou Local de Destino</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Almoxarifado / Laboratório *
                </label>
                <select
                  value={destinoAlmoxarifadoId}
                  onChange={(e) => setDestinoAlmoxarifadoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Selecione o Almoxarifado</option>
                  {almoxarifados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.tipo})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Ordem de Serviço Vinculada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                <span>Vincular Ordem de Serviço (Opcional)</span>
              </label>
              <select
                value={ordemServicoId}
                onChange={(e) => setOrdemServicoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem Ordem de Serviço associada</option>
                {ordensServico.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.numero} - {os.titulo} ({os.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de Conservação Após Operação
              </label>
              <select
                value={novoEstadoConservacao}
                onChange={(e) => setNovoEstadoConservacao(e.target.value as EstadoConservacao)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Novo">Novo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Necessita Reparo">Necessita Reparo</option>
                <option value="Danificado">Danificado</option>
              </select>
            </div>
          </div>

          {/* Motivo e Responsável */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo da Operação *
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Comissionamento de novo vão de linha 230kV ou falha no canal de corrente..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável pela Autorização (Engenheiro/Gestor)
              </label>
              <input
                type="text"
                value={responsavelAutorizacao}
                onChange={(e) => setResponsavelAutorizacao(e.target.value)}
                placeholder="Ex: Eng. Anderson Tavares - CREA/RS..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Técnicas Complementares
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                placeholder="Detalhes de cabos, parametrização, ajustes ou advertências de segurança..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Esta operação será registrada no histórico imutável do equipamento e na trilha de auditoria do sistema.
            </span>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-1.5"
            >
              {salvando ? (
                <span>Gravando no Banco...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Movimentação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
