import React from 'react';

export default function useBaseElement(element: React.ReactNode) {
  function renderElement() {
    return element;
  }

  return { renderElement };
}
