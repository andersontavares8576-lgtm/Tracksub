import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building2,
  Warehouse,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  Printer,
} from 'lucide-react';
import { InventarioFisico, Subestacao, Almoxarifado, ItemInventario } from '../types/tracksub.ts';
import { formatarDataHora } from '../utils/formatters.ts';

interface InventarioViewProps {
  inventarios: InventarioFisico[];
  subestacoes: Subestacao[];
  almoxarifados: Almoxarifado[];
  onCriarInventario: (payload: { tipoLocal: 'subestacao' | 'almoxarifado'; localId: string; observacaoGeral?: string }) => Promise<void>;
  onRegistrarContagem: (invId: string, itemId: string, quantidadeContada: number, observacao?: string) => Promise<void>;
  onAprovarInventario: (invId: string) => Promise<void>;
}

export const InventarioView: React.FC<InventarioViewProps> = ({
  inventarios,
  subestacoes,
  almoxarifados,
  onCriarInventario,
  onRegistrarContagem,
  onAprovarInventario,
}) => {
  const [inventarioSelecionadoId, setInventarioSelecionadoId] = useState<string>(inventarios[0]?.id || '');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [tipoLocal, setTipoLocal] = useState<'subestacao' | 'almoxarifado'>('subestacao');
  const [localId, setLocalId] = useState<string>(subestacoes[0]?.id || '');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  const inventarioAtivo = inventarios.find((i) => i.id === inventarioSelecionadoId) || inventarios[0];

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await onCriarInventario({ tipoLocal, localId, observacaoGeral });
      setModalNovoAberto(false);
      setObservacaoGeral('');
    } catch (err: any) {
      alert(err.message || 'Erro ao abrir inventário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarContagem = async (itemId: string, novaQtd: number, obs?: string) => {
    if (!inventarioAtivo) return;
    try {
      await onRegistrarContagem(inventarioAtivo.id, itemId, novaQtd, obs);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar contagem.');
    }
  };

  const handleAprovar = async () => {
    if (!inventarioAtivo) return;
    const confirmou = window.confirm(
      `Deseja realmente homologar o inventário ${inventarioAtivo.codigo}? Os ajustes de saldo e divergências identificadas serão aplicados automaticamente ao estoque com registro em auditoria.`
    );
    if (!confirmou) return;

    try {
      await onAprovarInventario(inventarioAtivo.id);
      alert('Inventário aprovado com sucesso! Saldos ajustados e registrados na auditoria.');
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar inventário.');
    }
  };

  const totalItens = inventarioAtivo?.itens?.length || 0;
  const totalExatos = inventarioAtivo?.itens?.filter((i) => i.statusDivergencia === 'Exato')?.length || 0;
  const totalFaltas = inventarioAtivo?.itens?.filter((i) => i.statusDivergencia === 'Falta')?.length || 0;
  const totalSobras = inventarioAtivo?.itens?.filter((i) => i.statusDivergencia === 'Sobra')?.length || 0;

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventário Físico e Auditoria de Estoque</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              Conferência Periódica
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Contagem física de ativos e materiais, apuração de sobras e faltas, e homologação auditada
          </p>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Iniciar Novo Inventário</span>
        </button>
      </div>

      {/* Seleção do Inventário Ativo */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {inventarios.map((inv) => {
          const selecionado = inv.id === inventarioAtivo?.id;
          return (
            <button
              key={inv.id}
              onClick={() => setInventarioSelecionadoId(inv.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 border ${
                selecionado
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${selecionado ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{inv.codigo} • {inv.localNome}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                  inv.status === 'Aprovado' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
                }`}
              >
                {inv.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Painel do Inventário Selecionado */}
      {inventarioAtivo ? (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-black text-slate-900">
                    {inventarioAtivo.codigo}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      inventarioAtivo.status === 'Aprovado'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {inventarioAtivo.status}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Local: {inventarioAtivo.localNome}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-3">
                  <span>Responsável: <strong>{inventarioAtivo.responsavelNome}</strong></span>
                  <span>•</span>
                  <span>Iniciado em: {formatarDataHora(inventarioAtivo.dataCriacao)}</span>
                </div>
              </div>

              {/* Botão de Homologação */}
              {inventarioAtivo.status !== 'Aprovado' && (
                <button
                  onClick={handleAprovar}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Homologar e Ajustar Estoque</span>
                </button>
              )}
            </div>

            {/* Métricas de Divergência */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total de Itens</span>
                <span className="text-xl font-black text-slate-900">{totalItens}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Conformes (Exatos)</span>
                <span className="text-xl font-black text-emerald-700">{totalExatos}</span>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                <span className="text-[10px] font-bold text-red-700 uppercase block">Divergências de Falta</span>
                <span className="text-xl font-black text-red-700">{totalFaltas}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Divergências de Sobra</span>
                <span className="text-xl font-black text-blue-700">{totalSobras}</span>
              </div>
            </div>

            {inventarioAtivo.observacaoGeral && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                "{inventarioAtivo.observacaoGeral}"
              </p>
            )}
          </div>

          {/* Tabela de Contagem */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">
                Lista de Conferência Física dos Itens
              </span>
              <span className="text-xs text-slate-400">
                Altere os valores contados e confira a divergência
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
                    <th className="py-3 px-4">Código / Tipo</th>
                    <th className="py-3 px-4">Descrição do Ativo / Material</th>
                    <th className="py-3 px-4 text-center">Esperado Sistema</th>
                    <th className="py-3 px-4 text-center">Contagem Física</th>
                    <th className="py-3 px-4 text-center">Diferença</th>
                    <th className="py-3 px-4">Status / Justificativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventarioAtivo.itens.map((item) => {
                    return (
                      <tr key={item.itemId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900">{item.codigo}</span>
                          <span className="block text-[10px] text-slate-500 uppercase">{item.itemTipo}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{item.descricao}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                          {item.quantidadeEsperada}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {inventarioAtivo.status === 'Aprovado' ? (
                            <span className="font-black text-slate-900">{item.quantidadeContada}</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={item.quantidadeContada}
                              onChange={(e) =>
                                handleAtualizarContagem(item.itemId, Number(e.target.value), item.observacao)
                              }
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`font-black ${
                              item.diferenca === 0
                                ? 'text-emerald-700'
                                : item.diferenca > 0
                                ? 'text-blue-700'
                                : 'text-red-700'
                            }`}
                          >
                            {item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.statusDivergencia === 'Exato'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.statusDivergencia === 'Sobra'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.statusDivergencia}
                          </span>
                          {item.observacao && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {item.observacao}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">Nenhum inventário físico em andamento</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inicie uma contagem física para conferência de ativos elétricos e saldos de materiais nos almoxarifados ou subestações.
            </p>
          </div>
          <button
            onClick={() => setModalNovoAberto(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Iniciar Primeiro Inventário</span>
          </button>
        </div>
      )}

      {/* Modal Abertura de Novo Inventário */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Iniciar Novo Inventário Físico</h3>
              <button onClick={() => setModalNovoAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Local</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoLocal('subestacao');
                      setLocalId(subestacoes[0]?.id || '');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      tipoLocal === 'subestacao'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Subestação
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoLocal('almoxarifado');
                      setLocalId(almoxarifados[0]?.id || '');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      tipoLocal === 'almoxarifado'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Almoxarifado
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Selecione o Local *
                </label>
                <select
                  value={localId}
                  onChange={(e) => setLocalId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                >
                  {tipoLocal === 'subestacao'
                    ? subestacoes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))
                    : almoxarifados.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações e Justificativa
                </label>
                <textarea
                  value={observacaoGeral}
                  onChange={(e) => setObservacaoGeral(e.target.value)}
                  rows={2}
                  placeholder="Ex: Auditoria trimestral de fechamento ou contagem de rotina..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  {salvando ? 'Criando...' : 'Iniciar Inventário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
