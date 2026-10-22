import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Cpu,
  Boxes,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { OrdemServico, Subestacao, Material, Equipamento, StatusOS, PrioridadeOS } from '../types/tracksub.ts';
import { formatarData } from '../utils/formatters.ts';

interface OrdensServicoViewProps {
  ordens: OrdemServico[];
  subestacoes: Subestacao[];
  materiais: Material[];
  onNovaOrdem: () => void;
  onEditarOrdem: (os: OrdemServico) => void;
  onConsumirMaterial: (osId: string, materialId: string, quantidade: number) => Promise<void>;
}

export const OrdensServicoView: React.FC<OrdensServicoViewProps> = ({
  ordens,
  subestacoes,
  materiais,
  onNovaOrdem,
  onEditarOrdem,
  onConsumirMaterial,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [osExpandidaId, setOsExpandidaId] = useState<string | null>(null);
  const [baixandoMaterial, setBaixandoMaterial] = useState<string | null>(null);

  const ordensFiltradas = ordens.filter((o) => {
    if (busca.trim()) {
      const t = busca.toLowerCase();
      const bateu =
        o.numero.toLowerCase().includes(t) ||
        o.titulo.toLowerCase().includes(t) ||
        o.descricaoServico.toLowerCase().includes(t) ||
        o.responsavelNome.toLowerCase().includes(t) ||
        o.subestacaoNome.toLowerCase().includes(t);
      if (!bateu) return false;
    }
    if (filtroStatus !== 'todos' && o.status !== filtroStatus) return false;
    if (filtroPrioridade !== 'todas' && o.prioridade !== filtroPrioridade) return false;
    return true;
  });

  const getStatusBadge = (status: StatusOS) => {
    switch (status) {
      case 'Aberta':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Aguardando Peças':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Concluída':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPrioridadeBadge = (prioridade: PrioridadeOS) => {
    switch (prioridade) {
      case 'Emergencial':
        return 'bg-red-600 text-white font-bold';
      case 'Alta':
        return 'bg-orange-500 text-white font-semibold';
      case 'Média':
        return 'bg-blue-600 text-white font-semibold';
      case 'Baixa':
        return 'bg-slate-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const handleConfirmarConsumo = async (osId: string, materialId: string, quantidade: number) => {
    try {
      setBaixandoMaterial(`${osId}-${materialId}`);
      await onConsumirMaterial(osId, materialId, quantidade);
    } catch (err: any) {
      alert(err.message || 'Erro ao efetivar consumo do material no estoque.');
    } finally {
      setBaixandoMaterial(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ordens de Serviço e Manutenção</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {ordensFiltradas.length} Registradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Programação de serviços, controle de equipes, reserva e consumo real de materiais com baixa em estoque
          </p>
        </div>

        <button
          onClick={onNovaOrdem}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Abrir Ordem de Serviço</span>
        </button>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por número de OS, título, subestação ou responsável..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-80">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="Aberta">Aberta</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Aguardando Peças">Aguardando Peças</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas Prioridades</option>
            <option value="Emergencial">Emergencial</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Lista de Ordens de Serviço */}
      <div className="space-y-3">
        {ordensFiltradas.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-500 text-xs rounded-2xl border border-slate-200">
            Nenhuma ordem de serviço localizada com os filtros selecionados.
          </div>
        ) : (
          ordensFiltradas.map((os) => {
            const expandida = osExpandidaId === os.id;

            return (
              <div
                key={os.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Linha Principal da OS */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {os.numero}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusBadge(os.status)}`}>
                        {os.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${getPrioridadeBadge(os.prioridade)}`}>
                        {os.prioridade}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {os.tipoManutencao}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {os.titulo}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center space-x-1 font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{os.subestacaoNome}</span>
                        {os.painelNome && <span>• {os.painelNome}</span>}
                      </span>
                      <span>•</span>
                      <span>Resp: <strong>{os.responsavelNome}</strong></span>
                      <span>•</span>
                      <span>Prazo: {formatarData(os.prazoLimite)}</span>
                    </div>
                  </div>

                  {/* Ações e Botão Expandir */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onEditarOrdem(os)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Editar OS
                    </button>
                    <button
                      onClick={() => setOsExpandidaId(expandida ? null : os.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <span>{expandida ? 'Recolher' : 'Materiais e Detalhes'}</span>
                      {expandida ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Área Expandida com Detalhes e Baixa de Materiais */}
                {expandida && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-4 animate-in fade-in duration-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Descrição do Escopo e Procedimento
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                        {os.descricaoServico}
                      </p>
                    </div>

                    {/* Tabela de Materiais Requisitados e Consumo */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                          <Boxes className="w-4 h-4 text-blue-600" />
                          <span>Materiais Requisitados e Baixa em Estoque</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {(os.materiaisRequisitados || []).length} materiais associados
                        </span>
                      </div>

                      {(os.materiaisRequisitados || []).length === 0 ? (
                        <div className="p-3 bg-white text-center text-slate-400 text-xs rounded-xl border border-slate-200">
                          Nenhum material adicional foi requisitado nesta ordem de serviço.
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                          {(os.materiaisRequisitados || []).map((item) => (
                            <div
                              key={item.materialId}
                              className="p-3 flex items-center justify-between text-xs gap-3"
                            >
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {item.descricao}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Requisitado: <strong>{item.quantidade} {item.unidade}</strong>
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    item.consumido
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {item.consumido ? 'Baixado no Estoque' : 'Reservado'}
                                </span>

                                {!item.consumido && os.status !== 'Cancelada' && (
                                  <button
                                    onClick={() => handleConfirmarConsumo(os.id, item.materialId, item.quantidade)}
                                    disabled={baixandoMaterial === `${os.id}-${item.materialId}`}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition flex items-center space-x-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>
                                      {baixandoMaterial === `${os.id}-${item.materialId}`
                                        ? 'Baixando...'
                                        : 'Confirmar Consumo'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Equipamentos Movimentados nesta OS */}
                    {os.equipamentosMovimentados.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                          Equipamentos Movimentados nesta OS
                        </span>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                          {os.equipamentosMovimentados.map((em) => (
                            <div key={em.equipamentoId} className="flex items-center justify-between">
                              <span className="font-mono font-semibold text-slate-900">
                                {em.patrimonio} - {em.descricao}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {em.acao}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
