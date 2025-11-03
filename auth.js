// Authentication Logic
class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.loginTab = document.getElementById('loginTab');
        this.registerTab = document.getElementById('registerTab');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.successMessage = document.getElementById('successMessage');
        this.successText = document.getElementById('successText');
        this.migrationNotice = document.getElementById('migrationNotice');

        this.init();
    }

    init() {
        // Check if already logged in
        if (StorageService.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Tab switching
        this.loginTab.addEventListener('click', () => this.switchTab('login'));
        this.registerTab.addEventListener('click', () => this.switchTab('register'));

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Migration buttons
        document.getElementById('migrateBtn')?.addEventListener('click', () => this.handleMigration());
        document.getElementById('skipMigrationBtn')?.addEventListener('click', () => this.skipMigration());

        // Check for localStorage data
        this.checkLocalStorageData();
    }

    switchTab(tab) {
        if (tab === 'login') {
            this.loginTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            this.loginTab.classList.remove('text-gray-600');
            this.registerTab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            this.registerTab.classList.add('text-gray-600');
            this.loginForm.classList.remove('hidden');
            this.registerForm.classList.add('hidden');
        } else {
            this.registerTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            this.registerTab.classList.remove('text-gray-600');
            this.loginTab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            this.loginTab.classList.add('text-gray-600');
            this.registerForm.classList.remove('hidden');
            this.loginForm.classList.add('hidden');
        }
        this.hideMessages();
    }

    async handleLogin(e) {
        e.preventDefault();
        this.hideMessages();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const result = await StorageService.login(email, password);
            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                // Check for migration after successful login
                setTimeout(() => {
                    this.checkForMigration();
                }, 500);
            } else {
                this.showError(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            this.showError('An error occurred during login. Please try again.');
            console.error('Login error:', error);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.hideMessages();

        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        // Validate passwords match
        if (password !== passwordConfirm) {
            this.showError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        try {
            const result = await StorageService.register(email, password, passwordConfirm);
            if (result.success) {
                // Check if email confirmation is required
                if (result.message) {
                    // Email confirmation required
                    this.showSuccess(result.message);
                    // Switch to login tab after a delay
                    setTimeout(() => {
                        this.switchTab('login');
                        this.showSuccess('Please check your email and click the confirmation link, then log in.');
                    }, 3000);
                } else {
                    // No email confirmation required, user is logged in
                    this.showSuccess('Account created successfully! Redirecting...');
                    setTimeout(() => {
                        this.checkForMigration();
                    }, 500);
                }
            } else {
                this.showError(result.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            this.showError('An error occurred during registration. Please try again.');
            console.error('Registration error:', error);
        }
    }

    checkLocalStorageData() {
        const logs = JSON.parse(localStorage.getItem('symptom_logs') || '[]');
        if (logs.length > 0) {
            document.getElementById('localLogCount').textContent = logs.length;
        }
    }

    checkForMigration() {
        const logs = JSON.parse(localStorage.getItem('symptom_logs') || '[]');
        console.log('Checking for migration. Found', logs.length, 'localStorage logs');
        if (logs.length > 0) {
            console.log('Showing migration notice');
            this.migrationNotice.classList.remove('hidden');
        } else {
            // No migration needed, redirect to app
            console.log('No migration needed, redirecting to index.html');
            window.location.href = 'index.html';
        }
    }

    async handleMigration() {
        const migrateBtn = document.getElementById('migrateBtn');
        const skipBtn = document.getElementById('skipMigrationBtn');

        migrateBtn.disabled = true;
        skipBtn.disabled = true;
        migrateBtn.textContent = 'Migrating...';

        try {
            const result = await StorageService.migrateFromLocalStorage();
            if (result.success) {
                this.showSuccess(`Successfully migrated ${result.migrated} of ${result.total} logs!`);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                this.showError('Migration failed. Please try again.');
                migrateBtn.disabled = false;
                skipBtn.disabled = false;
                migrateBtn.textContent = 'Migrate Now';
            }
        } catch (error) {
            this.showError('An error occurred during migration.');
            console.error('Migration error:', error);
            migrateBtn.disabled = false;
            skipBtn.disabled = false;
            migrateBtn.textContent = 'Migrate Now';
        }
    }

    skipMigration() {
        window.location.href = 'index.html';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.successMessage.classList.add('hidden');
    }

    showSuccess(message) {
        this.successText.textContent = message;
        this.successMessage.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');
    }

    hideMessages() {
        this.errorMessage.classList.add('hidden');
        this.successMessage.classList.add('hidden');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
