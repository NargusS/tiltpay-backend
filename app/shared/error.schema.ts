import vine from '@vinejs/vine'

export const ErrorResponseSchema = vine.compile(
  vine.object({
    message: vine.string(),
    code: vine.string(),
  })
)
