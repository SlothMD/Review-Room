function getReviewAuthorProductInfo() {
  const title = document.getElementById('productTitle')?.innerText?.trim();
  const bullets = document.getElementById('feature-bullets')?.innerText?.trim();
  const description = document.getElementById('productDescription')?.innerText?.trim();

  return {
    title: title || document.title || '',
    description: bullets || description || ''
  };
}
