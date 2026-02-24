const https = require('https');
const { getDb } = require('../db/database');

const API_KEY = process.env.OPENWEATHER_API_KEY;

function fetchWeatherFromAPI(lat, lon) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      resolve(null);
      return;
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function getMockForecast(lat, lon) {
  const month = new Date().getMonth();
  const baseTemps = [18, 22, 28, 34, 38, 36, 30, 29, 30, 28, 22, 18];
  const baseHumidity = [50, 45, 40, 35, 40, 65, 80, 85, 80, 65, 55, 50];
  const baseRainProb = [0.1, 0.1, 0.05, 0.1, 0.15, 0.5, 0.8, 0.85, 0.7, 0.3, 0.1, 0.05];

  const daily = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const variation = (Math.random() - 0.5) * 6;
    const tempMax = baseTemps[month] + variation + 4;
    const tempMin = baseTemps[month] + variation - 6;

    daily.push({
      dt: Math.floor(date.getTime() / 1000),
      date: date.toISOString().split('T')[0],
      temp: {
        min: Math.round(tempMin * 10) / 10,
        max: Math.round(tempMax * 10) / 10,
        day: Math.round(((tempMax + tempMin) / 2) * 10) / 10,
      },
      humidity: Math.round(baseHumidity[month] + (Math.random() - 0.5) * 20),
      wind_speed: Math.round((5 + Math.random() * 25) * 10) / 10,
      pop: Math.round((baseRainProb[month] + (Math.random() - 0.5) * 0.3) * 100) / 100,
      rain: baseRainProb[month] > 0.4 ? Math.round(Math.random() * 40 * 10) / 10 : 0,
      weather: getWeatherCondition(month, baseRainProb[month]),
      clouds: Math.round(Math.random() * 100),
      uvi: Math.round((3 + Math.random() * 9) * 10) / 10,
    });
  }

  return { daily, location: { lat, lon } };
}

function getWeatherCondition(month, rainProb) {
  if (rainProb > 0.6) return { main: 'Rain', description: 'moderate rain', icon: '10d' };
  if (rainProb > 0.3) return { main: 'Clouds', description: 'overcast clouds', icon: '04d' };
  if (month >= 3 && month <= 5) return { main: 'Clear', description: 'clear sky', icon: '01d' };
  return { main: 'Clouds', description: 'scattered clouds', icon: '03d' };
}

async function getForecast(lat, lon) {
  // Check cache first
  const db = getDb();
  const cached = db.prepare(
    `SELECT * FROM weather_cache WHERE latitude = ? AND longitude = ? AND expires_at > datetime('now')`
  ).get(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100);

  if (cached) {
    return JSON.parse(cached.forecast_data);
  }

  // Try real API
  let forecast = null;
  const apiData = await fetchWeatherFromAPI(lat, lon);

  if (apiData && apiData.list) {
    // Transform 5-day/3-hour forecast into daily format
    forecast = transformAPIData(apiData);
  } else {
    // Use mock data
    forecast = getMockForecast(lat, lon);
  }

  // Cache the result for 3 hours
  try {
    db.prepare(
      `INSERT INTO weather_cache (latitude, longitude, forecast_data, expires_at) VALUES (?, ?, ?, datetime('now', '+3 hours'))`
    ).run(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100, JSON.stringify(forecast));
  } catch (e) {
    // Cache insert failed, not critical
  }

  return forecast;
}

function transformAPIData(apiData) {
  const dailyMap = {};

  apiData.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { temps: [], humidity: [], wind: [], rain: 0, pop: 0, weather: null, dt: item.dt };
    }
    dailyMap[date].temps.push(item.main.temp);
    dailyMap[date].humidity.push(item.main.humidity);
    dailyMap[date].wind.push(item.wind.speed * 3.6); // m/s to km/h
    if (item.rain && item.rain['3h']) dailyMap[date].rain += item.rain['3h'];
    if (item.pop > dailyMap[date].pop) dailyMap[date].pop = item.pop;
    if (!dailyMap[date].weather) dailyMap[date].weather = item.weather[0];
  });

  const daily = Object.entries(dailyMap).slice(0, 7).map(([date, data]) => ({
    dt: data.dt,
    date,
    temp: {
      min: Math.round(Math.min(...data.temps) * 10) / 10,
      max: Math.round(Math.max(...data.temps) * 10) / 10,
      day: Math.round((data.temps.reduce((a, b) => a + b, 0) / data.temps.length) * 10) / 10,
    },
    humidity: Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length),
    wind_speed: Math.round((data.wind.reduce((a, b) => a + b, 0) / data.wind.length) * 10) / 10,
    pop: Math.round(data.pop * 100) / 100,
    rain: Math.round(data.rain * 10) / 10,
    weather: data.weather,
    clouds: 0,
    uvi: 5,
  }));

  return { daily, location: { lat: apiData.city.coord.lat, lon: apiData.city.coord.lon } };
}

