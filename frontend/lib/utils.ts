import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetch with retry functionality
 * @param url URL to fetch
 * @param options Fetch options
 * @param maxRetries Maximum number of retries
 * @param retryDelay Delay between retries in ms
 * @returns Promise with fetch response
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // If response is not ok, throw an error to trigger retry
      if (!response.ok && response.status !== 404) { // Don't retry 404s
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      if (retries < maxRetries) {
        // Calculate exponential backoff with jitter
        const delay = retryDelay * Math.pow(2, retries - 1) + Math.random() * 500;
        console.log(`Retry ${retries}/${maxRetries} for ${url}, waiting ${Math.round(delay)}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
