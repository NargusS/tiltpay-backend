### Document de conception – Historique de transactions Solana avec JobLock & Index local

## 1. Objectif

Mettre en place une **infrastructure robuste** pour :

- Indexer et stocker en base toutes les **transactions USDC** (ou autre token SPL) d’un user sur Solana.
- **Réduire fortement la dépendance** au RPC public (limites, 429, latence).
- **Découpler**:
  - la récupération des signatures (léger),
  - de la récupération des détails de transaction (plus lourd).
- Permettre à l’API / aux commandes de **lire l’historique directement depuis la DB**, sans repinger le RPC.

---

## 2. Architecture globale

### 2.1. Composants

- **Table `job_locks`**  
  Gère un **verrou global** pour empêcher deux jobs “lourds” de tourner en même temps.

- **Table `token_transactions`**  
  Table unique qui contient :
  - Les **signatures indexées** (état “indexed”),
  - Les **transactions enrichies** une fois parsées (état “fetched” ou “failed”).

- **Service `JobLockService`**  
  Simplifie `tryAcquire(name)` / `release(name)` pour les commandes cron.

- **Commandes AdonisJS** :
  - `index:solana-signatures`
    - Tourne souvent (cron).
    - Récupère les signatures pour chaque wallet/token suivi.
    - Remplit ou met à jour `token_transactions` avec `status = 'indexed'`.
  - `fetch:solana-transactions`
    - Tourne souvent aussi (cron).
    - Protégée par `JobLock`.
    - Récupère les détails des transactions via `getParsedTransactions`.
    - Met à jour `token_transactions` avec les données enrichies (`status = 'fetched'` ou `failed`).

- **Service `SolanaService` existant**  
  Réutilisé pour :
  - La connexion RPC.
  - Le parsing des transactions (`parseTokenTransaction`).

---

## 3. Modèle de données

### 3.1. Table `job_locks`

**But**: garantir qu’un seul job “lourd” (ex: `fetch:solana-transactions`) tourne à la fois.

- `id` (PK, increments)
- `name` (string, UNIQUE)
  - ex: `'fetch_solana_transactions'`
- `acquired_at` (timestamp with tz)
  - date/heure d’acquisition du lock

**Usage** :

- Tentative de création d’une ligne `(name)`:
  - Si OK → lock acquis.
  - Si échec (contrainte UNIQUE) → un autre job tourne déjà → on sort.

---

### 3.2. Table `token_transactions`

**But**: table unique pour **indexer les signatures** et **stocker les transactions parsées**.

Champs proposés :

- **Identification / contexte** :
  - `id` (PK)
  - `wallet_id` (FK vers `wallets.id`)
  - `wallet_address` (string, adresse Solana du wallet)
  - `mint` (string, adresse du token SPL, ex: USDC)
  - `signature` (string, UNIQUE, id de la tx Solana)

- **Indexation / ordre** :
  - `slot` (bigint, non null) – position dans la blockchain
  - `block_time` (timestamp with tz, nullable) – date de la tx

- **Statut de traitement** :
  - `status` (enum: `'indexed' | 'fetched' | 'failed'`, default `'indexed'`)
  - `error` (string, nullable) – message d’erreur éventuel

- **Données enrichies (remplies par `fetch:solana-transactions`)** :
  - `amount` (bigint, nullable) – en plus petite unité (comme dans `SolanaService`)
  - `decimals` (int, nullable)
  - `type` (enum: `'debit' | 'credit'`, nullable) – point de vue du wallet
  - `from_address` (string, nullable)
  - `to_address` (string, nullable)
  - `from_token_account` (string, nullable)
  - `to_token_account` (string, nullable)
  - `raw` (text/JSON, nullable) – payload brut RPC optionnel (debug, reparse)

- **Métadonnées** :
  - `created_at`, `updated_at` (timestamps with tz, non null)

**Index recommandés** :

- UNIQUE(`signature`)
- INDEX(`wallet_id`, `mint`, `block_time`)
- INDEX(`status`)

---

## 4. Service `JobLockService`

### 4.1. Signature

- `JobLockService.tryAcquire(name: string): Promise<boolean>`
  - Tente de créer un lock.
  - Retourne `true` si acquis, `false` sinon.

- `JobLockService.release(name: string): Promise<void>`
  - Supprime le lock correspondant à `name`.

### 4.2. Rôle

- Centraliser la logique de locking.
- Faciliter la réutilisation pour d’autres jobs plus tard.

---

## 5. Commande `index:solana-signatures`

### 5.1. Rôle

- Tourne souvent (ex: toutes les 1–5 minutes).
- Très léger : **1 appel `getSignaturesForAddress` par wallet à suivre**.
- Indexe / met à jour les signatures dans `token_transactions` avec `status = 'indexed'`.

### 5.2. Flux détaillé

1. **Lister les wallets à suivre** :
   - `Wallet.query().where('provider', 'solana').where('tag', 'primary')`.
   - Pour chaque wallet :
     - `wallet.id`, `wallet.address`
     - `wallet.usdcTokenAccountAddress` (ATA USDC à suivre)
     - `usdcMint = env.USDC_MINT_ADDRESS`

2. **Récupérer le dernier `slot` connu** pour ce wallet + mint :
   - `SELECT MAX(slot) FROM token_transactions WHERE wallet_id = ? AND mint = ?;`
   - Permet de ne récupérer que les signatures plus récentes (optionnel, selon stratégie).

3. **Appel RPC `getSignaturesForAddress`** :
   - `connection.getSignaturesForAddress(usdcTokenAccountAddress, { limit: N })`
   - N raisonnable (ex: 100).

