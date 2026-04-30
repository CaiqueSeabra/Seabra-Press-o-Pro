const fs = require('fs');
const https = require('https');

const url = 'https://img.icons8.com/fluency/512/blood-pressure.png';
const file = fs.createWriteStream('public/icon.png');

https.get(url, (res) => {
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed');
  });
}).on('error', (err) => {
  fs.unlink('public/icon.png', () => {});
  console.error('Error:', err.message);
});
