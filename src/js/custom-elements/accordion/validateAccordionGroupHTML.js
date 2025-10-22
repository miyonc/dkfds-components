export function validateAccordionGroupHTML(groupElement) {
  if (!groupElement) return false;

  const children = Array.from(groupElement.children);
  if (children.length === 0) return false;

  let bulkButtonCount = 0;
  let hasAccordion = false;

  for (const child of children) {
    if (child.tagName === 'FDS-ACCORDION') {
      hasAccordion = true;
      continue;
    }
    if (child.tagName === 'BUTTON' && child.classList.contains('accordion-bulk-button')) {
      bulkButtonCount++;
      if (bulkButtonCount > 1) return false;
      continue;
    }
    return false; // Invalid child
  }

  return hasAccordion;
}