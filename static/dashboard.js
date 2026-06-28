       // Global variables
        let riskChart;
        let dashboardData = {};
        
        // API endpoints
        const API_ENDPOINTS = {
            dashboardData: '/api/dashboard',
            heatmapData: '/api/heatmap',
            topRisks: '/api/top-risks',
            recentActivity: '/api/recent-activity',
            riskDetail: '/api/risk-detail'
        };
        
        // Initialize the dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeDashboard();
            setupEventListeners();
        });
        
        // Initialize dashboard components
        function initializeDashboard() {
            // Initialize charts
            initRiskChart();
            
            // Load data
            loadDashboardData();
            loadHeatmapData();
            loadTopRisks();
            loadRecentActivity();
            
            // Set up auto-refresh every 5 minutes
            setInterval(loadDashboardData, 300000);
        }
        
        // Set up event listeners
        function setupEventListeners() {
            // Profile dropdown
            const profile = document.querySelector('.user-profile');
            const dropdown = document.querySelector('.profile-dropdown');
            
            profile.addEventListener('click', function() {
                dropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(event) {
                if (!profile.contains(event.target)) {
                    dropdown.classList.remove('show');
                }
            });
            
            // Heatmap interactivity
            const heatmapCells = document.querySelectorAll('.heatmap-cell');
            const riskModal = document.getElementById('riskModal');
            const modalCloseBtns = document.querySelectorAll('.modal-close');
            
            heatmapCells.forEach(cell => {
                cell.addEventListener('click', function() {
                    const impact = this.getAttribute('data-impact');
                    const likelihood = this.getAttribute('data-likelihood');
                    
                    document.querySelector('.modal-title').innerHTML = 
                        `<i class="fas fa-exclamation-triangle"></i> ${impact} Impact / ${likelihood} Likelihood Risks`;
                    
                    loadRiskDetails(impact, likelihood);
                    riskModal.classList.add('show');
                });
            });
            
            // Close modal handlers
            modalCloseBtns.forEach(btn => btn.addEventListener('click', function(){ const modal = this.closest('.modal'); if(modal) modal.classList.remove('show'); }));
            
            // Close modal when clicking outside
            riskModal.addEventListener('click', function(e) {
                if (e.target === riskModal) {
                    riskModal.classList.remove('show');
                }
            });
            
            // Close modal when clicking outside
            riskModal.addEventListener('click', function(e) {
                if (e.target === riskModal) {
                    riskModal.classList.remove('show');
                }
            });
            
            // Start New Assessment button
            document.getElementById('startAssessment').addEventListener('click', function() {
                // Redirect to risk analysis page
                window.location.href = '/analyze-risk';
            });
            
            // View All Risks button
            document.getElementById('viewAllRisks').addEventListener('click', function() {
                // Redirect to risk register page
                window.location.href = '/risk-register';
            });
            
            // Refresh buttons
            document.getElementById('refresh-data').addEventListener('click', function() {
                loadDashboardData();
                loadHeatmapData();
                loadTopRisks();
                loadRecentActivity();
            });
            
            document.getElementById('refresh-chart').addEventListener('click', loadDashboardData);
            document.getElementById('refresh-activity').addEventListener('click', loadRecentActivity);
            
            // Logout button
            document.getElementById('logout-btn').addEventListener('click', function() {
                if (confirm('Are you sure you want to logout?')) {
                    window.location.href = '/logout';
                }
            });
        }
        
        // Initialize the risk distribution chart
        function initRiskChart() {
            const ctx = document.getElementById('riskChart').getContext('2d');
            riskChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Critical Risks', 'High Risks', 'Medium Risks', 'Low Risks'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        // Use CSS variables so these colors are identical to the heatmap's palette
                    backgroundColor: [
                        getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#e53e3e',
                        getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#dd6b20',
                        getComputedStyle(document.documentElement).getPropertyValue('--info').trim() || '#3182ce',
                        getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#38a169'
                    ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 15,
                                padding: 15,
                                font: {
                                    size: 13
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} risks`;
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        }
        
        // Load dashboard data from API
        function loadDashboardData() {
            // Show loading state
            document.getElementById('kpi-container').classList.add('loading');
            
            fetch(API_ENDPOINTS.dashboardData)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Update KPI tiles
                    document.getElementById('total-assets').textContent = data.totalAssets;
                    updateTrend('assets-trend', data.assetsTrend, data.assetsTrendValue, 'from last month');
                    
                    document.getElementById('critical-risks').textContent = data.criticalRisks;
                    updateTrend('critical-trend', data.criticalTrend, data.criticalTrendValue, 'since last week');
                    
                    document.getElementById('high-risks').textContent = data.highRisks;
                    updateTrend('high-trend', data.highTrend, data.highTrendValue, 'since yesterday');
                    
                    document.getElementById('open-mitigations').textContent = data.openMitigations;
                    updateTrend('mitigations-trend', data.mitigationsTrend, data.mitigationsTrendValue, 'completed this week');
                    
                    // Update risk distribution chart
                    riskChart.data.datasets[0].data = [
                        data.riskDistribution.critical,
                        data.riskDistribution.high,
                        data.riskDistribution.medium,
                        data.riskDistribution.low
                    ];
                    riskChart.update();
                    
                    // Remove loading state
                    document.getElementById('kpi-container').classList.remove('loading');
                })
                .catch(error => {
                    console.error('Error loading dashboard data:', error);
                    alert('Failed to load dashboard data. Please try again later.');
                });
        }
        
// Helper to convert hex color to rgba
function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Load heatmap data from API
function loadHeatmapData() {
    fetch(API_ENDPOINTS.heatmapData)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(heatmapData => {
            // Determine max asset count to compute intensity
            let maxAssets = 0;
            Object.values(heatmapData).forEach(v => { maxAssets = Math.max(maxAssets, v.asset_count || 0); });

            // Revert to the original professional heatmap palette (explicit hex values)
            const colorMap = {
                'critical': '#b91c1c', // deep red
                'high': '#e45b11',     // orange-red
                'medium': '#f6ad55',   // amber
                'low': '#2c7a7b',      // teal
                'unknown': '#94a3b8'   // gray-blue
            };

            // Update heatmap cells (value is { total, counts, dominant, asset_count, assets })
            for (const [key, value] of Object.entries(heatmapData)) {
                const [impact, likelihood] = key.split('-');
                const cell = document.querySelector(`.heatmap-cell[data-impact="${impact}"][data-likelihood="${likelihood}"]`);
                if (cell) {
                    const assetCount = value && value.asset_count ? value.asset_count : 0;
                    const total = value && value.total ? value.total : 0;
                    const dominant = value && value.dominant ? value.dominant : 'Unknown';

                    // display asset and risk counts
                    cell.querySelector('.heatmap-value').innerHTML = `<div class="asset-count">${assetCount}</div><div class="risk-count">${total} risks</div>`;

                    // Normalize dominant into one of the css classes: critical/high/medium/low
                    let cls = 'low';
                    if (dominant === 'Critical' || dominant === 'Very High') cls = 'critical';
                    else if (dominant === 'High') cls = 'high';
                    else if (dominant === 'Medium') cls = 'medium';
                    else if (dominant === 'Low') cls = 'low';

                    cell.classList.remove('low','medium','high','critical');
                    cell.classList.add(cls);

                    // intensity based on asset density
                    const intensity = maxAssets > 0 ? (0.4 + 0.6 * (assetCount / maxAssets)) : 0.5;
                    const baseColor = colorMap[cls] || colorMap['unknown'];
                    // Use a pure solid background color (no gradient) so boxes match the requested palette
                    cell.style.background = baseColor;
                    // Clear any inline box-shadow to preserve clean, pure colors; hover shadow is handled in CSS
                    cell.style.boxShadow = '';

                    // attach assets data for modal usage
                    cell.dataset.assets = (value.assets || []).join('||');
                    cell.dataset.assetCount = assetCount;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading heatmap data:', error);
                });
        }
        
        // Load top risks from API
        function loadTopRisks() {
            fetch(API_ENDPOINTS.topRisks)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(topRisks => {
                    const tableBody = document.querySelector('#top-risks-table tbody');
                    tableBody.innerHTML = '';
                    
                    if (topRisks.length === 0) {
                        const row = document.createElement('tr');
                        row.innerHTML = '<td colspan="3" style="text-align: center;">No high-risk assets found</td>';
                        tableBody.appendChild(row);
                        return;
                    }
                    
                    topRisks.forEach(risk => {
                        const row = document.createElement('tr');
                        
                        // Asset name
                        const nameCell = document.createElement('td');
                        nameCell.textContent = risk.name;
                        row.appendChild(nameCell);
                        
                        // Risk score
                        const scoreCell = document.createElement('td');
                        scoreCell.textContent = risk.score;
                        row.appendChild(scoreCell);
                        
                        // Criticality
                        const criticalityCell = document.createElement('td');
                        const criticalitySpan = document.createElement('span');
                        
                        let levelClass = 'level-medium';
                        if (risk.criticality === 'Very High') levelClass = 'level-critical';
                        if (risk.criticality === 'High') levelClass = 'level-high';
                        if (risk.criticality === 'Low') levelClass = 'level-low';
                        
                        criticalitySpan.className = `risk-level ${levelClass}`;
                        criticalitySpan.textContent = risk.criticality;
                        criticalityCell.appendChild(criticalitySpan);
                        row.appendChild(criticalityCell);
                        
                        tableBody.appendChild(row);
                    });
                })
                .catch(error => {
                    console.error('Error loading top risks:', error);
                    const tableBody = document.querySelector('#top-risks-table tbody');
                    tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Error loading data</td></tr>';
                });
        }
        
        // Load recent activity from API
        function loadRecentActivity() {
            fetch(API_ENDPOINTS.recentActivity)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(activities => {
                    const activityList = document.getElementById('activity-list');
                    activityList.innerHTML = '';
                    
                    if (activities.length === 0) {
                        const item = document.createElement('li');
                        item.className = 'activity-item';
                        item.innerHTML = `
                            <div class="activity-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">No recent activity</div>
                            </div>
                        `;
                        activityList.appendChild(item);
                        return;
                    }
                    
                    activities.forEach(activity => {
                        const item = document.createElement('li');
                        item.className = 'activity-item';
                        
                        item.innerHTML = `
                            <div class="activity-icon">
                                <i class="fas ${activity.icon}"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">${activity.type}</div>
                                <div class="activity-description">${activity.description}</div>
                                <div class="activity-time">${activity.time}</div>
                            </div>
                        `;
                        
                        activityList.appendChild(item);
                    });
                })
                .catch(error => {
                    console.error('Error loading recent activity:', error);
                    const activityList = document.getElementById('activity-list');
                    activityList.innerHTML = '<li class="activity-item"><div class="activity-content"><div class="activity-title">Error loading activities</div></div></li>';
                });
        }
        
// Load risk details and assets for modal
function loadRiskDetails(impact, likelihood) {
    const modalBody = document.getElementById('risk-modal-body');
    modalBody.innerHTML = `
        <div class="skeleton" style="height: 20px; width: 70%; margin-bottom: 1rem;"></div>
        <div class="skeleton" style="height: 15px; width: 90%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 15px; width: 85%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 15px; width: 80%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 15px; width: 95%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 15px; width: 75%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 15px; width: 85%;"></div>
    `;

    // Fetch both a representative risk description and the list of assets for the selected cell
    const riskDetailPromise = fetch(`${API_ENDPOINTS.riskDetail}?impact=${impact}&likelihood=${likelihood}`).then(r => r.ok ? r.json() : Promise.reject('riskDetail failed'));
    const cellAssetsPromise = fetch(`/api/heatmap-cell?impact=${encodeURIComponent(impact)}&likelihood=${encodeURIComponent(likelihood)}`).then(r => r.ok ? r.json() : Promise.reject('heatmap-cell failed'));

    Promise.allSettled([riskDetailPromise, cellAssetsPromise])
        .then(results => {
            const riskResult = results[0];
            const assetsResult = results[1];

            let html = '';
            if (riskResult.status === 'fulfilled') {
                const riskDetails = riskResult.value;
                let riskLevelClass = 'level-high';
                if (riskDetails.riskLevel === 'Critical') riskLevelClass = 'level-critical';
                if (riskDetails.riskLevel === 'Medium') riskLevelClass = 'level-medium';
                if (riskDetails.riskLevel === 'Low') riskLevelClass = 'level-low';

                html += `
                    <h4>${riskDetails.title}</h4>
                    <p><strong>Impact:</strong> ${riskDetails.impact}</p>
                    <p><strong>Likelihood:</strong> ${riskDetails.likelihood}</p>
                    <p><strong>Risk Level:</strong> <span class="risk-level ${riskLevelClass}">${riskDetails.riskLevel} Risk</span></p>
                    <p><strong>Description:</strong> ${riskDetails.description}</p>
                    <p><strong>Example:</strong> ${riskDetails.example}</p>
                `;
            }

            if (assetsResult.status === 'fulfilled') {
                const assets = assetsResult.value;
                html += `<h4 style="margin-top: 1rem;">Assets in this cell (${assets.length})</h4>`;
                if (assets.length === 0) {
                    html += '<p>No assets mapped to this cell.</p>';
                } else {
                    html += '<ul style="margin-top:0.5rem;">';
                    assets.forEach(a => {
                        html += `<li><strong>${a.name}</strong> — ${a.risk_count} risk(s), highest level: ${a.highest_level}</li>`;
                    });
                    html += '</ul>';
                }
            }

            if (!html) html = '<p>No details available for this cell.</p>';
            modalBody.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading details for cell:', error);
            modalBody.innerHTML = '<p>Error loading cell details. Please try again later.</p>';
                });
        }
        
        // Update trend indicator
        function updateTrend(elementId, direction, value, text) {
            const trendElement = document.getElementById(elementId);
            trendElement.innerHTML = '';
            
            const icon = document.createElement('i');
            icon.className = `fas ${direction === 'up' ? 'fa-arrow-up trend-up' : 'fa-arrow-down trend-down'}`;
            
            const span = document.createElement('span');
            span.textContent = `${value} ${text}`;
            
            trendElement.appendChild(icon);
            trendElement.appendChild(span);
        }
