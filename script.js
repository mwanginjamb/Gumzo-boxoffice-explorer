// Affiliate links array with URLs and their corresponding display texts
const affiliateLinks = [
    {
        url: 'https://amzn.to/3BsfyZ8',
        text: '🎬 Amazing Amazon Deals: Rare Collector\'s Edition DVDs Just for You'
    },
    {
        url: 'https://amzn.to/4fxTuul',
        text: '📺 Amazing Amazon Deals: Premium Home Theater Essentials'
    },
    {
        url: 'https://amzn.to/3Dfj6P7',
        text: '🍿 Amazing Amazon Deals: Ultimate Movie Night Bundle'
    },
    {
        url: 'https://amzn.to/49AVpg1',
        text: '🌌 Amazing Amazon Deals: Epic Sci-Fi Collection Discounts'
    },
    {
        url: 'https://amzn.to/4gzcQzX',
        text: '👨‍👩‍👧 Amazing Amazon Deals: Family Entertainment Package'
    },
    {
        url: 'https://amzn.to/41tu25J',
        text: '🎥 Amazing Amazon Deals: Exclusive Movie Pre-Orders'
    },
    {
        url: 'https://amzn.to/3VCEXpW',
        text: '📖 Amazing Amazon Deals: Filmmaker\'s Resource Collection'
    },
    {
        url: 'https://amzn.to/4gBgEkn',
        text: '🛋️ Amazing Amazon Deals: Movie Night Comfort Essentials'
    }
];

// Banner functionality
document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('affiliateBanner');
    const closeButton = document.getElementById('closeBanner');
    const bannerToggle = document.getElementById('bannerToggle');
    const toggleButton = bannerToggle.querySelector('.toggle-button');

    // Get random affiliate link
    function getRandomLink() {
        const randomIndex = Math.floor(Math.random() * affiliateLinks.length);
        return affiliateLinks[randomIndex];
    }

    // Update banner with random link
    function updateBannerLink() {
        const bannerLink = banner.querySelector('a');
        const randomLink = getRandomLink();
        bannerLink.href = randomLink.url;
        bannerLink.textContent = randomLink.text;
    }

    function showBanner() {
        banner.classList.remove('hidden');
        bannerToggle.classList.remove('visible');
        localStorage.removeItem('affiliateBannerClosed');
        updateBannerLink(); // Update link when showing banner
    }

    function hideBanner() {
        banner.classList.add('hidden');
        bannerToggle.classList.add('visible');
        localStorage.setItem('affiliateBannerClosed', 'true');
    }

    // Check if banner was previously closed
    if (localStorage.getItem('affiliateBannerClosed')) {
        hideBanner();
    } else {
        showBanner();
    }

    // Handle close button click
    closeButton.addEventListener('click', hideBanner);

    // Handle toggle button click
    toggleButton.addEventListener('click', showBanner);

    // Initial random link setup
    updateBannerLink();
});
