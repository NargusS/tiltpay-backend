import env from '#start/env'
import { GridClient } from '@sqds/grid'
import Wallet from '#domains/wallet/models/wallet.model'
import { WalletNotFoundException } from '#domains/wallet/exceptions/wallet_not_found.exception'
import { Keypair } from '@solana/web3.js'
import { WrongAccountTypeException } from '#domains/wallet/exceptions/wrong_account_type.exception'
import {
  GetBalanceValidator,
  GetBalanceValidatorType,
} from '#domains/wallet/validators/grid.validators'
import { GetWalletValidationException } from '#domains/wallet/exceptions/get_wallet_validation.exception'
import { errors } from '@vinejs/vine'
import {
  SourceDepositInstructionsValidator,
  SourceDepositInstructionsValidatorType,
} from '../validators/get_virtual_account.validator.js'

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

  async get_balance(user_id: number): Promise<GetBalanceValidatorType> {
    try {
      const wallet = await Wallet.query()
        .where('user_id', user_id)
        .where('provider', 'solana')
        .where('tag', 'primary')
        .first()
      if (!wallet) {
        throw new WalletNotFoundException()
      }
      const response = await this.client.getAccountBalances(wallet.address)
      const balance = GetBalanceValidator.validate(response.data)
      return balance
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        throw new GetWalletValidationException()
      }
      throw error
    }
  }

  async get_address(user_id: number): Promise<string> {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    return wallet.address
  }

  async transfer(from: number, to: number, amount: number) {
    throw new Error(`Not implemented: transfer from ${from} to ${to} amount ${amount}`)
  }

  async transfer_with_tag(user_id: number, amount: number, to_tag: string) {
    throw new Error(`Not implemented: transfer from ${user_id} to ${to_tag} amount ${amount}`)
  }

  async get_virtual_account(
    user_id: number,
    currency: string
  ): Promise<SourceDepositInstructionsValidatorType> {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.getVirtualAccounts(wallet.address)
    if (!response.data) {
      return SourceDepositInstructionsValidator.validate({ data: [] })
    }
    const sourceDepositInstructions = response.data
      .filter((virtualAccount) => virtualAccount.source_deposit_instructions.currency === currency)
      .map((virtualAccount) => virtualAccount.source_deposit_instructions)
    return SourceDepositInstructionsValidator.validate({ data: sourceDepositInstructions })
  }
}
