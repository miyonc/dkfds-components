'use strict';

import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSRadioButton extends HTMLElement {

    /* Private instance fields */

    #input;
    #label;

    #onInputChange;
    #handleHelpTextCallback;
    #handleVisibilityChange;

    /* Private methods */

    #getInputElement() {
        // Look for input as direct child first, then in wrapper
        return this.querySelector(':scope > input[type="radio"], :scope > .form-group-radio > input[type="radio"]');
    }

    #getLabelElement() {
        // Look for label as direct child first, then in wrapper  
        return this.querySelector(':scope > label, :scope > .form-group-radio > label');
    }

    #getHelpTextElements() {
        return this.querySelectorAll(':scope > fds-help-text, :scope > .form-group-radio > fds-help-text');
    }

    #setStructure() {
        if (this.#input && this.#label) {
            if (this.#input.closest('.form-group-radio')) {
                return;
            }
            const wrapper = document.createElement('div');
            wrapper.className = "form-group-radio";

            this.insertBefore(wrapper, this.#input);

            // Ensure input comes before label
            wrapper.appendChild(this.#input);
            wrapper.appendChild(this.#label);

            const helpTextElements = this.#getHelpTextElements();
            helpTextElements.forEach(helpText => {
                wrapper.appendChild(helpText);
            });
        }
    }

    // #handleCollapsibleContent() {
    //     const input = this.#input;
    //     const possibleContent = this.querySelector(':scope > div.radio-content');
    //     if (!input || !possibleContent) return;

    //     // Ensure the div has the expected classes
    //     possibleContent.classList.add('radio-content');

    //     // Set initial collapsed state based on input checked state
    //     if (!input.checked) {
    //         possibleContent.classList.add('collapsed');
    //     }

    //     // Ensure the content has an ID
    //     if (!possibleContent.id) {
    //         possibleContent.id = generateAndVerifyUniqueId('exp');
    //     }

    //     possibleContent.setAttribute('aria-hidden', String(!input.checked));
    //     input.setAttribute('data-aria-controls', possibleContent.id);
    //     input.setAttribute('data-aria-expanded', String(input.checked));

    //     this.#onInputChange = () => {
    //         const expanded = input.checked;
    //         input.setAttribute('data-aria-expanded', String(expanded));
    //         possibleContent.setAttribute('aria-hidden', String(!expanded));
    //         possibleContent.classList.toggle('collapsed', !expanded);

    //         // Dispatch event for group to handle
    //         this.dispatchEvent(new CustomEvent('radio-changed', {
    //             detail: { checked: input.checked },
    //             bubbles: true
    //         }));
    //     };

    //     input.addEventListener('change', this.#onInputChange);
    // }

    #processVisibilityChange(event) {
        const { detail } = event;

        const elementId = detail.helptextId;
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

    static observedAttributes = [];

    /* Getters and setters */

    get checked() {
        return this.#input?.checked ?? false;
    }

    set checked(value) {
        if (!this.#input) return;
        this.#input.checked = Boolean(value);
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
    -------------------------------------------------- */

    constructor() {
        super();

        this.#handleHelpTextCallback = () => { this.handleIdReferences(); };
        this.#handleVisibilityChange = (event) => { this.#processVisibilityChange(event); };
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    handleIdReferences() {
        if (!this.#input || !this.#label) return;

        if (!this.#input.id) {
            this.#input.id = generateAndVerifyUniqueId('rad');
        }

        this.#label.htmlFor = this.#input.id;

        const idsForAriaDescribedby = [];

        // Add help text IDs
        const helpTexts = this.#getHelpTextElements();
        helpTexts.forEach(helptext => {
            if (helptext?.hasAttribute('id')) {
                const isHidden = this.#isElementHidden(helptext);
                if (!isHidden) {
                    idsForAriaDescribedby.push(helptext.id);
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
        this.#input.classList.add('form-radio');
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        this.#input = this.#getInputElement();
        this.#label = this.#getLabelElement();

        this.#setStructure();
        this.setClasses();
        this.handleIdReferences();
        // this.#handleCollapsibleContent();

        this.addEventListener('help-text-callback', this.#handleHelpTextCallback);
        this.addEventListener('help-text-visibility-changed', this.#handleVisibilityChange);

        if (this.#input) {
            this.#onInputChange = () => {
                this.dispatchEvent(new CustomEvent('radio-changed', {
                    detail: { checked: this.#input.checked },
                    bubbles: true
                }));
            };
            this.#input.addEventListener('change', this.#onInputChange);
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        this.removeEventListener('help-text-callback', this.#handleHelpTextCallback);
        this.removeEventListener('help-text-visibility-changed', this.#handleVisibilityChange);
        if (this.#input) {
            this.#input.removeEventListener('change', this.#onInputChange);
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(attribute, oldValue, newValue) {

    }
}

function registerRadioButton() {
    if (customElements.get('fds-radio-button') === undefined) {
        window.customElements.define('fds-radio-button', FDSRadioButton);
    }
}

export default registerRadioButton;