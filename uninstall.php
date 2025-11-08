<?php
/**
 * Uninstall Script
 *
 * Cleanup when plugin is uninstalled.
 *
 * @package GCal_Tag_Filter
 */

// If uninstall not called from WordPress, exit
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

/**
 * Delete all plugin options.
 */
function gcal_tag_filter_delete_options() {
    $options = array(
        'gcal_tag_filter_client_id',
        'gcal_tag_filter_client_secret',
        'gcal_tag_filter_access_token',
        'gcal_tag_filter_refresh_token',
        'gcal_tag_filter_calendar_id',
        'gcal_tag_filter_cache_duration',
        'gcal_tag_filter_categories',
    );

    foreach ( $options as $option ) {
        delete_option( $option );
    }
}

/**
 * Delete all transients (cached data).
 */
function gcal_tag_filter_delete_transients() {
    global $wpdb;

    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
            '_transient_gcal_tag_filter_%',
            '_transient_timeout_gcal_tag_filter_%'
        )
    );
}

// Execute cleanup
gcal_tag_filter_delete_options();
gcal_tag_filter_delete_transients();
