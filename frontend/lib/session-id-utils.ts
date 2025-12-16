/**
 * Session ID Utilities
 * Centralized session ID validation, generation, and management
 * Prevents the 'null' string corruption issue
 */

export interface SessionIdValidationResult {
  isValid: boolean;
  sessionId: string;
  reason?: string;
  wasGenerated?: boolean;
}

/**
 * Comprehensive session ID validation
 */
export function validateSessionId(sessionId: string | null | undefined): boolean {
  // Check for null, undefined, or empty values
  if (!sessionId) {
    return false;
  }
  
  // Check for string representations of null/undefined
  if (sessionId === 'null' || sessionId === 'undefined') {
    return false;
  }
  
  // Check for empty or whitespace-only strings
  if (sessionId.trim() === '') {
    return false;
  }
  
  // FIXED: Accept both UUID format and our emergency format
  // UUID format: 8-4-4-4-12 characters (36 total with hyphens)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(sessionId)) {
    console.log('[SessionUtils] Valid UUID format session ID:', sessionId);
    return true;
  }
  
  // Our emergency format: prefix-timestamp-random-random-random
  if (sessionId.includes('-') && sessionId.length > 20) {
    console.log('[SessionUtils] Valid emergency format session ID:', sessionId);
    return true;
  }
  
  // Check minimum length (should be substantial for security)
  if (sessionId.length < 10) {
    return false;
  }
  
  // Check for obviously invalid patterns
  if (sessionId.startsWith('null') || sessionId.startsWith('undefined')) {
    return false;
  }
  
  console.log('[SessionUtils] Session ID passed basic validation:', sessionId);
  return true;
}

/**
 * Generate a robust, unique session ID
 */
export function generateSessionId(prefix: string = 'session'): string {
  const timestamp = Date.now();
  const randomPart1 = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  const randomPart3 = Math.random().toString(36).substring(2, 8);
  
  // Create a robust session ID with multiple entropy sources
  const sessionId = `${prefix}-${timestamp}-${randomPart1}-${randomPart2}-${randomPart3}`;
  
  // Double-check the generated ID is valid
  if (!validateSessionId(sessionId)) {
    console.error('[SessionUtils] Generated invalid session ID, retrying...');
    // Fallback generation
    return `emergency-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${Math.floor(Math.random() * 1000000)}`;
  }
  
  return sessionId;
}

/**
 * Ensure a session ID is valid, generating a new one if needed
 */
export function ensureValidSessionId(
  sessionId: string | null | undefined,
  prefix: string = 'session'
): SessionIdValidationResult {
  console.log('[SessionUtils] Validating session ID:', {
    sessionId,
    type: typeof sessionId,
    length: sessionId?.length,
    isNull: sessionId === null,
    isNullString: sessionId === 'null',
    isUndefinedString: sessionId === 'undefined'
  });
  
  // If valid, return as-is
  if (validateSessionId(sessionId)) {
    return {
      isValid: true,
      sessionId: sessionId!,
      reason: 'valid'
    };
  }
  
  // Determine the reason for invalidity
  let reason = 'unknown';
  if (!sessionId) {
    reason = 'missing';
  } else if (sessionId === 'null') {
    reason = 'null_string';
  } else if (sessionId === 'undefined') {
    reason = 'undefined_string';
  } else if (sessionId.trim() === '') {
    reason = 'empty_string';
  } else if (sessionId.length < 10) {
    reason = 'too_short';
  }
  
  console.warn('[SessionUtils] Invalid session ID detected:', {
    original: sessionId,
    reason,
    generating: true
  });
  
  // Generate a new valid session ID
  const newSessionId = generateSessionId(prefix);
  
  console.log('[SessionUtils] Generated new session ID:', {
    original: sessionId,
    new: newSessionId,
    reason
  });
  
  return {
    isValid: false,
    sessionId: newSessionId,
    reason,
    wasGenerated: true
  };
}

/**
 * Extract session ID from URL search params with validation
 */
