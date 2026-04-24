// ==========================================
// OFFICER PORTAL SCRIPT - WITH BACKEND INTEGRATION
// ==========================================

let currentUser = null;
let allComplaints = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

function checkAuth() {
    currentUser = api.getCurrentUser();
    
    if (currentUser && currentUser.role === 'officer') {
        showAuthenticatedUI();
    } else {
        showGuestUI();
    }
}

function showAuthenticatedUI() {
    // Hide guest elements, show authenticated elements
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
    
    // Update user name
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('welcomeName').textContent = currentUser.name;
    
    // Load complaints and analytics
    loadAllComplaints();
    loadAnalytics();
}

function showGuestUI() {
    // Show guest elements, hide authenticated elements
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
}

async function login(email, password) {
    try {
        const response = await api.login({ email, password });
        
        if (response.success) {
            currentUser = response.data.user;
            
            // Check if user is an officer
            if (currentUser.role !== 'officer') {
                showLoginMessage('This portal is for officers only. Please use the Citizen Portal.', 'danger');
                api.logout();
                return false;
            }
            
            showLoginMessage('Login successful! Redirecting...', 'success');
            showAuthenticatedUI();
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            
            return true;
        }
    } catch (error) {
        showLoginMessage(error.message || 'Login failed', 'danger');
        return false;
    }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

let forgotPasswordEmail = '';

async function requestPasswordReset(email) {
    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showForgotMessage(data.message, 'success');
            
            // In development mode, show token and move to step 2
            if (data.data && data.data.resetToken) {
                forgotPasswordEmail = email;
                
                // Show token in alert
                setTimeout(() => {
                    alert(`🔑 Your Reset Token (Development Mode):\n\n${data.data.resetToken}\n\nCopy this token to reset your password.`);
                    
                    // Switch to step 2
                    document.getElementById('forgotStep1').style.display = 'none';
                    document.getElementById('forgotStep2').style.display = 'block';
                }, 500);
            }
            
            return true;
        } else {
            showForgotMessage(data.message, 'danger');
            return false;
        }
    } catch (error) {
        showForgotMessage('Failed to send reset request', 'danger');
        return false;
    }
}

async function resetPassword(token, newPassword) {
    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: forgotPasswordEmail,
                resetToken: token,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResetMessage(data.message, 'success');
            
            // Reset form and go back to step 1
            setTimeout(() => {
                document.getElementById('forgotPasswordForm').reset();
                document.getElementById('resetPasswordForm').reset();
                document.getElementById('forgotStep1').style.display = 'block';
                document.getElementById('forgotStep2').style.display = 'none';
                
                // Close modal and show login
                bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal')).hide();
                setTimeout(() => {
                    new bootstrap.Modal(document.getElementById('loginModal')).show();
                }, 300);
            }, 2000);
            
            return true;
        } else {
            showResetMessage(data.message, 'danger');
            return false;
        }
    } catch (error) {
        showResetMessage('Failed to reset password', 'danger');
        return false;
    }
}

