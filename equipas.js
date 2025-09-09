import { supabase } from './supabaseClient.js';

// Elementos do DOM
const addTeamBtn = document.getElementById('add-team-btn');
const formContainer = document.getElementById('form-container');
const teamForm = document.getElementById('team-form');
const formTitle = document.getElementById('form-title');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const teamIdInput = document.getElementById('team-id');
const teamNameInput = document.getElementById('team-name');
const teamTypeSelect = document.getElementById('team-type');
const homeStadiumInput = document.getElementById('home-stadium');
const foundedYearInput = document.getElementById('founded-year');
const squadSizeInput = document.getElementById('squad-size');
const teamsTableBody = document.getElementById('teams-table-body');
const searchTeamsInput = document.getElementById('search-teams');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

let currentTeams = [];

// Funções de UI
function showForm() {
    formContainer.classList.remove('hidden');
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    formContainer.classList.add('hidden');
    teamForm.reset();
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
async function fetchTeams() {
    const { data: teams, error } = await supabase.from('equipas').select('*').order('nome', { ascending: true });
    if (error) {
        console.error('Erro ao buscar equipas:', error);
        return [];
    }
    return teams;
}

function renderTeams(teamsToRender) {
    const userType = localStorage.getItem('user_type');
    teamsTableBody.innerHTML = '';
    teamsToRender.forEach(team => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        let actionButtonsHtml = '';
        
        if (userType === 'admin') {
             actionButtonsHtml = `
                <button data-id="${team.id}" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                <button data-id="${team.id}" class="delete-btn text-red-600 hover:text-red-900">Excluir</button>
            `;
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${team.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.tipo === 'clube' ? 'Clube' : 'Seleção'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.ano_fundacao || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.total_jogos}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.total_vitorias}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ${actionButtonsHtml}
            </td>
        `;
        teamsTableBody.appendChild(row);
    });
}

// Event Listeners
addTeamBtn.addEventListener('click', () => {
    formTitle.textContent = 'Adicionar Nova Equipa';
    teamForm.reset();
    teamIdInput.value = '';
    showForm();
});

cancelFormBtn.addEventListener('click', hideForm);

teamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = teamIdInput.value;
    const teamData = {
        nome: teamNameInput.value,
        tipo: teamTypeSelect.value,
        estadio_casa: homeStadiumInput.value || null,
        ano_fundacao: foundedYearInput.value ? parseInt(foundedYearInput.value) : null,
        tamanho_plantel: squadSizeInput.value ? parseInt(squadSizeInput.value) : null
    };

    if (id) {
        // Atualizar equipa existente
        const { error } = await supabase.from('equipas').update(teamData).eq('id', id);
        if (error) console.error('Erro ao atualizar equipa:', error);
    } else {
        // Adicionar nova equipa
        const { error } = await supabase.from('equipas').insert([teamData]);
        if (error) console.error('Erro ao adicionar equipa:', error);
    }

    hideForm();
    await init();
});

teamsTableBody.addEventListener('click', async (e) => {
    const userType = localStorage.getItem('user_type');
    if (userType !== 'admin') {
        return; // Impedir ações para não-administradores
    }

    const target = e.target;
    const teamId = target.getAttribute('data-id');

    if (target.classList.contains('edit-btn')) {
        const teamToEdit = currentTeams.find(t => t.id === teamId);
        if (teamToEdit) {
            formTitle.textContent = 'Editar Equipa';
            teamIdInput.value = teamToEdit.id;
            teamNameInput.value = teamToEdit.nome;
            teamTypeSelect.value = teamToEdit.tipo;
            homeStadiumInput.value = teamToEdit.estadio_casa || '';
            foundedYearInput.value = teamToEdit.ano_fundacao || '';
            squadSizeInput.value = teamToEdit.tamanho_plantel || '';
            showForm();
        }
    } else if (target.classList.contains('delete-btn')) {
        showDeleteModal();
        confirmDeleteBtn.onclick = async () => {
            const { error } = await supabase.from('equipas').delete().eq('id', teamId);
            if (error) {
                console.error('Erro ao excluir equipa:', error);
            }
            hideDeleteModal();
            await init();
        };
    }
});

cancelDeleteBtn.addEventListener('click', hideDeleteModal);

searchTeamsInput.addEventListener('input', () => {
    const query = searchTeamsInput.value.toLowerCase();
    const filteredTeams = currentTeams.filter(team => team.nome.toLowerCase().includes(query));
    renderTeams(filteredTeams);
});

// Inicialização
async function init() {
    currentTeams = await fetchTeams();
    renderTeams(currentTeams);
}

init();
