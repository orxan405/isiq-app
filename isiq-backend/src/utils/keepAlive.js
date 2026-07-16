const https = require('https');

const keepAlive = () => {
  setInterval(() => {
    https.get('https://isiq-backend.onrender.com/health', (res) => {
      console.log('Keep alive ping:', res.statusCode);
    }).on('error', (err) => {
      console.log('Keep alive xətası:', err.message);
    });
  }, 14 * 60 * 1000); // hər 14 dəqiqədə bir
};

module.exports = keepAlive;