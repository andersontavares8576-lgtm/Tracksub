import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Plus,
  Building2,
  Cpu,
  Layers,
  CheckCircle2,
  X,
  Server,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Subestacao, Painel, Modulo, Equipamento } from '../types/tracksub.ts';

interface PaineisModulosViewProps {
  subestacoes: Subestacao[];
  paineis: Painel[];
  modulos: Modulo[];
  equipamentos: Equipamento[];
  onSalvarPainel: (painel: Partial<Painel>) => Promise<void>;
  onSalvarModulo: (modulo: Partial<Modulo>) => Promise<void>;
  onExcluirPainel?: (id: string) => Promise<void>;
  onExcluirModulo?: (id: string) => Promise<void>;
  onAbrirFichaEquipamento: (eqp: Equipamento) => void;
  onNavegarSubestacoes?: () => void;
}

export const PaineisModulosView: React.FC<PaineisModulosViewProps> = ({
  subestacoes,
  paineis,
  modulos,
  equipamentos,
  onSalvarPainel,
  onSalvarModulo,
  onExcluirPainel,
  onExcluirModulo,
  onAbrirFichaEquipamento,
  onNavegarSubestacoes,
}) => {
  const [subestacaoAtivaId, setSubestacaoAtivaId] = useState<string>(subestacoes[0]?.id || '');

  useEffect(() => {
    if (subestacoes.length > 0 && (!subestacaoAtivaId || !subestacoes.some(s => s.id === subestacaoAtivaId))) {
      setSubestacaoAtivaId(subestacoes[0].id);
    }
  }, [subestacoes, subestacaoAtivaId]);
  const [modalPainelAberto, setModalPainelAberto] = useState(false);
  const [codigoPainel, setCodigoPainel] = useState('');
  const [identificacaoPainel, setIdentificacaoPainel] = useState('');
  const [funcaoPainel, setFuncaoPainel] = useState('Proteção e Controle');
  const [tensaoPainel, setTensaoPainel] = useState('230 kV');
  const [salvando, setSalvando] = useState(false);

  const subestacaoAtual = subestacoes.find((s) => s.id === subestacaoAtivaId) || subestacoes[0];
  const paineisDaSE = paineis.filter((p) => p.subestacaoId === subestacaoAtivaId);

  const handleSalvarPainel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificacaoPainel.trim()) return;

    try {
      setSalvando(true);
      await onSalvarPainel({
        subestacaoId: subestacaoAtivaId,
        codigo: codigoPainel.trim() || `PNL-${Math.floor(10 + Math.random() * 90)}`,
        identificacao: identificacaoPainel.trim(),
        funcao: funcaoPainel,
        tensao: tensaoPainel,
        tipo: 'Painel Autoportante de Proteção e Controle',
        ativo: true,
      });
      setModalPainelAberto(false);
      setIdentificacaoPainel('');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar painel.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Painéis e Módulos</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              Hierarquia Física
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empresa → Subestação → Painel / Módulo → Equipamentos Associados
          </p>
        </div>

        <button
          onClick={() => {
            if (subestacoes.length === 0) {
              if (onNavegarSubestacoes) onNavegarSubestacoes();
              return;
            }
            setCodigoPainel(`PNL-${Math.floor(10 + Math.random() * 90)}`);
            setModalPainelAberto(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{subestacoes.length === 0 ? 'Cadastrar Subestação Primeiro' : 'Novo Painel nesta Subestação'}</span>
        </button>
      </div>

      {/* Abas de Seleção de Subestação */}
      {subestacoes.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Nenhuma Subestação Cadastrada no Momento
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Para cadastrar e organizar painéis, cubículos e módulos de bastidor, cadastre primeiro sua subestação no módulo "Subestações".
          </p>
          {onNavegarSubestacoes && (
            <button
              onClick={onNavegarSubestacoes}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ir para Subestações</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {subestacoes.map((sub) => {
              const ativa = sub.id === subestacaoAtivaId;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSubestacaoAtivaId(sub.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 border ${
                    ativa
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${ativa ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{sub.nome}</span>
                </button>
              );
            })}
          </div>

      {/* Lista de Painéis da Subestação Selecionada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paineisDaSE.length === 0 ? (
          <div className="col-span-2 bg-white p-8 text-center text-slate-500 text-xs rounded-2xl border border-slate-200">
            Nenhum painel cadastrado nesta subestação. Clique em "Novo Painel nesta Subestação" para adicionar.
          </div>
        ) : (
          paineisDaSE.map((painel) => {
            const modulosDoPainel = modulos.filter((m) => m.painelId === painel.id);
            const equipamentosDoPainel = equipamentos.filter((e) => e.painelId === painel.id);

            return (
              <div
                key={painel.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {painel.codigo}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {painel.tensao}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {equipamentosDoPainel.length} eqp
                    </span>
                    {onExcluirPainel && (
                      <button
                        onClick={async () => {
                          if (confirm(`Deseja excluir o painel "${painel.identificacao}"? Módulos vinculados também serão removidos.`)) {
                            await onExcluirPainel(painel.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir Painel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{painel.identificacao}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{painel.funcao} • {painel.tipo}</p>
                </div>

                {/* Lista de Equipamentos Alocados neste Painel */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Equipamentos Ocupantes:
                  </span>
                  {equipamentosDoPainel.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum equipamento instalado neste cubículo no momento.</p>
                  ) : (
                    equipamentosDoPainel.map((eqp) => (
                      <div
                        key={eqp.id}
                        onClick={() => onAbrirFichaEquipamento(eqp)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-blue-700">{eqp.codigoPatrimonial}</span>
                            <span className="font-semibold text-slate-800">{eqp.modelo}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{eqp.descricao}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                          {eqp.estadoOperacional}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </>
    )}

      {/* Modal Novo Painel */}
      {modalPainelAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Novo Painel / Cubículo</h3>
              <button onClick={() => setModalPainelAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPainel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subestação</label>
                <input
                  type="text"
                  value={subestacaoAtual?.nome || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código do Painel</label>
                <input
                  type="text"
                  value={codigoPainel}
                  onChange={(e) => setCodigoPainel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Identificação / Nome *</label>
                <input
                  type="text"
                  value={identificacaoPainel}
                  onChange={(e) => setIdentificacaoPainel(e.target.value)}
                  placeholder="Ex: Painel 03 - Vão de Entrada Linha 230kV"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Função</label>
                  <input
                    type="text"
                    value={funcaoPainel}
                    onChange={(e) => setFuncaoPainel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nível de Tensão</label>
                  <input
                    type="text"
                    value={tensaoPainel}
                    onChange={(e) => setTensaoPainel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalPainelAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar Painel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
