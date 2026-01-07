'use client';

import { useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Cast to any to avoid strict ref typing issues with dynamic imports
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
}) as any;

interface EditorProps {
  /** The current text content of the editor */
  value: string;
  /** Callback fired when the editor content changes */
  onChange: (value: string) => void;
  /** Placeholder text to display when empty */
  placeholder?: string;
  /** Minimum height of the editor container */
  minHeight?: string;
  /** Maximum height of the editor container */
  maxHeight?: string;
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
  /** Additional CSS classes to apply to the wrapper */
  className?: string;
}

const modules = {
  toolbar: false,
};

const formats: string[] = [];

/**
 * A rich text editor wrapper using ReactQuill.
 *
 * This component provides a customized wrapper around ReactQuill with
 * controlled value management and styling integration via global CSS.
 *
 * @param props - The component props
 * @param props.value - Controlled value string
 * @param props.onChange - Change handler
 * @param props.placeholder - Optional placeholder text
 * @param props.minHeight - Min height CSS value (default: "80px")
 * @param props.maxHeight - Max height CSS value
 * @param props.readOnly - Read-only flag
 * @param props.className - Extra classes
 * @returns The rendered editor component
 */
export function Editor({
  value,
  onChange,
  placeholder = '',
  minHeight = '80px',
  maxHeight,
  readOnly = false,
  className = '',
}: EditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);
  const isInternalChange = useRef(false);

  // Sync external value changes to Quill (for setValue from react-hook-form)
  useEffect(() => {
    if (quillRef.current && !isInternalChange.current) {
      const editor = quillRef.current.getEditor();
      const currentText = editor.getText().replace(/\n$/, '');

      // Only update if the value actually changed (avoid cursor jump)
      if (currentText !== value) {
        editor.setText(value || '');
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Extract plain text from Quill editor instead of HTML
  const handleChange = useCallback(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const plainText = editor.getText();
      // Remove trailing newline that Quill always adds
      const trimmed = plainText.endsWith('\n') ? plainText.slice(0, -1) : plainText;

      isInternalChange.current = true;
      onChange(trimmed);
    }
  }, [onChange]);

  return (
    <div
      className={`quill-editor-wrapper rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-black/20 overflow-hidden ${className}`}
      style={{
        ['--editor-min-height' as string]: minHeight,
        ['--editor-max-height' as string]: maxHeight || 'none',
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}
