<?php
function miniqr_register_blocks() {
    if (!function_exists('register_block_type')) {
        return;
    }

    // Register the block script
    wp_register_script(
        'miniqr-unified-builder',
        XQR_PLUGIN_URL . 'blocks/unified-builder/block.js',
        array('wp-blocks', 'wp-element', 'wp-components'),
        XQR_PLUGIN_VERSION
    );

    // Add the data needed for AJAX
    wp_localize_script('miniqr-unified-builder', 'xqrData', array(
        'nonce' => wp_create_nonce('xqr_ajax_nonce'),
        'ajaxUrl' => admin_url('admin-ajax.php')
    ));

    // Register the block
    register_block_type('miniqr/unified-builder', array(
        'editor_script' => 'miniqr-unified-builder',
        'script' => 'miniqr-unified-builder',
        'render_callback' => 'miniqr_render_unified_builder'
    ));
}
add_action('init', 'miniqr_register_blocks');

function miniqr_render_unified_builder() {
    if (!is_admin()) {
        wp_enqueue_script('wp-element');
        wp_enqueue_script('miniqr-unified-builder');
    }
    
    return '<div class="wp-block-miniqr-unified-builder"><div id="miniqr-unified-builder-root"></div></div>';
}

function miniqr_enqueue_block_assets() {
    wp_enqueue_style(
        'miniqr-unified-builder',
        XQR_PLUGIN_URL . 'blocks/unified-builder/style.css',
        array(),
        XQR_PLUGIN_VERSION
    );
}
add_action('enqueue_block_assets', 'miniqr_enqueue_block_assets');
