// LYRION Shop - Pagination, Filters, and Product Links
(function() {
  'use strict';

  // Build version for cache busting
  window.SITE_BUILD = "v1.0.0";

  let catalogData = null;
  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = 'men';
  let currentSign = 'all';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 12;

  // Initialize on page load
  async function init() {
    try {
      const response = await fetch('/data/catalog.json');
      catalogData = await response.json();
      
      // Build allProducts array from catalog
      catalogData.zodiacs.forEach(zodiac => {
        zodiac.products.forEach(product => {
          allProducts.push({
            ...product,
            sign: zodiac.sign,
            mood: zodiac.mood,
            story: zodiac.story
          });
        });
      });

      // Initialize shop if on shop page
      if (document.querySelector('.shop-catalog')) {
        initShopPage();
      }
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  }

  // Resolve product image path
  function resolveImagePath(product) {
    // If product has baseImage, use it
    if (product.baseImage) {
      return product.baseImage + '?v=' + window.SITE_BUILD;
    }

    // Check if kids product
    const isKids = product.tags && (
      product.tags.includes('kids') || 
      product.tags.includes('boys') || 
      product.tags.includes('girls') ||
      product.audience === 'kids' ||
      product.category === 'kids'
    );

    if (isKids) {
      return '/assets/img/kids-cherub-balance.jpg?v=' + window.SITE_BUILD;
    }

    // Generate from sign and type
    const sign = product.sign ? product.sign.toLowerCase() : '';
    const type = product.type || '';
    const imagePath = `/assets/img/${sign}-${type}.jpg?v=${window.SITE_BUILD}`;
    
    return imagePath;
  }

  // Check if product is kids
  function isKidsProduct(product) {
    return product.tags && (
      product.tags.includes('kids') || 
      product.tags.includes('boys') || 
      product.tags.includes('girls') ||
      product.audience === 'kids' ||
      product.category === 'kids'
    );
  }

  // Get price for product type
  function priceFor(type) {
    const pricing = catalogData.pricing[type];
    if (!pricing) return null;
    return pricing;
  }

  // Format price display
  function formatPrice(price) {
    return `£${price.toFixed(0)}`;
  }

  // Create product card HTML
  function createProductCard(product) {
    const pricing = priceFor(product.type);
    if (!pricing) return '';

    const priceDisplay = `<span class="price">${formatPrice(pricing.rrp)}</span> <span class="price-compare">${formatPrice(pricing.compareAt)}</span>`;
    const imagePath = resolveImagePath(product);
    const isKids = isKidsProduct(product);

    return `
      <a href="/product.html?sku=${product.sku}" class="product-link">
        <div class="product-card" data-sku="${product.sku}">
          <div class="product-image">
            ${isKids ? '<img src="/assets/img/kids-mark.png" class="kids-badge" alt="LYRION Children" loading="lazy">' : ''}
            <img src="${imagePath}" alt="${product.title}" loading="lazy" onerror="this.src='/assets/img/placeholder-soft.jpg?v=${window.SITE_BUILD}'">
          </div>
          <div class="product-info">
            <h4 class="product-title">${product.title}</h4>
            <p class="product-story">${product.story || ''}</p>
            <span class="lead-time">${product.leadDays}–${product.leadDays + 1} days production</span>
            <div class="product-pricing">
              ${priceDisplay}
            </div>
          </div>
        </div>
      </a>
    `;
  }

  // Filter products by category
  function filterByCategory(category) {
    let filtered = [];

    switch(category) {
      case 'men':
        filtered = allProducts.filter(p => 
          ['hoodie', 'tee', 'cap', 'beanie', 'sock'].includes(p.type) && 
          p.tags && (p.tags.includes('unisex') || p.tags.includes('men'))
        );
        break;
      case 'women':
        filtered = allProducts.filter(p => 
          ['hoodie', 'tee', 'scarf', 'sock'].includes(p.type) && 
          p.tags && (p.tags.includes('unisex') || p.tags.includes('women'))
        );
        break;
      case 'children':
        filtered = allProducts.filter(p => 
          p.tags && (p.tags.includes('kids') || p.tags.includes('boys') || p.tags.includes('girls'))
        );
        break;
      case 'home':
        filtered = allProducts.filter(p => 
          ['framed_print_A3', 'poster_A3', 'cushion', 'candle', 'mug', 'tote', 'journal'].includes(p.type)
        );
        break;
      case 'bundles':
        // Bundles are handled separately
        return [];
      default:
        filtered = allProducts;
    }

    return filtered;
  }

  // Filter by sign
  function filterBySign(products, sign) {
    if (sign === 'all') return products;
    return products.filter(p => p.sign && p.sign.toLowerCase() === sign.toLowerCase());
  }

  // Render products grid with pagination
  function renderProducts() {
    const container = document.querySelector('#productsGrid');
    if (!container) return;

    // Get filtered products
    let products = filterByCategory(currentCategory);
    products = filterBySign(products, currentSign);
    filteredProducts = products;

    // Calculate pagination
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageProducts = products.slice(startIndex, endIndex);

    // Render products
    if (pageProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Nothing yet in this constellation.</h3>
          <p>We're still crafting pieces for this collection.</p>
          <a href="/collections.html" class="btn-outline">View All Collections</a>
        </div>
      `;
    } else {
      container.innerHTML = pageProducts.map(p => createProductCard(p)).join('');
    }

    // Update count
    const countEl = document.querySelector('#productCount');
    if (countEl) {
      countEl.textContent = `${totalProducts} items`;
    }

    // Render show more / pagination
    renderPagination(totalPages);
  }

  // Render pagination
  function renderPagination(totalPages) {
    const paginationContainer = document.querySelector('#pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    if (currentPage < totalPages) {
      paginationContainer.innerHTML = `
        <button class="btn show-more-btn" id="showMoreBtn">
          Show more (12)
        </button>
      `;
      document.querySelector('#showMoreBtn').addEventListener('click', () => {
        currentPage++;
        renderProducts();
        // Scroll to new content
        window.scrollTo({
          top: document.querySelector('#productsGrid').offsetTop - 100,
          behavior: 'smooth'
        });
      });
    } else {
      paginationContainer.innerHTML = '<p style="text-align:center;color:var(--muted);">All products shown</p>';
    }
  }

  // Initialize Shop Page
  function initShopPage() {
    const container = document.querySelector('.shop-catalog');
    if (!container) return;

    // Render category chips
    const categoriesHTML = `
      <div class="shop-categories">
        <button class="category-chip active" data-category="men">Men</button>
        <button class="category-chip" data-category="women">Women</button>
        <button class="category-chip" data-category="children">Children</button>
        <button class="category-chip" data-category="home">Home & Art</button>
        <button class="category-chip" data-category="bundles">Bundles</button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', categoriesHTML);

    // Add Sign filter dropdown
    const signFilterHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:24px 0;">
        <div id="productCount" style="color:var(--muted);font-size:.95rem;"></div>
        <div class="sign-filter">
          <button class="filter-btn" id="signFilterBtn">Filter by Sign ▾</button>
          <div class="sign-dropdown" id="signDropdown">
            <button data-sign="all">All Signs</button>
            ${catalogData.zodiacs.map(z => `<button data-sign="${z.sign.toLowerCase()}">${z.sign}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', signFilterHTML);

    // Products grid container
    container.insertAdjacentHTML('beforeend', '<div id="productsGrid" class="products-grid"></div>');
    
    // Pagination container
    container.insertAdjacentHTML('beforeend', '<div id="pagination"></div>');

    // Attach event listeners
    setupEventListeners();

    // Initial render
    renderProducts();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.category;
        currentPage = 1;
        
        if (currentCategory === 'bundles') {
          renderBundles();
        } else {
          renderProducts();
        }
      });
    });

    // Sign filter dropdown
    const signBtn = document.querySelector('#signFilterBtn');
    const signDropdown = document.querySelector('#signDropdown');
    
    if (signBtn && signDropdown) {
      signBtn.addEventListener('click', () => {
        signDropdown.classList.toggle('active');
      });

      signDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentSign = e.target.dataset.sign;
          currentPage = 1;
          signDropdown.classList.remove('active');
          renderProducts();
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!signBtn.contains(e.target) && !signDropdown.contains(e.target)) {
          signDropdown.classList.remove('active');
        }
      });
    }
  }

  // Render bundles
  function renderBundles() {
    const container = document.querySelector('#productsGrid');
    if (!container) return;

    const bundlesHTML = catalogData.bundles.map(bundle => {
      return `
        <div class="bundle-card">
          <div class="bundle-badge">Bundle</div>
          <h4 class="bundle-title">${bundle.title}</h4>
          <p class="bundle-items">${bundle.items.join(' + ')}</p>
          <div class="bundle-pricing">
            <span class="bundle-price">${formatPrice(bundle.price)}</span>
            <span class="bundle-save">Save ${bundle.saving} vs individual</span>
          </div>
          <p class="bundle-note">*Bundles excluded from discount codes</p>
          <a href="#" class="btn" title="Coming online at launch">Build Bundle</a>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="bundles-grid">${bundlesHTML}</div>`;
    
    // Clear pagination
    const paginationContainer = document.querySelector('#pagination');
    if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }

    // Update count
    const countEl = document.querySelector('#productCount');
    if (countEl) {
      countEl.textContent = `${catalogData.bundles.length} bundles`;
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for use in product.html
  window.LyrionShop = {
    resolveImagePath,
    isKidsProduct,
    priceFor,
    formatPrice,
    getCatalog: () => catalogData
  };
})();
