// StudentSubmissions.js - Handle student self-report submissions

// Store loaded categories for validation
let availableCategories = [];

// ====================================
// NO SHOW CONFIGURATION
// ====================================
const NO_SHOW_DAYS_LIMIT = 3; // Days before marking as "No Show"

// ====================================
// NAVIGATION & PROFILE FUNCTIONS
// ====================================

// Highlight active nav item
function initializeNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    if (itemHref === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Profile dropdown functionality
function initializeProfileDropdown() {
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    window.addEventListener("click", (event) => {
      if (!event.target.closest("#profileDropdown")) {
        profileDropdown.classList.remove("show");
      }
    });
  }
}

// Load user profile and display in header
async function loadUserProfile() {
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      const profileButton = document.getElementById("profileButton");
      if (profileButton) {
        const fullName = userProfile.data.fullName || userProfile.data.username || "User";
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        profileButton.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: 2px solid rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        `;
        profileButton.textContent = initials;
        
        profileButton.addEventListener('mouseenter', () => {
          profileButton.style.transform = 'scale(1.1)';
          profileButton.style.borderColor = '#10b981';
        });
        profileButton.addEventListener('mouseleave', () => {
          profileButton.style.transform = 'scale(1)';
          profileButton.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        });
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    const profileButton = document.getElementById("profileButton");
    if (profileButton) {
      profileButton.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        border: 2px solid rgba(16, 185, 129, 0.3);
        transition: all 0.3s ease;
      `;
      profileButton.textContent = "U";
    }
  }
}

