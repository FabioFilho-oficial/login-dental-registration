/**
 * DentalCare – Portal do Paciente
 * Lógica de: abas, validação, localStorage, toast e guia por voz contínuo
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────
   * Utilitários gerais
   * ────────────────────────────────────────────────────── */

  const $ = id => document.getElementById(id);

  function announce(msg) {
    const live = $('live-region');
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = msg; });
  }

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

  function showToast(msg, type = 'success') {
    const toast    = $('toast');
    const toastMsg = $('toast-msg');
    const icon     = toast.querySelector('.toast-icon');
    icon.textContent     = type === 'success' ? '✅' : '❌';
    toastMsg.textContent = msg;
    toast.className      = `show ${type}`;
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
      announce(msg); speak(msg);
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
      announce(msg); speak(msg);
    }
  }

  tabLogin.addEventListener('click', () => switchTab(true));
  tabCadastro.addEventListener('click', () => switchTab(false));

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

  function setFieldError(inputEl, msgEl, msg) {
    if (msg) {
      inputEl.classList.add('invalid');
      msgEl.textContent = msg;
    } else {
      inputEl.classList.remove('invalid');
      msgEl.textContent = '';
    }
  }

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
    } else { setFieldError($('login-email'), $('login-email-msg'), ''); }

    if (!senha) {
      setFieldError($('login-senha'), $('login-senha-msg'), 'Informe sua senha.');
      ok = false;
    } else { setFieldError($('login-senha'), $('login-senha-msg'), ''); }

    if (!ok) return;

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
    } else { setFieldError($('cad-nome'), $('cad-nome-msg'), ''); }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError($('cad-email'), $('cad-email-msg'), 'Informe um e-mail válido.');
      ok = false;
    } else { setFieldError($('cad-email'), $('cad-email-msg'), ''); }

    if (!senha || senha.length < 6) {
      setFieldError($('cad-senha'), $('cad-senha-msg'), 'A senha deve ter no mínimo 6 caracteres.');
      ok = false;
    } else { setFieldError($('cad-senha'), $('cad-senha-msg'), ''); }

    if (senha !== confirmar) {
      setFieldError($('cad-confirmar'), $('cad-confirmar-msg'), 'As senhas não coincidem.');
      ok = false;
    } else { setFieldError($('cad-confirmar'), $('cad-confirmar-msg'), ''); }

    if (!ok) return;

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
   * Navegação entre campos por voz
   * ────────────────────────────────────────────────────── */

  /**
   * Retorna os elementos focáveis do painel visível,
   * na ordem de leitura (top → bottom).
   */
  function getFocusableElements() {
    const activePanel = panelLogin.classList.contains('active')
      ? panelLogin
      : panelCadastro;

    return Array.from(
      activePanel.querySelectorAll(
        'input, button:not(.pwd-toggle), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.disabled && el.offsetParent !== null);
  }

  /**
   * Retorna o nome legível de um elemento focável.
   * @param {HTMLElement} el
   */
  function getFieldName(el) {
    // Tenta label associado
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    // aria-label
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    // placeholder
    if (el.placeholder) return el.placeholder;
    // botão: texto interno
    if (el.tagName === 'BUTTON') return el.textContent.trim();
    return 'campo';
  }

  /** Foca no próximo elemento focável do painel ativo */
  function focusNext() {
    const els   = getFocusableElements();
    const curr  = document.activeElement;
    const idx   = els.indexOf(curr);
    const next  = els[idx + 1] ?? els[0];
    next.focus();
    const name = getFieldName(next);
    speak(`Indo para ${name}`);
    updateVoicePanel({ lastCommand: `próximo campo → ${name}` });
  }

  /** Foca no elemento anterior focável do painel ativo */
  function focusPrev() {
    const els   = getFocusableElements();
    const curr  = document.activeElement;
    const idx   = els.indexOf(curr);
    const prev  = els[idx - 1] ?? els[els.length - 1];
    prev.focus();
    const name = getFieldName(prev);
    speak(`Indo para ${name}`);
    updateVoicePanel({ lastCommand: `campo anterior → ${name}` });
  }

  /** Fala o nome do campo atualmente focado */
  function announceCurrentField() {
    const curr = document.activeElement;
    if (!curr || curr === document.body) {
      speak('Nenhum campo selecionado.');
      return;
    }
    const name = getFieldName(curr);
    speak(`Você está em: ${name}`);
    updateVoicePanel({ lastCommand: `qual campo → ${name}` });
  }

  /* ──────────────────────────────────────────────────────
   * Painel visual de voz
   * ────────────────────────────────────────────────────── */

  /**
   * Atualiza o painel visual de status de voz.
   * @param {{ status?: string, lastCommand?: string }} opts
   */
  function updateVoicePanel({ status, lastCommand } = {}) {
    const panel      = $('voice-panel');
    const statusEl   = $('vp-status');
    const commandEl  = $('vp-command');

    if (status !== undefined) {
      statusEl.textContent = status;
      panel.className = status.includes('Escutando')
        ? 'voice-panel listening'
        : 'voice-panel';
    }

    if (lastCommand !== undefined) {
      commandEl.textContent = `Você disse: ${lastCommand}`;
    }
  }

  /* ──────────────────────────────────────────────────────
   * Normalização de texto para comandos de voz
   * ────────────────────────────────────────────────────── */

  /**
   * Normaliza o texto para comparação flexível
   * - Remove acentos
   * - Remove pontuação (hífen, vírgula, ponto, etc.)
   * - Converte para minúsculo
   */
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[.,;:!?\-_()\[\]{}'"`~@#$%^&*+=<>/\\|]/g, '') // Remove pontuação
      .trim();
  }

  /* ──────────────────────────────────────────────────────
   * Interpretação de comandos de voz (MATCH FLEXÍVEL)
   * ────────────────────────────────────────────────────── */

  function voiceAction(text) {
    const normalizedText = normalizeText(text);
    updateVoicePanel({ lastCommand: text });

    /* ── Navegação entre campos ── */
    if (normalizedText.includes('proximo') || normalizedText === 'descer' || normalizedText.includes('proximo campo')) {
      focusNext(); return;
    }
    if (normalizedText.includes('anterior') || normalizedText === 'subir' || normalizedText.includes('campo anterior') || normalizedText.includes('voltar campo')) {
      focusPrev(); return;
    }
    if (normalizedText.includes('qual campo') || normalizedText.includes('onde estou') || normalizedText.includes('campo atual')) {
      announceCurrentField(); return;
    }

    /* ── Troca de painel ── */
    if (normalizedText.includes('ir para login') || normalizedText.includes('tela de login') || normalizedText.includes('voltar login')) {
      speak('Indo para login'); switchTab(true); tabLogin.focus(); return;
    }
    if (normalizedText.includes('ir para cadastro') || normalizedText.includes('tela de cadastro') || normalizedText.includes('novo cadastro')) {
      speak('Indo para cadastro'); switchTab(false); tabCadastro.focus(); return;
    }

    /* ── Foco direto em campos ── */
    if (normalizedText.includes('nome') && !normalizedText.includes('email') && !normalizedText.includes('senha')) {
      const el = $('cad-nome');
      if (!el.closest('[hidden]')) { el.focus(); speak('Campo nome'); }
      else speak('Vá para o formulário de cadastro primeiro.');
      return;
    }
    if (normalizedText.includes('email')) {
      const el = panelLogin.classList.contains('active') ? $('login-email') : $('cad-email');
      el.focus(); speak('Campo e-mail'); return;
    }
    if (normalizedText.includes('senha') && !normalizedText.includes('confirmar')) {
      const el = panelLogin.classList.contains('active') ? $('login-senha') : $('cad-senha');
      el.focus(); speak('Campo senha'); return;
    }
    if (normalizedText.includes('confirmar senha') || normalizedText.includes('confirma senha') || normalizedText === 'confirmar') {
      const el = $('cad-confirmar');
      if (!el.closest('[hidden]')) { el.focus(); speak('Campo confirmar senha'); }
      else speak('Vá para o cadastro primeiro.');
      return;
    }

    /* ── Ações de formulário ── */
    if (normalizedText.includes('entrar') || normalizedText.includes('fazer login') || normalizedText.includes('logar') || normalizedText.includes('acessar')) {
      if (panelLogin.classList.contains('active')) { speak('Entrando'); $('btn-entrar').click(); }
      else speak('Vá para o login primeiro.');
      return;
    }
    if (normalizedText.includes('cadastrar') || normalizedText.includes('criar conta') || normalizedText.includes('registrar')) {
      if (panelCadastro.classList.contains('active')) { speak('Cadastrando'); $('btn-cadastrar').click(); }
      else speak('Vá para o cadastro primeiro.');
      return;
    }
    if (normalizedText.includes('limpar') || normalizedText.includes('resetar') || normalizedText.includes('limpar campos') || normalizedText.includes('apagar tudo')) {
      const which = panelLogin.classList.contains('active') ? 'login' : 'cadastro';
      clearForm(which); speak('Campos limpos'); return;
    }

    
 
  }

  /* ──────────────────────────────────────────────────────
   * Guia por Voz – Web Speech API (contínuo)
   * ────────────────────────────────────────────────────── */

  const voiceBtn  = $('voice-btn');
  let recognition = null;
  let isListening = false;

  /** Verifica suporte e retorna true/false */
  function checkSupport() {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!supported) {
      showToast('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.', 'error');
      voiceBtn.disabled = true;
      voiceBtn.title    = 'Não suportado neste navegador';
      updateVoicePanel({
        status: '⚠️ Não suportado',
        lastCommand: 'Use Chrome ou Edge para comandos de voz'
      });
    }
    return supported;
  }

  function startVoice() {
    if (!checkSupport()) return;

    const SpeechRec    = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition        = new SpeechRec();
    recognition.lang           = 'pt-BR';
    recognition.continuous     = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      voiceBtn.textContent = '🔇 Desativar Voz';
      voiceBtn.setAttribute('aria-pressed', 'true');
      voiceBtn.classList.add('listening');
      updateVoicePanel({ status: '🎤 Escutando...' });
      speak('Comandos de voz ativados');
      announce('Reconhecimento de voz iniciado');
    };

    // Reinicia automaticamente se parar (ex: silêncio longo)
    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch (_) { /* já iniciando */ }
      }
    };

    recognition.onerror = ev => {
      if (ev.error === 'not-allowed') {
        showToast('Permissão de microfone negada. Habilite nas configurações do navegador.', 'error');
        stopVoice();
      } else if (ev.error === 'network') {
        showToast('Erro de rede no reconhecimento de voz.', 'error');
      }
      // 'no-speech' e 'aborted' são ignorados — o onend vai reiniciar
    };

    recognition.onresult = ev => {
      const result = ev.results[ev.results.length - 1];
      if (result.isFinal) {
        voiceAction(result[0].transcript.trim());
      }
    };

    recognition.start();
  }

  function stopVoice() {
    isListening = false;
    if (recognition) { recognition.stop(); recognition = null; }
    voiceBtn.textContent = '🎤 Ativar Voz';
    voiceBtn.setAttribute('aria-pressed', 'false');
    voiceBtn.classList.remove('listening');
    updateVoicePanel({ status: '🔇 Desativado', lastCommand: '—' });
    speak('Comandos de voz desativados');
    announce('Reconhecimento de voz encerrado');
  }

  voiceBtn.addEventListener('click', () => {
    isListening ? stopVoice() : startVoice();
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

  /* ──────────────────────────────────────────────────────
   * Inicialização
   * ────────────────────────────────────────────────────── */

  // Verifica suporte silenciosamente ao carregar
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    voiceBtn.disabled = true;
    voiceBtn.title    = 'Reconhecimento de voz não suportado neste navegador (use Chrome/Edge)';
    updateVoicePanel({
      status: '⚠️ Não suportado',
      lastCommand: 'Use Chrome ou Edge'
    });
  } else {
    updateVoicePanel({ status: '🔇 Desativado', lastCommand: '—' });
  }

})();
