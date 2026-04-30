const fs = require('fs');
const https = require('https');

const url = 'https://i.postimg.cc/9MZYCDPN/Seabra.jpg';

https.get(url, (res) => {
  if (res.statusCode === 200) {
    const file = fs.createWriteStream('public/icon.png');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Image Seabra.jpg downloaded and saved as public/icon.png successfully');
    });
  } else {
    console.error(`Failed to download image. Status code: ${res.statusCode}`);
  }
}).on('error', err => {
  console.error('Error downloading image:', err);
});