// ====================================
// LOAD CATEGORIES DYNAMICALLY
// ====================================
async function loadCategories() {
  try {
    console.log('🔄 Loading categories...');
    const response = await apiClient.getCategories();
    
    console.log('📦 Categories API response:', response);
    
    if (response.success) {
      const categories = response.data || response.categories || [];
      availableCategories = categories;
      console.log('✅ Categories loaded:', availableCategories);
      populateCategoryDropdown(categories);
      return true;
    } else {
      console.error('❌ Failed to load categories:', response.error);
      availableCategories = [];
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    availableCategories = [];
    return false;
  }
}

function populateCategoryDropdown(categories) {
  const categorySelect = document.getElementById('view-category');
  
  if (!categorySelect) {
    console.warn('⚠️ Category dropdown not found');
    return;
  }
  
  // Store current value to restore after repopulating
  const currentValue = categorySelect.value;
  
  categorySelect.innerHTML = '<option value="">Select Category (Optional)</option>';
  
  if (categories && categories.length > 0) {
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    console.log('✅ Dropdown populated with', categories.length, 'categories');
    
    // Restore previous value if it exists
    if (currentValue && categories.some(cat => cat.name === currentValue)) {
      categorySelect.value = currentValue;
    }
  } else {
    console.warn('⚠️ No categories to populate');
  }
}

// ====================================
// CHECK NO SHOW STATUS
// ====================================

function isNoShow(submission) {
  const now = new Date();
  const lastUpdateDate = new Date(submission.updatedAt || submission.createdAt);
  const timeSinceUpdate = now - lastUpdateDate;
  const noShowThreshold = NO_SHOW_DAYS_LIMIT * 24 * 60 * 60 * 1000;
  
  return timeSinceUpdate > noShowThreshold;
}

// Load all student submissions
async function loadSubmissions() {
  try {
    const tbody = document.getElementById('submissionsTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading submissions...</td></tr>';
    
    const status = document.getElementById('statusFilter')?.value || 'all';
    const severity = document.getElementById('severityFilter')?.value || 'all';
    
    const filters = {};
    if (status !== 'all') filters.status = status;
    if (severity !== 'all') filters.severity = severity;
    
    console.log('📡 Fetching student submissions with filters:', filters);
    
    if (typeof apiClient === 'undefined') {
      console.error('❌ apiClient is not defined!');
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: #ef4444;">Error: API client not loaded. Please refresh the page.</td></tr>';
      return;
    }
    
    const response = await apiClient.getStudentSubmissions(filters);
    
    console.log('📥 Response received:', response);
    
    if (response.success) {
      const submissions = response.data || [];
      console.log(`✅ Loaded ${submissions.length} submissions`);
      displaySubmissions(submissions);
    } else {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: #ef4444;">Failed to load submissions: ${response.error || response.message}</td></tr>`;
      console.error('❌ Failed to load submissions:', response);
      showAlert(`Failed to load submissions: ${response.error || response.message}`, 'error');
    }
  } catch (error) {
    console.error('❌ Error loading submissions:', error);
    const tbody = document.getElementById('submissionsTableBody');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: #ef4444;">Error loading submissions: ${error.message}</td></tr>`;
    showAlert('Network error: ' + error.message, 'error');
  }
}

// Display submissions in table
function displaySubmissions(submissions) {
  const tbody = document.getElementById('submissionsTableBody');
  
  if (!submissions || submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No submissions found</td></tr>';
    return;
  }
  
  tbody.innerHTML = submissions.map(sub => {
    const noShow = isNoShow(sub);
    const remarksDisplay = noShow 
      ? '<span class="remarks no-show">No Show</span>' 
      : '<span class="remarks">—</span>';
    
    const isPending = (sub.status || '').toLowerCase() === 'pending';
    const severityDisplay = isPending 
      ? '<span style="color: #9ca3af;">—</span>' 
      : `<span class="severity ${(sub.severity || 'low').toLowerCase()}">${sub.severity || 'Low'}</span>`;
    
    return `
      <tr>
        <td>${sub.submissionId || 'N/A'}</td>
        <td>${sub.studentId || 'Unknown'}</td>
        <td>${sub.studentName || 'Anonymous'}</td>
        <td>${sub.level || 'Unknown'}</td>
        <td>${sub.grade || 'Unknown'}</td>
        <td><span class="status ${(sub.status || 'pending').toLowerCase().replace(/\s+/g, '-')}">${sub.status || 'Pending'}</span></td>
        <td>${severityDisplay}</td>
        <td>${new Date(sub.createdAt).toLocaleDateString()}</td>
        <td>${remarksDisplay}</td>
        <td>
          <button class="action-btn view-btn" onclick="viewSubmission('${sub._id}')" style="cursor: pointer;">
            <span class="material-symbols-outlined">edit</span>
            View/Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Search functionality
function setupSearch() {
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (!searchInput) return;
  
  let debounceTimer;
  
  searchInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(() => {
      const searchTerm = this.value.toLowerCase().trim();
      filterTable(searchTerm);
    }, 300);
  });
}

function filterTable(searchTerm) {
  const rows = document.querySelectorAll('#submissionsTableBody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// View and edit submission details
async function viewSubmission(submissionId) {
  try {
    console.log('📋 Fetching submission details:', submissionId);
    
    // Ensure categories are loaded FIRST
    if (availableCategories.length === 0) {
      console.log('⚠️ Categories not loaded yet, loading now...');
      await loadCategories();
    }
    
    const response = await apiClient.getStudentSubmission(submissionId);
    
    console.log('📥 Submission details received:', response);
    
    if (response.success) {
      const submission = response.data;
      
      document.getElementById('viewSubmissionId').value = submissionId;
      document.getElementById('view-submissionId-display').value = submission.submissionId || 'N/A';
      document.getElementById('view-studentId').value = submission.studentId || '';
      document.getElementById('view-studentName').value = submission.studentName || '';
      document.getElementById('view-level').value = submission.level || '';
      document.getElementById('view-grade').value = submission.grade || '';
      document.getElementById('view-status').value = submission.status || 'Pending';
      document.getElementById('view-severity').value = submission.severity || 'Low';
      document.getElementById('view-concern').value = submission.concern || '';
      document.getElementById('view-date').value = new Date(submission.createdAt).toISOString().split('T')[0];
      document.getElementById('view-notes').value = submission.notes || '';
      
      // Handle category - IMPROVED
      const categorySelect = document.getElementById('view-category');
      if (categorySelect) {
        const submissionCategory = submission.category || '';
        
        // Remove existing warning
        const categoryContainer = categorySelect.parentElement;
        const existingWarning = categoryContainer.querySelector('.category-warning');
        if (existingWarning) {
          existingWarning.remove();
        }
        
        console.log('📂 Setting category to:', submissionCategory);
        console.log('📋 Available options:', Array.from(categorySelect.options).map(o => o.value));
        
        if (submissionCategory) {
          // Check if option exists in dropdown
          const optionExists = Array.from(categorySelect.options).some(
            option => option.value === submissionCategory
          );
          
          if (optionExists) {
            categorySelect.value = submissionCategory;
            console.log('✅ Category set successfully:', submissionCategory);
          } else {
            // Option doesn't exist - show warning
            categorySelect.value = '';
            const warningDiv = document.createElement('div');
            warningDiv.className = 'category-warning';
            warningDiv.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 4px; padding: 8px; background-color: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;';
            warningDiv.innerHTML = `⚠️ Previous category "${submissionCategory}" no longer exists. Please select a new category.`;
            categoryContainer.appendChild(warningDiv);
            console.warn('⚠️ Category not found in dropdown:', submissionCategory);
          }
        } else {
          categorySelect.value = '';
          console.log('ℹ️ No category set for this submission');
        }
      }
      
      document.getElementById('viewSubmissionModal').style.display = 'block';
      
      initStudentIdAutocomplete();
    }
  } catch (error) {
    console.error('❌ Failed to load submission details:', error);
    showAlert('Failed to load submission details: ' + error.message, 'error');
  }
}

// Initialize autocomplete for Student ID
function initStudentIdAutocomplete() {
  const studentIdInput = document.getElementById('view-studentId');
  const autocompleteList = document.getElementById('studentIdAutocomplete');
  
  if (!studentIdInput || !autocompleteList) return;
  
  let debounceTimer;
  
  const newInput = studentIdInput.cloneNode(true);
  studentIdInput.parentNode.replaceChild(newInput, studentIdInput);
  
  newInput.addEventListener('input', function() {
    const query = this.value.trim();
    
    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
      autocompleteList.innerHTML = '';
      autocompleteList.style.display = 'none';
      return;
    }
    
    debounceTimer = setTimeout(async () => {
      try {
        const response = await apiClient.searchStudents(query);
        
        if (response.success && response.data.length > 0) {
          displayAutocompleteResults(response.data);
        } else {
          autocompleteList.innerHTML = '<div class="autocomplete-item no-results">No students found</div>';
          autocompleteList.style.display = 'block';
        }
      } catch (error) {
        console.error('Autocomplete search failed:', error);
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
      }
    }, 300);
  });
  
  document.addEventListener('click', function(e) {
    if (e.target !== newInput) {
      autocompleteList.style.display = 'none';
    }
  });
}

function displayAutocompleteResults(students) {
  const autocompleteList = document.getElementById('studentIdAutocomplete');
  
  autocompleteList.innerHTML = students.map(student => `
    <div class="autocomplete-item" onclick="selectStudent('${student._id}', '${student.studentId}', '${student.name}', '${student.level}', '${student.grade}')">
      <div class="autocomplete-id">${student.studentId}</div>
      <div class="autocomplete-name">${student.name}</div>
      <div class="autocomplete-details">${student.level} - ${student.grade}</div>
    </div>
  `).join('');
  
  autocompleteList.style.display = 'block';
}

function selectStudent(id, studentId, name, level, grade) {
  document.getElementById('view-studentId').value = studentId;
  document.getElementById('view-studentName').value = name;
  document.getElementById('view-level').value = level;
  document.getElementById('view-grade').value = grade;
  
  document.getElementById('studentIdAutocomplete').style.display = 'none';
  
  showAlert('Student information auto-filled', 'success');
}

// Update submission - FIXED VERSION
async function updateSubmission(e) {
  e.preventDefault();
  
  console.log('🚀 Starting submission update...');
  
  const submissionId = document.getElementById('viewSubmissionId').value;
  console.log('📝 Submission ID:', submissionId);
  
  // Build form data
  const formData = {
    studentId: document.getElementById('view-studentId').value.trim() || null,
    studentName: document.getElementById('view-studentName').value.trim(),
    level: document.getElementById('view-level').value || null,
    grade: document.getElementById('view-grade').value.trim() || null,
    status: document.getElementById('view-status').value,
    severity: document.getElementById('view-severity').value,
    notes: document.getElementById('view-notes').value.trim() || null
  };
  
  // Handle category - SIMPLIFIED AND FIXED
  const categorySelect = document.getElementById('view-category');
  if (categorySelect) {
    const selectedCategory = categorySelect.value.trim();
    
    console.log('📂 Category dropdown value:', selectedCategory);
    console.log('📂 Category dropdown selectedIndex:', categorySelect.selectedIndex);
    console.log('📂 Category dropdown options:', Array.from(categorySelect.options).map(o => ({ value: o.value, text: o.text })));
    
    if (selectedCategory) {
      // If a category is selected, just use it
      // Remove validation - let the backend handle it
      formData.category = selectedCategory;
      console.log('✅ Category will be sent:', selectedCategory);
    } else {
      // No category selected - send null or empty string
      formData.category = null;
      console.log('ℹ️ No category selected, sending null');
    }
  }
  
  console.log('📤 Final form data to send:', formData);
  
  try {
    const response = await apiClient.updateStudentSubmission(submissionId, formData);
    
    console.log('📥 Server response:', response);
    
    if (response.success) {
      showAlert('Submission updated successfully', 'success');
      closeViewModal();
      
      // Reload the table after a short delay to ensure server has processed
      setTimeout(() => {
        loadSubmissions();
      }, 500);
    } else {
      const errorMsg = response.error || response.message || 'Unknown error';
      showAlert('Failed to update submission: ' + errorMsg, 'error');
      console.error('❌ Update failed:', response);
    }
  } catch (error) {
    console.error('❌ Update submission error:', error);
    showAlert('Network error: ' + error.message, 'error');
  }
}

// Delete submission
async function deleteSubmission(submissionId) {
  if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
    return;
  }
  
  try {
    console.log('🗑️ Deleting submission:', submissionId);
    
    const response = await apiClient.deleteStudentSubmission(submissionId);
    
    if (response.success) {
      showAlert('Submission deleted successfully', 'success');
      loadSubmissions();
    }
  } catch (error) {
    console.error('Failed to delete submission:', error);
    showAlert('Failed to delete submission: ' + error.message, 'error');
  }
}

// Close view modal
function closeViewModal() {
  const modal = document.getElementById('viewSubmissionModal');
  if (modal) modal.style.display = 'none';
  
  const autocomplete = document.getElementById('studentIdAutocomplete');
  if (autocomplete) autocomplete.style.display = 'none';
  
  const categorySelect = document.getElementById('view-category');
  if (categorySelect) {
    const categoryContainer = categorySelect.parentElement;
    const warningDiv = categoryContainer.querySelector('.category-warning');
    if (warningDiv) {
      warningDiv.remove();
    }
  }
}

// Show alert message
function showAlert(message, type = 'info') {
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) existingAlert.remove();
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// Apply URL filters on page load
function applyUrlFiltersForSubmissions() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const status = urlParams.get('status');
  const statusFilter = document.getElementById('statusFilter');
  if (status && statusFilter) {
    statusFilter.value = status;
  }
  
  const severity = urlParams.get('severity');
  const severityFilter = document.getElementById('severityFilter');
  if (severity && severityFilter) {
    severityFilter.value = severity;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('StudentSubmissions page loaded');
  
  initializeNavigation();
  initializeProfileDropdown();
  await loadUserProfile();
  
  await loadCategories();
  applyUrlFiltersForSubmissions();
  loadSubmissions();
  
  setupSearch();
  
  const statusFilter = document.getElementById('statusFilter');
  const severityFilter = document.getElementById('severityFilter');
  
  if (statusFilter) {
    statusFilter.addEventListener('change', loadSubmissions);
  }
  
  if (severityFilter) {
    severityFilter.addEventListener('change', loadSubmissions);
  }
  
  const updateForm = document.getElementById('updateSubmissionForm');
  if (updateForm) {
    updateForm.addEventListener('submit', updateSubmission);
  }
  
  const cancelBtn = document.getElementById('cancelViewModalBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeViewModal);
  }
  
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('viewSubmissionModal');
    if (e.target === modal) {
      closeViewModal();
    }
  });
  
  const refreshBtn = document.querySelector('[onclick="loadSubmissions()"]');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      console.log('Manual refresh triggered');
      loadSubmissions();
    };
  }
});

// Add CSS animations and styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .autocomplete-container {
    position: relative;
  }
  
  .autocomplete-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    display: none;
  }
  
  .autocomplete-item {
    padding: 12px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .autocomplete-item:hover {
    background-color: #f9fafb;
  }
  
  .autocomplete-item.no-results {
    cursor: default;
    color: #6b7280;
    text-align: center;
  }
  
  .autocomplete-id {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }
  
  .autocomplete-name {
    color: #4b5563;
    margin-bottom: 2px;
  }
  
  .autocomplete-details {
    font-size: 12px;
    color: #9ca3af;
  }
  
  .edit-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #fef3c7;
    color: #92400e;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
  }
  
  .category-warning {
    color: #f59e0b;
    font-size: 12px;
    margin-top: 4px;
    padding: 8px;
    background-color: #fef3c7;
    border-radius: 4px;
    border-left: 3px solid #f59e0b;
  }
  
  .status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-block;
  }
  
  .status.pending {
    color: #fbbf24;
  }
  
  .status.under-review {
    color: #3b82f6;
  }
  
  .status.for-consultation {
    color: #9333ea;
  }
  
  .status.processed,
  .status.complete {
    color: #10b981;
  }
  
  .severity {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-block;
  }
  
  .severity.low {
    color: #10b981;
  }
  
  .severity.medium {
    color: #fbbf24;
  }
  
  .severity.high {
    color: #ef4444;
  }
  
  .remarks {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #9ca3af;
  }
  
  .remarks.no-show {
    background: rgba(251, 191, 36, 0.1);
    font-weight: 600;
  }
  
  .dropdown.show .dropdown-content {
    display: block;
  }
`;

document.head.appendChild(style);


