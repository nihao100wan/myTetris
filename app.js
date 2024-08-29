document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const miniGrid = document.querySelector('.mini-grid');
    const width = 10;

    // Create grid squares (200 for the main grid + 10 for the taken squares at the bottom)
    for (let i = 0; i < 200; i++) {
        const div = document.createElement('div');
        grid.appendChild(div);
    }

    // Create the last row as taken squares
    for (let i = 190; i < 200; i++) {
        const div = document.createElement('div');
        div.classList.add('taken');
        grid.appendChild(div);
    }

    // Create mini-grid squares (16 for the mini-grid display)
    for (let i = 0; i < 16; i++) {
        const div = document.createElement('div');
        miniGrid.appendChild(div);
    }

    // Now get the updated squares array after dynamically adding the divs
    let squares = Array.from(document.querySelectorAll('.grid div'));
    const displaySquares = document.querySelectorAll('.mini-grid div');
    const scoreDisplay = document.querySelector('#score');
    const startBtn = document.querySelector('#start-button');
    const resetBtn = document.querySelector('#reset-button');
    let nextRandom = 0;
    let timerId;
    let score = 0;
    const colors = [
        'orange',
        'red',
        'purple',
        'green',
        'blue'
    ];

    // The Tetrominoes
    const lTetromino = [
        [1, width+1, width*2+1, 2],
        [width, width+1, width+2, width*2+2],
        [1, width+1, width*2+1, width*2],
        [width, width*2, width*2+1, width*2+2]
    ];

    const zTetromino = [
        [0, width, width+1, width*2+1],
        [width+1, width+2, width*2, width*2+1],
        [0, width, width+1, width*2+1],
        [width+1, width+2, width*2, width*2+1]
    ];

    const tTetromino = [
        [1, width, width+1, width+2],
        [1, width+1, width+2, width*2+1],
        [width, width+1, width+2, width*2+1],
        [1, width, width+1, width*2+1]
    ];

    const oTetromino = [
        [0, 1, width, width+1],
        [0, 1, width, width+1],
        [0, 1, width, width+1],
        [0, 1, width, width+1]
    ];

    const iTetromino = [
        [1, width+1, width*2+1, width*3+1],
        [width, width+1, width+2, width+3],
        [1, width+1, width*2+1, width*3+1],
        [width, width+1, width+2, width+3]
    ];

    const theTetrominoes = [lTetromino, zTetromino, tTetromino, oTetromino, iTetromino];

    let currentPosition = 4;
    let currentRotation = 0;

    // Randomly select a Tetromino and its first rotation
    let random = Math.floor(Math.random() * theTetrominoes.length);
    let current = theTetrominoes[random][currentRotation];

    // Draw the Tetromino
    function draw() {
        console.log("Drawing Tetromino at position:", currentPosition);
        current.forEach(index => {
            let position = currentPosition + index;
            if (position >= 0 && position < squares.length) {
                squares[position].classList.add('tetromino');
                squares[position].style.backgroundColor = colors[random];
            }
     });
    }
    
    // Undraw the Tetromino
    function undraw() {
        current.forEach(index => {
            squares[currentPosition + index].classList.remove('tetromino');
            squares[currentPosition + index].style.backgroundColor = '';
        });
    }

    // Assign functions to keyCodes
    function control(e) {
        if (e.keyCode === 37) {
            moveLeft();
        } else if (e.keyCode === 38) {
            rotate();
        } else if (e.keyCode === 39) {
            moveRight();
        } else if (e.keyCode === 40) {
            moveDown();
        }
    }
    document.addEventListener('keyup', control);

    function freeze() {
        // Check if any part of the Tetromino is going to collide with a "taken" square or the bottom of the grid
        if (current.some(index => squares[currentPosition + index + width].classList.contains('taken') || currentPosition + index + width >= 200)) {
            // Mark the squares occupied by the Tetromino as "taken"
            current.forEach(index => {
                squares[currentPosition + index].classList.add('taken');
                squares[currentPosition + index].classList.add('tetromino'); // This ensures the Tetromino is visually shown
                squares[currentPosition + index].style.backgroundColor = colors[random]; // Preserve the Tetromino's color
            });
    
            // Start a new Tetromino falling
            random = nextRandom;
            nextRandom = Math.floor(Math.random() * theTetrominoes.length);
            current = theTetrominoes[random][currentRotation = 0];
            currentPosition = 4;
            
            // Draw the new Tetromino
            draw();
            displayShape();
            addScore();
            gameOver();
        }
    }
    
    function moveDown() {
        undraw();
        const isAtBottom = current.some(index => currentPosition + index + width >= 200); // Adjusted boundary check for bottom
        if (!isAtBottom && !current.some(index => squares[currentPosition + index + width].classList.contains('taken'))) {
            currentPosition += width;
            draw();
        } else {
            freeze();
        }
    }
      
    // Move the tetromino left, unless it is at the edge or there is a blockage
    function moveLeft() {
        undraw();
        const isAtLeftEdge = current.some(index => (currentPosition + index) % width === 0);
        if (!isAtLeftEdge) currentPosition -= 1;
        if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
            currentPosition += 1;
        }
        draw();
    }

    // Move the tetromino right, unless it is at the edge or there is a blockage
    function moveRight() {
        undraw();
        const isAtRightEdge = current.some(index => (currentPosition + index) % width === width - 1);
        if (!isAtRightEdge) currentPosition += 1;
        if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
            currentPosition -= 1;
        }
        draw();
    }

    // Rotate the tetromino
    function rotate() {
        undraw();
        const previousRotation = currentRotation;
        currentRotation++;
        if (currentRotation === current.length) {
            currentRotation = 0;
        }
        current = theTetrominoes[random][currentRotation];
    
        // Attempt wall kick: try shifting the Tetromino left or right if it collides with the wall
        if (isAtRightEdge() || isAtLeftEdge()) {
            if (isAtRightEdge()) {
                currentPosition -= 1; // Try to kick left
                if (isAtRightEdge() || collisionWithTakenSquares()) {
                    currentPosition -= 1; // Kick further left
                    if (isAtRightEdge() || collisionWithTakenSquares()) {
                        currentPosition += 2; // Revert to original position
                        currentRotation = previousRotation; // Revert rotation
                        current = theTetrominoes[random][currentRotation];
                    }
                }
            } else if (isAtLeftEdge()) {
                currentPosition += 1; // Try to kick right
                if (isAtLeftEdge() || collisionWithTakenSquares()) {
                    currentPosition += 1; // Kick further right
                    if (isAtLeftEdge() || collisionWithTakenSquares()) {
                        currentPosition -= 2; // Revert to original position
                        currentRotation = previousRotation; // Revert rotation
                        current = theTetrominoes[random][currentRotation];
                    }
                }
            }
        }
    
        draw();
    }
    
    function isAtRightEdge() {
        return current.some(index => (currentPosition + index) % width === width - 1);
    }
    
    function isAtLeftEdge() {
        return current.some(index => (currentPosition + index) % width === 0);
    }
    
    function collisionWithTakenSquares() {
        return current.some(index => squares[currentPosition + index].classList.contains('taken'));
    }
     

    // Show up-next tetromino in mini-grid display
    const displayWidth = 4;
    const displayIndex = 0;

    // The Tetrominoes without rotations for mini-grid
    const upNextTetrominoes = [
        [1, displayWidth + 1, displayWidth * 2 + 1, 2], // lTetromino
        [0, displayWidth, displayWidth + 1, displayWidth * 2 + 1], // zTetromino
        [1, displayWidth, displayWidth + 1, displayWidth + 2], // tTetromino
        [0, 1, displayWidth, displayWidth + 1], // oTetromino
        [1, displayWidth + 1, displayWidth * 2 + 1, displayWidth * 3 + 1] // iTetromino
    ];

    // Display the shape in the mini-grid display
    function displayShape() {
        // Remove any trace of a tetromino from the entire grid
        displaySquares.forEach(square => {
            square.classList.remove('tetromino');
            square.style.backgroundColor = '';
        });
        upNextTetrominoes[nextRandom].forEach(index => {
            displaySquares[displayIndex + index].classList.add('tetromino');
            displaySquares[displayIndex + index].style.backgroundColor = colors[nextRandom];
        });
    }

    // Add functionality to the button
    startBtn.addEventListener('click', () => {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        } else {
            draw();
            timerId = setInterval(moveDown, 1000);
            nextRandom = Math.floor(Math.random() * theTetrominoes.length);
            displayShape();
        }
    });

    // Add score
    function addScore() {
        for (let i = 0; i < 199; i += width) {
            const row = [i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9];

            if (row.every(index => squares[index].classList.contains('taken'))) {
                score += 10;
                scoreDisplay.innerHTML = score;
                row.forEach(index => {
                    squares[index].classList.remove('taken');
                    squares[index].classList.remove('tetromino');
                    squares[index].style.backgroundColor = '';
                });
                const squaresRemoved = squares.splice(i, width);
                squares = squaresRemoved.concat(squares);
                squares.forEach(cell => grid.appendChild(cell));
            }
        }
    }

    // Game over
    function gameOver() {
        if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
            clearInterval(timerId);
            alert(`Game Over! Your final score is: ${score}`);
        }
    }

    // Reset the game
    function resetGame() {
        // Clear the grid
        squares.forEach(square => {
            square.classList.remove('tetromino', 'taken');
            square.style.backgroundColor = '';
        });
    
    // Clear the mini-grid
    displaySquares.forEach(square => {
        square.classList.remove('tetromino');
        square.style.backgroundColor = '';
        });
    
    // Reset variables
    score = 0;
    scoreDisplay.innerHTML = score;
    clearInterval(timerId);
    timerId = null;
    currentPosition = 4;
    currentRotation = 0;
    random = Math.floor(Math.random() * theTetrominoes.length);
    current = theTetrominoes[random][currentRotation];
    nextRandom = 0;
    }
    
    // Add event listener to the reset button
    resetBtn.addEventListener('click', resetGame);

});
