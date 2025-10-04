import env from '#start/env'
import { GridClient } from '@sqds/grid'
import Wallet from '#domains/wallet/models/wallet.model'
import { WalletNotFoundException } from '../exceptions/wallet_not_found.exception.js'
import { Keypair } from '@solana/web3.js'
import { WrongAccountTypeException } from '../exceptions/wrong_account_type.exception.js'

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

  async create(user_id: number): Promise<Wallet> {
    const primaryKey = Keypair.generate()
    const account = await this.client.createAccount({
      signer: primaryKey.publicKey.toBase58(),
    })
    if (account.type !== 'signers') {
      throw new WrongAccountTypeException()
    }
    const wallet = await Wallet.create({
      publicKey: primaryKey.publicKey.toBase58(),
      privateKey: primaryKey.secretKey.toString(),
      userId: user_id,
      provider: 'solana',
      tag: 'primary',
      address: account.address,
      gridUserId: account.grid_user_id,
    })
    return wallet
  }

  async get_balance(user_id: number) {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const balance = await this.client.getAccountBalances(wallet.address)
    return balance as unknown as WalletBalance
  }

  async transfer(user_id: number, amount: number, to_address: string) {
    throw new Error(`Not implemented: transfer from ${user_id} to ${to_address} amount ${amount}`)
  }

  async transfer_with_tag(user_id: number, amount: number, to_tag: string) {
    throw new Error(`Not implemented: transfer from ${user_id} to ${to_tag} amount ${amount}`)
  }
}
