/**
 * Data API helper
 *
 * NOTE: The legacy data API proxy (LLM_API_URL) has been removed.
 * This module now throws a clear error if called.
 * For external API calls, use fetch() directly with appropriate auth.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  throw new Error(
    "Data API proxy is not configured. The legacy proxy (LLM_API_URL) has been removed. " +
      "Use direct API calls with fetch() instead."
  );
}
