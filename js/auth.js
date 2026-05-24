import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

console.log('PanicPal Init: Checking Config...');
console.log('URL defined:', !!SUPABASE_URL);
console.log('Key defined:', !!SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Supabase config is missing! Check your .env and restart npm run dev.');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authForm = document.getElementById('authForm');
// ... rest of elements

// Handle Form Submission
authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    console.log(`Attempting ${isLogin ? 'Login' : 'Signup'} for:`, email);

    try {
        if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            console.log('Login successful:', data);
        } else {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            console.log('Signup successful:', data);
            alert('Check your email for confirmation!');
        }
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Auth Error Details:', error);
        alert(`Auth Failed: ${error.message || 'Check your internet or Supabase URL'}`);
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
