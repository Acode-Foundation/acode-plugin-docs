# Using the Ace Global API in Acode

**Introduction**

Acode is built on the  Ace editor to provide a robust code editing experience. The Ace Global API offers a way to interact with the underlying Ace editor instance within the Acode environment.

**Key Points**

* **Not the Raw Ace Instance:** The Ace Global API is not a direct reference to the current editor instance. For direct manipulation, use the `editorManager`.
* **Official Ace API Reference:** For a comprehensive understanding of Ace's capabilities, refer to the official documentation: [https://ajaxorg.github.io/ace-api-docs/modules/ace.html](https://ajaxorg.github.io/ace-api-docs/modules/ace.html).

**Example: Including Language Tools**

To enable language tools for a specific language, you can use the following code:

```javascript
// main.js
ace.require("ace/ext/language_tools");
```

**Additional Considerations**

* **API Differences:** While the Ace Global API provides access to many Ace features, there might be limitations or differences compared to directly interacting with the raw Ace instance.
* **Acode-Specific Functionalities:** Explore the Acode documentation to discover additional features and customizations related to the Ace editor that might be available through the Ace Global API or other Acode-specific mechanisms.

By understanding the nuances of the Ace Global API and leveraging the official Ace documentation, you can effectively customize and extend Acode's editing capabilities.
