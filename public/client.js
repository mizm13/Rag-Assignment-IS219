document.addEventListener('DOMContentLoaded', () => {
    const chatbox = document.getElementById('chatbox');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const characterNameDisplay = document.getElementById('character-name');
    
    let eventSource = null;
    
    // Function to add a message to the chatbox
    function addMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.textContent = message;
        chatbox.appendChild(messageElement);
        chatbox.scrollTop = chatbox.scrollHeight;
    }
    
    // Function to establish SSE connection for a specific message
    function startEventSource(message) {
        // Close any existing connection
        if (eventSource) {
            eventSource.close();
        }
        
        // Add user message to chat
        addMessage('user', message);
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.textContent = '...';
        chatbox.appendChild(typingIndicator);
        chatbox.scrollTop = chatbox.scrollHeight;
        
        // Create a new SSE connection
        eventSource = new EventSource(`/chat?message=${encodeURIComponent(message)}`);
        
        let aiResponse = '';
        
        // Listen for messages from the server
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'character-info') {
                // Update character name in the UI
                if (characterNameDisplay) {
                    characterNameDisplay.textContent = data.name;
                }
            } else if (data.type === 'chunk') {
                // Append content chunk to the AI response
                aiResponse += data.content;
                
                // Update the typing indicator with current response
                typingIndicator.textContent = aiResponse;
                chatbox.scrollTop = chatbox.scrollHeight;
            } else if (data.type === 'done') {
                // Remove typing indicator
                typingIndicator.remove();
                
                // Add complete AI response to chat
                addMessage('ai', aiResponse);
                
                // Close the connection
                eventSource.close();
                eventSource = null;
            } else if (data.type === 'error') {
                // Remove typing indicator
                typingIndicator.remove();
                
                // Show error message
                addMessage('system', `Error: ${data.message}`);
                
                // Close the connection
                eventSource.close();
                eventSource = null;
            }
        };
        
        // Handle errors
        eventSource.onerror = () => {
            typingIndicator.remove();
            addMessage('system', 'Connection error. Please try again.');
            eventSource.close();
            eventSource = null;
        };
    }
    
    // Handle form submission
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            startEventSource(message);
            messageInput.value = '';
        }
    });
    
    // Fetch character info on page load (for bonus challenge)
    fetch('/character-info')
        .then(response => response.json())
        .then(data => {
            if (characterNameDisplay) {
                characterNameDisplay.textContent = data.name;
            }
        })
        .catch(error => {
            console.error('Error fetching character info:', error);
        });
});