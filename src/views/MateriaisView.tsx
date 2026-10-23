import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  Edit2,
  Trash2,
  RotateCcw,
  Eraser,
  DollarSign,
  TrendingDown,
  Warehouse,
  CheckCircle2,
} from 'lucide-react';
import { Material, Almoxarifado, Fornecedor, CategoriaMaterial } from '../types/tracksub.ts';
import { formatarMoeda, formatarNumero } from '../utils/formatters.ts';

interface MateriaisViewProps {
  materiais: Material[];
  almoxarifados: Almoxarifado[];
  fornecedores: Fornecedor[];
  onNovoMaterial: () => void;
  onEditarMaterial: (mat: Material) => void;
  onMovimentarMaterial: (mat: Material) => void;
  onExcluirMaterial: (matId: string) => Promise<void>;
  onZerarEstoqueMaterial: (matId: string) => Promise<void>;
  onZerarTodoEstoque?: () => Promise<void>;
  onZerarTodosMateriais?: () => Promise<void>;
}

export const MateriaisView: React.FC<MateriaisViewProps> = ({
  materiais,
  almoxarifados,
  fornecedores,
  onNovoMaterial,
  onEditarMaterial,
  onMovimentarMaterial,
  onExcluirMaterial,
  onZerarEstoqueMaterial,
  onZerarTodoEstoque,
  onZerarTodosMateriais,
}) => {
  const [modalZerarAberto, setModalZerarAberto] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroAlmoxarifado, setFiltroAlmoxarifado] = useState('todos');
  const [apenasAbaixoMinimo, setApenasAbaixoMinimo] = useState(false);

  const materiaisFiltrados = materiais.filter((m) => {
    if (busca.trim()) {
      const t = busca.toLowerCase();
      const bateu =
        m.codigoInterno.toLowerCase().includes(t) ||
        m.descricao.toLowerCase().includes(t) ||
        m.fabricante.toLowerCase().includes(t) ||
        m.referenciaModelo.toLowerCase().includes(t) ||
        (m.controleLote && m.controleLote.toLowerCase().includes(t));
      if (!bateu) return false;
    }
    if (filtroCategoria !== 'todas' && m.categoria !== filtroCategoria) return false;
    if (filtroAlmoxarifado !== 'todos' && m.almoxarifadoId !== filtroAlmoxarifado) return false;
    if (apenasAbaixoMinimo && m.quantidadeFisica > m.estoqueMinimo) return false;
    return true;
  });

  const totalFisico = materiais.reduce((acc, m) => acc + m.quantidadeFisica, 0);
  const totalReservado = materiais.reduce((acc, m) => acc + m.quantidadeReservada, 0);
  const totalDisponivel = materiais.reduce((acc, m) => acc + m.quantidadeDisponivel, 0);
  const valorTotalEstoque = materiais.reduce((acc, m) => acc + m.quantidadeFisica * m.custoUnitario, 0);
  const totalAbaixoMinimo = materiais.filter((m) => m.quantidadeFisica <= m.estoqueMinimo).length;

  return (
    <div className="space-y-5">
      {/* Topo com Título e Botões de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Materiais, Peças e Estoque</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              {materiaisFiltrados.length} Itens Catalogados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de cabos, terminais, fusíveis, blocos de aferição, disjuntores auxiliares e ferramentas
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setModalZerarAberto(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition shadow-2xs"
            title="Opções para zerar saldo ou excluir materiais"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Zerar / Limpar Estoque</span>
          </button>

          <button
            onClick={onNovoMaterial}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Material</span>
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores de Saldo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Saldo Físico Geral
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatarNumero(totalFisico)}
          </div>
          <span className="text-[11px] text-slate-500">Unidades / Metros</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
            Quantidade Reservada
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatarNumero(totalReservado)}
          </div>
          <span className="text-[11px] text-slate-500">Vinculada a Ordens de Serviço</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Saldo Disponível
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatarNumero(totalDisponivel)}
          </div>
          <span className="text-[11px] text-slate-500">Pronto para aplicação imediata</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Valor Total do Estoque
          </span>
          <div className="text-2xl font-black text-blue-800 mt-1">
            {formatarMoeda(valorTotalEstoque)}
          </div>
          <span className="text-[11px] text-slate-500">Custo médio de aquisição</span>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código interno, descrição, modelo, fabricante ou lote..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={() => setApenasAbaixoMinimo(!apenasAbaixoMinimo)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
              apenasAbaixoMinimo
                ? 'bg-amber-500 text-slate-950 border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Apenas Abaixo do Mínimo ({totalAbaixoMinimo})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas as Categorias</option>
              <option value="Cabos e Condutores">Cabos e Condutores</option>
              <option value="Conectores e Terminais">Conectores e Terminais</option>
              <option value="Fusíveis e Proteção Auxiliar">Fusíveis e Proteção Auxiliar</option>
              <option value="Componentes Eletrônicos">Componentes Eletrônicos</option>
              <option value="Disjuntores Auxiliares">Disjuntores Auxiliares</option>
              <option value="Isolação e Vedação">Isolação e Vedação</option>
              <option value="Peças Mecânicas">Peças Mecânicas</option>
              <option value="Ferramentas">Ferramentas</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Almoxarifado de Guarda
            </label>
            <select
              value={filtroAlmoxarifado}
              onChange={(e) => setFiltroAlmoxarifado(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Almoxarifados</option>
              {almoxarifados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Materiais */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Código / Categoria</th>
                <th className="py-3.5 px-4">Descrição & Fabricante</th>
                <th className="py-3.5 px-4">Almoxarifado & Prateleira</th>
                <th className="py-3.5 px-4 text-center">Físico</th>
                <th className="py-3.5 px-4 text-center">Reservado</th>
                <th className="py-3.5 px-4 text-center">Disponível</th>
                <th className="py-3.5 px-4 text-right">Custo Un.</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materiaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Nenhum material localizado com os critérios informados.
                  </td>
                </tr>
              ) : (
                materiaisFiltrados.map((mat) => {
                  const abaixoDoMinimo = mat.quantidadeFisica <= mat.estoqueMinimo;

                  return (
                    <tr key={mat.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {mat.codigoInterno}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {mat.categoria}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                          {mat.descricao}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                          <span>{mat.fabricante}</span>
                          {mat.referenciaModelo && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{mat.referenciaModelo}</span>
                            </>
                          )}
                          {mat.controleLote && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-400">Lote: {mat.controleLote}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800 line-clamp-1">
                          {mat.almoxarifadoNome}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {mat.prateleiraPosicao}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {mat.quantidadeFisica} {mat.unidadeMedida}
                        </span>
                        {abaixoDoMinimo && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Mín: {mat.estoqueMinimo}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-amber-700">
                          {mat.quantidadeReservada} {mat.unidadeMedida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            abaixoDoMinimo
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {mat.quantidadeDisponivel} {mat.unidadeMedida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                        {formatarMoeda(mat.custoUnitario)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onMovimentarMaterial(mat)}
                            title="Movimentar Estoque (Entrada, Saída, Transferência)"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1 transition"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Movimentar</span>
                          </button>

                          <button
                            onClick={() => onEditarMaterial(mat)}
                            title="Editar Material"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              const ok = window.confirm(
                                `Deseja zerar o saldo de estoque do material "${mat.codigoInterno} - ${mat.descricao}"?\n\nAs quantidades física e disponível serão zeradas no Cloud Firestore.`
                              );
                              if (!ok) return;
                              try {
                                await onZerarEstoqueMaterial(mat.id);
                              } catch (err: any) {
                                alert(err.message || 'Erro ao zerar saldo do material.');
                              }
                            }}
                            title="Zerar Saldo deste Material (Físico = 0)"
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              const ok = window.confirm(
                                `Tem certeza que deseja excluir o material "${mat.codigoInterno} - ${mat.descricao}" permanentemente do catálogo e do Cloud Firestore?`
                              );
                              if (!ok) return;
                              try {
                                await onExcluirMaterial(mat.id);
                              } catch (err: any) {
                                alert(err.message || 'Erro ao excluir material.');
                              }
                            }}
                            title="Excluir Material Permanentemente"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação para Zerar / Limpar Estoque Geral */}
      {modalZerarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Zerar Estoque e Materiais</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Selecione o nível de limpeza desejado</p>
                </div>
              </div>
              <button
                onClick={() => setModalZerarAberto(false)}
                disabled={processando}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Opção 1: Zerar Apenas os Saldos Físicos para 0 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>Opção 1: Zerar Saldo de Todos os Materiais</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Mantém Cadastro</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Redefine as quantidades física, reservada e disponível de todos os <strong>{materiais.length} materiais</strong> para <strong>0</strong>. Os nomes, códigos e descrições dos itens continuam cadastrados.
                </p>
                <button
                  disabled={processando || materiais.length === 0}
                  onClick={async () => {
                    const ok = window.confirm(
                      'Confirma redefinir o saldo de estoque de TODOS os materiais para 0?'
                    );
                    if (!ok) return;
                    try {
                      setProcessando(true);
                      if (onZerarTodoEstoque) {
                        await onZerarTodoEstoque();
                      }
                      setModalZerarAberto(false);
                    } catch (err: any) {
                      alert(err.message || 'Erro ao zerar saldo de estoque.');
                    } finally {
                      setProcessando(false);
                    }
                  }}
                  className="w-full mt-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{processando ? 'Processando...' : 'Zerar Saldo de Todos os Materiais'}</span>
                </button>
              </div>

              {/* Opção 2: Excluir Todos os Materiais e Histórico (Começar do Zero) */}
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 space-y-2">
                <div className="font-bold text-red-900 flex items-center justify-between">
                  <span>Opção 2: Excluir Todos os Materiais e Movimentações</span>
                  <span className="text-[10px] bg-red-200/80 text-red-800 px-2 py-0.5 rounded-full font-semibold">Limpeza Total</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Exclui permanentemente todos os registros da coleção <code>materiais</code> e <code>movimentacoesMateriais</code> no Cloud Firestore. Indicado para iniciar a gestão de estoque do zero absoluto.
                </p>
                <button
                  disabled={processando || materiais.length === 0}
                  onClick={async () => {
                    const ok = window.confirm(
                      'ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE todos os materiais cadastrados e o histórico de movimentações? Esta ação não pode ser desfeita.'
                    );
                    if (!ok) return;
                    try {
                      setProcessando(true);
                      if (onZerarTodosMateriais) {
                        await onZerarTodosMateriais();
                      }
                      setModalZerarAberto(false);
                    } catch (err: any) {
                      alert(err.message || 'Erro ao excluir materiais.');
                    } finally {
                      setProcessando(false);
                    }
                  }}
                  className="w-full mt-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{processando ? 'Processando...' : 'Excluir Todos os Materiais do Banco'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalZerarAberto(false)}
                disabled={processando}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
