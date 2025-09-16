// Authentication Component for Boltin App
function Auth({ isLogin = true }) {
    return `
        <div class="auth-container">
            <div class="container">
                <div class="auth-form">
                    <h2 class="section-title">${isLogin ? 'Login' : 'Register'}</h2>
                    
                    <form id="auth-form">
                        <div class="form-group">
                            <label for="email">Email or Phone:</label>
                            <input type="text" id="email" name="emailOrPhone" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" required>
                            ${!isLogin ? `
                            <div class="form-group">
                                <label for="confirm-password">Confirm Password:</label>
                                <input type="password" id="confirm-password" name="confirmPassword" required>
                            </div>
                            <div class="form-group">
                                <label for="name">Full Name:</label>
                                <input type="text" id="name" name="name" required>
                            </div>
                            ` : ''}
                        </div>
                        <button type="submit" class="button">${isLogin ? 'Login' : 'Register'}</button>
                        
                        <div class="auth-options">
                            <p>${isLogin ? "Don't have an account?" : 'Already have an account?'} 
                                <a href="${isLogin ? '#register' : '#login'}" class="nav-link">
                                    ${isLogin ? 'Register' : 'Login'}
                                </a>
                            </p>
                            <p><a href="#reset-password" class="nav-link">Forgot Password?</a></p>
                        </div>
                        
                        <div class="social-login">
                            <p>Or login with:</p>
                            <div class="social-buttons">
                                <button type="button" class="button secondary">Google</button>
                                <button type="button" class="button secondary">Facebook</button>
                            </div>
                        </div>
                    </form>
                    
                    <div id="auth-result"></div>
                </div>
            </div>
        </div>
    `;
}

// Function to handle authentication form submission
function handleAuthSubmit(event, isLogin) {
    event.preventDefault();
    
    const form = document.getElementById('auth-form');
    const emailOrPhone = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // In a real app, this would call the backend API
    console.log(`${isLogin ? 'Login' : 'Registration'} attempt with:`, {
        emailOrPhone,
        password
    });
    
    // Mock response
    const resultDiv = document.getElementById('auth-result');
    resultDiv.innerHTML = `
        <div class="card">
            <p>${isLogin ? 'Login' : 'Registration'} successful!</p>
            <p>Welcome to Boltin App.</p>
        </div>
    `;
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
        window.location.hash = '#dashboard';
        loadDashboard();
    }, 2000);
}

// Function to handle password reset
function handlePasswordReset(event) {
    event.preventDefault();
    
    const email = prompt('Please enter your email address:');
    if (email) {
        // In a real app, this would call the backend API
        console.log(`Password reset requested for email: ${email}`);
        alert('Password reset instructions have been sent to your email.');
    }
}

// Load the authentication component
function loadAuth(isLogin = true) {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = Auth({ isLogin });
        
        // Add event listener to the auth form
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => handleAuthSubmit(e, isLogin));
        }
        
        // Add event listener for reset password
        const resetLink = document.querySelector('#auth-result a[href="#reset-password"]');
        if (resetLink) {
            resetLink.addEventListener('click', handlePasswordReset);
        }
    }
}

// Function to load the dashboard
function loadDashboard() {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = Dashboard();
        
        // Add event listener to the gadget form
        const gadgetForm = document.getElementById('gadget-form');
        if (gadgetForm) {
            gadgetForm.addEventListener('submit', registerGadget);
        }
    }
}

// Attach functions to window object so they can be accessed from HTML
window.Auth = Auth;
window.loadAuth = loadAuth;
window.loadDashboard = loadDashboard;
window.handleAuthSubmit = handleAuthSubmit;
window.handlePasswordReset = handlePasswordReset;

// Initialize the auth component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a hash in the URL
    if (window.location.hash === '#register') {
        loadAuth(false);
    } else {
        loadAuth(true);
    }
});