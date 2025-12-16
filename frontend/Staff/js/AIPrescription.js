// API Configuration
const API_BASE = 'http://localhost:3000/api';
let countdownInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAvailability();
    setupEventListeners();
    loadThisWeek();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Form submission
    document.getElementById('prescribeForm').addEventListener('submit', handlePrescribe);
}

// Check if prescription is allowed
async function checkAvailability() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/check-availability`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        updateStatusBanner(data);
        updatePrescribeTab(data); // NEW: Update the tab content based on availability

        if (!data.allowed) {
            document.getElementById('submitBtn')?.setAttribute('disabled', 'true');
            startCountdown(data.timeUntilNext);
        }
    } catch (error) {
        console.error('Error checking availability:', error);
        showError('Failed to check availability. Please try again.');
    }
}

// NEW: Update the New Prescription tab content based on availability
function updatePrescribeTab(data) {
    const prescribeTab = document.getElementById('tab-prescribe');
    
    if (!prescribeTab) return;
    
    if (!data.allowed) {
        // Show blocked message matching the exact design from screenshot
        prescribeTab.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(16, 40, 28, 0.9) 0%, rgba(10, 25, 18, 0.95) 100%);
                border: 2px solid rgba(16, 185, 129, 0.4);
                border-radius: 20px;
                padding: 3rem 2rem;
                min-height: 500px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2rem;
                box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
                position: relative;
            ">
                <!-- Content Box -->
                <div style="
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 3rem 2.5rem;
                    width: 100%;
                    max-width: 700px;
                    text-align: center;
                ">
                    <!-- Icon -->
                    <div style="
                        width: 60px;
                        height: 60px;
                        margin: 0 auto 1.5rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.5rem;
                        color: #ef4444;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 3rem;">block</span>
                    </div>
                    
                    <!-- Title -->
                    <h2 style="
                        font-size: 1.75rem;
                        font-weight: 700;
                        color: #f1f5f9;
                        margin: 0 0 1.5rem 0;
                        line-height: 1.3;
                    ">
                        Weekly Limit Reached
                    </h2>
                    
                    <!-- Message -->
                    <p style="
                        font-size: 1.1rem;
                        color: #cbd5e1;
                        margin: 0 0 1rem 0;
                        line-height: 1.6;
                    ">
                        A prescription has already been created this week.
                    </p>
                    
                    <p style="
                        font-size: 1.05rem;
                        color: #94a3b8;
                        margin: 0;
                        line-height: 1.6;
                    ">
                        Please check back on Monday for your next weekly prescription.
                    </p>
                </div>
                
                <!-- View Prescription Button -->
                <button 
                    onclick="switchTab('current')" 
                    style="
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border: none;
                        padding: 1.25rem 3rem;
                        border-radius: 12px;
                        font-size: 1.15rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        min-width: 300px;
                        justify-content: center;
                    "
                    onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(16, 185, 129, 0.5)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(16, 185, 129, 0.4)';"
                >
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>View This Week's Prescription</span>
                </button>
            </div>
        `;
    } else {
        // Show the form (restore original form if it was replaced)
        const existingForm = prescribeTab.querySelector('#prescribeForm');
        if (!existingForm) {
            prescribeTab.innerHTML = `
                <form id="prescribeForm">
                    <div class="form-group">
                        <label for="issue">
                            <strong>Trending Student Issue This Week</strong>
                            <span style="color: var(--danger);">*</span>
                        </label>
                        <textarea 
                            id="issue" 
                            name="issue" 
                            placeholder="Describe the trending issue among students this week...

Examples:
• High number of behavioral referrals
• Increased anxiety/stress reports
• Academic performance concerns
• Attendance issues
• Social conflicts or bullying incidents"
                            required
                            rows="7"
                            aria-required="true"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Additional Context</strong> <span style="color: var(--text-muted); font-weight: 400;">(Optional)</span></label>
                        <div class="context-grid">
                            <input 
                                type="text" 
                                id="affectedGrade" 
                                placeholder="Affected grade level (e.g., Grade 10)"
                                aria-label="Affected grade level"
                            >
                            <input 
                                type="text" 
                                id="numberOfCases" 
                                placeholder="Number of cases/students"
                                aria-label="Number of cases"
                            >
                            <input 
                                type="text" 
                                id="trend" 
                                placeholder="Trend (e.g., Increased 40%)"
                                aria-label="Trend data"
                            >
                            <input 
                                type="text" 
                                id="category" 
                                placeholder="Category (Behavioral/Academic)"
                                aria-label="Issue category"
                            >
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <span class="material-symbols-outlined" style="vertical-align: middle;">psychology</span> Generate AI Solution for This Week
                    </button>
                </form>
            `;
            
            // Re-attach form submission handler
            document.getElementById('prescribeForm').addEventListener('submit', handlePrescribe);
        }
    }
}

