<<<<<<< HEAD
# Canvas PDF Viewer Interceptor

A Chrome extension that intercepts Canvas LMS's default PDF viewer and replaces it with a customizable blank slate container, allowing you to implement your own PDF viewing experience.

## Features

- 🎯 **Automatic Detection**: Uses MutationObserver to detect when Canvas opens a PDF preview modal
- 🔗 **URL Extraction**: Captures the authenticated PDF URL with CloudFlare verifier token
- 🚫 **Canvas Viewer Hiding**: Hides Canvas's default iframe viewer without breaking functionality
- 📦 **Blank Slate Container**: Provides a clean, unstyled container ready for your custom viewer
- 🔧 **Developer Friendly**: Extensively commented code with console logging for debugging

## Installation

### Developer Mode Installation

1. **Download or Clone** this extension to your local machine

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Select the folder containing this extension's files
   - The extension should now appear in your extensions list

5. **Create Icon Placeholders** (Optional)
   - Create an `icons` folder in the extension directory
   - Add placeholder images: `icon16.png`, `icon48.png`, `icon128.png`
   - Or remove the icons section from `manifest.json`

## Testing

### How to Test on Canvas LMS

1. **Navigate to Canvas**
   - Go to any Canvas LMS instance (e.g., `yourschool.instructure.com`)
   - Log in to your account

2. **Find a Course with PDFs**
   - Navigate to any course
   - Go to Files or Modules section
   - Find any PDF file

3. **Open PDF Preview**
   - Click on a PDF file to open the preview modal
   - Canvas will attempt to open its default viewer

4. **Verify Interception**
   - The Canvas iframe should be hidden
   - You should see the custom blank slate container with the message: "Custom PDF Viewer Container - Ready for Styling"
   - A light gray background with dashed border should be visible

5. **Check Browser Console**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Check the Console tab
   - You should see logs from the extension:
```
     [Canvas PDF Interceptor] Extension loaded on: [URL]
     [Canvas PDF Interceptor] Observer active and monitoring for PDF modals
     [Canvas PDF Interceptor] PDF modal detected, intercepting...
     [Canvas PDF Interceptor] Extracted PDF URL: [Full URL with verifier token]
     [Canvas PDF Interceptor] Canvas iframe hidden
     [Canvas PDF Interceptor] Custom viewer injected successfully
```

6. **Access PDF URL**
   - The authenticated PDF URL is logged to console
   - It's also stored in the custom viewer element's `data-pdf-url` attribute
   - You can access it via: `document.getElementById('custom-pdf-viewer').dataset.pdfUrl`

