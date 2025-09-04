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
        filtered.sort((a,b)=> (a.nome || a.pais || '').localeCompare(b.nome || b.pais || '') * (sortOrder==='asc'?1:-1));
    }

    renderData(filtered);
}

// Renderizar cards
function renderData(data) {
    const container = document.getElementById('data-display');
    container.innerHTML = '';
    if (!data.length) { container.innerHTML = '<p class="text-gray-500">Nenhum dado encontrado</p>'; return; }

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

// Funções de modal, edição e exclusão
function closeModal() { document.getElementById('edit-modal').classList.add('hidden'); document.getElementById('edit-modal').classList.remove('flex'); }
function calculateAge(dateString) { const today = new Date(), birth = new Date(dateString); let age = today.getFullYear()-birth.getFullYear(); if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate())) age--; return age; }

function findItemById(type,id){
    if(type==='Clube'){ const c=allClubes.find(x=>x.id==id); if(c)c.estatisticas=allEstatisticasClube.filter(s=>s.clube_id==id); return c;}
    if(type==='Seleção'){ const s=allSelecoes.find(x=>x.id==id); if(s)s.estatisticas=allEstatisticasSelecao.filter(st=>st.selecao_id==id); return s;}
    if(type==='Jogador'){ const j=allJogadores.find(x=>x.id==id); if(j){ if(j.clubeid) j.nome_clube=allClubes.find(c=>c.id==j.clubeid)?.nome||'Não encontrado'; if(j.selecaoid) j.nome_selecao=allSelecoes.find(s=>s.id==j.selecaoid)?.pais||'Não encontrado';} return j;}
    return null;
}

function openDetailsModal(type,id){
    const item=findItemById(type,id);
    if(!item){ alert('Item não encontrado'); return;}
    document.getElementById('edit-form').classList.add('hidden');
    document.getElementById('details-content').classList.remove('hidden');
    document.getElementById('modal-title').innerText=`Detalhes do(a) ${type}`;
    const d=document.getElementById('details-content'); d.innerHTML='';

    if(type==='Clube'||type==='Seleção'){
        const total=item.estatisticas.reduce((acc,curr)=>{for(const k in curr) if(typeof curr[k]==='number') acc[k]=(acc[k]||0)+curr[k]; return acc;}, {});
        d.innerHTML=`<h4 class="text-lg font-bold mb-2">${item.nome||item.pais}</h4>
        <div class="grid grid-cols-2 gap-2 mb-4">
        ${Object.entries(total).filter(([k,v])=>!['id','clube_id','selecao_id','liga_id'].includes(k)).map(([k,v])=>`<p><strong>${k}:</strong> ${v}</p>`).join('')}
        </div>
        <h5 class="font-semibold mt-4">Estatísticas por Liga:</h5>
        <div class="space-y-2 mt-2">${item.estatisticas.map(stat=>`<div class="bg-gray-100 p-3 rounded-md">
        <h6 class="font-bold">${allLigas.find(l=>l.id===stat.liga_id)?.nome||'Liga Desconhecida'}:</h6>
        <p>Jogos: ${stat.jogos}, Vitórias: ${stat.vitorias}, Golos: ${stat.gmarcados}</p></div>`).join('')}</div>`;
    } else {
        const age=calculateAge(item.data_nascimento);
        d.innerHTML=`<h4 class="text-lg font-bold mb-2">${item.nome}</h4>
        <div class="grid grid-cols-2 gap-2 mb-4">
            <p><strong>Idade:</strong> ${age}</p>
            <p><strong>Posição:</strong> ${item.posicao}</p>
            <p><strong>Nacionalidade:</strong> ${item.nacionalidade}</p>
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

    document.getElementById('edit-modal').classList.remove('hidden'); document.getElementById('edit-modal').classList.add('flex');
}

// Funções de edição e exclusão já enviadas na resposta anterior

document.addEventListener('DOMContentLoaded',()=>{
    fetchDataFromSupabase();
    document.getElementById('filter-type').addEventListener('change',applyFilters);
    document.getElementById('filter-query').addEventListener('input',applyFilters);
    document.getElementById('sort-order').addEventListener('change',applyFilters);
    document.getElementById('edit-form').addEventListener('submit',saveChanges);
});

// Expõe funções globais para os botões inline
window.openEditModal = openEditModal;
window.deleteItem = deleteItem;
window.openDetailsModal = openDetailsModal;