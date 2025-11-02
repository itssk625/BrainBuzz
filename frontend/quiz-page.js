
/**
 * Quiz Page JavaScript
 * Handles taking quiz with timer
 */

let quizData = null;
let startTime = Date.now();
let timerInterval = null;
let timeRemaining = 0;

// Check authentication and load quiz
window.addEventListener('load', async () => {
    const user = api.getUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    // Get quiz data from sessionStorage
    const quizJson = sessionStorage.getItem('currentQuiz');
    if (!quizJson) {
        alert('No quiz selected');
        window.location.href = 'student-dashboard.html';
        return;
    }

    quizData = JSON.parse(quizJson);
    timeRemaining = quizData.timeLimit * 60; // Convert to seconds
    
    document.getElementById('quiz-title').textContent = quizData.title;
    renderQuestions();
    startTimer();
});

// Render questions
function renderQuestions() {
    const container = document.getElementById('quiz-content');
    
    container.innerHTML = quizData.questions.map((question, qIndex) => `
        <div class="question-card" id="question-${qIndex}">
            <div class="question-header">
                <span class="question-number">Question ${qIndex + 1}</span>
            </div>
            <div class="question-text">${question.questionText}</div>
            <ul class="options-list">
                ${question.options.map((option, oIndex) => `
                    <li class="option-item">
                        <label class="option-label">
                            <input type="radio" name="question-${qIndex}" value="${oIndex}">
                            <span>${option}</span>
                        </label>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// Start timer
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Quiz will be submitted automatically.');
            submitQuiz();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timerEl = document.getElementById('timer');
    timerEl.textContent = `⏱️ ${display}`;
    
    // Change color when time is running out
    if (timeRemaining <= 60) {
        timerEl.style.background = '#ef4444';
    } else if (timeRemaining <= 300) {
        timerEl.style.background = '#f59e0b';
    }
}

// Submit quiz
async function submitQuiz() {
    clearInterval(timerInterval);
    
    // Collect answers
    const answers = [];
    for (let i = 0; i < quizData.questions.length; i++) {
        const selectedOption = document.querySelector(`input[name="question-${i}"]:checked`);
        answers.push(selectedOption ? parseInt(selectedOption.value) : -1);
    }
    
    // Calculate time taken
    const timeTaken = (Date.now() - startTime) / 1000 / 60; // in minutes
    
    try {
        const response = await api.submitQuiz(quizData._id, answers, timeTaken);
        
        if (response.success) {
            // Store attempt ID
            sessionStorage.setItem('attemptId', response.data._id);
            // Clear quiz data
            sessionStorage.removeItem('currentQuiz');
            // Redirect to results
            window.location.href = 'quiz-results.html?attemptId=' + response.data._id;
        }
    } catch (error) {
        alert('Failed to submit quiz: ' + error.message);
    }
}

// Go back
function goBack() {
    if (confirm('Are you sure you want to leave? Your progress will be lost.')) {
        clearInterval(timerInterval);
        sessionStorage.removeItem('currentQuiz');
        window.location.href = 'student-dashboard.html';
    }
}
