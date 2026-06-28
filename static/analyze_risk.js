document.addEventListener('DOMContentLoaded', function() {
    console.log('analyze_risk.js loaded');
    const assetSelect = document.getElementById('asset-select');
    if (!assetSelect) console.warn('analyze_risk.js: #asset-select not found in DOM');
    const vulnerabilitySelect = document.getElementById('vulnerability-select');
    const analyzeBtn = document.getElementById('analyze-btn');
    const assetInfoCard = document.getElementById('asset-info-card');
    const modeSelector = document.getElementById('mode-selector');

    const likelihoodSelect = document.getElementById('likelihood');
    const impactSelect = document.getElementById('impact');
    const riskLevelElement = document.getElementById('qualitative-risk-level');
    const matrixCells = document.querySelectorAll('.matrix-cell');

    // Populate assets on load (try combined endpoint first)
    console.log('analyze_risk.js: fetching /api/analyze-risk/data');
    fetch('/api/analyze-risk/data')
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(payload => {
            console.log('analyze_risk.js: /api/analyze-risk/data payload', payload);
            if (payload && payload.assets) {
                assetSelect.innerHTML = '<option value="">Select an asset</option>';
                payload.assets.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = a.name + (a.type ? ` (${a.type})` : '');
                    assetSelect.appendChild(opt);
                });

                // Optionally pre-populate vulnerabilities for the first asset
                if (payload.vulnerabilities && payload.vulnerabilities.length > 0) {
                    // do nothing here; vulnerabilities are requested per asset when an asset is selected
                }

            } else {
                throw new Error('No assets in payload');
            }
        }).catch(err => {
            console.warn('Combined endpoint failed, falling back to assets-only endpoint', err);
            // show an unobtrusive message to the user
            const container = document.querySelector('.selection-card');
            if (container && !document.getElementById('asset-load-error')) {
                const errEl = document.createElement('div');
                errEl.id = 'asset-load-error';
                errEl.className = 'alert alert-warning mt-2';
                errEl.textContent = 'Could not load combined asset data, attempting assets-only endpoint.';
                container.insertAdjacentElement('afterend', errEl);
            }

            fetch('/api/analyze-risk/assets')
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then(assets => {
                    console.log('analyze_risk.js: assets-only payload', assets);
                    assetSelect.innerHTML = '<option value="">Select an asset</option>';
                    assets.forEach(a => {
                        const opt = document.createElement('option');
                        opt.value = a.id;
                        opt.textContent = a.name + (a.type ? ` (${a.type})` : '');
                        assetSelect.appendChild(opt);
                    });
                }).catch(err2 => {
                    console.error('Failed to load assets', err2);
                    if (assetSelect) assetSelect.innerHTML = '<option value="">Failed to load assets</option>';
                    const container = document.querySelector('.selection-card');
                    if (container && !document.getElementById('asset-load-fatal')) {
                        const errEl = document.createElement('div');
                        errEl.id = 'asset-load-fatal';
                        errEl.className = 'alert alert-danger mt-2';
                        errEl.textContent = 'Failed to load assets from server. Check your connection or server logs.';
                        container.insertAdjacentElement('afterend', errEl);
                    }
                });
        });

    // When asset changes, load vulnerabilities for that asset
    assetSelect.addEventListener('change', function() {
        const assetId = this.value;
        vulnerabilitySelect.innerHTML = '<option value="">Loading vulnerabilities...</option>';
        if (!assetId) {
            vulnerabilitySelect.innerHTML = '<option value="">Select an asset first</option>';
            return;
        }
        fetch(`/api/analyze-risk/vulnerabilities?asset_id=${assetId}`)
            .then(r => r.json())
            .then(vulns => {
                vulnerabilitySelect.innerHTML = '<option value="">Select a vulnerability</option>';
                vulns.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.id;
                    opt.textContent = v.name + (v.cve_id ? ` (${v.cve_id})` : '');
                    opt.setAttribute('data-asset-id', v.asset_id);
                    opt.setAttribute('data-cvss', v.cvss_score || '');
                    vulnerabilitySelect.appendChild(opt);
                });
            }).catch(err => {
                console.error('Failed to load vulnerabilities', err);
                vulnerabilitySelect.innerHTML = '<option value="">Failed to load vulnerabilities</option>';
            });
    });

    // Calculate and apply values for a selected asset & vulnerability
    async function calculateForAssetVuln(assetId, vulnId) {
        if (!assetId || !vulnId) return;
        const impactEl = document.getElementById('impact-value');
        const severityEl = document.getElementById('severity-value');
        const criticalityEl = document.getElementById('criticality-value');
        const impactDisplayEl = document.getElementById('impact-display');

        try {
            // UI feedback
            analyzeBtn && (analyzeBtn.disabled = true);
            analyzeBtn && (analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...');

            const resp = await fetch(`/api/analyze-risk/calculate?asset_id=${assetId}&vulnerability_id=${vulnId}`);
            const data = await resp.json();
            if (data.error) {
                alert('Error calculating impact: ' + data.error);
                return;
            }

            // Show impact display
            if (impactEl) impactEl.textContent = data.impact_semi || 0;
            if (severityEl) severityEl.textContent = data.severity_value || (data.vulnerability && data.vulnerability.cvss_score) || 0;
            if (criticalityEl) criticalityEl.textContent = data.criticality_value || 0;
            impactDisplayEl && impactDisplayEl.classList.remove('hidden');

            // Prefill impact select if present (use server-calculated semi-impact)
            if (data.impact_semi) {
                impactSelect && (impactSelect.value = String(data.impact_semi));
                // set semi-quant impact display
                const semiImpactEl = document.getElementById('semi-impact-value');
                if (semiImpactEl) semiImpactEl.textContent = String(data.impact_semi);
            }

            // If server provided a default likelihood (ensure numeric)
            if (data.likelihood) {
                const li = parseInt(data.likelihood, 10);
                if (!Number.isNaN(li)) {
                    document.getElementById('likelihood').value = String(li);
                    // set qualitative breakdown
                    document.getElementById('likelihood-breakdown').textContent = li;
                }
            }

            // Use server-provided risk score if available
            const serverRiskScore = (data.risk && data.risk.score) || data.risk_score || null;
            let finalRiskScore = serverRiskScore;
            if (!finalRiskScore) {
                // compute locally if server didn't provide
                const li = parseInt(document.getElementById('likelihood').value, 10) || 0;
                const im = parseInt(document.getElementById('impact').value, 10) || parseInt(data.impact_semi || 0, 10);
                finalRiskScore = li * (im * 3);
            }

            // Update formula display
            document.getElementById('impact-breakdown').textContent = `${data.impact_semi || ''}`;
            document.getElementById('qual-risk-result').textContent = finalRiskScore + (serverRiskScore ? ' (server)' : '');

            // Compute and display BIA if asset value available
            const assetVal = parseFloat(data.asset && data.asset.asset_value_quant) || window.__analyze_asset_value || 0;
            const biaEl = document.getElementById('qual-bia');
            if (assetVal && finalRiskScore) {
                const bia = Number(finalRiskScore) * Number(assetVal);
                if (biaEl) biaEl.textContent = '$' + bia.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
                // store for save
                window.__analyze_bia = bia;
            } else {
                if (biaEl) biaEl.textContent = '-';
                window.__analyze_bia = null;
            }
            // If server provided a default likelihood (ensure numeric)
            if (data.likelihood) {
                const li = parseInt(data.likelihood, 10);
                if (!Number.isNaN(li)) {
                    document.getElementById('likelihood').value = String(li);
                }
            }

            // Update asset-info card
            document.getElementById('asset-name').textContent = data.asset.name;
            document.getElementById('vulnerability-name').textContent = data.vulnerability.name;
            document.getElementById('asset-type').textContent = data.asset.type || '-';
            document.getElementById('criticality-level').textContent = data.asset.criticality_value || '-';
            document.getElementById('asset-owner').textContent = data.asset.owner || '-';
            document.getElementById('cve-id').textContent = data.vulnerability.cve_id || 'N/A';
            document.getElementById('last-updated').textContent = data.vulnerability.updated_at ? new Date(data.vulnerability.updated_at).toLocaleDateString() : '-';

            // set quantitative asset value
            window.__analyze_asset_value = parseFloat(data.asset.asset_value_quant) || 0;

            // Update quantitative UI with guarded listeners (avoid duplicates)
            const exposureFactorSlider = document.getElementById('exposure-factor');
            const aroInput = document.getElementById('aro');
            function updateQuant() {
                const assetValue = window.__analyze_asset_value || 0;
                const exposureFactor = parseFloat(exposureFactorSlider.value) / 100;
                const aro = parseFloat(aroInput.value) || 0;
                const sle = assetValue * exposureFactor;
                const ale = sle * aro;
                document.getElementById('sle-result').textContent = formatCurrency(sle);
                document.getElementById('ale-result').textContent = formatCurrency(ale);
                document.getElementById('ale-final').textContent = formatCurrency(ale);
            }
            if (exposureFactorSlider && !exposureFactorSlider.__analyze_handler_attached) {
                exposureFactorSlider.addEventListener('input', updateQuant);
                exposureFactorSlider.__analyze_handler_attached = true;
            }
            if (aroInput && !aroInput.__analyze_handler_attached) {
                aroInput.addEventListener('input', updateQuant);
                aroInput.__analyze_handler_attached = true;
            }
            updateQuant();

            // Show analysis sections and respect selected standard
            assetInfoCard.classList.remove('hidden');
            modeSelector.classList.remove('hidden');
            // ensure qualitative content visible by default
            document.getElementById('qualitative-content').classList.remove('hidden');

            // If server provided a default likelihood, set it
            if (data.likelihood) {
                document.getElementById('likelihood').value = data.likelihood;
            }

            // Update UI based on current standard (ISO vs NIST)
            const standardSelect = document.getElementById('standard-select');
            if (standardSelect) {
                const standard = standardSelect.value;
                const currentStandardBadge = document.getElementById('current-standard');
                if (currentStandardBadge) currentStandardBadge.textContent = standard === 'nist' ? 'NIST SP 800-30' : 'ISO/IEC 27005';

                if (standard === 'iso') {
                    // ISO - only qualitative
                    modeSelector && modeSelector.classList.add('hidden');
                    // activate qualitative tab
                    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                    const qualTab = document.querySelector('.mode-tab[data-mode="qualitative"]');
                    qualTab && qualTab.classList.add('active');
                    document.getElementById('qualitative-content').classList.remove('hidden');
                    document.getElementById('semi-quantitative-content').classList.add('hidden');
                    document.getElementById('quantitative-content').classList.add('hidden');
                } else {
                    // NIST - show mode selector
                    modeSelector && modeSelector.classList.remove('hidden');
                }
            }

            // Populate qualitative matrix cells (score and category)
            try {
                const matrix = document.getElementById('qual-matrix');
                if (matrix) {
                    const cells = Array.from(matrix.querySelectorAll('.matrix-cell'));
                    cells.forEach(cell => {
                        const li = parseInt(cell.getAttribute('data-likelihood'), 10);
                        const im = parseInt(cell.getAttribute('data-impact'), 10);
                        const score = li * (im * 3);
                        const lvl = scoreToLevel(score);
                        cell.textContent = `${score} (${lvl})`;
                        cell.classList.remove('low','medium','high','critical');
                        cell.classList.add(levelToClass(lvl));
                        // clicking a cell selects that combination
                        cell.addEventListener('click', function(){
                            document.getElementById('likelihood').value = String(li);
                            document.getElementById('impact').value = String(im);
                            updateQualitativeRisk();
                        });
                    });
                }
            } catch (e) { console.warn('Failed to populate qualitative matrix', e); }

            // Trigger recalculation UI updates
            try {
                updateQualitativeRisk();
            } catch (e) {}

            const likelihoodSliderEl = document.getElementById('likelihood-score');
            if (likelihoodSliderEl) {
                likelihoodSliderEl.dispatchEvent(new Event('input'));
            }

        } catch (err) {
            console.error('Error calculating on selection', err);
            alert('Error calculating impact: ' + (err.message || err));
        } finally {
            analyzeBtn && (analyzeBtn.disabled = false);
            analyzeBtn && (analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Risk');
        }
    }

    // Wire vulnerability selection to use the new calculator
    vulnerabilitySelect.addEventListener('change', function() {
        const assetId = assetSelect.value;
        const vulnId = this.value;
        if (!assetId || !vulnId) return;
        calculateForAssetVuln(assetId, vulnId);
    });

    // Ensure analyze button triggers calculation directly
    const analyzeBtnEl = document.getElementById('analyze-btn');
    if (analyzeBtnEl) {
        analyzeBtnEl.addEventListener('click', function() {
            const assetId = assetSelect.value;
            const vulnId = vulnerabilitySelect.value;
            if (!assetId || !vulnId) {
                alert('Please select both an asset and a vulnerability to analyze.');
                return;
            }
            calculateForAssetVuln(assetId, vulnId);
        });
    }

    // Qualitative matrix interactions - compute numeric risk and level using Risk = Likelihood × (Impact × 3)
    function scoreToLevel(score) {
        const s = Number(score);
        if (s >= 45) return 'Critical';
        if (s >= 30) return 'Very High';
        if (s >= 15) return 'High';
        if (s >= 9) return 'Medium';
        return 'Low';
    }

    function levelToClass(level) {
        if (level === 'Critical' || level === 'Very High') return 'critical';
        if (level === 'High') return 'high';
        if (level === 'Medium') return 'medium';
        return 'low';
    }

    function updateQualitativeRisk() {
        const likelihood = parseInt(document.getElementById('likelihood').value, 10);
        const impact = parseInt(document.getElementById('impact').value, 10);
        if (likelihood && impact) {
            matrixCells.forEach(cell => cell.classList.remove('active'));
            const match = Array.from(matrixCells).find(c => c.getAttribute('data-likelihood') === String(likelihood) && c.getAttribute('data-impact') === String(impact));

            const riskScore = likelihood * (impact * 3);
            const level = scoreToLevel(riskScore);

            // Update formula UI
            document.getElementById('likelihood-breakdown').textContent = likelihood;
            document.getElementById('impact-breakdown').textContent = `${impact} (×3 => ${impact*3})`;
            document.getElementById('qual-risk-result').textContent = `${riskScore} (${level})`;

            if (match) {
                match.classList.add('active');
                // Ensure cell has correct class according to computed level
                match.classList.remove('low','medium','high','critical');
                match.classList.add(levelToClass(level));
            }

            riskLevelElement.textContent = `${level}`;
            riskLevelElement.className = 'result-value ' + (level === 'Critical' ? 'level-critical' : level === 'High' ? 'level-high' : level === 'Medium' ? 'level-medium' : 'level-low');
        } else {
            riskLevelElement.textContent = '-';
        }
    }

    const likelihoodEl = document.getElementById('likelihood');
    const impactEl = document.getElementById('impact');
    if (likelihoodEl) likelihoodEl.addEventListener('change', updateQualitativeRisk);
    if (impactEl) impactEl.addEventListener('change', updateQualitativeRisk);

    // Save risk handlers — hook to template button ids
    const saveQualBtn = document.getElementById('save-qual-risk-btn');
    const saveSemiBtn = document.getElementById('save-semi-risk-btn');
    const saveQuantBtn = document.getElementById('save-quant-risk-btn');
    if (saveQualBtn) saveQualBtn.addEventListener('click', function(){ saveRisk('QUALITATIVE'); });
    if (saveSemiBtn) saveSemiBtn.addEventListener('click', function(){ saveRisk('SEMI_QUANTITATIVE'); });
    if (saveQuantBtn) saveQuantBtn.addEventListener('click', function(){ saveRisk('QUANTITATIVE'); });

    // Map numeric 1-5 to textual labels for saving qualitative values
    function numToText(num) {
        return {1:'Very Low',2:'Low',3:'Medium',4:'High',5:'Very High'}[Number(num)] || 'Medium';
    }

    function saveRisk(analysisMode) {
        const assetId = assetSelect.value;
        const vulnerabilityId = vulnerabilitySelect.value;
        if (!assetId || !vulnerabilityId) { alert('Please select asset and vulnerability first'); return; }

        let riskData = { asset_id: parseInt(assetId), vulnerability_id: parseInt(vulnerabilityId), threat_id: 1, title: `Risk: ${document.getElementById('asset-name').textContent} - ${document.getElementById('vulnerability-name').textContent}`, description: '', analysis_mode: analysisMode, response_strategy: 'Mitigate' };

        if (analysisMode === 'QUALITATIVE') {
            const li = parseInt(document.getElementById('likelihood').value, 10);
            const im = parseInt(document.getElementById('impact').value, 10);
            riskData.likelihood_qual = numToText(li);
            riskData.impact_qual = numToText(im);
            riskData.calculated_level = document.getElementById('qualitative-risk-level').textContent;
            // computed numeric score & bia
            const computedScore = li * (im * 3);
            riskData.risk_score = computedScore;
            if (window.__analyze_asset_value) {
                riskData.bia = computedScore * window.__analyze_asset_value;
            }
        } else if (analysisMode === 'SEMI_QUANTITATIVE') {
            // use slider values if present
            const li = parseInt(document.getElementById('likelihood-score').value, 10);
            const im = parseFloat(document.getElementById('semi-impact-value').textContent) || 0;
            riskData.likelihood_semi = li;
            riskData.impact_semi = im;
            riskData.calculated_level = document.getElementById('semi-risk-level').textContent;
            const computedScore = li * (im * 3);
            riskData.risk_score = computedScore;
            if (window.__analyze_asset_value) {
                riskData.bia = computedScore * window.__analyze_asset_value;
            }
        } else if (analysisMode === 'QUANTITATIVE') {
            riskData.asset_value_quant = window.__analyze_asset_value || 0;
            riskData.ef_quant = parseFloat(document.getElementById('exposure-factor').value) / 100;
            riskData.sle_quant = riskData.asset_value_quant * riskData.ef_quant;
            riskData.aro_quant = parseFloat(document.getElementById('aro').value) || 0;
            riskData.ale_quant = riskData.sle_quant * riskData.aro_quant;
            riskData.calculated_level = calculateQuantitativeRiskLevel(riskData.ale_quant);
            // For quantitative, store ale as bia if no other mapping
            riskData.bia = riskData.ale_quant;
        }

        fetch('/api/risks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(riskData)})
            .then(r=>r.json()).then(resp=>{
                if (resp.error) { alert('Error saving: ' + resp.error); return; }
                const alertEl = document.createElement('div'); alertEl.className='alert alert-success'; alertEl.innerHTML = '<i class="fas fa-check-circle"></i> Risk saved';
                document.querySelector('.container').insertBefore(alertEl, document.querySelector('.selection-card'));
                setTimeout(()=>alertEl.remove(), 4000);
            }).catch(err=>{ console.error('Save failed', err); alert('Save failed'); });
    }
    if (saveSemiBtn) saveSemiBtn.addEventListener('click', function(){ saveRisk('SEMI_QUANTITATIVE'); });
    if (saveQuantBtn) saveQuantBtn.addEventListener('click', function(){ saveRisk('QUANTITATIVE'); });

    function saveRisk(analysisMode) {
        const assetId = assetSelect.value;
        const vulnerabilityId = vulnerabilitySelect.value;
        if (!assetId || !vulnerabilityId) { alert('Please select asset and vulnerability first'); return; }

        let riskData = { asset_id: parseInt(assetId), vulnerability_id: parseInt(vulnerabilityId), threat_id: 1, title: `Risk: ${document.getElementById('asset-name').textContent} - ${document.getElementById('vulnerability-name').textContent}`, description: '', analysis_mode: analysisMode, response_strategy: 'Mitigate' };

        if (analysisMode === 'QUALITATIVE') {
            riskData.likelihood_qual = document.getElementById('likelihood').value;
            riskData.impact_qual = document.getElementById('impact').value;
            riskData.calculated_level = document.getElementById('qualitative-risk-level').textContent;
        } else if (analysisMode === 'SEMI_QUANTITATIVE') {
            // use slider values if present
            riskData.likelihood_semi = parseInt(document.getElementById('likelihood-score').value);
            riskData.impact_semi = parseInt(document.getElementById('impact-score').value);
            riskData.calculated_level = document.getElementById('semi-risk-level').textContent;
        } else if (analysisMode === 'QUANTITATIVE') {
            riskData.asset_value_quant = window.__analyze_asset_value || 0;
            riskData.ef_quant = parseFloat(document.getElementById('exposure-factor').value) / 100;
            riskData.sle_quant = riskData.asset_value_quant * riskData.ef_quant;
            riskData.aro_quant = parseFloat(document.getElementById('aro').value) || 0;
            riskData.ale_quant = riskData.sle_quant * riskData.aro_quant;
            riskData.calculated_level = calculateQuantitativeRiskLevel(riskData.ale_quant);
        }

        fetch('/api/risks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(riskData)})
            .then(r=>r.json()).then(resp=>{
                if (resp.error) { alert('Error saving: ' + resp.error); return; }
                const alertEl = document.createElement('div'); alertEl.className='alert alert-success'; alertEl.innerHTML = '<i class="fas fa-check-circle"></i> Risk saved';
                document.querySelector('.container').insertBefore(alertEl, document.querySelector('.selection-card'));
                setTimeout(()=>alertEl.remove(), 4000);
            }).catch(err=>{ console.error('Save failed', err); alert('Save failed'); });
    }

    function calculateQuantitativeRiskLevel(ale) {
        if (ale >= 100000) return 'Very High';
        if (ale >= 50000) return 'High';
        if (ale >= 10000) return 'Medium';
        if (ale >= 1000) return 'Low';
        return 'Very Low';
    }

    function formatCurrency(amount) { return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    // Analyze button: trigger calculation flow (reuses vuln selection handler)
    const analyzeBtnEl = document.getElementById('analyze-btn');
    if (analyzeBtnEl) {
        analyzeBtnEl.addEventListener('click', function() {
            const assetId = assetSelect.value;
            const vulnId = vulnerabilitySelect.value;
            if (!assetId || !vulnId) {
                alert('Please select both an asset and a vulnerability to analyze.');
                return;
            }
            // Trigger the same behavior as selecting the vulnerability
            vulnerabilitySelect.dispatchEvent(new Event('change'));
        });
    }

    // Semi-quantitative slider handler (updates displayed score/level)
    const likelihoodSliderEl = document.getElementById('likelihood-score');
    if (likelihoodSliderEl) {
        const likelihoodValueEl = document.getElementById('likelihood-value');
        const semiRiskScoreEl = document.getElementById('semi-risk-score');
        const semiRiskScoreDisplay = document.getElementById('semi-risk-score-display');
        const semiRiskLevelEl = document.getElementById('semi-risk-level');
        const semiImpactEl = document.getElementById('semi-impact-value');
        likelihoodSliderEl.addEventListener('input', function() {
            const val = parseInt(this.value, 10) || 0;
            if (likelihoodValueEl) likelihoodValueEl.textContent = val;
            const impactScore = parseFloat(semiImpactEl ? semiImpactEl.textContent : 0) || 0;
            // Use formula Risk = Likelihood × (Impact × 3)
            const riskScore = val * (impactScore * 3);
            if (semiRiskScoreEl) semiRiskScoreEl.textContent = riskScore;
            if (semiRiskScoreDisplay) semiRiskScoreDisplay.textContent = riskScore;
            if (semiRiskLevelEl) {
                let rl = 'Very Low';
                if (riskScore >= 45) rl = 'Critical';
                else if (riskScore >= 30) rl = 'Very High';
                else if (riskScore >= 15) rl = 'High';
                else if (riskScore >= 9) rl = 'Medium';
                else rl = 'Low';
                semiRiskLevelEl.textContent = rl;
                semiRiskLevelEl.className = 'result-level ' + (rl === 'Critical' ? 'level-critical' : rl === 'High' ? 'level-high' : rl === 'Medium' ? 'level-medium' : 'level-low');
            }
        });
    }

});