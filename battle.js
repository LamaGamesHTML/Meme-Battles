// Battle-related functionality moved from index.html
function initBattle(player1Selected, player2Selected) {
  const battleMusic = new Audio('THE WORLD REVOLVING.mp3');
  battleMusic.loop = true;
  let musicPlaying = false;

  function updateMusic() {
    const shouldPlayMusic = (health1 <= 50 || health2 <= 50) && health1 > 0 && health2 > 0;
    
    if (shouldPlayMusic && !musicPlaying) {
      battleMusic.volume = 0;
      battleMusic.play();
      // Fade in
      let vol = 0;
      const fadeIn = setInterval(() => {
        if (vol < 0.95) { 
          vol += 0.1;
          battleMusic.volume = Math.min(1, vol); 
        } else {
          battleMusic.volume = 1;
          clearInterval(fadeIn);
        }
      }, 100);
      musicPlaying = true;
    } else if (!shouldPlayMusic && musicPlaying) {
      // Fade out
      let vol = battleMusic.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.1) { 
          vol -= 0.1;
          battleMusic.volume = vol;
        } else {
          battleMusic.volume = 0;
          clearInterval(fadeOut);
          battleMusic.pause();
          battleMusic.currentTime = 0;
        }
      }, 100);
      musicPlaying = false;
    }
  }

  document.getElementById('menu').style.display = 'none';
  document.getElementById('battleScreen').style.display = 'block';

  const fighter1 = document.getElementById('fighter1');
  const fighter2 = document.getElementById('fighter2');
  const fighter1Container = document.getElementById('fighter1Container');
  const fighter2Container = document.getElementById('fighter2Container');
  const sword1 = document.getElementById('sword1');
  const sword2 = document.getElementById('sword2');

  fighter1.src = player1Selected;
  fighter2.src = player2Selected;

  let health1 = 100;
  let health2 = 100;
  let canAttack1 = true;
  let canAttack2 = true;

  function getDistance() {
    const rect1 = fighter1Container.getBoundingClientRect();
    const rect2 = fighter2Container.getBoundingClientRect();
    return Math.abs(rect2.left - rect1.right);
  }

  function attack(attacker, defender, attackerSword, defenderHealth, isPlayer1) {
    const distance = getDistance();
    
    if (distance < 250) {
      // Check if defender is invincible
      if (defender.dataset.invincible === 'true') {
        return;
      }

      attackerSword.style.animation = 'attack 0.3s ease-in-out';
      
      // Calculate if it's a critical hit (10% chance)
      const isCritical = Math.random() < 0.10;
      const damage = isCritical ? 20 : 10;
      
      if (isPlayer1) {
        health2 -= damage;
        defender.style.filter = `brightness(150%) hue-rotate(45deg)${isCritical ? ' saturate(200%)' : ''}`;
        
        // 35% chance to back up when hit
        if (Math.random() < 0.35) {
          const currentPos = parseInt(fighter2Container.style.left) || window.innerWidth - 300;
          fighter2Container.style.left = (currentPos + 300) + 'px';
          
          // Set invincibility
          fighter2Container.dataset.invincible = 'true';
          setTimeout(() => {
            fighter2Container.dataset.invincible = 'false';
          }, 1500);

          setTimeout(() => {
            fighter2.classList.add('running');
            fighter2Container.style.transition = 'left 0.5s ease-out';
            fighter2Container.style.left = (currentPos) + 'px';
            setTimeout(() => fighter2.classList.remove('running'), 500);
          }, 300);
        }
      } else {
        health1 -= damage;
        defender.style.filter = `brightness(150%) hue-rotate(45deg)${isCritical ? ' saturate(200%)' : ''}`;
        
        // 35% chance to back up when hit
        if (Math.random() < 0.35) {
          const currentPos = parseInt(fighter1Container.style.left) || 100;
          fighter1Container.style.left = (currentPos - 300) + 'px';
          
          // Set invincibility
          fighter1Container.dataset.invincible = 'true';
          setTimeout(() => {
            fighter1Container.dataset.invincible = 'false';
          }, 1500);

          setTimeout(() => {
            fighter1.classList.add('running');
            fighter1Container.style.transition = 'left 0.5s ease-out';
            fighter1Container.style.left = (currentPos) + 'px';
            setTimeout(() => fighter1.classList.remove('running'), 500);
          }, 300);
        }
      }
      
      // If critical hit, add visual feedback
      if (isCritical) {
        const critText = document.createElement('div');
        critText.textContent = 'CRITICAL!';
        critText.style.position = 'absolute';
        critText.style.color = 'red';
        critText.style.fontSize = '24px';
        critText.style.fontWeight = 'bold';
        critText.style.top = '50%';
        critText.style.left = isPlayer1 ? '70%' : '30%';
        critText.style.animation = 'fadeUp 1s forwards';
        document.getElementById('battleScreen').appendChild(critText);
        
        setTimeout(() => critText.remove(), 1000);
      }
      
      setTimeout(() => {
        defender.style.filter = '';
        attackerSword.style.animation = '';
      }, 300);
      
      document.getElementById('health1Fill').style.width = Math.max(0, health1) + '%';
      document.getElementById('health2Fill').style.width = Math.max(0, health2) + '%';
    }
  }

  function jump(container) {
    if(container.jumping) return;
    
    container.jumping = true;
    const startPos = parseInt(container.style.bottom || 20);
    let jumpHeight = 0;
    let jumpVelocity = 15;
    const gravity = 0.8;

    function jumpFrame() {
      jumpVelocity -= gravity;
      jumpHeight += jumpVelocity;
      
      const newHeight = startPos + jumpHeight;
      
      if(newHeight <= 20) {
        container.style.bottom = '20px';
        container.jumping = false;
        return;
      }
      
      container.style.bottom = newHeight + 'px';
      requestAnimationFrame(jumpFrame);
    }
    
    requestAnimationFrame(jumpFrame);
  }

  function moveToward(element, target, isMedkit = false) {
    const currentLeft = parseInt(element.style.left || (element === fighter1Container ? '100' : window.innerWidth - 300));
    const targetLeft = isMedkit ? target : parseInt(target.style.left || (target === fighter1Container ? '100' : window.innerWidth - 300));
    
    let newLeft;
    const minDistance = isMedkit ? 0 : 250; // No minimum distance when going for medkit
    
    if (element === fighter1Container) {
      // Player 1 moves right
      const distance = targetLeft - currentLeft;
      if (Math.abs(distance) > minDistance) {
        element.querySelector('.fighter').classList.add('running');
        newLeft = distance > 0 ? currentLeft + 200 : currentLeft - 200;
        element.style.transition = 'left 0.5s ease-out';
        element.style.left = `${distance > 0 ? Math.min(newLeft, targetLeft - minDistance) : Math.max(newLeft, targetLeft + minDistance)}px`;
      } else {
        element.querySelector('.fighter').classList.remove('running');
      }
    } else {
      // Player 2 moves left
      const distance = currentLeft - targetLeft;
      if (Math.abs(distance) > minDistance) {
        element.querySelector('.fighter').classList.add('running');
        newLeft = distance > 0 ? currentLeft - 200 : currentLeft + 200;
        element.style.transition = 'left 0.5s ease-out';
        element.style.left = `${distance > 0 ? Math.max(newLeft, targetLeft + minDistance) : Math.min(newLeft, targetLeft - minDistance)}px`;
      } else {
        element.querySelector('.fighter').classList.remove('running');
      }
    }
  }

  function spawnMedkit() {
    if (currentMedkit) return; // Only one medkit at a time
    
    const medkit = document.createElement('img');
    medkit.src = 'medkit.png';
    medkit.className = 'medkit';
    
    // Random x position between fighters
    const battleScreen = document.getElementById('battleScreen');
    const randomX = Math.random() * (window.innerWidth - 100) + 50;
    medkit.style.left = randomX + 'px';
    medkit.style.top = '-50px';
    
    battleScreen.appendChild(medkit);
    currentMedkit = medkit;

    // Animate falling
    requestAnimationFrame(() => {
      medkit.style.top = (window.innerHeight - 100) + 'px';
    });

    // Check for collision with fighters
    const checkCollision = setInterval(() => {
      if (!medkit.isConnected) {
        clearInterval(checkCollision);
        return;
      }

      const medkitRect = medkit.getBoundingClientRect();
      const fighter1Rect = fighter1Container.getBoundingClientRect();
      const fighter2Rect = fighter2Container.getBoundingClientRect();

      if (isColliding(medkitRect, fighter1Rect)) {
        health1 = 100; // Full health restore
        document.getElementById('health1Fill').style.width = health1 + '%';
        clearInterval(checkCollision);
        medkit.remove();
        currentMedkit = null;
      } else if (isColliding(medkitRect, fighter2Rect)) {
        health2 = 100; // Full health restore
        document.getElementById('health2Fill').style.width = health2 + '%';
        clearInterval(checkCollision);
        medkit.remove();
        currentMedkit = null;
      }

      // If medkit has landed, make it stay there
      if (medkitRect.top >= window.innerHeight - 100) {
        medkit.style.top = (window.innerHeight - 100) + 'px';
      }
    }, 100);
  }

  let currentMedkit = null;

  function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom);
  }

  const battleLoop = setInterval(() => {
    // If there's a medkit, both fighters go for it
    if (currentMedkit) {
      const medkitLeft = parseInt(currentMedkit.style.left);
      moveToward(fighter1Container, medkitLeft, true);
      moveToward(fighter2Container, medkitLeft, true);
    } else {
      // Normal fighting behavior
      if (!fighter1Container.backing && !fighter2Container.backing) {
        if (getDistance() > 250) {
          moveToward(fighter1Container, fighter2Container);
          moveToward(fighter2Container, fighter1Container);
        } else {
          fighter1.classList.remove('running');
          fighter2.classList.remove('running');
        }
      }
    }

    // Random jumps
    if (Math.random() < 0.3) {
      jump(fighter1Container);
    }
    if (Math.random() < 0.3) {
      jump(fighter2Container);
    }

    // Attack checks
    if (canAttack1) {
      canAttack1 = false;
      attack(fighter1Container, fighter2Container, sword1, health2, true);
      setTimeout(() => canAttack1 = true, 1000);
    }
    
    if (canAttack2) {
      canAttack2 = false;
      attack(fighter2Container, fighter1Container, sword2, health1, false);
      setTimeout(() => canAttack2 = true, 1000);
    }

    updateMusic();

    if (health1 <= 0 || health2 <= 0) {
      clearInterval(battleLoop);
      if (musicPlaying) {
        // Fade out music on death
        let vol = battleMusic.volume;
        const fadeOut = setInterval(() => {
          if (vol > 0) {
            vol -= 0.1;
            battleMusic.volume = vol;
          } else {
            clearInterval(fadeOut);
            battleMusic.pause();
            battleMusic.currentTime = 0;
          }
        }, 100);
      }
      fighter1Container.style.animation = '';
      fighter2Container.style.animation = '';
      setTimeout(() => {
        alert(health1 <= 0 ? 'Player 2 Wins!' : 'Player 1 Wins!');
        location.reload();
      }, 500);
    }
  }, 500);

  // Spawn medkit every 10 seconds
  setInterval(spawnMedkit, 10000);
}