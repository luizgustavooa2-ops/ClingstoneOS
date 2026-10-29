import { createIcons, icons } from 'lucide';

class ClingstoneOS {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
        this.zIndexCounter = 100;

        // Shared virtual file system. Folder nodes: { type:'folder', items:{name:node} }
        this.fs = {
            root: { type: 'folder', items: {
                'Documents': { type: 'folder', items: {
                    'Welcome.txt': { type: 'file', content: 'Welcome to Clingstone OS! This is your professional companion for the modern era.\n\nEverything in the file manager, terminal, and text editor is a live, shared file system.\nTry it: create a folder here, then `ls` it from StoneShell.' }
                }},
                'Pictures': { type: 'folder', items: {
                    'Vacation.jpg': { type: 'image', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&h=300', name: 'Vacation.jpg' },
                    'Mountains.jpg': { type: 'image', src: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=400&h=300', name: 'Mountains.jpg' }
                }},
                'Applications': { type: 'folder', items: {
                    'StonePad.app': { type: 'app', app: 'pad' },
                    'StoneShell.app': { type: 'app', app: 'shell' },
                    'Navigator.app': { type: 'app', app: 'files' },
                    'ControlPanel.app': { type: 'app', app: 'settings' },
                    'PocketCalc.app': { type: 'app', app: 'calculator' },
                    'Daybook.app': { type: 'app', app: 'calendar' },
                    'Sketchpad.app': { type: 'app', app: 'sketch' }
                }},
                'StoneDrive': { type: 'folder', items: {} },
                'Trash': { type: 'folder', items: {} }
            } }
        };

        this.settings = {
            translucency: true,
            highContrast: false,
            volume: 75,
            wallpaper: 'default'
        };
        this.calendarEvents = {};
        this.networkEnabled = true;
        this.storeState = { balance: 50000, owned: [], installed: [] };
        this.audioContext = null;
        this.audioFilters = new WeakMap();
        this.loadState();

        this.apps = {
            about: { name: 'About', icon: 'Info', content: (win) => this.getAboutContent(win) },
            pad: { name: 'StonePad', icon: 'FileText', content: (win, args) => this.getPadContent(win, args) },
            shell: { name: 'StoneShell', icon: 'Terminal', content: (win) => this.getShellContent(win) },
            files: { name: 'Navigator', icon: 'Folder', content: (win, args) => this.getFilesContent(win, args) },
            viewer: { name: 'Photo Viewer', icon: 'Image', content: (win, args) => this.getViewerContent(win, args) },
            browser: { name: 'Browser', icon: 'Globe', content: (win) => this.getBrowserContent(win) },
            settings: { name: 'Settings', icon: 'Settings', content: (win) => this.getSettingsContent(win) },
            calculator: { name: 'PocketCalc', icon: 'Calculator', content: (win) => this.getCalculatorContent(win) },
            calendar: { name: 'Daybook', icon: 'CalendarDays', content: (win) => this.getCalendarContent(win) },
            sketch: { name: 'Sketchpad', icon: 'Paintbrush', content: (win) => this.getSketchContent(win) }
        };
        const applications = this.getNode(['Applications']);
        if (applications?.items) {
            Object.assign(applications.items, {
                'Browser.app': { type: 'app', app: 'browser' },
                'PocketCalc.app': { type: 'app', app: 'calculator' },
                'Daybook.app': { type: 'app', app: 'calendar' },
                'Sketchpad.app': { type: 'app', app: 'sketch' }
            });
            this.saveState();
        }

        this.init();
    }

    loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem('clingstone-state') || 'null');
            if (saved?.fs?.root?.items) this.fs = saved.fs;
            if (saved?.settings) this.settings = { ...this.settings, ...saved.settings };
            if (saved?.calendarEvents && typeof saved.calendarEvents === 'object') this.calendarEvents = saved.calendarEvents;
            if (saved?.storeState && Number.isFinite(saved.storeState.balance) && Array.isArray(saved.storeState.owned)) this.storeState = { balance: saved.storeState.balance, owned: saved.storeState.owned, installed: Array.isArray(saved.storeState.installed) ? saved.storeState.installed : [] };
        } catch (error) {
            console.warn('Could not restore Clingstone state:', error);
        }
        const occupiedSlots = new Set();
        this.storeState.installed = [...this.storeState.installed].reverse().filter(id => {
            const slot = this.getPartSlot(id);
            if (!slot) return true;
            if (occupiedSlots.has(slot)) return false;
            occupiedSlots.add(slot);
            return true;
        }).reverse();
    }

    saveState() {
        try {
            localStorage.setItem('clingstone-state', JSON.stringify({ fs: this.fs, settings: this.settings, calendarEvents: this.calendarEvents, storeState: this.storeState }));
        } catch (error) {
            console.warn('Could not save Clingstone state:', error);
        }
    }

    applyWallpaper() {
        const styles = {
            default: "url('wallpaper.png') center / cover no-repeat",
            beach: 'linear-gradient(135deg,#ffd3a5,#fd6585)',
            forest: 'linear-gradient(135deg,#a8e063,#56ab2f)',
            ocean: 'linear-gradient(135deg,#89f7fe,#66a6ff)',
            night: 'linear-gradient(135deg,#232526,#414345)'
        };
        document.getElementById('os-container').style.background = styles[this.settings.wallpaper] || styles.default;
    }

    /* ---------------- Filesystem helpers ---------------- */

    getNode(path) {
        let node = this.fs.root;
        for (const seg of path) {
            if (!node || !node.items) return null;
            node = node.items[seg];
            if (!node) return null;
        }
        return node;
    }

    lsFolder(path) {
        const node = this.getNode(path);
        if (!node || !node.items) return [];
        return Object.entries(node.items);
    }

    getParentOf(path) {
        if (!path.length) return null;
        const parentArr = path.slice(0, -1);
        const parentNode = this.getNode(parentArr);
        const name = path[path.length - 1];
        return parentNode && parentNode.items && name in parentNode.items
            ? { parentNode, name, parentArr }
            : null;
    }

    createFolder(path, name) {
        const parent = this.getNode(path);
        if (!parent?.items || !name || parent.items[name]) return null;
        parent.items[name] = { type: 'folder', items: {} };
        this.saveState();
        return true;
    }

    writeFile(path, name, content) {
        const parent = this.getNode(path);
        if (!parent?.items || !name) return null;
        parent.items[name] = { type: 'file', content };
        this.saveState();
        return true;
    }

    rm(path) {
        const parent = this.getParentOf(path);
        if (!parent) return false;
        delete parent.parentNode.items[parent.name];
        this.saveState();
        return true;
    }

    moveToTrash(path) {
        const parent = this.getParentOf(path);
        if (!parent) return false;
        const node = parent.parentNode.items[parent.name];
        const trash = this.getNode(['Trash']);
        node._trashPath = path.slice(0, -1);
        let trashName = parent.name;
        let suffix = 2;
        while (trash.items[trashName]) trashName = parent.name.replace(/\.(?=[^.]+$)/, '') + ' ' + suffix++ + (parent.name.includes('.') ? '.' + parent.name.split('.').pop() : '');
        trash.items[trashName] = node;
        delete parent.parentNode.items[parent.name];
        this.saveState();
        return true;
    }

    /* ---------------- Boot ---------------- */

    init() {
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        this.renderDock();
        this.renderDesktopIcons();
        this.applyGrain(true);
        this.applyWallpaper();
        this.setVolume(this.settings.volume);
        createIcons({ icons });
        this.updateNetworkIcon();

        // Trash dock icon -> Navigator at Trash
        const trashEl = document.querySelector('.dock-item.trash');
        if (trashEl) trashEl.onclick = () => this.openApp('files', { path: ['Trash'] });

        // Startup sound
        document.body.addEventListener('click', () => {
            const startup = document.getElementById('sound-startup');
            if (startup && startup.paused && !this.playedStartup) {
                startup.volume = this.settings.volume / 100;
                startup.play();
                this.playedStartup = true;
            }
        }, { once: true });
    }

    updateNetworkIcon() {
        const button = document.getElementById('wifi-status');
        if (!button) return;
        button.innerHTML = `<i data-lucide="${this.networkEnabled ? 'wifi' : 'wifi-off'}" size="14"></i>`;
        button.setAttribute('aria-label', this.networkEnabled ? 'Wi-Fi on' : 'Wi-Fi off');
        button.title = this.networkEnabled ? 'Wi-Fi on' : 'Wi-Fi off';
        button.classList.toggle('status-off', !this.networkEnabled);
        createIcons({ icons });
    }

    showTopbarPopover(kind) {
        const popover = document.getElementById('topbar-popover');
        popover.className = 'topbar-popover';
        popover.dataset.kind = kind;
        popover.replaceChildren();
        popover.hidden = false;
        if (kind === 'wifi') {
            const heading = document.createElement('strong'); heading.textContent = 'Network';
            const row = document.createElement('div'); row.className = 'popover-row';
            const copy = document.createElement('span'); copy.innerHTML = `<b>Wi-Fi</b><small>${this.networkEnabled ? 'Connected' : 'Off'}</small>`;
            const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'popover-toggle'; toggle.textContent = this.networkEnabled ? 'On' : 'Off'; toggle.setAttribute('aria-pressed', String(this.networkEnabled));
            toggle.addEventListener('click', () => { this.networkEnabled = !this.networkEnabled; this.updateNetworkIcon(); this.showTopbarPopover('wifi'); });
            row.append(copy, toggle); popover.append(heading, row);
        } else {
            const heading = document.createElement('strong'); heading.textContent = 'Battery';
            const row = document.createElement('div'); row.className = 'popover-row battery-row';
            const copy = document.createElement('span'); copy.textContent = 'Checking battery…'; row.appendChild(copy); popover.append(heading, row);
            if (navigator.getBattery) {
                navigator.getBattery().then((battery) => {
                    if (popover.hidden || !popover.contains(copy)) return;
                    const percent = Math.round(battery.level * 100);
                    copy.textContent = `${percent}%${battery.charging ? ' · Charging' : ' remaining'}`;
                }).catch(() => { copy.textContent = 'Battery status unavailable'; });
            } else copy.textContent = 'Battery status unavailable';
        }
    }

    showClockWidget() {
        const popover = document.getElementById('topbar-popover');
        popover.className = 'topbar-popover clock-popover';
        popover.dataset.kind = 'clock';
        popover.innerHTML = '<strong>Local time</strong><div class="analog-clock-face" aria-label="Analog clock"><div class="clock-numbers"></div><span class="clock-hand clock-hour-hand"></span><span class="clock-hand clock-minute-hand"></span><span class="clock-hand clock-second-hand"></span><span class="clock-center"></span></div><div class="clock-widget-digital"></div><div class="clock-widget-date"></div>';
        const numbers = popover.querySelector('.clock-numbers');
        for (let number = 1; number <= 12; number++) {
            const label = document.createElement('span'); label.textContent = String(number);
            const angle = (number * 30 - 90) * Math.PI / 180;
            label.style.left = `${88 + Math.cos(angle) * 69}px`; label.style.top = `${88 + Math.sin(angle) * 69}px`;
            numbers.appendChild(label);
        }
        popover.hidden = false;
        this.updateClock();
    }

    showWindowSwitcher() {
        const popover = document.getElementById('topbar-popover');
        popover.className = 'topbar-popover window-switcher';
        popover.dataset.kind = 'windows';
        popover.replaceChildren();
        popover.hidden = false;
        const heading = document.createElement('strong'); heading.textContent = 'Open apps'; popover.appendChild(heading);
        if (!this.windows.length) { const empty = document.createElement('div'); empty.className = 'switcher-empty'; empty.textContent = 'No open windows'; popover.appendChild(empty); return; }
        this.windows.forEach((win) => {
            const app = this.apps[win.appKey];
            const button = document.createElement('button'); button.type = 'button'; button.className = 'switcher-item';
            button.innerHTML = `<i data-lucide="${app?.icon || 'monitor'}" size="15"></i><span></span>`;
            button.querySelector('span').textContent = app?.name || 'App';
            button.addEventListener('click', () => { if (win.element.style.display === 'none') win.element.style.display = ''; this.setActive(win.element); popover.hidden = true; });
            popover.appendChild(button);
        });
        createIcons({ icons });
    }

    setupEventListeners() {
        const startTrigger = document.getElementById('start-menu-trigger');
        const startMenu = document.getElementById('start-menu');

        startTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('hidden');
            this.playSound('click');
        });

        document.addEventListener('click', (event) => {
            startMenu.classList.add('hidden');
            if (!event.target.closest('#topbar-popover, #active-app-display, #wifi-status, #battery-status, #clock')) {
                const popover = document.getElementById('topbar-popover');
                if (popover) popover.hidden = true;
            }
        });

        document.getElementById('active-app-display').addEventListener('click', (event) => {
            event.stopPropagation(); this.showWindowSwitcher();
        });
        document.getElementById('wifi-status').addEventListener('click', (event) => {
            event.stopPropagation(); this.showTopbarPopover('wifi');
        });
        document.getElementById('battery-status').addEventListener('click', (event) => {
            event.stopPropagation(); this.showTopbarPopover('battery');
        });
        document.getElementById('clock').addEventListener('click', (event) => {
            event.stopPropagation();
            const popover = document.getElementById('topbar-popover');
            if (!popover.hidden && popover.dataset.kind === 'clock') popover.hidden = true;
            else this.showClockWidget();
        });

        startMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.start-item');
            if (item) {
                const appKey = item.dataset.app;
                if (appKey) this.openApp(appKey);
                if (item.id === 'shutdown-btn') {
                    if (confirm("Shutdown Clingstone OS?")) {
                        document.body.innerHTML = '<div style="background:black; color:white; height:100vh; display:flex; align-items:center; justify-content:center; font-family:serif;">It is now safe to turn off your computer.</div>';
                    }
                }
            }
        });

        document.addEventListener('mousedown', (e) => this.handleWindowDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleWindowDrag(e));
        document.addEventListener('mouseup', () => this.handleWindowDragEnd());

        document.addEventListener('touchstart', (e) => this.handleWindowDragStart(e.touches[0]), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleWindowDrag(e.touches[0]), { passive: false });
        document.addEventListener('touchend', () => this.handleWindowDragEnd());
    }

    playSound(id) {
        const sound = document.getElementById('sound-' + id);
        if (!sound) return;
        sound.currentTime = 0;
        sound.volume = this.settings.volume / 100;
        const cardInstalled = this.isPartInstalled('sound-pci');
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!this.audioContext) this.audioContext = new AudioCtx();
                let filter = this.audioFilters.get(sound);
                if (!filter) {
                    const source = this.audioContext.createMediaElementSource(sound);
                    filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    source.connect(filter); filter.connect(this.audioContext.destination);
                    this.audioFilters.set(sound, filter);
                }
                filter.frequency.setTargetAtTime(cardInstalled ? 18000 : 850, this.audioContext.currentTime, 0.04);
                this.audioContext.resume();
            } else if (!cardInstalled) { sound.volume *= 0.22; sound.playbackRate = 0.78; }
        } catch (error) { if (!cardInstalled) sound.volume *= 0.22; }
        sound.play().catch(() => {});
    }

    updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('clock').textContent = timeStr;
        const digital = document.querySelector('.clock-widget-digital');
        if (!digital) return;
        digital.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const date = document.querySelector('.clock-widget-date');
        if (date) date.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const seconds = now.getSeconds();
        const minutes = now.getMinutes() + seconds / 60;
        const hours = (now.getHours() % 12) + minutes / 60;
        const handAngles = { '.clock-second-hand': seconds * 6, '.clock-minute-hand': minutes * 6, '.clock-hour-hand': hours * 30 };
        Object.entries(handAngles).forEach(([selector, angle]) => { const hand = document.querySelector(selector); if (hand) hand.style.transform = `translateX(-50%) rotate(${angle}deg)`; });
    }

    renderDock() {
        const container = document.getElementById('dock-apps');
        const appsToDock = ['files', 'browser', 'pad', 'shell', 'calculator', 'sketch', 'settings'];

        appsToDock.forEach(key => {
            const app = this.apps[key];
            const div = document.createElement('div');
            div.className = 'dock-item';
            div.title = app.name;
            div.innerHTML = `<i data-lucide="${app.icon}"></i>`;
            div.onclick = () => this.openApp(key);
            container.appendChild(div);
        });
        createIcons({ icons });
    }

    updateOpenWindows() {
        const container = document.getElementById('open-windows');
        if (!container) return;
        container.innerHTML = '';
        this.windows.forEach(w => {
            const el = document.createElement('div');
            el.className = 'top-win-pill';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '6px';
            el.style.padding = '2px 6px';
            el.style.borderRadius = '12px';
            el.style.background = (w.element === this.activeWindow) ? 'rgba(0,0,0,0.06)' : 'transparent';
            el.style.cursor = 'pointer';
            el.title = this.apps[w.appKey]?.name || 'App';
            el.innerHTML = `<i data-lucide="${this.apps[w.appKey]?.icon || 'Monitor'}" size="12"></i><span style="font-size:12px; white-space:nowrap; max-width:110px; overflow:hidden; text-overflow:ellipsis;">${this.apps[w.appKey]?.name || 'App'}</span>`;
            el.onclick = (e) => {
                e.stopPropagation();
                if (w.element.style.display === 'none') w.element.style.display = '';
                this.setActive(w.element);
            };
            container.appendChild(el);
        });
        createIcons({ icons });
    }

    renderDesktopIcons() {
        const desktop = document.getElementById('desktop-icons');
        const icons = [
            { name: 'StoneDrive', icon: 'HardDrive', app: 'files', args: { path: ['StoneDrive'] } },
            { name: 'Readme', icon: 'FileText', app: 'pad', args: { path: ['Documents'], fileName: 'Readme.txt', content: 'Double click folders to browse.\n\nCreate files in the Navigator and the File menu, then read them in StoneShell with `cat`. Everything shares one file system.\n\nTry the StoneShell: type `help` and press Enter.' } }
        ];

        icons.forEach(icon => {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.innerHTML = `
                <div class="desktop-icon-img"><i data-lucide="${icon.icon}" color="white"></i></div>
                <div class="desktop-icon-label">${icon.name}</div>
            `;
            div.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
            };
            div.ondblclick = () => this.openApp(icon.app, icon.args);
            desktop.appendChild(div);
        });
    }

    /* ---------------- Window management ---------------- */

    openApp(key, args = {}) {
        const app = this.apps[key];
        if (!app) return;

        this.playSound('click');
        const winId = `win-${Date.now()}`;
        const win = document.createElement('div');
        win.className = 'window active';
        win.id = winId;
        win.dataset.appKey = key;

        const grey = this.windows.filter(w => w.element.style.display !== 'none').length;
        const offset = grey * 25;
        win.style.left = `${100 + (offset % 160)}px`;
        win.style.top = `${60 + (offset % 160)}px`;

        let w = 480, h = 360;
        if (key === 'files') { w = 520; h = 380; }
        if (key === 'browser') { w = 800; h = 590; }
        if (key === 'viewer') { w = 520; h = 400; }
        if (key === 'settings') { h = 420; }
        if (key === 'calculator') { w = 330; h = 450; }
        if (key === 'calendar') { w = 440; h = 500; }
        if (key === 'sketch') { w = 600; h = 440; }
        win.style.width = w + 'px';
        win.style.height = h + 'px';
        win.style.zIndex = ++this.zIndexCounter;

        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">
                    <i data-lucide="${app.icon}" size="14"></i>
                    <span class="win-title-text">${app.name}</span>
                </div>
                <div class="title-bar-controls">
                    <div class="win-btn min">_</div>
                    <div class="win-btn close">×</div>
                </div>
            </div>
            <div class="window-content"></div>
        `;

        const contentArea = win.querySelector('.window-content');
        const renderedContent = app.content(win, args);
        if (typeof renderedContent === 'string') {
            contentArea.innerHTML = renderedContent;
        } else if (renderedContent instanceof Node) {
            contentArea.appendChild(renderedContent);
        }

        document.getElementById('window-layer').appendChild(win);
        createIcons({ icons });

        this.windows.push({ id: winId, element: win, appKey: key });
        this.setActive(win);
        this.updateOpenWindows();

        const closeBtn = win.querySelector('.close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(winId);
        });

        const minBtn = win.querySelector('.min');
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(winId);
        });

        win.addEventListener('mousedown', () => this.setActive(win));
    }

    setActive(win) {
        if (!win) return;
        if (this.activeWindow && this.activeWindow !== win) this.activeWindow.classList.remove('active');
        this.activeWindow = win;
        win.classList.add('active');
        win.style.zIndex = ++this.zIndexCounter;

        document.getElementById('active-app-display').textContent = 'Apps';
        this.updateOpenWindows();
    }

    closeWindow(id) {
        const index = this.windows.findIndex(w => w.id === id);
        if (index > -1) {
            const wasActive = (this.windows[index].element === this.activeWindow);
            this.windows[index].element.remove();
            this.windows.splice(index, 1);
            if (wasActive) {
                if (this.windows.length > 0) {
                    const lastWin = this.windows[this.windows.length - 1].element;
                    this.setActive(lastWin);
                } else {
                    this.activeWindow = null;
                    document.getElementById('active-app-display').textContent = 'Apps';
                }
            }
            this.updateOpenWindows();
        }
    }

    minimizeWindow(id) {
        const winObj = this.windows.find(w => w.id === id);
        if (!winObj) return;
        const el = winObj.element;
        el.style.display = 'none';
        if (this.activeWindow === el) {
            const other = this.windows.find(w => w.element.style.display !== 'none');
            if (other) this.setActive(other.element);
            else {
                this.activeWindow = null;
                document.getElementById('active-app-display').textContent = 'Apps';
            }
        }
        this.updateOpenWindows();
    }

    /* ---------------- Window dragging ---------------- */

    handleWindowDragStart(e) {
        const titleBar = e.target.closest('.title-bar');
        if (!titleBar) return;
        const win = titleBar.parentElement;
        this.setActive(win);
        this.dragData = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    }

    handleWindowDrag(e) {
        if (!this.dragData) return;
        const { win, offsetX, offsetY } = this.dragData;
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;
        x = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, x));
        y = Math.max(0, Math.min(window.innerHeight - 60, y));
        win.style.left = `${x}px`;
        win.style.top = `${y}px`;
    }

    handleWindowDragEnd() {
        this.dragData = null;
    }

    /* ---------------- App: About ---------------- */

    getAboutContent() {
        const wrap = document.createElement('div');
        wrap.className = 'about-box about-system';
        wrap.innerHTML = '<img src="logo.png" alt="Clingstone"><h2>Clingstone OS</h2><p>Version 2.0.4 "Nectarine"</p><p class="about-copyright">&copy; 2002 Clingstone Computing Inc.</p><hr><ul class="about-specs about-system-parts"></ul><section class="about-hardware"><div class="about-install-row"><select aria-label="Purchased parts to install"></select><button type="button">Install</button></div><small class="about-install-status" aria-live="polite"></small></section>';
        const list = wrap.querySelector('.about-system-parts');
        const select = wrap.querySelector('select');
        const button = wrap.querySelector('button');
        const status = wrap.querySelector('.about-install-status');
        const names = {'cpu-p4-24':'Pentium 4 Northwood 2.4 GHz','cpu-p4-32':'Pentium 4 HT 3.2 GHz','cpu-athlon64':'Athlon 64 3200+','cpu-pd820':'Pentium D 820','cpu-core2e6400':'Core 2 Duo E6400','gpu-fx5200':'GeForce FX 5200 128MB','gpu-r9600':'Radeon 9600 Pro 256MB','gpu-6600gt':'GeForce 6600 GT 128MB','gpu-x1600':'Radeon X1600 XT 256MB','gpu-7600gt':'GeForce 7600 GT 256MB','gpu-8800gts':'GeForce 8800 GTS 320MB','ram-ddr512':'512MB DDR-400 DIMM','ram-ddr1':'1GB DDR-400 Kit','ram-ddr2-1':'1GB DDR2-667 Kit','ram-ddr2-2':'2GB DDR2-800 Kit','ram-ddr2-4':'4GB DDR2-800 Kit','board-478':'Socket 478 ATX Board','board-939':'Socket 939 ATX Board','board-775-ddr2':'Socket 775 DDR2 Board','board-p965':'P965 Core 2 Board','hdd-80ide':'80GB IDE Hard Drive','hdd-160sata':'160GB SATA Hard Drive','hdd-320sata':'320GB SATA Hard Drive','hdd-500sata':'500GB SATA Hard Drive','sound-pci':'PCI Sound Card','ethernet-pci':'10/100 PCI Internet Card'};
        const render = () => {
            list.replaceChildren();
            const installedBySlot = new Map(this.storeState.installed.map(id => [this.getPartSlot(id), id]));
            const builtInParts = [
                ['Processor', 'StoneProcessor X2'],
                ['Motherboard', 'Clingstone ATX Motherboard'],
                ['Memory', '512 MB RAM'],
                ['Graphics card', 'Clingstone Integrated Graphics'],
                ['Storage', '20 GB StoneDrive'],
                ['Audio', 'Clingstone Integrated Audio']
            ];
            const listedIds = new Set();
            builtInParts.forEach(([slot, builtInName]) => {
                const id = installedBySlot.get(slot);
                const item = document.createElement('li');
                item.textContent = slot + ': ' + (id ? (names[id] || id) : builtInName);
                list.appendChild(item);
                if (id) listedIds.add(id);
            });
            this.storeState.installed.filter(id => !listedIds.has(id)).forEach(id => {
                const item = document.createElement('li');
                item.textContent = (this.getPartSlot(id) || 'Part') + ': ' + (names[id] || id);
                list.appendChild(item);
            });
            select.replaceChildren();
            const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a purchased part…'; select.appendChild(placeholder);
            const installable = this.storeState.owned.filter(id => !this.storeState.installed.includes(id));
            installable.forEach(id => { const option = document.createElement('option'); option.value = id; option.textContent = names[id] || id; select.appendChild(option); });
            button.disabled = !installable.length;
            if (!installable.length) placeholder.textContent = this.storeState.owned.length ? 'All purchased parts installed' : 'Buy parts from pBay first';
        };
        button.addEventListener('click', () => {
            if (!select.value || !this.storeState.owned.includes(select.value) || this.storeState.installed.includes(select.value)) return;
            const slot = this.getPartSlot(select.value);
            if (slot) this.storeState.installed = this.storeState.installed.filter(id => this.getPartSlot(id) !== slot);
            this.storeState.installed.push(select.value);
            status.textContent = (names[select.value] || select.value) + ' installed';
            this.saveState();
            render();
        });
        render();
        return wrap;
    }

    getPartSlot(id) {
        if (id.startsWith('cpu-')) return 'Processor';
        if (id.startsWith('ram-')) return 'Memory';
        if (id.startsWith('hdd-')) return 'Storage';
        if (id.startsWith('gpu-')) return 'Graphics card';
        if (id.startsWith('board-')) return 'Motherboard';
        if (id.startsWith('sound-')) return 'Audio';
        if (id.startsWith('ethernet-')) return 'Internet card';
        return null;
    }

    isPartInstalled(id) { return Array.isArray(this.storeState.installed) && this.storeState.installed.includes(id); }
    hasInternetCard() { return this.isPartInstalled('ethernet-pci'); }

    /* ---------------- App: StonePad ---------------- */

    getPadContent(win, args = {}) {
        const dir = args.path || ['Documents'];
        const existingName = args.fileName || null;

        const wrap = document.createElement('div');
        wrap.className = 'pad-wrap';

        const bar = document.createElement('div');
        bar.className = 'pad-toolbar';

        const nameInput = document.createElement('input');
        nameInput.className = 'pad-name';
        nameInput.value = existingName || 'untitled.txt';
        nameInput.placeholder = 'Untitled';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'pad-btn';
        saveBtn.textContent = 'Save';
        saveBtn.innerHTML = `<i data-lucide="save" size="13"></i> Save`;

        const status = document.createElement('span');
        status.className = 'pad-status';
        status.textContent = dir.length ? dir.join('/') + '/' + (existingName || '') : '';

        bar.appendChild(nameInput);
        bar.appendChild(saveBtn);
        bar.appendChild(status);
        wrap.appendChild(bar);

        const ta = document.createElement('textarea');
        ta.className = 'stone-pad';
        ta.placeholder = 'Type your thoughts here...';
        ta.value = args.content || '';

        // If already a saved file, remember its node for in-place update
        let savedPath = null;
        if (existingName && this.getNode([...dir, existingName])) {
            savedPath = [...dir, existingName];
        }

        const save = () => {
            const name = (nameInput.value.trim() || 'untitled.txt').replace(/\.$/, '');
            const targetPath = savedPath && savedPath[savedPath.length - 1] === name
                ? savedPath
                : [...dir, name];
            if (!this.getNode(targetPath)) {
                this.writeFile(dir, name, ta.value);
                savedPath = [...dir, name];
            } else {
                // overwrite file content
                const node = this.getNode(targetPath);
                node.content = ta.value;
                this.saveState();
            }
            status.textContent = '\u2713 Saved ' + (dir.length ? dir.join('/') + '/' + name : name);
            this.playSound('click');
            win.querySelector('.win-title-text').textContent = `StonePad - ${name}`;
        };

        saveBtn.addEventListener('click', (e) => { e.stopPropagation(); save(); });
        saveBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        ta.addEventListener('keydown', (e) => {
            if (e.key === 's' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
        });

        wrap.appendChild(ta);

        win.querySelector('.win-title-text').textContent = `StonePad - ${nameInput.value}`;
        return wrap;
    }

    /* ---------------- App: StoneShell ---------------- */

    getShellContent() {
        const wrap = document.createElement('div');
        wrap.className = 'term-content';

        const output = document.createElement('div');
        output.className = 'term-output';

        const line = document.createElement('div');
        line.className = 'term-line';
        const prompt = document.createElement('span');
        prompt.className = 'term-prompt';
        const input = document.createElement('input');
        input.className = 'term-input';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.setAttribute('autocorrect', 'off');
        line.appendChild(prompt);
        line.appendChild(input);

        wrap.appendChild(output);
        wrap.appendChild(line);

        const term = { cwd: [], history: [], histIdx: 0 };

        const banner = () => {
            this.print(output, 'Clingstone StoneShell [Version 2.0.4]');
            this.print(output, '(c) 2002 Clingstone Corp. All rights reserved.');
            this.print(output, 'Type `help` for a list of commands.', 'muted');
            this.print(output, '');
        };
        banner();

        const refreshPrompt = () => {
            const p = term.cwd.length ? '/' + term.cwd.join('/') : '/';
            prompt.textContent = `guest@clingstone:${p}> `;
        };
        refreshPrompt();

        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                const cmd = input.value;
                this.print(output, `guest@clingstone:${term.cwd.length ? '/' + term.cwd.join('/') : '/'}> ${cmd}`);
                if (cmd.trim()) {
                    term.history.unshift(cmd);
                    term.histIdx = 0;
                    this.runCommand(term, cmd, output, refreshPrompt);
                }
                input.value = '';
                wrap.scrollTop = wrap.scrollHeight;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (term.history.length) {
                    term.histIdx = Math.min(term.histIdx + 1, term.history.length);
                    input.value = term.history[term.histIdx - 1];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                term.histIdx = Math.max(term.histIdx - 1, 0);
                input.value = term.histIdx ? term.history[term.histIdx - 1] : '';
            }
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') term.histIdx = 0;
        });

        wrap.addEventListener('click', () => input.focus());
        setTimeout(() => input.focus(), 50);

        return wrap;
    }

    print(output, text, cls) {
        const div = document.createElement('div');
        div.textContent = text;
        if (cls) div.className = cls;
        output.appendChild(div);
    }

    normalizePath(base, input) {
        const segs = input.split('/').filter(s => s.length);
        const arr = input.startsWith('/') ? [] : [...base];
        for (const s of segs) {
            if (s === '.') continue;
            if (s === '..') { if (arr.length) arr.pop(); continue; }
            arr.push(s);
        }
        return arr;
    }

    runCommand(term, cmd, output, refreshPrompt) {
        const parts = cmd.trim().match(/"[^"]*"|'[^']*'|\S+/g) || [];
        const args = parts.map(p => p.replace(/^['"]|['"]$/g, ''));
        const op = (args.shift() || '').toLowerCase();

        const print = (t) => this.print(output, t);
        const printErr = (t) => this.print(output, t, 'err');

        switch (op) {
            case 'help':
                print('Available commands:');
                this.print(output, [
                    '  help              show this help',
                    '  ls [path]         list directory contents',
                    '  cd <path>         change directory',
                    '  pwd               print working directory',
                    '  cat <file>        print file contents',
                    '  mkdir <name>      create a folder',
                    '  touch <name>      create an empty file',
                    '  write <name> <..> write text to a file',
                    '  rm <path>         permanently delete a file/folder',
                    '  open <path>       open a file or app',
                    '  date              show the date and time',
                    '  ver               show system version',
                    '  clear             clear the screen',
                    '  exit              close the terminal'
                ], 'muted');
                break;

            case 'ls':
            case 'dir': {
                const p = args.length ? this.normalizePath(term.cwd, args[0]) : term.cwd;
                const node = this.getNode(p);
                if (!node || !node.items) { printErr(`ls: cannot access '${p.join('/') || '/'}': No such directory`); break; }
                const ents = Object.entries(node.items);
                if (!ents.length) { print(''); break; }
                ents.forEach(([name, n]) => {
                    this.print(output, (n.type === 'folder' ? name + '/' : name) + (n.type === 'image' ? '  [image]' : n.type === 'app' ? '  [app]' : n.type === 'file' ? '' : ''), n.type === 'folder' ? 'dir' : '');
                });
                break;
            }

            case 'cd': {
                if (!args.length) { term.cwd = []; if (refreshPrompt) refreshPrompt(); break; }
                const p = this.normalizePath(term.cwd, args[0]);
                const node = this.getNode(p);
                if (!node || !node.items) { printErr(`cd: no such directory: ${args[0]}`); break; }
                term.cwd = p;
                if (refreshPrompt) refreshPrompt();
                break;
            }

            case 'pwd':
                print('/' + term.cwd.join('/'));
                break;

            case 'cat': {
                if (!args.length) { printErr('usage: cat <file>'); break; }
                const p = this.normalizePath(term.cwd, args[0]);
                const node = this.getNode(p);
                if (!node) { printErr(`cat: no such file: ${args[0]}`); break; }
                if (node.type === 'file') print(String(node.content || ''));
                else if (node.type === 'image') print(`[image: ${node.name || args[0]}] Type 'open ${args[0]}' to view it.`);
                else printErr(`cat: ${args[0]} is a directory`);
                break;
            }

            case 'mkdir': {
                if (!args.length) { printErr('usage: mkdir <name>'); break; }
                if (this.getNode([...term.cwd, args[0]])) { printErr(`mkdir: already exists: ${args[0]}`); break; }
                this.createFolder(term.cwd, args[0]);
                print('');
                break;
            }

            case 'touch': {
                if (!args.length) { printErr('usage: touch <name>'); break; }
                const p = this.normalizePath(term.cwd, args[0]);
                if (this.getNode(p)) break;
                this.writeFile(p.slice(0, -1), p[p.length - 1], '');
                break;
            }

            case 'write': {
                if (args.length < 2) { printErr('usage: write <name> <text...>'); break; }
                const p = this.normalizePath(term.cwd, args[0]);
                this.writeFile(p.slice(0, -1), p[p.length - 1], args.slice(1).join(' '));
                break;
            }

            case 'rm': {
                if (!args.length) { printErr('usage: rm <path>'); break; }
                const p = this.normalizePath(term.cwd, args[0]);
                if (!p.length) { printErr('rm: cannot remove root'); break; }
                if (!this.getNode(p)) { printErr(`rm: no such file: ${args[0]}`); break; }
                this.rm(p);
                break;
            }

            case 'open': {
                if (!args.length) { printErr('usage: open <path>'); break; }
                const p = this.normalizePath(term.cwd, args[0]);
                const node = this.getNode(p);
                if (!node) { printErr(`open: no such file: ${args[0]}`); break; }
                const name = p[p.length - 1];
                if (node.type === 'file') this.openApp('pad', { path: p.slice(0, -1), fileName: name, content: node.content });
                else if (node.type === 'image') this.openApp('viewer', { src: node.src, name: node.name || name });
                else if (node.type === 'app') this.openApp(node.app);
                else printErr(`open: ${name} is a directory`);
                break;
            }

            case 'date':
                print(new Date().toString());
                break;

            case 'ver':
                print('Clingstone OS Version 2.0.4 "Nectarine"');
                break;

            case 'clear':
            case 'cls':
                output.innerHTML = '';
                break;

            case 'exit': {
                const win = output.closest('.window');
                if (win) this.closeWindow(win.id);
                break;
            }

            case '':
                break;

            default:
                printErr(`${op}: command not found. Type 'help' for a list.`);
        }
        output.scrollTop = output.scrollHeight;
    }

    /* ---------------- App: Navigator (Files) ---------------- */

    getFilesContent(win, args = {}) {
        const container = document.createElement('div');
        container.style.display = 'contents';

        const toolbar = document.createElement('div');
        toolbar.className = 'navigator-toolbar';

        const btnBack = document.createElement('button');
        btnBack.className = 'tool-btn';
        btnBack.title = 'Back';
        btnBack.innerHTML = '<i data-lucide="chevron-left"></i>';
        const btnFwd = document.createElement('button');
        btnFwd.className = 'tool-btn';
        btnFwd.title = 'Forward';
        btnFwd.innerHTML = '<i data-lucide="chevron-right"></i>';
        btnFwd.classList.add('disabled');

        const pathEl = document.createElement('span');
        pathEl.className = 'path-display';
        const search = document.createElement('input');
        search.className = 'navigator-search';
        search.type = 'search';
        search.placeholder = 'Find in folder';
        search.setAttribute('aria-label', 'Find files in this folder');

        toolbar.appendChild(btnBack);
        toolbar.appendChild(btnFwd);
        toolbar.appendChild(pathEl);
        toolbar.appendChild(search);
        container.appendChild(toolbar);

        const grid = document.createElement('div');
        grid.className = 'navigator-grid';
        container.appendChild(grid);

        const statusbar = document.createElement('div');
        statusbar.className = 'navigator-statusbar';
        container.appendChild(statusbar);

        const history = { back: [], fwd: [] };
        let currentPath = args.path || [];

        const iconFor = (info) => {
            if (info.type === 'folder') return 'Folder';
            if (info.type === 'file') return 'FileText';
            if (info.type === 'image') return 'Image';
            if (info.type === 'app') return this.apps[info.app]?.icon || 'Monitor';
            return 'File';
        };

        const render = () => {
            grid.innerHTML = '';
            pathEl.textContent = '/' + currentPath.join('/');
            const node = this.getNode(currentPath);
            const allEntries = node && node.items ? Object.entries(node.items) : [];
            const query = search.value.trim().toLocaleLowerCase();
            const entries = query ? allEntries.filter(([name]) => name.toLocaleLowerCase().includes(query)) : allEntries;

            statusbar.textContent = entries.length + ' item' + (entries.length === 1 ? '' : 's');

            btnBack.disabled = !history.back.length;
            btnFwd.disabled = !history.fwd.length;
            btnBack.classList.toggle('disabled', btnBack.disabled);
            btnFwd.classList.toggle('disabled', btnFwd.disabled);

            if (currentPath.length && !node) {
                const msg = document.createElement('div');
                msg.className = 'nav-empty';
                msg.textContent = 'Nothing here (moved to Trash).';
                grid.appendChild(msg);
                return;
            }

            if (!entries.length) {
                const msg = document.createElement('div');
                msg.className = 'nav-empty';
                msg.textContent = 'This folder is empty.';
                grid.appendChild(msg);
            }

            entries.forEach(([name, info]) => {
                const item = document.createElement('div');
                item.className = 'nav-item';
                const imgFrom = (info.type === 'image') ? `<img class="nav-thumb" src="${info.src}" onerror="this.style.display='none'">` : `<i data-lucide="${iconFor(info)}" color="${info.type === 'folder' ? '#e2c18d' : info.type === 'app' ? '#ffb38a' : '#666'}"></i>`;
                item.innerHTML = `<div class="nav-icon">${imgFrom}</div><div class="nav-label">${name}${info.type === 'folder' ? '' : ''}</div>`;

                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    grid.querySelectorAll('.nav-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                });

                item.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    if (info.type === 'folder') {
                        history.back.unshift([...currentPath]);
                        history.fwd = [];
                        currentPath = [...currentPath, name];
                    } else if (info.type === 'file') {
                        this.openApp('pad', { path: currentPath, fileName: name, content: info.content });
                    } else if (info.type === 'app') {
                        this.openApp(info.app);
                    } else if (info.type === 'image') {
                        this.openApp('viewer', { src: info.src, name: info.name || name });
                    }
                    if (info.type === 'folder') render();
                });

                grid.appendChild(item);
            });
            createIcons({ icons });
        };

        btnBack.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!history.back.length) return;
            history.fwd.unshift([...currentPath]);
            currentPath = history.back.shift() || [];
            render();
        });
        btnFwd.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!history.fwd.length) return;
            history.back.unshift([...currentPath]);
            currentPath = history.fwd.shift() || [];
            render();
        });
        search.addEventListener('input', render);

        const btnRow = document.createElement('div');
        btnRow.className = 'navigator-actions';
        const addBtn = (label, icon, fn) => {
            const b = document.createElement('button');
            b.className = 'nav-action-btn';
            b.innerHTML = '<i data-lucide="' + icon + '" size="12"></i> ' + label;
            b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
            b.addEventListener('mousedown', (e) => e.stopPropagation());
            btnRow.appendChild(b);
            return b;
        };
        const selectedName = () => grid.querySelector('.nav-item.selected')?.querySelector('.nav-label')?.textContent || null;
        const inTrash = currentPath.length === 1 && currentPath[0] === 'Trash';
        if (!inTrash) {
            addBtn('New Folder', 'folder-plus', () => this.newEntry(win, 'folder', currentPath, render));
            addBtn('New File', 'file-plus', () => this.newEntry(win, 'file', currentPath, render));
        }
        addBtn('Rename', 'pencil', () => {
            const oldName = selectedName();
            if (!oldName) return;
            const nextName = prompt('Rename item:', oldName);
            if (!nextName || nextName === oldName) return;
            const clean = nextName.replace(/[\/:*?"<>|]/g, '').trim();
            const folder = this.getNode(currentPath);
            if (!clean || !folder?.items || folder.items[clean]) { alert('That name is unavailable.'); return; }
            folder.items[clean] = folder.items[oldName];
            delete folder.items[oldName];
            this.saveState();
            render();
        });
        if (inTrash) {
            addBtn('Restore', 'undo-2', () => {
                const name = selectedName();
                if (!name) return;
                const trash = this.getNode(['Trash']);
                const item = trash.items[name];
                const destination = item?._trashPath && this.getNode(item._trashPath)?.items ? item._trashPath : ['Documents'];
                const dest = this.getNode(destination).items;
                let restoredName = name;
                let suffix = 2;
                while (dest[restoredName]) restoredName = 'Restored ' + suffix++ + ' ' + name;
                delete item._trashPath;
                dest[restoredName] = item;
                delete trash.items[name];
                this.saveState();
                render();
            });
            addBtn('Empty Trash', 'trash-2', () => {
                const trash = this.getNode(['Trash']);
                if (Object.keys(trash.items).length && confirm('Permanently delete everything in Trash?')) {
                    trash.items = {};
                    this.saveState();
                    render();
                }
            });
        } else {
            addBtn('Move to Trash', 'trash-2', () => {
                const name = selectedName();
                if (!name || !this.getNode([...currentPath, name])) return;
                if (confirm('Move "' + name + '" to Trash?')) {
                    this.moveToTrash([...currentPath, name]);
                    this.playSound('click');
                    render();
                }
            });
        }
        container.appendChild(btnRow);
        render();
        return container;
    }

    newEntry(win, kind, dir, done) {
        const name = prompt(kind === 'folder' ? 'Folder name:' : 'File name:');
        if (!name) return;
        const clean = name.replace(/[\\/:*?"<>|]/g, '');
        if (!clean) return;
        if (this.getNode([...dir, clean])) { alert('An item with that name already exists.'); return; }
        if (kind === 'folder') this.createFolder(dir, clean);
        else this.writeFile(dir, clean, '');
        this.playSound('click');
        done();
    }

    /* ---------------- App: Photo Viewer ---------------- */

    getViewerContent(win, args = {}) {
        const wrap = document.createElement('div');
        wrap.className = 'viewer-wrap';
        const img = document.createElement('img');
        img.className = 'viewer-img';
        img.src = args.src || '';
        img.alt = args.name || 'image';
        const cap = document.createElement('div');
        cap.className = 'viewer-cap';
        cap.textContent = args.name || 'Image';
        wrap.appendChild(img);
        wrap.appendChild(cap);
        win.querySelector('.win-title-text').textContent = `Photo Viewer - ${args.name || 'Image'}`;
        return wrap;
    }

    /* ---------------- Apps: PocketCalc, Daybook, Sketchpad ---------------- */

    getCalculatorContent() {
        const wrap = document.createElement('div');
        wrap.className = 'calculator-wrap';
        wrap.tabIndex = 0;
        const display = document.createElement('output');
        display.className = 'calculator-display';
        display.setAttribute('aria-live', 'polite');
        wrap.appendChild(display);
        const keypad = document.createElement('div');
        keypad.className = 'calculator-keypad';
        const keys = ['AC','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='];
        let current = '0';
        let stored = null;
        let operation = null;
        let replaceCurrent = false;
        const update = () => { display.textContent = current; };
        const compute = (a, b, op) => {
            if (op === '+') return a + b;
            if (op === '−') return a - b;
            if (op === '×') return a * b;
            if (op === '÷') return b === 0 ? NaN : a / b;
            return b;
        };
        const act = (key) => {
            if (/^\d$/.test(key)) {
                if (replaceCurrent || current === '0' || current === 'Error') current = key;
                else if (current.length < 13) current += key;
                replaceCurrent = false;
            } else if (key === '.') {
                if (replaceCurrent || current === 'Error') { current = '0.'; replaceCurrent = false; }
                else if (!current.includes('.')) current += '.';
            } else if (key === 'AC') {
                current = '0'; stored = null; operation = null; replaceCurrent = false;
            } else if (key === '⌫') {
                current = replaceCurrent ? '0' : (current.length > 1 ? current.slice(0, -1) : '0');
                replaceCurrent = false;
            } else if (key === '±') {
                if (current !== '0' && current !== 'Error') current = String(-Number(current));
            } else if (key === '%') {
                if (current !== 'Error') current = String(Number(current) / 100);
            } else if (['+','−','×','÷'].includes(key)) {
                const value = Number(current);
                if (stored !== null && operation && !replaceCurrent) {
                    const result = compute(stored, value, operation);
                    current = Number.isFinite(result) ? String(Number(result.toPrecision(11))) : 'Error';
                }
                stored = current === 'Error' ? null : Number(current);
                operation = key;
                replaceCurrent = true;
            } else if (key === '=' && operation && stored !== null) {
                const result = compute(stored, Number(current), operation);
                current = Number.isFinite(result) ? String(Number(result.toPrecision(11))) : 'Error';
                stored = null; operation = null; replaceCurrent = true;
            }
            update();
        };
        keys.forEach((key) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'calculator-key' + (['÷','×','−','+','='].includes(key) ? ' operator' : '') + (key === 'AC' ? ' utility' : '');
            button.textContent = key;
            button.setAttribute('aria-label', key === '⌫' ? 'Backspace' : key);
            button.addEventListener('click', () => act(key));
            keypad.appendChild(button);
        });
        wrap.appendChild(keypad);
        wrap.addEventListener('keydown', (event) => {
            event.stopPropagation();
            if (/^\d$/.test(event.key)) act(event.key);
            else if (event.key === '.') act('.');
            else if (event.key === 'Enter' || event.key === '=') act('=');
            else if (event.key === 'Backspace') act('⌫');
            else if (event.key === 'Escape') act('AC');
            else if (event.key === '+') act('+');
            else if (event.key === '-') act('−');
            else if (event.key === '*') act('×');
            else if (event.key === '/') { event.preventDefault(); act('÷'); }
        });
        update();
        requestAnimationFrame(() => wrap.focus());
        return wrap;
    }

    getCalendarContent() {
        const wrap = document.createElement('div');
        wrap.className = 'calendar-wrap';
        const header = document.createElement('div');
        header.className = 'calendar-header';
        const prev = document.createElement('button');
        prev.type = 'button'; prev.className = 'calendar-nav'; prev.textContent = '‹'; prev.setAttribute('aria-label', 'Previous month');
        const title = document.createElement('strong');
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'calendar-nav'; next.textContent = '›'; next.setAttribute('aria-label', 'Next month');
        header.append(prev, title, next);
        const grid = document.createElement('div'); grid.className = 'calendar-grid';
        const details = document.createElement('section'); details.className = 'calendar-details';
        const chosenHeading = document.createElement('h3');
        const eventList = document.createElement('div'); eventList.className = 'calendar-events';
        const add = document.createElement('button'); add.type = 'button'; add.className = 'calendar-add'; add.textContent = '+ Add note';
        details.append(chosenHeading, eventList, add);
        wrap.append(header, grid, details);
        const now = new Date();
        let month = new Date(now.getFullYear(), now.getMonth(), 1);
        let selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const keyFor = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
        const render = () => {
            title.textContent = month.toLocaleDateString([], { month: 'long', year: 'numeric' });
            grid.innerHTML = '';
            ['S','M','T','W','T','F','S'].forEach((day) => {
                const label = document.createElement('span'); label.className = 'calendar-weekday'; label.textContent = day; grid.appendChild(label);
            });
            const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
            const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
            for (let i = 0; i < firstDay; i++) { const blank = document.createElement('span'); blank.className = 'calendar-blank'; grid.appendChild(blank); }
            for (let day = 1; day <= days; day++) {
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'calendar-day'; cell.textContent = String(day);
                if (keyFor(date) === keyFor(now)) cell.classList.add('today');
                if (keyFor(date) === keyFor(selected)) cell.classList.add('selected');
                if (this.calendarEvents[keyFor(date)]?.length) cell.classList.add('has-event');
                cell.setAttribute('aria-label', date.toLocaleDateString([], { dateStyle: 'full' }));
                cell.addEventListener('click', () => { selected = date; render(); });
                grid.appendChild(cell);
            }
            chosenHeading.textContent = selected.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
            eventList.innerHTML = '';
            const key = keyFor(selected);
            const events = this.calendarEvents[key] || [];
            if (!events.length) {
                const empty = document.createElement('p'); empty.className = 'calendar-empty'; empty.textContent = 'Nothing planned'; eventList.appendChild(empty);
            }
            events.forEach((eventText, index) => {
                const row = document.createElement('div'); row.className = 'calendar-event';
                const text = document.createElement('span'); text.textContent = eventText;
                const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Remove note');
                remove.addEventListener('click', () => { events.splice(index, 1); if (!events.length) delete this.calendarEvents[key]; this.saveState(); render(); });
                row.append(text, remove); eventList.appendChild(row);
            });
        };
        prev.addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); render(); });
        next.addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); render(); });
        add.addEventListener('click', () => {
            const note = prompt('Add a note for this day:');
            if (!note?.trim()) return;
            const key = keyFor(selected);
            if (!this.calendarEvents[key]) this.calendarEvents[key] = [];
            this.calendarEvents[key].push(note.trim().slice(0, 120));
            this.saveState(); render();
        });
        render();
        return wrap;
    }

    getSketchContent() {
        const wrap = document.createElement('div'); wrap.className = 'sketch-wrap';
        const toolbar = document.createElement('div'); toolbar.className = 'sketch-toolbar';
        const canvasArea = document.createElement('div'); canvasArea.className = 'sketch-canvas-wrap';
        const canvas = document.createElement('canvas'); canvas.className = 'sketch-canvas'; canvas.setAttribute('aria-label', 'Drawing canvas'); canvasArea.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        let color = '#252525'; let drawing = false; let initialized = false;
        const palette = [['#252525','Ink'],['#ef785f','Coral'],['#3978c5','Blue'],['#58a66a','Leaf']];
        palette.forEach(([value, label], index) => {
            const swatch = document.createElement('button'); swatch.type = 'button'; swatch.className = 'sketch-swatch' + (index === 0 ? ' selected' : '');
            swatch.style.setProperty('--swatch', value); swatch.title = label; swatch.setAttribute('aria-label', label);
            swatch.addEventListener('click', () => { color = value; toolbar.querySelectorAll('.sketch-swatch').forEach((item) => item.classList.remove('selected')); swatch.classList.add('selected'); });
            toolbar.appendChild(swatch);
        });
        const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'sketch-tool-btn'; clear.textContent = 'Clear';
        clear.addEventListener('click', () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); });
        const save = document.createElement('button'); save.type = 'button'; save.className = 'sketch-tool-btn'; save.textContent = 'Save to Pictures';
        save.addEventListener('click', () => {
            const folder = this.getNode(['Pictures']);
            const stamp = new Date().toISOString().slice(0, 10);
            let name = 'Sketch ' + stamp + '.png'; let suffix = 2;
            while (folder.items[name]) name = 'Sketch ' + stamp + ' ' + suffix++ + '.png';
            folder.items[name] = { type: 'image', src: canvas.toDataURL('image/png'), name };
            this.saveState(); this.playSound('click');
            save.textContent = 'Saved!'; setTimeout(() => { save.textContent = 'Save to Pictures'; }, 1300);
        });
        toolbar.append(clear, save);
        wrap.append(toolbar, canvasArea);
        const resize = () => {
            const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
            const oldImage = initialized ? canvas.toDataURL() : null;
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, rect.width, rect.height);
            if (oldImage) { const image = new Image(); image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height); image.src = oldImage; }
            initialized = true;
        };
        requestAnimationFrame(resize);
        if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvasArea);
        canvas.addEventListener('pointerdown', (event) => {
            event.preventDefault(); canvas.setPointerCapture(event.pointerId); drawing = true;
            const rect = canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
        });
        canvas.addEventListener('pointermove', (event) => {
            if (!drawing) return; const rect = canvas.getBoundingClientRect();
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top); ctx.stroke();
        });
        const stopDrawing = () => { drawing = false; };
        canvas.addEventListener('pointerup', stopDrawing); canvas.addEventListener('pointercancel', stopDrawing);
        return wrap;
    }

    /* ---------------- App: Browser ---------------- */

    getBrowserContent() {
        const wrap = document.createElement('div');
        wrap.className = 'image-browser';
        wrap.innerHTML = `
            <section class="browser-homepage">
                <div class="browser-home-center">
                    <div class="browser-home-brand"><span class="browser-home-brand-icon"><i data-lucide="images"></i></span><h1>Clingstone Browser</h1></div>
                    <form class="browser-home-search" role="search">
                        <span class="browser-lock" aria-hidden="true">⌕</span>
                        <input class="browser-home-query" type="search" placeholder="Search millions of free images…" aria-label="Search images" autocomplete="off">
                        <button class="browser-search-button" type="submit" aria-label="Search images"><i data-lucide="search"></i></button>
                    </form>
                    <div class="browser-net-warning" aria-live="polite"></div>
                    <div class="browser-shortcuts" aria-label="Sites">
                        <button type="button" class="browser-shortcut sbay-shortcut" id="browser-sbay-shortcut">
                            <span class="browser-shortcut-icon sbay-mark">pB</span>
                            <span class="browser-shortcut-copy"><strong>pBay</strong><small>System parts marketplace</small></span>
                            <i class="browser-shortcut-arrow" data-lucide="arrow-up-right"></i>
                        </button>
                    </div>
                </div>
            </section>
            <section class="browser-image-page" hidden>
                <div class="browser-image-header"><button type="button" class="browser-home-button" aria-label="Back to browser home" title="Home"><i data-lucide="house"></i></button><strong>Image Search</strong></div>
                <form class="browser-searchbar" role="search">
                    <span class="browser-lock" aria-hidden="true">⌕</span>
                    <input class="browser-query" type="search" placeholder="Search millions of free images…" value="" aria-label="Search images" autocomplete="off">
                    <button class="browser-search-button" type="submit" aria-label="Search"><i data-lucide="search"></i></button>
                </form>
                <div class="browser-meta"><span class="browser-status">Search Wikimedia Commons</span><span class="browser-source">Free images · Commons</span></div>
                <div class="browser-results" aria-live="polite"></div>
                <button type="button" class="browser-more" hidden>Load more images</button>
            </section>
            <section class="browser-sbay-page" hidden>
                <header class="sbay-header">
                    <button type="button" class="browser-home-button sbay-home-button" aria-label="Back to browser home" title="Home"><i data-lucide="house"></i></button>
                    <div class="sbay-brand"><span class="sbay-logo">pBay</span><span>System parts</span></div>
                    <div class="sbay-wallet"><small>Wallet balance</small><strong class="sbay-balance">$50,000</strong></div>
                </header>
                <div class="sbay-toolbar">
                    <input class="sbay-search" type="search" placeholder="Search parts…" aria-label="Search parts">
                    <select class="sbay-category" aria-label="Filter by category"><option value="all">All categories</option><option>Processors</option><option>Graphics</option><option>Memory</option><option>Motherboards</option><option>Storage</option><option>Sound</option><option>Network</option></select>
                    <button type="button" class="sbay-owned-toggle">My parts</button>
                </div>
                <div class="sbay-message" aria-live="polite"></div>
                <div class="sbay-grid" aria-live="polite"></div>
            </section>
        `;
        const homepage = wrap.querySelector('.browser-homepage');
        const imagePage = wrap.querySelector('.browser-image-page');
        const homeSearch = wrap.querySelector('.browser-home-search');
        const homeQuery = wrap.querySelector('.browser-home-query');
        const form = wrap.querySelector('.browser-searchbar');
        const input = wrap.querySelector('.browser-query');
        const storePage = wrap.querySelector('.browser-sbay-page');
        const storeSearch = wrap.querySelector('.sbay-search');
        const storeCategory = wrap.querySelector('.sbay-category');
        const storeGrid = wrap.querySelector('.sbay-grid');
        const storeBalance = wrap.querySelector('.sbay-balance');
        const storeMessage = wrap.querySelector('.sbay-message');
        const storeOwnedToggle = wrap.querySelector('.sbay-owned-toggle');
        const noInternetMessage = 'No Internet Card found, try buying one from pBay';
        const homeWarning = wrap.querySelector('.browser-net-warning');
        homeWarning.textContent = this.hasInternetCard() ? '' : noInternetMessage;
        homeWarning.hidden = this.hasInternetCard();
        const beginImageSearch = (term) => {
            const query = term.trim();
            homeWarning.textContent = this.hasInternetCard() ? '' : noInternetMessage;
            homeWarning.hidden = this.hasInternetCard();
            if (!this.hasInternetCard()) { homeWarning.textContent = noInternetMessage; homeWarning.hidden = false; return; }
            if (!query) { homeQuery.focus(); return; }
            homepage.hidden = true; imagePage.hidden = false; storePage.hidden = true; input.value = query;
            search(query);
        };
        homeSearch.addEventListener('submit', (event) => { event.preventDefault(); beginImageSearch(homeQuery.value); });
        wrap.querySelector('#browser-sbay-shortcut').addEventListener('click', () => { homepage.hidden = true; imagePage.hidden = true; storePage.hidden = false; renderStore(); });
        wrap.querySelector('.browser-home-button').addEventListener('click', () => { imagePage.hidden = true; homepage.hidden = false; });
        wrap.querySelector('.sbay-home-button').addEventListener('click', () => { storePage.hidden = true; homepage.hidden = false; });
        const results = wrap.querySelector('.browser-results');
        const status = wrap.querySelector('.browser-status');
        const more = wrap.querySelector('.browser-more');
        const storeProducts = [
            {id:'cpu-p4-24',name:'Pentium 4 Northwood 2.4 GHz',category:'Processors',price:55,icon:'cpu',desc:'Socket 478 · single core'},
            {id:'cpu-p4-32',name:'Pentium 4 HT 3.2 GHz',category:'Processors',price:125,icon:'cpu',desc:'Socket 478 · Hyper-Threading'},
            {id:'cpu-athlon64',name:'Athlon 64 3200+',category:'Processors',price:110,icon:'cpu',desc:'Socket 939 · 2.0 GHz'},
            {id:'cpu-pd820',name:'Pentium D 820',category:'Processors',price:160,icon:'cpu',desc:'Socket 775 · dual core · 2.8 GHz'},
            {id:'cpu-core2e6400',name:'Core 2 Duo E6400',category:'Processors',price:240,icon:'cpu',desc:'Socket 775 · dual core · 2.13 GHz'},
            {id:'gpu-fx5200',name:'GeForce FX 5200 128MB',category:'Graphics',price:35,icon:'monitor',desc:'AGP 8× · VGA / DVI'},
            {id:'gpu-r9600',name:'Radeon 9600 Pro 256MB',category:'Graphics',price:65,icon:'monitor',desc:'AGP 8× · DirectX 9'},
            {id:'gpu-6600gt',name:'GeForce 6600 GT 128MB',category:'Graphics',price:105,icon:'monitor',desc:'PCIe · GDDR3'},
            {id:'gpu-x1600',name:'Radeon X1600 XT 256MB',category:'Graphics',price:145,icon:'monitor',desc:'PCIe · dual display'},
            {id:'gpu-7600gt',name:'GeForce 7600 GT 256MB',category:'Graphics',price:195,icon:'monitor',desc:'PCIe · quiet cooler'},
            {id:'gpu-8800gts',name:'GeForce 8800 GTS 320MB',category:'Graphics',price:375,icon:'monitor',desc:'PCIe · Vista-era enthusiast'},
            {id:'ram-ddr512',name:'512MB DDR-400 DIMM',category:'Memory',price:18,icon:'memory-stick',desc:'PC-3200 · desktop memory'},
            {id:'ram-ddr1',name:'1GB DDR-400 Kit',category:'Memory',price:38,icon:'memory-stick',desc:'2 × 512MB · PC-3200'},
            {id:'ram-ddr2-1',name:'1GB DDR2-667 Kit',category:'Memory',price:42,icon:'memory-stick',desc:'2 × 512MB · PC2-5300'},
            {id:'ram-ddr2-2',name:'2GB DDR2-800 Kit',category:'Memory',price:78,icon:'memory-stick',desc:'2 × 1GB · PC2-6400'},
            {id:'ram-ddr2-4',name:'4GB DDR2-800 Kit',category:'Memory',price:145,icon:'memory-stick',desc:'2 × 2GB · Vista-ready'},
            {id:'board-478',name:'Socket 478 ATX Board',category:'Motherboards',price:85,icon:'circuit-board',desc:'DDR · AGP 8× · IDE'},
            {id:'board-939',name:'Socket 939 ATX Board',category:'Motherboards',price:115,icon:'circuit-board',desc:'DDR · PCIe · SATA'},
            {id:'board-775-ddr2',name:'Socket 775 DDR2 Board',category:'Motherboards',price:125,icon:'circuit-board',desc:'DDR2 · PCIe · SATA'},
            {id:'board-p965',name:'P965 Core 2 Board',category:'Motherboards',price:185,icon:'circuit-board',desc:'Socket 775 · DDR2 · PCIe'},
            {id:'hdd-80ide',name:'80GB IDE Hard Drive',category:'Storage',price:35,icon:'hard-drive',desc:'7,200 RPM · PATA'},
            {id:'hdd-160sata',name:'160GB SATA Hard Drive',category:'Storage',price:48,icon:'hard-drive',desc:'7,200 RPM · SATA II'},
            {id:'hdd-320sata',name:'320GB SATA Hard Drive',category:'Storage',price:72,icon:'hard-drive',desc:'7,200 RPM · 16MB cache'},
            {id:'hdd-500sata',name:'500GB SATA Hard Drive',category:'Storage',price:115,icon:'hard-drive',desc:'7,200 RPM · 16MB cache'},
            {id:'sound-pci',name:'PCI Sound Card',category:'Sound',price:22,icon:'volume-2',desc:'5.1 audio · line-in'},
            {id:'ethernet-pci',name:'10/100 PCI Internet Card',category:'Network',price:14,icon:'network',desc:'RJ-45 · Wake-on-LAN'},
        ];
        let onlyOwnedParts = false;
        const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
        const renderStore = (notice = '') => {
            const query = storeSearch.value.trim().toLowerCase();
            const category = storeCategory.value;
            const products = storeProducts.filter(product => (!onlyOwnedParts || this.storeState.owned.includes(product.id)) && (category === 'all' || product.category === category) && (!query || `${product.name} ${product.category} ${product.desc}`.toLowerCase().includes(query)));
            storeBalance.textContent = money(this.storeState.balance);
            storeOwnedToggle.textContent = onlyOwnedParts ? 'All parts' : `My parts (${this.storeState.owned.length})`;
            storeMessage.textContent = notice || `${products.length} ${products.length === 1 ? 'part' : 'parts'}`;
            storeGrid.innerHTML = '';
            products.forEach(product => {
                const owned = this.storeState.owned.includes(product.id);
                const card = document.createElement('article'); card.className = 'sbay-product';
                card.innerHTML = `<div class="sbay-product-art"><i data-lucide="${product.icon}"></i><span>${product.category}</span></div><h3></h3><p></p><div class="sbay-product-footer"><strong>${money(product.price)}</strong><button type="button" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy'}</button></div>`;
                card.querySelector('h3').textContent = product.name; card.querySelector('p').textContent = product.desc;
                const buy = card.querySelector('button');
                buy.addEventListener('click', () => {
                    if (this.storeState.owned.includes(product.id)) return;
                    if (this.storeState.balance < product.price) { storeMessage.textContent = 'Not enough funds'; return; }
                    this.storeState.balance -= product.price; this.storeState.owned.push(product.id); this.saveState();
                    renderStore(`${product.name} added to My parts`);
                });
                storeGrid.appendChild(card);
            });
            if (!products.length) { const empty = document.createElement('div'); empty.className = 'sbay-empty'; empty.textContent = onlyOwnedParts ? 'No purchased parts yet' : 'No parts match your search'; storeGrid.appendChild(empty); }
            createIcons({ icons });
        };
        storeSearch.addEventListener('input', () => renderStore());
        storeCategory.addEventListener('change', () => renderStore());
        storeOwnedToggle.addEventListener('click', () => { onlyOwnedParts = !onlyOwnedParts; renderStore(); });
        const viewer = document.createElement('div');
        viewer.className = 'browser-viewer';
        viewer.hidden = true;
        viewer.innerHTML = '<button type="button" class="browser-viewer-close" aria-label="Close image">×</button><img class="browser-viewer-image" alt=""><div class="browser-viewer-caption"></div><div class="browser-viewer-status" aria-live="polite"></div>';
        wrap.appendChild(viewer);
        const viewerImage = viewer.querySelector('img');
        const viewerCaption = viewer.querySelector('.browser-viewer-caption');
        const viewerStatus = viewer.querySelector('.browser-viewer-status');
        const openViewer = (item) => {
            const label = item.title.replace(/^File:/i, '').replace(/_/g, ' ');
            viewerImage.alt = label; viewerCaption.textContent = label; viewerStatus.textContent = 'Loading image…';
            viewer.classList.add('loading'); viewer.classList.remove('failed'); viewer.hidden = false;
            viewerImage.onload = () => { viewer.classList.remove('loading'); viewerStatus.textContent = ''; };
            viewerImage.onerror = () => {
                const original = item.original ? new URL(item.original, location.href).href : '';
                if (original && viewerImage.src !== original) { viewerImage.src = original; return; }
                viewer.classList.remove('loading'); viewer.classList.add('failed'); viewerStatus.textContent = 'This image could not be loaded.';
            };
            viewerImage.src = item.thumbnail || item.original;
        };
        viewer.querySelector('.browser-viewer-close').addEventListener('click', () => { viewer.hidden = true; viewerImage.removeAttribute('src'); });
        viewer.addEventListener('click', (event) => { if (event.target === viewer) { viewer.hidden = true; viewerImage.removeAttribute('src'); } });
        const contextMenu = document.createElement('div');
        contextMenu.className = 'browser-context-menu';
        contextMenu.hidden = true;
        wrap.appendChild(contextMenu);
        let continuation = null;
        let currentTerm = '';
        const safeFilename = (title) => {
            const original = title.replace(/^File:/i, '');
            const match = original.match(/\.(jpe?g|png|gif|webp|svg|tiff?)$/i);
            const ext = (match?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg').replace('tif', 'tiff');
            const base = original.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'image';
            return `${base}.${ext}`;
        };
        const addToPictures = (item, button) => {
            const folder = this.getNode(['Pictures']);
            if (!folder?.items) return;
            const name = safeFilename(item.title);
            let finalName = name; let suffix = 2;
            while (folder.items[finalName]) finalName = name.replace(/\.[^.]+$/, '') + ' ' + suffix++ + name.match(/\.[^.]+$/)?.[0];
            folder.items[finalName] = { type: 'image', src: item.thumbnail || item.original, name: finalName };
            this.saveState();
            if (button) {
                button.textContent = 'Saved to Pictures';
                button.disabled = true;
                button.classList.add('saved');
                setTimeout(() => { if (button.isConnected) { contextMenu.hidden = true; button.textContent = 'Save to Pictures'; button.disabled = false; button.classList.remove('saved'); } }, 1000);
            }
        };
        const downloadImage = async (item) => {
            const source = item.thumbnail || item.original;
            try {
                const response = await fetch(source);
                if (!response.ok) throw new Error('Download failed');
                const blobUrl = URL.createObjectURL(await response.blob());
                const link = document.createElement('a'); link.href = blobUrl; link.download = safeFilename(item.title);
                document.body.appendChild(link); link.click(); link.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch { window.open(source, '_blank', 'noopener'); }
            contextMenu.hidden = true;
        };
        const openContextMenu = (item, clientX, clientY) => {
            contextMenu.innerHTML = '';
            const actions = [
                ['Save to Pictures', () => { addToPictures(item); status.textContent = `Saved to Pictures · ${item.title.replace(/^File:/i, '')}`; contextMenu.hidden = true; }],
                ['Download image', () => downloadImage(item)],
                ['Open Commons page', () => { window.open(item.page, '_blank', 'noopener'); contextMenu.hidden = true; }]
            ];
            actions.forEach(([label, action]) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', action); contextMenu.appendChild(button); });
            const rect = wrap.getBoundingClientRect();
            contextMenu.hidden = false;
            contextMenu.style.left = `${Math.max(8, Math.min(clientX - rect.left, wrap.clientWidth - 184))}px`;
            contextMenu.style.top = `${Math.max(8, Math.min(clientY - rect.top, wrap.clientHeight - 142))}px`;
        };
        wrap.addEventListener('pointerdown', (event) => { if (!event.target.closest('.browser-card, .browser-context-menu')) contextMenu.hidden = true; });
        const renderItems = (items) => {
            items.forEach((item) => {
                const card = document.createElement('article'); card.className = 'browser-card'; card.tabIndex = 0; card.setAttribute('aria-label', item.title.replace(/^File:/i, '').replace(/_/g, ' '));
                const preview = document.createElement('div'); preview.className = 'browser-preview'; preview.title = 'Open image';
                const img = document.createElement('img'); img.src = item.thumbnail || item.original; img.alt = item.title.replace(/^File:/i, '').replace(/_/g, ' '); img.loading = 'lazy'; img.decoding = 'async';
                preview.classList.add('loading');
                const loadState = document.createElement('span'); loadState.className = 'browser-load-state'; loadState.textContent = 'Loading image…';
                const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'browser-retry'; retry.textContent = 'Try again'; retry.hidden = true;
                let triedOriginal = false;
                img.addEventListener('load', () => { preview.classList.remove('loading', 'failed'); loadState.textContent = ''; retry.hidden = true; img.hidden = false; });
                img.addEventListener('error', () => {
                    if (!triedOriginal && item.original && item.thumbnail && item.original !== item.thumbnail) { triedOriginal = true; img.src = item.original; return; }
                    preview.classList.remove('loading'); preview.classList.add('failed'); loadState.textContent = 'Image unavailable'; retry.hidden = false; img.hidden = true;
                });
                retry.addEventListener('click', (event) => { event.stopPropagation(); triedOriginal = false; preview.classList.remove('failed'); preview.classList.add('loading'); loadState.textContent = 'Loading image…'; retry.hidden = true; img.hidden = false; img.src = item.thumbnail || item.original; });
                preview.append(img, loadState, retry);
                const caption = document.createElement('div'); caption.className = 'browser-card-caption'; caption.textContent = item.title.replace(/^File:/i, '').replace(/_/g, ' ');
                card.append(preview, caption);
                let holdTimer = null; let held = false;
                card.addEventListener('pointerdown', (event) => {
                    if (event.button !== 0) return;
                    held = false;
                    holdTimer = setTimeout(() => { held = true; openContextMenu(item, event.clientX, event.clientY); }, 520);
                });
                ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => card.addEventListener(type, () => clearTimeout(holdTimer)));
                card.addEventListener('contextmenu', (event) => { event.preventDefault(); held = true; openContextMenu(item, event.clientX, event.clientY); });
                card.addEventListener('click', (event) => {
                    if (held) { event.preventDefault(); event.stopPropagation(); held = false; return; }
                    contextMenu.hidden = true;
                    openViewer(item);
                });
                card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openViewer(item); } });
                results.appendChild(card);
            });
            createIcons({ icons });
        };
        const renderHome = () => {
            results.innerHTML = `
                <section class="browser-home">
                    <div class="browser-home-mark"><i data-lucide="image"></i></div>
                    <h2>Find an image</h2>
                    <div class="browser-home-topics" aria-label="Popular searches">
                        <button type="button" data-query="nature">Nature</button>
                        <button type="button" data-query="animals">Animals</button>
                        <button type="button" data-query="architecture">Architecture</button>
                        <button type="button" data-query="space">Space</button>
                    </div>
                </section>
            `;
            status.textContent = 'Search Wikimedia Commons';
            more.hidden = true;
            results.querySelectorAll('[data-query]').forEach((button) => button.addEventListener('click', () => {
                input.value = button.dataset.query; search(button.dataset.query);
            }));
            createIcons({ icons });
        };
        const search = async (term, append = false) => {
            const query = term.trim();
            if (!this.hasInternetCard()) { status.textContent = noInternetMessage; results.innerHTML = ''; more.hidden = true; return; }
            if (!query) { status.textContent = 'Enter a search to find images'; input.focus(); return; }
            if (!this.networkEnabled) { status.textContent = 'Wi-Fi is off · turn it on to search'; more.hidden = true; return; }
            if (!append) { currentTerm = query; continuation = null; results.innerHTML = ''; status.textContent = `Searching for “${query}”…`; more.hidden = true; }
            status.textContent = append ? 'Loading more images…' : `Searching for “${query}”…`;
            more.disabled = true;
            try {
                const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '30', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '320', format: 'json', origin: '*' });
                if (append && continuation) Object.entries(continuation).forEach(([key, value]) => params.set(key, value));
                const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
                if (!response.ok) throw new Error('Image search is unavailable right now');
                const data = await response.json();
                const pages = Object.values(data.query?.pages || {});
                const items = pages.map(page => ({ title: page.title, thumbnail: page.imageinfo?.[0]?.thumburl, original: page.imageinfo?.[0]?.url, page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` })).filter(item => item.thumbnail || item.original);
                renderItems(items);
                continuation = data.continue || null;
                const count = results.querySelectorAll('.browser-card').length;
                status.textContent = count ? `${count.toLocaleString()} images · ${query}` : `No images found for “${query}”`;
                more.hidden = !continuation;
            } catch (error) {
                status.textContent = error.message || 'Could not load images. Check your connection and try again.';
                if (!append) results.innerHTML = '<div class="browser-empty">Search Commons for photographs, art, places, animals, and more.</div>';
            } finally { more.disabled = false; }
        };
        form.addEventListener('submit', (event) => { event.preventDefault(); search(input.value); });
        more.addEventListener('click', () => search(currentTerm, true));
        input.addEventListener('keydown', (event) => event.stopPropagation());
        createIcons({ icons });
        renderHome();
        return wrap;
    }

    /* ---------------- App: Settings ---------------- */

    getSettingsContent() {
        const wrap = document.createElement('div');
        wrap.className = 'settings-wrap';
        const s = this.settings;

        const section = (title) => {
            const h = document.createElement('h3');
            h.className = 'settings-title';
            h.textContent = title;
            return h;
        };

        const row = (label, controlEl) => {
            const r = document.createElement('label');
            r.className = 'settings-row';
            const span = document.createElement('span');
            span.textContent = label;
            r.appendChild(span);
            r.appendChild(controlEl);
            return r;
        };

        const makeCheck = (checked, onchange) => {
            const c = document.createElement('input');
            c.type = 'checkbox';
            c.checked = checked;
            c.addEventListener('change', () => onchange(c.checked));
            return c;
        };

        // Translucency
        wrap.appendChild(section('Appearance'));
        wrap.appendChild(row('Translucent menu bar & dock', makeCheck(s.translucency, (v) => {
            s.translucency = v;
            document.body.classList.toggle('no-translucency', !v);
            this.saveState();
        })));
        wrap.appendChild(row('High contrast mode', makeCheck(s.highContrast, (v) => {
            s.highContrast = v;
            document.body.classList.toggle('high-contrast', v);
            this.saveState();
        })));

        // Wallpaper
        const wallpapers = [
            { id: 'default', label: 'Peach Wallpaper', css: "url('wallpaper.png')" },
            { id: 'beach', label: 'Beach', css: 'linear-gradient(135deg,#ffd3a5,#fd6585)' },
            { id: 'forest', label: 'Forest', css: 'linear-gradient(135deg,#a8e063,#56ab2f)' },
            { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg,#89f7fe,#66a6ff)' },
            { id: 'night', label: 'Night', css: 'linear-gradient(135deg,#232526,#414345)' }
        ];
        const sel = document.createElement('select');
        wallpapers.forEach(wp => {
            const o = document.createElement('option');
            o.value = wp.id;
            o.textContent = wp.label;
            if (wp.id === s.wallpaper) o.selected = true;
            sel.appendChild(o);
        });
        sel.addEventListener('change', () => {
            s.wallpaper = sel.value;
            this.applyWallpaper();
            this.saveState();
        });
        wrap.appendChild(section('Desktop'));
        wrap.appendChild(row('Wallpaper', sel));

        // Sound
        wrap.appendChild(section('Sound'));
        const vol = document.createElement('input');
        vol.type = 'range';
        vol.min = 0;
        vol.max = 100;
        vol.value = s.volume;
        const volLabel = document.createElement('span');
        volLabel.className = 'vol-label';
        volLabel.textContent = s.volume + '%';
        const volRow = document.createElement('div');
        volRow.className = 'settings-row settings-vol';
        volRow.appendChild(vol);
        volRow.appendChild(volLabel);
        vol.addEventListener('input', () => {
            s.volume = Number(vol.value);
            volLabel.textContent = s.volume + '%';
            this.setVolume(s.volume);
            this.saveState();
        });
        wrap.appendChild(volRow);

        // System info
        wrap.appendChild(section('System'));
        const info = document.createElement('p');
        info.className = 'settings-info';
        info.innerHTML = `<i data-lucide="cpu" size="13"></i> StoneProcessor X2 · 512 MB RAM`;
        wrap.appendChild(info);

        createIcons({ icons });
        return wrap;
    }

    setVolume(v) {
        document.querySelectorAll('#sound-startup, #sound-click').forEach(a => a.volume = v / 100);
    }

    applyGrain() {
        document.body.classList.toggle('no-translucency', !this.settings.translucency);
        document.body.classList.toggle('high-contrast', this.settings.highContrast);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ClingstoneOS();
});