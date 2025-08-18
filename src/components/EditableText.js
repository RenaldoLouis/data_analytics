"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { H3 } from "@/components/ui/typography";
import { Check, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from 'react';

export function EditableText({ initialName, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const inputRef = useRef(null);

    // This effect ensures the input is focused when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select(); // Selects all text for easy replacement
        }
    }, [isEditing]);

    // This effect ensures the local state updates if the initialName prop changes from the parent
    useEffect(() => {
        setName(initialName);
    }, [initialName]);

    const handleSave = () => {
        setIsEditing(false);
        // Call the onSave function passed from the parent with the new name
        onSave(name);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSave();
        } else if (event.key === 'Escape') {
            // Revert changes and exit editing mode
            setName(initialName);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex justify-between items-start w-full">
            {isEditing ? (
                // --- Edit Mode ---
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave} // Save when the user clicks away
                        className="text-xl font-bold h-9 w-55"
                    />
                    <Button onClick={handleSave} size="icon" className="h-9 w-9 flex-shrink-0">
                        <Check className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                // --- View Mode ---
                <>
                    <H3 className="text-xl font-bold leading-snug break-all w-55">
                        {name}
                    </H3>
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                    >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </>
            )}
        </div>
    );
}