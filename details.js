class MovieDetails {
    constructor() {
        this.mediaType = new URLSearchParams(window.location.search).get('type') || 'movie';
        this.id = new URLSearchParams(window.location.search).get('id');
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        if (!this.id) {
            window.location.href = 'index.html';
            return;
        }

        this.init();
    }

    async init() {
        await this.loadDetails();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.favorite-btn').addEventListener('click', () => {
            this.toggleFavorite(this.movieData);
        });
    }

    async loadDetails() {
        try {
            // Fetch main details
            const detailsResponse = await fetch(
                `${config.baseUrl}/${this.mediaType}/${this.id}?api_key=${config.apiKey}&append_to_response=credits,videos,similar`
            );
            this.movieData = await detailsResponse.json();

            this.updateUI();
        } catch (error) {
            console.error('Error loading details:', error);
            this.showError('Failed to load movie details');
        }
    }

    updateUI() {
        document.querySelector('.loading-spinner').style.display = 'none';
        document.querySelector('.details-content').style.display = 'block';

        // Update basic info
        document.title = `${this.movieData.title || this.movieData.name} - Movie Explorer`;
        document.querySelector('.title').textContent = this.movieData.title || this.movieData.name;
        
        // Update poster
        const poster = document.querySelector('.movie-poster');
        poster.src = this.movieData.poster_path 
            ? `${config.imageBaseUrl}${this.movieData.poster_path}`
            : 'placeholder-image.jpg';
        poster.alt = this.movieData.title || this.movieData.name;

        // Update meta info
        const releaseDate = this.movieData.release_date || this.movieData.first_air_date;
        document.querySelector('.release-date').textContent = releaseDate 
            ? new Date(releaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Release date unknown';

        document.querySelector('.runtime').textContent = this.movieData.runtime 
            ? `${this.movieData.runtime} min`
            : this.movieData.episode_run_time?.[0] 
                ? `${this.movieData.episode_run_time[0]} min per episode`
                : '';

        document.querySelector('.rating-value').textContent = 
            this.movieData.vote_average.toFixed(1);

        // Update genres
        const genresContainer = document.querySelector('.genres');
        genresContainer.innerHTML = this.movieData.genres
            .map(genre => `<span class="genre-tag">${genre.name}</span>`)
            .join('');

        // Update overview
        document.querySelector('.overview-text').textContent = 
            this.movieData.overview || 'No overview available';

        // Update cast
        const castGrid = document.querySelector('.cast-grid');
        castGrid.innerHTML = this.movieData.credits.cast
            .slice(0, 6)
            .map(person => `
                <div class="cast-member">
                    <img src="${person.profile_path 
                        ? config.imageBaseUrl + person.profile_path 
                        : 'placeholder-person.jpg'}" 
                        alt="${person.name}">
                    <div class="cast-info">
                        <h4>${person.name}</h4>
                        <p>${person.character}</p>
                    </div>
                </div>
            `).join('');

        // Update additional info
        document.querySelector('.status p').textContent = 
            this.movieData.status || 'Unknown';
        document.querySelector('.original-language p').textContent = 
            this.movieData.original_language?.toUpperCase() || 'Unknown';
        document.querySelector('.budget p').textContent = 
            this.movieData.budget ? `$${this.formatNumber(this.movieData.budget)}` : 'N/A';
        document.querySelector('.revenue p').textContent = 
            this.movieData.revenue ? `$${this.formatNumber(this.movieData.revenue)}` : 'N/A';
        
        document.querySelector('.production-companies p').textContent = 
            this.movieData.production_companies
                .map(company => company.name)
                .join(', ') || 'N/A';
        
        document.querySelector('.production-countries p').textContent = 
            this.movieData.production_countries
                .map(country => country.name)
                .join(', ') || 'N/A';

        // Update videos
        const videosGrid = document.querySelector('.videos-grid');
        const trailers = this.movieData.videos.results
            .filter(video => video.type === 'Trailer' || video.type === 'Teaser')
            .slice(0, 3);

        videosGrid.innerHTML = trailers.length 
            ? trailers.map(video => `
                <div class="video-item">
                    <iframe
                        src="https://www.youtube.com/embed/${video.key}"
                        title="${video.name}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            `).join('')
            : '<p>No videos available</p>';

        // Update similar titles
        const similarGrid = document.querySelector('.similar-grid');
        similarGrid.innerHTML = this.movieData.similar.results
            .slice(0, 6)
            .map(item => `
                <div class="movie-card">
                    <a href="details.html?id=${item.id}&type=${this.mediaType}">
                        <img src="${item.poster_path 
                            ? config.imageBaseUrl + item.poster_path 
                            : 'placeholder-image.jpg'}" 
                            alt="${item.title || item.name}">
                        <div class="movie-info">
                            <h3>${item.title || item.name}</h3>
                            <span class="rating">
                                <i class="fas fa-star"></i>
                                ${item.vote_average.toFixed(1)}
                            </span>
                        </div>
                    </a>
                </div>
            `).join('');

        // Update favorite button
        const isFavorite = this.favorites.some(fav => fav.id === this.movieData.id);
        const favoriteBtn = document.querySelector('.favorite-btn i');
        favoriteBtn.classList.toggle('fas', isFavorite);
        favoriteBtn.classList.toggle('far', !isFavorite);
    }

    toggleFavorite(movie) {
        const index = this.favorites.findIndex(fav => fav.id === movie.id);
        if (index === -1) {
            this.favorites.push(movie);
        } else {
            this.favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        const btn = document.querySelector('.favorite-btn i');
        btn.classList.toggle('fas');
        btn.classList.toggle('far');
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }

    showError(message) {
        document.querySelector('.loading-spinner').style.display = 'none';
        document.querySelector('.details-content').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <a href="index.html" class="back-button">Back to Movies</a>
            </div>
        `;
    }
}

// Initialize the details page
document.addEventListener('DOMContentLoaded', () => {
    new MovieDetails();
});
