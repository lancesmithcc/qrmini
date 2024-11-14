(function() {
    if (typeof wp === 'undefined' || typeof wp.element === 'undefined') {
        console.error('WordPress element module not loaded');
        return;
    }

    const { createElement, render, useState } = wp.element;

    const QRGenerator = () => {
        const [formData, setFormData] = useState({
            url: '',
            format: 'png', // png or svg
        });
        const [generatedQR, setGeneratedQR] = useState('');

        const handleChange = (field) => (event) => {
            setFormData({
                ...formData,
                [field]: event.target.value
            });
        };

        const handleSubmit = (event) => {
            event.preventDefault();
            try {
                // Validate URL
                new URL(formData.url);
                
                // Generate QR Code URL
                const qrApiUrl = new URL('https://api.qrserver.com/v1/create-qr-code/');
                qrApiUrl.searchParams.set('data', formData.url);
                qrApiUrl.searchParams.set('size', '1000x1000');
                qrApiUrl.searchParams.set('format', formData.format);
                qrApiUrl.searchParams.set('qzone', '4');
                qrApiUrl.searchParams.set('margin', '0');

                setGeneratedQR(qrApiUrl.toString());
            } catch (error) {
                console.error('Invalid URL:', error);
                alert('Please enter a valid URL');
            }
        };

        return createElement('div', { className: 'xqr-qr-generator' },
            createElement('form', { 
                className: 'qr-form',
                onSubmit: handleSubmit 
            },
                createElement('div', { className: 'form-group' },
                    createElement('label', null, 'URL *'),
                    createElement('input', {
                        type: 'url',
                        className: 'regular-text',
                        value: formData.url,
                        onChange: handleChange('url'),
                        placeholder: 'https://yourURL.com',
                        required: true
                    })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', null, 'Format'),
                    createElement('select', {
                        value: formData.format,
                        onChange: handleChange('format'),
                        className: 'regular-text'
                    },
                        createElement('option', { value: 'png' }, 'PNG Image'),
                        createElement('option', { value: 'svg' }, 'SVG Vector')
                    )
                ),
                createElement('button', {
                    type: 'submit',
                    className: 'button button-primary'
                }, 'Generate QR Code')
            ),
            generatedQR && createElement('div', { className: 'xqr-generated-qr' },
                createElement('h3', null, 'Generated QR Code:'),
                createElement('div', { className: 'xqr-qr-display' },
                    createElement('img', {
                        src: generatedQR,
                        alt: 'Generated QR Code',
                        className: 'qr-image'
                    }),
                    createElement('button', {
                        type: 'button',
                        className: 'button',
                        onClick: () => {
                            window.open(generatedQR, '_blank');
                        }
                    }, 'Download QR Code')
                )
            )
        );
    };

    document.addEventListener('DOMContentLoaded', () => {
        const rootElement = document.getElementById('miniqr-qr-generator-root');
        if (rootElement) {
            try {
                render(createElement(QRGenerator), rootElement);
            } catch (error) {
                console.error('QR Generator render failed:', error);
                rootElement.innerHTML = 'Error loading QR Generator';
            }
        }
    });
})();
