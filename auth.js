import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sign out function - moved to the top so it's defined before it's used
export const logOut = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        throw error;
    }
};

// Create and append auth modals to the body
document.body.insertAdjacentHTML('beforeend', `
    <div class="auth-modal" id="signup-modal">
        <div class="auth-modal-content">
            <span class="close-modal">&times;</span>
            <h2>Sign Up</h2>
            <form id="signup-form">
                <input type="text" placeholder="Your Name" required>
                <input type="email" placeholder="Your Email" required>
                <input type="number" placeholder="Your Age" min="13" max="120" required>
                <div class="form-group">
                    <label>Have you ever had any experience with psychologists?</label>
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="experience" value="yes" required> YES
                        </label>
                        <label>
                            <input type="radio" name="experience" value="no" required> NO
                        </label>
                    </div>
                </div>
                <label>Password</label>
                <input type="password" placeholder="Password (at least 6 characters)" required>
                <div class="error-message" id="signup-error"></div>
                <button type="submit" class="btn btn-primary">Sign Up</button>
            </form>
            <p>Already have an account? <a href="#" class="switch-auth" data-target="login">Login</a></p>
        </div>
    </div>

    <div class="auth-modal" id="login-modal">
        <div class="auth-modal-content">
            <span class="close-modal">&times;</span>
            <h2>Login</h2>
            <form id="login-form">
                <input type="email" placeholder="Email" required>
                <input type="password" placeholder="Password" required>
                <div class="error-message" id="login-error"></div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
            <p>Don't have an account? <a href="#" class="switch-auth" data-target="signup">Sign Up</a></p>
        </div>
    </div>
`);

// Only inject auth buttons if we're NOT on the user.html page
const isUserPage = window.location.pathname.endsWith('user.html');
if (!isUserPage) {
    const navLinks = document.querySelector('.nav-links');
    navLinks.insertAdjacentHTML('beforeend', `
        <div class="auth-buttons">
            <button class="btn btn-outline" id="login-btn">Login</button>
            <button class="btn btn-primary" id="signup-btn">Sign Up</button>
        </div>
        <div class="user-menu" style="display: none;">
            <button class="btn btn-outline" id="logout-btn">Logout</button>
            <a href="user.html" class="btn btn-primary">My Profile</a>
        </div>
    `);
}

// Modal functionality
const modals = {
    login: document.getElementById('login-modal'),
    signup: document.getElementById('signup-modal')
};

// Show modal
function showModal(modalId) {
    modals[modalId].style.display = 'flex';
    // Clear any previous error messages
    document.getElementById(`${modalId}-error`).textContent = '';
}

// Hide modal
function hideModal(modalId) {
    modals[modalId].style.display = 'none';
}

// Add event listeners only if the elements exist
if (!isUserPage) {
    // Event Listeners for login and signup buttons
    document.getElementById('login-btn')?.addEventListener('click', () => showModal('login'));
    document.getElementById('signup-btn')?.addEventListener('click', () => showModal('signup'));
    document.getElementById('logout-btn')?.addEventListener('click', logOut);
}

// Close modal when clicking the close button or outside the modal
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        Object.keys(modals).forEach(modalId => hideModal(modalId));
    });
});

window.addEventListener('click', (e) => {
    Object.keys(modals).forEach(modalId => {
        if (e.target === modals[modalId]) {
            hideModal(modalId);
        }
    });
});

// Switch between login and signup modals
document.querySelectorAll('.switch-auth').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetModal = e.target.dataset.target;
        Object.keys(modals).forEach(modalId => hideModal(modalId));
        showModal(targetModal);
    });
});

// Handle form submissions
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.elements[0].value;
    const email = e.target.elements[1].value;
    const age = e.target.elements[2].value;
    const experience = e.target.querySelector('input[name="experience"]:checked').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    // Add debugging logs
    console.log('Signup attempt with:');
    console.log('Password length:', password.length);
    console.log('Password value:', password);
    console.log('Password characters:', Array.from(password).map(c => c.charCodeAt(0)));
    
    // Clear previous error
    const errorElement = document.getElementById('signup-error');
    errorElement.textContent = '';
    
    // Validate age
    if (age < 13 || age > 120) {
        errorElement.textContent = 'Age must be between 13 and 120 years.';
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        errorElement.textContent = 'Password must be at least 6 characters long';
        return;
    }
    
    try {
        const user = await signUp(email, password, name);
        // Store additional user data in Firestore
        const userData = {
            name: name,
            email: email,
            age: parseInt(age, 10),
            experience: experience,
            createdAt: new Date()
        };
        await setDoc(doc(db, "users", user.uid), userData);
        console.log("User data saved:", userData);
        hideModal('signup');
        e.target.reset();
        // Redirect to user dashboard
        window.location.href = 'user.html';
    } catch (error) {
        console.error('Signup error:', error);
        // Display user-friendly error message
        if (error.code === 'auth/email-already-in-use') {
            errorElement.textContent = 'This email is already registered. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorElement.textContent = 'Please enter a valid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorElement.textContent = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/network-request-failed') {
            errorElement.textContent = 'Network error. Please check your internet connection.';
        } else {
            errorElement.textContent = 'An error occurred during signup. Please try again.';
        }
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.elements[0].value;
    const password = e.target.elements[1].value;
    
    // Add debugging logs
    console.log('Password length:', password.length);
    console.log('Password value:', password);
    
    // Clear previous error
    const errorElement = document.getElementById('login-error');
    errorElement.textContent = '';
    
    try {
        await signIn(email, password);
        hideModal('login');
        e.target.reset();
        // Redirect to user dashboard
        window.location.href = 'user.html';
    } catch (error) {
        console.error('Login error:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        // Display user-friendly error message
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorElement.textContent = 'Invalid email or password.';
        } else if (error.code === 'auth/invalid-email') {
            errorElement.textContent = 'Please enter a valid email address.';
        } else if (error.code === 'auth/network-request-failed') {
            errorElement.textContent = 'Network error. Please check your internet connection.';
        } else {
            errorElement.textContent = 'An error occurred during login. Please try again.';
        }
    }
});

// Sign up function
export const signUp = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update user profile with display name
        await updateProfile(userCredential.user, {
            displayName: name
        });
        return userCredential.user;
    } catch (error) {
        console.error('SignUp error:', error);
        throw error;
    }
};

// Sign in function
export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('SignIn error:', error);
        throw error;
    }
};

// Auth state observer
export const initAuth = () => {
    onAuthStateChanged(auth, (user) => {
        // Don't try to manipulate buttons on user.html - it has its own logout button
        if (isUserPage) {
            if (!user) {
                // If on user page and user is not logged in, redirect to index
                window.location.href = 'index.html';
            }
            return;
        }
        
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            // If on index page and user is logged in, redirect to user dashboard
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                window.location.href = 'user.html';
            }
        } else {
            // User is signed out
            console.log('User is signed out');
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    });
}; 