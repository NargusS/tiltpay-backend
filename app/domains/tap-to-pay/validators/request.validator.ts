import vine from '@vinejs/vine'

export const CreateTapToPayRequest = vine.compile(
  vine.object({
    amount: vine.number().min(0.5),
    currency: vine.enum(['eur', 'usd']),
  })
)

export const ApproveTapToPayRequest = vine.compile(
  vine.object({
    requestId: vine.number(),
    secret: vine.string(),
  })
)
