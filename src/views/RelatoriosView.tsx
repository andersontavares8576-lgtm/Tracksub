import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  Equipamento,
  Material,
  Movimentacao,
  OrdemServico,
  InventarioFisico,
  Subestacao,
} from '../types/tracksub.ts';
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from '../utils/formatters.ts';

interface RelatoriosViewProps {
  equipamentos: Equipamento[];
  materiais: Material[];
  movimentacoes: Movimentacao[];
  ordens: OrdemServico[];
  inventarios: InventarioFisico[];
  subestacoes: Subestacao[];
}

type TipoRelatorio =
  | 'inventario-equipamentos'
  | 'equipamentos-subestacao'
  | 'equipamentos-retirados'
  | 'movimentacoes-tecnico'
  | 'materiais-estoque'
  | 'materiais-abaixo-minimo'
  | 'entradas-saidas-materiais'
  | 'consumo-ordens-servico'
  | 'custos-estimados-estoque'
  | 'divergencias-inventario';

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  equipamentos,
  materiais,
  movimentacoes,
  ordens,
  inventarios,
  subestacoes,
}) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('inventario-equipamentos');
  const [subestacaoId, setSubestacaoId] = useState('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Gerar dados tabulares do relatório selecionado
  const gerarDadosRelatorio = () => {
    switch (tipoRelatorio) {
      case 'inventario-equipamentos': {
        let dados = equipamentos;
        if (subestacaoId !== 'todas') dados = dados.filter((e) => e.subestacaoId === subestacaoId);
        return {
          titulo: 'Relatório Geral de Inventário de Equipamentos',
          cabecalhos: ['Patrimônio', 'Descrição', 'Fabricante', 'Modelo', 'Número de Série', 'Localização', 'Operacional', 'Conservação'],
          linhas: dados.map((e) => [
            e.codigoPatrimonial,
            e.descricao,
            e.fabricante,
            e.modelo,
            e.numeroSerie,
            e.localizacaoDescricao,
            e.estadoOperacional,
            e.estadoConservacao,
          ]),
        };
      }

      case 'equipamentos-subestacao': {
        const dados = equipamentos.filter((e) => e.subestacaoId);
        return {
          titulo: 'Relatório de Equipamentos Instalados por Subestação',
          cabecalhos: ['Subestação / Local', 'Patrimônio', 'Tipo de Ativo', 'Descrição', 'Modelo', 'Data de Instalação'],
          linhas: dados.map((e) => [
            e.localizacaoDescricao,
            e.codigoPatrimonial,
            e.tipo,
            e.descricao,
            e.modelo,
            formatarData(e.dataInstalacao || e.dataAquisicao),
          ]),
        };
      }

      case 'equipamentos-retirados': {
        const dados = equipamentos.filter((e) => e.estadoOperacional === 'Retirado' || e.estadoOperacional === 'Em Manutenção' || e.estadoOperacional === 'Em Ensaio');
        return {
          titulo: 'Relatório de Equipamentos Desinstalados, Retirados e em Oficina',
          cabecalhos: ['Patrimônio', 'Descrição', 'Estado Operacional', 'Conservação', 'Data da Retirada', 'Local Atual', 'Responsável'],
          linhas: dados.map((e) => [
            e.codigoPatrimonial,
            e.descricao,
            e.estadoOperacional,
            e.estadoConservacao,
            formatarData(e.dataRetirada),
            e.localizacaoDescricao,
            e.responsavel,
          ]),
        };
      }

      case 'movimentacoes-tecnico': {
        return {
          titulo: 'Relatório Cronológico de Movimentações Operacionais por Técnico',
          cabecalhos: ['Data / Hora', 'Operação', 'Patrimônio', 'Equipamento', 'Origem', 'Destino', 'Técnico Responsável', 'Motivo'],
          linhas: movimentacoes.map((m) => [
            formatarDataHora(m.dataHora),
            m.tipoOperacao,
            m.equipamentoPatrimonio,
            m.equipamentoDescricao,
            m.origemSubestacaoNome || 'Almoxarifado',
            m.destinoSubestacaoNome || m.destinoAlmoxarifadoNome || 'Oficina',
            m.usuarioNome,
            m.motivo,
          ]),
        };
      }

      case 'materiais-estoque': {
        return {
          titulo: 'Relatório Completo de Materiais e Peças em Estoque',
          cabecalhos: ['Código', 'Descrição', 'Categoria', 'Unidade', 'Saldo Físico', 'Reservado', 'Disponível', 'Custo Unit.', 'Valor Total'],
          linhas: materiais.map((m) => [
            m.codigoInterno,
            m.descricao,
            m.categoria,
            m.unidadeMedida,
            m.quantidadeFisica.toString(),
            m.quantidadeReservada.toString(),
            m.quantidadeDisponivel.toString(),
            formatarMoeda(m.custoUnitario),
            formatarMoeda(m.quantidadeFisica * m.custoUnitario),
          ]),
        };
      }

      case 'materiais-abaixo-minimo': {
        const dados = materiais.filter((m) => m.quantidadeFisica <= m.estoqueMinimo);
        return {
          titulo: 'Alerta de Gestão: Materiais Abaixo do Estoque Mínimo',
          cabecalhos: ['Código', 'Descrição', 'Almoxarifado', 'Saldo Atual', 'Estoque Mínimo', 'Déficit', 'Fornecedor Homologado'],
          linhas: dados.map((m) => [
            m.codigoInterno,
            m.descricao,
            m.almoxarifadoNome,
            `${m.quantidadeFisica} ${m.unidadeMedida}`,
            `${m.estoqueMinimo} ${m.unidadeMedida}`,
            `${m.estoqueMinimo - m.quantidadeFisica} ${m.unidadeMedida}`,
            m.fornecedorNome,
          ]),
        };
      }

      case 'consumo-ordens-servico': {
        return {
          titulo: 'Relatório de Consumo Efetivo de Materiais por Ordem de Serviço',
          cabecalhos: ['Ordem de Serviço', 'Subestação', 'Status OS', 'Material Consumido', 'Qtd Baixada', 'Responsável'],
          linhas: ordens.flatMap((o) =>
            o.materiaisRequisitados
              .filter((m) => m.consumido)
              .map((m) => [
                o.numero,
                o.subestacaoNome,
                o.status,
                m.descricao,
                `${m.quantidade} ${m.unidade}`,
                o.responsavelNome,
              ])
          ),
        };
      }

      case 'divergencias-inventario': {
        return {
          titulo: 'Relatório Consolidado de Divergências de Inventário Físico',
          cabecalhos: ['Inventário', 'Local', 'Código Item', 'Descrição', 'Esperado', 'Contado', 'Diferença', 'Situação'],
          linhas: inventarios.flatMap((inv) =>
            inv.itens
              .filter((it) => it.diferenca !== 0)
              .map((it) => [
                inv.codigo,
                inv.localNome,
                it.codigo,
                it.descricao,
                it.quantidadeEsperada.toString(),
                it.quantidadeContada.toString(),
                it.diferenca.toString(),
                it.statusDivergencia,
              ])
          ),
        };
      }

      default: {
        return {
          titulo: 'Relatório Geral do Sistema',
          cabecalhos: ['Identificador', 'Descrição', 'Informação'],
          linhas: [],
        };
      }
    }
  };

  const relatorioAtual = gerarDadosRelatorio();

  // Exportar em formato CSV 100% compatível com Excel no Brasil
  const exportarCSV = () => {
    const BOM = '\uFEFF';
    const headerRow = relatorioAtual.cabecalhos.map((c) => `"${c.replace(/"/g, '""')}"`).join(';');
    const rows = relatorioAtual.linhas.map((row) =>
      row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(';')
    );
    const csvContent = BOM + [headerRow, ...rows].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TRACKSUB_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Módulo de Relatórios e Exportação</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              Auditado
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Geração de relatórios gerenciais e técnicos com filtros por ativo, subestação, técnico e inventário
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportarCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Excel)</span>
          </button>
          <button
            onClick={imprimirRelatorio}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Seletor de Modelo de Relatório e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Modelo do Relatório
            </label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="inventario-equipamentos">1. Inventário Geral de Equipamentos</option>
              <option value="equipamentos-subestacao">2. Equipamentos Instalados por Subestação</option>
              <option value="equipamentos-retirados">3. Equipamentos Retirados e em Oficina</option>
              <option value="movimentacoes-tecnico">4. Movimentações Operacionais por Técnico</option>
              <option value="materiais-estoque">5. Materiais e Peças em Estoque</option>
              <option value="materiais-abaixo-minimo">6. Materiais Abaixo do Estoque Mínimo</option>
              <option value="consumo-ordens-servico">7. Consumo por Ordem de Serviço</option>
              <option value="divergencias-inventario">8. Divergências de Inventário Físico</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filtro por Subestação
            </label>
            <select
              value={subestacaoId}
              onChange={(e) => setSubestacaoId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="todas">Todas as Subestações (Geral)</option>
              {subestacoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visualização do Relatório Formatado */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Cabeçalho do Documento para Impressão */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">
                TRACKSUB • SISTEMA DE GESTÃO DE SUBESTAÇÕES
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {relatorioAtual.titulo}
              </h2>
            </div>
            <div className="text-right text-[11px] text-slate-400 font-mono">
              <div>Emissão: {formatarDataHora(new Date().toISOString())}</div>
              <div>Total de Registros: {relatorioAtual.linhas.length}</div>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[10px] uppercase">
                {relatorioAtual.cabecalhos.map((c, idx) => (
                  <th key={idx} className="py-2.5 px-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relatorioAtual.linhas.length === 0 ? (
                <tr>
                  <td colSpan={relatorioAtual.cabecalhos.length} className="py-6 text-center text-slate-400 text-xs">
                    Nenhum registro encontrado para este relatório com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                relatorioAtual.linhas.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition">
                    {row.map((col, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-slate-800">
                        {col}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono">
          TRACKSUB - Documento Gerado pelo Sistema de Gestão de Subestações • Rastreabilidade Certificada
        </div>
      </div>
    </div>
  );
};
