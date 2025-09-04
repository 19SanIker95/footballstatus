// dashboard.js

// ATENÇÃO: SUBSTITUA COM AS SUAS CHAVES DO SUPABASE
const supabaseUrl = 'https://cbmwzkldgizpttmkkcsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibXd6a2xkZ2l6cHR0bWtrY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTkxMDAsImV4cCI6MjA3MjM5NTEwMH0.qk4gDHL0UQ9mvc6kdAN_g4071yz_WhJ8TCdR9HTD2vY';

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Arrays globais
let allClubes = [], allSelecoes = [], allJogadores = [], allLigas = [];
let allEstatisticasClube = [], allEstatisticasSelecao = [];

// Buscar todos os dados
async function fetchDataFromSupabase() {
    try {
        const { data: clubes } = await supabase.from('clubes').select('*');
        allClubes = clubes || [];
        const { data: selecoes } = await supabase.from('selecoes').select('*');
        allSelecoes = selecoes || [];
        const { data: jogadores } = await supabase.from('jogadores').select('*');
        allJogadores = jogadores || [];
        const { data: ligas } = await supabase.from('ligas').select('*');
        allLigas = ligas || [];
        const { data: statsClube } = await supabase.from('estatisticas_clube').select('*');
        allEstatisticasClube = statsClube || [];
        const { data: statsSelecao } = await supabase.from('estatisticas_selecao').select('*');
        allEstatisticasSelecao = statsSelecao || [];

        applyFilters();
    } catch (error) {
        console.error(error);
        document.getElementById('data-display').innerHTML = '<p class="text-red-500">Erro ao carregar dados</p>';
    }
}

// Filtrar e ordenar
function applyFilters() {
    const filterType = document.getElementById('filter-type').value;
    const query = document.getElementById('filter-query').value.toLowerCase();
    const sortOrder = document.getElementById('sort-order').value;
    let filtered = [];

    if (filterType === 'clubes' || filterType === '') {
        const clubesWithStats = allClubes.map(clube => {
            const stats = allEstatisticasClube.filter(s => s.clube_id === clube.id);
            return { ...clube, estatisticas: stats };
        }).filter(c => !query || (c.nome && c.nome.toLowerCase().includes(query)));
        filtered = filtered.concat(clubesWithStats);
    }

    if (filterType === 'selecoes' || filterType === '') {
        const selecoesWithStats = allSelecoes.map(s => {
            const stats = allEstatisticasSelecao.filter(st => st.selecao_id === s.id);
            return { ...s, estatisticas: stats };
        }).filter(s => !query || (s.pais && s.pais.toLowerCase().includes(query)));
        filtered = filtered.concat(selecoesWithStats);
    }

    if (filterType === 'jogadores' || filterType === '') {
        const jogadoresFiltered = allJogadores.filter(j => !query || (j.nome && j.nome.toLowerCase().includes(query)));
        filtered = filtered.concat(jogadoresFiltered);
    }

    if (sortOrder) {
        filtered.sort((a, b) => (a.nome || a.pais || '').localeCompare(b.nome || b.pais || '') * (sortOrder === 'asc' ? 1 : -1));
    }

    renderData(filtered);
}

