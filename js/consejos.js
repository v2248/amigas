document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.consejos-box');
  const textarea = document.getElementById('consejo-input');
  const select = document.getElementById('categoria');
  const list = document.getElementById('consejos-list');
  const filterLinks = Array.from(document.querySelectorAll('.consejos-otras-options .filter-link'));
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  const feedback = document.getElementById('feedback');

  // ensure list exists
  if (!form || !textarea || !select || !list) return;

  let allTips = [];
  let activeFilter = null;
  const API_URL = 'https://centro.juanfuent.es/api/tips';

  // Previene inyección de HTML al imprimir contenido de la API
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  async function fetchTips() {
    try {
      // Usamos un parámetro de timestamp para evitar el caché en lugar de alterar los headers
      const res = await fetch(`${API_URL}?t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!res.ok) throw new Error(`Status: ${res.status}`);
      
      const tips = await res.json();
      allTips = tips || [];
      renderList();
    } catch (err) {
      console.error('Ocurrió un error al cargar los tips.', err);
      list.innerHTML = '<li style="grid-column: 1 / -1;"><div class="status-msg error-msg">Ocurrió un error al cargar los consejos.</div></li>';
    }
  }

  function renderList() {
    // clear current list
    list.innerHTML = '';

    // determine items to render
    const cats = activeFilter ? [activeFilter] : ['rutas', 'vestimenta', 'vagones'];

    const tipsToRender = allTips.filter(tip => cats.includes(tip.category));

    if (tipsToRender.length === 0) {
      list.innerHTML = '<li style="grid-column: 1 / -1;"><div class="status-msg">No hay consejos publicados aún.</div></li>';
    } else {
      tipsToRender.forEach(tip => {
        const li = document.createElement('li');
        li.className = 'consejo ' + escapeHTML(tip.category);
        const p = document.createElement('p');
        p.innerHTML = `<strong>Amiga</strong>: <br/>${escapeHTML(tip.content)}`;
        li.appendChild(p);
        list.appendChild(li);
      });
    }

    // update active class on filter links
    filterLinks.forEach(link => {
      const cat = link.dataset.category;
      if (activeFilter === cat) {
        link.classList.add('active', 'type-hover');
      } else {
        link.classList.remove('active', 'type-hover');
      }
    });
  }

  // handle form submit
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (feedback) {
      feedback.style.display = 'none';
      feedback.className = '';
    }
    
    const content = (textarea.value || '').trim();
    if (content) {
      feedback.textContent = '';
    } else {
      if (feedback) {
        feedback.textContent = 'Por favor, escribe un consejo.';
        feedback.classList.add('error');
        feedback.style.display = 'block';
      }
      return;
    }

    const category = select.value || 'rutas';

    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ tip: { category, content } })
      });

      if (res.ok) {
        if (feedback) {
          feedback.textContent = '¡Tip guardado exitosamente!';
          feedback.className = 'success';
          feedback.style.display = 'block';
        }
        form.reset();
        activeFilter = category;
        await fetchTips();
      } else {
        if (feedback) {
          feedback.textContent = `Error al guardar (Status: ${res.status})`;
          feedback.className = 'error';
          feedback.style.display = 'block';
        }
      }
    } catch (err) {
      if (feedback) {
        feedback.textContent = 'No se pudo conectar con el servidor.';
        feedback.className = 'error';
        feedback.style.display = 'block';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // filter link clicks
  filterLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const cat = link.dataset.category;
      // set the clicked category as active (do not toggle off by clicking again)
      activeFilter = cat;
      renderList();
    });
  });

  // load persisted messages from API and render
  fetchTips();
});
