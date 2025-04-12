const express = require('express');
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanMessage, SystemMessage } = require("langchain/schema");

require('dotenv').config(); // loads from .env

const app = express();
app.use(express.static('public'));
app.use(express.json());

const port = process.env.PORT || 3000;

// Load character data
let characterData;
try {
  const characterFile = fs.readFileSync('character.json', 'utf8');
  characterData = JSON.parse(characterFile);
  console.log('Character loaded:', characterData.name);
} catch (error) {
  console.error('Error loading character data:', error);
  process.exit(1);
}
console.log("Loaded API Key:", process.env.OPENAI_API_KEY);

// Initialize OpenAI chat model with streaming capability
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token) {
        console.log({ token });
      },
    },
  ],
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get character name
app.get('/character-info', (req, res) => {
  res.json({ name: characterData.name });
});

// Endpoint to handle SSE chat
app.get('/chat', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send character name as initial SSE message
  res.write(`data: ${JSON.stringify({ type: 'character-info', name: characterData.name })}\n\n`);

  // Get user message from query params
  const userMessage = req.query.message;
  if (!userMessage) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'No message provided' })}\n\n`);
    res.end();
    return;
  }

  try {
    // Construct system prompt from character data
    const characterSystemPrompt = `You are ${characterData.name}, a ${characterData.demographics.age}-year-old ${characterData.demographics.occupation} currently located ${characterData.demographics.location}. 

Your personality traits include being:
${characterData.personality.traits.map(trait => `- ${trait}`).join('\n')}

Your communication style: ${characterData.personality.communication_style}

Background summary: ${characterData.background.summary}

Key experiences in your life:
${characterData.background.key_experiences.map(exp => `- ${exp}`).join('\n')}

You have extensive knowledge in these areas:
${characterData.knowledge_areas.map(area => `- ${area}`).join('\n')}

In specific situations, respond like this:
- When greeting someone: "${characterData.situational_responses.greeting}"
- When asked about space travel: "${characterData.situational_responses.asked_about_space_travel}"
- When discussing alien life: "${characterData.situational_responses.discussing_alien_life}"
- When explaining your research methods: "${characterData.situational_responses.explaining_research_methods}"
- When discussing cosmic phenomena: "${characterData.situational_responses.discussing_cosmic_phenomena}"

Always stay in character and respond as ${characterData.name} would. Draw from your background, experiences, and knowledge areas when answering questions. Use your specific communication style in all responses.`;

    // Create LangChain message objects
    const messages = [
      new SystemMessage(characterSystemPrompt),
      new HumanMessage(userMessage)
    ];

    // Set up custom callback handler for streaming
    let responseText = '';
    
    const chat = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token) {
            responseText += token;
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: token })}\n\n`);
          },
        },
      ],
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7
    });

    // Call the model with streaming
    await chat.call(messages);

    // Signal the end of the stream
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error processing chat:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Error processing chat' })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});