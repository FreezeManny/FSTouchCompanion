export function formatFrequency(freqHz) {
  const freqStr = freqHz.toString();
  const middleIndex = Math.floor(freqStr.length / 2);
  const formattedFreq = freqStr.slice(0, middleIndex) + "." + freqStr.slice(middleIndex);
  return formattedFreq;
}

export function isBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

export function processData(data) {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === "string" && isBase64(item)) {
        return atob(item).replace(/\0/g, "");
      } else if (typeof item === "number") {
        return item;
      } else {
        throw new Error(`Unexpected data type: ${typeof item}`);
      }
    });
  } else if (typeof data === "string" && isBase64(data)) {
    return atob(data).replace(/\0/g, "");
  } else if (typeof data === "number") {
    return data;
  } else {
    throw new Error(`Unexpected data type: ${typeof data}`);
  }
}
