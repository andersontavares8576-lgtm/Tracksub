import React, { useState, useEffect } from 'react';
import { X, Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Material,
  Almoxarifado,
  Fornecedor,
  CategoriaMaterial,
  UnidadeMedida,
  TipoMaterial,
} from '../../types/tracksub.ts';

interface ModalMaterialProps {
  materialParaEditar: Material | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (mat: Partial<Material>) => Promise<void>;
  almoxarifados: Almoxarifado[];
  fornecedores: Fornecedor[];
}

const CATEGORIAS: CategoriaMaterial[] = [
  'Cabos e Condutores',
  'Conectores e Terminais',
  'Fusíveis e Proteção Auxiliar',
  'Componentes Eletrônicos',
  'Disjuntores Auxiliares',
  'Isolação e Vedação',
  'Peças Mecânicas',
  'Ferramentas',
  'Outros',
];

const UNIDADES: UnidadeMedida[] = ['un', 'metro', 'rolo', 'kg', 'cx', 'par', 'litro'];

export const ModalMaterial: React.FC<ModalMaterialProps> = ({
  materialParaEditar,
  aberto,
  onFechar,
  onSalvar,
  almoxarifados,
  fornecedores,
}) => {
  const [codigoInterno, setCodigoInterno] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaMaterial>('Cabos e Condutores');
  const [fabricante, setFabricante] = useState('Prysmian Cabos');
  const [referenciaModelo, setReferenciaModelo] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('un');
  const [quantidadeFisica, setQuantidadeFisica] = useState(10);
  const [estoqueMinimo, setEstoqueMinimo] = useState(5);
  const [estoqueMaximo, setEstoqueMaximo] = useState(50);
  const [custoUnitario, setCustoUnitario] = useState(25.0);
  const [fornecedorId, setFornecedorId] = useState('');
  const [almoxarifadoId, setAlmoxarifadoId] = useState('');
  const [prateleiraPosicao, setPrateleiraPosicao] = useState('Prateleira A-01');
  const [controleLote, setControleLote] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [validade, setValidade] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial>('Consumível');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setErro(null);
      if (materialParaEditar) {
        setCodigoInterno(materialParaEditar.codigoInterno);
        setDescricao(materialParaEditar.descricao);
        setCategoria(materialParaEditar.categoria);
        setFabricante(materialParaEditar.fabricante);
        setReferenciaModelo(materialParaEditar.referenciaModelo);
        setUnidadeMedida(materialParaEditar.unidadeMedida);
        setQuantidadeFisica(materialParaEditar.quantidadeFisica);
        setEstoqueMinimo(materialParaEditar.estoqueMinimo);
        setEstoqueMaximo(materialParaEditar.estoqueMaximo);
        setCustoUnitario(materialParaEditar.custoUnitario);
        setFornecedorId(materialParaEditar.fornecedorId);
        setAlmoxarifadoId(materialParaEditar.almoxarifadoId);
        setPrateleiraPosicao(materialParaEditar.prateleiraPosicao);
        setControleLote(materialParaEditar.controleLote || '');
        setNumeroSerie(materialParaEditar.numeroSerie || '');
        setValidade(materialParaEditar.validade || '');
        setTipoMaterial(materialParaEditar.tipoMaterial);
        setObservacoes(materialParaEditar.observacoes);
      } else {
        const rand = Math.floor(100 + Math.random() * 900);
        setCodigoInterno(`MAT-ELE-${rand}`);
        setDescricao('');
        setCategoria('Cabos e Condutores');
        setFabricante('Fabricante Homologado');
        setReferenciaModelo('');
        setUnidadeMedida('un');
        setQuantidadeFisica(10);
        setEstoqueMinimo(5);
        setEstoqueMaximo(50);
        setCustoUnitario(25.0);
        setFornecedorId(fornecedores[0]?.id || '');
        setAlmoxarifadoId(almoxarifados[0]?.id || '');
        setPrateleiraPosicao('Prateleira A-01');
        setControleLote('');
        setNumeroSerie('');
        setValidade('');
        setTipoMaterial('Consumível');
        setObservacoes('');
      }
    }
  }, [aberto, materialParaEditar, almoxarifados, fornecedores]);

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!codigoInterno.trim() || !descricao.trim() || !fabricante.trim()) {
      setErro('Preencha os campos obrigatórios (*).');
      return;
    }

    try {
      setSalvando(true);
      const forn = fornecedores.find((f) => f.id === fornecedorId);
      const alm = almoxarifados.find((a) => a.id === almoxarifadoId);

      await onSalvar({
        id: materialParaEditar ? materialParaEditar.id : undefined,
        codigoInterno: codigoInterno.trim().toUpperCase(),
        descricao: descricao.trim(),
        categoria,
        fabricante: fabricante.trim(),
        referenciaModelo: referenciaModelo.trim(),
        unidadeMedida,
        quantidadeFisica: Number(quantidadeFisica),
        estoqueMinimo: Number(estoqueMinimo),
        estoqueMaximo: Number(estoqueMaximo),
        custoUnitario: Number(custoUnitario),
        fornecedorId,
        fornecedorNome: forn?.nomeFantasia || 'Fornecedor Homologado',
        almoxarifadoId,
        almoxarifadoNome: alm?.nome || 'Almoxarifado Central',
        prateleiraPosicao: prateleiraPosicao.trim(),
        controleLote: controleLote.trim() || undefined,
        numeroSerie: numeroSerie.trim() || undefined,
        validade: validade || undefined,
        tipoMaterial,
        observacoes: observacoes.trim(),
      });
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar material.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <Boxes className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base">
                {materialParaEditar ? 'Editar Material / Peça' : 'Cadastrar Material / Peça'}
              </h3>
              <p className="text-xs text-slate-400">Controle de consumíveis, sobressalentes e ferramentas</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Código Interno *
              </label>
              <input
                type="text"
                value={codigoInterno}
                onChange={(e) => setCodigoInterno(e.target.value.toUpperCase())}
                placeholder="Ex: MAT-CAB-50CU"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaMaterial)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo do Item *
              </label>
              <select
                value={tipoMaterial}
                onChange={(e) => setTipoMaterial(e.target.value as TipoMaterial)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="Consumível">Consumível</option>
                <option value="Sobressalente">Sobressalente</option>
                <option value="Ferramenta Reutilizável">Ferramenta Reutilizável</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição do Material *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Cabo de Cobre Nu Eletrolítico 50 mm² para Aterramento"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fabricante *
              </label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                placeholder="Ex: Prysmian, Siemens, 3M, Intelli..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Referência / Modelo
              </label>
              <input
                type="text"
                value={referenciaModelo}
                onChange={(e) => setReferenciaModelo(e.target.value)}
                placeholder="Ex: CU-NU-50-NBR6524"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Quantidades e Estoque */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Parâmetros de Estoque e Valores
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Unidade de Medida
                </label>
                <select
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Saldo Físico Inicial *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantidadeFisica}
                  onChange={(e) => setQuantidadeFisica(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Estoque Mínimo *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Custo Unitário (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Almoxarifado
              </label>
              <select
                value={almoxarifadoId}
                onChange={(e) => setAlmoxarifadoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {almoxarifados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prateleira / Posição
              </label>
              <input
                type="text"
                value={prateleiraPosicao}
                onChange={(e) => setPrateleiraPosicao(e.target.value)}
                placeholder="Ex: Prateleira B-02 / Gaveta 03"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lote de Fabricação
              </label>
              <input
                type="text"
                value={controleLote}
                onChange={(e) => setControleLote(e.target.value)}
                placeholder="Ex: LT-2026-NEX-01"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-1.5"
            >
              {salvando ? (
                <span>Gravando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{materialParaEditar ? 'Atualizar Material' : 'Cadastrar Material'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
