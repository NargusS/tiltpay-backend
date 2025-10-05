import vine from '@vinejs/vine'
import { InferInput } from '@vinejs/vine/types'

export const GetVirtualAccountValidator = vine.compile(
  vine.object({
    currency: vine.enum(['eur', 'usd']),
  })
)

export const SourceDepositInstructionsValidator = vine.compile(
  vine.array(
    vine.object({
      currency: vine.enum(['eur', 'usd']),
      bank_beneficiary_name: vine.string(),
      bank_name: vine.string(),
      bank_address: vine.string(),
      bank_routing_number: vine.string(),
      bank_account_number: vine.string(),
    })
  )
)

export type SourceDepositInstructionsValidatorType = InferInput<
  typeof SourceDepositInstructionsValidator
>