export function extractSessionIdFromParams(
  searchParams: URLSearchParams | null,
  paramNames: string[] = ['sessionId', 'session']
): SessionIdValidationResult {
  console.log('[SessionUtils] Extracting session ID from params:', {
    searchParams: searchParams?.toString(),
    paramNames
  });
  
  if (!searchParams) {
    console.warn('[SessionUtils] No search params provided');
    return ensureValidSessionId(null, 'extracted');
  }
  
  // Try each parameter name
  for (const paramName of paramNames) {
    const sessionId = searchParams.get(paramName);
    console.log(`[SessionUtils] Checking param '${paramName}':`, {
      value: sessionId,
      type: typeof sessionId,
      isNull: sessionId === null,
      isNullString: sessionId === 'null'
    });
    
    if (sessionId) {
      // FIXED: Direct validation instead of ensureValidSessionId to avoid generating new IDs
      if (validateSessionId(sessionId)) {
        console.log(`[SessionUtils] Found valid session ID in param '${paramName}':`, sessionId);
        return {
          isValid: true,
          sessionId: sessionId,
          reason: 'from_url_params'
        };
      } else {
        console.warn(`[SessionUtils] Invalid session ID in param '${paramName}':`, {
          value: sessionId,
          reason: 'failed_validation'
        });
      }
    }
  }
  
  // No valid session ID found in any parameter
  console.warn('[SessionUtils] No valid session ID found in any parameter');
  return ensureValidSessionId(null, 'extracted');
}

/**
 * Store session ID in localStorage with validation
 */
export function storeSessionId(sessionId: string, key: string = 'mobileSessionId'): boolean {
  if (!validateSessionId(sessionId)) {
    console.error('[SessionUtils] Attempted to store invalid session ID:', sessionId);
    return false;
  }
  
  try {
    localStorage.setItem(key, sessionId);
    
    // Immediate verification
    const stored = localStorage.getItem(key);
    if (stored !== sessionId) {
      console.error('[SessionUtils] Storage verification failed:', {
        intended: sessionId,
        stored,
        match: stored === sessionId
      });
      return false;
    }
    
    console.log('[SessionUtils] Session ID stored successfully:', sessionId);
    return true;
  } catch (error) {
    console.error('[SessionUtils] Failed to store session ID:', error);
    return false;
  }
}

/**
 * Retrieve session ID from localStorage with validation
 */
export function retrieveSessionId(key: string = 'mobileSessionId'): SessionIdValidationResult {
  try {
    const sessionId = localStorage.getItem(key);
    console.log('[SessionUtils] Retrieved session ID from localStorage:', {
      key,
      sessionId,
      type: typeof sessionId
    });
    
    return ensureValidSessionId(sessionId, 'retrieved');
  } catch (error) {
    console.error('[SessionUtils] Failed to retrieve session ID:', error);
    return ensureValidSessionId(null, 'retrieved');
  }
}

/**
 * Clear all session-related data from localStorage
 */
export function clearSessionData(): void {
  console.log('[SessionUtils] Clearing all session data from localStorage');
  
  const sessionKeys = [
    'mobileSessionId',
    'mobile-session-id',
    'sessionId',
    'session'
  ];
  
  // Clear specific known keys
  sessionKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`[SessionUtils] Cleared localStorage key: ${key}`);
    } catch (error) {
      console.warn(`[SessionUtils] Failed to clear key ${key}:`, error);
    }
  });
  
  // Clear any other session-related keys
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.toLowerCase().includes('session') || key.toLowerCase().includes('mobile')) {
        localStorage.removeItem(key);
        console.log(`[SessionUtils] Cleared additional session key: ${key}`);
      }
    });
  } catch (error) {
    console.warn('[SessionUtils] Failed to clear additional session keys:', error);
  }
}

/**
 * Initialize session ID with comprehensive fallback logic
 */
export function initializeSessionId(
  searchParams: URLSearchParams | null,
  storageKey: string = 'mobileSessionId',
  prefix: string = 'mobile'
): SessionIdValidationResult {
  console.log('[SessionUtils] Initializing session ID with comprehensive fallback');
  
  // Step 1: Try to extract from URL parameters
  const urlResult = extractSessionIdFromParams(searchParams);
  if (urlResult.isValid) {
    console.log('[SessionUtils] Using valid session ID from URL');
    storeSessionId(urlResult.sessionId, storageKey);
    return urlResult;
  }
  
  // Step 2: Try to retrieve from localStorage
  const storageResult = retrieveSessionId(storageKey);
  if (storageResult.isValid) {
    console.log('[SessionUtils] Using valid session ID from localStorage');
    return storageResult;
  }
  
  // Step 3: Generate a new session ID
  console.log('[SessionUtils] Generating new session ID as fallback');
  const newSessionId = generateSessionId(prefix);
  storeSessionId(newSessionId, storageKey);
  
  return {
    isValid: true,
    sessionId: newSessionId,
    reason: 'generated_fallback',
    wasGenerated: true
  };
}
