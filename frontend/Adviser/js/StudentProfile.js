// Teacher/Adviser StudentProfile.js - FIXED VERSION WITH WORKING DROPDOWN
document.addEventListener('DOMContentLoaded', async function() {
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || user.role !== 'Teacher') {
    window.location.href = '../../pages/LoginForm.html';
    return;
  }

  // Display adviser name
  document.getElementById('adviserName').textContent = user.fullName;

  // Setup profile dropdown FIRST
  setupProfileDropdown();

  // Initialize undo manager for referrals
const undoManager = new ReferralUndoManager(user);
  
  // Load user profile to show avatar
  await loadUserProfile();

  // Elements
  const studentTable = document.getElementById('studentTable');
  const searchInput = document.getElementById('searchInput');
  const levelFilter = document.getElementById('levelFilter');
  const gradeFilter = document.getElementById('gradeFilter');
  const studentCount = document.getElementById('studentCount');
  const bulkUploadBtn = document.getElementById('bulkUploadBtn');
  const addStudentBtn = document.getElementById('addStudentBtn');  // ADD THIS
  const uploadModal = document.getElementById('uploadModal');
  const resultsModal = document.getElementById('resultsModal');
  const addStudentModal = document.getElementById('addStudentModal');  // ADD THIS
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const confirmUploadBtn = document.getElementById('confirmUploadBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  let allStudents = [];
  let selectedFile = null;

  // Grade mappings for each level
  const gradeMappings = {
    'Elementary': [1, 2, 3, 4, 5, 6],
    'JHS': [7, 8, 9, 10],
    'SHS': [11, 12]
  };

  // --------------------------
  // SETUP PROFILE DROPDOWN
  // --------------------------
  function setupProfileDropdown() {
    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    
    console.log('Setting up profile dropdown...', { profileButton, profileDropdown });
    
    if (profileButton && profileDropdown) {
      // Toggle dropdown when clicking profile button
      profileButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Profile button clicked!');
        
        // Toggle the 'active' class (matching the CSS)
        profileDropdown.classList.toggle("active");
        console.log('Dropdown classes:', profileDropdown.className);
      });
    
      // Close dropdown when clicking outside
      document.addEventListener("click", (event) => {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
          profileDropdown.classList.remove("active");
        }
      });
    
      // Prevent dropdown from closing when clicking inside dropdown content
      const dropdownContent = profileDropdown.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      }
    } else {
      console.error('Profile button or dropdown not found!');
    }
  }

  // --------------------------
  // LOAD USER PROFILE
  // --------------------------
  async function loadUserProfile() {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No auth token found");
        // Still generate avatar from localStorage user
        if (user && user.fullName) {
          displayUserProfile(user);
        }
        return;
      }

      console.log("Fetching user profile...");
      
      const response = await apiClient.getUserProfile();
      
      console.log("Profile Response:", response);

      if (response.success && response.data) {
        displayUserProfile(response.data);
      } else {
        console.error("Failed to load profile:", response.message);
        // Fallback to localStorage user
        if (user && user.fullName) {
          displayUserProfile(user);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Fallback to localStorage user
      if (user && user.fullName) {
        displayUserProfile(user);
      }
    }
  }

  // --------------------------
  // DISPLAY USER PROFILE
  // --------------------------
  function displayUserProfile(userData) {
    const profileButton = document.getElementById("profileButton");
    
    if (profileButton) {
      const name = userData.fullName || userData.username || 'User';
      // Generate avatar with smaller size (40px for header)
      profileButton.innerHTML = generateAvatar(name, 40);
      profileButton.style.cursor = 'pointer';
    }

    // Update welcome message with adviser name in the welcome card
    const adviserName = document.getElementById("adviserName");
    if (adviserName) {
      const name = userData.fullName || userData.username || 'Adviser';
      adviserName.textContent = name;
    }
  }

  // --------------------------
  // GENERATE AVATAR WITH INITIAL
  // --------------------------
  function generateAvatar(name, size = 80) {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const fontSize = size === 80 ? 50 : 20;
    
    return `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
        border-radius: 50%;
        font-size: ${fontSize}px;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
      ">
        ${initial}
      </div>
    `;
  }

  // Populate grade filter based on level
  function populateGradeFilter(level) {
    // Clear current options except "All Grades"
    gradeFilter.innerHTML = '<option value="">All Grades</option>';
    
    if (level && gradeMappings[level]) {
      const grades = gradeMappings[level];
      grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = `Grade ${grade}`;
        option.textContent = `Grade ${grade}`;
        gradeFilter.appendChild(option);
      });
      gradeFilter.disabled = false;
    } else {
      // If no level selected, show all possible grades
      gradeFilter.disabled = false;
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(grade => {
        const option = document.createElement('option');
        option.value = `Grade ${grade}`;
        option.textContent = `Grade ${grade}`;
        gradeFilter.appendChild(option);
      });
    }
  }

  // Initialize grade filter with all grades
  populateGradeFilter('');

  // Level filter change handler
  levelFilter.addEventListener('change', function() {
    const selectedLevel = this.value;
    
    // Reset grade filter to "All Grades"
    gradeFilter.value = '';
    
    // Populate grade options based on selected level
    populateGradeFilter(selectedLevel);
    
    // Apply filters
    filterStudents();
  });

  // Load students
  async function loadStudents() {
    try {
      console.log('ðŸ“š Loading students for teacher:', user.fullName);
      
      const response = await apiClient.get('/students');
      
      console.log('ðŸ“¥ Students response:', response);
      
      if (response.success) {
        allStudents = response.data || [];
        displayStudents(allStudents);
        updateStudentCount(allStudents.length);
      } else {
        console.error('Failed to load students:', response.error);
        showCustomAlert(response.error || 'Failed to load students', 'error');
        studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Failed to load students</td></tr>';
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showCustomAlert('Error loading students: ' + error.message, 'error');
      studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Error loading students</td></tr>';
    }
  }

  // Display students in table
  function displayStudents(students) {
  if (students.length === 0) {
    studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #6b7280;">No students found. Click "Add Student" or "Bulk Upload Students" to add your students.</td></tr>';
    return;
  }

    studentTable.innerHTML = students.map(student => {
      const fullName = student.fullName || 
        `${student.lastName}, ${student.firstName}${student.middleName ? ' ' + student.middleName : ''}`;
      
      return `
        <tr>
          <td>${student.studentId || 'N/A'}</td>
          <td>${fullName}</td>
          <td>${student.level || 'N/A'}</td>
          <td>${student.grade || 'N/A'}</td>
          <td>${student.contactNumber || 'N/A'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action btn-add-referral" onclick="openAddReferralModal('${student._id}', '${student.studentId}', '${fullName.replace(/'/g, "\\'")}', '${student.level}', '${student.grade}')">
                <span class="material-symbols-outlined">add_circle</span>
                Add Referral
              </button>
              <button class="btn-action btn-view-referrals" onclick="openViewReferralsModal('${student.studentId}', '${fullName.replace(/'/g, "\\'")}')">
                <span class="material-symbols-outlined">visibility</span>
                View Referrals
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update student count
  function updateStudentCount(count) {
    studentCount.textContent = count;
  }

  // Normalize grade format for comparison
  function normalizeGrade(grade) {
    if (!grade) return '';
    // Convert to string and extract number
    const gradeStr = String(grade).trim();
    const match = gradeStr.match(/\d+/);
    return match ? match[0] : gradeStr;
  }

  // Filter students
  function filterStudents() {
    const search = searchInput.value.toLowerCase();
    const level = levelFilter.value;
    const grade = gradeFilter.value;

    const filtered = allStudents.filter(student => {
      const fullName = student.fullName || 
        `${student.firstName} ${student.lastName}`;
      
      const matchesSearch = !search || 
        student.studentId?.toLowerCase().includes(search) ||
        student.firstName?.toLowerCase().includes(search) ||
        student.lastName?.toLowerCase().includes(search) ||
        fullName.toLowerCase().includes(search);
      
      const matchesLevel = !level || student.level === level;
      
      // Normalize both filter value and student grade for comparison
      const matchesGrade = !grade || 
        normalizeGrade(student.grade) === normalizeGrade(grade);

      return matchesSearch && matchesLevel && matchesGrade;
    });

    displayStudents(filtered);
    updateStudentCount(filtered.length);
  }

  // Event listeners for filters
  searchInput.addEventListener('input', filterStudents);
  gradeFilter.addEventListener('change', filterStudents);

// Event listeners for filters
searchInput.addEventListener('input', filterStudents);
gradeFilter.addEventListener('change', filterStudents);

// --------------------------
// ADD STUDENT MODAL HANDLERS
// --------------------------

// Open Add Student Modal
if (addStudentBtn) {
  addStudentBtn.addEventListener('click', () => {
    if (addStudentModal) {
      addStudentModal.style.display = 'block';
      resetAddStudentForm();
    }
  });
}

// Close Add Student Modal
const closeAddStudentModal = document.getElementById('closeAddStudentModal');
const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');

if (closeAddStudentModal) {
  closeAddStudentModal.addEventListener('click', () => {
    if (addStudentModal) {
      addStudentModal.style.display = 'none';
      resetAddStudentForm();
    }
  });
}

if (cancelAddStudentBtn) {
  cancelAddStudentBtn.addEventListener('click', () => {
    if (addStudentModal) {
      addStudentModal.style.display = 'none';
      resetAddStudentForm();
    }
  });
}

// Handle Add Student Form Level Change
const addStudentLevel = document.getElementById('addStudentLevel');
const addStudentGrade = document.getElementById('addStudentGrade');

if (addStudentLevel && addStudentGrade) {
  addStudentLevel.addEventListener('change', function() {
  const level = this.value;
  addStudentGrade.innerHTML = '<option value="">Select Grade</option>';
  
  if (level && gradeMappings[level]) {
    const grades = gradeMappings[level];
    grades.forEach(grade => {
      const option = document.createElement('option');
      option.value = `Grade ${grade}`;
      option.textContent = `Grade ${grade}`;
      addStudentGrade.appendChild(option);
    });
    addStudentGrade.disabled = false;
  } else {
    addStudentGrade.disabled = true;
  }
});
}

// Handle Add Student Form Submission
const addStudentForm = document.getElementById('addStudentForm');

if (addStudentForm) {
  addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      studentId: document.getElementById('addStudentId')?.value.trim(),
      firstName: document.getElementById('addStudentFirstName')?.value.trim(),
      middleName: document.getElementById('addStudentMiddleName')?.value.trim() || undefined,
      lastName: document.getElementById('addStudentLastName')?.value.trim(),
      level: document.getElementById('addStudentLevel')?.value,
      grade: document.getElementById('addStudentGrade')?.value,
      contactNumber: document.getElementById('addStudentContact')?.value.trim()
    };

    console.log('📤 Adding new student:', formData);

    try {
      const submitBtn = addStudentForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.innerHTML;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Adding...';
      }
      
      const response = await apiClient.post('/students', formData);
      
      console.log('📥 Response:', response);
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
      
      if (response.success) {
        console.log('✅ Student added successfully!');
        
        if (addStudentModal) addStudentModal.style.display = 'none';
        resetAddStudentForm();
        
        if (typeof customAlert !== 'undefined' && customAlert.success) {
          customAlert.success('Student has been added successfully!', 'Success!');
        } else {
          alert('✅ Student added successfully! 🎉');
        }
        
        loadStudents();
      } else {
        throw new Error(response.error || response.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('❌ Error adding student:', error);
      
      const submitBtn = addStudentForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">person_add</span>Add Student';
      }
      
      const errorMsg = error.message || 'Failed to add student';
      if (typeof customAlert !== 'undefined' && customAlert.error) {
        customAlert.error(errorMsg, 'Error!');  
      } else {
        alert('❌ Error: ' + errorMsg);
      }
    }
  });
}

function resetAddStudentForm() {
  addStudentForm.reset();
  addStudentGrade.innerHTML = '<option value="">Select Grade</option>';
  addStudentGrade.disabled = true;
}

  if (bulkUploadBtn) {
  bulkUploadBtn.addEventListener('click', () => {
    if (uploadModal) {
      uploadModal.style.display = 'block';
      resetUploadModal();
    }
  });
}

  // Close modals
  const closeButtons = document.querySelectorAll('.close');
  if (closeButtons && closeButtons.length > 0) {
    closeButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (uploadModal) uploadModal.style.display = 'none';
          if (resultsModal) resultsModal.style.display = 'none';
        });
      }
    });
  }

  if (cancelUploadBtn) {
  cancelUploadBtn.addEventListener('click', () => {
    if (uploadModal) {
      uploadModal.style.display = 'none';
      resetUploadModal();
    }
  });
}

  if (closeResultsBtn) {
  closeResultsBtn.addEventListener('click', () => {
    if (resultsModal) {
      resultsModal.style.display = 'none';
    }
  });
}

 // Click outside to close
window.addEventListener('click', (e) => {
  if (e.target === uploadModal) {
    uploadModal.style.display = 'none';
    resetUploadModal();
  }
  if (e.target === resultsModal) {
    resultsModal.style.display = 'none';
  }
  if (e.target === addStudentModal) {  // ADD THIS ENTIRE BLOCK
    addStudentModal.style.display = 'none';
    resetAddStudentForm();
  }
});

  // Drop zone functionality
  if (dropZone) {
    dropZone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // Handle file selection
  function handleFileSelect(file) {
    console.log('ðŸ”Ž File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    const validExtensions = /\.(xlsx|xls|csv)$/i;
    
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      showCustomAlert('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.', 'error');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showCustomAlert('File is too large. Maximum size is 10MB.', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    confirmUploadBtn.disabled = false;
    
    console.log('âœ… File validated successfully');
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Upload file
  if (confirmUploadBtn) {
    confirmUploadBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showCustomAlert('Please select a file first', 'error');
      return;
    }

    console.log('ðŸ“¤ Starting upload for file:', selectedFile.name);

    // Create FormData
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Show progress
      confirmUploadBtn.disabled = true;
      cancelUploadBtn.disabled = true;
      uploadProgress.style.display = 'block';
      progressBar.style.width = '30%';
      progressText.textContent = 'Uploading file...';

      console.log('ðŸ“¡ Sending request to /students/bulk-upload');

      // Use apiClient upload method
      const response = await apiClient.upload('/students/bulk-upload', formData);

      console.log('ðŸ“¥ Upload response:', response);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Upload failed');
      }

      progressBar.style.width = '100%';
      progressText.textContent = 'Processing complete!';

      // Close upload modal after a short delay
      setTimeout(() => {
        uploadModal.style.display = 'none';
        resetUploadModal();
        
        // Show results
        displayUploadResults(response);
        
        // Reload students
        loadStudents();
      }, 500);

    } catch (error) {
      console.error('âŒ Upload error:', error);
      showCustomAlert(error.message || 'Failed to upload file', 'error');
      resetUploadModal();
    }
  });
}

  // Display upload results
  function displayUploadResults(response) {
    console.log('ðŸ“Š Displaying results:', response);
    
    const summary = response.summary || { inserted: 0, duplicates: 0, errors: 0, totalRows: 0 };
    const duplicates = response.duplicates || [];
    const errors = response.errors || [];
    
    let html = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #10b981; margin-top: 0;">ðŸ“Š Upload Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${summary.inserted}</div>
            <div style="color: #10b981; font-size: 0.9rem;">âœ… Added</div>
          </div>
          <div style="background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(251, 191, 36, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #fbbf24;">${summary.duplicates}</div>
            <div style="color: #fbbf24; font-size: 0.9rem;">âš ï¸ Duplicates</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${summary.errors}</div>
            <div style="color: #ef4444; font-size: 0.9rem;">âŒ Errors</div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${summary.totalRows}</div>
            <div style="color: #3b82f6; font-size: 0.9rem;">ðŸ“‹ Total Rows</div>
          </div>
        </div>
      </div>
    `;

    // Show duplicates
    if (duplicates.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #fbbf24; margin-top: 0;">âš ï¸ Duplicates Found (${duplicates.length})</h4>
          <div style="max-height: 200px; overflow-y: auto; background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
            ${duplicates.map(d => `
              <div style="margin-bottom: 0.5rem; color: #e0e0e0;">
                <strong style="color: #fbbf24;">Row ${d.row}:</strong> ${d.name} (${d.studentId}) - ${d.reason}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Show errors
    if (errors.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #ef4444; margin-top: 0;">âŒ Errors (${errors.length})</h4>
          <div style="max-height: 200px; overflow-y: auto; background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
            ${errors.map(e => `
              <div style="margin-bottom: 0.5rem; color: #e0e0e0;">
                <strong style="color: #ef4444;">Row ${e.row}:</strong> ${e.error}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Success message
    if (summary.inserted > 0) {
      html += `
        <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <p style="margin: 0; color: #10b981;">
            âœ… Successfully added ${summary.inserted} student${summary.inserted !== 1 ? 's' : ''} to your class!
          </p>
        </div>
      `;
    }

    document.getElementById('resultsContent').innerHTML = html;
    resultsModal.style.display = 'block';
  }

  // Reset upload modal
  function resetUploadModal() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    uploadProgress.style.display = 'none';
    progressBar.style.width = '0%';
    confirmUploadBtn.disabled = true;
    cancelUploadBtn.disabled = false;
    
    // Reset drop zone styling - remove dragover class
    dropZone.classList.remove('dragover');
  }

  // Initial load
  console.log('ðŸš€ Initializing student profile page...');
  loadStudents();

  // --------------------------
  // REFERRAL MODAL FUNCTIONS
  // --------------------------
  
  console.log('ðŸ”§ Setting up referral modals...');
  
  // Add Referral Modal
  const referralModal = document.getElementById('referralModal');
  const closeReferralModal = document.getElementById('closeReferralModal');
  const cancelReferralBtn = document.getElementById('cancelReferralBtn');
  const referralForm = document.getElementById('referralForm');

  console.log('Modal elements:', {
    referralModal: !!referralModal,
    closeReferralModal: !!closeReferralModal,
    cancelReferralBtn: !!cancelReferralBtn,
    referralForm: !!referralForm
  });

  // View Referrals Modal
  const viewReferralsModal = document.getElementById('viewReferralsModal');
  const closeViewReferralsModal = document.getElementById('closeViewReferralsModal');
  const closeViewReferralsBtn = document.getElementById('closeViewReferralsBtn');

  // Close modal handlers
  if (closeReferralModal) {
    closeReferralModal.onclick = () => {
      referralModal.style.display = 'none';
      referralForm.reset();
    };
  }

  if (cancelReferralBtn) {
    cancelReferralBtn.onclick = () => {
      referralModal.style.display = 'none';
      referralForm.reset();
    };
  }

  if (closeViewReferralsModal) {
    closeViewReferralsModal.onclick = () => {
      viewReferralsModal.style.display = 'none';
    };
  }

  if (closeViewReferralsBtn) {
    closeViewReferralsBtn.onclick = () => {
      viewReferralsModal.style.display = 'none';
    };
  }

  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target === referralModal) {
      referralModal.style.display = 'none';
      referralForm.reset();
    }
    if (event.target === viewReferralsModal) {
      viewReferralsModal.style.display = 'none';
    }
  };

  // Initialize Edit Referral Modal
initEditReferralModal();

  // Open Add Referral Modal
  window.openAddReferralModal = (studentDbId, studentId, studentName, level, grade) => {
  console.log('🔓 Opening add referral modal for:', studentName);
  
  // Show modal first to ensure elements are in DOM
  referralModal.style.display = 'block';
  
  // Small delay to ensure modal is rendered
  setTimeout(() => {
    // Populate form with student info
    const studentIdField = document.getElementById('ref-studentId');
    const studentNameField = document.getElementById('ref-studentName');
    const studentIdDisplayField = document.getElementById('ref-studentIdDisplay');
    const levelField = document.getElementById('ref-level');
    const gradeField = document.getElementById('ref-grade');
    const levelDisplayField = document.getElementById('ref-levelDisplay');
    const gradeDisplayField = document.getElementById('ref-gradeDisplay');
    const dateField = document.getElementById('ref-dateOfInterview');
    const urgencyField = document.getElementById('ref-urgency');
    const descriptionField = document.getElementById('ref-description');
    const reasonField = document.getElementById('ref-reason');
    
    if (studentIdField) studentIdField.value = studentId;
    if (studentNameField) studentNameField.value = studentName;
    if (studentIdDisplayField) studentIdDisplayField.value = studentId;
    if (levelField) levelField.value = level;
    if (gradeField) gradeField.value = grade;
    if (levelDisplayField) levelDisplayField.value = level;
    if (gradeDisplayField) gradeDisplayField.value = grade;
    
    // Set today's date as default
    if (dateField) {
      const today = new Date().toISOString().split('T')[0];
      dateField.value = today;
    }
    
    // Reset urgency dropdown to empty
    if (urgencyField) urgencyField.value = '';
    
    // Clear editable fields
    if (descriptionField) descriptionField.value = '';
    if (reasonField) reasonField.value = '';
    
    console.log('✅ All fields populated successfully');

  // Setup clear form button handler
    const clearFormBtn = document.getElementById('clearReferralFormBtn');
    if (clearFormBtn) {
      clearFormBtn.onclick = () => {
        if (confirm('Are you sure you want to clear Reason, Urgency, and Description fields?')) {
          // Clear only these 3 editable fields
          if (reasonField) reasonField.value = '';
          if (urgencyField) urgencyField.value = '';
          if (descriptionField) descriptionField.value = '';
          
          // Show success notification
          showFormClearNotification();
        }
      };
    }
  }, 50);
};


  // Function to show form clear notification
  function showFormClearNotification() {
    const notification = document.createElement('div');
    notification.className = 'undo-notification undo-notification-success undo-show';
    notification.style.bottom = '30px';
    notification.innerHTML = `
      <span class="material-symbols-outlined">check_circle</span>
      <div class="undo-notification-content">
        <p class="undo-notification-title">Fields Cleared</p>
        <p class="undo-notification-text">Reason, Urgency, and Description have been reset</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('undo-show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Open View Referrals Modal
  window.openViewReferralsModal = async (studentId, studentName) => {
    console.log('ðŸ‘ï¸ Opening view referrals modal for:', studentName);
    
    // Set student name in header
    document.getElementById('viewRef-studentName').textContent = studentName;
    
    // Show modal
    viewReferralsModal.style.display = 'block';
    
    // Load referrals for this student
    await loadStudentReferrals(studentId);
  };

  // ============================================
// SOLUTION: Move loadStudentReferrals OUTSIDE DOMContentLoaded
// ============================================

// ADD THIS FUNCTION BEFORE THE DOMContentLoaded EVENT (near the top of StudentProfile.js)
// This makes it globally accessible

// Load referrals for a specific student
async function loadStudentReferrals(studentId) {
  const container = document.getElementById('referralsListContainer');
  container.innerHTML = '<p style="text-align: center; color: #6b7280;">Loading referrals...</p>';
  
  try {
    console.log('📥 Loading referrals for student:', studentId);
    
    const response = await apiClient.getMyReferrals();
    
    if (response.success) {
      const allReferrals = response.data || [];
      // Filter referrals for this specific student (exclude deleted)
      const referrals = allReferrals.filter(ref => 
        ref.studentId === studentId && ref.status !== 'Deleted'
      );
      console.log(`✓ Loaded ${referrals.length} referrals for student ${studentId}`);
      
      if (referrals.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #6b7280;">
            <span class="material-symbols-outlined" style="font-size: 48px; color: #333;">assignment</span>
            <p>No referrals found for this student.</p>
          </div>
        `;
        return;
      }
      
      // Display referrals
      container.innerHTML = referrals.map(referral => {
        const dateString = referral.referralDate || referral.createdAt;
        let formattedDate;
        
        try {
          if (typeof dateString === 'string' && dateString.includes('-')) {
            const [year, month, day] = dateString.split('T')[0].split('-');
            const date = new Date(year, month - 1, day);
            formattedDate = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          } else {
            const date = new Date(dateString);
            formattedDate = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          }
        } catch (error) {
          console.error('Date parsing error:', error);
          formattedDate = 'Invalid Date';
        }

        const statusClass = referral.status.toLowerCase().replace(/\s+/g, '-');
        const severityClass = (referral.severity || 'Pending Assessment').toLowerCase().replace(/\s+/g, '-');
        const shouldShowSeverity = referral.status !== 'Pending' && referral.status !== 'Under Review';

        // Check if referral can still be edited (within 3 hours)
        const canEdit = canEditReferral(referral.createdAt);
        const timeRemaining = getTimeRemainingForEdit(referral.createdAt);
        
        return `
          <div class="referral-item">
            <div class="referral-header">
              <span class="referral-id">${referral.referralId || 'N/A'}</span>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="referral-date">${formattedDate}</span>
                ${canEdit ? `
                  <span style="font-size: 12px; color: #10b981; background: rgba(16, 185, 129, 0.1); 
                               padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                    ⏱️ Editable
                  </span>
                ` : ''}
              </div>
            </div>
            
            <div class="referral-details">
              <div class="referral-detail">
                <span class="detail-label">Status</span>
                <span class="status-badge status-${statusClass}">${referral.status}</span>
              </div>
              ${shouldShowSeverity ? `
                <div class="referral-detail">
                  <span class="detail-label">Severity</span>
                  <span class="severity-badge severity-${severityClass}">${referral.severity || 'Pending Assessment'}</span>
                </div>
              ` : ''}
              ${referral.category ? `
                <div class="referral-detail">
                  <span class="detail-label">Category</span>
                  <span class="detail-value">${referral.category}</span>
                </div>
              ` : ''}
              <div class="referral-detail">
                <span class="detail-label">Referred By</span>
                <span class="detail-value">${referral.referredBy || 'N/A'}</span>
              </div>
            </div>
            
            <div class="referral-reason">
              <strong>Reason:</strong>
              <p>${referral.reason}</p>
            </div>
            
            ${referral.description ? `
              <div class="referral-reason" style="border-left-color: #3b82f6; background: rgba(59, 130, 246, 0.1);">
                <strong style="color: #3b82f6;">Description:</strong>
                <p>${referral.description}</p>
              </div>
            ` : ''}
            
            ${referral.notes ? `
              <div class="referral-reason" style="border-left-color: #a78bfa; background: rgba(167, 139, 250, 0.1);">
                <strong style="color: #a78bfa;">Consultation Notes:</strong>
                <p>${referral.notes}</p>
              </div>
            ` : ''}

            <!-- Action Buttons -->
            <div class="referral-actions" style="display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              ${canEdit ? `
                <button class="btn-action btn-edit-referral" 
                        onclick="openEditReferralModal('${referral._id}', '${referral.studentId}', '${referral.studentName.replace(/'/g, "\\'")}')">
                  <span class="material-symbols-outlined">edit</span>
                  Edit (${timeRemaining ? formatTimeRemaining(timeRemaining) : 'expired'})
                </button>
              ` : `
                <button class="btn-action" style="opacity: 0.5; cursor: not-allowed;" disabled>
                  <span class="material-symbols-outlined">edit</span>
                  Edit (Expired)
                </button>
              `}
            </div>
          </div>
        `;
      }).join('');
      
    } else {
      throw new Error(response.error || 'Failed to load referrals');
    }
  } catch (error) {
    console.error('❌ Error loading referrals:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ef4444;">
        <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
        <p>Failed to load referrals: ${error.message}</p>
      </div>
    `;
  }
}
// ============================================
// PLACE ALL YOUR EDIT FUNCTIONS OUTSIDE DOMContentLoaded TOO
// ============================================

// Check if referral can be edited (within 3 hours)
function canEditReferral(referralDate) {
  if (!referralDate) return false;
  
  const now = new Date();
  const referralTime = new Date(referralDate);
  const threeHoursInMs = 3 * 60 * 60 * 1000;
  
  const timeDiff = now - referralTime;
  
  return timeDiff <= threeHoursInMs;
}

// Get time remaining until edit window closes
function getTimeRemainingForEdit(referralDate) {
  if (!referralDate) return null;
  
  const now = new Date();
  const referralTime = new Date(referralDate);
  const threeHoursInMs = 3 * 60 * 60 * 1000;
  
  const timeRemaining = threeHoursInMs - (now - referralTime);
  
  if (timeRemaining <= 0) return null;
  
  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  return { hours, minutes, ms: timeRemaining };
}

// Format time remaining display
function formatTimeRemaining(timeRemaining) {
  if (!timeRemaining) return 'Edit window closed';
  
  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`;
  } else {
    return `${timeRemaining.minutes}m remaining`;
  }
}

