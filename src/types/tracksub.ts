export type PerfilUsuario = 'administrador' | 'tecnico' | 'almoxarife' | 'gestor' | 'consulta';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  cargo: string;
  matricula: string;
  foto?: string;
}

export interface Subestacao {
  id: string;
  codigo: string;
  nome: string;
  tensaoPrimaria: string;
  tensaoSecundaria: string;
  endereco: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  ativa: boolean;
  observacoes?: string;
}

export interface Painel {
  id: string;
  subestacaoId: string;
  codigo: string;
  identificacao: string;
  funcao: string;
  tensao: string;
  tipo: string;
  ativo: boolean;
  observacoes?: string;
}

export interface Modulo {
  id: string;
  painelId: string;
  subestacaoId: string;
  codigo: string;
  identificacao: string;
  posicao: string;
  observacoes?: string;
}

export interface Almoxarifado {
  id: string;
  codigo: string;
  nome: string;
  subestacaoId?: string;
  subestacaoNome?: string;
  responsavel: string;
  localizacao: string;
  tipo: 'Principal' | 'Avançado de Subestação' | 'Oficina Central' | 'Laboratório de Ensaios';
  ativo: boolean;
}

export type TipoEquipamento =
  // Subestação - Pátio & Manobra (Alta / Média Tensão)
  | 'Transformador de Força / Potência'
  | 'Autotransformador de Força'
  | 'Disjuntor de Alta Tensão'
  | 'Disjuntor de Média Tensão'
  | 'Chave Seccionadora Principal / Barra'
  | 'Chave Seccionadora de Linha com Terra'
  | 'Chave Seccionadora Motorizada'
  | 'Religador Automático de Linha'
  | 'Seccionador sob Carga / Chave Fusível'
  | 'Transformador de Corrente (TC)'
  | 'Transformador de Potencial (TP)'
  | 'Transformador de Potencial Capacitivo (TPC / TPCV)'
  | 'Para-raios de Óxido de Zinco (ZnO)'
  | 'Banco de Capacitores Shunt'
  | 'Reator de Barra / Reator de Linha'
  | 'Bobina de Bloqueio (Wave Trap)'
  | 'Capacitor de Acoplamento'
  | 'Resistor de Aterramento de Neutro (NGR)'
  | 'Transformador de Aterramento / Zig-Zag'
  | 'Cubículo Blindado GIS (SF6)'

  // Subestação - Proteção, Controle & Medição (Secundário & IEDs)
  | 'Relé de Proteção Multifunção'
  | 'Multimedidor Digital de Grandezas Elétricas'
  | 'Multimedidor'
  | 'IED de Vão e Controle'
  | 'IED de Proteção Diferencial (87T / 87B / 87L)'
  | 'IED de Proteção de Distância (21 / 21N)'
  | 'IED de Sobrecorrente e Falha de Disjuntor (50/51/50BF)'
  | 'IED de Proteção de Tensão e Frequência (27/59/81)'
  | 'Regulador Automático de Tensão (AVR / RTAC)'
  | 'Medidor Eletrônico de Faturamento'
  | 'Registrador de Perturbações Digitais (RPD / DFR)'
  | 'Localizador de Faltas (Travelling Wave / FL)'
  | 'Sincronizador Automático de Fases (25)'
  | 'Concentrador de Dados / Gateway / RTU'
  | 'Servidor SCADA / IHM Local'
  | 'Módulo Eletrônico / Cartão de CPU'
  | 'Módulo de Entradas/Saídas (E/S IED)'

  // Telecomunicações de Subestação (Redes, Fibra, Rádio & PLC)
  | 'Bastidor / DIO (Distribuidor Interno Óptico)'
  | 'Chassi de Transporte WDM / DWDM'
  | 'Multiplexador SDH / PDH / SONET'
  | 'Switch Gerenciável IEC 61850'
  | 'Switch PTP / IEEE 1588 (PRP / HSR)'
  | 'Roteador de Borda / Núcleo Telecom'
  | 'Gateway de Protocolos (DNP3 / IEC 60870 / IEC 61850)'
  | 'Firewall Industrial / UTM Cibernético'
  | 'Transceptor Óptico / Terminal OLT / ONT'
  | 'Conversor E1 / V.35 / Serial para Fibra'
  | 'Transceptor de Teleproteção Digital / Analógico'
  | 'Terminal PLC (Onda Portadora / Carrier)'
  | 'Rádio Enlace Micro-ondas Digital (PDH/SDH/IP)'
  | 'Rádio Troncalizado VHF / UHF'
  | 'Modem Celular 4G/5G Privativo / APN'
  | 'Modem Satelital / VSAT de Contingência'
  | 'Roteador VPN Celular Industrial'
  | 'Relógio Mestre GPS / GNSS / PTP (IEEE 1588)'
  | 'Servidor NTP / SNTP de Alta Precisão'
  | 'Central Telefônica PABX / VoIP / SIP Industrial'
  | 'Telefone de Emergência / Intercomunicador'

  // Serviços Auxiliares & Alimentação CA/CC
  | 'Transformador de Serviços Auxiliares (TSA)'
  | 'Retificador / Carregador de Baterias'
  | 'Banco de Baterias Estacionárias (VRLA / Ni-Cd / Lítio)'
  | 'Inversor Estático CC/CA'
  | 'Nobreak / UPS Industrial'
  | 'Quadro de Distribuição de Corrente Contínua (QDCC)'
  | 'Quadro de Distribuição de Corrente Alternada (QDCA)'
  | 'Grupo Moto-Gerador de Emergência (GMG)'
  | 'Chave de Transferência Automática (QTA)'
  | 'Fonte de Alimentação Auxiliar'

  // Instrumentos de Ensaio, Calibração & Diagnóstico
  | 'Mala de Testes Microprocessada'
  | 'Megômetro Digital de Alta Tensão'
  | 'Microhmômetro de Contato'
  | 'Terrômetro / Medidor de Malha de Terra'
  | 'Analisador de Resposta em Frequência (SFRA)'
  | 'TTR (Medidor de Relação de Espiras)'
  | 'Câmera Termográfica Radiométrica (Termovisor)'
  | 'Analisador de Qualidade de Energia (AQE)'
  | 'Analisador de Gases Dissolvidos (DGA Online)'
  | 'Sensor de Descargas Parciais / Bucha'
  | 'Osciloscópio Digital Portátil de Campo'

  // Outros
  | 'Outro Equipamento Especial';

