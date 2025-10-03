import vine from '@vinejs/vine'

export const createAccountValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    fullName: vine.string().trim().minLength(2),
    tagName: vine.string().trim().minLength(3),
    code: vine.string().minLength(4).maxLength(6),
    confirmCode: vine.string().minLength(4).maxLength(6),
  })
)
