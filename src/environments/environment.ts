// environment.ts (Разработка)
const bizzarUrl = 'https://bizzar-kline-data-fetcher.onrender.com';
const bazzarUrl = 'https://bazzar-kline-data-fetcher.onrender.com';
const coinSifterUrl = 'https://coin-sifter-server.onrender.com';
//const alertsHubUrl = 'https://alert-hub-server.onrender.com';
const alertsHubUrl = 'http://localhost:8000';

export const environment = {
  coinsUrl: coinSifterUrl + '/coins/filtered',
  lineAlertsUrl: alertsHubUrl + '/api/alerts/line',
  vwapAlertsUrl: alertsHubUrl + '/api/alerts/vwap',
  workingCoinsUrl: alertsHubUrl + '/api/coins/working',
  token: 'O0hrTGEd3meImdof/H0Hj2XOKuVgQAbr+D9w0DRZvtA=',
  klineDataUrls: {
    '1h': bazzarUrl + '/api/cache/1h',
    '4h': bizzarUrl + '/api/cache/4h',
    '8h': bizzarUrl + '/api/cache/8h',
    '12h': bazzarUrl + '/api/cache/12h',
    D: bazzarUrl + '/api/cache/D',
  },
};
