# Input Hints

**Functionality:**

* Generates a list of hints based on user input.
* Displays matching hints as the user types.
* Allows users to select a hint and populate the input field.

**Usage:**
you import like this
```javascript
const inputHints = acode.require('inputHints');
```
then

```javascript
const inputHints = acode.require('inputHints');

const $input = document.getElementById("myInput");
const hints = ["apple", "banana", "cherry"]; // Array of hint strings

const handleSelect = (value) => {
  console.log("Selected hint:", value);
};

const hintsComponent = inputhints($input, hints, handleSelect);

console.log("Selected hint element:", hintsComponent.getSelected());
console.log("Hint list container:", hintsComponent.container);
```

**Explanation:**

1. **Import**: Import the `inputhints` function from its location.
2. **Arguments**:
   * `$input`: The HTMLInputElement representing the input field.
   * `hints`: An array of hint strings or a callback function that generates hints dynamically.
   * `onSelect`: (Optional) A callback function called when a user selects a hint.
3. **Return Value**: The function returns an object with two properties:
   * `getSelected()`: Returns the currently selected hint element (HTMLLIElement) or null.
   * `container`: The HTMLUListElement representing the entire hint list container.

**Key Functionalities:**

* **Hint Generation**:
   * If `hints` is a function, it's called to generate hints dynamically.
   * Hints are filtered based on the user's input using regular expressions (case-insensitive).
* **Hint Display**:
   * Up to 100 hints are displayed at a time with pagination for longer lists.
   * The hint list automatically positions itself below or above the input field based on available space.
* **Hint Selection**:
   * Users can select hints using the mouse or keyboard arrows.
   * Selecting a hint populates the input field with the hint value and optionally calls the `onSelect` callback.

