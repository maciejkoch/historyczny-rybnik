// Public Firebase configuration; no service credentials or debug tokens.
export const PUBLIC_ORIGIN = 'https://historyczny.rybnik.pl';
export const FIREBASE_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyAIODAPngO09P6CkqVCYQqMs1pFFP8hqpM',
    appId: '1:301143182490:web:d3adffd573322094d3e323',
    projectId: 'historyczny-rybnik',
    authDomain: 'historyczny-rybnik.firebaseapp.com',
  },
  appCheckSiteKey: '6LfYfCguAAAAAJ25McPxhMkfTq4YFNlwwT_843KZ',
  storageBucket: 'historyczny-rybnik-prod-files',
  functions: { read: 'placesProdRead', update: 'placesProdUpdate' },
};
