/**
 * MUI Theme Type Augmentation
 * Extends MUI's type definitions to include additional palette properties
 */

import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface PaletteColor {
        darker?: string;
    }

    interface SimplePaletteColorOptions {
        darker?: string;
    }
}

// Vite environment variables
declare module 'vite/client' {
    interface ImportMetaEnv {
        readonly VITE_API_EXPORTER_PORTAL?: string;
        readonly VITE_API_COMMERCIAL_BANK?: string;
        readonly VITE_API_NATIONAL_BANK?: string;
        readonly VITE_API_ECTA?: string;
        readonly VITE_API_CUSTOM_AUTHORITIES?: string;
        readonly VITE_API_ECX?: string;
        readonly VITE_API_SHIPPING_LINE?: string;
        readonly DEV?: boolean;
        readonly PROD?: boolean;
        readonly MODE?: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}
