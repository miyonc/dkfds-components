'use strict';

import { validateAccordionGroupHTML } from './validateAccordionGroupHTML.js'
import { renderAccordionGroupHTML } from './renderAccordionGroupHTML.js'

class FDSAccordionGroup extends HTMLElement {

    #initialized

    /* Private methods */

    #getBulkButton() {
    return this.querySelector(':scope > .accordion-bulk-button');
  }

    #ensureBulkButton() {
        let button = this.#getBulkButton();
        if (!button) {
            this.insertAdjacentHTML('afterbegin', renderAccordionGroupHTML());
            button = this.#getBulkButton();
        }

        // Bind once
        if (button && !button.dataset.fdsBound) {
            button.addEventListener('click', () => this.toggleAllAccordions());
            button.dataset.fdsBound = '1';
        }

        return button;
    }

    #init() {
        if (this.#initialized) return;

        const attr = this.getAttribute('has-bulk-button');
        const hasBulkButton = attr === '' || attr === 'true';
        if (hasBulkButton) this.#ensureBulkButton();

        this.addEventListener('fds-accordion-expanded', () => this.#updateBulkButtonText());
        this.addEventListener('fds-accordion-collapsed', () => this.#updateBulkButtonText());

        this.#initialized = true;
    }

    #updateHeadingLevel(headingLevel) {
        this.#getAllAccordions().forEach(acc =>
            acc.setAttribute('heading-level', headingLevel)
        );
    }

    #getAllAccordions() {
        return Array.from(this.querySelectorAll(':scope > fds-accordion'));
    }

    #areAllExpanded() {
        return this.#getAllAccordions().every(acc => {
            const expandedAttr = acc.getAttribute('expanded');
            if (expandedAttr != null) return expandedAttr === 'true';
            const button = acc.querySelector('button.accordion-button');
            return button?.getAttribute('aria-expanded') === 'true';
        });
    }

    #updateBulkButtonText() {
        const button = this.#getBulkButton();
        if (!button) return;

        const openText = this.getAttribute('open-all-text') || 'Åbn alle';
        const closeText = this.getAttribute('close-all-text') || 'Luk alle';
        button.textContent = this.#areAllExpanded() ? closeText : openText;
    }

    #updateHasBulkButton(attrValue) {
        const hasBulkButton = attrValue === '' || attrValue === 'true';
        const button = this.#getBulkButton();

        if (hasBulkButton) this.#ensureBulkButton();
        else if (button) button.remove();

        this.#updateBulkButtonText();
    } 

    /* Attributes which can invoke attributeChangedCallback() */

      static observedAttributes = ['heading-level', 'has-bulk-button', 'open-all-text', 'close-all-text'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    toggleAllAccordions() {
        const accordions = this.#getAllAccordions();

        const shouldExpandAll = !this.#areAllExpanded();
        const newValue = shouldExpandAll ? 'true' : 'false';

        accordions.forEach(acc => acc.setAttribute('expanded', newValue));
        this.#updateBulkButtonText();
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        if (this.#initialized) return;

        const isValid = validateAccordionGroupHTML(this);
        if (!isValid) return;

        this.#init();

        if (this.hasAttribute('heading-level')) {
            this.#updateHeadingLevel(this.getAttribute('heading-level'));
        }

        this.#updateBulkButtonText();
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(attribute, oldValue, newValue) {
        if (attribute === 'heading-level') {
            this.#updateHeadingLevel(newValue);
        }

        if (attribute === 'has-bulk-button') {
            this.#updateHasBulkButton(newValue);
        }

        if (attribute === 'open-all-text' || attribute === 'close-all-text') {
            this.#updateBulkButtonText();
        }
    }
}

export default FDSAccordionGroup;