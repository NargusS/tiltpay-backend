import vine from '@vinejs/vine'

export const createUserSchema = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100),
    tagname: vine.string().trim().minLength(3).maxLength(50),
    email: vine.string().trim().email().normalizeEmail(),
    code: vine.string().minLength(4).maxLength(6),
    confirmCode: vine.string().minLength(4).maxLength(6),
  })
)

export const updateUserSchema = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
  })
)

export const loginSchema = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    code: vine.string().minLength(4).maxLength(6),
  })
)
