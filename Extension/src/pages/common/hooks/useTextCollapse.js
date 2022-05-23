import { useState, useLayoutEffect } from 'react';
import { measureTextWidth } from '../../helpers';

export const useTextCollapse = (text, width, defaultCollapsed) => {
    const LINE_COUNT_LIMIT = 3;

    const [isCollapsed, setCollapsed] = useState(defaultCollapsed);
    const [isOverflown, setOverflown] = useState(false);

    useLayoutEffect(() => {
        const textWidth = measureTextWidth(text);
        const isTextOverflown = textWidth > LINE_COUNT_LIMIT * width;
        setOverflown(isTextOverflown);
    }, [text, width]);

    const toggleCollapsed = () => {
        setCollapsed(!isCollapsed);
    };

    return [isCollapsed, isOverflown, toggleCollapsed];
};