4. **Pour chaque `ConfirmedSignatureInfo`** retourné :
   - Extraire :
     - `signature`
     - `slot`
     - `blockTime`
   - Insérer/mettre à jour dans `token_transactions` via `firstOrCreate` / `updateOrCreate`:
     - `wallet_id`, `wallet_address`, `mint`
     - `signature`
     - `slot`
     - `block_time` (converti en DateTime si présent)
     - `status = 'indexed'` (uniquement si nouvel enregistrement)

5. **Idempotence** :
   - Si la commande est relancée souvent, les signatures déjà présentes (UNIQUE) ne sont pas dupliquées.
   - Tu peux arrêter d’appeler le RPC “vers le passé” une fois que tu as historisé tout ce que tu veux.

---

## 6. Commande `fetch:solana-transactions` (avec JobLock)

### 6.1. Rôle

- Tourne toutes les minutes (cron).
- **Protégée par `JobLock`** pour n’avoir qu’une **seule exécution en parallèle**.
- Récupère (en batch) les détails des transactions pour les lignes `status = 'indexed'`.
- Remplit les champs enrichis et passe `status` à `'fetched'` ou `'failed'`.

### 6.2. Protection avec `JobLock`

1. Au début de `run()` :

```ts
const lockName = 'fetch_solana_transactions'
const acquired = await JobLockService.tryAcquire(lockName)
if (!acquired) {
  this.logger.info('Job déjà en cours, sortie.')
  return
}
```

2. En `finally` :

```ts
await JobLockService.release(lockName)
```

→ Même si le cron relance la commande pendant qu’une instance tourne, la deuxième sort immédiatement sans rien faire.

### 6.3. Traitement des transactions

1. **Charger un batch limité** :

```ts
const BATCH_SIZE = 50

const toProcess = await TokenTransaction.query()
  .where('status', 'indexed')
  .orderBy('slot', 'desc')
  .limit(BATCH_SIZE)
```

2. **Si pas de données** → log et sortir.

3. **Construire la liste des signatures** :

```ts
const signatures = toProcess.map((tx) => tx.signature)
```

4. **Appel RPC `getParsedTransactions`** :

- Utiliser `SolanaService` existant :

```ts
const solanaService = new SolanaService()
const parsed = await solanaService['connection'].getParsedTransactions(signatures, {
  maxSupportedTransactionVersion: 0,
})
```

5. **Boucle de parsing** :

Pour chaque index `i` :

- `indexRow = toProcess[i]`
- `tx = parsed[i]`

Cas A – `!tx || !tx.meta` :

- `indexRow.status = 'failed'`
- `indexRow.error = 'No meta for transaction'`
- `await indexRow.save()`

Cas B – `tx ok` :

- Construire un `ConfirmedSignatureInfo` “minimal” à partir de `indexRow` si besoin.
- Appeler `parseTokenTransaction` :

```ts
const parsedTx = solanaService['parseTokenTransaction'](
  tx,
  indexRow.walletAddress,
  indexRow.mint,
  /* tokenAccountAddress */ wallet.usdcTokenAccountAddress,
  /* signatureInfo */ {
    signature: indexRow.signature,
    slot: Number(indexRow.slot),
    blockTime: indexRow.blockTime ? Math.floor(indexRow.blockTime.toSeconds()) : null,
  } as any
)
```

- Si `parsedTx` non null :
  - Mapper dans `indexRow` :
    - `amount = parsedTx.amount`
    - `decimals = parsedTx.decimals`
    - `type = parsedTx.type`
    - `from_address = parsedTx.from`
    - `to_address = parsedTx.to`
    - `from_token_account = parsedTx.fromTokenAccount`
    - `to_token_account = parsedTx.toTokenAccount`
    - `block_time` (optionnellement mis à jour)
    - `raw = JSON.stringify(tx)` (optionnel)
    - `status = 'fetched'`
- Si `parsedTx` null :
  - `status = 'failed'`
  - `error = 'Could not parse transaction'`

- `await indexRow.save()` dans tous les cas.

6. Optionnel :

- Limiter `BATCH_SIZE` si tu touches à des limites RPC.
- Ajouter un petit `sleep` entre plusieurs batches dans la même exécution si tu veux enchaîner plus de 50.

---

## 7. Consommation côté API / commandes

### 7.1. Lecture de l’historique

Pour afficher l’historique d’un user pour un token :

- Requêter **uniquement la DB** :

```ts
const txs = await TokenTransaction.query()
  .where('wallet_id', wallet.id)
  .where('mint', usdcMint)
  .where('status', 'fetched')
  .orderBy('block_time', 'desc')
  .limit(100)
```

- Optionnel : réutiliser `calculateTransactionStats` en donnant ces `txs`.

### 7.2. Avantages

- Pas de dépendance forte au RPC pour la lecture.
- Historique complet et stable, même si Solana RPC est down / rate limité.
- Possibilité de recalculer des stats, d’ajouter des colonnes, etc., sans refaire d’appels RPC.

---

## 8. Étapes d’implémentation recommandées

1. Créer les migrations `job_locks` + `token_transactions`.
2. Créer les modèles `JobLock` + `TokenTransaction`.
3. Créer `JobLockService`.
4. Implémenter `index:solana-signatures` (sans parsing, juste signature + slot + block_time).
5. Implémenter `fetch:solana-transactions` avec `JobLock` + parsing via `SolanaService`.
6. Ajouter les crons pour lancer les deux commandes.
7. Adapter tes commandes / endpoints pour lire l’historique depuis `token_transactions`.

Si tu veux, on peut maintenant passer à la phase “code” et je te génère les migrations + les squelettes de commandes basés exactement sur ce document.
