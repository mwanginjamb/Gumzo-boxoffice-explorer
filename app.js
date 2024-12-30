class MovieApp {
    constructor() {
        this.currentPage = 1;
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.currentTab = 'discover';
        this.filters = {
            mediaType: 'movie',
            sortBy: 'popularity.desc',
            genres: [],
            years: [],
            query: '',
            countries: []
        };

        this.init();
    }

    init() {
        this.footerRender();
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
            this.filters.genres = Array.from(e.target.selectedOptions).map(option => option.value).filter(val => val !== '');
            this.updateSelectedCount(e.target);
            this.resetAndFetch();
        });

        document.getElementById('country').addEventListener('change', (e) => {
            this.filters.countries = Array.from(e.target.selectedOptions).map(option => option.value).filter(val => val !== '');
            this.updateSelectedCount(e.target);
            this.resetAndFetch();
        });

        document.getElementById('year').addEventListener('change', (e) => {
            this.filters.years = Array.from(e.target.selectedOptions).map(option => option.value).filter(val => val !== '');
            this.updateSelectedCount(e.target);
            this.resetAndFetch();
        });

        // Clear filters button
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
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
                this.loadMoreMovies(true);
            }
        });

        // Initialize selected counts
        ['genre', 'country', 'year'].forEach(id => {
            this.updateSelectedCount(document.getElementById(id));
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

    async fetchMovies(option) {
        try {
            let url = `${config.baseUrl}/discover/${this.filters.mediaType}?api_key=${config.apiKey}&page=${this.currentPage}&sort_by=${this.filters.sortBy}`;

            // Add multiple genres if selected
            if (this.filters.genres.length > 0) {
                url += `&with_genres=${this.filters.genres.join(',')}`;
            }

            // Add multiple countries if selected
            if (this.filters.countries.length > 0) {
                url += `&with_origin_country=${this.filters.countries.join('|')}`;
            }

            // Add multiple years if selected
            if (this.filters.years.length > 0) {
                const yearConditions = this.filters.years.map(year =>
                    `${year}-01-01|${year}-12-31`
                ).join('|');
                url += `&primary_release_date.gte=${yearConditions}`;
            }

            if (this.filters.query) {
                url = `${config.baseUrl}/search/${this.filters.mediaType}?api_key=${config.apiKey}&query=${encodeURIComponent(this.filters.query)}&page=${this.currentPage}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            this.displayMovies(data.results, option);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    }

    async displayMovies(movies, append = false) {
        console.log(`Appending option is .... ${append}`);
        const movieGrid = document.getElementById('movieGrid');
        if (!append) movieGrid.innerHTML = '';

        const template = document.getElementById('movieTemplate');

        for (const movie of movies) {
            const movieElement = template.content.cloneNode(true);

            const posterContainer = movieElement.querySelector('.poster-container');
            const poster = movieElement.querySelector('.movie-poster');

            // Make poster clickable
            const posterLink = document.createElement('a');
            posterLink.href = `details.html?id=${movie.id}&type=${movie?.type || this.filters.mediaType}`;
            poster.src = movie.poster_path
                ? `${config.imageBaseUrl}${movie.poster_path}`
                : 'placeholder-image.jpeg';
            poster.alt = movie.title || movie.name;

            // Add episode info for TV shows
            if (this.filters.mediaType === 'tv' || movie?.type === 'tv') {
                try {
                    const episodeInfo = await this.fetchLatestEpisode(movie.id);
                    if (episodeInfo) {
                        const episodeDisplay = document.createElement('div');
                        episodeDisplay.className = 'episode-info';
                        episodeDisplay.innerHTML = `S${episodeInfo.season_number} E${episodeInfo.episode_number}`;
                        posterContainer.appendChild(episodeDisplay);
                    }
                } catch (error) {
                    console.error('Error fetching episode info:', error);
                }
            }

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

            movie.type = this.filters.mediaType;
            favoriteBtn.addEventListener('click', () => this.toggleFavorite(movie));

            movieGrid.appendChild(movieElement);
        }
    }

    async fetchLatestEpisode(tvId) {
        try {
            const response = await fetch(`${config.baseUrl}/tv/${tvId}?api_key=${config.apiKey}`);
            const data = await response.json();

            if (data.last_episode_to_air) {
                return {
                    season_number: data.last_episode_to_air.season_number,
                    episode_number: data.last_episode_to_air.episode_number
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching TV show details:', error);
            return null;
        }
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

    resetAndFetch(option = false) {
        this.currentPage = 1;
        this.fetchMovies(option);
    }

    loadMoreMovies(option = false) {
        if (this.currentTab === 'discover') {
            this.currentPage++;
            this.fetchMovies(option);
        }
    }

    clearFilters() {
        // Reset all multi-select elements
        ['genre', 'country', 'year'].forEach(filterId => {
            const element = document.getElementById(filterId);
            Array.from(element.options).forEach(option => option.selected = false);
            this.updateSelectedCount(element);
        });

        // Reset filters object
        this.filters = {
            mediaType: this.filters.mediaType,
            sortBy: 'popularity.desc',
            genres: [],
            years: [],
            query: '',
            countries: []
        };

        // Reset search input
        document.getElementById('searchInput').value = '';

        // Fetch movies with cleared filters
        this.resetAndFetch();
    }

    updateSelectedCount(selectElement) {
        const selectedCount = Array.from(selectElement.selectedOptions).filter(option => option.value !== '').length;
        selectElement.setAttribute('data-selected-count', selectedCount ? `${selectedCount} selected` : '');
    }


    // Footer visibility handling
    footerRender() {

        const footer = document.querySelector('.floating-footer');
        const footerToggle = footer.querySelector('.footer-toggle');
        let isSticky = false;

        // Handle scroll to show/hide footer
        window.addEventListener('scroll', () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const scrollThreshold = document.documentElement.scrollHeight - 1200; // Adjust as needed

            console.log(`scroll position is: ${scrollPosition}`)
            console.log(`scroll Threshold is: ${scrollThreshold}`)

            if (scrollPosition > scrollThreshold) {
                if (!isSticky) {
                    footer.classList.add('visible');
                    footer.classList.add('sticky');
                    isSticky = true;
                }
            } else {
                // footer.classList.remove('visible');
                footer.classList.remove('sticky');
                footer.classList.remove('collapsed');
                isSticky = false;
            }
        });

        // Handle footer collapse toggle
        footerToggle.addEventListener('click', () => {
            // if (isSticky) {
            footer.classList.toggle('collapsed');
            // }
        });

    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new MovieApp();
});
