// risk_register.js - COMPLETE UPDATED VERSION

let risksData = [];
let assetTypes = [];
let riskLevels = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Risk Register initialized');
    
    // Check if modal exists
    const modal = document.getElementById('riskDetailModal');
    console.log('Modal element found:', !!modal);
    
    if (modal) {
        console.log('Modal initial display:', window.getComputedStyle(modal).display);
    }
    
    loadFilters();
    loadRisks();
    
    // Setup event listeners
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterRisks);
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterRisks);
    }
    
    const riskLevelFilter = document.getElementById('riskLevelFilter');
    if (riskLevelFilter) {
        riskLevelFilter.addEventListener('change', filterRisks);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportRisks);
    }
    
    // Reset assessment button
    const resetBtn = document.getElementById('resetAssessmentBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRiskAssessment);
    }
    
    // Modal close buttons - MULTIPLE METHODS to ensure close works
    const modalClose = document.getElementById('modalClose');
    const modalCloseFooter = document.getElementById('modalCloseFooter');
    
    if (modalClose) {
        modalClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    }
    
    if (modalCloseFooter) {
        modalCloseFooter.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('riskDetailModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('riskDetailModal');
            if (modal && modal.style.display === 'flex') {
                closeModal();
            }
        }
    });
});

// Load filter options
function loadFilters() {
    fetch('/api/risk-register/filters')
        .then(response => response.json())
        .then(data => {
            console.log('Filters loaded:', data);
            assetTypes = data.asset_types || [];
            riskLevels = data.risk_levels || [];
            populateFilters();
        })
        .catch(error => {
            console.error('Error loading filters:', error);
        });
}

// Populate filter dropdowns
function populateFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const riskLevelFilter = document.getElementById('riskLevelFilter');
    
    if (!typeFilter || !riskLevelFilter) return;
    
    typeFilter.innerHTML = '<option value="all">All Types</option>';
    riskLevelFilter.innerHTML = '<option value="all">All Levels</option>';
    
    assetTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value || type.asset_type;
        option.textContent = type.label || type.asset_type;
        typeFilter.appendChild(option);
    });
    
    riskLevels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.value;
        option.textContent = level.label;
        riskLevelFilter.appendChild(option);
    });
}

// Load risks from API
function loadRisks() {
    const tableSummary = document.getElementById('tableSummary');
    if (tableSummary) tableSummary.textContent = 'Loading risks...';
    
    fetch('/api/risk-register/risks')
        .then(response => response.json())
        .then(data => {
            console.log('Risks loaded:', data.length, 'items');
            risksData = data;
            displayRisks(risksData);
            updateSummary(risksData.length);
        })
        .catch(error => {
            console.error('Error loading risks:', error);
            if (tableSummary) tableSummary.textContent = 'Error loading risks';
            showAlert('Error loading risk data', 'error');
        });
}

