import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db, auth, testFirestoreConnection } from './firebase.ts';
import {
  Equipamento,
  Movimentacao,
  Subestacao,
  Painel,
  Modulo,
  Almoxarifado,
  Fornecedor,
  Material,
  OrdemServico,
  InventarioFisico,
  ItemInventario,
  AuditoriaLog,
  ConfiguracaoSistema,
  Usuario,
  PerfilUsuario,
  DashboardStats,
  MovimentacaoMaterial,
} from '../types/tracksub.ts';

export function formatarErroFirebase(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || String(err);

  switch (code) {
    case 'permission-denied':
      return 'Permissão negada pelo Firestore. Seu perfil não possui autorização para esta operação.';
    case 'unavailable':
      return 'O serviço do Cloud Firestore está temporariamente indisponível. Verifique sua conexão com a internet.';
    case 'unauthenticated':
      return 'Sessão expirada ou não autenticada. Faça login novamente.';
    case 'not-found':
      return 'O documento solicitado não foi localizado no banco de dados da nuvem.';
    case 'already-exists':
      return 'Já existe um registro com esta identificação no banco de dados.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail informado possui formato inválido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciais inválidas. Verifique seu e-mail e senha de acesso.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado para outro usuário.';
    case 'auth/weak-password':
      return 'A senha deve conter no mínimo 6 caracteres.';
    default:
      if (msg.includes('offline')) {
        return 'Falha de comunicação: o cliente Firestore está sem conexão com a nuvem.';
      }
      return msg || 'Ocorreu um erro inesperado ao comunicar com o Firebase.';
  }
}

export function limparCamposUndefined<T extends Record<string, any>>(obj: T): T {
  const limpo: any = {};
  for (const [chave, valor] of Object.entries(obj)) {
    if (valor !== undefined) {
      limpo[chave] = valor;
    }
  }
  return limpo as T;
}

class FirestoreService {
  private currentUserCache: Usuario | null = null;

  private defaultAdminUser: Usuario = {
    id: 'usr-admin-master',
    nome: 'Anderson Tavares',
    email: 'anderson.tavares8576@gmail.com',
    perfil: 'administrador',
    matricula: 'ENG-2026-01',
    cargo: 'Engenheiro Eletricista / Administrador Geral',
  };

  constructor() {
    this.currentUserCache = this.defaultAdminUser;
  }

  // --- Conexão ---
  public async verificarConexao(): Promise<{ conectado: boolean; erro?: string }> {
    const res = await testFirestoreConnection();
    return { conectado: res.connected, erro: res.error };
  }

  // --- Usuários ---
  public getCurrentUser(): Usuario {
    return this.currentUserCache || this.defaultAdminUser;
  }

  public async setCurrentUser(user: Usuario): Promise<void> {
    this.currentUserCache = user;
    try {
      await this.salvarUsuario(user);
    } catch {
      // cache local mantido
    }
  }

