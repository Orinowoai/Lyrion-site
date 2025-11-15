// LYRĪON Blog System - Client-side pagination, filtering, and history management
(function() {
  'use strict';

  let allPosts = [];
  let filteredPosts = [];
  let currentPage = 1;
  let currentTag = null;
  const postsPerPage = 12;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    try {
      // Fetch posts data
      const response = await fetch('/data/posts.json');
      if (!response.ok) throw new Error('Failed to load posts');
      allPosts = await response.json();
      
      // Initialize from URL params
      const params = new URLSearchParams(window.location.search);
      currentPage = parseInt(params.get('page')) || 1;
      currentTag = params.get('tag') || null;
      
      // Set up tag filters
      renderTagFilters();
      
      // Filter and render posts
      filterPosts();
      renderPosts();
      renderPagination();
      
      // Listen for back/forward navigation
      window.addEventListener('popstate', handlePopState);
    } catch (error) {
      console.error('Error initializing blog:', error);
      document.getElementById('blogGrid').innerHTML = '<p class="muted">Unable to load posts. Please try again later.</p>';
    }
  }

  function handlePopState() {
    const params = new URLSearchParams(window.location.search);
    currentPage = parseInt(params.get('page')) || 1;
    currentTag = params.get('tag') || null;
    filterPosts();
    renderPosts();
    renderPagination();
    updateTagFilterUI();
  }

  function filterPosts() {
    if (currentTag) {
      filteredPosts = allPosts.filter(post => post.tags && post.tags.includes(currentTag));
    } else {
      filteredPosts = [...allPosts];
    }
  }

  function renderTagFilters() {
    const tagFiltersEl = document.getElementById('tagFilters');
    if (!tagFiltersEl) return;

    // Extract unique tags
    const tagSet = new Set();
    allPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tagSet.add(tag));
      }
    });
    const tags = Array.from(tagSet).sort();

    // Render tag filter buttons
    let html = '<button class="tag-filter-btn' + (!currentTag ? ' active' : '') + '" data-tag="">All</button>';
    tags.forEach(tag => {
      const isActive = currentTag === tag ? ' active' : '';
      html += `<button class="tag-filter-btn${isActive}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
    });
    
    tagFiltersEl.innerHTML = html;

    // Add click listeners
    tagFiltersEl.querySelectorAll('.tag-filter-btn').forEach(btn => {
      btn.addEventListener('click', handleTagFilter);
    });
  }

  function updateTagFilterUI() {
    const buttons = document.querySelectorAll('.tag-filter-btn');
    buttons.forEach(btn => {
      const tag = btn.getAttribute('data-tag');
      if ((tag === '' && !currentTag) || (tag === currentTag)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function handleTagFilter(e) {
    const tag = e.target.getAttribute('data-tag');
    currentTag = tag || null;
    currentPage = 1;
    filterPosts();
    renderPosts();
    renderPagination();
    updateURL();
    updateTagFilterUI();
  }

  function renderPosts() {
    const gridEl = document.getElementById('blogGrid');
    if (!gridEl) return;

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    if (postsToShow.length === 0) {
      gridEl.innerHTML = '<p class="muted">No posts found.</p>';
      return;
    }

    let html = '';
    postsToShow.forEach(post => {
      const coverImg = post.cover 
        ? `<div class="post-card-image"><img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.title)}" loading="lazy" onerror="this.parentElement.classList.add('placeholder'); this.style.display='none';"></div>`
        : '<div class="post-card-image placeholder"></div>';
      
      const formattedDate = formatDate(post.date);
      const excerpt = post.excerpt || '';
      const postUrl = `/posts/${post.slug}.html`;

      html += `
        <article class="post-card">
          ${coverImg}
          <div class="post-card-content">
            <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
            <time class="post-card-date">${formattedDate}</time>
            <p class="post-card-excerpt">${escapeHtml(excerpt)}</p>
            <a href="${escapeHtml(postUrl)}" class="post-card-link">Read</a>
          </div>
        </article>
      `;
    });

    gridEl.innerHTML = html;
  }

  function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = '<div class="pagination-controls">';

    // Previous button
    if (currentPage > 1) {
      html += `<button class="pagination-btn" data-page="${currentPage - 1}">← Prev</button>`;
    }

    // Page numbers
    html += '<div class="pagination-numbers">';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        const isActive = i === currentPage ? ' active' : '';
        html += `<button class="pagination-btn${isActive}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += '<span class="pagination-ellipsis">…</span>';
      }
    }
    html += '</div>';

    // Next button
    if (currentPage < totalPages) {
      html += `<button class="pagination-btn" data-page="${currentPage + 1}">Next →</button>`;
    }

    html += '</div>';
    paginationEl.innerHTML = html;

    // Add click listeners
    paginationEl.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', handlePageChange);
    });
  }

  function handlePageChange(e) {
    const page = parseInt(e.target.getAttribute('data-page'));
    if (page && page !== currentPage) {
      currentPage = page;
      renderPosts();
      renderPagination();
      updateURL();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function updateURL() {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage);
    if (currentTag) params.set('tag', currentTag);
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.pushState({ page: currentPage, tag: currentTag }, '', newURL);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
