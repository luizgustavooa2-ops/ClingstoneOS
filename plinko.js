const payouts = [5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5];
const rows = 8;
const bet = 1;
const ballColors = ['#f3a63d', '#579ebc', '#a47ac4', '#df7670', '#7fae66'];

export function setupPlinko(wrap, os, win) {
    const page = wrap.querySelector('.browser-plinko-page');
    const canvas = page.querySelector('.plinko-board');
    const ctx = canvas.getContext('2d');
    const buckets = page.querySelector('.plinko-buckets');
    const wallet = page.querySelector('.plinko-balance');
    const dropButton = page.querySelector('.plinko-drop');
    const result = page.querySelector('.plinko-result');
    const homeButton = page.querySelector('.plinko-home-button');
    const homePage = wrap.querySelector('.browser-homepage');
    const money = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    const activeRounds = new Map();
    let animationFrame = 0;
    let nextRoundId = 0;
    const centerX = canvas.width / 2;
    const pegStep = 40;
    const rowY = row => 20 + row * 27;

    payouts.forEach((multiplier, index) => {
        const slot = document.createElement('div');
        slot.className = 'plinko-bucket bucket-' + (multiplier >= 2 ? 'high' : multiplier < 1 ? 'low' : 'middle');
        slot.dataset.index = String(index);
        slot.innerHTML = '<strong></strong><small>×</small>';
        slot.querySelector('strong').textContent = multiplier < 1 ? multiplier.toFixed(1) : String(multiplier);
        buckets.appendChild(slot);
    });

    function updateWallet() {
        const balance = Number(os.storeState.balance) || 0;
        wallet.textContent = money(balance);
        dropButton.disabled = balance < bet;
        dropButton.textContent = balance < bet ? 'Need $1.00 to drop' : 'Drop a ball · $1';
    }

    function draw(balls = []) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#dce8e5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 154, 12);
        ctx.lineTo(centerX - 166, 235);
        ctx.moveTo(centerX + 154, 12);
        ctx.lineTo(centerX + 166, 235);
        ctx.stroke();
        for (let row = 0; row < rows; row++) {
            const count = row + 1;
            for (let peg = 0; peg < count; peg++) {
                const x = centerX - row * pegStep / 2 + peg * pegStep;
                const y = rowY(row);
                ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2);
                ctx.fillStyle = '#8daea3'; ctx.fill();
                ctx.beginPath(); ctx.arc(x - 1.2, y - 1.2, 1.25, 0, Math.PI * 2);
                ctx.fillStyle = '#e9f5ee'; ctx.fill();
            }
        }
        const visibleBalls = balls.length ? balls : [{ x: centerX, y: 12, color: ballColors[0] }];
        visibleBalls.forEach(ball => {
            ctx.save();
            ctx.shadowColor = ball.color + '88';
            ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = ball.color; ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = '#fff0cf'; ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(ball.x - 3, ball.y - 3, 2.8, 0, Math.PI * 2);
            ctx.fillStyle = '#fff8e8'; ctx.fill();
            ctx.restore();
        });
    }

    function makePath() {
        const path = [{ x: centerX, y: 12 }];
        let rights = 0;
        for (let row = 0; row < rows; row++) {
            const right = Math.random() < 0.5;
            if (right) rights++;
            path.push({ x: centerX + (rights - (row + 1 - rights)) * pegStep / 2, y: rowY(row) + 9 });
        }
        path.push({ x: centerX + (rights - (rows - rights)) * pegStep / 2, y: 238 });
        return { path, rights };
    }

    function settleRound(round) {
        if (!activeRounds.has(round.id)) return;
        activeRounds.delete(round.id);
        const multiplier = payouts[round.rights];
        const returned = Math.round(bet * multiplier * 100) / 100;
        os.storeState.balance = Math.round(((Number(os.storeState.balance) || 0) + returned) * 100) / 100;
        page.querySelectorAll('.plinko-bucket').forEach((slot, index) => {
            if (index === round.rights) slot.classList.add('landed');
        });
        const net = Math.round((returned - bet) * 100) / 100;
        const outcome = net > 0 ? 'Won ' + money(net) : net < 0 ? 'Lost ' + money(Math.abs(net)) : 'Broke even';
        const otherBalls = activeRounds.size;
        result.textContent = outcome + ' · ' + multiplier.toFixed(multiplier % 1 ? 1 : 0) + '× slot returned ' + money(returned) + (otherBalls ? ' · ' + otherBalls + ' still dropping' : '');
    }

    function animate(timestamp) {
        const falling = [];
        const landed = [];
        for (const round of activeRounds.values()) {
            const segmentDuration = 145;
            const elapsed = Math.max(0, timestamp - round.startedAt);
            const segment = Math.min(round.path.length - 2, Math.floor(elapsed / segmentDuration));
            const mix = Math.min(1, (elapsed - segment * segmentDuration) / segmentDuration);
            const from = round.path[segment], to = round.path[segment + 1];
            const ball = { x: from.x + (to.x - from.x) * mix, y: from.y + (to.y - from.y) * mix, color: round.color };
            if (segment >= round.path.length - 2 && mix >= 1) landed.push(round);
            else falling.push(ball);
        }
        landed.forEach(settleRound);
        draw(falling);
        if (landed.length) {
            os.saveState();
            updateWallet();
        }
        if (activeRounds.size) animationFrame = requestAnimationFrame(animate);
        else animationFrame = 0;
    }

    dropButton.addEventListener('click', () => {
        if (Number(os.storeState.balance) < bet) { updateWallet(); return; }
        const outcome = makePath();
        os.storeState.balance = Math.round((Number(os.storeState.balance) - bet) * 100) / 100;
        os.saveState();
        const id = ++nextRoundId;
        activeRounds.set(id, { ...outcome, id, startedAt: performance.now(), color: ballColors[(id - 1) % ballColors.length] });
        result.textContent = activeRounds.size + (activeRounds.size === 1 ? ' ball in play…' : ' balls in play…');
        if (activeRounds.size === 1) page.querySelectorAll('.plinko-bucket').forEach(slot => slot.classList.remove('landed'));
        updateWallet();
        if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    });

    homeButton.addEventListener('click', () => {
        page.hidden = true;
        homePage.hidden = false;
    });
    win.plinkoCleanup = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        const rounds = [...activeRounds.values()];
        rounds.forEach(settleRound);
        if (rounds.length) { os.saveState(); updateWallet(); draw(); }
    };
    win.plinkoHome = () => { page.hidden = false; draw(activeRounds.size ? [...activeRounds.values()].map(round => ({ x: round.path[0].x, y: round.path[0].y, color: round.color })) : []); updateWallet(); };
    draw();
    updateWallet();
    return win.plinkoHome;
}
