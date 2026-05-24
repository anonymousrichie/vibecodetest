import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const submitBtn = document.getElementById('submitBtn');
const toggleAuth = document.getElementById('toggleAuth');
const toggleText = document.getElementById('toggleText');

let isLogin = true;

// Toggle between Login and Signup
toggleAuth?.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    
    authTitle.textContent = isLogin ? 'Login' : 'Sign Up';
    submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
    toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleAuth.textContent = isLogin ? 'Sign Up' : 'Login';
});

// Handle Form Submission
authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            alert('Check your email for confirmation!');
        }
        
        // Success -> Redirect to Dashboard
        window.location.href = 'index.html';
    } catch (error) {
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
    }
});

// Check session on load
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && window.location.pathname.includes('auth.html')) {
        window.location.href = 'index.html';
    } else if (!session && window.location.pathname.includes('index.html')) {
        window.location.href = 'auth.html';
    }
}

checkSession();
export { supabase };
