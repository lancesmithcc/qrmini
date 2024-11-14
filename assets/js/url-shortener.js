(function() {
    if (typeof wp === 'undefined' || typeof wp.element === 'undefined') {
        console.error('WordPress element module not loaded');
        return;
    }

    const { createElement, render, useState, useEffect } = wp.element;

    const URLShortener = () => {
        const [formData, setFormData] = useState({
            longUrl: '',
            customPath: ''
        });
        const [shortUrl, setShortUrl] = useState('');
        const [error, setError] = useState('');
        const [urls, setUrls] = useState([]);
        const [editingId, setEditingId] = useState(null);

        const handleChange = (field) => (event) => {
            setFormData({
                ...formData,
                [field]: event.target.value
            });
        };

        const handleSubmit = async (event) => {
            event.preventDefault();
            setError('');
            setShortUrl('');

            // Validate custom path (alphanumeric, hyphens only)
            const pathRegex = /^[a-zA-Z0-9-]+$/;
            if (!pathRegex.test(formData.customPath)) {
                setError('Custom path can only contain letters, numbers, and hyphens');
                return;
            }

            try {
                const response = await fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'xqr_shorten_url',
                        nonce: xqrData.nonce,
                        url: formData.longUrl,
                        custom_path: formData.customPath
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    setShortUrl(data.data.short_url);
                    fetchUrls();
                    setFormData({ longUrl: '', customPath: '' });
                } else {
                    setError(data.data.message || 'Failed to create short URL');
                }
            } catch (error) {
                setError('Network error occurred');
                console.error('Error:', error);
            }
        };

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
                console.error('Error fetching URLs:', error);
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
                console.error('Error deleting URL:', error);
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
                console.error('Error updating URL:', error);
            }
        };

        return createElement('div', { className: 'xqr-url-shortener' },
            createElement('form', { 
                className: 'shortener-form',
                onSubmit: handleSubmit 
            },
                createElement('div', { className: 'form-group' },
                    createElement('label', null, 'Long URL *'),
                    createElement('input', {
                        type: 'url',
                        className: 'regular-text',
                        value: formData.longUrl,
                        onChange: handleChange('longUrl'),
                        placeholder: 'https://example.com/very/long/url',
                        required: true
                    })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', null, 'Custom Path (optional)'),
                    createElement('input', {
                        type: 'text',
                        className: 'regular-text',
                        value: formData.customPath,
                        onChange: handleChange('customPath'),
                        placeholder: 'my-custom-path',
                        required: true,
                        pattern: '[a-zA-Z0-9-]+',
                        title: 'Only letters, numbers, and hyphens allowed'
                    })
                ),
                createElement('button', {
                    type: 'submit',
                    className: 'button button-primary'
                }, 'Shorten URL')
            ),
            error && createElement('div', { className: 'xqr-error' }, error),
            shortUrl && createElement('div', { className: 'xqr-generated-url' },
                createElement('h3', null, 'Shortened URL:'),
                createElement('div', { className: 'xqr-url-display' },
                    createElement('input', {
                        type: 'text',
                        className: 'regular-text',
                        value: shortUrl,
                        readOnly: true
                    }),
                    createElement('button', {
                        type: 'button',
                        className: 'button',
                        onClick: () => {
                            navigator.clipboard.writeText(shortUrl);
                        }
                    }, 'Copy URL')
                )
            ),
            createElement('div', { className: 'xqr-url-list' },
                createElement('h3', null, 'Existing Short URLs'),
                urls.length === 0 
                    ? createElement('p', null, 'No URLs created yet.')
                    : createElement('table', { className: 'wp-list-table widefat fixed striped' },
                        createElement('thead', null,
                            createElement('tr', null,
                                createElement('th', null, 'Short URL'),
                                createElement('th', null, 'Destination URL'),
                                createElement('th', null, 'Clicks'),
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
                                createElement('td', null, url.clicks || 0),
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
            )
        );
    };

    document.addEventListener('DOMContentLoaded', () => {
        const rootElement = document.getElementById('miniqr-url-shortener-root');
        if (rootElement) {
            try {
                render(createElement(URLShortener), rootElement);
            } catch (error) {
                console.error('URL Shortener render failed:', error);
                rootElement.innerHTML = 'Error loading URL Shortener';
            }
        }
    });
})();
s