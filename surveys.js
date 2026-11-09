const questionSets = {
    easy: [
        ['Geography', 'What is the capital of Italy?', ['Rome', 'Madrid', 'Athens', 'Lisbon'], 0],
        ['Space', 'Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Mercury'], 1],
        ['Everyday science', 'How many minutes are in one hour?', ['30', '45', '60', '100'], 2],
        ['Science', 'What is the chemical formula for water?', ['CO2', 'H2O', 'O2', 'NaCl'], 1],
        ['Geography', 'Which is the largest ocean on Earth?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3],
        ['Nature', 'Which insect makes honey?', ['Ant', 'Bee', 'Moth', 'Beetle'], 1],
        ['Nature', 'What gas do plants take in from the air?', ['Oxygen', 'Carbon dioxide', 'Helium', 'Hydrogen'], 1],
        ['Math', 'How many sides does a square have?', ['Three', 'Four', 'Five', 'Six'], 1],
        ['Space', 'What is Earth’s natural satellite called?', ['Europa', 'The Moon', 'Titan', 'Phobos'], 1],
        ['Clingstone system', 'What is the name of this fictional desktop operating system?', ['Clingstone OS', 'PeaOS', 'StoneBook', 'Clingy'], 0],
        ['Clingstone system', 'Which Clingstone app is the command-line terminal?', ['Daybook', 'StoneShell', 'Sketchpad', 'Navigator'], 1],
        ['Clingstone system', 'What does pBay sell in Clingstone?', ['System parts', 'Peas', 'Books', 'Wallpaper'], 0],
        ['Clingstone system', 'Which built-in app is used to browse files?', ['Navigator', 'PocketCalc', 'Daybook', 'StonePad'], 0],
        ['Technology', 'Which computer component is often called the processor?', ['CPU', 'Mouse', 'Monitor', 'Speaker'], 0],
        ['Technology', 'Which component primarily handles graphics?', ['GPU', 'SSD', 'Keyboard', 'Power cable'], 0],
        ['Clingstone system', 'Which Clingstone app is the calendar?', ['Daybook', 'StoneShell', 'StonePad', 'Sketchpad'], 0],
        ['Clingstone system', 'Which Clingstone app is for drawing?', ['Sketchpad', 'Navigator', 'PocketCalc', 'Daybook'], 0],
        ['Math', 'What is 2 + 2?', ['3', '4', '5', '22'], 1],
        ['Everyday life', 'Which tool has letter keys for typing?', ['Keyboard', 'Mouse', 'Printer', 'Webcam'], 0],
        ['Space', 'What is the Sun?', ['A planet', 'A star', 'A moon', 'A comet'], 1],
        ['Science', 'What tool helps us see tiny cells?', ['Microscope', 'Telescope', 'Periscope', 'Binoculars'], 0],
        ['Everyday science', 'What is water called when it freezes?', ['Steam', 'Ice', 'Fog', 'Dew'], 1],
        ['Nature', 'Which season usually comes after spring?', ['Autumn', 'Winter', 'Summer', 'Monsoon'], 2],
        ['Everyday life', 'How many wheels does a standard bicycle have?', ['One', 'Two', 'Three', 'Four'], 1],
        ['Shapes', 'Which shape has no corners?', ['Triangle', 'Square', 'Circle', 'Rectangle'], 2],
        ['Everyday life', 'Which tool tells the time?', ['Clock', 'Compass', 'Ruler', 'Scale'], 0],
        ['Science', 'What color do blue and yellow paint usually make?', ['Green', 'Purple', 'Orange', 'Pink'], 0],
        ['Everyday life', 'How many days are in a week?', ['Five', 'Six', 'Seven', 'Eight'], 2]
    ],
    regular: [
        ['Space', 'What is the largest planet in our solar system?', ['Saturn', 'Jupiter', 'Neptune', 'Earth'], 1],
        ['Science', 'What is the chemical symbol for gold?', ['Ag', 'Gd', 'Au', 'Go'], 2],
        ['Geography', 'The Great Barrier Reef lies off the coast of which country?', ['Australia', 'Mexico', 'India', 'South Africa'], 0],
        ['Literature', 'Who wrote Hamlet?', ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Oscar Wilde'], 1],
        ['Science', 'At what temperature does pure water freeze on the Celsius scale?', ['0°C', '10°C', '32°C', '100°C'], 0],
        ['Math', 'How many sides does a hexagon have?', ['Five', 'Six', 'Seven', 'Eight'], 1],
        ['Technology', 'What does an IP address identify on a network?', ['A device connection', 'A file format', 'A screen size', 'A battery type'], 0],
        ['Words', 'What is a novel?', ['A long work of fiction', 'A kind of map', 'A musical scale', 'A cooking tool'], 0],
        ['Clingstone system', 'What is the name of the virtual file storage drive in Clingstone?', ['StoneDrive', 'PeaDisk', 'ClingCloud', 'PitDrive'], 0],
        ['Clingstone system', 'Which Clingstone app is the plain text editor?', ['StonePad', 'PocketCalc', 'Daybook', 'Navigator'], 0],
        ['Clingstone system', 'Which company name appears in the Clingstone system copyright?', ['Clingstone Computing Inc.', 'Pea Research Ltd.', 'Stoneworks Labs', 'Peach Systems'], 0],
        ['Science', 'Which gas makes up most of Earth’s atmosphere?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], 1],
        ['Art', 'Who painted the Mona Lisa?', ['Claude Monet', 'Leonardo da Vinci', 'Vincent van Gogh', 'Pablo Picasso'], 1],
        ['Science', 'About how many bones are in an adult human body?', ['106', '206', '306', '406'], 1],
        ['Technology', 'How many bits are in a standard byte?', ['4', '8', '16', '32'], 1],
        ['Space', 'Which planet is famous for its prominent ring system?', ['Mars', 'Saturn', 'Mercury', 'Venus'], 1],
        ['Geography', 'What is the highest mountain above sea level?', ['K2', 'Kilimanjaro', 'Mount Everest', 'Denali'], 2],
        ['Geography', 'What is the currency of Japan?', ['Won', 'Yen', 'Yuan', 'Baht'], 1],
        ['Clingstone system', 'What is the name of the Clingstone photo and image search app?', ['Browser', 'Daybook', 'Navigator', 'StoneShell'], 0],
        ['Science', 'What force keeps planets in orbit around the Sun?', ['Magnetism', 'Gravity', 'Friction', 'Buoyancy'], 1],
        ['Nature', 'What is the largest animal alive today?', ['African elephant', 'Blue whale', 'Giraffe', 'Whale shark'], 1],
        ['Math', 'What is the square root of 81?', ['7', '8', '9', '10'], 2],
        ['Biology', 'Which organ pumps blood around the human body?', ['Lungs', 'Liver', 'Heart', 'Kidneys'], 2],
        ['Geography', 'Which continent contains the most countries?', ['Europe', 'Africa', 'Asia', 'South America'], 1],
        ['Music', 'Which instrument usually has 88 keys?', ['Violin', 'Piano', 'Flute', 'Harp'], 1],
        ['Words', 'What is a word with a similar meaning called?', ['Antonym', 'Synonym', 'Acronym', 'Homonym'], 1],
        ['Geography', 'Which ocean lies between Africa and Australia?', ['Atlantic', 'Arctic', 'Indian', 'Southern'], 2],
        ['Nature', 'What is the young stage of a frog called?', ['Caterpillar', 'Tadpole', 'Pup', 'Fawn'], 1]
    ],
    hard: [
        ['Astronomy', 'Which moon is the largest in the solar system?', ['Titan', 'Ganymede', 'Earth’s Moon', 'Europa'], 1],
        ['Chemistry', 'Which element has atomic number 79?', ['Silver', 'Gold', 'Platinum', 'Copper'], 1],
        ['Technology', 'How many bits are in an IPv4 address?', ['16', '32', '64', '128'], 1],
        ['Physics', 'A light-year measures what?', ['Time', 'Distance', 'Brightness', 'Speed'], 1],
        ['Geography', 'Which strait separates Asia and North America?', ['Bering Strait', 'Gibraltar Strait', 'Dover Strait', 'Magellan Strait'], 0],
        ['Literature', 'Who wrote the novel Frankenstein?', ['Mary Shelley', 'Emily Brontë', 'Virginia Woolf', 'Agatha Christie'], 0],
        ['Math', 'What is the sum of the interior angles of a hexagon?', ['540°', '600°', '720°', '900°'], 2],
        ['Nature', 'What is the name for an animal that is active mainly at dawn and dusk?', ['Nocturnal', 'Diurnal', 'Crepuscular', 'Aquatic'], 2],
        ['Science', 'Which particle carries a negative electric charge?', ['Proton', 'Neutron', 'Electron', 'Photon'], 2],
        ['Clingstone system', 'What is the name of Clingstone’s built-in calculator?', ['PocketCalc', 'Daybook', 'StonePad', 'PeaCount'], 0],
        ['Clingstone system', 'What version name is shown in the Clingstone About panel?', ['Nectarine', 'Apricot', 'Peach Fuzz', 'Pip'], 0],
        ['Clingstone system', 'Which Clingstone app manages folders and the virtual file system?', ['Navigator', 'Sketchpad', 'PocketCalc', 'Daybook'], 0],
        ['Clingstone system', 'What is the name of Clingstone’s terminal app?', ['StoneShell', 'StonePad', 'PeaPool', 'pBay'], 0],
        ['Computing', 'What does the hexadecimal number system use as its base?', ['2', '8', '10', '16'], 3],
        ['Computing', 'What does DNS primarily translate into IP addresses?', ['Domain names', 'Image files', 'Passwords', 'Screen pixels'], 0],
        ['History', 'In which year did the first Moon landing take place?', ['1959', '1965', '1969', '1972'], 2],
        ['Geography', 'Which present-day country was formerly known as Persia?', ['Iran', 'Iraq', 'Syria', 'Turkey'], 0],
        ['Art', 'Which art movement is associated with Claude Monet?', ['Cubism', 'Impressionism', 'Surrealism', 'Pop art'], 1],
        ['Biology', 'What is the basic structural unit of life?', ['Atom', 'Cell', 'Tissue', 'Organ'], 1],
        ['Clingstone system', 'Which Clingstone app is designed for freehand drawing?', ['Sketchpad', 'StoneShell', 'Daybook', 'PocketCalc'], 0],
        ['Physics', 'What is the SI unit of force?', ['Joule', 'Watt', 'Newton', 'Pascal'], 2],
        ['Earth science', 'In which atmospheric layer does most weather occur?', ['Stratosphere', 'Troposphere', 'Mesosphere', 'Thermosphere'], 1],
        ['Astronomy', 'Which planet rotates so slowly that its day is longer than its year?', ['Venus', 'Mars', 'Jupiter', 'Neptune'], 0],
        ['Math', 'What is the derivative of x²?', ['x', '2x', 'x²', '2'], 1],
        ['Biology', 'Which color of visible light does chlorophyll mostly reflect?', ['Green', 'Red', 'Blue', 'Violet'], 0],
        ['Computing', 'What does SQL stand for?', ['Structured Query Language', 'Simple Question List', 'System Queue Logic', 'Standard Quick Link'], 0],
        ['Physics', 'Who formulated the three classical laws of motion?', ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Niels Bohr'], 1],
        ['Astronomy', 'What is the closest star to the Sun?', ['Sirius', 'Proxima Centauri', 'Barnard’s Star', 'Vega'], 1],
        ['History', 'Which civilization built Machu Picchu?', ['Maya', 'Aztec', 'Inca', 'Olmec'], 2],
        ['Geography', 'What is the largest desert on Earth by area?', ['Sahara', 'Arabian Desert', 'Gobi Desert', 'Antarctic Desert'], 3]
    ]
};

const surveyOffers = [
    ['Peach Pit Polling', 'A cheerful sampler of everyday facts'],
    ['Curiosity Club', 'For people who click “learn more”'],
    ['Moss & Marbles', 'Nature, science, and a few odd bits'],
    ['The Little Fact Company', 'A mixed bag of brain-teasers'],
    ['Clingstone Community Panel', 'A little system lore, plus general trivia'],
    ['World Wide Wonder', 'A trip around the map and back'],
    ['Brainy Bean Research', 'Short questions, big thinking'],
    ['Pocket Thinkers', 'A fresh set for curious minds'],
    ['The Afternoon Questionnaire', 'A comfortable mix of topics'],
    ['Oddly Specific Surveys', 'Unexpected facts, all in one place']
];

const payouts = { easy: 8, regular: 20, hard: 35 };
const questionsNeeded = 15;
const totalQuestions = 20;

export function setupSurveys(wrap, os) {
    const page = wrap.querySelector('.browser-surveys-page');
    const lobby = page.querySelector('.survey-lobby');
    const session = page.querySelector('.survey-session');
    const result = page.querySelector('.survey-result');
    const grid = page.querySelector('.survey-grid');
    const difficultyButtons = [...page.querySelectorAll('.survey-difficulty button')];
    const balanceLabel = page.querySelector('.survey-wallet-balance');
    const questionCount = page.querySelector('.survey-question-count');
    const questionTopic = page.querySelector('.survey-topic');
    const questionText = page.querySelector('.survey-question');
    const optionsBox = page.querySelector('.survey-options');
    const progressFill = page.querySelector('.survey-progress-fill');
    const sessionMeta = page.querySelector('.survey-session-meta');
    const qualifyNote = page.querySelector('.survey-qualify-note');
    const submitButton = page.querySelector('.survey-submit');
    const resultPayout = page.querySelector('.survey-result-payout');
    const resultScore = page.querySelector('.survey-result-score');
    let difficulty = 'regular';
    let offer = null;
    let deck = [];
    let answers = [];
    let questionIndex = 0;
    let submitted = false;
    const cash = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

    const refreshBalance = () => { balanceLabel.textContent = cash(os.storeState.balance); };
    const answeredCount = () => answers.filter(answer => answer !== null).length;
    const correctCount = () => answers.reduce((sum, answer, index) => sum + (answer !== null && answer === deck[index].answer ? 1 : 0), 0);

    difficultyButtons.forEach(button => button.addEventListener('click', () => {
        difficulty = button.dataset.level;
        difficultyButtons.forEach(item => item.classList.toggle('selected', item === button));
        renderOffers();
    }));

    function renderOffers() {
        refreshBalance();
        grid.replaceChildren();
        surveyOffers.forEach(([name, description], offerIndex) => {
            const card = document.createElement('article');
            card.className = 'survey-offer';
            const top = document.createElement('div'); top.className = 'survey-offer-top';
            const icon = document.createElement('span'); icon.className = 'survey-offer-icon'; icon.textContent = ['✳','?','❋','◉','⌘','◎','✦','◌','✷','✳'][offerIndex];
            const kicker = document.createElement('span'); kicker.className = 'survey-offer-kicker'; kicker.textContent = '20 QUESTIONS';
            top.append(icon, kicker);
            const title = document.createElement('h3'); title.textContent = name;
            const desc = document.createElement('p'); desc.textContent = description;
            const foot = document.createElement('div'); foot.className = 'survey-offer-foot';
            const pay = document.createElement('strong'); pay.textContent = cash(payouts[difficulty]);
            const start = document.createElement('button'); start.type = 'button'; start.textContent = 'Start survey';
            start.addEventListener('click', () => beginSurvey({ name, offerIndex }));
            foot.append(pay, start);
            card.append(top, title, desc, foot);
            grid.appendChild(card);
        });
    }

    function beginSurvey(nextOffer) {
        offer = nextOffer;
        const source = questionSets[difficulty];
        deck = source.map(item => {
            const options = item[2].map((text, index) => ({ text, correct: index === item[3] }));
            for (let index = options.length - 1; index > 0; index--) {
                const swap = Math.floor(Math.random() * (index + 1));
                [options[index], options[swap]] = [options[swap], options[index]];
            }
            return { topic: item[0], prompt: item[1], options, answer: options.findIndex(option => option.correct) };
        });
        for (let index = deck.length - 1; index > 0; index--) {
            const swap = Math.floor(Math.random() * (index + 1));
            [deck[index], deck[swap]] = [deck[swap], deck[index]];
        }
        deck = deck.slice(0, totalQuestions);
        answers = Array(totalQuestions).fill(null);
        questionIndex = 0;
        submitted = false;
        lobby.hidden = true;
        result.hidden = true;
        session.hidden = false;
        sessionMeta.textContent = offer.name + ' · ' + difficulty[0].toUpperCase() + difficulty.slice(1) + ' · ' + cash(payouts[difficulty]);
        drawQuestion();
    }

    function updateQualification() {
        const count = answeredCount();
        const remaining = Math.max(0, questionsNeeded - count);
        qualifyNote.textContent = count + ' answered · ' + questionsNeeded + ' needed to qualify';
        submitButton.disabled = count < questionsNeeded || submitted;
        submitButton.textContent = count < questionsNeeded ? 'Answer ' + remaining + ' more to qualify' : 'Submit & earn ' + cash(payouts[difficulty]);
    }

    function drawQuestion() {
        const item = deck[questionIndex];
        questionText.textContent = item.prompt;
        questionTopic.textContent = item.topic;
        questionCount.textContent = 'QUESTION ' + String(questionIndex + 1).padStart(2, '0') + ' / ' + totalQuestions + ' · ' + answeredCount() + ' ANSWERED';
        progressFill.style.width = ((questionIndex + 1) / totalQuestions * 100) + '%';
        optionsBox.replaceChildren();
        item.options.forEach((option, index) => {
            const choice = document.createElement('button');
            choice.type = 'button';
            choice.className = 'survey-option' + (answers[questionIndex] === index ? ' selected' : '');
            choice.setAttribute('aria-pressed', String(answers[questionIndex] === index));
            const letter = document.createElement('span'); letter.className = 'survey-option-letter'; letter.textContent = String.fromCharCode(65 + index);
            const text = document.createElement('span'); text.className = 'survey-option-text'; text.textContent = option.text;
            choice.append(letter, text);
            choice.addEventListener('click', () => {
                answers[questionIndex] = index;
                drawQuestion();
            });
            optionsBox.appendChild(choice);
        });
        page.querySelector('.survey-prev').disabled = questionIndex === 0;
        page.querySelector('.survey-next').disabled = questionIndex === totalQuestions - 1;
        updateQualification();
    }

    function submitSurvey() {
        if (submitted || answeredCount() < questionsNeeded) return;
        submitted = true;
        const reward = payouts[difficulty];
        const score = correctCount();
        os.storeState.balance += reward;
        os.saveState();
        refreshBalance();
        session.hidden = true;
        result.hidden = false;
        resultPayout.textContent = '+' + cash(reward);
        resultScore.textContent = score + ' correct out of ' + answeredCount() + ' answered. Nice work.';
    }

    page.querySelector('.survey-prev').addEventListener('click', () => { if (questionIndex > 0) { questionIndex--; drawQuestion(); } });
    page.querySelector('.survey-next').addEventListener('click', () => { if (questionIndex < totalQuestions - 1) { questionIndex++; drawQuestion(); } });
    page.querySelector('.survey-submit').addEventListener('click', submitSurvey);
    page.querySelector('.survey-back').addEventListener('click', () => { session.hidden = true; lobby.hidden = false; });
    page.querySelector('.survey-result-back').addEventListener('click', () => { result.hidden = true; lobby.hidden = false; renderOffers(); });
    page.querySelector('.survey-home-button').addEventListener('click', () => {
        page.hidden = true;
        wrap.querySelector('.browser-homepage').hidden = false;
    });

    renderOffers();
}