## How It Works

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     Canvas LMS Page                          │
├─────────────────────────────────────────────────────────────┤
│  1. User clicks PDF file                                    │
│  2. Canvas creates modal with [data-testid="file-          │
│     preview-modal"]                                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        MutationObserver (content-script.js)          │  │
│  │  - Detects modal appearance                          │  │
│  │  - Triggers interceptPDFViewer()                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Interception Process                        │  │
│  │  1. Extract URL from #download-icon-button           │  │
│  │  2. Hide #file-preview-iframe (Canvas viewer)        │  │
│  │  3. Create custom viewer div                         │  │
│  │  4. Inject into #file-preview-modal-drawer-layout    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Custom Viewer Container                       │  │
│  │  - Blank slate div with minimal CSS                  │  │
│  │  - PDF URL stored in data-pdf-url attribute          │  │
│  │  - Ready for custom implementation                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **MutationObserver**: Monitors DOM for PDF modal appearance
   - Watches for `[data-testid="file-preview-modal"]`
   - Efficient subtree observation
   - Prevents duplicate processing with WeakSet

2. **URL Extraction**: Captures authenticated PDF URL
   - Reads from `#download-icon-button` href attribute
   - Includes CloudFlare verifier token
   - Converts to absolute URL

3. **Canvas Viewer Hiding**: Preserves modal structure
   - Sets `display: none` on `#file-preview-iframe`
   - Doesn't remove elements (maintains Canvas functionality)
   - Modal close button continues to work

4. **Custom Viewer Injection**: Blank slate container
   - Inserted into `#file-preview-modal-drawer-layout`
   - Full width/height of modal body
   - Minimal CSS for maximum flexibility

## Customization

### Adding Your PDF Viewer

The extension provides a blank slate. Here's how to add your own PDF viewer:

#### Option 1: Using PDF.js (Recommended)
```javascript
// In content-script.js, replace the placeholder content with:

const viewerContent = document.createElement('div');
viewerContent.id = 'pdf-viewer-content';

// Create canvas for PDF.js
const canvas = document.createElement('canvas');
canvas.id = 'pdf-canvas';
viewerContent.appendChild(canvas);

// Load PDF.js and render
// (You'll need to include PDF.js library in your extension)
```

#### Option 2: Using iframe with Custom Controls
```javascript
// Create an iframe with the extracted PDF URL
const iframe = document.createElement('iframe');
iframe.src = absolutePdfUrl;
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';
viewerContent.appendChild(iframe);
```

#### Option 3: Custom Canvas-Based Renderer
```javascript
// Implement your own PDF rendering logic
// Fetch the PDF using the authenticated URL
// Render pages on canvas elements
```

### Styling Your Viewer

Edit `styles.css` to customize the appearance:
```css
#custom-pdf-viewer {
  /* Change background */
  background-color: #ffffff;
  
  /* Remove development border */
  border: none;
  
  /* Add your custom styles */
  box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
}

/* Add toolbar styles */
#custom-pdf-viewer .pdf-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #333;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}
```

### Listening for Interception Events

The extension dispatches a custom event when it intercepts a PDF:
```javascript
document.addEventListener('canvasPDFIntercepted', (event) => {
  const { pdfUrl, viewerElement } = event.detail;
  console.log('PDF intercepted:', pdfUrl);
  // Add your custom logic here
});
```

## File Structure
```
canvas-pdf-interceptor/
├── manifest.json           # Extension configuration (Manifest V3)
├── content-script.js       # Main interception logic
├── styles.css             # Minimal viewer styles
├── README.md              # This file
└── icons/                 # Extension icons (optional)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions Explained

- **host_permissions**: `https://*.instructure.com/*`
  - Required to run on all Canvas LMS domains
  - Allows content script injection

- **No additional permissions needed**
  - Extension doesn't access external URLs
  - Doesn't modify browser settings
  - Only operates on Canvas pages

## Troubleshooting

### Extension Not Working

1. **Check Console for Errors**
   - Open Developer Tools (F12)
   - Look for red error messages
   - Check for `[Canvas PDF Interceptor]` logs

2. **Verify Extension is Loaded**
   - Go to `chrome://extensions/`
   - Ensure extension is enabled
   - Check for any error messages

3. **Reload Extension**
   - Click the refresh icon on the extension card
   - Reload the Canvas page

### PDF Modal Not Being Intercepted

1. **Check DOM Structure**
   - Canvas may have updated their HTML structure
   - Inspect the PDF modal in Developer Tools
   - Verify the selectors in `content-script.js` match

2. **Timing Issues**
   - The 100ms timeout may be insufficient
   - Try increasing the delay in `setTimeout()` in content-script.js

3. **Multiple Modals**
   - Check if multiple modals are opening
   - Review console logs for processing messages

### Custom Viewer Not Appearing

1. **Check Container Element**
   - Verify `#file-preview-modal-drawer-layout` exists
   - Inspect element to see if custom viewer was injected

2. **CSS Conflicts**
   - Canvas CSS may be overriding styles
   - Add `!important` flags in `styles.css` if needed

3. **JavaScript Errors**
   - Check console for exceptions
   - Verify all elements are found before manipulation

## Next Steps

1. **Choose a PDF Viewer Library**
   - PDF.js (Mozilla's library, most popular)
   - React-PDF (if using React)
   - PSPDFKit (commercial, feature-rich)

2. **Implement Rendering Logic**
   - Fetch PDF using the authenticated URL
   - Render pages in your custom viewer
   - Handle page navigation, zoom, etc.

3. **Add Controls**
   - Zoom in/out buttons
   - Page navigation
   - Download button
   - Print functionality
   - Search within PDF

4. **Enhance UX**
   - Loading indicators
   - Error handling
   - Keyboard shortcuts
   - Touch gestures for mobile

5. **Test Thoroughly**
   - Different PDF file sizes
   - Various PDF formats
   - Multiple Canvas institutions
   - Edge cases (corrupted files, permission errors)

## Contributing

This extension is designed to be a starting point. Feel free to:
- Add features
- Improve error handling
- Enhance styling
- Optimize performance
- Share improvements

## License

[Specify your license here]

## Support

For issues related to:
- **Canvas LMS structure changes**: Update selectors in `content-script.js`
- **Chrome extension APIs**: Check Chrome Extension documentation
- **PDF rendering**: Refer to your chosen PDF library's documentation

## Changelog

### Version 1.0.0
- Initial release
- Basic PDF modal interception
- Blank slate custom viewer container
- URL extraction with authentication token
- MutationObserver-based detection
=======
# BetterCanvasPDF
A chrome extension improving Canvas' PDF viewer
>>>>>>> origin/main
