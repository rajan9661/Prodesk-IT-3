const API_KEY = '04609c6dc66042349b391336262706';
const BASE_URL = 'https://api.weatherapi.com/v1/current.json';
const CACHE_DURATION = 10 * 60 * 1000;

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const weatherIcon = document.getElementById('weatherIcon');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const humidity = document.getElementById('humidity');
const errorMessage = document.getElementById('errorMessage');
const container = document.querySelector('.container');

function setLoading(isLoading) {
    loading.textContent = isLoading ? 'Fetching weather...' : '';
}

function setError(message) {
    errorMessage.textContent = message;
}

function getCacheKey(query) {
    return `weather-${query.toLowerCase()}`;
}

function readCache(query) {
    const raw = localStorage.getItem(getCacheKey(query));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) return null;

    return parsed.data;
}

function writeCache(query, data) {
    localStorage.setItem(getCacheKey(query), JSON.stringify({
        timestamp: Date.now(),
        data
    }));
}

function applyTheme(conditionText) {
    container.classList.remove('sunny', 'rainy', 'cloudy');

    const text = conditionText.toLowerCase();

    if (text.includes('rain') || text.includes('drizzle') || text.includes('thunder')) {
        container.classList.add('rainy');
    } else if (text.includes('cloud') || text.includes('overcast') || text.includes('mist') || text.includes('fog')) {
        container.classList.add('cloudy');
    } else if (text.includes('clear') || text.includes('sun')) {
        container.classList.add('sunny');
    }
}

function renderWeather(data) {
    cityName.textContent = `${data.location.name}, ${data.location.country}`;
    temperature.textContent = `${Math.round(data.current.temp_c)} °C`;
    condition.textContent = `Condition: ${data.current.condition.text}`;
    humidity.textContent = `Humidity: ${data.current.humidity}%`;
    weatherIcon.src = `https:${data.current.condition.icon}`;
    weatherIcon.alt = data.current.condition.text;
    applyTheme(data.current.condition.text);
}

async function fetchWeather(query) {
    setError('');
    setLoading(true);

    const cached = readCache(query);
    if (cached) {
        renderWeather(cached);
        setLoading(false);
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(query)}&aqi=no`);

        if (!response.ok) {
            throw new Error('not found');
        }

        const data = await response.json();
        renderWeather(data);
        writeCache(query, data);
    } catch (err) {
        setError('City not found. Please try again.');
    } finally {
        setLoading(false);
    }
}

function loadInitialWeather() {
    if (!navigator.geolocation) {
        fetchWeather('London');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            fetchWeather(`${latitude},${longitude}`);
        },
        () => fetchWeather('London')
    );
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) {
        setError('Please enter a city name.');
        return;
    }
    fetchWeather(city);
});

cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            fetchWeather(`${latitude},${longitude}`);
        },
        () => {
            setLoading(false);
            setError('Location access denied.');
        }
    );
});

loadInitialWeather();