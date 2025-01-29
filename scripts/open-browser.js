const { exec } = require('child_process');
const os = require('os');

const platform = os.platform();
const url = 'http://localhost:3000';

function openBrowser() {
  switch (platform) {
    case 'win32': // Windows
      exec('start chrome --incognito ' + url);
      break;
    case 'darwin': // macOS
      exec('open -a "Google Chrome" --args --incognito ' + url);
      break;
    case 'linux': // Linux
      exec('google-chrome --incognito ' + url);
      break;
    default:
      console.log('Platform not supported for automatic browser opening');
  }
}

// Wait a bit for the server to start
setTimeout(openBrowser, 2000); 