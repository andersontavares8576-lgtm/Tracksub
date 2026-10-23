import React, { useState, useEffect, useMemo } from 'react';
import { X, Cpu, AlertTriangle, CheckCircle2, ShieldCheck, Info, UserCheck } from 'lucide-react';
import {
  Equipamento,
  Subestacao,
  Painel,
  Modulo,
  Almoxarifado,
  TipoEquipamento,
  EstadoConservacao,
  EstadoOperacional,
  CATEGORIAS_EQUIPAMENTOS,
  Usuario,
} from '../../types/tracksub.ts';

interface ModalCadastroEquipamentoProps {
  equipamentoParaEditar: Equipamento | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (eqp: Partial<Equipamento>) => Promise<void>;
  subestacoes: Subestacao[];
  paineis: Painel[];
  modulos: Modulo[];
  almoxarifados: Almoxarifado[];
  onSalvarModulo?: (modulo: Partial<Modulo>) => Promise<void>;
  usuarios?: Usuario[];
  usuarioAtual?: Usuario | null;
}

const FABRICANTES_SUGERIDOS = [
  'Kron Medidores',
  'Schneider Electric (PowerLogic)',
  'Siemens Energy',
  'ABB / Hitachi Energy',
  'SEL - Schweitzer Engineering Laboratories',
  'GE Grid Solutions',
  'WEG Automação',
  'RuggedCom / Siemens',
  'Moxa Industrial',
  'Cisco Industrial Networks',
  'Padtec Óptica',
  'Digitel Telecomunicações',
  'Keymile / DZS',
  'Doble Engineering',
  'Omicron Electronics',
  'Megger Instrumentos',
  'Arteche',
  'Eaton / Cooper Power Systems',
  'Furukawa Electric',
  'Toshiba T&D',
  'EFACEC',
];

