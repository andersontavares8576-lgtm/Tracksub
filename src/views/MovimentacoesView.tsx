import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Clock,
  Building2,
  Warehouse,
  ClipboardList,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Movimentacao, Equipamento, TipoOperacaoMovimentacao } from '../types/tracksub.ts';
import { formatarDataHora } from '../utils/formatters.ts';

interface MovimentacoesViewProps {
  movimentacoes: Movimentacao[];
  onConsultarFichaEquipamento: (equipamentoId: string) => void;
  onNovaMovimentacao: () => void;
}

export const MovimentacoesView: React.FC<MovimentacoesViewProps> = ({
  movimentacoes,
  onConsultarFichaEquipamento,
  onNovaMovimentacao,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const movimentacoesFiltradas = movimentacoes.filter((m) => {
    if (busca.trim()) {
      const t = busca.toLowerCase();
      const bateu =
        m.equipamentoPatrimonio.toLowerCase().includes(t) ||
        m.equipamentoDescricao.toLowerCase().includes(t) ||
        m.usuarioNome.toLowerCase().includes(t) ||
        m.motivo.toLowerCase().includes(t) ||
        (m.ordemServicoNumero && m.ordemServicoNumero.toLowerCase().includes(t));
      if (!bateu) return false;
    }
    if (filtroTipo !== 'todos' && m.tipoOperacao !== filtroTipo) return false;
    return true;
  });

  const getBadgeOperacao = (tipo: TipoOperacaoMovimentacao) => {
    switch (tipo) {
      case 'Instalação':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Retirada':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Transferência de Painel':
      case 'Transferência de Subestação':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Envio para Manutenção':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Envio para Ensaios':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Retorno ao Almoxarifado':
      case 'Entrada de Estoque':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Baixa Patrimonial':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rastreabilidade e Movimentações</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {movimentacoesFiltradas.length} Registros Auditados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Histórico imutável de instalações, transferências, retiradas, manutenções e ensaios
          </p>
        </div>

        <button
          onClick={onNovaMovimentacao}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Registrar Movimentação</span>
        </button>
      </div>

      {/* Barra de Pesquisa e Filtro de Tipo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por patrimônio, equipamento, técnico, motivo ou número de OS..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Tipos de Operação</option>
            <option value="Instalação">Instalação</option>
            <option value="Retirada">Retirada</option>
            <option value="Transferência de Painel">Transferência de Painel</option>
            <option value="Transferência de Subestação">Transferência de Subestação</option>
            <option value="Envio para Manutenção">Envio para Manutenção</option>
            <option value="Envio para Ensaios">Envio para Ensaios</option>
            <option value="Retorno ao Almoxarifado">Retorno ao Almoxarifado</option>
            <option value="Entrada de Estoque">Entrada de Estoque</option>
            <option value="Baixa Patrimonial">Baixa Patrimonial</option>
          </select>
        </div>
      </div>

      {/* Lista Cronológica de Movimentações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {movimentacoesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhuma movimentação localizada com os filtros selecionados.
            </div>
          ) : (
            movimentacoesFiltradas.map((mov) => (
              <div key={mov.id} className="p-4 hover:bg-slate-50/70 transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {mov.equipamentoPatrimonio}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getBadgeOperacao(mov.tipoOperacao)}`}>
                      {mov.tipoOperacao}
                    </span>
                    {mov.ordemServicoNumero && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {mov.ordemServicoNumero}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatarDataHora(mov.dataHora)}</span>
                    </span>
                    <button
                      onClick={() => onConsultarFichaEquipamento(mov.equipamentoId)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-800">
                  {mov.equipamentoDescricao}
                </div>

                {/* Bloco de Origem e Destino */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Origem:
                    </span>
                    <span>
                      {mov.origemSubestacaoNome || 'Almoxarifado / Recebimento'}
                      {mov.origemPainelNome ? ` • ${mov.origemPainelNome}` : ''}
                      {mov.origemModuloNome ? ` (${mov.origemModuloNome})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Destino:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {mov.destinoSubestacaoNome || mov.destinoAlmoxarifadoNome || 'Oficina / Destinação Final'}
                      {mov.destinoPainelNome ? ` • ${mov.destinoPainelNome}` : ''}
                      {mov.destinoModuloNome ? ` (${mov.destinoModuloNome})` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500">
                  <div>
                    <strong>Motivo:</strong> {mov.motivo}
                  </div>
                  <div className="shrink-0 text-slate-400">
                    Operador: <span className="font-medium text-slate-700">{mov.usuarioNome}</span> ({mov.usuarioPerfil})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
