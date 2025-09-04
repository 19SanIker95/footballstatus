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
        if (selected === 'clubes' || selected === 'selecoes') {
            loadLigas();
        }
        if (selected === 'jogadores') {
            loadClubesESelecoes();
        }
    }
}

// Carrega todas as equipas (clubes e seleções) no select de "Equipa Analisada"
async function loadEquipas() {
    const selectElement = document.getElementById('equipa-analisada');
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">-- Selecione uma equipa --</option>';

    try {
        const { data: clubes, error: clubesError } = await supabase.from('clubes').select('id, nome');
        if (clubesError) throw clubesError;

        const { data: selecoes, error: selecoesError } = await supabase.from('selecoes').select('id, pais');
        if (selecoesError) throw selecoesError;

        const equipas = [
            ...clubes.map(c => ({ id: c.id, nome: c.nome, tipo: 'clube' })),
            ...selecoes.map(s => ({ id: s.id, nome: s.pais, tipo: 'selecao' }))
        ];

        equipas.sort((a, b) => a.nome.localeCompare(b.nome));

        equipas.forEach(equipa => {
            const option = document.createElement('option');
            option.value = `${equipa.tipo}_${equipa.id}`;
            option.textContent = equipa.nome;
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar equipas:', error.message);
    }
}

// Carrega clubes e seleções nos selects do formulário de jogadores
async function loadClubesESelecoes() {
    try {
        const { data: clubes, error: clubesError } = await supabase.from('clubes').select('id, nome');
        if (clubesError) throw clubesError;
        const selectClube = document.getElementById('jogador-clube');
        selectClube.innerHTML = '<option value="">-- Selecione um clube --</option>';
        clubes.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(clube => {
            const option = document.createElement('option');
            option.value = clube.id;
            option.textContent = clube.nome;
            selectClube.appendChild(option);
        });

        const { data: selecoes, error: selecoesError } = await supabase.from('selecoes').select('id, pais');
        if (selecoesError) throw selecoesError;
        const selectSelecao = document.getElementById('jogador-selecao');
        selectSelecao.innerHTML = '<option value="">-- Selecione uma seleção --</option>';
        selecoes.sort((a, b) => a.pais.localeCompare(b.pais)).forEach(selecao => {
            const option = document.createElement('option');
            option.value = selecao.id;
            option.textContent = selecao.pais;
            selectSelecao.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clubes e seleções:', error.message);
    }
}

// Carrega todas as ligas nos selects de clubes e seleções
async function loadLigas() {
    try {
        const { data: ligas, error } = await supabase.from('ligas').select('id, nome');
        if (error) throw error;

        const selectClubeLiga = document.getElementById('clube-liga');
        const selectSelecaoLiga = document.getElementById('selecao-liga');
        if (selectClubeLiga) {
            selectClubeLiga.innerHTML = '<option value="">-- Selecione a liga --</option>';
            ligas.forEach(liga => {
                const option = document.createElement('option');
                option.value = liga.id;
                option.textContent = liga.nome;
                selectClubeLiga.appendChild(option);
            });
        }
        if (selectSelecaoLiga) {
            selectSelecaoLiga.innerHTML = '<option value="">-- Selecione a liga --</option>';
            ligas.forEach(liga => {
                const option = document.createElement('option');
                option.value = liga.id;
                option.textContent = liga.nome;
                selectSelecaoLiga.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar ligas:', error.message);
    }
}

// Carrega jogadores da equipa selecionada e cria inputs de golos
async function loadJogadoresPorEquipa() {
    const equipaAnalidadaId = document.getElementById('equipa-analisada').value;
    const inputsContainer = document.getElementById('marcadores-inputs');
    inputsContainer.innerHTML = '';

    if (!equipaAnalidadaId) return;

    const [tipo, id] = equipaAnalidadaId.split('_');

    try {
        let jogadores = [];
        if (tipo === 'clube') {
            const { data, error } = await supabase
                .from('jogadores')
                .select('id, nome, posicao')
                .eq('clubeid', parseInt(id));
            if (error) throw error;
            jogadores = data;
        } else if (tipo === 'selecao') {
            const { data, error } = await supabase
                .from('jogadores')
                .select('id, nome, posicao')
                .eq('selecaoid', parseInt(id));
            if (error) throw error;
            jogadores = data;
        }

        jogadores.forEach(jogador => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2';
            div.innerHTML = `
                <label class="w-1/2" for="golo_${jogador.id}">${jogador.nome}:</label>
                <input type="number" id="golo_${jogador.id}" name="golo_${jogador.id}" value="0" min="0" class="w-1/2 form-input border border-gray-300 rounded p-1">
            `;
            inputsContainer.appendChild(div);
        });

    } catch (error) {
        console.error('Erro ao carregar jogadores:', error.message);
    }
}

// Salvar Liga
async function saveLiga(event) {
    event.preventDefault();
    const nome = document.getElementById('liga-nome').value;
    const pais = document.getElementById('liga-pais').value;

    const { error } = await supabase.from('ligas').insert([{ nome, pais }]);
    if (error) {
        console.error('Erro ao adicionar liga:', error);
        alert('Erro ao adicionar liga: ' + error.message);
    } else {
        alert('Liga adicionada com sucesso!');
        event.target.reset();
        await loadLigas();
    }
}

// Salvar Jogador
async function saveJogador(event) {
    event.preventDefault();
    const nome = document.getElementById('jogador-nome').value;
    const posicaoCheckboxes = document.querySelectorAll('input[name="posicao"]:checked');
    const posicoes = Array.from(posicaoCheckboxes).map(cb => cb.value);
    const clubeid = document.getElementById('jogador-clube').value || null;
    const selecaoid = document.getElementById('jogador-selecao').value || null;
    const dataNascimento = document.getElementById('data-nascimento').value;
    const nacionalidade = document.getElementById('nacionalidade').value;

    const playerData = {
        nome,
        posicao: posicoes.join(', '),
        clubeid: clubeid ? parseInt(clubeid) : null,
        selecaoid: selecaoid ? parseInt(selecaoid) : null,
        data_nascimento: dataNascimento,
        nacionalidade,
        jogos: 0,
        golos: 0,
        assistencias: 0,
        amarelos: 0,
        vermelho: 0,
        minutos_jogados: 0,
        golos_sofridos: 0,
        media_gm: 0,
        media_a: 0,
        media_gs: 0
    };

    const { error } = await supabase.from('jogadores').insert([playerData]);
    if (error) {
        console.error('Erro ao adicionar jogador:', error);
        alert('Erro ao adicionar jogador: ' + error.message);
    } else {
        alert('Jogador adicionado com sucesso!');
        event.target.reset();
    }
}

// Salvar Clube + Estatísticas
async function saveClube(event) {
    event.preventDefault();
    const nome = document.getElementById('clube-nome').value;
    const ligaId = document.getElementById('clube-liga').value;
    const epoca = document.getElementById('clube-epoca').value;

    const { data: clubeCriado, error: clubeError } = await supabase.from('clubes').insert([{ nome }]).select();
    if (clubeError) {
        console.error('Erro ao adicionar clube:', clubeError);
        alert('Erro ao adicionar clube: ' + clubeError.message);
        return;
    }

    const estatisticasData = {
        clube_id: clubeCriado[0].id,
        liga_id: ligaId,
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

    const { error: statsError } = await supabase.from('estatisticas_clube').insert([estatisticasData]);
    if (statsError) {
        console.error('Erro ao adicionar estatísticas:', statsError);
        alert('Erro ao adicionar estatísticas do clube: ' + statsError.message);
    } else {
        alert('Clube e estatísticas adicionados com sucesso!');
        event.target.reset();
        await loadEquipas();
    }
}

// Salvar Seleção + Estatísticas
async function saveSelecao(event) {
    event.preventDefault();
    const pais = document.getElementById('selecao-pais').value;
    const ligaId = document.getElementById('selecao-liga').value;
    const epoca = document.getElementById('selecao-epoca').value;

    const { data: selecaoCriada, error: selecaoError } = await supabase.from('selecoes').insert([{ pais }]).select();
    if (selecaoError) {
        console.error('Erro ao adicionar seleção:', selecaoError);
        alert('Erro ao adicionar seleção: ' + selecaoError.message);
        return;
    }

    const estatisticasData = {
        selecao_id: selecaoCriada[0].id,
        liga_id: ligaId,
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

    const { error: statsError } = await supabase.from('estatisticas_selecao').insert([estatisticasData]);
    if (statsError) {
        console.error('Erro ao adicionar estatísticas:', statsError);
        alert('Erro ao adicionar estatísticas da Seleção: ' + statsError.message);
    } else {
        alert('Seleção e estatísticas adicionadas com sucesso!');
        event.target.reset();
        await loadEquipas();
    }
}

async function saveJogo(event) {
    event.preventDefault();

    const data_jogo = document.getElementById('data-jogo').value;
    const local = document.getElementById('local').value;
    const equipa_analisada_value = document.getElementById('equipa-analisada').value;

    const marcadoresInputs = document.querySelectorAll('#marcadores-inputs input');
    const marcadores = {};
    let totalGolosMarcados = 0;
    marcadoresInputs.forEach(input => {
        const jogadorId = parseInt(input.id.replace('golo_', ''));
        const golos = parseInt(input.value) || 0;
        if (golos > 0) {
            marcadores[jogadorId] = golos;
            totalGolosMarcados += golos;
        }
    });

    const equipa_adversaria = document.getElementById('equipa-adversaria').value;
    const golo_equipa_analisada = parseInt(document.getElementById('golo-equipa-analisada').value) || 0;
    const golo_adversario = parseInt(document.getElementById('golo-adversario').value) || 0;
    const cantos_fav = parseInt(document.getElementById('cantos-fav').value) || 0;
    const cantos_cont = parseInt(document.getElementById('cantos-cont').value) || 0;

    // Determinar resultado
    let resultado;
    if (golo_equipa_analisada > golo_adversario) resultado = 'Vitória';
    else if (golo_equipa_analisada < golo_adversario) resultado = 'Derrota';
    else resultado = 'Empate';

    // Separar tipo e id
    let clube_id = null;
    let selecao_id = null;
    let tipo_equipa = null;
    if (equipa_analisada_value) {
        [tipo_equipa, id] = equipa_analisada_value.split('_');
        if (tipo_equipa === 'clube') clube_id = parseInt(id);
        else if (tipo_equipa === 'selecao') selecao_id = parseInt(id);
    }

    const jogoData = {
        data_jogo,
        local,
        clube_id,
        selecao_id,
        equipa_adversaria,
        golo_equipa_analisada,
        golo_adversario,
        resultado,
        cantos_fav,
        cantos_cont,
        marcadores: JSON.stringify(marcadores)
    };

    try {
        // 1️⃣ Inserir o jogo
        const { error: jogoError } = await supabase.from('jogos').insert([jogoData]);
        if (jogoError) throw jogoError;

        // 2️⃣ Atualizar estatísticas dos jogadores
        for (const jogadorId in marcadores) {
            const golos = marcadores[jogadorId];
            const { data: jogadorAtual, error: jogadorError } = await supabase
                .from('jogadores')
                .select('*')
                .eq('id', jogadorId)
                .single();
            if (jogadorError) throw jogadorError;

            const novosJogos = (jogadorAtual.jogos || 0) + 1;
            const novosGolos = (jogadorAtual.golos || 0) + golos;
            const media_gm = (novosGolos / novosJogos).toFixed(2);

            const media_gs = jogadorAtual.posicao && jogadorAtual.posicao.includes('guarda-redes') && novosJogos > 0
                ? ((jogadorAtual.golos_sofridos || 0 + golo_adversario) / novosJogos).toFixed(2)
                : jogadorAtual.media_gs || 0;

            await supabase.from('jogadores').update({
                jogos: novosJogos,
                golos: novosGolos,
                media_gm,
                media_gs
            }).eq('id', jogadorId);
        }

        // 3️⃣ Atualizar estatísticas do clube ou seleção
        if (tipo_equipa === 'clube') {
            const { data: statsAtual, error: statsError } = await supabase
                .from('estatisticas_clube')
                .select('*')
                .eq('clube_id', clube_id)
                .single();
            if (statsError) throw statsError;

            const novosJogos = (statsAtual.jogos || 0) + 1;
            const novasVitorias = statsAtual.vitorias + (resultado === 'Vitória' ? 1 : 0);
            const novosEmpates = statsAtual.empates + (resultado === 'Empate' ? 1 : 0);
            const novasDerrotas = statsAtual.derrotas + (resultado === 'Derrota' ? 1 : 0);
            const novosGmarcados = (statsAtual.gmarcados || 0) + golo_equipa_analisada;
            const novosGsofridos = (statsAtual.gsofridos || 0) + golo_adversario;
            const dif_golos = novosGmarcados - novosGsofridos;
            const media_gm = (novosGmarcados / novosJogos).toFixed(2);
            const media_gs = (novosGsofridos / novosJogos).toFixed(2);

            await supabase.from('estatisticas_clube').update({
                jogos: novosJogos,
                vitorias: novasVitorias,
                empates: novosEmpates,
                derrotas: novasDerrotas,
                gmarcados: novosGmarcados,
                gsofridos: novosGsofridos,
                dif_golos,
                media_gm,
                media_gs,
                cantos_fav: (statsAtual.cantos_fav || 0) + cantos_fav,
                cantos_cont: (statsAtual.cantos_cont || 0) + cantos_cont
            }).eq('clube_id', clube_id);
        } else if (tipo_equipa === 'selecao') {
            const { data: statsAtual, error: statsError } = await supabase
                .from('estatisticas_selecao')
                .select('*')
                .eq('selecao_id', selecao_id)
                .single();
            if (statsError) throw statsError;

            const novosJogos = (statsAtual.jogos || 0) + 1;
            const novasVitorias = statsAtual.vitorias + (resultado === 'Vitória' ? 1 : 0);
            const novosEmpates = statsAtual.empates + (resultado === 'Empate' ? 1 : 0);
            const novasDerrotas = statsAtual.derrotas + (resultado === 'Derrota' ? 1 : 0);
            const novosGmarcados = (statsAtual.gmarcados || 0) + golo_equipa_analisada;
            const novosGsofridos = (statsAtual.gsofridos || 0) + golo_adversario;
            const dif_golos = novosGmarcados - novosGsofridos;
            const media_gm = (novosGmarcados / novosJogos).toFixed(2);
            const media_gs = (novosGsofridos / novosJogos).toFixed(2);

            await supabase.from('estatisticas_selecao').update({
                jogos: novosJogos,
                vitorias: novasVitorias,
                empates: novosEmpates,
                derrotas: novasDerrotas,
                gmarcados: novosGmarcados,
                gsofridos: novosGsofridos,
                dif_golos,
                media_gm,
                media_gs,
                cantos_fav: (statsAtual.cantos_fav || 0) + cantos_fav,
                cantos_cont: (statsAtual.cantos_cont || 0) + cantos_cont
            }).eq('selecao_id', selecao_id);
        }

        alert('Jogo e estatísticas atualizados com sucesso!');
        event.target.reset();
        await loadEquipas(); // Atualiza o select de equipas
        document.getElementById('marcadores-inputs').innerHTML = ''; // Limpa inputs de jogadores
    } catch (error) {
        console.error('Erro ao adicionar jogo:', error);
        alert('Erro ao adicionar jogo: ' + error.message);
    }
}

// Expor loadEquipas globalmente
window.loadEquipas = loadEquipas;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu-select').addEventListener('change', showForm);
    document.getElementById('clube-form-id').addEventListener('submit', saveClube);
    document.getElementById('liga-form-id').addEventListener('submit', saveLiga);
    document.getElementById('selecao-form-id').addEventListener('submit', saveSelecao);
    document.getElementById('jogador-form-id').addEventListener('submit', saveJogador);
    document.getElementById('jogos-form-id').addEventListener('submit', saveJogo);
    
    document.getElementById('equipa-analisada').addEventListener('change', loadJogadoresPorEquipa);

    loadLigas();
    loadEquipas();
    loadClubesESelecoes();
});
