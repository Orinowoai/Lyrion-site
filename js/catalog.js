// LYRĪON Catalog System - Premium POD catalog with zodiac products
(function() {
  'use strict';

  let catalogData = null;
  let currentFilter = 'all';
  let currentSign = 'all';
  let promoCode = null;

  // Initialize on page load
  async function init() {
    try {
      const response = await fetch('/data/catalog.json');
      catalogData = await response.json();
      
      // Parse promo code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('code');
      if (codeParam) {
        const validCode = catalogData.promotions.codes.find(c => c.code === codeParam);
        if (validCode) {
          promoCode = validCode;
        }
      }

      // Initialize based on current page
      if (document.querySelector('.shop-catalog')) {
        initShopPage();
      }
      if (document.querySelector('.collections-grid')) {
        initCollectionsPage();
      }

      // Add Schema.org JSON-LD
      addSchemaOrg();
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  }

  // Get price for product type with optional discount
  function priceFor(type, isBundle = false) {
    const pricing = catalogData.pricing[type];
    if (!pricing) return null;

    let rrp = pricing.rrp;
    let compareAt = pricing.compareAt;
    let discounted = null;

    // Apply promo code (bundles excluded)
    if (promoCode && !isBundle) {
      discounted = rrp * (1 - promoCode.percent / 100);
    }

    return { rrp, compareAt, discounted };
  }

  // Format price display
  function formatPrice(price) {
    return `£${price.toFixed(0)}`;
  }

  // Create product card HTML
  function createProductCard(product, zodiac) {
    const supplier = catalogData.suppliers[product.supplier];
    const pricing = priceFor(product.type);
    
    if (!pricing) return '';

    const priceDisplay = pricing.discounted 
      ? `<span class="price-now">${formatPrice(pricing.discounted)}</span> <span class="price-was">${formatPrice(pricing.rrp)}</span>`
      : `<span class="price">${formatPrice(pricing.rrp)}</span> <span class="price-compare">${formatPrice(pricing.compareAt)}</span>`;

    const tagsStr = product.tags.join(',');
    const signClass = zodiac ? zodiac.sign.toLowerCase() : '';

    return `
      <div class="product-card" 
           data-sku="${product.sku}" 
           data-supplier="${product.supplier}"
           data-tags="${tagsStr}"
           data-sign="${signClass}"
           data-type="${product.type}">
        <div class="product-image">
          <img src="${product.baseImage}" alt="${product.title}" loading="lazy" onerror="this.style.background='linear-gradient(135deg, var(--panel), var(--panel-strong))'">
        </div>
        <div class="product-info">
          <h4 class="product-title">${product.title}</h4>
          <p class="product-story">${zodiac ? zodiac.story : ''}</p>
          <div class="product-meta">
            <span class="supplier-badge" title="${supplier.notes}">
              ${supplier.name} • ${product.regions}
            </span>
            <span class="lead-time">${product.leadDays}–${product.leadDays + 1} days production</span>
          </div>
          <div class="product-pricing">
            ${priceDisplay}
          </div>
          <a href="#" class="product-cta btn" title="Coming online at launch">View</a>
        </div>
      </div>
    `;
  }

  // Create bundle card HTML
  function createBundleCard(bundle) {
    const itemTypes = bundle.items.map(item => {
      const pricing = catalogData.pricing[item];
      return pricing ? pricing.rrp : 0;
    });
    const totalRRP = itemTypes.reduce((sum, price) => sum + price, 0);

    return `
      <div class="bundle-card" data-bundle="${bundle.slug}">
        <div class="bundle-badge">Bundle</div>
        <h4 class="bundle-title">${bundle.title}</h4>
        <p class="bundle-items">${bundle.items.join(' + ')}</p>
        <div class="bundle-pricing">
          <span class="bundle-price">${formatPrice(bundle.price)}</span>
          <span class="bundle-save">Save ${bundle.saving} vs individual</span>
        </div>
        <p class="bundle-note">*Bundles excluded from discount codes</p>
        <a href="#" class="product-cta btn" title="Coming online at launch">Build Bundle</a>
      </div>
    `;
  }

  // Initialize Shop Page
  function initShopPage() {
    const container = document.querySelector('.shop-catalog');
    if (!container) return;

    // Render promo banner
    if (catalogData.promotions.holidayBanner) {
      const banner = document.createElement('div');
      banner.className = 'promo-banner';
      banner.innerHTML = `<p>${catalogData.promotions.holidayBanner}</p>`;
      container.insertBefore(banner, container.firstChild);
    }

    // Render filters
    const filtersHTML = `
      <div class="catalog-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="apparel">Apparel</button>
        <button class="filter-btn" data-filter="accessory">Accessories</button>
        <button class="filter-btn" data-filter="socks">Socks</button>
        <button class="filter-btn" data-filter="home">Homeware</button>
        <button class="filter-btn" data-filter="bundles">Bundles</button>
        <div class="sign-filter">
          <button class="filter-btn" data-filter="sign">Sign ▾</button>
          <div class="sign-dropdown">
            ${catalogData.zodiacs.map(z => `<button data-sign="${z.sign.toLowerCase()}">${z.sign}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('afterbegin', filtersHTML);

    // Collect all products
    const allProducts = [];
    catalogData.zodiacs.forEach(zodiac => {
      zodiac.products.forEach(product => {
        allProducts.push({ product, zodiac });
      });
    });

    // Group products by category
    const sections = [
      { title: 'Signature Hoodies', id: 'hoodies', filter: p => p.product.type === 'hoodie' },
      { title: 'Essential Tees', id: 'tees', filter: p => p.product.type === 'tee' },
      { title: 'Accessories', id: 'accessories', filter: p => ['cap', 'beanie', 'scarf', 'tote'].includes(p.product.type) },
      { title: 'Socks & Intimates', id: 'socks', filter: p => p.product.type === 'sock' },
      { title: 'Homeware & Art', id: 'homeware', filter: p => ['candle', 'cushion', 'mug', 'journal', 'framed_print_A3', 'poster_A3'].includes(p.product.type) }
    ];

    // Render sections
    sections.forEach(section => {
      const sectionProducts = allProducts.filter(section.filter);
      if (sectionProducts.length === 0) return;

      const sectionHTML = `
        <section class="catalog-section" id="${section.id}">
          <h2>${section.title}</h2>
          <div class="products-grid">
            ${sectionProducts.map(({ product, zodiac }) => createProductCard(product, zodiac)).join('')}
          </div>
        </section>
      `;
      container.insertAdjacentHTML('beforeend', sectionHTML);
    });

    // Render bundles
    const bundlesHTML = `
      <section class="catalog-section" id="bundles">
        <h2>Zodiac Bundles</h2>
        <div class="bundles-grid">
          ${catalogData.bundles.map(bundle => createBundleCard(bundle)).join('')}
        </div>
      </section>
    `;
    container.insertAdjacentHTML('beforeend', bundlesHTML);

    // Attach filter event listeners
    setupFilters();
  }

  // Initialize Collections Page
  function initCollectionsPage() {
    const container = document.querySelector('.collections-grid');
    if (!container) return;

    const zodiacHTML = catalogData.zodiacs.map(zodiac => `
      <div class="zodiac-tile" data-sign="${zodiac.sign.toLowerCase()}">
        <div class="zodiac-header">
          <h3>${zodiac.sign}</h3>
          <p class="zodiac-mood">${zodiac.mood}</p>
        </div>
        <button class="zodiac-toggle btn-outline">Open Collection</button>
        <div class="zodiac-products" style="display: none;">
          <div class="products-grid">
            ${zodiac.products.map(product => createProductCard(product, zodiac)).join('')}
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = zodiacHTML;

    // Attach toggle listeners
    document.querySelectorAll('.zodiac-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tile = e.target.closest('.zodiac-tile');
        const products = tile.querySelector('.zodiac-products');
        const isOpen = products.style.display === 'block';
        
        products.style.display = isOpen ? 'none' : 'block';
        e.target.textContent = isOpen ? 'Open Collection' : 'Close Collection';
      });
    });
  }

  // Setup filter controls
  function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const signDropdown = document.querySelector('.sign-dropdown');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        
        if (filter === 'sign') {
          signDropdown.classList.toggle('active');
          return;
        }

        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        currentFilter = filter;
        currentSign = 'all';
        applyFilters();
      });
    });

    // Sign dropdown
    if (signDropdown) {
      signDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentSign = e.target.dataset.sign;
          currentFilter = 'all';
          filterBtns.forEach(b => b.classList.remove('active'));
          signDropdown.classList.remove('active');
          applyFilters();
        });
      });
    }
  }

  // Apply active filters
  function applyFilters() {
    const cards = document.querySelectorAll('.product-card');
    const sections = document.querySelectorAll('.catalog-section');

    cards.forEach(card => {
      const tags = card.dataset.tags.split(',');
      const sign = card.dataset.sign;
      const type = card.dataset.type;
      let show = true;

      if (currentFilter !== 'all') {
        if (currentFilter === 'bundles') {
          show = false; // Only show bundle cards, not product cards
        } else if (currentFilter === 'apparel') {
          show = ['hoodie', 'tee'].includes(type);
        } else if (currentFilter === 'accessory') {
          show = ['cap', 'beanie', 'scarf', 'tote'].includes(type);
        } else if (currentFilter === 'socks') {
          show = type === 'sock';
        } else if (currentFilter === 'home') {
          show = ['candle', 'cushion', 'mug', 'journal', 'framed_print_A3', 'poster_A3'].includes(type);
        } else {
          show = tags.includes(currentFilter);
        }
      }

      if (currentSign !== 'all') {
        show = show && sign === currentSign;
      }

      card.style.display = show ? '' : 'none';
    });

    // Show/hide sections based on visible cards
    sections.forEach(section => {
      if (section.id === 'bundles') {
        section.style.display = currentFilter === 'all' || currentFilter === 'bundles' ? '' : 'none';
      } else {
        const visibleCards = section.querySelectorAll('.product-card:not([style*="display: none"])');
        section.style.display = visibleCards.length > 0 ? '' : 'none';
      }
    });
  }

  // Add Schema.org JSON-LD for products and organization
  function addSchemaOrg() {
    // Organization schema
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "LYRĪON",
      "description": "Celestial Couture House - Luxury zodiac apparel & objects",
      "url": window.location.origin
    };

    // WebSite schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "LYRĪON - Celestial Couture House",
      "url": window.location.origin
    };

    // Add to head
    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.textContent = JSON.stringify(orgSchema);
    document.head.appendChild(orgScript);

    const websiteScript = document.createElement('script');
    websiteScript.type = 'application/ld+json';
    websiteScript.textContent = JSON.stringify(websiteSchema);
    document.head.appendChild(websiteScript);

    // Product schemas for shop page
    if (document.querySelector('.shop-catalog')) {
      const productSchemas = [];
      catalogData.zodiacs.forEach(zodiac => {
        zodiac.products.forEach(product => {
          const pricing = priceFor(product.type);
          if (!pricing) return;

          productSchemas.push({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.title,
            "description": zodiac.story,
            "brand": {
              "@type": "Brand",
              "name": catalogData.brand
            },
            "offers": {
              "@type": "Offer",
              "price": pricing.discounted || pricing.rrp,
              "priceCurrency": "GBP",
              "availability": "https://schema.org/InStock"
            }
          });
        });
      });

      // Add product schemas
      productSchemas.forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
