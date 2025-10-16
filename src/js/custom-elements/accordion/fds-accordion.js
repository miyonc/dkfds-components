'use strict';
import { renderAccordionHTML } from './renderAccordionHTML.js';
import { generateUniqueIdWithPrefix } from '../../utils/generate-unique-id';

class FDSAccordion extends HTMLElement {

    /* Private instance fields */

    #initialized;
    #expanded;

    #headingElement;
    #contentElement;

    #handleAccordionClick;

    /* Private methods */

    #init() {
        if (this.children.length === 2) {
            console.log('Already initialized');
        }
        else {

            /* Default values */

            let defaultId = '';
            do {
                defaultId = generateUniqueIdWithPrefix('acc');
            } while (document.getElementById(defaultId));

            let defaultHeadingLevel = 'h3';

            this.#expanded = false;

            const html = renderAccordionHTML({
                heading: '',
                headingLevel: defaultHeadingLevel,
                expanded: this.#expanded,
                contentId: defaultId,
                variantText: '',
                variantIcon: '',
                content: '',
            });

            const template = document.createElement('template');
            template.innerHTML = html.trim();

            this.#headingElement = template.content.querySelector(defaultHeadingLevel);
            this.#contentElement = template.content.querySelector('.accordion-content');

            while (this.firstChild) {
                this.#contentElement.appendChild(this.firstChild);
            }

            /* Accordion ready */

            this.#initialized = true;
        }
    }

    #updateHeading(heading) {
        this.#headingElement.querySelector('.accordion-title').textContent = heading;
    }

    #updateHeadingLevel(headingLevel) {
        const newHeadingLevel = document.createElement(`${headingLevel}`);
        newHeadingLevel.append(...this.#headingElement.childNodes);
        this.#headingElement.replaceWith(newHeadingLevel);
        this.#headingElement = newHeadingLevel;
    }

    #updateExpanded(expanded) {
        this.#expanded = expanded === "true" ? true : false;
        if (this.#expanded) {
            this.expandAccordion();
        }
        else {
            this.collapseAccordion();
        }
    }

    #updateContentId(contentId) {
        this.#headingElement.querySelector('.accordion-button').setAttribute('aria-controls', contentId);
        this.#contentElement.setAttribute('id', contentId);
    }

    #updateVariant(text, icon) {
        const button = this.#headingElement.querySelector('button.accordion-button');

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

    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['heading', 'heading-level', 'expanded', 'content-id', 'variant-text', 'variant-icon'];

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
    CUSTOM ELEMENT FUNCTIONS
    -------------------------------------------------- */

    expandAccordion() {
        this.#headingElement.querySelector('button.accordion-button').setAttribute('aria-expanded', 'true');
        this.#contentElement.setAttribute('aria-hidden', 'false');
        this.#expanded = true;
        this.dispatchEvent(new Event('fds-accordion-expanded'));
    }

    collapseAccordion() {
        this.#headingElement.querySelector('button.accordion-button').setAttribute('aria-expanded', 'false');
        this.#contentElement.setAttribute('aria-hidden', 'true');
        this.#expanded = false;
        this.dispatchEvent(new Event('fds-accordion-collapsed'));
    }

    toggleAccordion() {
        if (this.#expanded) {
            this.collapseAccordion();
        }
        else {
            this.expandAccordion();
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        if (!this.#initialized) {
            this.#init();

            this.appendChild(this.#headingElement);
            this.appendChild(this.#contentElement);

            if (this.hasAttribute('heading')) {
                this.#updateHeading(this.getAttribute('heading'));
            }

            if (this.hasAttribute('heading-level')) {
                this.#updateHeadingLevel(this.getAttribute('heading-level'));
            }

            if (this.hasAttribute('expanded')) {
                this.#updateExpanded(this.getAttribute('expanded'));
            }
            else {
                this.#updateExpanded(this.#expanded);
            }

            if (this.hasAttribute('content-id')) {
                this.#updateContentId(this.getAttribute('content-id'));
            }

            if (this.hasAttribute('variant-text') && this.hasAttribute('variant-icon')) {
                this.#updateVariant(this.getAttribute('variant-text'), this.getAttribute('variant-icon'));
            }

            this.#headingElement.querySelector('button.accordion-button').addEventListener('click', this.#handleAccordionClick, false);
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        if (this.#headingElement) {
            const button = this.#headingElement.querySelector('button.accordion-button');
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

            if (attribute === 'expanded') {
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