/**
 * ROAM & REV - HOMEPAGE CONTROLLER
 * Hero animations, Shop by Bike switcher, Featured & New Arrival grids
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadFeaturedProducts();
  setupBikeSelector();
});

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products-grid');
  if (!container) return;

  try {
    const res = await API.getProducts({ featured: 'true', limit: 8 });
    if (res.success && res.products && res.products.length > 0) {
      container.innerHTML = res.products.map(p => UI.renderProductCard(p)).join('');
    } else {
      // Fallback to general products
      const fallback = await API.getProducts({ limit: 8 });
      container.innerHTML = (fallback.products || []).map(p => UI.renderProductCard(p)).join('');
    }
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">Failed to load featured gear. Please refresh.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedGear();
});
