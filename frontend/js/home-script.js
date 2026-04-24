// Home page script
document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.getElementById('mainNav');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.animate__animated').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Counter animation for stats
    function animateCounter(element, target, suffix = '', duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        function updateCounter() {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start).toLocaleString() + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString() + suffix;
            }
        }
        
        updateCounter();
    }

    // Animate stats when they come into view
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElements = entry.target.querySelectorAll('h3');
                statElements.forEach(stat => {
                    const text = stat.textContent;
                    const number = parseInt(text.replace(/[^0-9]/g, ''));
                    let suffix = '';
                    if (text.includes('K')) suffix = 'K+';
                    else if (text.includes('%')) suffix = '%';
                    else if (text.includes('/')) suffix = '';
                    
                    if (number && !stat.classList.contains('animated')) {
                        stat.classList.add('animated');
                        animateCounter(stat, number, suffix);
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.bg-gradient-primary');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.backgroundPositionY = scrolled * 0.5 + 'px';
        }
    });

    // Add hover effects to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Load officer rankings
    loadOfficerRankings();
    
    // Load citizen reviews
    loadCitizenReviews();
    
    // Auto-refresh rankings every 5 minutes
    setInterval(loadOfficerRankings, 5 * 60 * 1000);
    
    // Auto-refresh reviews every 2 minutes
    setInterval(loadCitizenReviews, 2 * 60 * 1000);
});

// ==========================================
// OFFICER RANKINGS FUNCTIONS
// ==========================================

async function loadOfficerRankings() {
    try {
        const response = await fetch('/api/complaints/officer-rankings');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            renderOfficerCards(data.data);
        } else {
            document.getElementById('officerRankingsContainer').innerHTML = `
                <div class="col-12 text-center text-muted">
                    <i class="fas fa-info-circle fa-3x mb-3"></i>
                    <p>No officer rankings available yet. Officers will appear here once they start resolving complaints.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading officer rankings:', error);
        document.getElementById('officerRankingsContainer').innerHTML = `
            <div class="col-12 text-center text-muted">
                <p>Unable to load rankings. Please try again later.</p>
            </div>
        `;
    }
}

function renderOfficerCards(officers) {
    const container = document.getElementById('officerRankingsContainer');
    
    const rankBadges = {
        'bronze': { icon: '🥉', color: '#cd7f32', label: 'Bronze' },
        'silver': { icon: '🥈', color: '#c0c0c0', label: 'Silver' },
        'gold': { icon: '🥇', color: '#ffd700', label: 'Gold' },
        'platinum': { icon: '💎', color: '#e5e4e2', label: 'Platinum' },
        'diamond': { icon: '💠', color: '#b9f2ff', label: 'Diamond' }
    };
    
    container.innerHTML = officers.map((officer, index) => {
        const rank = rankBadges[officer.rank] || rankBadges['bronze'];
        const avgTime = officer.avgResolutionTime ? `${officer.avgResolutionTime.toFixed(1)}h` : 'N/A';
        
        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card h-100 shadow-sm hover-shadow transition-all">
                    <div class="card-body text-center p-4">
                        <div class="position-relative d-inline-block mb-3">
                            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                                 style="width: 80px; height: 80px; margin: 0 auto;">
                                <i class="fas fa-user-shield fa-2x" style="color: ${rank.color};"></i>
                            </div>
                            ${index < 3 ? `
                                <div class="position-absolute top-0 start-100 translate-middle">
                                    <span class="badge rounded-pill bg-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'danger'}">
                                        #${index + 1}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <h5 class="card-title fw-bold mb-1">${officer.name}</h5>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-building"></i> ${officer.department || 'N/A'}
                        </p>
                        
                        <div class="mb-3">
                            <span class="officer-rank-badge rank-${officer.rank} animated glow" 
                                  title="${rank.label} Rank - ${officer.totalPoints || 0} points">
                                ${rank.icon} ${rank.label}
                            </span>
                        </div>
                        
                        <div class="row g-2 text-start">
                            <div class="col-6">
                                <div class="p-2 bg-light rounded">
                                    <small class="text-muted d-block">Points</small>
                                    <strong class="text-primary">${officer.totalPoints || 0}</strong>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="p-2 bg-light rounded">
                                    <small class="text-muted d-block">Resolved</small>
                                    <strong class="text-success">${officer.resolvedCount || 0}</strong>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="p-2 bg-light rounded">
                                    <small class="text-muted d-block">Avg Resolution Time</small>
                                    <strong class="text-info">${avgTime}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// CITIZEN REVIEWS FUNCTIONS
// ==========================================

async function loadCitizenReviews() {
    try {
        // Fetch public reviews (no auth required)
        const response = await fetch('/api/complaints/public-reviews');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            renderCitizenReviews(data.data);
        } else {
            document.getElementById('reviewsContainer').innerHTML = `
                <div class="col-12 text-center text-muted">
                    <i class="fas fa-star fa-3x mb-3"></i>
                    <p>No reviews yet. Be the first to review after your complaint is resolved!</p>
                </div>
            `;
            document.getElementById('totalReviews').textContent = '0 Reviews';
            document.getElementById('avgRating').textContent = '0.0 ⭐ Average';
        }
    } catch (error) {
        console.error('Error loading citizen reviews:', error);
        document.getElementById('reviewsContainer').innerHTML = `
            <div class="col-12 text-center text-muted">
                <p>Unable to load reviews. Please try again later.</p>
            </div>
        `;
    }
}

function renderCitizenReviews(complaints) {
    const container = document.getElementById('reviewsContainer');
    
    // Sort by most recent feedback
    complaints.sort((a, b) => 
        new Date(b.feedback.submittedAt) - new Date(a.feedback.submittedAt)
    );
    
    // Show max 12 reviews
    const reviewsToShow = complaints.slice(0, 12);
    
    // Calculate stats
    const totalReviews = complaints.length;
    const avgRating = complaints.reduce((sum, c) => sum + c.feedback.rating, 0) / totalReviews;
    
    // Update stats
    document.getElementById('totalReviews').textContent = `${totalReviews} Review${totalReviews !== 1 ? 's' : ''}`;
    document.getElementById('avgRating').textContent = `${avgRating.toFixed(1)} ⭐ Average`;
    
    // Star display helper
    function getStarsHTML(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star text-warning"></i>';
            } else {
                stars += '<i class="far fa-star text-muted"></i>';
            }
        }
        return stars;
    }
    
    container.innerHTML = reviewsToShow.map(complaint => {
        const feedback = complaint.feedback;
        const date = new Date(feedback.submittedAt);
        const timeAgo = getTimeAgo(date);
        const stars = getStarsHTML(feedback.rating);
        
        // Anonymize user name
        const userName = complaint.userName || 'Anonymous';
        const anonymizedName = userName.charAt(0) + '*** ' + userName.split(' ').pop();
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="review-card">
                    <div class="rating-badge">
                        ${feedback.rating}.0 ⭐
                    </div>
                    
                    <div class="stars mb-3">
                        ${stars}
                    </div>
                    
                    ${feedback.comment ? `
                        <p class="review-comment">
                            <i class="fas fa-quote-left text-primary me-2"></i>
                            ${feedback.comment}
                        </p>
                    ` : '<p class="review-comment text-muted"><em>No comment provided</em></p>'}
                    
                    <div class="reviewer-info">
                        <div class="flex-grow-1">
                            <strong class="d-block">${anonymizedName}</strong>
                            <small class="complaint-id">Complaint: ${complaint.id}</small>
                        </div>
                        <div class="text-end">
                            <small class="review-date">
                                <i class="fas fa-clock"></i> ${timeAgo}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