export const ModalCadastroEquipamento: React.FC<ModalCadastroEquipamentoProps> = ({
  equipamentoParaEditar,
  aberto,
  onFechar,
  onSalvar,
  subestacoes,
  paineis,
  modulos,
  almoxarifados,
  onSalvarModulo,
  usuarios = [],
  usuarioAtual,
}) => {
  const [codigoPatrimonial, setCodigoPatrimonial] = useState('');
  const [tipo, setTipo] = useState<TipoEquipamento>('Relé de Proteção Multifunção');
  const [descricao, setDescricao] = useState('');
  const [fabricante, setFabricante] = useState('SEL - Schweitzer');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [subestacaoId, setSubestacaoId] = useState<string>('');
  const [painelId, setPainelId] = useState<string>('');
  const [moduloId, setModuloId] = useState<string>('');
  const [moduloTexto, setModuloTexto] = useState<string>('');
  const [almoxarifadoId, setAlmoxarifadoId] = useState<string>('');
  const [localizacaoDescricao, setLocalizacaoDescricao] = useState('');
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>('Novo');
  const [estadoOperacional, setEstadoOperacional] = useState<EstadoOperacional>('Sobressalente / Estoque');
  const [responsavel, setResponsavel] = useState('');
  const [responsavelManual, setResponsavelManual] = useState(false);
  const [dataRetirada, setDataRetirada] = useState('');
  const [dataInstalacao, setDataInstalacao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvandoModuloRapido, setSalvandoModuloRapido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setErro(null);
      if (equipamentoParaEditar) {
        setCodigoPatrimonial(equipamentoParaEditar.codigoPatrimonial);
        setTipo(equipamentoParaEditar.tipo);
        setDescricao(equipamentoParaEditar.descricao);
        setFabricante(equipamentoParaEditar.fabricante);
        setModelo(equipamentoParaEditar.modelo);
        setNumeroSerie(equipamentoParaEditar.numeroSerie);
        setSubestacaoId(equipamentoParaEditar.subestacaoId || '');
        setPainelId(equipamentoParaEditar.painelId || '');
        setModuloId(equipamentoParaEditar.moduloId || '');

        // Determinar texto inicial do Painel / Módulo unificado
        const modEncontrado = modulos.find((m) => m.id === equipamentoParaEditar.moduloId);
        const pnlEncontrado = paineis.find((p) => p.id === equipamentoParaEditar.painelId);
        let textoInicial = '';
        if (modEncontrado && pnlEncontrado && pnlEncontrado.identificacao !== modEncontrado.identificacao) {
          textoInicial = `${pnlEncontrado.identificacao} / ${modEncontrado.identificacao}`;
        } else if (modEncontrado) {
          textoInicial = modEncontrado.identificacao;
        } else if (equipamentoParaEditar.moduloId) {
          textoInicial = pnlEncontrado && pnlEncontrado.identificacao !== equipamentoParaEditar.moduloId
            ? `${pnlEncontrado.identificacao} / ${equipamentoParaEditar.moduloId}`
            : equipamentoParaEditar.moduloId;
        } else if (pnlEncontrado) {
          textoInicial = pnlEncontrado.identificacao;
        }

        setModuloTexto(textoInicial);
        setAlmoxarifadoId(equipamentoParaEditar.almoxarifadoId || '');
        setLocalizacaoDescricao(equipamentoParaEditar.localizacaoDescricao);
        setEstadoConservacao(equipamentoParaEditar.estadoConservacao);
        setEstadoOperacional(equipamentoParaEditar.estadoOperacional);
        const respExistente = equipamentoParaEditar.responsavel || '';
        setResponsavel(respExistente);
        const existeNosCadastrados = usuarios.some(
          (u) => u.nome.trim().toLowerCase() === respExistente.trim().toLowerCase()
        );
        setResponsavelManual(!existeNosCadastrados && respExistente.trim() !== '');
        setDataRetirada(equipamentoParaEditar.dataRetirada || '');
        setDataInstalacao(equipamentoParaEditar.dataInstalacao || '');
        setObservacoes(equipamentoParaEditar.observacoes);
      } else {
        const ano = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        setCodigoPatrimonial(`PAT-${ano}-${rand}`);
        setTipo('Relé de Proteção Multifunção');
        setDescricao('');
        setFabricante('SEL - Schweitzer');
        setModelo('');
        setNumeroSerie(`SN-${Math.floor(100000 + Math.random() * 900000)}`);
        setSubestacaoId('');
        setPainelId('');
        setModuloId('');
        setModuloTexto('');
        setAlmoxarifadoId(almoxarifados[0]?.id || '');
        setLocalizacaoDescricao('Almoxarifado Central / Triagem Inicial');
        setEstadoConservacao('Novo');
        setEstadoOperacional('Sobressalente / Estoque');
        const respPadrao =
          usuarioAtual?.nome ||
          (usuarios.length > 0 ? usuarios[0].nome : '');
        setResponsavel(respPadrao);
        setResponsavelManual(false);
        setDataRetirada('');
        setDataInstalacao('');
        setObservacoes('');
      }
    }
  }, [aberto, equipamentoParaEditar, almoxarifados, modulos, paineis, usuarios, usuarioAtual]);

  // Lista consolidada de sugestões cadastradas para a subestação (painéis e módulos)
  const sugestoesCadastradas = useMemo(() => {
    const itens: string[] = [];
    paineis
      .filter((p) => !subestacaoId || p.subestacaoId === subestacaoId)
      .forEach((p) => {
        if (!itens.includes(p.identificacao)) itens.push(p.identificacao);
      });
    modulos
      .filter((m) => !subestacaoId || m.subestacaoId === subestacaoId)
      .forEach((m) => {
        if (!itens.includes(m.identificacao)) itens.push(m.identificacao);
      });
    return itens;
  }, [paineis, modulos, subestacaoId]);

  const handleModuloTextoChange = (val: string) => {
    setModuloTexto(val);
    const mod = modulos.find(
      (m) =>
        m.identificacao.trim().toLowerCase() === val.trim().toLowerCase() ||
        m.id === val.trim()
    );
    if (mod) {
      setModuloId(mod.id);
    } else {
      setModuloId(val.trim());
    }
  };

  const atualizarDescricaoLocalizacao = (subId: string, painelModText: string, almoxId: string) => {
    if (subId) {
      const se = subestacoes.find((s) => s.id === subId);
      const partes = [se?.nome || 'Subestação'];
      if (painelModText.trim()) partes.push(painelModText.trim());
      setLocalizacaoDescricao(partes.join(' / '));
    } else if (almoxId) {
      const alm = almoxarifados.find((a) => a.id === almoxId);
      setLocalizacaoDescricao(`${alm?.nome || 'Almoxarifado'} (Estoque)`);
    } else if (painelModText.trim()) {
      setLocalizacaoDescricao(painelModText.trim());
    }
  };

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (
      !codigoPatrimonial.trim() ||
      !descricao.trim() ||
      !fabricante.trim() ||
      !modelo.trim() ||
      !numeroSerie.trim() ||
      !responsavel.trim()
    ) {
      setErro('Preencha todos os campos obrigatórios (*), incluindo o Responsável Técnico.');
      return;
    }

    try {
      setSalvando(true);

      const modFinalTexto = moduloTexto.trim();
      let modFinalId: string | null = modFinalTexto || null;

      // Localiza se corresponde a algum painel já cadastrado
      const pnlCorrespondente = paineis.find(
        (p) =>
          (!subestacaoId || p.subestacaoId === subestacaoId) &&
          p.identificacao.trim().toLowerCase() === modFinalTexto.toLowerCase()
      );

      // Localiza se corresponde a algum módulo já cadastrado
      const modCorrespondente = modulos.find(
        (m) =>
          (!subestacaoId || m.subestacaoId === subestacaoId) &&
          m.identificacao.trim().toLowerCase() === modFinalTexto.toLowerCase()
      );

      if (modCorrespondente) {
        modFinalId = modCorrespondente.id;
      }

      // Se o usuário digitou e não existe cadastro formal, salva no banco caso onSalvarModulo esteja disponível
      if (
        subestacaoId &&
        modFinalTexto &&
        !pnlCorrespondente &&
        !modCorrespondente &&
        onSalvarModulo
      ) {
        try {
          await onSalvarModulo({
            subestacaoId,
            identificacao: modFinalTexto,
            codigo: `PNL-${Math.floor(100 + Math.random() * 900)}`,
            posicao: 'Geral',
          });
        } catch {
          // prossegue normalmente
        }
      }

      // Calcular descrição da localização se não fornecida
      let locDesc = localizacaoDescricao.trim();
      if (
        !locDesc ||
        locDesc === 'Almoxarifado Central / Triagem Inicial' ||
        locDesc === 'Sem Localização Confirmada'
      ) {
        if (subestacaoId) {
          const se = subestacoes.find((s) => s.id === subestacaoId);
          locDesc = `${se?.nome || 'Subestação'}${modFinalTexto ? ` / ${modFinalTexto}` : ''}`;
        } else if (almoxarifadoId) {
          const alm = almoxarifados.find((a) => a.id === almoxarifadoId);
          locDesc = `${alm?.nome || 'Almoxarifado'} (Estoque)`;
        } else {
          locDesc = 'Almoxarifado Central / Recebimento';
        }
      }

      await onSalvar({
        id: equipamentoParaEditar ? equipamentoParaEditar.id : undefined,
        codigoPatrimonial: codigoPatrimonial.trim().toUpperCase(),
        tipo,
        descricao: descricao.trim(),
        fabricante: fabricante.trim(),
        modelo: modelo.trim(),
        numeroSerie: numeroSerie.trim(),
        qrCode: `TRACKSUB-${codigoPatrimonial.trim().toUpperCase()}`,
        subestacaoId: subestacaoId || null,
        painelId: painelId || null,
        moduloId: modFinalId,
        almoxarifadoId: almoxarifadoId || null,
        localizacaoDescricao: locDesc,
        estadoConservacao,
        estadoOperacional,
        responsavel,
        dataRetirada: dataRetirada.trim() || undefined,
        dataInstalacao: dataInstalacao.trim() || undefined,
        dataAquisicao: equipamentoParaEditar?.dataAquisicao || dataInstalacao.trim() || dataRetirada.trim() || new Date().toISOString().split('T')[0],
        garantiaAte: equipamentoParaEditar?.garantiaAte || '',
        observacoes,
      });

      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Ocorreu um erro ao salvar o equipamento.');
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
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base">
                {equipamentoParaEditar ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
              </h3>
              <p className="text-xs text-slate-400">
                Ativo elétrico de subestação com geração automática de QR Code
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
                Código Patrimonial *
              </label>
              <input
                type="text"
                value={codigoPatrimonial}
                onChange={(e) => setCodigoPatrimonial(e.target.value.toUpperCase())}
                placeholder="Ex: PAT-2026-9040"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Número de Série *
              </label>
              <input
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ex: SN-487E-2026"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Equipamento (Subestação & Telecom) *
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  const novoTipo = e.target.value as TipoEquipamento;
                  setTipo(novoTipo);
                  if (!descricao.trim()) {
                    setDescricao(novoTipo);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                required
              >
                {CATEGORIAS_EQUIPAMENTOS.map((cat) => (
                  <optgroup key={cat.nome} label={cat.nome}>
                    {cat.tipos.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição do Equipamento *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Disjuntor Tripolar SF6 230kV ou Relé Diferencial de Barra 87B"
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
                list="lista-fabricantes"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                placeholder="Ex: SEL, Siemens Energy, ABB/Hitachi, GE Grid, Moxa..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <datalist id="lista-fabricantes">
                {FABRICANTES_SUGERIDOS.map((fab) => (
                  <option key={fab} value={fab} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modelo / Referência Técnica *
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: SEL-487E, 3AP1-FG, RUGGEDCOM RS900G, WEG DWB"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Localização Inicial */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Localização Física Inicial
              </span>
              {subestacoes.length === 0 && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Sem subestações cadastradas
                </span>
              )}
            </div>

            {subestacoes.length === 0 && (
              <div className="flex items-start space-x-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-800 text-xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Dica de Implantação:</strong> Como as subestações foram zeradas para novo cadastro, você pode alocar este ativo inicialmente no Almoxarifado/Oficina ou criar a primeira Subestação na aba <em>Subestações</em>.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subestação (se instalado)
                </label>
                <select
                  value={subestacaoId}
                  onChange={(e) => {
                    const novaSe = e.target.value;
                    setSubestacaoId(novaSe);
                    setPainelId('');
                    if (novaSe) setAlmoxarifadoId('');
                    atualizarDescricaoLocalizacao(novaSe, moduloTexto, almoxarifadoId);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                >
                  <option value="">Nenhuma (Não instalado / Almoxarifado)</option>
                  {subestacoes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.tensaoPrimaria})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Painel / Módulo
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                      Editável
                    </span>
                    {subestacaoId &&
                      moduloTexto.trim() &&
                      onSalvarModulo &&
                      !sugestoesCadastradas.some(
                        (sug: string) => sug.toLowerCase() === moduloTexto.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          disabled={salvandoModuloRapido}
                          onClick={async () => {
                            try {
                              setSalvandoModuloRapido(true);
                              await onSalvarModulo({
                                subestacaoId,
                                identificacao: moduloTexto.trim(),
                                codigo: `PNL-${Math.floor(100 + Math.random() * 900)}`,
                                posicao: 'Geral',
                              });
                            } catch (e: any) {
                              alert(e.message || 'Erro ao registrar.');
                            } finally {
                              setSalvandoModuloRapido(false);
                            }
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline"
                          title="Cadastrar este painel/módulo permanentemente"
                        >
                          {salvandoModuloRapido ? 'Salvando...' : '+ Salvar'}
                        </button>
                      )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    list="lista-painel-modulos-sugestoes"
                    value={moduloTexto}
                    onChange={(e) => {
                      handleModuloTextoChange(e.target.value);
                      atualizarDescricaoLocalizacao(
                        subestacaoId,
                        e.target.value,
                        almoxarifadoId
                      );
                    }}
                    placeholder="Digite ou selecione o Painel / Módulo (ex: Painel 01, Vão 02, Cubículo 13.8kV)..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  {moduloTexto && (
                    <button
                      type="button"
                      onClick={() => {
                        handleModuloTextoChange('');
                        atualizarDescricaoLocalizacao(
                          subestacaoId,
                          '',
                          almoxarifadoId
                        );
                      }}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-sm font-bold"
                      title="Limpar campo"
                    >
                      ×
                    </button>
                  )}
                </div>

                <datalist id="lista-painel-modulos-sugestoes">
                  {sugestoesCadastradas.map((item: string, idx: number) => (
                    <option key={`sug-${idx}`} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="Painel 01 - Proteção Principal Linha (21/87L)" />
                  <option value="Painel 02 - Proteção Diferencial de Barra (87B)" />
                  <option value="Painel 03 - Bastidor Telecom &amp; Switches IEC 61850" />
                  <option value="Painel 04 - Medição &amp; Faturamento" />
                  <option value="Painel 05 - Serviços Auxiliares CC / QDCC (125Vcc)" />
                  <option value="Painel 06 - Serviços Auxiliares CA / QDCA (380/220V)" />
                  <option value="Vão 01 - Linha de Transmissão 230kV" />
                  <option value="Vão 02 - Transformador de Força 230/138kV" />
                  <option value="Vão 03 - Barramento e Seccionamento" />
                  <option value="Cubículo Metal-Clad 13.8kV" />
                  <option value="Módulo de Proteção &amp; Automação" />
                  <option value="Módulo de Teleproteção e Frequência" />
                  <option value="Gaveta 01 (Superior)" />
                  <option value="Gaveta 02" />
                  <option value="Gaveta 03" />
                  <option value="Gaveta 04 (Inferior)" />
                  <option value="Rack 19&quot; - Unidade U01 a U04" />
                  <option value="Slot 01 - CPU / Processamento" />
                </datalist>

                {/* Chips rápidos se houver painéis ou módulos cadastrados */}
                {sugestoesCadastradas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Cadastrados:</span>
                    {sugestoesCadastradas.slice(0, 5).map((item: string) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          handleModuloTextoChange(item);
                          atualizarDescricaoLocalizacao(
                            subestacaoId,
                            item,
                            almoxarifadoId
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                          moduloTexto === item
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Descrição Completa da Localização (Editável livremente) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Descrição Completa da Localização Física (Editável)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    atualizarDescricaoLocalizacao(
                      subestacaoId,
                      moduloTexto,
                      almoxarifadoId
                    )
                  }
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  title="Atualizar texto com base nos seletores acima"
                >
                  Recalcular automaticamente
                </button>
              </div>
              <input
                type="text"
                value={localizacaoDescricao}
                onChange={(e) => setLocalizacaoDescricao(e.target.value)}
                placeholder="Ex: SE Estiva 230kV / Painel 01 - Proteção Principal"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            {!subestacaoId && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ou selecione o Almoxarifado / Depósito de Guarda
                </label>
                <select
                  value={almoxarifadoId}
                  onChange={(e) => setAlmoxarifadoId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem almoxarifado vinculado</option>
                  {almoxarifados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.tipo})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado Operacional
              </label>
              <select
                value={estadoOperacional}
                onChange={(e) => setEstadoOperacional(e.target.value as EstadoOperacional)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Em Operação">Em Operação</option>
                <option value="Sobressalente / Estoque">Sobressalente / Estoque</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Em Ensaio">Em Ensaio</option>
                <option value="Retirado">Retirado</option>
                <option value="Baixado">Baixado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de Conservação
              </label>
              <select
                value={estadoConservacao}
                onChange={(e) => setEstadoConservacao(e.target.value as EstadoConservacao)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Novo">Novo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Necessita Reparo">Necessita Reparo</option>
                <option value="Danificado">Danificado</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Responsável Técnico <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setResponsavelManual(!responsavelManual)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  title="Alternar entre lista de usuários cadastrados e digitação manual"
                >
                  {responsavelManual ? 'Selecionar da lista de usuários' : '+ Outro nome'}
                </button>
              </div>

              {responsavelManual ? (
                <div className="relative">
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome do técnico ou terceiro..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  {responsavel && (
                    <button
                      type="button"
                      onClick={() => setResponsavel('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-sm font-bold"
                      title="Limpar campo"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={responsavel}
                  onChange={(e) => {
                    if (e.target.value === '__OUTRO_MANUAL__') {
                      setResponsavelManual(true);
                      setResponsavel('');
                    } else {
                      setResponsavel(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  required
                >
                  <option value="">Selecione um usuário cadastrado...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.nome}>
                      {u.nome} • {u.cargo || u.perfil.toUpperCase()} {u.matricula ? `(Mat: ${u.matricula})` : ''}
                    </option>
                  ))}
                  {/* Se o responsável salvo anteriormente não constar na lista de usuários atuais */}
                  {responsavel &&
                    !usuarios.some((u) => u.nome.trim().toLowerCase() === responsavel.trim().toLowerCase()) && (
                      <option value={responsavel}>
                        {responsavel} (Responsável Atual / Externo)
                      </option>
                    )}
                  <option value="__OUTRO_MANUAL__">+ Digitar outro responsável...</option>
                </select>
              )}
              <span className="text-[11px] text-slate-500 mt-1 block">
                {responsavelManual
                  ? 'Modo manual: digite o nome do terceiro ou prestador.'
                  : usuarios.find((u) => u.nome.trim().toLowerCase() === responsavel.trim().toLowerCase())?.cargo
                    ? `Função: ${usuarios.find((u) => u.nome.trim().toLowerCase() === responsavel.trim().toLowerCase())?.cargo}`
                    : 'Usuário cadastrado responsável pelo ativo.'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Retirada
              </label>
              <input
                type="date"
                value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Data de Instalação (Opcional)
                </label>
                {dataInstalacao && (
                  <button
                    type="button"
                    onClick={() => setDataInstalacao('')}
                    className="text-[10px] text-blue-600 hover:text-red-600 font-semibold underline"
                    title="Limpar campo e deixar data de instalação em branco"
                  >
                    Deixar em branco
                  </button>
                )}
              </div>
              <input
                type="date"
                value={dataInstalacao}
                onChange={(e) => setDataInstalacao(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {dataInstalacao
                  ? 'Data em que o ativo foi instalado em campo.'
                  : 'Em branco (equipamento novo, sobressalente ou em estoque).'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Técnicas e Parâmetros
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Versão de firmware, ajustes de proteção RDB, laudos de ensaio..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{equipamentoParaEditar ? 'Atualizar Equipamento' : 'Cadastrar Equipamento'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
