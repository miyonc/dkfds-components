'use strict';

import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSErrorMessage extends HTMLElement {

    /* Private instance fields */

    #rendered;
    #iconText;
    #parentWrapper;

    #render() {
        if (this.#rendered) return;

        const hasElements = this.children.length > 0;
        
        if (!hasElements) {
            const iconText = this.getAttribute('icon-text');
            if (iconText !== null && iconText !== '') {
                this.#iconText = iconText;
            }

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('icon-svg', 'alert-icon');
            svg.setAttribute('aria-label', this.#iconText);
            svg.setAttribute('focusable', 'false');

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', '#error');
            svg.appendChild(use);

            const visibleMessage = document.createElement('span');
            visibleMessage.classList.add('visible-message');
            visibleMessage.textContent = this.textContent;
            this.textContent = '';

            this.appendChild(svg);
            this.appendChild(visibleMessage);
        }

        this.#rendered = true;
    }

    #shouldBeHidden(hiddenValue) {
        return hiddenValue === 'true' || hiddenValue === '';
    }

    #setAriaHidden() {
        this.setAttribute('aria-hidden', 'true');
    }

    #removeAriaHidden() {
        this.removeAttribute('aria-hidden');
    }

    #notifyParent() {
        this.#parentWrapper?.dispatchEvent(new CustomEvent('error-message-visibility-changed', {
            bubbles: true,
            detail: {
                errorId: this.id,
                isHidden: this.#shouldBeHidden(this.getAttribute('hidden'))
            }
        }));
    }

    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['id', 'icon-text', 'hidden'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();
        this.#rendered = false;
        this.#iconText = 'Fejl';
        this.#parentWrapper = null;
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        if (this.#rendered) return;

        this.#render();

        if (!this.id) {
            this.id = generateAndVerifyUniqueId('error');
        }

        // Handle initial hidden state
        if (this.#shouldBeHidden(this.getAttribute('hidden'))) {
            this.#setAriaHidden();
        }

        // Save reference to parent wrapper
        this.#parentWrapper = this.closest('fds-input-wrapper, fds-checkbox, fds-checkbox-group');
        this.#parentWrapper?.dispatchEvent(new Event('error-message-callback'));
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        this.#parentWrapper?.dispatchEvent(new Event('error-message-callback'));

        this.#parentWrapper = null;
        this.#rendered = false;
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.#rendered) return;

        if (name === 'icon-text') {
            this.#iconText = newValue;
            this.querySelector(':scope > .alert-icon').setAttribute('aria-label', this.#iconText);
        }

        if (name === 'hidden' && oldValue !== newValue) {
            if (this.#shouldBeHidden(newValue)) {
                this.#setAriaHidden();
            } else {
                this.#removeAriaHidden();
            }
            this.#notifyParent();
        }

        this.#parentWrapper?.dispatchEvent(new Event('error-message-callback'));
    }
}

function registerErrorMessage() {
    if (customElements.get('fds-error-message') === undefined) {
        window.customElements.define('fds-error-message', FDSErrorMessage);
    }
}

export default registerErrorMessage;