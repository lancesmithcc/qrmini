<?php
class XQR_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('wp_ajax_xqr_shorten_url', array($this, 'handle_url_shortening'));
        add_action('wp_ajax_xqr_get_urls', array($this, 'handle_get_urls'));
        add_action('wp_ajax_xqr_delete_url', array($this, 'handle_delete_url'));
        add_action('wp_ajax_xqr_update_url', array($this, 'handle_update_url'));
        
        // Add our redirect handler to an earlier hook
        add_action('init', array($this, 'handle_redirect'), 1);
    }

    public function add_admin_menu() {
        add_menu_page(
            'QRmini',
            'QRmini',
            'manage_options',
            'miniqr-utm-builder',
            array($this, 'render_utm_builder_page'),
            'dashicons-admin-links'
        );

        // UTM Builder (main page)
        add_submenu_page(
            'miniqr-utm-builder',
            'UTM Link Builder',
            'UTM Link Builder',
            'manage_options',
            'miniqr-utm-builder',
            array($this, 'render_utm_builder_page')
        );

        // URL Shortener
        add_submenu_page(
            'miniqr-utm-builder',
            'URL Shortener',
            'URL Shortener',
            'manage_options',
            'miniqr-link-shortener',
            array($this, 'render_link_shortener_page')
        );

        // QR Generator
        add_submenu_page(
            'miniqr-utm-builder',
            'QR Code Generator',
            'QR Code Generator',
            'manage_options',
            'miniqr-qr-generator',
            array($this, 'render_qr_generator_page')
        );

        // ShortURL Bank
        add_submenu_page(
            'miniqr-utm-builder',
            'ShortURL Bank',
            'ShortURL Bank',
            'manage_options',
            'miniqr-url-bank',
            array($this, 'render_url_bank_page')
        );
    }

    public function render_utm_builder_page() {
        ?>
        <div class="wrap">
            <h1>UTM Builder</h1>
            <div id="miniqr-utm-builder-root"></div>
        </div>
        <?php
    }

    public function render_link_shortener_page() {
        ?>
        <div class="wrap">
            <h1>Link Shortener</h1>
            <div id="miniqr-url-shortener-root"></div>
        </div>
        <?php
    }

    public function render_qr_generator_page() {
        ?>
        <div class="wrap">
            <h1>QR Generator</h1>
            <div id="miniqr-qr-generator-root"></div>
        </div>
        <?php
    }

    public function render_url_bank_page() {
        ?>
        <div class="wrap">
            <h1>ShortURL Bank</h1>
            <div id="miniqr-url-bank-root"></div>
        </div>
        <?php
    }

    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'miniqr') === false) {
            return;
        }

        wp_enqueue_script('wp-element');
        
        if (strpos($hook, 'url-bank') !== false) {
            wp_enqueue_script(
                'miniqr-url-bank',
                XQR_PLUGIN_URL . 'assets/js/url-bank.js',
                array('wp-element'),
                XQR_PLUGIN_VERSION,
                true
            );

            wp_localize_script('miniqr-url-bank', 'xqrData', array(
                'nonce' => wp_create_nonce('xqr_ajax_nonce')
            ));
        }
        
        if (strpos($hook, 'link-shortener') !== false) {
            wp_enqueue_script(
                'miniqr-url-shortener',
                XQR_PLUGIN_URL . 'assets/js/url-shortener.js',
                array('wp-element'),
                XQR_PLUGIN_VERSION,
                true
            );

            wp_localize_script('miniqr-url-shortener', 'xqrData', array(
                'nonce' => wp_create_nonce('xqr_ajax_nonce'),
                'ajaxUrl' => admin_url('admin-ajax.php')
            ));
        }

        // Enqueue appropriate script based on page
        if (strpos($hook, 'qr-generator') !== false) {
            wp_enqueue_script(
                'miniqr-qr-generator',
                XQR_PLUGIN_URL . 'assets/js/qr-generator.js',
                array('wp-element'),
                XQR_PLUGIN_VERSION,
                true
            );
        } else if (strpos($hook, 'utm-builder') !== false) {
            wp_enqueue_script(
                'miniqr-utm-builder',
                XQR_PLUGIN_URL . 'assets/js/utm-builder.js',
                array('wp-element'),
                XQR_PLUGIN_VERSION,
                true
            );
        }

        wp_enqueue_style(
            'miniqr-admin-style',
            XQR_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            XQR_PLUGIN_VERSION
        );
    }

    public function handle_url_shortening() {
        check_ajax_referer('xqr_ajax_nonce', 'nonce');

        $url = sanitize_url($_POST['url']);
        $custom_path = sanitize_text_field($_POST['custom_path']);

        if (empty($custom_path)) {
            wp_send_json_error(['message' => 'Custom path is required']);
            return;
        }

        // Validate custom path
        if (!preg_match('/^[a-zA-Z0-9-]+$/', $custom_path)) {
            wp_send_json_error(['message' => 'Invalid custom path format']);
            return;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'xqr_short_urls';

        // Check if path already exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE short_path = %s",
            $custom_path
        ));

        if ($exists) {
            wp_send_json_error(['message' => 'This custom path is already in use']);
            return;
        }

        // Insert the URL mapping
        $result = $wpdb->insert(
            $table_name,
            array(
                'short_path' => $custom_path,
                'long_url' => $url,
                'created_at' => current_time('mysql')
            ),
            array('%s', '%s', '%s')
        );

        if ($result === false) {
            wp_send_json_error(['message' => 'Database error occurred']);
            return;
        }

        wp_send_json_success(['short_url' => home_url($custom_path)]);
    }

    public function handle_get_urls() {
        check_ajax_referer('xqr_ajax_nonce', 'nonce');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'xqr_short_urls';
        
        $urls = $wpdb->get_results("
            SELECT id, short_path, long_url, created_at
            FROM $table_name 
            ORDER BY created_at DESC
        ");
        
        if ($urls === false) {
            wp_send_json_error(['message' => 'Failed to fetch URLs']);
            return;
        }
        
        // Add clicks as 0 for compatibility with the frontend
        foreach ($urls as $url) {
            $url->clicks = 0;
        }
        
        wp_send_json_success(['urls' => $urls]);
    }

    public function handle_delete_url() {
        check_ajax_referer('xqr_ajax_nonce', 'nonce');
        
        $id = intval($_POST['id']);
        global $wpdb;
        $table_name = $wpdb->prefix . 'xqr_short_urls';
        
        $result = $wpdb->delete($table_name, ['id' => $id], ['%d']);
        
        if ($result === false) {
            wp_send_json_error(['message' => 'Failed to delete URL']);
            return;
        }
        
        wp_send_json_success();
    }

    public function handle_update_url() {
        check_ajax_referer('xqr_ajax_nonce', 'nonce');
        
        $id = intval($_POST['id']);
        $long_url = sanitize_url($_POST['long_url']);
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'xqr_short_urls';
        
        $result = $wpdb->update(
            $table_name,
            ['long_url' => $long_url],
            ['id' => $id],
            ['%s'],
            ['%d']
        );
        
        if ($result === false) {
            wp_send_json_error(['message' => 'Failed to update URL']);
            return;
        }
        
        wp_send_json_success();
    }

    public function handle_redirect() {
        // Only check on the frontend
        if (is_admin()) {
            return;
        }

        // Get the current request path
        $request_uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
        
        // Skip if not a potential short URL (contains slashes or is empty)
        if (empty($request_uri) || strpos($request_uri, '/') !== false) {
            return;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'xqr_short_urls';

        // Look for the short URL in our database
        $destination = $wpdb->get_var($wpdb->prepare(
            "SELECT long_url FROM {$table_name} WHERE short_path = %s",
            $request_uri
        ));

        if ($destination) {
            // Ensure URL has protocol
            if (!preg_match("~^(?:f|ht)tps?://~i", $destination)) {
                $destination = "https://" . $destination;
            }

            // Clear any output buffering
            while (ob_get_level()) {
                ob_end_clean();
            }

            // Perform redirect
            header("HTTP/1.1 301 Moved Permanently");
            header("Location: " . $destination);
            exit();
        }
    }
} 