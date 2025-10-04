import vine from '@vinejs/vine'

export const LoginResponseSchema = vine.compile(
  vine.object({
    access_token: vine.string(),
  })
)

export const CreateAccountResponseSchema = vine.compile(
  vine.object({
    message: vine.string(),
  })
)

export const VerifyAccountResponseSchema = vine.compile(
  vine.object({
    message: vine.string(),
  })
)

export const LogoutResponseSchema = vine.compile(
  vine.object({
    message: vine.string(),
  })
)
