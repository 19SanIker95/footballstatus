// Script para lidar com o logout.
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Remove o token de autenticação
            localStorage.removeItem('auth_token');
            // Redireciona para a página de login
            window.location.href = 'login.html';
        });
    }
});