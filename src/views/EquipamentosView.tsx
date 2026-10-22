import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Search,
  Filter,
  Plus,
  Printer,
  ArrowRightLeft,
  Eye,
  Edit2,
  Building2,
  QrCode,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Zap,
  Download,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import {
  Equipamento,
  Subestacao,
  TipoEquipamento,
  EstadoOperacional,
  EstadoConservacao,
  CATEGORIAS_EQUIPAMENTOS,
} from '../types/tracksub.ts';
import { formatarData } from '../utils/formatters.ts';

interface EquipamentosViewProps {
  equipamentos: Equipamento[];
  subestacoes: Subestacao[];
  onAbrirFicha: (eqp: Equipamento) => void;
  onAbrirEtiqueta: (eqp: Equipamento) => void;
  onAbrirMovimentacao: (eqp: Equipamento, operacaoPadrao: any) => void;
  onEditarEquipamento: (eqp: Equipamento) => void;
  onNovoEquipamento: () => void;
  onAbrirImportacaoMassiva?: () => void;
  onExcluirEquipamento?: (id: string) => Promise<void>;
  onExcluirEquipamentosLote?: (ids: string[]) => Promise<void>;
}

export const EquipamentosView: React.FC<EquipamentosViewProps> = ({
  equipamentos,
  subestacoes,
  onAbrirFicha,
  onAbrirEtiqueta,
  onAbrirMovimentacao,
  onEditarEquipamento,
  onNovoEquipamento,
  onAbrirImportacaoMassiva,
  onExcluirEquipamento,
  onExcluirEquipamentosLote,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroSubestacao, setFiltroSubestacao] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroConservacao, setFiltroConservacao] = useState('todos');

  // Estados de Paginação de Alta Performance para 3.000+ Itens
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [itensPorPagina, setItensPorPagina] = useState<number | 'todos'>(50);

  // Seleção em Lote
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());

  const getCategoriaDoTipo = (tipo: TipoEquipamento) => {
    return CATEGORIAS_EQUIPAMENTOS.find((c) => c.tipos.includes(tipo));
  };

  // Filtragem otimizada em memória
  const equipamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return equipamentos.filter((e) => {
      if (termo) {
        const bateu =
          e.codigoPatrimonial.toLowerCase().includes(termo) ||
          e.descricao.toLowerCase().includes(termo) ||
          e.numeroSerie.toLowerCase().includes(termo) ||
          e.fabricante.toLowerCase().includes(termo) ||
          e.modelo.toLowerCase().includes(termo) ||
          e.localizacaoDescricao.toLowerCase().includes(termo);
        if (!bateu) return false;
      }
      if (filtroSubestacao !== 'todas' && e.subestacaoId !== filtroSubestacao) return false;
      if (filtroCategoria !== 'todas') {
        const cat = CATEGORIAS_EQUIPAMENTOS.find((c) => c.nome === filtroCategoria);
        if (cat && !cat.tipos.includes(e.tipo)) return false;
      }
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false;
      if (filtroStatus !== 'todos' && e.estadoOperacional !== filtroStatus) return false;
      if (filtroConservacao !== 'todos' && e.estadoConservacao !== filtroConservacao) return false;
      return true;
    });
  }, [
    equipamentos,
    busca,
    filtroSubestacao,
    filtroCategoria,
    filtroTipo,
    filtroStatus,
    filtroConservacao,
  ]);

  // Cálculos de Paginação
  const totalItens = equipamentosFiltrados.length;
  const pageSize = itensPorPagina === 'todos' ? totalItens || 1 : itensPorPagina;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / pageSize));
  const paginaAjustada = Math.min(paginaAtual, totalPaginas);

  const inicioIdx = (paginaAjustada - 1) * (itensPorPagina === 'todos' ? totalItens : itensPorPagina);
  const fimIdx = itensPorPagina === 'todos' ? totalItens : Math.min(inicioIdx + (itensPorPagina as number), totalItens);

  const equipamentosPaginados = useMemo(() => {
    if (itensPorPagina === 'todos') return equipamentosFiltrados;
    return equipamentosFiltrados.slice(inicioIdx, fimIdx);
  }, [equipamentosFiltrados, inicioIdx, fimIdx, itensPorPagina]);

  // Resetar página ao mudar filtros
  const handleFiltroChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPaginaAtual(1);
  };

  // Seleção em lote
  const handleSelecionarTodosPagina = () => {
    const novos = new Set(itensSelecionados);
    const todosJaSelecionados = equipamentosPaginados.every((e) => novos.has(e.id));
    if (todosJaSelecionados) {
      equipamentosPaginados.forEach((e) => novos.delete(e.id));
    } else {
      equipamentosPaginados.forEach((e) => novos.add(e.id));
    }
    setItensSelecionados(novos);
  };

  const handleSelecionarTodosFiltrados = () => {
    if (itensSelecionados.size === equipamentosFiltrados.length) {
      setItensSelecionados(new Set());
    } else {
      setItensSelecionados(new Set(equipamentosFiltrados.map((e) => e.id)));
    }
  };

  const handleToggleSelecionar = (id: string) => {
    const novos = new Set(itensSelecionados);
    if (novos.has(id)) novos.delete(id);
    else novos.add(id);
    setItensSelecionados(novos);
  };

  // Exportar selecionados ou filtrados para CSV
  const handleExportarCsv = () => {
    const listaParaExportar =
      itensSelecionados.size > 0
        ? equipamentos.filter((e) => itensSelecionados.has(e.id))
        : equipamentosFiltrados;

    if (listaParaExportar.length === 0) {
      alert('Nenhum equipamento para exportar.');
      return;
    }

    const colunas = [
      'CodigoPatrimonial',
      'Descricao',
      'Tipo',
      'Fabricante',
      'Modelo',
      'NumeroSerie',
      'Localizacao',
      'EstadoOperacional',
      'EstadoConservacao',
      'Responsavel',
      'DataRetirada',
      'DataInstalacao',
      'QRCode',
      'Observacoes',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const linhas = listaParaExportar.map((e) => [
      escapeCsv(e.codigoPatrimonial),
      escapeCsv(e.descricao),
      escapeCsv(e.tipo),
      escapeCsv(e.fabricante),
      escapeCsv(e.modelo),
      escapeCsv(e.numeroSerie),
      escapeCsv(e.localizacaoDescricao),
      escapeCsv(e.estadoOperacional),
      escapeCsv(e.estadoConservacao),
      escapeCsv(e.responsavel),
      escapeCsv(e.dataRetirada || ''),
      escapeCsv(e.dataInstalacao || e.dataAquisicao || ''),
      escapeCsv(e.qrCode),
      escapeCsv(e.observacoes),
    ].join(';'));

    const csvContent = '\uFEFF' + colunas.join(';') + '\n' + linhas.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ativos_tracksub_${listaParaExportar.length}_itens_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exclusão em lote
  const handleExcluirLote = async () => {
    if (itensSelecionados.size === 0) return;
    if (
      !confirm(
        `Deseja realmente excluir ${itensSelecionados.size.toLocaleString('pt-BR')} equipamentos selecionados? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      if (onExcluirEquipamentosLote) {
        await onExcluirEquipamentosLote(Array.from(itensSelecionados));
      } else if (onExcluirEquipamento) {
        for (const id of itensSelecionados) {
          await onExcluirEquipamento(id);
        }
      }
      setItensSelecionados(new Set());
    } catch (err: any) {
      alert(`Erro ao excluir lote: ${err.message}`);
    }
  };

  const getStatusBadge = (status: EstadoOperacional) => {
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

  const getConservacaoBadge = (cons: EstadoConservacao) => {
    switch (cons) {
      case 'Novo':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Bom':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Regular':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Necessita Reparo':
      case 'Danificado':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const paginaAtualItensSelecionados =
    equipamentosPaginados.length > 0 &&
    equipamentosPaginados.every((e) => itensSelecionados.has(e.id));

  return (
    <div className="space-y-5">
      {/* Topo com Título, Estatísticas e Botões de Ação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cadastro e Controle de Equipamentos
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {equipamentos.length.toLocaleString('pt-BR')} Ativos Totais
            </span>
            {equipamentosFiltrados.length !== equipamentos.length && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                {equipamentosFiltrados.length.toLocaleString('pt-BR')} Filtrados
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão técnica completa de Multimedidores, Relés de Proteção, IEDs de Vão, Pátio e Telecomunicações
          </p>
        </div>

        {/* Botões de Ação no Topo */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onAbrirImportacaoMassiva && (
            <button
              onClick={onAbrirImportacaoMassiva}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Importar / Carga Massiva (3.000+)</span>
            </button>
          )}

          <button
            onClick={handleExportarCsv}
            title="Exportar base completa para CSV (Excel)"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onNovoEquipamento}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Equipamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => handleFiltroChange(setBusca, e.target.value)}
              placeholder="Pesquisar por patrimônio, multimedidor, relé, número de série, modelo, fabricante ou local..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {busca && (
              <button
                onClick={() => handleFiltroChange(setBusca, '')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Linha de Seletores de Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Subestação
            </label>
            <select
              value={filtroSubestacao}
              onChange={(e) => handleFiltroChange(setFiltroSubestacao, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas as Subestações</option>
              {subestacoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Categoria Técnica
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => {
                handleFiltroChange(setFiltroCategoria, e.target.value);
                setFiltroTipo('todos');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas as Categorias</option>
              {CATEGORIAS_EQUIPAMENTOS.map((c) => (
                <option key={c.nome} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tipo do Ativo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => handleFiltroChange(setFiltroTipo, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Tipos</option>
              {CATEGORIAS_EQUIPAMENTOS.filter(
                (c) => filtroCategoria === 'todas' || c.nome === filtroCategoria
              ).map((cat) => (
                <optgroup key={cat.nome} label={cat.nome}>
                  {cat.tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Operacional
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => handleFiltroChange(setFiltroStatus, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="Em Operação">Em Operação</option>
              <option value="Sobressalente / Estoque">Sobressalente / Estoque</option>
              <option value="Em Manutenção">Em Manutenção</option>
              <option value="Em Ensaio">Em Ensaio</option>
              <option value="Retirado">Retirado</option>
              <option value="Baixado">Baixado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Conservação
            </label>
            <select
              value={filtroConservacao}
              onChange={(e) => handleFiltroChange(setFiltroConservacao, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Estados</option>
              <option value="Novo">Novo</option>
              <option value="Bom">Bom</option>
              <option value="Regular">Regular</option>
              <option value="Necessita Reparo">Necessita Reparo</option>
              <option value="Danificado">Danificado</option>
            </select>
          </div>
        </div>

        {/* Barra de Ações em Lote quando itens são selecionados */}
        {itensSelecionados.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs animate-in fade-in">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-blue-900">
                {itensSelecionados.size.toLocaleString('pt-BR')} itens selecionados
              </span>
              <button
                onClick={handleSelecionarTodosFiltrados}
                className="text-blue-700 hover:text-blue-900 underline font-medium"
              >
                {itensSelecionados.size === equipamentosFiltrados.length
                  ? 'Desmarcar todos'
                  : `Selecionar todos os ${equipamentosFiltrados.length.toLocaleString('pt-BR')} filtrados`}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportarCsv}
                className="flex items-center space-x-1 px-3 py-1 bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 rounded-lg font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Selecionados</span>
              </button>

              {(onExcluirEquipamentosLote || onExcluirEquipamento) && (
                <button
                  onClick={handleExcluirLote}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Selecionados</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Equipamentos com Paginação Otimizada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barra de Indicadores da Tabela */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-600">
            {totalItens > 0 ? (
              <span>
                Mostrando <strong className="text-slate-900">{(inicioIdx + 1).toLocaleString('pt-BR')}</strong> a{' '}
                <strong className="text-slate-900">{fimIdx.toLocaleString('pt-BR')}</strong> de{' '}
                <strong className="text-slate-900">{totalItens.toLocaleString('pt-BR')}</strong> ativos{' '}
                {itensPorPagina !== 'todos' && `(Página ${paginaAjustada} de ${totalPaginas})`}
              </span>
            ) : (
              <span>Nenhum ativo localizado</span>
            )}
          </div>

          {/* Seletor de Itens por Página */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Itens por página:</span>
            <select
              value={itensPorPagina}
              onChange={(e) => {
                const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                setItensPorPagina(val);
                setPaginaAtual(1);
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value="todos">Todos ({totalItens})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginaAtualItensSelecionados}
                    onChange={handleSelecionarTodosPagina}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    title="Selecionar todos os itens da página atual"
                  />
                </th>
                <th className="py-3 px-4">Código / Série</th>
                <th className="py-3 px-4">Equipamento & Fabricante</th>
                <th className="py-3 px-4">Localização Física</th>
                <th className="py-3 px-4">Status Operacional</th>
                <th className="py-3 px-4">Conservação</th>
                <th className="py-3 px-4 text-right">Ações Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {equipamentosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Cpu className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700 text-sm">
                          Nenhum equipamento encontrado com os filtros atuais
                        </p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          {equipamentos.length === 0
                            ? 'A base de ativos está limpa. Utilize a Carga Massiva para cadastrar mais de 3.000 itens instantaneamente ou cadastre unitariamente.'
                            : 'Tente alterar os termos de busca ou filtros selecionados.'}
                        </p>
                      </div>
                      {equipamentos.length === 0 && onAbrirImportacaoMassiva && (
                        <div className="pt-2 flex items-center space-x-2">
                          <button
                            onClick={onAbrirImportacaoMassiva}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl text-xs shadow-xs hover:from-emerald-700 transition flex items-center space-x-1.5"
                          >
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Carga Massiva (3.000+ Itens)</span>
                          </button>
                          <button
                            onClick={onNovoEquipamento}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
                          >
                            Cadastrar Individualmente
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                equipamentosPaginados.map((eqp) => {
                  const isChecked = itensSelecionados.has(eqp.id);
                  return (
                    <tr
                      key={eqp.id}
                      className={`hover:bg-blue-50/40 transition duration-75 ${
                        isChecked ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelecionar(eqp.id)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>{eqp.codigoPatrimonial}</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                          S/N: {eqp.numeroSerie}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                          {eqp.descricao}
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700">{eqp.fabricante}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{eqp.modelo}</span>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                              getCategoriaDoTipo(eqp.tipo)?.badge ||
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {eqp.tipo}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-800 font-medium line-clamp-2">
                          {eqp.localizacaoDescricao}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusBadge(
                            eqp.estadoOperacional
                          )}`}
                        >
                          {eqp.estadoOperacional}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${getConservacaoBadge(
                            eqp.estadoConservacao
                          )}`}
                        >
                          {eqp.estadoConservacao}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onAbrirFicha(eqp)}
                            title="Consultar Ficha e Histórico Completo"
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onAbrirEtiqueta(eqp)}
                            title="Gerar e Imprimir Etiqueta QR Code"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onAbrirMovimentacao(eqp, 'Instalação')}
                            title="Registrar Movimentação (Instalar, Retirar, Transferir)"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditarEquipamento(eqp)}
                            title="Editar Cadastro do Equipamento"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {onExcluirEquipamento && (
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Deseja realmente excluir o equipamento patrimônio ${eqp.codigoPatrimonial} (${eqp.descricao})?`
                                  )
                                ) {
                                  await onExcluirEquipamento(eqp.id);
                                }
                              }}
                              title="Excluir Equipamento"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Controles de Paginação */}
        {totalItens > 0 && itensPorPagina !== 'todos' && totalPaginas > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Página <strong>{paginaAjustada}</strong> de <strong>{totalPaginas}</strong> (
              {totalItens.toLocaleString('pt-BR')} itens)
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAjustada === 1}
                title="Primeira Página"
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAjustada === 1}
                title="Página Anterior"
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Botões numéricos de páginas em torno da atual */}
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let p = paginaAjustada - 2 + i;
                if (paginaAjustada < 3) p = 1 + i;
                if (paginaAjustada > totalPaginas - 2) p = totalPaginas - 4 + i;
                if (p < 1 || p > totalPaginas) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPaginaAtual(p)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                      paginaAjustada === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAjustada === totalPaginas}
                title="Próxima Página"
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAjustada === totalPaginas}
                title="Última Página"
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
