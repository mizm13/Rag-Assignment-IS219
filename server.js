const express = require('express');
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanMessage, SystemMessage } = require("langchain/schema");
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

// Initialize OpenAI chat model
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  streaming: true,
  openAIApiKey: process.env.OPENAI_API_KEY
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get character name (for bonus challenge)
app.get('/character-info', (req, res) => {
  res.json({ name: characterData.name });
});

// Endpoint to handle SSE chat
app.get('/chat', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send character name as initial SSE message for bonus challenge
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

Always stay in character and respond as Captain Nova Starlight would. Draw from your background, experiences, and knowledge areas when answering questions. Use your specific communication style in all responses.`;

    // Create message objects
    const messages = [
      new SystemMessage(characterSystemPrompt),
      new HumanMessage(userMessage)
    ];

    // Use streaming for the response
    const stream = await model.stream(messages);

    // Process and send each chunk as it arrives
    for await (const chunk of stream) {
      if (chunk.content) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
      }
    }

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