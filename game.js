// Game configuration object for easy adjustments

fetch('config.json')
  .then(response => response.json())
  .then(data => {
    // Update your game config with the loaded data
    config.frogStep = data.frogStep;
    config.obstacleSpawnInterval = data.obstacleSpawnInterval;
    config.obstacleSpeed = data.obstacleSpeed;
    config.obstacleWords = data.obstacleWords;
    
    // Update frog image if needed:
    const frog = document.getElementById('frog');
    frog.style.backgroundImage = `url('${data.frogImageUrl}')`;
    
    // Now initialize your game or reconfigure your game logic
    FroggerGame.init();
  })
  .catch(err => console.error('Error loading configuration:', err));

const config = {
    frogStep: 50,
    obstacleSpawnInterval: 800, // in milliseconds
    obstacleSpeed: 7,           // pixels per frame
    gameWidth: 500,
    gameHeight: 600,
    initialFrogX: 225,
    initialFrogY: 510,
    obstacleWords: ["discrimination", "abortion", "alpha", "bravo", "charlie"],
    obstacleHeight: 40,         // defined obstacle height (from CSS)
  };
  
  // Game object encapsulating all game logic
  const FroggerGame = {
    frogX: config.initialFrogX,
    frogY: config.initialFrogY,
    obstacles: [],
    frog: document.getElementById('frog'),
    gameContainer: document.getElementById('gameContainer'),
    winMessage: document.getElementById('winMessage'),
    
    init() {
      // Initialize frog position
      this.frog.style.left = this.frogX + 'px';
      this.frog.style.top = this.frogY + 'px';
      
      // Set up key event listener
      document.addEventListener('keydown', (event) => {
        switch (event.key) {
          case 'ArrowUp': this.moveFrog(0, -config.frogStep); break;
          case 'ArrowDown': this.moveFrog(0, config.frogStep); break;
          case 'ArrowLeft': this.moveFrog(-config.frogStep, 0); break;
          case 'ArrowRight': this.moveFrog(config.frogStep, 0); break;
        }
      });
      
      // Start game loops for spawning and moving obstacles
      this.spawnInterval = setInterval(() => this.createObstacle(), config.obstacleSpawnInterval);
      this.moveInterval = setInterval(() => this.moveObstacles(), 30);
    },
    
    moveFrog(dx, dy) {
      const newX = this.frogX + dx;
      const newY = this.frogY + dy;
      
      // Keep frog within horizontal bounds
      if (newX >= 0 && newX <= config.gameWidth - 50) {
        this.frogX = newX;
      }
      // Allow frog to reach the top
      if (newY >= 0) {
        this.frogY = newY;
      }
      
      this.frog.style.left = this.frogX + 'px';
      this.frog.style.top = this.frogY + 'px';
  
      // Check win condition: frog reaches the top area (with a small margin)
      if (this.frogY <= 10) {
        this.winMessage.style.display = "block";
        setTimeout(() => this.resetGame(), 2000);
      }
    },
    
    createObstacle() {
      const obstacle = document.createElement('div');
      obstacle.classList.add('obstacle');
      
      // Select a random word from the configuration
      const word = config.obstacleWords[Math.floor(Math.random() * config.obstacleWords.length)];
      obstacle.textContent = word;
      
      // Adjust obstacle width based on word length
      const obstacleWidth = Math.max(100, word.length * 15);
      obstacle.style.width = obstacleWidth + 'px';
      obstacle.style.fontSize = "16px";
      
      // Define the spawn position for the new obstacle
      const spawnTop = -50;
      obstacle.style.top = spawnTop + 'px';
      
      // Determine a horizontal position that doesn't overlap with obstacles in the spawn area
      let maxLeft = config.gameWidth - obstacleWidth;
      let left = 0;
      let attempts = 0;
      const maxAttempts = 10;
      let overlapping = false;
      
      // Define new obstacle's rectangle
      const newRect = (testLeft) => ({
        left: testLeft,
        right: testLeft + obstacleWidth,
        top: spawnTop,
        bottom: spawnTop + config.obstacleHeight,
      });
      
      do {
        left = Math.random() * maxLeft;
        overlapping = false;
        const testRect = newRect(left);
        
        // Check for overlap with obstacles that are in the spawn region
        for (let i = 0; i < this.obstacles.length; i++) {
          const obs = this.obstacles[i];
          const obsTop = parseInt(obs.style.top);
          // Only check obstacles that are still near the spawn area (vertical overlap possible)
          if (obsTop < spawnTop + config.obstacleHeight) {
            const obsLeft = parseInt(obs.style.left);
            const obsWidth = parseInt(obs.style.width);
            const obsRect = {
              left: obsLeft,
              right: obsLeft + obsWidth,
              top: obsTop,
              bottom: obsTop + config.obstacleHeight,
            };
            // Standard rectangle overlap check
            if (testRect.left < obsRect.right && testRect.right > obsRect.left &&
                testRect.top < obsRect.bottom && testRect.bottom > obsRect.top) {
              overlapping = true;
              break;
            }
          }
        }
        attempts++;
      } while (overlapping && attempts < maxAttempts);
      
      obstacle.style.left = left + 'px';
      this.gameContainer.appendChild(obstacle);
      this.obstacles.push(obstacle);
    },
    
    moveObstacles() {
      this.obstacles.forEach((obstacle, index) => {
        let currentY = parseInt(obstacle.style.top);
        currentY += config.obstacleSpeed;
        obstacle.style.top = currentY + 'px';
  
        // Remove the obstacle if it moves outside the game area
        if (currentY > config.gameHeight) {
          obstacle.remove();
          this.obstacles.splice(index, 1);
        }
  
        // Check for collision with the frog
        if (this.checkCollision(this.frog, obstacle)) {
          alert("Game Over! Try again.");
          this.resetGame();
        }
      });
    },
    
    checkCollision(frogElem, obstacleElem) {
      const frogRect = frogElem.getBoundingClientRect();
      const obstacleRect = obstacleElem.getBoundingClientRect();
      return !(
        frogRect.top > obstacleRect.bottom ||
        frogRect.bottom < obstacleRect.top ||
        frogRect.left > obstacleRect.right ||
        frogRect.right < obstacleRect.left
      );
    },
    
    resetGame() {
      // Reset frog's position
      this.frogX = config.initialFrogX;
      this.frogY = config.initialFrogY;
      this.frog.style.left = this.frogX + 'px';
      this.frog.style.top = this.frogY + 'px';
      
      // Remove all obstacles
      this.obstacles.forEach(obstacle => obstacle.remove());
      this.obstacles = [];
      
      // Hide win message
      this.winMessage.style.display = "none";
    }
  };
  
  // Initialize the game after the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    FroggerGame.init();
  });
  