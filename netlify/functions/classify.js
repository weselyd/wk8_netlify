const { OpenAI } = require('openai');

const OPENAIKEY = process.env.OPENAI_KEY; // Ensure this is set in Netlify env vars
const openai = new OpenAI({ apiKey: OPENAIKEY });

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Allow only POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Allow': 'POST',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { image, labels } = JSON.parse(event.body);

    if (!image || !labels) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Image and labels are required' }),
      };
    }

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

    const resultText = response.choices[0].message.content.trim();
    const cleanedText = resultText.replace(/```json\n|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Invalid image: ${cleanedText}` }),
      };
    }

    if (!result.labels || !Array.isArray(result.labels)) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid response format: Expected "labels" array' }),
      };
    }

    const totalScore = result.labels.reduce((sum, label) => sum + (label.score || 0), 0);
    if (Math.abs(totalScore - 1) > 0.01) {
      // Optionally log or handle this warning
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};