import fs from 'fs';
import path from 'path';
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

import {
  usuariosIniciais,
  subestacoesIniciais,
  paineisIniciais,
  modulosIniciais,
  almoxarifadosIniciais,
  fornecedoresIniciais,
  equipamentosIniciais,
  movimentacoesIniciais,
  materiaisIniciais,
  movimentacoesMateriaisIniciais,
  ordensServicoIniciais,
  inventariosIniciais,
  auditoriaIniciais,
  configuracaoInicial,
} from './seedData.ts';

export interface DatabaseSchema {
  usuarios: Usuario[];
  subestacoes: Subestacao[];
  paineis: Painel[];
  modulos: Modulo[];
  almoxarifados: Almoxarifado[];
  fornecedores: Fornecedor[];
  equipamentos: Equipamento[];
  movimentacoes: Movimentacao[];
  materiais: Material[];
  movimentacoesMateriais: MovimentacaoMaterial[];
  ordensServico: OrdemServico[];
  inventarios: InventarioFisico[];
  auditoria: AuditoriaLog[];
  configuracao: ConfiguracaoSistema;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tracksub-data.json');

class DatabaseService {
  private data: DatabaseSchema;
  private currentUser: Usuario;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
    this.currentUser = this.data.usuarios[0] || usuariosIniciais[0];
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Erro ao ler banco de dados JSON. Inicializando com dados padrão.', err);
    }

