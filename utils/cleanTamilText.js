// export function cleanTamilText(text) {
//   return text
//     .normalize("NFC")
//     .replace(/[^\u0B80-\u0BFF\s.,;:"'?!()\-]/g, '')
//     .replace(/\s{2,}/g, ' ')
//     .trim();
// }

// utils/cleanTamilText.js

export function cleanTamilText(text) {
  return text
    .replace(/[^\u0B80-\u0BFF\sA-Za-z0-9.,?!\-–“”"']/g, '') // keep Tamil + basic punctuation
    .replace(/\s+/g, ' ')  // normalize whitespace
    .trim();
}
