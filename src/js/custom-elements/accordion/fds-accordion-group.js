'use strict';

import { validateAccordionGroupHTML } from './validateAccordionGroupHTML.js'

class FDSAccordionGroup extends HTMLElement {

    #expandedAll = false;

    /* Private methods */

    #updateHeadingLevel(headingLevel) {
        const accordions = this.querySelectorAll(':scope > fds-accordion');
        for (let i = 0; i < accordions.length; i++) {
            accordions[i].setAttribute('heading-level', headingLevel);
        }
    }

    #setupBulkButton() {
        let button = this.querySelector(':scope > .accordion-bulk-button');
        if (!button) {
            button = document.createElement('button');
            button.classList.add('accordion-bulk-button');
            button.textContent = 'Åbn alle';
            this.prepend(button);
        } 

        button.addEventListener('click', () => this.#toggleAllAccordions());
    }

    #updateBulkButtonText() {
        const button = this.querySelector(':scope > .accordion-bulk-button');
        if (button) {
            button.textContent = this.#expandedAll ? 'Luk alle' : 'Åbn alle';
        }
    }

    #toggleAllAccordions() {
        const accordions = this.querySelectorAll(':scope > fds-accordion');
        accordions.forEach(acc => {
            acc.setAttribute('expanded', this.#expandedAll ? 'false' : 'true');
        });
        this.#expandedAll = !this.#expandedAll;
        this.#updateBulkButtonText();
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
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        const isValid = validateAccordionGroupHTML(this);

        if (!isValid) return;

        this.#setupBulkButton();

        if (this.hasAttribute('heading-level')) {
            this.#updateHeadingLevel(this.getAttribute('heading-level'));
        }
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