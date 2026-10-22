import React, { useState, useEffect } from 'react';
import { X, ClipboardList, AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import {
  OrdemServico,
  Subestacao,
  Painel,
  Equipamento,
  Material,
  PrioridadeOS,
  StatusOS,
  MaterialRequisitadoOS,
} from '../../types/tracksub.ts';

interface ModalOrdemServicoProps {
  osParaEditar: OrdemServico | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (os: Partial<OrdemServico>) => Promise<void>;
  subestacoes: Subestacao[];
  paineis: Painel[];
  equipamentos: Equipamento[];
  materiais: Material[];
}

export const ModalOrdemServico: React.FC<ModalOrdemServicoProps> = ({
  osParaEditar,
  aberto,
  onFechar,
  onSalvar,
  subestacoes,
  paineis,
  equipamentos,
  materiais,
}) => {
  const [titulo, setTitulo] = useState('');
  const [subestacaoId, setSubestacaoId] = useState('');
  const [painelId, setPainelId] = useState('');
  const [equipamentoId, setEquipamentoId] = useState('');
  const [descricaoServico, setDescricaoServico] = useState('');
  const [tipoManutencao, setTipoManutencao] = useState<OrdemServico['tipoManutencao']>('Preventiva');
  const [prioridade, setPrioridade] = useState<PrioridadeOS>('Média');
  const [status, setStatus] = useState<StatusOS>('Aberta');
  const [responsavelNome, setResponsavelNome] = useState('Carlos Eduardo Silveira');
  const [equipeExecutora, setEquipeExecutora] = useState('Equipe Técnica de Proteção');
  const [prazoLimite, setPrazoLimite] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [materiaisRequisitados, setMateriaisRequisitados] = useState<MaterialRequisitadoOS[]>([]);
  const [materialSelecionadoId, setMaterialSelecionadoId] = useState('');
  const [qtdMaterial, setQtdMaterial] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setErro(null);
      if (osParaEditar) {
        setTitulo(osParaEditar.titulo);
        setSubestacaoId(osParaEditar.subestacaoId);
        setPainelId(osParaEditar.painelId || '');
        setEquipamentoId(osParaEditar.equipamentoId || '');
        setDescricaoServico(osParaEditar.descricaoServico);
        setTipoManutencao(osParaEditar.tipoManutencao);
        setPrioridade(osParaEditar.prioridade);
        setStatus(osParaEditar.status);
        setResponsavelNome(osParaEditar.responsavelNome);
        setEquipeExecutora(osParaEditar.equipeExecutora);
        setPrazoLimite(osParaEditar.prazoLimite);
        setObservacoes(osParaEditar.observacoes);
        setMateriaisRequisitados(osParaEditar.materiaisRequisitados || []);
      } else {
        setTitulo('');
        setSubestacaoId(subestacoes[0]?.id || '');
        setPainelId('');
        setEquipamentoId('');
        setDescricaoServico('');
        setTipoManutencao('Preventiva');
        setPrioridade('Média');
        setStatus('Aberta');
        setResponsavelNome('Carlos Eduardo Silveira');
        setEquipeExecutora('Equipe Técnica de Proteção');
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setPrazoLimite(d.toISOString().split('T')[0]);
        setObservacoes('');
        setMateriaisRequisitados([]);
      }
    }
  }, [aberto, osParaEditar, subestacoes]);

  if (!aberto) return null;

  const paineisFiltrados = paineis.filter((p) => p.subestacaoId === subestacaoId);
  const equipamentosFiltrados = equipamentos.filter((e) => !subestacaoId || e.subestacaoId === subestacaoId);

  const handleAdicionarMaterial = () => {
    if (!materialSelecionadoId) return;
    const mat = materiais.find((m) => m.id === materialSelecionadoId);
    if (!mat) return;

    const jaTem = materiaisRequisitados.find((m) => m.materialId === mat.id);
    if (jaTem) {
      setMateriaisRequisitados(
        materiaisRequisitados.map((m) =>
          m.materialId === mat.id ? { ...m, quantidade: m.quantidade + qtdMaterial } : m
        )
      );
    } else {
      setMateriaisRequisitados([
        ...materiaisRequisitados,
        {
          materialId: mat.id,
          descricao: mat.descricao,
          quantidade: qtdMaterial,
          unidade: mat.unidadeMedida,
          reservado: true,
          consumido: false,
        },
      ]);
    }

    setMaterialSelecionadoId('');
    setQtdMaterial(1);
  };

  const handleRemoverMaterial = (materialId: string) => {
    setMateriaisRequisitados(materiaisRequisitados.filter((m) => m.materialId !== materialId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!titulo.trim() || !subestacaoId || !descricaoServico.trim()) {
      setErro('Preencha os campos obrigatórios (*).');
      return;
    }

    try {
      setSalvando(true);
      const se = subestacoes.find((s) => s.id === subestacaoId);
      const pnl = paineis.find((p) => p.id === painelId);
      const eqp = equipamentos.find((e) => e.id === equipamentoId);

      await onSalvar({
        id: osParaEditar ? osParaEditar.id : undefined,
        titulo: titulo.trim(),
        subestacaoId,
        subestacaoNome: se?.nome || 'Subestação',
        painelId: painelId || undefined,
        painelNome: pnl?.identificacao || undefined,
        equipamentoId: equipamentoId || undefined,
        equipamentoNome: eqp ? `${eqp.descricao} (${eqp.codigoPatrimonial})` : undefined,
        descricaoServico: descricaoServico.trim(),
        tipoManutencao,
        prioridade,
        status,
        responsavelNome: responsavelNome.trim(),
        equipeExecutora: equipeExecutora.trim(),
        prazoLimite,
        materiaisRequisitados,
        observacoes: observacoes.trim(),
      });
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar ordem de serviço.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base">
                {osParaEditar ? `Editar ${osParaEditar.numero}` : 'Abertura de Ordem de Serviço'}
              </h3>
              <p className="text-xs text-slate-400">
                Manutenção preventiva, corretiva e comissionamento em subestações
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

        {/* Formulário com scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título da Ordem de Serviço *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Substituição e Comissionamento de Relé de Proteção Diferencial TR-01"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subestação *
              </label>
              <select
                value={subestacaoId}
                onChange={(e) => {
                  setSubestacaoId(e.target.value);
                  setPainelId('');
                  setEquipamentoId('');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                {subestacoes.length === 0 ? (
                  <option value="">Nenhuma subestação cadastrada</option>
                ) : (
                  <>
                    <option value="">Selecione uma subestação...</option>
                    {subestacoes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Painel / Cubículo
              </label>
              <select
                value={painelId}
                onChange={(e) => setPainelId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Nenhum painel específico</option>
                {paineisFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.identificacao}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Equipamento Alvo
              </label>
              <select
                value={equipamentoId}
                onChange={(e) => setEquipamentoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Nenhum equipamento específico</option>
                {equipamentosFiltrados.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.codigoPatrimonial} - {eq.descricao.substring(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Manutenção
              </label>
              <select
                value={tipoManutencao}
                onChange={(e) => setTipoManutencao(e.target.value as OrdemServico['tipoManutencao'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Preventiva">Preventiva Programada</option>
                <option value="Corretiva">Corretiva de Emergência</option>
                <option value="Preditiva">Preditiva / Termografia</option>
                <option value="Comissionamento">Comissionamento de Obra</option>
                <option value="Ensaio Periódico">Ensaio e Aferição Periódica</option>
                <option value="Instalação / Ampliação">Instalação / Ampliação</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeOS)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Emergencial">Emergencial (Risco de Desligamento)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusOS)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Aberta">Aberta</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aguardando Peças">Aguardando Peças</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição Detalhada do Serviço *
            </label>
            <textarea
              value={descricaoServico}
              onChange={(e) => setDescricaoServico(e.target.value)}
              rows={3}
              placeholder="Descreva passo a passo o procedimento técnico, normas de segurança e escopo da intervenção..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Técnico / Responsável
              </label>
              <input
                type="text"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Equipe Executora
              </label>
              <input
                type="text"
                value={equipeExecutora}
                onChange={(e) => setEquipeExecutora(e.target.value)}
                placeholder="Ex: Equipe Alfa, Tercerizada X"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prazo Limite para Execução
              </label>
              <input
                type="date"
                value={prazoLimite}
                onChange={(e) => setPrazoLimite(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Seção de Materiais Necessários e Reserva */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Materiais e Peças Necessárias para a OS
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={materialSelecionadoId}
                onChange={(e) => setMaterialSelecionadoId(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um material do estoque...</option>
                {materiais.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigoInterno} - {m.descricao} (Disponível: {m.quantidadeDisponivel} {m.unidadeMedida})
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={qtdMaterial}
                  onChange={(e) => setQtdMaterial(Number(e.target.value))}
                  className="w-20 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                  placeholder="Qtd"
                />
                <button
                  type="button"
                  onClick={handleAdicionarMaterial}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Lista de itens requisitados */}
            {materiaisRequisitados.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {materiaisRequisitados.map((item) => (
                  <div
                    key={item.materialId}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{item.descricao}</span>
                      <span className="text-slate-500 ml-2">
                        {item.quantidade} {item.unidade}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          item.consumido
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.consumido ? 'Baixado no Estoque' : 'Reservado'}
                      </span>
                      {!item.consumido && (
                        <button
                          type="button"
                          onClick={() => handleRemoverMaterial(item.materialId)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{osParaEditar ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
