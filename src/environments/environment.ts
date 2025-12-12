// environment.ts (Разработка)
const bizzarUrl = 'https://bizzar-kline-data-fetcher.onrender.com';
const bazzarUrl = 'https://bazzar-kline-data-fetcher.onrender.com';
const coinSifterUrl = 'https://coin-sifter-server.onrender.com';
//const alertsHubUrl = 'https://alert-hub-server.onrender.com';
const alertsHubUrl = 'https://alerts-superhub-deno.deno.dev';
export const BUFFER_MS = 3 * 60 * 1000;
export const PIXEL_TOLERANCE = 5;

export const environment = {
  coinsUrl: coinSifterUrl + '/coins/filtered',
  alertsUrl: alertsHubUrl + '/api/alerts',
  lineAlertsUrl: alertsHubUrl + '/api/alerts/line',
  vwapAlertsUrl: alertsHubUrl + '/api/alerts/vwap',
  workingCoinsUrl: alertsHubUrl + '/api/coins/working',
  authCheckUrl: alertsHubUrl + '/api/auth/check-email',
  token: 'O0hrTGEd3meImdof/H0Hj2XOKuVgQAbr+D9w0DRZvtA=',
  klineDataUrls: {
    '1h': bazzarUrl + '/api/cache/1h',
    '4h': bizzarUrl + '/api/cache/4h',
    '8h': bizzarUrl + '/api/cache/8h',
    '12h': bazzarUrl + '/api/cache/12h',
    D: bazzarUrl + '/api/cache/D',
  },
  firebaseConfig: {
    apiKey: 'AIzaSyBBV56nM8DWZ5pJZ2f2QPA6sZemVCP-vTQ',
    authDomain: 'alerts-superhub.firebaseapp.com',
    projectId: 'alerts-superhub',
    storageBucket: 'alerts-superhub.firebasestorage.app',
    messagingSenderId: '632480280762',
    appId: '1:632480280762:web:c3b7d32aef28b8e15ad283',
  },
};
