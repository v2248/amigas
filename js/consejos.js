document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.consejos-box');
  const textarea = document.getElementById('consejo');
  const select = document.getElementById('categoria');
  const list = document.getElementById('consejos-list');
  const filterLinks = Array.from(document.querySelectorAll('.consejos-otras-options .filter-link'));

  // ensure list exists
  if (!form || !textarea || !select || !list) return;

  // state: messages per category
  const messages = {
    rutas: [],
    vestimenta: [],
    vagones: []
  };

  const STORAGE_KEY = 'amigas_messages_v1';

  function loadMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // Validate shape
      if (parsed && typeof parsed === 'object') {
        messages.rutas = Array.isArray(parsed.rutas) ? parsed.rutas : [];
        messages.vestimenta = Array.isArray(parsed.vestimenta) ? parsed.vestimenta : [];
        messages.vagones = Array.isArray(parsed.vagones) ? parsed.vagones : [];
      }
    } catch (err) {
      console.error('Failed to load messages from storage', err);
    }
  }

  function saveMessages() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to save messages to storage', err);
    }
  }

  // set current filter (null = show all)
  let activeFilter = null;

  function renderList() {
    // clear current list
    list.innerHTML = '';

    // determine items to render
    const cats = activeFilter ? [activeFilter] : ['rutas', 'vestimenta', 'vagones'];

    cats.forEach(cat => {
      messages[cat].forEach(msg => {
        const li = document.createElement('li');
        li.className = 'consejo ' + cat;
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = 'Amiga';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(': ' + msg));
        li.appendChild(p);
        list.appendChild(li);
      });
    });

    // update active class on filter links
    filterLinks.forEach(link => {
      const cat = link.dataset.category;
      if (activeFilter === cat) {
        link.classList.add('active');
        link.classList.add('type-hover');
      } else {
        link.classList.remove('active');
        link.classList.remove('type-hover');
      }
    });
  }

  // handle form submit
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = (textarea.value || '').trim();
    if (!text) return; // don't add empty
    const category = select.value || 'rutas';

    // store message in state
    messages[category].push(text);
    // persist
    saveMessages();

    // clear textarea
    textarea.value = '';

    // set active filter to the category and render so the message is visible
    activeFilter = category;
    renderList();
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

  // load persisted messages and render
  loadMessages();
  renderList();
});
