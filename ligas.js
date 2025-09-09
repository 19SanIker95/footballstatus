import { supabase } from './supabaseClient.js';

// Elementos do DOM
const addLeagueBtn = document.getElementById('add-league-btn');
const formContainer = document.getElementById('form-container');
const leagueForm = document.getElementById('league-form');
const formTitle = document.getElementById('form-title');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const leagueIdInput = document.getElementById('league-id');
const leagueNameInput = document.getElementById('league-name');
const leagueCountryInput = document.getElementById('league-country');
const leagueSeasonInput = document.getElementById('league-season');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const leaguesListContainer = document.getElementById('leagues-list');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

let currentLeagues = [];
let allTeams = [];

// Funções de UI
function showForm() {
    formContainer.classList.remove('hidden');
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    formContainer.classList.add('hidden');
    leagueForm.reset();
}

function showDeleteModal() {
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
}

function hideDeleteModal() {
    deleteModal.classList.add('hidden');
    deleteModal.classList.remove('flex');
}

// Funções de Dados e Renderização
async function fetchData() {
    const { data: leaguesData, error: leaguesError } = await supabase.from('ligas').select('*').order('nome', { ascending: true });
    if (leaguesError) {
        console.error('Erro ao buscar ligas:', leaguesError);
        return { leagues: [], teams: [] };
    }
    
    const { data: teamsData, error: teamsError } = await supabase.from('equipas').select('*');
    if (teamsError) {
        console.error('Erro ao buscar equipas:', teamsError);
        return { leagues: leaguesData, teams: [] };
    }
    
    return { leagues: leaguesData, teams: teamsData };
}

function renderLeagues(leaguesToRender) {
    const userType = localStorage.getItem('user_type');
    leaguesListContainer.innerHTML = '';
    if (leaguesToRender.length === 0) {
        leaguesListContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Nenhuma liga encontrada. Adicione uma nova liga para começar.</p>`;
        return;
    }
    leaguesToRender.forEach(league => {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow';
        let actionButtonsHtml = '';
        
        if (userType === 'admin') {
             actionButtonsHtml = `
                <button data-id="${league.id}" class="edit-btn p-2 rounded-full hover:bg-gray-200">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button data-id="${league.id}" class="delete-btn p-2 rounded-full hover:bg-gray-200">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12H6L5 7m4 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6"></path></svg>
                </button>
            `;
        }

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold text-gray-900">${league.nome}</h3>
                    <p class="text-sm font-medium text-gray-600">${league.epoca}</p>
                    <p class="text-sm text-gray-500">${league.pais}</p>
                </div>
                <div class="flex space-x-2">
                    ${actionButtonsHtml}
                </div>
            </div>
            <div class="mt-4 text-sm text-gray-700">
                <p><strong>Duração:</strong> ${league.data_inicio || 'N/A'} - ${league.data_fim || 'N/A'}</p>
            </div>
        `;
        leaguesListContainer.appendChild(card);
    });
}

// Event Listeners
addLeagueBtn.addEventListener('click', () => {
    const userType = localStorage.getItem('user_type');
    if (userType !== 'admin') return;

    formTitle.textContent = 'Adicionar Nova Liga';
    leagueForm.reset();
    leagueIdInput.value = '';
    showForm();
});

cancelFormBtn.addEventListener('click', hideForm);

leagueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userType = localStorage.getItem('user_type');
    if (userType !== 'admin') return;
    
    const id = leagueIdInput.value;
    const leagueData = {
        nome: leagueNameInput.value,
        pais: leagueCountryInput.value,
        epoca: leagueSeasonInput.value,
        data_inicio: startDateInput.value || null,
        data_fim: endDateInput.value || null
    };

    if (id) {
        // Atualizar liga existente
        const { error } = await supabase.from('ligas').update(leagueData).eq('id', id);
        if (error) console.error('Erro ao atualizar liga:', error);
    } else {
        // Adicionar nova liga
        const { error } = await supabase.from('ligas').insert([leagueData]);
        if (error) console.error('Erro ao adicionar liga:', error);
    }

    hideForm();
    await init();
});

leaguesListContainer.addEventListener('click', async (e) => {
    const userType = localStorage.getItem('user_type');
    if (userType !== 'admin') {
        return; // Impedir ações para não-administradores
    }

    const target = e.target.closest('button');
    if (!target) return;
    
    const leagueId = target.getAttribute('data-id');
    const leagueToEdit = currentLeagues.find(l => l.id === leagueId);

    if (target.classList.contains('edit-btn')) {
        if (leagueToEdit) {
            formTitle.textContent = 'Editar Liga';
            leagueIdInput.value = leagueToEdit.id;
            leagueNameInput.value = leagueToEdit.nome;
            leagueCountryInput.value = leagueToEdit.pais;
            leagueSeasonInput.value = leagueToEdit.epoca;
            startDateInput.value = leagueToEdit.data_inicio || '';
            endDateInput.value = leagueToEdit.data_fim || '';
            showForm();
        }
    } else if (target.classList.contains('delete-btn')) {
        showDeleteModal();
        confirmDeleteBtn.onclick = async () => {
            const { error } = await supabase.from('ligas').delete().eq('id', leagueId);
            if (error) {
                console.error('Erro ao excluir liga:', error);
            }
            hideDeleteModal();
            await init();
        };
    }
});

cancelDeleteBtn.addEventListener('click', hideDeleteModal);

// Inicialização
async function init() {
    const data = await fetchData();
    currentLeagues = data.leagues;
    allTeams = data.teams;
    renderLeagues(currentLeagues);
}

init();
