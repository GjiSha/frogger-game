// Global config will be loaded externally
let config;

// Load external configuration file and then initialize the game
fetch('config.json')
  .then(response => response.json())
  .then(data => {
    config = data;
    // Update frog image based on config
    const frog = document.getElementById('frog');
    frog.style.backgroundImage = `url('${config.frogImageUrl}')`;
    // Now initialize the game using the loaded config
    FroggerGame.init();
  })
  .catch(err => console.error('Error loading configuration:', err));

// The game logic object uses the externally loaded config
const FroggerGame = {
  frogX: 0, // will be set in init
  frogY: 0,
  obstacles: [],
  frog: document.getElementById('frog'),
  gameContainer: document.getElementById('gameContainer'),
  winMessage: document.getElementById('winMessage'),
  
  init() {
    // Initialize frog position using external config values
    this.frogX = config.initialFrogX;
    this.frogY = config.initialFrogY;
    this.frog.style.left = this.frogX + 'px';
    this.frog.style.top = this.frogY + 'px';
    
    // Set up keyboard controls
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowUp': this.moveFrog(0, -config.frogStep); break;
        case 'ArrowDown': this.moveFrog(0, config.frogStep); break;
        case 'ArrowLeft': this.moveFrog(-config.frogStep, 0); break;
        case 'ArrowRight': this.moveFrog(config.frogStep, 0); break;
      }
    });
    
    // Start the obstacle spawn and movement loops
    this.spawnInterval = setInterval(() => this.createObstacle(), config.obstacleSpawnInterval);
    this.moveInterval = setInterval(() => this.moveObstacles(), 30);
  },
  
  moveFrog(dx, dy) {
    const newX = this.frogX + dx;
    const newY = this.frogY + dy;
    // Keep frog within game bounds (assuming frog width is 50px)
    if (newX >= 0 && newX <= config.gameWidth - 50) {
      this.frogX = newX;
    }
    if (newY >= 0) {
      this.frogY = newY;
    }
    this.frog.style.left = this.frogX + 'px';
    this.frog.style.top = this.frogY + 'px';

    // Check win condition (frog reaches top with a small margin)
    if (this.frogY <= 10) {
      this.winMessage.style.display = "block";
      setTimeout(() => this.resetGame(), 2000);
    }
  },
  
  createObstacle() {
    // Create a new obstacle element
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    
    // Select a random word for the obstacle
    const word = config.obstacleWords[Math.floor(Math.random() * config.obstacleWords.length)];
    obstacle.textContent = word;
    
    // Determine obstacle width based on word length (minimum 100px)
    const obstacleWidth = Math.max(100, word.length * 15);
    obstacle.style.width = obstacleWidth + 'px';
    obstacle.style.fontSize = "16px";
    
    // All obstacles spawn at this vertical position
    const spawnTop = -50;
    obstacle.style.top = spawnTop + 'px';
    
    // In the more challenging mode, sometimes we do NOT enforce the reserved safe gap.
    // With a 70% chance the gap is enforced and 30% chance it is skipped.
    const enforceReservedGap = Math.random() > 0.3; // 70% chance to enforce safe gap
    
    // Define the reserved gap for the frog (if enforced). We assume frog width = 50px.
    const frogWidth = 50;
    const reservedGap = enforceReservedGap ? { left: config.initialFrogX, right: config.initialFrogX + frogWidth } : null;
    
    let maxLeft = config.gameWidth - obstacleWidth;
    let left = 0;
    let attempts = 0;
    const maxAttempts = 10;
    let overlapping = false;
    
    // Helper function to get the candidate rectangle for the new obstacle
    const newRect = (testLeft) => ({
      left: testLeft,
      right: testLeft + obstacleWidth,
      top: spawnTop,
      bottom: spawnTop + config.obstacleHeight,
    });
    
    // Find a random horizontal position that:
    // 1. Does not overlap any existing obstacle in the spawn row.
    // 2. If enforced, does not cover the reserved gap.
    do {
      left = Math.random() * maxLeft;
      overlapping = false;
      const testRect = newRect(left);
      
      // Check reserved gap: reject if the new obstacle would cover the reserved area.
      if (reservedGap) {
        if (testRect.left < reservedGap.right && testRect.right > reservedGap.left) {
          overlapping = true;
        }
      }
      
      // Also check for overlap with existing obstacles in the spawn row
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        const obsTop = parseInt(obs.style.top);
        // Only check obstacles that are near the spawn row
        if (obsTop < spawnTop + config.obstacleHeight) {
          const obsLeft = parseInt(obs.style.left);
          const obsWidth = parseInt(obs.style.width);
          const obsRect = {
            left: obsLeft,
            right: obsLeft + obsWidth,
            top: obsTop,
            bottom: obsTop + config.obstacleHeight,
          };
          if (
            testRect.left < obsRect.right &&
            testRect.right > obsRect.left &&
            testRect.top < obsRect.bottom &&
            testRect.bottom > obsRect.top
          ) {
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

      // Remove obstacle if it goes out of the game area
      if (currentY > config.gameHeight) {
        obstacle.remove();
        this.obstacles.splice(index, 1);
      }

      // Check for collision between the frog and an obstacle
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
    
    // Remove all obstacles and hide the win message
    this.obstacles.forEach(obstacle => obstacle.remove());
    this.obstacles = [];
    this.winMessage.style.display = "none";
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // The game will initialize after the external config is loaded
});
