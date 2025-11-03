// Storage Service - Supabase Implementation
// Supabase PostgreSQL database with built-in authentication

const StorageService = {
    supabase: null,
    COLLECTION: 'symptom_logs',
    currentUser: null,

    // Initialize Supabase client
    async init() {
        if (!this.supabase) {
            console.log('[Storage] Initializing Supabase connection...');

            // Get Supabase URL and Key from config (set in HTML or config file)
            const SUPABASE_URL = window.SUPABASE_URL || 'https://jehdsokdcqhdnzitcxkr.supabase.co';
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

            if (!SUPABASE_ANON_KEY) {
                throw new Error('Supabase anon key not configured. Please set SUPABASE_ANON_KEY.');
            }

            // Create Supabase client
            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            console.log('[Storage] Supabase client initialized');

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                console.log('[Storage] Restored existing session for:', this.currentUser.email);
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('[Storage] Auth state changed:', event);
                if (session) {
                    this.currentUser = session.user;
                } else {
                    this.currentUser = null;
                }
            });
        }
        return this.supabase;
    },

    // Authentication methods
    async register(email, password, passwordConfirm) {
        await this.init();

        if (password !== passwordConfirm) {
            return { success: false, error: 'Passwords do not match' };
        }

        try {
            console.log('[Storage] Attempting registration for:', email);

            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) {
                console.error('[Storage] Registration error:', error);
                return { success: false, error: error.message };
            }

            if (data.user) {
                this.currentUser = data.user;
                console.log('[Storage] Registration successful');

                // Check if email confirmation is required
                if (!data.session) {
                    return {
                        success: true,
                        user: data.user,
                        message: 'Please check your email to confirm your account'
                    };
                }

                return { success: true, user: data.user };
            }

            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error('[Storage] Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    async login(email, password) {
        await this.init();

        try {
            console.log('[Storage] Attempting login for:', email);

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('[Storage] Login error:', error);
                return { success: false, error: error.message };
            }

            if (data.user) {
                this.currentUser = data.user;
                console.log('[Storage] Login successful');
                return { success: true, user: data.user };
            }

            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('[Storage] Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    async logout() {
        await this.init();
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            console.log('[Storage] Logged out successfully');
            return true;
        } catch (error) {
            console.error('[Storage] Logout error:', error);
            return false;
        }
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    getCurrentUser() {
        return this.currentUser;
    },

    // Get all logs for the current user
    async getAllLogs() {
        await this.init();
        console.log('[Storage] Getting all logs...');

        if (!this.isAuthenticated()) {
            console.error('[Storage] User not authenticated');
            throw new Error('User not authenticated');
        }

        try {
            const userId = this.currentUser.id;
            console.log(`[Storage] Fetching logs for user: ${userId}`);

            const { data, error } = await this.supabase
                .from(this.COLLECTION)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Storage] Error fetching logs:', error);
                throw error;
            }

            const logs = data || [];
            console.log(`[Storage] Found ${logs.length} logs in database`);

            return logs.map(log => this.transformFromSupabase(log));
        } catch (error) {
            console.error('[Storage] Error fetching logs:', error);
            throw error;
        }
    },

    // Get a single log by ID
    async getLogById(id) {
        await this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from(this.COLLECTION)
                .select('*')
                .eq('id', id)
                .eq('user_id', this.currentUser.id)
                .single();

            if (error) {
                console.error('[Storage] Error fetching log:', error);
                return null;
            }

            return data ? this.transformFromSupabase(data) : null;
        } catch (error) {
            console.error('[Storage] Error fetching log:', error);
            return null;
        }
    },

    // Save a new log
    async saveLog(logData) {
        await this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const supabaseData = this.transformToSupabase(logData);

            const { data, error } = await this.supabase
                .from(this.COLLECTION)
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                console.error('[Storage] Error saving log:', error);
                throw error;
            }

            console.log('[Storage] Log saved successfully:', data);
            return this.transformFromSupabase(data);
        } catch (error) {
            console.error('[Storage] Error saving log:', error);
            throw error;
        }
    },

    // Update an existing log
    async updateLog(id, logData) {
        await this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const supabaseData = this.transformToSupabase(logData);

            const { data, error } = await this.supabase
                .from(this.COLLECTION)
                .update(supabaseData)
                .eq('id', id)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) {
                console.error('[Storage] Error updating log:', error);
                return null;
            }

            console.log('[Storage] Log updated successfully:', data);
            return this.transformFromSupabase(data);
        } catch (error) {
            console.error('[Storage] Error updating log:', error);
            return null;
        }
    },

    // Delete a log
    async deleteLog(id) {
        await this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const { error } = await this.supabase
                .from(this.COLLECTION)
                .delete()
                .eq('id', id)
                .eq('user_id', this.currentUser.id);

            if (error) {
                console.error('[Storage] Error deleting log:', error);
                return false;
            }

            console.log('[Storage] Log deleted successfully');
            return true;
        } catch (error) {
            console.error('[Storage] Error deleting log:', error);
            return false;
        }
    },

    // Transform data TO Supabase format
    transformToSupabase(logData) {
        return {
            user_id: this.currentUser.id,
            date: logData.date || '',
            time: logData.time || '',
            time_of_day: logData.timeOfDay || '',
            pain_locations: logData.pain?.locations || [],
            pain_level: logData.pain?.level || 0,
            pain_types: logData.pain?.types || [],
            pain_description: logData.pain?.description || '',
            pain_triggers: logData.pain?.triggers || [],
            pain_relief: logData.pain?.relief || [],
            bowel_movements: logData.bowelMovements || {},
            eating: logData.eating || {},
            other_symptoms: logData.otherSymptoms || {},
            medications: logData.medications || [],
            notes: logData.notes || ''
        };
    },

    // Transform data FROM Supabase format to app format
    transformFromSupabase(record) {
        // Parse pain_locations if they're stored as JSON strings
        let painLocations = record.pain_locations || [];
        if (painLocations.length > 0 && typeof painLocations[0] === 'string') {
            painLocations = painLocations.map(loc => {
                try {
                    return JSON.parse(loc);
                } catch (e) {
                    console.error('[Storage] Error parsing pain location:', loc, e);
                    return null;
                }
            }).filter(loc => loc !== null);
        }

        return {
            id: record.id,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
            date: record.date,
            time: record.time,
            timeOfDay: record.time_of_day,
            pain: {
                locations: painLocations,
                level: record.pain_level || 0,
                types: record.pain_types || [],
                description: record.pain_description || '',
                triggers: record.pain_triggers || [],
                relief: record.pain_relief || []
            },
            bowelMovements: record.bowel_movements || {},
            eating: record.eating || {},
            otherSymptoms: record.other_symptoms || {},
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
        console.log('[Storage] Getting sorted logs...');
        const logs = await this.getAllLogs();

        const sortedLogs = logs.sort((a, b) => {
            const timeA = a.time || '00:00:00';
            const timeB = b.time || '00:00:00';
            const dateA = new Date(`${a.date} ${timeA}`);
            const dateB = new Date(`${b.date} ${timeB}`);
            return dateB - dateA;
        });

        console.log(`[Storage] Sorted ${sortedLogs.length} logs`);
        return sortedLogs;
    },

    // Search logs by date range
    async getLogsByDateRange(startDate, endDate) {
        await this.init();
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        try {
            const userId = this.currentUser.id;

            const { data, error } = await this.supabase
                .from(this.COLLECTION)
                .select('*')
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (error) {
                console.error('[Storage] Error fetching logs by date range:', error);
                return [];
            }

            return (data || []).map(record => this.transformFromSupabase(record));
        } catch (error) {
            console.error('[Storage] Error fetching logs by date range:', error);
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
                console.error('[Storage] Error migrating log:', log.id, error);
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
