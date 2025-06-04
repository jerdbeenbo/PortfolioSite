window.setupContactFormClickOutside = function() {
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('contact-modal');
        const button = document.getElementById('contact-button');
        
        if (modal && !modal.classList.contains('hidden') && 
            !modal.contains(event.target) && !button.contains(event.target)) {
            // Simulate clicking the contact button to close it
            button.click();
        }
    });
};