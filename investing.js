const companies = [
    { id: 'largesoft', name: 'Largesoft', ticker: 'LGS', sector: 'OFFICE SOFTWARE', initial: 42, volatility: 0.035, hue: '#5677c8' },
    { id: 'numbers', name: 'Numbers', ticker: 'NUM', sector: 'SEARCH & CLOUD', initial: 68, volatility: 0.03, hue: '#4c9a76' },
    { id: 'yes', name: 'Yes', ticker: 'YES', sector: 'SOCIAL NETWORKS', initial: 24, volatility: 0.055, hue: '#df806a' },
    { id: 'peachbyte', name: 'Clingstone Computing Inc.', ticker: 'CCI', sector: 'COMPUTER SYSTEMS', initial: 56, volatility: 0.04, hue: '#c77e9a' },
    { id: 'nimblecart', name: 'Nimblecart', ticker: 'NMB', sector: 'ONLINE RETAIL', initial: 35, volatility: 0.05, hue: '#bd9147' }
];
const ACCESS_FEE = 100;
const LENS_PRICE = 75;

export function setupInvestmentSimulator(wrap, os, win) {
    const page = wrap.querySelector('.browser-invest-page');
    const gate = page.querySelector('.invest-gate');
    const dashboard = page.querySelector('.invest-dashboard');
    const walletHeader = page.querySelector('.invest-header-balance');
    const gateButton = page.querySelector('.invest-unlock');
    const gateNote = page.querySelector('.invest-gate-note');
    const cashLabel = page.querySelector('.invest-cash');
    const portfolioLabel = page.querySelector('.invest-value');
    const pnlLabel = page.querySelector('.invest-pnl');
    const countdownLabel = page.querySelector('.invest-countdown');
    const stockGrid = page.querySelector('.invest-stock-grid');
    const message = page.querySelector('.invest-message');
    const lensButton = page.querySelector('.invest-upgrade-button');
    const home = page.querySelector('.invest-home-button');
    const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    const state = os.investmentState;
    state.positions = state.positions || {};
    state.upgrades = state.upgrades || {};
    if (!Array.isArray(state.stocks) || state.stocks.length !== companies.length) {
        state.stocks = companies.map(company => ({ id: company.id, price: company.initial, change: 0, momentum: 0, history: [company.initial] }));
    } else {
        state.stocks = companies.map(company => {
            const saved = state.stocks.find(item => item.id === company.id);
            return saved ? { ...saved, history: Array.isArray(saved.history) && saved.history.length ? saved.history.slice(-30) : [company.initial] } : { id: company.id, price: company.initial, change: 0, momentum: 0, history: [company.initial] };
        });
    }
    let tickTimer = null, countdownTimer = null, nextTickAt = 0;
    const getCash = () => Number(os.storeState.balance) || 0;
    const roundCash = amount => Math.round(amount * 100) / 100;

    function updateGate() {
        walletHeader.textContent = money(getCash());
        if (state.unlocked) {
            gate.hidden = true;
            dashboard.hidden = false;
            return;
        }
        gate.hidden = false;
        dashboard.hidden = true;
        const missing = Math.max(0, ACCESS_FEE - getCash());
        gateButton.disabled = missing > 0;
        gateButton.textContent = missing > 0 ? 'Need ' + money(missing) + ' more' : 'Unlock Profit&Win · $100';
        gateNote.textContent = missing > 0 ? 'Broker access costs $100.00 · Available: ' + money(getCash()) : 'You have enough for broker access.';
    }

    function portfolioTotals() {
        let holdings = 0, unrealized = 0;
        state.stocks.forEach(stock => {
            const position = state.positions[stock.id];
            if (!position || position.shares <= 0) return;
            holdings += position.shares * stock.price;
            unrealized += position.shares * (stock.price - position.averageCost);
        });
        return { holdings, pnl: unrealized + (Number(state.realized) || 0) };
    }

    function drawSparkline(canvas, stock) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width, height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        const points = stock.history.slice(-20);
        if (points.length < 2) return;
        const min = Math.min(...points), max = Math.max(...points);
        const range = Math.max(max - min, stock.price * 0.015);
        ctx.beginPath();
        points.forEach((value, index) => {
            const x = index * width / (points.length - 1);
            const y = height - 3 - ((value - min) / range) * (height - 7);
            if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = stock.change >= 0 ? '#5a9872' : '#d16f69';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    function renderMarket() {
        updateGate();
        if (!state.unlocked) return;
        const totals = portfolioTotals();
        cashLabel.textContent = money(getCash());
        portfolioLabel.textContent = money(getCash() + totals.holdings);
        pnlLabel.textContent = (totals.pnl >= 0 ? '+' : '−') + money(Math.abs(totals.pnl));
        pnlLabel.classList.toggle('is-up', totals.pnl >= 0);
        pnlLabel.classList.toggle('is-down', totals.pnl < 0);
        lensButton.textContent = state.upgrades.trendLens ? 'Owned' : 'Buy · ' + money(LENS_PRICE);
        lensButton.disabled = Boolean(state.upgrades.trendLens) || getCash() < LENS_PRICE;
        stockGrid.replaceChildren();
        companies.forEach(company => {
            const stock = state.stocks.find(item => item.id === company.id);
            const position = state.positions[stock.id] || { shares: 0, averageCost: 0 };
            const card = document.createElement('article'); card.className = 'invest-stock';
            const header = document.createElement('div'); header.className = 'invest-stock-top';
            const identity = document.createElement('div'); identity.className = 'invest-company';
            const badge = document.createElement('span'); badge.className = 'invest-ticker-badge'; badge.style.setProperty('--ticker-color', company.hue); badge.textContent = company.ticker;
            const companyName = document.createElement('div'); companyName.className = 'invest-company-copy';
            const title = document.createElement('strong'); title.textContent = company.name;
            const sector = document.createElement('small'); sector.textContent = company.sector;
            companyName.append(title, sector); identity.append(badge, companyName);
            const change = document.createElement('span'); change.className = 'invest-change ' + (stock.change >= 0 ? 'up' : 'down'); change.textContent = (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2) + '%';
            header.append(identity, change);
            const priceLine = document.createElement('div'); priceLine.className = 'invest-price-line';
            const price = document.createElement('strong'); price.textContent = money(stock.price);
            const spark = document.createElement('canvas'); spark.className = 'invest-sparkline'; spark.width = 112; spark.height = 34; spark.setAttribute('aria-label', 'Recent price history');
            priceLine.append(price, spark);
            const trend = document.createElement('div'); trend.className = 'invest-trend';
            if (state.upgrades.trendLens) {
                const recent = stock.history.slice(-6);
                const trendPct = recent.length > 1 ? ((recent[recent.length - 1] / recent[0]) - 1) * 100 : 0;
                trend.textContent = '5-tick trend ' + (trendPct >= 0 ? '+' : '') + trendPct.toFixed(1) + '%';
            } else trend.textContent = 'Trend Lens reveals 5-tick momentum';
            const holding = document.createElement('div'); holding.className = 'invest-holding';
            const shares = document.createElement('span'); shares.textContent = position.shares + (position.shares === 1 ? ' share' : ' shares');
            const holdingValue = document.createElement('strong'); holdingValue.textContent = money(position.shares * stock.price);
            holding.append(shares, holdingValue);
            const actions = document.createElement('div'); actions.className = 'invest-stock-actions';
            const sell = document.createElement('button'); sell.type = 'button'; sell.textContent = 'Sell 1'; sell.disabled = position.shares < 1;
            const buy = document.createElement('button'); buy.type = 'button'; buy.className = 'primary'; buy.textContent = 'Buy 1'; buy.disabled = getCash() < stock.price;
            sell.addEventListener('click', () => sellOne(stock.id));
            buy.addEventListener('click', () => buyOne(stock.id));
            actions.append(sell, buy);
            card.append(header, priceLine, trend, holding, actions);
            stockGrid.appendChild(card);
            drawSparkline(spark, stock);
        });
    }

    function buyOne(stockId) {
        const stock = state.stocks.find(item => item.id === stockId);
        if (!stock || getCash() < stock.price) { message.textContent = 'Not enough in your wallet for that share.'; return; }
        const position = state.positions[stockId] || { shares: 0, averageCost: 0 };
        const nextShares = position.shares + 1;
        position.averageCost = ((position.averageCost * position.shares) + stock.price) / nextShares;
        position.shares = nextShares;
        state.positions[stockId] = position;
        os.storeState.balance = roundCash(getCash() - stock.price);
        message.textContent = 'Bought 1 ' + stockId.toUpperCase() + ' share at ' + money(stock.price) + '.';
        os.saveState();
        renderMarket();
    }

    function sellOne(stockId) {
        const stock = state.stocks.find(item => item.id === stockId);
        const position = state.positions[stockId];
        if (!stock || !position || position.shares < 1) return;
        os.storeState.balance = roundCash(getCash() + stock.price);
        state.realized = roundCash((Number(state.realized) || 0) + stock.price - position.averageCost);
        position.shares -= 1;
        if (!position.shares) position.averageCost = 0;
        message.textContent = 'Sold 1 ' + stockId.toUpperCase() + ' share at ' + money(stock.price) + '.';
        os.saveState();
        renderMarket();
    }

    function stepMarket() {
        if (!win.isConnected || page.hidden || win.style.display === 'none') { stopMarket(); return; }
        state.stocks.forEach((stock, index) => {
            const company = companies[index];
            const previous = stock.price;
            const noise = (Math.random() - 0.49) * company.volatility;
            stock.momentum = (Number(stock.momentum) || 0) * 0.3 + (Math.random() - 0.5) * company.volatility * 0.55;
            const rareShock = Math.random() < 0.035 ? (Math.random() - 0.5) * 0.16 : 0;
            stock.price = Math.max(1, Math.round(previous * (1 + noise + stock.momentum + rareShock) * 100) / 100);
            stock.change = (stock.price / previous - 1) * 100;
            stock.history.push(stock.price);
            if (stock.history.length > 30) stock.history.shift();
        });
        nextTickAt = Date.now() + 3000;
        os.saveState();
        renderMarket();
    }

    function stopMarket() {
        if (tickTimer) clearInterval(tickTimer);
        if (countdownTimer) clearInterval(countdownTimer);
        tickTimer = countdownTimer = null;
    }

    function startMarket() {
        stopMarket();
        nextTickAt = Date.now() + 3000;
        renderMarket();
        tickTimer = setInterval(stepMarket, 3000);
        countdownTimer = setInterval(() => {
            if (!page.hidden) countdownLabel.textContent = Math.max(0, Math.ceil((nextTickAt - Date.now()) / 1000)) + 's';
        }, 200);
    }

    gateButton.addEventListener('click', () => {
        if (state.unlocked || getCash() < ACCESS_FEE) return;
        os.storeState.balance = roundCash(getCash() - ACCESS_FEE);
        state.unlocked = true;
        os.saveState();
        message.textContent = 'Broker unlocked. Watch the tape, then pick your moment.';
        updateGate();
        startMarket();
    });

    lensButton.addEventListener('click', () => {
        if (state.upgrades.trendLens || getCash() < LENS_PRICE) return;
        os.storeState.balance = roundCash(getCash() - LENS_PRICE);
        state.upgrades.trendLens = true;
        message.textContent = 'Trend Lens installed. Recent momentum is now visible—not a promise.';
        os.saveState();
        renderMarket();
    });

    home.addEventListener('click', () => {
        stopMarket();
        page.hidden = true;
        wrap.querySelector('.browser-homepage').hidden = false;
    });

    gateButton.addEventListener('focus', updateGate);
    win.investCleanup = stopMarket;
    updateGate();
    return () => {
        page.hidden = false;
        updateGate();
        if (state.unlocked) startMarket();
    };
}
