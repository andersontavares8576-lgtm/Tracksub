import React, { useState, useEffect } from 'react';
import { Settings, Building2, ShieldAlert, CheckCircle2, RotateCcw, Save, Trash2, Database, Download, Upload, Cloud } from 'lucide-react';
import { ConfiguracaoSistema } from '../types/tracksub.ts';

interface ConfiguracoesViewProps {
  config: ConfiguracaoSistema | null;
  onSalvarConfig: (c: Partial<ConfiguracaoSistema>) => Promise<void>;
  onRedefinirDados: () => Promise<void>;
  onZerarAtivos?: () => Promise<void>;
  onExportarBackup?: () => Promise<string>;
  onRestaurarBackup?: (json: string) => Promise<{ success: boolean; registrosRestaurados: number }>;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  config,
  onSalvarConfig,
  onRedefinirDados,
  onZerarAtivos,
  onExportarBackup,
  onRestaurarBackup,
}) => {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [regiaoConcessao, setRegiaoConcessao] = useState('');
  const [alertaEstoqueMinimo, setAlertaEstoqueMinimo] = useState(true);
  const [permitirSaldoNegativo, setPermitirSaldoNegativo] = useState(false);
  const [formatoEtiqueta, setFormatoEtiqueta] = useState<ConfiguracaoSistema['formatoEtiqueta']>('Padrão 60x40mm');
  const [rodapeRelatorio, setRodapeRelatorio] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (config) {
      setNomeEmpresa(config.nomeEmpresa);
      setCnpjEmpresa(config.cnpjEmpresa);
      setRegiaoConcessao(config.regiaoConcessao);
      setAlertaEstoqueMinimo(config.alertaEstoqueMinimo);
      setPermitirSaldoNegativo(config.permitirSaldoNegativo);
      setFormatoEtiqueta(config.formatoEtiqueta);
      setRodapeRelatorio(config.rodapeRelatorio);
    }
  }, [config]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setSucesso(false);
      await onSalvarConfig({
        nomeEmpresa,
        cnpjEmpresa,
        regiaoConcessao,
        alertaEstoqueMinimo,
        permitirSaldoNegativo,
        formatoEtiqueta,
        rodapeRelatorio,
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRedefinir = async () => {
    const confirmou = window.confirm(
      'ATENÇÃO: Deseja redefinir o banco de dados para os dados padrão de fábrica do TRACKSUB? Todos os registros de equipamentos, ordens e histórico serão reinicializados.'
    );
    if (!confirmou) return;

    try {
      await onRedefinirDados();
      alert('Dados de demonstração do TRACKSUB reinicializados com sucesso!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Erro ao redefinir dados.');
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Topo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configurações Gerais do TRACKSUB</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Parâmetros corporativos, regras de negócio para estoque e personalização de etiquetas
            </p>
          </div>
        </div>
      </div>

      {sucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas e aplicadas com sucesso!</span>
        </div>
      )}

      {/* Formulário de Configurações */}
      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Dados da Concessionária */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Dados da Concessionária / Empresa de Transmissão</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social / Concessionária</label>
              <input
                type="text"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ Corporativo</label>
              <input
                type="text"
                value={cnpjEmpresa}
                onChange={(e) => setCnpjEmpresa(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Região de Concessão / Sistema Interligado</label>
              <input
                type="text"
                value={regiaoConcessao}
                onChange={(e) => setRegiaoConcessao(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Regras Operacionais de Estoque */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Políticas de Segurança e Regras de Estoque</span>
          </h3>

          <div className="space-y-2">
            <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={alertaEstoqueMinimo}
                onChange={(e) => setAlertaEstoqueMinimo(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Ativar Alertas Visuais para Estoque Abaixo do Mínimo
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Exibe avisos em destaque e contadores no menu lateral quando materiais atingirem o nível crítico de reposição.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={permitirSaldoNegativo}
                onChange={(e) => setPermitirSaldoNegativo(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Permitir Saídas com Saldo Indisponível (Modo Contingencial)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Por padrão desativado para garantir integridade. Quando desativado, o sistema rejeita saídas de materiais com saldo insuficiente.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Parâmetros de Impressão */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Parâmetros de Impressão e Relatórios
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Formato Padrão da Etiqueta QR Code</label>
              <select
                value={formatoEtiqueta}
                onChange={(e) => setFormatoEtiqueta(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Padrão 60x40mm">Padrão Térmica 60 x 40 mm (Recomendado para Subestações)</option>
                <option value="Compacta 40x25mm">Compacta 40 x 25 mm</option>
                <option value="A4 Múltiplas">Folha A4 com Múltiplas Etiquetas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rodapé Padrão dos Relatórios Emitidos</label>
              <input
                type="text"
                value={rodapeRelatorio}
                onChange={(e) => setRodapeRelatorio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={salvando}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>{salvando ? 'Salvando...' : 'Salvar Parâmetros do Sistema'}</span>
          </button>
        </div>
      </form>

      {/* Seção de Backup e Recuperação em Nuvem */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Backup e Recuperação em Nuvem (Google Cloud Firestore)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Projeto conectado: <span className="font-mono font-semibold text-slate-700">gen-lang-client-0511572558</span> • Região: <span className="font-mono font-semibold text-slate-700">us-east1</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="font-bold flex items-center space-x-1.5 text-emerald-800">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span>Armazenamento Persistente com Regras de Segurança Ativas</span>
            </span>
            <p className="text-[11px] text-emerald-700">
              Todos os cadastros de ativos, histórico indelével de movimentações e permissões por perfil são gravados em tempo real na nuvem do Google Cloud.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onExportarBackup && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const json = await onExportarBackup();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup_tracksub_firestore_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e: any) {
                    alert(e.message || 'Erro ao gerar backup.');
                  }
                }}
                className="px-3.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Backup (JSON)</span>
              </button>
            )}

            {onRestaurarBackup && (
              <label className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const confirmou = window.confirm(
                      `Deseja restaurar o banco de dados a partir do arquivo "${file.name}"? Os registros serão sincronizados com o Cloud Firestore.`
                    );
                    if (!confirmou) {
                      e.target.value = '';
                      return;
                    }
                    try {
                      const text = await file.text();
                      const res = await onRestaurarBackup(text);
                      alert(`Restauração concluída com sucesso! ${res.registrosRestaurados} registros sincronizados.`);
                      window.location.reload();
                    } catch (err: any) {
                      alert(err.message || 'Erro ao restaurar backup.');
                    } finally {
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Caixa de Restauração de Dados */}
      <div className="bg-red-50/50 p-6 rounded-2xl border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">
            Zerar Equipamentos e Subestações (Criar do Zero)
          </h4>
          <p className="text-xs text-red-700 mt-1 max-w-xl">
            Limpa todos os equipamentos, subestações, painéis e históricos associados para que você possa cadastrar tudo do novo a partir de uma base totalmente vazia.
          </p>
        </div>

        <button
          onClick={async () => {
            const ok = window.confirm(
              'Confirma a limpeza de todos os equipamentos, subestações e painéis? Eles serão zerados para que você possa criar tudo do novo.'
            );
            if (!ok) return;
            if (onZerarAtivos) {
              await onZerarAtivos();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs shrink-0 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>Zerar Equipamentos e Subestações</span>
        </button>
      </div>

      {/* Caixa de Restauração de Dados de Demonstração */}
      <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Restaurar Demonstração com 5 Subestações Gaúchas
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Restaura os dados de fábrica de demonstração caso você deseje carregar exemplos predefinidos de subestações e relés SEL/Siemens.
          </p>
        </div>

        <button
          onClick={handleRedefinir}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs shrink-0 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restaurar Demonstração</span>
        </button>
      </div>
    </div>
  );
};
