import { createRef, useRef } from "react";

export const useFormNavigation = () => {
  const refs = useRef([]);

  const getRef = (index) => {
    if (!refs.current[index]) {
      refs.current[index] = createRef();
    }
    return refs.current[index];
  };

  const handleKeyDown = (e, index, totalFields) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0 && e.target.value === undefined) {
      e.preventDefault();
      refs.current[index - 1]?.current?.focus();
    }
    if (e.key === "Tab" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      refs.current[(index + 1) % totalFields]?.current?.focus();
    }
    if (e.key === "Tab" && e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      refs.current[(index - 1 + totalFields) % totalFields]?.current?.focus();
    }
  };

  
  return { getRef, handleKeyDown };
};