// Renderizar cards
function renderData(data) {
    const container = document.getElementById('data-display');
    container.innerHTML = '';
    if (!data.length) {
        container.innerHTML = '<p class="text-gray-500">Nenhum dado encontrado</p>';
        return;
    }

    data.forEach(item => {
        const type = item.estatisticas ? (item.nome ? 'Clube' : 'Seleção') : 'Jogador';
        const id = item.id;
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md';
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-bold">${item.nome || item.pais}</h3>
                <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">${type}</span>
            </div>
            <div class="mt-4 flex gap-2">
                <button onclick="openDetailsModal('${type}','${id}')" class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Detalhes</button>
                <button onclick="openEditModal('${type}','${id}')" class="px-3 py-1 text-sm bg-yellow-400 text-white rounded-md">Editar</button>
                <button onclick="deleteItem('${type}','${id}')" class="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Excluir</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Funções auxiliares
function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('flex');
}

function calculateAge(dateString) {
    const today = new Date(), birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
}

function findItemById(type, id) {
    if (type === 'Clube') {
        const c = allClubes.find(x => x.id == id);
        if (c) c.estatisticas = allEstatisticasClube.filter(s => s.clube_id == id);
        return c;
    }
    if (type === 'Seleção') {
        const s = allSelecoes.find(x => x.id == id);
        if (s) s.estatisticas = allEstatisticasSelecao.filter(st => st.selecao_id == id);
        return s;
    }
    if (type === 'Jogador') {
        const j = allJogadores.find(x => x.id == id);
        if (j) {
            if (j.clubeid) j.nome_clube = allClubes.find(c => c.id === j.clubeid)?.nome || 'Não encontrado';
            if (j.selecaoid) j.nome_selecao = allSelecoes.find(s => s.id === j.selecaoid)?.pais || 'Não encontrado';
        }
        return j;
    }
    return null;
}

// Abrir modal de detalhes
function openDetailsModal(type, id) {
    const item = findItemById(type, id);
    if (!item) { alert('Item não encontrado'); return; }

    document.getElementById('edit-form').classList.add('hidden');
    document.getElementById('details-content').classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Detalhes do(a) ${type}`;
    const d = document.getElementById('details-content'); d.innerHTML = '';

    if (type === 'Clube' || type === 'Seleção') {
        const total = item.estatisticas.reduce((acc, curr) => {
            for (const k in curr) if (typeof curr[k] === 'number') acc[k] = (acc[k] || 0) + curr[k];
            return acc;
        }, {});
        d.innerHTML = `<h4 class="text-lg font-bold mb-2">${item.nome || item.pais}</h4>
            <div class="grid grid-cols-2 gap-2 mb-4">
                ${Object.entries(total).filter(([k]) => !['id', 'clube_id', 'selecao_id', 'liga_id'].includes(k))
                  .map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}
            </div>
            <h5 class="font-semibold mt-4">Estatísticas por Liga:</h5>
            <div class="space-y-2 mt-2">
                ${item.estatisticas.map(stat => `<div class="bg-gray-100 p-3 rounded-md">
                    <h6 class="font-bold">${allLigas.find(l => l.id === stat.liga_id)?.nome || 'Liga Desconhecida'}:</h6>
                    <p>Jogos: ${stat.jogos}, Vitórias: ${stat.vitorias}, Golos: ${stat.gmarcados}</p>
                </div>`).join('')}
            </div>`;
    } else {
        const age = calculateAge(item.data_nascimento);
        d.innerHTML = `<h4 class="text-lg font-bold mb-2">${item.nome}</h4>
            <div class="grid grid-cols-2 gap-2 mb-4">
                <p><strong>Idade:</strong> ${age}</p>
                <p><strong>Posição:</strong> ${item.posicao}</p>
                <p><strong>Clube:</strong> ${item.nome_clube}</p>
                <p><strong>Seleção:</strong> ${item.nome_selecao}</p>
                <p><strong>Jogos:</strong> ${item.jogos}</p>
                <p><strong>Golos:</strong> ${item.golos}</p>
                <p><strong>Assistências:</strong> ${item.assistencias}</p>
                <p><strong>Amarelos:</strong> ${item.amarelos}</p>
                <p><strong>Vermelhos:</strong> ${item.vermelhos}</p>
                <p><strong>Minutos Jogados:</strong> ${item.minutos_jogados}</p>
                <p><strong>Golos Sofridos:</strong> ${item.golos_sofridos}</p>
                <p><strong>Média GM:</strong> ${item.media_gm}</p>
                <p><strong>Média GS:</strong> ${item.media_gs}</p>
            </div>`;
    }

    document.getElementById('edit-modal').classList.remove('hidden'); 
    document.getElementById('edit-modal').classList.add('flex');
}

// Abrir modal de edição
async function openEditModal(type, id) {
    const item = findItemById(type, id);
    if (!item) { alert('Item não encontrado'); return; }

    document.getElementById('edit-form').classList.remove('hidden');
    document.getElementById('details-content').classList.add('hidden');

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-table').value = type === 'Clube' ? 'estatisticas_clube' : type === 'Jogador' ? 'jogadores' : 'estatisticas_selecao';
    document.getElementById('modal-title').innerText = `Editar ${type}`;

    const fieldsContainer = document.getElementById('modal-fields');
    fieldsContainer.innerHTML = '';

    const createField = (label, name, value, typeField = 'text') => {
        const div = document.createElement('div');
        div.innerHTML = `<label class="block text-gray-600 mb-1">${label}:</label>
            <input type="${typeField}" id="${name}" name="${name}" value="${value || ''}" class="form-input border border-gray-300 rounded p-2 w-full">`;
        fieldsContainer.appendChild(div);
    };

    if (type === 'Clube' || type === 'Seleção') {
        const stats = item.estatisticas[0] || {};
        createField('Época', 'epoca', stats.epoca);
        createField('Jogos', 'jogos', stats.jogos, 'number');
        createField('Vitórias', 'vitorias', stats.vitorias, 'number');
        createField('Empates', 'empates', stats.empates, 'number');
        createField('Derrotas', 'derrotas', stats.derrotas, 'number');
        createField('Golos Marcados', 'gmarcados', stats.gmarcados, 'number');
        createField('Golos Sofridos', 'gsofridos', stats.gsofridos, 'number');
    } else {
        createField('Nome', 'nome', item.nome);
        createField('Posição', 'posicao', item.posicao);
        createField('Data de Nascimento', 'data_nascimento', item.data_nascimento);
        createField('Nacionalidade', 'nacionalidade', item.nacionalidade);
        createField('Jogos', 'jogos', item.jogos, 'number');
        createField('Golos', 'golos', item.golos, 'number');
        createField('Assistências', 'assistencias', item.assistencias, 'number');
        createField('Amarelos', 'amarelos', item.amarelos, 'number');
        createField('Vermelhos', 'vermelhos', item.vermelhos, 'number');
        createField('Minutos Jogados', 'minutos_jogados', item.minutos_jogados, 'number');
        if(item.posicao && item.posicao.includes('guarda-redes')){
            createField('Golos Sofridos', 'golos_sofridos', item.golos_sofridos, 'number');
            createField('Média GS', 'media_gs', item.media_gs, 'number');
        } else {
            createField('Média GM', 'media_gm', item.media_gm, 'number');
        }
    }

    document.getElementById('edit-modal').classList.remove('hidden'); 
    document.getElementById('edit-modal').classList.add('flex');
}

// Salvar alterações
async function saveChanges(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const table = document.getElementById('edit-table').value;
    const inputs = document.querySelectorAll('#modal-fields input');
    const updates = {};
    inputs.forEach(inp => updates[inp.name] = inp.value);

    try {
        if(table === 'estatisticas_clube' || table === 'estatisticas_selecao'){
            await supabase.from(table).update(updates).eq('id', id);
        } else {
            await supabase.from(table).update(updates).eq('id', id);
        }
        alert('Alterações salvas com sucesso!');
        closeModal();
        fetchDataFromSupabase();
    } catch(err){
        console.error(err);
        alert('Erro ao salvar alterações');
    }
}

// Excluir item
async function deleteItem(type, id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    let table = '';
    if(type === 'Clube') table = 'clubes';
    else if(type === 'Seleção') table = 'selecoes';
    else if(type === 'Jogador') table = 'jogadores';

    try {
        await supabase.from(table).delete().eq('id', id);
        alert(`${type} excluído com sucesso!`);
        fetchDataFromSupabase();
    } catch(err){
        console.error(err);
        alert('Erro ao excluir item');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchDataFromSupabase();
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-query').addEventListener('input', applyFilters);
    document.getElementById('sort-order').addEventListener('change', applyFilters);
    document.getElementById('edit-form').addEventListener('submit', saveChanges);
});

// Tornar funções acessíveis globalmente
window.openDetailsModal = openDetailsModal;
window.openEditModal = openEditModal;
window.deleteItem = deleteItem;
window.closeModal = closeModal;
