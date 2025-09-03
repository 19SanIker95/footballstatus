// dashboard.js

// ATENÇÃO: SUBSTITUA COM AS SUAS CHAVES DO SUPABASE
const supabaseUrl = 'https://cbmwzkldgizpttmkkcsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibXd6a2xkZ2l6cHR0bWtrY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTkxMDAsImV4cCI6MjA3MjM5NTEwMH0.qk4gDHL0UQ9mvc6kdAN_g4071yz_WhJ8TCdR9HTD2vY';

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

let allClubes = [];
let allJogadores = [];
let allSelecoes = [];

async function fetchDataFromSupabase() {
    try {
        const { data: clubes, error: clubesError } = await supabase.from('clubes').select('*');
        if (clubesError) throw clubesError;
        allClubes = clubes;

        const { data: jogadores, error: jogadoresError } = await supabase.from('jogadores').select('*');
        if (jogadoresError) throw jogadoresError;
        allJogadores = jogadores;
        
        const { data: selecoes, error: selecoesError } = await supabase.from('selecoes').select('*');
        if (selecoesError) throw selecoesError;
        allSelecoes = selecoes;
        
        applyFilters();
    } catch (error) {
        console.error('Erro ao carregar dados:', error.message);
        document.getElementById('data-display').innerHTML = '<p class="text-center text-red-500">Erro ao carregar dados. Verifique a sua conexão e chaves API.</p>';
    }
}

