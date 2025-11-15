/**
 * Formats a frequency in Hz to a readable format with decimal point
 * @param freqHz - The frequency in Hz
 * @returns Formatted frequency string with decimal point
 */
export function formatFrequency(freqHz: number): string {
  const freqStr = freqHz.toString();
  const middleIndex = Math.floor(freqStr.length / 2);
  const formattedFreq = freqStr.slice(0, middleIndex) + "." + freqStr.slice(middleIndex);
  return formattedFreq;
}

/**
 * Checks if a string is Base64 encoded
 * @param str - The string to check
 * @returns True if the string is Base64 encoded, false otherwise
 */
export function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

/**
 * Processes data by decoding Base64 strings and cleaning null characters
 * @param data - The data to process (string, number, or array)
 * @returns Processed data
 */
export function processData(data: string | number | Array<string | number>): string | number | Array<string | number> {
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

