import { ApiProperty } from '@foadonis/openapi/decorators'
import {
  KycLink,
  KycStatusData,
  SourceDepositInstructions,
  VirtualAccount,
} from '#domains/wallet/types/wallet.types'

export class GetWalletAddressResponse {
  @ApiProperty({
    description: 'The address of the wallet (Grid address)',
    example: '7T7o7CXekdSeW2743g7SwowsfzJyytJcufYfz9LUvm2J',
    type: String,
  })
  declare address: string

  @ApiProperty({
    description: 'The USDC token account address for receiving USDC tokens',
    example: 'ABC123...',
    type: String,
    nullable: true,
  })
  declare usdcTokenAccountAddress: string | null
}

export class TransferMoneyByTagResponse {
  @ApiProperty({
    description: 'The message of the transfer',
    example: 'Money transferred successfully',
    type: String,
  })
  declare message: string
}

export class TransferMoneyByAddressResponse {
  @ApiProperty({
    description: 'The message of the transfer',
    example: 'Money transferred successfully',
    type: String,
  })
  declare message: string
}

export class CreateVirtualAccountResponse {
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
