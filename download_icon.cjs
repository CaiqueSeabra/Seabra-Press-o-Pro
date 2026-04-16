const fs = require('fs');
const https = require('https');

const url = 'https://ibb.co/M57MwtrG';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/<meta property="og:image" content="([^"]+)"/);
    if (match && match[1]) {
      const imageUrl = match[1];
      console.log('Found image URL:', imageUrl);
      https.get(imageUrl, (imgRes) => {
        const file = fs.createWriteStream('public/icon.png');
        imgRes.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Image downloaded successfully');
        });
      });
    } else {
      console.log('Image URL not found');
    }
  });
}).on('error', err => console.error(err));
