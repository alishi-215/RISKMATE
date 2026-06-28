// Auto-hide flash messages after 5 seconds
    document.addEventListener('DOMContentLoaded', function() {
      const flashMessages = document.querySelectorAll('.flash-message');
      flashMessages.forEach(message => {
        setTimeout(() => {
          message.style.opacity = '0';
          message.style.transition = 'opacity 0.5s ease';
          setTimeout(() => message.remove(), 500);
        }, 5000);
      });

      // Focus on username field
      const usernameField = document.querySelector('input[name="username"]');
      if (usernameField) {
        usernameField.focus();
      }
    });