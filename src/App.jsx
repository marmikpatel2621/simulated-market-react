import React, { useState, useEffect } from 'react';
import sectorRelations from '../public/data/sectorRelations.json';
import crisisEvents from '../public/data/crisisEvents.json';
import marketEvents from '../public/data/marketEvents.json';

const volatilityEffect = {
  low: [2, 5],
  medium: [5, 15],
  high: [10, 25]
};

function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

export default function App() {
  const [sectors, setSectors] = useState([]);
  const [eventLog, setEventLog] = useState([]);
  const [playerPortfolio, setPlayerPortfolio] = useState({ cash: 1000, holdings: {} });
  const [priceHistory, setPriceHistory] = useState({});

  const initialSectors = [
    { name: 'Tech', volatility: 'high' },
    { name: 'Pharma', volatility: 'medium' },
    { name: 'Energy', volatility: 'medium' },
    { name: 'Retail', volatility: 'low' },
    { name: 'Finance', volatility: 'medium' },
    { name: 'Aero', volatility: 'high' },
    { name: 'Agro', volatility: 'low' },
    { name: 'Crypto', volatility: 'high' },
    { name: 'Luxury', volatility: 'low' },
    { name: 'Auto', volatility: 'medium' },
    { name: 'Media', volatility: 'medium' },
    { name: 'Bio', volatility: 'high' },
    { name: 'Real Estate', volatility: 'medium' },
    { name: 'Logistics', volatility: 'low' },
    { name: 'Defense', volatility: 'medium' },
    { name: 'Food', volatility: 'low' },
    { name: 'Telecom', volatility: 'medium' },
    { name: 'Tourism', volatility: 'medium' },
    { name: 'Healthcare', volatility: 'high' },
    { name: 'Construction', volatility: 'medium' },
    { name: 'Insurance', volatility: 'medium' }
  ];

  useEffect(() => {
    const selected = initialSectors.sort(() => 0.5 - Math.random()).slice(0, 8);
    const initial = selected.map(s => ({ ...s, price: 100 }));
    setSectors(initial);
    setPriceHistory(
      Object.fromEntries(initial.map(s => [s.name, [100]]))
    );
  }, []);

  const simulateMarket = () => {
    const triggerMarketEvent = Math.random() < 0.4;
    const triggerCrisis = !triggerMarketEvent && Math.random() < 0.25;

    let crisis = null;
    let marketEvent = null;

    if (triggerMarketEvent) {
      marketEvent = marketEvents[Math.floor(Math.random() * marketEvents.length)];
    } else if (triggerCrisis) {
      crisis = crisisEvents[Math.floor(Math.random() * crisisEvents.length)];
    }

    const updatedSectors = sectors.map(sector => {
      const [min, max] = volatilityEffect[sector.volatility];
      const history = priceHistory[sector.name] || [sector.price];
      const shortEMA = calculateEMA(history.slice(-3), 3);
      const longEMA = calculateEMA(history.slice(-7), 7);

      const trendingUp = shortEMA > longEMA;
      const baseProb = trendingUp ? 0.65 : 0.45;

      const influences = sectorRelations[sector.name] || {};
      let influenceScore = 0;
      Object.entries(influences).forEach(([related, direction]) => {
        const relatedSector = sectors.find(s => s.name === related);
        if (relatedSector && relatedSector.price > 100) {
          influenceScore += direction * 0.02;
        }
      });

      const marketFluctuation = (Math.random() * (max - min) + min) / 100;
      let delta = Math.random() < baseProb ? marketFluctuation : -marketFluctuation;

      if (crisis && crisis.affects.includes(sector.name)) {
        delta += crisis.impact;
      }

      if (marketEvent && marketEvent.affects.includes(sector.name)) {
        delta += marketEvent.impact;
      }

      const newPrice = Math.max(5, Math.round(sector.price * (1 + delta)));

      return {
        ...sector,
        price: newPrice,
        shortEMA: shortEMA.toFixed(2),
        longEMA: longEMA.toFixed(2),
        momentum: shortEMA > longEMA ? '📈 Bullish' : '📉 Bearish'
      };
    });

    const updatedHistory = { ...priceHistory };
    updatedSectors.forEach(sector => {
      const prev = updatedHistory[sector.name] || [];
      updatedHistory[sector.name] = [...prev.slice(-9), sector.price];
    });

    setSectors(updatedSectors);
    setPriceHistory(updatedHistory);

    if (crisis) {
      setEventLog(prev => [
        `🚨 Crisis: ${crisis.name} affects ${crisis.affects.join(', ')} (${(crisis.impact * 100).toFixed(0)}%)`,
        ...prev
      ]);
    } else if (marketEvent) {
      setEventLog(prev => [
        `📢 News: ${marketEvent.name} impacts ${marketEvent.affects.join(', ')} (${(marketEvent.impact * 100).toFixed(0)}%)`,
        ...prev
      ]);
    } else {
      setEventLog(prev => ["📉 General market fluctuation", ...prev]);
    }
  };

  const buyStock = (sectorName) => {
    const sector = sectors.find(s => s.name === sectorName);
    if (!sector || playerPortfolio.cash < sector.price) return;

    setPlayerPortfolio(prev => ({
      cash: prev.cash - sector.price,
      holdings: {
        ...prev.holdings,
        [sectorName]: (prev.holdings[sectorName] || 0) + 1
      }
    }));
  };

  const sellStock = (sectorName) => {
    const sector = sectors.find(s => s.name === sectorName);
    if (!sector || (playerPortfolio.holdings[sectorName] || 0) <= 0) return;

    setPlayerPortfolio(prev => ({
      cash: prev.cash + sector.price,
      holdings: {
        ...prev.holdings,
        [sectorName]: prev.holdings[sectorName] - 1
      }
    }));
  };

  const totalHoldingsValue = Object.entries(playerPortfolio.holdings).reduce((acc, [sectorName, qty]) => {
    const sector = sectors.find(s => s.name === sectorName);
    return acc + (sector ? sector.price * qty : 0);
  }, 0);

  const totalNetWorth = playerPortfolio.cash + totalHoldingsValue;

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>📈 Simulated Market Game</h1>
      <button onClick={simulateMarket}>Next Turn</button>

      <h2>💼 Portfolio</h2>
      <p>Cash: ${playerPortfolio.cash}</p>
      <p>Holdings Value: ${totalHoldingsValue}</p>
      <p><strong>Total Net Worth: ${totalNetWorth}</strong></p>
      <ul>
        {Object.entries(playerPortfolio.holdings).map(([sector, qty]) => (
          <li key={sector}>{sector}: {qty} shares</li>
        ))}
      </ul>

      <h2>Active Sectors</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {sectors.map(sector => {
          const history = priceHistory[sector.name] || [sector.price];
          const change = history.length >= 2 ? sector.price - history[history.length - 2] : 0;
          const arrow = change > 0 ? '🔺' : change < 0 ? '🔻' : '⏺';

          return (
            <div key={sector.name} style={{ border: '1px solid #aaa', padding: 10, width: 200 }}>
              <h4>{sector.name}</h4>
              <p>Price: ${sector.price} {arrow}</p>
              <p>Volatility: {sector.volatility}</p>
              <p>EMA-3: {sector.shortEMA}</p>
              <p>EMA-7: {sector.longEMA}</p>
              <p>{sector.momentum}</p>
              <button onClick={() => buyStock(sector.name)} disabled={playerPortfolio.cash < sector.price}>Buy</button>
              <button onClick={() => sellStock(sector.name)} disabled={(playerPortfolio.holdings[sector.name] || 0) === 0}>Sell</button>
            </div>
          );
        })}
      </div>

      <h2>📰 Event Log</h2>
      <ul>
        {eventLog.slice(0, 5).map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>
    </div>
  );
}
