import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import Transaction from '#domains/transaction/models/transaction.model'
import {
  TransactionType,
  TransactionStatus,
  Network,
} from '#domains/transaction/types/transaction.types'
import {
  TransactionNotFoundException,
  InvalidTransactionException,
} from '#domains/transaction/exceptions/transaction.exceptions'
import { GridClient, SplTransfer } from '@sqds/grid'
import env from '#start/env'
import { WalletService } from '#domains/wallet/services/wallet.service'
import { USDC_MINT } from '#domains/wallet/constants/wallet.constants'

@inject()
export default class TransactionService {
  client: GridClient
  walletService: WalletService
  constructor(walletService: WalletService) {
    this.walletService = walletService
    this.client = new GridClient({
      baseUrl: 'https://grid.squads.xyz',
      apiKey: env.get('GRID_API_KEY'),
      environment: 'sandbox',
    })
    this.walletService = walletService
  }
  /**
   * Create a deposit transaction
   */
  async createDeposit(
    toWalletId: number,
    amount: number,
    currency: string,
    description?: string,
    status?: TransactionStatus,
    completedAt?: DateTime,
    txHash?: string,
    network?: Network
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      type: TransactionType.DEPOSIT,
      status: status || TransactionStatus.PENDING,
      fromWalletId: null,
      toWalletId,
      amount,
      currency,
      description,
      txHash,
      network,
      completedAt,
    })

    return transaction
  }

  /**
   * Create a withdraw transaction
   */
  async createWithdraw(
    fromWalletId: number,
    amount: number,
    currency: string,
    description?: string,
    status?: TransactionStatus,
    completedAt?: DateTime,
    txHash?: string,
    network?: Network
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      type: TransactionType.WITHDRAW,
      status: status || TransactionStatus.PENDING,
      fromWalletId,
      toWalletId: null,
      amount,
      currency,
      description,
      txHash,
      network,
      completedAt,
    })
    return transaction
  }

  /**
   * Create a transfer transaction between two wallets
   */
  async createTransfer(
    fromWalletId: number,
    toWalletId: number,
    amount: number,
    currency: string,
    description?: string,
    completedAt?: DateTime,
    status?: TransactionStatus,
    txHash?: string,
    network?: Network
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      type: TransactionType.TRANSFER,
      status: status || TransactionStatus.PENDING,
      fromWalletId,
      toWalletId,
      amount,
      currency,
      description,
      completedAt,
      txHash,
      network,
    })

    return transaction
  }

  /**
   * Complete a transaction
   */
  async completeTransaction(transactionId: number): Promise<Transaction> {
    const transaction = await Transaction.find(transactionId)
    if (!transaction) {
      throw new TransactionNotFoundException()
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new InvalidTransactionException('Transaction is not in pending state')
    }

    transaction.status = TransactionStatus.COMPLETED
    transaction.completedAt = DateTime.now()
    await transaction.save()

    return transaction
  }

  /**
   * Fail a transaction
   */
  async failTransaction(transactionId: number, reason?: string): Promise<Transaction> {
    const transaction = await Transaction.find(transactionId)
    if (!transaction) {
      throw new TransactionNotFoundException()
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new InvalidTransactionException('Transaction is not in pending state')
    }

    transaction.status = TransactionStatus.FAILED
    if (reason) {
      transaction.description = transaction.description
        ? `${transaction.description} - Failed: ${reason}`
        : `Failed: ${reason}`
    }
    await transaction.save()

    return transaction
  }

  /**
   * Get transaction by ID
   */
  async getById(transactionId: number): Promise<Transaction> {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('fromWallet')
      .preload('toWallet')
      .firstOrFail()

    return transaction
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(
    walletId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<Transaction[]> {
    const transactions = await Transaction.query()
      .where('from_wallet_id', walletId)
      .orWhere('to_wallet_id', walletId)
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return transactions.all()
  }

  async syncTransactions(address: string): Promise<void> {
    const response = await this.client.getTransfers(address, {
      limit: 100,
    })
    if (!response.success) {
      throw new Error('Failed to get transactions')
    }
    const listTransactions = response.data
    console.log(`Found ${listTransactions.length} transactions to sync`)

    const wallet = await this.walletService.get_by_address(address)
    if (!wallet) {
      console.log(`Wallet not found for address ${address}`)
      return
    }
    let synced = 0
    let skipped = 0

    console.log(listTransactions)
    for (const transfer of listTransactions) {
      if (transfer.Spl) {
        const splTransfer = transfer.Spl as SplTransfer

        if (splTransfer.mint !== USDC_MINT) {
          continue
        }
        // Check if transaction already exists
        const existingTx = await Transaction.query().where('tx_hash', splTransfer.signature).first()

        if (existingTx) {
          skipped++
          continue
        }

        // Find the other wallet if it's an internal transfer
        const otherAddress =
          splTransfer.direction === 'inflow' ? splTransfer.from_address : splTransfer.to_address
        const otherWallet = await this.walletService.get_by_address(otherAddress)

        if (splTransfer.direction === 'inflow' && !otherWallet) {
          await this.createDeposit(
            wallet.id,
            Number(splTransfer.ui_amount),
            'usd',
            `${splTransfer.mint.substring(0, 8)}...`,
            TransactionStatus.COMPLETED,
            splTransfer.confirmed_at ? DateTime.fromISO(splTransfer.confirmed_at) : undefined,
            Network.SOLANA
          )
        } else if (splTransfer.direction === 'outflow' && !otherWallet) {
          await this.createWithdraw(
            wallet.id,
            Number(splTransfer.ui_amount),
            'usd',
            `${splTransfer.mint.substring(0, 8)}...`,
            TransactionStatus.COMPLETED,
            splTransfer.confirmed_at ? DateTime.fromISO(splTransfer.confirmed_at) : undefined,
            splTransfer.signature,
            Network.SOLANA
          )
        } else if (otherWallet) {
          await this.createTransfer(
            splTransfer.direction === 'outflow' ? wallet.id : otherWallet.id,
            splTransfer.direction === 'inflow' ? wallet.id : otherWallet.id,
            Number(splTransfer.ui_amount),
            'usd',
            `${splTransfer.mint.substring(0, 8)}...`,
            splTransfer.confirmed_at ? DateTime.fromISO(splTransfer.confirmed_at) : undefined,
            TransactionStatus.COMPLETED,
            splTransfer.signature,
            Network.SOLANA
          )
        } else {
          console.log(`Could not determine transaction type for ${splTransfer.signature}`)
          continue
        }
        synced++
      }
    }

    console.log(`Sync complete: ${synced} new transactions, ${skipped} skipped (already exist)`)
  }
}
