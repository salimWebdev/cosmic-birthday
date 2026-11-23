class NASAImageDiscovery {
    constructor() {
        this.API_KEY = 'YOUR_API_KEY'; // Replace with your key from api.nasa.gov (or 'DEMO_KEY' for testing)
        this.BASE_URL = 'https://api.nasa.gov/planetary/apod';
        this.MIN_DATE = '1995-06-16'; // First APOD entry

        this.elements = this.cacheElements();
        this.errorTimer = null;
        this.videoFrame = null;
        this.requestId = 0;

        this.init();
    }

    // Cache DOM elements once for better performance
    cacheElements() {
        return {
            birthdate: document.getElementById('birthdate'),
            loading: document.getElementById('loading'),
            resultSection: document.getElementById('resultSection'),
            errorMessage: document.getElementById('errorMessage'),
            resultImage: document.getElementById('resultImage'),
            resultTitle: document.getElementById('resultTitle'),
            resultDate: document.getElementById('resultDate'),
            resultExplanation: document.getElementById('resultExplanation'),
            fullscreenModal: document.getElementById('fullscreenModal'),
            fullscreenImage: document.getElementById('fullscreenImage'),
            starsContainer: document.getElementById('stars'),
            discoverBtn: document.getElementById('discoverBtn'),
            closeFullscreenBtn: document.getElementById('closeFullscreenBtn')
        };
    }

    init() {
        if (this.API_KEY === 'YOUR_API_KEY') {
            console.warn('Replace YOUR_API_KEY in the constructor with a valid NASA API key.');
        }

        this.createStars();
        this.setDateLimits();
        this.bindEvents();
    }

    // ---------- Background stars ----------

    createStars(count = 100) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            fragment.appendChild(this.createStar());
        }
        this.elements.starsContainer.appendChild(fragment);
    }

    createStar() {
        const star = document.createElement('div');
        const size = Math.random() * 3 + 1;

        star.className = 'star';
        Object.assign(star.style, {
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            animationDelay: `${Math.random() * 3}s`
        });

        return star;
    }

    // ---------- Setup ----------

    // Returns YYYY-MM-DD in the user's local timezone
    getLocalISODate(date = new Date()) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    setDateLimits() {
        this.elements.birthdate.min = this.MIN_DATE;
        this.elements.birthdate.max = this.getLocalISODate();
    }

    bindEvents() {
        const { birthdate, discoverBtn, fullscreenModal, closeFullscreenBtn, resultImage } = this.elements;

        birthdate.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.discoverImage();
        });

        discoverBtn.addEventListener('click', () => this.discoverImage());

        fullscreenModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeFullscreen();
        });

        closeFullscreenBtn.addEventListener('click', () => this.closeFullscreen());

        resultImage.addEventListener('click', () => this.openFullscreen());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeFullscreen();
        });
    }

    // ---------- Data fetching ----------

    async discoverImage() {
        const birthdate = this.elements.birthdate.value;
        if (!this.validateDate(birthdate)) return;

        // Ignore responses from earlier requests if the user clicks again
        const requestId = ++this.requestId;

        try {
            this.showLoading(true);
            this.hideMessages();

            const data = await this.fetchNASAData(birthdate);
            if (requestId !== this.requestId) return;

            this.displayResult(data, birthdate);
        } catch (error) {
            if (requestId !== this.requestId) return;

            console.error('NASA API Error:', error);
            this.showError(this.getErrorMessage(error.status));
        } finally {
            if (requestId === this.requestId) this.showLoading(false);
        }
    }

    async fetchNASAData(date) {
        const params = new URLSearchParams({ api_key: this.API_KEY, date });
        const response = await fetch(`${this.BASE_URL}?${params}`);

        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return response.json();
    }

    getErrorMessage(status) {
        switch (status) {
            case 403:
                return 'The NASA API key was rejected. Check that the key is valid. 🔑';
            case 429:
                return 'Too many requests right now. Please wait a moment and try again. ⏳';
            default:
                return 'Unable to fetch your cosmic moment. The universe might be busy! Try a different date. ✨';
        }
    }

    // ---------- Validation ----------

    validateDate(birthdate) {
        if (!birthdate) {
            this.showError('Please select your birthday first! 🎂');
            return false;
        }

        // YYYY-MM-DD strings compare correctly as text
        if (birthdate > this.getLocalISODate()) {
            this.showError('Time travel not supported yet! Please choose a past date. ⏰');
            return false;
        }

        if (birthdate < this.MIN_DATE) {
            this.showError('The APOD archive begins on June 16, 1995. Please choose a later date. 🔭');
            return false;
        }

        return true;
    }

    // ---------- Rendering ----------

    displayResult(data, birthdate) {
        const { resultTitle, resultDate, resultExplanation } = this.elements;
