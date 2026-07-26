// PDF.js worker wrapper with required polyfills for environments missing modern APIs
// This file runs inside the Worker context.

// Polyfill: Promise.withResolvers
if (!(Promise).withResolvers) {
  // @ts-ignore - augmenting Promise at runtime for environments that lack withResolvers
  (Promise).withResolvers = function () {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // @ts-ignore
    return { promise, resolve, reject };
  };
}

// Optional: URL.parse polyfill (used by some PDF.js internals)
// @ts-ignore - URL.parse is non-standard but used conditionally
if (!(URL).parse) {
  // @ts-ignore
  (URL).parse = function (input, base) {
    try {
      return new URL(input, base);
    } catch {
      return null;
    }
  };
}

// Import the actual PDF.js worker (module build)
import 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
