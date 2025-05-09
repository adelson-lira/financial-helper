const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
if (!loggedUser) {
  alert("Você precisa estar logado.");
  window.location.href = "index.html";
}

const groupId = loggedUser.groupId;
let editingIndex = null;

const entryForm = document.getElementById('entryForm');
const entriesTableBody = document.getElementById('entriesTableBody');
const weekTotalSpan = document.getElementById('weekTotal');
const fortnightTotalSpan = document.getElementById('fortnightTotal');
const monthTotalSpan = document.getElementById('monthTotal');
const cancelEditBtn = document.getElementById('cancelEditBtn');

function getEntries() {
  const allEntries = JSON.parse(localStorage.getItem('entries')) || [];
  return allEntries.filter(entry => entry.groupId === groupId);
}

function saveEntries(entries) {
  const allEntries = JSON.parse(localStorage.getItem('entries')) || [];
  const otherGroups = allEntries.filter(entry => entry.groupId !== groupId);
  const updated = [...otherGroups, ...entries];
  localStorage.setItem('entries', JSON.stringify(updated));
}

function formatEntryType(type) {
  switch (type) {
    case 'saldo_inicial': return 'Saldo inicial';
    case 'salario': return 'Salário';
    case 'transferencia': return 'Transferência';
    case 'rendimento': return 'Rendimento de aplicação';
    case 'outras': return 'Outras entradas';
    case 'aplicacao': return 'Aplicação';
    default: return type;
  }
}

function getAccountLabel(accountId) {
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return '[Conta removida]';
  return `${acc.bankName} - ${acc.accountType}${acc.accountNumber ? ' - ' + acc.accountNumber : ''}`;
}

function renderEntries() {
  const all = getEntries();
  renderFilteredEntries(all);
}

