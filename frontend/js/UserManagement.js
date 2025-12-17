// frontend/js/UserManagement.js - Professional Version

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 UserManagement.js loaded");
  
  // Load user profile first
  await loadUserProfile();
  
  // Setup profile dropdown after avatar is created
  setupProfileDropdown();
  
  // Load other components
  loadUsers();
  setupSearchFilter();
  setupFormSubmit();
  setupActionDelegation();
  setupModalHandling();
  
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
      console.log("🔔 Profile dropdown toggled");
    });

    document.addEventListener("click", (event) => {
      if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
        profileDropdown.classList.remove("show");
      }
    });
  }
}

// ========== LOAD USERS ==========
async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">Loading users...</td></tr>';

  try {
    const response = await apiClient.getAllUsers();
    if (response.success && response.data && response.data.length > 0) {
      displayUsers(response.data);
    } else {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">No users found</td></tr>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
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

// ========== SETUP FORM SUBMIT ==========
function setupFormSubmit() {
  const form = document.getElementById("createUserForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      username: document.getElementById("username").value.trim(),
      role: document.getElementById("role").value,
      department: document.getElementById("department").value.trim(),
      password: document.getElementById("temporaryPassword").value,
      requirePasswordChange: true
    };

    // Validation
    if (!formData.fullName || !formData.email || !formData.username || !formData.role || !formData.password) {
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
        
        if (typeof customAlert !== 'undefined') {
          customAlert.success(successMessage);
        } else {
          alert(successMessage);
        }
        
        closeCreateUserModal();
        form.reset();
        await loadUsers();
      } else {
        if (typeof customAlert !== 'undefined') {
          customAlert.error(response.message || "Failed to create user");
        } else {
          alert(response.message || "Failed to create user");
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      if (typeof customAlert !== 'undefined') {
        customAlert.error(error.message || "Failed to create user");
      } else {
        alert(error.message || "Failed to create user");
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
  }
}

function closeCreateUserModal() {
  const modal = document.getElementById("createUserModal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    const form = document.getElementById("createUserForm");
    if (form) form.reset();
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