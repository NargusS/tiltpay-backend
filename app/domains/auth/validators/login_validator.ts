import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    code: vine.string().minLength(4).maxLength(6),
  })
)
