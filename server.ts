import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---

// Health & Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    sistema: 'TRACKSUB',
    versao: '2.4.0',
    horario: new Date().toISOString(),
  });
});

// Autenticação & Usuários
app.get('/api/auth/current', (_req: Request, res: Response) => {
  try {
    const user = dbService.getCurrentUser();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao obter usuário atual.' });
  }
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  try {
    const users = dbService.getUsuarios();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar usuários.' });
  }
});

app.post('/api/auth/switch', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = dbService.setCurrentUser(userId);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/custom-user', (req: Request, res: Response) => {
  try {
    const { perfil, nome, cargo } = req.body;
    const user = dbService.setCustomUser(perfil, nome, cargo);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  try {
    const subestacaoId = req.query.subestacaoId as string;
    const stats = dbService.getDashboardStats(subestacaoId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Subestações
app.get('/api/subestacoes', (_req: Request, res: Response) => {
  try {
    res.json(dbService.getSubestacoes());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subestacoes', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarSubestacao(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/subestacoes/:id', (req: Request, res: Response) => {
  try {
    dbService.excluirSubestacao(req.params.id);
    res.json({ success: true, message: 'Subestação excluída com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Painéis
app.get('/api/paineis', (req: Request, res: Response) => {
  try {
    const subestacaoId = req.query.subestacaoId as string;
    res.json(dbService.getPaineis(subestacaoId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/paineis', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarPainel(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/paineis/:id', (req: Request, res: Response) => {
  try {
    dbService.excluirPainel(req.params.id);
    res.json({ success: true, message: 'Painel excluído com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Módulos
app.get('/api/modulos', (req: Request, res: Response) => {
  try {
    const painelId = req.query.painelId as string;
    res.json(dbService.getModulos(painelId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/modulos', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarModulo(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/modulos/:id', (req: Request, res: Response) => {
  try {
    dbService.excluirModulo(req.params.id);
    res.json({ success: true, message: 'Módulo excluído com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Almoxarifados
app.get('/api/almoxarifados', (_req: Request, res: Response) => {
  try {
    res.json(dbService.getAlmoxarifados());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/almoxarifados', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarAlmoxarifado(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Fornecedores
app.get('/api/fornecedores', (_req: Request, res: Response) => {
  try {
    res.json(dbService.getFornecedores());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fornecedores', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarFornecedor(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Equipamentos
app.get('/api/equipamentos', (req: Request, res: Response) => {
  try {
    const filtros = {
      termo: req.query.termo as string,
      subestacaoId: req.query.subestacaoId as string,
      tipo: req.query.tipo as string,
      estadoOperacional: req.query.estadoOperacional as string,
      estadoConservacao: req.query.estadoConservacao as string,
    };
    res.json(dbService.getEquipamentos(filtros));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/equipamentos/:id', (req: Request, res: Response) => {
  try {
    const eqp = dbService.getEquipamentoById(req.params.id);
    if (!eqp) {
      return res.status(404).json({ error: 'Equipamento não localizado.' });
    }
    res.json(eqp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/equipamentos/buscar/qrcode', (req: Request, res: Response) => {
  try {
    const codigo = (req.query.codigo as string) || '';
    const eqp = dbService.getEquipamentoByQRCodeOrPatrimonio(codigo);
    if (!eqp) {
      return res.status(404).json({ error: 'Nenhum equipamento localizado com o código informado.' });
    }
    res.json(eqp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/equipamentos', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarEquipamento(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Cadastro e Importação em Lote (Suporte a 3.000+ Ativos de Alta Performance)
app.post('/api/equipamentos/batch', (req: Request, res: Response) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body.itens;
    const opcoes = req.body.opcoes || {};
    if (!payload || !Array.isArray(payload)) {
      return res.status(400).json({ error: 'Payload inválido. Esperado array de equipamentos.' });
    }
    const resultado = dbService.salvarEquipamentosLote(payload, opcoes);
    res.status(201).json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Gerador Rápido de Lote para Testes e Carga Massiva (ex: 3.000 itens)
app.post('/api/equipamentos/gerar-lote', (req: Request, res: Response) => {
  try {
    const resultado = dbService.gerarCargaMassivaEquipamentos(req.body || {});
    res.status(201).json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Exclusão em Lote
app.post('/api/equipamentos/batch-delete', (req: Request, res: Response) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Array de IDs obrigatório.' });
    }
    const resultado = dbService.excluirEquipamentosLote(ids);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Exportação CSV de Todos os Ativos
app.get('/api/equipamentos/exportar/csv', (_req: Request, res: Response) => {
  try {
    const equipamentos = dbService.getEquipamentos();
    const subs = dbService.getSubestacoes();
    const mapSub = new Map(subs.map((s) => [s.id, s.nome]));

    // CSV Header
    const colunas = [
      'CodigoPatrimonial',
      'Descricao',
      'Tipo',
      'Fabricante',
      'Modelo',
      'NumeroSerie',
      'Subestacao',
      'Localizacao',
      'EstadoOperacional',
      'EstadoConservacao',
      'Responsavel',
      'DataAquisicao',
      'GarantiaAte',
      'QRCode',
      'Observacoes',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const linhas = equipamentos.map((e) => [
      escapeCsv(e.codigoPatrimonial),
      escapeCsv(e.descricao),
      escapeCsv(e.tipo),
      escapeCsv(e.fabricante),
      escapeCsv(e.modelo),
      escapeCsv(e.numeroSerie),
      escapeCsv(e.subestacaoId ? mapSub.get(e.subestacaoId) || e.subestacaoId : 'Estoque / Almoxarifado'),
      escapeCsv(e.localizacaoDescricao),
      escapeCsv(e.estadoOperacional),
      escapeCsv(e.estadoConservacao),
      escapeCsv(e.responsavel),
      escapeCsv(e.dataAquisicao),
      escapeCsv(e.garantiaAte),
      escapeCsv(e.qrCode),
      escapeCsv(e.observacoes),
    ].join(';'));

    // UTF-8 BOM para garantir correta abertura no Microsoft Excel em Português
    const csvContent = '\uFEFF' + colunas.join(';') + '\n' + linhas.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ativos_tracksub_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/equipamentos/:id', (req: Request, res: Response) => {
  try {
    dbService.excluirEquipamento(req.params.id);
    res.json({ success: true, message: 'Equipamento excluído com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Movimentações de Equipamentos
app.get('/api/movimentacoes', (req: Request, res: Response) => {
  try {
    const equipamentoId = req.query.equipamentoId as string;
    res.json(dbService.getMovimentacoes(equipamentoId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movimentacoes', (req: Request, res: Response) => {
  try {
    const mov = dbService.registrarMovimentacaoEquipamento(req.body);
    res.status(201).json(mov);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Materiais e Controle de Estoque
app.get('/api/materiais', (req: Request, res: Response) => {
  try {
    const filtros = {
      termo: req.query.termo as string,
      categoria: req.query.categoria as string,
      almoxarifadoId: req.query.almoxarifadoId as string,
      tipoMaterial: req.query.tipoMaterial as string,
      abaixoMinimo: req.query.abaixoMinimo === 'true',
    };
    res.json(dbService.getMateriais(filtros));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/materiais/:id', (req: Request, res: Response) => {
  try {
    const mat = dbService.getMaterialById(req.params.id);
    if (!mat) {
      return res.status(404).json({ error: 'Material não localizado.' });
    }
    res.json(mat);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materiais', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarMaterial(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/materiais/movimentar', (req: Request, res: Response) => {
  try {
    const mov = dbService.registrarMovimentacaoEstoque(req.body);
    res.status(201).json(mov);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/materiais-movimentacoes', (req: Request, res: Response) => {
  try {
    const materialId = req.query.materialId as string;
    res.json(dbService.getMovimentacoesMateriais(materialId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ordens de Serviço
app.get('/api/ordens-servico', (req: Request, res: Response) => {
  try {
    const filtros = {
      termo: req.query.termo as string,
      status: req.query.status as string,
      prioridade: req.query.prioridade as string,
      subestacaoId: req.query.subestacaoId as string,
    };
    res.json(dbService.getOrdensServico(filtros));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ordens-servico/:id', (req: Request, res: Response) => {
  try {
    const os = dbService.getOrdemServicoById(req.params.id);
    if (!os) return res.status(404).json({ error: 'Ordem de serviço não localizada.' });
    res.json(os);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ordens-servico', (req: Request, res: Response) => {
  try {
    const saved = dbService.salvarOrdemServico(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/ordens-servico/:id/consumir-material', (req: Request, res: Response) => {
  try {
    const { materialId, quantidade } = req.body;
    const os = dbService.consumirMaterialOS(req.params.id, materialId, Number(quantidade));
    res.json(os);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Inventários Físicos
app.get('/api/inventarios', (_req: Request, res: Response) => {
  try {
    res.json(dbService.getInventarios());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventarios/:id', (req: Request, res: Response) => {
  try {
    const inv = dbService.getInventarioById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Inventário não localizado.' });
    res.json(inv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventarios', (req: Request, res: Response) => {
  try {
    const created = dbService.criarInventario(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/inventarios/:id/contagem', (req: Request, res: Response) => {
  try {
    const { itemId, quantidadeContada, observacao } = req.body;
    const updated = dbService.registrarContagemItemInventario(
      req.params.id,
      itemId,
      Number(quantidadeContada),
      observacao
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/inventarios/:id/aprovar', (req: Request, res: Response) => {
  try {
    const approved = dbService.aprovarAjusteInventario(req.params.id);
    res.json(approved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Auditoria
app.get('/api/auditoria', (_req: Request, res: Response) => {
  try {
    res.json(dbService.getAuditoria());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Configurações
app.get('/api/configuracoes', (_req: Request, res: Response) => {
  try {
    res.json(dbService.getConfiguracoes());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/configuracoes', (req: Request, res: Response) => {
  try {
    const updated = dbService.salvarConfiguracoes(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/configuracoes/redefinir-dados', (_req: Request, res: Response) => {
  try {
    dbService.redefinirDadosDemonstracao();
    res.json({ success: true, message: 'Dados de demonstração redefinidos com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/configuracoes/zerar-ativos', (_req: Request, res: Response) => {
  try {
    dbService.zerarAtivos();
    res.json({ success: true, message: 'Equipamentos, subestações e painéis zerados com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Relatórios
app.get('/api/relatorios/resumo', (_req: Request, res: Response) => {
  try {
    const eqps = dbService.getEquipamentos();
    const mats = dbService.getMateriais();
    const movs = dbService.getMovimentacoes();
    const ordens = dbService.getOrdensServico();
    const invs = dbService.getInventarios();
    const subs = dbService.getSubestacoes();

    res.json({
      totalEquipamentos: eqps.length,
      equipamentosPorStatus: {
        emOperacao: eqps.filter((e) => e.estadoOperacional === 'Em Operação').length,
        retirado: eqps.filter((e) => e.estadoOperacional === 'Retirado').length,
        emManutencao: eqps.filter((e) => e.estadoOperacional === 'Em Manutenção').length,
        emEnsaio: eqps.filter((e) => e.estadoOperacional === 'Em Ensaio').length,
        sobressalente: eqps.filter((e) => e.estadoOperacional === 'Sobressalente / Estoque').length,
        baixado: eqps.filter((e) => e.estadoOperacional === 'Baixado').length,
      },
      materiaisEmEstoque: mats.length,
      materiaisCriticos: mats.filter((m) => m.quantidadeFisica <= m.estoqueMinimo).length,
      valorTotalEstoque: mats.reduce((acc, m) => acc + m.quantidadeFisica * m.custoUnitario, 0),
      totalOrdens: ordens.length,
      totalInventarios: invs.length,
      totalSubestacoes: subs.length,
      totalMovimentacoes: movs.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- VITE MIDDLEWARE OU SERVIR BUILD ESTÁTICO ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[TRACKSUB] Servidor full-stack rodando em http://localhost:${PORT}`);
  });
}

startServer();
