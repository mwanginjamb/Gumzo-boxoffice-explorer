class MovieApp {
    constructor() {
        this.currentPage = 1;
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.currentTab = 'discover';
        this.filters = {
            mediaType: 'movie',
            sortBy: 'popularity.desc',
            genre: '',
            year: '',
            query: '',
            country: ''
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadGenres();
        this.loadCountries();
        this.populateYearDropdown();
        this.fetchMovies();
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('mediaType').addEventListener('change', (e) => {
            this.filters.mediaType = e.target.value;
            this.resetAndFetch();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.resetAndFetch();
        });

        document.getElementById('genre').addEventListener('change', (e) => {
            this.filters.genre = e.target.value;
            this.resetAndFetch();
        });

        document.getElementById('country').addEventListener('change', (e) => {
            this.filters.country = e.target.value;
            this.resetAndFetch();
        });

        document.getElementById('year').addEventListener('change', (e) => {
            this.filters.year = e.target.value;
            this.resetAndFetch();
        });

        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.filters.query = e.target.value;
                this.resetAndFetch();
            }, 500);
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Mobile filter toggle
        document.getElementById('filterToggle').addEventListener('click', () => {
            document.querySelector('.filter-section').classList.toggle('active');
        });

        // Infinite scroll
        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
                this.loadMoreMovies();
            }
        });
    }

    async loadGenres() {
        try {
            const response = await fetch(`${config.baseUrl}/genre/${this.filters.mediaType}/list?api_key=${config.apiKey}`);
            const data = await response.json();
            this.populateGenreDropdown(data.genres);
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }

    populateGenreDropdown(genres) {
        const genreSelect = document.getElementById('genre');
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
    }

    async loadCountries() {
        try {
            const response = await fetch(`${config.baseUrl}/configuration/countries?api_key=${config.apiKey}`);
            const countries = await response.json();
            this.populateCountryDropdown(countries);
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }

    populateCountryDropdown(countries) {
        const countrySelect = document.getElementById('country');
        // Sort countries by English name
        countries.sort((a, b) => a.english_name.localeCompare(b.english_name));
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.iso_3166_1;
            option.textContent = country.english_name;
            countrySelect.appendChild(option);
        });
    }

    populateYearDropdown() {
        const yearSelect = document.getElementById('year');
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1900; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    async fetchMovies() {
        try {
            let url;
            if (this.filters.query) {
                url = `${config.baseUrl}/search/${this.filters.mediaType}?api_key=${config.apiKey}&query=${encodeURIComponent(this.filters.query)}&page=${this.currentPage}`;
            } else {
                url = `${config.baseUrl}/discover/${this.filters.mediaType}?api_key=${config.apiKey}&sort_by=${this.filters.sortBy}&page=${this.currentPage}`;
                if (this.filters.genre) url += `&with_genres=${this.filters.genre}`;
                if (this.filters.year) url += `&year=${this.filters.year}`;
                if (this.filters.country) {
                    if (this.filters.mediaType === 'movie') {
                        url += `&with_origin_country=${this.filters.country}`;
                    } else {
                        url += `&with_origin_country=${this.filters.country}`;
                    }
                }
            }

            const response = await fetch(url);
            const data = await response.json();
            this.displayMovies(data.results);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    }

    displayMovies(movies, append = false) {
        const movieGrid = document.getElementById('movieGrid');
        if (!append) movieGrid.innerHTML = '';

        const template = document.getElementById('movieTemplate');
        
        movies.forEach(movie => {
            const movieElement = template.content.cloneNode(true);
            
            const posterContainer = movieElement.querySelector('.poster-container');
            const poster = movieElement.querySelector('.movie-poster');
            
            // Make poster clickable
            const posterLink = document.createElement('a');
            posterLink.href = `details.html?id=${movie.id}&type=${this.filters.mediaType}`;
            poster.src = movie.poster_path 
                ? `${config.imageBaseUrl}${movie.poster_path}`
                : 'placeholder-image.jpg';
            poster.alt = movie.title || movie.name;
            
            // Restructure the poster container to include the link
            posterContainer.insertBefore(posterLink, poster);
            posterLink.appendChild(poster);

            movieElement.querySelector('.movie-title').textContent = movie.title || movie.name;
            
            const releaseDate = movie.release_date || movie.first_air_date;
            movieElement.querySelector('.release-date').textContent = releaseDate 
                ? new Date(releaseDate).getFullYear()
                : 'N/A';

            movieElement.querySelector('.rating-value').textContent = movie.vote_average.toFixed(1);

            const favoriteBtn = movieElement.querySelector('.favorite-btn');
            const isFavorite = this.favorites.some(fav => fav.id === movie.id);
            favoriteBtn.querySelector('i').classList.toggle('fas', isFavorite);
            favoriteBtn.querySelector('i').classList.toggle('far', !isFavorite);

            favoriteBtn.addEventListener('click', () => this.toggleFavorite(movie));

            movieGrid.appendChild(movieElement);
        });
    }

    toggleFavorite(movie) {
        const index = this.favorites.findIndex(fav => fav.id === movie.id);
        if (index === -1) {
            this.favorites.push(movie);
        } else {
            this.favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        if (this.currentTab === 'favorites') {
            this.displayMovies(this.favorites);
        } else {
            const btn = document.querySelector(`[data-movie-id="${movie.id}"] .favorite-btn i`);
            btn.classList.toggle('fas');
            btn.classList.toggle('far');
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        if (tab === 'favorites') {
            this.displayMovies(this.favorites);
        } else {
            this.resetAndFetch();
        }
    }

    resetAndFetch() {
        this.currentPage = 1;
        this.fetchMovies();
    }

    loadMoreMovies() {
        if (this.currentTab === 'discover') {
            this.currentPage++;
            this.fetchMovies();
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new MovieApp();
});
