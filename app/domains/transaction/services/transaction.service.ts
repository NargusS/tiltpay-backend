import TokenTransaction from '#domains/transaction/models/token_transaction'
import { Transaction } from '#domains/transaction/types/response.types'

export default class TransactionService {
  constructor() {}

  async getTransactions(address: string): Promise<Transaction[]> {
    const transactions = await TokenTransaction.query()
      .where('status', 'fetched')
      .where((query) => {
        query.where('from_address', address).orWhere('to_address', address)
      })
      .orderBy('block_time', 'desc')
    return transactions.map((transaction) => ({
      id: transaction.id,
      signature: transaction.signature,
      createdAt: transaction.blockTime?.toISO() ?? '',
      amount: Number(transaction.amount ?? 0),
      currency: 'usd',
      type: transaction.fromAddress === address ? 'debit' : 'credit',
    }))
  }
}
