// Authentication Logic
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth-status`, { credentials: 'include' });
        const data = await response.json();
        
        const isAuth = data.is_authenticated;

        if (!isAuth) {
            localStorage.removeItem('csrf_token');
        }

        const currentPage = window.location.pathname.split('/').pop();
        
        updateNavbar(isAuth, data.user);
        
        if (!isAuth && (currentPage === 'report.html')) {
            window.location.href = 'login.html';
        }
        
        if (isAuth && (currentPage === 'login.html')) {
            window.location.href = 'report.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

function updateNavbar(isAuth, user) {
    const navLinks = document.querySelector('.navbar__links');
    if (!navLinks) return;

    if (isAuth) {
        navLinks.innerHTML = `
            <a href="index.html" class="navbar__link">Home</a>
            <a href="report.html" class="navbar__link">Report Item</a>
            <a href="archive.html" class="navbar__link">Archive</a>
            <div class="navbar__user">
                <span><i class="fa-solid fa-user-circle"></i> ${escapeHtml(user.username)}</span>
                <a href="#" id="logoutBtn" class="navbar__link" style="margin-left: 15px;">Logout</a>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        navLinks.innerHTML = `
            <a href="index.html" class="navbar__link">Home</a>
            <a href="login.html" class="navbar__link">
                <i class="fa-solid fa-user-circle" style="margin-right: 8px;"></i> Login
            </a>
        `;
    }
}

async function logout(e) {
    e.preventDefault();
    try {

        const csrfToken = localStorage.getItem('csrf_token');

        const response = await fetch(`${API_BASE_URL}/logout`, { 
            method: 'POST', 
            credentials: 'include',
            headers: {
                'X-CSRF-Token': csrfToken
            }
        });
        
        if (response.ok) {
            // REMOVE TOKEN AFTER LOGOUT
            localStorage.removeItem('csrf_token');
            window.location.href = 'index.html';

        } else {
            console.error('Logout failed.');
        }

    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function togglePassword() {
    const input = document.getElementById("password");
    const icon = document.querySelector(".toggle-password");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('loginError');
        errorEl.style.display = 'none';

        const payload = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {

                const data = await response.json();

                // SAVE CSRF TOKEN
                localStorage.setItem('csrf_token', data.csrf_token);

                window.location.href = 'report.html';

            } else {
                const err = await response.json();
                errorEl.textContent = err.error || 'Login failed. Please try again.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = 'Failed to connect to the server.';
            errorEl.style.display = 'block';
        }
    });
}