// LoginForm.js - CORRECTED: Fixed token access and response handling

let isLoggingIn = false; // Prevent multiple submissions

// ---------------- Login ----------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Prevent multiple submissions
  if (isLoggingIn) {
    console.log('⚠️ Login already in progress...');
    return;
  }

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

  isLoggingIn = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    console.log('🔐 Attempting login...');
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
      
      // Save authentication data
      apiClient.setToken(response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("currentUser", JSON.stringify(response.user)); // For compatibility
      
      console.log('💾 User data:', response.user);
      console.log('🎭 User role:', response.user.role);

      // Show success message
      customAlert.success("Login successful!");

      // Handle password change requirement FIRST (takes priority)
      if (response.user.requirePasswordChange) {
        console.log('⚠️ Password change required - redirecting to change password page...');
        setTimeout(() => {
          console.log('➡️ Redirecting to change password');
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
        window.location.replace(redirectPath); // Use replace to prevent back button issues
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

    isLoggingIn = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});

// Reset login flag if user navigates away
window.addEventListener('beforeunload', () => {
  isLoggingIn = false;
});

// ---------------- Forgot Password ----------------
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
