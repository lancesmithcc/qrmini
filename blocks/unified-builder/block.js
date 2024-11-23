(function() {
    if (typeof wp === 'undefined' || typeof wp.element === 'undefined') {
        console.error('WordPress element module not loaded');
        return;
    }

    const { createElement, render, useState } = wp.element;
    const { registerBlockType } = wp.blocks;
    
    const UnifiedBuilder = () => {
        const [formData, setFormData] = useState({
            baseUrl: '',
            source: '',
            medium: '',
            campaign: '',
            term: '',
            content: '',
            customPath: '',
            format: 'png'
        });
        const [step, setStep] = useState(1);
        const [generatedUtmUrl, setGeneratedUtmUrl] = useState('');
        const [shortUrl, setShortUrl] = useState('');
        const [qrCode, setQrCode] = useState('');
        const [error, setError] = useState('');

        const handleChange = (field) => (event) => {
            setFormData({ ...formData, [field]: event.target.value });
        };

        const createField = (label, name, placeholder, required = false) => {
            return createElement('div', { className: 'form-group' },
                createElement('label', null, label),
                createElement('input', {
                    type: 'text',
                    value: formData[name],
                    onChange: handleChange(name),
                    placeholder: placeholder,
                    required: required
                })
            );
        };

        const handleUtmSubmit = (e) => {
            e.preventDefault();
            try {
                const url = new URL(formData.baseUrl);
                if (formData.source) url.searchParams.set('utm_source', formData.source);
                if (formData.medium) url.searchParams.set('utm_medium', formData.medium);
                if (formData.campaign) url.searchParams.set('utm_campaign', formData.campaign);
                if (formData.term) url.searchParams.set('utm_term', formData.term);
                if (formData.content) url.searchParams.set('utm_content', formData.content);
                
                setGeneratedUtmUrl(url.toString());
                setStep(2);
                setError('');
            } catch (error) {
                setError('Please enter a valid URL');
            }
        };

        const handleShorten = async () => {
            try {
                if (!formData.customPath) {
                    setError('Custom path is required');
                    return;
                }

                const response = await fetch(xqrData.ajaxUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        action: 'xqr_shorten_url',
                        nonce: xqrData.nonce,
                        url: generatedUtmUrl,
                        custom_path: formData.customPath
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    setShortUrl(data.data.short_url);
                    setStep(3);
                    setError('');
                } else {
                    setError(data.data.message || 'Failed to shorten URL');
                }
            } catch (error) {
                console.error('Shortening error:', error);
                setError('Failed to shorten URL');
            }
        };

        const handleQRGenerate = async () => {
            try {
                // Generate QR Code URL directly using the QR server API
                const qrApiUrl = new URL('https://api.qrserver.com/v1/create-qr-code/');
                qrApiUrl.searchParams.set('data', shortUrl);
                qrApiUrl.searchParams.set('size', '1000x1000');
                qrApiUrl.searchParams.set('format', formData.format);
                qrApiUrl.searchParams.set('qzone', '4');
                qrApiUrl.searchParams.set('margin', '0');

                setQrCode(qrApiUrl.toString());
                setError('');
            } catch (error) {
                setError('Failed to generate QR code');
            }
        };

        return createElement('div', { className: 'wp-block-miniqr-unified-builder' },
            error && createElement('div', { className: 'notice notice-error' }, error),
            
            step === 1 && createElement('div', { className: 'step-container' },
                createElement('h3', null, 'Step 1: Create UTM URL'),
                createElement('form', { onSubmit: handleUtmSubmit },
                    createElement('div', { className: 'form-group' },
                        createElement('label', null, 'Website URL *'),
                        createElement('input', {
                            type: 'url',
                            value: formData.baseUrl,
                            onChange: handleChange('baseUrl'),
                            placeholder: 'https://yourdomain.com',
                            required: true
                        })
                    ),
                    createField('Campaign Source *', 'source', 'direct,bcard,google,e-newsletter,etc', true),
                    createField('Campaign Medium *', 'medium', 'direct,cpc,qrcode,email,etc', true),
                    createField('Campaign Name *', 'campaign', 'what is your campaigns name', true),
                    createField('Campaign Term', 'term', 'campaign keyword or identifier'),
                    createField('Campaign Content', 'content', 'specific offer or A/B variant'),
                    createElement('button', {
                        type: 'submit',
                        className: 'button button-primary'
                    }, 'Generate Your UTM URL')
                )
            ),

            step === 2 && createElement('div', { className: 'step-container' },
                createElement('h3', null, 'Step 2: Shorten URL'),
                createElement('div', { className: 'generated-url' },
                    createElement('input', {
                        type: 'text',
                        value: generatedUtmUrl,
                        readOnly: true
                    }),
                    createElement('button', {
                        className: 'button button-secondary',
                        onClick: () => navigator.clipboard.writeText(generatedUtmUrl)
                    }, 'Copy')
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', null, 'Custom Path'),
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
                    type: 'button',
                    onClick: handleShorten,
                    className: 'button button-primary'
                }, 'Shorten URL')
            ),

            step === 3 && createElement('div', { className: 'step-container' },
                createElement('h3', null, 'Step 3: Generate QR Code'),
                createElement('div', { className: 'shortened-url' },
                    createElement('input', {
                        type: 'text',
                        value: shortUrl,
                        readOnly: true
                    }),
                    createElement('button', {
                        className: 'button button-secondary',
                        onClick: () => navigator.clipboard.writeText(shortUrl)
                    }, 'Copy')
                ),
                createElement('select', {
                    value: formData.format,
                    onChange: handleChange('format'),
                    className: 'regular-text'
                },
                    createElement('option', { value: 'png' }, 'PNG'),
                    createElement('option', { value: 'svg' }, 'SVG')
                ),
                createElement('button', {
                    onClick: handleQRGenerate,
                    className: 'button button-primary'
                }, 'Generate QR Code'),
                qrCode && createElement('div', { className: 'qr-preview' },
                    createElement('img', {
                        src: qrCode,
                        alt: 'Generated QR Code'
                    })
                )
            )
        );
    };

    // Editor placeholder
    const EditorPlaceholder = () => {
        return createElement('div', { 
            className: 'wp-block-miniqr-unified-builder-placeholder',
            style: {
                padding: '20px',
                background: '#f0f0f0',
                border: '1px dashed #999',
                textAlign: 'center'
            }
        }, 'UTM & QR Builder Form');
    };

    // Frontend initialization (following utm-builder.js pattern)
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.body.classList.contains('wp-admin')) {
            const rootElement = document.getElementById('miniqr-unified-builder-root');
            if (rootElement) {
                try {
                    render(createElement(UnifiedBuilder), rootElement);
                } catch (error) {
                    console.error('Unified Builder render failed:', error);
                    rootElement.innerHTML = 'Error loading Unified Builder';
                }
            }
        }
    });

    // Block registration
    registerBlockType('miniqr/unified-builder', {
        title: 'UTM & QR Builder',
        icon: 'admin-links',
        category: 'common',
        edit: EditorPlaceholder,
        save: () => null
    });
})();
