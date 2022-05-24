import React, { forwardRef } from 'react';
import cn from 'classnames';

import { useTextCollapse } from '../../../../common/hooks/useTextCollapse';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { CopyToClipboard } from '../../../../common/components/CopyToClipboard';

export const TextCollapser = forwardRef(({
    text,
    width,
    lineCountLimit,
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

    const collapserButtonText = isCollapsed
        ? reactTranslator.getMessage('filtering_modal_show_full_url')
        : reactTranslator.getMessage('filtering_modal_hide_full_url');

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
