// Polyfills needed by react-pdf / pdfjs in some environments
// Ensures Promise.withResolvers exists before react-pdf is evaluated
if (!(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject } as const;
  };
}

// Optional: URL.parse polyfill used in some PDF.js paths
if (!(URL as any).parse) {
  (URL as any).parse = function (input: string | URL, base?: string | URL): URL | null {
    try {
      return new URL(input as string, base as string | undefined);
    } catch {
      return null;
    }
  };
}
