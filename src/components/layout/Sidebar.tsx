import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Boxes,
  ArrowLeftRight,
  QrCode,
  ClipboardList,
  Building2,
  Grid3X3,
  Warehouse,
  FileSpreadsheet,
  Truck,
  BarChart3,
  Users2,
  History,
  Settings,
  X,
  Zap,
} from 'lucide-react';

export type ModuloId =
  | 'visao-geral'
  | 'equipamentos'
  | 'materiais'
  | 'movimentacoes'
  | 'leitor-qrcode'
  | 'ordens-servico'
  | 'subestacoes'
  | 'paineis-modulos'
  | 'almoxarifados'
  | 'inventario'
  | 'fornecedores'
  | 'relatorios'
  | 'usuarios'
  | 'auditoria'
  | 'configuracoes';

interface SidebarProps {
  moduloAtivo: ModuloId;
  onSelecionarModulo: (id: ModuloId) => void;
  aberto: boolean;
  onFechar: () => void;
  badgeMateriaisCriticos?: number;
  badgeOrdensAndamento?: number;
}

interface ItemMenu {
  id: ModuloId;
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  categoria?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  moduloAtivo,
  onSelecionarModulo,
  aberto,
  onFechar,
  badgeMateriaisCriticos = 0,
  badgeOrdensAndamento = 0,
}) => {
  const itensMenu: ItemMenu[] = [
    {
      id: 'visao-geral',
      titulo: 'Visão Geral',
      icone: LayoutDashboard,
      categoria: 'Principal',
    },
    {
      id: 'equipamentos',
      titulo: 'Equipamentos',
      icone: Cpu,
      categoria: 'Ativos Elétricos',
    },
    {
      id: 'materiais',
      titulo: 'Materiais e Estoque',
      icone: Boxes,
      badge: badgeMateriaisCriticos > 0 ? badgeMateriaisCriticos : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      categoria: 'Ativos Elétricos',
    },
    {
      id: 'movimentacoes',
      titulo: 'Movimentações',
      icone: ArrowLeftRight,
      categoria: 'Operação',
    },
    {
      id: 'leitor-qrcode',
      titulo: 'Leitor de QR Code',
      icone: QrCode,
      categoria: 'Operação',
    },
    {
      id: 'ordens-servico',
      titulo: 'Ordens de Serviço',
      icone: ClipboardList,
      badge: badgeOrdensAndamento > 0 ? badgeOrdensAndamento : undefined,
      badgeColor: 'bg-blue-500 text-white',
      categoria: 'Operação',
    },
    {
      id: 'subestacoes',
      titulo: 'Subestações',
      icone: Building2,
      categoria: 'Estrutura Física',
    },
    {
      id: 'paineis-modulos',
      titulo: 'Painéis e Módulos',
      icone: Grid3X3,
      categoria: 'Estrutura Física',
    },
    {
      id: 'almoxarifados',
      titulo: 'Almoxarifados',
      icone: Warehouse,
      categoria: 'Estrutura Física',
    },
    {
      id: 'inventario',
      titulo: 'Inventário Físico',
      icone: FileSpreadsheet,
      categoria: 'Gestão e Controle',
    },
    {
      id: 'fornecedores',
      titulo: 'Fornecedores',
      icone: Truck,
      categoria: 'Gestão e Controle',
    },
    {
      id: 'relatorios',
      titulo: 'Relatórios',
      icone: BarChart3,
      categoria: 'Gestão e Controle',
    },
    {
      id: 'usuarios',
      titulo: 'Usuários e Permissões',
      icone: Users2,
      categoria: 'Administração',
    },
    {
      id: 'auditoria',
      titulo: 'Auditoria',
      icone: History,
      categoria: 'Administração',
    },
    {
      id: 'configuracoes',
      titulo: 'Configurações',
      icone: Settings,
      categoria: 'Administração',
    },
  ];

  return (
    <>
      {/* Backdrop no mobile */}
      {aberto && (
        <div
          onClick={onFechar}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          aberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabeçalho do menu lateral */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wider text-base">TRACKSUB</span>
              <span className="block text-[10px] text-slate-400 font-mono">v2.4 • SIN BR</span>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de navegação com categorias */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {['Principal', 'Ativos Elétricos', 'Operação', 'Estrutura Física', 'Gestão e Controle', 'Administração'].map((cat) => {
            const itensCategoria = itensMenu.filter((i) => i.categoria === cat);
            if (itensCategoria.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {cat}
                </div>
                {itensCategoria.map((item) => {
                  const Icone = item.icone;
                  const ativo = moduloAtivo === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelecionarModulo(item.id);
                        if (window.innerWidth < 1024) onFechar();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition text-left group ${
                        ativo
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icone
                          className={`w-4 h-4 shrink-0 transition ${
                            ativo ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.titulo}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Rodapé institucional */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center">
          <div className="text-[11px] font-semibold text-slate-300">
            Concessionária Elétrica Nacional
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ambiente Seguro • Subestações
          </div>
        </div>
      </aside>
    </>
  );
};
