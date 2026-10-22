import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Material, OrdemServico, TipoOperacaoMaterial } from '../../types/tracksub.ts';

interface ModalMovimentacaoMaterialProps {
  material: Material | null;
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (payload: {
    materialId: string;
    tipoOperacao: TipoOperacaoMaterial;
    quantidade: number;
    origem: string;
    destino: string;
    motivo: string;
    documentoReferencia?: string;
    ordemServicoId?: string;
  }) => Promise<void>;
  ordensServico: OrdemServico[];
}

export const ModalMovimentacaoMaterial: React.FC<ModalMovimentacaoMaterialProps> = ({
  material,
  aberto,
  onFechar,
  onConfirmar,
  ordensServico,
}) => {
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacaoMaterial>('Entrada por Compra');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [documentoReferencia, setDocumentoReferencia] = useState('');
  const [ordemServicoId, setOrdemServicoId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto || !material) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (quantidade <= 0) {
      setErro('A quantidade deve ser maior do que zero.');
      return;
    }

    if (!motivo.trim()) {
      setErro('Preencha os campos obrigatórios: informe o motivo da operação.');
      return;
    }

    // Validação preventiva de saldo insuficiente no cliente
    const ehSaida = tipoOperacao === 'Saída para Manutenção' || tipoOperacao === 'Consumo em Ordem de Serviço';
    if (ehSaida && quantidade > material.quantidadeDisponivel) {
      setErro(
        `Estoque insuficiente para esta operação! Saldo disponível atual: ${material.quantidadeDisponivel} ${material.unidadeMedida}. Quantidade requisitada: ${quantidade} ${material.unidadeMedida}.`
      );
      return;
    }

    try {
      setSalvando(true);
      await onConfirmar({
        materialId: material.id,
        tipoOperacao,
        quantidade: Number(quantidade),
        origem: origem.trim() || material.almoxarifadoNome,
        destino: destino.trim() || 'Subestação / Aplicação em Campo',
        motivo: motivo.trim(),
        documentoReferencia: documentoReferencia.trim() || undefined,
        ordemServicoId: ordemServicoId || undefined,
      });
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao movimentar material.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base">Movimentação de Estoque</h3>
              <p className="text-xs text-slate-400">
                {material.codigoInterno} • {material.descricao}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Saldo Atual */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs">
            <div>
              <span className="text-slate-500 block">Saldo Físico</span>
              <span className="font-bold text-slate-800 text-sm">
                {material.quantidadeFisica} {material.unidadeMedida}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Reservado</span>
              <span className="font-bold text-amber-700 text-sm">
                {material.quantidadeReservada} {material.unidadeMedida}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Disponível</span>
              <span className="font-bold text-emerald-700 text-sm">
                {material.quantidadeDisponivel} {material.unidadeMedida}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tipo de Operação *
            </label>
            <select
              value={tipoOperacao}
              onChange={(e) => setTipoOperacao(e.target.value as TipoOperacaoMaterial)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="Entrada por Compra">Entrada por Compra (Nota Fiscal)</option>
              <option value="Entrada por Devolução">Entrada por Devolução de Obra</option>
              <option value="Saída para Manutenção">Saída para Manutenção</option>
              <option value="Consumo em Ordem de Serviço">Consumo em Ordem de Serviço</option>
              <option value="Reserva de Materiais">Reserva de Materiais</option>
              <option value="Transferência entre Almoxarifados">Transferência entre Almoxarifados</option>
              <option value="Devolução ao Estoque">Devolução ao Estoque</option>
              <option value="Estorno">Estorno de Operação Anterior</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantidade ({material.unidadeMedida}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Doc. / NF-e
              </label>
              <input
                type="text"
                value={documentoReferencia}
                onChange={(e) => setDocumentoReferencia(e.target.value)}
                placeholder="Ex: NF-e 88102, Guia REM-09"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {tipoOperacao === 'Consumo em Ordem de Serviço' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ordem de Serviço Vinculada
              </label>
              <select
                value={ordemServicoId}
                onChange={(e) => setOrdemServicoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecione a Ordem de Serviço</option>
                {ordensServico.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.numero} - {os.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Origem</label>
              <input
                type="text"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                placeholder={material.almoxarifadoNome}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destino</label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="SE Porto Alegre Norte / Painel P02"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Motivo e Justificativa *
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Aplicação em manutenção preventiva de conexões de alta tensão..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
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
                <span>Atualizando Estoque...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Movimentação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
