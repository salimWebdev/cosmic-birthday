// Optimized NASA APOD Discovery App
        class NASAImageDiscovery {
            constructor() {
                this.API_KEY = '7bclSmA9AbRbGMCef9Ro8OMrVGbesJSOmbVJhGwv';
                this.BASE_URL = 'https://api.nasa.gov/planetary/apod';
                this.elements = this.cacheElements();
                this.init();
            }

            // Cache DOM elements for better performance
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
                this.createStars();
                this.bindEvents();
                this.setMaxDate();
            }

            // Optimized star creation with DocumentFragment
           
            createStar() {
                const star = document.createElement('div');
                const size = Math.random() * 3 + 1;
                
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
                
                star.className = 'star';
                return star;
            }

            setMaxDate() {
                this.elements.birthdate.max = new Date().toISOString().split('T')[0];
            }

            bindEvents() {
                // Use arrow functions to maintain 'this' context
                this.elements.birthdate.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.discoverImage();
                });

                this.elements.discoverBtn.addEventListener('click', () => {
                    this.discoverImage();
                });

                this.elements.fullscreenModal.addEventListener('click', (e) => {
                    if (e.target === e.currentTarget) this.closeFullscreen();
                });

                this.elements.closeFullscreenBtn.addEventListener('click', () => {
                    this.closeFullscreen();
                });

                this.elements.resultImage.addEventListener('click', () => {
                    this.openFullscreen();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') this.closeFullscreen();
                });
            }
 createStars() {
                const fragment = document.createDocumentFragment();
                const numberOfStars = 100;
                
                for (let i = 0; i < numberOfStars; i++) {
                    const star = this.createStar();
                    fragment.appendChild(star);
                }
                
                this.elements.starsContainer.appendChild(fragment);
            }

            async fetchNASAData(date) {
                const url = `${this.BASE_URL}?api_key=${this.API_KEY}&date=${date}`;
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            }
            
            async discoverImage() {
                const birthdate = this.elements.birthdate.value;
                
                if (!this.validateDate(birthdate)) return;

                try {
                    this.showLoading(true);
                    this.hideMessages();
                    
                    const data = await this.fetchNASAData(birthdate);
                    this.displayResult(data, birthdate);
                    
                } catch (error) {
                    console.error('NASA API Error:', error);
                    this.showError('Unable to fetch your cosmic moment. The universe might be busy! Try a different date. ✨');
                } finally {
                    this.showLoading(false);
                }
            }

            validateDate(birthdate) {
                if (!birthdate) {
                    this.showError('Please select your birthday first! 🎂');
                    return false;
                }
                
                const selectedDate = new Date(birthdate);
                const today = new Date();
                
                if (selectedDate > today) {
                    this.showError('Time travel not supported yet! Please choose a past date. ⏰');
                    return false;
                }
                
                return true;
            }


            displayResult(data, birthdate) {
                const formattedDate = this.formatDate(birthdate);
                
                // Handle different media types
                if (data.media_type === 'image') {
                    this.elements.resultImage.src = data.url;
                    this.elements.resultImage.style.display = 'block';
                    this.elements.resultImage.alt = data.title;
                } else {
                    this.elements.resultImage.style.display = 'none';
                }
                this.elements.resultTitle.textContent = data.title || 'Untitled';
                this.elements.resultDate.textContent = `Your Cosmic Birthday: ${formattedDate}`;
                this.elements.resultExplanation.textContent = data.explanation || 'No description available.';
                this.showResultSection();
            }

            formatDate(dateString) {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
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
            }

            hideMessages() {
                this.elements.errorMessage.style.display = 'none';
                this.elements.resultSection.style.display = 'none';
            }

            showError(message) {
                this.elements.errorMessage.textContent = message;
                this.elements.errorMessage.style.display = 'block';
                setTimeout(() => {
                    this.elements.errorMessage.style.display = 'none';
                }, 5000);
            }

            openFullscreen() {
                if (!this.elements.resultImage.src) return;
                
                this.elements.fullscreenImage.src = this.elements.resultImage.src;
                this.elements.fullscreenModal.style.display = 'flex';
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
