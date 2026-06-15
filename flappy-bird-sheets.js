(() => {

function findTableAnywhere() {
  // 1️⃣ Tenta no documento principal
  let table = document.querySelector("table.waffle");
  if (table) {
    console.log("✅ Tabela encontrada no documento principal");
    return table;
  }

  console.log("⚠️ Não achou no documento principal, tentando iframes...");

  // 2️⃣ Tenta em todos os iframes
  const iframes = document.querySelectorAll("iframe");

  for (let i = 0; i < iframes.length; i++) {
    const iframe = iframes[i];

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;

      if (!doc) continue;

      table = doc.querySelector("table.waffle");

      if (table) {
        console.log("✅ Tabela encontrada no iframe index", i);
        return table;
      }

    } catch (err) {
      console.log("❌ iframe", i, "bloqueado por CORS");
    }
  }

  // 3️⃣ Não encontrou em lugar nenhum
  console.log("❌ Tabela não encontrada em nenhum lugar");
  return null;
}

		
  const table = findTableAnywhere()

  if (!table) {
    alert("Tabela não encontrada");
    return;
  }

  // ⚙️ CONFIG
  const BIRD_X = 120;
  const BIRD_START_Y = 450;  // ← Bird nasce mais embaixo (metade da tela + um pouco)
  const GRAVITY = 0.3;
  const FLAP = -5;  // ← Pulo menos potente (era -8)
  const WORLD_SPEED = 3;
  
  // 👤 CUSTOMIZAÇÃO
  const PLAYER_NAME = "GC (Primo)";
  const POINTS_LOST = 13;
  const BIRD_IMAGE_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAbS_29xbDU5pUGuK3Zj_wBiB3Uo1ULBrmw2tsQ38DbA&s=10";
  
  // 🎨 CRIAR OVERLAY DO JOGO
  const gameContainer = document.createElement("div");
  gameContainer.id = "flappy-bird-game";
  gameContainer.style.position = "fixed";
  gameContainer.style.top = "0";
  gameContainer.style.left = "0";
  gameContainer.style.width = "100vw";
  gameContainer.style.height = "100vh";
  gameContainer.style.zIndex = "10000";
  gameContainer.style.pointerEvents = "none";
  gameContainer.style.overflow = "hidden";
  document.body.appendChild(gameContainer);

  // 🚀 BIRD
  const bird = document.createElement("div");
  bird.style.position = "fixed";
  bird.style.left = BIRD_X + "px";
  bird.style.top = BIRD_START_Y + "px";  // ← Usa valor customizável
  bird.style.width = "30px";
  bird.style.height = "30px";
  bird.style.borderRadius = "50%";
  bird.style.zIndex = "10001";
  bird.style.backgroundSize = "cover";
  bird.style.backgroundPosition = "center";
  bird.style.backgroundRepeat = "no-repeat";
  bird.style.boxShadow = "0 0 10px rgba(255, 200, 0, 0.6)";
  gameContainer.appendChild(bird);

  // 🖼️ Carregar imagem do pássaro
  function loadBirdImage() {
    const img = new Image();
    
    img.onload = function() {
      bird.style.backgroundImage = `url('${BIRD_IMAGE_URL}')`;
      console.log("✅ Imagem do pássaro carregada com sucesso!");
    };
    
    img.onerror = function() {
      console.log("⚠️ Não conseguiu carregar imagem, usando SVG alternativo");
      drawBirdSVG();
    };
    
    img.src = BIRD_IMAGE_URL;
  }

  // 🎨 Desenhar pássaro em SVG (fallback)
  function drawBirdSVG() {
    const svg = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <circle cx="50" cy="50" r="35" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
        <circle cx="65" cy="40" r="6" fill="#000"/>
        <circle cx="67" cy="38" r="2" fill="#fff"/>
        <ellipse cx="35" cy="50" rx="12" ry="18" fill="#FFA500"/>
        <path d="M 15 45 Q 5 50 15 55" stroke="#FFA500" stroke-width="4" fill="none" stroke-linecap="round"/>
        <polygon points="75,48 85,50 75,52" fill="#FF6347"/>
      </svg>
    `;
    
    bird.innerHTML = svg;
    bird.style.backgroundColor = "transparent";
  }

  // 📊 HUD
  const hud = document.createElement("div");
  hud.id = "game-hud";
  hud.style.position = "fixed";
  hud.style.top = "20px";
  hud.style.left = "20px";
  hud.style.color = "#000";
  hud.style.fontSize = "16px";
  hud.style.fontWeight = "bold";
  hud.style.zIndex = "10002";
  hud.style.fontFamily = "Arial, sans-serif";
  hud.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  hud.style.padding = "10px 15px";
  hud.style.borderRadius = "5px";
  hud.style.minWidth = "200px";
  hud.style.whiteSpace = "pre-line";
  gameContainer.appendChild(hud);

  // ⏱️ COUNTDOWN MODAL
  const countdownOverlay = document.createElement("div");
  countdownOverlay.id = "countdown-overlay";
  countdownOverlay.style.position = "fixed";
  countdownOverlay.style.top = "0";
  countdownOverlay.style.left = "0";
  countdownOverlay.style.width = "100vw";
  countdownOverlay.style.height = "100vh";
  countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  countdownOverlay.style.display = "flex";
  countdownOverlay.style.justifyContent = "center";
  countdownOverlay.style.alignItems = "center";
  countdownOverlay.style.zIndex = "10003";
  countdownOverlay.style.flexDirection = "column";
  gameContainer.appendChild(countdownOverlay);

  const countdownText = document.createElement("div");
  countdownText.id = "countdown-text";
  countdownText.style.color = "#fff";
  countdownText.style.fontSize = "120px";
  countdownText.style.fontWeight = "bold";
  countdownText.style.fontFamily = "Arial, sans-serif";
  countdownText.style.textAlign = "center";
  countdownText.style.whiteSpace = "pre-line";
  countdownText.textContent = "3";
  countdownOverlay.appendChild(countdownText);

  function updateHUD(text) {
    hud.textContent = text;
  }

  // 🎮 FÍSICA DO BIRD
  let birdY = BIRD_START_Y;  // ← Usa valor customizável
  let velocity = 0;
  let gameStarted = false;
  let countdownActive = false;
  let gameOver = false;
  let distance = 0;
  let worldOffset = 0;
  let gameLoopRunning = false;

  // 🔴 CÉLULAS VERMELHAS
  const redCells = Array.from(table.querySelectorAll("td")).filter(cell => {
    const bgColor = getComputedStyle(cell).backgroundColor.trim();
    return bgColor === "rgb(244, 204, 204)";
  });

  console.log("✅ Red cells detectadas:", redCells.length);

  // 🧪 FUNÇÕES
  function checkCollision() {
    const birdRect = {
      left: BIRD_X,
      right: BIRD_X + 30,
      top: birdY,
      bottom: birdY + 30
    };

    for (let cell of redCells) {
      const r = cell.getBoundingClientRect();
      
      if (
        birdRect.left < r.right &&
        birdRect.right > r.left &&
        birdRect.top < r.bottom &&
        birdRect.bottom > r.top
      ) {
        return true;
      }
    }
    return false;
  }

  function checkOutOfBounds() {
    if (birdY > window.innerHeight) return true;
    if (birdY < -50) return true;
    return false;
  }

  function moveWorld() {
    worldOffset += WORLD_SPEED;
    table.style.transform = `translateX(-${worldOffset}px)`;
    distance = Math.floor(worldOffset / 10);
  }

  function checkVictory() {
    const tableRect = table.getBoundingClientRect();
    return tableRect.right <= 0;
  }

  // 🎯 GAME LOOP
  function gameLoop() {
    if (!gameLoopRunning || gameOver) return;

    if (gameStarted) {
      velocity += GRAVITY;
      birdY += velocity;
      bird.style.top = birdY + "px";

      moveWorld();

      let hudText = "🎮 FLAPPY BIRD\n";
      hudText += "Altitude: " + Math.max(0, Math.floor(window.innerHeight - birdY)) + "px\n";
      hudText += "Distância: " + distance;
      updateHUD(hudText);

      if (checkCollision()) {
        gameOver = true;
        updateHUD("💀 GAME OVER - Colidiu!");
        
        countdownOverlay.style.backgroundColor = "rgba(200, 0, 0, 0.7)";
        countdownText.style.fontSize = "60px";
        countdownText.textContent = "💀 GAME OVER!\nDistância: " + distance;
        countdownOverlay.style.display = "flex";
        
        setTimeout(() => {
          showRestartButton("Você colidiu com uma cédula vermelha!");
        }, 500);
        return;
      }

      if (checkOutOfBounds()) {
        gameOver = true;
        updateHUD("💀 GAME OVER - Caiu!");
        
        countdownOverlay.style.backgroundColor = "rgba(200, 0, 0, 0.7)";
        countdownText.style.fontSize = "60px";
        countdownText.textContent = "💀 GAME OVER!\nVocê caiu!";
        countdownOverlay.style.display = "flex";
        
        setTimeout(() => {
          showRestartButton("Você caiu!");
        }, 500);
        return;
      }

      if (gameStarted && checkVictory()) {
        gameOver = true;
        updateHUD("🏆 VITÓRIA!");
        
        countdownOverlay.style.backgroundColor = "rgba(0, 100, 0, 0.8)";
        countdownText.style.fontSize = "48px";
        countdownText.textContent = "🏆 PARABÉNS!\n\n" + PLAYER_NAME + "\nacaba de perder " + POINTS_LOST + " pontos!";
        countdownOverlay.style.display = "flex";
        
        setTimeout(() => {
          showRestartButton("Você venceu!");
        }, 500);
        return;
      }
    }

    requestAnimationFrame(gameLoop);
  }

  // 🔄 REINICIAR JOGO - SIMPLES! Só recarrega a página
  function showRestartButton(reason) {
    countdownText.textContent = "";
    
    while (countdownOverlay.children.length > 1) {
      countdownOverlay.removeChild(countdownOverlay.lastChild);
    }
    
    const message = document.createElement("div");
    message.style.color = "#fff";
    message.style.fontSize = "28px";
    message.style.fontWeight = "bold";
    message.style.fontFamily = "Arial, sans-serif";
    message.style.textAlign = "center";
    message.style.marginBottom = "30px";
    message.textContent = reason;
    countdownOverlay.appendChild(message);

    const restartBtn = document.createElement("button");
    restartBtn.textContent = "🔄 Jogar Novamente";
    restartBtn.style.padding = "15px 40px";
    restartBtn.style.fontSize = "20px";
    restartBtn.style.fontWeight = "bold";
    restartBtn.style.backgroundColor = "#FFD700";
    restartBtn.style.color = "#000";
    restartBtn.style.border = "none";
    restartBtn.style.borderRadius = "10px";
    restartBtn.style.cursor = "pointer";
    restartBtn.style.transition = "all 0.3s";
    
    restartBtn.onmouseover = () => {
      restartBtn.style.backgroundColor = "#FFC700";
      restartBtn.style.transform = "scale(1.1)";
    };
    
    restartBtn.onmouseout = () => {
      restartBtn.style.backgroundColor = "#FFD700";
      restartBtn.style.transform = "scale(1)";
    };
    
    // ✨ SIMPLES: Apenas recarrega a página
    restartBtn.onclick = () => {
      location.reload();
    };
    
    countdownOverlay.appendChild(restartBtn);
  }

  // ⏱️ CONTAGEM REGRESSIVA
  function startCountdown() {
    countdownActive = true;
    countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    countdownOverlay.style.display = "flex";
    countdownText.style.fontSize = "120px";
    
    let count = 3;
    
    const countdownInterval = setInterval(() => {
      countdownText.textContent = count;
      count--;
      
      if (count < 0) {
        clearInterval(countdownInterval);
        countdownOverlay.style.display = "none";
        countdownActive = false;
        gameStarted = true;
        updateHUD("🎮 JOGO COMEÇOU!");
      }
    }, 1000);
  }

  // 🎮 CONTROLES
  function flap() {
    if (countdownActive) {
      return;
    }
    if (!gameStarted || gameOver) {
      return;
    }
    velocity = FLAP;  // ← Usa pulo menos potente
  }

  gameContainer.style.pointerEvents = "auto";
  gameContainer.addEventListener("click", flap);
  
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      flap();
    }
  });

  // 🚀 INICIAR
  updateHUD("🎮 FLAPPY BIRD\nAguardando início...");
  console.log("✅ Flappy Bird v7 iniciado!");
  console.log("✅ Bird nasce em Y: " + BIRD_START_Y + "px");
  console.log("✅ Pulo potência: " + FLAP);
  console.log("✅ Carregando imagem do pássaro...");
  
  loadBirdImage();
  startCountdown();

  gameLoopRunning = true;
  gameLoop();
})();
