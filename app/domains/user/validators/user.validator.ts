import vine from '@vinejs/vine'

export const updateUserSchema = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
  })
)
