const path = require('path');
process.env.NODE_ENV = 'production';
const standaloneDir = path.join(__dirname, '.next', 'standalone');
process.chdir(standaloneDir);
require('./server.js');
