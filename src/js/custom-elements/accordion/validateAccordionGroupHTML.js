export function validateAccordionGroupHTML(groupElement) {
  if (!groupElement) return false;

  const hasAccordions = groupElement.querySelectorAll(':scope > fds-accordion').length > 0;

  return hasAccordions;
}