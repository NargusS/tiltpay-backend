import vine from '@vinejs/vine'

export const RequestVirtualAccountValidator = vine.compile(
  vine.object({
    currency: vine.enum(['eur', 'usd']),
  })
)

export const GetVirtualAccountValidator = vine.compile(
  vine.object({
    currency: vine.enum(['eur', 'usd']),
  })
)
