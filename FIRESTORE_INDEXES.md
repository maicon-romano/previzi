# Configuração de Índices do Firestore

## Problema Identificado
A consulta `getTransactionsByMonth` estava retornando erro:
"The query requires an index. You can create it here: https://console.firebase.google.com/..."

## Solução Implementada

### 1. Consulta Problemática (CORRIGIDA)
```javascript
// ANTES (causava erro de índice)
const q = query(
  collection(db, "users", userId, "transactions"),
  where("monthRef", "==", monthRef),
  orderBy("date", "desc")  // <- Combinação que exige índice composto
);

// DEPOIS (sem erro de índice)
const q = query(
  collection(db, "users", userId, "transactions"),
  where("monthRef", "==", monthRef)
);
// Ordenação feita no cliente para evitar erro de índice
return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

### 2. Estrutura dos Documentos
```json
{
  "type": "receita",
  "amount": 1200,
  "category": "Salário",
  "status": "pending",
  "date": "2025-07-01T00:00:00Z",
  "recurring": true,
  "recurringType": "fixed",
  "monthRef": "2025-07",
  "userId": "user_id_here",
  "createdAt": "2025-01-15T18:30:00Z"
}
```

### 3. Índices Necessários (se quiser usar orderBy)

Se no futuro você quiser usar `orderBy` diretamente no Firestore, será necessário criar estes índices compostos no Console do Firebase:

**Índice 1: monthRef + date**
- Collection: `users/{userId}/transactions`
- Fields: 
  - `monthRef` (Ascending)
  - `date` (Descending)

**Índice 2: monthRef + status + date (para filtros avançados)**
- Collection: `users/{userId}/transactions`
- Fields:
  - `monthRef` (Ascending)
  - `status` (Ascending)
  - `date` (Descending)

### 4. Como Criar os Índices

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto `previzi-54773`
3. Vá em **Firestore Database**
4. Clique em **Indexes**
5. Clique em **Create Index**
6. Configure:
   - Collection ID: `transactions`
   - Adicione os campos conforme especificado acima

### 5. Alternativa Atual (Sem Índices)
O sistema atual usa filtro simples `where("monthRef", "==", monthRef)` e faz a ordenação no cliente, evitando a necessidade de índices compostos.

## Performance
- A ordenação no cliente é aceitável para volumes mensais típicos (< 1000 transações/mês)
- Para volumes maiores, recomenda-se criar os índices compostos
- A consulta por `monthRef` é otimizada e rápida