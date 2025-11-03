// Main Application Logic
class SymptomTracker {
    constructor() {
        this.currentLog = null;
        this.editingLogId = null;
        this.painPoints = [];
        this.currentBodyView = 'front';
        this.medications = [];
        this.unsavedChanges = false;
        this.autoSaveTimeout = null;

        this.init();
    }

    init() {
        // Initialize storage
        StorageService.init();

        // Set default date and time
        this.setDefaultDateTime();

        // Bind event listeners
        this.bindEventListeners();

        // Check if editing existing log
        this.checkForEditMode();

        // Start auto-save
        this.startAutoSave();
    }

    setDefaultDateTime() {
        const now = new Date();
        const dateInput = document.getElementById('log-date');

        // Format date as YYYY-MM-DD
        dateInput.value = now.toISOString().split('T')[0];

        // Determine time of day
        const hour = now.getHours();
        let timeOfDay = 'morning';
        if (hour >= 12 && hour < 17) {
            timeOfDay = 'afternoon';
        } else if (hour >= 17) {
            timeOfDay = 'evening';
        }
        this.selectTimeOfDay(timeOfDay);

        // Update display
        this.updateDateTimeDisplay();
    }

    selectTimeOfDay(value) {
        document.querySelectorAll('.time-of-day-btn').forEach(btn => {
            if (btn.dataset.value === value) {
                btn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
            } else {
                btn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');
            }
        });
    }

    updateDateTimeDisplay() {
        const dateInput = document.getElementById('log-date');
        const display = document.getElementById('datetime-display');
        const selectedTimeOfDay = this.getSelectedTimeOfDay();

        if (dateInput.value) {
            const date = new Date(dateInput.value);
            const options = { month: 'short', day: 'numeric' };
            const dateStr = date.toLocaleDateString('en-US', options);
            const timeOfDayStr = selectedTimeOfDay.charAt(0).toUpperCase() + selectedTimeOfDay.slice(1);
            display.textContent = `${dateStr}, ${timeOfDayStr}`;
        }
    }

