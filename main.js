// JavaScript Logic
document.addEventListener('DOMContentLoaded', () => {
    const USER_ID_KEY = 'chatApp_userId';
    const USERNAME_KEY = 'chatApp_username';
    const MESSAGES_KEY = 'chatApp_messages';
    const CLEAR_TIMESTAMP_KEY = 'chatApp_clearTimestamp';
    const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const userIdentityDisplay = document.getElementById('user-identity');

    let currentUser = {
        id: null,
        name: null,
    };

    // --- FUNCTIONS ---

    // Function to generate a padded user ID (e.g., 0001)
    function generatePaddedId(num) {
        return num.toString().padStart(4, '0');
    }
    
    // Function to get or create user identity
    function setupUser() {
        let userId = localStorage.getItem(USER_ID_KEY);
        let username = localStorage.getItem(USERNAME_KEY);

        if (!userId || !username) {
            // Generate a new random ID between 1 and 9999
            userId = generatePaddedId(Math.floor(Math.random() * 9999) + 1);
            username = `user#${userId}`;

            localStorage.setItem(USER_ID_KEY, userId);
            localStorage.setItem(USERNAME_KEY, username);
        }

        currentUser.id = userId;
        currentUser.name = username;
        userIdentityDisplay.textContent = `Anda masuk sebagai: ${currentUser.name}`;
    }
    
    // Function to check and clear chat if older than 24 hours
    function checkForClear() {
        const lastClearTimestamp = localStorage.getItem(CLEAR_TIMESTAMP_KEY);
        const now = new Date().getTime();

        if (!lastClearTimestamp) {
            // If it's the first time, set the timestamp
            localStorage.setItem(CLEAR_TIMESTAMP_KEY, now.toString());
            return false;
        }

        if (now - parseInt(lastClearTimestamp) > ONE_DAY_IN_MS) {
            localStorage.removeItem(MESSAGES_KEY);
            localStorage.setItem(CLEAR_TIMESTAMP_KEY, now.toString());
            return true;
        }
        
        return false;
    }

    // Function to render a single message object to the DOM
    function renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        if (message.type === 'system') {
            messageDiv.classList.add('system-message');
            messageDiv.innerHTML = `<div class="bubble">${message.text}</div>`;
        } else {
            const isUserMessage = message.user.id === currentUser.id;
            messageDiv.classList.add(isUserMessage ? 'user-message' : 'other-message');
            
            messageDiv.innerHTML = `
                <div class="username">${message.user.name}</div>
                <div class="bubble">${message.text}</div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
    }
    
    // Function to load all messages from localStorage and display them
    function loadMessages() {
        chatMessages.innerHTML = ''; // Clear existing messages
        const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY)) || [];
        messages.forEach(renderMessage);
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to save a new message to localStorage
    function saveMessage(text, type = 'user') {
        const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY)) || [];
        
        const newMessage = {
            user: currentUser,
            text: text, // Text is pre-sanitized
            timestamp: new Date().getTime(),
            type: type,
        };

        messages.push(newMessage);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        return newMessage;
    }
    
    // Basic sanitizer to prevent HTML injection
    function sanitizeText(text) {
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.innerHTML;
    }


    // --- EVENT LISTENERS ---
    
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawText = messageInput.value.trim();
        
        if (rawText) {
            const sanitizedText = sanitizeText(rawText);
            const newMessage = saveMessage(sanitizedText);
            renderMessage(newMessage);
            messageInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom after sending
        }
    });
    
    // Listen for Enter key to send, Shift+Enter for new line
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Listen for changes in other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === MESSAGES_KEY) {
            loadMessages();
        }
    });


    // --- INITIALIZATION ---
    function init() {
        setupUser();
        if (checkForClear()) {
            const systemMessage = {
                type: 'system',
                text: 'Chat telah dibersihkan secara otomatis (24 jam).'
            };
            renderMessage(systemMessage);
        } else {
            loadMessages();
        }
    }

    init();
});
