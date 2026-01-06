'use strict';

import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSErrorMessage extends HTMLElement {

    /* Private instance fields */

    #rendered;
    #srOnlyText;
    #parentWrapper;

    #render() {
        if (this.#rendered) return;

        const hasElements = this.children.length > 0;
        
        if (!hasElements) {
            const srText = this.getAttribute('sr-text');
            if (srText !== null && srText !== '') {
                this.#srOnlyText = srText;
            }

            const sr = document.createElement('span');
            sr.classList.add('sr-only');
            sr.textContent = `${this.#srOnlyText}: `;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('icon-svg', 'alert-icon');
            svg.setAttribute('aria-label', 'Fejl');
            svg.setAttribute('focusable', 'false');

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', '#error');
            svg.appendChild(use);

            const visibleMessage = document.createElement('span');
            visibleMessage.classList.add('visible-message');
            visibleMessage.textContent = this.textContent;
            this.textContent = '';

            this.appendChild(sr);
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

    static observedAttributes = ['id', 'sr-text', 'hidden'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();
        this.#rendered = false;
        this.#srOnlyText = 'Fejl';
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

        if (name === 'sr-text') {
            this.#srOnlyText = newValue;
            this.querySelector(':scope > .sr-only').textContent = this.#srOnlyText;
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