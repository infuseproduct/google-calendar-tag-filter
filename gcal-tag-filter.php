<?php
/**
 * Plugin Name: Google Calendar Tag Filter
 * Plugin URI: https://github.com/ccfhk/ccfhk-calendar-wp-plugin
 * Description: Embeds Google Calendar events with tag-based filtering capabilities using OAuth 2.0 authentication
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: CCFHK
 * Author URI: https://ccfhk.org
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: gcal-tag-filter
 * Domain Path: /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Current plugin version.
 */
define( 'GCAL_TAG_FILTER_VERSION', '1.0.0' );

/**
 * Plugin directory path.
 */
define( 'GCAL_TAG_FILTER_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Plugin directory URL.
 */
define( 'GCAL_TAG_FILTER_URL', plugin_dir_url( __FILE__ ) );

/**
 * Composer autoloader.
 */
require_once GCAL_TAG_FILTER_PATH . 'vendor/autoload.php';

/**
 * Core plugin classes.
 */
require_once GCAL_TAG_FILTER_PATH . 'includes/class-gcal-oauth.php';
require_once GCAL_TAG_FILTER_PATH . 'includes/class-gcal-calendar.php';
require_once GCAL_TAG_FILTER_PATH . 'includes/class-gcal-parser.php';
require_once GCAL_TAG_FILTER_PATH . 'includes/class-gcal-cache.php';
require_once GCAL_TAG_FILTER_PATH . 'includes/class-gcal-categories.php';
require_once GCAL_TAG_FILTER_PATH . 'includes/class-gcal-shortcode.php';

/**
 * Admin classes.
 */
if ( is_admin() ) {
    require_once GCAL_TAG_FILTER_PATH . 'admin/class-gcal-admin.php';
}

/**
 * Public display classes.
 */
require_once GCAL_TAG_FILTER_PATH . 'public/class-gcal-display.php';

/**
 * Activation hook.
 */
function gcal_tag_filter_activate() {
    // Create default options
    add_option( 'gcal_tag_filter_cache_duration', 60 ); // 1 minute default
    add_option( 'gcal_tag_filter_categories', array() );

    // Flush rewrite rules
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'gcal_tag_filter_activate' );

/**
 * Deactivation hook.
 */
function gcal_tag_filter_deactivate() {
    // Clear all transients
    GCal_Cache::clear_all_cache();

    // Flush rewrite rules
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'gcal_tag_filter_deactivate' );

/**
 * Load plugin textdomain for translations.
 */
function gcal_tag_filter_load_textdomain() {
    load_plugin_textdomain(
        'gcal-tag-filter',
        false,
        dirname( plugin_basename( __FILE__ ) ) . '/languages'
    );
}
add_action( 'plugins_loaded', 'gcal_tag_filter_load_textdomain' );

/**
 * Initialize the plugin.
 */
function gcal_tag_filter_init() {
    // Initialize admin interface
    if ( is_admin() ) {
        new GCal_Admin();
    }

    // Initialize shortcode handler
    new GCal_Shortcode();
}
add_action( 'init', 'gcal_tag_filter_init' );

/**
 * Enqueue frontend styles and scripts.
 */
function gcal_tag_filter_enqueue_scripts() {
    // Only enqueue if shortcode is present on the page
    global $post;
    if ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'gcal_embed' ) ) {
        // Styles
        wp_enqueue_style(
            'gcal-calendar-view',
            GCAL_TAG_FILTER_URL . 'public/css/calendar-view.css',
            array(),
            GCAL_TAG_FILTER_VERSION
        );

        wp_enqueue_style(
            'gcal-list-view',
            GCAL_TAG_FILTER_URL . 'public/css/list-view.css',
            array(),
            GCAL_TAG_FILTER_VERSION
        );

        wp_enqueue_style(
            'gcal-event-modal',
            GCAL_TAG_FILTER_URL . 'public/css/event-modal.css',
            array(),
            GCAL_TAG_FILTER_VERSION
        );

        wp_enqueue_style(
            'gcal-category-sidebar',
            GCAL_TAG_FILTER_URL . 'public/css/category-sidebar.css',
            array(),
            GCAL_TAG_FILTER_VERSION
        );

        // Scripts
        wp_enqueue_script(
            'gcal-timezone-handler',
            GCAL_TAG_FILTER_URL . 'public/js/timezone-handler.js',
            array(),
            GCAL_TAG_FILTER_VERSION,
            true
        );

        wp_enqueue_script(
            'gcal-event-modal',
            GCAL_TAG_FILTER_URL . 'public/js/event-modal.js',
            array(),
            GCAL_TAG_FILTER_VERSION,
            true
        );

        wp_enqueue_script(
            'gcal-calendar-navigation',
            GCAL_TAG_FILTER_URL . 'public/js/calendar-navigation.js',
            array( 'gcal-timezone-handler' ),
            GCAL_TAG_FILTER_VERSION,
            true
        );

        wp_enqueue_script(
            'gcal-category-filter',
            GCAL_TAG_FILTER_URL . 'public/js/category-filter.js',
            array(),
            GCAL_TAG_FILTER_VERSION,
            true
        );

        wp_enqueue_script(
            'gcal-contrast-handler',
            GCAL_TAG_FILTER_URL . 'public/js/contrast-handler.js',
            array(),
            GCAL_TAG_FILTER_VERSION,
            true
        );

        // Localize script with necessary data
        wp_localize_script(
            'gcal-calendar-navigation',
            'gcalData',
            array(
                'ajaxUrl' => admin_url( 'admin-ajax.php' ),
                'nonce'   => wp_create_nonce( 'gcal-ajax-nonce' ),
            )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'gcal_tag_filter_enqueue_scripts' );
