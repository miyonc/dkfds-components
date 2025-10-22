export function validateAccordionGroupHTML(groupElement) {
  if (!groupElement) return false;

  const children = Array.from(groupElement.children);
  if (children.length === 0) return false;

  const allAreAccordions = children.every(child => child.tagName === 'FDS-ACCORDION');
  if (!allAreAccordions) return false;

  return true;
}