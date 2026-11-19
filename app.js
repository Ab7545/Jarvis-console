const lockScreen = document.getElementById("lock-screen");
const consoleUI = document.getElementById("console-ui");
const pinInput = document.getElementById("pin-input");
const endpointInput = document.getElementById("endpoint-input");
const unlockBtn = document.getElementById("unlock-btn");
const authError = document.getElementById("auth-error");

const chatStream = document.getElementById("chat-stream");
const promptInput = document.getElementById("prompt-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const ttsToggle = document.getElementById("tts-toggle");
const lockBtn = document.getElementById("lock-btn");
const telemetryBar = document.getElementById("telemetry-bar");
const statusDot = document.getElementById("status-dot");

let voiceEnabled = true;

// Restore session if already authenticated in this browser tab
window.addEventListener("DOMContentLoaded", () => {
  const savedPin = sessionStorage.getItem("jarvis_pin");
  const savedUrl = sessionStorage.getItem("jarvis_api");
  if (savedUrl) endpointInput.value = savedUrl;
  if (savedPin) verifyAndUnlock(savedPin, endpointInput.value, true);
});

unlockBtn.addEventListener("click", () => {
  verifyAndUnlock(pinInput.value.trim(), endpointInput.value.trim().replace(/\/$/, ""), false);
});
pinInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") unlockBtn.click();
});

async function verifyAndUnlock(pin, apiUrl, silent) {
  if (!pin) {
    if (!silent) authError.textContent = "ENTER SECURITY PIN";
    return;
  }
  authError.textContent = "VERIFYING HANDSHAKE...";
  try {
    const res = await fetch(`${apiUrl}/verify_pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Stark-Pin": pin }
    });
    if (!res.ok) throw new Error("INVALID PIN");

    const info = await res.json();
    sessionStorage.setItem("jarvis_pin", pin);
    sessionStorage.setItem("jarvis_api", apiUrl);

    lockScreen.classList.add("hidden");
    consoleUI.classList.remove("hidden");
    statusDot.classList.remove("offline");
    telemetryBar.textContent = `LINK: ENCRYPTED • DOCS INDEXED: ${info.docs_indexed ?? "ACTIVE"} • RTX 4060`;
    authError.textContent = "";
  } catch (err) {
    sessionStorage.removeItem("jarvis_pin");
    authError.textContent = "ACCESS DENIED: INVALID PIN OR MAINFRAME OFFLINE";
  }
}

lockBtn.addEventListener("click", () => {
  sessionStorage.removeItem("jarvis_pin");
  pinInput.value = "";
  consoleUI.classList.add("hidden");
  lockScreen.classList.remove("hidden");
});

ttsToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  ttsToggle.textContent = voiceEnabled ? "🔊 VOICE ON" : "🔇 MUTED";
});

function appendMessage(role, text, metaBadge = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  if (metaBadge) {
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = metaBadge;
    wrapper.appendChild(badge);
  }
  chatStream.appendChild(wrapper);
  chatStream.scrollTop = chatStream.scrollHeight;
  return bubble;
}

function speakBritish(text) {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const ukVoice = voices.find((v) => v.lang === "en-GB" && v.name.includes("Daniel")) ||
                  voices.find((v) => v.lang === "en-GB");
  if (ukVoice) utter.voice = ukVoice;
  utter.pitch = 0.88;
  utter.rate = 1.02;
  window.speechSynthesis.speak(utter);
}

async function sendDirective(customText = null) {
  const text = (customText ?? promptInput.value).trim();
  if (!text) return;
  if (!customText) promptInput.value = "";

  appendMessage("user", text);
  const botBubble = appendMessage("jarvis", "Processing neural telemetry...");

  const pin = sessionStorage.getItem("jarvis_pin");
  const apiUrl = sessionStorage.getItem("jarvis_api");

  try {
    const res = await fetch(`${apiUrl}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Stark-Pin": pin
      },
      body: JSON.stringify({
        text,
        telemetry: { device_id: "web_hud", client_timestamp: new Date().toISOString() }
      })
    });

    if (res.status === 401) {
      botBubble.textContent = "Security session expired. Please re-authenticate.";
      return;
    }

    const data = await res.json();
    botBubble.textContent = data.reply || "No response from mainframe.";

    const tags = [data.tool_invoked, data.action].filter(Boolean).join(" • ");
    if (tags) {
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = `⚡ ${tags}`;
      botBubble.parentElement.appendChild(badge);
    }

    speakBritish(data.reply);
  } catch (e) {
    statusDot.classList.add("offline");
    botBubble.textContent = "Mainframe uplink interrupted. Verify HP Omen tunnel status.";
  }
}

sendBtn.addEventListener("click", () => sendDirective());
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendDirective();
});
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => sendDirective(chip.dataset.cmd));
});

// Browser Web Speech API (Voice Input on Mac / Android / Chrome)
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRec) {
  const rec = new SpeechRec();
  rec.lang = "en-US";
  micBtn.addEventListener("click", () => {
    micBtn.classList.add("listening");
    rec.start();
  });
  rec.onresult = (e) => {
    micBtn.classList.remove("listening");
    const transcript = e.results[0][0].transcript;
    sendDirective(transcript);
  };
  rec.onerror = () => micBtn.classList.remove("listening");
  rec.onend = () => micBtn.classList.remove("listening");
} else {
  micBtn.style.display = "none";
}
