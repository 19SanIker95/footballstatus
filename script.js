// script.js

//import { supabase } from './supabaseClient.js';

// **ATENÇÃO:** Substitua estes valores pelos seus reais.
// Pode encontrá-los no painel do Supabase em "Project Settings" > "API".
const supabaseUrl = 'https://cbmwzkldgizpttmkkcsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibXd6a2xkZ2l6cHR0bWtrY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTkxMDAsImV4cCI6MjA3MjM5NTEwMH0.qk4gDHL0UQ9mvc6kdAN_g4071yz_WhJ8TCdR9HTD2vY';


const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

function showForm() {
    const selected = document.getElementById('menu-select').value;
    document.querySelectorAll('.form-section').forEach(form => {
        form.style.display = 'none';
    });
    
    if (selected) {
        document.getElementById(`${selected}-form`).style.display = 'block';
    }
}

async function loadEquipas() {
    try {
        const { data: clubes, error: clubesError } = await supabase.from('clubes').select('nome');
        if (clubesError) throw clubesError;

        const { data: selecoes, error: selecoesError } = await supabase.from('selecoes').select('pais');
        if (selecoesError) throw selecoesError;
        
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

    } catch (error) {
        console.error('Erro ao carregar equipas:', error.message);
    }
}

async function loadJogadoresPorEquipa() {
    const equipaNome = document.getElementById('equipa-analisada').value;
    const inputsContainer = document.getElementById('marcadores-inputs');
    inputsContainer.innerHTML = '';

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
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2';
            div.innerHTML = `
                <label class="w-1/2">${jogador.nome}:</label>
                <input type="number" name="golo_${jogador.nome.replace(/\s/g, '_')}" value="0" min="0" class="w-1/2 form-input border border-gray-300 rounded p-1">
            `;
            inputsContainer.appendChild(div);
        });

    } catch (error) {
        console.error('Erro ao carregar jogadores:', error.message);
    }
}

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
        vermelho: 0,
        media_gm: 0,
        media_gs: 0
    };

    const { data, error } = await supabase
        .from('jogadores')
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
        await loadEquipas();
    }
}

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
        await loadEquipas();
    }
}

async function saveJogo(event) {
    event.preventDefault();

    const data_jogo = document.getElementById('data-jogo').value;
    const local = document.getElementById('local').value;
    const equipa_analisada = document.getElementById('equipa-analisada').value;
    
    const marcadoresInputs = document.querySelectorAll('#marcadores-inputs input');
    const marcadores = {};
    let totalGolosMarcados = 0;
    marcadoresInputs.forEach(input => {
        const nomeJogador = input.name.replace('golo_', '').replace(/_/g, ' ');
        const golos = parseInt(input.value);
        if (golos > 0) {
            marcadores[nomeJogador] = golos;
            totalGolosMarcados += golos;
        }
    });

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
        local,
        equipa_analisada,
        equipa_adversaria,
        golo_equipa_analisada,
        golo_adversario,
        resultado,
        cantos_fav,
        cantos_cont,
        marcadores: JSON.stringify(marcadores)
    };

    try {
        const { error: jogoError } = await supabase
            .from('jogos')
            .insert([jogoData]);
        if (jogoError) throw jogoError;

        let tableToUpdate = equipa_analisada.includes(' ') ? 'clubes' : 'selecoes';
        let keyColumn = tableToUpdate === 'clubes' ? 'nome' : 'pais';

        const { data: currentEquipa, error: equipaError } = await supabase
            .from(tableToUpdate)
            .select('*')
            .eq(keyColumn, equipa_analisada)
            .single();
        if (equipaError) throw equipaError;

        const updatedEquipaData = {
            jogos: currentEquipa.jogos + 1,
            vitorias: currentEquipa.vitorias + (resultado === 'Vitória' ? 1 : 0),
            empates: currentEquipa.empates + (resultado === 'Empate' ? 1 : 0),
            derrotas: currentEquipa.derrotas + (resultado === 'Derrota' ? 1 : 0),
            gmarcados: currentEquipa.gmarcados + golo_equipa_analisada,
            gsofridos: currentEquipa.gsofridos + golo_adversario,
            dif_golos: currentEquipa.dif_golos + (golo_equipa_analisada - golo_adversario),
            cantos_fav: currentEquipa.cantos_fav + cantos_fav,
            cantos_cont: currentEquipa.cantos_cont + cantos_cont
        };

        // Adicionada a verificação para evitar divisão por zero
        if (updatedEquipaData.jogos > 0) {
            updatedEquipaData.media_gm = updatedEquipaData.gmarcados / updatedEquipaData.jogos;
            updatedEquipaData.media_gs = updatedEquipaData.gsofridos / updatedEquipaData.jogos;
        }

        const { error: updateEquipaError } = await supabase
            .from(tableToUpdate)
            .update(updatedEquipaData)
            .eq(keyColumn, equipa_analisada);
        if (updateEquipaError) throw updateEquipaError;

        for (const [nomeJogador, golosMarcados] of Object.entries(marcadores)) {
            const { data: currentPlayer, error: playerError } = await supabase
                .from('jogadores')
                .select('*')
                .eq('nome', nomeJogador)
                .single();
            if (playerError) throw playerError;

            const updatedPlayerData = {
                jogos: currentPlayer.jogos + 1,
                golos: currentPlayer.golos + golosMarcados
            };

            // Adicionada a verificação para evitar divisão por zero
            if (updatedPlayerData.jogos > 0) {
                updatedPlayerData.media_gm = updatedPlayerData.golos / updatedPlayerData.jogos;
            }

            const { error: updatePlayerError } = await supabase
                .from('jogadores')
                .update(updatedPlayerData)
                .eq('nome', nomeJogador);
            if (updatePlayerError) throw updatePlayerError;
        }

        alert('Jogo adicionado e estatísticas atualizadas com sucesso!');
        event.target.reset();
        loadJogadoresPorEquipa();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar jogo ou atualizar estatísticas: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu-select').addEventListener('change', showForm);
    document.getElementById('clubes-form').addEventListener('submit', saveClube);
    document.getElementById('selecoes-form').addEventListener('submit', saveSelecao);
    document.getElementById('jogadores-form').addEventListener('submit', saveJogador);
    document.getElementById('jogos-form').addEventListener('submit', saveJogo);
    
    document.getElementById('equipa-analisada').addEventListener('change', loadJogadoresPorEquipa);

    loadEquipas();
});