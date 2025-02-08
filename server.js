// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
dotenv.config();

// Set up Express
const app = express();
const port = process.env.PORT || 3000;

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.post('/api/analyze', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article) {
      return res.status(400).json({ error: 'No article text provided' });
    }

    console.log('Attempting to analyze article...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0,
        messages: [{
          role: "user",
          content: [{
            type: "text",
            text: `Analyze the following article and provide:

1. Perspectives (1-2 paragraphs)
- Groups likely to support these ideas
- Groups likely to oppose them
- Key points of controversy


2. Context & Background (1-2 paragraphs)
- Intellectual/historical context
- Related movements or schools of thought

3. Key Ideas & Themes (2-3 paragraphs)
- Main arguments and concepts
- Core assumptions
- Unstated premises andassumptions
- Key conclusions

Here's the article:
${article}

Format your response in clear sections with headers and use emojis. Be sure to ALWAYS the Perspectives section Be objective and analytical in your assessment.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    console.log('Successfully received response from Claude');

    // Send just the analysis in the response
    res.json({
      analysis: data.content[0].text
    });

  } catch (error) {
    console.error('Error analyzing article:', error);
    
    res.status(500).json({
      error: 'Error analyzing article. Please try again.',
      details: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:3000`);
  console.log('Anthropic API Key present:', !!process.env.ANTHROPIC_API_KEY);
});