/* ─── Mentor Onboarding + Chat (Project Version) ─────────────────────── */

const API_ENDPOINT = '/api/chat';
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are an expert career mentor for students and early-career professionals. Your role is to help them with education, skills development, projects, internships, and career planning.

You have collected their detailed profile:
- Name: {name}
- Career Goal: {goal}
- Current Level: {level}
- Interest Areas: {interests}
- Skills to Develop: {skills}
- Current Challenge: {challenge}

Now provide highly personalized guidance:
1. Start by greeting them warmly with their name
2. Acknowledge their career goal and current level
3. Address their biggest challenge directly with actionable steps
4. Suggest 2-3 specific projects or learning paths aligned to their interests and goals
5. Create a personalized skill development roadmap
6. Provide resources and next immediate actions
7. Answer any questions they have

Be encouraging, practical, and specific. Use bullet points and clear structure. Make the guidance feel like it's written just for them.`;

let currentStep = 1;
let totalSteps = 3;
let userProfile = {
  name: '',
  email: '',
  dob: '',
  goal: '',
  level: '',
  interests: '',
  skills: '',
  challenge: ''
};


let isLoading = false;
let messageHistory = [];

// ─── DOM REFS ──────────────────────────────────────────────────────────
const onboardingPane = document.getElementById('onboardingPane');
const completionPane = document.getElementById('completionPane');
const chatContainer = document.getElementById('chatContainer');
const onboardingForm = document.getElementById('onboardingForm');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const stepCounter = document.getElementById('stepCounter');
const messagesWrap = document.getElementById('messagesWrap');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');


// ─── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Form navigation
  nextBtn.addEventListener('click', handleNext);
  prevBtn.addEventListener('click', handlePrev);

  const degreeSelect = document.getElementById('userDegree');
  const levelSelect = document.getElementById('userRole');
  const interestButtons = document.querySelectorAll('.interest-btn');
  const skillsText = document.getElementById('userSkills');
  const challengeText = document.getElementById('userChallenge');

  if (degreeSelect) {
    degreeSelect.addEventListener('change', () => {
      // Use same "goal" field in the prompt, so it impacts the mentor output.
      userProfile.goal = degreeSelect.value;
    });
  }

  if (levelSelect) {
    levelSelect.addEventListener('change', () => {
      userProfile.level = levelSelect.value;
    });
  }

  interestButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      interestButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      userProfile.interests = btn.dataset.value;
    });
  });

  if (skillsText) {
    skillsText.addEventListener('input', () => {
      userProfile.skills = skillsText.value;
    });
  }

  if (challengeText) {
    challengeText.addEventListener('input', () => {
      userProfile.challenge = challengeText.value;
    });
  }

  // Chat input
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) triggerSend();
    }
  });

  sendBtn.addEventListener('click', () => { if (!isLoading) triggerSend(); });

  clearChatBtn.addEventListener('click', clearChat);

  // Save + navigation buttons
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      try {
        // Optional persistence hook (no server route assumed)
        await fetch('/api/save-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userProfile.name,
            email: userProfile.email,
            dob: userProfile.dob,
            goal: userProfile.goal,
            level: userProfile.level,
            mainGoal: userProfile.interests,
            skills: userProfile.skills,
            challenge: userProfile.challenge,
          })
        }).catch(() => null);
      } finally {
        // After save, go to dashboard
        window.location.href = '/dashboard';
      }
    });
  }

  // Fallback: direct dashboard
  dashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard';
  });


  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
  });
});

