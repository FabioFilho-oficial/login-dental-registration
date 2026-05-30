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

  /**
   * Flag global: true enquanto o sistema estiver reproduzindo fala.
   * Bloqueia o microfone durante a síntese para evitar eco em loop.
   */
  let isSpeaking = false;

  /**
   * Tempo (ms) que o microfone permanece surdo APÓS o fim da fala
   * sintetizada, para absorver eco residual do ambiente.
   */
  const DEAF_DELAY = 600;

  /**
   * Fala um texto e suprime o microfone enquanto fala.
   * Estratégias anti-eco:
   *  1. isSpeaking = true  → onresult descarta tudo durante a fala
   *  2. recognition.stop() → fecha o microfone fisicamente
   *  3. Após fala + DEAF_DELAY, reabre somente se isListening for true
   */
  function speak(text) {
    if (!window.speechSynthesis) return;

    speechSynthesis.cancel();

    // Fecha microfone ANTES de começar a falar
    isSpeaking = true;
    if (typeof recognition !== 'undefined' && recognition) {
      try { recognition.stop(); } catch (_) { /* já parado */ }
    }

    const u  = new SpeechSynthesisUtterance(text);
    u.lang   = 'pt-BR';
    u.rate   = 1.05;

    const reopen = () => {
      setTimeout(() => {
        isSpeaking = false;
        if (isListening && recognition) {
          try { recognition.start(); } catch (_) { /* já iniciando */ }
        }
      }, DEAF_DELAY);
    };

    u.onend   = reopen;
    u.onerror = reopen; // fallback se onend não disparar (bug Chrome)

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
   * Normalização do texto reconhecido
   * ────────────────────────────────────────────────────── */

  /**
   * Normaliza o transcript para comparação flexível:
   *  1. Minúsculas
   *  2. Remove acentos (NFD + strip combining marks)
   *  3. Remove pontuação e hífens
   *  4. Colapsa espaços extras
   *
   * Exemplos:
   *   "E-mail"       → "email"
   *   "próximo"      → "proximo"
   *   "Confirmar."   → "confirmar"
   *   "ir para login"→ "ir para login"
   */
  function normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')                      // decompõe acentos
      .replace(/[\u0300-\u036f]/g, '')       // remove diacríticos
      .replace(/[-.,!?;:'"()]/g, ' ')        // pontuação → espaço
      .replace(/\s+/g, ' ')                  // colapsa espaços
      .trim();
  }

  /**
   * Retorna true se o texto normalizado contém QUALQUER uma das palavras-chave.
   * @param {string} n       - texto já normalizado
   * @param {string[]} keys  - lista de palavras/frases a testar
   */
  function has(n, keys) {
    return keys.some(k => n.includes(k));
  }

  /* ──────────────────────────────────────────────────────
   * Interpretação de comandos de voz
   * ────────────────────────────────────────────────────── */

  function voiceAction(rawText) {
    const n = normalize(rawText);           // texto normalizado para lógica
    updateVoicePanel({ lastCommand: rawText });

    // Helper: loga no console para debug
    const dispatch = (action) => {
      console.log(`[Voz] raw="${rawText}" | normalizado="${n}" | ação="${action}"`);
      speak(`Comando reconhecido: ${action}`);
    };

    /* ── 1. PRÓXIMO CAMPO ─────────────────────────────── */
    if (has(n, ['proximo', 'descer', 'avançar', 'avancar', 'ir pro proximo', 'ir para o proximo',
                'seguinte', 'vai pro proximo', 'proximo campo', 'proxima'])) {
      dispatch('próximo campo');
      focusNext();
      return;
    }

    /* ── 2. CAMPO ANTERIOR ────────────────────────────── */
    if (has(n, ['anterior', 'subir', 'voltar', 'campo de cima', 'campo anterior',
                'campo de volta', 'voltar campo', 'campo acima', 'volta'])) {
      dispatch('campo anterior');
      focusPrev();
      return;
    }

    /* ── 3. QUAL CAMPO ESTOU ──────────────────────────── */
    if (has(n, ['qual campo', 'onde estou', 'campo atual', 'em qual campo',
                'qual e o campo', 'que campo'])) {
      dispatch('qual campo estou');
      announceCurrentField();
      return;
    }

    /* ── 4. IR PARA LOGIN ─────────────────────────────── */
    if (has(n, ['ir para login', 'tela de login', 'voltar login', 'vai para login',
                'abrir login', 'pagina de login', 'ir ao login', 'entrar na tela',
                'tela login', 'formulario de login'])) {
      dispatch('ir para login');
      switchTab(true);
      tabLogin.focus();
      return;
    }

    /* ── 5. IR PARA CADASTRO ──────────────────────────── */
    if (has(n, ['ir para cadastro', 'tela de cadastro', 'novo cadastro', 'vai para cadastro',
                'abrir cadastro', 'pagina de cadastro', 'ir ao cadastro',
                'tela cadastro', 'formulario de cadastro', 'criar conta'])) {
      dispatch('ir para cadastro');
      switchTab(false);
      tabCadastro.focus();
      return;
    }

    /* ── 6. CAMPO CONFIRMAR SENHA ─────────────────────── */
    // Deve vir ANTES do bloco de "senha" para evitar falso match
    if (has(n, ['confirmar', 'confirma', 'confirmacao', 'confirmar senha',
                'repetir senha', 'repete a senha', 'segunda senha',
                'campo confirmacao', 'confirme'])) {
      dispatch('confirmar senha');
      const el = $('cad-confirmar');
      if (!el.closest('[hidden]')) { el.focus(); }
      else { speak('Vá para o formulário de cadastro primeiro.'); }
      return;
    }

    /* ── 7. CAMPO SENHA ───────────────────────────────── */
    if (has(n, ['senha', 'campo senha', 'a senha', 'minha senha',
                'digitar senha', 'escrever senha', 'campo de senha'])) {
      dispatch('campo senha');
      const el = panelLogin.classList.contains('active') ? $('login-senha') : $('cad-senha');
      el.focus();
      return;
    }

    /* ── 8. CAMPO E-MAIL ──────────────────────────────── */
    if (has(n, ['email', 'e mail', 'meu email', 'campo email', 'endereco de email',
                'endereço', 'campo de email', 'digitar email', 'escrever email',
                'vai pro email', 'campo do email', 'no email'])) {
      dispatch('campo e-mail');
      const el = panelLogin.classList.contains('active') ? $('login-email') : $('cad-email');
      el.focus();
      return;
    }

    /* ── 9. CAMPO NOME ────────────────────────────────── */
    if (has(n, ['nome', 'campo nome', 'meu nome', 'digitar nome',
                'escrever nome', 'campo do nome', 'inserir nome'])) {
      dispatch('campo nome');
      const el = $('cad-nome');
      if (!el.closest('[hidden]')) { el.focus(); }
      else { speak('Vá para o formulário de cadastro primeiro.'); }
      return;
    }

    /* ── 10. ENTRAR / SUBMETER LOGIN ──────────────────── */
    if (has(n, ['entrar', 'fazer login', 'logar', 'acessar', 'submeter login',
                'enviar login', 'clica em entrar', 'botao entrar',
                'confirmar login', 'efetuar login'])) {
      dispatch('entrar');
      if (panelLogin.classList.contains('active')) { $('btn-entrar').click(); }
      else { speak('Vá para o formulário de login primeiro.'); }
      return;
    }

    /* ── 11. CADASTRAR / SUBMETER CADASTRO ────────────── */
    if (has(n, ['cadastrar', 'registrar', 'criar usuario', 'salvar cadastro',
                'enviar cadastro', 'submeter cadastro', 'clica em cadastrar',
                'botao cadastrar', 'finalizar cadastro', 'concluir cadastro'])) {
      dispatch('cadastrar');
      if (panelCadastro.classList.contains('active')) { $('btn-cadastrar').click(); }
      else { speak('Vá para o formulário de cadastro primeiro.'); }
      return;
    }

    /* ── 12. LIMPAR CAMPOS ────────────────────────────── */
    if (has(n, ['limpar', 'resetar', 'apagar tudo', 'limpar campos',
                'zerar campos', 'limpar formulario', 'apagar campos',
                'resetar campos', 'reset', 'limpa tudo'])) {
      dispatch('limpar campos');
      const which = panelLogin.classList.contains('active') ? 'login' : 'cadastro';
      clearForm(which);
      return;
    }

    /* ── Não reconhecido ─────────────────────────────── */
    console.log(`[Voz] raw="${rawText}" | normalizado="${n}" | ação="não reconhecido"`);
    speak('Comando não reconhecido. Tente: e-mail, senha, próximo campo, entrar, cadastrar.');
    updateVoicePanel({ lastCommand: `"${rawText}" — não reconhecido` });
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

    // Reinicia automaticamente ao parar por silêncio,
    // MAS não reabre se o sistema estiver falando (isSpeaking = true),
    // pois speak() já cuida de reabrir depois do DEAF_DELAY.
    recognition.onend = () => {
      if (isListening && !isSpeaking) {
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
      // Ignora tudo enquanto o sistema estiver falando (anti-eco)
      if (isSpeaking) {
        console.log('[Voz] resultado ignorado — sistema falando (anti-eco)');
        return;
      }
      const result = ev.results[ev.results.length - 1];
      if (result.isFinal) {
        voiceAction(result[0].transcript.trim());
      }
    };

    recognition.start();
  }

  function stopVoice() {
    isListening = false;
    isSpeaking  = false; // reseta flag anti-eco
    speechSynthesis.cancel(); // interrompe fala em curso
    if (recognition) { recognition.stop(); recognition = null; }
    voiceBtn.textContent = '🎤 Ativar Voz';
    voiceBtn.setAttribute('aria-pressed', 'false');
    voiceBtn.classList.remove('listening');
    updateVoicePanel({ status: '🔇 Desativado', lastCommand: '—' });
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
