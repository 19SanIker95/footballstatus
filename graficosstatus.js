import { supabase } from './supabaseClient.js';

// Elementos do DOM
const clubesMetricSelect = document.getElementById('clubesMetricSelect');
const clubesClubeSelect = document.getElementById('clubesClubeSelect');
const selecoesMetricSelect = document.getElementById('selecoesMetricSelect');
const selecoesPaisSelect = document.getElementById('selecoesPaisSelect');
// Elementos de filtro para Ligas
const ligasMetricSelect = document.getElementById('ligasMetricSelect');
const ligasEpocaSelect = document.getElementById('ligasEpocaSelect');
const ligasChartTypeSelect = document.getElementById('ligasChartTypeSelect');


let allData = {
    clubes: [],
    selecoes: [],
    ligas: []
};
let uniqueEpocas = [];
let myCharts = {}; // Para armazenar as instâncias dos gráficos

const metricas = [
    { value: 'jogos', label: 'Jogos' },
    { value: 'vitorias', label: 'Vitórias' },
    { value: 'empates', label: 'Empates' },
    { value: 'derrotas', label: 'Derrotas' },
    { value: 'golos_marcados', label: 'Golos Marcados' },
    { value: 'golos_sofridos', label: 'Golos Sofridos' },
    { value: 'remates_enquadrados_a_baliza', label: 'Remates à Baliza' },
    { value: 'cantos_a_favor', label: 'Cantos a Favor' },
    { value: 'cantos_contra', label: 'Cantos Contra' },
    { value: 'posse_bola_a_favor', label: 'Posse de Bola a Favor' },
    { value: 'posse_bola_contra', label: 'Posse de Bola Contra' },
    { value: 'total_de_passes', label: 'Total de Passes' },
    { value: 'cartoes_amarelos', label: 'Cartões Amarelos' },
    { value: 'cartoes_vermelhos', label: 'Cartões Vermelhos' },
];

// Funções para carregar dados
async function carregarEpocas() {
    const { data: clubes, error: clubesError } = await supabase.from('clubes').select('epoca').order('epoca', { ascending: false });
    const { data: selecoes, error: selecoesError } = await supabase.from('selecoes').select('epoca').order('epoca', { ascending: false });
    
    if (clubesError || selecoesError) {
        console.error('Erro ao carregar épocas:', clubesError || selecoesError);
        return;
    }

    const epocas = new Set([...clubes.map(c => c.epoca), ...selecoes.map(s => s.epoca)]);
    uniqueEpocas = Array.from(epocas);
}

async function carregarDadosLigas(epoca, metrica) {
    const { data: ligas, error } = await supabase.from('ligas').select('id, nome');
    if (error) {
        console.error('Erro ao carregar ligas:', error);
        return [];
    }

    const ligasData = [];
    for (const liga of ligas) {
        let query = supabase.from('jogos').select(`*, liga_id`);
        if (epoca) {
            query = query.eq('epoca', epoca);
        }
        
        const { data: jogos, error: jogosError } = await query.eq('liga_id', liga.id);

        if (jogosError) {
            console.error(`Erro ao buscar jogos para a liga ${liga.nome}:`, jogosError);
            continue;
        }

        let valorTotal = 0;
        // Agrega a métrica selecionada
        if (metrica === 'jogos') {
            valorTotal = jogos.length;
        } else {
            valorTotal = jogos.reduce((total, jogo) => {
                const valorCasa = jogo[metrica + '_casa'] || 0;
                const valorFora = jogo[metrica + '_fora'] || 0;
                
                return total + valorCasa + valorFora;
            }, 0);
        }
        
        ligasData.push({ nome: liga.nome, valor: valorTotal });
    }
    
    return ligasData;
}

