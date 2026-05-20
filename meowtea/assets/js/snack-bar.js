(function() {
    'use strict';


    const CONFIG = {
        AUTO_CLOSE_DELAY: 5000, // 5 seconds
        ANIMATION_DURATION: 300 // milliseconds
    };


    const TYPE_CONFIG = {
        warm: {
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#F59E0B"/><path d="M12 8v4M12 16h.01" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
            color: '#F59E0B'
        },
        success: {
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#10B981"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            color: '#10B981'
        },
        failed: {
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#EF4444"/><path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
            color: '#EF4444'
        },
        information: {
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#3B82F6"/><path d="M12 16v-4M12 8h.01" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
            color: '#3B82F6'
        }
    };

    function getContainer() {
        let $container = $('#snack-bar-container');
        if ($container.length === 0) {
            $container = $('<div class="snack-bar-container" id="snack-bar-container"></div>');
            $('body').append($container);
        }
        return $container;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) {
            return map[m];
        });
    }

    function createSnackBar(type, message) {
        const config = TYPE_CONFIG[type] || TYPE_CONFIG.success;
        const escapedMessage = escapeHtml(message);
        
        const snackBarId = 'snack-bar-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const $snackBar = $('<div>', {
            class: 'snack-bar snack-bar-' + type,
            id: snackBarId
        });

        const html = `
            <div class="snack-bar-icon">
                ${config.icon}
            </div>
            <div class="snack-bar-content">
                <p class="snack-bar-message">${escapedMessage}</p>
            </div>
            <button class="snack-bar-close" type="button" aria-label="Đóng">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;

        $snackBar.html(html);
        return $snackBar;
    }

    function closeSnackBar($snackBar) {
        if (!$snackBar || $snackBar.length === 0) return;
        

        $snackBar.addClass('snack-bar-closing');
        

        setTimeout(function() {
            $snackBar.remove();
        }, CONFIG.ANIMATION_DURATION);
    }

    function showSnackBar(type, message) {

        if (!TYPE_CONFIG[type]) {
            console.warn('Invalid snack-bar type:', type, '. Using "success" instead.');
            type = 'success';
        }


        if (!message || typeof message !== 'string') {
            console.warn('Snack-bar message is required.');
            return;
        }


        const $container = getContainer();
        

        const $snackBar = createSnackBar(type, message);
        

        $container.append($snackBar);


        $snackBar.find('.snack-bar-close').on('click', function() {
            closeSnackBar($snackBar);
        });


        const autoCloseTimeout = setTimeout(function() {
            closeSnackBar($snackBar);
        }, CONFIG.AUTO_CLOSE_DELAY);


        $snackBar.data('autoCloseTimeout', autoCloseTimeout);


        $snackBar.find('.snack-bar-close').on('click', function() {
            const timeoutId = $snackBar.data('autoCloseTimeout');
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        });
    }


    window.showSnackBar = showSnackBar;


    $(document).ready(function() {

        getContainer();
    });

})();