/**
 * Canvas PDF Viewer Interceptor - Content Script
 * 
 * This script monitors the DOM for Canvas LMS PDF preview modals,
 * extracts the authenticated PDF URL, hides the default Canvas viewer,
 * and injects a custom blank slate viewer container.
 */

(function() {
  'use strict';

  // Flag to prevent multiple observers from being created
  let observerInitialized = false;
  
  // Track processed modals to avoid duplicate processing
  const processedModals = new WeakSet();

  /**
   * Main function that intercepts the Canvas PDF viewer
   * Extracts PDF URL, hides Canvas iframe, and injects custom viewer
   */
  function interceptPDFViewer(modalElement) {
    // Prevent processing the same modal twice
    if (processedModals.has(modalElement)) {
      console.log('[Canvas PDF Interceptor] Modal already processed, skipping');
      return;
    }
    processedModals.add(modalElement);

    console.log('[Canvas PDF Interceptor] PDF modal detected, intercepting...');

    // Wait a brief moment for Canvas to fully render the modal contents
    // Canvas dynamically loads content, so we need to ensure elements exist
    setTimeout(() => {
      try {
        // Step 1: Extract the authenticated PDF URL from the download button
        const downloadButton = document.getElementById('download-icon-button');
        
        if (!downloadButton) {
          console.error('[Canvas PDF Interceptor] Download button not found');
          return;
        }

        // Get the href which contains the authenticated URL with verifier token
        const pdfUrl = downloadButton.getAttribute('href');
        
        if (!pdfUrl) {
          console.error('[Canvas PDF Interceptor] PDF URL not found in download button');
          return;
        }

        // Convert relative URL to absolute if needed
        const absolutePdfUrl = new URL(pdfUrl, window.location.origin).href;
        console.log('[Canvas PDF Interceptor] Extracted PDF URL:', absolutePdfUrl);

        // Step 2: Hide Canvas's default iframe viewer
        const canvasIframe = document.getElementById('file-preview-iframe');
        
        if (canvasIframe) {
          canvasIframe.style.display = 'none';
          console.log('[Canvas PDF Interceptor] Canvas iframe hidden');
        } else {
          console.warn('[Canvas PDF Interceptor] Canvas iframe not found');
        }

        // Step 3: Find the container where we'll inject our custom viewer
        const drawerLayoutContent = document.getElementById('file-preview-modal-drawer-layout');
        
        if (!drawerLayoutContent) {
          console.error('[Canvas PDF Interceptor] Drawer layout container not found');
          return;
        }

        // Step 4: Check if custom viewer already exists (prevent duplicates)
        if (document.getElementById('custom-pdf-viewer')) {
          console.log('[Canvas PDF Interceptor] Custom viewer already exists');
          return;
        }

        // Step 5: Create the custom PDF viewer container
        const customViewer = document.createElement('div');
        customViewer.id = 'custom-pdf-viewer';
        customViewer.className = 'custom-pdf-viewer';
        
        // Store the PDF URL as a data attribute for easy access
        customViewer.setAttribute('data-pdf-url', absolutePdfUrl);

        // Step 6: Create inner content container (blank slate for future development)
        const viewerContent = document.createElement('div');
        viewerContent.id = 'pdf-viewer-content';
        viewerContent.className = 'pdf-viewer-content';
        
        // Placeholder content - replace this with your actual PDF viewer
        const placeholder = document.createElement('p');
        placeholder.textContent = 'Custom PDF Viewer Container - Ready for Styling';
        placeholder.style.cssText = 'color: #666; font-size: 18px; text-align: center;';
        
        viewerContent.appendChild(placeholder);
        customViewer.appendChild(viewerContent);

        // Step 7: Inject the custom viewer into the modal
        drawerLayoutContent.appendChild(customViewer);
        
        console.log('[Canvas PDF Interceptor] Custom viewer injected successfully');
        console.log('[Canvas PDF Interceptor] PDF URL available at: customViewer.dataset.pdfUrl');

        // Optional: Dispatch custom event for other scripts to hook into
        const event = new CustomEvent('canvasPDFIntercepted', {
          detail: {
            pdfUrl: absolutePdfUrl,
            viewerElement: customViewer
          }
        });
        document.dispatchEvent(event);

      } catch (error) {
        console.error('[Canvas PDF Interceptor] Error during interception:', error);
      }
    }, 100); // 100ms delay to ensure Canvas has rendered
  }

  /**
   * Initialize MutationObserver to watch for PDF modal appearance
   * The observer watches for the specific data-testid attribute that Canvas uses
   */
  function initializeObserver() {
    if (observerInitialized) {
      return;
    }
    observerInitialized = true;

    console.log('[Canvas PDF Interceptor] Initializing MutationObserver...');

    // Create observer to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      // Iterate through all mutations to find the PDF modal
      for (const mutation of mutations) {
        // Only process added nodes
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          
          // Check each added node
          for (const node of mutation.addedNodes) {
            // Skip text nodes and non-element nodes
            if (node.nodeType !== Node.ELEMENT_NODE) {
              continue;
            }

            // Check if the node itself is the PDF modal
            if (node.getAttribute && node.getAttribute('data-testid') === 'file-preview-modal') {
              console.log('[Canvas PDF Interceptor] PDF modal detected (direct match)');
              interceptPDFViewer(node);
              return;
            }

            // Check if the modal exists within the added node
            const modal = node.querySelector ? node.querySelector('[data-testid="file-preview-modal"]') : null;
            if (modal) {
              console.log('[Canvas PDF Interceptor] PDF modal detected (in subtree)');
              interceptPDFViewer(modal);
              return;
            }
          }
        }
      }
    });

    // Start observing the document body for changes
    // subtree: true ensures we catch modals added anywhere in the DOM
    // childList: true watches for added/removed nodes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Canvas PDF Interceptor] Observer active and monitoring for PDF modals');
  }

  /**
   * Check if a PDF modal is already present when the script loads
   * This handles cases where the user navigates directly to a page with an open modal
   */
  function checkForExistingModal() {
    const existingModal = document.querySelector('[data-testid="file-preview-modal"]');
    if (existingModal) {
      console.log('[Canvas PDF Interceptor] Existing PDF modal found on page load');
      interceptPDFViewer(existingModal);
    }
  }

  /**
   * Initialize the extension
   * Called when the DOM is ready
   */
  function initialize() {
    console.log('[Canvas PDF Interceptor] Extension loaded on:', window.location.href);
    
    // Check for existing modal first
    checkForExistingModal();
    
    // Then start observing for future modals
    initializeObserver();
  }

  // Wait for DOM to be ready before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM is already ready
    initialize();
  }

})();