// Funções para renderizar gráficos
function renderizarClubesChart() {
    const metrica = clubesMetricSelect.value;
    const clubeSelecionado = clubesClubeSelect.value;
    
    let clubes = allData.clubes.filter(c => {
        const isClubeMatch = !clubeSelecionado || c.id === clubeSelecionado;
        return isClubeMatch;
    });

    let labels = [];
    let data = [];
    
    if (clubeSelecionado) {
        const clube = clubes.find(c => c.id === clubeSelecionado);
        if (clube) {
            labels = [clube.nome];
            data = [clube[metrica]];
        }
    } else {
        clubes.sort((a,b) => b[metrica] - a[metrica]);
        const topClubes = clubes.slice(0, 10);
        labels = topClubes.map(clube => clube.nome);
        data = topClubes.map(clube => clube[metrica]);
    }

    const metricaLabel = metricas.find(m => m.value === metrica)?.label || 'Valor';
    const chartTitle = clubeSelecionado ? metricaLabel : `Top 10 por ${metricaLabel}`;

    const ctx = document.getElementById('clubesChart').getContext('2d');
    if (myCharts.clubesChart) {
        myCharts.clubesChart.destroy();
    }
    myCharts.clubesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartTitle,
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderizarSelecoesChart() {
    const metrica = selecoesMetricSelect.value;
    const paisSelecionado = selecoesPaisSelect.value;

    let selecoes = allData.selecoes.filter(s => {
        const isPaisMatch = !paisSelecionado || s.id === paisSelecionado;
        return isPaisMatch;
    });

    let labels = [];
    let data = [];
    
    if (paisSelecionado) {
        const selecao = selecoes.find(s => s.id === paisSelecionado);
        if (selecao) {
            labels = [selecao.pais];
            data = [selecao[metrica]];
        }
    } else {
        selecoes.sort((a,b) => b[metrica] - a[metrica]);
        const topSelecoes = selecoes.slice(0, 10);
        labels = topSelecoes.map(selecao => selecao.pais);
        data = topSelecoes.map(selecao => selecao[metrica]);
    }

    const metricaLabel = metricas.find(m => m.value === metrica)?.label || 'Valor';
    const chartTitle = paisSelecionado ? metricaLabel : `Top 10 por ${metricaLabel}`;

    const ctx = document.getElementById('selecoesChart').getContext('2d');
    if (myCharts.selecoesChart) {
        myCharts.selecoesChart.destroy();
    }
    myCharts.selecoesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartTitle,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Função de renderização para o gráfico de ligas
async function renderizarLigasChart() {
    const epoca = ligasEpocaSelect.value;
    const metrica = ligasMetricSelect.value;
    const chartType = ligasChartTypeSelect.value;

    const ligasData = await carregarDadosLigas(epoca, metrica);
    const labels = ligasData.map(liga => liga.nome);
    const data = ligasData.map(liga => liga.valor);
    const metricaLabel = metricas.find(m => m.value === metrica)?.label || 'Jogos';

    const ctx = document.getElementById('ligasChart').getContext('2d');
    if (myCharts.ligasChart) {
        myCharts.ligasChart.destroy();
    }
    myCharts.ligasChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: metricaLabel,
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(199, 199, 199, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function popularFiltros() {
    // Popula o filtro de época (apenas para ligas)
    const epocaHtml = `<option value="">Todas as Épocas</option>` + uniqueEpocas.map(e => `<option value="${e}">${e}</option>`).join('');
    ligasEpocaSelect.innerHTML = epocaHtml;

    // Popula o filtro de clubes
    const clubesHtml = `<option value="">Todos os Clubes</option>` + allData.clubes.map(c => `<option value="${c.id}">${c.nome} (${c.epoca})</option>`).join('');
    clubesClubeSelect.innerHTML = clubesHtml;
    
    // Popula o filtro de seleções
    const selecoesHtml = `<option value="">Todas as Seleções</option>` + allData.selecoes.map(s => `<option value="${s.id}">${s.pais} (${s.epoca})</option>`).join('');
    selecoesPaisSelect.innerHTML = selecoesHtml;

    // Popula o filtro de métricas
    const metricaHtml = metricas.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
    clubesMetricSelect.innerHTML = metricaHtml;
    selecoesMetricSelect.innerHTML = metricaHtml;
    ligasMetricSelect.innerHTML = metricaHtml;
}

// Event Listeners
clubesMetricSelect.addEventListener('change', renderizarClubesChart);
clubesClubeSelect.addEventListener('change', renderizarClubesChart);
selecoesMetricSelect.addEventListener('change', renderizarSelecoesChart);
selecoesPaisSelect.addEventListener('change', renderizarSelecoesChart);
// Event Listeners para o gráfico de ligas
ligasMetricSelect.addEventListener('change', renderizarLigasChart);
ligasEpocaSelect.addEventListener('change', renderizarLigasChart);
ligasChartTypeSelect.addEventListener('change', renderizarLigasChart);


// Inicializar a página
document.addEventListener('DOMContentLoaded', async () => {
    await carregarEpocas();
    
    // Carregar todos os dados e armazenar
    const [clubes, selecoes] = await Promise.all([
        supabase.from('clubes').select('*'),
        supabase.from('selecoes').select('*'),
    ]);
    
    allData.clubes = clubes.data || [];
    allData.selecoes = selecoes.data || [];

    popularFiltros();
    
    // Renderizar os gráficos iniciais
    if (allData.clubes.length > 0) renderizarClubesChart();
    if (allData.selecoes.length > 0) renderizarSelecoesChart();
    renderizarLigasChart(); // Renderiza o gráfico de ligas com os valores padrão
});