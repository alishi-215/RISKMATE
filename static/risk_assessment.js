// Global variables to track state
        let currentCveData = null;
        let isUsingCve = false;
        let newThreatId = null;
        let currentAssetType = '';

        // Toggle profile dropdown
        document.querySelector('.avatar').addEventListener('click', function() {
            document.querySelector('.profile-dropdown').classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        window.addEventListener('click', function(e) {
            if (!e.target.matches('.avatar') && !e.target.closest('.profile-dropdown')) {
                document.querySelector('.profile-dropdown').classList.remove('show');
            }
        });
        
        // Asset selection handler - UPDATED: Handle asset type specific logic
        document.getElementById('assetSelect').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            document.getElementById('assetDescription').value = selectedOption.getAttribute('data-description') || '';
            
            // Get asset type and update UI accordingly
            currentAssetType = selectedOption.getAttribute('data-type') || '';
            updateUIForAssetType(currentAssetType);
        });

        // Function to update UI based on asset type
        function updateUIForAssetType(assetType) {
            const assetTypeInfo = document.getElementById('assetTypeInfo');
            const assetTypeMessage = document.getElementById('assetTypeMessage');
            const cveSearchGroup = document.getElementById('cveSearchGroup');
            const vulnSource = document.getElementById('vulnSource');
            const newVulnCveId = document.getElementById('newVulnCveId');
            const newVulnCvssScore = document.getElementById('newVulnCvssScore');
            
            // Show asset type info
            assetTypeInfo.style.display = 'block';
            
            if (assetType === 'Digital') {
                assetTypeMessage.textContent = 'Digital Asset: CVE and CVSS scores are applicable for this asset type.';
                // Enable CVE features for digital assets
                vulnSource.disabled = false;
                cveSearchGroup.style.display = vulnSource.value === 'nvd' ? 'block' : 'none';
                newVulnCveId.disabled = false;
                newVulnCvssScore.disabled = false;
            } else {
                assetTypeMessage.textContent = `${assetType} Asset: CVE and CVSS scores are not applicable for this asset type.`;
                // Disable CVE features for non-digital assets
                vulnSource.value = 'manual';
                vulnSource.disabled = true;
                cveSearchGroup.style.display = 'none';
                newVulnCveId.disabled = true;
                newVulnCvssScore.disabled = true;
                
                // Clear any existing CVE data
                document.getElementById('newVulnCveId').value = '';
                document.getElementById('newVulnCvssScore').value = '';
                document.getElementById('cveInfoSection').style.display = 'none';
                isUsingCve = false;
                currentCveData = null;
            }
        }
        
        // Vulnerability selection handler - UPDATED: Make it optional
        document.getElementById('vulnerabilitySelect').addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue) {
                const selectedOption = this.options[this.selectedIndex];
                document.getElementById('newVulnName').value = selectedOption.textContent.split(' (CVE')[0]; // Remove CVE badge if present
                document.getElementById('newVulnDescription').value = selectedOption.getAttribute('data-description') || '';
                
                // Check if selected vulnerability has CVE data
                const cveId = selectedOption.getAttribute('data-cve-id');
                const cvssScore = selectedOption.getAttribute('data-cvss-score');
                const severity = selectedOption.getAttribute('data-severity');
                
                if (cveId && cveId !== '' && currentAssetType === 'Digital') {
                    // Show CVE information
                    document.getElementById('displayCveId').textContent = cveId;
                    document.getElementById('displayCvssScore').textContent = cvssScore || 'N/A';
                    document.getElementById('displaySeverity').textContent = severity || 'N/A';
                    document.getElementById('cveInfoSection').style.display = 'block';
                    
                    // Set form fields
                    document.getElementById('newVulnCveId').value = cveId;
                    document.getElementById('newVulnCvssScore').value = cvssScore || '';
                    document.getElementById('newVulnSeverity').value = severity || 'Medium';
                    
                    isUsingCve = true;
                    currentCveData = {
                        id: cveId,
                        cvssScore: cvssScore,
                        severity: severity
                    };
                } else {
                    // Hide CVE information
                    document.getElementById('cveInfoSection').style.display = 'none';
                    isUsingCve = false;
                    currentCveData = null;
                    
                    // Set severity if available
                    if (severity) {
                        document.getElementById('newVulnSeverity').value = severity;
                    }
                }
            }
        });
        
        // Threat selection handler
        document.getElementById('threatSelect').addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue === 'new') {
                // Show new threat form
                document.getElementById('newThreatForm').style.display = 'block';
            } else {
                // Hide new threat form
                document.getElementById('newThreatForm').style.display = 'none';
                
                const selectedOption = this.options[this.selectedIndex];
                // We don't auto-populate threat details to avoid confusion
            }
        });
        
        // Vulnerability source toggle - UPDATED: Consider asset type
        document.getElementById('vulnSource').addEventListener('change', function() {
            const cveSearchGroup = document.getElementById('cveSearchGroup');
            if (this.value === 'nvd' && currentAssetType === 'Digital') {
                cveSearchGroup.style.display = 'block';
            } else {
                cveSearchGroup.style.display = 'none';
                isUsingCve = false;
                currentCveData = null;
                document.getElementById('cveInfoSection').style.display = 'none';
            }
        });
        
        // Show alert function
        function showAlert(message, type='info', actions=[{label:'OK', action:'close', class:'btn-primary'}], title=null){
            if(window._global_showAlert && window.showAlert !== undefined){
                window.showAlert(message, type, actions, title);
                return;
            }
            const alertContainer = document.getElementById('alertContainer');
            if(!alertContainer){ alert(message); return; }
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            `;
            alertContainer.appendChild(alert);
            setTimeout(() => { alert.remove(); }, 5000);
        }
        
        // CVE Search button handler
        document.getElementById('searchCveBtn').addEventListener('click', function() {
            const cveInput = document.getElementById('cveInput').value.trim();
            const searchBtn = document.getElementById('searchCveBtn');
            
            if (!cveInput) {
                showAlert('Please enter a CVE ID (e.g., CVE-2021-44228)', 'error');
                return;
            }
            
            // Validate CVE format
            if (!cveInput.match(/^CVE-\d{4}-\d+$/i)) {
                showAlert('Invalid CVE ID format. Use format: CVE-YYYY-NNNNN', 'error');
                return;
            }
            
            // Show loading state
            const originalText = searchBtn.innerHTML;
            searchBtn.innerHTML = '<div class="loading-spinner"></div> Searching...';
            searchBtn.disabled = true;
            
            // Fetch CVE data from the API
            fetch(`/api/cve-search?cve_id=${encodeURIComponent(cveInput)}`)
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || `HTTP error! status: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    // Reset button
                    searchBtn.innerHTML = originalText;
                    searchBtn.disabled = false;
                    
                    // Populate modal with CVE details
                    document.getElementById('modalCveId').textContent = data.id;
                    document.getElementById('modalCveDescription').textContent = data.description;
                    document.getElementById('modalCvssScore').textContent = data.cvss_score;
                    document.getElementById('modalCvssSeverity').textContent = data.severity;
                    document.getElementById('modalCvssVersion').textContent = data.cvss_version || 'N/A';
                    document.getElementById('modalCvssVector').textContent = data.cvss_vector || 'N/A';
                    document.getElementById('modalCwe').textContent = data.cwe || 'N/A';
                    document.getElementById('modalPublishedDate').textContent = data.published_date;
                    document.getElementById('modalLastModified').textContent = data.last_modified || 'N/A';
                    document.getElementById('modalVulnStatus').textContent = data.vuln_status || 'N/A';
                    
                    // Populate references
                    const referencesContainer = document.getElementById('modalReferences');
                    referencesContainer.innerHTML = '';
                    
                    if (data.references && data.references.length > 0) {
                        data.references.forEach(url => {
                            const link = document.createElement('a');
                            link.href = url;
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            link.className = 'reference-link';
                            link.textContent = url;
                            referencesContainer.appendChild(link);
                        });
                    } else {
                        referencesContainer.innerHTML = '<span>No references available</span>';
                    }
                    
                    // Store CVE data for later use
                    currentCveData = data;
                    
                    // Show modal
                    document.getElementById('cveModal').classList.add('show');
                    
                })
                .catch(error => {
                    // Reset button
                    searchBtn.innerHTML = originalText;
                    searchBtn.disabled = false;
                    
                    console.error('Error fetching CVE data:', error);
                    showAlert(`Error fetching CVE data: ${error.message}`, 'error');
                });
        });
        
        // Close modal handlers (apply to all modals using closest parent)
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) modal.classList.remove('show');
            });
        });

        // Cancel CVE button and outside click still target the CVE modal specifically
        const cancelCve = document.getElementById('cancelCveBtn');
        if (cancelCve) cancelCve.addEventListener('click', function() { document.getElementById('cveModal')?.classList.remove('show'); });

        const cveModalEl = document.getElementById('cveModal');
        if (cveModalEl) {
            cveModalEl.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('show');
                }
            });
        }
        
        // Use CVE button handler - UPDATED: Auto-populate form but don't require vulnerability selection
        document.getElementById('useCveBtn').addEventListener('click', function() {
            if (!currentCveData) {
                showAlert('No CVE data available', 'error');
                return;
            }
            
            const cveId = currentCveData.id;
            const cvssScore = currentCveData.cvss_score;
            const severity = currentCveData.severity;
            const description = currentCveData.description;
            
            // Auto-populate the new vulnerability form with CVE data
            document.getElementById('newVulnName').value = cveId;
            document.getElementById('newVulnDescription').value = description;
            document.getElementById('newVulnCveId').value = cveId;
            document.getElementById('newVulnCvssScore').value = cvssScore !== 'N/A' ? cvssScore : '';
            
            // Map NVD severity to our severity values
            const severityMap = {
                'CRITICAL': 'Critical',
                'HIGH': 'High', 
                'MEDIUM': 'Medium',
                'LOW': 'Low'
            };
            document.getElementById('newVulnSeverity').value = severityMap[severity.toUpperCase()] || 'Medium';
            
            // Show CVE information section
            document.getElementById('displayCveId').textContent = cveId;
            document.getElementById('displayCvssScore').textContent = cvssScore !== 'N/A' ? cvssScore : 'N/A';
            document.getElementById('displaySeverity').textContent = severity;
            document.getElementById('cveInfoSection').style.display = 'block';
            
            // Clear any existing vulnerability selection
            document.getElementById('vulnerabilitySelect').value = '';
            
            // Set flag
            isUsingCve = true;
            
            // Close modal
            document.getElementById('cveModal').classList.remove('show');
            showAlert(`CVE ${cveId} data loaded successfully`, 'success');
        });
        
        // Save new threat handler
        document.getElementById('saveNewThreatBtn').addEventListener('click', function() {
            const name = document.getElementById('newThreatName').value.trim();
            const description = document.getElementById('newThreatDescription').value.trim();
            const source = document.getElementById('newThreatSource').value;
            const motivation = document.getElementById('newThreatMotivation').value;
            
            if (!name || !description) {
                showAlert('Threat name and description are required', 'error');
                return;
            }
            
            const threatData = {
                name: name,
                description: description,
                source: source,
                motivation: motivation
            };
            
            // Create new threat
            fetch('/api/threats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(threatData)
            })
            .then(response => response.json())
            .then(threat => {
                if (threat.error) {
                    showAlert(`Error creating threat: ${threat.error}`, 'error');
                } else {
                    newThreatId = threat.id;
                    
                    // Update the dropdown
                    const select = document.getElementById('threatSelect');
                    const newOption = document.createElement('option');
                    newOption.value = threat.id;
                    newOption.textContent = threat.name;
                    newOption.setAttribute('data-description', threat.description);
                    newOption.setAttribute('data-source', threat.source || '');
                    newOption.setAttribute('data-motivation', threat.motivation || '');
                    
                    // Insert before the "Add New" option
                    select.insertBefore(newOption, select.lastChild);
                    
                    // Select the new threat
                    select.value = threat.id;
                    
                    // Hide the form
                    document.getElementById('newThreatForm').style.display = 'none';
                    
                    showAlert('Threat created successfully', 'success');
                }
            })
            .catch(error => {
                console.error('Error creating threat:', error);
                showAlert('Error creating threat', 'error');
            });
        });
        
        // Cancel new threat handler
        document.getElementById('cancelNewThreatBtn').addEventListener('click', function() {
            document.getElementById('newThreatForm').style.display = 'none';
            document.getElementById('threatSelect').value = '';
        });
        
        // Save assessment button handler - UPDATED: Flexible validation
        document.getElementById('saveAssessmentBtn').addEventListener('click', function() {
            const assetId = document.getElementById('assetSelect').value;
            const vulnerabilitySelectId = document.getElementById('vulnerabilitySelect').value;
            let threatId = document.getElementById('threatSelect').value;
            const notes = document.getElementById('assessmentNotes').value;
            
            // Get vulnerability data from form
            const vulnName = document.getElementById('newVulnName').value.trim();
            const vulnDescription = document.getElementById('newVulnDescription').value.trim();
            const vulnCveId = document.getElementById('newVulnCveId').value.trim();
            const vulnSeverity = document.getElementById('newVulnSeverity').value;
            const vulnCvssScore = document.getElementById('newVulnCvssScore').value;
            
            if (!assetId || !threatId) {
                showAlert('Please select an asset and threat before saving.', 'error');
                return;
            }
            
            // If using a new threat that hasn't been saved yet
            if (threatId === 'new') {
                showAlert('Please save the new threat first', 'error');
                return;
            }
            
            // Validate vulnerability data - either select existing or provide new details
            if (!vulnerabilitySelectId && (!vulnName || !vulnDescription)) {
                showAlert('Please either select an existing vulnerability or provide vulnerability name and description', 'error');
                return;
            }
            
            const assessmentData = {
                asset_id: parseInt(assetId),
                threat_id: parseInt(threatId),
                description: notes
            };
            
            // Add vulnerability data based on user input
            if (vulnerabilitySelectId) {
                // Use existing vulnerability
                assessmentData.vulnerability_id = parseInt(vulnerabilitySelectId);
            } else {
                // Create new vulnerability from form data
                assessmentData.vulnerability_data = {
                    name: vulnName,
                    description: vulnDescription,
                    severity: vulnSeverity
                };
                
                // Add CVE data only for digital assets and if provided
                if (currentAssetType === 'Digital' && vulnCveId) {
                    assessmentData.vulnerability_data.cve_id = vulnCveId;
                    assessmentData.vulnerability_data.cvss_score = vulnCvssScore || null;
                }
            }
            
            // Send assessment to the server
            fetch('/api/assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assessmentData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showAlert(`Error saving assessment: ${data.error}`, 'error');
                } else {
                    showAlert('Assessment saved successfully!', 'success');
                    // Reset form
                    resetForm();
                }
            })
            .catch(error => {
                console.error('Error saving assessment:', error);
                showAlert('Error saving assessment', 'error');
            });
        });
        
        // // Save draft button handler
        // document.getElementById('saveDraftBtn').addEventListener('click', function() {
        //     showAlert('Draft assessment saved successfully.', 'success');
        // });
        
        // Reset form function
        function resetForm() {
            document.getElementById('assetSelect').value = '';
            document.getElementById('assetDescription').value = '';
            document.getElementById('vulnerabilitySelect').value = '';
            document.getElementById('newVulnName').value = '';
            document.getElementById('newVulnDescription').value = '';
            document.getElementById('newVulnCveId').value = '';
            document.getElementById('newVulnSeverity').value = 'Medium';
            document.getElementById('newVulnCvssScore').value = '';
            document.getElementById('threatSelect').value = '';
            document.getElementById('assessmentNotes').value = '';
            document.getElementById('cveInfoSection').style.display = 'none';
            document.getElementById('newThreatForm').style.display = 'none';
            document.getElementById('assetTypeInfo').style.display = 'none';
            document.getElementById('vulnSource').value = 'manual';
            document.getElementById('cveSearchGroup').style.display = 'none';
            isUsingCve = false;
            currentCveData = null;
            currentAssetType = '';
        }