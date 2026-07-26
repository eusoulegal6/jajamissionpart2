// Polyfill for Promise.withResolvers (needed by react-pdf)
type PromiseWithResolversResult<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

const PromiseWithResolvers = Promise as PromiseConstructor & {
  withResolvers?: <T>() => PromiseWithResolversResult<T>;
};

if (!PromiseWithResolvers.withResolvers) {
  PromiseWithResolvers.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Polyfill for URL.parse (needed by react-pdf)
const URLWithParse = URL as typeof URL & {
  parse?: (input: string | URL, base?: string | URL) => URL | null;
};

if (!URLWithParse.parse) {
  URLWithParse.parse = function (input: string | URL, base?: string | URL): URL | null {
    try {
      return new URL(input as string, base as string | undefined);
    } catch {
      return null;
    }
  };
}


import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./pwa/register-sw";
import { installDomMutationSafety } from "./lib/domMutationSafety";



// Set document title
document.title = "Fluency Voyage";

installDomMutationSafety();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
