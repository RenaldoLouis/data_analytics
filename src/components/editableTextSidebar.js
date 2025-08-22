// You can place this component in the same file as NavDatasets or a new file

import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from 'react';

export const EditableSidebarItem = ({ initialName, onSave, onCancel }) => {
    const [name, setName] = useState(initialName);
    const inputRef = useRef(null);

    useEffect(() => {
        // Focus and select the text when the input appears
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleSave = () => {
        // Only save if the name has actually changed
        if (name.trim() && name.trim() !== initialName) {
            onSave(name.trim());
        } else {
            onCancel();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="flex items-center space-x-2 w-full">
            <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave} // Save when the user clicks away
                className="h-7 text-sm"
            />
            <button onClick={handleSave} className="p-1 cursor-pointer">
                <Check className="w-4 h-4" />
            </button>
        </div>
    );
};