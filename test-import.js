const ar = require('./src/locales/ar');
console.log('ar keys:', Object.keys(ar));
if (ar.default) {
  console.log('ar.default keys:', Object.keys(ar.default));
}
