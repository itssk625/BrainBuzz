/**
 * API Configuration
 * Base URL for backend API
 */
const API_URL = 'https://brainbuzz-backend.onrender.com/api';


/**
 * API Service - Handles all API calls
 * Uses fetch to communicate with backend
 */
class APIService {
    /**
     * Get authentication token from localStorage
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Get user data from localStorage
     */
    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Save authentication data to localStorage
     */
    saveAuthData(data) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            username: data.username,
            role: data.role
        }));
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    /**
     * Make API request with authentication
     */
    async request(url, options = {}) {
        const token = this.getToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_URL}${url}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Authentication API
     */

    // Register new user
    async register(username, password, role) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
    }

    // Login user
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    // Get current user
    async getCurrentUser() {
        return this.request('/auth/me');
    }

    /**
     * Quiz API
     */

    // Get available quizzes
    async getAvailableQuizzes() {
        return this.request('/quizzes/available');
    }

    // Get single quiz
    async getQuiz(quizId) {
        return this.request(`/quizzes/${quizId}`);
    }

    // Create quiz (Instructor only)
    async createQuiz(quizData) {
        return this.request('/quizzes', {
            method: 'POST',
            body: JSON.stringify(quizData)
        });
    }

    // Delete quiz (Instructor only)
    async deleteQuiz(quizId) {
        return this.request(`/quizzes/${quizId}`, {
            method: 'DELETE'
        });
    }

    // Submit quiz attempt
    async submitQuiz(quizId, answers, timeTaken) {
        return this.request(`/quizzes/${quizId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers, timeTaken })
        });
    }

    // Get my quiz attempts
    async getMyAttempts() {
        return this.request('/quizzes/attempts/my');
    }

    // Get specific attempt
    async getAttempt(attemptId) {
        return this.request(`/quizzes/attempts/${attemptId}`);
    }

    // Get all attempts for a quiz (Instructor only)
    async getQuizAttempts(quizId) {
        return this.request(`/quizzes/${quizId}/attempts`);
    }

    // Get all my quizzes (Instructor only)
    async getMyQuizzes() {
        return this.request('/quizzes/my-quizzes/list');
    }
}

// Create global API service instance
const api = new APIService();
