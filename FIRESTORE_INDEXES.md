# Índices Necessários do Firestore para o Sistema Previzi

## Índices Atuais Implementados

### 1. Índice para Exclusão de Transações Recorrentes (Otimizado)
**Coleção**: `users/{userId}/transactions`
**Campos**:
- `recurrenceGroupId` (Ascending)
- `date` (Ascending)

**Uso**: Para exclusão eficiente de transações recorrentes usando o novo campo `recurrenceGroupId`. Este índice permite filtrar por grupo de recorrência e data com apenas 2 campos, evitando a necessidade de índices compostos complexos.

### 2. Índice para Busca de Transações por Descrição e Recorrência
**Coleção**: `users/{userId}/transactions`
**Campos**:
- `description` (Ascending)
- `recurring` (Ascending)

**Uso**: Para verificar transações recorrentes existentes e evitar duplicatas durante a criação.

## Como Criar os Índices

### Opção 1: Via Console do Firebase
1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Vá para Firestore Database > Índices
3. Clique em "Criar índice"
4. Configure os campos conforme especificado acima

### Opção 2: Via CLI do Firebase (Recomendado)
```bash
# Instalar Firebase CLI se necessário
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (se necessário)
firebase init firestore

# Fazer deploy dos índices
firebase deploy --only firestore:indexes
```

### Opção 3: Automático via Erro do Firestore
Quando o sistema tentar fazer uma query que requer um índice, o Firestore fornecerá automaticamente um link para criar o índice necessário. Este link pode ser copiado e colado diretamente no navegador.

## Benefícios da Nova Implementação

### Performance Melhorada
- Uso do `recurrenceGroupId` reduz drasticamente o número de campos necessários para filtros
- Queries mais rápidas para exclusão de transações recorrentes
- Menor consumo de recursos do Firestore

### Manutenibilidade
- Menos índices compostos complexos para gerenciar
- Sistema mais robusto e menos propenso a erros de índice
- Compatibilidade com transações antigas (fallback implementado)

## Estrutura Recomendada para Novas Transações

```typescript
{
  id: "auto-generated",
  type: "income" | "expense",
  amount: number,
  category: string,
  description: string,
  source: string,
  date: Timestamp,
  status: "paid" | "pending",
  recurring: boolean,
  recurrenceGroupId: "description-YYYY-MM-timestamp", // NOVO CAMPO
  userId: string,
  createdAt: Timestamp
}
```

## Observações Importantes

1. **Transições Graduais**: O sistema suporta tanto transações antigas (sem `recurrenceGroupId`) quanto novas
2. **Fallback Automático**: Se `recurrenceGroupId` não estiver presente, o sistema usa o método anterior
3. **Otimização Contínua**: Novas transações sempre incluirão o `recurrenceGroupId` para melhor performance
4. **Índices Futuros**: Com esta estrutura, futuros índices serão mais simples de implementar

## Troubleshooting

### Erro: "The query requires an index"
- Copie o link fornecido pelo erro e cole no navegador para criar o índice automaticamente
- Ou crie manualmente usando as especificações acima

### Performance Lenta
- Verifique se todos os índices estão criados e ativos
- Monitore o uso de leitura/escrita no console do Firebase
- Considere otimizar queries para usar menos campos de filtro