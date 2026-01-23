// ============================================
// COMPLETE API-CLIENT.JS - FIXED: Token Persistence & Better Error Handling
// ============================================

// 🔧 Automatically detect the correct API URL based on environment
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  
  // Production (Render deployment)
  if (hostname.includes('onrender.com')) {
    return `${window.location.origin}/api`;
  }
  
  // Localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://localhost:3000/api";
  }
  
  // Fallback
  return `${window.location.origin}/api`;
})();

console.log("🌐 API Base URL configured:", API_BASE_URL);
console.log("🌐 Current hostname:", window.location.hostname);
console.log("🌐 Current origin:", window.location.origin);

class APIClient {
  constructor() {
    // ✅ FIXED: Don't store token in memory, always get from localStorage
    console.log("✅ APIClient initialized with API URL:", API_BASE_URL);
    this.logTokenStatus();
  }

  // ✅ NEW: Helper to log token status
  logTokenStatus() {
    const token = this.getToken();
    if (token) {
      console.log("🎫 Token found:", token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ No token found in localStorage");
    }
  }

  // ✅ CRITICAL FIX: Always get fresh token from localStorage
  getToken() {
    return localStorage.getItem("token") || localStorage.getItem("authToken") || null;
  }

  setToken(token) {
    if (!token) {
      console.error("❌ Attempted to set null/undefined token");
      return;
    }
    
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
    console.log("✅ Token saved to localStorage");
  }

  removeToken() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    console.log("🗑️ All tokens and user data removed");
  }

  getHeaders(isFileUpload = false) {
    const headers = {};
    
    if (!isFileUpload) {
      headers["Content-Type"] = "application/json";
    }
    
    // ✅ CRITICAL FIX: Always get fresh token from localStorage
    const token = this.getToken();
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token available for request");
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFileUpload = options.body instanceof FormData;
    
    const config = { 
      ...options, 
      headers: this.getHeaders(isFileUpload) 
    };
    
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    // ✅ Enhanced logging
    if (config.headers.Authorization) {
      console.log("🔑 Request includes Authorization header");
    } else {
      console.warn("⚠️ Request missing Authorization header - this may fail!");
    }
    
    try {
      const response = await fetch(url, config);
      
      // ✅ CRITICAL: Better error handling for 401/403
      if (response.status === 401 || response.status === 403) {
        console.error(`❌ ${response.status} - Authentication failed`);
        console.error("🔍 Token in localStorage:", this.getToken() ? "Present" : "Missing");
        
        try {
          const errorData = await response.json();
          console.error("❌ Server error:", errorData.message || errorData.error);
          
          // If unauthorized, might need to re-login
          if (response.status === 401) {
            console.error("🚨 Session expired - please login again");
            // Optionally redirect to login
            // window.location.href = '/pages/LoginForm.html?logout=true';
          }
          
          return { 
            success: false, 
            error: errorData.message || errorData.error || "Authentication failed",
            message: errorData.message || errorData.error || "Authentication failed",
            status: response.status
          };
        } catch (e) {
          return {
            success: false,
            error: "Authentication failed - please login again",
            message: "Authentication failed - please login again",
            status: response.status
          };
        }
      }
      
      const data = await response.json();
      
      console.log(`📥 Response [${response.status}]:`, data);
      
      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || "Request failed",
          message: data.message || data.error || "Request failed",
          status: response.status
        };
      }
      
