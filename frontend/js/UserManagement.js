// frontend/js/UserManagement.js - With Real-Time Duplicate Validation

let usersData = []; // Cache for all users
let debounceTimers = {}; // Debounce timers for validation

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚢 UserManagement.js loaded");
  
  // Load user profile first
  await loadUserProfile();
  
  // Setup profile dropdown after avatar is created
  setupProfileDropdown();
  
  // Load other components
  await loadUsers(); // ✅ Load users for duplicate checking
  setupSearchFilter();
  setupFormSubmit();
  setupActionDelegation();
  setupModalHandling();
  setupRoleBasedDepartments();
  setupPasswordToggle();
  setupRealtimeValidation(); // ✅ NEW: Real-time validation
  
  console.log("✅ User Management initialized successfully");
});

// ========== LOAD USER PROFILE ==========
async function loadUserProfile() {
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      // Generate avatar for profile button
      const profileButton = document.getElementById("profileButton");
      if (profileButton) {
        const fullName = userProfile.data.fullName || userProfile.data.username || "User";
        const initials = fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        
        // Create avatar div with new color palette
        profileButton.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1E4528 0%, #2d6640 100%);
            border-radius: 50%;
            font-size: 14px;
            font-weight: 700;
            color: white;
          ">
            ${initials}
          </div>
        `;
        profileButton.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          padding: 0;
          border: 2px solid rgba(30, 69, 40, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          background: none;
        `;
        
        console.log("✅ Avatar created with initials:", initials);
        
        // Hover effect
        profileButton.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.1)';
          this.style.borderColor = '#1E4528';
        });
        profileButton.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.borderColor = 'rgba(30, 69, 40, 0.3)';
        });
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    // Set default avatar if profile fails to load
    const profileButton = document.getElementById("profileButton");
    if (profileButton) {
      profileButton.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1E4528 0%, #2d6640 100%);
          border-radius: 50%;
          font-size: 14px;
          font-weight: 700;
          color: white;
        ">
          U
        </div>
      `;
      profileButton.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        padding: 0;
        border: 2px solid rgba(30, 69, 40, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        background: none;
      `;
    }
  }
}

// ========== SETUP PROFILE DROPDOWN ==========
function setupProfileDropdown() {
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
      console.log("🔽 Profile dropdown toggled");
    });

    document.addEventListener("click", (event) => {
      if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
        profileDropdown.classList.remove("show");
      }
    });
  }
}

// ========== SETUP REAL-TIME VALIDATION ==========
function setupRealtimeValidation() {
  const fullNameInput = document.getElementById("fullName");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");

  if (fullNameInput) {
    fullNameInput.addEventListener("input", (e) => {
      debounceValidation("fullName", () => {
        validateFullNameRealtime(e.target);
      });
    });

    fullNameInput.addEventListener("blur", () => {
      validateFullNameRealtime(fullNameInput);
    });
  }

  if (usernameInput) {
    usernameInput.addEventListener("input", (e) => {
      debounceValidation("username", () => {
        validateUsernameRealtime(e.target);
      });
    });

    usernameInput.addEventListener("blur", () => {
      validateUsernameRealtime(usernameInput);
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", (e) => {
      debounceValidation("email", () => {
        validateEmailRealtime(e.target);
      });
    });

    emailInput.addEventListener("blur", () => {
      validateEmailRealtime(emailInput);
    });
  }
}

// ========== DEBOUNCE HELPER ==========
function debounceValidation(fieldName, callback) {
  if (debounceTimers[fieldName]) {
    clearTimeout(debounceTimers[fieldName]);
  }
  
  debounceTimers[fieldName] = setTimeout(() => {
    callback();
  }, 300); // 300ms delay
}

// ========== VALIDATION: FULL NAME ==========
function validateFullNameRealtime(input) {
  const fullName = input.value.trim();
  const errorId = "fullName-error";
  
  // Clear validation if empty
  if (!fullName) {
    clearFieldError(input, errorId);
    return true;
  }

  // Check for duplicate full name (case-insensitive)
  const isDuplicate = usersData.some(user =>
    user.fullName && user.fullName.toLowerCase() === fullName.toLowerCase()
  );

  if (isDuplicate) {
    showFieldError(input, errorId, "Full name already exists");
    return false;
  } else {
    clearFieldError(input, errorId);
    return true;
  }
}

// ========== VALIDATION: USERNAME ==========
function validateUsernameRealtime(input) {
  const username = input.value.trim();
  const errorId = "username-error";
  
  // Clear validation if empty
  if (!username) {
    clearFieldError(input, errorId);
    return true;
  }

  // Check minimum length
  if (username.length < 3) {
    showFieldError(input, errorId, "Username must be at least 3 characters");
    return false;
  }

  // Check for duplicate username (case-insensitive)
  const isDuplicate = usersData.some(user =>
    user.username && user.username.toLowerCase() === username.toLowerCase()
  );

  if (isDuplicate) {
    showFieldError(input, errorId, "Username already exists");
    return false;
  } else {
    clearFieldError(input, errorId);
    return true;
  }
}

