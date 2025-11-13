/**
 * Admin JavaScript
 *
 * Handles AJAX interactions for the plugin settings page.
 */

(function($) {
    'use strict';

    $(document).ready(function() {
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
                        // Validate that the URL is a Google OAuth URL before redirecting
                        const authUrl = response.data.auth_url;
                        try {
                            const url = new URL(authUrl);
                            // Only allow redirect to Google OAuth endpoints
                            if (url.hostname === 'accounts.google.com' && url.pathname.startsWith('/o/oauth2/')) {
                                window.location.href = authUrl;
                            } else {
                                alert('Invalid OAuth URL received. Please contact support.');
                                $button.prop('disabled', false).text('Save and Connect with Google');
                            }
                        } catch (e) {
                            alert('Invalid URL format. Please contact support.');
                            $button.prop('disabled', false).text('Save and Connect with Google');
                        }
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
            e.stopPropagation();

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

        // Export categories
        $('#gcal-export-categories').on('click', function() {
            var $button = $(this);
            $button.prop('disabled', true).text('Exporting...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_export_categories',
                    nonce: gcalAdmin.nonce
                },
                success: function(response) {
                    $button.prop('disabled', false).text('Export Categories');

                    if (response.success) {
                        // Create download
                        var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(response.data.data, null, 2));
                        var downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute('href', dataStr);
                        downloadAnchorNode.setAttribute('download', response.data.filename);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    } else {
                        alert(response.data.message || 'Failed to export categories');
                    }
                },
                error: function() {
                    $button.prop('disabled', false).text('Export Categories');
                    alert('An error occurred. Please try again.');
                }
            });
        });

        // Import categories - trigger file input
        $('#gcal-import-categories').on('click', function() {
            $('#gcal-import-file').click();
        });

        // Handle file selection
        var importData = null;
        $('#gcal-import-file').on('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    importData = JSON.parse(e.target.result);

                    // Validate structure
                    if (!importData.categories || !Array.isArray(importData.categories)) {
                        throw new Error('Invalid file structure');
                    }

                    // Show preview
                    var details = '';
                    if (importData.version) {
                        details += 'Version: ' + importData.version + '<br>';
                    }
                    if (importData.export_date) {
                        details += 'Exported: ' + importData.export_date + '<br>';
                    }
                    details += 'Categories: ' + importData.categories.length;

                    $('#gcal-import-details').html(details);
                    $('#gcal-import-info').show();
                    $('#gcal-do-import').prop('disabled', false);

                    // Show modal
                    $('#gcal-import-category-modal').show();
                } catch (err) {
                    alert('Invalid JSON file: ' + err.message);
                    importData = null;
                }
            };
            reader.readAsText(file);

            // Reset file input
            $(this).val('');
        });

        // Do import
        $('#gcal-do-import').on('click', function() {
            if (!importData) return;

            var $button = $(this);
            var merge = $('input[name="import_mode"]:checked').val() === 'merge';

            if (!merge && !confirm('Are you sure you want to REPLACE all existing categories? This cannot be undone.')) {
                return;
            }

            $button.prop('disabled', true).text('Importing...');

            $.ajax({
                url: gcalAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'gcal_import_categories',
                    nonce: gcalAdmin.nonce,
                    import_data: JSON.stringify(importData),
                    merge: merge
                },
                success: function(response) {
                    $button.prop('disabled', false).text('Import');

                    if (response.success) {
                        alert(response.data.message);
                        $('#gcal-import-category-modal').hide();
                        location.reload(); // Reload to show new categories
                    } else {
                        alert(response.data.message || 'Failed to import categories');
                    }
                },
                error: function() {
                    $button.prop('disabled', false).text('Import');
                    alert('An error occurred. Please try again.');
                }
            });
        });

        // Modal close handlers
        $('.gcal-modal-close, .gcal-modal-backdrop').on('click', function(e) {
            if (e.target === this) {
                $('#gcal-import-category-modal').hide();
                $('#gcal-import-info').hide();
                $('#gcal-do-import').prop('disabled', true);
                importData = null;
            }
        });
    });

})(jQuery);
