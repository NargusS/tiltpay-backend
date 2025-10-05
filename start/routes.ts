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

openapi.registerRoutes()

const AuthController = () => import('#domains/auth/controllers/auth.controller')
const WalletController = () => import('#domains/wallet/controllers/wallet.controller')

router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/create-account', [AuthController, 'createAccount'])
    router.post('/verify-account', [AuthController, 'verifyAccount'])
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('auth')

router
  .group(() => {
    router.get('/balance', [WalletController, 'getBalance'])
    router.get('/address', [WalletController, 'getAddress'])
    router.post('/transfer-by-tag', [WalletController, 'transferByTag'])
  })
  .prefix('wallet')
  .use(middleware.auth())
