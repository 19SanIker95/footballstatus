import { supabase } from './supabaseClient.js';

// Elementos do DOM
const filterTypeSelect = document.getElementById('filterType');
const searchQueryInput = document.getElementById('searchQuery');
const sortOrderSelect = document.getElementById('sortOrder');
const applyFiltersBtn = document.getElementById('applyFilters');
const entityListingsDiv = document.getElementById('entityListings');
// Elementos do modal de detalhes
const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
const detailsModalLabel = document.getElementById('detailsModalLabel');
const detailsModalBody = document.getElementById('detailsModalBody');
// Elementos do modal de edição
const editModal = new bootstrap.Modal(document.getElementById('editModal'));
const editModalLabel = document.getElementById('editModalLabel');
const editFormBody = document.getElementById('editFormBody');
const editIdInput = document.getElementById('editId');
const editTypeInput = document.getElementById('editType');
const editForm = document.getElementById('editForm');


let allData = {
    clubes: [],
    selecoes: [],
    jogos: []
};
let ligas = [];

// Funções de Carregamento de Dados
// ------------------------------
async function carregarLigas() {
    const { data, error } = await supabase.from('ligas').select('id, nome');
    if (error) {
        console.error('Erro ao carregar ligas:', error);
        return;
    }
    ligas = data;
}

async function carregarClubes() {
    const { data, error } = await supabase.from('clubes').select('*, ligas(nome)');
    if (error) {
        console.error('Erro ao carregar clubes:', error);
        return;
    }
    allData.clubes = data;
}

async function carregarSelecoes() {
    const { data, error } = await supabase.from('selecoes').select('*, ligas(nome)');
    if (error) {
        console.error('Erro ao carregar selecoes:', error);
        return;
    }
    allData.selecoes = data;
}

async function carregarJogos() {
    const { data, error } = await supabase.from('jogos').select('*, ligas(nome)');
    if (error) {
        console.error('Erro ao carregar jogos:', error);
        return;
    }
    allData.jogos = data;
}

