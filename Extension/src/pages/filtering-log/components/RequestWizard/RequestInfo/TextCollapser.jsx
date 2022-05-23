import React, { forwardRef } from 'react';
import cn from 'classnames';

import { useTextCollapse } from '../../../../common/hooks/useTextCollapse';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { CopyToClipboard } from '../../../../common/components/CopyToClipboard';

export const TextCollapser = forwardRef(({
    text,
    width,
    canCopy,
    children,
}, ref) => {
    const [isCollapsed, isOverflown, toggleCollapsed] = useTextCollapse(text, width, true);

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

    const collapserClassName = isCollapsed && isOverflown
        ? 'request-info__url-short'
        : 'request-info__url-full';

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
                >
                    {text}
                </CopyToClipboard>
            ) : <div className={collapserClassName}>{text}</div>}

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
