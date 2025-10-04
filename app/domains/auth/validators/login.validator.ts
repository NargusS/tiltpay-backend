import vine from '@vinejs/vine'

export const LoginValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string().minLength(10).maxLength(10),
    code: vine.string().minLength(4).maxLength(6),
  })
)
