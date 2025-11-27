import scheduler from 'adonisjs-scheduler/services/main'

scheduler.command('index:solana-signatures').everyMinute().immediate()

scheduler.command('fetch:solana-transactions').everyMinute().immediate()
