/// <reference types="vite/client" />

/**
 * Typed declarations for the application's Vite environment variables.
 * Augmenting ImportMetaEnv here narrows each variable to `string | undefined`
 * so that `import.meta.env.*` accesses are never typed as `any`.
 */
interface ImportMetaEnv {
  readonly VITE_SPATIAL_API_BASE_URL: string | undefined;
  readonly VITE_SPATIAL_API_TIMEOUT_MS: string | undefined;
  readonly VITE_ENABLE_LOCAL_FALLBACK: string | undefined;
}
