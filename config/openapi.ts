import { defineConfig } from '@foadonis/openapi'
import env from '#start/env'

export default defineConfig({
  ui: 'scalar',
  document: {
    info: {
      title: 'TiltPay API',
      version: '1.0.0',
      description: 'TiltPay payment platform API',
    },
    servers: [
      {
        url: env.get('APP_URL'),
        description: 'Development server',
      },
    ],
  },
})
