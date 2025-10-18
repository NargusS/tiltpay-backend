import { ApiProperty } from '@foadonis/openapi/decorators'

export class SourceDepositInstructions {
  @ApiProperty({
    description: 'The currency of the source deposit instructions',
    example: 'eur or usd',
    type: String,
  })
  declare currency: string
  @ApiProperty({
    description: 'The bank beneficiary name of the source deposit instructions',
    example: 'John Doe',
    type: String,
  })
  declare bank_beneficiary_name: string
  @ApiProperty({
    description: 'The bank name of the source deposit instructions',
    example: 'Bank of America',
    type: String,
  })
  declare bank_name: string
  @ApiProperty({
    description: 'The bank address of the source deposit instructions',
    example: '123 Main St, Anytown, USA',
    type: String,
  })
  declare bank_address: string
  @ApiProperty({
    description: 'The bank routing number of the source deposit instructions',
    example: '1234567890',
    type: String,
  })
  declare bank_routing_number: string
  @ApiProperty({
    description: 'The bank account number of the source deposit instructions',
    example: '1234567890',
    type: String,
  })
  declare bank_account_number: string
  @ApiProperty({
    description: 'The payment rails of the source deposit instructions',
    example: 'ach_push, ach_pull, sepa, faster_payments, wire, solana, smart_account',
    type: [String],
  })
  declare payment_rails: string[]
}

export class VirtualAccountDestination {
  @ApiProperty({
    description: 'The currency of the virtual account destination',
    example: 'eur or usd',
    type: String,
  })
  declare currency: string
  @ApiProperty({
    description: 'The payment rail of the virtual account destination',
    example: 'ach_push, ach_pull, sepa, faster_payments, wire, solana, smart_account',
    type: String,
  })
  declare payment_rail: string
  @ApiProperty({
    description: 'The address of the virtual account destination',
    example: '0x1234567890123456789012345678901234567890',
    type: String,
  })
  declare address: string
}

export class VirtualAccount {
  @ApiProperty({
    description: 'The id of the virtual account',
    example: 'virtual_account_id',
    type: String,
  })
  declare id: string
  @ApiProperty({
    description: 'The customer id of the virtual account',
    example: 'customer_id',
    type: String,
  })
  declare customer_id: string
  @ApiProperty({
    description: 'The status of the virtual account',
    example: 'active',
    type: String,
  })
  declare status: string
  @ApiProperty({
    description: 'The developer fee percent of the virtual account',
    example: '10',
    type: String,
  })
  declare developer_fee_percent: string
  @ApiProperty({
    description: 'The source deposit instructions of the virtual account',
    example: 'source_deposit_instructions',
    type: SourceDepositInstructions,
  })
  declare source_deposit_instructions: SourceDepositInstructions
  @ApiProperty({
    description: 'The destination of the virtual account',
    example: 'destination',
    type: VirtualAccountDestination,
  })
  declare destination: VirtualAccountDestination
}

export enum KycType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
}

export enum TosStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class KycLink {
  @ApiProperty({
    description: 'The id of the KYC link',
    example: 'kyc_link_id',
    type: String,
  })
  declare id: string
  @ApiProperty({
    description: 'The full name of the KYC link',
    example: 'John Doe',
    type: String,
  })
  declare full_name: string
  @ApiProperty({
    description: 'The email of the KYC link',
    example: 'john.doe@example.com',
    type: String,
  })
  declare email: string
  @ApiProperty({
    description: 'The type of the KYC link',
    example: 'individual or business',
    enum: KycType,
  })
  declare type: KycType
  @ApiProperty({
    description: 'The KYC link of the KYC link',
    example: 'https://kyc.com/link',
    type: String,
  })
  declare kyc_link: string
  @ApiProperty({
    description: 'The TOS link of the KYC link',
    example: 'https://tos.com/link',
    type: String,
  })
  declare tos_link: string
  @ApiProperty({
    description: 'The KYC status of the KYC link',
    example: 'pending or approved or rejected or under_review',
    enum: KycStatus,
  })
  declare kyc_status: KycStatus
  @ApiProperty({
    description: 'The rejection reasons of the KYC link',
    example: 'reason1, reason2',
    type: [String],
  })
  declare rejection_reasons: string[]
  @ApiProperty({
    description: 'The TOS status of the KYC link',
    example: 'pending or approved or rejected',
    enum: TosStatus,
  })
  declare tos_status: TosStatus
  @ApiProperty({
    description: 'The created at of the KYC link',
    example: '2021-01-01T00:00:00.000Z',
    type: String,
  })
  declare created_at: string
  @ApiProperty({
    description: 'The customer id of the KYC link',
    example: 'customer_id',
    type: String,
  })
  declare customer_id: string
  @ApiProperty({
    description: 'The persona inquiry type of the KYC link',
    example: 'persona_inquiry_type',
    type: String,
  })
  declare persona_inquiry_type: string
}

export class KycStatusData {
  @ApiProperty({
    description: 'The id of the KYC status data',
    example: 'kyc_status_data_id',
    type: String,
  })
  declare id: string
  @ApiProperty({
    description: 'The account of the KYC status data',
    example: 'account',
    type: String,
  })
  declare account: string
  @ApiProperty({
    description: 'The type of the KYC status data',
    example: 'individual or business',
    enum: KycType,
  })
  declare type: KycType
  @ApiProperty({
    description: 'The status of the KYC status data',
    example: 'pending or approved or rejected or under_review',
    enum: KycStatus,
  })
  declare status: KycStatus
  @ApiProperty({
    description: 'The TOS status of the KYC status data',
    example: 'pending or approved or rejected',
    enum: TosStatus,
  })
  declare tos_status: TosStatus
  @ApiProperty({
    description: 'The KYC continuation link of the KYC status data',
    example: 'kyc_continuation_link',
    type: String,
  })
  declare kyc_continuation_link: string
  @ApiProperty({
    description: 'The requirements due of the KYC status data',
    example: 'requirement1, requirement2',
    type: [String],
  })
  declare rejection_reasons: string[]
  @ApiProperty({
    description: 'The requirements due of the KYC status data',
    example: 'requirement1, requirement2',
    type: [String],
  })
  declare requirements_due: string[]
  @ApiProperty({
    description: 'The created at of the KYC status data',
    example: '2021-01-01T00:00:00.000Z',
    type: String,
  })
  declare created_at: string
  @ApiProperty({
    description: 'The updated at of the KYC status data',
    example: '2021-01-01T00:00:00.000Z',
    type: String,
  })
  declare updated_at: string
}
