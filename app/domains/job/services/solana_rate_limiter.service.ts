import db from '@adonisjs/lucid/services/db'

export class SolanaRateLimiterService {
  private static readonly MAX_REQUESTS_PER_WINDOW = 30 // Réduit à 30 pour plus de sécurité
  private static readonly WINDOW_MS = 10000 // 10 secondes
  private static readonly TABLE_NAME = 'solana_rpc_requests'

  /**
   * Attend si nécessaire pour respecter le rate limit
   * Retourne le nombre de requêtes dans la fenêtre actuelle
   */
  static async waitIfNeeded(): Promise<number> {
    const now = Date.now()
    const windowStart = now - this.WINDOW_MS

    try {
      // Nettoyer les requêtes anciennes (plus de 10 secondes)
      await db.rawQuery(`DELETE FROM ${this.TABLE_NAME} WHERE timestamp < ?`, [windowStart])

      // Compter les requêtes dans la fenêtre
      const result = await db.rawQuery(
        `SELECT COUNT(*) as count FROM ${this.TABLE_NAME} WHERE timestamp >= ?`,
        [windowStart]
      )

      const currentCount = Number(result[0]?.count || 0)

      if (currentCount >= this.MAX_REQUESTS_PER_WINDOW) {
        // Calculer le temps d'attente nécessaire
        const oldestRequest = await db.rawQuery(
          `SELECT MIN(timestamp) as oldest FROM ${this.TABLE_NAME} WHERE timestamp >= ?`,
          [windowStart]
        )

        const oldestTimestamp = Number(oldestRequest[0]?.oldest || now)
        const waitTime = this.WINDOW_MS - (now - oldestTimestamp) + 200 // +200ms de marge pour plus de sécurité

        if (waitTime > 0) {
          console.log(`Rate limit atteint, attente de ${waitTime}ms...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }

      // Enregistrer cette requête
      await db.rawQuery(`INSERT INTO ${this.TABLE_NAME} (timestamp) VALUES (?)`, [now])

      return currentCount + 1
    } catch (error) {
      // Si la table n'existe pas encore, utiliser un délai fixe
      console.warn('Rate limiter table not found, using fixed delay:', error)
      await this.waitForNextRequest()
      return 0
    }
  }

  /**
   * Version simplifiée avec délai fixe basé sur le taux cible
   * Utilisée comme fallback ou pour un rate limiting simple
   */
  static async waitForNextRequest(): Promise<void> {
    const delay = Math.ceil(this.WINDOW_MS / this.MAX_REQUESTS_PER_WINDOW) + 50 // ~383ms avec marge
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