// Update status banner
function updateStatusBanner(data) {
    const banner = document.getElementById('statusBanner');
    
    if (data.allowed) {
        banner.className = 'status-banner available';
        banner.innerHTML = `
            <h2>Ã¢Å“â€¦ Ready to Prescribe</h2>
            <p>You can create a prescription for this week!</p>
            <p class="status-date">Week of ${new Date().toLocaleDateString()}</p>
        `;
    } else {
        const lastDate = new Date(data.lastPrescriptionDate);
        banner.className = 'status-banner blocked';
        banner.innerHTML = `
            <h2>â›” Weekly Limit Reached</h2>
            <p>A prescription has already been created this week</p>
            <div class="countdown" id="countdown">Calculating...</div>
            <p class="countdown-label">Until next prescription</p>
            <p class="status-info">
                Last prescription: ${lastDate.toLocaleString()}<br>
                Current week: ${new Date(data.currentWeek.start).toLocaleDateString()} - 
                ${new Date(data.currentWeek.end).toLocaleDateString()}
            </p>
            <button class="btn-view-prescription" onclick="switchTab('current')"><span class="material-symbols-outlined" style="vertical-align: middle;">description</span> 
                ðŸ“‹ View This Week's Prescription
            </button>
        `;
    }
}

// Start countdown timer
function startCountdown(timeUntil) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const now = new Date();
        const target = new Date(timeUntil.nextMonday);
        const diff = target - now;

        if (diff <= 0) {
            clearInterval(countdownInterval);
            location.reload();
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

// Get week expiry information
function getWeekExpiry() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + diff);
    sunday.setHours(23, 59, 59, 999);
    
    const timeUntilExpiry = sunday - now;
    const days = Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return {
        expiryDate: sunday,
        daysLeft: days,
        hoursLeft: hours,
        timeUntilExpiry: timeUntilExpiry
    };
}

// Get week end date formatted
function getWeekEndDate() {
    const expiry = getWeekExpiry();
    return expiry.expiryDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Render prescription with expiry information
function renderPrescriptionWithExpiry(p, expiry) {
    const expiryBanner = `
        <div class="expiry-banner">
            <div class="expiry-info">
                <span class="expiry-icon">â°</span>
                <div class="expiry-text">
                    <strong>Active This Week</strong>
                    <p>Expires ${expiry.expiryDate.toLocaleDateString()} at midnight</p>
                    <p class="expiry-countdown">${expiry.daysLeft}d ${expiry.hoursLeft}h remaining</p>
                </div>
            </div>
        </div>
    `;
    
    return expiryBanner + renderPrescription(p);
}


// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Load content if needed
    if (tabName === 'current') loadThisWeek();
    if (tabName === 'history') loadHistory();
}

// Load this week's prescription
async function loadThisWeek() {
    const content = document.getElementById('currentWeekContent');
    content.innerHTML = '<div class="loading-spinner"></div><p>Loading...</p>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/this-week`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success && data.prescription) {
            const weekExpiry = getWeekExpiry();
            content.innerHTML = renderPrescriptionWithExpiry(data.prescription, weekExpiry);
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>Ã°Å¸â€œÂ­ No Prescription Yet</h3>
                    <p>Create one in the "New Prescription" tab!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading this week:', error);
        content.innerHTML = '<div class="error-message">Failed to load data</div>';
    }
}

