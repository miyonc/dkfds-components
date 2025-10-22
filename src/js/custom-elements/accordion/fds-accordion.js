'use strict';

import { generateUniqueIdWithPrefix } from '../../utils/generate-unique-id';
import { renderAccordionHTML } from './renderAccordionHTML.js';
import { validateAccordionHTML } from './validateAccordionHTML.js'

class FDSAccordion extends HTMLElement {

    /* Private instance fields */

    #initialized;
    #handleAccordionClick;

    /* Private methods */

    #init() {
        if (!this.#initialized) {

            // Check if the HTML inside the accordion already has been rendered
            const accordionRendered = validateAccordionHTML(this.children);

            if (!accordionRendered) {

                // Capture existing child nodes to preserve functionality
                const preservedNodes = Array.from(this.childNodes);

                // Render inner markup
                const inner = renderAccordionHTML({
                    heading: this.getAttribute('heading') || '',
                    headingLevel: (this.getAttribute('heading-level') || 'h3').toLowerCase(),
                    expanded: this.isExpanded(),
                    contentId: '',
                    content: '',
                });
                this.innerHTML = inner;

                // Reinsert preserved nodes into the content container
                const contentEl = this.#getContentElement();
                contentEl.innerHTML = ''; // Remove any whitespaces created by renderAccordionHTML()
                const fragment = document.createDocumentFragment();
                preservedNodes.forEach(node => fragment.appendChild(node));
                contentEl.appendChild(fragment);
            }

            this.#initialized = true;
        }
    }

    #updateHeading(heading) {
        this.querySelector('.accordion-title').textContent = heading;
    }

    #updateHeadingLevel(headingLevel) {
        const newHeadingLevel = document.createElement(`${headingLevel}`);
        let headingElement = this.#getHeadingElement();
        newHeadingLevel.append(...headingElement.childNodes);
        headingElement.replaceWith(newHeadingLevel);
        headingElement = newHeadingLevel;
    }

    #updateExpanded(expanded) {
        if (expanded !== null && expanded !== "false") { 
            this.expandAccordion();
        }
        else { 
            this.collapseAccordion(); 
        }
    }

    #updateContentId(contentId) {
        this.#getHeadingElement().querySelector('.accordion-button').setAttribute('aria-controls', contentId);
        this.#getContentElement().setAttribute('id', contentId);
    }

    #updateVariant(text, icon) {
        const button = this.#getHeadingElement().querySelector('button.accordion-button');

        if (text && icon) {
            let variantEl = button.querySelector('.accordion-icon');
            if (!variantEl) {
                variantEl = document.createElement('span');
                variantEl.classList.add('accordion-icon');
                button.appendChild(variantEl);
            }

            variantEl.innerHTML = '';

            const textEl = document.createElement('span');
            textEl.classList.add('icon_text');
            textEl.textContent = text;
            variantEl.appendChild(textEl);

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('icon-svg');
            svg.setAttribute('focusable', 'false');
            svg.setAttribute('aria-hidden', 'true');

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS(null, 'href', `#${icon}`);
            svg.appendChild(use);

            variantEl.appendChild(svg);
        }
        else if (button.querySelector('.accordion-icon')) {
            button.querySelector('.accordion-icon').remove();
        }
    }

    #getHeadingElement() {
        return this.querySelector('h1, h2, h3, h4, h5, h6');
    }

    #getContentElement() {
        return this.querySelector('.accordion-content');
    }

    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['heading', 'heading-level', 'expanded', 'content-id', 'variant-text', 'variant-icon'];

    /* Getters and setters */

    get heading() { return this.getAttribute('heading'); }
    set heading(val) { this.setAttribute('heading', val); }

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();

        this.#initialized = false;

        /* Set up instance fields for event handling */

        this.#handleAccordionClick = () => {
            this.toggleAccordion();
        };
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    expandAccordion() {
        this.#getHeadingElement().querySelector('button.accordion-button').setAttribute('aria-expanded', 'true');
        this.#getContentElement().setAttribute('aria-hidden', 'false');
        if (this.getAttribute('expanded') === null || this.getAttribute('expanded') === 'false') {
            this.setAttribute('expanded', 'true');
        }
        this.dispatchEvent(new Event('fds-accordion-expanded'));
    }

    collapseAccordion() {
        this.#getHeadingElement().querySelector('button.accordion-button').setAttribute('aria-expanded', 'false');
        this.#getContentElement().setAttribute('aria-hidden', 'true');
        if (this.hasAttribute('expanded')) {
            this.setAttribute('expanded', 'false');
        }
        this.dispatchEvent(new Event('fds-accordion-collapsed'));
    }

    toggleAccordion() {
        if (this.isExpanded()) {
            this.collapseAccordion();
        }
        else {
            this.expandAccordion();
        }
    }

    isExpanded() {
        return this.getAttribute('expanded') !== null && this.getAttribute('expanded') !== 'false';
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        if (!this.#initialized) {
            this.#init();

            // Ensure the accordion has a valid id
            const accId = this.#getContentElement().getAttribute('id');
            if (accId === '' || accId !== this.#getHeadingElement().querySelector('.accordion-button').getAttribute('aria-controls')) {
                let defaultId = '';
                if (this.hasAttribute('content-id')) {
                    defaultId = this.getAttribute('content-id');
                }
                else if (accId === '') {
                    do {
                        defaultId = generateUniqueIdWithPrefix('acc');
                    } while (document.getElementById(defaultId));
                }
                else {
                    defaultId = accId;
                }
                this.#updateContentId(defaultId);
            }

            if (this.hasAttribute('variant-text') && this.hasAttribute('variant-icon')) {
                this.#updateVariant(this.getAttribute('variant-text'), this.getAttribute('variant-icon'));
            }

            this.#getHeadingElement().querySelector('button.accordion-button').addEventListener('click', this.#handleAccordionClick, false);
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        if (this.#getHeadingElement()) {
            const button = this.#getHeadingElement().querySelector('button.accordion-button');
            if (button && this.#handleAccordionClick) {
                button.removeEventListener('click', this.#handleAccordionClick, false);
            }
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(attribute, oldValue, newValue) {
        if (this.#initialized) {

            if (attribute === 'heading') {
                this.#updateHeading(newValue);
            }

            if (attribute === 'heading-level') {
                this.#updateHeadingLevel(newValue);
            }

            if (attribute === 'expanded' && oldValue !== newValue) {
                this.#updateExpanded(newValue);
            }

            if (attribute === 'content-id') {
                this.#updateContentId(newValue);
            }

            if (attribute === 'variant-text') {
                if (this.hasAttribute('variant-icon')) {
                    this.#updateVariant(newValue, this.getAttribute('variant-icon'));
                }
                else {
                    this.#updateVariant(newValue, '');
                }
            }

            if (attribute === 'variant-icon') {
                if (this.hasAttribute('variant-text')) {
                    this.#updateVariant(this.getAttribute('variant-text'), newValue);
                }
                else {
                    this.#updateVariant('', newValue);
                }
            }
        }
    }
}

export default FDSAccordion;