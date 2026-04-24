// ==========================================
// CITIZEN PORTAL SCRIPT - WITH BACKEND INTEGRATION
// ==========================================

let currentUser = null;
let myComplaints = [];

// Media upload variables
let uploadedFiles = [];
let voiceRecordingBlob = null;
let mediaRecorder = null;
let recordingChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    setupMediaUpload();
});

// ==========================================
// MEDIA UPLOAD FUNCTIONS
// ==========================================

function setupMediaUpload() {
    // File upload preview
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileSelect);
    }

    // Voice recording
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    // Clear voice recording
    const clearVoiceBtn = document.getElementById('clearVoiceBtn');
    if (clearVoiceBtn) {
        clearVoiceBtn.addEventListener('click', clearVoiceRecording);
    }
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('filePreview');
    
    if (files.length === 0) {
        preview.style.display = 'none';
        uploadedFiles = [];
        return;
    }

    // Limit to 5 files
    if (files.length > 5) {
        alert('Maximum 5 files allowed');
        event.target.value = '';
        return;
    }

    uploadedFiles = files;
    preview.style.display = 'flex';
    preview.innerHTML = '';

    files.forEach((file, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4';

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                col.innerHTML = `
                    <div class="card">
                        <img src="${e.target.result}" class="card-img-top" alt="${file.name}" style="height: 120px; object-fit: cover;">
                        <div class="card-body p-2">
                            <small class="text-muted d-truncate">${file.name}</small>
                        </div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            col.innerHTML = `
                <div class="card">
                    <video src="${URL.createObjectURL(file)}" class="card-img-top" style="height: 120px; object-fit: cover;" muted></video>
                    <div class="card-body p-2">
                        <small class="text-muted d-truncate">${file.name}</small>
                    </div>
                </div>
            `;
        }

        preview.appendChild(col);
    });
}

async function toggleRecording() {
    const recordBtn = document.getElementById('recordBtn');
    const recordStatus = document.getElementById('recordStatus');
    const recordTimer = document.getElementById('recordTimer');
    const timerDisplay = document.getElementById('timerDisplay');

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorder = new MediaRecorder(stream);
            recordingChunks = [];
            recordingSeconds = 0;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordingChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                voiceRecordingBlob = new Blob(recordingChunks, { type: 'audio/webm' });
                
                // Show preview
                const voicePreview = document.getElementById('voicePreview');
                const voiceAudio = document.getElementById('voiceAudio');
                voiceAudio.src = URL.createObjectURL(voiceRecordingBlob);
                voicePreview.style.display = 'block';
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordBtn.innerHTML = '<i class="fas fa-stop fa-2x"></i>';
            recordBtn.classList.remove('btn-danger');
            recordBtn.classList.add('btn-secondary');
            recordStatus.textContent = 'Recording... Click to stop';
            recordTimer.style.display = 'block';

            // Start timer
            recordingTimer = setInterval(() => {
                recordingSeconds++;
                const minutes = Math.floor(recordingSeconds / 60);
                const seconds = recordingSeconds % 60;
                timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                // Auto-stop at 5 minutes
                if (recordingSeconds >= 300) {
                    toggleRecording();
                }
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone. Please grant permission.');
        }
    } else {
        // Stop recording
        mediaRecorder.stop();
        clearInterval(recordingTimer);
        
        recordBtn.innerHTML = '<i class="fas fa-microphone fa-2x"></i>';
        recordBtn.classList.remove('btn-secondary');
        recordBtn.classList.add('btn-danger');
        recordStatus.textContent = 'Click to start recording';
        recordTimer.style.display = 'none';
    }
}

function clearVoiceRecording() {
    voiceRecordingBlob = null;
    recordingChunks = [];
    recordingSeconds = 0;
    
    const voicePreview = document.getElementById('voicePreview');
    const voiceAudio = document.getElementById('voiceAudio');
    
    voiceAudio.src = '';
    voicePreview.style.display = 'none';
}

async function submitComplaintWithMedia(complaintData) {
    try {
        // Add user info
        complaintData.name = currentUser.name;
        complaintData.email = currentUser.email;
        complaintData.phone = currentUser.phone || '';

        // Create FormData for file upload
        const formData = new FormData();
        
        // Add text fields
        Object.keys(complaintData).forEach(key => {
            formData.append(key, complaintData[key]);
        });

        // Add uploaded files
        uploadedFiles.forEach(file => {
            formData.append('attachments', file);
        });

        // Add voice recording
        if (voiceRecordingBlob) {
            const voiceFile = new File([voiceRecordingBlob], `voice-${Date.now()}.webm`, {
                type: 'audio/webm'
            });
            formData.append('attachments', voiceFile);
        }

        const response = await api.createComplaintWithMedia(formData);
        
        if (response.success) {
            let message = `Complaint submitted successfully with verified media! Your Complaint ID: <strong>${response.data.id}</strong>`;
            
            // Show warnings if any files were rejected
            if (response.rejectedFiles && response.rejectedFiles.length > 0) {
                message += `<br><br><div class="alert alert-warning mt-2"><strong>Warning:</strong> ${response.rejectedFiles.length} file(s) were rejected as potentially fake or AI-generated:<ul>`;
                response.rejectedFiles.forEach(file => {
                    message += `<li>${file.filename} - ${file.reason}</li>`;
                });
                message += `</ul></div>`;
            }
            
            showSubmitMessage(message, response.rejectedFiles ? 'warning' : 'success');
            
            // Reset form
            document.getElementById('complaintForm').reset();
            uploadedFiles = [];
            clearVoiceRecording();
            document.getElementById('filePreview').style.display = 'none';
            
            // Reload complaints
            loadMyComplaints();
            
            return true;
        }
    } catch (error) {
        showSubmitMessage(error.message || 'Error submitting complaint', 'danger');
        return false;
    }
}

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

function checkAuth() {
    currentUser = api.getCurrentUser();
    
    if (currentUser && currentUser.role === 'citizen') {
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
    
    // Display rewards badge if user has rewards or 10+ genuine complaints
    if ((currentUser.rewards && currentUser.rewards.length > 0) || (currentUser.genuineComplaintCount && currentUser.genuineComplaintCount >= 10)) {
        displayRewardsBadge();
    }
    
    // Load complaints
    loadMyComplaints();
}

function displayRewardsBadge() {
    const navbar = document.querySelector('.navbar-nav');
    if (!navbar) return;
    
    // Check if badge already exists
    if (document.getElementById('rewardsBadge')) return;
    
    const rewardsHTML = `
        <li class="nav-item" id="rewardsBadge">
            <span class="nav-link" style="cursor: pointer;" data-bs-toggle="tooltip" title="Verified Citizen - ${currentUser.genuineComplaintCount || 0} genuine complaints">
                <i class="fas fa-award text-warning"></i>
                <span class="badge bg-success">Verified</span>
            </span>
        </li>
    `;
    
    navbar.insertAdjacentHTML('beforeend', rewardsHTML);
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
            
            // Check if user is a citizen
            if (currentUser.role !== 'citizen') {
                showLoginMessage('This portal is for citizens only. Please use the Officer Portal.', 'danger');
                api.logout();
                return false;
            }
            
            // Check if user is banned
            if (response.data.isBanned) {
                showLoginMessage(
                    `⚠️ Account Temporarily Banned\n\nReason: ${response.message}\nDays Remaining: ${response.data.daysRemaining}`,
                    'danger'
                );
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
        // Add citizen role
        userData.role = 'citizen';
        
        const response = await api.register(userData);
        
        if (response.success) {
            currentUser = response.data.user;
            showRegisterMessage('Registration successful! You are now logged in.', 'success');
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
    myComplaints = [];
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
// COMPLAINT FUNCTIONS
// ==========================================

async function loadMyComplaints() {
    try {
        const response = await api.getMyComplaints();
        
        if (response.success) {
            myComplaints = response.data;
            updateStats();
            renderComplaints();
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

function updateStats() {
    const total = myComplaints.length;
    const pending = myComplaints.filter(c => c.status === 'pending').length;
    const inProgress = myComplaints.filter(c => c.status === 'in_progress').length;
    const resolved = myComplaints.filter(c => c.status === 'resolved').length;
    
    document.getElementById('totalComplaintsC').textContent = total;
    document.getElementById('pendingComplaintsC').textContent = pending;
    document.getElementById('inProgressComplaintsC').textContent = inProgress;
    document.getElementById('resolvedComplaintsC').textContent = resolved;
}

function renderComplaints() {
    const tbody = document.getElementById('complaintsList');
    
    if (myComplaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No complaints yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = myComplaints.map(complaint => {
        // Add escalation level indicator
        let levelBadge = '';
        if (complaint.level && complaint.level > 1) {
            const levelColors = {
                2: 'warning',
                3: 'danger'
            };
            const color = levelColors[complaint.level] || 'warning';
            levelBadge = `<span class="officer-rank-badge rank-${complaint.level === 2 ? 'silver' : 'gold'} animated" 
                          title="Escalated to Level ${complaint.level}" 
                          style="padding: 0.25rem 0.5rem; font-size: 0.65rem; margin-left: 0.5rem;">
                          L${complaint.level}
                          </span>`;
        }
        
        // Add rejection info if rejected
        let rejectionInfo = '';
        if (complaint.status === 'rejected' || complaint.isFake) {
            const reason = complaint.rejectionReason || 'Complaint rejected by officer';
            rejectionInfo = `
                <div class="mt-1">
                    <small class="text-danger">
                        <i class="fas fa-exclamation-circle"></i> ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}
                    </small>
                </div>
            `;
        }
        
        // Add row style for rejected complaints
        const rowClass = (complaint.status === 'rejected' || complaint.isFake) ? 'table-danger' : '';
        
        return `
        <tr class="${rowClass}">
            <td><strong>${complaint.id}</strong></td>
            <td>${complaint.title}${rejectionInfo}</td>
            <td>${getCategoryIcon(complaint.category)} ${complaint.category}</td>
            <td>${getStatusBadge(complaint.status)}${levelBadge}</td>
            <td>${getPriorityBadge(complaint.priority)}</td>
            <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewComplaint('${complaint.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

async function submitComplaint(complaintData) {
    try {
        // Add user info
        complaintData.name = currentUser.name;
        complaintData.email = currentUser.email;
        complaintData.phone = currentUser.phone || '';
        
        const response = await api.createComplaint(complaintData);
        
        if (response.success) {
            showSubmitMessage(`Complaint submitted successfully! Your Complaint ID: <strong>${response.data.id}</strong>`, 'success');
            
            // Reset form
            document.getElementById('complaintForm').reset();
            
            // Reload complaints
            loadMyComplaints();
            
            return true;
        }
    } catch (error) {
        showSubmitMessage(error.message || 'Error submitting complaint', 'danger');
        return false;
    }
}

async function trackCitizenComplaint() {
    const id = document.getElementById('trackId').value.trim();
    
    if (!id) {
        document.getElementById('trackingResult').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> Please enter a complaint ID
            </div>
        `;
        return;
    }
    
    try {
        const response = await api.getComplaintById(id);
        
        if (response.success) {
            const complaint = response.data;
            
            // Verify this complaint belongs to current user
            if (complaint.email !== currentUser.email) {
                document.getElementById('trackingResult').innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> This complaint does not belong to you
                    </div>
                `;
                return;
            }
            
            // Check if complaint is rejected
            if (complaint.status === 'rejected') {
                // Show rejection message without tracking timeline
                document.getElementById('trackingResult').innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="fw-bold mb-3">Complaint ${complaint.id}</h5>
                            <div class="alert alert-danger">
                                <h6><i class="fas fa-exclamation-triangle"></i> Complaint Rejected</h6>
                                <p class="mb-1"><strong>Status:</strong> ${getStatusBadge(complaint.status)}</p>
                                <p class="mb-1"><strong>Reason:</strong> ${complaint.rejectionReason || 'Not specified'}</p>
                                ${complaint.rejectedByOfficer ? `<p class="mb-0"><small>Rejected by: Officer</small></p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
            
            document.getElementById('trackingResult').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="fw-bold mb-3">Complaint ${complaint.id}</h5>
                        <div class="tracking-steps">
                            <div class="tracking-step completed">
                                <div class="step-header"><i class="fas fa-check-circle text-success"></i> Submitted</div>
                                <p class="text-muted small">Complaint filed successfully</p>
                            </div>
                            <div class="tracking-step ${['in_progress', 'escalated', 'approved', 'resolved'].includes(complaint.status) ? 'completed' : 'pending'}">
                                <div class="step-header"><i class="fas ${['in_progress', 'escalated', 'approved', 'resolved'].includes(complaint.status) ? 'fa-check-circle text-success' : 'fa-clock text-warning'}"></i> Under Review</div>
                                <p class="text-muted small">Officer is reviewing your complaint</p>
                            </div>
                            <div class="tracking-step ${['in_progress', 'escalated', 'approved'].includes(complaint.status) ? 'in-progress' : complaint.status === 'resolved' ? 'completed' : 'pending'}">
                                <div class="step-header"><i class="fas ${['in_progress', 'escalated', 'approved'].includes(complaint.status) ? 'fa-spinner fa-spin text-info' : complaint.status === 'resolved' ? 'fa-check-circle text-success' : 'fa-clock text-warning'}"></i> In Progress</div>
                                <p class="text-muted small">Working on resolution</p>
                            </div>
                            <div class="tracking-step ${complaint.status === 'resolved' ? 'completed' : 'pending'}">
                                <div class="step-header"><i class="fas ${complaint.status === 'resolved' ? 'fa-check-circle text-success' : 'fa-clock text-warning'}"></i> Resolved</div>
                                <p class="text-muted small">Complaint has been resolved</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('trackingResult').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Complaint not found
            </div>
        `;
    }
}

async function viewComplaint(id) {
    try {
        const response = await api.getComplaintById(id);
        
        if (response.success) {
            const complaint = response.data;
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="fas fa-user"></i> Your Information</h6>
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
                        ${complaint.level ? `<p><strong>Current Level:</strong> <span class="officer-rank-badge rank-${complaint.level === 1 ? 'bronze' : complaint.level === 2 ? 'silver' : 'gold'} animated glow">Level ${complaint.level} - ${complaint.level === 1 ? 'Officer' : complaint.level === 2 ? 'Senior Officer' : 'Department Head'}</span></p>` : ''}
                        <p><strong>Location:</strong> ${complaint.location}</p>
                        <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                
                ${complaint.escalationHistory && complaint.escalationHistory.length > 0 ? `
                <div class="mt-4">
                    <h6><i class="fas fa-arrow-up text-warning"></i> Escalation History</h6>
                    <div class="alert alert-info">
                        <ul class="mb-0">
                            ${complaint.escalationHistory.map(e => `
                                <li>
                                    <strong>${new Date(e.timestamp).toLocaleString()}</strong>: 
                                    Level ${e.fromLevel} → Level ${e.toLevel}
                                    <br><small class="text-muted">${e.reason} (${e.escalatedBy === 'system' ? 'Auto-escalated' : 'Manual'})</small>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}
                
                <div class="mt-3">
                    <h6><i class="fas fa-align-left"></i> Description</h6>
                    <p class="text-muted">${complaint.description}</p>
                </div>
                
                ${complaint.isFake || complaint.status === 'rejected' ? `
                <div class="mt-3">
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-exclamation-triangle"></i> Complaint Rejected</h6>
                        <p class="mb-1"><strong>Reason:</strong> ${complaint.rejectionReason || 'Not specified'}</p>
                        ${complaint.rejectedByOfficer ? `<p class="mb-0"><small>Rejected by: Officer</small></p>` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${complaint.feedback && complaint.feedback.submittedAt ? `
                <div class="mt-3">
                    <div class="feedback-card">
                        <h6><i class="fas fa-star text-warning"></i> Your Review</h6>
                        <div class="rating-display mb-2">
                            ${generateStarDisplay(complaint.feedback.rating)}
                        </div>
                        ${complaint.feedback.comment ? `<p class="text-muted mb-2">${complaint.feedback.comment}</p>` : ''}
                        <small class="text-muted">Submitted on ${new Date(complaint.feedback.submittedAt).toLocaleString()}</small>
                    </div>
                </div>
                ` : ''}
                
                ${complaint.status === 'resolved' && (!complaint.feedback || !complaint.feedback.submittedAt) ? `
                <div class="mt-3">
                    <div class="alert alert-success">
                        <h6><i class="fas fa-check-circle"></i> Complaint Resolved!</h6>
                        <p class="mb-2">We hope you're satisfied with the resolution.</p>
                        <button class="btn btn-sm btn-success" onclick="showFeedbackModal('${complaint.id}')">
                            <i class="fas fa-star"></i> Rate Your Experience
                        </button>
                    </div>
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
            
            document.getElementById('complaintDetailContent').innerHTML = content;
            new bootstrap.Modal(document.getElementById('complaintDetailModal')).show();
        }
    } catch (error) {
        alert('Error loading complaint details');
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getCategoryIcon(category) {
    const icons = {
        water: '💧',
        roads: '🛣️',
        electricity: '⚡',
        garbage: '🗑️',
        health: '🏥',
        traffic: '🚦',
        other: '🏢'
    };
    return icons[category] || '📋';
}

function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge bg-warning">⏳ Pending</span>',
        in_progress: '<span class="badge bg-info">🔄 In Progress</span>',
        escalated: '<span class="badge bg-danger">⬆️ Escalated</span>',
        approved: '<span class="badge bg-primary">✅ Approved</span>',
        resolved: '<span class="badge bg-success">✔️ Resolved</span>',
        rejected: '<span class="badge bg-dark">❌ Rejected</span>'
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

function showSubmitMessage(message, type) {
    const messageDiv = document.getElementById('submitMessage');
    messageDiv.innerHTML = `
        <div class="alert alert-${type}">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
        </div>
    `;
    
    setTimeout(() => messageDiv.innerHTML = '', 5000);
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
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showRegisterMessage('Passwords do not match', 'danger');
            return;
        }
        
        await register({ name, email, phone, password });
    });
    
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
    
    // Complaint form
    document.getElementById('complaintForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const complaintData = {
            title: document.getElementById('complaintTitle').value,
            description: document.getElementById('complaintDesc').value,
            location: document.getElementById('complaintLocation').value,
            category: document.getElementById('complaintCategory').value,
            priority: document.getElementById('complaintPriority').value
        };
        
        // Use multimedia submission if files or voice recording exist
        if (uploadedFiles.length > 0 || voiceRecordingBlob) {
            await submitComplaintWithMedia(complaintData);
        } else {
            await submitComplaint(complaintData);
        }
    });
}

// ==========================================
// FEEDBACK/RATING FUNCTIONS
// ==========================================

let currentFeedbackComplaintId = null;

function showFeedbackModal(complaintId) {
    currentFeedbackComplaintId = complaintId;
    
    // Set complaint ID in modal
    document.getElementById('feedbackComplaintId').textContent = complaintId;
    
    // Reset form
    document.querySelectorAll('#starRating input').forEach(input => input.checked = false);
    document.getElementById('feedbackComment').value = '';
    
    // Close detail modal and open feedback modal
    bootstrap.Modal.getInstance(document.getElementById('complaintDetailModal')).hide();
    new bootstrap.Modal(document.getElementById('feedbackModal')).show();
}

async function submitFeedback() {
    if (!currentFeedbackComplaintId) {
        alert('Error: No complaint selected');
        return;
    }
    
    // Get selected rating
    const selectedRating = document.querySelector('#starRating input:checked');
    if (!selectedRating) {
        alert('Please select a star rating');
        return;
    }
    
    const rating = parseInt(selectedRating.value);
    const comment = document.getElementById('feedbackComment').value.trim();
    
    try {
        const response = await api.submitFeedback(currentFeedbackComplaintId, {
            rating,
            comment
        });
        
        if (response.success) {
            // Close feedback modal
            bootstrap.Modal.getInstance(document.getElementById('feedbackModal')).hide();
            
            // Show success message
            alert('Thank you for your feedback! Your review has been submitted.');
            
            // Reload complaints to show updated feedback
            loadMyComplaints();
        }
    } catch (error) {
        alert('Error submitting feedback: ' + (error.message || 'Please try again'));
    }
}

function generateStarDisplay(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="star filled"><i class="fas fa-star"></i></span>';
        } else {
            stars += '<span class="star"><i class="far fa-star"></i></span>';
        }
    }
    return stars;
}
