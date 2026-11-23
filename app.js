class NASAImageDiscovery {
    constructor() {
        this.API_KEY = 'J8BNFHgcBbGNJpLPF9Rw96KPWFkLHtb6HktgCKtk'; // Replace with your key from api.nasa.gov (or 'DEMO_KEY' for testing)
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

        resultTitle.textContent = data.title || 'Untitled';
        resultDate.textContent = `Your Cosmic Birthday: ${this.formatDate(birthdate)}`;
        resultExplanation.textContent = data.explanation || 'No description available.';

        this.clearMedia();

        if (data.media_type === 'video') {
            this.showVideo(data);
        } else {
            this.showImage(data);
        }

        this.showResultSection();
    }

    showImage(data) {
        const img = this.elements.resultImage;

        // Try the HD image first, then fall back to the standard one
        const sources = [data.hdurl, data.url].filter(Boolean);
        if (sources.length === 0) {
            this.showError('No image is available for this day. 🖼️');
            return;
        }

        let attempt = 0;
        img.alt = data.title || '';

        img.onerror = () => {
            attempt++;
            if (attempt < sources.length) {
                img.src = sources[attempt];
            } else {
                img.onerror = null;
                img.style.display = 'none';
                this.showError("This day's image could not be loaded. 🖼️");
            }
        };

        img.src = sources[0];
        img.style.display = 'block';
    }

    showVideo(data) {
        const iframe = document.createElement('iframe');
        iframe.src = data.url;
        iframe.title = data.title || 'NASA video';
        iframe.allowFullscreen = true;
        iframe.width = '100%';
        iframe.height = '400';
        iframe.style.border = '0';

        this.elements.resultImage.insertAdjacentElement('afterend', iframe);
        this.videoFrame = iframe;
    }

    // Removes any previous image or video before showing a new entry
    clearMedia() {
        const img = this.elements.resultImage;
        img.onerror = null;
        img.removeAttribute('src');
        img.style.display = 'none';

        if (this.videoFrame) {
            this.videoFrame.remove();
            this.videoFrame = null;
        }
    }

    formatDate(dateString) {
        // Build the date in UTC so the display can't shift by a day
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    }

    showResultSection() {
        this.elements.resultSection.style.display = 'block';

        requestAnimationFrame(() => {
            this.elements.resultSection.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        });
    }

    showLoading(show) {
        this.elements.loading.style.display = show ? 'block' : 'none';
        this.elements.discoverBtn.disabled = show;
    }

    hideMessages() {
        this.elements.errorMessage.style.display = 'none';
        this.elements.resultSection.style.display = 'none';
    }

    showError(message) {
        clearTimeout(this.errorTimer);
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';

        this.errorTimer = setTimeout(() => {
            this.elements.errorMessage.style.display = 'none';
        }, 5000);
    }

    // ---------- Fullscreen ----------

    openFullscreen() {
        const { resultImage, fullscreenImage, fullscreenModal } = this.elements;
        if (!resultImage.getAttribute('src') || resultImage.style.display === 'none') return;

        fullscreenImage.src = resultImage.src;
        fullscreenModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeFullscreen() {
        this.elements.fullscreenModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.nasaApp = new NASAImageDiscovery();
});
