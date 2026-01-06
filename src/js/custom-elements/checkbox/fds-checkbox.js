'use strict';

import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSCheckbox extends HTMLElement {

    /* Private instance fields */

    #input;
    #label;

    #handleHelpTextCallback;
    #handleErrorMessageCallback;
    #handleVisibilityChange;
    #onInputChange;

    /* Private methods */

    #getInputElement() {
        // Look for input as direct child first, then in wrapper
        return this.querySelector(':scope > input[type="checkbox"], :scope > .form-group-checkbox > input[type="checkbox"]');
    }

    #getLabelElement() {
        // Look for label as direct child first, then in wrapper  
        return this.querySelector(':scope > label, :scope > .form-group-checkbox > label');
    }

    #getHelpTextElements() {
        return this.querySelectorAll(':scope > fds-help-text, :scope > .form-group-checkbox > fds-help-text');
    }

    #getErrorMessages() {
        return this.querySelectorAll(':scope > fds-error-message, :scope > .form-group-checkbox > fds-error-message');
    }

    #getTooltipElement() {
        return this.querySelector('span.tooltip-wrapper');
    }

    #setStructure() {
        if (this.#input && this.#label) {
            if (this.#input.closest('.form-group-checkbox')) {
                return;
            }
            const wrapper = document.createElement('div');
            wrapper.className = "form-group-checkbox";

            this.insertBefore(wrapper, this.#input);

            // Ensure input comes before label
            wrapper.appendChild(this.#input);
            wrapper.appendChild(this.#label);

            const tooltipElement = this.#getTooltipElement();
            if (tooltipElement) {
                wrapper.appendChild(tooltipElement);
            }

            const helpTextElements = this.#getHelpTextElements();
            helpTextElements.forEach(helpText => {
                wrapper.appendChild(helpText);
            });
        }
    }

    /* Indicator */

    #setIndicator(value = '') {
        if (!this.#getLabelElement() || !this.#getInputElement()) return;

        if (!this.#getLabelElement().querySelector(':scope > span.weight-normal')) {
            const span = document.createElement('span');
            span.className = 'weight-normal';
            this.#getLabelElement().appendChild(span);
        }

        const isRequired = 
            this.#getInputElement().hasAttribute('required') || 
            (this.#getInputElement().hasAttribute('aria-required') && this.#getInputElement().getAttribute('aria-required') !== 'false');

        let text = value;
        if (value === '' && isRequired) text = 'skal udfyldes';
        if (value === '' && !isRequired) text = 'frivilligt';

        if (isRequired) {
            this.#getLabelElement().querySelector(':scope > span.weight-normal').textContent = ` (*${text})`;
        }
        else {
            this.#getLabelElement().querySelector(':scope > span.weight-normal').textContent = ` (${text})`;
        }
    }

    #removeIndicator() {
        this.#getLabelElement()?.querySelector(':scope > span.weight-normal')?.remove();
    }

    /* Collapsible content */

    #handleCollapsibleCheckboxes() {
        const input = this.#input;
        const possibleContent = this.querySelector(':scope > div.checkbox-content');
        if (!input || !possibleContent) return;

        // Ensure the div has the expected classes
        possibleContent.classList.add('checkbox-content', 'collapsed');

        // Ensure the content has an ID
        if (!possibleContent.id) {
            possibleContent.id = generateAndVerifyUniqueId('exp');
        }

        possibleContent.setAttribute('aria-hidden', 'true');
        input.setAttribute('data-aria-controls', possibleContent.id);
        input.setAttribute('data-aria-expanded', 'false');

        this.#onInputChange = () => {
            const expanded = input.checked;
            input.setAttribute('data-aria-expanded', String(expanded));
            possibleContent.setAttribute('aria-hidden', String(!expanded));
            possibleContent.classList.toggle('collapsed', !expanded);
        };

        input.addEventListener('change', this.#onInputChange);
    }

    #processVisibilityChange(event) {
        const { detail } = event;

        // Extract ID and hidden status - works for both error and help-text events
        const elementId = detail.errorId || detail.helptextId;
        const isHidden = detail.isHidden;

        const element = this.querySelector(`#${elementId}`);
        if (element) {
            element.hiddenStatus = isHidden;
        }
        this.handleIdReferences();
    }

    #isElementHidden = (element) => {
        return element.hiddenStatus !== undefined
            ? element.hiddenStatus
            : (element.hasAttribute('hidden') && element.getAttribute('hidden') !== 'false');
    };

    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['checkbox-indicator'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();

        this.#handleHelpTextCallback = () => { this.handleIdReferences(); };
        this.#handleErrorMessageCallback = () => { this.handleIdReferences(); };
        this.#handleVisibilityChange = (event) => { this.#processVisibilityChange(event); };
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    handleIdReferences() {
        if (!this.#input || !this.#label) return;

        if (!this.#input.id) {
            this.#input.id = generateAndVerifyUniqueId('chk');
        }

        this.#label.htmlFor = this.#input.id;

        const idsForAriaDescribedby = [];

        // Add help text IDs
        const helpTexts = this.#getHelpTextElements();
        helpTexts.forEach(helptext => {
            if (helptext.hasAttribute('id')) {
                const isHidden = this.#isElementHidden(helptext);
                if (!isHidden) {
                    idsForAriaDescribedby.push(helptext.id);
                }
            }
        });

        // Add error message IDs
        let hasError = false;
        let hasVisibleError = false;
        const errorMessages = this.#getErrorMessages();
        errorMessages.forEach(errorText => {
            if (errorText?.id) {
                hasError = true;
                const isHidden = this.#isElementHidden(errorText);
                if (!isHidden) {
                    idsForAriaDescribedby.push(errorText.id);
                    hasVisibleError = true;
                }
            }
        });

        // Set or remove aria-describedby
        if (idsForAriaDescribedby.length > 0) {
            this.#input.setAttribute('aria-describedby', idsForAriaDescribedby.join(' '));
        } else {
            this.#input.removeAttribute('aria-describedby');
        }
    }

    setClasses() {
        if (!this.#label || !this.#input) return;

        this.#label.classList.add('form-label');
        this.#input.classList.add('form-checkbox');
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        this.#input = this.#getInputElement();
        this.#label = this.#getLabelElement();

        this.#setStructure();
        if (this.hasAttribute('checkbox-indicator')) this.#setIndicator(this.getAttribute('checkbox-indicator'));
        this.setClasses();
        this.handleIdReferences();
        this.#handleCollapsibleCheckboxes()

        this.addEventListener('help-text-callback', this.#handleHelpTextCallback);
        this.addEventListener('error-message-callback', this.#handleErrorMessageCallback);
        this.addEventListener('error-message-visibility-changed', this.#handleVisibilityChange);
        this.addEventListener('help-text-visibility-changed', this.#handleVisibilityChange);
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        this.removeEventListener('help-text-callback', this.#handleHelpTextCallback);
        this.removeEventListener('error-message-callback', this.#handleErrorMessageCallback);
        this.removeEventListener('error-message-visibility-changed', this.#handleVisibilityChange);
        this.removeEventListener('help-text-visibility-changed', this.#handleVisibilityChange);

        if (this.#input) {
            this.#input.removeEventListener('change', this.#onInputChange);
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(attribute, oldValue, newValue) {
        if (!this.isConnected) return;

        if (attribute === 'checkbox-indicator') {
            newValue !== null ? this.#setIndicator(newValue) : this.#removeIndicator();
        }
    }
}

function registerCheckbox() {
    if (customElements.get('fds-checkbox') === undefined) {
        window.customElements.define('fds-checkbox', FDSCheckbox);
    }
}

export default registerCheckbox;