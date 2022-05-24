import React, { forwardRef } from 'react';
import cn from 'classnames';

import { useTextCollapse } from '../../../../common/hooks/useTextCollapse';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { CopyToClipboard } from '../../../../common/components/CopyToClipboard';

export const TextCollapser = forwardRef(({
    text,
    width,
    lineCountLimit,
    collapserButtonMessages,
    canCopy,
    children,
}, ref) => {
    const [
        isCollapsed,
        isOverflown,
        toggleCollapsed,
    ] = useTextCollapse(text, width, lineCountLimit, true);

    const handleClick = () => {
        toggleCollapsed();
    };

    const handleKeyUp = (e) => {
        if (e.key === 'Enter') {
            toggleCollapsed();
        }
    };

    const defaultShowMessage = 'text_collapser_show_default';
    const defaultHideMessage = 'text_collapser_hide_default';

    // Pick required collapser button text
    const {
        showMessage = defaultShowMessage,
        hideMessage = defaultHideMessage,
    } = collapserButtonMessages;

    const collapserButtonText = isCollapsed
        ? reactTranslator.getMessage(showMessage)
        : reactTranslator.getMessage(hideMessage);

    // Pick required text style
    const hasCollapsedStyle = isCollapsed && isOverflown;

    const collapserClassName = hasCollapsedStyle
        ? 'request-info__text-short'
        : 'request-info__text-full';

    const collapsedProps = hasCollapsedStyle && {
        style: { WebkitLineClamp: lineCountLimit },
    };

    return (
        <>
            {canCopy ? (
                <CopyToClipboard
                    ref={ref}
                    wrapperClassName="request-info__copy-to-clipboard-wrapper"
                    className={cn(
                        'request-info__copy-to-clipboard',
                        collapserClassName,
                    )}
                    {...collapsedProps}
                >
                    {text}
                </CopyToClipboard>
            ) : (
                <div
                    className={collapserClassName}
                    {...collapsedProps}
                >
                    {text}
                </div>
            )}

            {isOverflown && (
                <div
                    role="button"
                    className="request-modal__url-button"
                    type="button"
                    tabIndex="0"
                    onClick={handleClick}
                    onKeyUp={handleKeyUp}
                >
                    {collapserButtonText}
                </div>
            )}
            {children}
        </>
    );
});
