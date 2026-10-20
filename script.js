const API_KEY = "8d998c06cedc166584152b3fb932f215"; 

window.addEventListener('load', () => {
    fetchUserLocation();
});

function fetchUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherDataByCoords(lat, lon);
            },
            (error) => {
                console.warn("Location access denied or error:", error.message);
                document.getElementById('cityName').innerText = "Location permission denied";
                getWeatherDataByCity("Raebareli");
            },
            {
                enableHighAccuracy: true, 
                timeout: 15000,
                maximumAge: 0             
            }
        );
    } else {
        alert("Geolocation is not supported by your browser");
        getWeatherDataByCity("Raebareli");
    }
}

async function getWeatherDataByCoords(lat, lon) {
    try {
        // Current Weather API
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const currentRes = await fetch(currentWeatherUrl);
        const currentData = await currentRes.json();

        if (currentData.cod === 200) {
            updateMainWeatherUI(currentData.name, currentData.sys.country, Math.round(currentData.main.temp), currentData.weather[0].description);
        }

        // 5-Day / 3-Hourly Forecast API (OpenWeatherMap free tier forecast endpoint)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        if (forecastData.cod === "200") {
            processAndRenderForecast(forecastData.list);
        }

    } catch (err) {
        console.error("API Fetch Error:", err);
        document.getElementById('cityName').innerText = "Error loading weather data";
    }
}

// Fallback: Agar user location block karde toh city name se fetch karega
async function getWeatherDataByCity(cityName) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        
        if (data.cod === 200) {
            updateMainWeatherUI(data.name, data.sys.country, Math.round(data.main.temp), data.weather[0].description);
            
            getWeatherDataByCoords(data.coord.lat, data.coord.lon);
        }
    } catch (e) {
        console.error("City fetch error:", e);
    }
}

function updateMainWeatherUI(city, country, temp, condition) {
    document.getElementById('cityName').innerText = `${city}, ${country}`;
    document.getElementById('tempDisplay').innerText = `${temp}°C`;
    document.getElementById('weatherCondition').innerText = condition;
}

function processAndRandorForecast(list) {
    const dailyForecasts = [];
    const seenDays = new Set();

    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!seenDays.has(dayName) && dailyForecasts.length < 5) {
            seenDays.add(dayName);
            dailyForecasts.push({
                day: dayName,
                temp: Math.round(item.main.temp) + "°C",
                condition: item.weather[0].description
            });
        }
    });

    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = dailyForecasts.map((d, index) => `
        <div class="forecast-card ${index === 0 ? 'active' : ''}" 
             onclick="updateMainDisplay('${d.day}', '${d.temp}', '${d.condition}', this)">
            <small>${d.day}</small>
            <p><b>${d.temp}</b></p>
        </div>
    `).join('');
}

// ⚠️ Helper function name fix
function processAndRenderForecast(list) {
    processAndRandorForecast(list);
}

function updateMainDisplay(day, temp, condition, element) {
    document.getElementById('tempDisplay').innerText = temp;
    document.getElementById('weatherCondition').innerText = `${condition} (${day})`;
    document.querySelectorAll('.forecast-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

// Manual Search Support
document.getElementById('searchBtn').addEventListener('click', () => {
    const cityName = document.getElementById('cityInput').value.trim();
    if (cityName) {
        getWeatherDataByCity(cityName);
    }
});