// Activity Logs JavaScript

document.addEventListener("DOMContentLoaded", async () => {
  // Highlight active nav item
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

  // Profile dropdown functionality
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

  // Load user profile and display avatar
  await loadUserProfile();
  
  // Initialize activity logs
  initializeActivityLogs();
});

// ====================================
// LOAD USER PROFILE AND DISPLAY AVATAR
// ====================================
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
  }
}

// ====================================
// ACTIVITY LOGS FUNCTIONALITY
// ====================================

let allLogs = [];
let filteredLogs = [];

function initializeActivityLogs() {
  console.log('📋 Initializing Activity Logs...');
  
  setupEventListeners();
  loadActivityLogs();
  
  // Auto-refresh every 30 seconds
  setInterval(loadActivityLogs, 30000);
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchLogs');
  const actionFilter = document.getElementById('actionFilter');
  const dateRangeFilter = document.getElementById('dateRangeFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 300));
  }
  
  if (actionFilter) {
    actionFilter.addEventListener('change', applyFilters);
  }
  
  if (dateRangeFilter) {
    dateRangeFilter.addEventListener('change', applyFilters);
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('detailsModal');
    if (event.target === modal) {
      closeDetailsModal();
    }
  });
}

async function loadActivityLogs() {
  try {
    console.log('🔄 Loading activity logs...');
    
    // Replace with your actual API endpoint
    const response = await apiClient.get('/activity-logs');
    
    if (response.success && response.data) {
      allLogs = response.data;
      console.log('✅ Loaded', allLogs.length, 'activity logs');
      
      updateStats();
      applyFilters();
    } else {
      console.error('Failed to load activity logs:', response);
      showEmptyState();
    }
  } catch (error) {
    console.error('Error loading activity logs:', error);
    
    // For demo purposes, generate sample data
    allLogs = generateSampleLogs();
    console.log('📊 Using sample data:', allLogs.length, 'logs');
    
    updateStats();
    applyFilters();
  }
}

function updateStats() {
  const totalLogs = allLogs.length;
  const createdCount = allLogs.filter(log => log.action === 'created').length;
  const updatedCount = allLogs.filter(log => log.action === 'updated').length;
  const deletedCount = allLogs.filter(log => log.action === 'deleted').length;
  
  document.getElementById('totalLogs').textContent = totalLogs;
  document.getElementById('createdCount').textContent = createdCount;
  document.getElementById('updatedCount').textContent = updatedCount;
  document.getElementById('deletedCount').textContent = deletedCount;
}

