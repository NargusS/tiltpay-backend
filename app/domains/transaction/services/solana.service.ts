import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
  ConfirmedSignatureInfo,
} from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import env from '#start/env'

export interface TokenTransaction {
  signature: string
  blockTime: number | null
  amount: number
  type: 'debit' | 'credit'
  from: string // Adresse Solana originale de l'expéditeur (owner du token account)
  to: string // Adresse Solana originale du destinataire (owner du token account)
  fromTokenAccount?: string // Adresse du token account de l'expéditeur
  toTokenAccount?: string // Adresse du token account du destinataire
  trackedTokenAccount?: string // Adresse du token account qu'on track
  mint: string
  decimals: number
}

export interface TransactionStats {
  totalReceived: number
  totalSent: number
  uniqueSenders: string[]
  uniqueReceivers: string[]
  transactionCount: number
}

export class SolanaService {
  private connection: Connection

  constructor() {
    const rpcUrl = env.get('SOLANA_RPC_URL')
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  /**
   * Trouve l'adresse du token account associé à un wallet et un mint
   * Gère les adresses Grid qui ne sont pas des adresses Solana standard sur la courbe ed25519
   */
  async getTokenAccountAddress(
    walletAddress: string,
    tokenMint: string
  ): Promise<PublicKey | null> {
    try {
      const walletPublicKey = new PublicKey(walletAddress)
      const mintPublicKey = new PublicKey(tokenMint)

      // Essayer d'abord avec getAssociatedTokenAddress (pour les adresses Solana standard)
      const tokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey)
      return tokenAccountAddress
    } catch (error: any) {
      // Si getAssociatedTokenAddress échoue (ex: TokenOwnerOffCurveError pour les adresses Grid),
      // utiliser getParsedTokenAccountsByOwner pour trouver les token accounts
      if (error?.name === 'TokenOwnerOffCurveError' || error?.message?.includes('OffCurve')) {
        try {
          const walletPublicKey = new PublicKey(walletAddress)
          const mintPublicKey = new PublicKey(tokenMint)

          const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
            walletPublicKey,
            {
              mint: mintPublicKey,
            }
          )

          if (tokenAccounts.value.length > 0) {
            const tokenAccountPubkey = tokenAccounts.value[0].pubkey
            return tokenAccountPubkey
          }

          return null
        } catch (innerError) {
          // Si l'adresse n'est toujours pas valide, retourner null
          return null
        }
      }

      // Pour les autres erreurs, retourner null
      return null
    }
  }

  /**
   * Récupère les signatures pour une adresse (wallet ou token account)
   * Cette méthode est pensée pour l’indexation en base (job léger).
   */
  async getSignaturesForAddress(
    address: string,
    options?: {
      limit?: number
      before?: string
      until?: string
    }
  ): Promise<ConfirmedSignatureInfo[]> {
    const pubkey = new PublicKey(address)

    return this.connection.getSignaturesForAddress(pubkey, {
      limit: options?.limit,
      before: options?.before,
      until: options?.until,
    })
  }

  /**
   * Récupère et parse les transactions pour une liste de signatures
   * à partir du point de vue d’un wallet + token account donné.
   * Cette méthode est pensée pour les jobs d’enrichissement (fetch en batch).
   */
  async getParsedTokenTransactionsForSignatures(
    walletAddress: string,
    tokenMint: string,
    tokenAccountAddress: string,
    signatures: ConfirmedSignatureInfo[]
  ): Promise<TokenTransaction[]> {
    if (signatures.length === 0) {
      return []
    }

    const signatureStrings = signatures.map((s) => s.signature)

    const parsedTransactions = await this.connection.getParsedTransactions(signatureStrings, {
      maxSupportedTransactionVersion: 0,
    })

    const result: TokenTransaction[] = []

    for (const [index, tx] of parsedTransactions.entries()) {
      const sigInfo = signatures[index]

      if (!tx || !tx.meta) {
        continue
      }

      const parsedTx = this.parseTokenTransaction(
        tx,
        walletAddress,
        tokenMint,
        tokenAccountAddress,
        sigInfo
      )

      if (parsedTx) {
        result.push(parsedTx)
      }
    }

    return result
  }

  /**
   * Récupère et parse une transaction pour une signature
   * en vue globale (sans point de vue spécifique de wallet).
   * Utile pour stocker une seule ligne par transaction on-chain.
   */
  async getGlobalTokenTransactionForSignature(
    tokenMint: string,
    signature: string
  ): Promise<TokenTransaction | null> {
    const parsedTransaction = await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })

    if (!parsedTransaction || !parsedTransaction.meta) {
      return null
    }

    return this.parseGlobalTokenTransaction(parsedTransaction, tokenMint, signature)
  }

  /**
   * Récupère et parse les transactions pour une liste de signatures
   * en vue globale (sans point de vue spécifique de wallet).
   * Utile pour stocker une seule ligne par transaction on-chain.
   */
  async getGlobalTokenTransactionsForSignatures(
    tokenMint: string,
    signatures: string[]
  ): Promise<TokenTransaction[]> {
    if (signatures.length === 0) {
      return []
    }

    const parsedTransactions = await this.connection.getParsedTransactions(signatures, {
      maxSupportedTransactionVersion: 0,
    })

    const result: TokenTransaction[] = []

    for (const [index, tx] of parsedTransactions.entries()) {
      const signature = signatures[index]

      if (!tx || !tx.meta) {
        continue
      }

      const parsedTx = this.parseGlobalTokenTransaction(tx, tokenMint, signature)

      if (parsedTx) {
        result.push(parsedTx)
      }
    }

    return result
  }

  /**
   * Récupère l'historique des transactions pour un token spécifique
   * @param walletAddress - Adresse du wallet
   * @param tokenMint - Adresse du mint du token
   * @param limit - Nombre maximum de transactions à récupérer
   * @param tokenAccountAddress - Adresse du token account (optionnel, sera calculée si non fournie)
   */
  async getTokenTransactionHistory(
    walletAddress: string,
    tokenMint: string,
    limit: number = 100,
    tokenAccountAddress?: string | null
  ): Promise<TokenTransaction[]> {
    try {
      // Utiliser l'adresse fournie ou la calculer
      let tokenAccountPubkey: PublicKey | null = null

      if (tokenAccountAddress) {
        try {
          tokenAccountPubkey = new PublicKey(tokenAccountAddress)
        } catch {
          // Si l'adresse fournie n'est pas valide, on la calcule
          tokenAccountPubkey = await this.getTokenAccountAddress(walletAddress, tokenMint)
        }
      } else {
        // Obtenir l'adresse du token account
        tokenAccountPubkey = await this.getTokenAccountAddress(walletAddress, tokenMint)
      }

      if (!tokenAccountPubkey) {
        // Si on ne peut pas trouver le token account, essayer de chercher directement
        // les transactions pour l'adresse fournie (peut-être que c'est déjà un token account)
        try {
          const addressAsTokenAccount = new PublicKey(walletAddress)
          const accountInfo = await this.connection.getAccountInfo(addressAsTokenAccount)

          if (accountInfo) {
            // C'est peut-être un token account, chercher les transactions
            return await this.fetchTransactionsForAddress(
              addressAsTokenAccount,
              walletAddress,
              tokenMint,
              limit
            )
          }
        } catch {
          // L'adresse n'est pas valide, retourner un tableau vide
          return []
        }

        return []
      }

      // Vérifier que le token account existe
      const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccountPubkey)
      if (!tokenAccountInfo) {
        return []
      }

      // Récupérer les transactions pour ce token account
      return await this.fetchTransactionsForAddress(
        tokenAccountPubkey,
        walletAddress,
        tokenMint,
        limit
      )
    } catch (error) {
      console.error('Error fetching token transaction history:', error)
      throw error
    }
  }

  /**
   * Récupère les transactions pour une adresse de token account
   */
  private async fetchTransactionsForAddress(
    tokenAccountAddress: PublicKey,
    walletAddress: string,
    tokenMint: string,
    limit: number
  ): Promise<TokenTransaction[]> {
    // Récupérer les signatures de transactions
    const signatures: ConfirmedSignatureInfo[] = await this.connection.getSignaturesForAddress(
      tokenAccountAddress,
      {
        limit,
      }
    )

    // Récupérer les détails de chaque transaction
    const transactions: TokenTransaction[] = []

    for (const signatureInfo of signatures) {
      try {
        const transaction = await this.connection.getParsedTransaction(signatureInfo.signature, {
          maxSupportedTransactionVersion: 0,
        })

        if (transaction && transaction.meta) {
          const parsedTx = this.parseTokenTransaction(
            transaction,
            walletAddress,
            tokenMint,
            tokenAccountAddress.toBase58(),
            signatureInfo
          )

          if (parsedTx) {
            transactions.push(parsedTx)
          }
        }
      } catch (error) {
        // Ignorer les transactions qui ne peuvent pas être parsées
        console.warn(`Failed to parse transaction ${signatureInfo.signature}:`, error)
        continue
      }
    }

    return transactions
  }

  /**
   * Parse une transaction pour extraire les informations du token
   */
  private parseTokenTransaction(
    transaction: ParsedTransactionWithMeta,
    walletAddress: string,
    tokenMint: string,
    tokenAccountAddress: string,
    signatureInfo: ConfirmedSignatureInfo
  ): TokenTransaction | null {
    if (!transaction.meta || !transaction.transaction) {
      return null
    }

    const preBalances = transaction.meta.preTokenBalances || []
    const postBalances = transaction.meta.postTokenBalances || []

    // Trouver l'index du token account qu'on track dans les accountKeys
    let trackedAccountIndex: number | undefined
    if (transaction.transaction.message.accountKeys) {
      trackedAccountIndex = transaction.transaction.message.accountKeys.findIndex((key) => {
        const pubkey = typeof key === 'string' ? key : key.pubkey.toBase58()
        return pubkey === tokenAccountAddress
      })
    }

    // Trouver les changements de balance pour le token account qu'on track
    // Essayer d'abord par accountIndex, puis par mint + owner
    let preBalance =
      trackedAccountIndex !== undefined && trackedAccountIndex !== -1
        ? preBalances.find((balance) => balance.accountIndex === trackedAccountIndex)
        : undefined

    if (!preBalance) {
      preBalance = preBalances.find(
        (balance) => balance.mint === tokenMint && balance.owner === walletAddress
      )
    }

    let postBalance =
      trackedAccountIndex !== undefined && trackedAccountIndex !== -1
        ? postBalances.find((balance) => balance.accountIndex === trackedAccountIndex)
        : undefined

    if (!postBalance) {
      postBalance = postBalances.find(
        (balance) => balance.mint === tokenMint && balance.owner === walletAddress
      )
    }

    // Si on ne trouve ni preBalance ni postBalance, la transaction ne concerne pas ce token account
    if (!preBalance && !postBalance) {
      return null
    }

    // Si on a seulement preBalance ou seulement postBalance, c'est une création ou fermeture
    // Dans ce cas, on peut quand même traiter la transaction
    const preAmount = preBalance
      ? Number.parseFloat(preBalance.uiTokenAmount?.uiAmountString || '0')
      : 0
    const postAmount = postBalance
      ? Number.parseFloat(postBalance.uiTokenAmount?.uiAmountString || '0')
      : 0

    // Utiliser les decimals du balance trouvé, ou une valeur par défaut
    const decimals =
      (preBalance?.uiTokenAmount?.decimals || postBalance?.uiTokenAmount?.decimals) ?? 0

    const amount = Math.abs(postAmount - preAmount)

    if (amount === 0) {
      return null
    }

    // Déterminer le type de transaction basé sur le token account qu'on track
    // Si le token account qu'on track a augmenté = credit (on reçoit)
    // Si le token account qu'on track a diminué = debit (on envoie)
    const type: 'debit' | 'credit' = postAmount > preAmount ? 'credit' : 'debit'

    // Extraire les adresses Solana originales (owners) depuis les token balances
    // Les token balances contiennent déjà l'owner dans le champ 'owner'
    let fromAddress = walletAddress
    let toAddress = walletAddress
    let fromTokenAccount: string | undefined
    let toTokenAccount: string | undefined

    // Obtenir l'adresse du token account qu'on track
    let trackedTokenAccountAddress: string | undefined
    if (
      trackedAccountIndex !== undefined &&
      trackedAccountIndex !== -1 &&
      transaction.transaction.message.accountKeys
    ) {
      const trackedKey = transaction.transaction.message.accountKeys[trackedAccountIndex]
      if (trackedKey) {
        trackedTokenAccountAddress =
          typeof trackedKey === 'string' ? trackedKey : trackedKey.pubkey.toBase58()
      }
    } else {
      trackedTokenAccountAddress = tokenAccountAddress
    }

    // Pour les crédits, trouver le token account source qui a diminué (pas celui qu'on track)
    if (type === 'credit') {
      // Chercher un token account qui a diminué (source) et qui n'est pas celui qu'on track
      const sourceBalance = preBalances.find(
        (balance) =>
          balance.mint === tokenMint &&
          balance.accountIndex !== trackedAccountIndex &&
          balance.uiTokenAmount &&
          Number.parseFloat(balance.uiTokenAmount.uiAmountString || '0') >
            Number.parseFloat(
              postBalances.find((b) => b.accountIndex === balance.accountIndex)?.uiTokenAmount
                ?.uiAmountString || '0'
            )
      )

      if (sourceBalance && sourceBalance.owner) {
        // L'owner est directement dans le token balance
        fromAddress = sourceBalance.owner

        // Obtenir l'adresse du token account source depuis accountIndex
        if (
          sourceBalance.accountIndex !== undefined &&
          transaction.transaction.message.accountKeys
        ) {
          const sourceKey = transaction.transaction.message.accountKeys[sourceBalance.accountIndex]
          if (sourceKey) {
            fromTokenAccount =
              typeof sourceKey === 'string' ? sourceKey : sourceKey.pubkey.toBase58()
          }
        }
      }
      // Le destinataire est le wallet qu'on track
      toAddress = walletAddress
      toTokenAccount = trackedTokenAccountAddress
    }

    // Pour les débits, trouver le token account destination qui a augmenté (pas celui qu'on track)
    if (type === 'debit') {
      // Chercher un token account qui a augmenté (destination) et qui n'est pas celui qu'on track
      const destBalance = postBalances.find(
        (balance) =>
          balance.mint === tokenMint &&
          balance.accountIndex !== trackedAccountIndex &&
          balance.uiTokenAmount &&
          Number.parseFloat(balance.uiTokenAmount.uiAmountString || '0') >
            Number.parseFloat(
              preBalances.find((b) => b.accountIndex === balance.accountIndex)?.uiTokenAmount
                ?.uiAmountString || '0'
            )
      )

      if (destBalance && destBalance.owner) {
        // L'owner est directement dans le token balance
        toAddress = destBalance.owner

        // Obtenir l'adresse du token account destination depuis accountIndex
        if (destBalance.accountIndex !== undefined && transaction.transaction.message.accountKeys) {
          const destKey = transaction.transaction.message.accountKeys[destBalance.accountIndex]
          if (destKey) {
            toTokenAccount = typeof destKey === 'string' ? destKey : destKey.pubkey.toBase58()
          }
        }
      }
      // L'expéditeur est le wallet qu'on track
      fromAddress = walletAddress
      fromTokenAccount = trackedTokenAccountAddress
    }

    // Fallback: utiliser les instructions si on n'a pas trouvé les owners
    if (fromAddress === walletAddress || toAddress === walletAddress) {
      if (transaction.transaction.message.instructions) {
        for (const instruction of transaction.transaction.message.instructions) {
          if (
            'parsed' in instruction &&
            instruction.program === 'spl-token' &&
            instruction.parsed.type === 'transfer'
          ) {
            const parsedInfo = instruction.parsed.info
            if (parsedInfo.authority && fromAddress === walletAddress) {
              fromAddress = parsedInfo.authority
            }
            if (parsedInfo.destination && toAddress === walletAddress) {
              // Pour le destination, on doit trouver l'owner du token account
              // Chercher dans les postBalances pour trouver l'owner
              const destBalance = postBalances.find(
                (balance) =>
                  balance.accountIndex !== undefined &&
                  transaction.transaction.message.accountKeys &&
                  (typeof transaction.transaction.message.accountKeys[balance.accountIndex] ===
                  'string'
                    ? transaction.transaction.message.accountKeys[balance.accountIndex] ===
                      parsedInfo.destination
                    : transaction.transaction.message.accountKeys[
                        balance.accountIndex
                      ].pubkey.toBase58() === parsedInfo.destination)
              )
              if (destBalance && destBalance.owner) {
                toAddress = destBalance.owner
                toTokenAccount = parsedInfo.destination // Adresse du token account
              } else {
                toAddress = parsedInfo.destination
                toTokenAccount = parsedInfo.destination
              }
            }
            // Si on a une source dans l'instruction, l'utiliser aussi
            if (parsedInfo.source && !fromTokenAccount) {
              fromTokenAccount = parsedInfo.source
            }
            break
          }
        }
      }
    }

    return {
      signature: signatureInfo.signature,
      blockTime: signatureInfo.blockTime ?? null,
      amount: Math.round(amount * Math.pow(10, decimals)), // Convertir en plus petite unité (cents)
      type,
      from: fromAddress,
      to: toAddress,
      fromTokenAccount,
      toTokenAccount,
      trackedTokenAccount: trackedTokenAccountAddress,
      mint: tokenMint,
      decimals,
    }
  }

  /**
   * Parse une transaction de manière globale (sans wallet suivi)
   * pour extraire from/to, les token accounts et le montant.
   */
  private parseGlobalTokenTransaction(
    transaction: ParsedTransactionWithMeta,
    tokenMint: string,
    signature: string
  ): TokenTransaction | null {
    if (!transaction.meta || !transaction.transaction) {
      return null
    }

    const preBalances = transaction.meta.preTokenBalances || []
    const postBalances = transaction.meta.postTokenBalances || []

    // Ne garder que les balances pour le mint concerné
    type AccountBalance = {
      pre: number
      post: number
      owner: string
      decimals: number
    }

    const accounts = new Map<number, AccountBalance>()

    for (const bal of preBalances) {
      if (bal.mint !== tokenMint || bal.accountIndex === undefined || !bal.uiTokenAmount) {
        continue
      }
      const amount = Number.parseFloat(bal.uiTokenAmount.uiAmountString || '0')
      const decimals = bal.uiTokenAmount.decimals ?? 0
      accounts.set(bal.accountIndex, {
        pre: amount,
        post: 0,
        owner: bal.owner ?? '',
        decimals,
      })
    }

    for (const bal of postBalances) {
      if (bal.mint !== tokenMint || bal.accountIndex === undefined || !bal.uiTokenAmount) {
        continue
      }
      const amount = Number.parseFloat(bal.uiTokenAmount.uiAmountString || '0')
      const decimals = bal.uiTokenAmount.decimals ?? 0
      const existing = accounts.get(bal.accountIndex)
      if (existing) {
        existing.post = amount
        if (!existing.owner && bal.owner) {
          existing.owner = bal.owner
        }
        if (!existing.decimals && decimals) {
          existing.decimals = decimals
        }
      } else {
        accounts.set(bal.accountIndex, {
          pre: 0,
          post: amount,
          owner: bal.owner ?? '',
          decimals,
        })
      }
    }

    if (accounts.size === 0) {
      return null
    }

    // Trouver la plus grande sortie (delta négatif) et la plus grande entrée (delta positif)
    let sourceIndex: number | null = null
    let destIndex: number | null = null
    let maxNegativeDelta = 0
    let maxPositiveDelta = 0
    let decimals = 0

    for (const [index, bal] of accounts.entries()) {
      const delta = bal.post - bal.pre
      decimals = bal.decimals

      if (delta < maxNegativeDelta) {
        maxNegativeDelta = delta
        sourceIndex = index
      }

      if (delta > maxPositiveDelta) {
        maxPositiveDelta = delta
        destIndex = index
      }
    }

    if (sourceIndex === null || destIndex === null || maxPositiveDelta === 0) {
      return null
    }

    const source = accounts.get(sourceIndex)!
    const dest = accounts.get(destIndex)!

    const amountUi = Math.min(-maxNegativeDelta, maxPositiveDelta)
    const amount = Math.round(amountUi * Math.pow(10, decimals))

    if (amount === 0) {
      return null
    }

    // Récupérer les adresses des token accounts
    let fromTokenAccount: string | undefined
    let toTokenAccount: string | undefined

    if (transaction.transaction.message.accountKeys) {
      const accountKeys = transaction.transaction.message.accountKeys

      const resolveKey = (idx: number): string | undefined => {
        const key = accountKeys[idx]
        if (!key) {
          return undefined
        }
        return typeof key === 'string' ? key : key.pubkey.toBase58()
      }

      fromTokenAccount = resolveKey(sourceIndex)
      toTokenAccount = resolveKey(destIndex)
    }

    return {
      signature,
      blockTime: transaction.blockTime ?? null,
      amount,
      type: 'debit', // globalement, on considère le point de vue de la source
      from: source.owner,
      to: dest.owner,
      fromTokenAccount,
      toTokenAccount,
      trackedTokenAccount: undefined,
      mint: tokenMint,
      decimals,
    }
  }

  /**
   * Calcule les statistiques des transactions
   */
  calculateTransactionStats(transactions: TokenTransaction[]): TransactionStats {
    let totalReceived = 0
    let totalSent = 0
    const uniqueSenders = new Set<string>()
    const uniqueReceivers = new Set<string>()

    transactions.forEach((tx) => {
      const amount = tx.amount / Math.pow(10, tx.decimals)

      if (tx.type === 'credit') {
        totalReceived += amount
        if (tx.from && tx.from !== tx.to) {
          uniqueSenders.add(tx.from)
        }
      } else {
        totalSent += amount
        if (tx.to && tx.to !== tx.from) {
          uniqueReceivers.add(tx.to)
        }
      }
    })

    return {
      totalReceived,
      totalSent,
      uniqueSenders: Array.from(uniqueSenders),
      uniqueReceivers: Array.from(uniqueReceivers),
      transactionCount: transactions.length,
    }
  }
}
