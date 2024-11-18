<?php
/**
 * Plugin Name: MiniQR
 * Plugin URI: https://genexmarketing.com
 * Description: A WordPress plugin to build UTM tracking URLs, shorten them, and generate QR codes.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Genex Marketing Agency Ltd
 * Author URI: https://genexmarketing.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: miniqr
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('XQR_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('XQR_PLUGIN_URL', plugin_dir_url(__FILE__));
define('XQR_PLUGIN_VERSION', '1.0.0');
define('XQR_DB_VERSION', '1.0');
define('XQR_TABLE_NAME', 'xqr_short_urls');

// Include required files
require_once XQR_PLUGIN_PATH . 'includes/class-xqr-admin.php';
require_once XQR_PLUGIN_PATH . 'blocks/init.php';

// Initialize plugin
add_action('plugins_loaded', function() {
    xqr_check_db_version();
    if (class_exists('XQR_Admin')) {
        new XQR_Admin();
    }
});

register_activation_hook(__FILE__, 'xqr_activate_plugin');

function xqr_activate_plugin() {
    global $wpdb;
    $table_name = $wpdb->prefix . XQR_TABLE_NAME;
    $charset_collate = $wpdb->get_charset_collate();

    // Remove the DROP TABLE line and only create if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        short_path varchar(100) NOT NULL,
        long_url text NOT NULL,
        created_at datetime NOT NULL,
        clicks bigint(20) NOT NULL DEFAULT 0,
        PRIMARY KEY  (id),
        UNIQUE KEY short_path (short_path)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    // Verify table creation
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
    if (!$table_exists) {
        error_log('Failed to create table: ' . $table_name);
        return;
    }

    // Verify columns
    $columns = $wpdb->get_results("SHOW COLUMNS FROM $table_name");
    $column_names = array_map(function($col) { 
        return $col->Field; 
    }, $columns);
    
    error_log('Table columns: ' . print_r($column_names, true));

    // Store the current database version
    update_option('xqr_db_version', XQR_DB_VERSION);

    // Flush rewrite rules
    flush_rewrite_rules();
}

function xqr_check_db_version() {
    if (get_option('xqr_db_version') != XQR_DB_VERSION) {
        xqr_activate_plugin();
    }
}

// Add a debugging function
function xqr_debug_table_structure() {
    global $wpdb;
    $table_name = $wpdb->prefix . XQR_TABLE_NAME;
    
    // Check if table exists
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
    error_log("Table $table_name exists: " . ($table_exists ? 'yes' : 'no'));
    
    if ($table_exists) {
        $columns = $wpdb->get_results("SHOW COLUMNS FROM $table_name");
        error_log("Table columns: " . print_r($columns, true));
    }
}

// Call debug function on init
add_action('init', 'xqr_debug_table_structure');