function applyFilters() {
  const searchTerm = document.getElementById('searchLogs').value.toLowerCase();
  const actionFilter = document.getElementById('actionFilter').value;
  const dateRange = document.getElementById('dateRangeFilter').value;
  
  filteredLogs = allLogs.filter(log => {
    // Search filter
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm) ||
      log.studentName?.toLowerCase().includes(searchTerm) ||
      log.referralId?.toLowerCase().includes(searchTerm) ||
      log.description.toLowerCase().includes(searchTerm);
    
    // Action filter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    // Date range filter
    let matchesDate = true;
    if (dateRange !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      
      if (dateRange === 'today') {
        matchesDate = logDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = logDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = logDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });
  
  renderTimeline();
}

function clearFilters() {
  document.getElementById('searchLogs').value = '';
  document.getElementById('actionFilter').value = 'all';
  document.getElementById('dateRangeFilter').value = 'all';
  applyFilters();
}

function renderTimeline() {
  const timeline = document.getElementById('activityTimeline');
  
  if (filteredLogs.length === 0) {
    timeline.innerHTML = `
      <div class="timeline-empty">
        <span class="material-symbols-outlined">history</span>
        <p>No activity logs found</p>
      </div>
    `;
    return;
  }
  
  // Sort by most recent first
  const sortedLogs = [...filteredLogs].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  timeline.innerHTML = sortedLogs.map(log => createTimelineItem(log)).join('');
}

function createTimelineItem(log) {
  const actionClass = log.action;
  const actionIcon = {
    'created': 'add_circle',
    'updated': 'edit',
    'deleted': 'delete'
  }[log.action] || 'circle';
  
  const actionText = {
    'created': 'Created',
    'updated': 'Updated',
    'deleted': 'Deleted'
  }[log.action] || log.action;
  
  return `
    <div class="timeline-item">
      <div class="timeline-dot ${actionClass}"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <div class="timeline-action">
            <span class="action-badge action-${actionClass}">
              <span class="material-symbols-outlined">${actionIcon}</span>
              ${actionText}
            </span>
          </div>
          <div class="timeline-time">
            <span class="material-symbols-outlined">schedule</span>
            ${formatTimeAgo(log.timestamp)}
          </div>
        </div>
        
        <div class="timeline-body">
          <div class="timeline-description">${escapeHtml(log.description)}</div>
          <div class="timeline-meta">
            <div class="meta-item">
              <span class="material-symbols-outlined">person</span>
              ${escapeHtml(log.userName)}
            </div>
            ${log.studentName ? `
              <div class="meta-item">
                <span class="material-symbols-outlined">school</span>
                ${escapeHtml(log.studentName)}
              </div>
            ` : ''}
            ${log.referralId ? `
              <div class="meta-item">
                <span class="material-symbols-outlined">tag</span>
                ${escapeHtml(log.referralId)}
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="timeline-footer">
          <button class="btn-view-details" onclick="viewLogDetails('${log.id}')">
            <span class="material-symbols-outlined">visibility</span>
            View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

function viewLogDetails(logId) {
  const log = allLogs.find(l => l.id === logId);
  if (!log) return;
  
  const detailsContainer = document.getElementById('activityDetails');
  
  detailsContainer.innerHTML = `
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Action</div>
        <div class="detail-value">
          <span class="action-badge action-${log.action}">
            ${log.action.charAt(0).toUpperCase() + log.action.slice(1)}
          </span>
        </div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Performed By</div>
        <div class="detail-value">${escapeHtml(log.userName)}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Date & Time</div>
        <div class="detail-value">${formatDateTime(log.timestamp)}</div>
      </div>
      
      ${log.studentName ? `
        <div class="detail-item">
          <div class="detail-label">Student</div>
          <div class="detail-value">${escapeHtml(log.studentName)}</div>
        </div>
      ` : ''}
      
      ${log.referralId ? `
        <div class="detail-item">
          <div class="detail-label">Referral ID</div>
          <div class="detail-value">${escapeHtml(log.referralId)}</div>
        </div>
      ` : ''}
      
      <div class="detail-item">
        <div class="detail-label">Description</div>
        <div class="detail-value">${escapeHtml(log.description)}</div>
      </div>
      
      ${log.changes ? `
        <div class="detail-item">
          <div class="detail-label">Changes Made</div>
          <div class="detail-value">
            ${formatChanges(log.changes)}
          </div>
        </div>
      ` : ''}
      
      ${log.ipAddress ? `
        <div class="detail-item">
          <div class="detail-label">IP Address</div>
          <div class="detail-value">${escapeHtml(log.ipAddress)}</div>
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('detailsModal').style.display = 'block';
}

function closeDetailsModal() {
  document.getElementById('detailsModal').style.display = 'none';
}

function formatChanges(changes) {
  if (typeof changes === 'object') {
    return Object.entries(changes)
      .map(([key, value]) => `<div><strong>${key}:</strong> ${value.old || 'N/A'} → ${value.new || 'N/A'}</div>`)
      .join('');
  }
  return escapeHtml(String(changes));
}

function showEmptyState() {
  const timeline = document.getElementById('activityTimeline');
  timeline.innerHTML = `
    <div class="timeline-empty">
      <span class="material-symbols-outlined">history</span>
      <p>No activity logs available</p>
    </div>
  `;
}

// ====================================
// SAMPLE DATA GENERATOR (FOR DEMO)
// ====================================
function generateSampleLogs() {
  const users = ['John Doe', 'Jane Smith', 'Mary Johnson', 'Robert Brown'];
  const students = ['Alice Martinez', 'Bob Wilson', 'Charlie Davis', 'Diana Garcia'];
  const actions = ['created', 'updated', 'deleted'];
  const logs = [];
  
  for (let i = 0; i < 25; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const student = students[Math.floor(Math.random() * students.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    
    let description, changes;
    if (action === 'created') {
      description = `New referral created for ${student}`;
      changes = null;
    } else if (action === 'updated') {
      description = `Referral status updated for ${student}`;
      changes = {
        status: { old: 'Pending', new: 'Under Review' },
        severity: { old: 'Low', new: 'Medium' }
      };
    } else {
      description = `Referral deleted for ${student}`;
      changes = null;
    }
    
    logs.push({
      id: `log-${i}`,
      action: action,
      userName: user,
      studentName: student,
      referralId: `REF-${1000 + i}`,
      description: description,
      changes: changes,
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
    });
  }
  
  return logs;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions to window
window.viewLogDetails = viewLogDetails;
window.closeDetailsModal = closeDetailsModal;
