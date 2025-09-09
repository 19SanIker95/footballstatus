import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageEl = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    
    const { data, error } = await supabase
        .from('utilizadores')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
        
    if (error || !data) {
        errorMessageEl.textContent = 'Email ou password incorretos.';
        errorMessageEl.classList.remove('hidden');
    } else {
        errorMessageEl.classList.add('hidden');
        localStorage.setItem('auth_token', data.id);
        localStorage.setItem('user_type', data.tipo); // Armazena o tipo de utilizador
        window.location.href = 'index.html';
    }
});
