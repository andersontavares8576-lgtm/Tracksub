import React, { useState } from 'react';
import { Truck, Plus, Mail, Phone, MapPin, Building2, X } from 'lucide-react';
import { Fornecedor } from '../types/tracksub.ts';

interface FornecedoresViewProps {
  fornecedores: Fornecedor[];
  onSalvarFornecedor: (forn: Partial<Fornecedor>) => Promise<void>;
}

export const FornecedoresView: React.FC<FornecedoresViewProps> = ({
  fornecedores,
  onSalvarFornecedor,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contato, setContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [categoriaFornecimento, setCategoriaFornecimento] = useState('Relés, IEDs e Painéis');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim() || !nomeFantasia.trim()) return;

    try {
      setSalvando(true);
      await onSalvarFornecedor({
        razaoSocial: razaoSocial.trim(),
        nomeFantasia: nomeFantasia.trim(),
        cnpj: cnpj.trim(),
        contato: contato.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        endereco: endereco.trim(),
        categoriaFornecimento: categoriaFornecimento.trim(),
        ativo: true,
      });
      setModalAberto(false);
      setRazaoSocial('');
      setNomeFantasia('');
      setCnpj('');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar fornecedor.');
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fornecedores e Fabricantes Homologados</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {fornecedores.length} Cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empresas e fabricantes de relés de proteção, equipamentos de pátio e componentes de alta tensão
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Fornecedor</span>
        </button>
      </div>

      {/* Grade de Fornecedores */}
      {fornecedores.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <Truck className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">Nenhum fornecedor ou fabricante homologado</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Cadastre fornecedores de relés de proteção, equipamentos de pátio e componentes de subestações.
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Fornecedor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.map((forn) => (
            <div
              key={forn.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-base text-slate-900 leading-snug">
                  {forn.nomeFantasia}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Homologado
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                {forn.razaoSocial}
              </p>

              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                CNPJ: {forn.cnpj || 'Não informado'}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{forn.categoriaFornecimento}</span>
                </div>
                {forn.contato && (
                  <div className="text-slate-500 text-[11px]">
                    Contato: <strong>{forn.contato}</strong>
                  </div>
                )}
                {forn.telefone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{forn.telefone}</span>
                  </div>
                )}
                {forn.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{forn.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Novo Fabricante / Fornecedor</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Fantasia *</label>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Ex: SEL - Schweitzer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Schweitzer Engineering Laboratories Ltda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(19) 3515-2000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendas@fornecedor.com.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria de Fornecimento</label>
                <input
                  type="text"
                  value={categoriaFornecimento}
                  onChange={(e) => setCategoriaFornecimento(e.target.value)}
                  placeholder="Ex: Relés de proteção, chaves de aferição e TCs"
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
                  {salvando ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
