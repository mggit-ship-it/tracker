// Storage Service - PocketBase Implementation
// Import PocketBase SDK from CDN - add this script tag to HTML:
// <script src="https://cdn.jsdelivr.net/npm/pocketbase@0.31.0/dist/pocketbase.umd.js"></script>

const StorageService = {
    pb: null,
    COLLECTION: 'symptom_logs',

    // Initialize PocketBase connection
    init() {
        if (!this.pb) {
            this.pb = new PocketBase('http://127.0.0.1:8090');
            // Auto-refresh authentication
            this.pb.autoCancellation(false);
        }
        return this.pb;
    },

    // Authentication methods
    async login(email, password) {
        this.init();
        try {
            const authData = await this.pb.collection('users').authWithPassword(email, password);
            return { success: true, user: authData.record };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    async register(email, password, passwordConfirm) {
        this.init();
        try {
            const data = {
                email,
                password,
                passwordConfirm,
                emailVisibility: false
            };
            const user = await this.pb.collection('users').create(data);
            // Auto-login after registration
            await this.login(email, password);
            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    logout() {
        this.init();
        this.pb.authStore.clear();
    },

    isAuthenticated() {
        this.init();
        return this.pb.authStore.isValid;
    },

    getCurrentUser() {
        this.init();
        return this.pb.authStore.model;
    },

    // Get all logs for the current user
    async getAllLogs() {
        this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const records = await this.pb.collection(this.COLLECTION).getFullList({
                sort: '-created',
                filter: `userId = "${this.pb.authStore.model.id}"`
            });

            // Transform PocketBase records to match original format
            return records.map(record => this.transformFromPocketBase(record));
        } catch (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
    },

    // Get a single log by ID
    async getLogById(id) {
        this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const record = await this.pb.collection(this.COLLECTION).getOne(id);
            return this.transformFromPocketBase(record);
        } catch (error) {
            console.error('Error fetching log:', error);
            return null;
        }
    },

    // Save a new log
    async saveLog(logData) {
        this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const pbData = this.transformToPocketBase(logData);
            const record = await this.pb.collection(this.COLLECTION).create(pbData);
            return this.transformFromPocketBase(record);
        } catch (error) {
            console.error('Error saving log:', error);
            throw error;
        }
    },

    // Update an existing log
    async updateLog(id, logData) {
        this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const pbData = this.transformToPocketBase(logData);
            const record = await this.pb.collection(this.COLLECTION).update(id, pbData);
            return this.transformFromPocketBase(record);
        } catch (error) {
            console.error('Error updating log:', error);
            return null;
        }
    },

    // Delete a log
    async deleteLog(id) {
        this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            await this.pb.collection(this.COLLECTION).delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting log:', error);
            return false;
        }
    },

    // Transform data TO PocketBase format
    transformToPocketBase(logData) {
        return {
            userId: this.pb.authStore.model.id,
            date: logData.date || '',
            time: logData.time || '',
            timeOfDay: logData.timeOfDay || '',
            painLocations: logData.pain?.locations || [],
            painLevel: logData.pain?.level || 0,
            painTypes: logData.pain?.types || [],
            painDescription: logData.pain?.description || '',
            painTriggers: logData.pain?.triggers || [],
            painRelief: logData.pain?.relief || [],
            bowelMovements: logData.bowelMovements || {},
            eating: logData.eating || {},
            otherSymptoms: logData.otherSymptoms || {},
            medications: logData.medications || [],
            notes: logData.notes || ''
        };
    },

    // Transform data FROM PocketBase format to original app format
    transformFromPocketBase(record) {
        return {
            id: record.id,
            createdAt: record.created,
            updatedAt: record.updated,
            date: record.date,
            time: record.time,
            timeOfDay: record.timeOfDay,
            pain: {
                locations: record.painLocations || [],
                level: record.painLevel || 0,
                types: record.painTypes || [],
                description: record.painDescription || '',
                triggers: record.painTriggers || [],
                relief: record.painRelief || []
            },
            bowelMovements: record.bowelMovements || {},
            eating: record.eating || {},
            otherSymptoms: record.otherSymptoms || {},
            medications: record.medications || [],
            notes: record.notes || ''
        };
    },

    // Export all logs as JSON
    async exportAsJSON() {
        const logs = await this.getAllLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        return URL.createObjectURL(dataBlob);
    },

    // Export logs as CSV
    async exportAsCSV() {
        const logs = await this.getAllLogs();
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

    // Get logs sorted by date (most recent first)
    async getLogsSorted() {
        const logs = await this.getAllLogs();
        return logs.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });
    },

    // Search logs by date range
    async getLogsByDateRange(startDate, endDate) {
        this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const records = await this.pb.collection(this.COLLECTION).getFullList({
                filter: `userId = "${this.pb.authStore.model.id}" && date >= "${startDate}" && date <= "${endDate}"`,
                sort: '-date'
            });
            return records.map(record => this.transformFromPocketBase(record));
        } catch (error) {
            console.error('Error fetching logs by date range:', error);
            return [];
        }
    },

    // Migration helper: Import data from localStorage
    async migrateFromLocalStorage() {
        const oldLogs = JSON.parse(localStorage.getItem('symptom_logs') || '[]');
        if (oldLogs.length === 0) {
            return { success: true, count: 0 };
        }

        let successCount = 0;
        let errorCount = 0;

        for (const log of oldLogs) {
            try {
                await this.saveLog(log);
                successCount++;
            } catch (error) {
                console.error('Error migrating log:', log.id, error);
                errorCount++;
            }
        }

        return {
            success: true,
            total: oldLogs.length,
            migrated: successCount,
            errors: errorCount
        };
    }
};

// Make available globally
window.StorageService = StorageService;
