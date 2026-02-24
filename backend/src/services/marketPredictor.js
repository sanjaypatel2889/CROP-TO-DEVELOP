const { getDb } = require('../db/database');

function getCurrentPrices(cropName, state) {
  const db = getDb();
  let query = `
    SELECT mp.*, c.name as crop_name, c.msp_per_quintal
    FROM market_prices mp
    JOIN crops c ON mp.crop_id = c.id
    WHERE LOWER(c.name) = LOWER(?)
  `;
  const params = [cropName];

  if (state) {
    query += ' AND LOWER(mp.state) = LOWER(?)';
    params.push(state);
  }

  query += ' ORDER BY mp.price_date DESC LIMIT 50';
  return db.prepare(query).all(...params);
}

function getPriceHistory(cropName, state) {
  const db = getDb();
  let query = `
    SELECT ph.*, c.name as crop_name
    FROM price_history ph
    JOIN crops c ON ph.crop_id = c.id
    WHERE LOWER(c.name) = LOWER(?)
  `;
  const params = [cropName];

  if (state) {
    query += ' AND LOWER(ph.state) = LOWER(?)';
    params.push(state);
  }

  query += ' ORDER BY ph.year DESC, ph.month DESC LIMIT 24';
  return db.prepare(query).all(...params);
}

function getSeasonalScore(crop, month) {
  if (!crop) return 0;
  const season = (crop.season || '').toLowerCase();

  // Kharif harvest: Oct-Nov -> prices drop
  if (season === 'kharif' && (month === 10 || month === 11)) return -2;
  // Kharif pre-harvest: Aug-Sep -> prices peak
  if (season === 'kharif' && (month === 8 || month === 9)) return 2;

  // Rabi harvest: Mar-Apr -> prices drop
  if (season === 'rabi' && (month === 3 || month === 4)) return -2;
  // Rabi pre-harvest: Jan-Feb -> prices peak
  if (season === 'rabi' && (month === 1 || month === 2)) return 2;

  // Festival demand: Oct-Nov (Diwali), Feb-Mar (Holi)
  if (month === 10 || month === 11 || month === 2 || month === 3) {
    if (['pulse', 'oilseed'].includes(crop.category)) return 1;
  }

  return 0;
}

function generateSignal(cropName, state) {
  const db = getDb();

  const crop = db.prepare('SELECT * FROM crops WHERE LOWER(name) = LOWER(?)').get(cropName);
  if (!crop) {
    return { error: 'Crop not found in database' };
  }

  const prices = getCurrentPrices(cropName, state);
  const history = getPriceHistory(cropName, state);

  if (!prices.length) {
    return { error: 'No price data available for this crop/state combination' };
  }

  const currentPrice = prices[0].price_per_quintal;
  const month = new Date().getMonth() + 1;
  let score = 0;
  const reasons = [];

  // 1. Price trend (compare latest vs older prices)
  if (prices.length >= 3) {
    const recentAvg = prices.slice(0, 3).reduce((s, p) => s + p.price_per_quintal, 0) / 3;
    const olderAvg = prices.length >= 6
      ? prices.slice(3, 6).reduce((s, p) => s + p.price_per_quintal, 0) / Math.min(3, prices.length - 3)
      : recentAvg;

    const change = (recentAvg - olderAvg) / olderAvg;
    if (change > 0.05) {
      score += 3;
      reasons.push(`Prices rising (+${(change * 100).toFixed(1)}% recent trend)`);
    } else if (change < -0.05) {
      score -= 3;
      reasons.push(`Prices falling (${(change * 100).toFixed(1)}% recent trend)`);
    } else {
      reasons.push('Prices stable in recent period');
    }
  }

  // 2. Seasonal pattern
  const seasonalScore = getSeasonalScore(crop, month);
  score += seasonalScore;
  if (seasonalScore > 0) reasons.push('Favorable seasonal period (pre-harvest demand)');
  if (seasonalScore < 0) reasons.push('Post-harvest period (increased market supply)');

  // 3. MSP comparison
  if (crop.msp_per_quintal) {
    const mspRatio = currentPrice / crop.msp_per_quintal;
    if (mspRatio < 1.1) {
      score += 3;
      reasons.push(`Price near MSP floor (Rs ${crop.msp_per_quintal}/q) \u2014 government procurement likely`);
    } else if (mspRatio > 1.5) {
      score -= 1;
      reasons.push(`Price ${((mspRatio - 1) * 100).toFixed(0)}% above MSP \u2014 may see correction`);
    } else {
      reasons.push(`Price ${((mspRatio - 1) * 100).toFixed(0)}% above MSP (Rs ${crop.msp_per_quintal}/q)`);
    }
  }

  // 4. Arrival-based analysis
  if (prices.length >= 2) {
    const avgArrival = prices.reduce((s, p) => s + (p.arrival_tonnes || 0), 0) / prices.length;
    const recentArrival = prices[0].arrival_tonnes || 0;

    if (recentArrival > avgArrival * 1.3) {
      score -= 2;
      reasons.push('High mandi arrivals \u2014 oversupply may push prices down');
    } else if (recentArrival < avgArrival * 0.7 && avgArrival > 0) {
      score += 2;
      reasons.push('Low mandi arrivals \u2014 supply shortage may push prices up');
    }
  }

  // 5. Historical month comparison
  if (history.length > 0) {
    const sameMonthHistory = history.find(h => h.month === month);
    if (sameMonthHistory) {
      const histChange = (currentPrice - sameMonthHistory.avg_price) / sameMonthHistory.avg_price;
      if (histChange > 0.1) {
        score += 1;
        reasons.push(`Price ${(histChange * 100).toFixed(0)}% higher than historical average for this month`);
      } else if (histChange < -0.1) {
        score -= 1;
        reasons.push(`Price ${(histChange * 100).toFixed(0)}% lower than historical average for this month`);
      }
    }
  }

  const signal = score > 3 ? 'BUY' : score < -3 ? 'SELL' : 'HOLD';
  const confidence = Math.min(Math.abs(score) * 12, 95);

  // Price prediction for next week
  const weeklyChange = score > 0 ? 0.02 : score < 0 ? -0.02 : 0;
  const predictedLow = Math.round(currentPrice * (1 + weeklyChange - 0.03));
  const predictedHigh = Math.round(currentPrice * (1 + weeklyChange + 0.03));

  return {
    signal,
    confidence,
    currentPrice,
    msp: crop.msp_per_quintal,
    cropName: crop.name,
    state: state || 'All India',
    trend: score > 1 ? 'rising' : score < -1 ? 'falling' : 'stable',
    reasons,
    prediction: {
      nextWeek: { low: predictedLow, high: predictedHigh },
      message: `Expected range: Rs ${predictedLow}-${predictedHigh}/quintal next week`,
    },
    priceHistory: prices.slice(0, 10).map(p => ({
      date: p.price_date,
      price: p.price_per_quintal,
      mandi: p.mandi_name,
      arrival: p.arrival_tonnes,
    })),
    monthlyHistory: history.slice(0, 12).map(h => ({
      month: h.month,
      year: h.year,
      avgPrice: h.avg_price,
      trend: h.trend,
    })),
  };
}

function getAllMandiPrices(cropName, state) {
  const prices = getCurrentPrices(cropName, state);
  return prices.map(p => ({
    mandi: p.mandi_name,
    state: p.state,
    district: p.district,
    price: p.price_per_quintal,
    date: p.price_date,
    arrival: p.arrival_tonnes,
  }));
}

module.exports = { generateSignal, getCurrentPrices, getPriceHistory, getAllMandiPrices };
