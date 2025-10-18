import vine from '@vinejs/vine'
import { InferInput } from '@vinejs/vine/types'

export const GetBalanceValidator = vine.compile(
  vine.object({
    address: vine.string(),
    lamports: vine.number(),
    sol: vine.number(),
    tokens: vine.array(
      vine.object({
        token_address: vine.string(),
        amount: vine.number(),
        decimals: vine.number(),
        symbol: vine.string(),
        name: vine.string(),
        logo_url: vine.string().nullable(),
      })
    ),
  })
)

export type GetBalanceValidatorType = InferInput<typeof GetBalanceValidator>
