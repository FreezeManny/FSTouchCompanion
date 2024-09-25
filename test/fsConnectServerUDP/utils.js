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

module.exports = { delay, mergeDeep };
