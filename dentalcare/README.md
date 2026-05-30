# 🦷 DentalCare – Portal do Paciente

Tela de **login e cadastro** acessível, responsiva e com guia por voz, desenvolvida para uma clínica odontológica com HTML semântico, CSS puro e JavaScript Vanilla.

---

## 📁 Estrutura do projeto

```
dentalcare/
├── index.html        # Estrutura semântica da página
├── css/
│   └── style.css     # Estilos, tema e responsividade
├── js/
│   └── app.js        # Lógica, validação, localStorage e voz
└── README.md
```

---

## ✅ Funcionalidades

| Recurso | Descrição |
|---|---|
| Alternância de formulários | Troca entre Login e Cadastro sem recarregar a página |
| Validação em tempo real | Feedback inline por campo com mensagens de erro |
| Senhas iguais | Validação de confirmação de senha no cadastro |
| Persistência | Cadastro salvo no `localStorage`; login valida contra os dados armazenados |
| Toast de feedback | Notificação de sucesso ou erro simulando resposta de API |
| Toggle de senha | Botão para mostrar/ocultar senha em cada campo |

---

## ♿ Acessibilidade (WCAG 2.1)

- HTML semântico: `<header>`, `<main>`, `<section>`, `<form>`, `<fieldset>`, `<legend>`, `<label>`
- Padrão de abas ARIA: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`
- Navegação por teclado completa: **Tab**, **Enter**, **Esc**, **← →** nas abas
- Foco visível com `box-shadow` em todos os elementos interativos
- `aria-required`, `aria-describedby` associando campos às mensagens de erro
- `aria-live="polite"` para anúncios de mudança de estado
- `aria-live="assertive"` para mensagens críticas (toast)
- Skip link "Pular para o formulário"

---

## 🎤 Guia por Voz

Clique no botão flutuante **🎤 Guia por Voz** e fale um dos comandos:

| Comando | Ação |
|---|---|
| `"ir para login"` | Ativa o formulário de login |
| `"ir para cadastro"` | Ativa o formulário de cadastro |
| `"e-mail"` | Foca o campo de e-mail |
| `"senha"` | Foca o campo de senha |
| `"nome"` | Foca o campo de nome (cadastro) |
| `"confirmar senha"` | Foca o campo de confirmação (cadastro) |
| `"entrar"` | Submete o formulário de login |
| `"cadastrar"` | Submete o formulário de cadastro |
| `"limpar"` / `"resetar"` | Limpa todos os campos do painel ativo |

> **Requer:** permissão de microfone no navegador. Compatível com Chrome e Edge. Firefox tem suporte parcial.

---

## 📱 Responsividade

- Layout **mobile-first**
- Funciona bem em celular, tablet e desktop
- Teclado virtual não interfere nos campos

---

## 🎨 Design

- **Fontes:** Playfair Display (branding) + DM Sans (corpo)
- **Paleta:** Azul-marinho `#0d2b45`, Azul-céu `#3a9eca`, Verde-menta `#4cc9a0`
- **Animações:** entrada do card, transição de abas, pulse no botão de voz ativo

---

## 🚀 Como usar

1. Clone ou baixe o repositório
2. Abra `index.html` diretamente no navegador (não precisa de servidor)
3. Para usar o guia por voz, prefira **Chrome** ou **Edge** por melhor suporte à Web Speech API

```bash
git clone https://github.com/seu-usuario/dentalcare-login.git
cd dentalcare-login
# Abra index.html no navegador
```

---

## 🛠️ Tecnologias

- HTML5 semântico
- CSS3 (Custom Properties, Flexbox, animações)
- JavaScript ES6+ (Vanilla, IIFE)
- Web Speech API (SpeechRecognition + SpeechSynthesis)
- localStorage (persistência de usuários)

---

## 📄 Licença

MIT
