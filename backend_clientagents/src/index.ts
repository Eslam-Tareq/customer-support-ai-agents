import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { run } from '@openai/agents';
import { triageAgent } from './agents';
import { getProducts, orders } from './data';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// Track history by sessionId
const sessionHistories = new Map<string, any[]>();
const sessionActiveAgents = new Map<string, string>();

// Main Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const history = sessionHistories.get(sessionId) || [];
    
    // Append user input
    const inputHistory = [
      ...history,
      { role: 'user' as const, content: message }
    ];

    console.log(`\n--- Chat Turn [Session: ${sessionId}] ---`);
    console.log(`User: "${message}"`);
    
    // Run triage agent loop
    const result = await run(triageAgent, inputHistory);
    
    // Determine which agent ended the response
    let activeAgentName = 'TriageAgent';
    if (result.lastAgent) {
      activeAgentName = result.lastAgent.name;
    } else if ((result.state as any)?.currentAgent) {
      activeAgentName = (result.state as any).currentAgent.name;
    }

    console.log(`Response: "${result.finalOutput}"`);
    console.log(`Active Agent: ${activeAgentName}`);

    // Update session storage
    sessionHistories.set(sessionId, result.history);
    sessionActiveAgents.set(sessionId, activeAgentName);

    res.json({
      message: result.finalOutput || '',
      activeAgent: activeAgentName,
      history: result.history
    });

  } catch (error: any) {
    console.error(`Error processing chat for session ${sessionId}:`, error);
    res.status(500).json({ 
      error: error.message || 'An error occurred during agent processing.' 
    });
  }
});

// Clear/Reset Endpoint
app.post('/api/chat/reset', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    sessionHistories.delete(sessionId);
    sessionActiveAgents.delete(sessionId);
    console.log(`Reset session: ${sessionId}`);
  }
  res.json({ success: true, message: 'Session reset successfully.' });
});

// Catalog Retrieval Endpoint
app.get('/api/products', (req, res) => {
  res.json(getProducts());
});

// Orders List Endpoint
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