// Funções de Renderização e Lógica de UI
// -------------------------------------
function renderizarListagem(dados, tipo) {
    let html = '';
    
    if (tipo === "") {
        html = `<p class="text-center text-muted mt-5">Por favor, selecione um tipo para visualizar os dados.</p>`;
    } else if (dados.length === 0) {
        html = `<p class="text-center text-muted mt-5">Nenhum registo encontrado.</p>`;
    } else {
        html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover mt-4">
                    <thead class="table-dark">
                        <tr>
                            <th>${tipo === 'clubes' ? 'Clube' : tipo === 'selecoes' ? 'País' : 'Data'}</th>
                            <th>Liga</th>
                            ${tipo === 'jogos' ? '<th>Equipa Casa</th><th>Equipa Fora</th><th>Resultado</th>' : '<th>Jogos</th><th>Vitórias</th><th>Golos Marcados</th>'}
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(item => {
                            if (tipo === 'jogos') {
                                return `
                                    <tr>
                                        <td>${item.data}</td>
                                        <td>${item.ligas?.nome || 'N/A'}</td>
                                        <td>${item.equipa_casa}</td>
                                        <td>${item.equipa_fora}</td>
                                        <td>${item.resultado_casa} - ${item.resultado_fora}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info btn-detalhes" data-id="${item.id}" data-type="${tipo}">Detalhes</button>
                                            <button class="btn btn-sm btn-warning btn-editar" data-id="${item.id}" data-type="${tipo}">Editar</button>
                                            <button class="btn btn-sm btn-danger btn-excluir" data-id="${item.id}" data-type="${tipo}">Excluir</button>
                                        </td>
                                    </tr>
                                `;
                            } else {
                                return `
                                    <tr>
                                        <td>${tipo === 'clubes' ? item.nome : item.pais}</td>
                                        <td>${item.ligas?.nome || 'N/A'}</td>
                                        <td>${item.jogos}</td>
                                        <td>${item.vitorias}</td>
                                        <td>${item.golos_marcados}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info btn-detalhes" data-id="${item.id}" data-type="${tipo}">Detalhes</button>
                                            <button class="btn btn-sm btn-warning btn-editar" data-id="${item.id}" data-type="${tipo}">Editar</button>
                                            <button class="btn btn-sm btn-danger btn-excluir" data-id="${item.id}" data-type="${tipo}">Excluir</button>
                                        </td>
                                    </tr>
                                `;
                            }
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    entityListingsDiv.innerHTML = html;
}

function filtrarEOrdenarDados() {
    const tipo = filterTypeSelect.value;
    const query = searchQueryInput.value.toLowerCase();
    const ordem = sortOrderSelect.value;
    
    if (tipo === "") {
        renderizarListagem([], "");
        return;
    }

    let dadosFiltrados = [];
    if (tipo === 'clubes') {
        dadosFiltrados = allData.clubes;
    } else if (tipo === 'selecoes') {
        dadosFiltrados = allData.selecoes;
    } else if (tipo === 'jogos') {
        dadosFiltrados = allData.jogos;
    }
    
    dadosFiltrados = dadosFiltrados.filter(item => {
        const nome = item.nome ? item.nome.toLowerCase() : '';
        const pais = item.pais ? item.pais.toLowerCase() : '';
        const liga = item.ligas?.nome ? item.ligas.nome.toLowerCase() : '';
        const epoca = item.epoca ? item.epoca.toLowerCase() : '';
        const equipaCasa = item.equipa_casa ? item.equipa_casa.toLowerCase() : '';
        const equipaFora = item.equipa_fora ? item.equipa_fora.toLowerCase() : '';

        return nome.includes(query) || pais.includes(query) || liga.includes(query) || epoca.includes(query) || equipaCasa.includes(query) || equipaFora.includes(query);
    });

    if (ordem === 'az') {
        dadosFiltrados.sort((a, b) => {
            const nomeA = a.nome || a.pais || a.data || '';
            const nomeB = b.nome || b.pais || b.data || '';
            return nomeA.localeCompare(nomeB);
        });
    } else if (ordem === 'za') {
        dadosFiltrados.sort((a, b) => {
            const nomeA = a.nome || a.pais || a.data || '';
            const nomeB = b.nome || b.pais || b.data || '';
            return nomeB.localeCompare(nomeA);
        });
    }

    renderizarListagem(dadosFiltrados, tipo);
}


// Funções de Ação (Detalhes, Editar, Excluir)
// -----------------------------------------
async function mostrarDetalhes(id, tipo) {
    let tabela = tipo;
    let titulo = '';
    let html = '';
    
    const { data: item, error } = await supabase.from(tabela).select('*, ligas(nome)').eq('id', id).single();
    
    if (error || !item) {
        detailsModalLabel.textContent = 'Erro';
        detailsModalBody.innerHTML = `<p class="text-danger">Erro ao carregar os detalhes do registo.</p>`;
        detailsModal.show();
        console.error('Erro ao buscar detalhes:', error);
        return;
    }
    
    if (tipo === 'clubes') {
        titulo = `Detalhes do Clube: ${item.nome}`;
        html = `
            <h5>Informação Geral</h5>
            <ul>
                <li><strong>Liga:</strong> ${item.ligas.nome}</li>
                <li><strong>Época:</strong> ${item.epoca}</li>
                <li><strong>Jogos:</strong> ${item.jogos}</li>
                <li><strong>Vitórias:</strong> ${item.vitorias}</li>
                <li><strong>Empates:</strong> ${item.empates}</li>
                <li><strong>Derrotas:</strong> ${item.derrotas}</li>
            </ul>
            <hr>
            <h5>Estatísticas Ofensivas</h5>
            <ul>
                <li><strong>Golos Marcados:</strong> ${item.golos_marcados}</li>
                <li><strong>Golos Sofridos:</strong> ${item.golos_sofridos}</li>
                <li><strong>Remates à Baliza:</strong> ${item.remates_enquadrados_a_baliza}</li>
            </ul>
            <hr>
            <h5>Estatísticas de Jogo</h5>
            <ul>
                <li><strong>Cantos a Favor:</strong> ${item.cantos_a_favor}</li>
                <li><strong>Cantos Contra:</strong> ${item.cantos_contra}</li>
                <li><strong>Posse de Bola:</strong> ${item.posse_bola_a_favor}%</li>
                <li><strong>Posse de Bola Contra:</strong> ${item.posse_bola_contra}%</li>
                <li><strong>Total de Passes:</strong> ${item.total_de_passes}</li>
            </ul>
            <hr>
            <h5>Estatísticas Disciplinares</h5>
            <ul>
                <li><strong>Cartões Amarelos:</strong> ${item.cartoes_amarelos}</li>
                <li><strong>Cartões Vermelhos:</strong> ${item.cartoes_vermelhos}</li>
            </ul>
        `;
    } else if (tipo === 'selecoes') {
        titulo = `Detalhes da Seleção: ${item.pais}`;
        html = `
            <h5>Informação Geral</h5>
            <ul>
                <li><strong>Liga:</strong> ${item.ligas.nome}</li>
                <li><strong>Época:</strong> ${item.epoca}</li>
                <li><strong>Jogos:</strong> ${item.jogos}</li>
                <li><strong>Vitórias:</strong> ${item.vitorias}</li>
                <li><strong>Empates:</strong> ${item.empates}</li>
                <li><strong>Derrotas:</strong> ${item.derrotas}</li>
            </ul>
            <hr>
            <h5>Estatísticas Ofensivas</h5>
            <ul>
                <li><strong>Golos Marcados:</strong> ${item.golos_marcados}</li>
                <li><strong>Golos Sofridos:</strong> ${item.golos_sofridos}</li>
                <li><strong>Remates à Baliza:</strong> ${item.remates_enquadrados_a_baliza}</li>
            </ul>
            <hr>
            <h5>Estatísticas de Jogo</h5>
            <ul>
                <li><strong>Cantos a Favor:</strong> ${item.cantos_a_favor}</li>
                <li><strong>Cantos Contra:</strong> ${item.cantos_contra}</li>
                <li><strong>Posse de Bola:</strong> ${item.posse_bola_a_favor}%</li>
                <li><strong>Posse de Bola Contra:</strong> ${item.posse_bola_contra}%</li>
                <li><strong>Total de Passes:</strong> ${item.total_de_passes}</li>
            </ul>
            <hr>
            <h5>Estatísticas Disciplinares</h5>
            <ul>
                <li><strong>Cartões Amarelos:</strong> ${item.cartoes_amarelos}</li>
                <li><strong>Cartões Vermelhos:</strong> ${item.cartoes_vermelhos}</li>
            </ul>
        `;
    } else if (tipo === 'jogos') {
        titulo = `Detalhes do Jogo`;
        html = `
            <div class="row">
                <div class="col-md-6">
                    <h5>Informação Geral</h5>
                    <ul>
                        <li><strong>Data:</strong> ${item.data}</li>
                        <li><strong>Liga:</strong> ${item.ligas.nome}</li>
                    </ul>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <h5>Equipa da Casa: ${item.equipa_casa}</h5>
                    <ul>
                        <li><strong>Resultado:</strong> ${item.resultado_casa}</li>
                        <li><strong>Cantos:</strong> ${item.cantos_casa}</li>
                        <li><strong>Posse de Bola:</strong> ${item.posse_bola_casa}%</li>
                        <li><strong>Passes:</strong> ${item.total_passes_casa}</li>
                        <li><strong>Remates à Baliza:</strong> ${item.remates_enquadrados_a_baliza_casa}</li>
                        <li><strong>Cartões Amarelos:</strong> ${item.cartoes_amarelos_casa}</li>
                        <li><strong>Cartões Vermelhos:</strong> ${item.cartoes_vermelhos_casa}</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h5>Equipa de Fora: ${item.equipa_fora}</h5>
                    <ul>
                        <li><strong>Resultado:</strong> ${item.resultado_fora}</li>
                        <li><strong>Cantos:</strong> ${item.cantos_fora}</li>
                        <li><strong>Posse de Bola:</strong> ${item.posse_bola_fora}%</li>
                        <li><strong>Passes:</strong> ${item.total_passes_fora}</li>
                        <li><strong>Remates à Baliza:</strong> ${item.remates_enquadrados_a_baliza_fora}</li>
                        <li><strong>Cartões Amarelos:</strong> ${item.cartoes_amarelos_fora}</li>
                        <li><strong>Cartões Vermelhos:</strong> ${item.cartoes_vermelhos_fora}</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    detailsModalLabel.textContent = titulo;
    detailsModalBody.innerHTML = html;
    detailsModal.show();
}

// Lógica para abrir o modal de edição
async function abrirModalEdicao(id, tipo) {
    const tabela = tipo;
    const { data: item, error } = await supabase.from(tabela).select('*').eq('id', id).single();
    
    if (error || !item) {
        alert('Erro ao carregar registo para edição.');
        console.error('Erro de edição:', error);
        return;
    }
    
    editIdInput.value = id;
    editTypeInput.value = tipo;
    editModalLabel.textContent = `Editar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    
    let html = '';
    
    if (tipo === 'clubes' || tipo === 'selecoes') {
        html += `
            <div class="mb-3">
                <label for="editNome" class="form-label">${tipo === 'clubes' ? 'Nome do Clube' : 'País da Seleção'}</label>
                <input type="text" class="form-control" id="editNome" value="${item.nome || item.pais}" required>
            </div>
            <div class="mb-3">
                <label for="editEpoca" class="form-label">Época</label>
                <input type="text" class="form-control" id="editEpoca" value="${item.epoca}" required>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="editJogos" class="form-label">Jogos</label>
                    <input type="number" class="form-control" id="editJogos" value="${item.jogos}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editVitorias" class="form-label">Vitórias</label>
                    <input type="number" class="form-control" id="editVitorias" value="${item.vitorias}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editEmpates" class="form-label">Empates</label>
                    <input type="number" class="form-control" id="editEmpates" value="${item.empates}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editDerrotas" class="form-label">Derrotas</label>
                    <input type="number" class="form-control" id="editDerrotas" value="${item.derrotas}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editGolosMarcados" class="form-label">Golos Marcados</label>
                    <input type="number" class="form-control" id="editGolosMarcados" value="${item.golos_marcados}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editGolosSofridos" class="form-label">Golos Sofridos</label>
                    <input type="number" class="form-control" id="editGolosSofridos" value="${item.golos_sofridos}" required>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="editCantosAFavor" class="form-label">Cantos a Favor</label>
                    <input type="number" class="form-control" id="editCantosAFavor" value="${item.cantos_a_favor}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCantosContra" class="form-label">Cantos Contra</label>
                    <input type="number" class="form-control" id="editCantosContra" value="${item.cantos_contra}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editPosseBolaAFavor" class="form-label">Posse de Bola (%)</label>
                    <input type="number" class="form-control" id="editPosseBolaAFavor" value="${item.posse_bola_a_favor}" step="0.01" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editPosseBolaContra" class="form-label">Posse de Bola Contra (%)</label>
                    <input type="number" class="form-control" id="editPosseBolaContra" value="${item.posse_bola_contra}" step="0.01" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCartoesAmarelos" class="form-label">Cartões Amarelos</label>
                    <input type="number" class="form-control" id="editCartoesAmarelos" value="${item.cartoes_amarelos}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCartoesVermelhos" class="form-label">Cartões Vermelhos</label>
                    <input type="number" class="form-control" id="editCartoesVermelhos" value="${item.cartoes_vermelhos}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editRematesEnquadrados" class="form-label">Remates à Baliza</label>
                    <input type="number" class="form-control" id="editRematesEnquadrados" value="${item.remates_enquadrados_a_baliza}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editTotalPasses" class="form-label">Total de Passes</label>
                    <input type="number" class="form-control" id="editTotalPasses" value="${item.total_de_passes}" required>
                </div>
            </div>
        `;
    } else if (tipo === 'jogos') {
        html += `
            <div class="mb-3">
                <label for="editData" class="form-label">Data do Jogo</label>
                <input type="date" class="form-control" id="editData" value="${item.data}" required>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="editEquipaCasa" class="form-label">Equipa Analisada</label>
                    <input type="text" class="form-control" id="editEquipaCasa" value="${item.equipa_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editEquipaFora" class="form-label">Equipa Adversária</label>
                    <input type="text" class="form-control" id="editEquipaFora" value="${item.equipa_fora}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editResultadoCasa" class="form-label">Resultado Analisado</label>
                    <input type="number" class="form-control" id="editResultadoCasa" value="${item.resultado_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editResultadoFora" class="form-label">Resultado Adversário</label>
                    <input type="number" class="form-control" id="editResultadoFora" value="${item.resultado_fora}" required>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="editCantosCasa" class="form-label">Cantos a Favor</label>
                    <input type="number" class="form-control" id="editCantosCasa" value="${item.cantos_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCantosFora" class="form-label">Cantos Adversário</label>
                    <input type="number" class="form-control" id="editCantosFora" value="${item.cantos_fora}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editPosseBolaCasa" class="form-label">Posse de Bola Analisada (%)</label>
                    <input type="number" class="form-control" id="editPosseBolaCasa" value="${item.posse_bola_casa}" step="0.01" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editPosseBolaFora" class="form-label">Posse de Bola Adversário (%)</label>
                    <input type="number" class="form-control" id="editPosseBolaFora" value="${item.posse_bola_fora}" step="0.01" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCartoesAmarelosCasa" class="form-label">Cartões Amarelos Analisado</label>
                    <input type="number" class="form-control" id="editCartoesAmarelosCasa" value="${item.cartoes_amarelos_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCartoesAmarelosFora" class="form-label">Cartões Amarelos Adversário</label>
                    <input type="number" class="form-control" id="editCartoesAmarelosFora" value="${item.cartoes_amarelos_fora}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCartoesVermelhosCasa" class="form-label">Cartões Vermelhos Analisado</label>
                    <input type="number" class="form-control" id="editCartoesVermelhosCasa" value="${item.cartoes_vermelhos_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editCartoesVermelhosFora" class="form-label">Cartões Vermelhos Adversário</label>
                    <input type="number" class="form-control" id="editCartoesVermelhosFora" value="${item.cartoes_vermelhos_fora}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editTotalPassesCasa" class="form-label">Total de Passes Analisado</label>
                    <input type="number" class="form-control" id="editTotalPassesCasa" value="${item.total_passes_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editTotalPassesFora" class="form-label">Total de Passes Adversário</label>
                    <input type="number" class="form-control" id="editTotalPassesFora" value="${item.total_passes_fora}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editRematesEnquadradosCasa" class="form-label">Remates à Baliza Analisado</label>
                    <input type="number" class="form-control" id="editRematesEnquadradosCasa" value="${item.remates_enquadrados_a_baliza_casa}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="editRematesEnquadradosFora" class="form-label">Remates à Baliza Adversário</label>
                    <input type="number" class="form-control" id="editRematesEnquadradosFora" value="${item.remates_enquadrados_a_baliza_fora}" required>
                </div>
            </div>
        `;
    }
    
    editFormBody.innerHTML = html;
    editModal.show();
}

function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = editIdInput.value;
    const tipo = editTypeInput.value;
    const tabela = tipo;
    
    const formElements = editFormBody.querySelectorAll('input, select');
    const payload = {};
    
    // Mapeamento explícito de nomes de campos do frontend para a base de dados (snake_case)
    const fieldMapping = {
        'editNome': 'nome',
        'editEpoca': 'epoca',
        'editJogos': 'jogos',
        'editVitorias': 'vitorias',
        'editEmpates': 'empates',
        'editDerrotas': 'derrotas',
        'editGolosMarcados': 'golos_marcados',
        'editGolosSofridos': 'golos_sofridos',
        'editCantosAFavor': 'cantos_a_favor',
        'editCantosContra': 'cantos_contra',
        'editPosseBolaAFavor': 'posse_bola_a_favor',
        'editPosseBolaContra': 'posse_bola_contra',
        'editCartoesAmarelos': 'cartoes_amarelos',
        'editCartoesVermelhos': 'cartoes_vermelhos',
        'editRematesEnquadrados': 'remates_enquadrados_a_baliza',
        'editTotalPasses': 'total_de_passes',
        'editData': 'data',
        'editEquipaCasa': 'equipa_casa',
        'editEquipaFora': 'equipa_fora',
        'editResultadoCasa': 'resultado_casa',
        'editResultadoFora': 'resultado_fora',
        'editCantosCasa': 'cantos_casa',
        'editCantosFora': 'cantos_fora',
        'editPosseBolaCasa': 'posse_bola_casa',
        'editPosseBolaFora': 'posse_bola_fora',
        'editCartoesAmarelosCasa': 'cartoes_amarelos_casa',
        'editCartoesVermelhosCasa': 'cartoes_vermelhos_casa',
        'editCartoesAmarelosFora': 'cartoes_amarelos_fora',
        'editCartoesVermelhosFora': 'cartoes_vermelhos_fora',
        'editTotalPassesCasa': 'total_passes_casa',
        'editTotalPassesFora': 'total_passes_fora',
        'editRematesEnquadradosCasa': 'remates_enquadrados_a_baliza_casa',
        'editRematesEnquadradosFora': 'remates_enquadrados_a_baliza_fora',
    };
    
    formElements.forEach(element => {
        const dbColumnName = fieldMapping[element.id];
        if (dbColumnName) {
            const value = element.type === 'number' ? parseFloat(element.value) : element.value;
            payload[dbColumnName] = value;
        }
    });

    if (tipo === 'selecoes') {
        payload.pais = payload.nome;
        delete payload.nome;
    }
    
    supabase
        .from(tabela)
        .update(payload)
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('Erro ao atualizar registo: ' + error.message);
                console.error('Erro de atualização:', error);
            } else {
                alert('Registo atualizado com sucesso!');
                editModal.hide();
                Promise.all([carregarClubes(), carregarSelecoes(), carregarJogos()]).then(() => {
                    filtrarEOrdenarDados();
                });
            }
        });
}

