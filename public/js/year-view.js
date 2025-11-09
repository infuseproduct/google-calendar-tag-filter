/**
 * Year View Expand/Collapse Handler
 */

(function(window, document) {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Handle expand/collapse for year view
        document.addEventListener('click', function(e) {
            if (e.target.closest('.gcal-year-more')) {
                const button = e.target.closest('.gcal-year-more');
                const monthEvents = button.closest('.gcal-year-month-events');
                const moreText = button.querySelector('.gcal-year-more-text');
                const lessText = button.querySelector('.gcal-year-less-text');
                
                monthEvents.classList.toggle('expanded');
                
                if (monthEvents.classList.contains('expanded')) {
                    moreText.style.display = 'none';
                    lessText.style.display = 'inline';
                } else {
                    moreText.style.display = 'inline';
                    lessText.style.display = 'none';
                }
            }
        });
    });

})(window, document);
