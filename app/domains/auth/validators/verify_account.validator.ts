import vine from '@vinejs/vine'

export const verifyAccountValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string(),
    token: vine.string(),
  })
)