function showForgotMessage(message, type) {
    const messageDiv = document.getElementById('forgotMessage');
    messageDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function showResetMessage(message, type) {
    const messageDiv = document.getElementById('resetMessage');
    messageDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

async function register(userData) {
    try {
        // Add officer role
        userData.role = 'officer';
        
        const response = await api.register(userData);
        
        if (response.success) {
            currentUser = response.data.user;
            showRegisterMessage('Registration successful! You are now logged in as officer.', 'success');
            showAuthenticatedUI();
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            
            return true;
        }
    } catch (error) {
        showRegisterMessage(error.message || 'Registration failed', 'danger');
        return false;
    }
}

function logout() {
    api.logout();
    currentUser = null;
    allComplaints = [];
    showGuestUI();
    window.location.reload();
}

function showLoginMessage(message, type) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.innerHTML = `
        <div class="alert alert-${type} mt-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
        </div>
    `;
    
    setTimeout(() => messageDiv.innerHTML = '', 5000);
}

function showRegisterMessage(message, type) {
    const messageDiv = document.getElementById('registerMessage');
    messageDiv.innerHTML = `
        <div class="alert alert-${type} mt-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
        </div>
    `;
    
    setTimeout(() => messageDiv.innerHTML = '', 5000);
}

// ==========================================
// COMPLAINT MANAGEMENT FUNCTIONS
// ==========================================

async function loadAllComplaints() {
    try {
        const response = await api.getAllComplaints();
        
        if (response.success) {
            allComplaints = response.data;
            updateStats();
            renderComplaints();
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
        document.getElementById('complaintsTableO').innerHTML = `
            <tr><td colspan="8" class="text-center text-danger">Error loading complaints</td></tr>
        `;
    }
}

function updateStats() {
    const total = allComplaints.length;
    const pending = allComplaints.filter(c => c.status === 'pending').length;
    const inProgress = allComplaints.filter(c => c.status === 'in_progress').length;
    const resolved = allComplaints.filter(c => c.status === 'resolved').length;
    
    document.getElementById('totalO').textContent = total;
    document.getElementById('pendingO').textContent = pending;
    document.getElementById('inProgressO').textContent = inProgress;
    document.getElementById('resolvedO').textContent = resolved;
}

function renderComplaints() {
    const tbody = document.getElementById('complaintsTableO');
    const searchTerm = document.getElementById('searchO').value.trim().toLowerCase();
    const filterStatus = document.getElementById('filterStatusO').value;
    
    let filtered = allComplaints;
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.id.toLowerCase().includes(searchTerm) ||
            c.title.toLowerCase().includes(searchTerm) ||
            c.name.toLowerCase().includes(searchTerm) ||
            c.email.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (filterStatus) {
        filtered = filtered.filter(c => c.status === filterStatus);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No complaints found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(complaint => {
        // Check if complaint has media attachments
        let mediaIcon = '';
        if (complaint.mediaType && complaint.mediaType !== 'text') {
            if (complaint.mediaType === 'photo') {
                mediaIcon = ' <i class="fas fa-image text-info" title="Has Photos"></i>';
            } else if (complaint.mediaType === 'video') {
                mediaIcon = ' <i class="fas fa-video text-danger" title="Has Video"></i>';
            } else if (complaint.mediaType === 'voice') {
                mediaIcon = ' <i class="fas fa-microphone text-warning" title="Has Voice Recording"></i>';
            } else if (complaint.mediaType === 'multiple') {
                mediaIcon = ' <i class="fas fa-paperclip text-primary" title="Has Multiple Attachments"></i>';
            }
        }
        
        return `
        <tr>
            <td><strong>${complaint.id}</strong></td>
            <td>${complaint.title}${mediaIcon}</td>
            <td>
                <div>${complaint.name}</div>
                <small class="text-muted">${complaint.email}</small>
            </td>
            <td>${complaint.category}</td>
            <td>${getStatusBadge(complaint.status)}</td>
            <td>${getPriorityBadge(complaint.priority)}</td>
            <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="viewComplaint('${complaint.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

async function viewComplaint(id) {
    try {
        const response = await api.getComplaintById(id);
        
        if (response.success) {
            const complaint = response.data;
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="fas fa-user"></i> Citizen Information</h6>
                        <p><strong>Name:</strong> ${complaint.name}</p>
                        <p><strong>Email:</strong> ${complaint.email}</p>
                        <p><strong>Phone:</strong> ${complaint.phone || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="fas fa-clipboard"></i> Complaint Details</h6>
                        <p><strong>ID:</strong> ${complaint.id}</p>
                        <p><strong>Title:</strong> ${complaint.title}</p>
                        <p><strong>Category:</strong> ${complaint.category}</p>
                        <p><strong>Priority:</strong> ${getPriorityBadge(complaint.priority)}</p>
                        <p><strong>Status:</strong> ${getStatusBadge(complaint.status)}</p>
                        <p><strong>Location:</strong> ${complaint.location}</p>
                        <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="mt-3">
                    <h6><i class="fas fa-align-left"></i> Description</h6>
                    <p class="text-muted">${complaint.description}</p>
                </div>
                
                ${complaint.mediaType && complaint.mediaType !== 'text' ? `
                <div class="mt-4">
                    <h6><i class="fas fa-paperclip"></i> Attached Evidence (${complaint.mediaType})</h6>
                    
                    ${complaint.attachments && complaint.attachments.length > 0 ? `
                    <div class="row g-3">
                        ${complaint.attachments.map(att => {
                            if (att.type === 'image') {
                                return `
                                <div class="col-md-4">
                                    <div class="card">
                                        <img src="${att.url}" class="card-img-top" alt="${att.originalName}" 
                                             style="height: 200px; object-fit: cover; cursor: pointer;"
                                             onclick="window.open('${att.url}', '_blank')">
                                        <div class="card-body p-2">
                                            <small class="text-muted d-block truncate">${att.originalName}</small>
                                            <small class="text-muted">${(att.size / 1024).toFixed(1)} KB</small>
                                            ${att.authenticity ? `
                                                <br><small class="text-${att.authenticity.confidence > 70 ? 'success' : 'warning'}">
                                                    <i class="fas fa-shield-alt"></i> Verified: ${att.authenticity.confidence}%
                                                </small>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                                `;
                            } else if (att.type === 'video') {
                                return `
                                <div class="col-md-6">
                                    <div class="card">
                                        <video src="${att.url}" controls class="w-100" style="max-height: 300px;"></video>
                                        <div class="card-body p-2">
                                            <small class="text-muted d-block truncate">${att.originalName}</small>
                                            <small class="text-muted">${(att.size / 1024 / 1024).toFixed(2)} MB</small>
                                        </div>
                                    </div>
                                </div>
                                `;
                            }
                            return '';
                        }).join('')}
                    </div>
                    ` : ''}
                    
                    ${complaint.voiceRecording ? `
                    <div class="mt-3">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6 class="card-title">
                                    <i class="fas fa-microphone"></i> Voice Recording
                                </h6>
                                <audio src="${complaint.voiceRecording.url}" controls class="w-100 mb-2"></audio>
                                <small class="text-muted">
                                    Duration: ${complaint.voiceRecording.duration || 'N/A'} seconds | 
                                    Size: ${(complaint.voiceRecording.size / 1024).toFixed(1)} KB
                                </small>
                                ${complaint.voiceRecording.authenticity ? `
                                    <br><small class="text-${complaint.voiceRecording.authenticity.confidence > 70 ? 'success' : 'warning'}">
                                        <i class="fas fa-shield-alt"></i> Authenticity: ${complaint.voiceRecording.authenticity.confidence}%
                                    </small>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                ${complaint.timeline ? `
                <div class="mt-3">
                    <h6><i class="fas fa-history"></i> Timeline</h6>
                    ${complaint.timeline.map(t => `
                        <div class="mb-2">
                            <small class="text-muted">${new Date(t.timestamp).toLocaleString()}</small>
                            <p class="mb-0"><strong>${t.status}</strong> - ${t.note}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            `;
            
            document.getElementById('detailsContent').innerHTML = content;
            
            // Action buttons based on status
            let actionButtonsHTML = '';
            if (complaint.status === 'pending') {
                actionButtonsHTML = `
                    <button class="btn btn-primary" onclick="updateStatus('${complaint.id}', 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-info" onclick="updateStatus('${complaint.id}', 'in_progress')">
                        <i class="fas fa-play"></i> Start Working
                    </button>
                    <button class="btn btn-danger" onclick="showEscalateModal('${complaint.id}')">
                        <i class="fas fa-arrow-up"></i> Escalate
                    </button>
                    <button class="btn btn-outline-dark" onclick="rejectAsFake('${complaint.id}')">
                        <i class="fas fa-ban"></i> Reject as Fake
                    </button>
                `;
            } else if (complaint.status === 'approved' || complaint.status === 'in_progress') {
                actionButtonsHTML = `
                    <button class="btn btn-success" onclick="updateStatus('${complaint.id}', 'resolved')">
                        <i class="fas fa-check-circle"></i> Mark as Resolved
                    </button>
                    <button class="btn btn-secondary" onclick="updateStatus('${complaint.id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-danger" onclick="showEscalateModal('${complaint.id}')">
                        <i class="fas fa-arrow-up"></i> Escalate
                    </button>
                    <button class="btn btn-outline-dark" onclick="rejectAsFake('${complaint.id}')">
                        <i class="fas fa-ban"></i> Reject as Fake
                    </button>
                `;
            } else if (complaint.status === 'escalated') {
                actionButtonsHTML = `
                    <button class="btn btn-success" onclick="updateStatus('${complaint.id}', 'resolved')">
                        <i class="fas fa-check-circle"></i> Mark as Resolved
                    </button>
                    <button class="btn btn-outline-dark" onclick="rejectAsFake('${complaint.id}')">
                        <i class="fas fa-ban"></i> Reject as Fake
                    </button>
                `;
            }
            
            document.getElementById('actionButtons').innerHTML = actionButtonsHTML;
            
            new bootstrap.Modal(document.getElementById('detailsModal')).show();
        }
    } catch (error) {
        alert('Error loading complaint details');
    }
}

async function updateStatus(id, status) {
    try {
        const response = await api.updateComplaintStatus(id, status, `Status updated by ${currentUser.name}`);
        
        if (response.success) {
            // Close details modal
            bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();
            
            // Reload complaints
            loadAllComplaints();
            
            alert(`Complaint ${id} status updated to: ${status}`);
        }
    } catch (error) {
        alert('Error updating complaint status: ' + error.message);
    }
}

function showEscalateModal(id) {
    const reason = prompt('Enter reason for escalation:');
    if (reason && reason.trim()) {
        escalateComplaint(id, reason);
    }
}

async function escalateComplaint(id, reason) {
    try {
        const complaint = allComplaints.find(c => c.id === id);
        const newLevel = complaint.level + 1;
        
        const response = await api.escalateComplaint(id, reason, newLevel);
        
        if (response.success) {
            // Close details modal
            bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();
            
            // Show escalation history
            showEscalationHistory(response.data.complaint);
            
            // Reload complaints
            loadAllComplaints();
        }
    } catch (error) {
        alert('Error escalating complaint: ' + error.message);
    }
}

async function showEscalationHistory(complaint) {
    try {
        const response = await api.getEscalations(complaint.id);
        const escalations = response.success ? response.data : [];
        
        const content = `
            <h5 class="mb-3">Complaint ${complaint.id} - Escalation History</h5>
            <div class="escalation-timeline">
                <div class="escalation-level completed">
                    <div class="level-header">
                        <div class="level-icon">📋</div>
                        <div class="level-name">Level ${complaint.level} - Current Level</div>
                        <span class="badge bg-info">Active</span>
                    </div>
                    <div class="level-details">
                        <p class="text-muted small">Complaint filed on ${new Date(complaint.createdAt).toLocaleDateString()}</p>
                        <p class="text-muted small">Status: ${complaint.status}</p>
                    </div>
                </div>
                
                ${escalations.map(e => `
                <div class="escalation-level completed">
                    <div class="level-header">
                        <div class="level-icon">⬆️</div>
                        <div class="level-name">Escalated from Level ${e.fromLevel} to Level ${e.toLevel}</div>
                        <span class="badge bg-success">Completed</span>
                    </div>
                    <div class="level-details">
                        <p class="text-muted small"><strong>Reason:</strong> ${e.reason}</p>
                        <p class="text-muted small"><strong>By:</strong> ${e.escalatedByName}</p>
                        <p class="text-muted small"><strong>Date:</strong> ${new Date(e.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('escalationContent').innerHTML = content;
        new bootstrap.Modal(document.getElementById('escalationModal')).show();
    } catch (error) {
        console.error('Error loading escalations:', error);
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge bg-warning">Pending</span>',
        in_progress: '<span class="badge bg-info">In Progress</span>',
        escalated: '<span class="badge bg-danger">Escalated</span>',
        approved: '<span class="badge bg-primary">Approved</span>',
        resolved: '<span class="badge bg-success">Resolved</span>',
        rejected: '<span class="badge bg-secondary">Rejected</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

function getPriorityBadge(priority) {
    const badges = {
        low: '<span class="badge bg-secondary">Low</span>',
        medium: '<span class="badge bg-warning">Medium</span>',
        high: '<span class="badge bg-danger">High</span>',
        urgent: '<span class="badge bg-danger">🚨 Urgent</span>'
    };
    return badges[priority] || '<span class="badge bg-secondary">Unknown</span>';
}

// ==========================================
// FAKE COMPLAINT REJECTION
// ==========================================

async function rejectAsFake(complaintId) {
    const reason = prompt('Enter rejection reason:\n1. AI-generated photo\n2. Fake voice recording\n3. Manipulated video\n4. False information\n5. Other\n\nEnter reason:');
    
    if (!reason) {
        return;
    }
    
    try {
        const response = await fetch(`/api/complaints/${complaintId}/reject-fake`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api.token}`
            },
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            let message = 'Complaint rejected as fake!';
            if (data.data.userBanned) {
                message += '\n\nUser has been banned for 30 days due to multiple fake complaints.';
            }
            alert(message);
            
            // Reload complaints
            loadAllComplaints();
            
            // Close details modal
            bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();
        } else {
            alert(data.message || 'Failed to reject complaint');
        }
    } catch (error) {
        alert('Error rejecting complaint');
        console.error('Reject fake error:', error);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        await login(email, password);
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const department = document.getElementById('registerDepartment').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showRegisterMessage('Passwords do not match', 'danger');
            return;
        }
        
        await register({ name, email, phone, department, password });
    });
    
    // Search and filter
    document.getElementById('searchO').addEventListener('input', renderComplaints);
    document.getElementById('filterStatusO').addEventListener('change', renderComplaints);
    
    // Forgot Password form
    document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('forgotEmail').value;
        await requestPasswordReset(email);
    });
    
    // Reset Password form
    document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const token = document.getElementById('resetToken').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        // Validate passwords match
        if (newPassword !== confirmNewPassword) {
            showResetMessage('Passwords do not match', 'danger');
            return;
        }
        
        await resetPassword(token, newPassword);
    });
}

// ==========================================
// ANALYTICS DASHBOARD FUNCTIONS
// ==========================================

let chartsInitialized = false;
let chartInstances = {};

async function loadAnalytics() {
    try {
        console.log('Loading analytics...');
        const response = await api.getAnalytics();
        
        if (response.success) {
            console.log('Analytics data loaded:', response.data);
            const data = response.data;
            
            // Update overview cards
            document.getElementById('analyticsTotal').textContent = data.overview.totalComplaints;
            document.getElementById('analyticsResolved').textContent = data.overview.resolvedComplaints;
            document.getElementById('analyticsAvgTime').textContent = data.overview.avgResolutionTime + 'h';
            document.getElementById('analyticsAvgRating').textContent = data.overview.avgRating + '⭐';
            
            // Initialize or update charts
            if (!chartsInitialized) {
                console.log('Initializing charts...');
                initializeCharts(data);
                chartsInitialized = true;
            } else {
                console.log('Updating charts...');
                updateCharts(data);
            }
        } else {
            console.error('Analytics API returned error:', response);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
    }
}

function initializeCharts(data) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        return;
    }
    
    // Destroy existing charts if any
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
    
    // Get theme-aware colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    // 1. Category Chart (Pie)
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    chartInstances.category = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(data.categoryStats).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
            datasets: [{
                data: Object.values(data.categoryStats),
                backgroundColor: [
                    '#667eea', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor } }
            }
        }
    });
    
    // 2. Status Chart (Doughnut)
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    chartInstances.status = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data.statusStats).map(s => s.replace('_', ' ').charAt(0).toUpperCase() + s.slice(1)),
            datasets: [{
                data: Object.values(data.statusStats),
                backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#10b981', '#ef4444', '#f97316']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor } }
            }
        }
    });
    
    // 3. Priority Chart (Bar)
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    chartInstances.priority = new Chart(priorityCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(data.priorityStats).map(p => p.charAt(0).toUpperCase() + p.slice(1)),
            datasets: [{
                label: 'Complaints',
                data: Object.values(data.priorityStats),
                backgroundColor: ['#94a3b8', '#fbbf24', '#ef4444', '#dc2626']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
    
    // 4. Rating Chart (Bar)
    const ratingCtx = document.getElementById('ratingChart').getContext('2d');
    chartInstances.rating = new Chart(ratingCtx, {
        type: 'bar',
        data: {
            labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            datasets: [{
                label: 'Reviews',
                data: Object.values(data.ratingDistribution),
                backgroundColor: ['#ef4444', '#f97316', '#fbbf24', '#84cc16', '#10b981']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
    
    // 5. Monthly Trend Chart (Line)
    const monthlyCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    chartInstances.monthly = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: data.monthlyTrends.map(t => t.month),
            datasets: [{
                label: 'Complaints Filed',
                data: data.monthlyTrends.map(t => t.count),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
    
    // 6. Recent Activity Chart (Bar)
    const recentCtx = document.getElementById('recentActivityChart').getContext('2d');
    chartInstances.recent = new Chart(recentCtx, {
        type: 'bar',
        data: {
            labels: data.recentActivity.map(a => a.date),
            datasets: [{
                label: 'Complaints',
                data: data.recentActivity.map(a => a.count),
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateCharts(data) {
    // Update category chart
    if (chartInstances.category) {
        chartInstances.category.data.labels = Object.keys(data.categoryStats).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
        chartInstances.category.data.datasets[0].data = Object.values(data.categoryStats);
        chartInstances.category.update();
    }
    
    // Update status chart
    if (chartInstances.status) {
        chartInstances.status.data.labels = Object.keys(data.statusStats).map(s => s.replace('_', ' ').charAt(0).toUpperCase() + s.slice(1));
        chartInstances.status.data.datasets[0].data = Object.values(data.statusStats);
        chartInstances.status.update();
    }
    
    // Update priority chart
    if (chartInstances.priority) {
        chartInstances.priority.data.labels = Object.keys(data.priorityStats).map(p => p.charAt(0).toUpperCase() + p.slice(1));
        chartInstances.priority.data.datasets[0].data = Object.values(data.priorityStats);
        chartInstances.priority.update();
    }
    
    // Update rating chart
    if (chartInstances.rating) {
        chartInstances.rating.data.datasets[0].data = Object.values(data.ratingDistribution);
        chartInstances.rating.update();
    }
    
    // Update monthly trend
    if (chartInstances.monthly) {
        chartInstances.monthly.data.labels = data.monthlyTrends.map(t => t.month);
        chartInstances.monthly.data.datasets[0].data = data.monthlyTrends.map(t => t.count);
        chartInstances.monthly.update();
    }
    
    // Update recent activity
    if (chartInstances.recent) {
        chartInstances.recent.data.labels = data.recentActivity.map(a => a.date);
        chartInstances.recent.data.datasets[0].data = data.recentActivity.map(a => a.count);
        chartInstances.recent.update();
    }
}
