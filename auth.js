import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageEl = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    
    // Verificação simples contra a sua tabela 'utilizadores'
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
        // Armazena um token simples no localStorage para indicar que o utilizador está autenticado
        localStorage.setItem('auth_token', data.id);
        // Redireciona para o dashboard após o login
        window.location.href = 'index.html';
    }
});