/* ─── NexusCareer AI – app.js ─────────────────────────────────────── */

const API_ENDPOINT = '/api/chat';
const MODEL        = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are an expert career guidance assistant for students and professionals, especially tech-focused. You specialize in:

- Career path recommendations (Software Dev, Data Science, AI/ML, Cloud, Cybersecurity, UX/UI, Product Management, etc.)
- Skill development roadmaps with timelines
- Course & certification recommendations (free + paid)
- Salary benchmarks and negotiation tips
- Portfolio building and job search strategies
- College-to-career transitions for CS/IT students in India

Your responses are:
- Practical, specific, and actionable
- Structured with clear headings and bullet points when listing options
- Encouraging but honest about effort and timelines
- Tailored to Indian + global job markets

When giving roadmaps, use phases (e.g., Month 1-3, Month 4-6, etc.)
When comparing careers, use clear structured comparisons.
Keep responses focused and helpful — not too long, not too short.
Use **bold** for key terms, phases, and important callouts.`;


// ─── DOM REFS ──────────────────────────────────────────────────────────
const chatContainer  = document.getElementById('chatContainer');
const welcomePane    = document.getElementById('welcomePane');
const messagesWrap   = document.getElementById('messagesWrap');
const userInput      = document.getElementById('userInput');
const sendBtn        = document.getElementById('sendBtn');
const convList       = document.getElementById('convList');
const newChatBtn     = document.getElementById('newChatBtn');
const statMessages   = document.getElementById('statMessages');
const statTokens     = document.getElementById('statTokens');

let isLoading = false;
let messageHistory = [];
let messageCount = 0;
let tokenEstimate = 0;

// ─── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.prompt));
  });

  // Right panel module buttons
  document.querySelectorAll('.rp-module-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sendMessage(btn.dataset.prompt);
      btn.classList.add('active-flash');
      setTimeout(() => btn.classList.remove('active-flash'), 600);
    });
  });

  // Conversation list items
  document.querySelectorAll('.conv-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // New chat
  newChatBtn.addEventListener('click', clearChat);

  // Send on Enter (Shift+Enter = newline)
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) triggerSend();
    }
  });

  sendBtn.addEventListener('click', () => { if (!isLoading) triggerSend(); });

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
  });

  // Clear topbar button
  document.querySelector('.topbar-btn:last-of-type')?.addEventListener('click', clearChat);
});

// ─── TRIGGER SEND ──────────────────────────────────────────────────────
function triggerSend() {
  const text = userInput.value.trim();
  if (text) sendMessage(text);
}

// ─── MAIN SEND FUNCTION ────────────────────────────────────────────────
async function sendMessage(text) {
  if (!text || isLoading) return;

  // Hide welcome, show messages
  welcomePane.style.display  = 'none';
  messagesWrap.style.display = 'flex';

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';

  // Add user message to UI
  appendMessage('user', text);

  // Push to history
  messageHistory.push({ role: 'user', content: text });

  // Show typing
  const typingEl = showTyping();

  setLoading(true);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messageHistory,
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    typingEl.remove();

    appendMessage('ai', aiText);
    messageHistory.push({ role: 'assistant', content: aiText });

    updateStats(aiText);

  } catch (err) {
    typingEl.remove();
    appendMessage('ai', `⚠️ **Error:** ${err.message}\n\nPlease check your connection and try again.`);
  } finally {
    setLoading(false);
    scrollToBottom();
  }
}

// ─── APPEND MESSAGE ────────────────────────────────────────────────────
function appendMessage(role, text) {
  const now    = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const isAI = role === 'ai';

  row.innerHTML = `
    <div class="msg-avatar ${isAI ? 'ai' : 'user-av'}">
      ${isAI
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`
        : 'K'}
    </div>
    <div class="msg-content">
      <div class="msg-meta">
      <span class="msg-name">${isAI ? 'Mentor' : 'You'}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-bubble">${formatText(text)}</div>
      ${isAI ? `
      <div class="msg-actions">
        <button class="msg-action-btn" onclick="copyMsg(this)">Copy</button>
        <button class="msg-action-btn" onclick="thumbsAction(this, 'up')">👍</button>
        <button class="msg-action-btn" onclick="thumbsAction(this, 'down')">👎</button>
      </div>` : ''}
    </div>`;

  messagesWrap.appendChild(row);
  scrollToBottom();
}

// ─── FORMAT TEXT (markdown-lite) ───────────────────────────────────────
function formatText(text) {
  return text
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, (m) => {
      if (m.trim() === '' || m.startsWith('<')) return m;
      return m;
    })
    // Wrap in paragraph
    .replace(/^([^<\n].+)$/gm, (m) => {
      if (m.trim().startsWith('<') || m.trim() === '') return m;
      return m;
    })
    .split('\n')
    .map(line => {
      if (line.trim() === '') return '';
      if (line.match(/^<[hul]/)) return line;
      if (line.match(/^<li>/)) return line;
      return `<p>${line}</p>`;
    })
    .filter(l => l !== '<p></p>' && l !== '')
    .join('\n');
}

// ─── TYPING INDICATOR ──────────────────────────────────────────────────
function showTyping() {
  const row = document.createElement('div');
  row.className = 'message-row';
  row.id = 'typingRow';
  row.innerHTML = `
    <div class="msg-avatar ai">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
    </div>
    <div class="msg-content">
      <div class="msg-meta">
        <span class="msg-name">Mentor</span>
        <span class="msg-time">typing…</span>
      </div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  messagesWrap.appendChild(row);
  scrollToBottom();
  return row;
}

// ─── HELPERS ───────────────────────────────────────────────────────────
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoading(state) {
  isLoading = state;
  if (sendBtn) sendBtn.disabled = state;
  if (userInput) userInput.disabled = state;
}

function clearChat() {
  messageHistory = [];
  messageCount   = 0;
  tokenEstimate  = 0;
  if (messagesWrap) {
    messagesWrap.innerHTML = '';
    messagesWrap.style.display = 'none';
  }
  if (welcomePane) welcomePane.style.display = 'flex';
  updateStatDisplay();
}

function updateStats(aiText) {
  messageCount += 2;
  tokenEstimate += Math.ceil(aiText.split(' ').length * 1.3) + 20;
  updateStatDisplay();
}

function updateStatDisplay() {
  if (statMessages) statMessages.textContent = messageCount;
  if (statTokens) {
    statTokens.textContent = tokenEstimate > 999
      ? (tokenEstimate / 1000).toFixed(1) + 'k'
      : tokenEstimate;
  }
}

function copyMsg(btn) {
  const bubble = btn.closest('.msg-content').querySelector('.msg-bubble');
  navigator.clipboard.writeText(bubble.innerText).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  });
}

function thumbsAction(btn, dir) {
  btn.style.opacity = '1';
  btn.style.borderColor = dir === 'up' ? '#22c55e' : '#ef4444';
  setTimeout(() => {
    btn.style.opacity = '';
    btn.style.borderColor = '';
  }, 1500);
}
