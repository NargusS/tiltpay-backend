import { ApiProperty } from '@foadonis/openapi/decorators'
import {
  KycLink,
  KycStatusData,
  SourceDepositInstructions,
  VirtualAccount,
} from '#domains/wallet/types/wallet.types'

export class GetWalletAddressResponse {
  @ApiProperty({
    description: 'The address of the wallet',
    example: 'solana_address',
    type: String,
  })
  declare address: string
}

export class TransferMoneyByTagResponse {
  @ApiProperty({
    description: 'The message of the transfer',
    example: 'Money transferred successfully',
    type: String,
  })
  declare message: string
}

export class RequestVirtualAccountResponse {
  @ApiProperty({
    description: 'The virtual account',
    example: 'virtual_account',
    type: VirtualAccount,
  })
  declare virtual_account: VirtualAccount
}

export class GetVirtualAccountsResponse {
  @ApiProperty({
    description: 'The virtual accounts',
    example: 'virtual_accounts',
    type: [SourceDepositInstructions],
  })
  declare virtual_accounts: SourceDepositInstructions[]
}

export class RequestKycLinkResponse extends KycLink {}

export class GetKycStatusResponse extends KycStatusData {}
