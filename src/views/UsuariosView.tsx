import React, { useState } from 'react';
import {
  Users2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Key,
  UserCheck,
  Trash2,
  X,
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '../types/tracksub.ts';

interface UsuariosViewProps {
  usuarios: Usuario[];
  usuarioAtual: Usuario | null;
  onTrocarUsuario: (userId: string) => void;
  onCriarUsuario: (perfil: PerfilUsuario, nome: string, cargo: string) => Promise<void>;
  onExcluirUsuario: (userId: string) => Promise<void>;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  usuarioAtual,
  onTrocarUsuario,
  onCriarUsuario,
  onExcluirUsuario,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Técnico de Subestação');
  const [perfil, setPerfil] = useState<PerfilUsuario>('tecnico');
  const [salvando, setSalvando] = useState(false);

  const getPerfilBadge = (p: PerfilUsuario) => {
    switch (p) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tecnico':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'almoxarife':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'gestor':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const permissoesPorPerfil = [
    {
      perfil: 'Administrador',
      desc: 'Acesso pleno. Gerencia usuários, permissões, configurações globais, inventários e autorizações.',
      acesso: 'Total',
    },
    {
      perfil: 'Técnico de Campo',
      desc: 'Consulta equipamentos e materiais, realiza instalações, retiradas, substituições e consome materiais em OS.',
      acesso: 'Operacional',
    },
    {
      perfil: 'Almoxarife',
      desc: 'Gerencia entradas por compra, saídas, transferências, reservas e contagens físicas de inventário.',
      acesso: 'Estoque e Materiais',
    },
    {
      perfil: 'Gestor de Ativos',
      desc: 'Visualiza indicadores, homologa divergências de inventário, relatórios consolidados e custos de manutenção.',
      acesso: 'Gerencial e Homologação',
    },
    {
      perfil: 'Consulta',
      desc: 'Apenas visualização de equipamentos, localizações e histórico de operações. Sem permissão de escrita.',
      acesso: 'Somente Leitura',
    },
  ];

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      setSalvando(true);
      await onCriarUsuario(perfil, nome.trim(), cargo.trim());
      setModalAberto(false);
      setNome('');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Usuários e Perfis de Acesso</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              Controle de Acesso RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de técnicos, almoxarifes, engenheiros e administradores com níveis de permissão estritos
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Grade de Usuários Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map((u) => {
          const ativo = u.id === usuarioAtual?.id;

          return (
            <div
              key={u.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                ativo
                  ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-400/20'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {u.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{u.nome}</h3>
                      <p className="text-xs text-slate-500 font-mono">{u.matricula}</p>
                    </div>
                  </div>
                  {ativo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ativo</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  <div className="font-medium text-slate-800">{u.cargo}</div>
                  <div className="text-slate-400 truncate">{u.email}</div>
                </div>

                <div className="pt-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPerfilBadge(u.perfil)}`}>
                    {u.perfil}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 truncate">
                  {ativo ? 'Sessão Atual' : 'Alternar para este usuário'}
                </span>
                <div className="flex items-center space-x-1.5 shrink-0">
                  {!ativo ? (
                    <>
                      <button
                        onClick={() => onTrocarUsuario(u.id)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Trocar Perfil
                      </button>
                      <button
                        onClick={async () => {
                          const ok = window.confirm(
                            `Tem certeza que deseja excluir o usuário "${u.nome}" (${u.email})?\n\nEsta operação removerá o perfil do Cloud Firestore.`
                          );
                          if (!ok) return;
                          try {
                            await onExcluirUsuario(u.id);
                          } catch (err: any) {
                            alert(err.message || 'Erro ao excluir usuário.');
                          }
                        }}
                        title="Excluir Usuário"
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Perfil Conectado
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela Explicativa de Permissões por Perfil */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-xs flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Matriz de Responsabilidades e Permissões</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {permissoesPorPerfil.map((item, idx) => (
            <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="sm:w-44 font-bold text-slate-900">
                {item.perfil}
              </div>
              <div className="flex-1 text-slate-600">
                {item.desc}
              </div>
              <div className="sm:w-32 text-right">
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                  {item.acesso}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Cadastrar Novo Usuário</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Rafael Monteiro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cargo Técnico</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Engenheiro de Automação"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Perfil de Acesso *</label>
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="tecnico">Técnico de Campo</option>
                  <option value="almoxarife">Almoxarife</option>
                  <option value="gestor">Gestor de Ativos</option>
                  <option value="administrador">Administrador</option>
                  <option value="consulta">Consulta (Somente Leitura)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  {salvando ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