    bindEventListeners() {
        // Date & Time
        document.getElementById('log-date').addEventListener('change', () => {
            this.updateDateTimeDisplay();
            this.markUnsavedChanges();
        });
        document.querySelectorAll('.time-of-day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTimeOfDay(btn.dataset.value);
                this.updateDateTimeDisplay();
                this.markUnsavedChanges();
            });
        });

        // Body diagram
        document.getElementById('body-diagram-container').addEventListener('click', (e) => {
            this.handleBodyDiagramClick(e);
        });

        // Body view toggle
        const viewFront = document.getElementById('view-front');
        const viewBack = document.getElementById('view-back');
        console.log('View front element:', viewFront);
        console.log('View back element:', viewBack);

        viewFront.addEventListener('change', () => {
            console.log('Front radio clicked');
            this.switchBodyView('front');
        });
        viewBack.addEventListener('change', () => {
            console.log('Back radio clicked');
            this.switchBodyView('back');
        });

        // Pain level slider
        const painLevelSlider = document.getElementById('pain-level');
        painLevelSlider.addEventListener('input', (e) => {
            document.getElementById('pain-level-value').textContent = e.target.value;
            this.updatePainSummary();
            this.markUnsavedChanges();
        });

        // Pain type
        document.getElementById('pain-type').addEventListener('change', () => {
            this.updatePainSummary();
            this.markUnsavedChanges();
        });

        // Pain description
        document.getElementById('pain-desc').addEventListener('input', () => {
            this.markUnsavedChanges();
        });

        // Pain triggers and relief
        document.querySelectorAll('.pain-trigger, .pain-relief').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.markUnsavedChanges();
            });
        });

        // Bowel movements
        document.getElementById('bm-count').addEventListener('input', () => this.markUnsavedChanges());
        document.getElementById('bm-consistency').addEventListener('change', () => this.markUnsavedChanges());
        document.getElementById('bm-color').addEventListener('input', () => this.markUnsavedChanges());
        document.getElementById('bm-mucus').addEventListener('change', () => this.markUnsavedChanges());
        document.getElementById('bm-blood').addEventListener('change', () => this.markUnsavedChanges());
        document.getElementById('bm-painful').addEventListener('change', () => this.markUnsavedChanges());
        document.querySelectorAll('input[name="gas-passage"]').forEach(radio => {
            radio.addEventListener('change', () => this.markUnsavedChanges());
        });

        // Eating & Drinking
        document.getElementById('meals-eaten').addEventListener('input', () => this.markUnsavedChanges());
        document.getElementById('fluids-consumed').addEventListener('input', () => this.markUnsavedChanges());
        document.querySelectorAll('.food-category, .eating-symptom').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.markUnsavedChanges());
        });

        // Other symptoms with conditional fields
        document.getElementById('urinary-checkbox').addEventListener('change', (e) => {
            document.getElementById('urinary-details').classList.toggle('hidden', !e.target.checked);
            this.markUnsavedChanges();
        });
        document.getElementById('gynecologic-checkbox').addEventListener('change', (e) => {
            document.getElementById('gynecologic-details').classList.toggle('hidden', !e.target.checked);
            this.markUnsavedChanges();
        });
        document.querySelectorAll('.other-symptom').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.markUnsavedChanges());
        });
        document.getElementById('urinary-details-text').addEventListener('input', () => this.markUnsavedChanges());
        document.getElementById('gynecologic-details-text').addEventListener('input', () => this.markUnsavedChanges());

        // Medications
        document.getElementById('add-medication-btn').addEventListener('click', () => {
            this.addMedicationField();
        });

        // General notes
        document.getElementById('general-notes').addEventListener('input', () => {
            this.markUnsavedChanges();
        });

        // Save button
        document.getElementById('save-log-btn').addEventListener('click', () => {
            this.saveLog();
        });

        // History button
        document.getElementById('history-btn').addEventListener('click', () => {
            this.showHistory();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                StorageService.logout();
                window.location.href = 'auth.html';
            }
        });

        // Close button
        document.getElementById('close-btn').addEventListener('click', () => {
            if (this.unsavedChanges) {
                if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                    this.clearForm();
                }
            } else {
                this.clearForm();
            }
        });

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    handleBodyDiagramClick(e) {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();

        // Check if clicking on existing pain point
        if (e.target.classList.contains('pain-point')) {
            this.removePainPoint(e.target);
            return;
        }

        // Calculate relative position (percentage)
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        this.addPainPoint(x, y, this.currentBodyView);
    }

    addPainPoint(x, y, view) {
        const container = document.getElementById('body-diagram-container');
        const point = document.createElement('div');
        point.className = 'pain-point';
        point.style.left = `${x}%`;
        point.style.top = `${y}%`;
        point.style.transform = 'translate(-50%, -50%)';
        point.dataset.x = x;
        point.dataset.y = y;
        point.dataset.view = view;

        container.appendChild(point);

        this.painPoints.push({ x, y, view });
        this.markUnsavedChanges();
    }

    removePainPoint(element) {
        const x = parseFloat(element.dataset.x);
        const y = parseFloat(element.dataset.y);
        const view = element.dataset.view;

        this.painPoints = this.painPoints.filter(p =>
            !(p.x === x && p.y === y && p.view === view)
        );

        element.remove();
        this.markUnsavedChanges();
    }

    switchBodyView(view) {
        this.currentBodyView = view;
        console.log('Switching to view:', view);

        // Hide all pain points and show only the current view
        document.querySelectorAll('.pain-point').forEach(point => {
            if (point.dataset.view === view) {
                point.style.display = 'block';
            } else {
                point.style.display = 'none';
            }
        });

        // Update body diagram image
        const bodyDiagramImg = document.getElementById('body-diagram-img');
        if (view === 'front') {
            bodyDiagramImg.src = 'FRONT.png';
            console.log('Set image to FRONT.png');
        } else if (view === 'back') {
            bodyDiagramImg.src = 'back.png';
            console.log('Set image to back.png');
        }
    }

    updatePainSummary() {
        const level = document.getElementById('pain-level').value;
        const typeSelect = document.getElementById('pain-type');
        const selectedTypes = Array.from(typeSelect.selectedOptions).map(opt => opt.text);

        const summary = selectedTypes.length > 0
            ? `Level ${level}, ${selectedTypes.join(', ')}`
            : `Level ${level}, Not specified`;

        document.getElementById('pain-summary').textContent = summary;
    }

    addMedicationField() {
        const container = document.getElementById('medications-list');
        const medId = `med-${Date.now()}`;

        const medDiv = document.createElement('div');
        medDiv.className = 'p-3 rounded-md border border-border-light dark:border-border-dark space-y-2';
        medDiv.dataset.medId = medId;

        medDiv.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <input type="text" placeholder="Medication name"
                    class="flex-1 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary text-sm medication-name" />
                <button class="text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500 remove-medication" data-med-id="${medId}">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Dose"
                    class="rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary text-sm medication-dose" />
                <input type="time"
                    class="rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary text-sm medication-time" />
            </div>
            <select class="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary text-sm medication-effect">
                <option value="">Effect not recorded</option>
                <option value="helpful">Helpful</option>
                <option value="not-helpful">Not helpful</option>
                <option value="worsened">Worsened symptoms</option>
            </select>
        `;

        container.appendChild(medDiv);

        // Bind remove button
        medDiv.querySelector('.remove-medication').addEventListener('click', (e) => {
            medDiv.remove();
            this.markUnsavedChanges();
        });

        // Bind change events
        medDiv.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => this.markUnsavedChanges());
        });

        this.markUnsavedChanges();
    }

    getSelectedTimeOfDay() {
        const selected = document.querySelector('.time-of-day-btn.bg-primary\\/20');
        return selected ? selected.dataset.value : 'morning';
    }

    getSelectedCheckboxes(selector) {
        return Array.from(document.querySelectorAll(selector))
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    getMedications() {
        const medications = [];
        document.querySelectorAll('#medications-list > div').forEach(medDiv => {
            const name = medDiv.querySelector('.medication-name')?.value || '';
            const dose = medDiv.querySelector('.medication-dose')?.value || '';
            const time = medDiv.querySelector('.medication-time')?.value || '';
            const effect = medDiv.querySelector('.medication-effect')?.value || '';

            if (name) {
                medications.push({ name, dose, time, effect });
            }
        });
        return medications;
    }

    collectFormData() {
        // Get selected pain types
        const painTypeSelect = document.getElementById('pain-type');
        const painTypes = Array.from(painTypeSelect.selectedOptions).map(opt => opt.value);

        // Get gas passage value
        const gasPassage = document.querySelector('input[name="gas-passage"]:checked')?.value || '';

        // Collect other symptoms
        const otherSymptoms = this.getSelectedCheckboxes('.other-symptom');
        const otherSymptomsData = {
            symptoms: otherSymptoms,
            urinaryDetails: document.getElementById('urinary-checkbox').checked
                ? document.getElementById('urinary-details-text').value
                : '',
            gynecologicDetails: document.getElementById('gynecologic-checkbox').checked
                ? document.getElementById('gynecologic-details-text').value
                : ''
        };

        return {
            date: document.getElementById('log-date').value,
            timeOfDay: this.getSelectedTimeOfDay(),
            pain: {
                locations: this.painPoints,
                level: parseInt(document.getElementById('pain-level').value),
                types: painTypes,
                description: document.getElementById('pain-desc').value,
                triggers: this.getSelectedCheckboxes('.pain-trigger'),
                relief: this.getSelectedCheckboxes('.pain-relief')
            },
            bowelMovements: {
                count: parseInt(document.getElementById('bm-count').value) || 0,
                consistency: document.getElementById('bm-consistency').value,
                color: document.getElementById('bm-color').value,
                mucus: document.getElementById('bm-mucus').checked,
                blood: document.getElementById('bm-blood').checked,
                painful: document.getElementById('bm-painful').checked,
                gasPassage: gasPassage
            },
            eating: {
                meals: document.getElementById('meals-eaten').value,
                categories: this.getSelectedCheckboxes('.food-category'),
                fluids: document.getElementById('fluids-consumed').value,
                symptoms: this.getSelectedCheckboxes('.eating-symptom')
            },
            otherSymptoms: otherSymptomsData,
            medications: this.getMedications(),
            notes: document.getElementById('general-notes').value
        };
    }

    async saveLog() {
        const data = this.collectFormData();

        // Validation
        if (!data.date) {
            alert('Please select a date for this log.');
            return;
        }

        try {
            if (this.editingLogId) {
                await StorageService.updateLog(this.editingLogId, data);
                alert('Log updated successfully!');
            } else {
                await StorageService.saveLog(data);
                alert('Log saved successfully!');
            }

            this.unsavedChanges = false;
            this.clearForm();
        } catch (error) {
            console.error('Error saving log:', error);
            alert('Error saving log. Please try again.');
        }
    }

    clearForm() {
        // Reset all form fields
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
            input.value = '';
        });

        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = false;
        });

        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });

        // Clear pain points
        document.querySelectorAll('.pain-point').forEach(point => point.remove());
        this.painPoints = [];

        // Clear medications
        document.getElementById('medications-list').innerHTML = '';

        // Reset defaults
        this.setDefaultDateTime();
        document.getElementById('pain-level').value = 0;
        document.getElementById('pain-level-value').textContent = '0';
        this.updatePainSummary();

        this.editingLogId = null;
        this.unsavedChanges = false;
    }

    markUnsavedChanges() {
        this.unsavedChanges = true;
        // Debounced auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSave();
        }, 3000);
    }

    autoSave() {
        // Auto-save to a draft in localStorage
        const data = this.collectFormData();
        localStorage.setItem('symptom_log_draft', JSON.stringify(data));
        console.log('Draft auto-saved');
    }

    startAutoSave() {
        // Check for existing draft on load
        const draft = localStorage.getItem('symptom_log_draft');
        if (draft && confirm('You have an unsaved draft. Would you like to restore it?')) {
            this.loadFormData(JSON.parse(draft));
        }
    }

    loadFormData(data) {
        // Load data into form (for editing or restoring draft)
        if (data.date) document.getElementById('log-date').value = data.date;
        if (data.timeOfDay) this.selectTimeOfDay(data.timeOfDay);

        this.updateDateTimeDisplay();

        // Pain data
        if (data.pain) {
            document.getElementById('pain-level').value = data.pain.level || 0;
            document.getElementById('pain-level-value').textContent = data.pain.level || 0;
            document.getElementById('pain-desc').value = data.pain.description || '';

            // Pain types
            const painTypeSelect = document.getElementById('pain-type');
            Array.from(painTypeSelect.options).forEach(option => {
                option.selected = (data.pain.types || []).includes(option.value);
            });

            // Pain triggers and relief
            (data.pain.triggers || []).forEach(value => {
                const checkbox = document.querySelector(`.pain-trigger[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
            (data.pain.relief || []).forEach(value => {
                const checkbox = document.querySelector(`.pain-relief[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Pain points
            (data.pain.locations || []).forEach(point => {
                this.addPainPoint(point.x, point.y, point.view);
            });

            this.updatePainSummary();
        }

        // Bowel movements
        if (data.bowelMovements) {
            document.getElementById('bm-count').value = data.bowelMovements.count || 0;
            document.getElementById('bm-consistency').value = data.bowelMovements.consistency || '';
            document.getElementById('bm-color').value = data.bowelMovements.color || '';
            document.getElementById('bm-mucus').checked = data.bowelMovements.mucus || false;
            document.getElementById('bm-blood').checked = data.bowelMovements.blood || false;
            document.getElementById('bm-painful').checked = data.bowelMovements.painful || false;

            if (data.bowelMovements.gasPassage) {
                const radio = document.querySelector(`input[name="gas-passage"][value="${data.bowelMovements.gasPassage}"]`);
                if (radio) radio.checked = true;
            }
        }

        // Eating
        if (data.eating) {
            document.getElementById('meals-eaten').value = data.eating.meals || '';
            document.getElementById('fluids-consumed').value = data.eating.fluids || '';

            (data.eating.categories || []).forEach(value => {
                const checkbox = document.querySelector(`.food-category[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
            (data.eating.symptoms || []).forEach(value => {
                const checkbox = document.querySelector(`.eating-symptom[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Other symptoms
        if (data.otherSymptoms) {
            (data.otherSymptoms.symptoms || []).forEach(value => {
                const checkbox = document.querySelector(`.other-symptom[value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    // Show conditional fields
                    if (value === 'urinary-symptoms') {
                        document.getElementById('urinary-details').classList.remove('hidden');
                        document.getElementById('urinary-details-text').value = data.otherSymptoms.urinaryDetails || '';
                    }
                    if (value === 'gynecologic-symptoms') {
                        document.getElementById('gynecologic-details').classList.remove('hidden');
                        document.getElementById('gynecologic-details-text').value = data.otherSymptoms.gynecologicDetails || '';
                    }
                }
            });
        }

        // Medications
        if (data.medications && data.medications.length > 0) {
            data.medications.forEach(med => {
                this.addMedicationField();
                const medDiv = document.querySelector('#medications-list > div:last-child');
                medDiv.querySelector('.medication-name').value = med.name || '';
                medDiv.querySelector('.medication-dose').value = med.dose || '';
                medDiv.querySelector('.medication-time').value = med.time || '';
                medDiv.querySelector('.medication-effect').value = med.effect || '';
            });
        }

        // Notes
        if (data.notes) {
            document.getElementById('general-notes').value = data.notes;
        }
    }

    checkForEditMode() {
        // Check URL params for edit mode
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');

        if (editId) {
            const log = StorageService.getLogById(editId);
            if (log) {
                this.editingLogId = editId;
                this.loadFormData(log);
                document.querySelector('h1').textContent = 'Edit Symptom Log';
            }
        }
    }

    showHistory() {
        // Redirect to history page (to be created)
        window.location.href = 'history.html';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SymptomTracker();
});
