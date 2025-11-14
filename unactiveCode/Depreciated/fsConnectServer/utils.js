const { spawn } = require('child_process');

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Helper function for deep merging objects
function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]));
    }
  }
  // Combine the two objects
  return Object.assign({}, target, source);
}

function restartServer() {
  console.log('Restarting the script...');
  const child = spawn(process.argv[0], process.argv.slice(1), {
    detached: true,  // Ensure the child process is independent
    stdio: 'inherit' // Inherit stdout/stderr so you can see the output in the console
  });

  // Exit the current process to "kill" the old instance
  process.exit();
}

module.exports = { delay, mergeDeep, restartServer };
