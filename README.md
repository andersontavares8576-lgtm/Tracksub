# TRACKSUB — Sistema de Gestão e Rastreabilidade de Equipamentos e Materiais

Sistema profissional voltado a concessionárias de transmissão e distribuição de energia elétrica, subestações de alta tensão e centros de operação de rede. Oferece controle físico e patrimonial completo de ativos elétricos (relés de proteção, multimedidores, disjuntores, transformadores de instrumentos), materiais sobressalentes, ordens de serviço e trilha de auditoria indelével com suporte a etiquetas e leitura instantânea de QR Code.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite
- **Estilização:** Tailwind CSS v4
- **Backend / Nuvem:** Google Cloud Firebase (Cloud Firestore & Firebase Authentication)
- **Rastreabilidade:** Geração e leitura de QR Code (`qrcode`, `html5-qrcode`)
- **Visualização de Dados:** Lucide Icons, Recharts
- **Hospedagem de Produção:** Netlify / GitHub Actions

---

## 🚀 Publicação no Netlify via GitHub

### 1. Parâmetros de Build
| Configuração | Valor |
| :--- | :--- |
| **Comando de Build** | `npm run build` |
| **Diretório de Publicação (Publish directory)** | `dist` |
| **Node Version** | `20.x` ou `22.x` |

O arquivo `netlify.toml` e o `public/_redirects` já estão configurados no repositório para garantir roteamento SPA sem erro 404 e cabeçalhos de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`).

### 2. Variáveis de Ambiente no Netlify
No painel do Netlify (**Site configuration > Environment variables**), adicione:

```env
VITE_FIREBASE_API_KEY=AIzaSyBGK3AIn6vlJyudaNprmuovLL5izNRRAWA
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0511572558.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0511572558
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0511572558.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=522247606326
VITE_FIREBASE_APP_ID=1:522247606326:web:76293b161a3ad287f64897
VITE_FIREBASE_DATABASE_ID=ai-studio-tracksubgestoera-291c7cb2-03a0-46f1-ab57-ed0aa0d12b8b
```
*(Caso prefira, o arquivo `firebase-applet-config.json` na raiz do projeto já contém essas configurações públicas da aplicação Web).*

---

## 🔒 Segurança e Regras do Firestore (`firestore.rules`)

1. **Perfis de Acesso (RBAC):**
   - `administrador`: Controle total sobre todos os cadastros, exclusões e configurações.
   - `gestor`: Aprovação de inventários, ordens de serviço e movimentações.
   - `tecnico`: Registro de instalações, retiradas e preenchimento de OS.
   - `almoxarife`: Gestão de saldo, entradas e baixas de materiais e peças.
   - `consulta`: Apenas visualização e consulta por QR Code sem permissão de gravação.

2. **Imutabilidade Histórica:**
   - As coleções `movimentacoes`, `movimentacoesMateriais` e `auditoria` operam no formato **Append-Only** (`allow update: if false`). Nenhum registro de transação passada pode ser modificado.

---

## 📱 QR Code e Deep Linking
Ao escanear a etiqueta de qualquer equipamento (pela câmera do celular ou link de compartilhamento), a URL com parâmetro `?eqp={CODIGO_PATRIMONIAL}` direciona imediatamente o operador para a Ficha Técnica Completa do equipamento.

---

## 📦 Backup e Restauração
Disponível em **Configurações > Backup e Restauração de Dados**:
- Exportação completa de todas as coleções em formato JSON estruturado.
- Restauração validada com lotes atômicos (`writeBatch`).
