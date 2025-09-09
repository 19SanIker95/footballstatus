import { supabase } from './supabaseClient.js';

// Elementos do DOM
const addMatchBtn = document.getElementById('add-match-btn');
const formContainer = document.getElementById('form-container');
const matchForm = document.getElementById('match-form');
const formTitle = document.getElementById('form-title');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const matchIdInput = document.getElementById('match-id');
const matchDateInput = document.getElementById('match-date');
const leagueSelect = document.getElementById('league-select');
const homeTeamSelect = document.getElementById('home-team-select');
const awayTeamSelect = document.getElementById('away-team-select');
const homeScoreInput = document.getElementById('home-score');
const awayScoreInput = document.getElementById('away-score');
const homePossessionInput = document.getElementById('home-possession');
const awayPossessionInput = document.getElementById('away-possession');
const matchesTableBody = document.getElementById('matches-table-body');
const searchMatchesInput = document.getElementById('search-matches');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

let allLigas = [];
let allEquipas = [];
let currentJogos = [];

// Funções de UI
function showForm() {
    formContainer.classList.remove('hidden');
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    formContainer.classList.add('hidden');
    matchForm.reset();
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
    const { data: ligas, error: ligasError } = await supabase.from('ligas').select('*');
    if (ligasError) {
        console.error('Erro ao buscar ligas:', ligasError);
        return { ligas: [], equipas: [], jogos: [] };
    }
    
    const { data: equipas, error: equipasError } = await supabase.from('equipas').select('*');
    if (equipasError) {
        console.error('Erro ao buscar equipas:', equipasError);
        return { ligas, equipas: [], jogos: [] };
    }
    
    const { data: jogos, error: jogosError } = await supabase.from('jogos').select('*, liga:ligas(nome), equipa_casa:equipas!equipa_casa_id(nome), equipa_fora:equipas!equipa_fora_id(nome)');
    if (jogosError) {
        console.error('Erro ao buscar jogos:', jogosError);
        return { ligas, equipas, jogos: [] };
    }
    
    return { ligas, equipas, jogos };
}

function populateDropdowns() {
    // Popula dropdown de Ligas
    leagueSelect.innerHTML = '<option value="">Selecione a liga...</option>';
    allLigas.forEach(liga => {
        const option = document.createElement('option');
        option.value = liga.id;
        option.textContent = liga.nome;
        leagueSelect.appendChild(option);
    });

    // Popula dropdown de Equipas
    const populateTeams = (selectedLeagueId) => {
        const filteredTeams = allEquipas.filter(equipa => {
             // O campo liga_id ainda não existe na tabela 'equipas', então esta lógica é um placeholder
             // para o caso de ter sido adicionado no futuro.
             // No momento, equipas não estão diretamente ligadas a ligas na BD.
             return true; 
        });

        const teamOptions = filteredTeams.map(equipa => `<option value="${equipa.id}">${equipa.nome}</option>`).join('');
        homeTeamSelect.innerHTML = `<option value="">Selecione a equipa...</option>${teamOptions}`;
        awayTeamSelect.innerHTML = `<option value="">Selecione a equipa...</option>${teamOptions}`;
    };

    leagueSelect.addEventListener('change', (e) => populateTeams(e.target.value));
}