      return { 
        success: true, 
        message: data.message || "Success",
        status: response.status,
        ...data
      };
    } catch (error) {
      console.error("❌ API request error:", error);
      return { 
        success: false, 
        error: error.message || "Request failed",
        message: error.message || "Request failed",
        status: 0
      };
    }
  }

  // ============================================
  // GENERIC HTTP METHODS
  // ============================================
  
  async get(endpoint) {
    return this.request(endpoint, {
      method: "GET"
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE"
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }

  // ============================================
  // FILE UPLOAD METHOD
  // ============================================
  
  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: "POST",
      body: formData
    });
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  async login(username, password) { 
    return this.post("/auth/login", { username, password }); 
  }
  
  async forgotPassword({ username, email }) { 
    return this.post("/auth/forgot-password", { username, email }); 
  }
  
  // ============================================
  // USER ENDPOINTS
  // ============================================
  
  async getUserProfile() { 
    return this.get("/users/profile"); 
  }
  
  async changePassword(currentPassword, newPassword) { 
    return this.post("/users/change-password", { currentPassword, newPassword }); 
  }
  
  async createUser(userData) { 
    return this.post("/users/create", userData); 
  }
  
  async getAllUsers() { 
    return this.get("/users"); 
  }
  
  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }
  
  async toggleUserStatus(userId, isActive) { 
    return this.put(`/users/${userId}/toggle-status`, { isActive }); 
  }
  
  async adminResetPassword(userId, newPassword) { 
    return this.put(`/users/${userId}/reset-password`, { newPassword }); 
  }
  
  async archiveUser(userId) {
    return this.put(`/users/${userId}/archive`, {});
  }
  
  async restoreUser(userId) {
    return this.put(`/users/${userId}/restore`, {});
  }
  
  // ============================================
  // ADVISER ENDPOINTS
  // ============================================
  
  async getAdvisers() {
    console.log("👨‍🏫 Fetching all advisers...");
    return this.get("/advisers/advisers");
  }
  
  async getStudentsByAdviser(adviserName) {
    console.log("👨‍🎓 Fetching students for adviser:", adviserName);
    return this.get(`/advisers/adviser/${encodeURIComponent(adviserName)}`);
  }
  
  async getAllStudentsForCounselor() {
    console.log("👥 Fetching all students for counselor view...");
    return this.get("/advisers/all-students");
  }
  
  // ============================================
  // STUDENT SUBMISSION ENDPOINTS
  // ============================================
  
  async submitStudentConcern(data) {
    console.log("📝 Submitting student concern...");
    return this.post("/student-submissions/submit", data);
  }
  
  async getStudentSubmissions(filters = {}) {
    console.log("📋 Fetching student submissions...");
    const q = new URLSearchParams(filters).toString();
    return this.get(q ? `/student-submissions?${q}` : "/student-submissions");
  }
  
  async getStudentSubmission(id) {
    console.log("📋 Fetching student submission:", id);
    return this.get(`/student-submissions/${id}`);
  }
  
  async updateStudentSubmission(id, data) {
    console.log("✏️ Updating student submission:", id);
    return this.put(`/student-submissions/${id}`, data);
  }
  
  async processStudentSubmission(id, data) {
    console.log("🔄 Processing student submission:", id, "→ Creating official referral");
    return this.post(`/student-submissions/${id}/process`, data);
  }
  
  async deleteStudentSubmission(id) {
    console.log("🗑️ Deleting student submission:", id);
    return this.delete(`/student-submissions/${id}`);
  }
  
  async getStudentSubmissionStats() {
    console.log("📊 Fetching student submission stats...");
    return this.get("/student-submissions/stats/summary");
  }
  
  // ============================================
  // REFERRAL ENDPOINTS (STAFF REFERRALS ONLY)
  // ============================================
  
  async getReferrals(filters = {}) { 
    const q = new URLSearchParams(filters).toString(); 
    return this.get(q ? `/referrals?${q}` : "/referrals"); 
  }
  
  async getReferralById(id) { 
    return this.get(`/referrals/${id}`); 
  }
  
  async createReferral(referralData) { 
    return this.post("/referrals", referralData); 
  }
  
  async updateReferral(id, referralData) { 
    return this.put(`/referrals/${id}`, referralData); 
  }
  
  async deleteReferral(id) { 
    return this.delete(`/referrals/${id}`); 
  }
  
  async getReferralStats() { 
    return this.get("/referrals/stats"); 
  }

  async getMyReferrals() {
    console.log("📋 Fetching my referrals (teacher-authorized endpoint)...");
    return this.get("/referrals/my-referrals");
  }
  
  // ============================================
  // STUDENT ENDPOINTS
  // ============================================
  
  async getStudents(filters = {}) { 
    const q = new URLSearchParams(filters).toString(); 
    return this.get(q ? `/students?${q}` : "/students"); 
  }
  
  async getStudentById(id) { 
    return this.get(`/students/${id}`); 
  }
  
  async createStudent(studentData) { 
    return this.post("/students", studentData); 
  }
  
  async updateStudent(id, studentData) { 
    return this.put(`/students/${id}`, studentData); 
  }
  
  async deleteStudent(id) { 
    return this.delete(`/students/${id}`); 
  }
  
  async addConsultation(studentId, consultationData) { 
    return this.post(`/students/${studentId}/consultation`, consultationData); 
  }
  
  async getStudentStats() { 
    return this.get("/students/stats/overview"); 
  }

  async searchStudents(query) {
    console.log("🔍 Searching students:", query);
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }
    return this.get(`/students/search?q=${encodeURIComponent(query)}`);
  }

  // ============================================
  // CATEGORY ENDPOINTS
  // ============================================
  
  async getCategories() {
    console.log("📋 Fetching categories...");
    return this.get("/categories");
  }
  
  async getCategoryById(id) {
    console.log("📋 Fetching category:", id);
    return this.get(`/categories/${id}`);
  }
  
  async createCategory(categoryData) {
    console.log("➕ Creating category:", categoryData);
    return this.post("/categories", categoryData);
  }
  
  async updateCategory(id, categoryData) {
    console.log("✏️ Updating category:", id, categoryData);
    return this.put(`/categories/${id}`, categoryData);
  }
  
  async deleteCategory(id) {
    console.log("🗑️ Deleting category:", id);
    return this.delete(`/categories/${id}`);
  }

  // ============================================
  // BULK UPLOAD & TEMPLATE
  // ============================================
  
  async bulkUploadStudents(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.upload("/students/bulk-upload", formData);
  }
  
  async downloadStudentTemplate() {
    const url = `${API_BASE_URL}/students/download-template`;
    const headers = this.getHeaders();
    
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'student_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, message: 'Template downloaded' };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, message: error.message };
    }
  }
}

// ============================================
// CREATE SINGLETON INSTANCE
// ============================================
const apiClient = new APIClient();

console.log("✅ apiClient loaded. Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(apiClient)));

// Export for Node.js (if used in backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiClient;
}

// ✅ CRITICAL FIX: Make available globally in browser
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
  console.log("✅ apiClient attached to window object");
  console.log("✅ API will connect to:", API_BASE_URL);
}
