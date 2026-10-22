import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Zap,
  Grid3X3,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Subestacao, Painel, Equipamento } from '../types/tracksub.ts';

interface SubestacoesViewProps {
  subestacoes: Subestacao[];
  paineis: Painel[];
  equipamentos: Equipamento[];
  onSalvarSubestacao: (sub: Partial<Subestacao>) => Promise<void>;
  onExcluirSubestacao?: (id: string) => Promise<void>;
}

export const SubestacoesView: React.FC<SubestacoesViewProps> = ({
  subestacoes,
  paineis,
  equipamentos,
  onSalvarSubestacao,
  onExcluirSubestacao,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [subEditando, setSubEditando] = useState<Subestacao | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tensaoPrimaria, setTensaoPrimaria] = useState('230 kV');
  const [tensaoSecundaria, setTensaoSecundaria] = useState('69 kV');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('RS');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  const abrirModal = (sub?: Subestacao) => {
    if (sub) {
      setSubEditando(sub);
      setCodigo(sub.codigo);
      setNome(sub.nome);
      setTensaoPrimaria(sub.tensaoPrimaria);
      setTensaoSecundaria(sub.tensaoSecundaria);
      setEndereco(sub.endereco);
      setCidade(sub.cidade);
      setUf(sub.uf);
      setObservacoes(sub.observacoes || '');
    } else {
      setSubEditando(null);
      setCodigo(`SE-${Math.floor(10 + Math.random() * 90)}`);
      setNome('');
      setTensaoPrimaria('230 kV');
      setTensaoSecundaria('69 kV');
      setEndereco('');
      setCidade('Porto Alegre');
      setUf('RS');
      setObservacoes('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    try {
      setSalvando(true);
      await onSalvarSubestacao({
        id: subEditando?.id,
        codigo,
        nome,
        tensaoPrimaria,
        tensaoSecundaria,
        endereco,
        cidade,
        uf,
        observacoes,
      });
      setModalAberto(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar subestação.');
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Subestações Elétricas</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {subestacoes.length} Unidades
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro de subestações de alta e extra-alta tensão, endereçamento e capacidade
          </p>
        </div>

        <button
          onClick={() => abrirModal()}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Subestação</span>
        </button>
      </div>

      {/* Grade de Subestações */}
      {subestacoes.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-slate-900">
              Nenhuma Subestação Cadastrada
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inicie cadastrando a primeira subestação da sua concessionária para estruturar painéis, cubículos e vincular equipamentos elétricos.
            </p>
          </div>
          <button
            onClick={() => abrirModal()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Subestação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subestacoes.map((sub) => {
          const paineisDaSE = paineis.filter((p) => p.subestacaoId === sub.id);
          const equipamentosDaSE = equipamentos.filter((e) => e.subestacaoId === sub.id);

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {sub.codigo}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Ativa
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => abrirModal(sub)}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar Subestação"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onExcluirSubestacao && (
                      <button
                        onClick={async () => {
                          if (confirm(`Deseja realmente excluir a subestação "${sub.nome}"? Painéis e módulos vinculados também serão removidos.`)) {
                            await onExcluirSubestacao(sub.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir Subestação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {sub.nome}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-slate-800">
                      {sub.tensaoPrimaria} / {sub.tensaoSecundaria}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium">{sub.endereco}</span>
                    <span className="text-slate-400 text-[11px]">{sub.cidade} - {sub.uf}</span>
                  </div>
                </div>

                {sub.observacoes && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic">
                    "{sub.observacoes}"
                  </p>
                )}
              </div>

              {/* Métricas da Subestação */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Painéis</span>
                  <span className="font-black text-slate-900 text-sm">{paineisDaSE.length}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipamentos</span>
                  <span className="font-black text-blue-700 text-sm">{equipamentosDaSE.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-base">
                  {subEditando ? 'Editar Subestação' : 'Cadastrar Subestação'}
                </h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código *</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tensão Primária</label>
                  <input
                    type="text"
                    value={tensaoPrimaria}
                    onChange={(e) => setTensaoPrimaria(e.target.value)}
                    placeholder="Ex: 230 kV"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Subestação *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Subestação Porto Alegre Norte"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UF</label>
                  <input
                    type="text"
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase text-center outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Av. Assis Brasil, 8200..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações Técnicas</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {subEditando && onExcluirSubestacao ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Deseja realmente excluir a subestação "${subEditando.nome}"? Painéis e módulos vinculados também serão removidos.`)) {
                        await onExcluirSubestacao(subEditando.id);
                        setModalAberto(false);
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    {salvando ? 'Salvando...' : 'Salvar Subestação'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
