# RAG Assignment IS219

## Overview

In this assignment, I implemented a real-time streaming chat application using **Node.js** and **Express**. The AI character responds based on a predefined persona, which is loaded from a **JSON** file. The application utilizes **Server-Sent Events (SSE)** to stream data efficiently from the backend to the frontend. The AI's behavior is influenced by a **LangChain**-integrated **OpenAI** model.

The application demonstrates key concepts in **Node.js**, **SSE**, **LangChain**, and **OpenAI API** integration, as well as character persona management and real-time streaming.

## Key Concepts Demonstrated

- **Node.js & Express**: Built a basic server to handle API requests and stream data to the frontend.
- **Server-Sent Events (SSE)**: Implemented SSE for efficient, real-time data streaming from server to client.
- **LangChain & OpenAI Integration**: Integrated LangChain with OpenAI's GPT model to handle character-based conversations.
- **Streaming Responses**: The server streams chat responses from the AI model to the client in real-time, allowing the UI to update dynamically.
- **System Prompts**: Used system messages to define the AI's persona and response patterns.
- **Environment Variables**: Managed API keys securely through a `.env` file.
- **Basic Frontend Development**: Developed a simple HTML/CSS/JavaScript-based chat interface for user interaction.
- **Asynchronous JavaScript**: Leveraged `async/await` for handling asynchronous API calls and stream processing.
- **JSON Handling**: Loaded and parsed character data from a **JSON** file to dynamically update the AI's persona.

## Files

- **`server.js`**: Node.js backend using Express to manage SSE connections, interact with OpenAI via LangChain, load the character persona, and stream responses.
- **`character.json`**: Contains the AI character's profile including demographics, personality traits, background, and situational responses.
- **`public/`**: Contains the frontend files:
  - **`index.html`**: The main HTML structure for the chat interface.
  - **`style.css`**: CSS styling rules for the chat interface.
  - **`client.js`**: JavaScript to handle form submissions, send messages to the server, receive SSE messages, and update the chat interface.

- **`.env`**: File for securely storing your OpenAI API key (ensure this file is in the parent directory).
  
  Example `.env`:
  ```bash
  OPENAI_API_KEY=your_actual_openai_api_key_here
