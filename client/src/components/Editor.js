import React, { useEffect, useRef } from "react";
import "codemirror/mode/clike/clike";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/matchtags";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/comment-fold";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/selection/active-line";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import { ACTIONS } from "../Actions";

const languageModes = {
  cpp: "text/x-c++src"
};

const defaultCode = {
  cpp: `// Welcome to CodeTogether!\n\n#include <iostream>\n#include <string>\n\nint main() {\n  // Write your C++ code here\n    return 0 ;\n}`
};

function Editor({ socketRef, roomId, onCodeChange, selectedLanguage = "cpp" }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: languageModes[selectedLanguage] || "javascript",
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          matchBrackets: true,
          matchTags: true,
          lineNumbers: true,
          foldGutter: true,
          gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          styleActiveLine: true,
          lineWrapping: true,
          indentUnit: 2,
          tabSize: 2,
          indentWithTabs: false,
          extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Ctrl-/": "toggleComment",
            "Ctrl-F": "findPersistent",
            "Ctrl-H": "replace",
            "F11": function(cm) {
              cm.setOption("fullScreen", !cm.getOption("fullScreen"));
            },
            "Esc": function(cm) {
              if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
            }
          }
        }
      );

      // Set default code for the selected language
      const defaultCodeForLanguage = defaultCode[selectedLanguage] || defaultCode.python3;
      editor.setValue(defaultCodeForLanguage);
      
      editorRef.current = editor;
      editor.setSize(null, "100%");

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

      // Auto-resize on window resize
      const handleResize = () => {
        editor.setSize(null, "100%");
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    init();
  }, [selectedLanguage]);

  // Update editor mode when language changes
  useEffect(() => {
    if (editorRef.current) {
      const newMode = languageModes[selectedLanguage] || "javascript";
      editorRef.current.setOption("mode", newMode);
      
      // Update code with default for new language if editor is empty
      const currentValue = editorRef.current.getValue();
      if (!currentValue.trim()) {
        const defaultCodeForLanguage = defaultCode[selectedLanguage] || defaultCode.python3;
        editorRef.current.setValue(defaultCodeForLanguage);
      }
    }
  }, [selectedLanguage]);

  // Handle incoming code changes
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null && editorRef.current) {
          editorRef.current.setValue(code);
        }
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      }
    };
  }, [socketRef.current]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <textarea id="realtimeEditor"></textarea>
      </div>
    </div>
  );
}

export default Editor;
