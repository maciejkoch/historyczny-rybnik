// Public web configuration. Debug tokens and service credentials never belong here.
export const PUBLIC_ORIGIN = 'https://historyczny-rybnik-dev.web.app';
export const FIREBASE_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyAIODAPngO09P6CkqVCYQqMs1pFFP8hqpM',
    appId: '1:301143182490:web:54ca2baf6d4eec1cd3e323',
    projectId: 'historyczny-rybnik',
    authDomain: 'historyczny-rybnik.firebaseapp.com',
  },
  appCheckSiteKey: '6LfwbBEuAAAAAKX8gmEcWPa0bGjnJuJ9p7S3nhZJ',
  storageBucket: 'historyczny-rybnik-dev-files',
  functions: { read: 'placesDevRead', update: 'placesDevUpdate' },
};
