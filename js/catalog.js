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
    
    // Handle missing images with placeholder
    const imageHTML = product.baseImage 
      ? `<img src="${product.baseImage}" alt="${product.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;placeholder&quot; aria-hidden=&quot;true&quot;></div>'">`
      : `<div class="placeholder" aria-hidden="true"></div>`;

    return `
      <div class="product-card" 
           data-sku="${product.sku}" 
           data-supplier="${product.supplier}"
           data-regions="${product.regions}"
           data-tags="${tagsStr}"
           data-sign="${signClass}"
           data-type="${product.type}">
        <div class="product-image">
          ${imageHTML}
        </div>
        <div class="product-info">
          <h4 class="product-title">${product.title}</h4>
          <p class="product-story">${zodiac ? zodiac.story : ''}</p>
          <span class="lead-time">${product.leadDays}–${product.leadDays + 1} days production</span>
          <div class="product-pricing">
            ${priceDisplay}
          </div>
          <a href="#" class="product-cta btn" title="Coming online at launch">View</a>
        </div>
      </div>
    `;
  }
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

    // Render promo bar in hero
    const promoHTML = `<div class="promo-bar">Solstice Event — 15% off sitewide (bundles excluded). Code: SOLSTICE15.</div>`;
    container.insertAdjacentHTML('afterbegin', promoHTML);

    // Render category tiles
    const categoryTilesHTML = `
      <div class="tiles" style="margin-top:24px;">
        <a class="tile" href="#men"><h3>Men</h3><p>Hoodies, tees, caps, socks</p></a>
        <a class="tile" href="#women"><h3>Women</h3><p>Hoodies, tees, scarves, socks</p></a>
        <a class="tile" href="#kids-boys"><h3>Kids — Boys</h3><p>Tees, hoodies, caps</p></a>
        <a class="tile" href="#kids-girls"><h3>Kids — Girls</h3><p>Tees, hoodies, scarves</p></a>
        <a class="tile" href="#home"><h3>Homeware</h3><p>Prints, candles, cushions</p></a>
        <a class="tile" href="#bundles"><h3>Bundles</h3><p>Curated zodiac sets</p></a>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', categoryTilesHTML);

    // Add Sign filter dropdown only
    const signFilterHTML = `
      <div style="display:flex;justify-content:flex-end;margin:32px 0 24px;">
        <div class="sign-filter">
          <button class="filter-btn" data-filter="sign">Sign ▾</button>
          <div class="sign-dropdown">
            <button data-sign="all">All Signs</button>
            ${catalogData.zodiacs.map(z => `<button data-sign="${z.sign.toLowerCase()}">${z.sign}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', signFilterHTML);

    // Collect all products
    const allProducts = [];
    catalogData.zodiacs.forEach(zodiac => {
      zodiac.products.forEach(product => {
        allProducts.push({ product, zodiac });
      });
    });

    // Helper to check if product matches tags
    const matchesTags = (product, tags) => {
      return tags.some(tag => product.tags.includes(tag));
    };

    // Define luxury category sections with proper filtering
    const sections = [
      { 
        title: 'Men', 
        id: 'men', 
        filter: p => ['hoodie', 'tee', 'cap', 'beanie', 'sock'].includes(p.product.type) && 
                     matchesTags(p.product, ['unisex', 'men'])
      },
      { 
        title: 'Women', 
        id: 'women', 
        filter: p => ['hoodie', 'tee', 'scarf', 'sock'].includes(p.product.type) && 
                     matchesTags(p.product, ['unisex', 'women'])
      },
      { 
        title: 'Kids — Boys', 
        id: 'kids-boys', 
        filter: p => ['tee', 'hoodie', 'cap'].includes(p.product.type) && 
                     matchesTags(p.product, ['kids', 'boys'])
      },
      { 
        title: 'Kids — Girls', 
        id: 'kids-girls', 
        filter: p => ['tee', 'hoodie', 'scarf'].includes(p.product.type) && 
                     matchesTags(p.product, ['kids', 'girls'])
      },
      { 
        title: 'Homeware', 
        id: 'home', 
        filter: p => ['framed_print_A3', 'poster_A3', 'cushion', 'candle', 'mug', 'tote', 'journal'].includes(p.product.type)
      }
    ];

    // Render sections
    sections.forEach(section => {
      const sectionProducts = allProducts.filter(section.filter);
      if (sectionProducts.length === 0) return;

      const sectionHTML = `
        <section class="catalog-section" id="${section.id}" data-category="${section.id}">
          <h2>${section.title}</h2>
          <div class="products-grid">
            ${sectionProducts.map(({ product, zodiac }) => createProductCard(product, zodiac)).join('')}
          </div>
        </section>
      `;
      container.insertAdjacentHTML('beforeend', sectionHTML);
    });

    // Render bundles section
    const bundlesHTML = `
      <section class="catalog-section" id="bundles" data-category="bundles">
        <h2>Bundles</h2>
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
    const signDropdown = document.querySelector('.sign-dropdown');
    const signFilterBtn = document.querySelector('.filter-btn[data-filter="sign"]');

    // Sign filter toggle
    if (signFilterBtn) {
      signFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        signDropdown.classList.toggle('active');
      });
    }

    // Sign dropdown options
    if (signDropdown) {
      signDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentSign = e.target.dataset.sign;
          signDropdown.classList.remove('active');
          applySignFilter();
        });
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (signDropdown && signDropdown.classList.contains('active')) {
        signDropdown.classList.remove('active');
      }
    });
  }

  // Apply sign filter to currently visible sections
  function applySignFilter() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
      const sign = card.dataset.sign;
      
      if (currentSign === 'all') {
        card.style.display = '';
      } else {
        card.style.display = sign === currentSign ? '' : 'none';
      }
    });

    // Update section visibility based on visible cards
    const sections = document.querySelectorAll('.catalog-section');
    sections.forEach(section => {
      const visibleCards = section.querySelectorAll('.product-card:not([style*="display: none"])');
      section.style.display = visibleCards.length > 0 ? '' : 'none';
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
