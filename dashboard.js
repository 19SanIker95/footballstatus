import { supabase } from './supabaseClient.js';

// --- Seletores de Elementos do DOM ---
const totalEquipasEl = document.getElementById('total-equipas');
const totalLigasEl = document.getElementById('total-ligas');
const totalJogosEl = document.getElementById('total-jogos');
const performanceContainerEl = document.getElementById('performance-por-liga');
const teamRankingsEl = document.getElementById('team-rankings');
const ligaPerformanceSelectEl = document.getElementById('liga-performance-select');
const performanceBarsContainerEl = document.getElementById('performance-bars-container');
const ligaRankingSelectEl = document.getElementById('liga-ranking-select');
const ligaVisaoGeralSelectEl = document.getElementById('liga-visao-geral-select'); // Novo seletor

/**
 * Função principal que carrega todos os dados e orquestra a renderização.
 */
async function inicializarDashboard() {
    try {
        const [
            { data: equipas, error: equipasError },
            { data: ligas, error: ligasError },
            { data: jogos, error: jogosError }
        ] = await Promise.all([
            supabase.from('equipas').select('id, nome'),
            supabase.from('ligas').select('*').order('nome', { ascending: true }),
            supabase.from('jogos').select('*')
        ]);

        if (equipasError || ligasError || jogosError) throw new Error('Falha ao carregar dados essenciais.');

        // Renderiza todas as secções do dashboard
        renderSummary(equipas, ligas, jogos);
        setupVisaoGeralDropdown(ligas, jogos); // NOVA função para a visão geral interativa
        setupPerformanceDropdown(ligas, jogos);
        setupRankingsDropdown(equipas, ligas, jogos);

    } catch (error) {
        console.error('Erro ao inicializar o dashboard:', error.message);
        document.body.innerHTML = `<p class="text-center text-red-500 p-8">Ocorreu um erro fatal ao carregar o dashboard.</p>`;
    }
}

/**
 * Renderiza os cartões de resumo no topo.
 */
function renderSummary(equipas, ligas, jogos) {
    if (totalEquipasEl) totalEquipasEl.textContent = equipas.length;
    if (totalLigasEl) totalLigasEl.textContent = ligas.length;
    if (totalJogosEl) totalJogosEl.textContent = jogos.length;
}

/**
 * NOVA FUNÇÃO: Configura o dropdown da Visão Geral e atualiza os cartões mostrados.
 */
function setupVisaoGeralDropdown(ligas, jogos) {
    if (!ligaVisaoGeralSelectEl || !performanceContainerEl) return;

    // Popula o dropdown com as ligas
    ligas.forEach(liga => {
        ligaVisaoGeralSelectEl.innerHTML += `<option value="${liga.id}">${liga.nome}</option>`;
    });

    // Função para renderizar os cartões com base na seleção
    const updateVisaoGeral = (ligaId) => {
        performanceContainerEl.innerHTML = '';
        
        // Decide quais ligas mostrar: todas ou apenas a selecionada
        const ligasParaMostrar = ligaId === 'todas' ? ligas : ligas.filter(l => l.id == ligaId);
        
        if (ligasParaMostrar.length === 0) {
            performanceContainerEl.innerHTML = '<p class="text-center text-gray-500">Nenhuma liga encontrada.</p>';
            return;
        }

        let conteudoGerado = false;
        ligasParaMostrar.forEach(liga => {
            const jogosDaLiga = jogos.filter(j => j.liga_id === liga.id);
            if (jogosDaLiga.length > 0) {
                conteudoGerado = true;
                const totalGolos = jogosDaLiga.reduce((acc, jogo) => acc + (jogo.resultado_casa || 0) + (jogo.resultado_fora || 0), 0);
                const mediaGolos = (totalGolos / jogosDaLiga.length).toFixed(2);
                const equipasParticipantes = new Set(jogosDaLiga.flatMap(j => [j.equipa_casa_id, j.equipa_fora_id]));
                const cardHTML = `<div class="bg-white border rounded-lg p-4"><h3 class="font-bold text-gray-900">${liga.nome}</h3><div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-center"><div><p class="text-sm text-gray-500">Jogos</p><p class="text-lg font-semibold">${jogosDaLiga.length}</p></div><div><p class="text-sm text-gray-500">Equipas</p><p class="text-lg font-semibold">${equipasParticipantes.size}</p></div><div><p class="text-sm text-gray-500">Total Golos</p><p class="text-lg font-semibold">${totalGolos}</p></div><div><p class="text-sm text-gray-500">Média Golos</p><p class="text-lg font-semibold">${mediaGolos}</p></div></div></div>`;
                performanceContainerEl.innerHTML += cardHTML;
            }
        });

        if (!conteudoGerado) {
            performanceContainerEl.innerHTML = '<p class="text-center text-gray-500">Nenhum jogo encontrado para esta seleção.</p>';
        }
    };
    
    // Adiciona o event listener para o novo dropdown
    ligaVisaoGeralSelectEl.addEventListener('change', (e) => updateVisaoGeral(e.target.value));

    // Carrega a visão inicial com "Todas as Ligas"
    updateVisaoGeral('todas');
}


