import JobLock from '#domains/job/models/job_lock'
import { DateTime } from 'luxon'

export class JobLockService {
  static async tryAcquire(name: string): Promise<boolean> {
    try {
      await JobLock.create({
        name,
        acquiredAt: DateTime.utc(),
      })
      return true
    } catch {
      // Contrainte UNIQUE violée ou autre erreur à la création : le lock est déjà pris
      return false
    }
  }

  static async release(name: string): Promise<void> {
    await JobLock.query().where('name', name).delete()
  }
}
