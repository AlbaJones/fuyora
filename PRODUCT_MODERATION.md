# Sistema de Moderação de Produtos

## Visão Geral

O sistema de moderação permite que administradores revisem anúncios de produtos antes que sejam publicados, com a capacidade de aprovar ou rejeitar produtos fornecendo motivos específicos aos vendedores.

## Fluxo de Moderação

### 1. Criação de Produto

Quando um vendedor cria um produto:
```
Status: DRAFT
Review Status: PENDING
```

O produto não aparece na listagem pública até ser aprovado.

### 2. Revisão por Moderador

O moderador pode:

#### Aprovar o Produto
```http
POST /admin/products/:id/approve
```

**Resultado**:
- `review_status` → APPROVED
- `status` → ACTIVE
- `reviewed_by` → ID do admin
- `reviewed_at` → timestamp atual
- Produto aparece na listagem pública

#### Rejeitar o Produto
```http
POST /admin/products/:id/reject
Content-Type: application/json

{
  "reason": "Você precisa comprovar autoria desse curso com documentos oficiais"
}
```

**Validações**:
- Motivo é **obrigatório**
- Mínimo de 10 caracteres
- Sem limite máximo (texto completo)

**Resultado**:
- `review_status` → REJECTED
- `status` → DRAFT
- `rejection_reason` → motivo fornecido
- `reviewed_by` → ID do admin
- `reviewed_at` → timestamp atual
- Produto NÃO aparece na listagem pública

### 3. Vendedor Visualiza o Motivo

O vendedor pode ver seus produtos rejeitados:

```http
GET /seller/products
```

**Resposta**:
```json
{
  "products": [
    {
      "id": "uuid",
      "title": "Curso de Marketing Digital",
      "description": "...",
      "price": 99.90,
      "status": "DRAFT",
      "review_status": "REJECTED",
      "rejection_reason": "Você precisa comprovar autoria desse curso com documentos oficiais",
      "reviewed_by": "admin-uuid",
      "reviewed_at": "2026-01-30T15:30:00Z",
      "created_at": "2026-01-30T10:00:00Z",
      "updated_at": "2026-01-30T15:30:00Z"
    }
  ],
  "total": 1
}
```

### 4. Edição e Re-submissão

Quando o vendedor edita um produto (aprovado ou rejeitado):

```http
PUT /products/:id
Content-Type: application/json

{
  "title": "Novo título",
  "description": "Nova descrição"
}
```

**Resultado**:
- `review_status` → volta para PENDING
- `rejection_reason` → limpo (null)
- `reviewed_by` → limpo (null)
- `reviewed_at` → limpo (null)
- Produto precisa ser revisado novamente

## Endpoints da API

### Endpoints Admin

#### Listar Produtos Pendentes
```http
GET /admin/products/pending?page=1&limit=20
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
{
  "products": [
    {
      "id": "uuid",
      "seller_id": "seller-uuid",
      "title": "Produto para revisar",
      "description": "...",
      "price": 49.90,
      "category": "cursos",
      "status": "DRAFT",
      "review_status": "PENDING",
      "created_at": "2026-01-30T14:00:00Z"
    }
  ],
  "total": 5
}
```

#### Aprovar Produto
```http
POST /admin/products/:id/approve
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
{
  "message": "Product approved successfully",
  "product": {
    "id": "uuid",
    "status": "ACTIVE",
    "review_status": "APPROVED",
    "reviewed_by": "admin-uuid",
    "reviewed_at": "2026-01-30T15:30:00Z"
  }
}
```

#### Rejeitar Produto
```http
POST /admin/products/:id/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Não damos suporte para esse tipo de produto"
}
```

**Resposta**:
```json
{
  "message": "Product rejected successfully",
  "product": {
    "id": "uuid",
    "status": "DRAFT",
    "review_status": "REJECTED",
    "rejection_reason": "Não damos suporte para esse tipo de produto",
    "reviewed_by": "admin-uuid",
    "reviewed_at": "2026-01-30T15:30:00Z"
  }
}
```

**Erros**:
```json
// Motivo não fornecido
{
  "message": "Rejection reason is required"
}

// Motivo muito curto
{
  "message": "Rejection reason must be at least 10 characters"
}

// Produto não encontrado
{
  "message": "Product not found"
}
```

### Endpoints do Vendedor

#### Ver Meus Produtos
```http
GET /seller/products?page=1&limit=20
Authorization: Bearer {seller_token}
```

