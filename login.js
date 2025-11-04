// Student authentication and registration system
class StudentAuth {
    constructor() {
        this.isSignupMode = false;
        this.init();
    }

    init() {
        // Check if already logged in
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            this.redirectToApp();
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        document.getElementById('toggleLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });
    }

    toggleMode() {
        this.isSignupMode = !this.isSignupMode;
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const welcomeText = document.getElementById('welcomeText');
        const toggleText = document.getElementById('toggleText');
        const toggleLink = document.getElementById('toggleLink');

        if (this.isSignupMode) {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            welcomeText.textContent = 'Create your account to start managing your tasks effectively.';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleLink">Login here</a>';
        } else {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            welcomeText.textContent = 'Welcome! Please login or create a new account to access your personal task manager.';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleLink">Sign up here</a>';
        }

        // Re-bind the toggle link event
        document.getElementById('toggleLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });

        this.clearErrors();
    }

    handleLogin() {
        const studentId = document.getElementById('loginStudentId').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Get stored students
        const students = JSON.parse(localStorage.getItem('registeredStudents')) || [];
        
        // Find student
        const student = students.find(s => s.id === studentId && s.password === password);

        if (student) {
            // Store user session
            const userSession = {
                id: student.id,
                name: student.name,
                email: student.email,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userSession));
            this.showSuccess('Login successful!');
            
            setTimeout(() => {
                this.redirectToApp();
            }, 1500);
        } else {
            this.showError('Invalid Student ID or Password. Please try again or create a new account.');
        }
    }

    handleSignup() {
        const studentId = document.getElementById('signupStudentId').value.trim();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (password !== confirmPassword) {
            this.showError('Passwords do not match. Please try again.');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return;
        }

        // Check if student ID already exists
        const students = JSON.parse(localStorage.getItem('registeredStudents')) || [];
        const existingStudent = students.find(s => s.id === studentId);

        if (existingStudent) {
            this.showError('Student ID already exists. Please choose a different ID or login with existing account.');
            return;
        }

        // Create new student
        const newStudent = {
            id: studentId,
            name: name,
            email: email,
            password: password,
            registrationDate: new Date().toISOString()
        };

        students.push(newStudent);
        localStorage.setItem('registeredStudents', JSON.stringify(students));

        // Auto-login the new user
        const userSession = {
            id: newStudent.id,
            name: newStudent.name,
            email: newStudent.email,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userSession));
        this.showSuccess('Account created successfully! Welcome aboard!');
        
        setTimeout(() => {
            this.redirectToApp();
        }, 1500);
    }

    showSuccess(message) {
        const activeForm = this.isSignupMode ? document.getElementById('signupForm') : document.getElementById('loginForm');
        activeForm.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="color: #4caf50; font-size: 3rem; margin-bottom: 15px;">✅</div>
                <h3 style="color: #4caf50; margin-bottom: 10px;">${message}</h3>
                <p style="color: #666;">Redirecting to your task manager...</p>
            </div>
        `;
    }

    showError(message) {
        // Remove existing error
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #ffebee;
            color: #d32f2f;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #f44336;
            font-size: 14px;
        `;
        errorDiv.textContent = message;

        const activeForm = this.isSignupMode ? document.getElementById('signupForm') : document.getElementById('loginForm');
        activeForm.insertBefore(errorDiv, activeForm.firstChild);

        // Clear password fields
        if (this.isSignupMode) {
            document.getElementById('signupPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            document.getElementById('loginPassword').value = '';
        }
    }

    clearErrors() {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    redirectToApp() {
        window.location.href = 'index.html';
    }
}

// Initialize authentication
document.addEventListener('DOMContentLoaded', () => {
    new StudentAuth();
});
