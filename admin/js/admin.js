/**
 * Admin JavaScript
 *
 * Handles AJAX interactions for the plugin settings page.
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        console.log('GCal Admin JS Loaded');

        // Initialize color pickers
        if ($.fn.wpColorPicker) {
            $('.gcal-color-picker').wpColorPicker();
        }

        // Save OAuth credentials and redirect to Google
        $('#gcal-credentials-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submit intercepted');

            const $form = $(this);
            const $button = $form.find('button[type="submit"]');
            const clientId = $('#client_id').val();
            const clientSecret = $('#client_secret').val();

            $button.prop('disabled', true).text(gcalAdmin.strings.saving || 'Saving...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_save_credentials',
                    nonce: gcalAdmin.nonce,
                    client_id: clientId,
                    client_secret: clientSecret
                },
                success: function(response) {
                    if (response.success && response.data.auth_url) {
                        // Redirect to Google OAuth
                        window.location.href = response.data.auth_url;
                    } else {
                        alert(response.data.message || 'Failed to save credentials');
                        $button.prop('disabled', false).text('Save and Connect with Google');
                    }
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                    $button.prop('disabled', false).text('Save and Connect with Google');
                }
            });
        });

        // Disconnect OAuth
        $('#gcal-disconnect').on('click', function(e) {
            e.preventDefault();

            if (!confirm(gcalAdmin.strings.confirmDisconnect)) {
                return;
            }

            const $button = $(this);
            $button.prop('disabled', true);

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_disconnect',
                    nonce: gcalAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert(response.data.message || 'Failed to disconnect');
                        $button.prop('disabled', false);
                    }
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                    $button.prop('disabled', false);
                }
            });
        });

        // Test connection
        $('#gcal-test-connection').on('click', function(e) {
            e.preventDefault();

            const $button = $(this);
            const originalText = $button.text();
            $button.prop('disabled', true).text('Testing...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_test_connection',
                    nonce: gcalAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Connection successful!\n\nCalendar: ' + response.data.calendar + '\nEvents found: ' + response.data.event_count);
                    } else {
                        alert('Connection failed:\n' + response.data.message);
                    }
                    $button.prop('disabled', false).text(originalText);
                },
                error: function() {
                    alert('An error occurred while testing the connection.');
                    $button.prop('disabled', false).text(originalText);
                }
            });
        });

        // Clear cache
        $('#gcal-clear-cache').on('click', function(e) {
            e.preventDefault();

            if (!confirm(gcalAdmin.strings.confirmClearCache)) {
                return;
            }

            const $button = $(this);
            const originalText = $button.text();
            $button.prop('disabled', true).text('Clearing...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_clear_cache',
                    nonce: gcalAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert(response.data.message);
                        location.reload();
                    } else {
                        alert(response.data.message || 'Failed to clear cache');
                    }
                    $button.prop('disabled', false).text(originalText);
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                    $button.prop('disabled', false).text(originalText);
                }
            });
        });

        // Add category
        $('#gcal-add-category-form').on('submit', function(e) {
            e.preventDefault();

            const $form = $(this);
            const $button = $form.find('button[type="submit"]');
            const id = $('#category_id').val().toUpperCase();
            const displayName = $('#category_display_name').val();
            const color = $('#category_color').val();

            $button.prop('disabled', true).text('Adding...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_add_category',
                    nonce: gcalAdmin.nonce,
                    id: id,
                    display_name: displayName,
                    color: color
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert(response.data.message || 'Failed to add category');
                        $button.prop('disabled', false).text('Add Category');
                    }
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                    $button.prop('disabled', false).text('Add Category');
                }
            });
        });

        // Edit category - open modal
        $(document).on('click', '.gcal-edit-category', function(e) {
            e.preventDefault();

            const $button = $(this);
            const id = $button.data('id');
            const displayName = $button.data('display-name');
            const color = $button.data('color');

            $('#edit_category_id').val(id);
            $('#edit_category_display_name').val(displayName);
            $('#edit_category_color').val(color);

            // Reinitialize color picker if needed
            if ($.fn.wpColorPicker) {
                $('#edit_category_color').wpColorPicker('color', color);
            }

            $('#gcal-edit-category-modal').fadeIn(200);
        });

        // Close modal
        $(document).on('click', '.gcal-modal-close, .gcal-modal-backdrop', function(e) {
            if (e.target === this) {
                $('#gcal-edit-category-modal').fadeOut(200);
            }
        });

        // Update category
        $('#gcal-edit-category-form').on('submit', function(e) {
            e.preventDefault();

            const $form = $(this);
            const $button = $form.find('button[type="submit"]');
            const id = $('#edit_category_id').val();
            const displayName = $('#edit_category_display_name').val();
            const color = $('#edit_category_color').val();

            $button.prop('disabled', true).text('Saving...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_update_category',
                    nonce: gcalAdmin.nonce,
                    id: id,
                    display_name: displayName,
                    color: color
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert(response.data.message || 'Failed to update category');
                        $button.prop('disabled', false).text('Save Changes');
                    }
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                    $button.prop('disabled', false).text('Save Changes');
                }
            });
        });

        // Delete category
        $(document).on('click', '.gcal-delete-category', function(e) {
            e.preventDefault();

            if (!confirm(gcalAdmin.strings.confirmDelete)) {
                return;
            }

            const $button = $(this);
            const id = $button.data('id');
            const $row = $button.closest('tr');

            $button.prop('disabled', true).text('Deleting...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_delete_category',
                    nonce: gcalAdmin.nonce,
                    id: id
                },
                success: function(response) {
                    if (response.success) {
                        $row.fadeOut(300, function() {
                            $(this).remove();
                            // Reload if no more categories
                            if ($('.gcal-categories-list tbody tr').length === 0) {
                                location.reload();
                            }
                        });
                    } else {
                        alert(response.data.message || 'Failed to delete category');
                        $button.prop('disabled', false).text('Delete');
                    }
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                    $button.prop('disabled', false).text('Delete');
                }
            });
        });

        // Auto-uppercase category ID input
        $('#category_id').on('input', function() {
            this.value = this.value.toUpperCase();
        });
    });

})(jQuery);
