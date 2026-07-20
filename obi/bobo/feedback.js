// ============================================
// 📊 ENHANCED FEEDBACK DASHBOARD STATS
// ============================================

async function fetchFeedbackWithStats(shouldRender = true) {
    if (!supabaseClient) return;
    
    showLoading('Loading feedback data...');
    
    try {
        // Fetch all feedback
        const { data: feedback, error } = await supabaseClient
            .from('user_feedback')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        feedbackData = feedback || [];
        document.getElementById('feedbackCount').textContent = feedbackData.length;
        
        // Only render if explicitly requested
        if (shouldRender && currentTab === 'feedback') {
            renderEnhancedFeedbackDashboard();
        }
        
        return feedbackData;
        
    } catch (error) {
        console.error('Error fetching feedback:', error);
        showToast('Error loading feedback data', 'error');
    } finally {
        hideLoading();
    }
}


// Enhanced Feedback Dashboard with Stats
function renderEnhancedFeedbackDashboard() {
    // Prevent duplicate rendering
    if (window._renderingFeedback) {
        console.log('Feedback render already in progress, skipping...');
        return;
    }
    
    window._renderingFeedback = true;
    
    try {
        const tbody = document.getElementById('eventsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Calculate feedback statistics
        const stats = calculateFeedbackStats(feedbackData);
        
        // Remove any existing feedback elements before adding new ones
        cleanupFeedbackElements();
        
        // Create stats cards with specific class for cleanup
        const statsHTML = `
            <div class="feedback-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon purple">
                            <i class="fas fa-comment-dots"></i>
                        </div>
                    </div>
                    <div class="stat-label">Total Feedback</div>
                    <div class="stat-number">${stats.total}</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon green">
                            <i class="fas fa-smile-wink"></i>
                        </div>
                    </div>
                    <div class="stat-label">Happy Users 😊</div>
                    <div class="stat-number">${stats.happy}</div>
                    <div class="stat-change positive">${stats.happyPercent}%</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon yellow">
                            <i class="fas fa-meh"></i>
                        </div>
                    </div>
                    <div class="stat-label">Neutral 😐</div>
                    <div class="stat-number">${stats.neutral}</div>
                    <div class="stat-change">${stats.neutralPercent}%</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon red">
                            <i class="fas fa-frown"></i>
                        </div>
                    </div>
                    <div class="stat-label">Sad Users 😞</div>
                    <div class="stat-number">${stats.sad}</div>
                    <div class="stat-change negative">${stats.sadPercent}%</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon blue">
                            <i class="fas fa-calendar-week"></i>
                        </div>
                    </div>
                    <div class="stat-label">This Week</div>
                    <div class="stat-number">${stats.thisWeek}</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon orange">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="stat-label">Satisfaction Score</div>
                    <div class="stat-number">${stats.satisfactionScore}%</div>
                    <div class="stat-change ${stats.satisfactionTrend >= 0 ? 'positive' : 'negative'}">
                        ${stats.satisfactionTrend >= 0 ? '↑' : '↓'} ${Math.abs(stats.satisfactionTrend)}% vs last month
                    </div>
                </div>
            </div>
            
            <!-- Sentiment Distribution Chart -->
            <div class="chart-card feedback-chart-card" style="margin-bottom: 24px;">
                <div class="chart-header">
                    <div class="chart-title">📊 Sentiment Distribution</div>
                </div>
                <canvas id="sentimentChart" style="max-height: 250px;"></canvas>
            </div>
            
            <!-- Feedback Trends Chart -->
            <div class="chart-card feedback-chart-card" style="margin-bottom: 24px;">
                <div class="chart-header">
                    <div class="chart-title">📈 Feedback Trends (Last 30 Days)</div>
                </div>
                <canvas id="feedbackTrendChart" style="max-height: 250px;"></canvas>
            </div>
        `;
        
        // Insert stats before the table
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            tableContainer.insertAdjacentHTML('beforebegin', statsHTML);
        }
        
        // Render sentiment chart
        renderSentimentChart(stats);
        
        // Render trend chart
        renderFeedbackTrendChart(feedbackData);
        
        // Set up table headers
        document.getElementById('eventsTableHead').innerHTML = `
            <tr>
                <th>Date</th>
                <th>Sentiment</th>
                <th>Feedback Message</th>
                <th>Username</th>
                <th>Device ID</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
            </tr>
        `;
        
        if (!feedbackData || feedbackData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="empty-state">
                            <i class="fas fa-comment-dots"></i>
                            <p>No feedback submitted yet</p>
                            <p style="font-size: 0.85rem;">Feedback will appear here when users complete actions</p>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('tableInfo').textContent = 'No feedback yet';
            return;
        }
        
        // Render feedback table
        feedbackData.forEach(feedback => {
            const row = tbody.insertRow();
            
            // Date
            row.insertCell(0).textContent = formatDate(feedback.created_at);
            
            // Sentiment with emoji
            const sentimentConfig = {
                'Happy': { emoji: '😊', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                'Neutral': { emoji: '😐', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                'Sad': { emoji: '😞', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
            };
            const config = sentimentConfig[feedback.sentiment] || sentimentConfig['Neutral'];
            row.insertCell(1).innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.5rem;">${config.emoji}</span>
                    <span style="color: ${config.color}; font-weight: 500;">${feedback.sentiment}</span>
                </div>
            `;
            
            // Feedback message
            const message = feedback.suggestions || feedback.feedback_text || '—';
            row.insertCell(2).innerHTML = `
                <div style="max-width: 300px;">
                    <span style="font-size: 0.85rem;">${message.substring(0, 80)}${message.length > 80 ? '...' : ''}</span>
                </div>
            `;
            
            // Username
            row.insertCell(3).innerHTML = `<strong>${feedback.username || 'Anonymous'}</strong>`;
            
            // Device ID (truncated)
            row.insertCell(4).innerHTML = `<code style="font-size: 0.7rem;">${(feedback.device_id || '—').substring(0, 12)}...</code>`;
            
            // Location
            row.insertCell(5).textContent = `${feedback.city || ''} ${feedback.country || ''}`.trim() || '—';
            
            // Feedback type
            const typeLabels = {
                'auto_triggered': '🎯 Auto',
                'auto_trigger': '🎯 Auto',
                'manual': '✍️ Manual',
                'sale': '💰 Sale',
                'stock': '📦 Stock',
                'customer': '👤 Customer'
            };
            row.insertCell(6).innerHTML = `
                <span class="event-badge" style="background: rgba(59,130,246,0.2); color: #60a5fa;">
                    ${typeLabels[feedback.feedback_type] || typeLabels[feedback.feedback_source] || '📝 General'}
                </span>
            `;
            
            // Status badge with dropdown
            row.insertCell(7).innerHTML = `
                <select class="feedback-status-select" data-id="${feedback.id}" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                    <option value="new" ${feedback.status === 'new' ? 'selected' : ''}>🆕 New</option>
                    <option value="reviewed" ${feedback.status === 'reviewed' ? 'selected' : ''}>👀 Reviewed</option>
                    <option value="addressed" ${feedback.status === 'addressed' ? 'selected' : ''}>✅ Addressed</option>
                    <option value="dismissed" ${feedback.status === 'dismissed' ? 'selected' : ''}>❌ Dismissed</option>
                </select>
            `;
            
            // Action buttons
            row.insertCell(8).innerHTML = `
                <div style="display: flex; gap: 6px;">
                    <button class="view-feedback-btn" data-id="${feedback.id}" style="background: none; border: none; color: #60a5fa; cursor: pointer;" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="delete-feedback-btn" data-id="${feedback.id}" style="background: none; border: none; color: #f87171; cursor: pointer;" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        // Attach event listeners for status changes
        attachFeedbackEventListeners();
        
        document.getElementById('tableInfo').textContent = `${feedbackData.length} feedback entries (${stats.happy} 😊, ${stats.neutral} 😐, ${stats.sad} 😞)`;
        document.getElementById('tableTitle').innerHTML = '💬 User Feedback Analytics';
        
    } finally {
        window._renderingFeedback = false;
    }
}
// Calculate feedback statistics
function calculateFeedbackStats(feedback) {
    const total = feedback.length;
    const happy = feedback.filter(f => f.sentiment === 'Happy').length;
    const neutral = feedback.filter(f => f.sentiment === 'Neutral').length;
    const sad = feedback.filter(f => f.sentiment === 'Sad').length;
    
    const happyPercent = total > 0 ? Math.round((happy / total) * 100) : 0;
    const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
    const sadPercent = total > 0 ? Math.round((sad / total) * 100) : 0;
    
    // This week's feedback
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = feedback.filter(f => new Date(f.created_at) >= oneWeekAgo).length;
    
    // Satisfaction score (weighted: Happy=100, Neutral=50, Sad=0)
    const satisfactionScore = total > 0 
        ? Math.round(((happy * 100) + (neutral * 50) + (sad * 0)) / total)
        : 0;
    
    // Calculate trend (compare with previous month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const lastMonth = feedback.filter(f => {
        const date = new Date(f.created_at);
        return date >= twoMonthsAgo && date < oneMonthAgo;
    }).length;
    
    const thisMonth = feedback.filter(f => {
        const date = new Date(f.created_at);
        return date >= oneMonthAgo;
    }).length;
    
    const satisfactionTrend = lastMonth > 0 
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : (thisMonth > 0 ? 100 : 0);
    
    return {
        total,
        happy,
        neutral,
        sad,
        happyPercent,
        neutralPercent,
        sadPercent,
        thisWeek,
        satisfactionScore,
        satisfactionTrend
    };
}

// Render sentiment pie chart
function renderSentimentChart(stats) {
    const ctx = document.getElementById('sentimentChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if exists
    if (charts.sentiment) {
        charts.sentiment.destroy();
    }
    
    charts.sentiment = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [`Happy 😊 (${stats.happy})`, `Neutral 😐 (${stats.neutral})`, `Sad 😞 (${stats.sad})`],
            datasets: [{
                data: [stats.happy, stats.neutral, stats.sad],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 15, font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = stats.happy + stats.neutral + stats.sad;
                            const percentage = total > 0 ? Math.round((context.raw / total) * 100) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Render feedback trend chart
function renderFeedbackTrendChart(feedback) {
    const ctx = document.getElementById('feedbackTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    // Group by date for last 30 days
    const last30Days = [];
    const happyByDay = new Map();
    const neutralByDay = new Map();
    const sadByDay = new Map();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push(dateStr);
        happyByDay.set(dateStr, 0);
        neutralByDay.set(dateStr, 0);
        sadByDay.set(dateStr, 0);
    }
    
    feedback.forEach(f => {
        const dateStr = f.created_at?.split('T')[0];
        if (last30Days.includes(dateStr)) {
            if (f.sentiment === 'Happy') happyByDay.set(dateStr, (happyByDay.get(dateStr) || 0) + 1);
            if (f.sentiment === 'Neutral') neutralByDay.set(dateStr, (neutralByDay.get(dateStr) || 0) + 1);
            if (f.sentiment === 'Sad') sadByDay.set(dateStr, (sadByDay.get(dateStr) || 0) + 1);
        }
    });
    
    // Destroy existing chart
    if (charts.feedbackTrend) {
        charts.feedbackTrend.destroy();
    }
    
    charts.feedbackTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map(d => d.substring(5)),
            datasets: [
                {
                    label: 'Happy 😊',
                    data: last30Days.map(d => happyByDay.get(d)),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Neutral 😐',
                    data: last30Days.map(d => neutralByDay.get(d)),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Sad 😞',
                    data: last30Days.map(d => sadByDay.get(d)),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', maxRotation: 45 }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

// Attach event listeners for feedback actions
function attachFeedbackEventListeners() {
    // Status change handlers
    document.querySelectorAll('.feedback-status-select').forEach(select => {
        select.removeEventListener('change', handleStatusChange);
        select.addEventListener('change', handleStatusChange);
    });
    
    // View buttons
    document.querySelectorAll('.view-feedback-btn').forEach(btn => {
        btn.removeEventListener('click', handleViewFeedback);
        btn.addEventListener('click', handleViewFeedback);
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-feedback-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteFeedback);
        btn.addEventListener('click', handleDeleteFeedback);
    });
}

async function handleStatusChange(e) {
    const feedbackId = e.target.dataset.id;
    const newStatus = e.target.value;
    
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient
            .from('user_feedback')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', feedbackId);
        
        if (error) throw error;
        
        showToast(`Feedback marked as ${newStatus}`, 'success');
        
        // Refresh the feedback view
        await fetchFeedbackWithStats();
        if (currentTab === 'feedback') {
            renderEnhancedFeedbackDashboard();
        }
        
    } catch (error) {
        console.error('Error updating feedback status:', error);
        showToast('Error updating status', 'error');
    }
}

function handleViewFeedback(e) {
    const feedbackId = e.currentTarget.dataset.id;
    const feedback = feedbackData.find(f => f.id == feedbackId);
    
    if (feedback) {
        alert(`📝 Full Feedback:\n\nSentiment: ${feedback.sentiment}\nMessage: ${feedback.suggestions || feedback.feedback_text}\nFrom: ${feedback.username || 'Anonymous'}\nDevice: ${feedback.device_id}\nDate: ${formatDate(feedback.created_at)}`);
    }
}

async function handleDeleteFeedback(e) {
    const feedbackId = e.currentTarget.dataset.id;
    
    if (confirm('Are you sure you want to delete this feedback?')) {
        if (!supabaseClient) return;
        
        try {
            const { error } = await supabaseClient
                .from('user_feedback')
                .delete()
                .eq('id', feedbackId);
            
            if (error) throw error;
            
            showToast('Feedback deleted', 'success');
            await fetchFeedbackWithStats();
            if (currentTab === 'feedback') {
                renderEnhancedFeedbackDashboard();
            }
            
        } catch (error) {
            console.error('Error deleting feedback:', error);
            showToast('Error deleting feedback', 'error');
        }
    }
}
// ============================================
// 🍞 MODERN TOAST NOTIFICATION SYSTEM
// ============================================

function showToast(message = '', type = 'success') {

    // Remove old toast if exists
    const oldToast = document.querySelector('.modern-toast');

    if (oldToast) {
        oldToast.remove();
    }

    // Toast icons
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    // Create toast
    const toast = document.createElement('div');
    toast.className = `modern-toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-icon">
            ${icons[type] || 'ℹ️'}
        </div>

        <div class="toast-message">
            ${message}
        </div>
    `;

    document.body.appendChild(toast);

    // Show animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto remove
    setTimeout(() => {

        toast.classList.remove('show');

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3000);
}