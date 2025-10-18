import vine from '@vinejs/vine'

export const TransferMoneyByTagValidator = vine.compile(
  vine.object({
    amount: vine.number().min(0.5),
    tag: vine.string(),
  })
)
