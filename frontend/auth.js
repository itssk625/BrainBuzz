/**
 * Authentication JavaScript
 * Handles login, register, and navigation
 */

// Switch between login and register tabs
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

// Display message to user
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await api.login(username, password);
        
        if (response.success) {
            api.saveAuthData(response.data);
            
            // Redirect based on role
            if (response.data.role === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (response.data.role === 'instructor') {
                window.location.href = 'instructor-dashboard.html';
            }
        } else {
            showMessage(response.message || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage(error.message || 'Login failed. Please try again.', 'error');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('role').value;

    if (!username || !password || !role) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        const response = await api.register(username, password, role);
        
        if (response.success) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(() => {
                switchTab('login');
                document.getElementById('registerForm').reset();
            }, 1500);
        } else {
            showMessage(response.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
    }
}
