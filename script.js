// ==========================================
// 1. CONFIGURAÇÃO
// ==========================================
// A chave da API fica no servidor. O navegador só fala com /api/chat,
// que escolhe entre regras (L0), Groq (L1) e NVIDIA (L2).
const API_PROXY = "/api/chat";
const TIMEOUT_MS = 50000;

// id da sessão: mantém o estado da conversa (projeto, nível...) no servidor
const SESSION_ID = (() => {
    try {
        let s = localStorage.getItem('lunox_session');
        if (!s) {
            s = 's-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
            localStorage.setItem('lunox_session', s);
        }
        return s;
    } catch (e) {
        return 's-' + Math.random().toString(36).slice(2, 10);
    }
})();

// histórico local, enviado como contexto (o system prompt vive no servidor)
const HISTORICO = [];

// ==========================================
// 2. LÓGICA DO CHAT E IA
// ==========================================
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

async function enviarMensagem() {
    const texto = userInput.value.trim();
    if (!texto) return;

    console.log(`[Lunox] Usuário enviou: "${texto}"`);

    adicionarMensagem(texto, 'user');
    userInput.value = '';

    const loadingId = adicionarMensagem("Lunox está pensando... ✨", 'lunox');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const inicio = Date.now();

    try {
        const payload = {
            session: SESSION_ID,
            mensagem: texto,
            messages: HISTORICO.concat([{ role: "user", content: texto }])
        };

        // LOG 2: Payload enviado
        console.log("[Lunox API] Enviando para o roteador:", API_PROXY, "| sessão:", SESSION_ID);
        
        const response = await fetch(API_PROXY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify(payload)
        });
            
        clearTimeout(timeoutId);

        // LOG 3: Status da Resposta HTTP
        console.log(`[Lunox API] Resposta recebida. Status HTTP: ${response.status} ${response.statusText}`);

        // Se a resposta não for OK (ex: 401, 404, 500), captura o texto do erro
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Lunox API Erro] Detalhes do erro da NVIDIA:", errorText);
            const err = new Error(`Erro HTTP: ${response.status} - ${errorText}`);
            err.status = response.status;
            err.detail = errorText;
            throw err;
        }

        const data = await response.json();
        
        document.getElementById(loadingId).remove();

        // LOG 4: Sucesso
        if (data.choices && data.choices.length > 0) {
            const camada = data.lunox && data.lunox.layer;
            console.log(`[Lunox API] Resposta gerada (camada L${camada}).`);
            const respostaLunox = data.choices[0].message.content;
            adicionarMensagem(respostaLunox, 'lunox');

            HISTORICO.push({ role: "user", content: texto }, { role: "assistant", content: respostaLunox });
            if (HISTORICO.length > 12) HISTORICO.splice(0, HISTORICO.length - 12);
        } else {
            console.error("[Lunox API Erro] A resposta da API não contém 'choices'. JSON recebido:", data);
            throw new Error("Formato de resposta inesperado da API.");
        }

    } catch (error) {
        clearTimeout(timeoutId);
        document.getElementById(loadingId).remove();
        
        // LOG 5: Captura de erros (Timeout, falha de rede, etc)
        console.error("=========================================");
        console.error("[Lunox Erro Crítico] Ocorreu um erro na chamada:");
        
        if (error.name === 'AbortError') {
            console.error(`MOTIVO: Timeout de ${TIMEOUT_MS / 1000}s excedido. A API demorou muito para responder.`);
        } else {
            console.error("MOTIVO:", error.message);
            console.error("STACK:", error.stack);
        }
        console.error("Acionando Fallback de segurança para o Pitch...");
        console.error("=========================================");

        reportarErro(error, texto, Date.now() - inicio);

        let fallbackText = "Miau! Tive um probleminha com a minha magia agora, mas eu já sei o que você precisa! ";
        if (texto.toLowerCase().includes("crud")) {
            fallbackText += "Para o seu CRUD, sua trilha será focada em: 1. Banco de Dados, 2. Conexão JDBC/API. Você já sabe Interfaces, então vamos pular isso!";
        } else {
            fallbackText += "Sua trilha está pronta! Vamos começar pelos fundamentos do seu projeto.";
        }
        
        adicionarMensagem(fallbackText, 'lunox');
    }

    if (texto.toLowerCase().includes("crud") || texto.toLowerCase().includes("bot") || texto.toLowerCase().includes("site") || texto.toLowerCase().includes("app")) {
        simularProgresso();
    }
}

