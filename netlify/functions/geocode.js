const fetch = require('node-fetch');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY; // Bring in OpenWeatherMap API key from Netlify environment variables

// Call OpenWeatherMap API to get city coordinates
const owDirectGeocode = async (city) => {
  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${OPENWEATHER_API_KEY}`
  );
  if (!response.ok) throw new Error('Location lookup failed');
  const data = await response.json();
  if (!data.length) throw new Error('City not found');
  return data;
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Allow': 'GET',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const city = event.queryStringParameters && event.queryStringParameters.city;
  if (!city) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing city parameter' }),
    };
  }

  try {
    const data = await owDirectGeocode(city);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  };
};