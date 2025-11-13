<?php
/**
 * Category Manager Partial
 *
 * Template for category whitelist management interface.
 *
 * @package GCal_Tag_Filter
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$gcal_categories = GCal_Categories::get_categories();

// Sort categories by display name (A-Z)
if ( ! empty( $gcal_categories ) ) {
    usort( $gcal_categories, function( $a, $b ) {
        $a_name = isset( $a['display_name'] ) ? $a['display_name'] : '';
        $b_name = isset( $b['display_name'] ) ? $b['display_name'] : '';
        return strcasecmp( $a_name, $b_name );
    } );
}
?>

<div class="gcal-category-manager">
    <!-- Add New Category Form -->
    <div class="gcal-add-category-form">
        <h3><?php esc_html_e( 'Add New Category', 'gcal-tag-filter' ); ?></h3>

        <form id="gcal-add-category-form">
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="category_id"><?php esc_html_e( 'Category ID', 'gcal-tag-filter' ); ?></label>
                    </th>
                    <td>
                        <input type="text" name="category_id" id="category_id" class="regular-text" required
                               pattern="[A-Z0-9_\-]+" style="text-transform: uppercase;"
                               placeholder="<?php esc_attr_e( 'COMMUNITY', 'gcal-tag-filter' ); ?>" />
                        <p class="description">
                            <?php esc_html_e( 'Uppercase alphanumeric with underscores or hyphens only. Used in event tags and shortcodes.', 'gcal-tag-filter' ); ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="category_display_name"><?php esc_html_e( 'Display Name', 'gcal-tag-filter' ); ?></label>
                    </th>
                    <td>
                        <input type="text" name="category_display_name" id="category_display_name" class="regular-text" required
                               placeholder="<?php esc_attr_e( 'Community Events', 'gcal-tag-filter' ); ?>" />
                        <p class="description">
                            <?php esc_html_e( 'User-friendly name shown to visitors.', 'gcal-tag-filter' ); ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="category_color"><?php esc_html_e( 'Color', 'gcal-tag-filter' ); ?></label>
                    </th>
                    <td>
                        <input type="text" name="category_color" id="category_color" class="gcal-color-picker" value="#4285F4" />
                        <p class="description">
                            <?php esc_html_e( 'Color used for calendar color-coding.', 'gcal-tag-filter' ); ?>
                        </p>
                    </td>
                </tr>
            </table>

            <button type="submit" class="button button-primary">
                <?php esc_html_e( 'Add Category', 'gcal-tag-filter' ); ?>
            </button>
        </form>

        <!-- Export/Import Controls -->
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <button type="button" class="button" id="gcal-export-categories">
                <?php esc_html_e( 'Export Categories', 'gcal-tag-filter' ); ?>
            </button>
            <button type="button" class="button" id="gcal-import-categories">
                <?php esc_html_e( 'Import Categories', 'gcal-tag-filter' ); ?>
            </button>
            <input type="file" id="gcal-import-file" accept=".json" style="display: none;" />
        </div>
    </div>

    <!-- Categories List -->
    <div class="gcal-categories-list">
        <h3><?php esc_html_e( 'Existing Categories', 'gcal-tag-filter' ); ?></h3>

        <?php if ( empty( $gcal_categories ) ) : ?>
            <p class="description"><?php esc_html_e( 'No categories defined yet.', 'gcal-tag-filter' ); ?></p>
        <?php else : ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e( 'Category ID', 'gcal-tag-filter' ); ?></th>
                        <th><?php esc_html_e( 'Display Name', 'gcal-tag-filter' ); ?></th>
                        <th><?php esc_html_e( 'Color', 'gcal-tag-filter' ); ?></th>
                        <th><?php esc_html_e( 'Actions', 'gcal-tag-filter' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( $gcal_categories as $gcal_category ) : ?>
                        <?php
                        // Skip malformed categories
                        if ( ! isset( $gcal_category['id'] ) || ! isset( $gcal_category['display_name'] ) || ! isset( $gcal_category['color'] ) ) {
                            continue;
                        }
                        ?>
                        <tr data-category-id="<?php echo esc_attr( $gcal_category['id'] ); ?>">
                            <td>
                                <code><?php echo esc_html( $gcal_category['id'] ); ?></code>
                            </td>
                            <td class="category-display-name">
                                <?php echo esc_html( $gcal_category['display_name'] ); ?>
                            </td>
                            <td>
                                <span class="gcal-color-preview" style="background-color: <?php echo esc_attr( $gcal_category['color'] ); ?>"></span>
                                <code class="category-color"><?php echo esc_html( $gcal_category['color'] ); ?></code>
                            </td>
                            <td>
                                <button type="button" class="button button-small gcal-edit-category"
                                        data-id="<?php echo esc_attr( $gcal_category['id'] ); ?>"
                                        data-display-name="<?php echo esc_attr( $gcal_category['display_name'] ); ?>"
                                        data-color="<?php echo esc_attr( $gcal_category['color'] ); ?>">
                                    <?php esc_html_e( 'Edit', 'gcal-tag-filter' ); ?>
                                </button>
                                <button type="button" class="button button-small gcal-button-danger gcal-delete-category"
                                        data-id="<?php echo esc_attr( $gcal_category['id'] ); ?>">
                                    <?php esc_html_e( 'Delete', 'gcal-tag-filter' ); ?>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<!-- Edit Category Modal -->
<div id="gcal-edit-category-modal" class="gcal-modal-backdrop" style="display: none;">
    <div class="gcal-modal-dialog">
        <div class="gcal-modal-header">
            <h3><?php esc_html_e( 'Edit Category', 'gcal-tag-filter' ); ?></h3>
            <button type="button" class="gcal-modal-close">×</button>
        </div>
        <div class="gcal-modal-body">
            <form id="gcal-edit-category-form">
                <input type="hidden" name="edit_category_id" id="edit_category_id" />

                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="edit_category_display_name"><?php esc_html_e( 'Display Name', 'gcal-tag-filter' ); ?></label>
                        </th>
                        <td>
                            <input type="text" name="edit_category_display_name" id="edit_category_display_name" class="regular-text" required />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="edit_category_color"><?php esc_html_e( 'Color', 'gcal-tag-filter' ); ?></label>
                        </th>
                        <td>
                            <input type="text" name="edit_category_color" id="edit_category_color" class="gcal-color-picker" />
                        </td>
                    </tr>
                </table>

                <div class="gcal-modal-footer">
                    <button type="submit" class="button button-primary">
                        <?php esc_html_e( 'Save Changes', 'gcal-tag-filter' ); ?>
                    </button>
                    <button type="button" class="button gcal-modal-close">
                        <?php esc_html_e( 'Cancel', 'gcal-tag-filter' ); ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Import Category Modal -->
<div id="gcal-import-category-modal" class="gcal-modal-backdrop" style="display: none;">
    <div class="gcal-modal-dialog">
        <div class="gcal-modal-header">
            <h3><?php esc_html_e( 'Import Categories', 'gcal-tag-filter' ); ?></h3>
            <button type="button" class="gcal-modal-close">×</button>
        </div>
        <div class="gcal-modal-body">
            <p><?php esc_html_e( 'Upload a JSON file exported from this plugin. You can choose to merge with existing categories or replace all categories.', 'gcal-tag-filter' ); ?></p>

            <div id="gcal-import-info" style="display: none; margin: 15px 0; padding: 10px; background: #f0f0f1; border-left: 4px solid #2271b1;">
                <strong><?php esc_html_e( 'Import Preview:', 'gcal-tag-filter' ); ?></strong>
                <div id="gcal-import-details" style="margin-top: 8px;"></div>
            </div>

            <div style="margin: 15px 0;">
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="import_mode" value="merge" checked style="margin-right: 8px;">
                    <span><?php esc_html_e( 'Merge with existing categories (skip duplicates)', 'gcal-tag-filter' ); ?></span>
                </label>
                <label style="display: flex; align-items: center; margin-top: 8px;">
                    <input type="radio" name="import_mode" value="replace" style="margin-right: 8px;">
                    <span style="color: #d63638;"><?php esc_html_e( 'Replace all categories (delete existing)', 'gcal-tag-filter' ); ?></span>
                </label>
            </div>

            <div class="gcal-modal-footer">
                <button type="button" class="button button-primary" id="gcal-do-import" disabled>
                    <?php esc_html_e( 'Import', 'gcal-tag-filter' ); ?>
                </button>
                <button type="button" class="button gcal-modal-close">
                    <?php esc_html_e( 'Cancel', 'gcal-tag-filter' ); ?>
                </button>
            </div>
        </div>
    </div>
</div>
