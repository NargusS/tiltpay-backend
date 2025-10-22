import vine from '@vinejs/vine'

export const VerifyAccountValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string().trim(),
    token: vine.string(),
  })
)