Retorna todos os produtos do vendedor, incluindo:
- Produtos em revisão (PENDING)
- Produtos aprovados (APPROVED)
- Produtos rejeitados (REJECTED) com o motivo

## Exemplos de Motivos de Rejeição

### Produtos não suportados
```
"Não damos suporte para esse tipo de produto. Confira nossa política de produtos permitidos."
```

### Problemas de autoria
```
"Você precisa comprovar autoria desse curso. Envie certificados ou documentos que comprovem que você é o criador do conteúdo."
```

### Conteúdo inadequado
```
"O conteúdo do produto viola nossas políticas de comunidade. Por favor, revise os termos de uso."
```

### Informações incompletas
```
"O produto precisa ter uma descrição mais detalhada e imagens de melhor qualidade."
```

### Preço inadequado
```
"O preço está fora dos padrões do mercado. Por favor, ajuste para um valor mais apropriado."
```

### Categoria incorreta
```
"Este produto foi classificado na categoria errada. Por favor, escolha a categoria correta e reenvie."
```

## Schema do Banco de Dados

### Campos Adicionados à Tabela `product`

```sql
-- Enum para status de revisão
CREATE TYPE product_review_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Campos na tabela product
review_status product_review_status_enum DEFAULT 'PENDING',
rejection_reason text NULL,
reviewed_by varchar NULL,
reviewed_at timestamp with time zone NULL

-- Índice para queries rápidas
CREATE INDEX idx_product_review_status ON product(review_status);
```

## Fluxograma

```
┌─────────────────┐
│ Seller cria     │
│ produto         │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Status: DRAFT   │
│ Review: PENDING │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│ Admin revisa produto        │
└─────┬───────────────┬───────┘
      │               │
      v               v
┌──────────┐    ┌──────────┐
│ Aprovar  │    │ Rejeitar │
└────┬─────┘    └────┬─────┘
     │               │
     v               v
┌──────────┐    ┌──────────────────┐
│ ACTIVE   │    │ DRAFT            │
│ APPROVED │    │ REJECTED         │
└────┬─────┘    │ + motivo visível │
     │          └────┬─────────────┘
     │               │
     v               v
┌──────────┐    ┌──────────────────┐
│ Visível  │    │ Seller vê motivo │
│ público  │    │ e pode editar    │
└──────────┘    └────┬─────────────┘
                     │
                     v
                ┌──────────┐
                │ Edita    │
                │ produto  │
                └────┬─────┘
                     │
                     v
                ┌─────────────────┐
                │ Review: PENDING │
                │ (nova revisão)  │
                └─────────────────┘
```

## Boas Práticas para Moderadores

### 1. Seja Específico
❌ "Produto rejeitado"
✅ "Você precisa adicionar imagens do produto real, não apenas descrições de texto"

### 2. Seja Construtivo
❌ "Produto ruim"
✅ "A descrição precisa incluir mais detalhes sobre o conteúdo do curso, como duração, tópicos abordados e pré-requisitos"

### 3. Cite Políticas
❌ "Não pode"
✅ "De acordo com nossa política de produtos digitais, cursos gravados precisam ter no mínimo 2 horas de conteúdo"

### 4. Oriente para Correção
❌ "Imagens ruins"
✅ "As imagens precisam ter no mínimo 800x600px de resolução. Por favor, substitua as imagens atuais por versões de melhor qualidade"

### 5. Seja Profissional
❌ "Que absurdo isso"
✅ "Este tipo de produto não é permitido em nossa plataforma conforme os Termos de Uso, seção 3.2"

## Configuração

Não há configurações adicionais necessárias. O sistema funciona automaticamente após rodar a migration:

```bash
npm run migration:run
```

## Notificações (Futuro)

Em versões futuras, pode-se adicionar:
- Email ao vendedor quando produto for aprovado
- Email ao vendedor quando produto for rejeitado (com o motivo)
- Notificação in-app
- SMS (opcional)

Exemplo de implementação (comentado no código):
```typescript
// TODO: Send notification to seller about rejection
// const emailService = req.scope.resolve("emailService");
// await emailService.sendProductRejectionEmail(product.seller_id, product, reason);
```

## Conclusão

Este sistema garante:
- ✅ Transparência total com os vendedores
- ✅ Moderação eficaz e rastreável
- ✅ Comunicação clara de problemas
- ✅ Processo iterativo de melhoria
- ✅ Histórico completo de revisões
