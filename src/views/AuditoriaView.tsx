import React, { useState } from 'react';
import { History, Search, ShieldCheck, Filter, Clock, User, Terminal } from 'lucide-react';
import { AuditoriaLog } from '../types/tracksub.ts';
import { formatarDataHora } from '../utils/formatters.ts';

interface AuditoriaViewProps {
  logs: AuditoriaLog[];
}

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ logs }) => {
  const [busca, setBusca] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('todos');

  const logsFiltrados = logs.filter((l) => {
    if (busca.trim()) {
      const t = busca.toLowerCase();
      const bateu =
        l.acao.toLowerCase().includes(t) ||
        l.modulo.toLowerCase().includes(t) ||
        l.usuarioNome.toLowerCase().includes(t) ||
        l.detalhes.toLowerCase().includes(t) ||
        l.ip.toLowerCase().includes(t);
      if (!bateu) return false;
    }
    if (filtroModulo !== 'todos' && l.modulo !== filtroModulo) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trilha de Auditoria e Conformidade</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              {logsFiltrados.length} Eventos Auditados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro imutável de todas as transações, movimentações, edições de estoque e trocas de perfil
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por ação, módulo, operador, detalhes ou IP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Módulos</option>
            <option value="Equipamentos">Equipamentos</option>
            <option value="Movimentações">Movimentações</option>
            <option value="Materiais e Estoque">Materiais e Estoque</option>
            <option value="Ordens de Serviço">Ordens de Serviço</option>
            <option value="Inventário Físico">Inventário Físico</option>
            <option value="Autenticação">Autenticação</option>
            <option value="Configurações">Configurações</option>
          </select>
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 whitespace-nowrap">Data e Hora</th>
                <th className="py-3.5 px-4">Operador & Perfil</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Ação Executada</th>
                <th className="py-3.5 px-4">Detalhes e Parâmetros</th>
                <th className="py-3.5 px-4 text-right">Origem IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {formatarDataHora(log.dataHora)}
                    </td>

                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{log.usuarioNome}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{log.perfil}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">
                        {log.modulo}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      {log.acao}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600 max-w-md">
                      {log.detalhes}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
