// ==========================================
// API CLIENT - Frontend to Backend Communication
// ==========================================

class APIClient {
    constructor() {
        // Auto-detect the correct base URL based on current location
        const currentUrl = window.location.origin;
        this.baseURL = `${currentUrl}/api`;
        this.token = localStorage.getItem('authToken');
    }

    // ==========================================
    // AUTHENTICATION METHODS
    // ==========================================

    async register(userData) {
        console.log('API Register called with:', userData);
        const response = await this.post('/auth/register', userData);
        console.log('API Register response:', response);
        if (response.success) {
            this.token = response.data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        if (response.success) {
            this.token = response.data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async getProfile() {
        return await this.get('/auth/me');
    }

    async updateProfile(profileData) {
        return await this.put('/auth/profile', profileData);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // ==========================================
    // COMPLAINT METHODS
    // ==========================================

    async createComplaint(complaintData) {
        return await this.post('/complaints/create', complaintData);
    }

    async createComplaintWithMedia(formData) {
        return await this.postFile('/complaints/create', formData);
    }

    async getAllComplaints() {
        return await this.get('/complaints/all');
    }

    async getMyComplaints() {
        return await this.get('/complaints/my-complaints');
    }

    async getComplaintById(id) {
        return await this.get(`/complaints/${id}`);
    }

    async updateComplaintStatus(id, status, note) {
        return await this.put(`/complaints/${id}/status`, { status, note });
    }

    async escalateComplaint(id, reason, newLevel) {
        return await this.put(`/complaints/${id}/escalate`, { reason, newLevel });
    }

    async getEscalations(id) {
        return await this.get(`/complaints/${id}/escalations`);
    }

    async getStatistics() {
        return await this.get('/complaints/statistics');
    }

    async getAnalytics() {
        return await this.get('/complaints/analytics');
    }

    async searchComplaints(params) {
        const queryString = new URLSearchParams(params).toString();
        return await this.get(`/complaints/search?${queryString}`);
    }

    async deleteComplaint(id) {
        return await this.delete(`/complaints/${id}`);
    }

    async submitFeedback(id, feedbackData) {
        return await this.post(`/complaints/${id}/feedback`, feedbackData);
    }

    // ==========================================
    // USER METHODS
    // ==========================================

    async getAllUsers() {
        return await this.get('/users/all');
    }

    async getUserById(id) {
        return await this.get(`/users/${id}`);
    }

    async updateUser(id, userData) {
        return await this.put(`/users/${id}`, userData);
    }

    // ==========================================
    // HTTP HELPERS
    // ==========================================

    async get(endpoint) {
        return await this.request('GET', endpoint);
    }

    async post(endpoint, data) {
        return await this.request('POST', endpoint, data);
    }

    async put(endpoint, data) {
        return await this.request('PUT', endpoint, data);
    }

    async delete(endpoint) {
        return await this.request('DELETE', endpoint);
    }

    async postFile(endpoint, formData) {
        try {
            const headers = {};

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            // Don't set Content-Type for FormData, browser will set it with boundary
            const config = {
                method: 'POST',
                headers
            };

            if (formData) {
                config.body = formData;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'File upload failed');
            }

            return result;
        } catch (error) {
            console.error('File Upload Error:', error);
            // Provide more helpful error messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }

    async request(method, endpoint, data = null) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const config = {
                method,
                headers
            };

            if (data) {
                config.body = JSON.stringify(data);
            }

            const fullUrl = `${this.baseURL}${endpoint}`;
            console.log('Making API request to:', fullUrl, 'Method:', method, 'Data:', data);
            
            const response = await fetch(fullUrl, config);
            
            console.log('Response status:', response.status, response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Response body:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Request failed');
            }

            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            // Provide more helpful error messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }
}

// Create global instance
const api = new APIClient();
