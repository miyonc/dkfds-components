import { generateUniqueIdWithPrefix } from '../../utils/generate-unique-id.js';

export function renderAccordionHTML({
    heading = '',
    headingLevel = 'h3',
    expanded = false,
    contentId = '',
    variantText = '',
    variantIcon = '',
    content = '',
} = {}) {
    const id = contentId || generateUniqueIdWithPrefix('acc');
    const ariaExpanded = expanded ? 'true' : 'false';
    const ariaHidden = expanded ? 'false' : 'true';

    const variantMarkup =
        variantText && variantIcon
            ? `<span class="accordion-icon">
                    <span class="icon_text">${variantText}</span>
                    <svg class="icon-svg" focusable="false" aria-hidden="true">
                        <use href="#${variantIcon}"></use>
                    </svg>
                </span>`
            : '';

    return `
    <fds-accordion
    heading="${heading}"
    heading-level="${headingLevel}"
    expanded="${ariaExpanded}"
    content-id="${id}"
    ${variantText ? `variant-text="${variantText}"` : ''}
    ${variantIcon ? `variant-icon="${variantIcon}"` : ''}>
        <${headingLevel}>
            <button class="accordion-button"
                    type="button"
                    aria-expanded="${ariaExpanded}"
                    aria-controls="${id}">
            <span class="accordion-title">${heading}</span>
            ${variantMarkup}
            </button>
        </${headingLevel}>
        <div class="accordion-content"
            id="${id}"
            aria-hidden="${ariaHidden}">
            <p>${content}</p>
        </div>
    </fds-accordion>
  `.trim();
}