// ─── FORM NAVIGATION ───────────────────────────────────────────────────
function handleNext(e) {
  e.preventDefault();

  if (currentStep === 1) {

    const name = document.getElementById('userName')?.value?.trim();
    const email = document.getElementById('userEmail')?.value?.trim();
    const dob = document.getElementById('userDob')?.value?.trim();

    if (!name) {
      alert('Please enter your name');
      return;
    }
    if (!email) {
      alert('Please enter your email');
      return;
    }
    if (!dob) {
      alert('Please select your date of birth');
      return;
    }

    userProfile.name = name;
    userProfile.email = email;
    userProfile.dob = dob;
  }


  if (currentStep === 2) {
    if (!userProfile.goal) {
      alert('Please select your course/degree');
      return;
    }
    if (!userProfile.level) {
      alert('Please select your current level');
      return;
    }
  }

  if (currentStep === 3) {
    // Step 3 now captures main goal (instead of interests)
    if (!userProfile.interests) {
      alert('Please select your main goal');
      return;
    }
    if (!userProfile.skills.trim()) {
      alert('Please tell us what skills you want to develop');
      return;
    }
    if (!userProfile.challenge.trim()) {
      alert('Please share your biggest challenge');
      return;
    }
    completeOnboarding();
    return;
  }


  currentStep++;
  updateFormDisplay();
}

function handlePrev(e) {
  e.preventDefault();
  if (currentStep > 1) {
    currentStep--;
    updateFormDisplay();
  }
}

function updateFormDisplay() {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
  
  // Show current step
  document.querySelector(`.form-step[data-step="${currentStep}"]`).style.display = 'block';

  // Update header
  stepCounter.textContent = `${currentStep} of ${totalSteps}`;

  // Show/hide prev button
  prevBtn.style.display = currentStep > 1 ? 'block' : 'none';

  // Update next button text
  nextBtn.textContent = currentStep === totalSteps ? 'Start Mentoring →' : 'Next →';
}

function completeOnboarding() {
  // Hide form, show completion pane
  onboardingPane.style.display = 'none';
  completionPane.style.display = 'flex';
}

// ─── CHAT FUNCTIONS ───────────────────────────────────────────────────
function triggerSend() {
  const text = userInput.value.trim();
  if (text) sendMessage(text);
}

async function sendMessage(text) {
  if (!text || isLoading) return;

  // Add user message
  appendMessage('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';

  // Push to history
  messageHistory.push({ role: 'user', content: text });

  // Show typing
  const typingEl = showTyping();
  setLoading(true);

  try {
    const systemPrompt = SYSTEM_PROMPT
      .replace('{name}', userProfile.name)
      .replace('{goal}', userProfile.goal)
      .replace('{level}', userProfile.level)
      .replace('{interests}', userProfile.interests)
      .replace('{skills}', userProfile.skills)
      .replace('{challenge}', userProfile.challenge)
      // Optional demographic fields
      .replace('{email}', userProfile.email)
      .replace('{dob}', userProfile.dob);



    const response = await fetch(API_ENDPOINT, {

      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: systemPrompt,
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

  } catch (err) {
    typingEl.remove();
    appendMessage('ai', `⚠️ **Error:** ${err.message}\n\nPlease check your connection and try again.`);
  } finally {
    setLoading(false);
    scrollToBottom();
  }
}

function appendMessage(role, text) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const isAI = role === 'ai';

  row.innerHTML = `
    <div class="msg-avatar ${isAI ? 'ai' : 'user-av'}">
      ${isAI
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`
        : userProfile.name.charAt(0).toUpperCase()}
    </div>
    <div class="msg-content">
      <div class="msg-meta">
        <span class="msg-name">${isAI ? 'Mentor' : userProfile.name}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-bubble">${formatText(text)}</div>
      ${isAI ? `
      <div class="msg-actions">
        <button class="msg-action-btn" onclick="copyMsg(this)">Copy</button>
      </div>` : ''}
    </div>`;

  messagesWrap.appendChild(row);
  scrollToBottom();
}

function formatText(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
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

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoading(state) {
  isLoading = state;
  sendBtn.disabled = state;
  userInput.disabled = state;
}

function clearChat() {
  messageHistory = [];
  messagesWrap.innerHTML = '';
  userInput.value = '';
  userInput.style.height = 'auto';
}

function copyMsg(btn) {
  const bubble = btn.closest('.msg-content').querySelector('.msg-bubble');
  navigator.clipboard.writeText(bubble.innerText).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  });
}
