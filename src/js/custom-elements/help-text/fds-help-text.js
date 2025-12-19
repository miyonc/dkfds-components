'use strict';

import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSHelpText extends HTMLElement {

    /* Private instance fields */

    #rendered;
    #parentWrapper;

    /* Private methods */

    #render() {
        if (this.#rendered) return;

        this.classList.add('help-text');

        if (this.getAttribute('help-text-id') !== null && this.getAttribute('help-text-id') !== '') {
            this.id = this.getAttribute('help-text-id');
        }

        this.#rendered = true;
    }

    #updateId(newValue) {
        if (newValue !== null && newValue !== '') {
            this.id = newValue;
        } else {
            this.id = generateAndVerifyUniqueId('help');
        }
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
        this.#parentWrapper?.dispatchEvent(new CustomEvent('help-text-visibility-changed', {
            bubbles: true,
            detail: {
                helptextId: this.id,
                isHidden: this.#shouldBeHidden(this.getAttribute('hidden'))
            }
        }));
    }

    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['help-text-id', 'hidden'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();
        this.#rendered = false;
        this.#parentWrapper = null;
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        if (this.#rendered) return;

        this.#render();

        if (!this.id) {
            this.id = generateAndVerifyUniqueId('help');
        }

        // Handle initial hidden state
        if (this.#shouldBeHidden(this.getAttribute('hidden'))) {
            this.#setAriaHidden();
        }

        // During disconnect, the custom element may lose connection to the wrapper.
        // Save the wrapper and use it to dispatch events - otherwise, the events may be lost.
        this.#parentWrapper = this.closest('fds-input-wrapper, fds-checkbox, fds-checkbox-group, fds-radio-button, fds-radio-button-group');
        this.#parentWrapper?.dispatchEvent(new Event('help-text-callback'));
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        this.#parentWrapper?.dispatchEvent(new Event('help-text-callback'));

        this.#parentWrapper = null;
        this.#rendered = false;
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.#rendered) return;

        if (name === 'help-text-id') {
            this.#updateId(newValue);
        }

        if (name === 'hidden' && oldValue !== newValue) {
            if (this.#shouldBeHidden(newValue)) {
                this.#setAriaHidden();
            } else {
                this.#removeAriaHidden();
            }
            this.#notifyParent();
        }

        this.#parentWrapper?.dispatchEvent(new Event('help-text-callback'));
    }
}

function registerHelpText() {
    if (customElements.get('fds-help-text') === undefined) {
        window.customElements.define('fds-help-text', FDSHelpText);
    }
}

export default registerHelpText;