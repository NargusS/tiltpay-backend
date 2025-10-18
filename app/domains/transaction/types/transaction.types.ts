export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Network {
  SOLANA = 'solana',
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  USDC = 'USDC',
  USDT = 'USDT',
}