export interface CategoriaEquipamentoAgrupada {
  nome: string;
  badge: string;
  tipos: TipoEquipamento[];
}

export const CATEGORIAS_EQUIPAMENTOS: CategoriaEquipamentoAgrupada[] = [
  {
    nome: 'Subestação - Pátio & Manobra (Alta / Média Tensão)',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    tipos: [
      'Transformador de Força / Potência',
      'Autotransformador de Força',
      'Disjuntor de Alta Tensão',
      'Disjuntor de Média Tensão',
      'Chave Seccionadora Principal / Barra',
      'Chave Seccionadora de Linha com Terra',
      'Chave Seccionadora Motorizada',
      'Religador Automático de Linha',
      'Seccionador sob Carga / Chave Fusível',
      'Transformador de Corrente (TC)',
      'Transformador de Potencial (TP)',
      'Transformador de Potencial Capacitivo (TPC / TPCV)',
      'Para-raios de Óxido de Zinco (ZnO)',
      'Banco de Capacitores Shunt',
      'Reator de Barra / Reator de Linha',
      'Bobina de Bloqueio (Wave Trap)',
      'Capacitor de Acoplamento',
      'Resistor de Aterramento de Neutro (NGR)',
      'Transformador de Aterramento / Zig-Zag',
      'Cubículo Blindado GIS (SF6)',
    ],
  },
  {
    nome: 'Subestação - Proteção, Controle & Medição (Secundário & IEDs)',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    tipos: [
      'Relé de Proteção Multifunção',
      'Multimedidor Digital de Grandezas Elétricas',
      'Multimedidor',
      'IED de Vão e Controle',
      'IED de Proteção Diferencial (87T / 87B / 87L)',
      'IED de Proteção de Distância (21 / 21N)',
      'IED de Sobrecorrente e Falha de Disjuntor (50/51/50BF)',
      'IED de Proteção de Tensão e Frequência (27/59/81)',
      'Regulador Automático de Tensão (AVR / RTAC)',
      'Medidor Eletrônico de Faturamento',
      'Registrador de Perturbações Digitais (RPD / DFR)',
      'Localizador de Faltas (Travelling Wave / FL)',
      'Sincronizador Automático de Fases (25)',
      'Concentrador de Dados / Gateway / RTU',
      'Servidor SCADA / IHM Local',
      'Módulo Eletrônico / Cartão de CPU',
      'Módulo de Entradas/Saídas (E/S IED)',
    ],
  },
  {
    nome: 'Telecomunicações de Subestação (Redes, Fibra, PLC & Rádio)',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    tipos: [
      'Bastidor / DIO (Distribuidor Interno Óptico)',
      'Chassi de Transporte WDM / DWDM',
      'Multiplexador SDH / PDH / SONET',
      'Switch Gerenciável IEC 61850',
      'Switch PTP / IEEE 1588 (PRP / HSR)',
      'Roteador de Borda / Núcleo Telecom',
      'Gateway de Protocolos (DNP3 / IEC 60870 / IEC 61850)',
      'Firewall Industrial / UTM Cibernético',
      'Transceptor Óptico / Terminal OLT / ONT',
      'Conversor E1 / V.35 / Serial para Fibra',
      'Transceptor de Teleproteção Digital / Analógico',
      'Terminal PLC (Onda Portadora / Carrier)',
      'Rádio Enlace Micro-ondas Digital (PDH/SDH/IP)',
      'Rádio Troncalizado VHF / UHF',
      'Modem Celular 4G/5G Privativo / APN',
      'Modem Satelital / VSAT de Contingência',
      'Roteador VPN Celular Industrial',
      'Relógio Mestre GPS / GNSS / PTP (IEEE 1588)',
      'Servidor NTP / SNTP de Alta Precisão',
      'Central Telefônica PABX / VoIP / SIP Industrial',
      'Telefone de Emergência / Intercomunicador',
    ],
  },
  {
    nome: 'Serviços Auxiliares & Alimentação CA/CC',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tipos: [
      'Transformador de Serviços Auxiliares (TSA)',
      'Retificador / Carregador de Baterias',
      'Banco de Baterias Estacionárias (VRLA / Ni-Cd / Lítio)',
      'Inversor Estático CC/CA',
      'Nobreak / UPS Industrial',
      'Quadro de Distribuição de Corrente Contínua (QDCC)',
      'Quadro de Distribuição de Corrente Alternada (QDCA)',
      'Grupo Moto-Gerador de Emergência (GMG)',
      'Chave de Transferência Automática (QTA)',
      'Fonte de Alimentação Auxiliar',
    ],
  },
  {
    nome: 'Instrumentos de Ensaio, Calibração & Diagnóstico',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    tipos: [
      'Mala de Testes Microprocessada',
      'Megômetro Digital de Alta Tensão',
      'Microhmômetro de Contato',
      'Terrômetro / Medidor de Malha de Terra',
      'Analisador de Resposta em Frequência (SFRA)',
      'TTR (Medidor de Relação de Espiras)',
      'Câmera Termográfica Radiométrica (Termovisor)',
      'Analisador de Qualidade de Energia (AQE)',
      'Analisador de Gases Dissolvidos (DGA Online)',
      'Sensor de Descargas Parciais / Bucha',
      'Osciloscópio Digital Portátil de Campo',
    ],
  },
  {
    nome: 'Outros Equipamentos Especiais',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    tipos: ['Outro Equipamento Especial'],
  },
];

