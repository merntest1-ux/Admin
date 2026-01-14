// ============================================
// AUTH GUARD - Prevents accessing pages after logout
// ============================================
// Place this script at the TOP of every authenticated page
// Include it BEFORE any other scripts that depend on user data

(function() {
  'use strict';
  
  // Check if user just logged out
  const justLoggedOut = sessionStorage.getItem('justLoggedOut');
  
  if (justLoggedOut === 'true') {
    // User just logged out, clear the flag and redirect
    sessionStorage.removeItem('justLoggedOut');
    window.location.replace('/pages/LoginForm.html');
    return;
  }
  
  // Check if user has valid authentication
  function isAuthenticated() {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('authToken');
    
    const user = localStorage.getItem('user') || 
                 localStorage.getItem('currentUser');
    
    return !!(token && user);
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    console.warn('⚠️ Unauthorized access detected - redirecting to login');
    window.location.replace('/pages/LoginForm.html');
    return;
  }
  
  // Prevent browser caching of authenticated pages
  window.addEventListener('pageshow', function(event) {
    // If page is loaded from cache (user pressed back button)
    if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
      // Check authentication again
      if (!isAuthenticated()) {
        console.warn('⚠️ Page loaded from cache but user not authenticated');
        window.location.replace('/pages/LoginForm.html');
      }
    }
  });
  
  // Add cache control headers via meta tags (belt and suspenders approach)
  if (!document.querySelector('meta[http-equiv="Cache-Control"]')) {
    const metaNoCache = document.createElement('meta');
    metaNoCache.httpEquiv = 'Cache-Control';
    metaNoCache.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(metaNoCache);
    
    const metaPragma = document.createElement('meta');
    metaPragma.httpEquiv = 'Pragma';
    metaPragma.content = 'no-cache';
    document.head.appendChild(metaPragma);
    
    const metaExpires = document.createElement('meta');
    metaExpires.httpEquiv = 'Expires';
    metaExpires.content = '0';
    document.head.appendChild(metaExpires);
  }
  
  console.log('✅ Auth guard active - page protected');
})();
