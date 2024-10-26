// API Key for OpenWeatherMap (replace 'YOUR_API_KEY_HERE' with your actual API key)
const API_KEY = 'YOUR_API_KEY_HERE';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast');
const currentLocationBtn = document.getElementById('current-location-btn');

// Initialize recently searched cities from local storage
let recentlySearchedCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Event listeners
searchBtn.addEventListener('click', () => {
    const cityName = cityInput.value.trim();
    if (cityName) {
        fetchWeatherData(cityName);
        updateRecentlySearchedCities(cityName);
    } else {
        alert('Please enter a city name.');
    }
});

// Fetch weather data for the current location
currentLocationBtn.addEventListener('click', fetchCurrentLocationWeather);

// Fetch weather data by city name
async function fetchWeatherData(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        displayWeatherData(data);
        fetchExtendedForecast(data.coord.lat, data.coord.lon);
    } catch (error) {
        weatherInfo.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

// Fetch weather data by geographic coordinates
async function fetchWeatherDataByCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        displayWeatherData(data);
        fetchExtendedForecast(lat, lon);
    } catch (error) {
        console.error(error);
        weatherInfo.innerHTML = `<p class="error-message">Unable to fetch weather data for your location.</p>`;
    }
}

// Fetch the current location and retrieve weather data
async function fetchCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherDataByCoords(latitude, longitude);
        }, (error) => {
            console.error("Geolocation error:", error);
            alert("Unable to retrieve your location.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Display current weather data in the UI
function displayWeatherData(data) {
    const { name, main, weather, wind } = data;
    const weatherIcon = `http://openweathermap.org/img/wn/${weather[0].icon}.png`;

    weatherInfo.innerHTML = `
        <h2 class="text-2xl font-bold">${name}</h2>
        <img src="${weatherIcon}" alt="${weather[0].description}" class="forecast-icon">
        <p class="forecast-details">Temperature: ${main.temp}°C</p>
        <p class="forecast-details">Humidity: ${main.humidity}%</p>
        <p class="forecast-details">Wind Speed: ${wind.speed} m/s</p>
    `;
}

// Fetch and display a 5-day extended forecast
async function fetchExtendedForecast(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

        if (!response.ok) {
            throw new Error('Unable to fetch extended forecast');
        }

        const data = await response.json();
        displayExtendedForecast(data);
    } catch (error) {
        console.error(error);
    }
}

// Display extended forecast in a user-friendly format
function displayExtendedForecast(data) {
    forecastContainer.innerHTML = '';
    data.list.forEach((item, index) => {
        if (index % 8 === 0) { // Get data for every 8 hours (1-day intervals)
            const { dt, main, weather, wind } = item;
            const date = new Date(dt * 1000).toLocaleDateString();
            const weatherIcon = `http://openweathermap.org/img/wn/${weather[0].icon}.png`;

            const forecastCard = document.createElement('div');
            forecastCard.classList.add('forecast-card', 'p-4');
            forecastCard.innerHTML = `
                <h3>${date}</h3>
                <img src="${weatherIcon}" alt="${weather[0].description}" class="forecast-icon">
                <p class="forecast-details">Temp: ${main.temp}°C</p>
                <p class="forecast-details">Humidity: ${main.humidity}%</p>
                <p class="forecast-details">Wind: ${wind.speed} m/s</p>
            `;
            forecastContainer.appendChild(forecastCard);
        }
    });
}

// Update the list of recently searched cities
function updateRecentlySearchedCities(city) {
    if (!recentlySearchedCities.includes(city)) {
        recentlySearchedCities.push(city);
        if (recentlySearchedCities.length > 5) { // Keep only the last 5 searches
            recentlySearchedCities.shift();
        }
        localStorage.setItem('recentCities', JSON.stringify(recentlySearchedCities));
        displayRecentlySearchedCities();
    }
}

// Display recently searched cities in a dropdown menu
function displayRecentlySearchedCities() {
    // Create a dropdown for recently searched cities
    const dropdown = document.createElement('select');
    dropdown.id = 'recent-cities-dropdown';
    dropdown.classList.add('border', 'rounded', 'mt-4');
    
    // Add each recently searched city as an option
    recentlySearchedCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        dropdown.appendChild(option);
    });

    // Remove existing dropdown if it exists and add new one
    const existingDropdown = document.getElementById('recent-cities-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    weatherInfo.appendChild(dropdown);

    // Event listener for selecting a city from the dropdown
    dropdown.addEventListener('change', (e) => {
        const selectedCity = e.target.value;
        if (selectedCity) {
            fetchWeatherData(selectedCity);
        }
    });
}

// Initialize the app and display the recent cities on page load
document.addEventListener('DOMContentLoaded', displayRecentlySearchedCities);
