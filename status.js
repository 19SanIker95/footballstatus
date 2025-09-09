import { supabase } from './supabaseClient.js';

// Elementos do DOM
const teamMetricSelect = document.getElementById('team-metric-select');
const teamsSelect = document.getElementById('teams-select');
const teamPerformanceChartEl = document.getElementById('teamPerformanceChart');
const leagueGoalsChartEl = document.getElementById('leagueGoalsChart');

let allEquipas = [];
let allLigas = [];
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
    // Funções de renderização de gráficos desativadas
    renderTeamPerformanceChart();
    renderLeagueGoalsChart();
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
            alert("Você só pode selecionar até 5 equipas para comparação.");
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

function renderLeagueGoalsChart() {
    const dataByLeague = allLigas.map(liga => {
        const totalGols = liga.jogos.reduce((sum, jogo) => sum + jogo.resultado_casa + jogo.resultado_fora, 0);
        return {
            name: liga.nome,
            totalGols: totalGols
        };
    });

    const labels = dataByLeague.map(item => item.name);
    const data = dataByLeague.map(item => item.totalGols);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Total de Golos',
            data: data,
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    if (myCharts.leagueGoals) {
        myCharts.leagueGoals.destroy();
    }
    myCharts.leagueGoals = new Chart(leagueGoalsChartEl, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// Event Listeners
teamMetricSelect.addEventListener('change', renderTeamPerformanceChart);

// Inicialização
document.addEventListener('DOMContentLoaded', fetchData);
