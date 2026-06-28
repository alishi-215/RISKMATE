// Global alert helper - uses Bootstrap modal in `navbar.html`
(function(){
  function renderActions(actions = []){
    return actions.map((a, idx) => {
      const cls = a.class || 'btn-secondary';
      return `<button type="button" data-action-index="${idx}" class="btn ${cls}">${a.label}</button>`;
    }).join('');
  }

  window.showAlert = function(message, type='info', actions=[{label:'OK', action:'close', class:'btn-primary'}], title=null){
    try{
      const modalEl = document.getElementById('global-alert-modal');
      if(!modalEl) return console.warn('Alert modal not found');

      const modalTitle = modalEl.querySelector('#global-alert-title');
      const modalBody = modalEl.querySelector('#global-alert-body');
      const modalActions = modalEl.querySelector('#global-alert-actions');

      modalTitle.textContent = title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice');
      modalBody.innerHTML = (typeof message === 'string') ? message : JSON.stringify(message);
      modalActions.innerHTML = renderActions(actions);

      // Attach click handlers
      modalActions.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          const idx = parseInt(btn.getAttribute('data-action-index'));
          const act = actions[idx];
          if(!act) return;
          // If action is a JS callback
          if(typeof act.onClick === 'function'){
            try{ act.onClick(ev); }catch(err){ console.error('Action callback error', err); }
          }
          // If action is 'close', hide modal
          if(act.action === 'close' || !act.action){
            bootstrap.Modal.getInstance(modalEl).hide();
          }
          // For convenience, trigger navigation actions
          if(act.action === 'reload') location.reload();
          if(act.action === 'retry' && act.retryFn) act.retryFn();
          if(act.action === 'href' && act.href) window.location = act.href;
        });
      });

      var bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    }catch(e){
      console.error('showAlert error', e);
      alert(message);
    }
  };
  // Mark that we have a global modal showAlert implementation
  window._global_showAlert = true;
})();