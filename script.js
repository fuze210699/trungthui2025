document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS
    emailjs.init("ox6RTzYwQ0m7mYfW4"); // Replace with your actual public key
    
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const gameContainer = document.getElementById('game-container');
    const gameBoard = document.getElementById('game-board');
    const winModal = document.getElementById('win-modal');
    const animationScreen = document.getElementById('animation-screen');
    const wishInput = document.getElementById('wish-input');
    const sendWishButton = document.getElementById('send-wish-button');
    const playAgainButton = document.getElementById('play-again-button');
    const restartButton = document.getElementById('restart-button');
    const movesCount = document.getElementById('moves-count');
    const timeDisplay = document.getElementById('time-display');
    const finalTime = document.getElementById('final-time');
    const finalMoves = document.getElementById('final-moves');
    
    // Animation elements
    const skipAnimationBtn = document.getElementById('skip-animation');
    const backToGameBtn = document.getElementById('back-to-game');
    const storyLine = document.getElementById('story-line');

    // All available images - 8 pairs for 4x4 grid
    const allImages = [
        'images/cb_1759755074.png',
        'images/cb_1759755119.png',
        'images/cb_1759755134.png',
        'images/cb_1759755150.png',
        'images/cb_1759755161.png',
        'images/cb_1759755194.png',
        'images/cb_1759755227.png',
        'images/cb_1759755265.png'
    ];
    
    let cardImages = []; // Will be populated with random selection

    let flippedCards = [];
    let matchedPairs = 0;
    let lockBoard = false;
    let moves = 0;
    let gameStartTime = null;
    let gameTimer = null;
    
    // Audio System
    const backgroundMusic = document.getElementById('background-music');
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = document.querySelector('.music-icon');
    
    let isMusicEnabled = false;
    let isSoundEnabled = true;
    let audioContext = null;
    
    // Initialize Web Audio API for sound effects
    function initAudio() {
        if (backgroundMusic) {
            backgroundMusic.volume = 0.3;
        }
        
        // Initialize AudioContext for sound effects
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported:', e);
            isSoundEnabled = false;
        }
    }
    
    // Create sound effects using Web Audio API
    function createBeepSound(frequency, duration, type = 'sine') {
        if (!audioContext || !isSoundEnabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    function playFlipSound() {
        // Frog-like croak sound
        createBeepSound(150, 0.1, 'sawtooth');
        setTimeout(() => createBeepSound(120, 0.1, 'sawtooth'), 50);
    }
    
    function playMatchSound() {
        // Success chime
        createBeepSound(523, 0.15, 'sine'); // C5
        setTimeout(() => createBeepSound(659, 0.15, 'sine'), 100); // E5
        setTimeout(() => createBeepSound(784, 0.2, 'sine'), 200); // G5
    }
    
    function playWinSound() {
        // Victory fanfare
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => createBeepSound(freq, 0.3, 'sine'), i * 150);
        });
    }
    
    function toggleMusic() {
        if (isMusicEnabled) {
            backgroundMusic.pause();
            musicIcon.textContent = '🔇';
            isMusicEnabled = false;
        } else {
            backgroundMusic.play().catch(e => console.log('Music autoplay blocked:', e));
            musicIcon.textContent = '🎵';
            isMusicEnabled = true;
        }
    }
    
    function playSound(soundType) {
        if (!isSoundEnabled) return;
        
        switch(soundType) {
            case 'flip':
                playFlipSound();
                break;
            case 'match':
                playMatchSound();
                break;
            case 'win':
                playWinSound();
                break;
        }
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Function to use all 8 images for the game
    function selectRandomImages() {
        return [...allImages]; // Use all 8 images
    }

    function startGameTimer() {
        gameStartTime = Date.now();
        gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timeDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function stopGameTimer() {
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
    }

    function resetGameStats() {
        moves = 0;
        matchedPairs = 0;
        movesCount.textContent = '0';
        timeDisplay.textContent = '00:00';
        stopGameTimer();
    }

    function createBoard() {
        // Use all 8 images for this game
        const selectedImages = selectRandomImages();
        cardImages = [...selectedImages, ...selectedImages]; // Create 8 pairs = 16 cards
        
        shuffle(cardImages);
        gameBoard.innerHTML = '';
        resetGameStats();
        
        cardImages.forEach(imageSrc => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.image = imageSrc;

            const cardInner = document.createElement('div');
            cardInner.classList.add('card-inner');

            const cardFront = document.createElement('div');
            cardFront.classList.add('card-front');

            const cardBack = document.createElement('div');
            cardBack.classList.add('card-back');

            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = 'Bánh trung thu';
            cardBack.appendChild(img);

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            card.appendChild(cardInner);

            card.addEventListener('click', flipCard);
            gameBoard.appendChild(card);
        });
        
        // Start timer after a brief delay
        setTimeout(startGameTimer, 500);
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === flippedCards[0]) return;
        if (this.classList.contains('matched')) return;

        this.classList.add('flipped');
        
        // Play flip sound (frog croak) - DISABLED
        // playSound('flip');
        
        // Increment moves counter
        if (flippedCards.length === 0) {
            moves++;
            movesCount.textContent = moves.toString();
        }

        if (flippedCards.length === 0) {
            flippedCards.push(this);
            return;
        }

        flippedCards.push(this);
        lockBoard = true;

        checkForMatch();
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.image === card2.dataset.image;

        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        // Add matched class and animation
        flippedCards.forEach(card => {
            card.removeEventListener('click', flipCard);
            card.classList.add('matched');
        });
        
        matchedPairs++;
        resetBoard();
        
        // Play match success sound
        playSound('match');
        
        // Add success visual effect
        createSuccessEffect(flippedCards[0]);
        
        const totalPairs = cardImages.length / 2; // Dynamic calculation
        console.log(`Matched pairs: ${matchedPairs}, Total pairs: ${totalPairs}`);
        
        if (matchedPairs === totalPairs) {
            console.log('Game completed! Showing win modal...');
            stopGameTimer();
            // Play win sound
            playSound('win');
            setTimeout(() => {
                showWinModal();
            }, 500);
        }
    }

    function createSuccessEffect(card) {
        // Check if card element exists
        if (!card || typeof card.getBoundingClientRect !== 'function') {
            console.log('Invalid card element for success effect');
            return;
        }
        
        // Create floating success emoji
        const successEmoji = document.createElement('div');
        successEmoji.textContent = '✨';
        successEmoji.style.cssText = `
            position: fixed;
            font-size: 2rem;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
            z-index: 1000;
        `;
        
        try {
            const rect = card.getBoundingClientRect();
            successEmoji.style.left = (rect.left + rect.width / 2) + 'px';
            successEmoji.style.top = rect.top + 'px';
        } catch (e) {
            // Fallback position
            successEmoji.style.left = '50%';
            successEmoji.style.top = '50%';
            successEmoji.style.transform = 'translate(-50%, -50%)';
        }
        
        document.body.appendChild(successEmoji);
        
        // Add CSS animation dynamically
        if (!document.getElementById('float-up-animation')) {
            const style = document.createElement('style');
            style.id = 'float-up-animation';
            style.textContent = `
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => successEmoji.remove(), 1000);
    }

    function unflipCards() {
        setTimeout(() => {
            flippedCards.forEach(card => card.classList.remove('flipped'));
            resetBoard();
        }, 1200);
    }

    function resetBoard() {
        [flippedCards, lockBoard] = [[], false];
    }

    function showWinModal() {
        console.log('showWinModal called');
        
        if (!winModal) {
            console.error('Win modal element not found!');
            return;
        }
        
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        
        if (finalTime) finalTime.textContent = `${minutes}:${seconds}`;
        if (finalMoves) finalMoves.textContent = moves.toString();
        
        winModal.classList.remove('hidden');
        console.log('Win modal should be visible now');
        
        // Add celebration effect
        createCelebrationEffect();
    }

    function createCelebrationEffect() {
        const celebrationEmojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
                emoji.style.cssText = `
                    position: fixed;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 1002;
                    left: ${Math.random() * 100}vw;
                    top: -50px;
                    animation: celebrationFall 3s linear forwards;
                `;
                
                document.body.appendChild(emoji);
                
                setTimeout(() => emoji.remove(), 3000);
            }, i * 100);
        }
        
        // Add celebration animation CSS if not exists
        if (!document.getElementById('celebration-animation')) {
            const style = document.createElement('style');
            style.id = 'celebration-animation';
            style.textContent = `
                @keyframes celebrationFall {
                    0% { 
                        transform: translateY(-50px) rotate(0deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function sendWish() {
        const wishText = wishInput.value.trim();
        if (wishText === '') {
            // Shake the input if empty
            wishInput.style.animation = 'shake 0.5s';
            setTimeout(() => wishInput.style.animation = '', 500);
            return;
        }

        // Disable button while sending
        sendWishButton.disabled = true;
        sendWishButton.innerHTML = '<span class="btn-icon">⏳</span><span>Đang gửi...</span>';

        // Send email via EmailJS
        const templateParams = {
            to_email: 'tranngocthien12a1@gmail.com',
            player_wish: wishText,
            game_time: finalTime.textContent,
            game_moves: finalMoves.textContent,
            date_time: new Date().toLocaleString('vi-VN')
        };

        emailjs.send('service_5wab1q6', 'template_fs6j2jg', templateParams)
            .then((response) => {
                console.log('Email sent successfully!', response.status, response.text);
                
                // Hide win modal and show animation
                winModal.classList.add('hidden');
                startAnimationSequence(wishText);
                
                // Re-enable button
                sendWishButton.disabled = false;
                sendWishButton.innerHTML = '<span class="btn-icon">🚀</span><span>Gửi điều ước</span>';
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
                
                // Still show animation even if email fails
                winModal.classList.add('hidden');
                startAnimationSequence(wishText);
                
                // Re-enable button
                sendWishButton.disabled = false;
                sendWishButton.innerHTML = '<span class="btn-icon">🚀</span><span>Gửi điều ước</span>';
            });
        
        wishInput.value = '';
    }

    function createMagicalTrail() {
        const trailEmojis = ['✨', '🌟', '💫', '⭐', '🌙'];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const trail = document.createElement('div');
                trail.textContent = trailEmojis[Math.floor(Math.random() * trailEmojis.length)];
                trail.style.cssText = `
                    position: fixed;
                    font-size: 1.5rem;
                    pointer-events: none;
                    z-index: 1003;
                    left: ${20 + i * 8}%;
                    bottom: ${30 + i * 5}%;
                    animation: magicalTrail 2s ease-out forwards;
                `;
                
                document.body.appendChild(trail);
                setTimeout(() => trail.remove(), 2000);
            }, i * 100);
        }
        
        // Add magical trail animation
        if (!document.getElementById('magical-trail-animation')) {
            const style = document.createElement('style');
            style.id = 'magical-trail-animation';
            style.textContent = `
                @keyframes magicalTrail {
                    0% { 
                        transform: scale(0) rotate(0deg);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.2) rotate(180deg);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: scale(0) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function createCuoiWishAnimation(wishText) {
        // Create Cuoi character
        const cuoi = document.createElement('div');
        cuoi.textContent = '🐰';
        cuoi.style.cssText = `
            position: fixed;
            font-size: 3rem;
            bottom: 20px;
            left: 20px;
            z-index: 1005;
            animation: cuoiJump 0.5s ease-in-out 3;
        `;
        document.body.appendChild(cuoi);

        // Create wish bubble
        setTimeout(() => {
            const wishBubble = document.createElement('div');
            wishBubble.innerHTML = `
                <div style="position: relative;">
                    <div style="background: linear-gradient(45deg, #FFF8DC, #FFFAF0); 
                                padding: 1rem; 
                                border-radius: 20px; 
                                border: 2px solid #FFD700;
                                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                                max-width: 200px;
                                font-size: 0.9rem;
                                color: #333;
                                font-weight: 600;">
                        ${wishText}
                    </div>
                    <div style="position: absolute; 
                                bottom: -8px; 
                                left: 20px; 
                                width: 0; 
                                height: 0; 
                                border-left: 10px solid transparent;
                                border-right: 10px solid transparent;
                                border-top: 10px solid #FFD700;"></div>
                </div>
            `;
            wishBubble.style.cssText = `
                position: fixed;
                bottom: 120px;
                left: 80px;
                z-index: 1005;
                animation: bubbleFloat 2s ease-in-out;
            `;
            document.body.appendChild(wishBubble);

            // Send wish to moon after 2 seconds
            setTimeout(() => {
                wishBubble.style.animation = 'wishToMoon 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
                cuoi.style.animation = 'cuoiWave 3s ease-in-out forwards';
                
                // Add twinkling moon effect
                const moon = document.querySelector('.moon-decoration');
                if (moon) {
                    moon.style.animation = 'moonReceive 3s ease-in-out';
                }
                
                // Clean up
                setTimeout(() => {
                    cuoi.remove();
                    wishBubble.remove();
                    if (moon) moon.style.animation = 'moonGlow 3s ease-in-out infinite alternate';
                }, 3000);
            }, 2000);
        }, 1500);

        // Add required CSS animations
        if (!document.getElementById('cuoi-animations')) {
            const style = document.createElement('style');
            style.id = 'cuoi-animations';
            style.textContent = `
                @keyframes cuoiJump {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.1); }
                }
                
                @keyframes cuoiWave {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                    100% { transform: rotate(0deg); }
                }
                
                @keyframes bubbleFloat {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes wishToMoon {
                    0% { 
                        bottom: 120px;
                        left: 80px;
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    100% { 
                        bottom: 85%;
                        left: 85%;
                        transform: scale(0.3) rotate(360deg);
                        opacity: 0;
                    }
                }
                
                @keyframes moonReceive {
                    0% { 
                        filter: drop-shadow(0 0 10px #FFD700);
                        transform: scale(1);
                    }
                    50% { 
                        filter: drop-shadow(0 0 30px #FFD700) drop-shadow(0 0 50px #FFA500);
                        transform: scale(1.2);
                    }
                    100% { 
                        filter: drop-shadow(0 0 20px #FFD700);
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function showErrorMessage() {
        const errorMsg = document.createElement('div');
        errorMsg.textContent = '⚠️ Không thể gửi email, nhưng chú Cuội đã nhận được điều ước! 🐰';
        errorMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #FF6B6B, #FF8E53);
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            font-weight: 700;
            font-size: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1006;
            animation: errorFade 3s ease-in-out forwards;
        `;
        document.body.appendChild(errorMsg);
        
        if (!document.getElementById('error-animation')) {
            const style = document.createElement('style');
            style.id = 'error-animation';
            style.textContent = `
                @keyframes errorFade {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => errorMsg.remove(), 3000);
    }

    function showThankYouMessage() {
        const thankYou = document.createElement('div');
        thankYou.textContent = '🌙 Điều ước đã được gửi đến cung trăng! ✨';
        thankYou.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #FFD700, #FFA500);
            color: #333;
            padding: 1rem 2rem;
            border-radius: 25px;
            font-weight: 700;
            font-size: 1.2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1004;
            animation: thankYouFade 3s ease-in-out forwards;
        `;
        
        document.body.appendChild(thankYou);
        
        // Add thank you animation
        if (!document.getElementById('thank-you-animation')) {
            const style = document.createElement('style');
            style.id = 'thank-you-animation';
            style.textContent = `
                @keyframes thankYouFade {
                    0% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    20% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    80% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => thankYou.remove(), 3000);
    }

    function restartGame() {
        winModal.classList.add('hidden');
        createBoard();
    }

    function goToStartScreen() {
        winModal.classList.add('hidden');
        gameContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
        stopGameTimer();
    }

    // Initialize audio on page load
    initAudio();
    
    // Event Listeners
    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        createBoard();
        // Auto-start music when game begins
        if (!isMusicEnabled) {
            toggleMusic();
        }
    });

    musicToggle.addEventListener('click', toggleMusic);
    
    // Test wish button
    const testWishBtn = document.getElementById('test-wish-btn');
    if (testWishBtn) {
        testWishBtn.addEventListener('click', () => {
            console.log('Test wish button clicked');
            // Set some dummy game stats for testing
            finalTime.textContent = '01:23';
            finalMoves.textContent = '15';
            showWinModal();
        });
    }
    
    sendWishButton.addEventListener('click', sendWish);
    playAgainButton.addEventListener('click', restartGame);
    restartButton.addEventListener('click', restartGame);

    // Allow Enter key to send wish
    wishInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendWish();
        }
    });

    // Animation control event listeners
    if (skipAnimationBtn) {
        skipAnimationBtn.addEventListener('click', skipToEnd);
    }
    
    if (backToGameBtn) {
        backToGameBtn.addEventListener('click', () => {
            animationScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
        });
    }

    // Add some keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!winModal.classList.contains('hidden')) {
                winModal.classList.add('hidden');
            }
            if (!animationScreen.classList.contains('hidden')) {
                skipToEnd();
            }
        }
        if (e.key === 'r' || e.key === 'R') {
            if (!gameContainer.classList.contains('hidden')) {
                restartGame();
            }
        }
    });
    
    // Animation Functions - New Simple & Beautiful Version
    function startAnimationSequence(wishText) {
        animationScreen.classList.remove('hidden');
        
        // Display wish text in orb
        const wishDisplay = document.getElementById('wish-display');
        if (wishDisplay) {
            wishDisplay.textContent = wishText;
        }
        
        // Animation sequence
        setTimeout(() => {
            // Start orb floating upward
            startOrbJourney();
        }, 1000);
        
        setTimeout(() => {
            // Show success message
            showSuccessMessage();
        }, 4000);
        
        setTimeout(() => {
            // Show back button
            showBackButton();
        }, 7000);
    }
    
    function startOrbJourney() {
        const wishOrb = document.querySelector('.wish-orb-container');
        if (wishOrb) {
            wishOrb.style.animation = 'orbJourney 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
        }
        
        // Add CSS animation for orb journey
        if (!document.getElementById('orb-journey-animation')) {
            const style = document.createElement('style');
            style.id = 'orb-journey-animation';
            style.textContent = `
                @keyframes orbJourney {
                    0% {
                        bottom: 25%;
                        left: 20%;
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        bottom: 60%;
                        left: 60%;
                        transform: scale(0.8);
                        opacity: 0.9;
                    }
                    100% {
                        bottom: 85%;
                        left: 85%;
                        transform: scale(0.4);
                        opacity: 0.3;
                    }
                }
                
                /* Responsive Orb Journey */
                @media (max-width: 768px) {
                    @keyframes orbJourney {
                        0% {
                            bottom: 30%;
                            left: 15%;
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            bottom: 55%;
                            left: 50%;
                            transform: scale(0.8);
                            opacity: 0.9;
                        }
                        100% {
                            bottom: 75%;
                            left: 80%;
                            transform: scale(0.5);
                            opacity: 0.3;
                        }
                    }
                }
                
                @media (max-width: 480px) {
                    @keyframes orbJourney {
                        0% {
                            bottom: 25%;
                            left: 12%;
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            bottom: 50%;
                            left: 45%;
                            transform: scale(0.8);
                            opacity: 0.9;
                        }
                        100% {
                            bottom: 70%;
                            left: 75%;
                            transform: scale(0.6);
                            opacity: 0.4;
                        }
                    }
                }
                
                @media (max-width: 360px) {
                    @keyframes orbJourney {
                        0% {
                            bottom: 20%;
                            left: 10%;
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            bottom: 45%;
                            left: 40%;
                            transform: scale(0.8);
                            opacity: 0.9;
                        }
                        100% {
                            bottom: 65%;
                            left: 70%;
                            transform: scale(0.7);
                            opacity: 0.5;
                        }
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function showSuccessMessage() {
        const successMessage = document.querySelector('.success-message');
        if (successMessage) {
            successMessage.classList.remove('hidden');
        }
    }
    
    function showBackButton() {
        skipAnimationBtn.classList.add('hidden');
        backToGameBtn.classList.remove('hidden');
    }
    
    function skipToEnd() {
        // Skip to final state
        const wishOrb = document.querySelector('.wish-orb-container');
        if (wishOrb) {
            wishOrb.style.animation = 'none';
            wishOrb.style.bottom = '85%';
            wishOrb.style.left = '85%';
            wishOrb.style.transform = 'scale(0.4)';
            wishOrb.style.opacity = '0.3';
        }
        
        showSuccessMessage();        
        showBackButton();
    }
});
