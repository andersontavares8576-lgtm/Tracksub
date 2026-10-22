import React, { useState } from 'react';
import {
  Menu,
  ShieldCheck,
  User,
  Zap,
  CheckCircle2,
  ChevronDown,
  Building2,
  AlertTriangle,
  QrCode,
  Cloud,
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '../../types/tracksub.ts';

interface HeaderProps {
  usuarioAtual: Usuario | null;
  usuariosDisponiveis: Usuario[];
  onTrocarUsuario: (userId: string) => void;
  onAlternarMenu: () => void;
  moduloAtivoNome: string;
  onAbrirLeitorQR?: () => void;
  firestoreConectado?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  usuarioAtual,
  usuariosDisponiveis,
  onTrocarUsuario,
  onAlternarMenu,
  moduloAtivoNome,
  onAbrirLeitorQR,
  firestoreConectado = true,
}) => {
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const getBadgePerfil = (perfil?: PerfilUsuario) => {
    switch (perfil) {
      case 'administrador':
        return 'bg-purple-900/40 text-purple-200 border-purple-500/40';
      case 'tecnico':
        return 'bg-blue-900/40 text-blue-200 border-blue-500/40';
      case 'almoxarife':
        return 'bg-emerald-900/40 text-emerald-200 border-emerald-500/40';
      case 'gestor':
        return 'bg-amber-900/40 text-amber-200 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getNomePerfil = (perfil?: PerfilUsuario) => {
    switch (perfil) {
      case 'administrador':
        return 'Administrador';
      case 'tecnico':
        return 'Técnico de Campo';
      case 'almoxarife':
        return 'Almoxarife';
      case 'gestor':
        return 'Gestor de Ativos';
      case 'consulta':
        return 'Consulta';
      default:
        return perfil;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Botão de Menu para Celular e Título */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onAlternarMenu}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Alternar navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">TRACKSUB</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                Subestações
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Gestão de Equipamentos, Materiais e Rastreabilidade QR Code
            </p>
          </div>
        </div>
      </div>

      {/* Identificação de Módulo Atual na Barra Central */}
      <div className="hidden lg:flex items-center space-x-2 text-sm text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-xs text-slate-400">Módulo:</span>
        <span className="font-semibold text-slate-100">{moduloAtivoNome}</span>
      </div>

      {/* Ações Rápidas, Status da Nuvem e Usuário */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Status Cloud Firestore */}
        <div
          title={firestoreConectado ? 'Cloud Firestore Conectado (Regras ABAC Ativas)' : 'Firestore Offline'}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300"
        >
          <Cloud className={`w-3.5 h-3.5 ${firestoreConectado ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="font-medium">{firestoreConectado ? 'Firestore Conectado' : 'Reconectando...'}</span>
        </div>

        {/* Botão Atalho Escanear QR Code */}
        {onAbrirLeitorQR && (
          <button
            type="button"
            onClick={onAbrirLeitorQR}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
            title="Abrir Câmera para Leitura de QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Escanear QR</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className="flex items-center space-x-2.5 p-1.5 pl-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-200 font-semibold text-sm">
              {usuarioAtual ? usuarioAtual.nome.substring(0, 2).toUpperCase() : 'TS'}
            </div>
            <div className="hidden sm:block text-left mr-1">
              <div className="text-xs font-medium text-slate-200 leading-tight">
                {usuarioAtual?.nome || 'Carregando...'}
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getBadgePerfil(
                    usuarioAtual?.perfil
                  )}`}
                >
                  {getNomePerfil(usuarioAtual?.perfil)}
                </span>
                <span className="text-[10px] text-slate-400">{usuarioAtual?.matricula}</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {dropdownAberto && (
            <div
              className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setDropdownAberto(false)}
            >
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Trocar Perfil Operacional
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simule diferentes perfis para testar regras e autorizações
                </p>
              </div>

              <div className="py-1 space-y-1">
                {usuariosDisponiveis.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onTrocarUsuario(user.id)}
                    className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition ${
                      usuarioAtual?.id === user.id
                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-100'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 mt-0.5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                      {user.nome.substring(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate text-slate-100">
                          {user.nome}
                        </span>
                        {usuarioAtual?.id === user.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{user.cargo}</div>
                      <span
                        className={`inline-block mt-1 text-[9px] px-1 py-0.2 rounded border uppercase font-mono ${getBadgePerfil(
                          user.perfil
                        )}`}
                      >
                        {getNomePerfil(user.perfil)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
