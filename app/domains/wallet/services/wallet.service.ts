import env from '#start/env'
import Wallet from '#domains/wallet/models/wallet.model'
import {
  GetBalanceValidator,
  GetBalanceValidatorType,
} from '#domains/wallet/validators/grid.validators'
import {
  WalletException,
  WalletNotFoundException,
  WrongAccountTypeException,
} from '#domains/wallet/exceptions/wallet.exception'
import { RequestKycLinkResponse } from '#domains/wallet/types/wallet.response.types'
import { BridgeCurrency, GridClient, VirtualAccount } from '@sqds/grid'
import {
  KycStatusData,
  KycType,
  SourceDepositInstructions,
} from '#domains/wallet/types/wallet.types'
import { MAP_CONTRACT_ADDRESS } from '#domains/wallet/constants/wallet.constants'
import { Keypair } from '@solana/web3.js'

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
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.getAccountBalances(wallet.address)
    console.dir(response, { depth: null })
    const balance = await GetBalanceValidator.validate(response.data)
    return {
      ...balance,
      tokens: balance.tokens.map((token) => {
        const tokenInfo =
          MAP_CONTRACT_ADDRESS[token.token_address as keyof typeof MAP_CONTRACT_ADDRESS]
        if (tokenInfo) {
          return {
            ...token,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            logo_url: tokenInfo.logo_url,
          }
        }
        return token
      }),
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

  private parsePrivateKey(privateKeyString: string): Uint8Array {
    return Uint8Array.from(privateKeyString.split(',').map(Number))
  }

  async transfer_to_user(from: number, to: number, amount: number) {
    const fromWallet = await Wallet.query()
      .where('user_id', from)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!fromWallet) {
      throw new WalletNotFoundException()
    }
    const toWallet = await Wallet.query()
      .where('user_id', to)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!toWallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.createPaymentIntent(fromWallet.address, {
      amount: (amount * 1000000).toString(),
      grid_user_id: fromWallet.gridUserId,
      source: {
        account: fromWallet.address,
        currency: 'usdc',
      },
      destination: {
        address: toWallet.address,
        currency: 'usdc',
        payment_rail: 'solana',
      },
    })
    if (!response.data) {
      throw new WalletException('Transaction payload not found')
    }
    const keypair = Keypair.fromSecretKey(this.parsePrivateKey(fromWallet.privateKey))
    await this.client.signAndSend({
      sessionSecrets: [keypair as any], // ! LIBRARY NEED TO BE FIXED
      transactionPayload: response.data.transactionPayload!,
      address: toWallet.address,
    })
    return
  }

  async transfer_to_address(from: number, to_address: string, amount: number) {
    const fromWallet = await Wallet.query()
      .where('user_id', from)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!fromWallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.createPaymentIntent(fromWallet.address, {
      amount: (amount * 1000000).toString(),
      grid_user_id: fromWallet.gridUserId,
      source: {
        account: fromWallet.address,
        currency: 'usdc',
      },
      destination: {
        address: to_address,
        currency: 'usdc',
        payment_rail: 'solana',
      },
    })
    if (!response.data) {
      throw new WalletException('Transaction payload not found')
    }
    const keypair = Keypair.fromSecretKey(this.parsePrivateKey(fromWallet.privateKey))
    await this.client.signAndSend({
      sessionSecrets: [keypair as any], // ! LIBRARY NEED TO BE FIXED
      transactionPayload: response.data.transactionPayload!,
      address: to_address,
    })
    return
  }

  async request_kyc_link(
    user_id: number,
    email: string,
    full_name: string
  ): Promise<RequestKycLinkResponse> {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.requestKycLink(wallet.address, {
      grid_user_id: wallet.gridUserId,
      type: KycType.INDIVIDUAL,
      email: email,
      full_name: full_name,
      endorsements: ['sepa'],
    })
    return {
      id: response.data?.id,
      full_name: response.data?.full_name,
      email: response.data?.email,
      type: response.data?.type,
      kyc_link: response.data?.kyc_link,
      tos_link: response.data?.tos_link,
      kyc_status: response.data?.kyc_status,
      rejection_reasons: response.data?.rejection_reasons,
      tos_status: response.data?.tos_status,
      created_at: response.data?.created_at,
      customer_id: response.data?.customer_id,
      persona_inquiry_type: response.data?.persona_inquiry_type,
    }
  }

  async get_kyc_status(user_id: number, kyc_id: string): Promise<KycStatusData> {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.getKycStatus(wallet.address, kyc_id)
    return {
      id: response.data?.id,
      account: response.data?.account,
      type: response.data?.type,
      status: response.data?.status,
      tos_status: response.data?.tos_status,
      kyc_continuation_link: response.data?.kyc_continuation_link,
      rejection_reasons: response.data?.rejection_reasons,
      requirements_due: response.data?.requirements_due,
      created_at: response.data?.created_at,
      updated_at: response.data?.updated_at,
    }
  }

  async request_virtual_account(user_id: number, currency: string): Promise<VirtualAccount> {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const response = await this.client.requestVirtualAccount(wallet.address, {
      currency: currency as BridgeCurrency,
      grid_user_id: wallet.gridUserId,
    })
    return response.data as VirtualAccount
  }

  async get_virtual_account(
    user_id: number,
    currency: string
  ): Promise<SourceDepositInstructions[]> {
    const wallet = await Wallet.query()
      .where('user_id', user_id)
      .where('provider', 'solana')
      .where('tag', 'primary')
      .first()
    if (!wallet) {
      throw new WalletNotFoundException()
    }
    const response = (await this.client.getVirtualAccounts(wallet.address)) as VirtualAccount[]
    const sourceDepositInstructions = response
      .filter(
        (virtualAccount: VirtualAccount) =>
          virtualAccount.source_deposit_instructions.currency === currency
      )
      .map((depositInstructions: VirtualAccount) => depositInstructions.source_deposit_instructions)
    return sourceDepositInstructions
  }
}
