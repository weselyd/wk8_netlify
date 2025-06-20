const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const OPENAIKEY = process.env.OPENAI_API_KEY;  // Ensure you set this environment variable with your OpenAI key

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for base64 images

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAIKEY // Replace with your OpenAI API key
});

app.post('/classify', async (req, res) => { // Handle user's POST request - image and labels
    const { image, labels } = req.body;
    if (!image || !labels) {
        return res.status(400).json({ error: 'Image and labels are required' });
    }

    try {  // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Classify the cloud in the image as one of the following types: ${labels.join(', ')}. Return a JSON object with a "labels" array, each item having "name" and "score" properties (scores as decimals summing to 1). Do not wrap the JSON in Markdown or code blocks. Example: {"labels": [{"name": "cumulus", "score": 0.85}, {"name": "stratus", "score": 0.10}, {"name": "cirrus", "score": 0.05}]}`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 100
        });

        // Extract the response content
        const resultText = response.choices[0].message.content.trim();
        console.log('Raw OpenAI response:', resultText);

        // Remove Markdown code blocks if present
        const cleanedText = resultText.replace(/```json\n|```/g, '').trim();

        // Parse the cleaned response
        let result;
        try {
            result = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error(`Invalid image: ${cleanedText}`);
        }

        // Validate response structure
        if (!result.labels || !Array.isArray(result.labels)) {
            throw new Error('Invalid response format: Expected "labels" array');
        }

        // Verify scores sum to approximately 1
        const totalScore = result.labels.reduce((sum, label) => sum + (label.score || 0), 0);
        if (Math.abs(totalScore - 1) > 0.01) {
            console.warn('Scores do not sum to 1:', totalScore);
        }

        res.json(result);
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: error.message });
    }
});