export type EstadoConservacao = 'Novo' | 'Bom' | 'Regular' | 'Necessita Reparo' | 'Danificado';

export type EstadoOperacional =
  | 'Em Operação'
  | 'Sobressalente / Estoque'
  | 'Em Manutenção'
  | 'Em Ensaio'
  | 'Retirado'
  | 'Baixado';

export interface Equipamento {
  id: string;
  codigoPatrimonial: string;
  tipo: TipoEquipamento;
  descricao: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  qrCode: string;
  subestacaoId: string | null;
  painelId: string | null;
  moduloId: string | null;
  almoxarifadoId: string | null;
  localizacaoDescricao: string;
  estadoConservacao: EstadoConservacao;
  estadoOperacional: EstadoOperacional;
  responsavel: string;
  dataRetirada?: string;
  dataInstalacao?: string;
  dataAquisicao?: string;
  garantiaAte?: string;
  documentosTecnicos: { nome: string; url: string; tipo: string }[];
  fotografias: string[];
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoOperacaoMovimentacao =
  | 'Instalação'
  | 'Retirada'
  | 'Transferência de Painel'
  | 'Transferência de Subestação'
  | 'Envio para Manutenção'
  | 'Envio para Ensaios'
  | 'Retorno ao Almoxarifado'
  | 'Entrada de Estoque'
  | 'Baixa Patrimonial';

export interface Movimentacao {
  id: string;
  equipamentoId: string;
  equipamentoDescricao: string;
  equipamentoPatrimonio: string;
  tipoOperacao: TipoOperacaoMovimentacao;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioPerfil: PerfilUsuario;
  responsavelAutorizacao?: string;
  origemSubestacaoId?: string;
  origemSubestacaoNome?: string;
  origemPainelId?: string;
  origemPainelNome?: string;
  origemModuloId?: string;
  origemModuloNome?: string;
  destinoSubestacaoId?: string;
  destinoSubestacaoNome?: string;
  destinoPainelId?: string;
  destinoPainelNome?: string;
  destinoModuloId?: string;
  destinoModuloNome?: string;
  destinoAlmoxarifadoId?: string;
  destinoAlmoxarifadoNome?: string;
  motivo: string;
  ordemServicoId?: string;
  ordemServicoNumero?: string;
  observacoes: string;
  fotos?: string[];
}

export type CategoriaMaterial =
  | 'Cabos e Condutores'
  | 'Conectores e Terminais'
  | 'Fusíveis e Proteção Auxiliar'
  | 'Componentes Eletrônicos'
  | 'Disjuntores Auxiliares'
  | 'Isolação e Vedação'
  | 'Peças Mecânicas'
  | 'Ferramentas'
  | 'Outros';

export type UnidadeMedida = 'un' | 'metro' | 'rolo' | 'kg' | 'cx' | 'par' | 'litro';

export type TipoMaterial = 'Consumível' | 'Sobressalente' | 'Ferramenta Reutilizável';

export interface Material {
  id: string;
  codigoInterno: string;
  descricao: string;
  categoria: CategoriaMaterial;
  fabricante: string;
  referenciaModelo: string;
  unidadeMedida: UnidadeMedida;
  quantidadeFisica: number;
  quantidadeReservada: number;
  quantidadeDisponivel: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  custoUnitario: number;
  fornecedorId: string;
  fornecedorNome: string;
  almoxarifadoId: string;
  almoxarifadoNome: string;
  prateleiraPosicao: string;
  controleLote?: string;
  numeroSerie?: string;
  validade?: string;
  codigoBarrasQr: string;
  tipoMaterial: TipoMaterial;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoOperacaoMaterial =
  | 'Entrada por Compra'
  | 'Entrada por Devolução'
  | 'Saída para Manutenção'
  | 'Consumo em Ordem de Serviço'
  | 'Transferência entre Almoxarifados'
  | 'Reserva de Materiais'
  | 'Devolução ao Estoque'
  | 'Ajuste de Inventário'
  | 'Estorno';

export interface MovimentacaoMaterial {
  id: string;
  materialId: string;
  materialDescricao: string;
  materialCodigo: string;
  tipoOperacao: TipoOperacaoMaterial;
  quantidade: number;
  unidadeMedida: UnidadeMedida;
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  origem: string;
  destino: string;
  motivo: string;
  documentoReferencia?: string;
  ordemServicoId?: string;
  ordemServicoNumero?: string;
}

export type StatusOS =
  | 'Aberta'
  | 'Em Andamento'
  | 'Aguardando Peças'
  | 'Concluída'
  | 'Cancelada';

export type PrioridadeOS = 'Baixa' | 'Média' | 'Alta' | 'Emergencial';

export interface MaterialRequisitadoOS {
  materialId: string;
  descricao: string;
  quantidade: number;
  unidade: UnidadeMedida;
  reservado: boolean;
  consumido: boolean;
}

export interface EquipamentoMovimentadoOS {
  equipamentoId: string;
  patrimonio: string;
  descricao: string;
  acao: 'Instalado' | 'Retirado' | 'Substituído';
}

export interface OrdemServico {
  id: string;
  numero: string;
  titulo: string;
  subestacaoId: string;
  subestacaoNome: string;
  painelId?: string;
  painelNome?: string;
  equipamentoId?: string;
  equipamentoNome?: string;
  descricaoServico: string;
  tipoManutencao: 'Preventiva' | 'Corretiva' | 'Preditiva' | 'Instalação / Ampliação' | 'Ensaio Periódico' | 'Comissionamento';
  prioridade: PrioridadeOS;
  status: StatusOS;
  responsavelId: string;
  responsavelNome: string;
  equipeExecutora: string;
  dataAbertura: string;
  prazoLimite: string;
  dataConclusao?: string;
  materiaisRequisitados: MaterialRequisitadoOS[];
  equipamentosMovimentados: EquipamentoMovimentadoOS[];
  observacoes: string;
}

export interface ItemInventario {
  itemTipo: 'equipamento' | 'material';
  itemId: string;
  codigo: string;
  descricao: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  diferenca: number;
  statusDivergencia: 'Exato' | 'Falta' | 'Sobra';
  observacao?: string;
}

export interface InventarioFisico {
  id: string;
  codigo: string;
  dataCriacao: string;
  dataFinalizacao?: string;
  tipoLocal: 'subestacao' | 'almoxarifado';
  localId: string;
  localNome: string;
  responsavelId: string;
  responsavelNome: string;
  status: 'Em Contagem' | 'Aguardando Aprovação' | 'Aprovado' | 'Cancelado';
  itens: ItemInventario[];
  observacaoGeral?: string;
  aprovadoPor?: string;
  dataAprovacao?: string;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  categoriaFornecimento: string;
  ativo: boolean;
}

export interface AuditoriaLog {
  id: string;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  perfil: PerfilUsuario;
  acao: string;
  modulo: string;
  ip: string;
  entidadeId?: string;
  detalhes: string;
}

export interface ConfiguracaoSistema {
  nomeEmpresa: string;
  cnpjEmpresa: string;
  regiaoConcessao: string;
  alertaEstoqueMinimo: boolean;
  permitirSaldoNegativo: boolean;
  formatoEtiqueta: 'Padrão 60x40mm' | 'Compacta 40x25mm' | 'A4 Múltiplas';
  rodapeRelatorio: string;
}

export interface DashboardStats {
  totalEquipamentos: number;
  equipamentosInstalados: number;
  equipamentosRetirados: number;
  equipamentosManutencao: number;
  equipamentosEstoque: number;
  equipamentosSemLocalizacao: number;
  totalMateriaisDisponiveis: number;
  materiaisAbaixoMinimo: number;
  valorTotalEstoque: number;
  ordensServicoAndamento: number;
  movimentacoesRecentes: Movimentacao[];
  movimentacoesMateriaisRecentes: MovimentacaoMaterial[];
  ordensRecentes: OrdemServico[];
  equipamentosCriticos: Equipamento[];
}
