import env from '#start/env'
import { GridClient } from '@sqds/grid'
import Wallet from '#domains/wallet/models/wallet.model'
import { WalletNotFoundException } from '../exceptions/wallet_not_found.exception.js'

export interface TokenBalance {
  mint: string
  amount: string
  decimals: number
  symbol: string
  name: string
}

export interface WalletBalance {
  address: string
  lamports: number
  sol: number
  tokens: TokenBalance[]
}

export class WalletService {
  client: GridClient
  constructor() {
    this.client = new GridClient({
      baseUrl: 'https://grid.squads.xyz',
      apiKey: env.get('GRID_API_KEY'),
      environment: 'sandbox',
    })
  }

  async create(user_id: number) {
    const sessionSecrets = await this.client.generateSessionSecrets()
    const bulk = sessionSecrets.map((secret) => ({
      publicKey: secret.publicKey,
      privateKey: secret.privateKey,
      user_id: user_id,
      provider: secret.provider,
      tag: secret.tag,
    }))
    await Wallet.createMany(bulk)
    return {
      success: true,
      message: 'Wallet created successfully',
      data: bulk,
    }
  }

  async get_balance(user_id: number) {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const balance = await this.client.getAccountBalances(wallet.publicKey)
    return balance as unknown as WalletBalance
  }
}
