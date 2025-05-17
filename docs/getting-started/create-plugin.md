const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const gravity = 0.6;
const flapStrength = -10;

let birdY = 150;
let birdVelocity = 0;
let birdX = 50;
let direction = 'right'; // default

// Load images
const birdRight = new Image();
birdRight.src = 'images/bird-right.png';

const birdLeft = new Image();
birdLeft.src = 'images/bird-left.png';

let birdImage = birdRight;

let isFlapping = false;

// Handle flap
function flap() {
    birdVelocity = flapStrength;
}

// Input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') flap();
    if (e.code === 'ArrowRight') {
        birdX += 10;
        direction = 'right';
        birdImage = birdRight;
    }
    if (e.code === 'ArrowLeft') {
        birdX -= 10;
        direction = 'left';
        birdImage = birdLeft;
    }
});

canvas.addEventListener('click', flap);

// Game loop
function update() {
    birdVelocity += gravity;
    birdY += birdVelocity;

    if (birdY > canvas.height - 32) {
        birdY = canvas.height - 32;
        birdVelocity = 0;
    }

    if (birdY < 0) {
        birdY = 0;
        birdVelocity = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(birdImage, birdX, birdY, 40, 40);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
