// Storage Service - Manages localStorage for symptom logs
const StorageService = {
    STORAGE_KEY: 'symptom_logs',

    // Initialize storage if it doesn't exist
    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    },

    // Get all logs
    getAllLogs() {
        this.init();
        const logs = localStorage.getItem(this.STORAGE_KEY);
        return JSON.parse(logs) || [];
    },

    // Get a single log by ID
    getLogById(id) {
        const logs = this.getAllLogs();
        return logs.find(log => log.id === id);
    },

    // Save a new log
    saveLog(logData) {
        const logs = this.getAllLogs();
        const newLog = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...logData
        };
        logs.push(newLog);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
        return newLog;
    },

    // Update an existing log
    updateLog(id, logData) {
        const logs = this.getAllLogs();
        const index = logs.findIndex(log => log.id === id);
        if (index !== -1) {
            logs[index] = {
                ...logs[index],
                ...logData,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
            return logs[index];
        }
        return null;
    },

    // Delete a log
    deleteLog(id) {
        const logs = this.getAllLogs();
        const filteredLogs = logs.filter(log => log.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredLogs));
        return filteredLogs.length < logs.length;
    },

    // Export all logs as JSON
    exportAsJSON() {
        const logs = this.getAllLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        return URL.createObjectURL(dataBlob);
    },

    // Export logs as CSV
    exportAsCSV() {
        const logs = this.getAllLogs();
        if (logs.length === 0) return null;

        // CSV headers
        const headers = [
            'Date', 'Time', 'Time of Day', 'Pain Level', 'Pain Types',
            'Pain Description', 'Pain Triggers', 'Pain Relief',
            'BM Count', 'BM Consistency', 'BM Color', 'Mucus', 'Blood',
            'Painful BM', 'Gas Passage', 'Meals', 'Food Categories',
            'Fluids', 'Eating Symptoms', 'Other Symptoms',
            'Medications', 'Notes'
        ];

        // Convert logs to CSV rows
        const rows = logs.map(log => {
            return [
                log.date || '',
                log.time || '',
                log.timeOfDay || '',
                log.pain?.level || '0',
                (log.pain?.types || []).join('; '),
                log.pain?.description || '',
                (log.pain?.triggers || []).join('; '),
                (log.pain?.relief || []).join('; '),
                log.bowelMovements?.count || '0',
                log.bowelMovements?.consistency || '',
                log.bowelMovements?.color || '',
                log.bowelMovements?.mucus ? 'Yes' : 'No',
                log.bowelMovements?.blood ? 'Yes' : 'No',
                log.bowelMovements?.painful ? 'Yes' : 'No',
                log.bowelMovements?.gasPassage || '',
                log.eating?.meals || '',
                (log.eating?.categories || []).join('; '),
                log.eating?.fluids || '',
                (log.eating?.symptoms || []).join('; '),
                (log.otherSymptoms?.symptoms || []).join('; '),
                (log.medications || []).map(m => `${m.name} (${m.effect})`).join('; '),
                log.notes || ''
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        return URL.createObjectURL(dataBlob);
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Clear all logs (with confirmation)
    clearAllLogs() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    },

    // Get logs sorted by date (most recent first)
    getLogsSorted() {
        const logs = this.getAllLogs();
        return logs.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });
    },

    // Search logs by date range
    getLogsByDateRange(startDate, endDate) {
        const logs = this.getAllLogs();
        return logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= new Date(startDate) && logDate <= new Date(endDate);
        });
    }
};

// Make available globally
window.StorageService = StorageService;