// Load history
async function loadHistory() {
    const content = document.getElementById('historyContent');
    content.innerHTML = '<div class="loading-spinner"></div><p>Loading...</p>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.prescriptions.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>Ã°Å¸â€œÂ­ No History Yet</h3>
                    <p>Your prescription history will appear here</p>
                </div>
            `;
            return;
        }

        let html = `<h3 class="history-title">Ã°Å¸â€œÅ¡ Past Prescriptions (${data.total})</h3>`;
        
        data.prescriptions.forEach(p => {
            const date = new Date(p.timestamp);
            html += `
                <div class="history-item" onclick='showHistoryDetail(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                    <div class="history-header">
                        <span class="history-week">Week ${p.week} (${p.year})</span>
                        <span class="history-date">${date.toLocaleDateString()}</span>
                    </div>
                    <div class="history-issue">${p.issue}</div>
                    <div class="history-meta">
                        <span class="severity-badge severity-${p.solution.severity}">${p.solution.severity.toUpperCase()}</span>
                        <span class="history-cost">Cost: $${p.cost}</span>
                    </div>
                </div>
            `;
        });

        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading history:', error);
        content.innerHTML = '<div class="error-message">Failed to load history</div>';
    }
}

// Handle prescription form submission
async function handlePrescribe(e) {
    e.preventDefault();

    const issue = document.getElementById('issue').value;
    const context = {
        affectedGrade: document.getElementById('affectedGrade').value,
        numberOfCases: document.getElementById('numberOfCases').value,
        trend: document.getElementById('trend').value,
        category: document.getElementById('category').value
    };

    // Remove empty context fields
    Object.keys(context).forEach(key => {
        if (!context[key]) delete context[key];
    });

    showLoading();

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/prescribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ issue, context })
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            showResults(result);
            checkAvailability(); // Refresh status
            
            // Show success message
            showSuccess('Ã¢Å“â€¦ Weekly prescription created successfully!');
            
            // Clear form
            document.getElementById('prescribeForm').reset();
        } else if (result.blocked) {
            showError(result.message);
        } else {
            showError(result.error || 'Failed to create prescription');
        }
    } catch (error) {
        hideLoading();
        console.error('Error creating prescription:', error);
        showError('Failed to create prescription. Please try again.');
    }
}

// Render prescription
function renderPrescription(p) {
    const date = new Date(p.timestamp);
    let html = `
        <div class="prescription-card">
            <div class="week-info">
                <strong>Ã°Å¸â€œâ€¦ Week ${p.week} (${p.year})</strong>
                <span class="week-date">Prescribed on ${date.toLocaleString()}</span>
            </div>

            <h2 class="issue-title">Ã°Å¸â€œâ€¹ ${p.issue}</h2>

            <span class="severity-badge severity-${p.solution.severity}">
                Ã°Å¸Å¡Â¨ ${p.solution.severity.toUpperCase()} Severity
            </span>

            <div class="root-cause">
                <strong>Ã°Å¸â€œÅ’ Root Cause:</strong>
                <p>${p.solution.root_cause}</p>
            </div>

            <h3>Ã°Å¸â€™Â¡ Solutions</h3>
            ${p.solution.solutions.map((sol, i) => `
                <div class="solution-card">
                    <h4>${i + 1}. ${sol.title}</h4>
                    <ul class="steps-list">
                        ${sol.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                    <div class="impact">
                        <strong>Impact:</strong> ${sol.impact}
                    </div>
                </div>
            `).join('')}
    `;

    if (p.solution.quick_wins && p.solution.quick_wins.length > 0) {
        html += `
            <div class="quick-wins">
                <h4>âš¡ Quick Wins</h4>
                <ul>
                    ${p.solution.quick_wins.map(win => `<li>${win}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    html += `
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid rgba(74, 222, 128, 0.2);">
            <button onclick="closeModal()" class="btn btn-close-prescription">
                âœ“ Close Prescription
            </button>
        </div>
    `;

    html += '</div>';
    return html;
}

// Show history detail in modal
function showHistoryDetail(prescription) {
    const modal = document.getElementById('resultsModal');
    const content = document.getElementById('resultsContent');
    content.innerHTML = renderPrescription(prescription);
    modal.style.display = 'block';
}

// Show results in modal
function showResults(result) {
    const modal = document.getElementById('resultsModal');
    const content = document.getElementById('resultsContent');
    content.innerHTML = renderPrescription(result);
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    // First, dismiss any active custom alerts
    if (typeof showCustomAlert !== 'undefined' && showCustomAlert.close) {
        showCustomAlert.close();
    }
    
    // Remove any visible alert containers
    const alertContainers = document.querySelectorAll('.custom-alert-container, .alert-overlay');
    alertContainers.forEach(container => container.remove());
    
    // Close the modal
    const modal = document.getElementById('resultsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show/hide loading
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Show success message
function showSuccess(message) {
    // Use your existing custom alert system
    if (typeof showCustomAlert === 'function') {
        showCustomAlert(message, 'success');
    } else {
        alert(message);
    }
}

// Show error message
function showError(message) {
    // Use your existing custom alert system
    if (typeof showCustomAlert === 'function') {
        showCustomAlert(message, 'error');
    } else {
        alert(message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('resultsModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Add this function to automatically switch to current prescription when limit is reached
function updateStatusBanner(data) {
    const banner = document.getElementById('statusBanner');
    
    if (data.allowed) {
        banner.className = 'status-banner available';
        banner.innerHTML = `
            <h2>âœ… Ready to Prescribe</h2>
            <p>You can create a prescription for this week!</p>
            <p class="status-date">Week of ${new Date().toLocaleDateString()}</p>
        `;
    } else {
        const lastDate = new Date(data.lastPrescriptionDate);
        banner.className = 'status-banner blocked';
        banner.innerHTML = `
            <h2>â¸ï¸ Weekly Limit Reached</h2>
            <p>A prescription has already been created this week</p>
            <div class="countdown" id="countdown">Calculating...</div>
            <p class="countdown-label">Until next prescription</p>
            <p class="status-info">
                Last prescription: ${lastDate.toLocaleString()}<br>
                Current week: ${new Date(data.currentWeek.start).toLocaleDateString()} - 
                ${new Date(data.currentWeek.end).toLocaleDateString()}
            </p>
            <button class="btn btn-view-prescription" onclick="switchTab('current')">
                ðŸ“‹ View This Week's Prescription
            </button>
        `;
    }
}