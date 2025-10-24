import { HttpContext } from '@adonisjs/core/http'
import { ApiHeader, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import { DateTime } from 'luxon'
import { ErrorResponse } from '#shared/error.types'
import { TransactionResponse } from '#domains/transaction/types/response.types'

@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: ErrorResponse,
})
@ApiResponse({
  status: 500,
  description: 'Internal server error',
  type: ErrorResponse,
})
export default class TransactionController {
  constructor() {}

  @ApiOperation({
    summary: 'Get transactions',
    description: 'Get transactions',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions',
    type: TransactionResponse,
  })
  async getTransactions({ response }: HttpContext) {
    const now = DateTime.now()
    return response.status(200).json({
      transactions: [
        {
          id: 1,
          amount: 7120000,
          name: 'Uber eats',
          type: 'debit',
          currency: 'usd',
          status: 'completed',
          createdAt: now.minus({ days: 1 }).toISO(),
        },
        {
          id: 2,
          amount: 649340000,
          name: 'Sling Money',
          type: 'credit',
          currency: 'usd',
          status: 'completed',
          createdAt: now.minus({ days: 2 }).toISO(),
        },
        {
          id: 3,
          amount: 1467210000,
          name: 'Walmart',
          type: 'debit',
          currency: 'usd',
          status: 'completed',
          createdAt: now.minus({ days: 7 }).toISO(),
        },
        {
          id: 4,
          amount: 1420000,
          name: 'Interest Earnings',
          type: 'credit',
          currency: 'usd',
          status: 'completed',
          createdAt: now.minus({ days: 10 }).toISO(),
        },
      ],
    })
  }
}
