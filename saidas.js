const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
if (!loggedUser) {
  alert("Você precisa estar logado.");
  window.location.href = "index.html";
}

const groupId = loggedUser.groupId;
let editingIndex = null;

const saidaForm = document.getElementById('saidaForm');
const saidasTableBody = document.getElementById('saidasTableBody');
const weekTotalSpan = document.getElementById('weekTotal');
const fortnightTotalSpan = document.getElementById('fortnightTotal');
const monthTotalSpan = document.getElementById('monthTotal');
const cancelEditBtn = document.getElementById('cancelEditBtn');

function getSaidas() {
  const all = JSON.parse(localStorage.getItem('saidas')) || [];
  return all.filter(s => s.groupId === groupId);
}

function saveSaidas(saidas) {
  const all = JSON.parse(localStorage.getItem('saidas')) || [];
  const outros = all.filter(s => s.groupId !== groupId);
  const atualizado = [...outros, ...saidas];
  localStorage.setItem('saidas', JSON.stringify(atualizado));
}

function loadActiveAccounts() {
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  return accounts.filter(acc => acc.status === 'ativo');
}

function populateAccountDropdown() {
  const select = document.getElementById('account');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione a conta bancária</option>';

  const contas = loadActiveAccounts();
  contas.forEach(acc => {
    const option = document.createElement('option');
    option.value = acc.id;
    option.textContent = `${acc.bankName} - ${acc.accountType}${acc.accountNumber ? ' - ' + acc.accountNumber : ''}`;
    select.appendChild(option);
  });
}

function getAccountLabel(id) {
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const acc = accounts.find(a => a.id === id);
  return acc ? `${acc.bankName} - ${acc.accountType}${acc.accountNumber ? ' - ' + acc.accountNumber : ''}` : '[Conta removida]';
}

function renderSaidas(saidas) {
  saidasTableBody.innerHTML = '';

  saidas.forEach((saida, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${getAccountLabel(saida.account)}</td>
      <td>${formatTipo(saida.type)}</td>
      <td>R$ ${Number(saida.value).toFixed(2)}</td>
      <td>${saida.date}</td>
      <td title="${saida.description || ''}">${(saida.description || '').substring(0, 50)}</td>
      <td>
        <button onclick="editSaida(${index})">Editar</button>
        <button onclick="deleteSaida(${index})">Excluir</button>
      </td>
    `;
    saidasTableBody.appendChild(tr);
  });

  calcularTotais(saidas);
}

function formatTipo(type) {
  const map = {
    alimentacao: "Alimentação",
    moradia: "Moradia",
    transporte: "Transporte",
    saude: "Saúde",
    lazer: "Lazer",
    educacao: "Educação",
    outros: "Outros"
  };
  return map[type] || type;
}

function calcularTotais(saidas) {
  let semana = 0, quinzena = 0, mes = 0;

  saidas.forEach(saida => {
    if (!saida.date || !saida.date.includes('-')) return;
    const [ano, mesStr, dia] = saida.date.split('-').map(Number);
    const valor = Number(saida.value || 0);

    if (dia <= 7) semana += valor;
    if (dia <= 15) quinzena += valor;
    mes += valor;
  });

  weekTotalSpan.textContent = `R$ ${semana.toFixed(2)}`;
  fortnightTotalSpan.textContent = `R$ ${quinzena.toFixed(2)}`;
  monthTotalSpan.textContent = `R$ ${mes.toFixed(2)}`;
}

saidaForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const account = document.getElementById('account').value;
  const type = document.getElementById('saidaType').value;
  const value = document.getElementById('value').value.trim();
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value.trim();

  if (!account || !type || !value || !date) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const saida = {
    groupId,
    account,
    type,
    value: Number(value),
    date,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saidas = getSaidas();

  if (editingIndex !== null) {
    saida.createdAt = saidas[editingIndex].createdAt;
    saidas[editingIndex] = saida;
    editingIndex = null;
    cancelEditBtn.style.display = 'none';
    document.querySelector('#saidaForm button[type="submit"]').textContent = "Adicionar saída";
  } else {
    saidas.push(saida);
  }

  saveSaidas(saidas);
  saidaForm.reset();
  populateAccountDropdown();
  renderSaidas(getSaidas());
});

function editSaida(index) {
  const saida = getSaidas()[index];
  if (!saida) return;

  editingIndex = index;

  document.getElementById('account').value = saida.account;
  document.getElementById('saidaType').value = saida.type;
  document.getElementById('value').value = saida.value;
  document.getElementById('date').value = saida.date;
  document.getElementById('description').value = saida.description;

  document.querySelector('#saidaForm button[type="submit"]').textContent = "Salvar alteração";
  cancelEditBtn.style.display = 'inline-block';
}

function cancelEdit() {
  editingIndex = null;
  saidaForm.reset();
  cancelEditBtn.style.display = 'none';
  document.querySelector('#saidaForm button[type="submit"]').textContent = "Adicionar saída";
}

function deleteSaida(index) {
  if (!confirm("Deseja excluir esta saída?")) return;
  const saidas = getSaidas();
  saidas.splice(index, 1);
  saveSaidas(saidas);
  renderSaidas(saidas);
}

function toggleFilterFields() {
  const mode = document.getElementById('filterMode').value;
  document.getElementById('quickFilters').style.display = (mode === 'quick') ? 'flex' : 'none';
  document.getElementById('customFilters').style.display = (mode === 'custom') ? 'flex' : 'none';
}

function applyQuickFilter(type) {
  const all = getSaidas();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filtered = all.filter(saida => {
    const [year, month, day] = saida.date.split('-').map(Number);
    if (year !== currentYear || (month - 1) !== currentMonth) return false;
    if (type === 'week') return day <= 7;
    if (type === 'fortnight') return day <= 15;
    if (type === 'month') return true;
    return true;
  });

  renderSaidas(filtered);
}

function applyCustomFilter() {
  const start = new Date(document.getElementById('startDate').value);
  const end = new Date(document.getElementById('endDate').value);

  if (!start || !end) {
    alert("Preencha as duas datas.");
    return;
  }

  const filtered = getSaidas().filter(saida => {
    const [y, m, d] = saida.date.split('-').map(Number);
    const data = new Date(y, m - 1, d);
    return data >= start && data <= end;
  });

  renderSaidas(filtered);
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('loggedUser');
  window.location.href = "index.html";
});

renderSaidas(getSaidas());
populateAccountDropdown();
