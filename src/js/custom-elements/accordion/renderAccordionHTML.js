export function renderAccordionHTML({
    heading = '',
    headingLevel = 'h3',
    expanded = false,
    contentId,
    variantText,
    variantIcon,
    content = '',
} = {}) {

    const id = contentId || '';
    const ariaExpanded = expanded;
    const ariaHidden = !expanded;
    const variantMarkup = (variantText && variantIcon)
        ? `
        <span class="accordion-icon">
            <span class="icon_text">${variantText}</span>
            <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#${variantIcon}"></use></svg>
        </span>
        `.trim() : '';

    return `
        <${headingLevel}>
            <button class="accordion-button" aria-expanded="${ariaExpanded}" type="button" aria-controls="${id}">
                <span class="accordion-title">${heading}</span>${variantMarkup}
            </button>
        </${headingLevel}>
        <div class="accordion-content" id="${id}" aria-hidden="${ariaHidden}">
            ${content}
        </div>
        `.trim();
}
