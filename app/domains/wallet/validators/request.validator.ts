import vine from '@vinejs/vine'

export const TransferMoneyByTagRequest = vine.compile(
  vine.object({
    amount: vine.number().min(0.5),
    tag: vine.string(),
  })
)

export const CreateVirtualAccountRequest = vine.compile(
  vine.object({
    currency: vine.enum(['eur', 'usd']),
  })
)

export const GetVirtualAccountRequest = vine.compile(
  vine.object({
    currency: vine.enum(['eur', 'usd']),
  })
)

export const TransferMoneyByAddressRequest = vine.compile(
  vine.object({
    amount: vine.number().min(0.5),
    address: vine.string(),
  })
)
