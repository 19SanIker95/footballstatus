import { supabase } from './supabaseClient.js';

// --- Elementos do DOM ---
const leagueAnalysisSelect = document.getElementById('league-analysis-select');
const leagueAnalysisContent = document.getElementById('league-analysis-content');
const leagueGoalsChartEl = document.getElementById('leagueGoalsChart');
const formGuideLeagueSelect = document.getElementById('form-guide-league-select');
const formGuideContainer = document.getElementById('form-guide-container');

// --- Variáveis Globais ---
let allEquipas = [];
let allLigas = [];
let allJogos = [];
let myCharts = {};

/**
 * Função principal que carrega todos os dados necessários.
 */
async function fetchData() {
    try {
        const [{ data: equipasData }, { data: ligasData }, { data: jogosData }] = await Promise.all([
            supabase.from('equipas').select('id, nome'),
            supabase.from('ligas').select('*, jogos(resultado_casa, resultado_fora)'),
            supabase.from('jogos').select('*')
        ]);
        allEquipas = equipasData;
        allLigas = ligasData;
        allJogos = jogosData;
        
        initializePage();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

/**
 * Inicializa os componentes da página.
 */
function initializePage() {
    populateLeagueDropdown(leagueAnalysisSelect);
    renderOverallGoalsChart();
    populateLeagueDropdown(formGuideLeagueSelect);
}

/**
 * Popula um dropdown de seleção de ligas.
 */
function populateLeagueDropdown(selectElement) {
    if (!selectElement) return;
    allLigas.forEach(liga => {
        selectElement.innerHTML += `<option value="${liga.id}">${liga.nome}</option>`;
    });
}


/**
 * ATUALIZADO: Agora calcula pontos de forma e ordena as equipas.
 */
function updateFormGuide() {
    const selectedLeagueId = formGuideLeagueSelect.value;
    if (!selectedLeagueId) {
        formGuideContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Por favor, selecione uma liga.</p>`;
        return;
    }

    const jogosDaLiga = allJogos
        .filter(j => String(j.liga_id) === selectedLeagueId)
        .sort((a, b) => new Date(b.data_jogo) - new Date(a.data_jogo));

    if (jogosDaLiga.length === 0) {
        formGuideContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Nenhum jogo encontrado para esta liga.</p>`;
        return;
    }
    
    const teamIdsInLeague = [...new Set(jogosDaLiga.flatMap(j => [j.equipa_casa_id, j.equipa_fora_id]))];
    
    const teamsWithFormData = [];

    // 1. Calcula os dados de forma para cada equipa
    teamIdsInLeague.forEach(teamId => {
        const teamName = allEquipas.find(e => e.id === teamId)?.nome || 'Equipa Desconhecida';
        const ultimos5Jogos = jogosDaLiga.filter(j => j.equipa_casa_id === teamId || j.equipa_fora_id === teamId).slice(0, 5);

        let formPoints = 0;
        let goalsScored = 0;
        let goalsConceded = 0;
        let formResults = [];
        
        ultimos5Jogos.forEach(jogo => {
            let resultado = '';
            let cor = '';

            const isHomeTeam = jogo.equipa_casa_id === teamId;
            const homeGoals = jogo.resultado_casa || 0;
            const awayGoals = jogo.resultado_fora || 0;
            
            goalsScored += isHomeTeam ? homeGoals : awayGoals;
            goalsConceded += isHomeTeam ? awayGoals : homeGoals;

            if (homeGoals === awayGoals) {
                resultado = 'E';
                cor = 'bg-orange-400';
                formPoints += 1;
            } else if ((isHomeTeam && homeGoals > awayGoals) || (!isHomeTeam && awayGoals > homeGoals)) {
                resultado = 'V';
                cor = 'bg-green-500';
                formPoints += 3;
            } else {
                resultado = 'D';
                cor = 'bg-red-500';
            }
            formResults.push(`<span class="flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-bold ${cor}">${resultado}</span>`);
        });
        
        teamsWithFormData.push({
            name: teamName,
            formPoints: formPoints,
            goalDifference: goalsScored - goalsConceded,
            formHtml: formResults.join('')
        });
    });

    // 2. Ordena as equipas pela forma (pontos, depois diferença de golos)
    teamsWithFormData.sort((a, b) => {
        if (b.formPoints !== a.formPoints) {
            return b.formPoints - a.formPoints;
        }
        return b.goalDifference - a.goalDifference;
    });

    // 3. Gera o HTML com a lista ordenada
    const htmlResult = teamsWithFormData.map(team => `
        <div class="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
            <span class="font-medium text-gray-700">${team.name}</span>
            <div class="flex items-center space-x-2">
                ${team.formHtml}
            </div>
        </div>
    `).join('');

    formGuideContainer.innerHTML = htmlResult;
}


// --- LÓGICA DAS SECÇÕES ANTERIORES (Mantida) ---

function updateLeagueAnalysis() {
    const selectedLeagueId = leagueAnalysisSelect.value;
    if (!selectedLeagueId) {
        leagueAnalysisContent.innerHTML = `<p class="text-center text-gray-500 py-8">Por favor, selecione uma liga.</p>`;
        return;
    }
    const jogosDaLiga = allJogos.filter(j => String(j.liga_id) === selectedLeagueId);
    if (jogosDaLiga.length === 0) {
        leagueAnalysisContent.innerHTML = `<p class="text-center text-gray-500 py-8">Ainda não existem jogos.</p>`;
        return;
    }
    const totalJogos = jogosDaLiga.length;
    const totalGolos = jogosDaLiga.reduce((sum, jogo) => sum + (jogo.resultado_casa || 0) + (jogo.resultado_fora || 0), 0);
    const mediaGolos = (totalGolos / totalJogos).toFixed(2);
    const vitorias = {};
    const golosMarcados = {};
    jogosDaLiga.forEach(jogo => {
        vitorias[jogo.equipa_casa_id] = vitorias[jogo.equipa_casa_id] || 0;
        vitorias[jogo.equipa_fora_id] = vitorias[jogo.equipa_fora_id] || 0;
        golosMarcados[jogo.equipa_casa_id] = golosMarcados[jogo.equipa_casa_id] || 0;
        golosMarcados[jogo.equipa_fora_id] = golosMarcados[jogo.equipa_fora_id] || 0;
        golosMarcados[jogo.equipa_casa_id] += jogo.resultado_casa || 0;
        golosMarcados[jogo.equipa_fora_id] += jogo.resultado_fora || 0;
        if ((jogo.resultado_casa || 0) > (jogo.resultado_fora || 0)) vitorias[jogo.equipa_casa_id]++;
        else if ((jogo.resultado_fora || 0) > (jogo.resultado_casa || 0)) vitorias[jogo.equipa_fora_id]++;
    });
    const findTeamName = (id) => allEquipas.find(e => e.id === id)?.nome || 'Equipa Desconhecida';
    const topWinnerId = Object.keys(vitorias).reduce((a, b) => vitorias[a] > vitorias[b] ? a : b, 0);
    const topScorerId = Object.keys(golosMarcados).reduce((a, b) => golosMarcados[a] > golosMarcados[b] ? a : b, 0);
    
    leagueAnalysisContent.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="space-y-4"><div><div class="flex justify-between mb-1 text-sm"><span class="font-medium text-gray-700">Total de Golos</span><span class="font-bold">${totalGolos}</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-green-500 h-2.5 rounded-full" style="width: ${Math.min(100, totalGolos / 2)}%"></div></div></div><div><div class="flex justify-between mb-1 text-sm"><span class="font-medium text-gray-700">Total de Jogos</span><span class="font-bold">${totalJogos}</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-yellow-500 h-2.5 rounded-full" style="width: ${Math.min(100, totalJogos)}%"></div></div></div><div><div class="flex justify-between mb-1 text-sm"><span class="font-medium text-gray-700">Média de Golos / Jogo</span><span class="font-bold">${mediaGolos}</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-500 h-2.5 rounded-full" style="width: ${Math.min(100, mediaGolos * 20)}%"></div></div></div></div><div class="bg-gray-50 p-4 rounded-lg border"><h3 class="font-semibold text-gray-800 mb-3 text-center">Destaques da Liga</h3><div class="space-y-3"><div class="flex items-center justify-between text-sm"><span class="text-gray-600">Equipa com Mais Vitórias:</span><span class="font-bold text-green-600">${findTeamName(topWinnerId)} (${vitorias[topWinnerId]} vitórias)</span></div><div class="flex items-center justify-between text-sm"><span class="text-gray-600">Melhor Ataque:</span><span class="font-bold text-green-600">${findTeamName(topScorerId)} (${golosMarcados[topScorerId]} golos)</span></div></div></div></div>`;
}

function renderOverallGoalsChart() {
    if (!leagueGoalsChartEl) return;
    const dataByLeague = allLigas.map(liga => {
        const totalGoals = liga.jogos.reduce((sum, j) => sum + (j.resultado_casa || 0) + (j.resultado_fora || 0), 0);
        const totalGames = liga.jogos.length;
        return { name: liga.nome, averageGoals: totalGames > 0 ? parseFloat((totalGoals / totalGames).toFixed(2)) : 0 };
    });
    const labels = dataByLeague.map(item => item.name);
    const data = dataByLeague.map(item => item.averageGoals);
    if (myCharts.leagueGoals) myCharts.leagueGoals.destroy();
    myCharts.leagueGoals = new Chart(leagueGoalsChartEl, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Média de Golos por Jogo', data: data, backgroundColor: 'rgba(75, 192, 192, 0.8)' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
}

// --- Event Listeners ---
leagueAnalysisSelect.addEventListener('change', updateLeagueAnalysis);
formGuideLeagueSelect.addEventListener('change', updateFormGuide);

// Inicialização
document.addEventListener('DOMContentLoaded', fetchData);