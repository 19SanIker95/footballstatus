import { supabase } from './supabaseClient.js';

// Elementos do DOM
const entityTypeSelect = document.getElementById('entityType');
const dynamicFormFields = document.getElementById('dynamicFormFields');
const dataForm = document.getElementById('dataForm');

// Elementos para o formulário de criação de ligas
const createLeagueForm = document.getElementById('createLeagueForm');
const leagueNameInput = document.getElementById('leagueName');
const leagueCountryInput = document.getElementById('leagueCountry');

let ligas = [];
let equipas = [];

// Função para carregar as ligas da base de dados e preencher o select
async function carregarLigas() {
    const { data, error } = await supabase
        .from('ligas')
        .select('id, nome')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao carregar ligas:', error);
        return;
    }
    
    ligas = data;
    renderizarFormulario();
}

// Carregar clubes e seleções para o dropdown de jogos
async function carregarEquipas() {
    const { data: clubes, error: clubesError } = await supabase
        .from('clubes')
        .select('nome, id');
    
    const { data: selecoes, error: selecoesError } = await supabase
        .from('selecoes')
        .select('pais, id');

    if (clubesError || selecoesError) {
        console.error('Erro ao carregar equipas:', clubesError || selecoesError);
        return;
    }
    
    const selecoesMapeadas = selecoes.map(s => ({ nome: s.pais, id: s.id }));
    equipas = [...clubes, ...selecoesMapeadas].sort((a, b) => a.nome.localeCompare(b.nome));
}

// Event listener para o formulário de criação de ligas
createLeagueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nomeLiga = leagueNameInput.value.trim();
    const paisLiga = leagueCountryInput.value.trim();

    if (!nomeLiga || !paisLiga) {
        alert('Por favor, preencha todos os campos da liga.');
        return;
    }
    
    const { data, error } = await supabase
        .from('ligas')
        .insert({ nome: nomeLiga, pais: paisLiga });

    if (error) {
        alert('Erro ao criar liga: ' + error.message);
        console.error('Erro de inserção:', error);
    } else {
        alert(`A liga "${nomeLiga}" foi criada com sucesso!`);
        leagueNameInput.value = '';
        leagueCountryInput.value = '';
        await carregarLigas();
    }
});

