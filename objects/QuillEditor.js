/**
 * QuillEditor
 * ============================================================================
 * A thin wrapper around Quill (with the quill-table-better module) that
 * provides a stable, app-facing API for embedding a rich-text editor inside
 * any container:
 *
 *   - Construction: mounts a fresh Quill instance into $container and loads
 *     an initial HTML payload.
 *   - Content I/O: setHtml()/getHtml() convert between plain, portable HTML
 *     and Quill's internal Delta/DOM representation, taking care of
 *     quill-table-better's quirks (default column widths on load, stripping
 *     internal markup on export) so callers never have to know those
 *     internals exist.
 *   - Image editing UX: adds a lightweight modal (no external UI framework
 *     required) for inserting/editing/removing images with alt/width/height,
 *     wired into the toolbar's image button and into clicks on existing
 *     images.
 *   - Lifecycle: kill() tears the editor down and restores the container to
 *     a clean state so it can be safely discarded or reused.
 *
 * All state (the `quill` instance) is kept as a closure variable rather than
 * passed around, so none of the inner helper functions take `quill` as a
 * parameter — they close over it directly.
 *
 * @param {jQuery} $container - jQuery-wrapped element to mount the editor in
 * @param {string} [htmlContent='<p></p>'] - Initial HTML content to load
 * @param {Object} [toolbar] - Quill toolsbar array
 * @param {Object} theme - Quill theme: snow or bubble.
 */
