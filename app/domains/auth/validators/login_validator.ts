import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string(),
    code: vine.string().minLength(4).maxLength(6),
  })
)
