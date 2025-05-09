<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contas Bancárias - Financial Helper</title>
  <link rel="stylesheet" href="dashboard.css">
  <style>
    .main-content {
      max-width: 800px;
      margin: 0 auto;
    }
    form input, form select {
      margin-bottom: 10px;
      padding: 10px;
      width: 100%;
      font-size: 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    table, th, td {
      border: 1px solid #ccc;
    }
    th, td {
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #eee;
    }
    .status-ativo {
      color: green;
      font-weight: bold;
    }
    .status-inativo {
      color: red;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">
      <h2>Menu</h2>
      <ul>
        <li><a href="dashboard.html">Dashboard</a></li>
        <li><a href="entradas.html">Entradas</a></li>
        <li><a href="contas.html">Contas Bancárias</a></li>
        <li><a href="#" id="logoutBtn">Sair</a></li>
      </ul>
    </aside>
    <main class="main-content">
      <h1>Contas Bancárias</h1>

      <form id="accountForm">
        <input type="hidden" id="accountId">
        <input type="text" id="bankName" placeholder="Nome do banco" required>
        <select id="accountType" required>
          <option value="">Tipo de conta</option>
          <option value="corrente">Corrente</option>
          <option value="poupança">Poupança</option>
          <option value="investimento">Investimento</option>
        </select>
        <input type="text" id="accountNumber" placeholder="Número da conta e série (opcional)">
        <button type="submit">Salvar conta</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Banco</th>
            <th>Tipo</th>
            <th>Número</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="accountsTableBody">
          <!-- Preenchido via JS -->
        </tbody>
      </table>
    </main>
  </div>

  <script>
    const form = document.getElementById('accountForm');
    const tableBody = document.getElementById('accountsTableBody');

    function loadAccounts() {
      return JSON.parse(localStorage.getItem('accounts') || '[]');
    }

    function saveAccounts(accounts) {
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }

    function renderAccounts() {
      const accounts = loadAccounts();
      tableBody.innerHTML = '';

      accounts.forEach(account => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${account.bankName}</td>
          <td>${account.accountType}</td>
          <td>${account.accountNumber || '-'}</td>
          <td class="${account.status === 'ativo' ? 'status-ativo' : 'status-inativo'}">${account.status}</td>
          <td>
            <button onclick="editAccount('${account.id}')">Editar</button>
            <button onclick="toggleStatus('${account.id}')">${account.status === 'ativo' ? 'Inativar' : 'Ativar'}</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const id = document.getElementById('accountId').value || crypto.randomUUID();
      const bankName = document.getElementById('bankName').value.trim();
      const accountType = document.getElementById('accountType').value;
      const accountNumber = document.getElementById('accountNumber').value.trim();

      let accounts = loadAccounts();
      const existingIndex = accounts.findIndex(acc => acc.id === id);

      const updatedAccount = {
        id,
        bankName,
        accountType,
        accountNumber,
        status: existingIndex !== -1 ? accounts[existingIndex].status : 'ativo',
        createdAt: existingIndex !== -1 ? accounts[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        accounts[existingIndex] = updatedAccount;
      } else {
        accounts.push(updatedAccount);
      }

      saveAccounts(accounts);
      form.reset();
      renderAccounts();
    });

    function editAccount(id) {
      const account = loadAccounts().find(acc => acc.id === id);
      if (!account) return;
      document.getElementById('accountId').value = account.id;
      document.getElementById('bankName').value = account.bankName;
      document.getElementById('accountType').value = account.accountType;
      document.getElementById('accountNumber').value = account.accountNumber;
    }

    function toggleStatus(id) {
      const accounts = loadAccounts();
      const account = accounts.find(acc => acc.id === id);
      if (account) {
        account.status = account.status === 'ativo' ? 'inativo' : 'ativo';
        account.updatedAt = new Date().toISOString();
        saveAccounts(accounts);
        renderAccounts();
      }
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('loggedUser');
      window.location.href = 'index.html';
    });

    renderAccounts();
  </script>
</body>
</html>