// ========== VALIDATION: EMAIL ==========
function validateEmailRealtime(input) {
  const email = input.value.trim();
  const errorId = "email-error";
  
  // Clear validation if empty
  if (!email) {
    clearFieldError(input, errorId);
    return true;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFieldError(input, errorId, "Invalid email format");
    return false;
  }

  // Check for duplicate email (case-insensitive)
  const isDuplicate = usersData.some(user =>
    user.email && user.email.toLowerCase() === email.toLowerCase()
  );

  if (isDuplicate) {
    showFieldError(input, errorId, "Email already exists");
    return false;
  } else {
    clearFieldError(input, errorId);
    return true;
  }
}

// ========== SHOW FIELD ERROR ==========
function showFieldError(input, errorId, message) {
  // Add error class to input
  input.classList.remove("success-field");
  input.classList.add("error-field");

  // Find or create error message element
  let errorElement = document.getElementById(errorId);
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = errorId;
    errorElement.className = "error-message";
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }

  // Update error message with icon
  errorElement.innerHTML = `
    <span class="material-symbols-outlined">error</span>
    <span>${message}</span>
  `;
  errorElement.style.display = "flex";
}

// ========== CLEAR FIELD ERROR ==========
function clearFieldError(input, errorId) {
  // Remove error class, add success class
  input.classList.remove("error-field");
  input.classList.add("success-field");

  // Hide error message
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.style.display = "none";
  }
}

// ========== SETUP ROLE-BASED DEPARTMENTS ==========
function setupRoleBasedDepartments() {
  const roleSelect = document.getElementById("role");
  const departmentSelect = document.getElementById("department");
  
  if (!roleSelect || !departmentSelect) return;
  
  // Define department options for each role
  const departmentsByRole = {
    'Teacher': [
      { value: 'Elementary', label: 'Elementary' },
      { value: 'Junior High School', label: 'Junior High School' },
      { value: 'Senior High School', label: 'Senior High School' }
    ],
    'Counselor': [
      { value: 'Counselor', label: 'Counselor' }
    ],
    'Admin': [
      { value: 'Admin', label: 'Admin' }
    ]
  };
  
  // Update departments when role changes
  roleSelect.addEventListener('change', (e) => {
    const selectedRole = e.target.value;
    
    // Clear current options
    departmentSelect.innerHTML = '<option value="">Select Department</option>';
    
    // Add role-specific departments
    if (selectedRole && departmentsByRole[selectedRole]) {
      departmentsByRole[selectedRole].forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.value;
        option.textContent = dept.label;
        departmentSelect.appendChild(option);
      });
      
      // If only one option, auto-select it
      if (departmentsByRole[selectedRole].length === 1) {
        departmentSelect.value = departmentsByRole[selectedRole][0].value;
      }
    }
  });
}

// ========== SETUP PASSWORD TOGGLE ==========
function setupPasswordToggle() {
  const toggleButton = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("temporaryPassword");
  
  if (!toggleButton || !passwordInput) return;
  
  toggleButton.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Toggle password visibility
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    
    // Toggle icon
    const icon = toggleButton.querySelector(".material-symbols-outlined");
    icon.textContent = type === "password" ? "visibility" : "visibility_off";
    
    // Update title
    toggleButton.title = type === "password" ? "Show password" : "Hide password";
  });
}

// ========== LOAD USERS ==========
async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">Loading users...</td></tr>';

  try {
    const response = await apiClient.getAllUsers();
    if (response.success && response.data && response.data.length > 0) {
      usersData = response.data; // ✅ Store users for validation
      displayUsers(response.data);
    } else {
      usersData = []; // ✅ Clear users if none found
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">No users found</td></tr>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
    usersData = []; // ✅ Clear users on error
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Failed to load users");
    }
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">Error loading users</td></tr>';
  }
}

// ========== DISPLAY USERS ==========
function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.username)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td><span class="badge badge-${(user.role || '').toLowerCase()}">${user.role}</span></td>
      <td>${escapeHtml(user.department || 'N/A')}</td>
      <td><span class="status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? '● Active' : '● Inactive'}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
      <td style="text-align: center;">
        <button 
          class="btn-action" 
          data-action="toggleStatus" 
          data-user-id="${user._id}" 
          data-current-status="${user.isActive}"
          title="${user.isActive ? 'Deactivate user' : 'Activate user'}"
          aria-label="${user.isActive ? 'Deactivate user' : 'Activate user'}">
          <span class="material-symbols-outlined">${user.isActive ? 'block' : 'check_circle'}</span>
        </button>
        <button 
          class="btn-action" 
          data-action="resetPassword" 
          data-user-id="${user._id}"
          title="Reset password"
          aria-label="Reset password">
          <span class="material-symbols-outlined">lock_reset</span>
        </button>
        <button 
          class="btn-action delete" 
          data-action="deleteUser" 
          data-user-id="${user._id}" 
          data-user-name="${escapeHtml(user.fullName)}"
          title="Delete user"
          aria-label="Delete user">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

