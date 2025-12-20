/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_EXPORTER_PORTAL: string;
  readonly VITE_API_COMMERCIAL_BANK: string;
  readonly VITE_API_NATIONAL_BANK: string;
  readonly VITE_API_ECTA: string;
  readonly VITE_API_CUSTOM_AUTHORITIES: string;
  readonly VITE_API_ECX: string;
  readonly VITE_API_SHIPPING_LINE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
