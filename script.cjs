const fs = require('fs');
const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
fs.writeFileSync('public/icon.png', Buffer.from(base64Data, 'base64'));
console.log('Dummy PNG created');