function applyFilters() {
    const filterType = document.getElementById('filter-type').value;
    const filterQuery = document.getElementById('filter-query').value.toLowerCase();
    const sortOrder = document.getElementById('sort-order').value; // NOVO: Ler o filtro de ordenação
    
    let filteredData = [];

    if (filterType === 'clubes' || filterType === '') {
        const clubesFiltered = allClubes.filter(item => 
            (item.nome && item.nome.toLowerCase().includes(filterQuery)) || 
            (item.liga && item.liga.toLowerCase().includes(filterQuery)) ||
            (item.epoca && item.epoca.toLowerCase().includes(filterQuery))
        );
        filteredData = filteredData.concat(clubesFiltered);
    }
    
    if (filterType === 'selecoes' || filterType === '') {
        const selecoesFiltered = allSelecoes.filter(item => 
            (item.pais && item.pais.toLowerCase().includes(filterQuery)) ||
            (item.torneio && item.torneio.toLowerCase().includes(filterQuery)) ||
            (item.epoca && item.epoca.toLowerCase().includes(filterQuery))
        );
        filteredData = filteredData.concat(selecoesFiltered);
    }

    if (filterType === 'jogadores' || filterType === '') {
        const jogadoresFiltered = allJogadores.filter(item => 
            (item.nome && item.nome.toLowerCase().includes(filterQuery)) || 
            (item.clube_selecao && item.clube_selecao.toLowerCase().includes(filterQuery)) ||
            (item.nacionalidade && item.nacionalidade.toLowerCase().includes(filterQuery))
        );
        filteredData = filteredData.concat(jogadoresFiltered);
    }
    
    // NOVO: Lógica de ordenação
    if (sortOrder) {
        filteredData.sort((a, b) => {
            const nameA = (a.nome || a.pais || '').toLowerCase();
            const nameB = (b.nome || b.pais || '').toLowerCase();

            if (nameA < nameB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (nameA > nameB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    renderData(filteredData);
}

function renderData(data) {
    const container = document.getElementById('data-display');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Nenhum dado encontrado com estes filtros.</p>';
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md';
        
        let type;
        if (item.liga) type = 'Clube';
        else if (item.nacionalidade) type = 'Jogador';
        else if (item.torneio) type = 'Seleção';
        else type = 'Desconhecido';

        const idToPass = item.id || '';
        
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-bold">${item.nome || item.pais}</h3>
                <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">${type}</span>
            </div>
            <p class="text-sm text-gray-600"><strong>Jogos:</strong> ${item.jogos || 0}</p>
            <p class="text-sm text-gray-600"><strong>Golos:</strong> ${item.golos || item.gmarcados || 0}</p>
            <div class="mt-4 flex gap-2">
                <button onclick="openDetailsModal('${type}', '${idToPass}')" class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Detalhes</button>
                <button onclick="openEditModal('${type}', '${idToPass}')" class="px-3 py-1 text-sm bg-yellow-400 text-white rounded-md">Editar</button>
                <button onclick="deleteItem('${type}', '${idToPass}')" class="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Excluir</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function findItemById(type, id) {
    if (type === 'Clube') return allClubes.find(item => item.id == id);
    if (type === 'Jogador') return allJogadores.find(item => item.id == id);
    if (type === 'Seleção') return allSelecoes.find(item => item.id == id);
    return null;
}

function openDetailsModal(type, id) {
    const item = findItemById(type, id);
    if (!item) {
        alert('Item não encontrado.');
        return;
    }

    document.getElementById('edit-form').classList.add('hidden');
    document.getElementById('details-content').classList.remove('hidden');

    document.getElementById('modal-title').innerText = `Detalhes do(a) ${type}`;
    const detailsContainer = document.getElementById('details-content');
    detailsContainer.innerHTML = '';

    for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) && key !== 'id') {
            const detailItem = document.createElement('p');
            detailItem.className = 'text-gray-700';
            
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            detailItem.innerHTML = `<strong class="text-gray-900">${label}:</strong> ${item[key]}`;
            detailsContainer.appendChild(detailItem);
        }
    }

    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-modal').classList.add('flex');
}

function openEditModal(type, id) {
    const item = findItemById(type, id);
    if (!item) {
        alert('Item não encontrado.');
        return;
    }

    document.getElementById('edit-form').classList.remove('hidden');
    document.getElementById('details-content').classList.add('hidden');

    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-table').value = type === 'Clube' ? 'clubes' : type === 'Jogador' ? 'jogadores' : 'selecoes';
    document.getElementById('modal-title').innerText = `Editar ${type}`;
    
    const fieldsContainer = document.getElementById('modal-fields');
    fieldsContainer.innerHTML = '';

    const createField = (label, name, value, type = 'text') => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label class="block text-gray-600 mb-1">${label}:</label>
            <input type="${type}" id="${name}" name="${name}" value="${value || ''}" class="form-input border border-gray-300 rounded p-2 w-full">
        `;
        fieldsContainer.appendChild(div);
    };

    if (type === 'Clube') {
        createField('Nome', 'nome', item.nome);
        createField('Liga', 'liga', item.liga);
        createField('Época', 'epoca', item.epoca);
        createField('Jogos', 'jogos', item.jogos, 'number');
        createField('Vitórias', 'vitorias', item.vitorias, 'number');
        createField('Empates', 'empates', item.empates, 'number');
        createField('Derrotas', 'derrotas', item.derrotas, 'number');
        createField('Golos Marcados', 'gmarcados', item.gmarcados, 'number');
        createField('Golos Sofridos', 'gsofridos', item.gsofridos, 'number');
    } else if (type === 'Jogador') {
        createField('Nome', 'nome', item.nome);
        createField('Posição', 'posicao', item.posicao);
        createField('Clube/Seleção', 'clube_selecao', item.clube_selecao);
        createField('Data de Nascimento', 'data_nascimento', item.data_nascimento);
        createField('Nacionalidade', 'nacionalidade', item.nacionalidade);
        createField('Jogos', 'jogos', item.jogos, 'number');
        createField('Golos', 'golos', item.golos, 'number');
        createField('Assistências', 'assistencias', item.assistencias, 'number');
        createField('Amarelos', 'amarelos', item.amarelos, 'number');
        createField('Vermelhos', 'vermelho', item.vermelho, 'number');
        createField('Minutos Jogados', 'minutos_jogados', item.minutos_jogados, 'number');
        
        if (item.posicao && item.posicao.includes('guarda-redes')) {
            createField('Golos Sofridos', 'golos_sofridos', item.golos_sofridos, 'number');
            createField('Média GS por Jogo', 'media_gs', item.media_gs, 'number');
        }

    } else if (type === 'Seleção') {
        createField('País', 'pais', item.pais);
        createField('Torneio', 'torneio', item.torneio);
        createField('Época', 'epoca', item.epoca, 'number');
        createField('Jogos', 'jogos', item.jogos, 'number');
        createField('Vitórias', 'vitorias', item.vitorias, 'number');
        createField('Empates', 'empates', item.empates, 'number');
        createField('Derrotas', 'derrotas', item.derrotas, 'number');
        createField('Golos Marcados', 'gmarcados', item.gmarcados, 'number');
        createField('Golos Sofridos', 'gsofridos', item.gsofridos, 'number');
    }

    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-modal').classList.add('flex');
}

function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('flex');
}

async function saveChanges(event) {
    event.preventDefault();
    
    const form = event.target;
    const id = document.getElementById('edit-id').value;
    const table = document.getElementById('edit-table').value;
    
    const updatedData = {};
    for (const field of form.elements) {
        if (field.name) {
            updatedData[field.name] = field.type === 'number' ? parseInt(field.value) : field.value;
        }
    }

    if (table === 'jogadores') {
        const currentJogos = parseInt(updatedData.jogos);
        const currentGolos = parseInt(updatedData.golos);
        const currentGolosSofridos = parseInt(updatedData.golos_sofridos);
        
        if (currentJogos > 0) {
            updatedData.media_gm = (currentGolos / currentJogos).toFixed(2);
        } else {
            updatedData.media_gm = 0;
        }

        if (updatedData.posicao && updatedData.posicao.includes('guarda-redes') && currentJogos > 0) {
            updatedData.media_gs = (currentGolosSofridos / currentJogos).toFixed(2);
        } else if (updatedData.posicao && !updatedData.posicao.includes('guarda-redes')) {
            updatedData.media_gs = 0;
        }
    }

    const { data, error } = await supabase
        .from(table)
        .update(updatedData)
        .eq('id', id);
    
    if (error) {
        alert('Erro ao atualizar dados: ' + error.message);
        console.error('Erro:', error);
    } else {
        alert('Dados atualizados com sucesso!');
        closeModal();
        fetchDataFromSupabase();
    }
}

async function deleteItem(type, id) {
    if (confirm(`Tem a certeza que quer excluir este ${type}?`)) {
        const table = type === 'Clube' ? 'clubes' : type === 'Jogador' ? 'jogadores' : 'selecoes';
        
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            alert('Erro ao excluir dados: ' + error.message);
            console.error('Erro:', error);
        } else {
            alert('Item excluído com sucesso!');
            fetchDataFromSupabase();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDataFromSupabase();
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-query').addEventListener('input', applyFilters);
    document.getElementById('sort-order').addEventListener('change', applyFilters);
    document.getElementById('edit-form').addEventListener('submit', saveChanges);
});