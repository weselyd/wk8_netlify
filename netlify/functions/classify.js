const { OpenAI } = require('openai');

const OPENAIKEY = process.env.OPENAI_KEY; // Ensure this is set in Netlify env vars
const openai = new OpenAI({ apiKey: OPENAIKEY });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') { // Handles CORS preflight requests
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

  if (event.httpMethod !== 'POST') { // Blocks anything that is not a POST request
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

  try { // Now that we have filtered out invalid request types, try to parse the request body and handle the classification
    const { image, labels } = JSON.parse(event.body);  // Creates a JSON object from the request body

    if (!image || !labels) { // Inspects image and labels to ensure they are present
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Image and labels are required' }),
      };
    }

    const response = await openai.chat.completions.create({ // Creates a chat completion using OpenAI's API and saves as response variable
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Classify the cloud in the image as one of the following types: ${labels.join(', ')}. Return a JSON object with a "labels" array, each item having "name" and "score" properties (scores as decimals summing to 1). Example: {"labels": [{"name": "cumulus", "score": 0.85}, {"name": "stratus", "score": 0.10}, {"name": "cirrus", "score": 0.05}]}`
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

    const resultText = response.choices[0].message.content.trim();  // Extracts the text content from the response
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Invalid image: ${resultText}` }),
      };
    }

    if (!result.labels || !Array.isArray(result.labels)) { // Validates that the result contains a "labels" array
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid response format: Expected "labels" array' }),
      };
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