// Helper function to format date for input field (YYYY-MM-DD)
function formatDateForInput(dateString) {
  if (!dateString) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to format date for API (YYYY-MM-DD without timezone)
function formatDateForAPI(dateString) {
  if (!dateString) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Open Edit Referral Modal
window.openEditReferralModal = async (referralId, studentId, studentName) => {
  console.log('📝 Opening edit referral modal for:', referralId);
  
  try {
    const response = await apiClient.get(`/referrals/${referralId}`);
    
    if (!response.success) {
      showCustomAlert('Failed to load referral details', 'error');
      return;
    }
    
    const referral = response.data;
    
    if (!canEditReferral(referral.createdAt || referral.referralDate)) {
      showCustomAlert(
        'This referral can no longer be edited. The 3-hour edit window has closed.',
        'error'
      );
      return;
    }
    
    const editModal = document.getElementById('editReferralModal');
    if (!editModal) {
      console.error('Edit referral modal not found!');
      return;
    }
    
    editModal.style.display = 'block';
    
    setTimeout(() => {
      document.getElementById('edit-referralId').value = referral._id;
      document.getElementById('edit-studentId').value = referral.studentId;
      document.getElementById('edit-studentName').value = referral.studentName || studentName;
      document.getElementById('edit-level').value = referral.level;
      document.getElementById('edit-grade').value = referral.grade;
      document.getElementById('edit-reason').value = referral.reason || '';
      document.getElementById('edit-urgency').value = referral.urgency || '';
      document.getElementById('edit-description').value = referral.description || '';
      
      const dateInput = document.getElementById('edit-referralDate');
      const dateToUse = referral.referralDate || referral.createdAt || new Date();
      dateInput.value = formatDateForInput(dateToUse);
      
      console.log('✅ Date auto-filled:', dateInput.value);
      
      const timeRemaining = getTimeRemainingForEdit(referral.createdAt);
      const timeWarning = document.getElementById('edit-time-warning');
      if (timeWarning && timeRemaining) {
        timeWarning.textContent = `⏱️ ${formatTimeRemaining(timeRemaining)}`;
        timeWarning.style.display = 'block';
      }
      
      document.getElementById('editReferralForm')._originalData = referral;
    }, 50);
    
  } catch (error) {
    console.error('Error loading referral:', error);
    showCustomAlert('Failed to load referral for editing', 'error');
  }
};

// Handle Edit Referral Form Submission
function setupEditReferralFormHandler() {
  const editForm = document.getElementById('editReferralForm');
  
  if (!editForm) {
    console.error('Edit referral form not found!');
    return;
  }
  
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const referralId = document.getElementById('edit-referralId').value;
    const dateValue = document.getElementById('edit-referralDate').value;
    const formattedDate = formatDateForAPI(dateValue);
    
    const updatedData = {
      reason: document.getElementById('edit-reason').value.trim(),
      urgency: document.getElementById('edit-urgency').value,
      description: document.getElementById('edit-description').value.trim() || undefined,
      referralDate: formattedDate
    };
    
    console.log('📝 Updating referral:', referralId, updatedData);
    
    try {
      const submitBtn = editForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Saving...';
      
      const response = await apiClient.put(`/referrals/${referralId}`, updatedData);
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      
      if (response.success) {
        console.log('✅ Referral updated successfully!');
        
        const editModal = document.getElementById('editReferralModal');
        editModal.style.display = 'none';
        editForm.reset();
        
        if (typeof customAlert !== 'undefined' && customAlert.success) {
          customAlert.success('Referral has been updated successfully!', 'Success!');
        } else {
          alert('✅ Referral updated successfully!');
        }
        
        // NOW THIS WILL WORK - loadStudentReferrals is global
        const viewReferralsModal = document.getElementById('viewReferralsModal');
        if (viewReferralsModal && viewReferralsModal.style.display === 'block') {
          const studentId = document.getElementById('edit-studentId').value;
          await loadStudentReferrals(studentId);
        }
        
      } else {
        throw new Error(response.error || 'Failed to update referral');
      }
    } catch (error) {
      console.error('❌ Error updating referral:', error);
      
      const submitBtn = editForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined">edit</span> Save Changes';
      
      const errorMsg = error.message || 'Failed to update referral';
      if (typeof customAlert !== 'undefined' && customAlert.error) {
        customAlert.error(errorMsg, 'Error!');
      } else {
        alert('❌ Error: ' + errorMsg);
      }
    }
  });
}

// Initialize edit modal handlers
function initEditReferralModal() {
  const editModal = document.getElementById('editReferralModal');
  const closeEditModalBtn = document.getElementById('closeEditReferralModal');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  
  if (!editModal) {
    console.error('Edit referral modal not found in DOM!');
    return;
  }
  
  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', () => {
      editModal.style.display = 'none';
      document.getElementById('editReferralForm').reset();
    });
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      editModal.style.display = 'none';
      document.getElementById('editReferralForm').reset();
    });
  }
  
  window.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.style.display = 'none';
      document.getElementById('editReferralForm').reset();
    }
  });
  
  setupEditReferralFormHandler();
  
  console.log('✅ Edit referral modal initialized');
}});
