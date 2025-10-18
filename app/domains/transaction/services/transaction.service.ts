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
import { GridClient } from '@sqds/grid'
import env from '#start/env'

@inject()
export default class TransactionService {
  client: GridClient
  constructor() {
    this.client = new GridClient({
      baseUrl: 'https://grid.squads.xyz',
      apiKey: env.get('GRID_API_KEY'),
      environment: 'sandbox',
    })
  }
  /**
   * Create a deposit transaction
   */
  async createDeposit(
    toWalletId: number,
    amount: number,
    currency: string,
    description?: string,
    txHash?: string,
    network?: Network
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      fromWalletId: null,
      toWalletId,
      amount,
      currency,
      description,
      txHash,
      network,
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
    txHash?: string,
    network?: Network
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      type: TransactionType.WITHDRAW,
      status: TransactionStatus.PENDING,
      fromWalletId,
      toWalletId: null,
      amount,
      currency,
      description,
      txHash,
      network,
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
    description?: string
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING,
      fromWalletId,
      toWalletId,
      amount,
      currency,
      description,
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
    const transactions = await this.client.getTransfers(address, {
      limit: 100,
    })
    console.dir(transactions, { depth: null })
  }
}
