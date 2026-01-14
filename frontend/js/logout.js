// ============================================
// SECURE LOGOUT HANDLER - Enhanced Security
// ============================================

function handleLogout(event) {
  event.preventDefault();
  
  // Check if customAlert is loaded
  if (typeof customAlert === 'undefined') {
    console.error('customAlert not loaded yet');
    // Fallback to native confirm
    if (confirm('Are you sure you want to log out?')) {
      performSecureLogout();
    }
    return;
  }
  
  customAlert.confirm(
    "Are you sure you want to log out?",
    () => {
      // User clicked "Confirm" - perform secure logout
      performSecureLogout();
    },
    "Logout Confirmation"
  );
}

async function performSecureLogout() {
  try {
    // 1. Get token before clearing (for API call)
    const token = getSecureToken();
    
    // 2. Call backend logout API to invalidate token server-side
    if (token) {
      await invalidateTokenOnServer(token);
    }
    
    // 3. Clear all client-side data
    clearAllClientData();
    
    // 4. Show thank you message and redirect
    showThankYouAndRedirect();
    
  } catch (error) {
    console.error('Logout error:', error);
    // Even if server call fails, clear client data
    clearAllClientData();
    showThankYouAndRedirect();
  }
}

function getSecureToken() {
  try {
    // Try to get token from memory first (most secure)
    if (window.authToken) {
      return window.authToken;
    }
    
    // Fallback to storage (less secure but common)
    return localStorage.getItem('token') || 
           sessionStorage.getItem('token') || 
           sessionStorage.getItem('authToken') || 
           localStorage.getItem('authToken');
  } catch (e) {
    console.error('Error retrieving token:', e);
    return null;
  }
}

async function invalidateTokenOnServer(token) {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include' // Include cookies for session management
    });
    
    if (!response.ok) {
      console.warn('Server logout failed, proceeding with client cleanup');
    }
    
    return response;
  } catch (error) {
    console.error('Server logout error:', error);
    // Don't throw - we still want to clear client data
  }
}

function clearAllClientData() {
  try {
    // Clear all possible token storage locations
    const keysToRemove = [
      'token',
      'authToken',
      'accessToken',
      'refreshToken',
      'user',
      'userData',
      'session',
      'sessionId'
    ];
    
    // Clear localStorage
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage completely
    sessionStorage.clear();
    
    // Clear in-memory token
    if (window.authToken) {
      delete window.authToken;
    }
    
    // Clear any authentication cookies (if using cookies)
    clearAuthCookies();
    
    console.log('✅ All client data cleared');
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}

function clearAuthCookies() {
  // Clear common authentication cookie names
  const cookiesToClear = ['token', 'auth', 'session', 'jwt'];
  
  cookiesToClear.forEach(name => {
    // Set cookie to expire in the past
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  });
}

function showThankYouAndRedirect() {
  // Create thank you overlay
  const thankYouHTML = `
    <div id="thankYouOverlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    ">
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 40px 60px;
        border-radius: 16px;
        text-align: center;
        animation: scaleUp 0.5s ease;
        box-shadow: 0 20px 60px rgba(16, 185, 129, 0.3);
      ">
        <div style="
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.2);
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleUp 0.5s ease;
        ">
          <span style="color: #10b981; font-size: 50px; font-weight: bold;">✓</span>
        </div>
        <h2 style="color: #10b981; margin-bottom: 15px; font-size: 32px;">Thank You!</h2>
        <p style="color: #94a3b8; font-size: 18px; margin: 0;">You have been successfully logged out.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 10px;">Redirecting to login page...</p>
      </div>
    </div>
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleUp {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', thankYouHTML);
  
  // Redirect to login page after 2 seconds
  setTimeout(() => {
    // Use replace to prevent back button from returning to authenticated page
    window.location.replace('../../pages/LoginForm.html');
  }, 2000);
}

// ============================================
// SETUP LOGOUT HANDLERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔒 Secure logout handler initialized");
  
  // Wait a bit to ensure customAlert is loaded
  setTimeout(() => {
    // Find all logout links - multiple possible patterns
    const logoutSelectors = [
      'a[href="../../pages/LoginForm.html"]',
      'a[href="../pages/LoginForm.html"]',
      'a[href*="LoginForm.html"]'
    ];
    
    let logoutLinksFound = 0;
    
    logoutSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        // Check if it's a logout link (contains logout icon or text)
        const isLogoutLink = link.innerHTML.includes('logout') || 
                            link.textContent.toLowerCase().includes('logout');
        
        if (isLogoutLink) {
          console.log("✅ Logout link found and secure handler attached");
          link.addEventListener('click', handleLogout);
          logoutLinksFound++;
        }
      });
    });
    
    if (logoutLinksFound === 0) {
      console.warn("⚠️ No logout links found. Check your HTML structure.");
    }

  }, 100); // Small delay to ensure customAlert is loaded
});

// ============================================
// ADDITIONAL SECURITY: Auto-logout on tab close
// ============================================
window.addEventListener('beforeunload', function() {
  // Optional: Clear sensitive data when browser closes
  // Uncomment if you want to auto-clear on tab close
  // clearAllClientData();
});