function renderFilteredEntries(entries) {
  entriesTableBody.innerHTML = "";

  entries.forEach((entry, index) => {
    const displayValue = entry.type === 'saldo_inicial'
      ? Number(entry.initialBalance || 0).toFixed(2)
      : Number(entry.value || 0).toFixed(2);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${getAccountLabel(entry.account)}</td>
      <td>${formatEntryType(entry.type)}</td>
      <td>R$ ${displayValue}</td>
      <td>${entry.date}</td>
      <td title="${entry.description || ''}">${(entry.description || '').substring(0, 50)}</td>
      <td>
        <button onclick="editEntry(${index})">Editar</button>
        <button onclick="deleteEntry(${index})">Excluir</button>
      </td>
    `;
    entriesTableBody.appendChild(tr);
  });

  calculateTotals(entries);
}

function calculateTotals(entries) {
  let weekTotal = 0;
  let fortnightTotal = 0;
  let monthTotal = 0;

  entries.forEach(entry => {
    if (!entry.date || !entry.date.includes('-')) return;

    const [year, month, day] = entry.date.split('-').map(Number);
    const valueToAdd = entry.type === 'saldo_inicial'
      ? Number(entry.initialBalance || 0)
      : Number(entry.value || 0);

    if (day >= 1 && day <= 7) weekTotal += valueToAdd;
    if (day >= 1 && day <= 15) fortnightTotal += valueToAdd;
    monthTotal += valueToAdd;
  });

  weekTotalSpan.textContent = `R$ ${weekTotal.toFixed(2)}`;
  fortnightTotalSpan.textContent = `R$ ${fortnightTotal.toFixed(2)}`;
  monthTotalSpan.textContent = `R$ ${monthTotal.toFixed(2)}`;
}

entryForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const account = document.getElementById('account').value;
  const initialBalance = document.getElementById('initialBalance').value.trim();
  const value = document.getElementById('value').value.trim();
  const type = document.getElementById('entryType').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value.trim();

  if (!account || !type || !date) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const dateParts = date.split("-");
  if (dateParts.length === 3 && dateParts[0].length > 4) {
    alert("Ano inválido. Use apenas 4 dígitos (ex: 2025).");
    return;
  }

  if (type === 'saldo_inicial') {
    if (!initialBalance || isNaN(initialBalance)) {
      alert('Para "Saldo inicial", o campo "Saldo inicial" deve ser preenchido.');
      return;
    }
  } else {
    if (!value || isNaN(value)) {
      alert('Para esse tipo de entrada, o campo "Valor da entrada" é obrigatório.');
      return;
    }
  }

  const entry = {
    groupId,
    account,
    initialBalance: initialBalance ? Number(initialBalance) : 0,
    value: value ? Number(value) : 0,
    type,
    date,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    log: [`Criado por ${loggedUser.email} em ${new Date().toLocaleString()}`]
  };

  const entries = getEntries();

  if (editingIndex !== null) {
    entry.createdAt = entries[editingIndex].createdAt;
    entries[editingIndex] = entry;
    editingIndex = null;
    cancelEditBtn.style.display = 'none';
    document.querySelector('#entryForm button[type="submit"]').textContent = "Adicionar entrada";
  } else {
    entries.push(entry);
  }

  saveEntries(entries);
  entryForm.reset();
  populateAccountDropdown();
  renderEntries();
});

function cancelEdit() {
  editingIndex = null;
  entryForm.reset();
  cancelEditBtn.style.display = 'none';
  document.querySelector('#entryForm button[type="submit"]').textContent = "Adicionar entrada";
}

window.editEntry = function (index) {
  const entries = getEntries();
  const entry = entries[index];
  if (!entry) return;

  editingIndex = index;

  document.getElementById('account').value = entry.account;
  document.getElementById('initialBalance').value = entry.initialBalance;
  document.getElementById('entryType').value = entry.type;
  document.getElementById('value').value = entry.value;
  document.getElementById('date').value = entry.date;
  document.getElementById('description').value = entry.description;

  document.querySelector('#entryForm button[type="submit"]').textContent = "Salvar alteração";
  cancelEditBtn.style.display = 'inline-block';
};

window.deleteEntry = function (index) {
  if (confirm("Deseja realmente excluir esta entrada?")) {
    const entries = getEntries();
    entries.splice(index, 1);
    saveEntries(entries);
    renderEntries();
  }
};

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('loggedUser');
  window.location.href = "index.html";
});

function toggleFilterFields() {
  const mode = document.getElementById('filterMode').value;
  document.getElementById('quickFilters').style.display = (mode === 'quick') ? 'flex' : 'none';
  document.getElementById('customFilters').style.display = (mode === 'custom') ? 'flex' : 'none';
}

function applyQuickFilter(type) {
  const allEntries = getEntries();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let filtered = [];

  allEntries.forEach(entry => {
    if (!entry.date || !entry.date.includes('-')) return;

    const [year, month, day] = entry.date.split('-').map(Number);
    if (year !== currentYear || (month - 1) !== currentMonth) return;

    switch (type) {
      case 'week':
        if (day >= 1 && day <= 7) filtered.push(entry);
        break;
      case 'fortnight':
        if (day >= 1 && day <= 15) filtered.push(entry);
        break;
      case 'month':
        filtered.push(entry);
        break;
      case 'all':
      default:
        filtered = allEntries;
        break;
    }
  });

  renderFilteredEntries(filtered);
}

function applyCustomFilter() {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  if (!start || !end) {
    alert("Preencha as duas datas.");
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const filtered = getEntries().filter(entry => {
    const [year, month, day] = entry.date.split('-').map(Number);
    const entryDate = new Date(year, month - 1, day);
    return entryDate >= startDate && entryDate <= endDate;
  });

  renderFilteredEntries(filtered);
}

function loadActiveAccounts() {
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  return accounts.filter(acc => acc.status === 'ativo');
}

function populateAccountDropdown() {
  const select = document.getElementById('account');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione a conta bancária</option>';

  const activeAccounts = loadActiveAccounts();
  activeAccounts.forEach(acc => {
    const option = document.createElement('option');
    option.value = acc.id;
    option.textContent = `${acc.bankName} - ${acc.accountType}${acc.accountNumber ? ' - ' + acc.accountNumber : ''}`;
    select.appendChild(option);
  });
}

renderEntries();
populateAccountDropdown();
