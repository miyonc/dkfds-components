'use strict';

import { validateAccordionGroupHTML } from './validateAccordionGroupHTML.js'
import { renderAccordionGroupHTML } from './renderAccordionGroupHTML.js'

class FDSAccordionGroup extends HTMLElement {

    #initialized

    /* Private methods */

    #init() {
        if (!this.#initialized) {
            let button = this.querySelector(':scope > .accordion-bulk-button');
            if (!button) {
                this.insertAdjacentHTML('afterbegin', renderAccordionGroupHTML());
                button = this.querySelector(':scope > .accordion-bulk-button');
            }

            if (button) {
                button.addEventListener('click', () => this.toggleAllAccordions());
            }

            this.addEventListener('fds-accordion-expanded', () => this.#updateBulkButtonText());
            this.addEventListener('fds-accordion-collapsed', () => this.#updateBulkButtonText());

            this.#initialized = true;
        }
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
        const button = this.querySelector(':scope > .accordion-bulk-button');
        if (!button) return;
        button.textContent = this.#areAllExpanded() ? 'Luk alle' : 'Åbn alle';
    }

    #updateHeadingLevel(headingLevel) {
        const accordions = this.querySelectorAll(':scope > fds-accordion');
        for (let i = 0; i < accordions.length; i++) {
            accordions[i].setAttribute('heading-level', headingLevel);
        }
    }

    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['heading-level'];

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
        if (accordions.length === 0) return;

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
    }
}

export default FDSAccordionGroup;