/**
 * Instructor Dashboard JavaScript
 * Handles quiz creation, deletion, and viewing results
 */

let questionCount = 0;

// Check authentication on page load
window.addEventListener('load', async () => {
    const user = api.getUser();
    if (!user || user.role !== 'instructor') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('username').textContent = user.username;
    
    // Add first question by default
    addQuestion();
});

// Show different sections
function showSection(section) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    
    event.target.classList.add('active');
    
    if (section === 'create') {
        document.getElementById('create-section').style.display = 'block';
    } else if (section === 'my-quizzes') {
        document.getElementById('my-quizzes-section').style.display = 'block';
        loadMyQuizzes();
    } else if (section === 'results') {
        document.getElementById('results-section').style.display = 'block';
        loadQuizzesForResults();
    }
}

// Add question form
function addQuestion() {
    questionCount++;
    const container = document.getElementById('questions-container');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-card';
    questionDiv.id = `question-${questionCount}`;
    questionDiv.innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${questionCount}</span>
            <button type="button" onclick="removeQuestion(${questionCount})" style="background: var(--error-color); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Remove</button>
        </div>
        
        <div class="form-group">
            <label>Question Text</label>
            <textarea class="question-text" placeholder="Enter your question here..." required></textarea>
        </div>
        
        <div class="form-group">
            <label>Option 1</label>
            <input type="text" class="option-input" placeholder="Enter option 1" required>
        </div>
        <div class="form-group">
            <label>Option 2</label>
            <input type="text" class="option-input" placeholder="Enter option 2" required>
        </div>
        <div class="form-group">
            <label>Option 3</label>
            <input type="text" class="option-input" placeholder="Enter option 3">
        </div>
        <div class="form-group">
            <label>Option 4</label>
            <input type="text" class="option-input" placeholder="Enter option 4">
        </div>
        
        <div class="form-group">
            <label>Correct Answer</label>
            <select class="correct-answer-select" required>
                <option value="">Select correct answer</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
            </select>
        </div>
    `;
    
    container.appendChild(questionDiv);
}

// Remove question
function removeQuestion(id) {
    document.getElementById(`question-${id}`).remove();
}

// Create quiz
async function createQuiz(event) {
    event.preventDefault();
    
    const title = document.getElementById('quiz-title').value;
    const timeLimit = parseInt(document.getElementById('time-limit').value);
    
    // Validate time limit
    if (timeLimit <= 0) {
        alert('Time limit must be greater than zero');
        return;
    }
    
    // Collect questions
    const questions = [];
    const questionCards = document.querySelectorAll('.question-card');
    
    if (questionCards.length === 0) {
        alert('No questions have been added');
        return;
    }
    
    for (const card of questionCards) {
        const questionText = card.querySelector('.question-text').value;
        const correctAnswer = parseInt(card.querySelector('.correct-answer-select').value);
        
        if (card.querySelector('.correct-answer-select').value === '') {
            alert('Please select the correct answer for all questions');
            return;
        }
        
        const options = [];
        const optionInputs = card.querySelectorAll('.option-input');
        
        for (const input of optionInputs) {
            if (input.value.trim()) {
                options.push(input.value.trim());
            }
        }
        
        if (options.length < 2) {
            alert('Each question must have at least 2 options');
            return;
        }
        
        questions.push({
            questionText,
            options,
            correctAnswer
        });
    }
    
    try {
        const response = await api.createQuiz({ title, timeLimit, questions });
        
        if (response.success) {
            alert('Quiz created successfully!');
            document.getElementById('create-quiz-form').reset();
            questionCount = 0;
            document.getElementById('questions-container').innerHTML = '';
            addQuestion();
        }
    } catch (error) {
        alert('Failed to create quiz: ' + error.message);
    }
}

// Load my quizzes
async function loadMyQuizzes() {
    try {
        const response = await api.getMyQuizzes();
        
        if (response.success && response.data && response.data.length > 0) {
            displayMyQuizzes(response.data);
            document.getElementById('no-quizzes').style.display = 'none';
        } else {
            document.getElementById('quizzes-list').innerHTML = '';
            document.getElementById('no-quizzes').style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load quizzes:', error);
    }
}

// Display my quizzes
function displayMyQuizzes(quizzes) {
    const container = document.getElementById('quizzes-list');
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card">
            <h3>${quiz.title}</h3>
            <div class="quiz-meta">
                <span>⏱️ ${quiz.timeLimit} mins</span>
                <span>📝 ${quiz.questions.length} questions</span>
                <span>🎯 ${quiz.totalPoints} points</span>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="viewQuizDetails('${quiz._id}')" style="flex: 1;">View Details</button>
                <button class="btn btn-danger" onclick="deleteQuiz('${quiz._id}', event)" style="flex: 1;">Delete</button>
            </div>
        </div>
    `).join('');
}

