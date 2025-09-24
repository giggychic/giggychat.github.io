const chat = document.getElementById("chat");
const msgInput = document.getElementById("msg");
const video = document.getElementById("camera");
const startBtn = document.getElementById("startCam");
const stopBtn = document.getElementById("stopCam");
const toggleMicBtn = document.getElementById("toggleMic");
const micLevel = document.getElementById("mic-level");

let localStream;
let micStream;
let audioContext;
let analyser;
let dataArray;
let animationId;

// Conecta ao servidor WebSocket
const socket = new WebSocket(
  window.location.protocol === "https:"
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`
);

// Receber mensagens
socket.onmessage = (event) => {
  addMessage(event.data, "other");
};

// Enviar mensagem
function enviar() {
  if (msgInput.value && socket.readyState === WebSocket.OPEN) {
    socket.send(msgInput.value);
    addMessage(msgInput.value, "you");
    msgInput.value = "";
  }
}

// Adiciona mensagem no chat com balões
function addMessage(text, type) {
  const p = document.createElement("div");
  p.classList.add("message", type);
  p.textContent = text;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

// Botão Sair
function sair() {
  if (socket.readyState === WebSocket.OPEN) socket.close();
  chat.innerHTML = "<div class='message other'>Você saiu do chat.</div>";
  stopCamera();
  stopMicrophone();
}

// Ligar câmera
async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
    video.srcObject = localStream;
  } catch(err) { console.log("Erro ao acessar a câmera:", err); }
}

// Desligar câmera
function stopCamera() {
  if(localStream) {
    localStream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
}

// Ligar/Desligar microfone
async function toggleMic() {
  if (!micStream) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:false });
      startMicMeter(micStream);
      toggleMicBtn.classList.add("active");
      toggleMicBtn.textContent = "Desligar Microfone";
    } catch(err) { console.log("Erro ao acessar microfone:", err); }
  } else { stopMicrophone(); }
}

function stopMicrophone() {
  if(micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
    cancelAnimationFrame(animationId);
    micLevel.style.width = "0%";
    toggleMicBtn.classList.remove("active");
    toggleMicBtn.textContent = "Ligar Microfone";
  }
}

// Medidor de nível do microfone
function startMicMeter(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  function update() {
    analyser.getByteFrequencyData(dataArray);
    let values = 0;
    for(let i=0;i<dataArray.length;i++) values += dataArray[i];
    let average = values/dataArray.length;
    micLevel.style.width = Math.min(100,average)+"%";
    animationId = requestAnimationFrame(update);
  }
  update();
}

// Eventos dos botões
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
toggleMicBtn.addEventListener("click", toggleMic);