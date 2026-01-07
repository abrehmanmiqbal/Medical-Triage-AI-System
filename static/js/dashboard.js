// Dashboard JavaScript for Heart Triage System

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadDashboardData();
});

// Initialize dashboard components
function initializeDashboard() {
    console.log('🚀 Dashboard initializing...');
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize charts
    initDashboardCharts();
    
    // Initialize real-time updates
    initRealTimeUpdates();
    
    // Initialize notifications
    initNotifications();
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshDashboard')?.addEventListener('click', function() {
        refreshDashboard();
    });
    
    // Quick assessment buttons
    document.querySelectorAll('.quick-assessment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const riskLevel = this.dataset.risk;
            showQuickAssessmentModal(riskLevel);
        });
    });
    
    // Export buttons
    document.getElementById('exportDashboard')?.addEventListener('click', function() {
        exportDashboardData();
    });
    
    // Print button
    document.getElementById('printDashboard')?.addEventListener('click', function() {
        printDashboard();
    });
    
    // Search functionality
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterDashboardData(this.value);
        });
    }
    
    // Date range picker
    const dateRange = document.getElementById('dateRangePicker');
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            updateDashboardByDateRange(this.value);
        });
    }
}

// Load dashboard data
async function loadDashboardData() {
    showLoading(true);
    
    try {
        // Load multiple data sources in parallel
        const [statsData, recentData, insightsData] = await Promise.all([
            fetchDashboardStats(),
            fetchRecentAssessments(),
            fetchSystemInsights()
        ]);
        
        updateDashboardStats(statsData);
        updateRecentAssessments(recentData);
        updateSystemInsights(insightsData);
        updateDashboardCharts(statsData, insightsData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return getDefaultStats();
    }
}

// Fetch recent assessments
async function fetchRecentAssessments() {
    try {
        const response = await fetch('/api/patients?limit=5');
        if (!response.ok) throw new Error('Failed to fetch recent assessments');
        return await response.json();
    } catch (error) {
        console.error('Error fetching recent assessments:', error);
        return [];
    }
}

// Fetch system insights
async function fetchSystemInsights() {
    try {
        const response = await fetch('/api/insights');
        if (!response.ok) throw new Error('Failed to fetch insights');
        return await response.json();
    } catch (error) {
        console.error('Error fetching insights:', error);
        return {};
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    // Update total assessments
    const totalEl = document.getElementById('totalAssessments');
    if (totalEl) {
        totalEl.textContent = stats.totalAssessments || 0;
        animateCounter(totalEl, stats.totalAssessments || 0);
    }
    
    // Update risk distribution
    const lowRiskEl = document.getElementById('lowRiskCount');
    const mediumRiskEl = document.getElementById('mediumRiskCount');
    const highRiskEl = document.getElementById('highRiskCount');
    
    if (lowRiskEl) lowRiskEl.textContent = stats.lowRisk || 0;
    if (mediumRiskEl) mediumRiskEl.textContent = stats.mediumRisk || 0;
    if (highRiskEl) highRiskEl.textContent = stats.highRisk || 0;
    
    // Update average metrics
    updateMetricCard('avgAge', stats.avgAge, 'years');
    updateMetricCard('avgCholesterol', stats.avgCholesterol, 'mg/dL');
    updateMetricCard('avgBP', stats.avgBP, 'mmHg');
    updateMetricCard('successRate', stats.successRate, '%');
}

// Update recent assessments table
function updateRecentAssessments(assessments) {
    const tableBody = document.getElementById('recentAssessmentsBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (assessments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="fas fa-user-slash me-2"></i>
                    No assessments yet
                </td>
            </tr>
        `;
        return;
    }
    
    assessments.forEach(assessment => {
        const row = document.createElement('tr');
        const riskLevel = assessment.prediction?.risk_level || 0;
        const riskColor = getRiskColor(riskLevel);
        const riskLabel = getRiskLabel(riskLevel);
        
        row.innerHTML = `
            <td>
                <span class="badge bg-${riskColor}">
                    ${assessment.id || 'N/A'}
                </span>
            </td>
            <td>${assessment.data?.age || 'N/A'}</td>
            <td>${assessment.data?.chol || 'N/A'}</td>
            <td>${assessment.data?.trestbps || 'N/A'}</td>
            <td>
                <span class="badge bg-${riskColor} risk-badge">
                    ${riskLabel}
                </span>
            </td>
            <td>
                <span class="text-muted" title="${assessment.timestamp}">
                    ${formatRelativeTime(assessment.timestamp)}
                </span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update system insights
function updateSystemInsights(insights) {
    // Update model accuracy
    const accuracyEl = document.getElementById('modelAccuracy');
    if (accuracyEl && insights.modelAccuracy) {
        accuracyEl.textContent = `${insights.modelAccuracy}%`;
        updateAccuracyIndicator(insights.modelAccuracy);
    }
    
    // Update system status
    updateSystemStatus(insights.systemStatus);
    
    // Update alerts
    updateAlertsPanel(insights.alerts);
}

// Initialize dashboard charts
function initDashboardCharts() {
    // Risk Distribution Chart
    const riskCtx = document.getElementById('riskDistributionChart');
    if (riskCtx) {
        window.riskChart = new Chart(riskCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Daily Trends Chart
    const trendsCtx = document.getElementById('dailyTrendsChart');
    if (trendsCtx) {
        window.trendsChart = new Chart(trendsCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Assessments',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Performance Metrics Chart
    const perfCtx = document.getElementById('performanceMetricsChart');
    if (perfCtx) {
        window.perfChart = new Chart(perfCtx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Speed'],
                datasets: [{
                    label: 'Model Performance',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Update dashboard charts with data
function updateDashboardCharts(stats, insights) {
    // Update risk distribution chart
    if (window.riskChart) {
        window.riskChart.data.datasets[0].data = [
            stats.lowRisk || 0,
            stats.mediumRisk || 0,
            stats.highRisk || 0
        ];
        window.riskChart.update();
    }
    
    // Update trends chart
    if (window.trendsChart && insights.dailyTrends) {
        window.trendsChart.data.labels = insights.dailyTrends.labels || [];
        window.trendsChart.data.datasets[0].data = insights.dailyTrends.data || [];
        window.trendsChart.update();
    }
    
    // Update performance chart
    if (window.perfChart && insights.performanceMetrics) {
        window.perfChart.data.datasets[0].data = insights.performanceMetrics || [];
        window.perfChart.update();
    }
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize real-time updates
function initRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
        updateRealTimeData();
    }, 30000);
    
    // WebSocket connection for real-time updates
    initWebSocketConnection();
}

// Initialize WebSocket connection
function initWebSocketConnection() {
    if ('WebSocket' in window) {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
            
            const socket = new WebSocket(wsUrl);
            
            socket.onopen = function() {
                console.log('✅ WebSocket connected');
            };
            
            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            socket.onclose = function() {
                console.log('WebSocket disconnected. Reconnecting...');
                setTimeout(initWebSocketConnection, 5000);
            };
            
            window.dashboardSocket = socket;
        } catch (error) {
            console.error('WebSocket connection failed:', error);
        }
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'new_assessment':
            handleNewAssessment(data.data);
            break;
        case 'system_alert':
            showSystemAlert(data.data);
            break;
        case 'stats_update':
            updateLiveStats(data.data);
            break;
        case 'model_update':
            showModelUpdateNotification(data.data);
            break;
    }
}

// Handle new assessment from WebSocket
function handleNewAssessment(assessment) {
    // Add to recent assessments
    addRecentAssessment(assessment);
    
    // Update counters
    updateCounter('totalAssessments', 1);
    
    // Show notification
    showNotification('New Assessment', `Patient ${assessment.id} assessed as ${assessment.risk_label}`);
    
    // Update charts
    if (window.riskChart) {
        const riskIndex = assessment.risk_level;
        window.riskChart.data.datasets[0].data[riskIndex]++;
        window.riskChart.update();
    }
}

// Initialize notifications
function initNotifications() {
    // Check for browser notifications permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Show loading state
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Show notification
function showNotification(title, message, type = 'info') {
    const icon = {
        'info': 'fas fa-info-circle',
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'error': 'fas fa-times-circle'
    }[type];
    
    const color = {
        'info': 'primary',
        'success': 'success',
        'warning': 'warning',
        'error': 'danger'
    }[type];
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${color} alert-dismissible fade show notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="${icon} me-2 fa-lg"></i>
            <div>
                <strong>${title}</strong>
                <div class="small">${message}</div>
            </div>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Show system alert
function showSystemAlert(alert) {
    const alertContainer = document.getElementById('systemAlerts');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alert.level} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas fa-bell me-2"></i>
        <strong>${alert.title}</strong>
        <p class="mb-0">${alert.message}</p>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.prepend(alertDiv);
    
    // Browser notification
    if (Notification.permission === 'granted') {
        new Notification(alert.title, {
            body: alert.message,
            icon: '/static/images/logo.png'
        });
    }
}

// Refresh dashboard
function refreshDashboard() {
    showLoading(true);
    loadDashboardData().then(() => {
        showNotification('Dashboard Refreshed', 'All data has been updated', 'success');
    });
}

// Export dashboard data
function exportDashboardData() {
    // Create export data
    const exportData = {
        exported: new Date().toISOString(),
        title: 'Heart Triage Dashboard Export',
        stats: getCurrentStats(),
        recentAssessments: getRecentAssessmentsData()
    };
    
    // Convert to JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    // Create download link
    const exportFileDefaultName = `heart_triage_dashboard_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Export Complete', 'Dashboard data has been exported', 'success');
}

// Print dashboard
function printDashboard() {
    window.print();
}

// Filter dashboard data
function filterDashboardData(searchTerm) {
    const rows = document.querySelectorAll('#recentAssessmentsBody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Update dashboard by date range
function updateDashboardByDateRange(dateRange) {
    showLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Date Range Updated', `Showing data for ${dateRange}`, 'info');
        showLoading(false);
    }, 1000);
}

// Helper Functions

function getDefaultStats() {
    return {
        totalAssessments: 0,
        lowRisk: 0,
        mediumRisk: 0,
        highRisk: 0,
        avgAge: 0,
        avgCholesterol: 0,
        avgBP: 0,
        successRate: 0
    };
}

function getRiskColor(riskLevel) {
    return riskLevel === 0 ? 'success' : 
           riskLevel === 1 ? 'warning' : 'danger';
}

function getRiskLabel(riskLevel) {
    return riskLevel === 0 ? 'Low Risk' : 
           riskLevel === 1 ? 'Medium Risk' : 'High Risk';
}

function formatRelativeTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function animateCounter(element, target) {
    const current = parseInt(element.textContent) || 0;
    const increment = target > current ? 1 : -1;
    let currentValue = current;
    
    const timer = setInterval(() => {
        currentValue += increment;
        element.textContent = currentValue;
        
        if (currentValue === target) {
            clearInterval(timer);
        }
    }, 10);
}

function updateMetricCard(elementId, value, unit = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `${value}${unit}`;
    }
}

function updateAccuracyIndicator(accuracy) {
    const indicator = document.getElementById('accuracyIndicator');
    if (!indicator) return;
    
    if (accuracy >= 95) {
        indicator.className = 'fas fa-check-circle text-success';
        indicator.title = 'Excellent Accuracy';
    } else if (accuracy >= 90) {
        indicator.className = 'fas fa-check text-warning';
        indicator.title = 'Good Accuracy';
    } else {
        indicator.className = 'fas fa-exclamation-triangle text-danger';
        indicator.title = 'Needs Improvement';
    }
}

function updateSystemStatus(status) {
    const statusEl = document.getElementById('systemStatus');
    if (!statusEl) return;
    
    const statusMap = {
        'healthy': { text: 'Healthy', class: 'text-success', icon: 'fa-check-circle' },
        'degraded': { text: 'Degraded', class: 'text-warning', icon: 'fa-exclamation-triangle' },
        'down': { text: 'Down', class: 'text-danger', icon: 'fa-times-circle' }
    };
    
    const currentStatus = statusMap[status || 'healthy'];
    statusEl.innerHTML = `
        <i class="fas ${currentStatus.icon} ${currentStatus.class} me-2"></i>
        <span class="${currentStatus.class}">${currentStatus.text}</span>
    `;
}

function updateAlertsPanel(alerts) {
    const alertsEl = document.getElementById('alertsPanel');
    if (!alertsEl || !alerts) return;
    
    if (alerts.length === 0) {
        alertsEl.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-check-circle fa-2x mb-2"></i>
                <p>No active alerts</p>
            </div>
        `;
        return;
    }
    
    alertsEl.innerHTML = alerts.map(alert => `
        <div class="alert alert-${alert.level} alert-dismissible fade show mb-2">
            <i class="fas fa-${alert.icon} me-2"></i>
            <strong>${alert.title}</strong>
            <p class="mb-0 small">${alert.message}</p>
            <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>
        </div>
    `).join('');
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-toast {
        animation: slideIn 0.3s ease-out;
    }
    
    .pulse-animation {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);