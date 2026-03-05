import { generateAndVerifyUniqueId } from '../../utils/generate-unique-id';

class FDSUploadFile extends HTMLElement {

    /**
     * Internal state:
     * - #files holds the canonical list of selected files (source of truth).
     * - UI (dropzone vs file list) is rendered based on #files.length.
     * - DOM is partially cached (#dropzoneEl, #fileListEl) to allow toggling without recreating elements unnecessarily.
     */

    #inputEl = null;
    #initialized = false;
    #files = [];
    #uploadObserver = null;
    #dropzoneEl = null;
    #fileListEl = null;

    #onClick;
    #onInputChange;

    /* Private methods */

    #getLabel() {
        return this.getAttribute('upload-label') ?? 'Vedhæft filer';
    }

    #getUploadId() {
        return this.getAttribute('upload-id') ?? null;
    }

    #getDropzonePrefix() {
        return this.getAttribute('dropzone-prefix') ?? 'Træk dine filer herhen eller';
    }

    #getDropzoneLink() {
        return this.getAttribute('dropzone-link') ?? 'vælg filer';
    }

    #getDropzoneSuffix() {
        return this.getAttribute('dropzone-suffix') ?? '';
    }

    #getFileListHeader() {
        return this.getAttribute('file-list-header') ?? 'Valgte filer';
    }

    #getFileListMore() {
        return this.getAttribute('file-list-more') ?? 'Vælg flere filer'
    }

    #getFileListHeadingLevel() {
        const headingLevel = this.getAttribute('heading-level');
        if (!headingLevel || !['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(headingLevel)) {
            return 'h5';
        }
        return headingLevel;
    }

    #setUploadLabel() {
        let label = this.querySelector('.fds-upload-label');

        if (!label) {
            label = document.createElement('label');
            label.className = 'fds-upload-label';
            this.prepend(label);
        }

        label.textContent = this.#getLabel();
        return label;
    }

    #setFileListHeader() {
        const title = this.querySelector('.fds-upload-title');
        if (title) {
            title.textContent = this.#getFileListHeader();
        }
    }

    #setFileListMore() {
        const moreText = this.querySelector('.fds-upload-add-more');
        if (moreText) {
            moreText.textContent = this.#getFileListMore();
        }
    }

    #setFileItemsRemoveText() {
        const fileItems = this.querySelectorAll('fds-file-item');
        const removeText = this.getAttribute('remove-text') || 'Fjern';

        fileItems.forEach(item => {
            item.setAttribute('remove-text', removeText);
        });
    }

    #updateFileListHeadingLevel() {
        if (!this.#fileListEl) return;

        const currentTitle = this.#fileListEl.querySelector('.fds-upload-title');
        if (!currentTitle) return;

        const newTag = this.#getFileListHeadingLevel();
        const currentTag = currentTitle.tagName.toLowerCase();

        if (currentTag === newTag) return;

        const newTitle = document.createElement(newTag);
        newTitle.className = currentTitle.className;
        newTitle.textContent = currentTitle.textContent;

        currentTitle.replaceWith(newTitle);
    }

    #showDropzone() {
        if (!this.#dropzoneEl) {
            this.#dropzoneEl = this.#renderDropzone();
        }

        this.#fileListEl?.remove();
        this.#fileListEl = null;

        if (!this.contains(this.#dropzoneEl)) {
            this.appendChild(this.#dropzoneEl);
        }
    }

    #showFileList() {
        if (!this.#fileListEl) {
            this.#fileListEl = this.#renderFileList();
        } else {
            this.#updateFileList();
        }

        this.#dropzoneEl?.remove();
        this.#dropzoneEl = null;

        if (!this.contains(this.#fileListEl)) {
            this.appendChild(this.#fileListEl);
        }
    }

    #updateUploadId(newValue) {
        if (this.#inputEl) {
            this.#inputEl.id = newValue || generateAndVerifyUniqueId('file-input');
            const mainLabel = this.querySelector('.fds-upload-label');
            if (mainLabel) {
                mainLabel.setAttribute('for', this.#inputEl.id);
            }
        }
    }

    #updateFileList() {
        const filesContainer = this.#fileListEl.querySelector('.fds-upload-files');
        if (!filesContainer) return;

        filesContainer.replaceChildren();

        this.#files.forEach(fileObj => {
            filesContainer.appendChild(this.#renderFileItem(fileObj));
        });
    }

    #updateDropzoneContent() {
        if (!this.#dropzoneEl) return;

        const content = this.#dropzoneEl.querySelector('.fds-upload-dropzone-content p');
        if (!content) return;

        const linkSpan = content.querySelector('.fds-upload-choose');
        if (!linkSpan) return;

        linkSpan.textContent = this.#getDropzoneLink();

        content.innerHTML = '';
        const prefix = this.#getDropzonePrefix();
        if (prefix) content.append(prefix + ' ');

        content.appendChild(linkSpan);

        const suffix = this.#getDropzoneSuffix();
        if (suffix) content.append(' ' + suffix);
    }


    /* Mutation observer */

    #setupObserver() {
        this.#uploadObserver = new MutationObserver(this.#handleMutations);

        const config = {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['hidden', 'aria-hidden', 'id'],
            attributeOldValue: false,
            characterData: false,
            characterDataOldValue: false
        };

        this.#uploadObserver.observe(this, config);
    }

    #handleMutations = (records, observer) => {
        const shouldUpdate = records.some(record =>
            this.#hasRelevantMutationHappened(record.addedNodes, record.removedNodes, record.target, record.attributeName)
        );

        if (shouldUpdate) {
            this.#setupAccessibility();
        }
    }

    #hasRelevantMutationHappened(addedNodes, removedNodes, target, attributeName) {
        if (attributeName === 'id' || attributeName === 'hidden' || attributeName === 'aria-hidden') {
            return true;
        }

        const relevantTagNames = ['FDS-ERROR-MESSAGE', 'FDS-HELP-TEXT'];
        const allNodes = [...addedNodes, ...removedNodes];
        return allNodes.some(node => relevantTagNames.includes(node?.tagName));
    }

    #setupAccessibility() {
        const input = this.#inputEl;
        if (!input) return;

        const idsForAriaDescribedby = [];
        let isInvalid = false;

        // Preserve dropzone description for screen reader
        const dropzoneDesc = this.querySelector('.fds-upload-dropzone-content');
        if (dropzoneDesc && dropzoneDesc.id) {
            idsForAriaDescribedby.push(dropzoneDesc.id);
        }

        const errorMessages = this.querySelectorAll('fds-error-message:not([targets])');
        const helpTexts = this.querySelectorAll('fds-help-text');

        const ariaDescribedbyElements = [...errorMessages, ...helpTexts];

        // Build aria-describedby attribute from visible elements
        for (const element of ariaDescribedbyElements) {
            const isHidden = element.hasAttribute('hidden');
            const isAriaHidden = element.getAttribute('aria-hidden') === 'true';

            if (element.id && !isHidden && !isAriaHidden) {
                idsForAriaDescribedby.push(element.id);

                if (element.tagName === 'FDS-ERROR-MESSAGE') {
                    isInvalid = true;
                }
            }
        }

        if (idsForAriaDescribedby.length > 0) {
            const describedBy = idsForAriaDescribedby.join(' ');
            input.setAttribute('aria-describedby', describedBy);
        } else {
            input.removeAttribute('aria-describedby');
        }

        if (input) {
            isInvalid ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid');
        }
    }

    /* Disabled */

    #shouldHaveDisabled(value) {
        return value !== null && value !== 'false' && value !== false;
    }

    #setDisabled() {
        this.classList.add('fds-upload-file-disabled');

        const input = this.#inputEl;
        if (input) {
            input.disabled = true;
        }
    }

    #removeDisabled() {
        this.classList.remove('fds-upload-file-disabled');

        const input = this.#inputEl;
        if (input) {
            input.disabled = false;
        }
    }

    #moveErrorsToBottom() {
        const errors = this.querySelectorAll('fds-error-message:not([targets])');
        if (errors.length === 0) return;

        this.append(...errors);
    }

    /* -----------------------------
       Rendering
    ----------------------------- */

    #render() {
        this.#setUploadLabel();

        if (this.#files.length === 0) {
            this.#showDropzone();
        } else {
            this.#showFileList();
        }

        this.#setupAccessibility();
        this.#moveErrorsToBottom();
    }

    #renderDropzone() {
        const dropzone = document.createElement('div');
        dropzone.className = 'fds-upload-dropzone';

        // Input
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.id = this.#getUploadId() || generateAndVerifyUniqueId('file-input');
        input.className = 'fds-upload-input';

        input.addEventListener('change', this.#onInputChange);
        this.#inputEl = input;

        const isDisabled = this.#shouldHaveDisabled(this.getAttribute('upload-disabled'));
        if (isDisabled) {
            input.disabled = true;
        }
        
        const mainLabel = this.querySelector('.fds-upload-label');
        if (mainLabel) {
            mainLabel.setAttribute('for', input.id);
        }

        // Dropzone content
        const content = document.createElement('div');
        content.className = 'fds-upload-dropzone-content';
        content.id = generateAndVerifyUniqueId('dropzone-desc');
        input.setAttribute('aria-describedby', content.id);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('icon-svg');
        svg.setAttribute('aria-hidden', 'true');

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#plus-circle');
        svg.appendChild(use);

        const p = document.createElement('p');

        // Text content: prefix + link + suffix
        const prefix = this.#getDropzonePrefix();
        if (prefix) {
            p.append(prefix + ' ');
        }

        const linkText = document.createElement('span');
        linkText.className = 'fds-upload-choose';
        linkText.textContent = this.#getDropzoneLink();
        p.appendChild(linkText);

        const suffix = this.#getDropzoneSuffix();
        if (suffix) {
            p.append(' ' + suffix);
        }

        content.append(svg, p);
        dropzone.append(input, content);

        return dropzone;
    }

    #renderFileList() {
        const container = document.createElement('div');
        container.className = 'fds-upload-file-list';

        const header = document.createElement('div');
        header.className = 'fds-upload-header';

        const level = this.#getFileListHeadingLevel();
        const title = document.createElement(level);
        title.className = 'fds-upload-title';
        title.textContent = this.#getFileListHeader();

        const addMore = document.createElement('button');
        addMore.type = 'button';
        addMore.className = 'fds-upload-add-more';
        addMore.textContent = this.#getFileListMore();

        header.append(title, addMore);

        const filesContainer = document.createElement('div');
        filesContainer.setAttribute('role', 'list');
        filesContainer.className = 'fds-upload-files';

        this.#files.forEach(fileObj => {
            filesContainer.appendChild(this.#renderFileItem(fileObj));
        });

        container.append(header, filesContainer);
        return container;
    }

    #renderFileItem(fileObj) {
        const { id, file } = fileObj;

        const fileItem = document.createElement('fds-file-item');

        const removeText = this.getAttribute('remove-text') || 'Fjern';
        fileItem.setAttribute('remove-text', removeText);

        fileItem.setFileData(file, id);

        return fileItem;
    }

    /* -----------------------------
       State updates
    ----------------------------- */

    #addFiles(fileList) {
        const isFirstFile = this.#files.length === 0;

        const newFiles = Array.from(fileList).map(file => ({
            id: generateAndVerifyUniqueId('file'),
            file
        }));

        this.#files.push(...newFiles);

        // Emit event with added files
        this.dispatchEvent(new CustomEvent('files-added', {
            detail: newFiles.map(f => f.file),
            bubbles: true,
            composed: true
        }));

        // If this is the first file, we must re-render to switch from dropzone view to file list view.
        if (isFirstFile) {
            this.#render();
            return;
        }

        const filesContainer = this.querySelector('.fds-upload-files');
        newFiles.forEach(fileObj => {
            filesContainer?.appendChild(this.#renderFileItem(fileObj));
        });
    }


    #removeFileByKey(key) {
        // Find the file to remove before filtering
        const removedFile = this.#files.find(f => f.id === key);

        // Remove it from internal state
        this.#files = this.#files.filter(f => f.id !== key);

        const fileItem = this.querySelector(`fds-file-item[data-file-key="${key}"]`);
        if (fileItem) {
            fileItem.remove();
        }

        // Emit event with removed file
        if (removedFile) {
            this.dispatchEvent(new CustomEvent('files-removed', {
                detail: removedFile.file,
                bubbles: true,
                composed: true
            }));
        }

        // Re-render to show dropzone if all files are removed
        if (this.#files.length === 0) {
            this.#render();
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT METHODS
    -------------------------------------------------- */

    getFiles() {
        return this.#files.map(fileObj => ({
            id: fileObj.id,
            file: fileObj.file
        }));
    }

    addError(message, fileId = null) {
        const errorMessage = document.createElement('fds-error-message');
        errorMessage.textContent = message;

        if (fileId) {
            errorMessage.setAttribute('targets', fileId);
        }

        this.appendChild(errorMessage);
        this.#setupAccessibility();
        return errorMessage;
    }

    removeError(errorElement) {
        if (this.contains(errorElement)) {
            errorElement.remove();
            this.#setupAccessibility();
        }
    }


    /* Attributes which can invoke attributeChangedCallback() */

    static observedAttributes = ['upload-label', 'upload-id', 'dropzone-prefix', 'dropzone-link', 'dropzone-suffix', 'upload-disabled', 'file-list-header', 'file-list-more', 'remove-text', 'heading-level'];

    /* --------------------------------------------------
   CUSTOM ELEMENT CONSTRUCTOR (do not access or add attributes in the constructor)
   -------------------------------------------------- */

    constructor() {
        super();

        this.#onInputChange = e => this.#addFiles(e.target.files);

        this.#onClick = e => {
            if (this.#shouldHaveDisabled(this.getAttribute('upload-disabled'))) return;

            const removeBtn = e.target.closest('.fds-upload-remove');
            if (removeBtn) {
                const fileKey = removeBtn.dataset.fileKey;
                if (fileKey) {
                    this.#removeFileByKey(fileKey);
                    return;
                }
            }

            const addMore = e.target.closest('.fds-upload-add-more');
            if (addMore) {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.style.display = 'none';
                input.addEventListener('change', e => {
                    this.#addFiles(e.target.files);
                    input.remove();
                });
                document.body.appendChild(input);
                input.click();
            }
        };
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT ADDED TO DOCUMENT
    -------------------------------------------------- */

    connectedCallback() {
        if (this.#initialized) return;

        this.addEventListener('click', this.#onClick);

        this.#setupObserver();

        const existingDropzone = this.querySelector('.fds-upload-dropzone');
        const existingFileList = this.querySelector('.fds-upload-file-list');

        // Caching existing elements so show/hide logic works
        if (existingDropzone || existingFileList) {
            this.#dropzoneEl = existingDropzone;
            this.#fileListEl = existingFileList;
        } else {
            this.#render();
        }

        if (this.#shouldHaveDisabled(this.getAttribute('upload-disabled'))) {
            this.#setDisabled();
        }

        this.#initialized = true;
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT REMOVED FROM DOCUMENT
    -------------------------------------------------- */

    disconnectedCallback() {
        this.#initialized = false;

        this.removeEventListener('click', this.#onClick);
        this.#inputEl?.removeEventListener('change', this.#onInputChange);
        if (this.#uploadObserver) {
            this.#uploadObserver.disconnect();
            this.#uploadObserver = null;
        }
    }

    /* --------------------------------------------------
    CUSTOM ELEMENT'S ATTRIBUTE(S) CHANGED
    -------------------------------------------------- */

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.#initialized) return;

        if (name === 'upload-label' && oldValue !== newValue) {
            this.#setUploadLabel();
        }

        if (name === 'upload-id' && oldValue !== newValue) {
            this.#updateUploadId(newValue);
        }

        if (name === 'upload-disabled' && oldValue !== newValue) {
            this.#shouldHaveDisabled(newValue) ? this.#setDisabled() : this.#removeDisabled();
        }

        if (['dropzone-prefix', 'dropzone-link', 'dropzone-suffix'].includes(name) && oldValue !== newValue) {
            if (this.#files.length === 0) {
                this.#updateDropzoneContent();
            }
        }

        if (name === 'file-list-header' && oldValue !== newValue) {
            this.#setFileListHeader();
        }

        if (name === 'file-list-more' && oldValue !== newValue) {
            this.#setFileListMore();
        }

        if (name === 'remove-text' && oldValue !== newValue) {
            this.#setFileItemsRemoveText()
        }

        if (name === 'heading-level' && oldValue !== newValue) {
            this.#updateFileListHeadingLevel()
        }
    }
}

function registerUploadFile() {
    if (customElements.get('fds-upload-file') === undefined) {
        window.customElements.define('fds-upload-file', FDSUploadFile);
    }
}

export default registerUploadFile;