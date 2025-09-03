// script.js

//import { supabase } from './supabaseClient.js';

// **ATENÇÃO:** Substitua estes valores pelos seus reais.
// Pode encontrá-los no painel do Supabase em "Project Settings" > "API".
const supabaseUrl = 'https://cbmwzkldgizpttmkkcsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibXd6a2xkZ2l6cHR0bWtrY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTkxMDAsImV4cCI6MjA3MjM5NTEwMH0.qk4gDHL0UQ9mvc6kdAN_g4071yz_WhJ8TCdR9HTD2vY';


const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Função para mostrar o formulário correto
function showForm() {
    const selected = document.getElementById('menu-select').value;
    document.querySelectorAll('.form-section').forEach(form => {
        form.style.display = 'none';
    });
    
    if (selected) {
        document.getElementById(`${selected}-form`).style.display = 'block';
    }
}


// NOVA FUNÇÃO: Carrega clubes e seleções para o menu suspenso
async function loadEquipas() {
    const { data: clubes, error: clubesError } = await supabase.from('clubes').select('nome');
    const { data: selecoes, error: selecoesError } = await supabase.from('selecoes').select('pais');

    if (clubesError) console.error("Erro a carregar clubes:", clubesError);
    if (selecoesError) console.error("Erro a carregar seleções:", selecoesError);

    const equipas = [
        ...(clubes?.map(c => c.nome) || []),
        ...(selecoes?.map(s => s.pais) || [])
    ];

    const selectElement = document.getElementById('equipa-analisada');
    selectElement.innerHTML = '<option value="">-- Selecione uma equipa --</option>';

    equipas.sort().forEach(equipa => {
        const option = document.createElement('option');
        option.value = equipa;
        option.textContent = equipa;
        selectElement.appendChild(option);
    });
}

function loadEquipas() {
    console.log("Função loadEquipas chamada!");
    return Promise.resolve(); // só para simular
}

window.loadEquipas = loadEquipas;
console.log("Função loadEquipas exposta no window");

