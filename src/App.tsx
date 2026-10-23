import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, ModuloId } from './components/layout/Sidebar.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { EquipamentosView } from './views/EquipamentosView.tsx';
import { MateriaisView } from './views/MateriaisView.tsx';
import { MovimentacoesView } from './views/MovimentacoesView.tsx';
import { LeitorQRCodeView } from './views/LeitorQRCodeView.tsx';
import { OrdensServicoView } from './views/OrdensServicoView.tsx';
import { SubestacoesView } from './views/SubestacoesView.tsx';
import { PaineisModulosView } from './views/PaineisModulosView.tsx';
import { AlmoxarifadosView } from './views/AlmoxarifadosView.tsx';
import { InventarioView } from './views/InventarioView.tsx';
import { FornecedoresView } from './views/FornecedoresView.tsx';
import { RelatoriosView } from './views/RelatoriosView.tsx';
import { UsuariosView } from './views/UsuariosView.tsx';
import { AuditoriaView } from './views/AuditoriaView.tsx';
import { ConfiguracoesView } from './views/ConfiguracoesView.tsx';

// Modais
import { ModalEtiquetaQRCode } from './components/modals/ModalEtiquetaQRCode.tsx';
import { ModalFichaEquipamento } from './components/modals/ModalFichaEquipamento.tsx';
import { ModalCadastroEquipamento } from './components/modals/ModalCadastroEquipamento.tsx';
import { ModalMovimentacaoEquipamento } from './components/modals/ModalMovimentacaoEquipamento.tsx';
import { ModalMaterial } from './components/modals/ModalMaterial.tsx';
import { ModalMovimentacaoMaterial } from './components/modals/ModalMovimentacaoMaterial.tsx';
import { ModalOrdemServico } from './components/modals/ModalOrdemServico.tsx';
import { ModalImportacaoMassiva } from './components/modals/ModalImportacaoMassiva.tsx';

import {
  Usuario,
  Subestacao,
  Painel,
  Modulo,
  Almoxarifado,
  Fornecedor,
  Equipamento,
  Material,
  Movimentacao,
  OrdemServico,
  InventarioFisico,
  AuditoriaLog,
  ConfiguracaoSistema,
  DashboardStats,
  TipoOperacaoMovimentacao,
  PerfilUsuario,
} from './types/tracksub.ts';
import { api } from './services/api.ts';

