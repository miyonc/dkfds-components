'use strict';

class FDSCheckboxGroup extends HTMLElement {

    /* Private instance fields */

    #fieldset;
    #legend;

    #handleErrorMessageCallback;
    #handleHelpTextCallback;
    #handleVisibilityChange;

    /* Private methods */

    #getFieldsetElement() {
        if (this.#fieldset) return this.#fieldset;

        this.#fieldset = this.querySelector('fieldset');
        return this.#fieldset;
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
        return legend;
    }

    #getGroupHelpTexts() {
        const direct = Array.from(this.querySelectorAll(':scope > fds-help-text'));
        // Help-texts inside a manually written <fieldset>
        const orphaned = Array.from(this.querySelectorAll(':scope > fieldset > fds-help-text'));

        return [...direct, ...orphaned];
    }

    #getErrorMessages() {
        const directErrors = Array.from(this.querySelectorAll(':scope > fds-error-message'));
        const orphanedErrors = Array.from(this.querySelectorAll(':scope > fieldset > fds-error-message'));

        return [...directErrors, ...orphanedErrors];
    }

    #setStructure() {
        this.#fieldset = this.querySelector('fieldset') || (() => {
            const fieldset = document.createElement('fieldset');
            this.prepend(fieldset);
            return fieldset;
        })();

        this.#legend = this.#handleLegend();

        const helpTexts = this.#getGroupHelpTexts();
        const errors = this.#getErrorMessages();

        helpTexts.forEach(el => el.remove());

        let insertionPoint = this.#legend.nextSibling;
        helpTexts.forEach(ht => {
            this.#fieldset.insertBefore(ht, insertionPoint);
        });

        // Move remaining children
        const toMove = Array.from(this.children).filter(el => el !== this.#fieldset);
        toMove.forEach(el => this.#fieldset.appendChild(el));

        return { helpTexts, errors };
    }

    #setGroupLabel() {
        if (this.#legend) {
            const label = this.getAttribute('group-label');
            if (label != null) this.#legend.textContent = label;
        }
    }

    /* Disabled */

    #shouldHaveDisabled(value) {
        return value !== null && value !== 'false' && value !== false;
    }

    #setDisabled() {
        this.#getFieldsetElement()?.setAttribute('disabled', '');
        this.#getFieldsetElement()?.classList.add('disabled');
    }

    #removeDisabled() {
        this.#getFieldsetElement()?.removeAttribute('disabled');
        this.#getFieldsetElement()?.classList.remove('disabled');
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

    static observedAttributes = ['group-label', 'group-disabled'];

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();

        this.#handleErrorMessageCallback = () => { this.handleIdReferences(); };
        this.#handleHelpTextCallback = () => { this.handleIdReferences(); };
        this.#handleVisibilityChange = (event) => { this.#processVisibilityChange(event); };
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    handleIdReferences() {
        if (!this.#fieldset) return;

        const idsForAriaDescribedby = [];

        // Add help text IDs
        const helpTexts = this.#getGroupHelpTexts();
        helpTexts.forEach(helptext => {
            if (helptext?.hasAttribute('id')) {
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
            this.#fieldset.setAttribute('aria-describedby', idsForAriaDescribedby.join(' '));
        } else {
            this.#fieldset.removeAttribute('aria-describedby');
        }
    }

    /* --------------------------------------------------
CUSTOM ELEMENT ADDED TO DOCUMENT
-------------------------------------------------- */

    connectedCallback() {
        const { helpTexts, errors } = this.#setStructure();
        this.#setGroupLabel();
        if (this.#shouldHaveDisabled(this.getAttribute('group-disabled'))) this.#setDisabled();
        this.handleIdReferences();

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
    }

    /* --------------------------------------------------
CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
-------------------------------------------------- */

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isConnected) return;

        if (name === 'group-label') {
            this.#setGroupLabel();
        }

        if (name === 'group-disabled' && (oldValue !== newValue)) {
            this.#shouldHaveDisabled(newValue) ? this.#setDisabled() : this.#removeDisabled();
        }
    }
}

function registerCheckboxGroup() {
    if (!customElements.get('fds-checkbox-group')) {
        customElements.define('fds-checkbox-group', FDSCheckboxGroup);
    }
}

export default registerCheckboxGroup;
