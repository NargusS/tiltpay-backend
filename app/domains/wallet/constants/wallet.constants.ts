import env from '#start/env'

export const MAP_CONTRACT_ADDRESS = {
  [env.get('USDC_MINT_ADDRESS')]: {
    symbol: 'USDC',
    name: 'USDC',
    logo_url: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
  },
}
