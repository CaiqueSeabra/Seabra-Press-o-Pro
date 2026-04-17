const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/CaiqueSeabra/Seabra-Press-o-Pro/main/public/foto-carlos.jpg.png';
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

https.get(url, (res) => {
  if (res.statusCode === 200) {
    const file = fs.createWriteStream(path.join(publicDir, 'foto-carlos.jpg'));
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Sucesso: Sua foto foi baixada do GitHub e salva em public/foto-carlos.jpg');
    });
  } else {
    console.error(`Erro ao baixar foto. Código: ${res.statusCode}. Verifique se o GitHub está público.`);
  }
}).on('error', err => {
  console.error('Erro de conexão:', err);
});