// View quiz details
async function viewQuizDetails(quizId) {
    try {
        const response = await api.getQuiz(quizId);
        
        if (response.success && response.data) {
            const quiz = response.data;
            
            // Hide quiz list and show details
            document.getElementById('quizzes-list').style.display = 'none';
            document.getElementById('no-quizzes').style.display = 'none';
            document.getElementById('quiz-details-view').style.display = 'block';
            
            document.getElementById('quiz-details-title').textContent = quiz.title;
            
            // Display quiz details
            const detailsHtml = `
                <div class="quiz-details-card">
                    ${!quiz.isActive ? '<div style="background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #fca5a5;"><strong>⚠️ This quiz has been deleted</strong> and is no longer visible to students.</div>' : ''}
                    <div class="quiz-details-header">
                        <div class="detail-item">
                            <span class="detail-label">Time Limit:</span>
                            <span class="detail-value">${quiz.timeLimit} minutes</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Questions:</span>
                            <span class="detail-value">${quiz.questions.length}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Points:</span>
                            <span class="detail-value">${quiz.totalPoints}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${quiz.isActive ? '<span style="color: #166534;">✓ Active</span>' : '<span style="color: #991b1b;">✗ Deleted</span>'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Created:</span>
                            <span class="detail-value">${new Date(quiz.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="questions-details-list">
                        ${quiz.questions.map((question, index) => `
                            <div class="question-detail-card">
                                <div class="question-detail-header">
                                    <span class="question-detail-number">Question ${index + 1}</span>
                                    <span class="question-detail-points">${question.points || 1} point${(question.points || 1) !== 1 ? 's' : ''}</span>
                                </div>
                                <div class="question-detail-text">${question.questionText}</div>
                                <div class="question-detail-options">
                                    ${question.options.map((option, optIndex) => `
                                        <div class="option-detail-item ${optIndex === question.correctAnswer ? 'correct-answer' : ''}">
                                            <span class="option-detail-label">${String.fromCharCode(65 + optIndex)}.</span>
                                            <span class="option-detail-text">${option}</span>
                                            ${optIndex === question.correctAnswer ? '<span class="correct-badge">✓ Correct Answer</span>' : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('quiz-details-content').innerHTML = detailsHtml;
        }
    } catch (error) {
        alert('Failed to load quiz details: ' + error.message);
    }
}

// Close quiz details view
function closeQuizDetails() {
    document.getElementById('quizzes-list').style.display = 'grid';
    document.getElementById('quiz-details-view').style.display = 'none';
    document.getElementById('quiz-details-content').innerHTML = '';
}

// Delete quiz
async function deleteQuiz(quizId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (confirm('Are you sure you want to delete this quiz?')) {
        try {
            const response = await api.deleteQuiz(quizId);
            
            if (response.success) {
                alert('Quiz deleted successfully');
                loadMyQuizzes();
            }
        } catch (error) {
            alert('Failed to delete quiz: ' + error.message);
        }
    }
}

// Load quizzes for results
async function loadQuizzesForResults() {
    try {
        const response = await api.getMyQuizzes();
        
        if (response.success && response.data && response.data.length > 0) {
            displayQuizzesForResults(response.data);
            document.getElementById('no-quizzes').style.display = 'none';
        } else {
            document.getElementById('results-quizzes-list').innerHTML = '';
            document.getElementById('no-quizzes').style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load quizzes:', error);
    }
}

// Display quizzes for results
function displayQuizzesForResults(quizzes) {
    const container = document.getElementById('results-quizzes-list');
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card" onclick="loadQuizResults('${quiz._id}', '${quiz.title}')">
            <h3>${quiz.title}</h3>
            <div class="quiz-meta">
                <span>📝 ${quiz.questions.length} questions</span>
                <span>🎯 ${quiz.totalPoints} points</span>
            </div>
        </div>
    `).join('');
}

// Load quiz results
async function loadQuizResults(quizId, title) {
    try {
        const response = await api.getQuizAttempts(quizId);
        
        document.getElementById('selected-quiz-title').textContent = `Results for: ${title}`;
        document.getElementById('results-table').style.display = 'block';
        
        if (response.success && response.data && response.data.length > 0) {
            displayResults(response.data, response.statistics);
        } else {
            document.getElementById('results-content').innerHTML = '<p>No results available for this quiz yet.</p>';
        }
    } catch (error) {
        alert('Failed to load results: ' + error.message);
    }
}

// Display results
function displayResults(attempts, statistics) {
    const stats = statistics || {
        submittedCount: attempts.length,
        averageScore: 0,
        scoreBuckets: {}
    };

    // Get max count for scaling the chart
    const maxCount = Math.max(...Object.values(stats.scoreBuckets || {}), 1);
    
    // Order score buckets for display (0-9, 10-19, ..., 90-100)
    const orderedBuckets = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'];

    const html = `
        <!-- Results Table -->
        <div>
            <h3 style="margin-bottom: 20px; font-size: 18px; font-weight: 600; color: var(--text-dark);">Student Results</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-secondary);">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Student</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Score</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Percentage</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Grade</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Time Taken</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${attempts.map(attempt => `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border-light);">${attempt.student.username}</td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border-light);">${attempt.score} / ${attempt.totalPoints}</td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border-light);">${attempt.percentage.toFixed(1)}%</td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border-light);">
                                <span class="grade-badge grade-${attempt.grade}">${attempt.grade}</span>
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border-light);">${attempt.timeTaken ? attempt.timeTaken.toFixed(1) + ' mins' : 'N/A'}</td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border-light);">${new Date(attempt.submittedAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Subtle Statistics Panel (below table) -->
        <div class="subtle-statistics-panel">
            <div class="stats-summary-text">
                <span>Submitted: ${stats.submittedCount || 0}</span>
                <span>•</span>
                <span>Average: ${(stats.averageScore || 0).toFixed(2)}%</span>
            </div>
            
            <div class="score-chart-container">
                <div class="score-chart-title">Score Distribution</div>
                <div class="score-chart">
                    ${orderedBuckets.map(bucket => {
                        const count = stats.scoreBuckets[bucket] || 0;
                        const heightPercent = maxCount > 0 ? (count / maxCount * 100) : 0;
                        return `
                            <div class="chart-bar-wrapper">
                                ${count > 0 ? `<span class="chart-bar-value">${count}</span>` : ''}
                                <div class="chart-bar" style="height: ${Math.max(heightPercent, count > 0 ? 4 : 0)}%;"></div>
                                <div class="chart-bar-label">${bucket}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('results-content').innerHTML = html;
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        api.clearAuthData();
        window.location.href = 'index.html';
    }
}