// Função para gerar os campos do formulário com base no tipo de entidade
function renderizarFormulario() {
    const tipo = entityTypeSelect.value;
    let html = '';

    if (tipo === 'clube' || tipo === 'selecao') {
        html += `
            <div class="mb-3">
                <label for="nome" class="form-label">${tipo === 'clube' ? 'Nome do Clube' : 'País da Seleção'}</label>
                <input type="text" class="form-control" id="nome" required>
            </div>
            <div class="mb-3">
                <label for="liga" class="form-label">Liga</label>
                <select class="form-select" id="liga" required>
                    <option value="" disabled selected>Selecione uma liga...</option>
                    ${ligas.map(liga => `<option value="${liga.id}">${liga.nome}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="epoca" class="form-label">Época</label>
                <input type="text" class="form-control" id="epoca" required placeholder="Ex: 2024/2025">
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="jogos" class="form-label">Jogos</label>
                    <input type="number" class="form-control" id="jogos" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="vitorias" class="form-label">Vitórias</label>
                    <input type="number" class="form-control" id="vitorias" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="empates" class="form-label">Empates</label>
                    <input type="number" class="form-control" id="empates" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="derrotas" class="form-label">Derrotas</label>
                    <input type="number" class="form-control" id="derrotas" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="golos_marcados" class="form-label">Golos Marcados</label>
                    <input type="number" class="form-control" id="golos_marcados" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="golos_sofridos" class="form-label">Golos Sofridos</label>
                    <input type="number" class="form-control" id="golos_sofridos" value="0" required>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="cantos_a_favor" class="form-label">Cantos a Favor</label>
                    <input type="number" class="form-control" id="cantos_a_favor" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="cantos_contra" class="form-label">Cantos Contra</label>
                    <input type="number" class="form-control" id="cantos_contra" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="posse_bola_a_favor" class="form-label">Posse de Bola (%)</label>
                    <input type="number" class="form-control" id="posse_bola_a_favor" value="0" step="0.01" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="posse_bola_contra" class="form-label">Posse de Bola Contra (%)</label>
                    <input type="number" class="form-control" id="posse_bola_contra" value="0" step="0.01" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="cartoes_amarelos" class="form-label">Cartões Amarelos</label>
                    <input type="number" class="form-control" id="cartoes_amarelos" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="cartoes_vermelhos" class="form-label">Cartões Vermelhos</label>
                    <input type="number" class="form-control" id="cartoes_vermelhos" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="remates_enquadrados_a_baliza" class="form-label">Remates à Baliza</label>
                    <input type="number" class="form-control" id="remates_enquadrados_a_baliza" value="0" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="total_de_passes" class="form-label">Total de Passes</label>
                    <input type="number" class="form-control" id="total_de_passes" value="0" required>
                </div>
            </div>
        `;

    } else if (tipo === 'jogo') {
    html += `
        <div class="mb-3">
            <label for="data" class="form-label">Data do Jogo</label>
            <input type="date" class="form-control" id="data" required>
        </div>
        <div class="mb-3">
            <label for="liga" class="form-label">Liga</label>
            <select class="form-select" id="liga" required>
                <option value="" disabled selected>Selecione uma liga...</option>
                ${ligas.map(liga => `<option value="${liga.id}">${liga.nome}</option>`).join('')}
            </select>
        </div>

        <hr>

        <div class="row">
            <!-- Equipa Analisada -->
            <div class="col-6">
                <div class="card p-3 h-100">
                    <h5 class="text-center">Equipa Analisada</h5>

                    <div class="mb-3">
                        <label for="equipa_analisada" class="form-label">Nome</label>
                        <select class="form-select" id="equipa_analisada" required>
                            <option value="" disabled selected>Selecione uma equipa...</option>
                            ${equipas.map(equipa => `<option value="${equipa.nome}">${equipa.nome}</option>`).join('')}
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="resultado_casa" class="form-label">Resultado</label>
                        <input type="number" class="form-control" id="resultado_casa" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="cantos_casa" class="form-label">Cantos</label>
                        <input type="number" class="form-control" id="cantos_casa" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="posse_bola_casa" class="form-label">Posse de Bola (%)</label>
                        <input type="number" class="form-control" id="posse_bola_casa" value="0" step="0.01" required>
                    </div>

                    <div class="mb-3">
                        <label for="cartoes_amarelos_casa" class="form-label">Cartões Amarelos</label>
                        <input type="number" class="form-control" id="cartoes_amarelos_casa" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="cartoes_vermelhos_casa" class="form-label">Cartões Vermelhos</label>
                        <input type="number" class="form-control" id="cartoes_vermelhos_casa" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="total_passes_casa" class="form-label">Total de Passes</label>
                        <input type="number" class="form-control" id="total_passes_casa" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="remates_enquadrados_a_baliza_casa" class="form-label">Remates à Baliza</label>
                        <input type="number" class="form-control" id="remates_enquadrados_a_baliza_casa" value="0" required>
                    </div>
                </div>
            </div>

            <!-- Equipa Adversária -->
            <div class="col-6">
                <div class="card p-3 h-100">
                    <h5 class="text-center">Equipa Adversária</h5>

                    <div class="mb-3">
                        <label for="equipa_fora" class="form-label">Nome</label>
                        <input type="text" class="form-control" id="equipa_fora" required>
                    </div>

                    <div class="mb-3">
                        <label for="resultado_fora" class="form-label">Resultado</label>
                        <input type="number" class="form-control" id="resultado_fora" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="cantos_fora" class="form-label">Cantos</label>
                        <input type="number" class="form-control" id="cantos_fora" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="posse_bola_fora" class="form-label">Posse de Bola (%)</label>
                        <input type="number" class="form-control" id="posse_bola_fora" value="0" step="0.01" required>
                    </div>

                    <div class="mb-3">
                        <label for="cartoes_amarelos_fora" class="form-label">Cartões Amarelos</label>
                        <input type="number" class="form-control" id="cartoes_amarelos_fora" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="cartoes_vermelhos_fora" class="form-label">Cartões Vermelhos</label>
                        <input type="number" class="form-control" id="cartoes_vermelhos_fora" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="total_passes_fora" class="form-label">Total de Passes</label>
                        <input type="number" class="form-control" id="total_passes_fora" value="0" required>
                    </div>

                    <div class="mb-3">
                        <label for="remates_enquadrados_a_baliza_fora" class="form-label">Remates à Baliza</label>
                        <input type="number" class="form-control" id="remates_enquadrados_a_baliza_fora" value="0" required>
                    </div>
                </div>
            </div>
        </div>
    `;
}

    
    dynamicFormFields.innerHTML = html;
}

// Função para lidar com o envio do formulário
dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo = entityTypeSelect.value;
    const data = {};
    
    const formElements = dynamicFormFields.querySelectorAll('input, select');
    formElements.forEach(element => {
        data[element.id] = element.value;
    });

    let tabela;
    let payload = {};
    let successMessage = '';
    
    if (tipo === 'clube' || tipo === 'selecao') {
        tabela = tipo === 'clube' ? 'clubes' : 'selecoes';
        payload = {
            nome: data.nome,
            liga_id: data.liga,
            epoca: data.epoca,
            jogos: parseInt(data.jogos),
            vitorias: parseInt(data.vitorias),
            empates: parseInt(data.empates),
            derrotas: parseInt(data.derrotas),
            golos_marcados: parseInt(data.golos_marcados),
            golos_sofridos: parseInt(data.golos_sofridos),
            cantos_a_favor: parseInt(data.cantos_a_favor),
            cantos_contra: parseInt(data.cantos_contra),
            posse_bola_a_favor: parseFloat(data.posse_bola_a_favor),
            posse_bola_contra: parseFloat(data.posse_bola_contra),
            cartoes_amarelos: parseInt(data.cartoes_amarelos),
            cartoes_vermelhos: parseInt(data.cartoes_vermelhos),
            remates_enquadrados_a_baliza: parseInt(data.remates_enquadrados_a_baliza),
            total_de_passes: parseInt(data.total_de_passes)
        };
        if (tipo === 'selecao') {
            payload.pais = payload.nome;
            delete payload.nome;
        }
        successMessage = `Dados de ${tipo} adicionados com sucesso!`;
        
    } else if (tipo === 'jogo') {
        tabela = 'jogos';
        payload = {
            data: data.data,
            liga_id: data.liga,
            equipa_casa: data.equipa_analisada,
            equipa_fora: data.equipa_fora,
            resultado_casa: parseInt(data.resultado_casa),
            resultado_fora: parseInt(data.resultado_fora),
            cantos_casa: parseInt(data.cantos_casa),
            cantos_fora: parseInt(data.cantos_fora),
            cartoes_amarelos_casa: parseInt(data.cartoes_amarelos_casa),
            cartoes_vermelhos_casa: parseInt(data.cartoes_vermelhos_casa),
            cartoes_amarelos_fora: parseInt(data.cartoes_amarelos_fora),
            cartoes_vermelhos_fora: parseInt(data.cartoes_vermelhos_fora),
            posse_bola_casa: parseFloat(data.posse_bola_casa),
            posse_bola_fora: parseFloat(data.posse_bola_fora),
            total_passes_casa: parseInt(data.total_passes_casa),
            total_passes_fora: parseInt(data.total_passes_fora),
            remates_enquadrados_a_baliza_casa: parseInt(data.remates_enquadrados_a_baliza_casa),
            remates_enquadrados_a_baliza_fora: parseInt(data.remates_enquadrados_a_baliza_fora)
        };
        successMessage = 'Dados de jogo adicionados com sucesso!';
    } else {
        alert('Por favor, selecione um tipo de entidade válido.');
        return;
    }
    
    const { error } = await supabase
        .from(tabela)
        .insert(payload);

    if (error) {
        alert('Erro ao inserir dados: ' + error.message);
        console.error('Erro de inserção:', error);
    } else {
        alert(successMessage);
        dataForm.reset();
        dynamicFormFields.innerHTML = '';
        await carregarLigas();
        await carregarEquipas();
    }
});

// Listener para a mudança de seleção do tipo de entidade
entityTypeSelect.addEventListener('change', renderizarFormulario);

// Inicializar a página carregando as ligas e equipas
document.addEventListener('DOMContentLoaded', async () => {
    await carregarLigas();
    await carregarEquipas();
});
