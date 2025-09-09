import { supabase } from './supabaseClient.js';

// Elementos do DOM
const teamMetricSelect = document.getElementById('team-metric-select');
const teamsSelect = document.getElementById('teams-select');
const teamPerformanceChartEl = document.getElementById('teamPerformanceChart');
const leagueGoalsChartEl = document.getElementById('leagueGoalsChart');

let allEquipas = [];
let allLigas = [];
// Objeto para armazenar as instâncias dos gráficos
let myCharts = {};

const metricasEquipas = [
    { value: 'total_vitorias', label: 'Vitórias' },
    { value: 'total_derrotas', label: 'Derrotas' },
    { value: 'total_golos_marcados', label: 'Golos Marcados' },
    { value: 'total_golos_sofridos', label: 'Golos Sofridos' },
    { value: 'total_posse_bola', label: 'Posse de Bola (Total)' },
];

async function fetchData() {
    const { data: equipasData, error: equipasError } = await supabase.from('equipas').select('*');
    if (equipasError) {
        console.error('Erro ao buscar equipas:', equipasError);
        return;
    }
    allEquipas = equipasData;

    const { data: ligasData, error: ligasError } = await supabase.from('ligas').select('*, jogos(resultado_casa, resultado_fora)');
    if (ligasError) {
        console.error('Erro ao buscar ligas:', ligasError);
        return;
    }
    allLigas = ligasData;

    populateDropdowns();
    renderTeamPerformanceChart();
    renderAverageGoalsChart();
}

function populateDropdowns() {
    // Popula métricas
    teamMetricSelect.innerHTML = metricasEquipas.map(m => `<option value="${m.value}">${m.label}</option>`).join('');

    // Popula equipas (com limite de 5 selecionáveis)
    teamsSelect.innerHTML = allEquipas.map(equipa => `<option value="${equipa.id}">${equipa.nome}</option>`).join('');
    
    // Adicionar funcionalidade para limitar a 5 seleções
    teamsSelect.addEventListener('change', () => {
        const selectedOptions = Array.from(teamsSelect.selectedOptions);
        if (selectedOptions.length > 5) {
            // Utilizar uma forma de notificação sem o alert()
            console.warn("Você só pode selecionar até 5 equipas para comparação.");
            selectedOptions[selectedOptions.length - 1].selected = false;
        }
        renderTeamPerformanceChart();
    });
}

function renderTeamPerformanceChart() {
    const selectedMetric = teamMetricSelect.value;
    const selectedTeamIds = Array.from(teamsSelect.selectedOptions).map(option => option.value);

    const dataToChart = allEquipas.filter(equipa => selectedTeamIds.includes(equipa.id));
    const labels = dataToChart.map(equipa => equipa.nome);
    const data = dataToChart.map(equipa => equipa[selectedMetric]);
    const metricLabel = metricasEquipas.find(m => m.value === selectedMetric)?.label;
    
    const chartData = {
        labels: labels,
        datasets: [{
            label: metricLabel,
            data: data,
            backgroundColor: 'rgba(52, 211, 153, 0.8)',
            borderColor: 'rgba(52, 211, 153, 1)',
            borderWidth: 1
        }]
    };

    if (myCharts.teamPerformance) {
        myCharts.teamPerformance.destroy();
    }
    myCharts.teamPerformance = new Chart(teamPerformanceChartEl, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderAverageGoalsChart() {
    const dataByLeague = allLigas.map(liga => {
        const totalGoals = liga.jogos.reduce((sum, jogo) => sum + jogo.resultado_casa + jogo.resultado_fora, 0);
        const totalGames = liga.jogos.length;
        const averageGoals = totalGames > 0 ? (totalGoals / totalGames).toFixed(2) : 0;
        return {
            name: liga.nome,
            averageGoals: parseFloat(averageGoals)
        };
    });

    const labels = dataByLeague.map(item => item.name);
    const data = dataByLeague.map(item => item.averageGoals);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Média de Golos por Jogo',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };
    
    if (myCharts.leagueGoals) {
        myCharts.leagueGoals.destroy();
    }
    myCharts.leagueGoals = new Chart(leagueGoalsChartEl, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Event Listeners
teamMetricSelect.addEventListener('change', renderTeamPerformanceChart);

// Inicialização
document.addEventListener('DOMContentLoaded', fetchData);
