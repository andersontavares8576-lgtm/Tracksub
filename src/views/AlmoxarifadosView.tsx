import React, { useState } from 'react';
import { Warehouse, Plus, Building2, Boxes, Cpu, X, User } from 'lucide-react';
import { Almoxarifado, Material, Equipamento, Subestacao } from '../types/tracksub.ts';

interface AlmoxarifadosViewProps {
  almoxarifados: Almoxarifado[];
  materiais: Material[];
  equipamentos: Equipamento[];
  subestacoes: Subestacao[];
  onSalvarAlmoxarifado: (almox: Partial<Almoxarifado>) => Promise<void>;
}

export const AlmoxarifadosView: React.FC<AlmoxarifadosViewProps> = ({
  almoxarifados,
  materiais,
  equipamentos,
  subestacoes,
  onSalvarAlmoxarifado,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<Almoxarifado['tipo']>('Avançado de Subestação');
  const [responsavel, setResponsavel] = useState('Marcos Vinícius Ribeiro');
  const [localizacao, setLocalizacao] = useState('');
  const [subestacaoId, setSubestacaoId] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      setSalvando(true);
      const se = subestacoes.find((s) => s.id === subestacaoId);
      await onSalvarAlmoxarifado({
        codigo: codigo.trim() || `ALM-${Math.floor(10 + Math.random() * 90)}`,
        nome: nome.trim(),
        tipo,
        responsavel: responsavel.trim(),
        localizacao: localizacao.trim(),
        subestacaoId: subestacaoId || undefined,
        subestacaoNome: se?.nome || undefined,
        ativo: true,
      });
      setModalAberto(false);
      setNome('');
      setLocalizacao('');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar almoxarifado.');
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Almoxarifados e Centros de Distribuição</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              {almoxarifados.length} Locais Ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Depósitos centrais, avançados em subestações e oficinas técnicas de calibração
          </p>
        </div>

        <button
          onClick={() => {
            setCodigo(`ALM-${Math.floor(10 + Math.random() * 90)}`);
            setModalAberto(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Almoxarifado</span>
        </button>
      </div>

      {/* Grade de Almoxarifados */}
      {almoxarifados.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Warehouse className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">Nenhum almoxarifado cadastrado</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Cadastre depósitos centrais, almoxarifados avançados em subestações ou oficinas de manutenção de ativos.
            </p>
          </div>
          <button
            onClick={() => {
              setCodigo(`ALM-${Math.floor(10 + Math.random() * 90)}`);
              setModalAberto(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Almoxarifado</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {almoxarifados.map((alm) => {
            const matsDoAlm = materiais.filter((m) => m.almoxarifadoId === alm.id);
            const eqpsDoAlm = equipamentos.filter((e) => e.almoxarifadoId === alm.id);
            const saldoTotal = matsDoAlm.reduce((acc, m) => acc + m.quantidadeFisica, 0);

            return (
              <div
                key={alm.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {alm.codigo}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {alm.tipo}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{alm.nome}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{alm.localizacao}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Responsável Técnico: <strong>{alm.responsavel}</strong></span>
                  </div>
                </div>

                {/* Indicadores do Almoxarifado */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Materiais Distintos</span>
                    <span className="font-black text-slate-900 text-sm">{matsDoAlm.length}</span>
                    <span className="text-[10px] text-slate-500 block">({saldoTotal} itens no saldo)</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipamentos Sobressalentes</span>
                    <span className="font-black text-blue-700 text-sm">{eqpsDoAlm.length}</span>
                    <span className="text-[10px] text-slate-500 block">em estoque</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Novo Almoxarifado</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Almoxarifado *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Almoxarifado Avançado SE Caxias"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as Almoxarifado['tipo'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Avançado de Subestação">Avançado de Subestação</option>
                  <option value="Principal">Principal Central</option>
                  <option value="Oficina Central">Oficina Central</option>
                  <option value="Laboratório de Ensaios">Laboratório de Ensaios</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Responsável</label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Localização Física</label>
                <input
                  type="text"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  placeholder="Ex: Galpão 02, Prédio de Comando..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Salvar Almoxarifado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
