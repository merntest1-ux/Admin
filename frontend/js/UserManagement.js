// frontend/js/UserManagement.js - Archive Only System (No Delete)

let usersData = [];
let debounceTimers = {};
let currentFilter = 'active';

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 UserManagement.js loaded");
  
  await loadUserProfile();
  setupProfileDropdown();
  await loadUsers();
  setupSearchFilter();
  setupFormSubmit();
  setupActionDelegation();
  setupModalHandling();
  setupRoleBasedDepartments();
  setupPasswordToggle();
  setupRealtimeValidation();
  setupFilterTabs();
  
  console.log("✅ User Management initialized successfully");
});

// ========== SETUP FILTER TABS ==========
function setupFilterTabs() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      filterUsers(currentFilter);
    });
  });
}

// ========== FILTER USERS ==========
function filterUsers(filter) {
  const rows = document.querySelectorAll("#usersTableBody tr");
  
  rows.forEach(row => {
    const isArchived = row.dataset.archived === 'true';
    
    switch(filter) {
      case 'active':
        row.style.display = isArchived ? 'none' : '';
        break;
      case 'archived':
        row.style.display = isArchived ? '' : 'none';
        break;
      case 'all':
        row.style.display = '';
        break;
    }
  });
  
  updateFilterCounts();
}

// ========== UPDATE FILTER COUNTS ==========
function updateFilterCounts() {
  const activeCount = usersData.filter(u => !u.isArchived).length;
  const archivedCount = usersData.filter(u => u.isArchived).length;
  const allCount = usersData.length;
  
  const activeTab = document.querySelector('[data-filter="active"] .tab-count');
  const archivedTab = document.querySelector('[data-filter="archived"] .tab-count');
  const allTab = document.querySelector('[data-filter="all"] .tab-count');
  
  if (activeTab) activeTab.textContent = activeCount;
  if (archivedTab) archivedTab.textContent = archivedCount;
  if (allTab) allTab.textContent = allCount;
}