var QuillEditor = function ($container, htmlContent = '', toolbar = [], theme = 'snow') {

	if ($container === undefined) return;

	var quill;
	// Random suffix (in addition to the timestamp) avoids id collisions when
	// multiple editors are constructed within the same millisecond.
	var editorBox = 'e' + Date.now() + '_' + Math.floor(Math.random() * 1e6);

	/*
	 * Quill configuration
	 */
	var config = {
		theme: theme,
		modules: {
			toolbar: {
				container: toolbar,
				handlers: {
					'fullscreen': function() {
						$container.toggleClass('fullscreen');
						quill.theme.modules.toolbar.update();
					}
				}
			},
			'table-better': {
				language: 'en_US',
				menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
				toolbarTable: true
			},
			keyboard: {
				bindings: QuillTableBetter.keyboardBindings
			}
		}
	};

	/**
	 * Loads HTML content into a Quill editor that uses quill-table-better,
	 * using the maintainers' recommended approach (updateContents instead
	 * of setContents), auto-injecting default column widths for any table
	 * that's missing them (so resize works after load), and safely handling
	 * missing selection state.
	 *
	 * @param {string} html - The HTML content to load
	 * @param {Object} [options]
	 * @param {boolean} [options.clearExisting=true] - Whether to clear existing content first
	 * @param {number} [options.defaultTableWidth=600] - Total table width (px) to distribute across columns when missing
	 */
	this.setHtml = function (html, options = {}) {
		
		if( html=="" ) html = "<p></p>";
		
		const { clearExisting = true, defaultTableWidth = 600 } = options;

		// Optional: clear existing content, since updateContents is additive
		// (it inserts alongside existing content rather than replacing it)
		if (clearExisting) {
			quill.setText('');
		}

		// Ensure any <table> in the HTML has the width metadata
		// quill-table-better needs to track columns for resizing.
		const preparedHtml = injectDefaultTableWidths(html, defaultTableWidth);

		// Convert HTML to a Delta. `text: '\n'` is required by quill-table-better's docs.
		const delta = quill.clipboard.convert({ html: preparedHtml, text: '\n' });

		// Use the public getSelection() API rather than reaching into the
		// internal `quill.selection` module. quill.selection.getRange() is an
		// implementation detail (used internally by Quill itself) and isn't
		// part of the documented API, so it can change between versions.
		const range = quill.getSelection();
		const rangeLength = range ? range.length : 0;

		// Use updateContents (NOT setContents) — quill-table-better's docs note
		// that setContents causes tables to not display properly
		quill.updateContents(delta, Quill.sources.USER);

		quill.setSelection(
			delta.length() - rangeLength,
			Quill.sources.SILENT
		);

		quill.scrollSelectionIntoView();
	};

	/**
	 * Ensures every <table> in the given HTML has:
	 * - the "ql-table-better" class on the <table> itself
	 * - an explicit pixel "width" attribute on every <td> in a column,
	 *   evenly distributed across the table's columns
	 *
	 * quill-table-better relies on these widths to track columns internally;
	 * without them, the resize feature fails with a null domNode reference.
	 * Existing width attributes are left untouched — only missing ones are filled in.
	 *
	 * @param {string} html
	 * @param {number} defaultTableWidth - Total width (px) to distribute evenly across columns
	 * @returns {string}
	 */
	function injectDefaultTableWidths(html, defaultTableWidth = 600) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		doc.querySelectorAll('table').forEach(table => {
			// Ensure the table carries the class quill-table-better expects
			if (!table.classList.contains('ql-table-better')) {
				table.classList.add('ql-table-better');
			}

			// Determine column count from the first row (assumes no colspans;
			// tables with colspans should set widths manually instead)
			const firstRow = table.querySelector('tr');
			if (!firstRow) return;

			const columnCount = firstRow.querySelectorAll('td, th').length;
			if (columnCount === 0) return;

			const columnWidth = Math.floor(defaultTableWidth / columnCount);

			// Set a default overall width on the table itself if missing
			if (!table.style.width && !table.getAttribute('width')) {
				table.style.width = `${defaultTableWidth}px`;
			}

			// Fill in a width on every cell that doesn't already have one
			table.querySelectorAll('td, th').forEach(cell => {
				if (!cell.getAttribute('width')) {
					cell.setAttribute('width', String(columnWidth));
				}
			});
		});

		return doc.body.innerHTML;
	}

	/**
	 * Extracts clean HTML from a Quill editor that uses quill-table-better,
	 * following the module's documented export flow, stripping its internal
	 * classes/attributes from tables, and replacing non-breaking spaces
	 * with regular spaces.
	 *
	 * @param {Object} [options]
	 * @param {string} [options.tableModuleName='table-better'] - Module name used in quill.getModule()
	 * @returns {string} Clean HTML string
	 */
	this.getHtml = function (options = {}) {
		
		/*
		 * If editor is text-empty returns empty.
		 */
		if( $container.find(".ql-editor").text()=="" ) return "";
		
		const { tableModuleName = 'table-better' } = options;

		// 1. Per quill-table-better's docs: remove the "temporary" table state
		// (selection helpers, resize handles, etc.) before exporting.
		//const tableModule = quill.getModule(tableModuleName);
		//if (tableModule && typeof tableModule.deleteTableTemporary === 'function') {
		//	tableModule.deleteTableTemporary();
		//}

		// 2. Use Quill's own semantic HTML export rather than reading
		// quill.root.innerHTML directly, since getSemanticHTML produces
		// cleaner, more portable markup (see Quill's documented API).
		let rawHtml = quill.getSemanticHTML();

		// 3. Strip quill-table-better's internal classes/attributes, and
		// normalize &nbsp; to regular spaces.
		rawHtml = cleanTableBetterHtml(rawHtml);
		
		// Removes trailing empty paragraphs
		rawHtml = removeTrailingEmptyParagraphs(rawHtml);
		
		return rawHtml;
	};

	/**
	 * Removes quill-table-better's internal markup (classes, data attributes,
	 * and structural elements like <colgroup>) from exported table HTML,
	 * converts Quill's alignment classes to inline styles so alignment
	 * survives outside the editor, and normalizes non-breaking spaces.
	 *
	 * @param {string} html
	 * @returns {string}
	 */
	function cleanTableBetterHtml(html) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		// Remove any leftover temporary/selection wrapper elements
		// quill-table-better may inject (belt-and-suspenders alongside
		// deleteTableTemporary() above).
		doc.querySelectorAll('temporary, .ql-table-temporary').forEach(el => {
			el.remove();
		});

		// Remove <colgroup> — it's used internally for column-width tracking
		// by quill-table-better but isn't needed in plain exported HTML.
		doc.querySelectorAll('table colgroup').forEach(el => el.remove());

		const ALIGN_MAP = {
			'ql-align-left': 'left',
			'ql-align-center': 'center',
			'ql-align-right': 'right',
			'ql-align-justify': 'justify',
		};

		// Walk every element and strip Quill/table-better specific artifacts
		doc.querySelectorAll('*').forEach(el => {
			if (el.classList && el.classList.length) {
				[...el.classList].forEach(cls => {
					// Before removing an alignment class, translate it into
					// an inline style so the alignment survives outside Quill.
					if (ALIGN_MAP[cls]) {
						el.style.textAlign = ALIGN_MAP[cls];
					}

					// Remove any class starting with "ql-" (e.g. ql-table-better,
					// ql-table-temporary, ql-align-*, etc.) without touching
					// any other legitimate classes the element might have.
					if (cls.startsWith('ql-')) {
						el.classList.remove(cls);
					}
				});
				if (el.classList.length === 0) {
					el.removeAttribute('class');
				}
			}

			// Remove data-* attributes used internally by table-better
			// (e.g. data-class, data-row-id, data-col-id, data-width, etc.)
			[...el.attributes].forEach(attr => {
				if (attr.name.startsWith('data-')) {
					el.removeAttribute(attr.name);
				}
			});
		});

		// Replace non-breaking spaces (&nbsp; / \u00A0) with regular spaces.
		const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
		let node;
		while ((node = walker.nextNode())) {
			node.nodeValue = node.nodeValue.replace(/\u00A0/g, ' ');
		}

		return doc.body.innerHTML;
	}

	/**
	 * Opens a simple prompt UI for entering an image URL and setting its
	 * properties (alt, width, height). Works both for inserting a new image
	 * and editing an existing one already in the Quill editor.
	 *
	 * Uses Quill's built-in Image blot, which reads/writes alt, width, and
	 * height directly as DOM attributes — no custom blot registration needed.
	 */
	function setupImagePropertiesPrompt() {

		// Prevent wiring this up more than once on the same Quill instance
		if (quill.__imagePropsPromptWired) return;
		quill.__imagePropsPromptWired = true;

		// 1. Override the toolbar's default image handler (file upload) with our modal.
		const toolbar = quill.getModule('toolbar');
		if (toolbar === undefined) return;

		toolbar.addHandler('image', () => {
			openImagePropertiesModal();
		});

		// 2. Allow editing an existing image's properties by clicking on it.
		quill.root.addEventListener('click', (event) => {
			if (event.target.tagName === 'IMG') {
				openImagePropertiesModal(event.target);
			}
		});
	}

	/**
	 * Builds and shows the modal. If `existingImg` (a DOM <img> element) is
	 * passed, the modal pre-fills with its current values and updates it in
	 * place on submit. Otherwise, it inserts a brand new image at the
	 * current selection.
	 *
	 * @param {HTMLImageElement|null} existingImg
	 */
	function openImagePropertiesModal(existingImg = null) {

		const overlay = document.createElement('div');
		overlay.style.cssText = `
			position: fixed; inset: 0; background: rgba(0,0,0,0.4);
			display: flex; align-items: center; justify-content: center;
			z-index: 9999;
		`;

		const modal = document.createElement('div');
		modal.classList.add("ql-image-modal");
		modal.style.cssText = `
			background: #fff; padding: 20px; border-radius: 8px;
			width: 320px; font-family: sans-serif; font-size: 14px;
			box-shadow: 0 4px 20px rgba(0,0,0,0.2);
		`;

		// Always render the Remove button; just hide it when inserting new.
		modal.innerHTML = `
			<h3 style="margin: 0 0 12px; font-size: 16px;">
				${existingImg ? 'Edit Image' : 'Insert Image'}
			</h3>

			<label style="display:block; margin-bottom:8px;">
				URL
				<input type="text" data-field="src" style="width:100%; box-sizing:border-box; padding:6px; margin-top:4px;">
			</label>

			<label style="display:block; margin-bottom:8px;">
				Alt text
				<input type="text" data-field="alt" style="width:100%; box-sizing:border-box; padding:6px; margin-top:4px;">
			</label>

			<div style="display:flex; gap:8px; margin-bottom:12px;">
				<label style="flex:1;">
					Width
					<input type="text" data-field="width" placeholder="e.g. 300 or 50%" style="width:100%; box-sizing:border-box; padding:6px; margin-top:4px;">
				</label>
				<label style="flex:1;">
					Height
					<input type="text" data-field="height" placeholder="auto" style="width:100%; box-sizing:border-box; padding:6px; margin-top:4px;">
				</label>
			</div>

			<div style="display:flex; justify-content:flex-end; gap:8px;">
				<button data-action="remove" style="display:${existingImg ? 'inline-block' : 'none'}; margin-right:auto; color:#c00; background:none; border:none; cursor:pointer;">Remove</button>
				<button data-action="cancel" class="btn btn-danger btn-sm" >Cancel</button>
				<button data-action="submit" class="btn btn-success btn-sm" >
					${existingImg ? 'Save' : 'Insert'}
				</button>
			</div>
		`;

		overlay.appendChild(modal);
		document.body.appendChild(overlay);

		if (existingImg) {
			modal.querySelector('[data-field="src"]').value = existingImg.getAttribute('src') || '';
			modal.querySelector('[data-field="alt"]').value = existingImg.getAttribute('alt') || '';
			modal.querySelector('[data-field="width"]').value = existingImg.getAttribute('width') || '';
			modal.querySelector('[data-field="height"]').value = existingImg.getAttribute('height') || '';
		}

		const closeModal = () => overlay.remove();

		modal.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);

		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) closeModal();
		});

		// Guard on the element itself, not just the existingImg flag —
		// this can never throw even if called unexpectedly.
		const removeBtn = modal.querySelector('[data-action="remove"]');
		if (removeBtn) {
			removeBtn.addEventListener('click', () => {
				if (existingImg) existingImg.remove();
				closeModal();
			});
		}

		modal.querySelector('[data-action="submit"]').addEventListener('click', () => {
			const values = {
				src: modal.querySelector('[data-field="src"]').value.trim(),
				alt: modal.querySelector('[data-field="alt"]').value.trim(),
				width: modal.querySelector('[data-field="width"]').value.trim(),
				height: modal.querySelector('[data-field="height"]').value.trim(),
			};

			if (!values.src) {
				alert('Please enter an image URL.');
				return;
			}

			applyImageProperties(existingImg, values);
			closeModal();
		});
	}

	/**
	 * Applies the given src/alt/width/height to an image — either updating
	 * an existing <img> DOM node in place, or inserting a brand new one at
	 * the current selection.
	 *
	 * Quill's built-in Image blot reads alt/width/height directly from the
	 * DOM node (see its ATTRIBUTES list), so setting them as plain attributes
	 * is sufficient for them to round-trip correctly through Delta/HTML export.
	 *
	 * @param {HTMLImageElement|null} existingImg
	 * @param {{src: string, alt: string, width: string, height: string}} values
	 */
	function applyImageProperties(existingImg, values) {
		if (existingImg) {
			// Editing in place: just update the DOM attributes directly.
			existingImg.setAttribute('src', values.src);
			setOrRemoveAttribute(existingImg, 'alt', values.alt);
			setOrRemoveAttribute(existingImg, 'width', values.width);
			setOrRemoveAttribute(existingImg, 'height', values.height);
			return;
		}

		// Inserting new: use Quill's embed API so it's properly tracked
		// in the editor's history/undo stack, then set the extra attributes
		// on the resulting DOM node.
		const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };

		quill.insertEmbed(range.index, 'image', values.src, Quill.sources.USER);
		quill.setSelection(range.index + 1, Quill.sources.SILENT);

		const [blot] = quill.getLeaf(range.index);
		if (blot && blot.domNode) {
			setOrRemoveAttribute(blot.domNode, 'alt', values.alt);
			setOrRemoveAttribute(blot.domNode, 'width', values.width);
			setOrRemoveAttribute(blot.domNode, 'height', values.height);
		}
	}

	/** Small helper: sets an attribute if a value is present, removes it otherwise. */
	function setOrRemoveAttribute(el, name, value) {
		if (value) {
			el.setAttribute(name, value);
		} else {
			el.removeAttribute(name);
		}
	}

	/**
	 * Tears the editor down: removes Quill's toolbar/tooltip DOM, strips all
	 * Quill-injected classes from the container, and empties the container so
	 * it can be safely discarded or reused for a fresh instance.
	 *
	 * @returns {null}
	 */
	this.kill = function () {

		let editorElement = $container[0];

		// 1. Remove associated tooltips, toolbars, and clipboards
		if (quill.theme) {
			if (quill.theme.modules?.toolbar) quill.theme.modules.toolbar.container.remove();
			if (quill.theme.tooltip) quill.theme.tooltip.root.remove();
		}

		// 2. Clear Quill classes from the container.
		// Iterate over every class (not just a leading run) so a "ql-*" class
		// that appears after some other class is still removed — the previous
		// while-loop broke out on the first non-"ql-" class it saw, silently
		// leaving later Quill classes in place.
		[...editorElement.classList].forEach(className => {
			if (className.startsWith('ql-')) {
				editorElement.classList.remove(className);
			}
		});

		// 3. Safely remove the editor container's contents from the DOM
		$container.empty();

		return null;
	};

	/*
	 * Initialize Class
	 */
	$container.html("<div id='" + editorBox + "'></div>");
	quill = new Quill('#' + editorBox, config);
	setupImagePropertiesPrompt();
	
	/*
	 * Define tools bar and container height.
	 */
	if( toolbar.length==0 ){
		$container.find(".ql-toolbar").hide();
	}else{
		var containerHeight = $container.outerHeight();
		if( containerHeight>0 ) $container.find(".ql-container").height( containerHeight - $container.find(".ql-toolbar").outerHeight()-10);
	}
	
	/*
	 * Sets the initial content
	 */
	this.setHtml(htmlContent);

};