function generateFarmingTips(forecast) {
  const tips = [];
  const daily = forecast.daily || [];

  // Check for multi-day patterns
  const consecutiveRainDays = daily.filter(d => d.pop > 0.6).length;
  const consecutiveDryDays = daily.filter(d => d.pop < 0.2).length;
  const highHumidityDays = daily.filter(d => d.humidity > 85).length;

  daily.forEach((day, index) => {
    const dayTips = [];
    const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`;

    // Rain rules
    if (day.pop > 0.7) {
      if (index <= 1) {
        dayTips.push({ type: 'warning', icon: 'cloud-rain', text: `Rain likely ${dayLabel.toLowerCase()}. Delay fertilizer and pesticide application.` });
      } else {
        dayTips.push({ type: 'info', icon: 'cloud-rain', text: `Rain expected on ${dayLabel}. Good time to prepare fields for sowing.` });
      }
    }
    if (day.rain > 50) {
      dayTips.push({ type: 'alert', icon: 'alert-triangle', text: `Heavy rainfall (${day.rain}mm) expected ${dayLabel.toLowerCase()}. Ensure field drainage. Protect nurseries.` });
    }

    // Temperature rules
    if (day.temp.max > 40) {
      dayTips.push({ type: 'alert', icon: 'thermometer', text: `Extreme heat (${day.temp.max}\u00b0C) ${dayLabel.toLowerCase()}. Irrigate early morning/late evening. Provide shade to nurseries.` });
    } else if (day.temp.max > 35) {
      dayTips.push({ type: 'warning', icon: 'sun', text: `High temperature (${day.temp.max}\u00b0C). Ensure adequate irrigation for standing crops.` });
    }
    if (day.temp.min < 5) {
      dayTips.push({ type: 'alert', icon: 'snowflake', text: `Frost risk ${dayLabel.toLowerCase()} (${day.temp.min}\u00b0C). Cover seedlings with straw or plastic sheets. Avoid night irrigation.` });
    } else if (day.temp.min < 10) {
      dayTips.push({ type: 'warning', icon: 'thermometer', text: `Cold conditions (${day.temp.min}\u00b0C min). Monitor sensitive crops for cold stress.` });
    }

    // Wind rules
    if (day.wind_speed > 40) {
      dayTips.push({ type: 'alert', icon: 'wind', text: `Strong winds (${day.wind_speed} km/h) expected. Stake tall plants. Do NOT spray pesticides.` });
    } else if (day.wind_speed > 20) {
      dayTips.push({ type: 'warning', icon: 'wind', text: `Moderate winds (${day.wind_speed} km/h). Avoid pesticide spraying \u2014 drift will waste chemicals.` });
    }

    // Humidity rules
    if (day.humidity > 85) {
      dayTips.push({ type: 'warning', icon: 'droplets', text: `Very high humidity (${day.humidity}%). Watch for fungal diseases (blast, blight, mildew).` });
    } else if (day.humidity < 30) {
      dayTips.push({ type: 'info', icon: 'sun', text: `Low humidity (${day.humidity}%). Increase irrigation frequency if soil is drying out.` });
    }

    // Ideal conditions
    if (day.temp.day >= 25 && day.temp.day <= 35 && day.humidity >= 50 && day.humidity <= 80 && day.pop < 0.3) {
      dayTips.push({ type: 'success', icon: 'check-circle', text: `Good conditions for field operations. Ideal for spraying, transplanting, or harvesting.` });
    }

    tips.push({
      day: index,
      label: dayLabel,
      date: day.date,
      tips: dayTips,
      summary: {
        tempMin: day.temp.min,
        tempMax: day.temp.max,
        humidity: day.humidity,
        windSpeed: day.wind_speed,
        rainProbability: Math.round(day.pop * 100),
        rainfall: day.rain,
        weather: day.weather,
      },
    });
  });

  // Multi-day alerts
  const multiDayAlerts = [];
  if (consecutiveRainDays >= 3) {
    multiDayAlerts.push({ type: 'alert', text: `${consecutiveRainDays} days of rain expected. Risk of waterlogging. Ensure drainage channels are clear.` });
  }
  if (consecutiveDryDays >= 5) {
    multiDayAlerts.push({ type: 'warning', text: `${consecutiveDryDays} dry days ahead. Drought stress building. Plan irrigation schedule.` });
  }
  if (highHumidityDays >= 3) {
    multiDayAlerts.push({ type: 'warning', text: `Extended high humidity period. Fungal disease risk elevated. Consider preventive fungicide application.` });
  }

  return { dailyTips: tips, multiDayAlerts };
}

module.exports = { getForecast, generateFarmingTips, getMockForecast };
