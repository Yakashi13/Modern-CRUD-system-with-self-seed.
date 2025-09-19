// In-memory store (resets on refresh)
    const store = {
      data: [],
      nextId: 1
    };

    // Elements
    const tbody = document.getElementById('tbody');
    const search = document.getElementById('search');
    const roleFilter = document.getElementById('roleFilter');
    const addBtn = document.getElementById('addBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const seedBtn = document.getElementById('seedBtn');
    const exportBtn = document.getElementById('exportBtn');

    const modal = document.getElementById('modal');
    const form = document.getElementById('form');
    const idInput = document.getElementById('id');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const roleInput = document.getElementById('role');
    const statusInput = document.getElementById('status');
    const modalTitle = document.getElementById('modalTitle');

    const toastEl = document.getElementById('toast');

    function toast(msg){
      toastEl.textContent = msg;
      toastEl.style.display = 'block';
      clearTimeout(toastEl._t);
      toastEl._t = setTimeout(()=> toastEl.style.display='none', 1800);
    }

    function openModal(mode='create', row=null){
      form.reset();
      idInput.value = '';
      if(mode === 'edit' && row){
        modalTitle.textContent = 'Edit Record';
        idInput.value = row.id;
        nameInput.value = row.name;
        emailInput.value = row.email;
        roleInput.value = row.role;
        statusInput.value = row.status;
      } else {
        modalTitle.textContent = 'New Record';
      }
      modal.showModal();
      setTimeout(()=> nameInput.focus(), 50);
    }

    // Render
    function render(){
      const q = search.value.trim().toLowerCase();
      const rf = roleFilter.value;

      const filtered = store.data.filter(r => {
        const matchesSearch = !q || [r.name, r.email, r.role].some(x => String(x).toLowerCase().includes(q));
        const matchesRole = !rf || r.role === rf;
        return matchesSearch && matchesRole;
      });

      if(!filtered.length){
        tbody.innerHTML = `<tr><td colspan="6" class="empty">No matching records. Try clearing filters.</td></tr>`;
        return;
      }

      const rows = filtered.map(r => `
        <tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td class="mono">${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.role)}</td>
          <td><span class="pill ${r.status === 'Active' ? 'ok' : r.status === 'Suspended' ? 'warn' : ''}">${escapeHtml(r.status)}</span></td>
          <td class="hide-sm mono">${new Date(r.created).toLocaleDateString()}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" title="Edit" data-action="edit" data-id="${r.id}">✏️</button>
              <button class="icon-btn" title="Delete" data-action="delete" data-id="${r.id}">🗑️</button>
            </div>
          </td>
        </tr>`).join('');

      tbody.innerHTML = rows;
    }

    // Simple sanitizer for text injection in template strings
    function escapeHtml(str){
      return String(str)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
    }

    // CRUD Ops
    function create(data){
      const record = { id: store.nextId++, created: Date.now(), ...data };
      store.data.unshift(record); // newest first
      render();
      toast('Created');
    }

    function update(id, patch){
      const i = store.data.findIndex(r => r.id === id);
      if(i !== -1){
        store.data[i] = { ...store.data[i], ...patch };
        render();
        toast('Updated');
      }
    }

    function remove(id){
      const i = store.data.findIndex(r => r.id === id);
      if(i !== -1){
        store.data.splice(i,1);
        render();
        toast('Deleted');
      }
    }

    // Event wiring
    addBtn.addEventListener('click', () => openModal('create'));

    clearAllBtn.addEventListener('click', () => {
      if(confirm('Clear all records?')){
        store.data = []; store.nextId = 1; render(); toast('Cleared');
      }
    });

    seedBtn.addEventListener('click', () => {
      const sample = [
        { name:'Mahinda Rajapaksha', email:'appacci@srilanka.com', role:'Admin', status:'Active' },
        { name:'Senarath Paranawithana', email:'sena@studio.io', role:'Editor', status:'Invited' },
        { name:'Anura Kumara', email:'ogkota@npp4evr.co', role:'Viewer', status:'Suspended' },
        { name:'Osama Bin-ladin', email:'kaboom@wonder.dev', role:'Editor', status:'Active' },
        { name:'Alexander Grahambell', email:'hello404@hi.com', role:'Admin', status:'Active' },
        { name:'Sajith Premadasa', email:'dreamer@srilanka.io', role:'Editor', status:'Invited' },
        { name:'Piumi Hansamali', email:'piumiskin@queen.xyz', role:'Viewer', status:'Suspended' },
        { name:'Allahu Akbar', email:'bomber@serandib.dev', role:'Editor', status:'Active' },
      ];
      sample.forEach(s => create(s));
    });

    exportBtn.addEventListener('click', () => {
      const q = search.value.trim().toLowerCase();
      const rf = roleFilter.value;
      const filtered = store.data.filter(r => {
        const matchesSearch = !q || [r.name, r.email, r.role].some(x => String(x).toLowerCase().includes(q));
        const matchesRole = !rf || r.role === rf;
        return matchesSearch && matchesRole;
      });
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'export.json'; a.click();
      URL.revokeObjectURL(url);
      toast('Exported current view');
    });

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const row = store.data.find(r => r.id === id);
      if(action === 'edit') openModal('edit', row);
      if(action === 'delete') {
        if(confirm('Delete this record?')) remove(id);
      }
    });

    // Form submit (create/update)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        role: roleInput.value,
        status: statusInput.value
      };
      if(!payload.name || !payload.email || !payload.role || !payload.status){
        toast('Please fill all fields');
        return;
      }
      const existingId = Number(idInput.value);
      if(existingId){ update(existingId, payload); }
      else { create(payload); }
      modal.close();
    });

    // Closing the modal with Cancel or Esc keeps form values intact; we reset on open.

    // Live filters
    search.addEventListener('input', render);
    roleFilter.addEventListener('change', render);

    // Initial render
    render();
