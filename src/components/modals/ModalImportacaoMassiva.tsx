import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Copy,
  ArrowRight,
  Database,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Equipamento, Subestacao, Almoxarifado } from '../../types/tracksub.ts';
import { api } from '../../services/api.ts';

interface ModalImportacaoMassivaProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => Promise<void>;
  subestacoes: Subestacao[];
  almoxarifados: Almoxarifado[];
}

export const ModalImportacaoMassiva: React.FC<ModalImportacaoMassivaProps> = ({
  aberto,
  onFechar,
  onSucesso,
  subestacoes,
  almoxarifados,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'gerador' | 'arquivo' | 'colar'>('gerador');

  // Estado Gerador Rápido 3000+
  const [quantidadeGerar, setQuantidadeGerar] = useState<number>(3000);
  const [prefixoGerar, setPrefixoGerar] = useState<string>('PAT-2026-');
  const [criarEstrutura, setCriarEstrutura] = useState<boolean>(false);

  // Estado Arquivo CSV / TXT
  const [arquivoNome, setArquivoNome] = useState<string>('');
  const [itensArquivo, setItensArquivo] = useState<Partial<Equipamento>[]>([]);

  // Estado Colar Planilha
  const [textoColado, setTextoColado] = useState<string>('');
  const [itensColados, setItensColados] = useState<Partial<Equipamento>[]>([]);

  // Opções globais
  const [sobrescrever, setSobrescrever] = useState<boolean>(true);

  // Estados de Processamento
  const [processando, setProcessando] = useState<boolean>(false);
  const [progresso, setProgresso] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [resultadoSucesso, setResultadoSucesso] = useState<{
    totalCadastrados: number;
    totalNoBanco: number;
    subestacoesCriadas?: number;
  } | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!aberto) return null;

  // Função para Baixar Planilha Modelo CSV
  const handleBaixarModelo = () => {
    const colunas = [
      'CodigoPatrimonial',
      'Descricao',
      'Tipo',
      'Fabricante',
      'Modelo',
      'NumeroSerie',
      'SubestacaoNome',
      'Localizacao',
      'EstadoOperacional',
      'EstadoConservacao',
      'Responsavel',
      'DataRetirada',
      'DataInstalacao',
      'Observacoes',
    ];

    const exemplos = [
      [
        'PAT-2026-00001',
        'Multimedidor Digital de Grandezas Elétricas Classe 0.2S',
        'Multimedidor Digital de Grandezas Elétricas',
        'Kron Medidores',
        'Mult-K 120 / Linha Pro',
        'SN-KRN-2026-00001',
        subestacoes[0]?.nome || 'SE Principal 230kV',
        'Painel 01 - Medição',
        'Em Operação',
        'Novo',
        'Eng. Anderson Tavares',
        '',
        '2026-01-15',
        'Comunicação DNP3 / Modbus TCP ativa',
      ],
      [
        'PAT-2026-00002',
        'Multimedidor de Painel com Registrador de Eventos',
        'Multimedidor',
        'Schneider Electric (PowerLogic)',
        'PowerLogic PM8000',
        'SN-SCH-2026-00002',
        subestacoes[0]?.nome || 'SE Principal 230kV',
        'Painel Geral de Baixa Tensão (PGBT)',
        'Em Operação',
        'Excelente',
        'Eng. Anderson Tavares',
        '',
        '2026-01-20',
        'Monitoramento de harmônicas e transitórios',
      ],
      [
        'PAT-2026-00003',
        'Relé de Proteção Multifunção Diferencial e Distância 87L/21',
        'Relé de Proteção Multifunção',
        'SEL - Schweitzer',
        'SEL-421',
        'SN-SEL-2026-00003',
        subestacoes[0]?.nome || 'SE Principal 230kV',
        'Painel de Proteção LT 230kV',
        'Em Operação',
        'Novo',
        'Eng. Anderson Tavares',
        '',
        '2026-02-10',
        'Proteção principal de linha de transmissão',
      ],
      [
        'PAT-2026-00004',
        'Switch Industrial Gerenciável IEC 61850-3',
        'Switch Gerenciável IEC 61850',
        'RuggedCom / Siemens',
        'RS900G',
        'SN-RUG-2026-00004',
        subestacoes[0]?.nome || 'SE Principal 230kV',
        'Bastidor Telecomunicações Rack 01',
        'Em Operação',
        'Novo',
        'Eng. Anderson Tavares',
        '',
        '2026-02-12',
        'Rede de GOOSE e Sampled Values',
      ],
      [
        'PAT-2026-00005',
        'Disjuntor Tripolar SF6 245 kV 3150 A',
        'Disjuntor de Alta Tensão',
        'ABB / Hitachi Energy',
        'LTB 245D1/B',
        'SN-ABB-2026-00005',
        subestacoes[0]?.nome || 'SE Principal 230kV',
        'Pátio 230kV Vão 03',
        'Em Operação',
        'Bom',
        'Eng. Anderson Tavares',
        '',
        '2026-02-15',
        'Disjuntor de linha de transmissão',
      ],
    ];

    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvContent =
      '\uFEFF' +
      colunas.join(';') +
      '\n' +
      exemplos.map((linha) => linha.map(escapeCsv).join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_tracksub_3000_itens.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parser de Linhas Tabulares (CSV, TSV, Ponto-e-Vírgula)
  const parseLinhas = (texto: string): Partial<Equipamento>[] => {
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (linhas.length === 0) return [];

    // Detectar delimitador mais provável
    const primeiraLinha = linhas[0];
    let delimitador = ';';
    if (primeiraLinha.includes('\t')) delimitador = '\t';
    else if (primeiraLinha.includes(';') && !primeiraLinha.includes(',')) delimitador = ';';
    else if (primeiraLinha.includes(',') && !primeiraLinha.includes(';')) delimitador = ',';

    const parseCsvRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          if (inQuotes && rowStr[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimitador && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const header = parseCsvRow(linhas[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    // Mapeamento de índices das colunas
    const getIndex = (aliases: string[]) =>
      header.findIndex((h) => aliases.some((a) => h.includes(a)));

    const idxPatrim = getIndex(['patrimonio', 'codigopatrimonial', 'patrim', 'tag', 'codigo']);
    const idxDesc = getIndex(['descricao', 'equipamento', 'nome', 'desc']);
    const idxTipo = getIndex(['tipo', 'categoria', 'tipoequipamento']);
    const idxFab = getIndex(['fabricante', 'marca', 'fab']);
    const idxMod = getIndex(['modelo', 'mod']);
    const idxSerie = getIndex(['numeroserie', 'serie', 'serial', 'ns']);
    const idxSub = getIndex(['subestacao', 'subestacaonome', 'se']);
    const idxLoc = getIndex(['localizacao', 'local', 'painel', 'cubiculo']);
    const idxEstOp = getIndex(['estadooperacional', 'operacional', 'status']);
    const idxEstCons = getIndex(['estadoconservacao', 'conservacao']);
    const idxResp = getIndex(['responsavel', 'usuario']);
    const idxDataRetirada = getIndex(['dataretirada', 'retirada', 'datasaida']);
    const idxDataInstalacao = getIndex(['datainstalacao', 'instalacao', 'dataaquisicao', 'aquisicao']);
    const idxObs = getIndex(['observacoes', 'obs', 'detalhes']);

    const equipamentos: Partial<Equipamento>[] = [];

    for (let i = 1; i < linhas.length; i++) {
      const col = parseCsvRow(linhas[i]);
      if (col.length < 2 && !col[0]) continue;

      const patrim = (idxPatrim >= 0 ? col[idxPatrim] : col[0]) || '';
      const desc = (idxDesc >= 0 ? col[idxDesc] : col[1]) || `Equipamento ${patrim || i}`;
      const tipo = (idxTipo >= 0 ? col[idxTipo] : col[2]) || 'Multimedidor Digital de Grandezas Elétricas';
      const fab = (idxFab >= 0 ? col[idxFab] : col[3]) || 'Fabricante Especializado';
      const mod = (idxMod >= 0 ? col[idxMod] : col[4]) || 'Modelo SE';
      const serie = (idxSerie >= 0 ? col[idxSerie] : col[5]) || `SN-${i}`;
      const subNome = (idxSub >= 0 ? col[idxSub] : '') || '';
      const loc = (idxLoc >= 0 ? col[idxLoc] : '') || 'Subestação Central';
      const estOp = (idxEstOp >= 0 ? col[idxEstOp] : '') || 'Em Operação';
      const estCons = (idxEstCons >= 0 ? col[idxEstCons] : '') || 'Novo';
      const resp = (idxResp >= 0 ? col[idxResp] : '') || 'Operação TRACKSUB';
      const obs = (idxObs >= 0 ? col[idxObs] : '') || '';

      // Tentar associar subestação pelo nome se coincidir
      const subEncontrada = subestacoes.find(
        (s) =>
          s.nome.toLowerCase().includes(subNome.toLowerCase()) ||
          s.codigo.toLowerCase() === subNome.toLowerCase()
      );

      equipamentos.push({
        codigoPatrimonial: patrim.toUpperCase().trim(),
        descricao: desc.trim(),
        tipo: tipo as any,
        fabricante: fab.trim(),
        modelo: mod.trim(),
        numeroSerie: serie.trim(),
        subestacaoId: subEncontrada ? subEncontrada.id : null,
        localizacaoDescricao: loc.trim(),
        estadoOperacional: (['Em Operação', 'Sobressalente / Estoque', 'Em Manutenção / Teste', 'Reserva Operacional'].includes(estOp)
          ? estOp
          : 'Em Operação') as any,
        estadoConservacao: (['Novo', 'Excelente', 'Bom', 'Regular', 'Necessita Reparo'].includes(estCons)
          ? estCons
          : 'Novo') as any,
        responsavel: resp.trim(),
        dataRetirada: (idxDataRetirada >= 0 ? col[idxDataRetirada] : '') || undefined,
        dataInstalacao: (idxDataInstalacao >= 0 ? col[idxDataInstalacao] : '') || undefined,
        dataAquisicao: (idxDataInstalacao >= 0 ? col[idxDataInstalacao] : (idxDataRetirada >= 0 ? col[idxDataRetirada] : '')) || undefined,
        observacoes: obs.trim(),
      });
    }

    return equipamentos;
  };

  // Upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoNome(file.name);
    setErroMsg(null);
    setResultadoSucesso(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseLinhas(text);
        if (parsed.length === 0) {
          setErroMsg('Nenhum registro válido identificado no arquivo. Verifique o cabeçalho e delimitador.');
          setItensArquivo([]);
        } else {
          setItensArquivo(parsed);
        }
      } catch (err: any) {
        setErroMsg(`Erro ao ler arquivo: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Mudança do texto colado
  const handleTextoColadoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextoColado(val);
    setErroMsg(null);
    setResultadoSucesso(null);

    if (val.trim()) {
      try {
        const parsed = parseLinhas(val);
        setItensColados(parsed);
      } catch (err: any) {
        setErroMsg(`Erro no texto colado: ${err.message}`);
      }
    } else {
      setItensColados([]);
    }
  };

  // Enviar Lote em Chunks para não travar a rede
  const enviarLoteEmChunks = async (itens: Partial<Equipamento>[]) => {
    setProcessando(true);
    setErroMsg(null);
    setResultadoSucesso(null);
    setProgresso(5);
    setStatusMsg(`Iniciando envio de ${itens.length.toLocaleString('pt-BR')} itens...`);

    const CHUNK_SIZE = 1000;
    const totalChunks = Math.ceil(itens.length / CHUNK_SIZE);
    let totalCadastrados = 0;
    let ultimoTotalBanco = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, itens.length);
        const chunk = itens.slice(start, end);

        setStatusMsg(
          `Gravando lote ${i + 1} de ${totalChunks} (${start + 1} a ${end} de ${itens.length})...`
        );

        const res = await api.salvarEquipamentosLote(chunk, {
          sobrescreverDuplicados: sobrescrever,
        });

        totalCadastrados += res.totalCadastrados + res.totalAtualizados;
        ultimoTotalBanco = res.totalNoBanco;
        setProgresso(Math.round(((i + 1) / totalChunks) * 100));
      }

      setStatusMsg('Finalizando e atualizando base local...');
      await onSucesso();

      setResultadoSucesso({
        totalCadastrados,
        totalNoBanco: ultimoTotalBanco,
      });
      setProgresso(100);
    } catch (err: any) {
      setErroMsg(`Erro durante a gravação em lote: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  };

  // Disparar Gerador Massivo 3000+
  const handleGerarMassivo = async () => {
    setProcessando(true);
    setErroMsg(null);
    setResultadoSucesso(null);
    setProgresso(20);
    setStatusMsg(
      `Gerando ${quantidadeGerar.toLocaleString('pt-BR')} equipamentos de alta tecnologia e telecomunicação...`
    );

    try {
      setProgresso(50);
      const res = await api.gerarLoteEquipamentos({
        quantidade: quantidadeGerar,
        prefixo: prefixoGerar,
        criarInfraestruturaSeVazia: criarEstrutura,
      });

      setProgresso(85);
      setStatusMsg('Sincronizando índices e painel operacional...');
      await onSucesso();

      setProgresso(100);
      setResultadoSucesso({
        totalCadastrados: res.totalCadastrados,
        totalNoBanco: res.totalNoBanco,
        subestacoesCriadas: res.subestacoesCriadas,
      });
    } catch (err: any) {
      setErroMsg(`Erro ao gerar itens: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-300">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Cadastro & Carga Massiva de Ativos
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  Alta Capacidade (3.000+ Itens)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Importação veloz por planilha CSV, colagem direta ou assistente gerador com dados técnicos reais
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            disabled={processando}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setAbaAtiva('gerador')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              abaAtiva === 'gerador'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Gerador Rápido 3.000+ Itens</span>
          </button>

          <button
            onClick={() => setAbaAtiva('arquivo')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              abaAtiva === 'arquivo'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Importar Planilha (CSV / Excel)</span>
          </button>

          <button
            onClick={() => setAbaAtiva('colar')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              abaAtiva === 'colar'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Copy className="w-4 h-4 text-emerald-600" />
            <span>Colar do Excel / Google Sheets</span>
          </button>
        </div>

        {/* Conteúdo Principal com Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Alertas de Erro ou Sucesso */}
          {erroMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Aviso na Importação:</p>
                <p className="mt-0.5">{erroMsg}</p>
              </div>
            </div>
          )}

          {resultadoSucesso && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start space-x-3 animate-in fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-emerald-800">
                  Carga em Lote Finalizada com Êxito!
                </p>
                <p className="text-emerald-700">
                  Foram cadastrados e indexados{' '}
                  <strong className="font-bold text-emerald-900">
                    {resultadoSucesso.totalCadastrados.toLocaleString('pt-BR')} equipamentos
                  </strong>
                  . O total de ativos no banco de dados agora é de{' '}
                  <strong className="font-bold text-emerald-900">
                    {resultadoSucesso.totalNoBanco.toLocaleString('pt-BR')} itens
                  </strong>
                  .
                </p>
                {resultadoSucesso.subestacoesCriadas ? (
                  <p className="text-emerald-700 text-[11px]">
                    Estrutura de {resultadoSucesso.subestacoesCriadas} subestações completas (230kV, 500kV e 138kV) com painéis de proteção e telecomunicações provisionada automaticamente.
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {/* Barra de Progresso durante Execução */}
          {processando && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>{statusMsg || 'Processando lote...'}</span>
                </span>
                <span>{progresso}%</span>
              </div>
              <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          {/* ABA 1: GERADOR RÁPIDO 3.000+ ITENS */}
          {abaAtiva === 'gerador' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Solução Direta para Mais de 3.000 Itens
                    </h3>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Gera instantaneamente uma infraestrutura completa e consistente de equipamentos elétricos de subestação e telecomunicações (incluindo <strong>Multimedidores Digitais</strong>, Relés de Proteção SEL/Siemens/ABB, IEDs de Vão, Disjuntores de Alta e Média Tensão, Switches Industriais IEC 61850, Multiplexadores Ópticos, TCs/TPs, Retificadores e Spares) com QR Codes automáticos e número de série individualizado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantidade de Equipamentos a Cadastrar *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={quantidadeGerar}
                      onChange={(e) => setQuantidadeGerar(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {/* Botões Rápidos */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[500, 1000, 3000, 5000].map((qtd) => (
                      <button
                        key={qtd}
                        type="button"
                        onClick={() => setQuantidadeGerar(qtd)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition ${
                          quantidadeGerar === qtd
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {qtd.toLocaleString('pt-BR')} itens {qtd === 3000 ? '★ Recomendado' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Prefixo dos Códigos Patrimoniais (TAG)
                  </label>
                  <input
                    type="text"
                    value={prefixoGerar}
                    onChange={(e) => setPrefixoGerar(e.target.value.toUpperCase())}
                    placeholder="Ex: PAT-2026-, SE-EQP-, ATIVO-"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Exemplo de TAG gerada: <code className="text-blue-600 font-bold">{prefixoGerar}00001</code> até <code className="text-blue-600 font-bold">{prefixoGerar}{String(quantidadeGerar).padStart(5, '0')}</code>
                  </p>
                </div>
              </div>

              {subestacoes.length === 0 && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>
                      Sua base de subestações está vazia. Deseja criar automaticamente 3 subestações modelo (SE Estiva 230kV, SE Bandeirantes 500kV e SE Distrito 138kV) para alojar os painéis e equipamentos?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={criarEstrutura}
                    onChange={(e) => setCriarEstrutura(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={processando}
                  onClick={handleGerarMassivo}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    Gerar e Cadastrar {quantidadeGerar.toLocaleString('pt-BR')} Equipamentos Agora
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: IMPORTAR PLANILHA CSV / EXCEL */}
          {abaAtiva === 'arquivo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Modelo de Planilha Padrão
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Utilize o modelo CSV com colunas pré-formatadas para cadastrar milhares de itens sem erros
                  </p>
                </div>
                <button
                  onClick={handleBaixarModelo}
                  type="button"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition shrink-0"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Baixar Planilha Modelo (.csv)</span>
                </button>
              </div>

              {/* Área de Seleção de Arquivo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {arquivoNome || 'Clique para selecionar o arquivo CSV / Planilha'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Suporta arquivos com 3.000, 5.000 ou mais linhas (.csv delimitado por ponto-e-vírgula ou vírgula)
                </p>
              </div>

              {/* Resumo e Pré-visualização do Arquivo */}
              {itensArquivo.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Total detectado:{' '}
                      <strong className="text-blue-600 font-bold">
                        {itensArquivo.length.toLocaleString('pt-BR')} itens prontos para gravação
                      </strong>
                    </span>
                    <label className="flex items-center space-x-2 text-slate-600 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sobrescrever}
                        onChange={(e) => setSobrescrever(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Atualizar se TAG já existir</span>
                    </label>
                  </div>

                  {/* Amostra das primeiras 5 linhas */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
                      Amostra dos 5 primeiros itens detectados:
                    </div>
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                          <tr>
                            <th className="py-2 px-3">TAG / Patrimônio</th>
                            <th className="py-2 px-3">Descrição</th>
                            <th className="py-2 px-3">Tipo</th>
                            <th className="py-2 px-3">Fabricante</th>
                            <th className="py-2 px-3">Nº Série</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {itensArquivo.slice(0, 5).map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-800">
                                {it.codigoPatrimonial}
                              </td>
                              <td className="py-2 px-3 truncate max-w-xs">{it.descricao}</td>
                              <td className="py-2 px-3 text-slate-600">{it.tipo}</td>
                              <td className="py-2 px-3 text-slate-600">{it.fabricante}</td>
                              <td className="py-2 px-3 text-slate-500">{it.numeroSerie}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => enviarLoteEmChunks(itensArquivo)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      Importar Todos os {itensArquivo.length.toLocaleString('pt-BR')} Itens do Arquivo
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: COLAR DO EXCEL / GOOGLE SHEETS */}
          {abaAtiva === 'colar' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Como funciona o Copy & Paste do Excel:</p>
                <p>
                  1. Selecione as linhas e colunas na sua planilha do Excel ou Google Sheets (com ou sem cabeçalho).
                </p>
                <p>2. Pressione <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl+C</kbd> para copiar.</p>
                <p>3. Cole no campo abaixo com <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl+V</kbd>. O sistema analisa as colunas automaticamente.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cole os dados aqui:
                </label>
                <textarea
                  rows={8}
                  value={textoColado}
                  onChange={handleTextoColadoChange}
                  placeholder={`Cole aqui as linhas copiadas do Excel...\nExemplo:\nPAT-001\tMultimedidor Digital\tMultimedidor\tKron\tMult-K\tSN-001\nPAT-002\tRelé 87L\tRelé de Proteção Multifunção\tSEL\tSEL-421\tSN-002`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {itensColados.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Linhas interpretadas com sucesso:{' '}
                      <strong className="text-emerald-600 font-bold">
                        {itensColados.length.toLocaleString('pt-BR')} equipamentos
                      </strong>
                    </span>
                    <label className="flex items-center space-x-2 text-slate-600 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sobrescrever}
                        onChange={(e) => setSobrescrever(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Sobrescrever duplicados</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => enviarLoteEmChunks(itensColados)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Cadastrar {itensColados.length.toLocaleString('pt-BR')} Itens Colados
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            TRACKSUB High-Throughput Bulk Asset Ingestion Engine v2.4
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            {resultadoSucesso ? 'Concluir e Ver Ativos' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};