  public async getUsuarios(): Promise<Usuario[]> {
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      if (snap.empty) {
        await this.salvarUsuario(this.defaultAdminUser);
        return [this.defaultAdminUser];
      }
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Usuario));
    } catch (err) {
      console.warn('Erro ao carregar usuários:', formatarErroFirebase(err));
      return [this.defaultAdminUser];
    }
  }

  public async salvarUsuario(usuario: Partial<Usuario>): Promise<Usuario> {
    const id = usuario.id || `usr-${Date.now()}`;
    const dados: Usuario = {
      id,
      nome: usuario.nome || 'Usuário TRACKSUB',
      email: usuario.email || 'usuario@tracksub.com.br',
      perfil: usuario.perfil || 'tecnico',
      matricula: usuario.matricula || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      cargo: usuario.cargo || 'Técnico de Subestação',
      foto: usuario.foto,
    };

    try {
      await setDoc(doc(db, 'usuarios', id), limparCamposUndefined(dados as any), { merge: true });
      if (this.currentUserCache?.id === id) {
        this.currentUserCache = dados;
      }
      return dados;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async switchUser(userId: string): Promise<Usuario> {
    const usrs = await this.getUsuarios();
    const achado = usrs.find((u) => u.id === userId);
    if (!achado) throw new Error('Usuário não localizado no sistema.');
    this.currentUserCache = achado;
    return achado;
  }

  public async loginComEmailSenha(email: string, senha: string): Promise<Usuario> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;
      const userDoc = await getDoc(doc(db, 'usuarios', uid));

      if (userDoc.exists()) {
        const u = { id: userDoc.id, ...(userDoc.data() as any) } as Usuario;
        this.currentUserCache = u;
        return u;
      }

      const novoUsuario: Usuario = {
        id: uid,
        nome: cred.user.displayName || email.split('@')[0],
        email: email,
        perfil: email === 'anderson.tavares8576@gmail.com' ? 'administrador' : 'tecnico',
        matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        cargo: 'Profissional de Campo',
      };
      await setDoc(doc(db, 'usuarios', uid), novoUsuario);
      this.currentUserCache = novoUsuario;
      return novoUsuario;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async criarConta(email: string, senha: string, nome: string, cargo: string, perfil: PerfilUsuario): Promise<Usuario> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;
      const novoUsuario: Usuario = {
        id: uid,
        nome,
        email,
        perfil,
        matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        cargo,
      };
      await setDoc(doc(db, 'usuarios', uid), novoUsuario);
      this.currentUserCache = novoUsuario;
      return novoUsuario;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUserCache = this.defaultAdminUser;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- Subestações ---
  public async getSubestacoes(): Promise<Subestacao[]> {
    try {
      const snap = await getDocs(collection(db, 'subestacoes'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Subestacao));
    } catch (err: any) {
      console.warn('Aviso ao consultar subestações no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async zerarEquipamentosESubestacoes(): Promise<{ success: boolean; totalExcluidos: number }> {
    try {
      let total = 0;
      const colecoes = ['equipamentos', 'subestacoes', 'paineis', 'modulos', 'movimentacoes'];
      for (const col of colecoes) {
        const snap = await getDocs(collection(db, col));
        if (snap.empty) continue;
        const docs = snap.docs;
        const tamanhoBatch = 350;
        for (let i = 0; i < docs.length; i += tamanhoBatch) {
          const fatia = docs.slice(i, i + tamanhoBatch);
          const batch = writeBatch(db);
          fatia.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          total += fatia.length;
        }
      }
      return { success: true, totalExcluidos: total };
    } catch (err: any) {
      throw new Error(`Erro ao zerar dados no Firestore: ${formatarErroFirebase(err)}`);
    }
  }

  public async inicializarBaseDemonstracao(): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Usuários adicionais
      const usuariosIniciais: Usuario[] = [
        this.defaultAdminUser,
        {
          id: 'usr-tec-carlos',
          nome: 'Carlos Silveira',
          email: 'carlos.silveira@tracksub.com.br',
          perfil: 'tecnico',
          matricula: 'TEC-2026-14',
          cargo: 'Técnico Especialista em Proteção e Controle',
        },
        {
          id: 'usr-almox-marcos',
          nome: 'Marcos Almeida',
          email: 'marcos.almeida@tracksub.com.br',
          perfil: 'almoxarife',
          matricula: 'ALM-2026-08',
          cargo: 'Almoxarife Responsável de Subestação',
        },
        {
          id: 'usr-gestor-juliana',
          nome: 'Eng. Juliana Ramos',
          email: 'juliana.ramos@tracksub.com.br',
          perfil: 'gestor',
          matricula: 'GES-2026-03',
          cargo: 'Gestora Regional de Ativos de Transmissão',
        },
      ];
      usuariosIniciais.forEach((u) => {
        batch.set(doc(db, 'usuarios', u.id), u, { merge: true });
      });

      // Subestações
      const subestacoesIniciais: Subestacao[] = [
        {
          id: 'se-estreito',
          codigo: 'SE-EST-500',
          nome: 'SE Estreito 500/230 kV',
          tensaoPrimaria: '500 kV',
          tensaoSecundaria: '230 kV',
          endereco: 'Rodovia Estadual MG-050, km 342',
          cidade: 'Franca / Ibiraci',
          uf: 'MG',
          latitude: -20.5383,
          longitude: -47.4008,
          ativa: true,
          observacoes: 'Subestação nodal de grande porte com 4 bancos de transformadores e 2 pátios blindados.',
        },
        {
          id: 'se-campinas',
          codigo: 'SE-CPN-230',
          nome: 'SE Campinas Norte 230/138 kV',
          tensaoPrimaria: '230 kV',
          tensaoSecundaria: '138 kV',
          endereco: 'Distrito Industrial Campo dos Amarais',
          cidade: 'Campinas',
          uf: 'SP',
          latitude: -22.9068,
          longitude: -47.0616,
          ativa: true,
          observacoes: 'Subestação de distribuição regional com alta densidade de carga industrial.',
        },
        {
          id: 'se-taubate',
          codigo: 'SE-TBT-138',
          nome: 'SE Taubaté Principal 138/13.8 kV',
          tensaoPrimaria: '138 kV',
          tensaoSecundaria: '13.8 kV',
          endereco: 'Avenida Charles Schnneider, 1400',
          cidade: 'Taubaté',
          uf: 'SP',
          latitude: -23.0205,
          longitude: -45.5564,
          ativa: true,
          observacoes: 'Atendimento do Vale do Paraíba com sistema de automação digital IEC 61850.',
        },
      ];
      subestacoesIniciais.forEach((s) => {
        batch.set(doc(db, 'subestacoes', s.id), s, { merge: true });
      });

      // Almoxarifados
      const almoxarifadosIniciais: Almoxarifado[] = [
        {
          id: 'alm-central',
          codigo: 'ALM-01',
          nome: 'Almoxarifado Central Regional - Campinas',
          subestacaoId: 'se-campinas',
          subestacaoNome: 'SE Campinas Norte 230/138 kV',
          responsavel: 'Marcos Almeida',
          localizacao: 'Pátio de Cargas - Galpão 02',
          tipo: 'Principal',
          ativo: true,
        },
        {
          id: 'alm-estreito',
          codigo: 'ALM-02',
          nome: 'Almoxarifado Avançado SE Estreito',
          subestacaoId: 'se-estreito',
          subestacaoNome: 'SE Estreito 500/230 kV',
          responsavel: 'Carlos Silveira',
          localizacao: 'Edificação de Apoio Operacional',
          tipo: 'Avançado de Subestação',
          ativo: true,
        },
      ];
      almoxarifadosIniciais.forEach((a) => {
        batch.set(doc(db, 'almoxarifados', a.id), a, { merge: true });
      });

      // Painéis
      const paineisIniciais: Painel[] = [
        {
          id: 'pnl-01',
          subestacaoId: 'se-estreito',
          codigo: 'PNL-TR1-01',
          identificacao: 'Painel P-01 - Proteção Principal Transformador TR-01 (87T / 50-51)',
          funcao: 'Proteção Diferencial e Sobrecorrente',
          tensao: '500 kV',
          tipo: 'Cubículo Metal-Clad de Proteção',
          ativo: true,
          observacoes: 'Painel homologado com barramento redundante e fibra ótica.',
        },
        {
          id: 'pnl-02',
          subestacaoId: 'se-campinas',
          codigo: 'PNL-LT-02',
          identificacao: 'Painel P-02 - Proteção Linha de Transmissão LT 230kV C1',
          funcao: 'Proteção de Distância e Religamento (21 / 79)',
          tensao: '230 kV',
          tipo: 'Painel Autoportante de Relés',
          ativo: true,
          observacoes: 'Comunicação direta via teleproteção digital.',
        },
      ];
      paineisIniciais.forEach((p) => {
        batch.set(doc(db, 'paineis', p.id), p, { merge: true });
      });

      // Módulos
      const modulosIniciais: Modulo[] = [
        {
          id: 'mod-01',
          subestacaoId: 'se-estreito',
          painelId: 'pnl-01',
          codigo: 'MOD-V01',
          identificacao: 'Vão / Gaveta V-01 - IED Proteção Principal 87T',
          posicao: 'Gaveta A1 (Superior)',
          observacoes: 'Instalação de relé multifunção com fonte redundante.',
        },
        {
          id: 'mod-02',
          subestacaoId: 'se-campinas',
          painelId: 'pnl-02',
          codigo: 'MOD-V02',
          identificacao: 'Vão / Gaveta V-02 - IED Medição e Controle de Bay',
          posicao: 'Gaveta B2 (Intermediária)',
          observacoes: 'Módulo de aquisição analógica de TC e TP.',
        },
      ];
      modulosIniciais.forEach((m) => {
        batch.set(doc(db, 'modulos', m.id), m, { merge: true });
      });

      // Fornecedores
      const fornecedoresIniciais: Fornecedor[] = [
        {
          id: 'forn-hitachi',
          razaoSocial: 'Hitachi Energy Brasil Ltda.',
          nomeFantasia: 'Hitachi Energy / ABB Power Grids',
          cnpj: '61.074.829/0001-30',
          contato: 'Eng. Renato Paiva - Suporte Técnico',
          telefone: '(11) 3688-9000',
          email: 'suporte.subestacoes@hitachienergy.com',
          endereco: 'Av. dos Autonomistas, 1496 - Osasco/SP',
          categoriaFornecimento: 'Transformadores e Disjuntores de Alta Tensão',
          ativo: true,
        },
        {
          id: 'forn-sel',
          razaoSocial: 'Schweitzer Engineering Laboratories do Brasil',
          nomeFantasia: 'SEL Brasil',
          cnpj: '04.912.448/0001-70',
          contato: 'Atendimento Técnico de Proteção',
          telefone: '(19) 3515-2000',
          email: 'suporte_br@selinc.com',
          endereco: 'Rua José Rocha Bonfim, 214 - Campinas/SP',
          categoriaFornecimento: 'Relés de Proteção, IEDs e Controladores de Subestação',
          ativo: true,
        },
        {
          id: 'forn-schneider',
          razaoSocial: 'Schneider Electric Brasil Ltda.',
          nomeFantasia: 'Schneider Electric',
          cnpj: '82.891.487/0001-30',
          contato: 'Engenharia de Aplicação Subestações',
          telefone: '(11) 3468-5000',
          email: 'contato@se.com',
          endereco: 'Av. das Nações Unidas, 14.171 - São Paulo/SP',
          categoriaFornecimento: 'Multimedidores, Cubículos e RPDs',
          ativo: true,
        },
      ];
      fornecedoresIniciais.forEach((f) => {
        batch.set(doc(db, 'fornecedores', f.id), f, { merge: true });
      });

      // Materiais (Estoque)
      const materiaisIniciais: Material[] = [
        {
          id: 'mat-01',
          codigoInterno: 'MAT-EL-1001',
          descricao: 'Cabo de Cobre Nu Eletrolítico 50mm² (Malha de Aterramento)',
          categoria: 'Cabos e Condutores',
          fabricante: 'Prysmian Group',
          referenciaModelo: '50mm² 7 Fios',
          unidadeMedida: 'metro',
          quantidadeFisica: 850,
          quantidadeReservada: 50,
          quantidadeDisponivel: 800,
          estoqueMinimo: 200,
          estoqueMaximo: 2000,
          fornecedorId: 'forn-hitachi',
          fornecedorNome: 'Hitachi Energy / ABB Power Grids',
          almoxarifadoId: 'alm-central',
          almoxarifadoNome: 'Almoxarifado Central Regional - Campinas',
          prateleiraPosicao: 'Prateleira A-04',
          codigoBarrasQr: 'TRACKSUB-MAT-mat-01',
          tipoMaterial: 'Consumível',
          custoUnitario: 34.50,
          observacoes: 'Utilizado para malha de terra de subestação.',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: 'mat-02',
          codigoInterno: 'MAT-EL-1002',
          descricao: 'Terminal Bimetálico de Compressão Al/Cu 230 kV',
          categoria: 'Conectores e Terminais',
          fabricante: 'Burndy / Hubbell',
          referenciaModelo: 'YA-2N-BIMETAL',
          unidadeMedida: 'un',
          quantidadeFisica: 120,
          quantidadeReservada: 10,
          quantidadeDisponivel: 110,
          estoqueMinimo: 30,
          estoqueMaximo: 300,
          fornecedorId: 'forn-hitachi',
          fornecedorNome: 'Hitachi Energy / ABB Power Grids',
          almoxarifadoId: 'alm-central',
          almoxarifadoNome: 'Almoxarifado Central Regional - Campinas',
          prateleiraPosicao: 'Gaveta B-12',
          codigoBarrasQr: 'TRACKSUB-MAT-mat-02',
          tipoMaterial: 'Sobressalente',
          custoUnitario: 145.00,
          observacoes: 'Terminal para conexão de buchas de transformadores.',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: 'mat-03',
          codigoInterno: 'MAT-EL-1003',
          descricao: 'Óleo Isolante Mineral Naftênico para Transformador (Tambor 200L)',
          categoria: 'Isolação e Vedação',
          fabricante: 'Petrobras Lubrax',
          referenciaModelo: 'AV-58 Naftênico',
          unidadeMedida: 'litro',
          quantidadeFisica: 1200,
          quantidadeReservada: 0,
          quantidadeDisponivel: 1200,
          estoqueMinimo: 400,
          estoqueMaximo: 4000,
          fornecedorId: 'forn-hitachi',
          fornecedorNome: 'Hitachi Energy / ABB Power Grids',
          almoxarifadoId: 'alm-central',
          almoxarifadoNome: 'Almoxarifado Central Regional - Campinas',
          prateleiraPosicao: 'Área Externa Coberta',
          codigoBarrasQr: 'TRACKSUB-MAT-mat-03',
          tipoMaterial: 'Consumível',
          custoUnitario: 18.90,
          observacoes: 'Óleo homologado com rigidez dielétrica > 60kV.',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
      ];
      materiaisIniciais.forEach((m) => {
        batch.set(doc(db, 'materiais', m.id), m, { merge: true });
      });

      // Equipamentos Iniciais com QR Code Único e Datas Operacionais
      const equipamentosIniciais: Equipamento[] = [
        {
          id: 'eqp-01',
          codigoPatrimonial: 'PAT-2026-0001',
          descricao: 'Relé de Proteção Multifunção Diferencial de Transformador (87T / 50/51)',
          tipo: 'Relé de Proteção Multifunção',
          fabricante: 'Schweitzer Engineering Laboratories (SEL)',
          modelo: 'SEL-487E-4',
          numeroSerie: 'SN-487E-2026-9812',
          qrCode: 'TRACKSUB-PAT-2026-0001',
          subestacaoId: 'se-estreito',
          painelId: 'Painel P-01 - Proteção Principal Transformador TR-01 (87T / 50-51)',
          moduloId: 'Vão / Gaveta V-01 - IED Proteção Principal 87T',
          almoxarifadoId: null,
          localizacaoDescricao: 'SE Estreito 500/230 kV / Pátio 500kV - Painel P-01',
          estadoConservacao: 'Novo',
          estadoOperacional: 'Em Operação',
          responsavel: 'Carlos Silveira',
          dataInstalacao: '2026-01-15',
          dataAquisicao: '2026-01-15',
          garantiaAte: '2029-01-15',
          documentosTecnicos: [],
          fotografias: [],
          observacoes: 'Equipamento parametrizado com protocolo DNP3.0 e IEC 61850 ativo. Ensaio de injeção secundária aprovado.',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: 'eqp-02',
          codigoPatrimonial: 'PAT-2026-0002',
          descricao: 'Multimedidor Digital de Grandezas Elétricas Classe 0.2S com Ethernet',
          tipo: 'Multimedidor Digital de Grandezas Elétricas',
          fabricante: 'Schneider Electric',
          modelo: 'PowerLogic ION9000',
          numeroSerie: 'SN-ION9K-2025-4103',
          qrCode: 'TRACKSUB-PAT-2026-0002',
          subestacaoId: 'se-campinas',
          painelId: 'Painel P-02 - Proteção Linha de Transmissão LT 230kV C1',
          moduloId: 'Vão / Gaveta V-02 - IED Medição e Controle de Bay',
          almoxarifadoId: null,
          localizacaoDescricao: 'SE Campinas Norte 230/138 kV / Sala de Comando - Painel P-02',
          estadoConservacao: 'Novo',
          estadoOperacional: 'Em Operação',
          responsavel: 'Carlos Silveira',
          dataInstalacao: '2026-02-10',
          dataAquisicao: '2026-02-10',
          garantiaAte: '2028-02-10',
          documentosTecnicos: [],
          fotografias: [],
          observacoes: 'Medição de harmônicos e oscilografia digital para qualidade de energia.',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: 'eqp-03',
          codigoPatrimonial: 'PAT-2026-0003',
          descricao: 'Disjuntor de Alta Tensão 230 kV SF6 Tripolar com Mecanismo de Mola',
          tipo: 'Disjuntor de Alta Tensão',
          fabricante: 'Hitachi Energy / ABB',
          modelo: 'LTB 245D1/B',
          numeroSerie: 'SN-LTB-2024-8841',
          qrCode: 'TRACKSUB-PAT-2026-0003',
          subestacaoId: null,
          painelId: null,
          moduloId: null,
          almoxarifadoId: 'alm-central',
          localizacaoDescricao: 'Almoxarifado Central Regional - Campinas / Pátio de Grandes Equipamentos',
          estadoConservacao: 'Bom',
          estadoOperacional: 'Sobressalente / Estoque',
          responsavel: 'Marcos Almeida',
          dataRetirada: '2026-02-28',
          dataAquisicao: '2025-06-20',
          garantiaAte: '2027-06-20',
          documentosTecnicos: [],
          fotografias: [],
          observacoes: 'Disjuntor revisado e desgaseificado em estoque para sobressalente estratégico.',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
      ];
      equipamentosIniciais.forEach((e) => {
        batch.set(doc(db, 'equipamentos', e.id), e, { merge: true });
      });

      // Movimentações Históricas (Trilha de Rastreabilidade indelével)
      const movimentacoesIniciais: Movimentacao[] = [
        {
          id: 'mov-init-01',
          equipamentoId: 'eqp-01',
          equipamentoDescricao: 'Relé de Proteção Multifunção Diferencial de Transformador (87T / 50/51)',
          equipamentoPatrimonio: 'PAT-2026-0001',
          tipoOperacao: 'Instalação',
          destinoSubestacaoId: 'se-estreito',
          destinoSubestacaoNome: 'SE Estreito 500/230 kV',
          destinoPainelNome: 'Painel P-01 - Proteção Principal Transformador TR-01 (87T / 50-51)',
          destinoModuloNome: 'Vão / Gaveta V-01 - IED Proteção Principal 87T',
          dataHora: '2026-01-15T10:30:00.000Z',
          usuarioId: 'usr-admin-master',
          usuarioNome: 'Anderson Tavares',
          usuarioPerfil: 'administrador',
          motivo: 'Comissionamento e energização do novo vão do Transformador TR-01.',
          observacoes: 'Parametrização validada via mala de testes com relatório técnico anexo.',
        },
        {
          id: 'mov-init-02',
          equipamentoId: 'eqp-02',
          equipamentoDescricao: 'Multimedidor Digital de Grandezas Elétricas Classe 0.2S com Ethernet',
          equipamentoPatrimonio: 'PAT-2026-0002',
          tipoOperacao: 'Instalação',
          destinoSubestacaoId: 'se-campinas',
          destinoSubestacaoNome: 'SE Campinas Norte 230/138 kV',
          destinoPainelNome: 'Painel P-02 - Proteção Linha de Transmissão LT 230kV C1',
          destinoModuloNome: 'Vão / Gaveta V-02 - IED Medição e Controle de Bay',
          dataHora: '2026-02-10T14:15:00.000Z',
          usuarioId: 'usr-tec-carlos',
          usuarioNome: 'Carlos Silveira',
          usuarioPerfil: 'tecnico',
          motivo: 'Modernização do sistema de medição e faturamento da Linha de Transmissão LT 230kV.',
          observacoes: 'Instalação física e conexão ao switch IEC 61850 concluídas.',
        },
        {
          id: 'mov-init-03',
          equipamentoId: 'eqp-03',
          equipamentoDescricao: 'Disjuntor de Alta Tensão 230 kV SF6 Tripolar com Mecanismo de Mola',
          equipamentoPatrimonio: 'PAT-2026-0003',
          tipoOperacao: 'Retirada',
          origemSubestacaoId: 'se-campinas',
          origemSubestacaoNome: 'SE Campinas Norte 230/138 kV',
          destinoAlmoxarifadoNome: 'Almoxarifado Central Regional - Campinas',
          dataHora: '2026-02-28T09:00:00.000Z',
          usuarioId: 'usr-almox-marcos',
          usuarioNome: 'Marcos Almeida',
          usuarioPerfil: 'almoxarife',
          motivo: 'Retirada para revisão preventiva programada e guarda como reserva operacional.',
          observacoes: 'Equipamento testado com pressão de SF6 nominal mantida.',
        },
      ];
      movimentacoesIniciais.forEach((m) => {
        batch.set(doc(db, 'movimentacoes', m.id), m, { merge: true });
      });

      // Configurações Gerais
      const configInicial: ConfiguracaoSistema = {
        nomeEmpresa: 'Concessionária de Energia e Transmissão do Brasil',
        cnpjEmpresa: '00.123.456/0001-89',
        regiaoConcessao: 'Sudeste / Centro-Oeste (Rede Básica SIN)',
        alertaEstoqueMinimo: true,
        permitirSaldoNegativo: false,
        formatoEtiqueta: 'Padrão 60x40mm',
        rodapeRelatorio: 'TRACKSUB - Sistema Integrado de Rastreabilidade de Equipamentos e Subestações',
      };
      batch.set(doc(db, 'configuracoes', 'geral'), configInicial, { merge: true });

      await batch.commit();
      console.log('Base de demonstração do TRACKSUB provisionada com sucesso no Firestore.');
    } catch (e) {
      console.warn('Erro ao inicializar base de demonstração:', e);
    }
  }

  public async salvarSubestacao(sub: Partial<Subestacao>): Promise<Subestacao> {
    const id = sub.id || `se-${Date.now()}`;
    const payload: Subestacao = {
      id,
      codigo: sub.codigo || `SE-${Math.floor(100 + Math.random() * 900)}`,
      nome: sub.nome || 'Nova Subestação',
      tensaoPrimaria: sub.tensaoPrimaria || '230 kV',
      tensaoSecundaria: sub.tensaoSecundaria || '138 kV',
      endereco: sub.endereco || '',
      cidade: sub.cidade || '',
      uf: sub.uf || 'SP',
      latitude: sub.latitude || -23.5505,
      longitude: sub.longitude || -46.6333,
      ativa: sub.ativa !== undefined ? sub.ativa : true,
      observacoes: sub.observacoes || '',
    };
    try {
      await setDoc(doc(db, 'subestacoes', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async excluirSubestacao(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'subestacoes', id));
      return true;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- Painéis ---
  public async getPaineis(subestacaoId?: string): Promise<Painel[]> {
    try {
      const colRef = collection(db, 'paineis');
      const q = subestacaoId && subestacaoId !== 'todas'
        ? query(colRef, where('subestacaoId', '==', subestacaoId))
        : colRef;
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Painel));
    } catch (err: any) {
      console.warn('Aviso ao buscar painéis:', formatarErroFirebase(err));
      return [];
    }
  }

  public async salvarPainel(painel: Partial<Painel>): Promise<Painel> {
    const id = painel.id || `pnl-${Date.now()}`;
    const payload: Painel = {
      id,
      subestacaoId: painel.subestacaoId || '',
      codigo: painel.codigo || `PNL-${Math.floor(100 + Math.random() * 900)}`,
      identificacao: painel.identificacao || 'Painel de Proteção e Controle',
      funcao: painel.funcao || 'Proteção e Controle',
      tensao: painel.tensao || '230 kV',
      tipo: painel.tipo || 'Cubículo de Proteção',
      ativo: painel.ativo !== undefined ? painel.ativo : true,
      observacoes: painel.observacoes || '',
    };
    try {
      await setDoc(doc(db, 'paineis', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async excluirPainel(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'paineis', id));
      return true;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- Módulos ---
  public async getModulos(painelId?: string): Promise<Modulo[]> {
    try {
      const colRef = collection(db, 'modulos');
      const q = painelId ? query(colRef, where('painelId', '==', painelId)) : colRef;
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Modulo));
    } catch (err: any) {
      console.warn('Aviso ao buscar módulos:', formatarErroFirebase(err));
      return [];
    }
  }

  public async salvarModulo(modItem: Partial<Modulo>): Promise<Modulo> {
    const id = modItem.id || `mod-${Date.now()}`;
    const payload: Modulo = {
      id,
      subestacaoId: modItem.subestacaoId || '',
      painelId: modItem.painelId || '',
      identificacao: modItem.identificacao || 'Módulo Geral',
      codigo: modItem.codigo || `MOD-${Math.floor(100 + Math.random() * 900)}`,
      posicao: modItem.posicao || 'Geral',
      observacoes: modItem.observacoes || '',
    };
    try {
      await setDoc(doc(db, 'modulos', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async excluirModulo(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'modulos', id));
      return true;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- Almoxarifados ---
  public async getAlmoxarifados(): Promise<Almoxarifado[]> {
    try {
      const snap = await getDocs(collection(db, 'almoxarifados'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Almoxarifado));
    } catch (err: any) {
      console.warn('Aviso ao buscar almoxarifados:', formatarErroFirebase(err));
      return [];
    }
  }

  public async salvarAlmoxarifado(almox: Partial<Almoxarifado>): Promise<Almoxarifado> {
    const id = almox.id || `alm-${Date.now()}`;
    const payload: Almoxarifado = {
      id,
      codigo: almox.codigo || `ALM-${Math.floor(10 + Math.random() * 90)}`,
      nome: almox.nome || 'Almoxarifado Central',
      subestacaoId: almox.subestacaoId,
      subestacaoNome: almox.subestacaoNome,
      responsavel: almox.responsavel || this.getCurrentUser().nome,
      localizacao: almox.localizacao || 'Pátio Central',
      tipo: almox.tipo || 'Principal',
      ativo: almox.ativo !== undefined ? almox.ativo : true,
    };
    try {
      await setDoc(doc(db, 'almoxarifados', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- Fornecedores ---
  public async getFornecedores(): Promise<Fornecedor[]> {
    try {
      const snap = await getDocs(collection(db, 'fornecedores'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Fornecedor));
    } catch (err: any) {
      console.warn('Aviso ao consultar fornecedores no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async salvarFornecedor(forn: Partial<Fornecedor>): Promise<Fornecedor> {
    const id = forn.id || `forn-${Date.now()}`;
    const payload: Fornecedor = {
      id,
      razaoSocial: forn.razaoSocial || 'Fabricante Especializado',
      nomeFantasia: forn.nomeFantasia || forn.razaoSocial || 'Fabricante',
      cnpj: forn.cnpj || '00.000.000/0001-00',
      contato: forn.contato || 'Atendimento Comercial',
      telefone: forn.telefone || '',
      email: forn.email || '',
      endereco: forn.endereco || '',
      categoriaFornecimento: forn.categoriaFornecimento || 'Equipamentos Elétricos',
      ativo: forn.ativo !== undefined ? forn.ativo : true,
    };
    try {
      await setDoc(doc(db, 'fornecedores', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- EQUIPAMENTOS ---
  public async getEquipamentos(filtros?: {
    termo?: string;
    subestacaoId?: string;
    tipo?: string;
    estadoOperacional?: string;
    estadoConservacao?: string;
  }): Promise<Equipamento[]> {
    try {
      const snap = await getDocs(collection(db, 'equipamentos'));
      let itens = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Equipamento));

      if (filtros?.termo) {
        const t = filtros.termo.trim().toLowerCase();
        itens = itens.filter(
          (e) =>
            e.codigoPatrimonial.toLowerCase().includes(t) ||
            e.descricao.toLowerCase().includes(t) ||
            e.numeroSerie.toLowerCase().includes(t) ||
            e.modelo.toLowerCase().includes(t) ||
            e.fabricante.toLowerCase().includes(t) ||
            e.localizacaoDescricao.toLowerCase().includes(t)
        );
      }
      if (filtros?.subestacaoId && filtros.subestacaoId !== 'todas') {
        itens = itens.filter((e) => e.subestacaoId === filtros.subestacaoId);
      }
      if (filtros?.tipo && filtros.tipo !== 'todos') {
        itens = itens.filter((e) => e.tipo === filtros.tipo);
      }
      if (filtros?.estadoOperacional && filtros.estadoOperacional !== 'todos') {
        itens = itens.filter((e) => e.estadoOperacional === filtros.estadoOperacional);
      }
      if (filtros?.estadoConservacao && filtros.estadoConservacao !== 'todos') {
        itens = itens.filter((e) => e.estadoConservacao === filtros.estadoConservacao);
      }

      return itens;
    } catch (err: any) {
      console.warn('Aviso ao consultar equipamentos no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async getEquipamentoById(id: string): Promise<Equipamento> {
    try {
      const snap = await getDoc(doc(db, 'equipamentos', id));
      if (!snap.exists()) throw new Error('Equipamento não localizado no Cloud Firestore.');
      return { id: snap.id, ...(snap.data() as any) } as Equipamento;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async buscarEquipamentoPorCodigo(codigo: string): Promise<Equipamento> {
    if (!codigo || !codigo.trim()) throw new Error('Código não informado.');
    const raw = codigo.trim();

    try {
      let paramExtraido = '';
      const matchQuery = raw.match(/[?&#](?:eqp|equipamento|patrimonio|codigo|id)=([^&#]+)/i);
      if (matchQuery && matchQuery[1]) {
        try {
          paramExtraido = decodeURIComponent(matchQuery[1]).trim();
        } catch {
          paramExtraido = matchQuery[1].trim();
        }
      }

      const clean = raw.toUpperCase();
      const cleanParam = paramExtraido ? paramExtraido.toUpperCase() : '';

      const candidatos: string[] = [];
      if (cleanParam) candidatos.push(cleanParam);
      candidatos.push(clean);

      for (const c of [...candidatos]) {
        if (c.startsWith('TRACKSUB-')) {
          candidatos.push(c.replace('TRACKSUB-', '').trim());
        }
      }

      const snap = await getDocs(collection(db, 'equipamentos'));
      const todos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Equipamento));

      for (const cand of candidatos) {
        const achado = todos.find(
          (e) =>
            e.codigoPatrimonial.toUpperCase() === cand ||
            e.id.toUpperCase() === cand ||
            (e.qrCode && e.qrCode.toUpperCase() === cand) ||
            e.numeroSerie.toUpperCase() === cand
        );
        if (achado) return achado;
      }

      for (const eqp of todos) {
        const patrim = eqp.codigoPatrimonial.toUpperCase();
        if (patrim && (clean.includes(patrim) || (cleanParam && cleanParam.includes(patrim)))) {
          return eqp;
        }
      }

      throw new Error(`Nenhum equipamento foi localizado no banco para o código "${codigo}".`);
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async salvarEquipamento(payload: Partial<Equipamento>): Promise<Equipamento> {
    const agora = new Date().toISOString();
    const dataHoje = agora.split('T')[0];

    try {
      if (payload.codigoPatrimonial) {
        const snap = await getDocs(
          query(collection(db, 'equipamentos'), where('codigoPatrimonial', '==', payload.codigoPatrimonial.trim().toUpperCase()))
        );
        const duplicado = snap.docs.find((d) => d.id !== payload.id);
        if (duplicado) {
          throw new Error(`Código Patrimonial "${payload.codigoPatrimonial}" já cadastrado para outro equipamento.`);
        }
      }

      const id = payload.id || `eqp-${Date.now()}`;
      const patrim = (payload.codigoPatrimonial || `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
      const qrIndividual = payload.qrCode || `TRACKSUB-${patrim}`;

      const eqpFinal: Equipamento = {
        id,
        codigoPatrimonial: patrim,
        tipo: payload.tipo || 'Multimedidor Digital de Grandezas Elétricas',
        descricao: payload.descricao || 'Equipamento de Subestação',
        fabricante: payload.fabricante || 'Fabricante Homologado',
        modelo: payload.modelo || 'Modelo Padrão',
        numeroSerie: payload.numeroSerie || `SN-${Date.now().toString().slice(-6)}`,
        qrCode: qrIndividual,
        subestacaoId: payload.subestacaoId || null,
        painelId: payload.painelId || null,
        moduloId: payload.moduloId || null,
        almoxarifadoId: payload.almoxarifadoId || null,
        localizacaoDescricao: payload.localizacaoDescricao || 'Almoxarifado Central / Triagem Inicial',
        estadoConservacao: payload.estadoConservacao || 'Novo',
        estadoOperacional: payload.estadoOperacional || 'Sobressalente / Estoque',
        responsavel: payload.responsavel || this.getCurrentUser().nome,
        dataRetirada: payload.dataRetirada || undefined,
        dataInstalacao: payload.dataInstalacao || (payload.estadoOperacional === 'Em Operação' ? dataHoje : undefined),
        dataAquisicao: payload.dataAquisicao || payload.dataRetirada || payload.dataInstalacao || dataHoje,
        garantiaAte: payload.garantiaAte || payload.dataInstalacao || '',
        documentosTecnicos: payload.documentosTecnicos || [],
        fotografias: payload.fotografias || [],
        observacoes: payload.observacoes || '',
        criadoEm: payload.criadoEm || agora,
        atualizadoEm: agora,
      };

      await setDoc(doc(db, 'equipamentos', id), limparCamposUndefined(eqpFinal as any), { merge: true });

      if (!payload.id) {
        const movEntrada: Movimentacao = {
          id: `mov-${Date.now()}`,
          equipamentoId: id,
          equipamentoDescricao: eqpFinal.descricao,
          equipamentoPatrimonio: eqpFinal.codigoPatrimonial,
          tipoOperacao: 'Entrada de Estoque',
          dataHora: agora,
          usuarioId: this.getCurrentUser().id,
          usuarioNome: this.getCurrentUser().nome,
          usuarioPerfil: this.getCurrentUser().perfil,
          motivo: 'Cadastro inicial do equipamento com geração de QR Code único.',
          observacoes: `Ativo registrado: ${eqpFinal.fabricante} ${eqpFinal.modelo} (S/N: ${eqpFinal.numeroSerie}).`,
        };
        await setDoc(doc(db, 'movimentacoes', movEntrada.id), limparCamposUndefined(movEntrada as any));
      }

      return eqpFinal;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async salvarEquipamentosLote(
    itens: Partial<Equipamento>[],
    opcoes?: { sobrescreverDuplicados?: boolean }
  ): Promise<{
    success: boolean;
    totalCadastrados: number;
    totalAtualizados: number;
    totalIgnorados: number;
    totalNoBanco: number;
    erros: string[];
    itensCadastrados: Equipamento[];
  }> {
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new Error('Nenhum item informado para cadastro em lote.');
    }

    const agora = new Date().toISOString();
    const dataHoje = agora.split('T')[0];

    try {
      const snapExistentes = await getDocs(collection(db, 'equipamentos'));
      const mapExistentes = new Map<string, string>();
      snapExistentes.forEach((d) => {
        const e = d.data() as Equipamento;
        if (e.codigoPatrimonial) mapExistentes.set(e.codigoPatrimonial.toUpperCase().trim(), d.id);
      });

      let totalCadastrados = 0;
      let totalAtualizados = 0;
      let totalIgnorados = 0;
      const erros: string[] = [];
      const itensCadastrados: Equipamento[] = [];

      const tamanhoBatch = 350;
      for (let i = 0; i < itens.length; i += tamanhoBatch) {
        const fatia = itens.slice(i, i + tamanhoBatch);
        const batch = writeBatch(db);

        for (let j = 0; j < fatia.length; j++) {
          const item = fatia[j];
          let patrim = (item.codigoPatrimonial || '').trim().toUpperCase();

          if (!patrim) {
            patrim = `PAT-${new Date().getFullYear()}-${String(mapExistentes.size + totalCadastrados + 1).padStart(5, '0')}`;
          }

          const docIdExistente = mapExistentes.get(patrim);

          if (docIdExistente && !opcoes?.sobrescreverDuplicados) {
            totalIgnorados++;
            continue;
          }

          const id = docIdExistente || item.id || `eqp-${Date.now()}-${i}-${j}`;
          const eqp: Equipamento = {
            id,
            codigoPatrimonial: patrim,
            tipo: item.tipo || 'Multimedidor Digital de Grandezas Elétricas',
            descricao: item.descricao || `Equipamento ${patrim}`,
            fabricante: item.fabricante || 'Fabricante Especializado',
            modelo: item.modelo || 'Padrão SE',
            numeroSerie: item.numeroSerie || `SN-${patrim}`,
            qrCode: item.qrCode || `TRACKSUB-${patrim}`,
            subestacaoId: item.subestacaoId || null,
            painelId: item.painelId || null,
            moduloId: item.moduloId || null,
            almoxarifadoId: item.almoxarifadoId || null,
            localizacaoDescricao: item.localizacaoDescricao || 'Almoxarifado Central',
            estadoConservacao: item.estadoConservacao || 'Novo',
            estadoOperacional: item.estadoOperacional || 'Sobressalente / Estoque',
            responsavel: item.responsavel || this.getCurrentUser().nome,
            dataRetirada: item.dataRetirada || undefined,
            dataInstalacao: item.dataInstalacao || undefined,
            dataAquisicao: item.dataAquisicao || item.dataRetirada || item.dataInstalacao || dataHoje,
            garantiaAte: item.garantiaAte || item.dataInstalacao || '',
            documentosTecnicos: item.documentosTecnicos || [],
            fotografias: item.fotografias || [],
            observacoes: item.observacoes || 'Importado via Carga em Lote TRACKSUB',
            criadoEm: agora,
            atualizadoEm: agora,
          };

          batch.set(doc(db, 'equipamentos', id), eqp, { merge: true });

          if (docIdExistente) {
            totalAtualizados++;
          } else {
            totalCadastrados++;
            mapExistentes.set(patrim, id);
          }
          itensCadastrados.push(eqp);
        }

        await batch.commit();
      }

      const totalNoBanco = snapExistentes.size + totalCadastrados;
      return {
        success: true,
        totalCadastrados,
        totalAtualizados,
        totalIgnorados,
        totalNoBanco,
        erros,
        itensCadastrados,
      };
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async excluirEquipamento(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'equipamentos', id));
      return true;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async excluirEquipamentosLote(ids: string[]): Promise<{ success: boolean; totalExcluidos: number }> {
    if (!Array.isArray(ids) || ids.length === 0) return { success: true, totalExcluidos: 0 };

    try {
      let excluidos = 0;
      const tamanhoBatch = 400;

      for (let i = 0; i < ids.length; i += tamanhoBatch) {
        const fatia = ids.slice(i, i + tamanhoBatch);
        const batch = writeBatch(db);
        fatia.forEach((id) => batch.delete(doc(db, 'equipamentos', id)));
        await batch.commit();
        excluidos += fatia.length;
      }

      return { success: true, totalExcluidos: excluidos };
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- MOVIMENTAÇÕES ---
  public async getMovimentacoes(equipamentoId?: string): Promise<Movimentacao[]> {
    try {
      const colRef = collection(db, 'movimentacoes');
      const q = equipamentoId
        ? query(colRef, where('equipamentoId', '==', equipamentoId))
        : query(colRef, orderBy('dataHora', 'desc'), limit(150));
      const snap = await getDocs(q);
      const lista = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Movimentacao));
      return lista.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    } catch (err: any) {
      console.warn('Aviso ao consultar movimentações no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async registrarMovimentacao(payload: {
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
  }): Promise<Movimentacao> {
    const agora = new Date().toISOString();
    const dataHoje = agora.split('T')[0];

    try {
      const eqpSnap = await getDoc(doc(db, 'equipamentos', payload.equipamentoId));
      if (!eqpSnap.exists()) {
        throw new Error('Equipamento não localizado para movimentação.');
      }
      const eqp = eqpSnap.data() as Equipamento;

      let origemSubNome = '';
      if (eqp.subestacaoId) {
        const seDoc = await getDoc(doc(db, 'subestacoes', eqp.subestacaoId));
        if (seDoc.exists()) origemSubNome = (seDoc.data() as Subestacao).nome;
      }

      let destSubNome = '';
      if (payload.destinoSubestacaoId) {
        const seDoc = await getDoc(doc(db, 'subestacoes', payload.destinoSubestacaoId));
        if (seDoc.exists()) destSubNome = (seDoc.data() as Subestacao).nome;
      }

      let destAlmoxNome = '';
      if (payload.destinoAlmoxarifadoId) {
        const almDoc = await getDoc(doc(db, 'almoxarifados', payload.destinoAlmoxarifadoId));
        if (almDoc.exists()) destAlmoxNome = (almDoc.data() as Almoxarifado).nome;
      }

      let novoEstadoOp: Equipamento['estadoOperacional'] = eqp.estadoOperacional;
      let novaLocalizacao = eqp.localizacaoDescricao;
      let novaDataInstalacao = eqp.dataInstalacao;
      let novaDataRetirada = eqp.dataRetirada;

      switch (payload.tipoOperacao) {
        case 'Instalação':
          novoEstadoOp = 'Em Operação';
          novaDataInstalacao = dataHoje;
          novaLocalizacao = `${destSubNome || 'Subestação'}${payload.destinoModuloId ? ` / ${payload.destinoModuloId}` : ''}`;
          break;
        case 'Retirada':
          novoEstadoOp = 'Retirado';
          novaDataRetirada = dataHoje;
          novaLocalizacao = destAlmoxNome ? `${destAlmoxNome} (Retirado para triagem)` : 'Equipamento Retirado / Em Trânsito';
          break;
        case 'Transferência de Painel':
        case 'Transferência de Subestação':
          novoEstadoOp = 'Em Operação';
          novaLocalizacao = `${destSubNome || origemSubNome || 'Subestação'}${payload.destinoModuloId ? ` / ${payload.destinoModuloId}` : ''}`;
          break;
        case 'Envio para Manutenção':
          novoEstadoOp = 'Em Manutenção';
          novaLocalizacao = 'Oficina Especializada de Manutenção';
          break;
        case 'Envio para Ensaios':
          novoEstadoOp = 'Em Ensaio';
          novaLocalizacao = 'Laboratório de Ensaios e Calibração';
          break;
        case 'Retorno ao Almoxarifado':
        case 'Entrada de Estoque':
          novoEstadoOp = 'Sobressalente / Estoque';
          novaLocalizacao = destAlmoxNome || 'Almoxarifado Central / Prateleira';
          break;
        case 'Baixa Patrimonial':
          novoEstadoOp = 'Baixado';
          novaLocalizacao = 'Descarte / Baixa Patrimonial Confirmada';
          break;
      }

      const movId = `mov-${Date.now()}`;
      const novaMov: Movimentacao = {
        id: movId,
        equipamentoId: eqp.id,
        equipamentoDescricao: eqp.descricao,
        equipamentoPatrimonio: eqp.codigoPatrimonial,
        tipoOperacao: payload.tipoOperacao,
        origemSubestacaoId: eqp.subestacaoId || undefined,
        origemSubestacaoNome: origemSubNome || undefined,
        origemPainelNome: eqp.painelId || undefined,
        origemModuloNome: eqp.moduloId || undefined,
        destinoSubestacaoId: payload.destinoSubestacaoId || undefined,
        destinoSubestacaoNome: destSubNome || undefined,
        destinoPainelNome: payload.destinoPainelId || undefined,
        destinoModuloNome: payload.destinoModuloId || undefined,
        destinoAlmoxarifadoNome: destAlmoxNome || undefined,
        dataHora: agora,
        usuarioId: this.getCurrentUser().id,
        usuarioNome: this.getCurrentUser().nome,
        usuarioPerfil: this.getCurrentUser().perfil,
        motivo: payload.motivo.trim(),
        ordemServicoId: payload.ordemServicoId || undefined,
        observacoes: payload.observacoes?.trim() || '',
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'movimentacoes', movId), limparCamposUndefined(novaMov as any));

      const updatePayload: Record<string, any> = {
        estadoOperacional: novoEstadoOp,
        localizacaoDescricao: novaLocalizacao,
        subestacaoId: ['Instalação', 'Transferência de Painel', 'Transferência de Subestação'].includes(payload.tipoOperacao)
          ? payload.destinoSubestacaoId || null
          : null,
        painelId: payload.destinoPainelId || null,
        moduloId: payload.destinoModuloId || null,
        almoxarifadoId: payload.destinoAlmoxarifadoId || null,
        estadoConservacao: payload.novoEstadoConservacao || eqp.estadoConservacao,
        dataInstalacao: novaDataInstalacao || null,
        dataRetirada: novaDataRetirada || null,
        atualizadoEm: agora,
      };

      batch.update(doc(db, 'equipamentos', eqp.id), limparCamposUndefined(updatePayload));

      await batch.commit();
      return novaMov;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- MATERIAIS ---
  public async getMateriais(): Promise<Material[]> {
    try {
      const snap = await getDocs(collection(db, 'materiais'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Material));
    } catch (err: any) {
      console.warn('Aviso ao consultar materiais no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async salvarMaterial(mat: Partial<Material>): Promise<Material> {
    const id = mat.id || `mat-${Date.now()}`;
    const payload: Material = {
      id,
      codigoInterno: mat.codigoInterno || `MAT-${Math.floor(100 + Math.random() * 900)}`,
      descricao: mat.descricao || 'Item de Consumo Elétrico',
      categoria: mat.categoria || 'Cabos e Condutores',
      fabricante: mat.fabricante || 'Fabricante Homologado',
      referenciaModelo: mat.referenciaModelo || 'Padrão',
      unidadeMedida: mat.unidadeMedida || 'un',
      quantidadeFisica: mat.quantidadeFisica ?? 10,
      quantidadeReservada: mat.quantidadeReservada ?? 0,
      quantidadeDisponivel: (mat.quantidadeFisica ?? 10) - (mat.quantidadeReservada ?? 0),
      estoqueMinimo: mat.estoqueMinimo ?? 5,
      estoqueMaximo: mat.estoqueMaximo ?? 100,
      custoUnitario: mat.custoUnitario ?? 0,
      fornecedorId: mat.fornecedorId || '',
      fornecedorNome: mat.fornecedorNome || '',
      almoxarifadoId: mat.almoxarifadoId || 'alm-central',
      almoxarifadoNome: mat.almoxarifadoNome || 'Almoxarifado Central',
      prateleiraPosicao: mat.prateleiraPosicao || 'Prateleira A1',
      codigoBarrasQr: mat.codigoBarrasQr || `TRACKSUB-MAT-${id}`,
      tipoMaterial: mat.tipoMaterial || 'Consumível',
      observacoes: mat.observacoes || '',
      criadoEm: mat.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'materiais', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- ORDENS DE SERVIÇO ---
  public async getOrdensServico(): Promise<OrdemServico[]> {
    try {
      const snap = await getDocs(collection(db, 'ordensServico'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as OrdemServico));
    } catch (err: any) {
      console.warn('Aviso ao consultar ordens de serviço no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async salvarOrdemServico(os: Partial<OrdemServico>): Promise<OrdemServico> {
    const id = os.id || `os-${Date.now()}`;
    const payload: OrdemServico = {
      id,
      numero: os.numero || `OS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      titulo: os.titulo || 'Manutenção Preventiva de Painéis',
      subestacaoId: os.subestacaoId || '',
      subestacaoNome: os.subestacaoNome || 'Subestação Principal',
      painelId: os.painelId,
      painelNome: os.painelNome,
      equipamentoId: os.equipamentoId,
      equipamentoNome: os.equipamentoNome,
      descricaoServico: os.descricaoServico || 'Inspeção termográfica e ensaios operacionais.',
      tipoManutencao: os.tipoManutencao || 'Preventiva',
      prioridade: os.prioridade || 'Média',
      status: os.status || 'Aberta',
      responsavelId: os.responsavelId || this.getCurrentUser().id,
      responsavelNome: os.responsavelNome || this.getCurrentUser().nome,
      equipeExecutora: os.equipeExecutora || 'Equipe de Manutenção Subestações',
      dataAbertura: os.dataAbertura || new Date().toISOString(),
      prazoLimite: os.prazoLimite || new Date(Date.now() + 7 * 86400000).toISOString(),
      dataConclusao: os.dataConclusao,
      materiaisRequisitados: os.materiaisRequisitados || [],
      equipamentosMovimentados: os.equipamentosMovimentados || [],
      observacoes: os.observacoes || '',
    };
    try {
      await setDoc(doc(db, 'ordensServico', id), payload, { merge: true });
      return payload;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- INVENTÁRIOS & AUDITORIA ---
  public async getInventarios(): Promise<InventarioFisico[]> {
    try {
      const snap = await getDocs(collection(db, 'inventarios'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as InventarioFisico));
    } catch (err: any) {
      console.warn('Aviso ao consultar inventários no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async criarInventario(payload: {
    tipoLocal: 'subestacao' | 'almoxarifado';
    localId: string;
    observacaoGeral?: string;
  }): Promise<InventarioFisico> {
    try {
      const id = `inv-${Date.now()}`;
      let localNome = 'Local Operacional';

      if (payload.tipoLocal === 'subestacao') {
        const seDoc = await getDoc(doc(db, 'subestacoes', payload.localId));
        if (seDoc.exists()) localNome = (seDoc.data() as Subestacao).nome;
      } else {
        const almDoc = await getDoc(doc(db, 'almoxarifados', payload.localId));
        if (almDoc.exists()) localNome = (almDoc.data() as Almoxarifado).nome;
      }

      // Localiza itens associados ao local
      const itens: ItemInventario[] = [];

      if (payload.tipoLocal === 'subestacao') {
        const eqps = await this.getEquipamentos({ subestacaoId: payload.localId });
        eqps.forEach((eqp) => {
          itens.push({
            itemId: eqp.id,
            itemTipo: 'equipamento',
            codigo: eqp.codigoPatrimonial,
            descricao: eqp.descricao,
            quantidadeEsperada: 1,
            quantidadeContada: 1,
            diferenca: 0,
            statusDivergencia: 'Exato',
          });
        });
      } else {
        const mats = await this.getMateriais();
        const matsDoAlmox = mats.filter((m) => m.almoxarifadoId === payload.localId);
        matsDoAlmox.forEach((mat) => {
          itens.push({
            itemId: mat.id,
            itemTipo: 'material',
            codigo: mat.codigoInterno,
            descricao: mat.descricao,
            quantidadeEsperada: mat.quantidadeFisica,
            quantidadeContada: mat.quantidadeFisica,
            diferenca: 0,
            statusDivergencia: 'Exato',
          });
        });
      }

      const novoInv: InventarioFisico = {
        id,
        codigo: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        dataCriacao: new Date().toISOString(),
        tipoLocal: payload.tipoLocal,
        localId: payload.localId,
        localNome,
        responsavelId: this.getCurrentUser().id,
        responsavelNome: this.getCurrentUser().nome,
        status: 'Em Contagem',
        itens,
        observacaoGeral: payload.observacaoGeral || '',
      };

      await setDoc(doc(db, 'inventarios', id), limparCamposUndefined(novoInv as any));
      await this.registrarAuditoria(
        'Inventário Físico',
        'Abertura de Inventário',
        `Inventário ${novoInv.codigo} iniciado para ${localNome} com ${itens.length} itens.`
      );

      return novoInv;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async registrarContagemItem(
    invId: string,
    itemId: string,
    quantidadeContada: number,
    observacao?: string
  ): Promise<InventarioFisico> {
    try {
      const snap = await getDoc(doc(db, 'inventarios', invId));
      if (!snap.exists()) throw new Error('Inventário não localizado.');
      const inv = snap.data() as InventarioFisico;

      const itensAtualizados = (inv.itens || []).map((it) => {
        if (it.itemId !== itemId) return it;
        const diff = quantidadeContada - it.quantidadeEsperada;
        let st: ItemInventario['statusDivergencia'] = 'Exato';
        if (diff > 0) st = 'Sobra';
        else if (diff < 0) st = 'Falta';

        return {
          ...it,
          quantidadeContada,
          diferenca: diff,
          statusDivergencia: st,
          observacao: observacao || it.observacao,
        };
      });

      const invAtualizado: InventarioFisico = {
        ...inv,
        itens: itensAtualizados,
      };

      await setDoc(doc(db, 'inventarios', invId), invAtualizado, { merge: true });
      return invAtualizado;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async aprovarInventario(invId: string): Promise<InventarioFisico> {
    try {
      const snap = await getDoc(doc(db, 'inventarios', invId));
      if (!snap.exists()) throw new Error('Inventário não localizado.');
      const inv = snap.data() as InventarioFisico;

      // Se houver materiais com divergência, ajusta o saldo no Firestore
      for (const it of inv.itens || []) {
        if (it.itemTipo === 'material' && it.diferenca !== 0) {
          try {
            const matSnap = await getDoc(doc(db, 'materiais', it.itemId));
            if (matSnap.exists()) {
              const mat = matSnap.data() as Material;
              await setDoc(
                doc(db, 'materiais', it.itemId),
                {
                  quantidadeFisica: it.quantidadeContada,
                  quantidadeDisponivel: Math.max(0, it.quantidadeContada - (mat.quantidadeReservada || 0)),
                  atualizadoEm: new Date().toISOString(),
                },
                { merge: true }
              );
            }
          } catch {
            // prossegue
          }
        }
      }

      const invHomologado: InventarioFisico = {
        ...inv,
        status: 'Aprovado',
        dataAprovacao: new Date().toISOString(),
      };

      await setDoc(doc(db, 'inventarios', invId), invHomologado, { merge: true });
      await this.registrarAuditoria(
        'Inventário Físico',
        'Homologação de Inventário',
        `Inventário ${inv.codigo} aprovado. Saldos ajustados no sistema.`
      );

      return invHomologado;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async getAuditoria(): Promise<AuditoriaLog[]> {
    try {
      const snap = await getDocs(query(collection(db, 'auditoria'), limit(100)));
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) } as AuditoriaLog))
        .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    } catch (err: any) {
      console.warn('Aviso ao consultar auditoria no Firestore:', formatarErroFirebase(err));
      return [];
    }
  }

  public async registrarAuditoria(modulo: string, acao: string, detalhes: string): Promise<void> {
    try {
      const id = `aud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const log: AuditoriaLog = {
        id,
        dataHora: new Date().toISOString(),
        usuarioId: this.getCurrentUser().id,
        usuarioNome: this.getCurrentUser().nome,
        perfil: this.getCurrentUser().perfil,
        modulo,
        acao,
        detalhes,
        ip: '127.0.0.1 (Web Applet)',
      };
      await setDoc(doc(db, 'auditoria', id), log);
    } catch {
      // Registro não bloqueante
    }
  }

  public async getMovimentacoesMateriais(): Promise<MovimentacaoMaterial[]> {
    try {
      const snap = await getDocs(collection(db, 'movimentacoesMateriais'));
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) } as MovimentacaoMaterial))
        .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    } catch {
      return [];
    }
  }

  public async registrarMovimentacaoMaterial(payload: any): Promise<MovimentacaoMaterial> {
    try {
      const mats = await this.getMateriais();
      const m = mats.find((item) => item.id === payload.materialId);
      if (m) {
        let novaQtd = m.quantidadeFisica;
        if (payload.tipoOperacao === 'Entrada por Compra' || payload.tipoOperacao === 'Devolução ao Estoque') {
          novaQtd += payload.quantidade;
        } else {
          novaQtd = Math.max(0, novaQtd - payload.quantidade);
        }
        await this.salvarMaterial({
          ...m,
          quantidadeFisica: novaQtd,
          quantidadeDisponivel: Math.max(0, novaQtd - (m.quantidadeReservada || 0)),
        });
      }

      const id = `mov-mat-${Date.now()}`;
      const mov: MovimentacaoMaterial = {
        id,
        materialId: payload.materialId,
        materialDescricao: m?.descricao || 'Material',
        materialCodigo: m?.codigoInterno || 'MAT',
        tipoOperacao: payload.tipoOperacao,
        quantidade: payload.quantidade,
        unidadeMedida: m?.unidadeMedida || 'un',
        usuarioId: this.getCurrentUser().id,
        usuarioNome: this.getCurrentUser().nome,
        dataHora: new Date().toISOString(),
        origem: payload.origem || 'Estoque Central',
        destino: payload.destino || 'Subestação',
        motivo: payload.motivo || 'Movimentação operacional',
      };

      await setDoc(doc(db, 'movimentacoesMateriais', id), limparCamposUndefined(mov as any));
      await this.registrarAuditoria(
        'Materiais e Estoque',
        payload.tipoOperacao,
        `${payload.quantidade} ${m?.unidadeMedida || 'un'} de ${m?.descricao || 'material'} movimentados.`
      );

      return mov;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  public async getConfiguracoes(): Promise<ConfiguracaoSistema> {
    try {
      const snap = await getDoc(doc(db, 'configuracoes', 'geral'));
      if (snap.exists()) return snap.data() as ConfiguracaoSistema;
      const def: ConfiguracaoSistema = {
        nomeEmpresa: 'Concessionária de Energia do Brasil',
        cnpjEmpresa: '00.000.000/0001-99',
        regiaoConcessao: 'Sul / Sudeste (SIN)',
        alertaEstoqueMinimo: true,
        permitirSaldoNegativo: false,
        formatoEtiqueta: 'Padrão 60x40mm',
        rodapeRelatorio: 'TRACKSUB - Sistema de Gestão de Ativos e Rastreabilidade',
      };
      await setDoc(doc(db, 'configuracoes', 'geral'), def);
      return def;
    } catch {
      return {
        nomeEmpresa: 'Concessionária de Energia do Brasil',
        cnpjEmpresa: '00.000.000/0001-99',
        regiaoConcessao: 'Sul / Sudeste (SIN)',
        alertaEstoqueMinimo: true,
        permitirSaldoNegativo: false,
        formatoEtiqueta: 'Padrão 60x40mm',
        rodapeRelatorio: 'TRACKSUB - Sistema de Gestão de Ativos e Rastreabilidade',
      };
    }
  }

  public async salvarConfiguracoes(cfg: Partial<ConfiguracaoSistema>): Promise<ConfiguracaoSistema> {
    try {
      const atual = await this.getConfiguracoes();
      const novo: ConfiguracaoSistema = {
        ...atual,
        ...limparCamposUndefined(cfg as any),
      };
      await setDoc(doc(db, 'configuracoes', 'geral'), novo);
      await this.registrarAuditoria(
        'Configurações',
        'Edição de Parâmetros',
        `Parâmetros corporativos atualizados por ${this.getCurrentUser().nome}.`
      );
      return novo;
    } catch (err: any) {
      throw new Error(formatarErroFirebase(err));
    }
  }

  // --- DASHBOARD STATS ---
  public async getDashboardStats(subestacaoId?: string): Promise<DashboardStats> {
    try {
      const [eqps, mats, movs, ords] = await Promise.all([
        this.getEquipamentos({ subestacaoId }),
        this.getMateriais(),
        this.getMovimentacoes(),
        this.getOrdensServico(),
      ]);

      const totalEquipamentos = eqps.length;
      const equipamentosInstalados = eqps.filter((e) => e.estadoOperacional === 'Em Operação').length;
      const equipamentosEstoque = eqps.filter((e) => e.estadoOperacional === 'Sobressalente / Estoque').length;
      const equipamentosManutencao = eqps.filter((e) => e.estadoOperacional === 'Em Manutenção' || e.estadoOperacional === 'Em Ensaio').length;
      const equipamentosRetirados = eqps.filter((e) => e.estadoOperacional === 'Retirado' || e.estadoOperacional === 'Baixado').length;
      const equipamentosSemLocalizacao = eqps.filter((e) => !e.subestacaoId && !e.almoxarifadoId).length;

      const totalMateriaisDisponiveis = mats.reduce((acc, m) => acc + (m.quantidadeDisponivel || 0), 0);
      const materiaisAbaixoMinimo = mats.filter((m) => m.quantidadeFisica <= m.estoqueMinimo).length;
      const valorTotalEstoque = mats.reduce((acc, m) => acc + (m.quantidadeFisica * m.custoUnitario), 0);
      const ordensServicoAndamento = ords.filter((o) => o.status === 'Em Andamento' || o.status === 'Aberta').length;

      return {
        totalEquipamentos,
        equipamentosInstalados,
        equipamentosEstoque,
        equipamentosManutencao,
        equipamentosRetirados,
        equipamentosSemLocalizacao,
        totalMateriaisDisponiveis,
        materiaisAbaixoMinimo,
        valorTotalEstoque,
        ordensServicoAndamento,
        movimentacoesRecentes: movs.slice(0, 10),
        movimentacoesMateriaisRecentes: [],
        ordensRecentes: ords.slice(0, 10),
        equipamentosCriticos: eqps.filter((e) => e.estadoOperacional === 'Em Manutenção' || e.estadoConservacao === 'Necessita Reparo').slice(0, 5),
      };
    } catch {
      return {
        totalEquipamentos: 0,
        equipamentosInstalados: 0,
        equipamentosEstoque: 0,
        equipamentosManutencao: 0,
        equipamentosRetirados: 0,
        equipamentosSemLocalizacao: 0,
        totalMateriaisDisponiveis: 0,
        materiaisAbaixoMinimo: 0,
        valorTotalEstoque: 0,
        ordensServicoAndamento: 0,
        movimentacoesRecentes: [],
        movimentacoesMateriaisRecentes: [],
        ordensRecentes: [],
        equipamentosCriticos: [],
      };
    }
  }

  // --- BACKUP & RECUPERAÇÃO ---
  public async exportarBackupCompleto(): Promise<string> {
    try {
      const [
        usuarios,
        subestacoes,
        paineis,
        modulos,
        almoxarifados,
        fornecedores,
        equipamentos,
        movimentacoes,
        materiais,
        ordensServico,
        configuracoes,
      ] = await Promise.all([
        this.getUsuarios(),
        this.getSubestacoes(),
        this.getPaineis(),
        this.getModulos(),
        this.getAlmoxarifados(),
        this.getFornecedores(),
        this.getEquipamentos(),
        this.getMovimentacoes(),
        this.getMateriais(),
        this.getOrdensServico(),
        this.getConfiguracoes(),
      ]);

      const backupObj = {
        sistema: 'TRACKSUB Subestações',
        versaoBackup: '1.0',
        geradoEm: new Date().toISOString(),
        geradoPor: this.getCurrentUser().nome,
        totais: {
          usuarios: usuarios.length,
          subestacoes: subestacoes.length,
          paineis: paineis.length,
          modulos: modulos.length,
          almoxarifados: almoxarifados.length,
          fornecedores: fornecedores.length,
          equipamentos: equipamentos.length,
          movimentacoes: movimentacoes.length,
          materiais: materiais.length,
          ordensServico: ordensServico.length,
        },
        dados: {
          usuarios,
          subestacoes,
          paineis,
          modulos,
          almoxarifados,
          fornecedores,
          equipamentos,
          movimentacoes,
          materiais,
          ordensServico,
          configuracoes,
        },
      };

      return JSON.stringify(backupObj, null, 2);
    } catch (err: any) {
      throw new Error(`Erro ao gerar backup no Firestore: ${formatarErroFirebase(err)}`);
    }
  }

  public async restaurarBackup(jsonString: string): Promise<{ success: boolean; registrosRestaurados: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      const dados = parsed.dados || parsed;

      let restaurados = 0;

      const colecoes: Array<{ nome: string; itens: any[] }> = [
        { nome: 'subestacoes', itens: dados.subestacoes || [] },
        { nome: 'paineis', itens: dados.paineis || [] },
        { nome: 'modulos', itens: dados.modulos || [] },
        { nome: 'almoxarifados', itens: dados.almoxarifados || [] },
        { nome: 'fornecedores', itens: dados.fornecedores || [] },
        { nome: 'materiais', itens: dados.materiais || [] },
        { nome: 'equipamentos', itens: dados.equipamentos || [] },
        { nome: 'movimentacoes', itens: dados.movimentacoes || [] },
        { nome: 'ordensServico', itens: dados.ordensServico || [] },
      ];

      for (const col of colecoes) {
        if (!Array.isArray(col.itens) || col.itens.length === 0) continue;
        const tamanhoBatch = 350;
        for (let i = 0; i < col.itens.length; i += tamanhoBatch) {
          const fatia = col.itens.slice(i, i + tamanhoBatch);
          const batch = writeBatch(db);
          fatia.forEach((item) => {
            if (item.id) {
              batch.set(doc(db, col.nome, item.id), item, { merge: true });
              restaurados++;
            }
          });
          await batch.commit();
        }
      }

      return { success: true, registrosRestaurados: restaurados };
    } catch (err: any) {
      throw new Error(`Falha na restauração do backup: ${err.message || 'Arquivo corrompido ou formato inválido.'}`);
    }
  }
}

export const firestoreService = new FirestoreService();
