// LoginForm.js - ENHANCED WITH SECURITY FEATURES

// ============================================
// SECURITY: Clear any leftover overlays on page load
// ============================================
(function() {
    window.addEventListener('load', function() {
        console.log('🔒 Clearing any leftover overlays and messages...');
        
        // Remove any success/logout overlays
        const overlays = document.querySelectorAll(
            '#thankYouOverlay, ' +
            '[id*="Overlay"], ' +
            '.custom-alert-overlay, ' +
            '[class*="overlay"]'
        );
        
        overlays.forEach(overlay => {
            console.log('🗑️ Removing overlay:', overlay.id || overlay.className);
            overlay.remove();
        });
        
        // Clear success/error messages
        const successMsg = document.getElementById('successMessage');
        const errorMsg = document.getElementById('errorMessage');
        
        if (successMsg) {
            successMsg.style.display = 'none';
            successMsg.textContent = '';
        }
        
        if (errorMsg) {
            errorMsg.style.display = 'none';
            errorMsg.textContent = '';
        }
        
        console.log('✅ Page cleanup complete');
    });
})();

// ============================================
// SECURITY: Prevent form autocomplete on focus
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // Clear fields on focus if they contain cached data
    if (usernameInput) {
        usernameInput.addEventListener('focus', function(e) {
            // Only clear if coming from browser cache (not user-typed)
            if (e.target.value && !e.target.dataset.userTyped) {
                e.target.value = '';
            }
        });
        
        usernameInput.addEventListener('input', function(e) {
            e.target.dataset.userTyped = 'true';
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('focus', function(e) {
            if (e.target.value && !e.target.dataset.userTyped) {
                e.target.value = '';
            }
        });
        
        passwordInput.addEventListener('input', function(e) {
            e.target.dataset.userTyped = 'true';
        });
    }
});

// ============================================
// LOGIN FORM HANDLER
// ============================================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const submitBtn = document.querySelector(".login-btn");
  const errorMessage = document.getElementById("errorMessage");

  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  if (!username || !password) {
    errorMessage.textContent = "Please enter both username and password.";
    errorMessage.style.display = "block";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    console.log('🔄 Attempting login...');
    const response = await apiClient.login(username, password);
    console.log('📥 Login response:', response);

    if (response.success) {
      console.log('✅ Login successful!');
      
      // CORRECTED: api-client spreads backend data directly into response (no .data nesting)
      // Backend sends: { success: true, token: "...", user: {...}, redirectPath: "..." }
      // api-client returns: { success: true, message: "...", token: "...", user: {...}, redirectPath: "..." }
      
      // Check if we have the token and user data
      if (!response.token || !response.user) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid server response. Please try again.');
      }
      
      // SECURITY: Store authentication data in sessionStorage (more secure)
      // sessionStorage is cleared when tab closes, localStorage persists
      apiClient.setToken(response.token);
      sessionStorage.setItem("user", JSON.stringify(response.user));
      sessionStorage.setItem("currentUser", JSON.stringify(response.user)); // For compatibility
      
      // Also store in localStorage for persistent sessions if needed
      // Comment these out if you want session to end when browser closes
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("currentUser", JSON.stringify(response.user));
      
      console.log('👤 User data:', response.user);
      console.log('🎭 User role:', response.user.role);

      // Show success message
      customAlert.success("Login successful!");

      // Handle password change requirement FIRST (takes priority)
      if (response.user.requirePasswordChange) {
        console.log('⚠️ Password change required - redirecting to change password page...');
        setTimeout(() => {
          console.log('🔄 Redirecting to change password');
          // SECURITY: Use replace() to prevent back button navigation
          window.location.replace("/ChangePassword.html");
        }, 1200);
        return;
      }

      // Use the redirect path provided by the backend (based on user role)
      const redirectPath = response.redirectPath;
      const userRole = response.user.role;
      
      console.log('🎯 User role:', userRole);
      console.log('🚀 Redirect path from backend:', redirectPath);

      // Validate that we received a valid redirect path
      if (!redirectPath) {
        console.error('❌ No redirect path received from backend!');
        throw new Error('Invalid role configuration. Please contact administrator.');
      }

      setTimeout(() => {
        console.log('✅ Redirecting to:', redirectPath);
        // SECURITY: Use replace() to prevent back button from returning to login page
        window.location.replace(redirectPath);
      }, 1200);
      return;
    }

    // If not successful
    throw new Error(response.message || response.error || "Invalid username or password.");
    
  } catch (error) {
    console.error("❌ Login error:", error);
    customAlert.error(error.message || "Login failed. Please check your credentials.");
    errorMessage.textContent = error.message || "Login failed. Please check your credentials.";
    errorMessage.style.display = "block";

    // SECURITY: Clear password field after failed login
    document.getElementById("password").value = "";

    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});

// ============================================
// FORGOT PASSWORD MODAL
// ============================================
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotModal = document.getElementById("forgotPasswordModal");
const closeModal = forgotModal.querySelector(".close");
const sendTempBtn = document.getElementById("sendTempPasswordBtn");
const fpMessage = document.getElementById("fpMessage");

forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  forgotModal.style.display = "block";
  fpMessage.textContent = "";
  fpMessage.style.color = "#000";
  document.getElementById("fpUsername").value = "";
  document.getElementById("fpEmail").value = "";
});

closeModal.addEventListener("click", () => forgotModal.style.display = "none");

window.addEventListener("click", (e) => {
  if (e.target === forgotModal) forgotModal.style.display = "none";
});

sendTempBtn.addEventListener("click", async () => {
  const username = document.getElementById("fpUsername").value.trim();
  const email = document.getElementById("fpEmail").value.trim();

  if (!username || !email) {
    fpMessage.style.color = "#b91c1c";
    fpMessage.textContent = "Please fill in all fields.";
    return;
  }

  sendTempBtn.disabled = true;
  sendTempBtn.textContent = "Sending...";

  try {
    const response = await apiClient.forgotPassword({ username, email });

    if (response.success) {
      fpMessage.style.color = "#16a34a";
      fpMessage.textContent = "Temporary password sent! Check your email.";
      document.getElementById("fpUsername").value = "";
      document.getElementById("fpEmail").value = "";
    } else {
      fpMessage.style.color = "#b91c1c";
      fpMessage.textContent = response.message || response.error || "Failed to send temporary password.";
    }
  } catch (err) {
    console.error(err);
    fpMessage.style.color = "#b91c1c";
    fpMessage.textContent = "Something went wrong. Please try again.";
  }

  sendTempBtn.disabled = false;
  sendTempBtn.textContent = "Send Temporary Password";
});