function handleActionButtons(e) {
    if (e.target.classList.contains('btn-detalhes')) {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        mostrarDetalhes(id, type);
    } else if (e.target.classList.contains('btn-editar')) {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        abrirModalEdicao(id, type);
    } else if (e.target.classList.contains('btn-excluir')) {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        if (confirm(`Tem certeza que deseja excluir este ${type}?`)) {
            excluirRegistro(id, type);
        }
    }
}

async function excluirRegistro(id, tipo) {
    const tabela = tipo;
    const { error } = await supabase.from(tabela).delete().eq('id', id);

    if (error) {
        alert('Erro ao excluir registo: ' + error.message);
        console.error('Erro de exclusão:', error);
    } else {
        alert('Registo excluído com sucesso!');
        await Promise.all([carregarClubes(), carregarSelecoes(), carregarJogos()]);
        filtrarEOrdenarDados();
    }
}

// Inicialização
// -------------
async function initDashboard() {
    await Promise.all([carregarLigas(), carregarClubes(), carregarSelecoes(), carregarJogos()]);
    filtrarEOrdenarDados();
}

// Event Listeners
// ---------------
applyFiltersBtn.addEventListener('click', filtrarEOrdenarDados);
entityListingsDiv.addEventListener('click', handleActionButtons);
filterTypeSelect.addEventListener('change', filtrarEOrdenarDados);
editForm.addEventListener('submit', handleEditSubmit);

// Iniciar a aplicação
document.addEventListener('DOMContentLoaded', initDashboard);