// ========== ESCAPE HTML ==========
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ========== SETUP SEARCH FILTER ==========
function setupSearchFilter() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#usersTableBody tr");
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? "" : "none";
      });
    });
  }
}

// ========== PARSE ERROR MESSAGE FOR DUPLICATES ==========
function parseErrorMessage(errorMsg) {
  if (!errorMsg) return "Failed to create user";
  
  const lowerMsg = errorMsg.toLowerCase();
  
  // Check for specific duplicate errors with more patterns
  if (lowerMsg.includes('username')) {
    if (lowerMsg.includes('duplicate') || lowerMsg.includes('already exists') || 
        lowerMsg.includes('taken') || lowerMsg.includes('already in use') ||
        lowerMsg.includes('must be unique')) {
      return "Duplicate username: This username is already taken";
    }
  }
  
  if (lowerMsg.includes('email')) {
    if (lowerMsg.includes('duplicate') || lowerMsg.includes('already exists') || 
        lowerMsg.includes('taken') || lowerMsg.includes('already in use') ||
        lowerMsg.includes('must be unique')) {
      return "Duplicate email: This email address is already registered";
    }
  }
  
  // MongoDB duplicate key error pattern (E11000)
  if (lowerMsg.includes('e11000') || lowerMsg.includes('duplicate key')) {
    if (lowerMsg.includes('username')) {
      return "Duplicate username: This username is already taken";
    }
    if (lowerMsg.includes('email')) {
      return "Duplicate email: This email address is already registered";
    }
    return "Duplicate entry: This record already exists";
  }
  
  // Return original message if no specific duplicate found
  return errorMsg;
}

// ========== SETUP FORM SUBMIT ==========
function setupFormSubmit() {
  const form = document.getElementById("createUserForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const fullNameInput = document.getElementById("fullName");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");

    // ✅ Validate all fields before submission
    const isFullNameValid = validateFullNameRealtime(fullNameInput);
    const isUsernameValid = validateUsernameRealtime(usernameInput);
    const isEmailValid = validateEmailRealtime(emailInput);

    if (!isFullNameValid || !isUsernameValid || !isEmailValid) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Please fix the validation errors above before creating the user");
      } else {
        alert("Please fix the validation errors above before creating the user");
      }
      return;
    }

    const formData = {
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      username: usernameInput.value.trim(),
      role: document.getElementById("role").value,
      department: document.getElementById("department").value,
      password: document.getElementById("temporaryPassword").value,
      requirePasswordChange: true
    };

    // Validation
    if (!formData.fullName || !formData.email || !formData.username || !formData.role || !formData.department || !formData.password) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Please fill in all required fields");
      } else {
        alert("Please fill in all required fields");
      }
      return;
    }

    if (formData.password.length < 6) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Password must be at least 6 characters");
      } else {
        alert("Password must be at least 6 characters");
      }
      return;
    }

    try {
      const response = await apiClient.createUser(formData);
      if (response.success) {
        let successMessage = "User created successfully!";
        if (formData.role === 'Teacher') {
          successMessage += " This teacher is now available as an adviser.";
        }
        
        // Close modal first, then show success message
        closeCreateUserModal();
        form.reset();
        
        // Small delay to ensure modal closes before showing alert
        setTimeout(() => {
          if (typeof customAlert !== 'undefined') {
            customAlert.success(successMessage);
          } else {
            alert(successMessage);
          }
        }, 100);
        
        await loadUsers();
      } else {
        // Parse error message for specific duplicates
        const errorMessage = parseErrorMessage(response.message || response.error);
        
        if (typeof customAlert !== 'undefined') {
          customAlert.error(errorMessage);
        } else {
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Parse error message from exception
      const errorMessage = parseErrorMessage(error.message || error.toString());
      
      if (typeof customAlert !== 'undefined') {
        customAlert.error(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  });
}

// ========== MODAL FUNCTIONS ==========
function openCreateUserModal() {
  const modal = document.getElementById("createUserModal");
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    
    // ✅ Clear validation errors when opening modal
    const fullNameInput = document.getElementById("fullName");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    
    clearFieldError(fullNameInput, "fullName-error");
    clearFieldError(usernameInput, "username-error");
    clearFieldError(emailInput, "email-error");
  }
}

function closeCreateUserModal() {
  const modal = document.getElementById("createUserModal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    const form = document.getElementById("createUserForm");
    if (form) {
      form.reset();
      // Reset department dropdown to initial state
      const departmentSelect = document.getElementById("department");
      if (departmentSelect) {
        departmentSelect.innerHTML = '<option value="">Select Department</option>';
      }
      
      // ✅ Clear validation errors when closing modal
      const fullNameInput = document.getElementById("fullName");
      const usernameInput = document.getElementById("username");
      const emailInput = document.getElementById("email");
      
      clearFieldError(fullNameInput, "fullName-error");
      clearFieldError(usernameInput, "username-error");
      clearFieldError(emailInput, "email-error");
    }
  }
}

// Make functions globally available
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;

// ========== SETUP MODAL HANDLING ==========
function setupModalHandling() {
  const modal = document.getElementById("createUserModal");
  if (!modal) return;

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeCreateUserModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCreateUserModal();
    }
  });
}

