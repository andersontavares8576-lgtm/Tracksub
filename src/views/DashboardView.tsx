import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Clock,
  Warehouse,
  QrCode,
  Plus,
  Building2,
  Layers,
  ShieldCheck,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardStats, Subestacao, Equipamento } from '../types/tracksub.ts';
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from '../utils/formatters.ts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  subestacoes: Subestacao[];
  equipamentos?: Equipamento[];
  onFiltrarSubestacao: (subestacaoId: string) => void;
  subestacaoSelecionada: string;
  onNavegar: (modulo: any) => void;
  onAbrirFichaEquipamento: (eqp: Equipamento) => void;
  onNovoEquipamento: () => void;
  onNovoMaterial: () => void;
  onNovaMovimentacao: () => void;
  onAbrirImportacaoMassiva?: () => void;
}

const CORES_STATUS: Record<string, string> = {
  'Em Operação': '#10b981', // Emerald 500
  'Sobressalente / Estoque': '#3b82f6', // Blue 500
  'Em Manutenção': '#f59e0b', // Amber 500
  'Em Ensaio': '#8b5cf6', // Purple 500
  'Retirado': '#f97316', // Orange 500
  'Baixado': '#64748b', // Slate 500
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  subestacoes,
  equipamentos = [],
  onFiltrarSubestacao,
  subestacaoSelecionada,
  onNavegar,
  onAbrirFichaEquipamento,
  onNovoEquipamento,
  onNovoMaterial,
  onNovaMovimentacao,
  onAbrirImportacaoMassiva,
}) => {
  // Controle de modo do gráfico de subestações: 'total' ou 'segmentado'
  const [modoVisualizacaoSE, setModoVisualizacaoSE] = useState<'total' | 'segmentado'>('total');

  // Total de equipamentos no escopo atual
  const totalEquipamentosEscopo = useMemo(() => {
    if (equipamentos.length > 0) {
      return subestacaoSelecionada !== 'todas'
        ? equipamentos.filter((e) => e.subestacaoId === subestacaoSelecionada).length
        : equipamentos.length;
    }
    return stats?.totalEquipamentos || 0;
  }, [equipamentos, subestacaoSelecionada, stats]);

  // Agregação dos dados por subestação para o Recharts BarChart
  const dadosSubestacoes = useMemo(() => {
    const mapSE = new Map<
      string,
      {
        id: string;
        nome: string;
        nomeCompleto: string;
        tensao: string;
        total: number;
        emOperacao: number;
        emManutencao: number;
        emEstoque: number;
        retirado: number;
      }
    >();

    // Inicializa o mapa com as subestações cadastradas
    subestacoes.forEach((s) => {
      const nomeCurto = s.nome.length > 18 ? s.nome.substring(0, 16) + '...' : s.nome;
      mapSE.set(s.id, {
        id: s.id,
        nome: nomeCurto,
        nomeCompleto: s.nome,
        tensao: s.tensaoPrimaria || '230 kV',
        total: 0,
        emOperacao: 0,
        emManutencao: 0,
        emEstoque: 0,
        retirado: 0,
      });
    });

    // Contabiliza cada equipamento da malha
    let semSubCount = 0;
    let semSubEmOperacao = 0;
    let semSubEmEstoque = 0;
    let semSubEmManutencao = 0;

    equipamentos.forEach((eqp) => {
      if (eqp.subestacaoId && mapSE.has(eqp.subestacaoId)) {
        const item = mapSE.get(eqp.subestacaoId)!;
        item.total += 1;
        if (eqp.estadoOperacional === 'Em Operação') item.emOperacao += 1;
        else if (eqp.estadoOperacional === 'Em Manutenção' || eqp.estadoOperacional === 'Em Ensaio') item.emManutencao += 1;
        else if (eqp.estadoOperacional === 'Sobressalente / Estoque') item.emEstoque += 1;
        else if (eqp.estadoOperacional === 'Retirado') item.retirado += 1;
      } else {
        semSubCount += 1;
        if (eqp.estadoOperacional === 'Em Operação') semSubEmOperacao += 1;
        else if (eqp.estadoOperacional === 'Sobressalente / Estoque') semSubEmEstoque += 1;
        else if (eqp.estadoOperacional === 'Em Manutenção' || eqp.estadoOperacional === 'Em Ensaio') semSubEmManutencao += 1;
      }
    });

    const lista = Array.from(mapSE.values());

    // Se houver equipamentos em almoxarifados ou sem subestação associada
    if (semSubCount > 0) {
      lista.push({
        id: 'sem-se',
        nome: 'Almoxarifado Central',
        nomeCompleto: 'Almoxarifado Central e Sobressalentes',
        tensao: 'Spares',
        total: semSubCount,
        emOperacao: semSubEmOperacao,
        emManutencao: semSubEmManutencao,
        emEstoque: semSubEmEstoque,
        retirado: 0,
      });
    }

    // Ordenar decrescente pelo volume de ativos
    return lista.sort((a, b) => b.total - a.total);
  }, [subestacoes, equipamentos]);

  // Agregação dos dados por status operacional para o Recharts PieChart (Donut)
  const dadosStatusOperacional = useMemo(() => {
    const eqps = equipamentos.length > 0
      ? (subestacaoSelecionada !== 'todas'
          ? equipamentos.filter((e) => e.subestacaoId === subestacaoSelecionada)
          : equipamentos)
      : [];

    const contagens: Record<string, number> = {
      'Em Operação': 0,
      'Sobressalente / Estoque': 0,
      'Em Manutenção': 0,
      'Em Ensaio': 0,
      'Retirado': 0,
      'Baixado': 0,
    };

    if (eqps.length > 0) {
      eqps.forEach((e) => {
        if (contagens[e.estadoOperacional] !== undefined) {
          contagens[e.estadoOperacional] += 1;
        } else {
          contagens[e.estadoOperacional] = 1;
        }
      });
    } else if (stats && stats.totalEquipamentos > 0) {
      contagens['Em Operação'] = stats.equipamentosInstalados || 0;
      contagens['Sobressalente / Estoque'] = stats.equipamentosEstoque || 0;
      contagens['Em Manutenção'] = stats.equipamentosManutencao || 0;
      contagens['Retirado'] = stats.equipamentosRetirados || 0;
    }

    return Object.entries(contagens)
      .map(([name, value]) => ({
        name,
        value,
        color: CORES_STATUS[name] || '#64748b',
      }))
      .filter((item) => item.value > 0);
  }, [equipamentos, subestacaoSelecionada, stats]);

  // Métricas derivadas de operação
  const operandoCalculado = useMemo(() => {
    const item = dadosStatusOperacional.find((d) => d.name === 'Em Operação');
    return item ? item.value : 0;
  }, [dadosStatusOperacional]);

  const percentualOperando = totalEquipamentosEscopo > 0
    ? Math.round((operandoCalculado / totalEquipamentosEscopo) * 100)
    : 0;

  // Tooltip customizado para o gráfico de subestações
  const CustomSubestacaoTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-slate-100 border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
            <span className="truncate max-w-[140px]">{data.nomeCompleto || data.nome}</span>
            <span className="text-[10px] text-blue-400 font-mono ml-2 shrink-0">{data.tensao}</span>
          </div>
          <div className="flex justify-between text-slate-300 pt-0.5">
            <span>Total de Ativos:</span>
            <span className="font-bold font-mono text-white tabular-nums">{formatarNumero(data.total)}</span>
          </div>
          {data.emOperacao > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Em Operação:</span>
              <span className="font-bold font-mono tabular-nums">{formatarNumero(data.emOperacao)}</span>
            </div>
          )}
          {data.emManutencao > 0 && (
            <div className="flex justify-between text-amber-400">
              <span>Manutenção / Ensaio:</span>
              <span className="font-bold font-mono tabular-nums">{formatarNumero(data.emManutencao)}</span>
            </div>
          )}
          {data.emEstoque > 0 && (
            <div className="flex justify-between text-blue-400">
              <span>Sobressalente:</span>
              <span className="font-bold font-mono tabular-nums">{formatarNumero(data.emEstoque)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Tooltip customizado para o gráfico de status operacional (Donut)
  const CustomStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = totalEquipamentosEscopo || 1;
      const perc = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[170px]">
          <div className="font-bold text-slate-100 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </div>
          <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
            <span>Quantidade:</span>
            <span className="font-bold font-mono text-white tabular-nums">{formatarNumero(data.value)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Percentual:</span>
            <span className="font-bold font-mono text-slate-200 tabular-nums">{perc}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        <span>Carregando indicadores operacionais...</span>
      </div>
    );
  }

  const subestacaoAtivaObj = subestacaoSelecionada !== 'todas'
    ? subestacoes.find((s) => s.id === subestacaoSelecionada)
    : null;

  return (
    <div className="space-y-6">
      {/* Topo da Visão Geral com Filtro de Subestação e Ações Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Painel Inicial de Ativos</h1>
            <span className="text-xs text-slate-500 font-medium">
              · Base de Dados TRACKSUB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indicadores e gráficos calculados em tempo real a partir dos ativos cadastrados
          </p>
        </div>

        {/* Filtro de Subestação */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={subestacaoSelecionada}
              onChange={(e) => onFiltrarSubestacao(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="todas">Todas as Subestações (Geral)</option>
              {subestacoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.tensaoPrimaria})
                </option>
              ))}
            </select>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavegar('leitor-qrcode')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Escanear QR Code</span>
            </button>
            {onAbrirImportacaoMassiva && (
              <button
                onClick={onAbrirImportacaoMassiva}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Carga Massiva (3.000+)</span>
              </button>
            )}
            <button
              onClick={onNovoEquipamento}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Equipamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de Filtro Ativo */}
      {subestacaoAtivaObj && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>
              Filtrando visualização operacional por: <strong>{subestacaoAtivaObj.nome}</strong> ({subestacaoAtivaObj.tensaoPrimaria})
            </span>
          </div>
          <button
            onClick={() => onFiltrarSubestacao('todas')}
            className="flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ver toda a malha</span>
          </button>
        </div>
      )}

      {/* Banner de Sistema Zerado / Início do Cadastro */}
      {stats.totalEquipamentos === 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800/60">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-blue-300">
              <span className="font-bold uppercase tracking-wider text-white">Base Pronta</span>
              <span>·</span>
              <span>Cadastro de Infraestrutura</span>
            </div>
            <h2 className="text-base font-bold text-white">
              Pronto para Cadastrar sua Infraestrutura do Zero
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Todos os equipamentos e subestações anteriores foram limpos. Você pode iniciar cadastrando subestações e equipamentos um a um, ou utilizar a <strong>Carga Massiva</strong> para gerar mais de 3.000 itens técnicos (Multimedidores, Relés, Switches, IEDs) via CSV ou em 1 clique!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onAbrirImportacaoMassiva && (
              <button
                onClick={onAbrirImportacaoMassiva}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Carga Massiva (3.000+ Itens)</span>
              </button>
            )}
            <button
              onClick={() => onNavegar('subestacoes')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span>1. Cadastrar Subestação</span>
            </button>
            <button
              onClick={onNovoEquipamento}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>2. Cadastrar Equipamento</span>
            </button>
          </div>
        </div>
      )}

      {/* Cartões de Indicadores (KPIs calculados do banco) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Equipamentos */}
        <div
          onClick={() => onNavegar('equipamentos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Equipamentos</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            {formatarNumero(stats.totalEquipamentos)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>Ativos cadastrados</span>
          </div>
        </div>

        {/* Em Operação */}
        <div
          onClick={() => onNavegar('equipamentos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Instalados / Operando</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 tabular-nums">
            {formatarNumero(stats.equipamentosInstalados)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Em cubículos e painéis
          </div>
        </div>

        {/* Em Manutenção / Ensaio */}
        <div
          onClick={() => onNavegar('equipamentos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Em Manutenção/Ensaio</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 tabular-nums">
            {formatarNumero(stats.equipamentosManutencao)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Laboratório ou oficina
          </div>
        </div>

        {/* Sobressalentes / Estoque */}
        <div
          onClick={() => onNavegar('equipamentos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sobressalentes</span>
            <Warehouse className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-800 mt-2 tabular-nums">
            {formatarNumero(stats.equipamentosEstoque)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Disponíveis em almoxarifados
          </div>
        </div>

        {/* Retirados / Sem Localização */}
        <div
          onClick={() => onNavegar('equipamentos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-red-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Retirados / Trânsito</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 tabular-nums">
            {formatarNumero(stats.equipamentosRetirados)}
          </div>
          <div className="text-[11px] text-orange-600 font-semibold mt-1">
            {stats.equipamentosSemLocalizacao > 0 ? `${stats.equipamentosSemLocalizacao} sem local confirmado` : 'Triados'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WIDGETS DE VISUALIZAÇÃO DE DADOS COM RECHARTS                              */}
      {/* 1. Distribuição de Equipamentos por Subestação                            */}
      {/* 2. Status Operacional Atual (Donut / Gráfico em Disco)                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget 1: Distribuição por Subestação (BarChart) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Distribuição de Equipamentos por Subestação</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{dadosSubestacoes.length} unidades mapeadas</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatarNumero(totalEquipamentosEscopo)} ativos no escopo</span>
                </div>
              </div>

              {/* Controles do Gráfico */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setModoVisualizacaoSE('total')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                    modoVisualizacaoSE === 'total'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Total Consolidado
                </button>
                <button
                  onClick={() => setModoVisualizacaoSE('segmentado')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                    modoVisualizacaoSE === 'segmentado'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Segmentado
                </button>
              </div>
            </div>

            {/* Conteúdo do Gráfico Recharts */}
            <div className="pt-4 min-h-[300px] flex items-center justify-center">
              {dadosSubestacoes.length === 0 || totalEquipamentosEscopo === 0 ? (
                <div className="text-center py-10 px-4 max-w-sm mx-auto">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Nenhum equipamento vinculado</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Cadastre subestações e equipamentos para visualizar o comparativo de capacidade e distribuição por unidade.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => onNavegar('subestacoes')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Cadastrar Subestação
                    </button>
                    {onAbrirImportacaoMassiva && (
                      <button
                        onClick={onAbrirImportacaoMassiva}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                      >
                        Carga Massiva
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-[290px]">
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart
                      data={dadosSubestacoes.slice(0, 8)}
                      margin={{ top: 12, right: 12, left: -16, bottom: 28 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="nome"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomSubestacaoTooltip />} />
                      {modoVisualizacaoSE === 'total' ? (
                        <Bar
                          dataKey="total"
                          name="Total de Equipamentos"
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                        />
                      ) : (
                        <>
                          <Bar
                            dataKey="emOperacao"
                            name="Em Operação"
                            stackId="seStack"
                            fill="#10b981"
                          />
                          <Bar
                            dataKey="emManutencao"
                            name="Manutenção / Ensaio"
                            stackId="seStack"
                            fill="#f59e0b"
                          />
                          <Bar
                            dataKey="emEstoque"
                            name="Sobressalente"
                            stackId="seStack"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                          />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé do Widget com Metadados em Texto Limpo */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-3">
              {modoVisualizacaoSE === 'segmentado' ? (
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span>Operação</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    <span>Manutenção</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                    <span>Sobressalente</span>
                  </span>
                </div>
              ) : (
                <span>Unidades ranqueadas por quantidade total de equipamentos</span>
              )}
            </div>
            <button
              onClick={() => onNavegar('subestacoes')}
              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>Gerenciar Subestações</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Widget 2: Status Operacional Atual (PieChart / Donut) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">Status Operacional Atual</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disponibilidade física e prontidão dos ativos
                </p>
              </div>
              <button
                onClick={() => onNavegar('equipamentos')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Ver lista
              </button>
            </div>

            {/* Conteúdo do Donut Chart */}
            <div className="pt-2 min-h-[300px] flex flex-col items-center justify-center">
              {dadosStatusOperacional.length === 0 || totalEquipamentosEscopo === 0 ? (
                <div className="text-center py-10 px-4 max-w-xs mx-auto">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <PieChartIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Aguardando dados dos ativos</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Cadastre itens ou use a carga massiva para ver os índices percentuais de disponibilidade da malha.
                  </p>
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Donut Chart com Indicador Central */}
                  <div className="sm:col-span-7 relative flex items-center justify-center h-[210px]">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Tooltip content={<CustomStatusTooltip />} />
                        <Pie
                          data={dadosStatusOperacional}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={86}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dadosStatusOperacional.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Rótulo Central no Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-2xl font-black text-slate-900 tabular-nums">
                        {percentualOperando}%
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Operacional
                      </span>
                    </div>
                  </div>

                  {/* Lista Limpa de Status (Sem pílulas estáticas) */}
                  <div className="sm:col-span-5 space-y-2 text-xs">
                    {dadosStatusOperacional.map((st) => {
                      const perc = totalEquipamentosEscopo > 0
                        ? ((st.value / totalEquipamentosEscopo) * 100).toFixed(0)
                        : '0';
                      return (
                        <div
                          key={st.name}
                          onClick={() => onNavegar('equipamentos')}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: st.color }}
                            />
                            <span className="text-slate-700 font-medium truncate">{st.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-mono tabular-nums shrink-0 ml-2">
                            <span className="font-bold text-slate-900">{formatarNumero(st.value)}</span>
                            <span className="text-slate-400 text-[10px]">({perc}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé do Widget com Taxa de Disponibilidade */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Taxa de Ativos Operando:</span>
            <span className="font-bold font-mono text-emerald-700 tabular-nums">
              {percentualOperando}% ({formatarNumero(operandoCalculado)} / {formatarNumero(totalEquipamentosEscopo)})
            </span>
          </div>
        </div>
      </div>

      {/* Segunda Linha de Indicadores: Materiais e Ordens de Serviço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Materiais e Estoque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Gestão de Materiais e Peças
              </span>
              <Boxes className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {formatarNumero(stats.totalMateriaisDisponiveis)}
                </span>
                <span className="text-xs text-slate-500 ml-1.5">itens físicos</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Valor Estimado</span>
                <span className="text-sm font-bold text-slate-800 tabular-nums">
                  {formatarMoeda(stats.valorTotalEstoque)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Abaixo do estoque mínimo:</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                stats.materiaisAbaixoMinimo > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {stats.materiaisAbaixoMinimo} materiais
            </span>
          </div>
        </div>

        {/* Ordens de Serviço */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ordens de Serviço em Andamento
              </span>
              <ClipboardList className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-blue-700 tabular-nums">
                {formatarNumero(stats.ordensServicoAndamento)}
              </span>
              <span className="text-xs text-slate-500 ml-2">OS ativas na malha</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Intervenções programadas:</span>
            <button
              onClick={() => onNavegar('ordens-servico')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Ver todas as ordens →
            </button>
          </div>
        </div>

        {/* Equipamentos com Atenção */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Estado de Conservação dos Ativos
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {stats.equipamentosCriticos.length}
              </span>
              <span className="text-xs text-slate-500 ml-2">requerem atenção ou manutenção</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Conformidade e inspeção:</span>
            <button
              onClick={() => onNavegar('inventario')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Inventário Físico →
            </button>
          </div>
        </div>
      </div>

      {/* Duas Tabelas: Movimentações Recentes e Ordens de Serviço */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimentações Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Últimas Movimentações Registradas</h3>
            </div>
            <button
              onClick={() => onNavegar('movimentacoes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Ver histórico completo →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.movimentacoesRecentes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhuma movimentação registrada recentemente.
              </div>
            ) : (
              stats.movimentacoesRecentes.map((mov) => (
                <div key={mov.id} className="p-3.5 hover:bg-slate-50 transition flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                        {mov.equipamentoPatrimonio}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {mov.tipoOperacao}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5 font-medium">
                      {mov.equipamentoDescricao}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      <strong>Motivo:</strong> {mov.motivo}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                      <span>Executado por: {mov.usuarioNome}</span>
                      <span>•</span>
                      <span>{formatarDataHora(mov.dataHora)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ordens de Serviço Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Ordens de Serviço em Destaque</h3>
            </div>
            <button
              onClick={() => onNavegar('ordens-servico')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Gerenciar ordens →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.ordensRecentes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhuma ordem de serviço cadastrada.
              </div>
            ) : (
              stats.ordensRecentes.map((os) => (
                <div key={os.id} className="p-3.5 hover:bg-slate-50 transition flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-900">
                        {os.numero}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          os.status === 'Concluída'
                            ? 'bg-emerald-100 text-emerald-800'
                            : os.status === 'Em Andamento'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {os.status}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {os.prioridade}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                      {os.titulo}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {os.subestacaoNome} {os.painelNome ? `• ${os.painelNome}` : ''}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                      <span>Responsável: {os.responsavelNome}</span>
                      <span>•</span>
                      <span>Prazo: {formatarData(os.prazoLimite)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
