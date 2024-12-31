const config = {
    apiKey: '8cf4797bc25394f7f06588e9899090be',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
};


// Footer visibility handling
function footerRender() {
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

document.addEventListener('DOMContentLoaded', () => {
    footerRender();
});
