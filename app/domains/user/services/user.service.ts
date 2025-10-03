import User from '#domains/user/models/user'
import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'

export class UserService {
  constructor() {}

  async create(fullName: string, tagname: string, email: string, code: string) {
    const user = await User.create({ fullName, tagname, email, code })
    return user
  }

  async get(id: number): Promise<User | null> {
    const user = await User.find(id)
    if (!user) {
      return null
    }
    return user
  }

  async get_by_email(email: string): Promise<User | null> {
    const user = await User.findBy('email', email)
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
