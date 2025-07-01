// // utils/pdfOCR.js
// import { getDocument } from 'pdfjs-dist';
// import { createCanvas } from 'canvas';
// import Tesseract from 'tesseract.js';

// export async function extractTextFromImagePDF(pdfBuffer) {
//   const loadingTask = getDocument({ data: pdfBuffer });
//   const pdf = await loadingTask.promise;

//   let fullText = '';
//   for (let i = 0; i < pdf.numPages; i++) {
//     const page = await pdf.getPage(i + 1);
//     const viewport = page.getViewport({ scale: 2.0 });
//     const canvas = createCanvas(viewport.width, viewport.height);
//     const context = canvas.getContext('2d');

//     const renderContext = { canvasContext: context, viewport };
//     await page.render(renderContext).promise;

//     const buffer = canvas.toBuffer('image/jpeg');
//     const { data: { text } } = await Tesseract.recognize(buffer, 'tam+eng');

//     fullText += text + '\n\n';
//   }

//   return fullText;
// }

// utils/pdfOCR.js

// utils/pdfOCR.js
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument } = pdfjsLib;

import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';
import { cleanTamilText } from './cleanTamilText.js';

const OCR_LANGUAGES = 'tam+eng'; // Tamil + English
const MAX_PAGES = 10;            // Limit pages for performance

export async function extractTextFromImagePDF(pdfBuffer) {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 0; i < Math.min(pdf.numPages, MAX_PAGES); i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({ canvasContext: context, viewport }).promise;

    const imageBuffer = canvas.toBuffer('image/jpeg');

    const {
      data: { text },
    } = await Tesseract.recognize(imageBuffer, OCR_LANGUAGES, {
      logger: m => console.log(`OCR Page ${i + 1}: ${m.status}`),
    });

    const cleanedText = cleanTamilText(text);
    fullText += cleanedText + '\n\n';
  }

  return fullText;
}

