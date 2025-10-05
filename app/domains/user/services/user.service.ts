import User from '#domains/user/models/user'
import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'

export class UserService {
  constructor() {}

  async create(
    fullName: string,
    tagname: string,
    phoneNumber: string,
    code: string,
    verificationCode: number
  ) {
    const user = await User.create({
      fullName,
      tagname,
      phoneNumber,
      code,
      verificationToken: verificationCode.toString(),
    })
    return user
  }

  async get(id: number): Promise<User | null> {
    const user = await User.find(id)
    if (!user) {
      return null
    }
    return user
  }

  async get_by_phone_number(phoneNumber: string): Promise<User | null> {
    const user = await User.findBy('phoneNumber', phoneNumber)
    if (!user) {
      return null
    }
    return user
  }

  async get_by_tagname(tagname: string): Promise<User | null> {
    const user = await User.findBy('tagname', tagname)
    if (!user) {
      return null
    }
    return user
  }

  async update(id: number, fullName: string): Promise<User> {
    const user = await User.find(id)
    if (!user) {
      throw new UserNotFoundException('User not found')
    }
    user.fullName = fullName
    await user.save()
    return user
  }

  async update_code(id: number, code: string): Promise<User> {
    const user = await User.find(id)
    if (!user) {
      throw new UserNotFoundException('User not found')
    }
    user.code = code
    await user.save()
    return user
  }

  async update_attempt(id: number, attempt: number): Promise<User> {
    const user = await User.find(id)
    if (!user) {
      throw new UserNotFoundException('User not found')
    }
    user.attempt = attempt
    await user.save()
    return user
  }

  async delete(id: number): Promise<void> {
    const user = await User.find(id)
    if (!user) {
      throw new UserNotFoundException('User not found')
    }
    await user.delete()
  }
}
