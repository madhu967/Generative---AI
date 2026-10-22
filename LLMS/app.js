const messages = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const fileInput = document.querySelector("#fileInput");
const preview = document.querySelector("#attachmentPreview");
const fileName = document.querySelector("#fileName");
let previousInteractionId;
let selectedFile;

function addMessage(text, role) {
  document.querySelector(".welcome")?.remove();
  const item = document.createElement("div");
  item.className = `message ${role}`;
  item.innerHTML = `<div class="message-avatar">${role === "user" ? "M" : "✦"}</div><div class="bubble"></div>`;
  item.querySelector(".bubble").textContent = text;
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
}

function setAttachment(file) {
  selectedFile = file;
  fileName.textContent = file.name;
  preview.classList.remove("hidden");
}

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) setAttachment(fileInput.files[0]);
});
document.querySelector("#removeFile").addEventListener("click", () => {
  selectedFile = undefined;
  fileInput.value = "";
  preview.classList.add("hidden");
});

async function sendMessage(message) {
  addMessage(message, "user");
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.textContent = "Nova is thinking...";
  messages.append(typing);
  messages.scrollTop = messages.scrollHeight;
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        previousInteractionId,
        imageName: selectedFile?.name,
      }),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "The chatbot server is not running. Start it with: npm start"
      );
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    previousInteractionId = data.interactionId;
    addMessage(data.text, "assistant");
  } catch (error) {
    addMessage(`Sorry, I couldn't reply. ${error.message}`, "assistant");
  } finally {
    typing.remove();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  input.style.height = "auto";
  sendMessage(message);
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
});
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
  });
});
document.querySelector("#newChatButton").addEventListener("click", () => {
  previousInteractionId = undefined;
  messages.innerHTML = '<div class="welcome"><div class="welcome-orb">✦</div><h2>How can I help today?</h2><p>Ask anything, brainstorm ideas, or upload an image to get started.</p></div>';
});
document.querySelector("#clearButton").addEventListener("click", () => {
  document.querySelector("#newChatButton").click();
});
