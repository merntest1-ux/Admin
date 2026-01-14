// ============================================
// SECURE LOGOUT HANDLER - Enhanced Security
// ============================================

function handleLogout(event) {
  event.preventDefault();
  
  if (typeof customAlert === 'undefined') {
    console.error('customAlert not loaded yet');
    if (confirm('Are you sure you want to log out?')) {
      performSecureLogout();
    }
    return;
  }
  
  customAlert.confirm(
    "Are you sure you want to log out?",
    () => {
      performSecureLogout();
    },
    "Logout Confirmation"
  );
}

async function performSecureLogout() {
  try {
    const token = getSecureToken();
    
    if (token) {
      await invalidateTokenOnServer(token);
    }
    
    clearAllClientData();
    showThankYouAndRedirect();
    
  } catch (error) {
    console.error('Logout error:', error);
    clearAllClientData();
    showThankYouAndRedirect();
  }
}

function getSecureToken() {
  try {
    if (window.authToken) {
      return window.authToken;
    }
    
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
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn('Server logout failed, proceeding with client cleanup');
    }
    
    return response;
  } catch (error) {
    console.error('Server logout error:', error);
  }
}

function clearAllClientData() {
  try {
    // ✅ FIXED: Set logout flag BEFORE clearing storage
    sessionStorage.setItem('justLoggedOut', 'true');
    
    const keysToRemove = [
      'token',
      'authToken',
      'accessToken',
      'refreshToken',
      'user',
      'userData',
      'session',
      'sessionId',
      'currentUser'
    ];
    
    // Clear localStorage
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage (except justLoggedOut flag)
    const logoutFlag = sessionStorage.getItem('justLoggedOut');
    sessionStorage.clear();
    sessionStorage.setItem('justLoggedOut', logoutFlag);
    
    // Clear in-memory token
    if (window.authToken) {
      delete window.authToken;
    }
    
    clearAuthCookies();
    
    console.log('✅ All client data cleared');
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}

function clearAuthCookies() {
  const cookiesToClear = ['token', 'auth', 'session', 'jwt'];
  
  cookiesToClear.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  });
}

function showThankYouAndRedirect() {
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
  
  setTimeout(() => {
    window.location.replace('/pages/LoginForm.html');
  }, 2000);
}

// ============================================
// SETUP LOGOUT HANDLERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔒 Secure logout handler initialized");
  
  setTimeout(() => {
    const logoutSelectors = [
      'a[href="../../pages/LoginForm.html"]',
      'a[href="../pages/LoginForm.html"]',
      'a[href*="LoginForm.html"]'
    ];
    
    let logoutLinksFound = 0;
    
    logoutSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
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

  }, 100);
});
