import { supabase } from './supabaseClient.js';

// Elementos do DOM
const totalEquipasEl = document.getElementById('total-equipas');
const tiposEquipasEl = document.getElementById('tipos-equipas');
const totalLigasEl = document.getElementById('total-ligas');
const statusLigasEl = document.getElementById('status-ligas');
const totalJogosEl = document.getElementById('total-jogos');
const statusJogosEl = document.getElementById('status-jogos');
const teamRankingsEl = document.getElementById('team-rankings');
const golosMarcadosTotalEl = document.getElementById('golos-marcados-total');
const golosMarcadosBarEl = document.getElementById('golos-marcados-bar');
const taxaVitoriasPercentEl = document.getElementById('taxa-vitorias-percent');
const taxaVitoriasBarEl = document.getElementById('taxa-vitorias-bar');
const mediaPosseBolaPercentEl = document.getElementById('media-posse-bola-percent');
const mediaPosseBolaBarEl = document.getElementById('media-posse-bola-bar');
const totalJogosPerformanceEl = document.getElementById('total-jogos-performance');
const totalJogosBarEl = document.getElementById('total-jogos-bar');

let allEquipas = [];

/**
 * Carrega todos os dados necessários das tabelas do Supabase.
 */
async function loadData() {
    try {
        const { data: equipasData, error: equipasError } = await supabase.from('equipas').select('*');
        if (equipasError) throw equipasError;
        allEquipas = equipasData;
        
        const { data: ligasData, error: ligasError } = await supabase.from('ligas').select('*');
        if (ligasError) throw ligasError;

        const { data: jogosData, error: jogosError } = await supabase.from('jogos').select('*');
        if (jogosError) throw jogosError;

        // Renderizar a visão geral
        renderSummary(equipasData, ligasData, jogosData);

        // Renderizar o desempenho geral
        renderPerformanceOverview(equipasData);
        
        // Renderizar a classificação das equipas
        renderTeamRankings(equipasData);

    } catch (error) {
        console.error('Erro ao carregar dados:', error.message);
        // Exibir uma mensagem de erro na UI, se necessário
    }
}

/**
 * Renderiza os cartões de resumo do dashboard.
 */
function renderSummary(equipas, ligas, jogos) {
    totalEquipasEl.textContent = equipas.length;
    const clubesCount = equipas.filter(e => e.tipo === 'clube').length;
    const selecoesCount = equipas.filter(e => e.tipo === 'selecao').length;
    tiposEquipasEl.textContent = `${clubesCount} Clubes - ${selecoesCount} Seleções Nacionais`;

    totalLigasEl.textContent = ligas.length;
    const ligasAtivas = ligas.filter(l => new Date() >= new Date(l.data_inicio) && new Date() <= new Date(l.data_fim)).length;
    const ligasFuturas = ligas.length - ligasAtivas;
    statusLigasEl.textContent = `${ligasAtivas} Em Andamento - ${ligasFuturas} Próximas`;

    totalJogosEl.textContent = jogos.length;
    const jogosConcluidos = jogos.length; 
    statusJogosEl.textContent = `${jogosConcluidos} Concluídos - ${jogos.length - jogosConcluidos} Agendados`;
}

/**
 * Renderiza a seção de desempenho geral.
 */
function renderPerformanceOverview(equipas) {
    const totalGolosMarcados = equipas.reduce((sum, e) => sum + e.total_golos_marcados, 0);
    const totalJogos = equipas.reduce((sum, e) => sum + e.total_jogos, 0);
    const totalVitorias = equipas.reduce((sum, e) => sum + e.total_vitorias, 0);
    const totalPosseBola = equipas.reduce((sum, e) => sum + e.total_posse_bola, 0);

    golosMarcadosTotalEl.textContent = totalGolosMarcados;
    taxaVitoriasPercentEl.textContent = `${totalJogos > 0 ? (totalVitorias / totalJogos * 100).toFixed(0) : 0}%`;
    mediaPosseBolaPercentEl.textContent = `${totalJogos > 0 ? (totalPosseBola / totalJogos).toFixed(0) : 0}%`;
    totalJogosPerformanceEl.textContent = totalJogos;

    // Lógica das barras de progresso (exemplo simplificado)
    golosMarcadosBarEl.style.width = '100%';
    taxaVitoriasBarEl.style.width = `${totalJogos > 0 ? (totalVitorias / totalJogos * 100) : 0}%`;
    mediaPosseBolaBarEl.style.width = `${totalJogos > 0 ? (totalPosseBola / totalJogos) : 0}%`;
    totalJogosBarEl.style.width = '100%';
}

/**
 * Renderiza a classificação das equipas.
 */
function renderTeamRankings(equipas) {
    // Ordenar equipas por total de vitórias
    equipas.sort((a, b) => b.total_vitorias - a.total_vitorias);
    
    // Limpar o conteúdo anterior
    teamRankingsEl.innerHTML = '';

    // Renderizar os itens da classificação
    equipas.forEach((equipa, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'flex items-center space-x-4 p-3 bg-gray-50 rounded-lg shadow-sm';
        rankingItem.innerHTML = `
            <div class="text-lg font-bold text-gray-500">${index + 1}</div>
            <div class="flex-grow">
                <div class="font-medium text-gray-900">${equipa.nome}</div>
                <div class="text-sm text-gray-500">${equipa.tipo === 'clube' ? 'Clube' : 'Seleção'}</div>
            </div>
            <div class="text-sm font-semibold text-gray-700">${equipa.total_vitorias} vitórias</div>
            <div class="text-xs text-gray-500 w-24 text-right">${equipa.total_jogos}J | ${equipa.total_vitorias}V ${equipa.total_empates}E ${equipa.total_derrotas}D</div>
        `;
        teamRankingsEl.appendChild(rankingItem);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', loadData);
