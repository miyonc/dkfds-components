'use strict';

import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSDateInput extends HTMLElement {

    /* Private instance fields */

    #fieldset;
    #legend;

    #handleHelpTextCallback;
    #handleVisibilityChange;
    #handleErrorMessageCallback;

    /* Private methods */

    #getFieldsetElement() {
        if (this.#fieldset) return this.#fieldset;

        this.#fieldset = this.querySelector('fieldset');
        return this.#fieldset;
    }

    #getHelpTextElements() {
        return this.querySelectorAll('fds-help-text');
    }

    #getErrorMessages() {
        const directErrors = Array.from(this.querySelectorAll(':scope > fds-error-message'));
        const orphanedErrors = Array.from(this.querySelectorAll(':scope > fieldset > fds-error-message'));

        return [...directErrors, ...orphanedErrors];
    }

    #handleLegend() {
        let legend = this.#fieldset.querySelector('legend') || this.querySelector(':scope > legend');

        if (legend && legend.parentNode !== this.#fieldset) {
            legend.remove();
            this.#fieldset.prepend(legend);
        } else if (!legend) {
            legend = document.createElement('legend');
            this.#fieldset.prepend(legend);
        }

        legend.classList.add('form-label');

        // Move tooltip into the legend
        const tooltip = this.querySelector(':scope > .tooltip-wrapper');

        if (tooltip) legend.appendChild(tooltip);

        return legend;
    }


    #setStructure() {
        this.#fieldset = this.querySelector('fieldset') || (() => {
            const fieldset = document.createElement('fieldset');
            this.prepend(fieldset);
            return fieldset;
        })();

        this.#legend = this.#handleLegend();

        const toMove = Array.from(this.children).filter(el => el !== this.#fieldset && !el.classList.contains('tooltip-wrapper'));
        toMove.forEach(el => this.#fieldset.appendChild(el));

        this.#createDateGroup();
    }

    #createDateGroup() {
        const formGroups = this.#fieldset.querySelectorAll('.form-group');

        if (formGroups.length > 0) {
            const dateGroup = document.createElement('div');
            dateGroup.classList.add('date-group', 'mt-3');

            this.#fieldset.insertBefore(dateGroup, formGroups[0]);

            formGroups.forEach(formGroup => {
                dateGroup.appendChild(formGroup);
            });
        }
    }

    #setLabel() {
        if (!this.#legend) return;

        const label = this.getAttribute('label');
        if (label == null) return;

        let textNode = Array.from(this.#legend.childNodes)
            .find(node => node.nodeType === Node.TEXT_NODE);

        if (!textNode) {
            textNode = document.createTextNode('');
            this.#legend.prepend(textNode);
        }

        textNode.nodeValue = label;
    }

    #connectErrorsToInputs() {
        const inputs = this.#fieldset.querySelectorAll('input');

        // Remove error-related state, presetve the rest
        const errorIds = this.#getErrorMessages().map(e => e.id).filter(Boolean);

        inputs.forEach(input => {
            const describedBy = input.getAttribute('aria-describedby');
            if (!describedBy) {
                input.removeAttribute('aria-invalid');
                return;
            }

            const remaining = describedBy
                .split(' ')
                .filter(id => !errorIds.includes(id));

            if (remaining.length > 0) {
                input.setAttribute('aria-describedby', remaining.join(' '));
            } else {
                input.removeAttribute('aria-describedby');
            }

            input.removeAttribute('aria-invalid');
        });

        // Apply targeted errors
        this.#getErrorMessages().forEach(errorMessage => {
            if (this.#isElementHidden(errorMessage)) return;

            const targets = errorMessage.getAttribute('targets');
            if (!targets || !errorMessage.id) return;

            targets.split(',').forEach(target => {
                const targetGroup =
                    this.#fieldset.querySelector(`[data-attribute="${target.trim()}"]`);
                const input = targetGroup?.querySelector('input');
                if (!input) return;

                const current = input.getAttribute('aria-describedby');
                const ids = current ? current.split(' ') : [];

                if (!ids.includes(errorMessage.id)) {
                    ids.push(errorMessage.id);
                    input.setAttribute('aria-describedby', ids.join(' '));
                }

                input.setAttribute('aria-invalid', 'true');
            });
        });
    }

    /* Mandatory/optional */

    #setInputRequired() {
        if (!this.hasAttribute('input-required')) return;

        if (!this.#fieldset) return;

        const inputs = this.#fieldset.querySelectorAll('input');
        inputs.forEach(input => {
            input.setAttribute('required', '');
        });
    }

    #removeInputRequired() {
        if (!this.#fieldset) return;
        
        const inputs = this.#fieldset.querySelectorAll('input');
        inputs.forEach(input => {
            input.removeAttribute('required');
        });
    }


    /* Indicator */

    #setIndicator(value = '') {
        if (!this.#legend) return;

        if (!this.#legend.querySelector(':scope > span.weight-normal')) {
            const span = document.createElement('span');
            span.className = 'weight-normal';
            this.#legend.appendChild(span);
        }

        const isRequired =
        this.hasAttribute('required') ||
        this.hasAttribute('input-required') ||
        (this.hasAttribute('aria-required') && this.getAttribute('aria-required') !== 'false');

        let text = value;
        if (value === '' && isRequired) text = 'skal udfyldes';
        if (value === '' && !isRequired) text = 'frivilligt';

        const indicatorSpan = this.#legend.querySelector(':scope > span.weight-normal');
        if (isRequired) {
            indicatorSpan.textContent = ` (*${text})`;
        } else {
            indicatorSpan.textContent = ` (${text})`;
        }
    }

    #removeIndicator() {
        this.#legend?.querySelector(':scope > span.weight-normal')?.remove();
    }


    /* Disabled */

    #shouldHaveDisabled(value) {
        return value !== null && value !== 'false' && value !== false;
    }

    #setDisabled() {
        this.#getFieldsetElement()?.setAttribute('disabled', '');
    }

    #removeDisabled() {
        this.#getFieldsetElement()?.removeAttribute('disabled');
    }

    #processVisibilityChange(event) {
        const { detail } = event;

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

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    handleIdReferences() {
        // Find all form-group containers within the fieldset
        const formGroups = this.#fieldset.querySelectorAll('.form-group');

        formGroups.forEach(formGroup => {
            const input = formGroup.querySelector('input');
            const label = formGroup.querySelector('label');

            if (!input || !label) return;

            if (!input.id) {
                const attribute = formGroup.getAttribute('data-attribute') || 'date';
                input.id = generateAndVerifyUniqueId(`dat-${attribute}-`);
            }

            label.htmlFor = input.id;
        });

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

        // Add error message IDs (fieldset level only)
        const errorMessages = this.#getErrorMessages();
        errorMessages.forEach(errorText => {
            if (!errorText?.id) return;
            if (this.#isElementHidden(errorText)) return;

            const hasTargets = errorText.hasAttribute('targets');
            if (hasTargets) return;

            idsForAriaDescribedby.push(errorText.id);
        });

        this.#connectErrorsToInputs();

        // Set or remove aria-describedby
        if (idsForAriaDescribedby.length > 0) {
            this.#fieldset.setAttribute('aria-describedby', idsForAriaDescribedby.join(' '));
        } else {
            this.#fieldset.removeAttribute('aria-describedby');
        }
    }


    setClasses() {
        const labels = this.#fieldset.querySelectorAll('label');
        const inputs = this.#fieldset.querySelectorAll('input');

        labels.forEach(label => {
            label.classList.add('form-label');
        });

        inputs.forEach(input => {
            input.classList.add('form-input');
        });
    }


    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['label', 'input-disabled', 'input-indicator', 'input-required'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();

        this.#handleHelpTextCallback = () => { this.handleIdReferences(); };
        this.#handleVisibilityChange = (event) => { this.#processVisibilityChange(event); };
        this.#handleErrorMessageCallback = () => { this.handleIdReferences(); };
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        this.#setStructure();
        this.#setLabel();
        this.setClasses();
        this.handleIdReferences();
        if (this.hasAttribute('input-indicator')) this.#setIndicator(this.getAttribute('input-indicator'));
        if (this.hasAttribute('input-required')) this.#setInputRequired();

        if (this.#shouldHaveDisabled(this.getAttribute('input-disabled'))) this.#setDisabled();

        this.addEventListener('help-text-callback', this.#handleHelpTextCallback);
        this.addEventListener('help-text-visibility-changed', this.#handleVisibilityChange);
        this.addEventListener('error-message-callback', this.#handleErrorMessageCallback);
        this.addEventListener('error-message-visibility-changed', this.#handleVisibilityChange);
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        this.removeEventListener('help-text-callback', this.#handleHelpTextCallback);
        this.removeEventListener('help-text-visibility-changed', this.#handleVisibilityChange);
        this.removeEventListener('error-message-callback', this.#handleErrorMessageCallback);
        this.removeEventListener('error-message-visibility-changed', this.#handleVisibilityChange);
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isConnected) return;

        if (name === 'label') {
            this.#setLabel();
        }

        if (name === 'input-disabled' && (oldValue !== newValue)) {
            this.#shouldHaveDisabled(newValue) ? this.#setDisabled() : this.#removeDisabled();
        }

        if (name === 'input-indicator') {
            newValue !== null ? this.#setIndicator(newValue) : this.#removeIndicator();
        }

        if (name === 'input-required' && (oldValue !== newValue)) {
        if (newValue !== null) {
            this.#setInputRequired();
            this.#setIndicator(this.getAttribute('input-indicator') || '');
        } else {
            this.#removeInputRequired();
            this.#setIndicator(this.getAttribute('input-indicator') || '');
        }
    }
    }
}

function registerDateInput() {
    if (customElements.get('fds-date-input') === undefined) {
        window.customElements.define('fds-date-input', FDSDateInput);
    }
}

export default registerDateInput;