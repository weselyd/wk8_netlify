const fetch = require('node-fetch');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY; // Bring in OpenWeatherMap API key from Netlify environment variables

const owGetCurrentWeather = async (lat, lon) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
  );
  if (!response.ok) throw new Error('Weather data not found');
  return response.json();
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

  const lat = event.queryStringParameters && event.queryStringParameters.lat;  // Extract lat parameter from query string
  const lon = event.queryStringParameters && event.queryStringParameters.lon;  // Extract lon parameter from query string
  if (!lat) {  // Check if lat parameter is provided
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing lat parameter' }),
    };
  }
  if (!lon) {  // Check if lon parameter is provided
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing lon parameter' }),
    };
  }

  try {  // Try to fetch the weather for the provided city
    const data = await owGetCurrentWeather(lat, lon);
        // Check for {"error":"City not found"}
        if (data && data.error === "City not found") {
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


    try {  // Try to fetch the weather for the provided city
        const data = await owGetCurrentWeather(lat, lon);

        // Check for {"error":"City not found"}
        if (data && data.error === "City not found") {
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