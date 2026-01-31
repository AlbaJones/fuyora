# Fuyora Frontend

Frontend do marketplace Fuyora - Plataforma C2C de produtos digitais.

## Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Estrutura do Projeto

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # Componentes reutilizáveis
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── api.ts             # API client e endpoints
│   └── utils.ts           # Utilitários
└── public/                # Assets estáticos
```

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas configurações

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:9000
```

## Features Implementadas

### ✅ Landing Page
- Hero section com CTA
- Features do produto
- Estatísticas
- Footer completo

### 🔄 Em Desenvolvimento
- [ ] Sistema de autenticação
- [ ] Marketplace (listagem de produtos)
- [ ] Detalhes do produto
- [ ] Sistema de compra
- [ ] Dashboard do usuário
- [ ] Área do vendedor
- [ ] Painel administrativo

## Desenvolvimento

O frontend roda na porta 3001 por padrão.

```bash
npm run dev
```

Acesse: http://localhost:3001

## API Integration

O frontend se conecta com o backend Fuyora (porta 9000).

Principais endpoints:
- `/auth/*` - Autenticação
- `/products/*` - Produtos
- `/orders/*` - Pedidos
- `/kyc/*` - KYC
- `/admin/*` - Administração

Ver `lib/api.ts` para lista completa.

## Componentes UI

Componentes reutilizáveis baseados em shadcn/ui:
- Button
- Input
- Card
- Badge
- Avatar
- Modal
- Toast

## Próximos Passos

1. Implementar autenticação (login/register)
2. Criar marketplace de produtos
3. Implementar fluxo de compra
4. Dashboard do usuário
5. Área do vendedor
6. Painel administrativo

## License

Proprietary - Fuyora © 2026
