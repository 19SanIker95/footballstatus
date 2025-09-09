import { supabase } from './supabaseClient.js';

// Elementos do DOM
const tableBody = document.getElementById('tableBody');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const standingsTable = document.getElementById('standingsTable');
const leagueSelect = document.getElementById('league-select');

let allEquipas = [];
let allJogos = [];

// Função para preencher o dropdown de ligas
async function populateLeagueDropdown() {
    const { data: ligas, error } = await supabase.from('ligas').select('*').order('nome', { ascending: true });
    if (error) {
        console.error("Erro a carregar ligas:", error);
        return;
    }
    
    leagueSelect.innerHTML = '<option value="">Selecione uma liga...</option>';
    ligas.forEach(liga => {
        const option = document.createElement('option');
        option.value = liga.id;
        option.textContent = liga.nome;
        leagueSelect.appendChild(option);
    });
}

// Função principal para carregar e renderizar a classificação
async function fetchAndRenderStandings(leagueId) {
    loading.classList.remove('hidden');
    standingsTable.classList.add('hidden');
    errorMessage.classList.add('hidden');
    tableBody.innerHTML = '';

    if (!leagueId) {
        loading.classList.add('hidden');
        return;
    }

    try {
        // Obter todas as equipas
        const { data: equipas, error: equipasError } = await supabase.from('equipas').select('*');
        if (equipasError) throw equipasError;
        allEquipas = equipas;

        // Obter todos os jogos
        const { data: jogos, error: jogosError } = await supabase.from('jogos').select('*');
        if (jogosError) throw jogosError;
        allJogos = jogos;

        const filteredJogos = allJogos.filter(jogo => String(jogo.liga_id) === String(leagueId));
        
        if (filteredJogos.length === 0) {
            loading.classList.add('hidden');
            standingsTable.classList.remove('hidden');
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Nenhum jogo encontrado para esta liga.</td></tr>';
            return;
        }

        const teamsInLeague = new Set();
        filteredJogos.forEach(jogo => {
            teamsInLeague.add(jogo.equipa_casa_id);
            teamsInLeague.add(jogo.equipa_fora_id);
        });

        const teamStats = {};
        allEquipas.forEach(equipa => {
            if (teamsInLeague.has(equipa.id)) {
                teamStats[equipa.id] = {
                    team: equipa.nome,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0
                };
            }
        });

        filteredJogos.forEach(jogo => {
            const homeTeamStats = teamStats[jogo.equipa_casa_id];
            const awayTeamStats = teamStats[jogo.equipa_fora_id];

            if (homeTeamStats && awayTeamStats) {
                homeTeamStats.played++;
                awayTeamStats.played++;

                homeTeamStats.goalsFor += jogo.resultado_casa;
                homeTeamStats.goalsAgainst += jogo.resultado_fora;

                awayTeamStats.goalsFor += jogo.resultado_fora;
                awayTeamStats.goalsAgainst += jogo.resultado_casa;

                if (jogo.resultado_casa > jogo.resultado_fora) {
                    homeTeamStats.won++;
                    awayTeamStats.lost++;
                    homeTeamStats.points += 3;
                } else if (jogo.resultado_casa < jogo.resultado_fora) {
                    awayTeamStats.won++;
                    homeTeamStats.lost++;
                    awayTeamStats.points += 3;
                } else {
                    homeTeamStats.drawn++;
                    awayTeamStats.drawn++;
                    homeTeamStats.points += 1;
                    awayTeamStats.points += 1;
                }
            }
        });

        const standings = Object.values(teamStats).sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            const goalDifferenceA = a.goalsFor - a.goalsAgainst;
            const goalDifferenceB = b.goalsFor - b.goalsAgainst;
            if (goalDifferenceB !== goalDifferenceA) {
                return goalDifferenceB - goalDifferenceA;
            }
            return b.goalsFor - a.goalsFor;
        });

// Renderizar a tabela
        standings.forEach((team, index) => {
            const row = document.createElement('tr');
            let rowClass = 'bg-white border-b hover:bg-gray-50 transition-colors duration-200';
            const goalDifference = team.goalsFor - team.goalsAgainst;

            // --- INÍCIO DA SECÇÃO DE DIAGNÓSTICO ---
            // Esta linha irá mostrar-nos os valores que estão a ser usados na condição
            console.log(`Equipa: ${team.team}, Index: ${index}, standings.length: ${standings.length}, Deve ser vermelho? ${index >= standings.length - 3}`);
            // --- FIM DA SECÇÃO DE DIAGNÓSTICO ---
            
            // Condição para as 3 primeiras posições (lugares de topo)
            if (index < 3) {
                rowClass += ' bg-blue-100 font-semibold';
            // Condição para as 3 últimas posições (zona de despromoção)
            } else if (index >= standings.length - 3) {
                rowClass += ' bg-orange-100 font-semibold';
            }

            row.className = rowClass;
            row.innerHTML = `
                <th scope="row" class="px-3 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${index + 1}</th>
                <td class="px-3 sm:px-6 py-4">${team.team}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${team.played}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${team.won}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${team.drawn}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${team.lost}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${team.goalsFor}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${team.goalsAgainst}</td>
                <td class="px-3 sm:px-6 py-4 text-center">${goalDifference > 0 ? '+' : ''}${goalDifference}</td>
                <td class="px-3 sm:px-6 py-4 text-center font-bold text-gray-900">${team.points}</td>
            `;
            tableBody.appendChild(row);
        });

        loading.classList.add('hidden');
        standingsTable.classList.remove('hidden');

    } catch (error) {
        console.error("Erro a carregar classificações:", error);
        loading.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', populateLeagueDropdown);
leagueSelect.addEventListener('change', (e) => {
    fetchAndRenderStandings(e.target.value);
});

// Chamar a função inicial para popular o dropdown
populateLeagueDropdown();