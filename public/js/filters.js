document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('filterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      // Remove empty params before submitting
      Array.from(form.elements).forEach(el => {
        if (el.name && !el.value) el.name = '';
      });
    });
  }
});