export default function App() {
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('visao-geral');
  const [menuAberto, setMenuAberto] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  // Dados do Estado Global
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [paineis, setPaineis] = useState<Painel[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [almoxarifados, setAlmoxarifados] = useState<Almoxarifado[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [inventarios, setInventarios] = useState<InventarioFisico[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaLog[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoSistema | null>(null);
  const [filtroSubestacaoDashboard, setFiltroSubestacaoDashboard] = useState<string>('todas');
  const [firestoreConectado, setFirestoreConectado] = useState(true);

  // Estados dos Modais
  const [modalEtiquetaEquipamento, setModalEtiquetaEquipamento] = useState<Equipamento | null>(null);
  const [modalFichaEquipamento, setModalFichaEquipamento] = useState<Equipamento | null>(null);
  const [modalCadastroEqpAberto, setModalCadastroEqpAberto] = useState(false);
  const [modalImportacaoMassivaAberto, setModalImportacaoMassivaAberto] = useState(false);
  const [equipamentoParaEditar, setEquipamentoParaEditar] = useState<Equipamento | null>(null);

  const [modalMovimentacaoEqp, setModalMovimentacaoEqp] = useState<Equipamento | null>(null);
  const [operacaoPadraoMov, setOperacaoPadraoMov] = useState<TipoOperacaoMovimentacao>('Instalação');

  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);
  const [materialParaEditar, setMaterialParaEditar] = useState<Material | null>(null);

  const [modalMovMaterial, setModalMovMaterial] = useState<Material | null>(null);

  const [modalOrdemAberto, setModalOrdemAberto] = useState(false);
  const [ordemParaEditar, setOrdemParaEditar] = useState<OrdemServico | null>(null);

  // Carregar todos os dados da API
  const carregarDados = useCallback(async (subestacaoDashboard?: string) => {
    try {
      // Carrega subestações primeiro para garantir auto-inicialização da base caso esteja vazia
      const subs = await api.getSubestacoes();

      const [
        usr,
        usrs,
        dashboardStats,
        pnl,
        mods,
        almoxs,
        forns,
        eqps,
        mats,
        movs,
        ords,
        invs,
        aud,
        cfg,
      ] = await Promise.all([
        api.getCurrentUser(),
        api.getUsuarios(),
        api.getDashboardStats(subestacaoDashboard || filtroSubestacaoDashboard),
        api.getPaineis(),
        api.getModulos(),
        api.getAlmoxarifados(),
        api.getFornecedores(),
        api.getEquipamentos(),
        api.getMateriais(),
        api.getMovimentacoes(),
        api.getOrdensServico(),
        api.getInventarios(),
        api.getAuditoria(),
        api.getConfiguracoes(),
      ]);

      setUsuarioAtual(usr);
      setUsuarios(usrs);
      setStats(dashboardStats);
      setSubestacoes(subs);
      setPaineis(pnl);
      setModulos(mods);
      setAlmoxarifados(almoxs);
      setFornecedores(forns);
      setEquipamentos(eqps);
      setMateriais(mats);
      setMovimentacoes(movs);
      setOrdens(ords);
      setInventarios(invs);
      setAuditoria(aud);
      setConfiguracao(cfg);
    } catch (err) {
      console.error('Erro ao sincronizar dados do TRACKSUB:', err);
    } finally {
      setCarregandoInicial(false);
    }
  }, [filtroSubestacaoDashboard]);

  useEffect(() => {
    carregarDados();
    // Testar conectividade inicial com o Cloud Firestore
    api.verificarConexao().then((res) => {
      setFirestoreConectado(res.conectado);
    });
  }, [carregarDados]);

  // Abertura com sincronização da URL para direcionamento direto via QR Code
  const handleAbrirFichaEquipamento = (eqp: Equipamento) => {
    setModalFichaEquipamento(eqp);
    try {
      const newUrl = `${window.location.pathname}?eqp=${encodeURIComponent(eqp.codigoPatrimonial)}`;
      window.history.replaceState({ eqpId: eqp.id }, '', newUrl);
    } catch {
      // fallback
    }
  };

  const handleFecharFichaEquipamento = () => {
    setModalFichaEquipamento(null);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('eqp');
      searchParams.delete('equipamento');
      searchParams.delete('patrimonio');
      searchParams.delete('id');
      const query = searchParams.toString();
      const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // fallback
    }
  };

  // Detectar QR Code escaneado por câmera externa ou URL direta
  useEffect(() => {
    if (carregandoInicial) return;

    const verificarUrlDireta = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const codigo =
          searchParams.get('eqp') ||
          searchParams.get('equipamento') ||
          searchParams.get('patrimonio') ||
          searchParams.get('id');

        if (codigo) {
          const achadoLocal = equipamentos.find(
            (e) =>
              e.codigoPatrimonial.toUpperCase() === codigo.toUpperCase().trim() ||
              e.id.toUpperCase() === codigo.toUpperCase().trim()
          );

          if (achadoLocal) {
            setModalFichaEquipamento(achadoLocal);
          } else {
            const remoto = await api.buscarEquipamentoPorCodigo(codigo);
            if (remoto) setModalFichaEquipamento(remoto);
          }
        }
      } catch (err) {
        console.warn('Busca de equipamento via URL:', err);
      }
    };

    verificarUrlDireta();
  }, [carregandoInicial, equipamentos]);

  // Ações de Usuário
  const handleTrocarUsuario = async (userId: string) => {
    try {
      const u = await api.switchUser(userId);
      setUsuarioAtual(u);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao trocar de usuário.');
    }
  };

  const handleCriarUsuario = async (perfil: PerfilUsuario, nome: string, cargo: string) => {
    await api.createCustomUser(perfil, nome, cargo);
    carregarDados();
  };

  const handleExcluirUsuario = async (userId: string) => {
    await api.excluirUsuario(userId);
    await carregarDados();
  };

  const handleSalvarEquipamento = async (eqpPayload: Partial<Equipamento>) => {
    await api.salvarEquipamento(eqpPayload);
    await carregarDados();
  };

  const handleExcluirEquipamento = async (id: string) => {
    await api.excluirEquipamento(id);
    if (modalFichaEquipamento && modalFichaEquipamento.id === id) {
      setModalFichaEquipamento(null);
    }
    await carregarDados();
  };

  const handleExcluirEquipamentosLote = async (ids: string[]) => {
    await api.excluirEquipamentosLote(ids);
    await carregarDados();
  };

  const handleExcluirSubestacao = async (id: string) => {
    await api.excluirSubestacao(id);
    await carregarDados();
  };

  const handleExcluirPainel = async (id: string) => {
    await api.excluirPainel(id);
    await carregarDados();
  };

  const handleExcluirModulo = async (id: string) => {
    await api.excluirModulo(id);
    await carregarDados();
  };

  const handleConfirmarMovimentacaoEquipamento = async (payload: any) => {
    await api.registrarMovimentacao(payload);
    await carregarDados();
    // Se a ficha estava aberta, atualizar o equipamento na ficha
    if (modalFichaEquipamento && modalFichaEquipamento.id === payload.equipamentoId) {
      const atualizado = await api.getEquipamentoById(payload.equipamentoId);
      setModalFichaEquipamento(atualizado);
    }
  };

  // Ações de Materiais
  const handleSalvarMaterial = async (matPayload: Partial<Material>) => {
    await api.salvarMaterial(matPayload);
    await carregarDados();
  };

  const handleExcluirMaterial = async (id: string) => {
    await api.excluirMaterial(id);
    await carregarDados();
  };

  const handleZerarEstoqueMaterial = async (id: string) => {
    await api.zerarEstoqueMaterial(id);
    await carregarDados();
  };

  const handleZerarTodoEstoqueMateriais = async () => {
    const res = await api.zerarTodoEstoque();
    await carregarDados();
    alert(res.message);
  };

  const handleZerarTodosMateriais = async () => {
    const res = await api.zerarMateriais();
    await carregarDados();
    alert(res.message);
  };

  const handleConfirmarMovimentacaoMaterial = async (payload: any) => {
    await api.movimentarEstoque(payload);
    await carregarDados();
  };

  // Ações de Ordens de Serviço
  const handleSalvarOrdemServico = async (osPayload: Partial<OrdemServico>) => {
    await api.salvarOrdemServico(osPayload);
    await carregarDados();
  };

  const handleConsumirMaterialOS = async (osId: string, materialId: string, quantidade: number) => {
    await api.consumirMaterialOS(osId, materialId, quantidade);
    await carregarDados();
  };

  // Ações de Inventário
  const handleCriarInventario = async (payload: any) => {
    await api.criarInventario(payload);
    await carregarDados();
  };

  const handleRegistrarContagem = async (invId: string, itemId: string, qtd: number, obs?: string) => {
    await api.registrarContagemItem(invId, itemId, qtd, obs);
    await carregarDados();
  };

  const handleAprovarInventario = async (invId: string) => {
    await api.aprovarInventario(invId);
    await carregarDados();
  };

  // Ações de Subestações / Painéis / Almoxarifados / Fornecedores / Config
  const handleSalvarSubestacao = async (sub: Partial<Subestacao>) => {
    await api.salvarSubestacao(sub);
    await carregarDados();
  };

  const handleSalvarPainel = async (painel: Partial<Painel>) => {
    await api.salvarPainel(painel);
    await carregarDados();
  };

  const handleSalvarModulo = async (modulo: Partial<Modulo>) => {
    await api.salvarModulo(modulo);
    await carregarDados();
  };

  const handleSalvarAlmoxarifado = async (almox: Partial<Almoxarifado>) => {
    await api.salvarAlmoxarifado(almox);
    await carregarDados();
  };

  const handleSalvarFornecedor = async (forn: Partial<Fornecedor>) => {
    await api.salvarFornecedor(forn);
    await carregarDados();
  };

  const handleSalvarConfig = async (cfg: Partial<ConfiguracaoSistema>) => {
    await api.salvarConfiguracoes(cfg);
    await carregarDados();
  };

  const handleRedefinirDados = async () => {
    await api.redefinirDadosDemonstracao();
    await carregarDados();
  };

  const handleZerarAtivos = async () => {
    const res = await api.zerarAtivos();
    await carregarDados();
    alert(res.message);
  };

  const titulosModulos: Record<ModuloId, string> = {
    'visao-geral': 'Visão Geral do Sistema',
    'equipamentos': 'Equipamentos e Ativos',
    'materiais': 'Materiais e Estoque',
    'movimentacoes': 'Rastreabilidade e Movimentações',
    'leitor-qrcode': 'Leitor de QR Code',
    'ordens-servico': 'Ordens de Serviço',
    'subestacoes': 'Subestações',
    'paineis-modulos': 'Painéis e Módulos',
    'almoxarifados': 'Almoxarifados',
    'inventario': 'Inventário Físico',
    'fornecedores': 'Fornecedores',
    'relatorios': 'Relatórios Gerenciais',
    'usuarios': 'Usuários e Permissões',
    'auditoria': 'Trilha de Auditoria',
    'configuracoes': 'Configurações',
  };

  if (carregandoInicial) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30">
          <span className="font-black text-xl">TS</span>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-wider">TRACKSUB</h2>
          <p className="text-xs text-slate-400 mt-1">
            Inicializando banco de dados de subestações e sistema de rastreabilidade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Barra de Navegação Lateral */}
      <Sidebar
        moduloAtivo={moduloAtivo}
        onSelecionarModulo={(id) => setModuloAtivo(id)}
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        badgeMateriaisCriticos={stats?.materiaisAbaixoMinimo || 0}
        badgeOrdensAndamento={stats?.ordensServicoAndamento || 0}
      />

      {/* Conteúdo Principal à Direita da Sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          usuarioAtual={usuarioAtual}
          usuariosDisponiveis={usuarios}
          onTrocarUsuario={handleTrocarUsuario}
          onAlternarMenu={() => setMenuAberto(!menuAberto)}
          moduloAtivoNome={titulosModulos[moduloAtivo]}
          onAbrirLeitorQR={() => setModuloAtivo('leitor-qrcode')}
          firestoreConectado={firestoreConectado}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {moduloAtivo === 'visao-geral' && (
            <DashboardView
              stats={stats}
              subestacoes={subestacoes}
              equipamentos={equipamentos}
              onFiltrarSubestacao={(seId) => {
                setFiltroSubestacaoDashboard(seId);
                carregarDados(seId);
              }}
              subestacaoSelecionada={filtroSubestacaoDashboard}
              onNavegar={(mod) => setModuloAtivo(mod)}
              onAbrirFichaEquipamento={(eqp) => setModalFichaEquipamento(eqp)}
              onNovoEquipamento={() => {
                setEquipamentoParaEditar(null);
                setModalCadastroEqpAberto(true);
              }}
              onNovoMaterial={() => {
                setMaterialParaEditar(null);
                setModalMaterialAberto(true);
              }}
              onNovaMovimentacao={() => {
                if (equipamentos.length > 0) {
                  setModalMovimentacaoEqp(equipamentos[0]);
                  setOperacaoPadraoMov('Instalação');
                }
              }}
              onAbrirImportacaoMassiva={() => setModalImportacaoMassivaAberto(true)}
            />
          )}

          {moduloAtivo === 'equipamentos' && (
            <EquipamentosView
              equipamentos={equipamentos}
              subestacoes={subestacoes}
              onAbrirFicha={(eqp) => setModalFichaEquipamento(eqp)}
              onAbrirEtiqueta={(eqp) => setModalEtiquetaEquipamento(eqp)}
              onAbrirMovimentacao={(eqp, op) => {
                setModalMovimentacaoEqp(eqp);
                setOperacaoPadraoMov(op || 'Instalação');
              }}
              onEditarEquipamento={(eqp) => {
                setEquipamentoParaEditar(eqp);
                setModalCadastroEqpAberto(true);
              }}
              onNovoEquipamento={() => {
                setEquipamentoParaEditar(null);
                setModalCadastroEqpAberto(true);
              }}
              onAbrirImportacaoMassiva={() => setModalImportacaoMassivaAberto(true)}
              onExcluirEquipamento={handleExcluirEquipamento}
              onExcluirEquipamentosLote={handleExcluirEquipamentosLote}
            />
          )}

          {moduloAtivo === 'materiais' && (
            <MateriaisView
              materiais={materiais}
              almoxarifados={almoxarifados}
              fornecedores={fornecedores}
              onNovoMaterial={() => {
                setMaterialParaEditar(null);
                setModalMaterialAberto(true);
              }}
              onEditarMaterial={(mat) => {
                setMaterialParaEditar(mat);
                setModalMaterialAberto(true);
              }}
              onMovimentarMaterial={(mat) => setModalMovMaterial(mat)}
              onExcluirMaterial={handleExcluirMaterial}
              onZerarEstoqueMaterial={handleZerarEstoqueMaterial}
              onZerarTodoEstoque={handleZerarTodoEstoqueMateriais}
              onZerarTodosMateriais={handleZerarTodosMateriais}
            />
          )}

          {moduloAtivo === 'movimentacoes' && (
            <MovimentacoesView
              movimentacoes={movimentacoes}
              onConsultarFichaEquipamento={(eqpId) => {
                const eqp = equipamentos.find((e) => e.id === eqpId);
                if (eqp) setModalFichaEquipamento(eqp);
              }}
              onNovaMovimentacao={() => {
                if (equipamentos.length > 0) {
                  setModalMovimentacaoEqp(equipamentos[0]);
                  setOperacaoPadraoMov('Instalação');
                }
              }}
            />
          )}

          {moduloAtivo === 'leitor-qrcode' && (
            <LeitorQRCodeView
              onAbrirFicha={handleAbrirFichaEquipamento}
              onAbrirEtiqueta={(eqp) => setModalEtiquetaEquipamento(eqp)}
              onAbrirMovimentacao={(eqp, op) => {
                setModalMovimentacaoEqp(eqp);
                setOperacaoPadraoMov(op || 'Instalação');
              }}
              usuarioAtual={usuarioAtual}
              equipamentosPrecarregados={equipamentos}
            />
          )}

          {moduloAtivo === 'ordens-servico' && (
            <OrdensServicoView
              ordens={ordens}
              subestacoes={subestacoes}
              materiais={materiais}
              onNovaOrdem={() => {
                setOrdemParaEditar(null);
                setModalOrdemAberto(true);
              }}
              onEditarOrdem={(os) => {
                setOrdemParaEditar(os);
                setModalOrdemAberto(true);
              }}
              onConsumirMaterial={handleConsumirMaterialOS}
            />
          )}

          {moduloAtivo === 'subestacoes' && (
            <SubestacoesView
              subestacoes={subestacoes}
              paineis={paineis}
              equipamentos={equipamentos}
              onSalvarSubestacao={handleSalvarSubestacao}
              onExcluirSubestacao={handleExcluirSubestacao}
            />
          )}

          {moduloAtivo === 'paineis-modulos' && (
            <PaineisModulosView
              subestacoes={subestacoes}
              paineis={paineis}
              modulos={modulos}
              equipamentos={equipamentos}
              onSalvarPainel={handleSalvarPainel}
              onSalvarModulo={handleSalvarModulo}
              onExcluirPainel={handleExcluirPainel}
              onExcluirModulo={handleExcluirModulo}
              onAbrirFichaEquipamento={(eqp) => setModalFichaEquipamento(eqp)}
              onNavegarSubestacoes={() => setModuloAtivo('subestacoes')}
            />
          )}

          {moduloAtivo === 'almoxarifados' && (
            <AlmoxarifadosView
              almoxarifados={almoxarifados}
              materiais={materiais}
              equipamentos={equipamentos}
              subestacoes={subestacoes}
              onSalvarAlmoxarifado={handleSalvarAlmoxarifado}
            />
          )}

          {moduloAtivo === 'inventario' && (
            <InventarioView
              inventarios={inventarios}
              subestacoes={subestacoes}
              almoxarifados={almoxarifados}
              onCriarInventario={handleCriarInventario}
              onRegistrarContagem={handleRegistrarContagem}
              onAprovarInventario={handleAprovarInventario}
            />
          )}

          {moduloAtivo === 'fornecedores' && (
            <FornecedoresView
              fornecedores={fornecedores}
              onSalvarFornecedor={handleSalvarFornecedor}
            />
          )}

          {moduloAtivo === 'relatorios' && (
            <RelatoriosView
              equipamentos={equipamentos}
              materiais={materiais}
              movimentacoes={movimentacoes}
              ordens={ordens}
              inventarios={inventarios}
              subestacoes={subestacoes}
            />
          )}

          {moduloAtivo === 'usuarios' && (
            <UsuariosView
              usuarios={usuarios}
              usuarioAtual={usuarioAtual}
              onTrocarUsuario={handleTrocarUsuario}
              onCriarUsuario={handleCriarUsuario}
              onExcluirUsuario={handleExcluirUsuario}
            />
          )}

          {moduloAtivo === 'auditoria' && (
            <AuditoriaView logs={auditoria} />
          )}

          {moduloAtivo === 'configuracoes' && (
            <ConfiguracoesView
              config={configuracao}
              onSalvarConfig={handleSalvarConfig}
              onRedefinirDados={handleRedefinirDados}
              onZerarAtivos={handleZerarAtivos}
              onZerarMateriais={handleZerarTodosMateriais}
              onZerarTodoEstoque={handleZerarTodoEstoqueMateriais}
              onExportarBackup={api.exportarBackupCompleto}
              onRestaurarBackup={api.restaurarBackup}
            />
          )}
        </main>
      </div>

      {/* Modais Globais */}
      {modalEtiquetaEquipamento && (
        <ModalEtiquetaQRCode
          equipamento={modalEtiquetaEquipamento}
          aberto={!!modalEtiquetaEquipamento}
          onFechar={() => setModalEtiquetaEquipamento(null)}
          onAbrirFicha={handleAbrirFichaEquipamento}
        />
      )}

      {modalFichaEquipamento && (
        <ModalFichaEquipamento
          equipamento={modalFichaEquipamento}
          movimentacoes={movimentacoes}
          aberto={!!modalFichaEquipamento}
          onFechar={handleFecharFichaEquipamento}
          onAbrirEtiqueta={(eqp) => setModalEtiquetaEquipamento(eqp)}
          onAbrirMovimentacao={(eqp, op) => {
            setModalMovimentacaoEqp(eqp);
            setOperacaoPadraoMov(op);
          }}
          usuarioAtual={usuarioAtual}
          onExcluir={handleExcluirEquipamento}
        />
      )}

      {modalCadastroEqpAberto && (
        <ModalCadastroEquipamento
          equipamentoParaEditar={equipamentoParaEditar}
          aberto={modalCadastroEqpAberto}
          onFechar={() => {
            setModalCadastroEqpAberto(false);
            setEquipamentoParaEditar(null);
          }}
          onSalvar={handleSalvarEquipamento}
          subestacoes={subestacoes}
          paineis={paineis}
          modulos={modulos}
          almoxarifados={almoxarifados}
          onSalvarModulo={handleSalvarModulo}
        />
      )}

      {modalImportacaoMassivaAberto && (
        <ModalImportacaoMassiva
          aberto={modalImportacaoMassivaAberto}
          onFechar={() => setModalImportacaoMassivaAberto(false)}
          onSucesso={async () => {
            await carregarDados();
          }}
          subestacoes={subestacoes}
          almoxarifados={almoxarifados}
        />
      )}

      {modalMovimentacaoEqp && (
        <ModalMovimentacaoEquipamento
          equipamento={modalMovimentacaoEqp}
          aberto={!!modalMovimentacaoEqp}
          onFechar={() => setModalMovimentacaoEqp(null)}
          onConfirmar={handleConfirmarMovimentacaoEquipamento}
          subestacoes={subestacoes}
          paineis={paineis}
          modulos={modulos}
          almoxarifados={almoxarifados}
          ordensServico={ordens}
          operacaoPadrao={operacaoPadraoMov}
        />
      )}

      {modalMaterialAberto && (
        <ModalMaterial
          materialParaEditar={materialParaEditar}
          aberto={modalMaterialAberto}
          onFechar={() => {
            setModalMaterialAberto(false);
            setMaterialParaEditar(null);
          }}
          onSalvar={handleSalvarMaterial}
          almoxarifados={almoxarifados}
          fornecedores={fornecedores}
        />
      )}

      {modalMovMaterial && (
        <ModalMovimentacaoMaterial
          material={modalMovMaterial}
          aberto={!!modalMovMaterial}
          onFechar={() => setModalMovMaterial(null)}
          onConfirmar={handleConfirmarMovimentacaoMaterial}
          ordensServico={ordens}
        />
      )}

      {modalOrdemAberto && (
        <ModalOrdemServico
          osParaEditar={ordemParaEditar}
          aberto={modalOrdemAberto}
          onFechar={() => {
            setModalOrdemAberto(false);
            setOrdemParaEditar(null);
          }}
          onSalvar={handleSalvarOrdemServico}
          subestacoes={subestacoes}
          paineis={paineis}
          equipamentos={equipamentos}
          materiais={materiais}
        />
      )}
    </div>
  );
}
