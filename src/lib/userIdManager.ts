const USER_ID_KEY = 'userId';
export const getUserId = (): string => {
  // Check if userId exists in localStorage
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // Generate new unique ID using crypto.randomUUID()
    userId = crypto.randomUUID();
    
    // Save to localStorage
    localStorage.setItem(USER_ID_KEY, userId);
    
    console.log('New userId generated:', userId);
  }
  
  return userId;
};

/**
 * Reset user ID (for testing or logout scenarios)
 */
export const resetUserId = (): void => {
  localStorage.removeItem(USER_ID_KEY);
};