function renderJogos(jogosToRender) {
    matchesTableBody.innerHTML = '';
    if (jogosToRender.length === 0) {
        matchesTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-4">Nenhum jogo encontrado. Adicione um novo jogo.</td></tr>`;
        return;
    }
    jogosToRender.forEach(jogo => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${jogo.data_jogo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${jogo.liga.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${jogo.equipa_casa.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${jogo.equipa_fora.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">${jogo.resultado_casa} - ${jogo.resultado_fora}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button data-id="${jogo.id}" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                <button data-id="${jogo.id}" class="delete-btn text-red-600 hover:text-red-900">Excluir</button>
            </td>
        `;
        matchesTableBody.appendChild(row);
    });
}

// Lógica de atualização de estatísticas (deve ser chamada após adicionar/editar/excluir um jogo)
async function updateTeamStats(teamId, matchData, isHomeTeam) {
    // Busque as estatísticas atuais da equipa
    const { data: team, error: teamFetchError } = await supabase.from('equipas').select('*').eq('id', teamId).single();
    if (teamFetchError) {
        console.error('Erro ao buscar equipa para atualização de stats:', teamFetchError);
        return;
    }
    
    // Calcule as novas estatísticas
    const newStats = {
        total_jogos: team.total_jogos + 1,
        total_vitorias: team.total_vitorias + (isHomeTeam ? (matchData.resultado_casa > matchData.resultado_fora ? 1 : 0) : (matchData.resultado_fora > matchData.resultado_casa ? 1 : 0)),
        total_empates: team.total_empates + (matchData.resultado_casa === matchData.resultado_fora ? 1 : 0),
        total_derrotas: team.total_derrotas + (isHomeTeam ? (matchData.resultado_casa < matchData.resultado_fora ? 1 : 0) : (matchData.resultado_fora < matchData.resultado_casa ? 1 : 0)),
        total_golos_marcados: team.total_golos_marcados + (isHomeTeam ? matchData.resultado_casa : matchData.resultado_fora),
        total_golos_sofridos: team.total_golos_sofridos + (isHomeTeam ? matchData.resultado_fora : matchData.resultado_casa),
        total_cantos: team.total_cantos + (isHomeTeam ? matchData.cantos_casa : matchData.cantos_fora),
        total_posse_bola: team.total_posse_bola + (isHomeTeam ? matchData.posse_bola_casa : matchData.posse_bola_fora),
        total_passes: team.total_passes + (isHomeTeam ? matchData.total_passes_casa : matchData.total_passes_fora),
        total_remates_enquadrados: team.total_remates_enquadrados + (isHomeTeam ? matchData.remates_enquadrados_casa : matchData.remates_enquadrados_fora),
        total_cartoes_amarelos: team.total_cartoes_amarelos + (isHomeTeam ? matchData.cartoes_amarelos_casa : matchData.cartoes_amarelos_fora),
        total_cartoes_vermelhos: team.total_cartoes_vermelhos + (isHomeTeam ? matchData.cartoes_vermelhos_casa : matchData.cartoes_vermelhos_fora),
    };
    
    // Atualize as estatísticas no Supabase
    const { error: updateError } = await supabase.from('equipas').update(newStats).eq('id', teamId);
    if (updateError) {
        console.error('Erro ao atualizar estatísticas da equipa:', updateError);
    }
}

// Event Listeners
addMatchBtn.addEventListener('click', () => {
    formTitle.textContent = 'Adicionar Novo Jogo';
    matchForm.reset();
    matchIdInput.value = '';
    showForm();
});

cancelFormBtn.addEventListener('click', hideForm);

matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = matchIdInput.value;
    
    const matchData = {
        liga_id: leagueSelect.value,
        equipa_casa_id: homeTeamSelect.value,
        equipa_fora_id: awayTeamSelect.value,
        data_jogo: matchDateInput.value,
        resultado_casa: parseInt(homeScoreInput.value),
        resultado_fora: parseInt(awayScoreInput.value),
        posse_bola_casa: parseInt(homePossessionInput.value),
        posse_bola_fora: parseInt(awayPossessionInput.value),
        cantos_casa: 0, // Campos não presentes no formulário, a serem adicionados
        cantos_fora: 0,
        cartoes_amarelos_casa: 0,
        cartoes_amarelos_fora: 0,
        cartoes_vermelhos_casa: 0,
        cartoes_vermelhos_fora: 0,
        total_passes_casa: 0,
        total_passes_fora: 0,
        remates_enquadrados_casa: 0,
        remates_enquadrados_fora: 0,
    };

    if (id) {
        // Lógica de edição
        const { error } = await supabase.from('jogos').update(matchData).eq('id', id);
        if (error) console.error('Erro ao atualizar jogo:', error);
    } else {
        // Adicionar novo jogo
        const { error } = await supabase.from('jogos').insert([matchData]);
        if (error) console.error('Erro ao adicionar jogo:', error);
    }

    // Atualize as estatísticas das equipas
    await updateTeamStats(matchData.equipa_casa_id, matchData, true);
    await updateTeamStats(matchData.equipa_fora_id, matchData, false);

    hideForm();
    await init();
});


matchesTableBody.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    
    const matchId = target.getAttribute('data-id');

    if (target.classList.contains('edit-btn')) {
        const matchToEdit = currentJogos.find(m => m.id === matchId);
        if (matchToEdit) {
            formTitle.textContent = 'Editar Jogo';
            matchIdInput.value = matchToEdit.id;
            matchDateInput.value = matchToEdit.data_jogo;
            leagueSelect.value = matchToEdit.liga_id;
            homeTeamSelect.value = matchToEdit.equipa_casa_id;
            awayTeamSelect.value = matchToEdit.equipa_fora_id;
            homeScoreInput.value = matchToEdit.resultado_casa;
            awayScoreInput.value = matchToEdit.resultado_fora;
            homePossessionInput.value = matchToEdit.posse_bola_casa;
            awayPossessionInput.value = matchToEdit.posse_bola_fora;
            showForm();
        }
    } else if (target.classList.contains('delete-btn')) {
        showDeleteModal();
        confirmDeleteBtn.onclick = async () => {
            const { error } = await supabase.from('jogos').delete().eq('id', matchId);
            if (error) {
                console.error('Erro ao excluir jogo:', error);
            }
            hideDeleteModal();
            await init();
        };
    }
});

cancelDeleteBtn.addEventListener('click', hideDeleteModal);

searchMatchesInput.addEventListener('input', () => {
    const query = searchMatchesInput.value.toLowerCase();
    const filteredJogos = currentJogos.filter(jogo => 
        jogo.equipa_casa.nome.toLowerCase().includes(query) ||
        jogo.equipa_fora.nome.toLowerCase().includes(query) ||
        jogo.liga.nome.toLowerCase().includes(query)
    );
    renderJogos(filteredJogos);
});

// Inicialização
async function init() {
    const data = await fetchData();
    allLigas = data.ligas;
    allEquipas = data.equipas;
    currentJogos = data.jogos;
    populateDropdowns();
    renderJogos(currentJogos);
}

init();