// ========== LOAD USER PROFILE ==========
async function loadUserProfile() {
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      const profileButton = document.getElementById("profileButton");
      if (profileButton) {
        const fullName = userProfile.data.fullName || userProfile.data.username || "User";
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        profileButton.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1E4528 0%, #2d6640 100%); border-radius: 50%; font-size: 14px; font-weight: 700; color: white;">
            ${initials}
          </div>
        `;
        profileButton.style.cssText = "width: 40px; height: 40px; border-radius: 50%; padding: 0; border: 2px solid rgba(30, 69, 40, 0.3); cursor: pointer; transition: all 0.3s ease; background: none;";
        
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
      debounceValidation("fullName", () => validateFullNameRealtime(e.target));
    });
    fullNameInput.addEventListener("blur", () => validateFullNameRealtime(fullNameInput));
  }

  if (usernameInput) {
    usernameInput.addEventListener("input", (e) => {
      debounceValidation("username", () => validateUsernameRealtime(e.target));
    });
    usernameInput.addEventListener("blur", () => validateUsernameRealtime(usernameInput));
  }

  if (emailInput) {
    emailInput.addEventListener("input", (e) => {
      debounceValidation("email", () => validateEmailRealtime(e.target));
    });
    emailInput.addEventListener("blur", () => validateEmailRealtime(emailInput));
  }
}

function debounceValidation(fieldName, callback) {
  if (debounceTimers[fieldName]) clearTimeout(debounceTimers[fieldName]);
  debounceTimers[fieldName] = setTimeout(callback, 300);
}

function validateFullNameRealtime(input) {
  const fullName = input.value.trim();
  const errorId = "fullName-error";
  
  if (!fullName) {
    clearFieldError(input, errorId);
    return true;
  }

  const isDuplicate = usersData.some(user => !user.isArchived && user.fullName && user.fullName.toLowerCase() === fullName.toLowerCase());

  if (isDuplicate) {
    showFieldError(input, errorId, "Full name already exists");
    return false;
  } else {
    clearFieldError(input, errorId);
    return true;
  }
}

function validateUsernameRealtime(input) {
  const username = input.value.trim();
  const errorId = "username-error";
  
  if (!username) {
    clearFieldError(input, errorId);
    return true;
  }

  if (username.length < 3) {
    showFieldError(input, errorId, "Username must be at least 3 characters");
    return false;
  }

  const isDuplicate = usersData.some(user => !user.isArchived && user.username && user.username.toLowerCase() === username.toLowerCase());

  if (isDuplicate) {
    showFieldError(input, errorId, "Username already exists");
    return false;
  } else {
    clearFieldError(input, errorId);
    return true;
  }
}

function validateEmailRealtime(input) {
  const email = input.value.trim();
  const errorId = "email-error";
  
  if (!email) {
    clearFieldError(input, errorId);
    return true;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFieldError(input, errorId, "Invalid email format");
    return false;
  }

  const isDuplicate = usersData.some(user => !user.isArchived && user.email && user.email.toLowerCase() === email.toLowerCase());

  if (isDuplicate) {
    showFieldError(input, errorId, "Email already exists");
    return false;
  } else {
    clearFieldError(input, errorId);
    return true;
  }
}

function showFieldError(input, errorId, message) {
  input.classList.remove("success-field");
  input.classList.add("error-field");

  let errorElement = document.getElementById(errorId);
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = errorId;
    errorElement.className = "error-message";
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }

  errorElement.innerHTML = `<span class="material-symbols-outlined">error</span><span>${message}</span>`;
  errorElement.style.display = "flex";
}

function clearFieldError(input, errorId) {
  input.classList.remove("error-field");
  input.classList.add("success-field");

  const errorElement = document.getElementById(errorId);
  if (errorElement) errorElement.style.display = "none";
}

// ========== SETUP ROLE-BASED DEPARTMENTS ==========
function setupRoleBasedDepartments() {
  const roleSelect = document.getElementById("role");
  const departmentSelect = document.getElementById("department");
  
  if (!roleSelect || !departmentSelect) return;
  
  const departmentsByRole = {
    'Teacher': [
      { value: 'Elementary', label: 'Elementary' },
      { value: 'Junior High School', label: 'Junior High School' },
      { value: 'Senior High School', label: 'Senior High School' }
    ],
    'Counselor': [{ value: 'Counselor', label: 'Counselor' }],
    'Admin': [{ value: 'Admin', label: 'Admin' }]
  };
  
  roleSelect.addEventListener('change', (e) => {
    const selectedRole = e.target.value;
    departmentSelect.innerHTML = '<option value="">Select Department</option>';
    
    if (selectedRole && departmentsByRole[selectedRole]) {
      departmentsByRole[selectedRole].forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.value;
        option.textContent = dept.label;
        departmentSelect.appendChild(option);
      });
      
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
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    
    const icon = toggleButton.querySelector(".material-symbols-outlined");
    icon.textContent = type === "password" ? "visibility" : "visibility_off";
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
      usersData = response.data;
      displayUsers(response.data);
      updateFilterCounts();
      filterUsers(currentFilter);
    } else {
      usersData = [];
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">No users found</td></tr>';
      updateFilterCounts();
    }
  } catch (error) {
    console.error("Error loading users:", error);
    usersData = [];
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Failed to load users");
    }
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem;">Error loading users</td></tr>';
    updateFilterCounts();
  }
}

// ========== DISPLAY USERS - NO DELETE BUTTON ==========
function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = users.map(user => `
    <tr class="${user.isArchived ? 'archived-row' : ''}" data-archived="${user.isArchived || false}">
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.username)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td><span class="badge badge-${(user.role || '').toLowerCase()} ${user.isArchived ? 'badge-archived' : ''}">${user.role}</span></td>
      <td>${escapeHtml(user.department || 'N/A')}</td>
      <td>
        ${user.isArchived 
          ? '<span class="status-archived">● Archived</span>' 
          : `<span class="status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? '● Active' : '● Inactive'}</span>`
        }
      </td>
      <td>${new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
      <td style="text-align: center;">
        ${!user.isArchived ? `
          <button 
            class="btn-action" 
            data-action="toggleStatus" 
            data-user-id="${user._id}" 
            data-current-status="${user.isActive}"
            title="${user.isActive ? 'Deactivate user' : 'Activate user'}">
            <span class="material-symbols-outlined">${user.isActive ? 'block' : 'check_circle'}</span>
          </button>
          <button 
            class="btn-action" 
            data-action="resetPassword" 
            data-user-id="${user._id}"
            title="Reset password">
            <span class="material-symbols-outlined">lock_reset</span>
          </button>
          <button 
            class="btn-action archive" 
            data-action="archiveUser" 
            data-user-id="${user._id}" 
            data-user-name="${escapeHtml(user.fullName)}"
            title="Archive user">
            <span class="material-symbols-outlined">archive</span>
          </button>
        ` : `
          <button 
            class="btn-action restore" 
            data-action="restoreUser" 
            data-user-id="${user._id}" 
            data-user-name="${escapeHtml(user.fullName)}"
            title="Restore user">
            <span class="material-symbols-outlined">unarchive</span>
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

function escapeHtml(text) {
  const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
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
        const matchesSearch = text.includes(term);
        const isArchived = row.dataset.archived === 'true';
        
        let shouldShow = matchesSearch;
        
        if (currentFilter === 'active') {
          shouldShow = shouldShow && !isArchived;
        } else if (currentFilter === 'archived') {
          shouldShow = shouldShow && isArchived;
        }
        
        row.style.display = shouldShow ? "" : "none";
      });
    });
  }
}

function parseErrorMessage(errorMsg) {
  if (!errorMsg) return "Failed to create user";
  
  const lowerMsg = errorMsg.toLowerCase();
  
  if (lowerMsg.includes('username') && (lowerMsg.includes('duplicate') || lowerMsg.includes('already exists'))) {
    return "Duplicate username: This username is already taken";
  }
  
  if (lowerMsg.includes('email') && (lowerMsg.includes('duplicate') || lowerMsg.includes('already exists'))) {
    return "Duplicate email: This email address is already registered";
  }
  
  if (lowerMsg.includes('e11000') || lowerMsg.includes('duplicate key')) {
    if (lowerMsg.includes('username')) return "Duplicate username: This username is already taken";
    if (lowerMsg.includes('email')) return "Duplicate email: This email address is already registered";
    return "Duplicate entry: This record already exists";
  }
  
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

    const isFullNameValid = validateFullNameRealtime(fullNameInput);
    const isUsernameValid = validateUsernameRealtime(usernameInput);
    const isEmailValid = validateEmailRealtime(emailInput);

    if (!isFullNameValid || !isUsernameValid || !isEmailValid) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Please fix the validation errors");
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

    if (!formData.fullName || !formData.email || !formData.username || !formData.role || !formData.department || !formData.password) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Please fill in all required fields");
      }
      return;
    }

    if (formData.password.length < 6) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Password must be at least 6 characters");
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
        
        closeCreateUserModal();
        form.reset();
        
        setTimeout(() => {
          if (typeof customAlert !== 'undefined') {
            customAlert.success(successMessage);
          }
        }, 100);
        
        await loadUsers();
      } else {
        const errorMessage = parseErrorMessage(response.message || response.error);
        if (typeof customAlert !== 'undefined') {
          customAlert.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = parseErrorMessage(error.message || error.toString());
      if (typeof customAlert !== 'undefined') {
        customAlert.error(errorMessage);
      }
    }
  });
}

function openCreateUserModal() {
  const modal = document.getElementById("createUserModal");
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    
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
      const departmentSelect = document.getElementById("department");
      if (departmentSelect) {
        departmentSelect.innerHTML = '<option value="">Select Department</option>';
      }
      
      const fullNameInput = document.getElementById("fullName");
      const usernameInput = document.getElementById("username");
      const emailInput = document.getElementById("email");
      
      clearFieldError(fullNameInput, "fullName-error");
      clearFieldError(usernameInput, "username-error");
      clearFieldError(emailInput, "email-error");
    }
  }
}

window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;

function setupModalHandling() {
  const modal = document.getElementById("createUserModal");
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeCreateUserModal();
    }
  });

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

// ========== HANDLE USER ACTIONS - NO DELETE ==========
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
      case "archiveUser":
        await handleArchiveUser(btn, userId);
        break;
      case "restoreUser":
        await handleRestoreUser(btn, userId);
        break;
    }
  } catch (error) {
    console.error("Error handling action:", error);
    if (typeof customAlert !== 'undefined') {
      customAlert.error(error.message || "An unexpected error occurred");
    }
  }
}

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
  }
}

async function handleResetPassword(userId) {
  const newPassword = prompt("Enter new temporary password (minimum 6 characters):");
  
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Password must be at least 6 characters");
    }
    return;
  }

  try {
    const resetResponse = await apiClient.adminResetPassword(userId, newPassword);
    if (resetResponse.success) {
      if (typeof customAlert !== 'undefined') {
        customAlert.success("Password reset successfully. User has been notified.");
      }
      await loadUsers();
    } else {
      if (typeof customAlert !== 'undefined') {
        customAlert.error(resetResponse.message || "Failed to reset password");
      }
    }
  } catch (error) {
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Error resetting password");
    }
  }
}

// ========== ARCHIVE USER (REPLACES DELETE) ==========
async function handleArchiveUser(btn, userId) {
  const userName = btn.dataset.userName;

  if (typeof customAlert !== 'undefined') {
    customAlert.show({
      type: 'warning',
      title: 'Archive User',
      message: `Archive "${userName}"? The user will be hidden but data will be preserved and can be restored later.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await apiClient.archiveUser(userId);
          if (response.success) {
            customAlert.success("User archived successfully");
            await loadUsers();
          } else {
            customAlert.error(response.message || "Failed to archive user");
          }
        } catch (error) {
          customAlert.error("Error archiving user");
        }
      }
    });
  }
}

// ========== RESTORE USER ==========
async function handleRestoreUser(btn, userId) {
  const userName = btn.dataset.userName;

  if (typeof customAlert !== 'undefined') {
    customAlert.confirm(
      `Restore "${userName}"? This will make the user active again.`,
      async () => {
        try {
          const response = await apiClient.restoreUser(userId);
          if (response.success) {
            customAlert.success("User restored successfully");
            await loadUsers();
          } else {
            customAlert.error(response.message || "Failed to restore user");
          }
        } catch (error) {
          customAlert.error("Error restoring user");
        }
      },
      "Confirm Restore"
    );
  }
}
