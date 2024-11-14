(function() {
    if (typeof wp === 'undefined' || typeof wp.element === 'undefined') {
        console.error('WordPress element module not loaded');
        return;
    }

    const { createElement, render, useState, useEffect } = wp.element;

    const URLBank = () => {
        const [urls, setUrls] = useState([]);
        const [editingId, setEditingId] = useState(null);
        const [error, setError] = useState('');

        const fetchUrls = async () => {
            try {
                const response = await fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'xqr_get_urls',
                        nonce: xqrData.nonce
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    setUrls(data.data.urls);
                }
            } catch (error) {
                setError('Failed to fetch URLs');
                console.error('Error:', error);
            }
        };

        useEffect(() => {
            fetchUrls();
        }, []);

        const handleDelete = async (id) => {
            if (!confirm('Are you sure you want to delete this URL?')) return;
            
            try {
                const response = await fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'xqr_delete_url',
                        nonce: xqrData.nonce,
                        id: id
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    fetchUrls();
                }
            } catch (error) {
                setError('Failed to delete URL');
                console.error('Error:', error);
            }
        };

        const handleUpdate = async (id, longUrl) => {
            try {
                const response = await fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'xqr_update_url',
                        nonce: xqrData.nonce,
                        id: id,
                        long_url: longUrl
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    setEditingId(null);
                    fetchUrls();
                }
            } catch (error) {
                setError('Failed to update URL');
                console.error('Error:', error);
            }
        };

        return createElement('div', { className: 'xqr-url-bank' },
            error && createElement('div', { className: 'notice notice-error' }, error),
            createElement('table', { className: 'wp-list-table widefat fixed striped' },
                createElement('thead', null,
                    createElement('tr', null,
                        createElement('th', null, 'Short URL'),
                        createElement('th', null, 'Destination URL'),
                        createElement('th', null, 'Created'),
                        createElement('th', null, 'Actions')
                    )
                ),
                createElement('tbody', null,
                    urls.map(url => createElement('tr', { key: url.id },
                        createElement('td', null,
                            createElement('a', {
                                href: `${window.location.origin}/${url.short_path}`,
                                target: '_blank'
                            }, `${window.location.origin}/${url.short_path}`),
                            createElement('button', {
                                className: 'button button-small',
                                onClick: () => {
                                    navigator.clipboard.writeText(`${window.location.origin}/${url.short_path}`);
                                },
                                style: { marginLeft: '10px' }
                            }, 'Copy')
                        ),
                        createElement('td', null,
                            editingId === url.id
                                ? createElement('input', {
                                    type: 'url',
                                    className: 'regular-text',
                                    value: url.long_url,
                                    onChange: (e) => {
                                        const newUrls = urls.map(u =>
                                            u.id === url.id ? { ...u, long_url: e.target.value } : u
                                        );
                                        setUrls(newUrls);
                                    }
                                })
                                : createElement('a', {
                                    href: url.long_url,
                                    target: '_blank'
                                }, url.long_url)
                        ),
                        createElement('td', null, new Date(url.created_at).toLocaleDateString()),
                        createElement('td', null,
                            editingId === url.id
                                ? createElement('div', { className: 'button-group' },
                                    createElement('button', {
                                        className: 'button button-primary',
                                        onClick: () => handleUpdate(url.id, url.long_url)
                                    }, 'Save'),
                                    createElement('button', {
                                        className: 'button',
                                        onClick: () => setEditingId(null)
                                    }, 'Cancel')
                                )
                                : createElement('div', { className: 'button-group' },
                                    createElement('button', {
                                        className: 'button',
                                        onClick: () => setEditingId(url.id)
                                    }, 'Edit'),
                                    createElement('button', {
                                        className: 'button button-link-delete',
                                        onClick: () => handleDelete(url.id)
                                    }, 'Delete')
                                )
                        )
                    ))
                )
            )
        );
    };

    document.addEventListener('DOMContentLoaded', () => {
        const rootElement = document.getElementById('miniqr-url-bank-root');
        if (rootElement) {
            render(createElement(URLBank), rootElement);
        }
    });
})();
