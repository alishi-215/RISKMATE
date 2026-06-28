// Minimal fetch wrapper to return parsed JSON and show server errors with showAlert
window.apiFetch = async function(url, options = {}){
  try{
    const res = await fetch(url, options);
    let json = null;
    try{ json = await res.json(); } catch(e){ /* not JSON */ }

    if(!res.ok){
      const message = (json && json.message) ? json.message : (json && json.error) ? JSON.stringify(json) : 'Server error';
      const actions = (json && json.actions) ? json.actions : [{label:'OK', action:'close'}];
      window.showAlert(message, 'error', actions);
      const err = new Error(message);
      err.response = res;
      err.body = json;
      throw err;
    }

    // If server returned an error object in successful response
    if(json && json.error){
      const message = json.message || 'Server error';
      const actions = json.actions || [{label:'OK', action:'close'}];
      window.showAlert(message, 'error', actions);
      const err = new Error(message);
      err.body = json;
      throw err;
    }

    return json;
  }catch(e){
    // Network errors
    if(e instanceof TypeError){
      window.showAlert('Network error or server unreachable', 'error', [{label:'Retry', action:'reload', class:'btn-primary'},{label:'Close', action:'close'}]);
    }
    throw e;
  }
};

// Global unhandled error handlers (show consistent modal)
window.addEventListener('unhandledrejection', (ev) => {
  try{
    const reason = ev && ev.reason;
    const message = reason && reason.message ? reason.message : String(reason || 'Unhandled error');
    window.showAlert(message, 'error');
  }catch(e){ console.error('unhandledrejection handler error', e); }
});

window.addEventListener('error', (ev) => {
  try{
    window.showAlert(ev && ev.message ? ev.message : 'An unexpected error occurred', 'error');
  }catch(e){ console.error('error handler error', e); }
});

// Fallback fetch wrapper to show modal for direct fetch usage
if(window.fetch && !window.fetch._wrappedByApiJs){
  const _origFetch = window.fetch;
  window.fetch = async function(...args){
    try{
      const res = await _origFetch.apply(this, args);
      if(!res.ok){
        let json = null;
        try{ json = await res.clone().json(); }catch(e){}
        const message = (json && (json.message || json.error)) ? (json.message || json.error) : `Server error (${res.status})`;
        window.showAlert(message, 'error');
      }
      return res;
    }catch(e){
      window.showAlert('Network error or server unreachable', 'error', [{label:'Retry', action:'reload', class:'btn-primary'},{label:'Close', action:'close'}]);
      throw e;
    }
  };
  window.fetch._wrappedByApiJs = true;
}