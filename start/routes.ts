/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import openapi from '@foadonis/openapi/services/main'
import { middleware } from './kernel.js'

const TapToPayController = () => import('#domains/tap-to-pay/controllers/tap_to_pay.controller')
const TransactionController = () =>
  import('#domains/transaction/controllers/transaction.controller')

const UsersController = () => import('#domains/user/controllers/users.controller')
openapi.registerRoutes()

const AuthController = () => import('#domains/auth/controllers/auth.controller')
const WalletController = () => import('#domains/wallet/controllers/wallet.controller')

router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/create-account', [AuthController, 'createAccount'])
    router.post('/verify-account', [AuthController, 'verifyAccount'])
    router.get('/me', [AuthController, 'me']).use(middleware.auth())
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('auth')

router
  .group(() => {
    router.get('/balance', [WalletController, 'getBalance'])
    router.get('/address', [WalletController, 'getAddress'])
    router.post('/transfer-by-tag', [WalletController, 'transferByTag'])
    router.post('/transfer-by-address', [WalletController, 'transferByAddress'])
    router.post('/virtual-account', [WalletController, 'requestVirtualAccount'])
    router.get('/virtual-account', [WalletController, 'getVirtualAccount'])
    router.post('/kyc', [WalletController, 'requestKycLink'])
    router.get('/kyc/:kyc_id', [WalletController, 'getKycStatus'])
  })
  .prefix('wallet')
  .use(middleware.auth())

router
  .group(() => {
    router.post('/create-request', [TapToPayController, 'createTapToPayRequest'])
    router.post('/create-authorization', [TapToPayController, 'createTapToPayAuthorization'])
    router.post('/approve-request', [TapToPayController, 'approveTapToPayRequest'])
  })
  .prefix('tap-to-pay')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/transactions', [TransactionController, 'getTransactions'])
  })
  .prefix('transaction')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/users', [UsersController, 'findAll'])
  })
  .prefix('user')
