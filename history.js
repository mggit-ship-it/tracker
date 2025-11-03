// Medical-Grade History & Trend Analysis
// Analytics Utility Class
class SymptomAnalytics {
    constructor(logs) {
        this.logs = logs;
    }

    // Calculate basic statistics
    getBasicStats() {
        const totalLogs = this.logs.length;
        const painLevels = this.logs.map(log => log.pain?.level || 0);
        const avgPain = totalLogs > 0 ? (painLevels.reduce((a, b) => a + b, 0) / totalLogs).toFixed(1) : 0;
        const highPainDays = painLevels.filter(level => level >= 7).length;

        // Red flags: blood or fever
        const redFlags = this.logs.filter(log =>
            log.bowelMovements?.blood ||
            log.otherSymptoms?.symptoms?.includes('fever-chills')
        ).length;

        // Pain trend (comparing first half to second half)
        const midpoint = Math.floor(totalLogs / 2);
        let painTrend = '';
        if (totalLogs >= 4) {
            const firstHalfAvg = painLevels.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
            const secondHalfAvg = painLevels.slice(midpoint).reduce((a, b) => a + b, 0) / (totalLogs - midpoint);
            const diff = secondHalfAvg - firstHalfAvg;
            if (diff > 0.5) painTrend = '↑ Worsening';
            else if (diff < -0.5) painTrend = '↓ Improving';
            else painTrend = '→ Stable';
        }

        return { totalLogs, avgPain, highPainDays, redFlags, painTrend };
    }