// NOVA FUNÇÃO: Carrega os jogadores de uma equipa específica
async function loadJogadoresPorEquipa() {
    const equipaNome = document.getElementById('equipa-analisada').value;
    const selectMarcadores = document.getElementById('marcadores');
    selectMarcadores.innerHTML = ''; // Limpa a lista anterior

    if (!equipaNome) {
        return;
    }

    try {
        const { data: jogadores, error } = await supabase
            .from('jogadores')
            .select('nome')
            .eq('clube_selecao', equipaNome);

        if (error) throw error;

        jogadores.forEach(jogador => {
            const option = document.createElement('option');
            option.value = jogador.nome;
            option.textContent = jogador.nome;
            selectMarcadores.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar jogadores:', error.message);
    }
}

// Jogadores
async function saveJogador(event) {
    event.preventDefault();

    const nome = document.getElementById('jogador-nome').value;
    const posicaoCheckboxes = document.querySelectorAll('input[name="posicao"]:checked');
    const posicoes = Array.from(posicaoCheckboxes).map(cb => cb.value);
    const clubeSelecao = document.getElementById('clube-selecao').value;
    const dataNascimento = document.getElementById('data-nascimento').value;
    const nacionalidade = document.getElementById('nacionalidade').value;

    const playerData = {
        nome,
        posicao: posicoes.join(', '),
        clube_selecao: clubeSelecao,
        data_nascimento: dataNascimento,
        nacionalidade,
        jogos: 0,
        golos: 0,
        assistencias: 0,
        amarelos: 0,
        vermelhos: 0,
        media_gm: 0,
        media_gs: 0
    };

    const { data, error } = await supabase
        .from('clubes_selecoes')
        .insert([playerData])
        .select();

    if (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar jogador: ' + error.message);
    } else {
        alert('Jogador adicionado com sucesso!');
        event.target.reset();
    }
}

// Clubes
async function saveClube(event) {
    event.preventDefault();

    const liga = document.getElementById('liga').value;
    const nome = document.getElementById('clube-nome').value;
    const epoca = document.getElementById('clube-epoca').value;

    const clubeData = {
        liga,
        nome,
        epoca,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        gmarcados: 0,
        gsofridos: 0,
        dif_golos: 0,
        media_gm: 0,
        media_gs: 0,
        cantos_fav: 0,
        cantos_cont: 0
    };

    const { data, error } = await supabase
        .from('clubes')
        .insert([clubeData])
        .select();

    if (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar clube: ' + error.message);
    } else {
        alert('Clube adicionado com sucesso!');
        event.target.reset();
        await loadEquipas(); // Recarrega a lista para incluir o novo clube
    }
}

// Seleções
async function saveSelecao(event) {
    event.preventDefault();

    const pais = document.getElementById('pais').value;
    const torneio = document.getElementById('torneio').value;
    const epoca = document.getElementById('selecao-epoca').value;

    const selecaoData = {
        pais,
        torneio,
        epoca,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        gmarcados: 0,
        gsofridos: 0,
        dif_golos: 0,
        media_gm: 0,
        media_gs: 0,
        cantos_fav: 0,
        cantos_cont: 0
    };

    const { data, error } = await supabase
        .from('selecoes')
        .insert([selecaoData])
        .select();

    if (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar seleção: ' + error.message);
    } else {
        alert('Seleção adicionada com sucesso!');
        event.target.reset();
        await loadEquipas(); // Recarrega a lista para incluir a nova seleção
    }
}

// Jogos - Agora lê o valor do menu suspenso
async function saveJogo(event) {
    event.preventDefault();

    const data_jogo = document.getElementById('data-jogo').value;
    const equipa_analisada = document.getElementById('equipa-analisada').value;
    
    // Obtém os jogadores selecionados
    const marcadoresElement = document.getElementById('marcadores');
    const marcadores = Array.from(marcadoresElement.selectedOptions).map(option => option.value);

    const equipa_adversaria = document.getElementById('equipa-adversaria').value;
    const golo_equipa_analisada = parseInt(document.getElementById('golo-equipa-analisada').value);
    const golo_adversario = parseInt(document.getElementById('golo-adversario').value);
    const cantos_fav = parseInt(document.getElementById('cantos-fav').value);
    const cantos_cont = parseInt(document.getElementById('cantos-cont').value);
    
    let resultado;
    if (golo_equipa_analisada > golo_adversario) {
        resultado = 'Vitória';
    } else if (golo_equipa_analisada < golo_adversario) {
        resultado = 'Derrota';
    } else {
        resultado = 'Empate';
    }

    const jogoData = {
        data_jogo,
        equipa_analisada,
        equipa_adversaria,
        golo_equipa_analisada,
        golo_adversario,
        resultado,
        cantos_fav,
        cantos_cont,
        marcadores: marcadores.join(', ') // Salva os marcadores como uma string
    };

    const { data, error } = await supabase
        .from('jogos')
        .insert([jogoData])
        .select();

    if (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar jogo: ' + error.message);
    } else {
        alert('Jogo adicionado com sucesso!');
        event.target.reset();
        await loadJogadoresPorEquipa(); // Limpa a lista de jogadores após submeter
    }
}
// Event Listeners
document.querySelector('#clubes-form form').addEventListener('submit', saveClube);
document.querySelector('#selecoes-form form').addEventListener('submit', saveSelecao);
document.getElementById('jogadores-form').addEventListener('submit', saveJogador);
document.getElementById('jogos-form').addEventListener('submit', saveJogo); // NOVO Event Listener
//document.getElementById('menu-select').addEventListener('change', showForm);



// Adicionar event listeners quando o DOM estiver totalmente carregado
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu-select').addEventListener('change', showForm);
    document.getElementById('clubes-form').addEventListener('submit', saveClube);
    document.getElementById('selecoes-form').addEventListener('submit', saveSelecao);
    document.getElementById('jogadores-form').addEventListener('submit', saveJogador);
    document.getElementById('jogos-form').addEventListener('submit', saveJogo);
    
    document.getElementById('equipa-analisada').addEventListener('change', loadJogadoresPorEquipa);

    loadEquipas();
});