// Envia o erro para o painel de logs (aparece na aba "API NVIDIA")
function reportarErro(error, prompt, ms) {
    const ehTimeout = error && error.name === 'AbortError';
    const dados = {
        kind: ehTimeout ? 'timeout' : 'error',
        status: error && error.status ? error.status : null,
        prompt: prompt || '',
        ms: ms || null,
        message: ehTimeout
            ? `Timeout de ${TIMEOUT_MS / 1000}s aguardando o roteador`
            : (error && error.message) || 'erro desconhecido',
        detail: error && error.detail ? error.detail : (error && error.stack) || ''
    };

    try {
        fetch('/api/client-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
            keepalive: true
        }).catch(function () { /* sem conexão com o painel */ });
    } catch (e) { /* ignora */ }
}

function adicionarMensagem(texto, tipo) {
    const div = document.createElement('div');
    div.classList.add('message', tipo === 'user' ? 'user-message' : 'lunox-message');
    div.innerText = texto;
    if (tipo === 'lunox') {
        div.id = 'msg-' + Date.now();
    }
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div.id;
}

userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') enviarMensagem();
});

// ==========================================
// 3. LÓGICA DAS ESTRELAS E EVOLUÇÃO DO GATO
// ==========================================

const starsData = [
    { id: 'star-var', icon: '⭐', label: 'Variáveis' },
    { id: 'star-cond', icon: '🌟', label: 'Condições' },
    { id: 'star-loop', icon: '✨', label: 'Laços' },
    { id: 'star-func', icon: '💫', label: 'Funções' }
];

const starsContainer = document.getElementById('stars-container');
starsData.forEach(star => {
    const el = document.createElement('div');
    el.classList.add('star');
    el.id = star.id;
    el.innerText = star.icon;
    el.title = star.label;
    
    el.onclick = () => {
        console.log(`[Lunox UI] Estrela clicada manualmente: ${star.label}`);
        el.classList.add('active');
        verificarEvolucao();
    };
    starsContainer.appendChild(el);
});

function simularProgresso() {
    console.log("[Lunox UI] Iniciando animação de evolução do gatinho...");
    setTimeout(() => document.getElementById('star-var').classList.add('active'), 1500);
    setTimeout(() => document.getElementById('star-cond').classList.add('active'), 3000);
    setTimeout(() => {
        document.getElementById('star-loop').classList.add('active');
        verificarEvolucao(); 
    }, 4500);
    
    setTimeout(() => {
        document.getElementById('star-func').classList.add('active');
        verificarEvolucao(); 
    }, 6000);
}

function verificarEvolucao() {
    const ativas = document.querySelectorAll('.star.active').length;
    const petImage = document.getElementById('lunox-pet');
    const petStatus = document.getElementById('pet-status');
    const visualSection = document.getElementById('visual-section');

    if (ativas >= 1 && ativas < 3) {
        console.log("[Lunox UI] Evoluindo para Nível 2");
        petImage.src = "lunox2.png"; 
        petImage.onerror = function() { 
            console.warn("[Lunox UI] Imagem lunox2.png não encontrada. Usando fallback.");
            this.src='https://api.dicebear.com/7.x/bottts/svg?seed=LunoxNivel2'; 
        };
        petStatus.innerText = "Nível 2 - Explorador de Dados";
        petStatus.style.color = "#b3a1d9";
        visualSection.classList.remove('evolved');
    } else if (ativas >= 3) {
        console.log("[Lunox UI] Evoluindo para Nível 3 (Máximo)");
        petImage.src = "lunox3.png"; 
        petImage.onerror = function() { 
            console.warn("[Lunox UI] Imagem lunox3.png não encontrada. Usando fallback.");
            this.src='https://api.dicebear.com/7.x/bottts/svg?seed=LunoxNivel3'; 
        };
        petStatus.innerText = "Nível 3 - Mago dos Códigos";
        petStatus.style.color = "#ffd700";
        visualSection.classList.add('evolved');
    }
}