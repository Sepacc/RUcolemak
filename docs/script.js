// Список коротких русских слов (3-5 букв)
const words = [
    "дом", "кот", "лес", "мир", "сад",
    "день", "ночь", "путь", "звук", "цвет",
    "вода", "огонь", "небо", "земля", "луна",
    "река", "свет", "тень", "поле", "трава"
];

// Элементы DOM
const previousWordElement = document.querySelector('.previous-word');
const nextWordElement = document.querySelector('.next-word');
const typedElement = document.querySelector('.typed');
const untypedElement = document.querySelector('.untyped');
const nextNextWordElement = document.querySelector('.next-next-word');
const textInput = document.querySelector('#text-input');
const wordCounterElement = document.querySelector('#word-counter');
const timerElement = document.querySelector('#timer');
const errorRateElement = document.querySelector('#error-rate');
const speedElement = document.querySelector('#speed');
const nicknameForm = document.querySelector('#nickname-form');
const nicknameInput = document.querySelector('#nickname-input');
const passwordInput = document.querySelector('#password-input');
const submitScoreButton = document.querySelector('#submit-score');
const leaderboardBody = document.querySelector('#leaderboard-body');
const userRankElement = document.querySelector('#user-rank');

// Переменные для отслеживания состояния
let currentIndex = 0;
let wordCount = 0;
let timeLeft = 60; // 60 секунд
let timerRunning = false;
let timerInterval = null;
let totalAttempts = 0; // Общее количество попыток ввода
let errorAttempts = 0; // Количество ошибочных попыток
let correctCharacters = 0; // Количество символов в правильно введенных словах
let startTime = null; // Время начала ввода

// Загрузка таблицы лидеров из localStorage
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Функция для обновления отображаемых слов
function updateWords() {
    previousWordElement.textContent = currentIndex > 0 ? words[currentIndex - 1] : '—';
    typedElement.textContent = '';
    untypedElement.textContent = words[currentIndex];
    nextNextWordElement.textContent = currentIndex < words.length - 1 ? words[currentIndex + 1] : '—';
    textInput.value = '';
    textInput.focus();
    textInput.classList.remove('error'); // Сбрасываем подсветку ошибок
    nextWordElement.classList.remove('typing'); // Сбрасываем анимацию подчеркивания
}

// Функция для подсветки текущего слова
function highlightWord(inputText) {
    const currentWord = words[currentIndex];
    if (inputText && currentWord.startsWith(inputText)) {
        typedElement.textContent = inputText;
        untypedElement.textContent = currentWord.slice(inputText.length);
        textInput.classList.remove('error');
        nextWordElement.classList.add('typing'); // Запускаем анимацию подчеркивания
    } else {
        typedElement.textContent = '';
        untypedElement.textContent = currentWord;
        if (inputText) {
            textInput.classList.add('error');
            nextWordElement.classList.remove('typing');
        } else {
            textInput.classList.remove('error');
            nextWordElement.classList.remove('typing');
        }
    }
}

// Функция для запуска таймера
function startTimer() {
    timerRunning = true;
    startTime = Date.now(); // Запоминаем время начала
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;

        // Обновляем скорость ввода
        updateSpeed();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            endGame();
        }
    }, 1000);
}

// Функция для обновления скорости ввода (CPM)
function updateSpeed() {
    if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 1000 / 60; // Прошедшее время в минутах
        const cpm = Math.round(correctCharacters / elapsedMinutes); // Символов в минуту (только правильные)
        speedElement.textContent = isNaN(cpm) ? 0 : cpm;
    }
}

// Функция для обновления процента ошибок
function updateErrorRate() {
    const errorRate = totalAttempts > 0 ? (errorAttempts / totalAttempts) * 100 : 0;
    errorRateElement.textContent = `${Math.round(errorRate)}%`;
}

