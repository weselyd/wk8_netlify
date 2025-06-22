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
  if (event.httpMethod === 'OPTIONS') {  // Handle CORS preflight requests
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

  if (event.httpMethod !== 'GET') {  // Block any other type of request that is not a GET
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

  const city = event.queryStringParameters && event.queryStringParameters.city;  // Extract city parameter from query string
  if (!city) {  // Check if city parameter is provided
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing city parameter' }),
    };
  }

  try {  // Try to fetch the geocode data for the provided city
    const data = await owDirectGeocode(city);
    if (Array.isArray(data) && data.length === 0) {  // If city is not found, OpenWeatherMap returns an empty array
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: "City not found" }),
        };
    }
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (error) {  // Catch any errors that occur during the fetch
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  };
};