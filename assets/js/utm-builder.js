(function() {
    if (typeof wp === 'undefined' || typeof wp.element === 'undefined') {
        console.error('WordPress element module not loaded');
        return;
    }

    const { createElement, render, useState } = wp.element;

    const UTMBuilder = () => {
        const [formData, setFormData] = useState({
            baseUrl: '',
            source: '',
            medium: '',
            campaign: '',
            term: '',
            content: ''
        });

        const [generatedUrl, setGeneratedUrl] = useState('');

        const handleChange = (field) => (event) => {
            setFormData({
                ...formData,
                [field]: event.target.value
            });
        };

        const handleSubmit = (event) => {
            event.preventDefault();
            try {
                const url = new URL(formData.baseUrl);
                const params = new URLSearchParams(url.search);

                if (formData.source) params.set('utm_source', formData.source);
                if (formData.medium) params.set('utm_medium', formData.medium);
                if (formData.campaign) params.set('utm_campaign', formData.campaign);
                if (formData.term) params.set('utm_term', formData.term);
                if (formData.content) params.set('utm_content', formData.content);

                url.search = params.toString();
                setGeneratedUrl(url.toString());
            } catch (error) {
                console.error('Invalid URL:', error);
                alert('Please enter a valid URL');
            }
        };

        const createField = (label, name, placeholder) => {
            return createElement('div', { className: 'form-group' },
                createElement('label', null, label),
                createElement('input', {
                    type: 'text',
                    className: 'regular-text',
                    value: formData[name],
                    onChange: handleChange(name),
                    placeholder: placeholder
                })
            );
        };

        return createElement('div', { className: 'xqr-utm-builder' },
            createElement('form', { 
                className: 'utm-form',
                onSubmit: handleSubmit 
            },
                createElement('div', { className: 'form-group' },
                    createElement('label', null, 'Website URL *'),
                    createElement('input', {
                        type: 'url',
                        className: 'regular-text',
                        value: formData.baseUrl,
                        onChange: handleChange('baseUrl'),
                        placeholder: 'https://example.com',
                        required: true
                    })
                ),
                createField('Campaign Source *', 'source', 'direct, bcard, google, e-newsletter, etc.'),
                createField('Campaign Medium *', 'medium', 'direct, cpc, qrcode, email, etc.'),
                createField('Campaign Name *', 'campaign', 'campaign\'s name'),
                createField('Campaign Term', 'term', 'campaign keyword or identifier'),
                createField('Campaign Content', 'content', 'specific offer or A/B variant'),
                createElement('button', {
                    type: 'submit',
                    className: 'button button-primary'
                }, 'Generate UTM URL')
            ),
            generatedUrl && createElement('div', { className: 'xqr-generated-url' },
                createElement('h3', null, 'Generated URL:'),
                createElement('div', { className: 'xqr-url-display' },
                    createElement('input', {
                        type: 'text',
                        className: 'regular-text',
                        value: generatedUrl,
                        readOnly: true
                    }),
                    createElement('button', {
                        type: 'button',
                        className: 'button',
                        onClick: () => {
                            navigator.clipboard.writeText(generatedUrl);
                        }
                    }, 'Copy URL')
                )
            )
        );
    };

    document.addEventListener('DOMContentLoaded', () => {
        const rootElement = document.getElementById('miniqr-utm-builder-root');
        if (rootElement) {
            try {
                render(createElement(UTMBuilder), rootElement);
            } catch (error) {
                console.error('UTM Builder render failed:', error);
                rootElement.innerHTML = 'Error loading UTM Builder';
            }
        }
    });
})(); 