// Функция для проверки введенного слова
function checkWord(inputText) {
    totalAttempts++;
    if (inputText === words[currentIndex]) {
        currentIndex++;
        wordCount++;
        correctCharacters += words[currentIndex - 1].length; // Добавляем длину правильного слова
        wordCounterElement.textContent = wordCount;

        // Если дошли до конца списка, начинаем сначала
        if (currentIndex >= words.length) {
            currentIndex = 0;
        }

        updateWords();
    } else {
        errorAttempts++;
        updateErrorRate();
    }
}

// Функция для окончания игры
function endGame() {
    textInput.disabled = true;
    nicknameForm.style.display = 'block';
    updateSpeed(); // Финальное обновление скорости
}

// Функция для обновления таблицы лидеров
function updateLeaderboard(nickname, score, errorRate, speed) {
    const entry = {
        nickname: nickname,
        password: passwordInput.value, // Сохраняем пароль для проверки
        score: score,
        errorRate: Math.round(errorRate),
        speed: speed,
        timestamp: Date.now()
    };

    // Проверяем, существует ли уже запись с таким никнеймом и паролем
    const existingEntryIndex = leaderboard.findIndex(
        entry => entry.nickname === nickname && entry.password === passwordInput.value
    );

    if (existingEntryIndex !== -1) {
        // Если запись существует, перезаписываем её
        leaderboard[existingEntryIndex] = entry;
    } else {
        // Иначе добавляем новую запись
        leaderboard.push(entry);
    }

    // Сортируем по количеству слов (по умолчанию)
    leaderboard.sort((a, b) => b.score - a.score);
    // Оставляем только последние 10 записей
    leaderboard = leaderboard.slice(0, 10);
    // Сохраняем в localStorage
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

// Функция для отображения таблицы лидеров
function displayLeaderboard() {
    leaderboardBody.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.nickname}</td>
            <td>${entry.score}</td>
            <td>${entry.errorRate}%</td>
            <td>${entry.speed}</td>
        `;
        leaderboardBody.appendChild(row);
    });

    // Показываем место пользователя, если никнейм введен
    if (nicknameInput.value) {
        const userEntry = leaderboard.find(entry => entry.nickname === nicknameInput.value && entry.password === passwordInput.value);
        if (userEntry) {
            const userRank = leaderboard.indexOf(userEntry) + 1;
            userRankElement.textContent = `Ваше место: ${userRank} (Слов: ${userEntry.score}, Ошибки: ${userEntry.errorRate}%, Скорость: ${userEntry.speed} зн/мин)`;
        } else {
            userRankElement.textContent = 'Ваш результат не найден. Проверьте никнейм и пароль.';
        }
    }
}

// Обработчик ввода
textInput.addEventListener('input', (e) => {
    // Запускаем таймер при первом вводе
    if (!timerRunning) {
        startTimer();
    }

    const inputText = e.target.value.trim();
    
    // Подсветка текущего слова
    highlightWord(inputText);
});

// Обработчик нажатия пробела для проверки слова
textInput.addEventListener('keypress', (e) => {
    if (e.key === ' ') {
        e.preventDefault(); // Предотвращаем добавление пробела в поле ввода
        const inputText = textInput.value.trim();
        if (inputText) {
            checkWord(inputText);
        }
    }
});

// Обработчик отправки результата
submitScoreButton.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    const password = passwordInput.value.trim();

    if (nickname && password) {
        const errorRate = totalAttempts > 0 ? (errorAttempts / totalAttempts) * 100 : 0;
        const speed = parseInt(speedElement.textContent);
        updateLeaderboard(nickname, wordCount, errorRate, speed);
        nicknameForm.style.display = 'none';
        // Сбрасываем игру
        wordCount = 0;
        timeLeft = 60;
        totalAttempts = 0;
        errorAttempts = 0;
        correctCharacters = 0;
        startTime = null;
        wordCounterElement.textContent = wordCount;
        timerElement.textContent = timeLeft;
        errorRateElement.textContent = '0%';
        speedElement.textContent = '0';
        textInput.disabled = false;
        updateWords();
    } else {
        alert('Пожалуйста, введите никнейм и пароль!');
    }
});

// Инициализация при загрузке страницы
updateWords();
displayLeaderboard();
