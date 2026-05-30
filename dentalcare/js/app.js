/**
 * DentalCare – Portal do Paciente
 * Lógica de: abas, validação, localStorage, toast e guia por voz
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────
   * Utilitários gerais
   * ────────────────────────────────────────────────────── */

  /** Atalho para document.getElementById */
  const $ = id => document.getElementById(id);

  /** Anuncia mensagem para leitores de tela via live region */
  function announce(msg) {
    const live = $('live-region');
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = msg; });
  }

  /** Sintetiza fala em português */
  function speak(text) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.05;
    speechSynthesis.speak(u);
  }

  /* ──────────────────────────────────────────────────────
   * Toast de notificação
   * ────────────────────────────────────────────────────── */

  let toastTimer;

  /**
   * Exibe uma notificação toast.
   * @param {string} msg   - Texto da mensagem
   * @param {'success'|'error'} type
   */
  function showToast(msg, type = 'success') {
    const toast    = $('toast');
    const toastMsg = $('toast-msg');
    const icon     = toast.querySelector('.toast-icon');

    icon.textContent  = type === 'success' ? '✅' : '❌';
    toastMsg.textContent = msg;
    toast.className   = `show ${type}`;

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = ''; }, 3800);
    announce(msg);
  }

  /* ──────────────────────────────────────────────────────
   * Alternância de abas (Login / Cadastro)
   * ────────────────────────────────────────────────────── */

  const tabLogin      = $('tab-login');
  const tabCadastro   = $('tab-cadastro');
  const panelLogin    = $('panel-login');
  const panelCadastro = $('panel-cadastro');

  /**
   * Troca o painel ativo.
   * @param {boolean} toLogin - true = login | false = cadastro
   */
  function switchTab(toLogin) {
    if (toLogin) {
      tabLogin.setAttribute('aria-selected', 'true');
      tabLogin.tabIndex = 0;
      tabCadastro.setAttribute('aria-selected', 'false');
      tabCadastro.tabIndex = -1;
      panelLogin.classList.add('active');
      panelLogin.removeAttribute('hidden');
      panelCadastro.classList.remove('active');
      panelCadastro.setAttribute('hidden', '');
      clearForm('login');
      const msg = 'Formulário de login ativado';
      announce(msg);
      speak(msg);
    } else {
      tabCadastro.setAttribute('aria-selected', 'true');
      tabCadastro.tabIndex = 0;
      tabLogin.setAttribute('aria-selected', 'false');
      tabLogin.tabIndex = -1;
      panelCadastro.classList.add('active');
      panelCadastro.removeAttribute('hidden');
      panelLogin.classList.remove('active');
      panelLogin.setAttribute('hidden', '');
      clearForm('cadastro');
      const msg = 'Formulário de cadastro ativado';
      announce(msg);
      speak(msg);
    }
  }

  tabLogin.addEventListener('click', () => switchTab(true));
  tabCadastro.addEventListener('click', () => switchTab(false));

  // Navegação por setas do teclado no tablist (WCAG 2.1 – padrão de design de abas)
  [tabLogin, tabCadastro].forEach(btn => {
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const isLogin = btn.id === 'tab-login';
        switchTab(!isLogin);
        (isLogin ? tabCadastro : tabLogin).focus();
      }
    });
  });

  /* ──────────────────────────────────────────────────────
   * Toggle de visibilidade de senha
   * ────────────────────────────────────────────────────── */

  document.querySelectorAll('.pwd-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp  = $(btn.dataset.target);
      const show = inp.type === 'password';
      inp.type   = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    });
  });

  /* ──────────────────────────────────────────────────────
   * Validação de campos
   * ────────────────────────────────────────────────────── */

  /**
   * Aplica ou remove estado de erro em um campo.
   * @param {HTMLInputElement} inputEl
   * @param {HTMLElement} msgEl
   * @param {string} msg - Vazio = sem erro
   */
  function setFieldError(inputEl, msgEl, msg) {
    if (msg) {
      inputEl.classList.add('invalid');
      msgEl.textContent = msg;
    } else {
      inputEl.classList.remove('invalid');
      msgEl.textContent = '';
    }
  }

  /** Reseta formulário e limpa estados de erro */
  function clearForm(which) {
    if (which === 'login') {
      $('form-login').reset();
      setFieldError($('login-email'), $('login-email-msg'), '');
      setFieldError($('login-senha'), $('login-senha-msg'), '');
    } else {
      $('form-cadastro').reset();
      ['cad-nome', 'cad-email', 'cad-senha', 'cad-confirmar'].forEach(id => {
        setFieldError($(id), $(`${id}-msg`), '');
      });
    }
  }

  /* ──────────────────────────────────────────────────────
   * Persistência – localStorage
   * ────────────────────────────────────────────────────── */

  function getUsers() {
    try { return JSON.parse(localStorage.getItem('dc_users') || '[]'); }
    catch { return []; }
  }

  function saveUsers(arr) {
    localStorage.setItem('dc_users', JSON.stringify(arr));
  }

  /* ──────────────────────────────────────────────────────
   * Submit – Login
   * ────────────────────────────────────────────────────── */

  $('form-login').addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;

    const email = $('login-email').value.trim();
    const senha = $('login-senha').value;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError($('login-email'), $('login-email-msg'), 'Informe um e-mail válido.');
      ok = false;
    } else {
      setFieldError($('login-email'), $('login-email-msg'), '');
    }

    if (!senha) {
      setFieldError($('login-senha'), $('login-senha-msg'), 'Informe sua senha.');
      ok = false;
    } else {
      setFieldError($('login-senha'), $('login-senha-msg'), '');
    }

    if (!ok) return;

    // Simula latência de chamada à API
    setTimeout(() => {
      const users = getUsers();
      const user  = users.find(u => u.email === email && u.senha === senha);

      if (user) {
        showToast(`Bem-vindo(a), ${user.nome}! Login realizado com sucesso.`, 'success');
        speak(`Bem-vindo de volta, ${user.nome}!`);
        $('form-login').reset();
      } else {
        showToast('E-mail ou senha incorretos. Tente novamente.', 'error');
        speak('E-mail ou senha incorretos.');
        setFieldError($('login-senha'), $('login-senha-msg'), 'Credenciais inválidas.');
      }
    }, 600);
  });

  /* ──────────────────────────────────────────────────────
   * Submit – Cadastro
   * ────────────────────────────────────────────────────── */

  $('form-cadastro').addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;

    const nome      = $('cad-nome').value.trim();
    const email     = $('cad-email').value.trim();
    const senha     = $('cad-senha').value;
    const confirmar = $('cad-confirmar').value;

    if (!nome || nome.length < 3) {
      setFieldError($('cad-nome'), $('cad-nome-msg'), 'Informe seu nome completo.');
      ok = false;
    } else {
      setFieldError($('cad-nome'), $('cad-nome-msg'), '');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError($('cad-email'), $('cad-email-msg'), 'Informe um e-mail válido.');
      ok = false;
    } else {
      setFieldError($('cad-email'), $('cad-email-msg'), '');
    }

    if (!senha || senha.length < 6) {
      setFieldError($('cad-senha'), $('cad-senha-msg'), 'A senha deve ter no mínimo 6 caracteres.');
      ok = false;
    } else {
      setFieldError($('cad-senha'), $('cad-senha-msg'), '');
    }

    if (senha !== confirmar) {
      setFieldError($('cad-confirmar'), $('cad-confirmar-msg'), 'As senhas não coincidem.');
      ok = false;
    } else {
      setFieldError($('cad-confirmar'), $('cad-confirmar-msg'), '');
    }

    if (!ok) return;

    // Simula latência de chamada à API
    setTimeout(() => {
      const users = getUsers();

      if (users.find(u => u.email === email)) {
        showToast('Este e-mail já está cadastrado. Faça login.', 'error');
        speak('Este e-mail já está cadastrado.');
        setFieldError($('cad-email'), $('cad-email-msg'), 'E-mail já cadastrado.');
        return;
      }

      users.push({ nome, email, senha });
      saveUsers(users);
      showToast(`Conta criada com sucesso! Bem-vindo(a), ${nome}!`, 'success');
      speak(`Cadastro realizado com sucesso! Bem-vindo, ${nome}!`);
      $('form-cadastro').reset();
      setTimeout(() => switchTab(true), 1200);
    }, 700);
  });

  /* ──────────────────────────────────────────────────────
   * Guia por Voz – Web Speech API
   * ────────────────────────────────────────────────────── */

  const voiceBtn    = $('voice-btn');
  const voiceStatus = $('voice-status');
  let recognition   = null;
  let isListening   = false;

  function setVoiceStatus(msg, visible = true) {
    voiceStatus.textContent = msg;
    voiceStatus.classList.toggle('visible', visible);
  }

  /**
   * Interpreta o transcript e executa a ação correspondente.
   * @param {string} text - Texto reconhecido pelo microfone
   */
  function voiceAction(text) {
    const t = text.toLowerCase().trim();

    if (t.includes('login') || (t.includes('entrar') && t.includes('ir'))) {
      speak('Indo para login');
      switchTab(true);
      tabLogin.focus();
    } else if (t.includes('cadastro') || (t.includes('cadastrar') && t.includes('ir'))) {
      speak('Indo para cadastro');
      switchTab(false);
      tabCadastro.focus();
    } else if (t === 'nome' || t.includes('campo nome')) {
      const el = $('cad-nome');
      if (!el.closest('[hidden]')) {
        el.focus();
        speak('Campo nome focado');
      } else {
        speak('Vá para o formulário de cadastro primeiro.');
      }
    } else if (t === 'email' || t.includes('campo email') || t.includes('e-mail')) {
      const el = panelLogin.classList.contains('active') ? $('login-email') : $('cad-email');
      el.focus();
      speak('Campo e-mail focado');
    } else if ((t === 'senha' || t.includes('campo senha')) && !t.includes('confirmar')) {
      const el = panelLogin.classList.contains('active') ? $('login-senha') : $('cad-senha');
      el.focus();
      speak('Campo senha focado');
    } else if (t.includes('confirmar') || t.includes('confirma')) {
      const el = $('cad-confirmar');
      if (!el.closest('[hidden]')) {
        el.focus();
        speak('Campo confirmar senha focado');
      } else {
        speak('Vá para o cadastro primeiro.');
      }
    } else if (t === 'entrar' || t.includes('fazer login') || t.includes('logar')) {
      if (panelLogin.classList.contains('active')) {
        speak('Tentando entrar');
        $('btn-entrar').click();
      } else {
        speak('Vá para o login primeiro.');
      }
    } else if (t === 'cadastrar' || t.includes('criar conta')) {
      if (panelCadastro.classList.contains('active')) {
        speak('Enviando cadastro');
        $('btn-cadastrar').click();
      } else {
        speak('Vá para o cadastro primeiro.');
      }
    } else if (t === 'limpar' || t.includes('resetar') || t.includes('limpar campos')) {
      const which = panelLogin.classList.contains('active') ? 'login' : 'cadastro';
      clearForm(which);
      speak('Campos limpos');
    } else {
      speak('Comando não reconhecido. Tente: ir para login, ir para cadastro, e-mail, senha, entrar, cadastrar, limpar.');
      setVoiceStatus('Comando não reconhecido');
    }
  }

  /** Instancia e configura o SpeechRecognition */
  function initRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Reconhecimento de voz não suportado neste navegador.', 'error');
      return null;
    }

    const rec          = new SpeechRec();
    rec.lang           = 'pt-BR';
    rec.continuous     = true;
    rec.interimResults = false;

    rec.onstart = () => {
      isListening = true;
      voiceBtn.classList.add('listening');
      voiceBtn.textContent = '🔴 Ouvindo…';
      voiceBtn.setAttribute('aria-pressed', 'true');
      setVoiceStatus('🎙️ Ouvindo… fale um comando');
      speak('Guia por voz ativado. Fale um comando.');
    };

    rec.onend = () => {
      if (isListening) rec.start(); // mantém ativo enquanto não for desligado
    };

    rec.onerror = ev => {
      if (ev.error === 'not-allowed') {
        showToast('Permissão de microfone negada.', 'error');
        stopVoice();
      }
    };

    rec.onresult = ev => {
      const result = ev.results[ev.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript;
        setVoiceStatus(`Ouvi: "${transcript}"`);
        voiceAction(transcript);
      }
    };

    return rec;
  }

  /** Para o reconhecimento de voz e restaura o botão */
  function stopVoice() {
    isListening = false;
    if (recognition) { recognition.stop(); recognition = null; }
    voiceBtn.classList.remove('listening');
    voiceBtn.innerHTML = '🎤 Guia por Voz';
    voiceBtn.setAttribute('aria-pressed', 'false');
    setVoiceStatus('Guia por voz desativado', true);
    speak('Guia por voz desativado.');
    setTimeout(() => setVoiceStatus('', false), 2000);
  }

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      stopVoice();
    } else {
      recognition = initRecognition();
      if (recognition) recognition.start();
    }
  });

  /* ──────────────────────────────────────────────────────
   * Atalhos de teclado globais
   * ────────────────────────────────────────────────────── */

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const toast = $('toast');
      if (toast.classList.contains('show')) { toast.className = ''; }
      if (isListening) stopVoice();
    }
  });

})();
