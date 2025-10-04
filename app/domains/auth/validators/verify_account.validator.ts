import vine from '@vinejs/vine'

export const VerifyAccountValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string().minLength(10).maxLength(10),
    token: vine.string(),
  })
)
