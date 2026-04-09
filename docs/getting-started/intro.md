<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memory Game - Puzzle Sederhana</title>
    <style>
        /* --- BAGIAN CSS --- */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #282c34;
            color: white;
        }

        .game-container {
            text-align: center;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(4, 80px); /* 4 kolom */
            gap: 10px;
            margin: 20px auto;
            perspective: 1000px;
        }

        .card {
            width: 80px;
            height: 80px;
            background-color: #444b5a;
            color: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2rem;
            cursor: pointer;
            border-radius: 10px;
            user-select: none;
            transition: transform 0.4s, background-color 0.3s;
        }

        /* Efek saat kartu terbuka */
        .card.flipped {
            background-color: #ffffff;
            color: #000;
            transform: rotateY(180deg);
        }

        /* Efek saat kartu sudah cocok */
        .card.matched {
            background-color: #4caf50;
            color: white;
            cursor: default;
        }

        button {
            padding: 10px 25px;
            font-size: 1rem;
            cursor: pointer;
            background-color: #61dafb;
            color: #282c34;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            transition: 0.3s;
        }

        button:hover {
            background-color: #4fa8c7;
        }

        /* Responsif untuk layar kecil */
        @media (max-width: 400px) {
            .grid {
                grid-template-columns: repeat(4, 60px);
            }
            .card {
                width: 60px;
                height: 60px;
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>

    <div class="game-container">
        <h1>Memory Game</h1>
        <p>Cari pasangan emoji yang sama!</p>
        <div id="game-board" class="grid"></div>
        <button onclick="resetGame()">Ulang Permainan</button>
    </div>

    <script>
        /* --- BAGIAN JAVASCRIPT --- */
        const board = document.getElementById('game-board');
        const symbols = ['🐱', '🐱', '🐶', '🐶', '🦊', '🦊', '🐸', '🐸', '🐯', '🐯', '🐵', '🐵', '🐨', '🐨', '🐷', '🐷'];
        let flippedCards = [];
        let matchedCount = 0;
        let isProcessing = false; // Mencegah klik berlebihan saat pengecekan

        // Fungsi untuk mengacak urutan kartu
        function shuffle(array) {
            return array.sort(() => Math.random() - 0.5);
        }

        // Fungsi untuk membuat papan permainan
        function createBoard() {
            const shuffledSymbols = shuffle([...symbols]);
            board.innerHTML = '';
            shuffledSymbols.forEach((symbol) => {
                const card = document.createElement('div');
                card.classList.add('card');
                card.dataset.symbol = symbol;
                card.innerText = symbol;
                card.addEventListener('click', flipCard);
                board.appendChild(card);
            });
        }

        function flipCard() {
            // Validasi: kartu tidak bisa diklik jika sudah terbuka, sudah cocok, atau sedang mengecek 2 kartu
            if (isProcessing || this.classList.contains('flipped') || this.classList.contains('matched')) {
                return;
            }

            this.classList.add('flipped');
            flippedCards.push(this);

            if (flippedCards.length === 2) {
                checkMatch();
            }
        }

        function checkMatch() {
            isProcessing = true; // Kunci input sebentar
            const [card1, card2] = flippedCards;

            if (card1.dataset.symbol === card2.dataset.symbol) {
                // Jika cocok
                card1.classList.add('matched');
                card2.classList.add('matched');
                matchedCount += 2;
                flippedCards = [];
                isProcessing = false;

                // Cek apakah semua sudah ketemu
                if (matchedCount === symbols.length) {
                    setTimeout(() => {
                        alert('Hebat! Kamu berhasil menyelesaikan puzzle ini!');
                    }, 500);
                }
            } else {
                // Jika tidak cocok, tutup kembali setelah 1 detik
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    flippedCards = [];
                    isProcessing = false;
                }, 1000);
            }
        }

        function resetGame() {
            matchedCount = 0;
            flippedCards = [];
            isProcessing = false;
            createBoard();
        }

        // Jalankan game saat halaman dimuat
        createBoard();
    </script>

</body>
</html>
