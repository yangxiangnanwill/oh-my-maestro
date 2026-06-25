/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV_SERVER_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace React {
  interface WebViewHTMLAttributes<T> extends React.HTMLAttributes<T> {
    src?: string;
    preload?: string;
  }
}
