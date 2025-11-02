/**
 * Quiz Results JavaScript
 * Displays quiz attempt results
 */

// Load attempt data on page load
window.addEventListener('load', async () => {
    const user = api.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Get attempt ID from URL or sessionStorage
    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get('attemptId') || sessionStorage.getItem('attemptId');
    
    if (attemptId) {
        await loadAttemptData(attemptId);
    } else {
        document.getElementById('results-content').innerHTML = '<p>No attempt data found.</p>';
    }
});

// Load attempt data
async function loadAttemptData(attemptId) {
    try {
        const response = await api.getAttempt(attemptId);
        
        if (response.success) {
            displayResults(response.data);
        }
    } catch (error) {
        alert('Failed to load results: ' + error.message);
    }
}

// Display results
function displayResults(attempt) {
    const gradeClass = `grade-${attempt.grade}`;
    const percentage = attempt.percentage.toFixed(1);
    
    const html = `
        <div class="score-circle">
            <div>${percentage}%</div>
        </div>
        
        <div class="grade-badge ${gradeClass}">
            Grade: ${attempt.grade}
        </div>
        
        <div style="margin: 20px 0; font-size: 18px;">
            <strong>Score:</strong> ${attempt.score} / ${attempt.totalPoints} points
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3>Question Details</h3>
        </div>
        
        <div class="answers-list">
            ${attempt.quiz.questions.map((q, index) => {
                const answer = attempt.answers[index];
                const isCorrect = answer.isCorrect;
                
                return `
                    <div class="answer-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <strong>Question ${index + 1}:</strong> ${q.questionText}
                        <div style="margin-top: 10px;">
                            <strong>Your Answer:</strong> ${q.options[answer.selectedAnswer]}
                            ${!isCorrect ? `
                                <br><strong>Correct Answer:</strong> ${q.options[q.correctAnswer]}
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    document.getElementById('results-content').innerHTML = html;
    
    // Clear attempt ID from sessionStorage
    sessionStorage.removeItem('attemptId');
}

// Go to dashboard
function goToDashboard() {
    const user = api.getUser();
    if (user.role === 'student') {
        window.location.href = 'student-dashboard.html';
    } else {
        window.location.href = 'instructor-dashboard.html';
    }
}
