// ---------- FUNÇÕES GERAIS ---------- //

function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// ---------- LOGIN ---------- //

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            alert('Preencha todos os campos.');
            return;
        }

        if (!validateEmail(email)) {
            alert('E-mail inválido.');
            return;
        }

        if (!passwordRegex.test(password)) {
            alert('Senha fraca. A senha deve conter:\n- 8 caracteres\n- 1 letra maiúscula\n- 1 letra minúscula\n- 1 número\n- 1 caractere especial');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);

        if (!user) {
            alert('Usuário não encontrado.');
            return;
        }

        if (user.password !== password) {
            alert('Senha incorreta.');
            return;
        }

        localStorage.setItem('loggedUser', JSON.stringify(user));
        window.location.href = "dashboard.html";
    });
}

// ---------- TELA DE CADASTRO ---------- //

const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const groupIdInput = document.getElementById('groupId').value.trim();

        if (!name || !email || !password || !confirmPassword) {
            alert('Preencha todos os campos.');
            return;
        }

        if (!validateEmail(email)) {
            alert('E-mail inválido.');
            return;
        }

        if (!passwordRegex.test(password)) {
            alert('A senha deve conter:\n- 8 caracteres\n- 1 letra maiúscula\n- 1 letra minúscula\n- 1 número\n- 1 caractere especial');
            return;
        }

        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];

        if (users.find(u => u.email === email)) {
            alert('Este e-mail já está cadastrado.');
            return;
        }

        let groupId = groupIdInput;
        if (!groupId) {
            groupId = crypto.randomUUID();
            alert(`Grupo criado com sucesso!\nSeu ID do grupo é:\n${groupId}`);
        } else {
            alert(`Você será vinculado ao grupo: ${groupId}`);
        }

        const user = { name, email, password, groupId };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));

        alert('Usuário cadastrado com sucesso!');
        registerForm.reset();
        document.getElementById('backToLogin').click();
    });

    document.getElementById('backToLogin').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('registerContainer').style.display = 'none';
        document.querySelector('.login-container').style.display = 'block';
    });
}

// ---------- TROCAR PARA CADASTRO ---------- //

const createAccountLink = document.getElementById('createAccountLink');

if (createAccountLink) {
    createAccountLink.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('.login-container').style.display = 'none';
        document.getElementById('registerContainer').style.display = 'block';
    });
}

// ---------- RECUPERAÇÃO DE SENHA ---------- //

const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('.login-container').style.display = 'none';
        document.getElementById('recoverContainer').style.display = 'block';
    });
}

const backToLoginFromRecovery = document.getElementById('backToLoginFromRecovery');
if (backToLoginFromRecovery) {
    backToLoginFromRecovery.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('recoverContainer').style.display = 'none';
        document.querySelector('.login-container').style.display = 'block';
    });
}

let currentRecoveryUser = null;

const recoverForm = document.getElementById('recoverForm');
if (recoverForm) {
    recoverForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('recoverEmail').value.trim();
        const users = JSON.parse(localStorage.getItem('users')) || [];

        const user = users.find(u => u.email === email);

        if (!user) {
            alert('E-mail não encontrado.');
            return;
        }

        currentRecoveryUser = user;
        const code = user.groupId.slice(-3).toUpperCase();

        document.getElementById('hintCode').textContent = `Código enviado: ${code}`;
        document.getElementById('verificationStep').style.display = 'block';
    });
}

const confirmRecoveryBtn = document.getElementById('confirmRecovery');
if (confirmRecoveryBtn) {
    confirmRecoveryBtn.addEventListener('click', function () {
        const codeInput = document.getElementById('codeInput').value.trim().toUpperCase();
        const newPassword = document.getElementById('recoverNewPassword').value.trim();
        const confirmNewPassword = document.getElementById('recoverConfirmNewPassword').value.trim();

        if (!currentRecoveryUser) {
            alert('Usuário inválido.');
            return;
        }

        const correctCode = currentRecoveryUser.groupId.slice(-3).toUpperCase();
        if (codeInput !== correctCode) {
            alert('Código incorreto.');
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            alert('A nova senha deve conter:\n- 8 caracteres\n- 1 letra maiúscula\n- 1 letra minúscula\n- 1 número\n- 1 caractere especial');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.map(user => {
            if (user.email === currentRecoveryUser.email) {
                return { ...user, password: newPassword };
            }
            return user;
        });

        localStorage.setItem('users', JSON.stringify(updatedUsers));
        alert('Senha redefinida com sucesso!');
        window.location.reload();
    });
}
