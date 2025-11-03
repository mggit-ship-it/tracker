// History Page Logic
class HistoryViewer {
    constructor() {
        this.allLogs = [];
        this.filteredLogs = [];
        this.init();
    }

    async init() {
        StorageService.init();
        await this.loadLogs();
        this.bindEventListeners();
        this.renderLogs();
        this.updateStats();
    }

    async loadLogs() {
        this.allLogs = await StorageService.getLogsSorted();
        this.filteredLogs = this.allLogs;
    }

    bindEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                StorageService.logout();
                window.location.href = 'auth.html';
            }
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Filter buttons
        document.getElementById('filter-apply-btn').addEventListener('click', () => {
            this.applyFilter();
        });

        document.getElementById('filter-clear-btn').addEventListener('click', () => {
            this.clearFilter();
        });

        // Export modal
        document.getElementById('export-cancel-btn').addEventListener('click', () => {
            this.hideExportModal();
        });

        document.getElementById('export-json-btn').addEventListener('click', () => {
            this.exportAsJSON();
        });

        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportAsCSV();
        });

        // Close modal on background click
        document.getElementById('export-modal').addEventListener('click', (e) => {
            if (e.target.id === 'export-modal') {
                this.hideExportModal();
            }
        });
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

        this.renderLogs();
        this.updateStats();
    }

    clearFilter() {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        this.filteredLogs = this.allLogs;
        this.renderLogs();
        this.updateStats();
    }

    renderLogs() {
        const container = document.getElementById('logs-container');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredLogs.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = '';

        this.filteredLogs.forEach(log => {
            const logCard = this.createLogCard(log);
            container.appendChild(logCard);
        });
    }

    createLogCard(log) {
        const card = document.createElement('div');
        card.className = 'rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow';

        // Format date and time
        const date = new Date(`${log.date}T${log.time}`);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        // Get pain summary
        const painLevel = log.pain?.level || 0;
        const painTypes = log.pain?.types || [];
        const painSummary = painTypes.length > 0
            ? painTypes.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
            : 'No pain type specified';

        // Count pain points
        const painPointsCount = log.pain?.locations?.length || 0;

        // Count medications
        const medsCount = log.medications?.length || 0;

        // Check for important symptoms
        const hasBlood = log.bowelMovements?.blood;
        const hasFever = log.otherSymptoms?.symptoms?.includes('fever-chills');
        const alerts = [];
        if (hasBlood) alerts.push('Blood present');
        if (hasFever) alerts.push('Fever/chills');

        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">${formattedDate}</p>
                    <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">${formattedTime} • ${log.timeOfDay || 'N/A'}</p>
                </div>
                <div class="flex gap-2">
                    <button class="text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-all edit-log-btn" data-id="${log.id}" title="Edit">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button class="text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500 transition-all delete-log-btn" data-id="${log.id}" title="Delete">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </div>

            <div class="space-y-2">
                <!-- Pain Level -->
                <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center w-12 h-12 rounded-full ${this.getPainLevelColor(painLevel)} font-bold">
                        ${painLevel}
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">${painSummary}</p>
                        <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">${painPointsCount} pain point${painPointsCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="flex gap-2 flex-wrap">
                    ${log.bowelMovements?.count > 0 ? `
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs">
                            <span class="material-symbols-outlined text-sm">self_improvement</span>
                            ${log.bowelMovements.count} BM
                        </span>
                    ` : ''}
                    ${medsCount > 0 ? `
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs">
                            <span class="material-symbols-outlined text-sm">medication</span>
                            ${medsCount} med${medsCount !== 1 ? 's' : ''}
                        </span>
                    ` : ''}
                    ${alerts.length > 0 ? `
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-xs">
                            <span class="material-symbols-outlined text-sm">warning</span>
                            ${alerts[0]}
                        </span>
                    ` : ''}
                </div>

                ${log.notes ? `
                    <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary line-clamp-2 mt-2 italic">
                        "${log.notes}"
                    </p>
                ` : ''}
            </div>
        `;

        // Bind event listeners
        const editBtn = card.querySelector('.edit-log-btn');
        const deleteBtn = card.querySelector('.delete-log-btn');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editLog(log.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteLog(log.id);
        });

        card.addEventListener('click', () => {
            this.viewLogDetails(log);
        });

        return card;
    }

    getPainLevelColor(level) {
        if (level === 0) return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
        if (level <= 3) return 'bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300';
        if (level <= 6) return 'bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
        return 'bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300';
    }

    updateStats() {
        const totalLogs = this.filteredLogs.length;
        document.getElementById('total-logs').textContent = totalLogs;

        if (totalLogs > 0) {
            const totalPain = this.filteredLogs.reduce((sum, log) => sum + (log.pain?.level || 0), 0);
            const avgPain = (totalPain / totalLogs).toFixed(1);
            document.getElementById('avg-pain').textContent = avgPain;
        } else {
            document.getElementById('avg-pain').textContent = '0';
        }
    }

    editLog(id) {
        window.location.href = `index.html?edit=${id}`;
    }

    async deleteLog(id) {
        if (confirm('Are you sure you want to delete this log? This cannot be undone.')) {
            await StorageService.deleteLog(id);
            await this.loadLogs();
            this.renderLogs();
            this.updateStats();
        }
    }

    viewLogDetails(log) {
        // Create and show detailed view modal
        const modal = this.createDetailModal(log);
        document.body.appendChild(modal);
    }

    createDetailModal(log) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto';
        modal.id = 'detail-modal';

        const date = new Date(`${log.date}T${log.time}`);
        const formattedDateTime = date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        modal.innerHTML = `
            <div class="bg-card-light dark:bg-card-dark rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Log Details</h2>
                        <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">${formattedDateTime}</p>
                    </div>
                    <button class="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary" id="close-detail-modal">
                        <span class="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                <div class="space-y-6">
                    <!-- Pain Section -->
                    <div class="border-b border-border-light dark:border-border-dark pb-4">
                        <h3 class="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">local_fire_department</span>
                            Pain
                        </h3>
                        <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                            <span class="font-medium">Level:</span> ${log.pain?.level || 0}/10
                        </p>
                        ${log.pain?.types?.length > 0 ? `
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                <span class="font-medium">Types:</span> ${log.pain.types.join(', ')}
                            </p>
                        ` : ''}
                        ${log.pain?.description ? `
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                <span class="font-medium">Description:</span> ${log.pain.description}
                            </p>
                        ` : ''}
                        ${log.pain?.triggers?.length > 0 ? `
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                <span class="font-medium">Triggers:</span> ${log.pain.triggers.join(', ')}
                            </p>
                        ` : ''}
                        ${log.pain?.relief?.length > 0 ? `
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                <span class="font-medium">Relief:</span> ${log.pain.relief.join(', ')}
                            </p>
                        ` : ''}
                        ${log.pain?.locations?.length > 0 ? `
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                <span class="font-medium">Pain points:</span> ${log.pain.locations.length} location(s)
                            </p>
                        ` : ''}
                    </div>

                    <!-- Bowel Movements -->
                    ${log.bowelMovements?.count > 0 ? `
                        <div class="border-b border-border-light dark:border-border-dark pb-4">
                            <h3 class="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">self_improvement</span>
                                Bowel Movements
                            </h3>
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                <span class="font-medium">Count:</span> ${log.bowelMovements.count}
                            </p>
                            ${log.bowelMovements.consistency ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                    <span class="font-medium">Bristol Scale:</span> ${log.bowelMovements.consistency}
                                </p>
                            ` : ''}
                            ${log.bowelMovements.color ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                    <span class="font-medium">Color:</span> ${log.bowelMovements.color}
                                </p>
                            ` : ''}
                            <div class="flex gap-3 text-sm">
                                ${log.bowelMovements.mucus ? '<span class="text-yellow-600 dark:text-yellow-400">Mucus present</span>' : ''}
                                ${log.bowelMovements.blood ? '<span class="text-red-600 dark:text-red-400">Blood present</span>' : ''}
                                ${log.bowelMovements.painful ? '<span class="text-orange-600 dark:text-orange-400">Painful</span>' : ''}
                            </div>
                            ${log.bowelMovements.gasPassage ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-2">
                                    <span class="font-medium">Gas passage:</span> ${log.bowelMovements.gasPassage}
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}

                    <!-- Eating & Drinking -->
                    ${(log.eating?.meals || log.eating?.fluids) ? `
                        <div class="border-b border-border-light dark:border-border-dark pb-4">
                            <h3 class="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">restaurant</span>
                                Eating & Drinking
                            </h3>
                            ${log.eating.meals ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                    <span class="font-medium">Meals:</span> ${log.eating.meals}
                                </p>
                            ` : ''}
                            ${log.eating.categories?.length > 0 ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                    <span class="font-medium">Categories:</span> ${log.eating.categories.join(', ')}
                                </p>
                            ` : ''}
                            ${log.eating.fluids ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                                    <span class="font-medium">Fluids:</span> ${log.eating.fluids}
                                </p>
                            ` : ''}
                            ${log.eating.symptoms?.length > 0 ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                    <span class="font-medium">Symptoms:</span> ${log.eating.symptoms.join(', ')}
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}

                    <!-- Other Symptoms -->
                    ${log.otherSymptoms?.symptoms?.length > 0 ? `
                        <div class="border-b border-border-light dark:border-border-dark pb-4">
                            <h3 class="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">sentiment_stressed</span>
                                Other Symptoms
                            </h3>
                            <ul class="list-disc list-inside text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1">
                                ${log.otherSymptoms.symptoms.map(s => `<li>${s.replace(/-/g, ' ')}</li>`).join('')}
                            </ul>
                            ${log.otherSymptoms.urinaryDetails ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-2">
                                    <span class="font-medium">Urinary details:</span> ${log.otherSymptoms.urinaryDetails}
                                </p>
                            ` : ''}
                            ${log.otherSymptoms.gynecologicDetails ? `
                                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-2">
                                    <span class="font-medium">Gynecologic details:</span> ${log.otherSymptoms.gynecologicDetails}
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}

                    <!-- Medications -->
                    ${log.medications?.length > 0 ? `
                        <div class="border-b border-border-light dark:border-border-dark pb-4">
                            <h3 class="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">medication</span>
                                Medications
                            </h3>
                            <div class="space-y-2">
                                ${log.medications.map(med => `
                                    <div class="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                        <span class="font-medium">${med.name}</span>
                                        ${med.dose ? ` - ${med.dose}` : ''}
                                        ${med.time ? ` at ${med.time}` : ''}
                                        ${med.effect ? ` (${med.effect})` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Notes -->
                    ${log.notes ? `
                        <div>
                            <h3 class="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">edit_note</span>
                                Notes
                            </h3>
                            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap">${log.notes}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="flex gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                    <button class="flex-1 h-10 rounded-md bg-primary text-background-dark font-medium hover:bg-primary/90 transition-all" onclick="window.location.href='index.html?edit=${log.id}'">
                        Edit
                    </button>
                    <button class="flex-1 h-10 rounded-md border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:border-primary hover:text-primary transition-all" id="close-detail-modal-btn">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Bind close buttons
        modal.querySelector('#close-detail-modal').addEventListener('click', () => {
            modal.remove();
        });
        modal.querySelector('#close-detail-modal-btn').addEventListener('click', () => {
            modal.remove();
        });
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'detail-modal') {
                modal.remove();
            }
        });

        return modal;
    }

    showExportModal() {
        document.getElementById('export-modal').classList.remove('hidden');
    }

    hideExportModal() {
        document.getElementById('export-modal').classList.add('hidden');
    }

    async exportAsJSON() {
        const url = await StorageService.exportAsJSON();
        const a = document.createElement('a');
        a.href = url;
        a.download = `symptom-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.hideExportModal();
        alert('Logs exported as JSON successfully!');
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
        alert('Logs exported as CSV successfully!');
    }
}

// Initialize history viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.historyViewer = new HistoryViewer();
});
