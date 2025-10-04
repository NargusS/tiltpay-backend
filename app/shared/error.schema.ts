import vine from '@vinejs/vine'

export const ErrorResponseSchema = vine.compile(
  vine.object({
    name: vine.string(),
    message: vine.string(),
    code: vine.string(),
  })
)

export const ValidationErrorResponseSchema = vine.compile(
  vine.object({
    message: vine.string(),
    errors: vine.array(
      vine.object({
        field: vine.string(),
        message: vine.string(),
        rule: vine.string(),
      })
    ),
  })
)