    // Get pain trend data for chart
    getPainTrendData() {
        const sorted = [...this.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        return {
            labels: sorted.map(log => {
                const date = new Date(log.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            data: sorted.map(log => log.pain?.level || 0),
            dates: sorted.map(log => log.date)
        };
    }

    // Get symptom frequency data
    getSymptomFrequency() {
        const symptoms = {};

        this.logs.forEach(log => {
            // Pain types
            (log.pain?.types || []).forEach(type => {
                symptoms[type] = (symptoms[type] || 0) + 1;
            });

            // Other symptoms
            (log.otherSymptoms?.symptoms || []).forEach(symptom => {
                const formatted = symptom.replace(/-/g, ' ');
                symptoms[formatted] = (symptoms[formatted] || 0) + 1;
            });

            // Bowel issues
            if (log.bowelMovements?.blood) {
                symptoms['Blood in stool'] = (symptoms['Blood in stool'] || 0) + 1;
            }
            if (log.bowelMovements?.mucus) {
                symptoms['Mucus in stool'] = (symptoms['Mucus in stool'] || 0) + 1;
            }
        });

        // Sort by frequency and get top 10
        const sorted = Object.entries(symptoms)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            labels: sorted.map(([symptom]) => symptom),
            data: sorted.map(([, count]) => count)
        };
    }

    // Get pain location heat map data
    getPainLocationData() {
        const locations = [];
        this.logs.forEach(log => {
            if (log.pain?.locations) {
                locations.push(...log.pain.locations);
            }
        });

        // Group by approximate regions
        const regions = this.groupLocationsByRegion(locations);
        return regions;
    }

    groupLocationsByRegion(locations) {
        const regions = {
            'Head/Neck': 0,
            'Upper Abdomen': 0,
            'Lower Abdomen': 0,
            'Left Side': 0,
            'Right Side': 0,
            'Back Upper': 0,
            'Back Lower': 0,
            'Pelvis': 0
        };

        locations.forEach(loc => {
            // Simple region detection based on y-coordinate and view
            if (loc.view === 'front') {
                if (loc.y < 20) regions['Head/Neck']++;
                else if (loc.y < 40) regions['Upper Abdomen']++;
                else if (loc.y < 60) regions['Lower Abdomen']++;
                else regions['Pelvis']++;

                if (loc.x < 40) regions['Left Side']++;
                if (loc.x > 60) regions['Right Side']++;
            } else {
                if (loc.y < 50) regions['Back Upper']++;
                else regions['Back Lower']++;
            }
        });

        return Object.entries(regions)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);
    }

    // Get medication effectiveness data
    getMedicationData() {
        const meds = {};

        this.logs.forEach(log => {
            (log.medications || []).forEach(med => {
                if (med.name) {
                    if (!meds[med.name]) {
                        meds[med.name] = { helpful: 0, notHelpful: 0, worsened: 0, total: 0 };
                    }
                    meds[med.name].total++;
                    if (med.effect === 'helpful') meds[med.name].helpful++;
                    else if (med.effect === 'not-helpful') meds[med.name].notHelpful++;
                    else if (med.effect === 'worsened') meds[med.name].worsened++;
                }
            });
        });

        return meds;
    }

    // Get bowel movement trends
    getBowelTrendData() {
        const sorted = [...this.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        return {
            labels: sorted.map(log => {
                const date = new Date(log.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            counts: sorted.map(log => log.bowelMovements?.count || 0),
            hasBlood: sorted.map(log => log.bowelMovements?.blood ? 1 : 0)
        };
    }

    // Generate pattern insights
    getPatternInsights() {
        const insights = [];

        // Time of day patterns
        const timeOfDayPain = { morning: [], afternoon: [], evening: [] };
        this.logs.forEach(log => {
            const painLevel = log.pain?.level || 0;
            const timeOfDay = log.timeOfDay || 'morning';
            if (timeOfDayPain[timeOfDay]) {
                timeOfDayPain[timeOfDay].push(painLevel);
            }
        });

        const avgByTime = Object.entries(timeOfDayPain).map(([time, levels]) => ({
            time,
            avg: levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0,
            count: levels.length
        })).filter(t => t.count > 0);

        if (avgByTime.length > 0) {
            const highest = avgByTime.reduce((max, curr) => curr.avg > max.avg ? curr : max);
            if (highest.avg > 0) {
                insights.push({
                    icon: 'schedule',
                    text: `Pain tends to be higher in the <strong>${highest.time}</strong> (avg: ${highest.avg.toFixed(1)})`,
                    type: 'info'
                });
            }
        }

        // Food triggers
        const foodPainCorrelation = {};
        this.logs.forEach(log => {
            const painLevel = log.pain?.level || 0;
            (log.eating?.categories || []).forEach(category => {
                if (!foodPainCorrelation[category]) foodPainCorrelation[category] = [];
                foodPainCorrelation[category].push(painLevel);
            });
        });

        const avgPainByFood = Object.entries(foodPainCorrelation).map(([food, levels]) => ({
            food,
            avg: levels.reduce((a, b) => a + b, 0) / levels.length,
            count: levels.length
        })).filter(f => f.count >= 2); // Only include if at least 2 occurrences

        if (avgPainByFood.length > 0) {
            const worst = avgPainByFood.reduce((max, curr) => curr.avg > max.avg ? curr : max);
            const best = avgPainByFood.reduce((min, curr) => curr.avg < min.avg ? curr : min);

            const overallAvg = this.getBasicStats().avgPain;
            if (worst.avg > parseFloat(overallAvg) + 1) {
                insights.push({
                    icon: 'warning',
                    text: `Higher pain levels associated with <strong>${worst.food}</strong> (avg: ${worst.avg.toFixed(1)})`,
                    type: 'warning'
                });
            }
            if (best.avg < parseFloat(overallAvg) - 1 && best.avg < 4) {
                insights.push({
                    icon: 'check_circle',
                    text: `Lower pain levels when eating <strong>${best.food}</strong> (avg: ${best.avg.toFixed(1)})`,
                    type: 'success'
                });
            }
        }

        // Medication patterns
        const medData = this.getMedicationData();
        Object.entries(medData).forEach(([med, stats]) => {
            if (stats.total >= 2) {
                const helpfulRate = (stats.helpful / stats.total * 100).toFixed(0);
                if (stats.helpful > stats.notHelpful + stats.worsened) {
                    insights.push({
                        icon: 'medication',
                        text: `<strong>${med}</strong> appears helpful (${helpfulRate}% of uses)`,
                        type: 'success'
                    });
                } else if (stats.worsened > 0) {
                    insights.push({
                        icon: 'warning',
                        text: `<strong>${med}</strong> may worsen symptoms in some cases`,
                        type: 'warning'
                    });
                }
            }
        });

        // Bowel movement patterns
        const bloodLogs = this.logs.filter(log => log.bowelMovements?.blood);
        if (bloodLogs.length > 0) {
            insights.push({
                icon: 'emergency',
                text: `<strong>Blood present in ${bloodLogs.length} log(s)</strong> - Important to discuss with doctor`,
                type: 'error'
            });
        }

        // Red flag count
        const feverLogs = this.logs.filter(log =>
            log.otherSymptoms?.symptoms?.includes('fever-chills')
        );
        if (feverLogs.length > 0) {
            insights.push({
                icon: 'emergency',
                text: `<strong>Fever/chills reported in ${feverLogs.length} log(s)</strong> - Requires medical attention`,
                type: 'error'
            });
        }

        return insights;
    }
}

// Main History Viewer with Trend Analysis
class HistoryViewer {
    constructor() {
        this.allLogs = [];
        this.filteredLogs = [];
        this.charts = {};
        this.analytics = null;
        this.init();
    }

    async init() {
        console.log('[History] Initializing medical-grade history viewer...');

        try {
            await StorageService.init();
            console.log('[History] StorageService initialized');

            if (!StorageService.isAuthenticated()) {
                console.error('[History] User not authenticated, redirecting to auth page');
                window.location.href = 'auth.html';
                return;
            }

            await this.loadLogs();
            this.bindEventListeners();
            this.renderAnalytics();
            this.hideLoadingState();
            console.log('[History] History viewer initialized with trend analysis');
        } catch (error) {
            console.error('[History] Error initializing history viewer:', error);
            this.showErrorState(error.message || 'Failed to load logs. Please try again.');
        }
    }

    async loadLogs() {
        console.log('[History] Loading all logs...');
        try {
            this.allLogs = await StorageService.getLogsSorted();
            this.filteredLogs = this.allLogs;
            this.analytics = new SymptomAnalytics(this.filteredLogs);
            console.log(`[History] Loaded ${this.allLogs.length} logs for analysis`);
        } catch (error) {
            console.error('[History] Error loading logs:', error);
            throw error;
        }
    }

    hideLoadingState() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.classList.add('hidden');
    }

    showErrorState(message) {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const errorMessage = document.getElementById('error-message');

        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) errorState.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = message;
    }

    bindEventListeners() {
        // Back button
        document.getElementById('back-btn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                StorageService.logout();
                window.location.href = 'auth.html';
            }
        });

        // Print report button
        document.getElementById('print-report-btn')?.addEventListener('click', () => {
            window.print();
        });

        // Export button
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.showExportModal();
        });

        // Date preset buttons
        document.querySelectorAll('.date-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyDatePreset(btn.dataset.days);
                // Update button styles
                document.querySelectorAll('.date-preset-btn').forEach(b => {
                    b.classList.remove('bg-primary/20', 'text-primary');
                    b.classList.add('border', 'border-border-light', 'dark:border-border-dark', 'text-text-light-secondary', 'dark:text-text-dark-secondary');
                });
                btn.classList.add('bg-primary/20', 'text-primary');
                btn.classList.remove('border', 'border-border-light', 'dark:border-border-dark', 'text-text-light-secondary', 'dark:text-text-dark-secondary');
            });
        });

        // Filter buttons
        document.getElementById('filter-apply-btn')?.addEventListener('click', () => {
            this.applyFilter();
        });

        document.getElementById('filter-clear-btn')?.addEventListener('click', () => {
            this.clearFilter();
        });

        // Toggle logs view
        document.getElementById('toggle-logs-btn')?.addEventListener('click', () => {
            const container = document.getElementById('logs-container');
            const text = document.getElementById('toggle-logs-text');
            const icon = document.getElementById('toggle-logs-icon');

            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                text.textContent = 'Hide';
                icon.textContent = 'expand_less';
                this.renderLogs();
            } else {
                container.classList.add('hidden');
                text.textContent = 'Show All';
                icon.textContent = 'expand_more';
            }
        });

        // Export modal buttons
        document.getElementById('export-cancel-btn')?.addEventListener('click', () => {
            this.hideExportModal();
        });

        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            this.exportAsPDF();
        });

        document.getElementById('export-json-btn')?.addEventListener('click', () => {
            this.exportAsJSON();
        });

        document.getElementById('export-csv-btn')?.addEventListener('click', () => {
            this.exportAsCSV();
        });

        // Close modal on background click
        document.getElementById('export-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'export-modal') {
                this.hideExportModal();
            }
        });
    }

    applyDatePreset(days) {
        if (days === 'all') {
            this.filteredLogs = this.allLogs;
        } else {
            const daysNum = parseInt(days);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysNum);
            const cutoffStr = cutoffDate.toISOString().split('T')[0];

            this.filteredLogs = this.allLogs.filter(log => log.date >= cutoffStr);
        }

        this.analytics = new SymptomAnalytics(this.filteredLogs);
        this.renderAnalytics();
    }

    async applyFilter() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;

        if (startDate && endDate) {
            this.filteredLogs = await StorageService.getLogsByDateRange(startDate, endDate);
        } else if (startDate) {
            this.filteredLogs = this.allLogs.filter(log => log.date >= startDate);
        } else if (endDate) {
            this.filteredLogs = this.allLogs.filter(log => log.date <= endDate);
        } else {
            this.filteredLogs = this.allLogs;
        }

        this.analytics = new SymptomAnalytics(this.filteredLogs);
        this.renderAnalytics();
    }

    clearFilter() {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        this.filteredLogs = this.allLogs;
        this.analytics = new SymptomAnalytics(this.filteredLogs);
        this.renderAnalytics();

        // Reset preset buttons
        document.querySelectorAll('.date-preset-btn').forEach((b, i) => {
            if (i === 0) {
                b.classList.add('bg-primary/20', 'text-primary');
                b.classList.remove('border', 'text-text-light-secondary', 'dark:text-text-dark-secondary');
            } else {
                b.classList.remove('bg-primary/20', 'text-primary');
                b.classList.add('border', 'border-border-light', 'dark:border-border-dark', 'text-text-light-secondary', 'dark:text-text-dark-secondary');
            }
        });
    }

    renderAnalytics() {
        if (this.filteredLogs.length === 0) {
            document.getElementById('empty-state')?.classList.remove('hidden');
            return;
        }

        document.getElementById('empty-state')?.classList.add('hidden');

        // Update basic stats
        const stats = this.analytics.getBasicStats();
        document.getElementById('total-logs').textContent = stats.totalLogs;
        document.getElementById('avg-pain').textContent = stats.avgPain;
        document.getElementById('pain-trend').textContent = stats.painTrend;
        document.getElementById('high-pain-days').textContent = stats.highPainDays;
        document.getElementById('red-flag-count').textContent = stats.redFlags;

        // Render all charts
        this.renderPainTrendChart();
        this.renderSymptomFrequencyChart();
        this.renderPainLocationHeatMap();
        this.renderMedicationChart();
        this.renderBowelTrendChart();
        this.renderPatternInsights();
    }

    renderPainTrendChart() {
        const ctx = document.getElementById('pain-trend-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.painTrend) {
            this.charts.painTrend.destroy();
        }

        const trendData = this.analytics.getPainTrendData();

        this.charts.painTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Pain Level',
                    data: trendData.data,
                    borderColor: '#84C7C3',
                    backgroundColor: 'rgba(132, 199, 195, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: trendData.data.map(level => {
                        if (level >= 7) return '#ef4444';
                        if (level >= 4) return '#f59e0b';
                        return '#84C7C3';
                    }),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => trendData.labels[items[0].dataIndex],
                            label: (item) => `Pain Level: ${item.parsed.y}/10`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { stepSize: 2, color: '#A0A0A0' },
                        grid: { color: 'rgba(160, 160, 160, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#A0A0A0', maxRotation: 45, minRotation: 45 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderSymptomFrequencyChart() {
        const ctx = document.getElementById('symptom-frequency-chart');
        if (!ctx) return;

        if (this.charts.symptomFreq) {
            this.charts.symptomFreq.destroy();
        }

        const freqData = this.analytics.getSymptomFrequency();

        this.charts.symptomFreq = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: freqData.labels,
                datasets: [{
                    label: 'Occurrences',
                    data: freqData.data,
                    backgroundColor: '#84C7C3',
                    borderColor: '#84C7C3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => `${item.parsed.x} occurrence(s)`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#A0A0A0', stepSize: 1 },
                        grid: { color: 'rgba(160, 160, 160, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#A0A0A0', font: { size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderPainLocationHeatMap() {
        const container = document.getElementById('pain-location-heatmap');
        const listContainer = document.getElementById('pain-location-list');

        if (!container || !listContainer) return;

        const locationData = this.analytics.getPainLocationData();

        // Get all pain locations from filtered logs
        const allLocations = [];
        this.filteredLogs.forEach(log => {
            if (log.pain?.locations) {
                allLocations.push(...log.pain.locations);
            }
        });

        // Render body diagrams with heat map overlay
        container.innerHTML = `
            <div class="text-center w-full">
                <p class="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-4">Pain Point Distribution</p>
                <div class="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div class="relative">
                        <canvas id="front-heatmap-canvas" width="300" height="450" class="w-full h-auto mx-auto"></canvas>
                        <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">Front</p>
                    </div>
                    <div class="relative">
                        <canvas id="back-heatmap-canvas" width="300" height="450" class="w-full h-auto mx-auto"></canvas>
                        <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">Back</p>
                    </div>
                </div>
            </div>
        `;

        // Draw heat maps on canvas
        setTimeout(() => {
            this.drawHeatMap('front-heatmap-canvas', 'front.png', allLocations.filter(loc => loc.view === 'front'));
            this.drawHeatMap('back-heatmap-canvas', 'back.png', allLocations.filter(loc => loc.view === 'back'));
        }, 0);

        // Render frequency list
        if (locationData.length === 0) {
            listContainer.innerHTML = '<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center">No pain locations recorded</p>';
        } else {
            listContainer.innerHTML = locationData.map(([region, count]) => {
                const percentage = ((count / this.filteredLogs.length) * 100).toFixed(0);
                return `
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-text-light-primary dark:text-text-dark-primary">${region}</span>
                        <div class="flex items-center gap-2">
                            <div class="w-24 h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                                <div class="h-full bg-primary" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <span class="text-xs text-text-light-secondary dark:text-text-dark-secondary w-12 text-right">${count}x</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    drawHeatMap(canvasId, imageSrc, painPoints) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw body image
            ctx.globalAlpha = 0.4;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;

            // Create heat map
            if (painPoints.length === 0) return;

            // Group nearby points to create intensity map
            const heatRadius = 50; // pixels
            const intensityMap = new Map();

            // Calculate intensity at each pain point
            painPoints.forEach(point => {
                const x = (point.x / 100) * canvas.width;
                const y = (point.y / 100) * canvas.height;
                const key = `${Math.round(x / heatRadius)}_${Math.round(y / heatRadius)}`;
                intensityMap.set(key, (intensityMap.get(key) || 0) + 1);
            });

            // Find max intensity for normalization
            const maxIntensity = Math.max(...intensityMap.values());

            // Draw heat map gradients
            painPoints.forEach(point => {
                const x = (point.x / 100) * canvas.width;
                const y = (point.y / 100) * canvas.height;
                const key = `${Math.round(x / heatRadius)}_${Math.round(y / heatRadius)}`;
                const intensity = intensityMap.get(key) / maxIntensity;

                // Create radial gradient
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, heatRadius);

                // Color scale from yellow to red based on intensity
                const alpha = 0.3 + (intensity * 0.5);
                if (intensity < 0.33) {
                    gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`); // Yellow
                    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
                } else if (intensity < 0.66) {
                    gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`); // Orange
                    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
                } else {
                    gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`); // Red
                    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
        };

        img.src = imageSrc;
    }

    renderMedicationChart() {
        const ctx = document.getElementById('medication-chart');
        if (!ctx) return;

        if (this.charts.medication) {
            this.charts.medication.destroy();
        }

        const medData = this.analytics.getMedicationData();
        const meds = Object.entries(medData).filter(([, stats]) => stats.total >= 1);

        if (meds.length === 0) {
            ctx.parentElement.innerHTML = '<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center py-8">No medication data recorded</p>';
            return;
        }

        this.charts.medication = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meds.map(([name]) => name),
                datasets: [
                    {
                        label: 'Helpful',
                        data: meds.map(([, stats]) => stats.helpful),
                        backgroundColor: '#10b981',
                    },
                    {
                        label: 'Not Helpful',
                        data: meds.map(([, stats]) => stats.notHelpful),
                        backgroundColor: '#f59e0b',
                    },
                    {
                        label: 'Worsened',
                        data: meds.map(([, stats]) => stats.worsened),
                        backgroundColor: '#ef4444',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#A0A0A0' } }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: '#A0A0A0' },
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { color: '#A0A0A0', stepSize: 1 },
                        grid: { color: 'rgba(160, 160, 160, 0.1)' }
                    }
                }
            }
        });
    }

    renderBowelTrendChart() {
        const ctx = document.getElementById('bowel-trend-chart');
        if (!ctx) return;

        if (this.charts.bowelTrend) {
            this.charts.bowelTrend.destroy();
        }

        const bowelData = this.analytics.getBowelTrendData();

        this.charts.bowelTrend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bowelData.labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'Blood Present',
                        data: bowelData.hasBlood,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#ef4444'
                    },
                    {
                        type: 'bar',
                        label: 'BM Count',
                        data: bowelData.counts,
                        backgroundColor: '#84C7C3',
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#A0A0A0' } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        ticks: { color: '#A0A0A0', stepSize: 1 },
                        grid: { color: 'rgba(160, 160, 160, 0.1)' },
                        title: { display: true, text: 'Count', color: '#A0A0A0' }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        max: 1,
                        ticks: { color: '#A0A0A0', stepSize: 1 },
                        grid: { display: false },
                        title: { display: true, text: 'Blood (0=No, 1=Yes)', color: '#A0A0A0' }
                    },
                    x: {
                        ticks: { color: '#A0A0A0', maxRotation: 45, minRotation: 45 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderPatternInsights() {
        const container = document.getElementById('pattern-insights');
        if (!container) return;

        const insights = this.analytics.getPatternInsights();

        if (insights.length === 0) {
            container.innerHTML = '<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center py-4">Not enough data yet to identify patterns. Keep logging!</p>';
            return;
        }

        const typeColors = {
            success: 'bg-green-500/20 text-green-600 dark:text-green-400',
            warning: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
            error: 'bg-red-500/20 text-red-600 dark:text-red-400',
            info: 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
        };

        container.innerHTML = insights.map(insight => `
            <div class="flex items-start gap-3 p-3 rounded-lg ${typeColors[insight.type] || typeColors.info}">
                <span class="material-symbols-outlined text-xl mt-0.5">${insight.icon}</span>
                <p class="text-sm flex-1">${insight.text}</p>
            </div>
        `).join('');
    }

    renderLogs() {
        const container = document.getElementById('logs-container');
        if (!container) return;

        if (this.filteredLogs.length === 0) {
            container.innerHTML = '<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center py-8">No logs found for this date range</p>';
            return;
        }

        container.innerHTML = '';
        this.filteredLogs.forEach(log => {
            const logCard = this.createLogCard(log);
            container.appendChild(logCard);
        });
    }

    createLogCard(log) {
        const card = document.createElement('div');
        card.className = 'rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm hover:shadow-md transition-shadow';

        const date = new Date(log.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const painLevel = log.pain?.level || 0;
        const painTypes = log.pain?.types || [];
        const painSummary = painTypes.length > 0 ? painTypes.slice(0, 2).join(', ') : 'No pain type';

        // Build additional info sections
        const sections = [];

        // Bowel movements
        if (log.bowelMovements?.count > 0) {
            const bmInfo = [`${log.bowelMovements.count} BM(s)`];
            if (log.bowelMovements.blood) bmInfo.push('Blood present');
            sections.push(`<span class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">💩 ${bmInfo.join(', ')}</span>`);
        }

        // Eating
        if (log.eating?.meals || log.eating?.categories?.length > 0) {
            const eatInfo = [];
            if (log.eating.meals) eatInfo.push(log.eating.meals);
            if (log.eating.categories?.length > 0) eatInfo.push(log.eating.categories.slice(0, 2).join(', '));
            sections.push(`<span class="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400">🍽️ ${eatInfo.join(' - ')}</span>`);
        }

        // Medications
        if (log.medications?.length > 0) {
            sections.push(`<span class="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">💊 ${log.medications.length} med(s)</span>`);
        }

        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1 cursor-pointer" data-action="view">
                    <p class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">${formattedDate}</p>
                    <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">${log.timeOfDay || 'N/A'}</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-12 h-12 rounded-full ${this.getPainLevelColor(painLevel)} font-bold">
                        ${painLevel}
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-log-btn text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-all" data-id="${log.id}" title="Edit">
                            <span class="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button class="delete-log-btn text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500 transition-all" data-id="${log.id}" title="Delete">
                            <span class="material-symbols-outlined text-xl">delete</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="cursor-pointer space-y-2" data-action="view">
                <p class="text-sm text-text-light-primary dark:text-text-dark-primary">${painSummary}</p>
                ${sections.length > 0 ? `<div class="flex flex-wrap gap-2">${sections.join('')}</div>` : ''}
                ${log.notes ? `<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary italic line-clamp-2">"${log.notes}"</p>` : ''}
            </div>
        `;

        // Add click handler for view (clicking on content area)
        card.querySelectorAll('[data-action="view"]').forEach(el => {
            el.addEventListener('click', () => {
                this.viewLogDetails(log);
            });
        });

        // Add click handler for edit button
        const editBtn = card.querySelector('.edit-log-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editLog(log.id);
        });

        // Add click handler for delete button
        const deleteBtn = card.querySelector('.delete-log-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteLog(log.id);
        });

        return card;
    }

    getPainLevelColor(level) {
        if (level === 0) return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
        if (level <= 3) return 'bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300';
        if (level <= 6) return 'bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
        return 'bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300';
    }

    editLog(id) {
        // Redirect to main tracker in edit mode
        window.location.href = `index.html?edit=${id}`;
    }

    async deleteLog(id) {
        if (!confirm('Are you sure you want to delete this log? This cannot be undone.')) {
            return;
        }

        try {
            await StorageService.deleteLog(id);

            // Reload logs and refresh analytics
            await this.loadLogs();
            this.renderAnalytics();

            // If logs are currently shown, re-render them
            const container = document.getElementById('logs-container');
            if (!container.classList.contains('hidden')) {
                this.renderLogs();
            }

            console.log(`[History] Successfully deleted log ${id}`);
        } catch (error) {
            console.error('[History] Error deleting log:', error);
            alert('Failed to delete log. Please try again.');
        }
    }

    viewLogDetails(log) {
        // Redirect to main tracker in view/edit mode
        window.location.href = `index.html?edit=${log.id}`;
    }

    showExportModal() {
        document.getElementById('export-modal')?.classList.remove('hidden');
    }

    hideExportModal() {
        document.getElementById('export-modal')?.classList.add('hidden');
    }

    exportAsPDF() {
        alert('PDF export functionality requires jsPDF library to be properly loaded. For now, use Print Report button to print this page.');
        this.hideExportModal();
    }

    async exportAsJSON() {
        const url = await StorageService.exportAsJSON();
        const a = document.createElement('a');
        a.href = url;
        a.download = `symptom-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.hideExportModal();
    }

    async exportAsCSV() {
        const url = await StorageService.exportAsCSV();
        if (!url) {
            alert('No logs to export');
            return;
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = `symptom-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.hideExportModal();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.historyViewer = new HistoryViewer();
});
