document.addEventListener('DOMContentLoaded', function() {
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
    
    // Modal handling
    const addAssetBtn = document.getElementById('addAssetBtn');
    const importAssetBtn = document.getElementById('importAssetBtn');
    const addAssetModal = document.getElementById('addAssetModal');
    const importModal = document.getElementById('importModal');
    const editAssetModal = document.getElementById('editAssetModal');
    const assetDetailModal = document.getElementById('assetDetailModal');
    const cancelAddAsset = document.getElementById('cancelAddAsset');
    const cancelImport = document.getElementById('cancelImport');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const assetTypeSelect = document.getElementById('assetType');
    const digitalFields = document.getElementById('digitalFields');
    const editAssetTypeSelect = document.getElementById('editAssetType');
    const editDigitalFields = document.getElementById('editDigitalFields');
    const closeAssetDetailBtn = document.getElementById('closeAssetDetailBtn');
    
    // Open modals
    addAssetBtn.addEventListener('click', function() {
        addAssetModal.classList.add('show');
    });
    
    importAssetBtn.addEventListener('click', function() {
        importModal.classList.add('show');
    });
    
    // Close modals
    cancelAddAsset.addEventListener('click', function() {
        addAssetModal.classList.remove('show');
    });
    
    cancelImport.addEventListener('click', function() {
        importModal.classList.remove('show');
    });
    
    closeAssetDetailBtn.addEventListener('click', function() {
        assetDetailModal.classList.remove('show');
    });
    
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });
    
    // Conditional fields for digital assets
    assetTypeSelect.addEventListener('change', function() {
        if (this.value === 'digital') {
            digitalFields.style.display = 'block';
        } else {
            digitalFields.style.display = 'none';
        }
    });
    
    editAssetTypeSelect.addEventListener('change', function() {
        if (this.value === 'digital') {
            editDigitalFields.style.display = 'block';
        } else {
            editDigitalFields.style.display = 'none';
        }
    });
    
    // Load assets on page load
    loadAssets();
    
    // Add new asset
    document.getElementById('saveAssetBtn').addEventListener('click', function() {
        const assetData = {
            name: document.getElementById('assetName').value,
            description: document.getElementById('assetDescription').value,
            owner: document.getElementById('assetOwner').value,
            location: document.getElementById('assetLocation').value,
            type: document.getElementById('assetType').value,
            business_criticality: document.getElementById('businessCriticality').value,
            data_classification: document.getElementById('dataClassification').value
        };
        
        // Validation
        if (!assetData.name || !assetData.owner || !assetData.type || !assetData.business_criticality) {
            alert('Please fill in all required fields');
            return;
        }
        
        fetch('/api/assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assetData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                addAssetModal.classList.remove('show');
                document.getElementById('addAssetForm').reset();
                digitalFields.style.display = 'none';
                loadAssets();
                alert('Asset added successfully!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding asset');
        });
    });
    
    // Update asset
    document.getElementById('updateAssetBtn').addEventListener('click', function() {
        const assetId = document.getElementById('editAssetId').value;
        const assetData = {
            name: document.getElementById('editAssetName').value,
            description: document.getElementById('editAssetDescription').value,
            owner: document.getElementById('editAssetOwner').value,
            location: document.getElementById('editAssetLocation').value,
            type: document.getElementById('editAssetType').value,
            business_criticality: document.getElementById('editBusinessCriticality').value,
            data_classification: document.getElementById('editDataClassification').value
        };
        
        if (!assetId || !assetData.name || !assetData.owner || !assetData.type || !assetData.business_criticality) {
            alert('Please fill in all required fields');
            return;
        }
        
        fetch(`/api/assets/${assetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assetData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                editAssetModal.classList.remove('show');
                loadAssets();
                alert('Asset updated successfully!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating asset');
        });
    });
    
    // Cancel edit
    document.getElementById('cancelEditAsset').addEventListener('click', function() {
        editAssetModal.classList.remove('show');
    });
    
    // Load assets function
    function loadAssets() {
        fetch('/api/assets')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    document.getElementById('tableSummary').textContent = 'Error loading assets';
                    return;
                }
                
                const tbody = document.getElementById('assetsTableBody');
                tbody.innerHTML = '';
                
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No assets found</td></tr>';
                    document.getElementById('tableSummary').textContent = '0 assets';
                    return;
                }
                
                data.forEach(asset => {
                    const row = document.createElement('tr');
                    
                    // Type icon mapping
                    const typeIcons = {
                        'Digital': { icon: 'fa-database', class: 'type-digital' },
                        'Physical': { icon: 'fa-building', class: 'type-physical' },
                        'People': { icon: 'fa-user', class: 'type-people' },
                        'Process': { icon: 'fa-cogs', class: 'type-process' }
                    };
                    
                    const typeInfo = typeIcons[asset.type] || { icon: 'fa-question', class: 'type-digital' };
                    
                    // Criticality class mapping
                    const criticalityClass = `level-${asset.business_criticality.toLowerCase().replace(' ', '-')}`;
                    
                    row.innerHTML = `
                        <td>${asset.name}</td>
                        <td>
                            <div class="asset-type">
                                <div class="type-icon ${typeInfo.class}">
                                    <i class="fas ${typeInfo.icon}"></i>
                                </div>
                                <span>${asset.type}</span>
                            </div>
                        </td>
                        <td>${asset.owner}</td>
                        <td><span class="criticality-level ${criticalityClass}">${asset.business_criticality}</span></td>
                        <td><span class="risk-count" data-asset-id="${asset.id}">${asset.risk_count || 0}</span></td>
                        <td>
                            <div class="action-buttons-cell">
                                <div class="action-btn view-btn" data-asset-id="${asset.id}">
                                    <i class="fas fa-eye"></i>
                                </div>
                                <div class="action-btn edit-btn" data-asset-id="${asset.id}">
                                    <i class="fas fa-edit"></i>
                                </div>
                                <div class="action-btn delete-btn" data-asset-id="${asset.id}">
                                    <i class="fas fa-trash"></i>
                                </div>
                            </div>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                document.getElementById('tableSummary').textContent = `${data.length} assets`;
                
                // Add event listeners to the new buttons
                addEventListenersToButtons();
            })
            .catch(error => {
                console.error('Error loading assets:', error);
                document.getElementById('tableSummary').textContent = 'Error loading assets';
            });
    }
    
    // Add event listeners to dynamic buttons
    function addEventListenersToButtons() {
        // View asset details
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const assetId = this.getAttribute('data-asset-id');
                viewAsset(assetId);
            });
        });
        
        // Edit asset
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const assetId = this.getAttribute('data-asset-id');
                editAsset(assetId);
            });
        });
        
        // Delete asset
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const assetId = this.getAttribute('data-asset-id');
                deleteAsset(assetId);
            });
        });
        
        // View risks
        document.querySelectorAll('.risk-count').forEach(button => {
            button.addEventListener('click', function() {
                const assetId = this.getAttribute('data-asset-id');
                viewAsset(assetId);
            });
        });
    }
    
    // View asset details
    function viewAsset(assetId) {
        fetch(`/api/assets/${assetId}`)
            .then(response => response.json())
            .then(asset => {
                if (asset.error) {
                    alert('Error loading asset: ' + asset.error);
                    return;
                }
                
                document.getElementById('assetDetailTitle').textContent = asset.name;
                
                // Populate asset info
                document.getElementById('assetInfo').innerHTML = `
                    <div style="margin-bottom: 1rem;">
                        <strong>Description:</strong> ${asset.description || 'N/A'}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <strong>Type:</strong> ${asset.type}
                        </div>
                        <div>
                            <strong>Owner:</strong> ${asset.owner}
                        </div>
                        <div>
                            <strong>Location:</strong> ${asset.location || 'N/A'}
                        </div>
                        <div>
                            <strong>Business Criticality:</strong> ${asset.business_criticality}
                        </div>
                        <div>
                            <strong>Data Classification:</strong> ${asset.data_classification || 'N/A'}
                        </div>
                        <div>
                            <strong>Created:</strong> ${new Date(asset.created_at).toLocaleDateString()}
                        </div>
                    </div>
                `;
                
                // Load associated risks
                return fetch(`/api/assets/${assetId}/risks`);
            })
            .then(response => response.json())
            .then(risks => {
                const tbody = document.getElementById('risksTableBody');
                tbody.innerHTML = '';
                
                if (risks.error || risks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No risks found for this asset</td></tr>';
                } else {
                    risks.forEach(risk => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${risk.id}</td>
                            <td>${risk.title}</td>
                            <td>${risk.likelihood_qual || 'N/A'}</td>
                            <td>${risk.impact_qual || 'N/A'}</td>
                            <td>${risk.calculated_level || 'N/A'}</td>
                        `;
                        tbody.appendChild(row);
                    });
                }
                
                assetDetailModal.classList.add('show');
            })
            .catch(error => {
                console.error('Error loading asset:', error);
                alert('Error loading asset details');
            });
    }
    
    // Edit asset
    function editAsset(assetId) {
        fetch(`/api/assets/${assetId}`)
            .then(response => response.json())
            .then(asset => {
                if (asset.error) {
                    alert('Error loading asset: ' + asset.error);
                    return;
                }
                
                document.getElementById('editAssetId').value = asset.id;
                document.getElementById('editAssetName').value = asset.name;
                document.getElementById('editAssetDescription').value = asset.description || '';
                document.getElementById('editAssetOwner').value = asset.owner;
                document.getElementById('editAssetLocation').value = asset.location || '';
                document.getElementById('editAssetType').value = asset.type.toLowerCase();
                document.getElementById('editBusinessCriticality').value = asset.business_criticality.toLowerCase().replace(' ', '-');
                
                if (asset.data_classification) {
                    document.getElementById('editDataClassification').value = asset.data_classification.toLowerCase();
                }
                
                // Show/hide digital fields
                if (asset.type.toLowerCase() === 'digital') {
                    editDigitalFields.style.display = 'block';
                } else {
                    editDigitalFields.style.display = 'none';
                }
                
                editAssetModal.classList.add('show');
            })
            .catch(error => {
                console.error('Error loading asset:', error);
                alert('Error loading asset for editing');
            });
    }
    
    // Delete asset
    function deleteAsset(assetId) {
        if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
            return;
        }
        
        fetch(`/api/assets/${assetId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error deleting asset: ' + data.error);
            } else {
                alert('Asset deleted successfully');
                loadAssets();
            }
        })
        .catch(error => {
            console.error('Error deleting asset:', error);
            alert('Error deleting asset');
        });
    }
    
    // Import CSV functionality
    let currentStep = 1;
    let csvData = [];
    
    document.getElementById('nextStepBtn').addEventListener('click', function() {
        if (currentStep === 1) {
            // Step 1 to Step 2
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step1Content').style.display = 'none';
            document.getElementById('step2').classList.add('active');
            document.getElementById('step2Content').style.display = 'block';
            currentStep = 2;
            document.getElementById('nextStepBtn').textContent = 'Next';
        } else if (currentStep === 2) {
            // Step 2 to Step 3 (if file is selected)
            const fileInput = document.getElementById('csvFileInput');
            if (!fileInput.files.length) {
                alert('Please select a CSV file first');
                return;
            }
            
            parseCSV(fileInput.files[0]);
        } else if (currentStep === 3) {
            // Step 3 - Confirm import
            importCSVData();
        }
    });
    
    document.getElementById('downloadTemplateBtn').addEventListener('click', function() {
        window.open('/api/assets/download-template', '_blank');
    });
    
    document.getElementById('browseFilesBtn').addEventListener('click', function() {
        document.getElementById('csvFileInput').click();
    });
    
    document.getElementById('csvFileInput').addEventListener('change', function(e) {
        if (e.target.files.length) {
            const file = e.target.files[0];
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileInfo').style.display = 'block';
        }
    });
    
    document.getElementById('fileUploadArea').addEventListener('click', function() {
        document.getElementById('csvFileInput').click();
    });
    
    // Drag and drop for CSV file
    document.getElementById('fileUploadArea').addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--accent)';
    });
    
    document.getElementById('fileUploadArea').addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '#cbd5e1';
    });
    
    document.getElementById('fileUploadArea').addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#cbd5e1';
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.csv')) {
                document.getElementById('csvFileInput').files = e.dataTransfer.files;
                document.getElementById('fileName').textContent = file.name;
                document.getElementById('fileInfo').style.display = 'block';
            } else {
                alert('Please select a CSV file');
            }
        }
    });
    
    function parseCSV(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            csvData = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                
                csvData.push(row);
            }
            
            // Show preview
            showImportPreview();
            
            // Move to step 3
            document.getElementById('step2').classList.remove('active');
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step2Content').style.display = 'none';
            document.getElementById('step3').classList.add('active');
            document.getElementById('step3Content').style.display = 'block';
            document.getElementById('nextStepBtn').style.display = 'none';
            document.getElementById('confirmImportBtn').style.display = 'block';
            currentStep = 3;
        };
        
        reader.readAsText(file);
    }
    
    function showImportPreview() {
        const tbody = document.getElementById('importPreviewBody');
        tbody.innerHTML = '';
        
        csvData.forEach((row, index) => {
            if (index < 5) { // Show first 5 rows only
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.name || ''}</td>
                    <td>${row.type || ''}</td>
                    <td>${row.owner || ''}</td>
                    <td>${row.business_criticality || ''}</td>
                `;
                tbody.appendChild(tr);
            }
        });
        
        document.getElementById('importCount').textContent = csvData.length;
    }
    
    function importCSVData() {
        const formData = new FormData();
        const file = document.getElementById('csvFileInput').files[0];
        formData.append('file', file);
        
        fetch('/api/assets/import', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error importing: ' + data.error);
            } else {
                alert(data.message);
                importModal.classList.remove('show');
                resetImportModal();
                loadAssets();
            }
        })
        .catch(error => {
            console.error('Error importing:', error);
            alert('Error importing assets');
        });
    }
    
    function resetImportModal() {
        currentStep = 1;
        csvData = [];
        
        // Reset steps
        document.getElementById('step1').classList.add('active');
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step2').classList.remove('completed');
        document.getElementById('step3').classList.remove('active');
        
        // Reset content visibility
        document.getElementById('step1Content').style.display = 'block';
        document.getElementById('step2Content').style.display = 'none';
        document.getElementById('step3Content').style.display = 'none';
        
        // Reset buttons
        document.getElementById('nextStepBtn').style.display = 'block';
        document.getElementById('nextStepBtn').textContent = 'Next';
        document.getElementById('confirmImportBtn').style.display = 'none';
        
        // Reset file input
        document.getElementById('csvFileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('importPreviewBody').innerHTML = '';
    }
    
    // Filter functionality
    const typeFilter = document.getElementById('typeFilter');
    const criticalityFilter = document.getElementById('criticalityFilter');
    const searchInput = document.querySelector('.search-input');
    
    function applyFilters() {
        const typeValue = typeFilter.value;
        const criticalityValue = criticalityFilter.value;
        const searchValue = searchInput.value.toLowerCase();
        
        const rows = document.querySelectorAll('#assetsTableBody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 5) return;
            
            const typeText = cells[1].querySelector('span').textContent.toLowerCase();
            const criticalityText = cells[3].querySelector('span').textContent.toLowerCase().replace(' ', '-');
            const rowText = row.textContent.toLowerCase();
            
            let visible = true;
            
            // Apply type filter
            if (typeValue !== 'all' && typeText !== typeValue) {
                visible = false;
            }
            
            // Apply criticality filter
            if (criticalityValue !== 'all' && criticalityText !== criticalityValue) {
                visible = false;
            }
            
            // Apply search filter
            if (searchValue && !rowText.includes(searchValue)) {
                visible = false;
            }
            
            if (visible) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        document.getElementById('tableSummary').textContent = `${visibleCount} assets`;
    }
    
    typeFilter.addEventListener('change', applyFilters);
    criticalityFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
});