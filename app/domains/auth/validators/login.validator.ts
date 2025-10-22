import vine from '@vinejs/vine'

export const LoginValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string().trim(),
    code: vine.string().minLength(4).maxLength(6),
  })
)