// Display risks in table
function displayRisks(risks) {
    const tbody = document.getElementById('riskTableBody');
    const emptyDiv = document.getElementById('tableEmpty');
    const table = document.querySelector('.asset-table');
    
    if (!tbody) return;
    
    if (!risks || risks.length === 0) {
        tbody.innerHTML = '';
        if (emptyDiv) emptyDiv.style.display = 'flex';
        if (table) table.style.display = 'none';
        return;
    }
    
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (table) table.style.display = 'table';
    
    let html = '';
    risks.forEach(risk => {
        const riskLevelClass = getRiskLevelClass(risk.risk_level);
        
        html += `
            <tr class="risk-row" data-risk-id="${risk.risk_id}">
                <td>${escapeHtml(risk.asset_name || 'N/A')}</td>
                <td>${formatNumber(risk.quantitative_risk_score, true)}</td>
                <td>${formatNumber(risk.qualitative_risk_score)}</td>
                <td>${formatNumber(risk.iso_27005_risk_score, true)}</td>
                <td>${formatNumber(risk.bia_score, true)}</td>
                <td>${formatNumber(risk.bia_risk_priority, true)}</td>
                <td>
                    <span class="risk-badge ${riskLevelClass}">
                        ${risk.risk_level || 'Unknown'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon delete-risk" data-risk-id="${risk.risk_id}" title="Delete Risk">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Add click handlers for rows
    document.querySelectorAll('.risk-row').forEach(row => {
        row.addEventListener('click', function(e) {
            if (e.target.closest('.delete-risk')) return;
            const riskId = this.dataset.riskId;
            console.log('Row clicked, risk ID:', riskId);
            showRiskDetails(riskId);
        });
    });
    
    // Add click handlers for delete buttons
    document.querySelectorAll('.delete-risk').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const riskId = this.dataset.riskId;
            confirmDeleteRisk(riskId);
        });
    });
}

// Get CSS class for risk level
function getRiskLevelClass(level) {
    switch(level) {
        case 'Critical': return 'level-critical';
        case 'Very High': return 'level-very-high';
        case 'High': return 'level-high';
        case 'Medium': return 'level-medium';
        case 'Low': return 'level-low';
        default: return 'level-unknown';
    }
}

// Format number for display
function formatNumber(value, isCurrency = false) {
    if (value === null || value === undefined || value === 0) return '-';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    if (isCurrency) {
        if (num >= 1000000) {
            return '$' + (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return '$' + (num / 1000).toFixed(2) + 'K';
        } else {
            return '$' + num.toFixed(2);
        }
    } else {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        } else if (Number.isInteger(num)) {
            return num.toString();
        } else {
            return num.toFixed(2);
        }
    }
}

// Escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Filter risks
function filterRisks() {
    const searchTerm = document.getElementById('globalSearch').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const riskLevelFilter = document.getElementById('riskLevelFilter').value;
    
    const filtered = risksData.filter(risk => {
        const matchesSearch = !searchTerm || 
            (risk.asset_name && risk.asset_name.toLowerCase().includes(searchTerm));
        
        const matchesType = typeFilter === 'all' || risk.asset_type === typeFilter;
        
        const matchesRiskLevel = riskLevelFilter === 'all' || risk.risk_level === riskLevelFilter;
        
        return matchesSearch && matchesType && matchesRiskLevel;
    });
    
    displayRisks(filtered);
    updateSummary(filtered.length);
}

// Update table summary
function updateSummary(count) {
    const summary = document.getElementById('tableSummary');
    if (!summary) return;
    
    if (count === 1) {
        summary.textContent = 'Showing 1 risk';
    } else {
        summary.textContent = `Showing ${count} risks`;
    }
}

// Show risk details in modal - IMPROVED VERSION
function showRiskDetails(riskId) {
    console.log('Fetching details for risk:', riskId);
    
    // Show loading state in modal
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p>Loading risk details...</p>
            </div>
        `;
    }
    
    // Open modal immediately with loading state
    forceOpenModal();
    
    fetch(`/api/risk-register/risks/${riskId}/details`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(risk => {
            console.log('Risk details received:', risk);
            populateRiskModal(risk);
        })
        .catch(error => {
            console.error('Error loading risk details:', error);
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle fa-3x"></i>
                        <p>Error loading risk details: ${error.message}</p>
                        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                    </div>
                `;
            }
            showAlert('Error loading risk details', 'error');
        });
}

// Force open modal with multiple methods
function forceOpenModal() {
    console.log('forceOpenModal called');
    const modal = document.getElementById('riskDetailModal');
    
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    
    // Method 1: Direct style
    modal.style.display = 'flex';
    
    // Method 2: Add class
    modal.classList.add('show');
    
    // Method 3: Remove any inline none
    modal.style.removeProperty('display');
    modal.style.setProperty('display', 'flex', 'important');
    
    console.log('Modal display set to:', modal.style.display);
    console.log('Modal classes:', modal.className);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

// Populate modal with risk data
function populateRiskModal(risk) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    // Calculate BIA priority if not present
    const biaPriority = risk.bia_priority || 
        (risk.qualitative_risk_score && risk.asset_value ? 
         risk.qualitative_risk_score * risk.asset_value : 0);
    
    const riskLevelClass = getRiskLevelClass(risk.risk_level);
    
    let html = `
        <div class="risk-detail-section">
            <h4><i class="fas fa-server"></i> Asset Information</h4>
            <table class="detail-table">
                <tr>
                    <th>Asset Name:</th>
                    <td>${escapeHtml(risk.asset_name || 'N/A')}</td>
                    <th>Asset Type:</th>
                    <td>${escapeHtml(risk.asset_type || 'N/A')}</td>
                </tr>
                <tr>
                    <th>Asset Owner:</th>
                    <td>${escapeHtml(risk.asset_owner || 'N/A')}</td>
                    <th>Asset Location:</th>
                    <td>${escapeHtml(risk.asset_location || 'N/A')}</td>
                </tr>
                <tr>
                    <th>IP Address:</th>
                    <td>${escapeHtml(risk.ip_address || 'N/A')}</td>
                    <th>Asset Value:</th>
                    <td>${formatNumber(risk.asset_value, true) || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Description:</th>
                    <td colspan="3">${escapeHtml(risk.asset_description || 'No description')}</td>
                </tr>
            </table>
        </div>
        
        <div class="risk-detail-section">
            <h4><i class="fas fa-shield-alt"></i> CIA Impacts</h4>
            <table class="detail-table">
                <tr>
                    <th>Confidentiality:</th>
                    <td><span class="cia-badge">${risk.confidentiality || '3'}</span></td>
                    <th>Integrity:</th>
                    <td><span class="cia-badge">${risk.integrity || '3'}</span></td>
                    <th>Availability:</th>
                    <td><span class="cia-badge">${risk.availability || '3'}</span></td>
                </tr>
            </table>
        </div>
        
        <div class="risk-detail-section">
            <h4><i class="fas fa-chart-line"></i> Risk Scores</h4>
            <table class="detail-table">
                <tr>
                    <th>Risk Level:</th>
                    <td colspan="3">
                        <span class="risk-badge ${riskLevelClass}">${risk.risk_level}</span>
                    </td>
                </tr>
                <tr>
                    <th>Qualitative (NIST):</th>
                    <td>${formatNumber(risk.qualitative_risk_score)}</td>
                    <th>Quantitative (ALE):</th>
                    <td>${formatNumber(risk.quantitative_risk_score, true)}</td>
                </tr>
                <tr>
                    <th>ISO 27005:</th>
                    <td>${formatNumber(risk.iso_27005_risk_score, true)}</td>
                    <th>BIA Priority:</th>
                    <td>${formatNumber(biaPriority, true)}</td>
                </tr>
    `;
    
    if (risk.annual_rate_of_occurrence) {
        html += `
                <tr>
                    <th>ARO:</th>
                    <td>${risk.annual_rate_of_occurrence}</td>
                    <th>EF:</th>
                    <td>${risk.exposure_factor || 0}%</td>
                </tr>
                <tr>
                    <th>SLE:</th>
                    <td colspan="3">${formatNumber(risk.single_loss_expectancy, true) || '-'}</td>
                </tr>
        `;
    }
    
    html += `
            </table>
        </div>
        
        <div class="risk-detail-section">
            <h4><i class="fas fa-bug"></i> Vulnerability Information</h4>
            <table class="detail-table">
                <tr>
                    <th>Vulnerability:</th>
                    <td colspan="3">${escapeHtml(risk.vulnerability_name || 'N/A')}</td>
                </tr>
                <tr>
                    <th>Description:</th>
                    <td colspan="3">${escapeHtml(risk.vulnerability_description || 'No description')}</td>
                </tr>
    `;
    
    if (risk.cves && risk.cves.length > 0) {
        html += `
                <tr>
                    <th>CVEs:</th>
                    <td colspan="3">
                        <ul class="cve-list">
        `;
        
        risk.cves.forEach(cve => {
            const severityClass = cve.cve_severity ? `cve-${cve.cve_severity.toLowerCase()}` : '';
            html += `
                <li class="${severityClass}">
                    <strong>${escapeHtml(cve.cve_id)}</strong> 
                    (Score: ${cve.cve_score || 'N/A'}, Severity: ${cve.cve_severity || 'Unknown'})
                </li>
            `;
        });
        
        html += `
                        </ul>
                    </td>
                </tr>
        `;
    }
    
    if (risk.threats && risk.threats.length > 0) {
        html += `
                <tr>
                    <th>Threats:</th>
                    <td colspan="3">
                        <ul class="threat-list">
        `;
        
        risk.threats.forEach(threat => {
            html += `
                <li>
                    <strong>${escapeHtml(threat.threat_name)}</strong> 
                    (Source: ${threat.source || 'N/A'}, Likelihood: ${threat.likelihood || 'N/A'})
                </li>
            `;
        });
        
        html += `
                        </ul>
                    </td>
                </tr>
        `;
    }
    
    html += `
            </table>
        </div>
    `;
    
    if (risk.controls && risk.controls.length > 0) {
        html += `
            <div class="risk-detail-section">
                <h4><i class="fas fa-tasks"></i> Controls (${risk.controls.length})</h4>
                <table class="detail-table">
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Effectiveness</th>
                    </tr>
        `;
        
        risk.controls.forEach(control => {
            const effectivenessClass = control.effectiveness ? `effectiveness-${control.effectiveness.toLowerCase()}` : '';
            html += `
                    <tr>
                        <td>${escapeHtml(control.name || 'N/A')}</td>
                        <td>${escapeHtml(control.type || 'N/A')}</td>
                        <td>${escapeHtml(control.status || 'N/A')}</td>
                        <td class="${effectivenessClass}">${escapeHtml(control.effectiveness || 'N/A')}</td>
                    </tr>
            `;
        });
        
        html += `
                </table>
            </div>
        `;
    }
    
    if (risk.treatment_plan) {
        const tp = risk.treatment_plan;
        html += `
            <div class="risk-detail-section">
                <h4><i class="fas fa-clipboard-check"></i> Treatment Plan</h4>
                <table class="detail-table">
                    <tr>
                        <th>Strategy:</th>
                        <td colspan="3"><span class="strategy-badge strategy-${(tp.strategy || '').toLowerCase()}">${escapeHtml(tp.strategy || 'N/A')}</span></td>
                    </tr>
                    <tr>
                        <th>Justification:</th>
                        <td colspan="3">${escapeHtml(tp.justification || 'N/A')}</td>
                    </tr>
        `;
        
        if (tp.strategy === 'Transfer' && tp.transfer_method) {
            html += `
                    <tr>
                        <th>Transfer Method:</th>
                        <td>${escapeHtml(tp.transfer_method || 'N/A')}</td>
                        <th>Transfer Party:</th>
                        <td>${escapeHtml(tp.transfer_party || 'N/A')}</td>
                    </tr>
                    <tr>
                        <th>Transfer Details:</th>
                        <td colspan="3">${escapeHtml(tp.transfer_details || 'N/A')}</td>
                    </tr>
            `;
        }
        
        if (tp.strategy === 'Avoid' && tp.avoidance_plan) {
            html += `
                    <tr>
                        <th>Avoidance Plan:</th>
                        <td colspan="3">${escapeHtml(tp.avoidance_plan || 'N/A')}</td>
                    </tr>
                    <tr>
                        <th>Timeline:</th>
                        <td>${escapeHtml(tp.avoidance_timeline || 'N/A')}</td>
                        <th>Impact:</th>
                        <td>${escapeHtml(tp.avoidance_impact || 'N/A')}</td>
                    </tr>
            `;
        }
        
        if (tp.approver) {
            html += `
                    <tr>
                        <th>Approver:</th>
                        <td>${escapeHtml(tp.approver || 'N/A')}</td>
                        <th>Approval Date:</th>
                        <td>${tp.approval_date || 'N/A'}</td>
                    </tr>
            `;
        }
        
        html += `
                </table>
            </div>
        `;
    }
    
    html += `
        <div class="risk-detail-section">
            <h4><i class="fas fa-info-circle"></i> Assessment Information</h4>
            <table class="detail-table">
                <tr>
                    <th>Assessed By:</th>
                    <td>${escapeHtml(risk.assessed_by || 'N/A')}</td>
                    <th>Assessment Date:</th>
                    <td>${risk.created_at ? new Date(risk.created_at).toLocaleString() : 'N/A'}</td>
                </tr>
                <tr>
                    <th>Last Updated:</th>
                    <td colspan="3">${risk.updated_at ? new Date(risk.updated_at).toLocaleString() : 'N/A'}</td>
                </tr>
            </table>
        </div>
    `;
    
    modalBody.innerHTML = html;
}

// Confirm delete risk
function confirmDeleteRisk(riskId) {
    if (confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
        deleteRisk(riskId);
    }
}

// Delete risk
function deleteRisk(riskId) {
    fetch(`/api/risk-register/risks/${riskId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Risk deleted successfully', 'success');
            loadRisks();
        } else {
            showAlert(data.error || 'Error deleting risk', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting risk:', error);
        showAlert('Error deleting risk', 'error');
    });
}

// Export risks
function exportRisks() {
    window.location.href = '/api/risk-register/export';
}

// Reset risk assessment
function resetRiskAssessment() {
    if (!confirm('WARNING: This will permanently delete ALL risks, controls, treatment plans, and mappings. This action cannot be undone. Are you sure?')) {
        return;
    }
    
    const confirmation = prompt('Type "RESET" to confirm this destructive action:');
    if (confirmation !== 'RESET') {
        showAlert('Reset cancelled', 'info');
        return;
    }
    
    showAlert('Resetting risk assessment data...', 'info');
    
    fetch('/api/risk-register/reset', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            loadRisks();
        } else {
            showAlert(data.error || 'Error resetting', 'error');
        }
    })
    .catch(error => {
        console.error('Error resetting:', error);
        showAlert('Error resetting assessment', 'error');
    });
}

// Modal functions - IMPROVED
function openModal() {
    console.log('openModal called');
    const modal = document.getElementById('riskDetailModal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    // Multiple methods to ensure modal opens
    modal.style.setProperty('display', 'flex', 'important');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    console.log('Modal opened, display:', modal.style.display);
    console.log('Modal classes:', modal.className);
}

function closeModal() {
    console.log('closeModal called');
    const modal = document.getElementById('riskDetailModal');
    if (!modal) return;
    
    modal.style.setProperty('display', 'none', 'important');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    console.log('Modal closed');
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
}