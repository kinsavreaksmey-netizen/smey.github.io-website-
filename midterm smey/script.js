document.addEventListener("DOMContentLoaded", () => {

  /* ================= 1. MENU CATEGORY FILTER ================= */
  const filterButtons = document.querySelectorAll('.categories button');
  const menuItems = document.querySelectorAll('.menu-item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      menuItems.forEach(item => {
        const match = filter === 'all' || item.getAttribute('data-category') === filter;
        item.style.display = match ? 'flex' : 'none';
      });
    });
  });


  /* ================= 2. LIVE SEARCH + SCROLL ================= */
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');

  function filterFood() {
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();

    // FIX: reset category filter buttons when searching
    filterButtons.forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.categories button[data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');

    menuItems.forEach(item => {
      const titleEl = item.querySelector('h4');
      if (!titleEl) return;
      const match = query === '' || titleEl.innerText.toLowerCase().includes(query);
      item.style.display = match ? 'flex' : 'none';
    });

    if (query !== '') {
      const menuSection = document.getElementById('menu');
      if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (searchInput) searchInput.addEventListener('input', filterFood);
  if (searchBtn)   searchBtn.addEventListener('click', filterFood);


  /* ================= 3. BOOTSTRAP HANDLES MOBILE NAV ================= */
  // FIX: the HTML now uses Bootstrap's navbar-toggler + collapse — no custom
  // hamburger JS needed. The old code referenced #hamburger-btn and
  // #mobile-menu which no longer exist in the fixed HTML.
  // Close Bootstrap navbar when a nav-link is clicked (smooth UX on mobile)
  const navLinks = document.querySelectorAll('#navbarNav .nav-link');
  const navCollapse = document.getElementById('navbarNav');
  if (navCollapse) {
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Bootstrap 5 collapse API
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      });
    });
  }


  /* ================= 4. CART ================= */
  let cart = [];

  // FIX: all element IDs now match the single cart sidebar in the fixed HTML
  const cartCountBadge  = document.getElementById('cart-count');         // navbar badge
  const cartCountSide   = document.getElementById('cart-sidebar-count'); // sidebar header count
  const cartContainer   = document.getElementById('cart-items-container');
  const cartTotalPrice  = document.getElementById('cart-total-price');
  const toast           = document.getElementById('toast');

  // FIX: cart modal uses .cart-sidebar-overlay#cart-modal + .open class (not .active)
  const cartModal       = document.getElementById('cart-modal');
  const cartIconBtn     = document.getElementById('cart-icon-btn');
  const closeCartBtn    = document.getElementById('close-cart-btn');

  function openCart()  { if (cartModal) cartModal.classList.add('open'); }
  function closeCart() { if (cartModal) cartModal.classList.remove('open'); }

  // Click overlay background to close cart
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) closeCart();
    });
  }

  if (cartIconBtn) cartIconBtn.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

  // --- Render cart UI ---
  function updateCartUI() {
    if (!cartContainer) return;
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
      cartContainer.classList.remove('has-items');
      cartContainer.innerHTML = '<p class="empty-message">មិនទាន់មានទំនិញក្នុងកន្ត្រកឡើយ។</p>';
      if (cartCountBadge) cartCountBadge.innerText = '0';
      if (cartCountSide)  cartCountSide.innerText  = '0';
      if (cartTotalPrice) cartTotalPrice.innerText  = '$0.00';
      return;
    }

    cartContainer.classList.add('has-items');
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;

      // FIX: use a safe fallback image placeholder if image src is missing/broken
      const imgSrc = item.image || '';
      cartContainer.innerHTML += `
        <div class="cart-item">
          ${imgSrc ? `<img src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'">` : ''}
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart('${item.name.replace(/'/g, "\\'")}')">Remove</button>
        </div>
      `;
    });

    if (cartCountBadge) cartCountBadge.innerText = totalItems;
    if (cartCountSide)  cartCountSide.innerText  = totalItems;
    if (cartTotalPrice) cartTotalPrice.innerText  = `$${totalPrice.toFixed(2)}`;
  }

  // --- Add to cart ---
  function addToCart(name, price, image) {
    // FIX: price comes from data-price attribute (already a clean number string)
    const cleanPrice = parseFloat(price);
    if (isNaN(cleanPrice)) return;

    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ name, price: cleanPrice, image, quantity: 1 });
    }

    showToast(`✅ បានបន្ថែម ${name} ទៅក្នុងកន្ត្រក!`, '#28a745');
    openCart();
    updateCartUI();
  }

  // Expose removeFromCart globally for inline onclick handlers
  window.removeFromCart = function(name) {
    const item = cart.find(i => i.name === name);
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1; // FIX: decrease by 1 instead of removing entirely
      } else {
        cart = cart.filter(i => i.name !== name);
      }
    }
    updateCartUI();
  };

  // FIX: read name/price from data-name and data-price attributes (set in fixed HTML)
  document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = e.currentTarget.closest('.menu-item');
      if (!card) return;

      const name  = e.currentTarget.getAttribute('data-name')
                 || card.querySelector('h4')?.textContent.trim();
      const price = e.currentTarget.getAttribute('data-price')
                 || card.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '');
      const img   = card.querySelector('img')?.src || '';

      if (name && price) addToCart(name, price, img);
    });
  });


  /* ================= 5. CHECKOUT ================= */
  // FIX: querySelector gets the FIRST .checkout-btn — correct since there is now only one
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('⚠️ មិនអាចទូទាត់បានទេ! កន្ត្រកទំនិញរបស់អ្នកនៅទទេឡើយ។', '#dc3545');
        return;
      }
      showToast('🎉 ការទូទាត់ប្រាក់ត្រូវបានធ្វើឡើងដោយជោគជ័យ! អរគុណ។', '#28a745');
      cart = [];
      updateCartUI();
      closeCart();
    });
  }


  /* ================= 6. LOGIN MODAL ================= */
  const loginNavBtn = document.getElementById('login-nav-btn');
  const loginModal  = document.getElementById('login-modal');
  const closeModal  = document.querySelector('.close-modal');
  const loginForm   = document.getElementById('login-form');

  if (loginNavBtn && loginModal) {
    loginNavBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.classList.add('open');
    });
  }

  if (closeModal && loginModal) {
    closeModal.addEventListener('click', () => loginModal.classList.remove('open'));
  }

  // Close login modal on backdrop click
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) loginModal.classList.remove('open');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginModal.classList.remove('open');
      showToast('👋 Welcome! Login Successful.', '#28a745');
      loginForm.reset();
    });
  }


  /* ================= 7. CONTACT FORM ================= */
  // FIX: old code used a <form> that reloaded the page; now handled via JS
  const sendBtn = document.getElementById('send-contact-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const inputs = document.querySelectorAll('.contact-form input');
      let allFilled = true;
      inputs.forEach(input => {
        if (!input.value.trim()) allFilled = false;
      });

      if (!allFilled) {
        showToast('⚠️ សូមបំពេញព័ត៌មានឱ្យបានពេញលេញ!', '#dc3545');
        return;
      }

      showToast('📨 សារបានផ្ញើដោយជោគជ័យ! យើងនឹងទំនាក់ទំនងអ្នកឆាប់ៗ។', '#28a745');
      inputs.forEach(input => input.value = '');
    });
  }


  /* ================= 8. TOAST HELPER ================= */
  let toastTimer = null;
  function showToast(message, bgColor = '#28a745') {
    if (!toast) return;
    // FIX: clear any running timer so rapid clicks don't stack
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.style.backgroundColor = bgColor;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

});