    const initialData: DatabaseSchema = {
      usuarios: usuariosIniciais,
      subestacoes: subestacoesIniciais,
      paineis: paineisIniciais,
      modulos: modulosIniciais,
      almoxarifados: almoxarifadosIniciais,
      fornecedores: fornecedoresIniciais,
      equipamentos: equipamentosIniciais,
      movimentacoes: movimentacoesIniciais,
      materiais: materiaisIniciais,
      movimentacoesMateriais: movimentacoesMateriaisIniciais,
      ordensServico: ordensServicoIniciais,
      inventarios: inventariosIniciais,
      auditoria: auditoriaIniciais,
      configuracao: configuracaoInicial,
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const payload = dataToSave || this.data;
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Erro ao persistir banco de dados em disco:', err);
    }
  }

  // --- Usuário Atual e Autenticação ---
  public getCurrentUser(): Usuario {
    return this.currentUser;
  }

  public setCurrentUser(userId: string): Usuario {
    const user = this.data.usuarios.find((u) => u.id === userId);
    if (!user) throw new Error('Usuário não localizado no sistema.');
    this.currentUser = user;
    this.registrarAuditoria('Troca de Perfil / Usuário', 'Autenticação', user.id, `Usuário ativo alterado para ${user.nome} (${user.perfil}).`);
    return this.currentUser;
  }

  public setCustomUser(perfil: PerfilUsuario, nome: string, cargo: string): Usuario {
    const customUser: Usuario = {
      id: `usr-custom-${Date.now()}`,
      nome,
      email: `${nome.toLowerCase().replace(/\s+/g, '.')}@tracksub.com.br`,
      perfil,
      cargo,
      matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    this.data.usuarios.push(customUser);
    this.currentUser = customUser;
    this.saveData();
    this.registrarAuditoria('Novo Usuário Criado', 'Usuários e Permissões', customUser.id, `Criado usuário ${customUser.nome} com perfil ${customUser.perfil}.`);
    return customUser;
  }

  public getUsuarios(): Usuario[] {
    return this.data.usuarios;
  }

  // --- Auditoria ---
  public registrarAuditoria(acao: string, modulo: string, entidadeId: string | undefined, detalhes: string) {
    const log: AuditoriaLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toISOString(),
      usuarioId: this.currentUser.id,
      usuarioNome: this.currentUser.nome,
      perfil: this.currentUser.perfil,
      acao,
      modulo,
      ip: '127.0.0.1 (Local/Proxy)',
      entidadeId,
      detalhes,
    };
    this.data.auditoria.unshift(log);
    // Limite a 500 logs para manter arquivo enxuto
    if (this.data.auditoria.length > 500) {
      this.data.auditoria = this.data.auditoria.slice(0, 500);
    }
    this.saveData();
  }

  public getAuditoria(): AuditoriaLog[] {
    return this.data.auditoria;
  }

  // --- Dashboard Stats ---
  public getDashboardStats(subestacaoIdFilter?: string): DashboardStats {
    let eqps = this.data.equipamentos;
    if (subestacaoIdFilter && subestacaoIdFilter !== 'todas') {
      eqps = eqps.filter((e) => e.subestacaoId === subestacaoIdFilter);
    }

    const totalEquipamentos = eqps.length;
    const equipamentosInstalados = eqps.filter((e) => e.estadoOperacional === 'Em Operação').length;
    const equipamentosRetirados = eqps.filter((e) => e.estadoOperacional === 'Retirado').length;
    const equipamentosManutencao = eqps.filter((e) => e.estadoOperacional === 'Em Manutenção' || e.estadoOperacional === 'Em Ensaio').length;
    const equipamentosEstoque = eqps.filter((e) => e.estadoOperacional === 'Sobressalente / Estoque').length;
    const equipamentosSemLocalizacao = eqps.filter((e) => !e.subestacaoId && !e.almoxarifadoId && e.estadoOperacional !== 'Baixado').length;

    const totalMateriaisDisponiveis = this.data.materiais.reduce((acc, m) => acc + m.quantidadeDisponivel, 0);
    const materiaisAbaixoMinimo = this.data.materiais.filter((m) => m.quantidadeFisica <= m.estoqueMinimo).length;
    const valorTotalEstoque = this.data.materiais.reduce((acc, m) => acc + (m.quantidadeFisica * m.custoUnitario), 0);

    const ordensServicoAndamento = this.data.ordensServico.filter((os) => os.status === 'Em Andamento' || os.status === 'Aberta').length;

    return {
      totalEquipamentos,
      equipamentosInstalados,
      equipamentosRetirados,
      equipamentosManutencao,
      equipamentosEstoque,
      equipamentosSemLocalizacao,
      totalMateriaisDisponiveis,
      materiaisAbaixoMinimo,
      valorTotalEstoque,
      ordensServicoAndamento,
      movimentacoesRecentes: this.data.movimentacoes.slice(0, 8),
      movimentacoesMateriaisRecentes: this.data.movimentacoesMateriais.slice(0, 8),
      ordensRecentes: this.data.ordensServico.slice(0, 5),
      equipamentosCriticos: this.data.equipamentos.filter((e) => e.estadoConservacao === 'Necessita Reparo' || e.estadoConservacao === 'Danificado' || e.estadoOperacional === 'Em Manutenção'),
    };
  }

  // --- Subestações, Painéis e Módulos ---
  public getSubestacoes(): Subestacao[] {
    return this.data.subestacoes;
  }

  public getSubestacaoById(id: string): Subestacao | undefined {
    return this.data.subestacoes.find((s) => s.id === id);
  }

  public salvarSubestacao(subestacao: Partial<Subestacao>): Subestacao {
    if (subestacao.id) {
      const idx = this.data.subestacoes.findIndex((s) => s.id === subestacao.id);
      if (idx === -1) throw new Error('Subestação não encontrada.');
      this.data.subestacoes[idx] = { ...this.data.subestacoes[idx], ...subestacao } as Subestacao;
      this.saveData();
      this.registrarAuditoria('Alteração de Subestação', 'Subestações', subestacao.id, `Subestação ${subestacao.nome} atualizada.`);
      return this.data.subestacoes[idx];
    } else {
      const nova: Subestacao = {
        id: `se-${Date.now()}`,
        codigo: subestacao.codigo || `SE-${Math.floor(100 + Math.random() * 900)}`,
        nome: subestacao.nome || 'Nova Subestação',
        tensaoPrimaria: subestacao.tensaoPrimaria || '230 kV',
        tensaoSecundaria: subestacao.tensaoSecundaria || '69 kV',
        endereco: subestacao.endereco || '',
        cidade: subestacao.cidade || 'Porto Alegre',
        uf: subestacao.uf || 'RS',
        latitude: subestacao.latitude || -30.0,
        longitude: subestacao.longitude || -51.0,
        ativa: subestacao.ativa ?? true,
        observacoes: subestacao.observacoes || '',
      };
      this.data.subestacoes.push(nova);
      this.saveData();
      this.registrarAuditoria('Cadastro de Subestação', 'Subestações', nova.id, `Subestação ${nova.nome} cadastrada.`);
      return nova;
    }
  }

  public excluirSubestacao(id: string): boolean {
    const idx = this.data.subestacoes.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subestação não encontrada.');
    const nome = this.data.subestacoes[idx].nome;
    this.data.subestacoes.splice(idx, 1);
    this.data.paineis = this.data.paineis.filter((p) => p.subestacaoId !== id);
    this.data.modulos = this.data.modulos.filter((m) => m.subestacaoId !== id);
    for (const eqp of this.data.equipamentos) {
      if (eqp.subestacaoId === id) {
        eqp.subestacaoId = null;
        eqp.painelId = null;
        eqp.moduloId = null;
        eqp.localizacaoDescricao = 'Sem Localização Confirmada (Subestação excluída)';
      }
    }
    this.saveData();
    this.registrarAuditoria('Exclusão de Subestação', 'Subestações', id, `Subestação ${nome} excluída.`);
    return true;
  }

  public getPaineis(subestacaoId?: string): Painel[] {
    if (subestacaoId && subestacaoId !== 'todas') {
      return this.data.paineis.filter((p) => p.subestacaoId === subestacaoId);
    }
    return this.data.paineis;
  }

  public salvarPainel(painel: Partial<Painel>): Painel {
    if (painel.id) {
      const idx = this.data.paineis.findIndex((p) => p.id === painel.id);
      if (idx === -1) throw new Error('Painel não encontrado.');
      this.data.paineis[idx] = { ...this.data.paineis[idx], ...painel } as Painel;
      this.saveData();
      this.registrarAuditoria('Alteração de Painel', 'Painéis e Módulos', painel.id, `Painel ${painel.identificacao} alterado.`);
      return this.data.paineis[idx];
    } else {
      const novo: Painel = {
        id: `pnl-${Date.now()}`,
        subestacaoId: painel.subestacaoId || '',
        codigo: painel.codigo || `PNL-${Math.floor(100 + Math.random() * 900)}`,
        identificacao: painel.identificacao || 'Novo Painel',
        funcao: painel.funcao || 'Proteção e Controle',
        tensao: painel.tensao || '230 kV',
        tipo: painel.tipo || 'Painel Autoportante',
        ativo: painel.ativo ?? true,
        observacoes: painel.observacoes || '',
      };
      this.data.paineis.push(novo);
      this.saveData();
      this.registrarAuditoria('Cadastro de Painel', 'Painéis e Módulos', novo.id, `Painel ${novo.identificacao} cadastrado.`);
      return novo;
    }
  }

  public excluirPainel(id: string): boolean {
    const idx = this.data.paineis.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Painel não encontrado.');
    const nome = this.data.paineis[idx].identificacao;
    this.data.paineis.splice(idx, 1);
    this.data.modulos = this.data.modulos.filter((m) => m.painelId !== id);
    for (const eqp of this.data.equipamentos) {
      if (eqp.painelId === id) {
        eqp.painelId = null;
        eqp.moduloId = null;
      }
    }
    this.saveData();
    this.registrarAuditoria('Exclusão de Painel', 'Painéis e Módulos', id, `Painel ${nome} excluído.`);
    return true;
  }

  public getModulos(painelId?: string): Modulo[] {
    if (painelId && painelId !== 'todos') {
      return this.data.modulos.filter((m) => m.painelId === painelId);
    }
    return this.data.modulos;
  }

  public salvarModulo(modulo: Partial<Modulo>): Modulo {
    if (modulo.id) {
      const idx = this.data.modulos.findIndex((m) => m.id === modulo.id);
      if (idx === -1) throw new Error('Módulo não encontrado.');
      this.data.modulos[idx] = { ...this.data.modulos[idx], ...modulo } as Modulo;
      this.saveData();
      this.registrarAuditoria('Alteração de Módulo', 'Painéis e Módulos', modulo.id, `Módulo ${modulo.identificacao} alterado.`);
      return this.data.modulos[idx];
    } else {
      const novo: Modulo = {
        id: `mod-${Date.now()}`,
        painelId: modulo.painelId || '',
        subestacaoId: modulo.subestacaoId || '',
        codigo: modulo.codigo || `MOD-${Math.floor(10 + Math.random() * 90)}`,
        identificacao: modulo.identificacao || 'Novo Módulo',
        posicao: modulo.posicao || 'Rack 19"',
        observacoes: modulo.observacoes || '',
      };
      this.data.modulos.push(novo);
      this.saveData();
      this.registrarAuditoria('Cadastro de Módulo', 'Painéis e Módulos', novo.id, `Módulo ${novo.identificacao} criado.`);
      return novo;
    }
  }

  public excluirModulo(id: string): boolean {
    const idx = this.data.modulos.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Módulo não encontrado.');
    const nome = this.data.modulos[idx].identificacao;
    this.data.modulos.splice(idx, 1);
    for (const eqp of this.data.equipamentos) {
      if (eqp.moduloId === id) {
        eqp.moduloId = null;
      }
    }
    this.saveData();
    this.registrarAuditoria('Exclusão de Módulo', 'Painéis e Módulos', id, `Módulo ${nome} excluído.`);
    return true;
  }

  // --- Almoxarifados ---
  public getAlmoxarifados(): Almoxarifado[] {
    return this.data.almoxarifados;
  }

  public salvarAlmoxarifado(almoxarifado: Partial<Almoxarifado>): Almoxarifado {
    if (almoxarifado.id) {
      const idx = this.data.almoxarifados.findIndex((a) => a.id === almoxarifado.id);
      if (idx === -1) throw new Error('Almoxarifado não encontrado.');
      this.data.almoxarifados[idx] = { ...this.data.almoxarifados[idx], ...almoxarifado } as Almoxarifado;
      this.saveData();
      return this.data.almoxarifados[idx];
    } else {
      const novo: Almoxarifado = {
        id: `alm-${Date.now()}`,
        codigo: almoxarifado.codigo || `ALM-${Math.floor(10 + Math.random() * 90)}`,
        nome: almoxarifado.nome || 'Novo Almoxarifado',
        subestacaoId: almoxarifado.subestacaoId,
        subestacaoNome: almoxarifado.subestacaoNome,
        responsavel: almoxarifado.responsavel || this.currentUser.nome,
        localizacao: almoxarifado.localizacao || '',
        tipo: almoxarifado.tipo || 'Avançado de Subestação',
        ativo: almoxarifado.ativo ?? true,
      };
      this.data.almoxarifados.push(novo);
      this.saveData();
      this.registrarAuditoria('Cadastro de Almoxarifado', 'Almoxarifados', novo.id, `Almoxarifado ${novo.nome} criado.`);
      return novo;
    }
  }

  // --- Fornecedores ---
  public getFornecedores(): Fornecedor[] {
    return this.data.fornecedores;
  }

  public salvarFornecedor(fornecedor: Partial<Fornecedor>): Fornecedor {
    if (fornecedor.id) {
      const idx = this.data.fornecedores.findIndex((f) => f.id === fornecedor.id);
      if (idx === -1) throw new Error('Fornecedor não encontrado.');
      this.data.fornecedores[idx] = { ...this.data.fornecedores[idx], ...fornecedor } as Fornecedor;
      this.saveData();
      return this.data.fornecedores[idx];
    } else {
      const novo: Fornecedor = {
        id: `forn-${Date.now()}`,
        razaoSocial: fornecedor.razaoSocial || '',
        nomeFantasia: fornecedor.nomeFantasia || '',
        cnpj: fornecedor.cnpj || '',
        contato: fornecedor.contato || '',
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        endereco: fornecedor.endereco || '',
        categoriaFornecimento: fornecedor.categoriaFornecimento || 'Equipamentos e Materiais Elétricos',
        ativo: fornecedor.ativo ?? true,
      };
      this.data.fornecedores.push(novo);
      this.saveData();
      this.registrarAuditoria('Cadastro de Fornecedor', 'Fornecedores', novo.id, `Fornecedor ${novo.nomeFantasia} cadastrado.`);
      return novo;
    }
  }

  // --- Equipamentos ---
  public getEquipamentos(filtros?: {
    termo?: string;
    subestacaoId?: string;
    tipo?: string;
    estadoOperacional?: string;
    estadoConservacao?: string;
  }): Equipamento[] {
    let result = this.data.equipamentos;

    if (filtros?.termo) {
      const t = filtros.termo.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.codigoPatrimonial.toLowerCase().includes(t) ||
          e.descricao.toLowerCase().includes(t) ||
          e.numeroSerie.toLowerCase().includes(t) ||
          e.fabricante.toLowerCase().includes(t) ||
          e.modelo.toLowerCase().includes(t) ||
          e.qrCode.toLowerCase().includes(t)
      );
    }

    if (filtros?.subestacaoId && filtros.subestacaoId !== 'todas') {
      result = result.filter((e) => e.subestacaoId === filtros.subestacaoId);
    }

    if (filtros?.tipo && filtros.tipo !== 'todos') {
      result = result.filter((e) => e.tipo === filtros.tipo);
    }

    if (filtros?.estadoOperacional && filtros.estadoOperacional !== 'todos') {
      result = result.filter((e) => e.estadoOperacional === filtros.estadoOperacional);
    }

    if (filtros?.estadoConservacao && filtros.estadoConservacao !== 'todos') {
      result = result.filter((e) => e.estadoConservacao === filtros.estadoConservacao);
    }

    return result;
  }

  public getEquipamentoById(id: string): Equipamento | undefined {
    return this.data.equipamentos.find((e) => e.id === id);
  }

  public getEquipamentoByQRCodeOrPatrimonio(codigo: string): Equipamento | undefined {
    if (!codigo) return undefined;
    const raw = codigo.trim();

    // 1. Extração se o QR code lido for uma URL ou possuir query parameters (?eqp=..., &eqp=..., etc)
    let parametroUrl = '';
    const matchQuery = raw.match(/[?&#](?:eqp|equipamento|patrimonio|codigo|id)=([^&#]+)/i);
    if (matchQuery && matchQuery[1]) {
      try {
        parametroUrl = decodeURIComponent(matchQuery[1]).trim();
      } catch {
        parametroUrl = matchQuery[1].trim();
      }
    }

    const clean = raw.toUpperCase();
    const cleanParam = parametroUrl ? parametroUrl.toUpperCase() : '';

    // Candidatos a testar
    const candidatos: string[] = [];
    if (cleanParam) candidatos.push(cleanParam);
    candidatos.push(clean);

    // Se começa com TRACKSUB-, testar também sem esse prefixo
    for (const c of [...candidatos]) {
      if (c.startsWith('TRACKSUB-')) {
        candidatos.push(c.replace('TRACKSUB-', '').trim());
      }
    }

    // 1ª busca: correspondência exata de patrimônio, ID, qrCode ou número de série
    for (const cand of candidatos) {
      if (!cand) continue;
      const achado = this.data.equipamentos.find(
        (e) =>
          e.codigoPatrimonial.toUpperCase() === cand ||
          e.id.toUpperCase() === cand ||
          e.qrCode.toUpperCase() === cand ||
          e.numeroSerie.toUpperCase() === cand
      );
      if (achado) return achado;
    }

    // 2ª busca: se a URL lida ou texto completo contém o patrimônio exato de algum equipamento
    for (const eqp of this.data.equipamentos) {
      const patrim = eqp.codigoPatrimonial.toUpperCase();
      if (patrim && (clean.includes(patrim) || (cleanParam && cleanParam.includes(patrim)))) {
        return eqp;
      }
    }

    return undefined;
  }

  public salvarEquipamento(payload: Partial<Equipamento>): Equipamento {
    // Validar duplicidade de patrimônio e número de série
    if (payload.codigoPatrimonial) {
      const duplicado = this.data.equipamentos.find(
        (e) => e.id !== payload.id && e.codigoPatrimonial.toUpperCase() === payload.codigoPatrimonial!.toUpperCase()
      );
      if (duplicado) {
        throw new Error(`Código Patrimonial "${payload.codigoPatrimonial}" já cadastrado para outro equipamento.`);
      }
    }

    const agora = new Date().toISOString();

    if (payload.id) {
      const idx = this.data.equipamentos.findIndex((e) => e.id === payload.id);
      if (idx === -1) throw new Error('Equipamento não localizado para edição.');

      const anterior = this.data.equipamentos[idx];
      const atualizado: Equipamento = {
        ...anterior,
        ...payload,
        atualizadoEm: agora,
      };

      this.data.equipamentos[idx] = atualizado;
      this.saveData();
      this.registrarAuditoria('Edição de Equipamento', 'Equipamentos', atualizado.id, `Equipamento ${atualizado.codigoPatrimonial} - ${atualizado.descricao} editado.`);
      return atualizado;
    } else {
      const patrim = payload.codigoPatrimonial || `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const novoId = `eqp-${Date.now()}`;
      const novo: Equipamento = {
        id: novoId,
        codigoPatrimonial: patrim,
        tipo: payload.tipo || 'Relé de Proteção Multifunção',
        descricao: payload.descricao || 'Novo Equipamento',
        fabricante: payload.fabricante || 'SEL - Schweitzer',
        modelo: payload.modelo || 'Modelo Padrão',
        numeroSerie: payload.numeroSerie || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        qrCode: payload.qrCode || `TRACKSUB-${patrim}`,
        subestacaoId: payload.subestacaoId || null,
        painelId: payload.painelId || null,
        moduloId: payload.moduloId || null,
        almoxarifadoId: payload.almoxarifadoId || null,
        localizacaoDescricao: payload.localizacaoDescricao || 'Almoxarifado Central / Recebimento',
        estadoConservacao: payload.estadoConservacao || 'Novo',
        estadoOperacional: payload.estadoOperacional || 'Sobressalente / Estoque',
        responsavel: payload.responsavel || this.currentUser.nome,
        dataRetirada: payload.dataRetirada || undefined,
        dataInstalacao: payload.dataInstalacao || undefined,
        dataAquisicao: payload.dataAquisicao || payload.dataRetirada || payload.dataInstalacao || agora.split('T')[0],
        garantiaAte: payload.garantiaAte || payload.dataInstalacao || '',
        documentosTecnicos: payload.documentosTecnicos || [],
        fotografias: payload.fotografias || [],
        observacoes: payload.observacoes || '',
        criadoEm: agora,
        atualizadoEm: agora,
      };

      this.data.equipamentos.unshift(novo);

      // Registrar movimentação inicial de cadastro no histórico
      const movCadastro: Movimentacao = {
        id: `mov-${Date.now()}`,
        equipamentoId: novo.id,
        equipamentoDescricao: novo.descricao,
        equipamentoPatrimonio: novo.codigoPatrimonial,
        tipoOperacao: 'Entrada de Estoque',
        dataHora: agora,
        usuarioId: this.currentUser.id,
        usuarioNome: this.currentUser.nome,
        usuarioPerfil: this.currentUser.perfil,
        motivo: 'Cadastro inicial do equipamento no sistema TRACKSUB.',
        observacoes: 'Equipamento registrado com sucesso e QR Code emitido.',
      };
      this.data.movimentacoes.unshift(movCadastro);

      this.saveData();
      this.registrarAuditoria('Cadastro de Equipamento', 'Equipamentos', novo.id, `Novo equipamento cadastrado: ${novo.codigoPatrimonial} (${novo.descricao}).`);
      return novo;
    }
  }

  public excluirEquipamento(id: string): boolean {
    const idx = this.data.equipamentos.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Equipamento não localizado.');
    const eqp = this.data.equipamentos[idx];
    this.data.equipamentos.splice(idx, 1);
    this.saveData();
    this.registrarAuditoria('Exclusão de Equipamento', 'Equipamentos', id, `Equipamento ${eqp.codigoPatrimonial} (${eqp.descricao}) excluído.`);
    return true;
  }

  // --- Carga em Lote e Processamento Massivo (Suporte a 3.000+ Ativos) ---
  public salvarEquipamentosLote(
    itens: Partial<Equipamento>[],
    opcoes?: { sobrescreverDuplicados?: boolean }
  ): {
    success: boolean;
    totalCadastrados: number;
    totalAtualizados: number;
    totalIgnorados: number;
    totalNoBanco: number;
    erros: string[];
    itensCadastrados: Equipamento[];
  } {
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new Error('Nenhum item informado para cadastro em lote.');
    }

    const agora = new Date().toISOString();
    const dataHoje = agora.split('T')[0];

    // Mapeamento em O(1) de patrimônios existentes para alta performance
    const mapPatrimonio = new Map<string, number>();
    this.data.equipamentos.forEach((e, idx) => {
      mapPatrimonio.set(e.codigoPatrimonial.toUpperCase().trim(), idx);
    });

    const novos: Equipamento[] = [];
    let totalAtualizados = 0;
    let totalIgnorados = 0;
    const erros: string[] = [];
    const baseSeq = Date.now();

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      let patrim = (item.codigoPatrimonial || '').trim().toUpperCase();

      if (!patrim) {
        patrim = `PAT-${new Date().getFullYear()}-${String((baseSeq + i) % 1000000).padStart(6, '0')}`;
      }

      if (mapPatrimonio.has(patrim)) {
        if (opcoes?.sobrescreverDuplicados) {
          const idx = mapPatrimonio.get(patrim)!;
          this.data.equipamentos[idx] = {
            ...this.data.equipamentos[idx],
            ...item,
            codigoPatrimonial: patrim,
            atualizadoEm: agora,
          };
          totalAtualizados++;
          continue;
        } else {
          let seq = 1;
          let novoPatrim = `${patrim}-${seq}`;
          while (mapPatrimonio.has(novoPatrim)) {
            seq++;
            novoPatrim = `${patrim}-${seq}`;
          }
          patrim = novoPatrim;
        }
      }

      const novoId = item.id || `eqp-${baseSeq}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const serie = (item.numeroSerie || '').trim() || `SN-${new Date().getFullYear()}-${String((baseSeq + i) % 1000000).padStart(6, '0')}`;

      const novo: Equipamento = {
        id: novoId,
        codigoPatrimonial: patrim,
        tipo: item.tipo || 'Relé de Proteção Multifunção',
        descricao: item.descricao || `Equipamento ${patrim}`,
        fabricante: item.fabricante || 'SEL - Schweitzer',
        modelo: item.modelo || 'Padrão SE',
        numeroSerie: serie,
        qrCode: item.qrCode || `TRACKSUB-${patrim}`,
        subestacaoId: item.subestacaoId || null,
        painelId: item.painelId || null,
        moduloId: item.moduloId || null,
        almoxarifadoId: item.almoxarifadoId || null,
        localizacaoDescricao: item.localizacaoDescricao || 'Almoxarifado Central / Cadastro em Lote',
        estadoConservacao: item.estadoConservacao || 'Novo',
        estadoOperacional: item.estadoOperacional || 'Sobressalente / Estoque',
        responsavel: item.responsavel || this.currentUser.nome,
        dataRetirada: item.dataRetirada || undefined,
        dataInstalacao: item.dataInstalacao || undefined,
        dataAquisicao: item.dataAquisicao || item.dataRetirada || item.dataInstalacao || dataHoje,
        garantiaAte: item.garantiaAte || item.dataInstalacao || '',
        documentosTecnicos: item.documentosTecnicos || [],
        fotografias: item.fotografias || [],
        observacoes: item.observacoes || 'Cadastrado via Importação/Carga em Lote TRACKSUB',
        criadoEm: agora,
        atualizadoEm: agora,
      };

      mapPatrimonio.set(patrim, this.data.equipamentos.length + novos.length);
      novos.push(novo);
    }

    if (novos.length > 0) {
      this.data.equipamentos.unshift(...novos);
    }

    // Persistência única em disco com atomic write
    this.saveData();

    // Auditoria única consolidada para não sobrecarregar logs
    this.registrarAuditoria(
      'Carga Massiva de Equipamentos',
      'Equipamentos',
      `lote-${baseSeq}`,
      `Carga em lote finalizada: ${novos.length} novos cadastrados, ${totalAtualizados} atualizados. Base total agora: ${this.data.equipamentos.length} ativos.`
    );

    return {
      success: true,
      totalCadastrados: novos.length,
      totalAtualizados,
      totalIgnorados,
      totalNoBanco: this.data.equipamentos.length,
      erros,
      itensCadastrados: novos.slice(0, 30),
    };
  }

  public gerarCargaMassivaEquipamentos(params: {
    quantidade: number;
    prefixo?: string;
    criarInfraestruturaSeVazia?: boolean;
  }): {
    success: boolean;
    totalCadastrados: number;
    totalNoBanco: number;
    subestacoesCriadas: number;
  } {
    const qtd = Math.min(Math.max(params.quantidade || 3000, 1), 10000);
    const prefixo = (params.prefixo || 'PAT-2026-').trim().toUpperCase();
    const agora = new Date().toISOString();
    const dataHoje = agora.split('T')[0];

    let subestacoesCriadas = 0;

    // Se o usuário solicitar explicitamente criar subestações modelos
    if (this.data.subestacoes.length === 0 && params.criarInfraestruturaSeVazia === true) {
      const se1: Subestacao = {
        id: 'se-estiva-230',
        codigo: 'SE-EST-230',
        nome: 'SE Estiva 230/138 kV',
        tensaoPrimaria: '230 kV',
        tensaoSecundaria: '138 kV',
        endereco: 'Rodovia SP-340, km 128',
        cidade: 'Campinas',
        uf: 'SP',
        latitude: -22.9064,
        longitude: -47.0616,
        ativa: true,
        observacoes: 'Subestação seccionadora tronco do SIN 230/138 kV',
      };
      const se2: Subestacao = {
        id: 'se-bandeirantes-500',
        codigo: 'SE-BND-500',
        nome: 'SE Bandeirantes 500/230 kV',
        tensaoPrimaria: '500 kV',
        tensaoSecundaria: '230 kV',
        endereco: 'Av. das Indústrias, 5000',
        cidade: 'Jundiaí',
        uf: 'SP',
        latitude: -23.1857,
        longitude: -46.8978,
        ativa: true,
        observacoes: 'Pátio blindado e interligação 500kV',
      };
      const se3: Subestacao = {
        id: 'se-distrito-138',
        codigo: 'SE-DIS-138',
        nome: 'SE Distrito Industrial 138/13.8 kV',
        tensaoPrimaria: '138 kV',
        tensaoSecundaria: '13.8 kV',
        endereco: 'Av. dos Engenheiros, 1200',
        cidade: 'Sorocaba',
        uf: 'SP',
        latitude: -23.5015,
        longitude: -47.4526,
        ativa: true,
        observacoes: 'Alimentação de cargas industriais críticas',
      };

      this.data.subestacoes.push(se1, se2, se3);
      subestacoesCriadas += 3;

      // Painéis e cubículos para as subestações
      const pnl1: Painel = {
        id: 'pnl-est-01',
        subestacaoId: 'se-estiva-230',
        codigo: 'PNL-01-PROT',
        identificacao: 'Painel de Proteção Principal Linha 230kV LT-01',
        funcao: 'Proteção e Controle',
        tensao: '230 kV',
        tipo: 'Painel Autoportante 19"',
        ativo: true,
        observacoes: 'Contém relés principais 21/87L e multimedidores',
      };
      const pnl2: Painel = {
        id: 'pnl-est-02',
        subestacaoId: 'se-estiva-230',
        codigo: 'PNL-02-TEL',
        identificacao: 'Painel Bastidor Telecomunicações e SDH/WDM',
        funcao: 'Telecomunicações e Redes',
        tensao: '125 Vcc',
        tipo: 'Bastidor Aberto 19"',
        ativo: true,
        observacoes: 'Switches IEC 61850 e Roteador de Borda',
      };
      const pnl3: Painel = {
        id: 'pnl-bnd-01',
        subestacaoId: 'se-bandeirantes-500',
        codigo: 'PNL-BND-500',
        identificacao: 'Painel Autoportante de Proteção de Barramento 500kV',
        funcao: 'Proteção Diferencial de Barra',
        tensao: '500 kV',
        tipo: 'Painel Autoportante 19"',
        ativo: true,
        observacoes: 'IEDs 87B e RPDs registradores de perturbação',
      };
      const pnl4: Painel = {
        id: 'pnl-dis-01',
        subestacaoId: 'se-distrito-138',
        codigo: 'PNL-DIS-MED',
        identificacao: 'Cubículo Metal-Clad Medição e Alimentador 13.8kV',
        funcao: 'Medição e Faturamento',
        tensao: '13.8 kV',
        tipo: 'Cubículo Metal-Clad',
        ativo: true,
        observacoes: 'Multimedidores digitais e relés de alimentador',
      };

      this.data.paineis.push(pnl1, pnl2, pnl3, pnl4);

      // Almoxarifados se vazios
      if (this.data.almoxarifados.length === 0) {
        this.data.almoxarifados.push(
          {
            id: 'alm-central',
            codigo: 'ALM-CENTRAL',
            nome: 'Almoxarifado Central de Equipamentos & IEDs',
            subestacaoId: 'se-estiva-230',
            subestacaoNome: 'SE Estiva 230/138 kV',
            responsavel: 'Eng. Anderson Tavares',
            localizacao: 'Pavilhão Técnico Central',
            tipo: 'Principal',
            ativo: true,
          },
          {
            id: 'alm-spares',
            codigo: 'ALM-SOBRESSALENTES',
            nome: 'Depósito de Sobressalentes Críticos (Spares)',
            subestacaoId: 'se-bandeirantes-500',
            subestacaoNome: 'SE Bandeirantes 500/230 kV',
            responsavel: 'Eng. Anderson Tavares',
            localizacao: 'Setor Climatizado de Eletrônica',
            tipo: 'Avançado de Subestação',
            ativo: true,
          }
        );
      }
    }

    // Catálogo representativo com ênfase técnica em Subestação e Telecom (incluindo Multimedidor)
    const CATALOGO_GERACAO: {
      tipo: Equipamento['tipo'];
      desc: string;
      fab: string;
      mod: string;
      cat: string;
    }[] = [
      {
        tipo: 'Multimedidor Digital de Grandezas Elétricas',
        desc: 'Multimedidor Digital Multifunção com Harmônicas e Protocolo DNP3 / Modbus TCP',
        fab: 'Kron Medidores',
        mod: 'Mult-K 120 / Linha Pro',
        cat: 'Medição',
      },
      {
        tipo: 'Multimedidor',
        desc: 'Multimedidor de Painel com Registrador de Eventos e Classe 0.2S',
        fab: 'Schneider Electric (PowerLogic)',
        mod: 'PowerLogic PM8000 Series',
        cat: 'Medição',
      },
      {
        tipo: 'Multimedidor Digital de Grandezas Elétricas',
        desc: 'Analisador de Grandezas Elétricas e Qualidade de Energia de Painel',
        fab: 'ABB / Hitachi Energy',
        mod: 'M2M Ethernet Multi-meter',
        cat: 'Medição',
      },
      {
        tipo: 'Relé de Proteção Multifunção',
        desc: 'Relé de Proteção de Linha de Transmissão com Diferencial e Distância 87L/21',
        fab: 'SEL - Schweitzer',
        mod: 'SEL-421 Protection & Automation System',
        cat: 'Proteção',
      },
      {
        tipo: 'Relé de Proteção Multifunção',
        desc: 'Relé Numérico Multifunção de Proteção de Alimentador e Transformador 50/51/87',
        fab: 'Siemens Energy',
        mod: 'Siprotec 5 7SJ85',
        cat: 'Proteção',
      },
      {
        tipo: 'IED de Vão e Controle',
        desc: 'Controlador de Vão de Subestação e Automação de Chaves e Disjuntores IEC 61850',
        fab: 'SEL - Schweitzer',
        mod: 'SEL-451 Bay Control Unit',
        cat: 'Controle',
      },
      {
        tipo: 'IED de Proteção Diferencial (87T / 87B / 87L)',
        desc: 'Relé de Proteção Diferencial de Transformador de Potência Tri-Enrolamento 87T',
        fab: 'GE Grid Solutions',
        mod: 'Multilin T60 Transformer Protection',
        cat: 'Proteção',
      },
      {
        tipo: 'Disjuntor de Alta Tensão',
        desc: 'Disjuntor Tripolar ao Tempo com Isolamento a Gás SF6 245 kV / 3150 A / 40 kA',
        fab: 'ABB / Hitachi Energy',
        mod: 'LTB 245D1/B SF6 Circuit Breaker',
        cat: 'Pátio',
      },
      {
        tipo: 'Disjuntor de Média Tensão',
        desc: 'Disjuntor a Vácuo Extraível para Cubículo Metal-Clad 17.5 kV / 1250 A',
        fab: 'WEG Automação',
        mod: 'VBW-17 Disjuntor a Vácuo',
        cat: 'Pátio',
      },
      {
        tipo: 'Transformador de Corrente (TC)',
        desc: 'Transformador de Corrente Indutivo Monofásico para Medição e Proteção 230 kV',
        fab: 'Arteche',
        mod: 'CA-245 400-800/5-5-5A',
        cat: 'Pátio',
      },
      {
        tipo: 'Transformador de Potencial Capacitivo (TPC / TPCV)',
        desc: 'Divisor de Tensão Capacitivo com Acoplamento de Onda Portadora 230 kV / 115V',
        fab: 'Arteche',
        mod: 'DFC-245 Classe 0.2',
        cat: 'Pátio',
      },
      {
        tipo: 'Chave Seccionadora Motorizada',
        desc: 'Chave Seccionadora Tripolar Abertura Vertical com Lâmina de Terra Motorizada',
        fab: 'Lorenzetti / GE',
        mod: 'SGF-245 Motor Operada 230kV',
        cat: 'Pátio',
      },
      {
        tipo: 'Switch Gerenciável IEC 61850',
        desc: 'Switch Ethernet Industrial Gerenciável IEC 61850-3 com 16 Portas Ópticas e Elétricas',
        fab: 'RuggedCom / Siemens',
        mod: 'RS900G Industrial Substation Switch',
        cat: 'Telecom',
      },
      {
        tipo: 'Switch PTP / IEEE 1588 (PRP / HSR)',
        desc: 'Switch de Alta Disponibilidade PRP/HSR com Sincronismo de Tempo IEEE 1588v2 PTP',
        fab: 'Moxa Industrial',
        mod: 'PT-G7828 IEC 61850 Rack Switch',
        cat: 'Telecom',
      },
      {
        tipo: 'Roteador de Borda / Núcleo Telecom',
        desc: 'Roteador Industrial com Suporte a MPLS-TP, OSPF e BGP para Rede Operativa',
        fab: 'Cisco Industrial Networks',
        mod: 'Cisco Catalyst IE3400 Heavy Duty',
        cat: 'Telecom',
      },
      {
        tipo: 'Chassi de Transporte WDM / DWDM',
        desc: 'Plataforma Óptica DWDM Modular de Transporte de Dados e Teleproteção Subestação',
        fab: 'Padtec Óptica',
        mod: 'LightPad i6400G Substation Chassis',
        cat: 'Telecom',
      },
      {
        tipo: 'Transceptor de Teleproteção Digital / Analógico',
        desc: 'Transceptor de Teleproteção Digital com Criptografia e Tempo de Resposta < 4ms',
        fab: 'Digitel Telecomunicações',
        mod: 'DT-8000 Teleprotection Unit',
        cat: 'Telecom',
      },
      {
        tipo: 'Relógio Mestre GPS / GNSS / PTP (IEEE 1588)',
        desc: 'Servidor de Tempo GPS Master Clock de Alta Precisão com Saídas IRIG-B e PTP',
        fab: 'SEL - Schweitzer',
        mod: 'SEL-2488 Satellite Synchronized Clock',
        cat: 'Telecom',
      },
      {
        tipo: 'Retificador / Carregador de Baterias',
        desc: 'Sistema Retificador Tiristorizado 125 Vcc / 100 A com Monitoramento Microprocessado',
        fab: 'Schneider Electric / APC',
        mod: 'GUTOR PXP Industrial Rectifier',
        cat: 'Serviços Auxiliares',
      },
      {
        tipo: 'Banco de Baterias Estacionárias (VRLA / Ni-Cd / Lítio)',
        desc: 'Banco de Baterias Chumbo-Ácido Ventiladas Estacionárias 125 Vcc 400 Ah',
        fab: 'Moura Baterias',
        mod: 'Moura Clean VRLA 2V 400Ah (60 elementos)',
        cat: 'Serviços Auxiliares',
      },
      {
        tipo: 'Registrador de Perturbações Digitais (RPD / DFR)',
        desc: 'Registrador Digital de Perturbações e Falhas 64 Canais Analógicos / 128 Digitais',
        fab: 'Doble Engineering',
        mod: 'Doble DFR-6700 Fault Recorder',
        cat: 'Proteção',
      },
      {
        tipo: 'Mala de Testes Microprocessada',
        desc: 'Sistema de Teste de Relés Microprocessado Hexafásico com Calibração Rastreável',
        fab: 'Omicron Electronics',
        mod: 'CMC 356 Universal Relay Test Set',
        cat: 'Instrumentos',
      },
    ];

    const subs = this.data.subestacoes;
    const pnlList = this.data.paineis;
    const almList = this.data.almoxarifados;

    const ESTADOS_OP: Equipamento['estadoOperacional'][] = [
      'Em Operação',
      'Em Operação',
      'Em Operação',
      'Sobressalente / Estoque',
      'Em Manutenção',
      'Em Ensaio',
    ];

    const ESTADOS_CONS: Equipamento['estadoConservacao'][] = [
      'Novo',
      'Novo',
      'Bom',
      'Bom',
      'Regular',
      'Novo',
    ];

    const itensParaSalvar: Partial<Equipamento>[] = [];

    for (let i = 1; i <= qtd; i++) {
      const catItem = CATALOGO_GERACAO[(i - 1) % CATALOGO_GERACAO.length];
      const numeroSeq = String(i).padStart(5, '0');
      const codigoPatrim = `${prefixo}${numeroSeq}`;
      const numeroSerie = `SN-${catItem.fab.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${numeroSeq}`;

      const estOp = ESTADOS_OP[i % ESTADOS_OP.length];
      const estCons = ESTADOS_CONS[i % ESTADOS_CONS.length];

      let subId: string | null = null;
      let painelId: string | null = null;
      let almId: string | null = null;
      let locDesc = 'Almoxarifado Central';

      if (estOp === 'Em Operação' && subs.length > 0) {
        const sub = subs[i % subs.length];
        subId = sub.id;
        const paineisDaSub = pnlList.filter((p) => p.subestacaoId === sub.id);
        if (paineisDaSub.length > 0) {
          const pnl = paineisDaSub[i % paineisDaSub.length];
          painelId = pnl.id;
          locDesc = `${sub.nome} / ${pnl.identificacao}`;
        } else {
          locDesc = `${sub.nome} / Pátio e Salas de Controle`;
        }
      } else if (almList.length > 0) {
        const alm = almList[i % almList.length];
        almId = alm.id;
        locDesc = `${alm.nome} / Prateleira E-${(i % 20) + 1}`;
      }

      itensParaSalvar.push({
        codigoPatrimonial: codigoPatrim,
        descricao: `${catItem.desc} #${numeroSeq}`,
        tipo: catItem.tipo,
        fabricante: catItem.fab,
        modelo: catItem.mod,
        numeroSerie,
        qrCode: `TRACKSUB-${codigoPatrim}`,
        subestacaoId: subId,
        painelId,
        moduloId: null,
        almoxarifadoId: almId,
        localizacaoDescricao: locDesc,
        estadoOperacional: estOp,
        estadoConservacao: estCons,
        responsavel: this.currentUser.nome,
        dataRetirada: estOp === 'Retirado' ? dataHoje : undefined,
        dataInstalacao: estOp === 'Em Operação' ? dataHoje : undefined,
        dataAquisicao: dataHoje,
        garantiaAte: '2028-12-31',
        observacoes: `Equipamento gerado via Carga Massiva de Ativos TRACKSUB (${catItem.cat})`,
      });
    }

    const res = this.salvarEquipamentosLote(itensParaSalvar, { sobrescreverDuplicados: true });

    return {
      success: true,
      totalCadastrados: res.totalCadastrados,
      totalNoBanco: res.totalNoBanco,
      subestacoesCriadas,
    };
  }

  public excluirEquipamentosLote(ids: string[]): { success: boolean; totalExcluidos: number } {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: true, totalExcluidos: 0 };
    }
    const setIds = new Set(ids);
    const antes = this.data.equipamentos.length;
    this.data.equipamentos = this.data.equipamentos.filter((e) => !setIds.has(e.id));
    const excluidos = antes - this.data.equipamentos.length;
    this.saveData();
    this.registrarAuditoria(
      'Exclusão em Lote',
      'Equipamentos',
      `del-lote-${Date.now()}`,
      `Exclusão em massa de ${excluidos} equipamentos executada com sucesso.`
    );
    return { success: true, totalExcluidos: excluidos };
  }

  // --- Movimentações de Equipamentos (Rastreabilidade Absoluta) ---
  public getMovimentacoes(equipamentoId?: string): Movimentacao[] {
    if (equipamentoId) {
      return this.data.movimentacoes.filter((m) => m.equipamentoId === equipamentoId);
    }
    return this.data.movimentacoes;
  }

  public registrarMovimentacaoEquipamento(payload: {
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
  }): Movimentacao {
    const eqp = this.data.equipamentos.find((e) => e.id === payload.equipamentoId);
    if (!eqp) throw new Error('Equipamento não localizado para movimentação.');

    const agora = new Date().toISOString();

    // Guardar origem anterior
    const origemSE = eqp.subestacaoId ? this.getSubestacaoById(eqp.subestacaoId) : undefined;
    const origemPainel = eqp.painelId ? this.data.paineis.find((p) => p.id === eqp.painelId) : undefined;
    const origemModulo = eqp.moduloId ? this.data.modulos.find((m) => m.id === eqp.moduloId) : undefined;

    // Buscar dados do destino
    const destSE = payload.destinoSubestacaoId ? this.getSubestacaoById(payload.destinoSubestacaoId) : undefined;
    const destPainel = payload.destinoPainelId ? this.data.paineis.find((p) => p.id === payload.destinoPainelId) : undefined;
    const destModulo = payload.destinoModuloId ? this.data.modulos.find((m) => m.id === payload.destinoModuloId) : undefined;
    const destAlmox = payload.destinoAlmoxarifadoId ? this.data.almoxarifados.find((a) => a.id === payload.destinoAlmoxarifadoId) : undefined;

    // Buscar Ordem de Serviço, se informada
    const os = payload.ordemServicoId ? this.data.ordensServico.find((o) => o.id === payload.ordemServicoId) : undefined;

    // Atualizar estado operacional do equipamento conforme a operação
    let novoEstadoOperacional: Equipamento['estadoOperacional'] = eqp.estadoOperacional;
    let novaLocalizacaoDescricao = eqp.localizacaoDescricao;

    switch (payload.tipoOperacao) {
      case 'Instalação':
        novoEstadoOperacional = 'Em Operação';
        eqp.dataInstalacao = agora.split('T')[0];
        eqp.subestacaoId = payload.destinoSubestacaoId || null;
        eqp.painelId = payload.destinoPainelId || null;
        eqp.moduloId = payload.destinoModuloId || null;
        eqp.almoxarifadoId = null;
        {
          const modStr = destModulo?.identificacao || payload.destinoModuloId;
          const pnlStr = destPainel?.identificacao;
          if (pnlStr && modStr && pnlStr !== modStr) {
            novaLocalizacaoDescricao = `${destSE?.nome || 'Subestação'} / ${pnlStr} / ${modStr}`;
          } else if (modStr) {
            novaLocalizacaoDescricao = `${destSE?.nome || 'Subestação'} / ${modStr}`;
          } else if (pnlStr) {
            novaLocalizacaoDescricao = `${destSE?.nome || 'Subestação'} / ${pnlStr}`;
          } else {
            novaLocalizacaoDescricao = `${destSE?.nome || 'Subestação'} / Instalado`;
          }
        }
        break;

      case 'Retirada':
        novoEstadoOperacional = 'Retirado';
        eqp.dataRetirada = agora.split('T')[0];
        eqp.subestacaoId = null;
        eqp.painelId = null;
        eqp.moduloId = null;
        eqp.almoxarifadoId = payload.destinoAlmoxarifadoId || null;
        novaLocalizacaoDescricao = destAlmox ? `${destAlmox.nome} (Retirado para triagem)` : 'Equipamento Retirado (Em Trânsito / Sem Localização)';
        break;

      case 'Transferência de Painel':
      case 'Transferência de Subestação':
        novoEstadoOperacional = 'Em Operação';
        eqp.subestacaoId = payload.destinoSubestacaoId || eqp.subestacaoId;
        eqp.painelId = payload.destinoPainelId || null;
        eqp.moduloId = payload.destinoModuloId || null;
        {
          const seNome = destSE?.nome || origemSE?.nome || 'Subestação';
          const modStr = destModulo?.identificacao || payload.destinoModuloId;
          const pnlStr = destPainel?.identificacao;
          if (pnlStr && modStr && pnlStr !== modStr) {
            novaLocalizacaoDescricao = `${seNome} / ${pnlStr} / ${modStr}`;
          } else if (modStr) {
            novaLocalizacaoDescricao = `${seNome} / ${modStr}`;
          } else if (pnlStr) {
            novaLocalizacaoDescricao = `${seNome} / ${pnlStr}`;
          } else {
            novaLocalizacaoDescricao = `${seNome} / Transferido`;
          }
        }
        break;

      case 'Envio para Manutenção':
        novoEstadoOperacional = 'Em Manutenção';
        eqp.subestacaoId = null;
        eqp.painelId = null;
        eqp.moduloId = null;
        eqp.almoxarifadoId = payload.destinoAlmoxarifadoId || 'alm-oficina';
        novaLocalizacaoDescricao = destAlmox ? `${destAlmox.nome} (Oficina / Manutenção)` : 'Oficina de Manutenção Especializada';
        break;

      case 'Envio para Ensaios':
        novoEstadoOperacional = 'Em Ensaio';
        eqp.subestacaoId = null;
        eqp.painelId = null;
        eqp.moduloId = null;
        eqp.almoxarifadoId = payload.destinoAlmoxarifadoId || 'alm-oficina';
        novaLocalizacaoDescricao = destAlmox ? `${destAlmox.nome} (Laboratório / Ensaios)` : 'Laboratório de Calibração e Ensaios';
        break;

      case 'Retorno ao Almoxarifado':
      case 'Entrada de Estoque':
        novoEstadoOperacional = 'Sobressalente / Estoque';
        eqp.subestacaoId = null;
        eqp.painelId = null;
        eqp.moduloId = null;
        eqp.almoxarifadoId = payload.destinoAlmoxarifadoId || 'alm-central';
        novaLocalizacaoDescricao = destAlmox ? `${destAlmox.nome} (Sobressalente Disponível)` : 'Almoxarifado Central / Sobressalente';
        break;

      case 'Baixa Patrimonial':
        novoEstadoOperacional = 'Baixado';
        eqp.subestacaoId = null;
        eqp.painelId = null;
        eqp.moduloId = null;
        eqp.almoxarifadoId = null;
        novaLocalizacaoDescricao = 'Baixa Patrimonial Autorizada (Descomissionado / Sucata Técnica)';
        break;
    }

    if (payload.novoEstadoConservacao) {
      eqp.estadoConservacao = payload.novoEstadoConservacao;
    }

    eqp.estadoOperacional = novoEstadoOperacional;
    eqp.localizacaoDescricao = novaLocalizacaoDescricao;
    eqp.atualizadoEm = agora;

    const novaMovimentacao: Movimentacao = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      equipamentoId: eqp.id,
      equipamentoDescricao: eqp.descricao,
      equipamentoPatrimonio: eqp.codigoPatrimonial,
      tipoOperacao: payload.tipoOperacao,
      dataHora: agora,
      usuarioId: this.currentUser.id,
      usuarioNome: this.currentUser.nome,
      usuarioPerfil: this.currentUser.perfil,
      responsavelAutorizacao: payload.responsavelAutorizacao || 'Engenharia de Proteção',
      origemSubestacaoId: origemSE?.id,
      origemSubestacaoNome: origemSE?.nome,
      origemPainelId: origemPainel?.id,
      origemPainelNome: origemPainel?.identificacao,
      origemModuloId: origemModulo?.id,
      origemModuloNome: origemModulo?.identificacao,
      destinoSubestacaoId: destSE?.id,
      destinoSubestacaoNome: destSE?.nome,
      destinoPainelId: destPainel?.id,
      destinoPainelNome: destPainel?.identificacao,
      destinoModuloId: destModulo?.id || payload.destinoModuloId,
      destinoModuloNome: destModulo?.identificacao || payload.destinoModuloId,
      destinoAlmoxarifadoId: destAlmox?.id,
      destinoAlmoxarifadoNome: destAlmox?.nome,
      motivo: payload.motivo,
      ordemServicoId: os?.id,
      ordemServicoNumero: os?.numero,
      observacoes: payload.observacoes || '',
    };

    this.data.movimentacoes.unshift(novaMovimentacao);

    // Se estiver vinculado a uma OS, atualizar lista de equipamentos movimentados da OS
    if (os) {
      const jaExiste = os.equipamentosMovimentados.some((em) => em.equipamentoId === eqp.id);
      if (!jaExiste) {
        os.equipamentosMovimentados.push({
          equipamentoId: eqp.id,
          patrimonio: eqp.codigoPatrimonial,
          descricao: eqp.descricao,
          acao: payload.tipoOperacao === 'Instalação' ? 'Instalado' : payload.tipoOperacao === 'Retirada' ? 'Retirado' : 'Substituído',
        });
      }
    }

    this.saveData();
    this.registrarAuditoria(
      `Movimentação: ${payload.tipoOperacao}`,
      'Movimentações',
      eqp.id,
      `${payload.tipoOperacao} registrada para o equipamento ${eqp.codigoPatrimonial}. Motivo: ${payload.motivo}`
    );

    return novaMovimentacao;
  }

  // --- Materiais e Gestão de Estoque ---
  public getMateriais(filtros?: {
    termo?: string;
    categoria?: string;
    almoxarifadoId?: string;
    abaixoMinimo?: boolean;
    tipoMaterial?: string;
  }): Material[] {
    let result = this.data.materiais;

    if (filtros?.termo) {
      const t = filtros.termo.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.codigoInterno.toLowerCase().includes(t) ||
          m.descricao.toLowerCase().includes(t) ||
          m.fabricante.toLowerCase().includes(t) ||
          m.referenciaModelo.toLowerCase().includes(t) ||
          (m.controleLote && m.controleLote.toLowerCase().includes(t))
      );
    }

    if (filtros?.categoria && filtros.categoria !== 'todas') {
      result = result.filter((m) => m.categoria === filtros.categoria);
    }

    if (filtros?.almoxarifadoId && filtros.almoxarifadoId !== 'todos') {
      result = result.filter((m) => m.almoxarifadoId === filtros.almoxarifadoId);
    }

    if (filtros?.tipoMaterial && filtros.tipoMaterial !== 'todos') {
      result = result.filter((m) => m.tipoMaterial === filtros.tipoMaterial);
    }

    if (filtros?.abaixoMinimo) {
      result = result.filter((m) => m.quantidadeFisica <= m.estoqueMinimo);
    }

    return result;
  }

  public getMaterialById(id: string): Material | undefined {
    return this.data.materiais.find((m) => m.id === id);
  }

  public salvarMaterial(payload: Partial<Material>): Material {
    const agora = new Date().toISOString();

    if (payload.id) {
      const idx = this.data.materiais.findIndex((m) => m.id === payload.id);
      if (idx === -1) throw new Error('Material não localizado.');
      const anterior = this.data.materiais[idx];

      const atualizado: Material = {
        ...anterior,
        ...payload,
        quantidadeDisponivel: (payload.quantidadeFisica ?? anterior.quantidadeFisica) - (payload.quantidadeReservada ?? anterior.quantidadeReservada),
        atualizadoEm: agora,
      };

      this.data.materiais[idx] = atualizado;
      this.saveData();
      this.registrarAuditoria('Edição de Material', 'Materiais e Estoque', atualizado.id, `Material ${atualizado.codigoInterno} (${atualizado.descricao}) atualizado.`);
      return atualizado;
    } else {
      const novoId = `mat-${Date.now()}`;
      const cod = payload.codigoInterno || `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const qtdFisica = payload.quantidadeFisica || 0;
      const qtdRes = payload.quantidadeReservada || 0;

      const novo: Material = {
        id: novoId,
        codigoInterno: cod,
        descricao: payload.descricao || 'Novo Material Elétrico',
        categoria: payload.categoria || 'Cabos e Condutores',
        fabricante: payload.fabricante || 'Fabricante Homologado',
        referenciaModelo: payload.referenciaModelo || '',
        unidadeMedida: payload.unidadeMedida || 'un',
        quantidadeFisica: qtdFisica,
        quantidadeReservada: qtdRes,
        quantidadeDisponivel: qtdFisica - qtdRes,
        estoqueMinimo: payload.estoqueMinimo || 10,
        estoqueMaximo: payload.estoqueMaximo || 100,
        custoUnitario: payload.custoUnitario || 0,
        fornecedorId: payload.fornecedorId || 'forn-weg',
        fornecedorNome: payload.fornecedorNome || 'WEG Transformadores e Painéis',
        almoxarifadoId: payload.almoxarifadoId || 'alm-central',
        almoxarifadoNome: payload.almoxarifadoNome || 'Almoxarifado Central',
        prateleiraPosicao: payload.prateleiraPosicao || 'Prateleira A-01',
        controleLote: payload.controleLote,
        numeroSerie: payload.numeroSerie,
        validade: payload.validade,
        codigoBarrasQr: payload.codigoBarrasQr || cod,
        tipoMaterial: payload.tipoMaterial || 'Consumível',
        observacoes: payload.observacoes || '',
        criadoEm: agora,
        atualizadoEm: agora,
      };

      this.data.materiais.unshift(novo);
      this.saveData();
      this.registrarAuditoria('Cadastro de Material', 'Materiais e Estoque', novo.id, `Material ${novo.codigoInterno} (${novo.descricao}) cadastrado com saldo inicial de ${novo.quantidadeFisica} ${novo.unidadeMedida}.`);
      return novo;
    }
  }

  public registrarMovimentacaoEstoque(payload: {
    materialId: string;
    tipoOperacao: MovimentacaoMaterial['tipoOperacao'];
    quantidade: number;
    origem: string;
    destino: string;
    motivo: string;
    documentoReferencia?: string;
    ordemServicoId?: string;
  }): MovimentacaoMaterial {
    const mat = this.data.materiais.find((m) => m.id === payload.materialId);
    if (!mat) throw new Error('Material não localizado para movimentação de estoque.');

    if (payload.quantidade <= 0) {
      throw new Error('A quantidade da movimentação deve ser maior do que zero.');
    }

    const agora = new Date().toISOString();
    const os = payload.ordemServicoId ? this.data.ordensServico.find((o) => o.id === payload.ordemServicoId) : undefined;

    // Lógica estrita de saldo e autorização
    switch (payload.tipoOperacao) {
      case 'Entrada por Compra':
      case 'Entrada por Devolução':
      case 'Devolução ao Estoque':
        mat.quantidadeFisica += payload.quantidade;
        mat.quantidadeDisponivel = mat.quantidadeFisica - mat.quantidadeReservada;
        break;

      case 'Saída para Manutenção':
      case 'Consumo em Ordem de Serviço':
        // Impedir saídas que ultrapassem o saldo disponível salvo permissão
        if (!this.data.configuracao.permitirSaldoNegativo && payload.quantidade > mat.quantidadeDisponivel) {
          throw new Error(
            `Estoque insuficiente para esta operação! Saldo disponível atual: ${mat.quantidadeDisponivel} ${mat.unidadeMedida}. Quantidade requisitada: ${payload.quantidade} ${mat.unidadeMedida}.`
          );
        }
        mat.quantidadeFisica -= payload.quantidade;
        // Se pertencia a reserva prévia em OS, desfaz a reserva proporcional
        if (payload.tipoOperacao === 'Consumo em Ordem de Serviço' && mat.quantidadeReservada >= payload.quantidade) {
          mat.quantidadeReservada -= payload.quantidade;
        }
        mat.quantidadeDisponivel = mat.quantidadeFisica - mat.quantidadeReservada;
        break;

      case 'Reserva de Materiais':
        if (payload.quantidade > mat.quantidadeDisponivel) {
          throw new Error(
            `Não há saldo disponível suficiente para reservar ${payload.quantidade} ${mat.unidadeMedida}. Disponível: ${mat.quantidadeDisponivel} ${mat.unidadeMedida}.`
          );
        }
        mat.quantidadeReservada += payload.quantidade;
        mat.quantidadeDisponivel = mat.quantidadeFisica - mat.quantidadeReservada;
        break;

      case 'Transferência entre Almoxarifados':
        if (payload.quantidade > mat.quantidadeDisponivel) {
          throw new Error(`Saldo disponível insuficiente para transferência (${mat.quantidadeDisponivel} ${mat.unidadeMedida}).`);
        }
        // Na prática atualiza localização ou reduz
        break;

      case 'Ajuste de Inventário':
        // Diferença positiva ou negativa
        mat.quantidadeFisica = payload.quantidade;
        mat.quantidadeDisponivel = mat.quantidadeFisica - mat.quantidadeReservada;
        break;

      case 'Estorno':
        // Estorno devolve quantidade física
        mat.quantidadeFisica += payload.quantidade;
        mat.quantidadeDisponivel = mat.quantidadeFisica - mat.quantidadeReservada;
        break;
    }

    mat.atualizadoEm = agora;

    const novaMovMat: MovimentacaoMaterial = {
      id: `mov-mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialId: mat.id,
      materialDescricao: mat.descricao,
      materialCodigo: mat.codigoInterno,
      tipoOperacao: payload.tipoOperacao,
      quantidade: payload.quantidade,
      unidadeMedida: mat.unidadeMedida,
      usuarioId: this.currentUser.id,
      usuarioNome: this.currentUser.nome,
      dataHora: agora,
      origem: payload.origem,
      destino: payload.destino,
      motivo: payload.motivo,
      documentoReferencia: payload.documentoReferencia,
      ordemServicoId: os?.id,
      ordemServicoNumero: os?.numero,
    };

    this.data.movimentacoesMateriais.unshift(novaMovMat);
    this.saveData();

    this.registrarAuditoria(
      `Movimentação Estoque: ${payload.tipoOperacao}`,
      'Materiais e Estoque',
      mat.id,
      `${payload.tipoOperacao} de ${payload.quantidade} ${mat.unidadeMedida} de ${mat.descricao} (${mat.codigoInterno}). Saldo atual: ${mat.quantidadeFisica} ${mat.unidadeMedida}.`
    );

    return novaMovMat;
  }

  public getMovimentacoesMateriais(materialId?: string): MovimentacaoMaterial[] {
    if (materialId) {
      return this.data.movimentacoesMateriais.filter((m) => m.materialId === materialId);
    }
    return this.data.movimentacoesMateriais;
  }

  // --- Ordens de Serviço ---
  public getOrdensServico(filtros?: {
    termo?: string;
    status?: string;
    prioridade?: string;
    subestacaoId?: string;
  }): OrdemServico[] {
    let result = this.data.ordensServico;

    if (filtros?.termo) {
      const t = filtros.termo.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.numero.toLowerCase().includes(t) ||
          o.titulo.toLowerCase().includes(t) ||
          o.descricaoServico.toLowerCase().includes(t) ||
          o.responsavelNome.toLowerCase().includes(t)
      );
    }

    if (filtros?.status && filtros.status !== 'todos') {
      result = result.filter((o) => o.status === filtros.status);
    }

    if (filtros?.prioridade && filtros.prioridade !== 'todas') {
      result = result.filter((o) => o.prioridade === filtros.prioridade);
    }

    if (filtros?.subestacaoId && filtros.subestacaoId !== 'todas') {
      result = result.filter((o) => o.subestacaoId === filtros.subestacaoId);
    }

    return result;
  }

  public getOrdemServicoById(id: string): OrdemServico | undefined {
    return this.data.ordensServico.find((o) => o.id === id);
  }

  public salvarOrdemServico(payload: Partial<OrdemServico>): OrdemServico {
    const agora = new Date().toISOString();

    if (payload.id) {
      const idx = this.data.ordensServico.findIndex((o) => o.id === payload.id);
      if (idx === -1) throw new Error('Ordem de serviço não localizada.');
      const anterior = this.data.ordensServico[idx];

      const atualizada: OrdemServico = {
        ...anterior,
        ...payload,
      };

      if (payload.status === 'Concluída' && !atualizada.dataConclusao) {
        atualizada.dataConclusao = agora.split('T')[0];
      }

      this.data.ordensServico[idx] = atualizada;
      this.saveData();
      this.registrarAuditoria('Edição de Ordem de Serviço', 'Ordens de Serviço', atualizada.id, `OS ${atualizada.numero} atualizada (Status: ${atualizada.status}).`);
      return atualizada;
    } else {
      const novoId = `os-${Date.now()}`;
      const numero = `OS-${new Date().getFullYear()}-${String(this.data.ordensServico.length + 101).padStart(4, '0')}`;
      const se = payload.subestacaoId ? this.getSubestacaoById(payload.subestacaoId) : undefined;

      const nova: OrdemServico = {
        id: novoId,
        numero,
        titulo: payload.titulo || 'Manutenção Programada de Subestação',
        subestacaoId: payload.subestacaoId || 'se-poa-norte',
        subestacaoNome: se?.nome || 'Subestação Porto Alegre Norte',
        painelId: payload.painelId,
        painelNome: payload.painelNome,
        equipamentoId: payload.equipamentoId,
        equipamentoNome: payload.equipamentoNome,
        descricaoServico: payload.descricaoServico || '',
        tipoManutencao: payload.tipoManutencao || 'Preventiva',
        prioridade: payload.prioridade || 'Média',
        status: payload.status || 'Aberta',
        responsavelId: payload.responsavelId || this.currentUser.id,
        responsavelNome: payload.responsavelNome || this.currentUser.nome,
        equipeExecutora: payload.equipeExecutora || 'Equipe Especializada de Subestações',
        dataAbertura: payload.dataAbertura || agora.split('T')[0],
        prazoLimite: payload.prazoLimite || agora.split('T')[0],
        materiaisRequisitados: payload.materiaisRequisitados || [],
        equipamentosMovimentados: payload.equipamentosMovimentados || [],
        observacoes: payload.observacoes || '',
      };

      this.data.ordensServico.unshift(nova);
      this.saveData();
      this.registrarAuditoria('Abertura de Ordem de Serviço', 'Ordens de Serviço', nova.id, `OS ${nova.numero} aberta para a ${nova.subestacaoNome}.`);
      return nova;
    }
  }

  public consumirMaterialOS(osId: string, materialId: string, quantidade: number): OrdemServico {
    const os = this.data.ordensServico.find((o) => o.id === osId);
    if (!os) throw new Error('Ordem de serviço não encontrada.');

    const mat = this.data.materiais.find((m) => m.id === materialId);
    if (!mat) throw new Error('Material não encontrado no estoque.');

    // Executa a baixa real no estoque
    this.registrarMovimentacaoEstoque({
      materialId: mat.id,
      tipoOperacao: 'Consumo em Ordem de Serviço',
      quantidade,
      origem: `${mat.almoxarifadoNome} (${mat.prateleiraPosicao})`,
      destino: `${os.subestacaoNome} / ${os.numero}`,
      motivo: `Aplicação em serviço conforme ${os.numero}: ${os.titulo}`,
      ordemServicoId: os.id,
    });

    // Atualiza status do material na OS
    const itemOS = os.materiaisRequisitados.find((i) => i.materialId === materialId);
    if (itemOS) {
      itemOS.consumido = true;
    } else {
      os.materiaisRequisitados.push({
        materialId: mat.id,
        descricao: mat.descricao,
        quantidade,
        unidade: mat.unidadeMedida,
        reservado: false,
        consumido: true,
      });
    }

    this.saveData();
    return os;
  }

  // --- Inventário Físico ---
  public getInventarios(): InventarioFisico[] {
    return this.data.inventarios;
  }

  public getInventarioById(id: string): InventarioFisico | undefined {
    return this.data.inventarios.find((inv) => inv.id === id);
  }

  public criarInventario(payload: {
    tipoLocal: 'subestacao' | 'almoxarifado';
    localId: string;
    observacaoGeral?: string;
  }): InventarioFisico {
    const localNome =
      payload.tipoLocal === 'subestacao'
        ? this.getSubestacaoById(payload.localId)?.nome || 'Subestação'
        : this.data.almoxarifados.find((a) => a.id === payload.localId)?.nome || 'Almoxarifado';

    const agora = new Date().toISOString();
    const codigo = `INV-${new Date().getFullYear()}-${String(this.data.inventarios.length + 1).padStart(3, '0')}`;

    // Pré-carregar os itens esperados no local
    const itens: InventarioFisico['itens'] = [];

    if (payload.tipoLocal === 'subestacao') {
      const eqpsLocal = this.data.equipamentos.filter((e) => e.subestacaoId === payload.localId);
      eqpsLocal.forEach((eqp) => {
        itens.push({
          itemTipo: 'equipamento',
          itemId: eqp.id,
          codigo: eqp.codigoPatrimonial,
          descricao: eqp.descricao,
          quantidadeEsperada: 1,
          quantidadeContada: 0,
          diferenca: -1,
          statusDivergencia: 'Falta',
        });
      });
    } else {
      const matsLocal = this.data.materiais.filter((m) => m.almoxarifadoId === payload.localId);
      matsLocal.forEach((mat) => {
        itens.push({
          itemTipo: 'material',
          itemId: mat.id,
          codigo: mat.codigoInterno,
          descricao: mat.descricao,
          quantidadeEsperada: mat.quantidadeFisica,
          quantidadeContada: 0,
          diferenca: -mat.quantidadeFisica,
          statusDivergencia: 'Falta',
        });
      });
    }

    const novo: InventarioFisico = {
      id: `inv-${Date.now()}`,
      codigo,
      dataCriacao: agora,
      tipoLocal: payload.tipoLocal,
      localId: payload.localId,
      localNome,
      responsavelId: this.currentUser.id,
      responsavelNome: this.currentUser.nome,
      status: 'Em Contagem',
      itens,
      observacaoGeral: payload.observacaoGeral || '',
    };

    this.data.inventarios.unshift(novo);
    this.saveData();
    this.registrarAuditoria('Abertura de Inventário', 'Inventário Físico', novo.id, `Inventário ${novo.codigo} aberto para ${localNome}.`);
    return novo;
  }

  public registrarContagemItemInventario(
    invId: string,
    itemId: string,
    quantidadeContada: number,
    observacao?: string
  ): InventarioFisico {
    const inv = this.data.inventarios.find((i) => i.id === invId);
    if (!inv) throw new Error('Inventário não localizado.');

    const item = inv.itens.find((it) => it.itemId === itemId);
    if (!item) throw new Error('Item não localizado na lista deste inventário.');

    item.quantidadeContada = quantidadeContada;
    item.diferenca = item.quantidadeContada - item.quantidadeEsperada;

    if (item.diferenca === 0) {
      item.statusDivergencia = 'Exato';
    } else if (item.diferenca > 0) {
      item.statusDivergencia = 'Sobra';
    } else {
      item.statusDivergencia = 'Falta';
    }

    if (observacao) {
      item.observacao = observacao;
    }

    this.saveData();
    return inv;
  }

  public aprovarAjusteInventario(invId: string): InventarioFisico {
    const inv = this.data.inventarios.find((i) => i.id === invId);
    if (!inv) throw new Error('Inventário não localizado.');

    const agora = new Date().toISOString();

    // Aplica ajustes reais no estoque para itens com divergência
    for (const item of inv.itens) {
      if (item.itemTipo === 'material' && item.diferenca !== 0) {
        const mat = this.data.materiais.find((m) => m.id === item.itemId);
        if (mat) {
          this.registrarMovimentacaoEstoque({
            materialId: mat.id,
            tipoOperacao: 'Ajuste de Inventário',
            quantidade: item.quantidadeContada,
            origem: `Inventário Físico ${inv.codigo}`,
            destino: mat.almoxarifadoNome,
            motivo: `Ajuste homologado de ${item.statusDivergencia} de ${Math.abs(item.diferenca)} ${mat.unidadeMedida}. ${item.observacao || ''}`,
          });
        }
      }
    }

    inv.status = 'Aprovado';
    inv.aprovadoPor = this.currentUser.nome;
    inv.dataAprovacao = agora;
    inv.dataFinalizacao = agora;

    this.saveData();
    this.registrarAuditoria('Aprovação de Inventário', 'Inventário Físico', inv.id, `Inventário ${inv.codigo} homologado com ajustes aplicados.`);
    return inv;
  }

  // --- Configurações do Sistema ---
  public getConfiguracoes(): ConfiguracaoSistema {
    return this.data.configuracao;
  }

  public salvarConfiguracoes(config: Partial<ConfiguracaoSistema>): ConfiguracaoSistema {
    this.data.configuracao = { ...this.data.configuracao, ...config };
    this.saveData();
    this.registrarAuditoria('Alteração de Configurações', 'Configurações', undefined, 'Parâmetros corporativos do TRACKSUB alterados.');
    return this.data.configuracao;
  }

  public zerarAtivos(): void {
    this.data.subestacoes = [];
    this.data.paineis = [];
    this.data.modulos = [];
    this.data.equipamentos = [];
    this.data.movimentacoes = [];
    this.data.ordensServico = [];
    this.data.inventarios = [];
    this.saveData();
    this.registrarAuditoria(
      'Limpeza Geral de Ativos',
      'Configurações',
      undefined,
      'Equipamentos, subestações, painéis, módulos, ordens de serviço e inventários zerados para novo cadastramento completo.'
    );
  }

  public redefinirDadosDemonstracao(): void {
    this.data = {
      usuarios: usuariosIniciais,
      subestacoes: subestacoesIniciais,
      paineis: paineisIniciais,
      modulos: modulosIniciais,
      almoxarifados: almoxarifadosIniciais,
      fornecedores: fornecedoresIniciais,
      equipamentos: equipamentosIniciais,
      movimentacoes: movimentacoesIniciais,
      materiais: materiaisIniciais,
      movimentacoesMateriais: movimentacoesMateriaisIniciais,
      ordensServico: ordensServicoIniciais,
      inventarios: inventariosIniciais,
      auditoria: auditoriaIniciais,
      configuracao: configuracaoInicial,
    };
    this.currentUser = this.data.usuarios[0];
    this.saveData();
  }
}

export const dbService = new DatabaseService();
