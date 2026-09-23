import React, { forwardRef, useEffect, useRef, useState } from "react";

/** Keep in-progress text separate from normalized parent values.
 * emptyValue={null} preserves an optional blank (unknown price, coordinates,
 * or a field whose blank value means “use the city baseline”).
 */
const EditableNumberInput = forwardRef(function EditableNumberInput(
  { value, onChange, onBlur, onFocus, onKeyDown, emptyValue, min, ...props },
  ref,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const previousValue = useRef(value);
  const editingChange = useRef(false);
  const fallback =
    emptyValue === undefined ? Math.max(0, Number(min) || 0) : emptyValue;

  useEffect(() => {
    // Follow resets, city changes and preset/step buttons. An immediate parent
    // normalization of our own keystroke must not replace the text being typed.
    const externalChange = value !== previousValue.current && !editingChange.current;
    previousValue.current = value;
    editingChange.current = false;
    if (editing && externalChange) setDraft(String(value ?? ""));
  });

  return (
    <input
      {...props}
      ref={ref}
      type="number"
      min={min}
      value={editing ? draft : value ?? ""}
      onFocus={(event) => {
        setDraft(event.currentTarget.value);
        setEditing(true);
        onFocus?.(event);
      }}
      onChange={(event) => {
        editingChange.current = true;
        setDraft(event.currentTarget.value);
        if (event.currentTarget.value !== "" || fallback === null)
          onChange?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "Escape") {
          editingChange.current = false;
          setDraft(String(value ?? ""));
        }
      }}
      onBlur={(event) => {
        if (event.currentTarget.value === "" && fallback !== null) {
          // The original callbacks receive the same input element and its
          // final value, including when validation happens in onBlur.
          event.currentTarget.value = String(fallback);
          editingChange.current = true;
          setDraft(String(fallback));
          onChange?.(event);
        }
        onBlur?.(event);
        setEditing(false);
      }}
    />
  );
});

export default EditableNumberInput;
