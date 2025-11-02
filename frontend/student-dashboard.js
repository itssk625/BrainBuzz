/**
 * Student Dashboard JavaScript
 * Handles viewing available quizzes and results
 */

// Check authentication on page load
window.addEventListener('load', async () => {
    const user = api.getUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('username').textContent = user.username;
    await loadAvailableQuizzes();
    await loadMyAttempts();
});

// Show different sections
function showSection(section) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    
    event.target.classList.add('active');
    
    if (section === 'available') {
        document.getElementById('available-section').style.display = 'block';
    } else {
        document.getElementById('attempts-section').style.display = 'block';
    }
}

// Load available quizzes
async function loadAvailableQuizzes() {
    showLoading(true);
    
    try {
        const response = await api.getAvailableQuizzes();
        
        if (response.success && response.data && response.data.length > 0) {
            displayQuizzes(response.data);
            document.getElementById('no-quizzes').style.display = 'none';
        } else {
            document.getElementById('quizzes-list').innerHTML = '';
            document.getElementById('no-quizzes').style.display = 'block';
        }
    } catch (error) {
        alert('Failed to load quizzes: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Display quizzes in grid
function displayQuizzes(quizzes) {
    const container = document.getElementById('quizzes-list');
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card" onclick="startQuiz('${quiz._id}')">
            <h3>${quiz.title}</h3>
            <div class="quiz-meta">
                <span>⏱️ ${quiz.timeLimit} mins</span>
                <span>📝 ${quiz.questions.length} questions</span>
                <span>🎯 ${quiz.totalPoints} points</span>
            </div>
        </div>
    `).join('');
}

// Start quiz
async function startQuiz(quizId) {
    try {
        const response = await api.getQuiz(quizId);
        
        if (response.success) {
            // Store quiz data in sessionStorage
            sessionStorage.setItem('currentQuiz', JSON.stringify(response.data));
            window.location.href = 'quiz-page.html';
        } else {
            alert('Quiz no longer exists');
            loadAvailableQuizzes();
        }
    } catch (error) {
        if (error.message.includes('longer exists')) {
            alert('Quiz has been deleted by instructor');
            loadAvailableQuizzes();
        } else {
            alert('Failed to load quiz: ' + error.message);
        }
    }
}

// Load my attempts
async function loadMyAttempts() {
    try {
        const response = await api.getMyAttempts();
        
        if (response.success && response.data && response.data.length > 0) {
            displayAttempts(response.data);
            document.getElementById('no-attempts').style.display = 'none';
        } else {
            document.getElementById('attempts-list').innerHTML = '';
            document.getElementById('no-attempts').style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load attempts:', error);
    }
}

// Display attempts
function displayAttempts(attempts) {
    const container = document.getElementById('attempts-list');
    container.innerHTML = attempts.map(attempt => {
        const date = new Date(attempt.submittedAt).toLocaleDateString();
        const gradeClass = `grade-${attempt.grade}`;
        
        return `
            <div class="quiz-card" onclick="viewAttempt('${attempt._id}')">
                <h3>${attempt.quiz.title}</h3>
                <div class="quiz-meta">
                    <span>📅 ${date}</span>
                    <span>⏱️ ${attempt.timeTaken.toFixed(1)} mins</span>
                </div>
                <div style="margin-top: 15px;">
                    <span class="grade-badge ${gradeClass}">Grade: ${attempt.grade}</span>
                </div>
                <div style="margin-top: 10px; font-size: 18px; font-weight: 600;">
                    Score: ${attempt.score} / ${attempt.totalPoints} 
                    (${attempt.percentage.toFixed(1)}%)
                </div>
            </div>
        `;
    }).join('');
}

// View attempt details
function viewAttempt(attemptId) {
    window.location.href = `quiz-results.html?attemptId=${attemptId}`;
}

// Show loading indicator
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        api.clearAuthData();
        window.location.href = 'index.html';
    }
}
