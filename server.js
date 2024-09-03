const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');

// Replace with your actual API key
const API_KEY = '396ae7f13084d1fcfb8261110a9868c7';
const BASE_URL = 'http://api.openweathermap.org/data/2.5/weather';
const JSON_FILENAME = 'weather_data.json';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Function to fetch weather data from OpenWeatherMap API
async function fetchWeather(city) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return null;
  }
}

// Function to save weather data to a JSON file
function saveWeatherToJson(data) {
  fs.writeFileSync(JSON_FILENAME, JSON.stringify(data, null, 4), 'utf8');
}

// Function to load weather data from a JSON file if it exists
function loadJson(filename) {
  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

// Function to get weather data either from the file or API
async function getWeather(city) {
  let weatherData = loadJson(JSON_FILENAME);

  // Check if weather data exists and matches the city
  if (weatherData && weatherData.name.toLowerCase() === city.toLowerCase()) {
    return weatherData;
  } else {
    // Fetch new data if no match or file does not exist
    weatherData = await fetchWeather(city);
    if (weatherData) {
      saveWeatherToJson(weatherData);
    }
    return weatherData;
  }
}

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('getWeather', async (city, type) => {
    const weatherData = await getWeather(city);

    if (weatherData && weatherData.weather) {
      let responseMessage;
      const temperature = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const windSpeed = weatherData.wind.speed;
      const description = weatherData.weather[0].description;

      if (type === 'wind') {
        responseMessage = `The current wind speed in ${city} is ${windSpeed} m/s.`;
      } else {
        responseMessage = `The current temperature in ${city} is ${temperature}°C with ${description}. The humidity is ${humidity}% and the wind speed is ${windSpeed} m/s.`;
      }
      socket.emit('botMessage', responseMessage);
    } else {
      socket.emit(
        'botMessage',
        "Sorry, I couldn't get the weather information. Please check the city name and try again."
      );
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server on port 4000
server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
