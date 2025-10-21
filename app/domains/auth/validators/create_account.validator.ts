import vine from '@vinejs/vine'

export const CreateAccountValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string().trim().minLength(10).maxLength(15),
    fullName: vine.string().trim().minLength(2),
    tagName: vine.string().trim().minLength(3),
    code: vine
      .string()
      .minLength(4)
      .maxLength(6)
      .confirmed({ confirmationField: 'code_confirmation' }),
    code_confirmation: vine.string().minLength(4).maxLength(6),
  })
)
