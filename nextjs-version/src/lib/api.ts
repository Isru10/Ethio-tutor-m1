/**
 * Single source of truth for the backend API base URL.
 * In development: http://localhost:5000/api/v1
 * In production:  set NEXT_PUBLIC_API_URL in Vercel environment variables
 *                 e.g. https://ethiotutor-api.onrender.com/api/v1
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