// ========== SETUP ACTION DELEGATION ==========
function setupActionDelegation() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest(".btn-action");
    if (!btn) return;
    handleUserAction(btn);
  });
}

// ========== HANDLE USER ACTIONS ==========
async function handleUserAction(btn) {
  const action = btn.dataset.action;
  const userId = btn.dataset.userId;

  try {
    switch(action) {
      case "toggleStatus":
        await handleToggleStatus(btn, userId);
        break;

      case "resetPassword":
        await handleResetPassword(userId);
        break;

      case "deleteUser":
        await handleDeleteUser(btn, userId);
        break;
    }
  } catch (error) {
    console.error("Error handling action:", error);
    if (typeof customAlert !== 'undefined') {
      customAlert.error(error.message || "An unexpected error occurred");
    } else {
      alert(error.message || "An unexpected error occurred");
    }
  }
}

// ========== TOGGLE USER STATUS ==========
async function handleToggleStatus(btn, userId) {
  const currentStatus = btn.dataset.currentStatus === 'true';
  const statusAction = currentStatus ? "deactivate" : "activate";

  if (typeof customAlert !== 'undefined') {
    customAlert.confirm(
      `Are you sure you want to ${statusAction} this user?`,
      async () => {
        try {
          const response = await apiClient.toggleUserStatus(userId, !currentStatus);
          if (response.success) {
            customAlert.success(`User ${statusAction}d successfully`);
            await loadUsers();
          } else {
            customAlert.error(response.message || "Failed to update user status");
          }
        } catch (error) {
          customAlert.error("Error updating user status");
        }
      },
      "Confirm Action"
    );
  } else {
    if (confirm(`Are you sure you want to ${statusAction} this user?`)) {
      const response = await apiClient.toggleUserStatus(userId, !currentStatus);
      if (response.success) {
        alert(`User ${statusAction}d successfully`);
        await loadUsers();
      }
    }
  }
}

// ========== RESET PASSWORD ==========
async function handleResetPassword(userId) {
  const newPassword = prompt("Enter new temporary password (minimum 6 characters):");
  
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Password must be at least 6 characters");
    } else {
      alert("Password must be at least 6 characters");
    }
    return;
  }

  try {
    const resetResponse = await apiClient.adminResetPassword(userId, newPassword);
    if (resetResponse.success) {
      if (typeof customAlert !== 'undefined') {
        customAlert.success("Password reset successfully. User has been notified.");
      } else {
        alert("Password reset successfully");
      }
      await loadUsers();
    } else {
      if (typeof customAlert !== 'undefined') {
        customAlert.error(resetResponse.message || "Failed to reset password");
      } else {
        alert(resetResponse.message || "Failed to reset password");
      }
    }
  } catch (error) {
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Error resetting password");
    }
  }
}

// ========== DELETE USER ==========
async function handleDeleteUser(btn, userId) {
  const userName = btn.dataset.userName;

  if (typeof customAlert !== 'undefined') {
    customAlert.show({
      type: 'warning',
      title: 'Delete User',
      message: `Delete "${userName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const delResponse = await apiClient.deleteUser(userId);
          if (delResponse.success) {
            customAlert.success("User deleted successfully");
            await loadUsers();
          } else {
            customAlert.error(delResponse.message || "Failed to delete user");
          }
        } catch (error) {
          customAlert.error("Error deleting user");
        }
      }
    });
  } else {
    if (confirm(`Delete "${userName}"? This action cannot be undone.`)) {
      const delResponse = await apiClient.deleteUser(userId);
      if (delResponse.success) {
        alert("User deleted successfully");
        await loadUsers();
      } else {
        alert(delResponse.message || "Failed to delete user");
      }
    }
  }
}
