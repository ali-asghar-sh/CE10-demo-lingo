document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const wordInput = document.getElementById('word-input');
    const submitBtn = document.getElementById('submit-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');

    let secretWord = '';
    let currentRow = 0;
    let score = 0;
    let gameActive = false;

    // API Configuration - use full URL for local development
    const API_BASE = 'http://localhost:3000/api';

    // Initialize the game board with first letter revealed
    function initBoard() {
        board.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'word-row';
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'letter-cell';
                // Reveal first letter in the first row
                if (i === 0 && j === 0 && secretWord) {
                    cell.textContent = secretWord[0];
                    cell.classList.add('revealed');
                }
                row.appendChild(cell);
            }
            board.appendChild(row);
        }
    }

    // Fetch new word from API
    async function getNewWord() {
        try {
            const response = await fetch(`${API_BASE}/word`);
            const data = await response.json();
            return data.word;
        } catch (error) {
            console.error('Error fetching word:', error);
            message.textContent = 'Error connecting to server';
            return null;
        }
    }

    // Submit score to API
    async function submitScore(finalScore, attempts, word, won) {
        try {
            await fetch(`${API_BASE}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score: finalScore,
                    attempts: attempts,
                    word: word,
                    won: won,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    // Start new game
    async function startNewGame() {
        message.textContent = 'Loading new word...';
        submitBtn.disabled = true;
        wordInput.disabled = true;
        
        secretWord = await getNewWord();
        if (!secretWord) {
            message.textContent = 'Failed to load word. Try again.';
            return;
        }

        currentRow = 0;
        gameActive = true;
        submitBtn.disabled = false;
        wordInput.disabled = false;
        wordInput.focus();
        
        initBoard();
        message.textContent = `Guess the 4-letter word starting with ${secretWord[0]}`;
    }

    // Check the guessed word
    function checkWord(guess) {
        const row = board.children[currentRow];
        let correctPositions = 0;

        for (let i = 0; i < 4; i++) {
            const cell = row.children[i];
            const letter = guess[i];
            cell.textContent = letter;

            if (letter === secretWord[i]) {
                cell.classList.add('correct');
                correctPositions++;
            } else if (secretWord.includes(letter)) {
                cell.classList.add('present');
            } else {
                cell.classList.add('absent');
            }
        }

        if (correctPositions === 4) {
            const finalScore = Math.max(10 - currentRow * 1, 1);
            score += finalScore;
            scoreDisplay.textContent = score;
            message.textContent = `You win! +${finalScore} points`;
            gameActive = false;
            submitBtn.disabled = true;
            
            // Submit score to API
            submitScore(finalScore, currentRow + 1, secretWord, true);
            
        } else {
            currentRow++;
            if (currentRow >= 6) {
                message.textContent = `Game Over! The word was: ${secretWord}`;
                gameActive = false;
                submitBtn.disabled = true;
                
                // Submit score to API (0 points for loss)
                submitScore(0, 6, secretWord, false);
            }
        }
    }

    // Event listeners
    submitBtn.addEventListener('click', () => {
        if (!gameActive) return;
        
        const guess = wordInput.value.toUpperCase().trim();
        if (guess.length !== 4) {
            message.textContent = "Please enter a 4-letter word!";
            return;
        }
        if (guess[0] !== secretWord[0]) {
            message.textContent = `First letter must be ${secretWord[0]}!`;
            return;
        }
        
        checkWord(guess);
        wordInput.value = '';
    });

    newGameBtn.addEventListener('click', startNewGame);

    // Allow Enter key to submit
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });

    // Start the first game
    startNewGame();
});