/**
 * Configura o dropdown de desempenho e atualiza as barras de progresso.
 */
function setupPerformanceDropdown(ligas, jogos) {
    if (!ligaPerformanceSelectEl) return;
    ligaPerformanceSelectEl.innerHTML = '<option value="geral">Geral (Todas as Ligas)</option>';
    ligas.forEach(liga => {
        ligaPerformanceSelectEl.innerHTML += `<option value="${liga.id}">${liga.nome}</option>`;
    });
    const updateBars = (ligaId) => {
        const jogosFiltrados = ligaId === 'geral' ? jogos : jogos.filter(j => j.liga_id == ligaId);
        if (jogosFiltrados.length === 0) {
            performanceBarsContainerEl.innerHTML = '<p class="text-center text-gray-500 py-4">Nenhum jogo encontrado.</p>';
            return;
        }
        const totalGolos = jogosFiltrados.reduce((acc, j) => acc + (j.resultado_casa || 0) + (j.resultado_fora || 0), 0);
        const totalVitorias = jogosFiltrados.filter(j => j.resultado_casa !== j.resultado_fora).length;
        const taxaVitorias = ((totalVitorias / jogosFiltrados.length) * 100).toFixed(0);
        performanceBarsContainerEl.innerHTML = `<div class="space-y-4"><div><div class="flex justify-between mb-1 text-sm"><span class="font-medium">Golos Marcados</span><span class="text-gray-500">${totalGolos}</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-green-400 h-2.5 rounded-full" style="width: ${Math.min(100, totalGolos / 2)}%"></div></div></div><div><div class="flex justify-between mb-1 text-sm"><span class="font-medium">Taxa de Vitórias</span><span class="text-gray-500">${taxaVitorias}%</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-400 h-2.5 rounded-full" style="width: ${taxaVitorias}%"></div></div></div><div><div class="flex justify-between mb-1 text-sm"><span class="font-medium">Total de Jogos</span><span class="text-gray-500">${jogosFiltrados.length}</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${Math.min(100, jogosFiltrados.length)}%"></div></div></div></div>`;
    };
    ligaPerformanceSelectEl.addEventListener('change', (e) => updateBars(e.target.value));
    updateBars('geral');
}

/**
 * Configura o dropdown do ranking e atualiza a lista de equipas.
 */
function setupRankingsDropdown(equipas, ligas, jogos) {
    if (!ligaRankingSelectEl) return;
    ligaRankingSelectEl.innerHTML = '<option value="geral">Global (Todas as Ligas)</option>';
    ligas.forEach(liga => {
        ligaRankingSelectEl.innerHTML += `<option value="${liga.id}">${liga.nome}</option>`;
    });
    const updateRankings = (ligaId) => {
        const jogosFiltrados = ligaId === 'geral' ? jogos : jogos.filter(j => j.liga_id == ligaId);
        if (jogosFiltrados.length === 0) {
            teamRankingsEl.innerHTML = '<p class="text-center text-gray-500">Nenhum jogo encontrado.</p>';
            return;
        }
        const vitorias = {};
        jogosFiltrados.forEach(jogo => {
            if (jogo.resultado_casa > jogo.resultado_fora) vitorias[jogo.equipa_casa_id] = (vitorias[jogo.equipa_casa_id] || 0) + 1;
            else if (jogo.resultado_fora > jogo.resultado_casa) vitorias[jogo.equipa_fora_id] = (vitorias[jogo.equipa_fora_id] || 0) + 1;
        });
        const equipasComVitorias = equipas.map(equipa => ({ ...equipa, vitoriasCalculadas: vitorias[equipa.id] || 0 })).filter(equipa => equipa.vitoriasCalculadas > 0);
        equipasComVitorias.sort((a, b) => b.vitoriasCalculadas - a.vitoriasCalculadas);
        teamRankingsEl.innerHTML = '';
        if(equipasComVitorias.length === 0){
             teamRankingsEl.innerHTML = '<p class="text-center text-gray-500">Nenhuma equipa com vitórias.</p>';
             return;
        }
        equipasComVitorias.slice(0, 5).forEach((equipa, index) => {
            const rankingItem = document.createElement('div');
            rankingItem.className = 'flex items-center space-x-4 p-2';
            rankingItem.innerHTML = `<div class="text-md font-bold text-gray-500 w-5">${index + 1}</div><div class="flex-grow font-medium text-gray-800">${equipa.nome}</div><div class="text-sm font-semibold text-gray-700">${equipa.vitoriasCalculadas} vitórias</div>`;
            teamRankingsEl.appendChild(rankingItem);
        });
    };
    ligaRankingSelectEl.addEventListener('change', (e) => updateRankings(e.target.value));
    updateRankings('geral');
}


// Event listener para iniciar tudo quando a página estiver pronta
document.addEventListener('DOMContentLoaded', inicializarDashboard);