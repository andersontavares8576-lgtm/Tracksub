import {
  Usuario,
  Subestacao,
  Painel,
  Modulo,
  Almoxarifado,
  Equipamento,
  Material,
  Movimentacao,
  MovimentacaoMaterial,
  OrdemServico,
  InventarioFisico,
  Fornecedor,
  AuditoriaLog,
  ConfiguracaoSistema,
  DashboardStats,
  PerfilUsuario,
} from '../types/tracksub.ts';
import { firestoreService } from './firestoreService.ts';

export const api = {
  // Conectividade e Status Cloud
  verificarConexao: () => firestoreService.verificarConexao(),

  // Autenticação e Usuários
  getCurrentUser: async (): Promise<Usuario> => firestoreService.getCurrentUser(),
  getUsuarios: async (): Promise<Usuario[]> => firestoreService.getUsuarios(),
  switchUser: async (userId: string): Promise<Usuario> => firestoreService.switchUser(userId),
  createCustomUser: async (perfil: PerfilUsuario, nome: string, cargo: string): Promise<Usuario> => {
    return firestoreService.salvarUsuario({
      nome,
      cargo,
      perfil,
      email: `${nome.toLowerCase().replace(/[^a-z0-9]/g, '')}@tracksub.com.br`,
      matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  },
  loginComEmailSenha: (email: string, pass: string) => firestoreService.loginComEmailSenha(email, pass),
  criarConta: (email: string, pass: string, nome: string, cargo: string, perfil: PerfilUsuario) =>
    firestoreService.criarConta(email, pass, nome, cargo, perfil),
  excluirUsuario: async (userId: string) => firestoreService.excluirUsuario(userId),
  logout: () => firestoreService.logout(),

  // Dashboard & Métricas
  getDashboardStats: async (subestacaoId?: string): Promise<DashboardStats> =>
    firestoreService.getDashboardStats(subestacaoId),

  // Subestações
  getSubestacoes: async (): Promise<Subestacao[]> => firestoreService.getSubestacoes(),
  salvarSubestacao: async (sub: Partial<Subestacao>): Promise<Subestacao> => firestoreService.salvarSubestacao(sub),
  excluirSubestacao: async (id: string): Promise<{ success: boolean; message: string }> => {
    await firestoreService.excluirSubestacao(id);
    return { success: true, message: 'Subestação excluída com sucesso no Cloud Firestore.' };
  },

  // Painéis
  getPaineis: async (subestacaoId?: string): Promise<Painel[]> => firestoreService.getPaineis(subestacaoId),
  salvarPainel: async (painel: Partial<Painel>): Promise<Painel> => firestoreService.salvarPainel(painel),
  excluirPainel: async (id: string): Promise<{ success: boolean; message: string }> => {
    await firestoreService.excluirPainel(id);
    return { success: true, message: 'Painel excluído com sucesso.' };
  },

  // Módulos
  getModulos: async (painelId?: string): Promise<Modulo[]> => firestoreService.getModulos(painelId),
  salvarModulo: async (modulo: Partial<Modulo>): Promise<Modulo> => firestoreService.salvarModulo(modulo),
  excluirModulo: async (id: string): Promise<{ success: boolean; message: string }> => {
    await firestoreService.excluirModulo(id);
    return { success: true, message: 'Módulo excluído com sucesso.' };
  },

  // Almoxarifados
  getAlmoxarifados: async (): Promise<Almoxarifado[]> => firestoreService.getAlmoxarifados(),
  salvarAlmoxarifado: async (almox: Partial<Almoxarifado>): Promise<Almoxarifado> => firestoreService.salvarAlmoxarifado(almox),

  // Fornecedores
  getFornecedores: async (): Promise<Fornecedor[]> => firestoreService.getFornecedores(),
  salvarFornecedor: async (forn: Partial<Fornecedor>): Promise<Fornecedor> => firestoreService.salvarFornecedor(forn),

  // Equipamentos (Cloud Firestore com QR Code Único e Rastreabilidade)
  getEquipamentos: async (filtros?: {
    termo?: string;
    subestacaoId?: string;
    tipo?: string;
    estadoOperacional?: string;
    estadoConservacao?: string;
  }): Promise<Equipamento[]> => firestoreService.getEquipamentos(filtros),
  getEquipamentoById: async (id: string): Promise<Equipamento> => firestoreService.getEquipamentoById(id),
  buscarEquipamentoPorCodigo: async (codigo: string): Promise<Equipamento> => firestoreService.buscarEquipamentoPorCodigo(codigo),
  salvarEquipamento: async (eqp: Partial<Equipamento>): Promise<Equipamento> => firestoreService.salvarEquipamento(eqp),
  salvarEquipamentosLote: async (itens: Partial<Equipamento>[], opcoes?: { sobrescreverDuplicados?: boolean }) =>
    firestoreService.salvarEquipamentosLote(itens, opcoes),
  gerarLoteEquipamentos: async (params: { quantidade: number; prefixo?: string; criarInfraestruturaSeVazia?: boolean }) => {
    const prefixo = params.prefixo || 'PAT-2026-';
    const lista: Partial<Equipamento>[] = [];
    const hoje = new Date().toISOString().split('T')[0];

    for (let i = 1; i <= Math.min(params.quantidade, 500); i++) {
      const cod = `${prefixo}${String(i).padStart(5, '0')}`;
      lista.push({
        codigoPatrimonial: cod,
        descricao: `Equipamento de Subestação #${i}`,
        tipo: 'Multimedidor Digital de Grandezas Elétricas',
        fabricante: 'Kron Medidores / Schneider',
        modelo: 'Linha Pro 230kV',
        numeroSerie: `SN-${cod}`,
        qrCode: `TRACKSUB-${cod}`,
        localizacaoDescricao: 'Almoxarifado Central / Triagem Inicial',
        estadoOperacional: 'Sobressalente / Estoque',
        estadoConservacao: 'Novo',
        dataAquisicao: hoje,
      });
    }

    const res = await firestoreService.salvarEquipamentosLote(lista, { sobrescreverDuplicados: true });
    return {
      success: true,
      totalCadastrados: res.totalCadastrados,
      totalNoBanco: res.totalNoBanco,
      subestacoesCriadas: 0,
    };
  },
  excluirEquipamentosLote: async (ids: string[]) => firestoreService.excluirEquipamentosLote(ids),
  excluirEquipamento: async (id: string): Promise<{ success: boolean; message: string }> => {
    await firestoreService.excluirEquipamento(id);
    return { success: true, message: 'Equipamento excluído com sucesso no Cloud Firestore.' };
  },

  // Movimentações & Rastreabilidade (Append-only histórico indelével)
  getMovimentacoes: async (equipamentoId?: string): Promise<Movimentacao[]> => firestoreService.getMovimentacoes(equipamentoId),
  registrarMovimentacao: async (payload: {
    equipamentoId: string;
    tipoOperacao: Movimentacao['tipoOperacao'];
    destinoSubestacaoId?: string;
    destinoPainelId?: string;
    destinoModuloId?: string;
    destinoAlmoxarifadoId?: string;
    motivo: string;
    ordemServicoId?: string;
    responsavelAutorizacao?: string;
    observacoes?: string;
    novoEstadoConservacao?: Equipamento['estadoConservacao'];
  }): Promise<Movimentacao> => firestoreService.registrarMovimentacao(payload),

  // Materiais (Estoque)
  getMateriais: async (): Promise<Material[]> => firestoreService.getMateriais(),
  getMaterialById: async (id: string): Promise<Material> => {
    const mats = await firestoreService.getMateriais();
    const achado = mats.find((m) => m.id === id);
    if (!achado) throw new Error('Material não localizado.');
    return achado;
  },
  salvarMaterial: async (mat: Partial<Material>): Promise<Material> => firestoreService.salvarMaterial(mat),
  excluirMaterial: async (id: string): Promise<{ success: boolean; message: string }> =>
    firestoreService.excluirMaterial(id),
  zerarEstoqueMaterial: async (id: string): Promise<Material> =>
    firestoreService.zerarEstoqueMaterial(id),
  zerarTodoEstoqueMateriais: async (): Promise<{ success: boolean; totalAfetados: number }> =>
    firestoreService.zerarTodoEstoqueMateriais(),
  excluirTodosMateriaisEEstoque: async (): Promise<{ success: boolean; totalExcluidos: number }> =>
    firestoreService.excluirTodosMateriaisEEstoque(),
  movimentarEstoque: async (payload: any): Promise<MovimentacaoMaterial> =>
    firestoreService.registrarMovimentacaoMaterial(payload),
  getMovimentacoesMateriais: async (): Promise<MovimentacaoMaterial[]> =>
    firestoreService.getMovimentacoesMateriais(),

  // Ordens de Serviço
  getOrdensServico: async (): Promise<OrdemServico[]> => firestoreService.getOrdensServico(),
  getOrdemServicoById: async (id: string): Promise<OrdemServico> => {
    const ords = await firestoreService.getOrdensServico();
    const achada = ords.find((o) => o.id === id);
    if (!achada) throw new Error('Ordem de serviço não localizada.');
    return achada;
  },
  salvarOrdemServico: async (os: Partial<OrdemServico>): Promise<OrdemServico> => firestoreService.salvarOrdemServico(os),
  consumirMaterialOS: async (osId: string, materialId: string, quantidade: number): Promise<OrdemServico> => {
    const os = await api.getOrdemServicoById(osId);
    const mat = await api.getMaterialById(materialId);
    const novaQtd = Math.max(0, mat.quantidadeFisica - quantidade);
    await firestoreService.salvarMaterial({
      ...mat,
      quantidadeFisica: novaQtd,
      quantidadeDisponivel: Math.max(0, novaQtd - mat.quantidadeReservada),
    });
    return os;
  },

  // Inventários Físicos (Cloud Firestore)
  getInventarios: async (): Promise<InventarioFisico[]> => firestoreService.getInventarios(),
  getInventarioById: async (id: string): Promise<InventarioFisico> => {
    const invs = await firestoreService.getInventarios();
    const achado = invs.find((i) => i.id === id);
    if (!achado) throw new Error('Inventário não localizado.');
    return achado;
  },
  criarInventario: async (payload: { tipoLocal: 'subestacao' | 'almoxarifado'; localId: string; observacaoGeral?: string }): Promise<InventarioFisico> =>
    firestoreService.criarInventario(payload),
  registrarContagemItem: async (invId: string, itemId: string, quantidadeContada: number, observacao?: string): Promise<InventarioFisico> =>
    firestoreService.registrarContagemItem(invId, itemId, quantidadeContada, observacao),
  aprovarInventario: async (invId: string): Promise<InventarioFisico> =>
    firestoreService.aprovarInventario(invId),

  // Auditoria
  getAuditoria: async (): Promise<AuditoriaLog[]> => firestoreService.getAuditoria(),

  // Configurações
  getConfiguracoes: async (): Promise<ConfiguracaoSistema> => firestoreService.getConfiguracoes(),
  salvarConfiguracoes: async (config: Partial<ConfiguracaoSistema>): Promise<ConfiguracaoSistema> =>
    firestoreService.salvarConfiguracoes(config),
  redefinirDadosDemonstracao: async (): Promise<{ success: boolean; message: string }> => {
    await firestoreService.inicializarBaseDemonstracao();
    return { success: true, message: 'Base de demonstração restaurada com sucesso no Cloud Firestore.' };
  },
  zerarAtivos: async (): Promise<{ success: boolean; message: string }> => {
    const res = await firestoreService.zerarEquipamentosESubestacoes();
    return { success: true, message: `${res.totalExcluidos} registros de equipamentos, subestações, painéis e históricos foram excluídos do Cloud Firestore.` };
  },
  zerarMateriais: async (): Promise<{ success: boolean; message: string }> => {
    const res = await firestoreService.excluirTodosMateriaisEEstoque();
    return { success: true, message: `${res.totalExcluidos} registros de materiais e movimentações foram excluídos do Cloud Firestore.` };
  },
  zerarTodoEstoque: async (): Promise<{ success: boolean; message: string }> => {
    const res = await firestoreService.zerarTodoEstoqueMateriais();
    return { success: true, message: `O saldo de estoque de ${res.totalAfetados} materiais foi zerado com sucesso.` };
  },

  // Estratégia de Backup e Recuperação
  exportarBackupCompleto: (): Promise<string> => firestoreService.exportarBackupCompleto(),
  restaurarBackup: (json: string): Promise<{ success: boolean; registrosRestaurados: number }> =>
    firestoreService.restaurarBackup(json),

  // Relatórios
  getRelatorioResumo: async (): Promise<any> => {
    const stats = await firestoreService.getDashboardStats();
    return { stats, geradoEm: new Date().toISOString() };
  },
};
