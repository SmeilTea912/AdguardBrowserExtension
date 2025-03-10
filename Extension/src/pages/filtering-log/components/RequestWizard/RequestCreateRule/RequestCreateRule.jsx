import React, { useContext, useRef } from 'react';
import cn from 'classnames';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { RULE_OPTIONS } from '../constants';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';
import { ADDED_RULE_STATES, WIZARD_STATES } from '../../../stores/WizardStore';
import { useOverflowed } from '../../../../common/hooks/useOverflowed';
import './request-create-rule.pcss';

const RequestCreateRule = observer(() => {
    const ref = useRef();
    const contentOverflowed = useOverflowed(ref);

    const { wizardStore, logStore } = useContext(rootStore);

    const RULE_OPTIONS_MAP = {
        [RULE_OPTIONS.RULE_DOMAIN]: {
            label: `${reactTranslator.getMessage('filtering_modal_apply_domains')}`,
        },
        [RULE_OPTIONS.RULE_THIRD_PARTY]: {
            label: `${reactTranslator.getMessage('filtering_modal_third_party')}`,
        },
        [RULE_OPTIONS.RULE_IMPORTANT]: {
            label: `${reactTranslator.getMessage('filtering_modal_important')}`,
        },
        [RULE_OPTIONS.RULE_REMOVE_PARAM]: {
            label: `${reactTranslator.getMessage('filtering_modal_remove_param')}`,
        },
    };

    const handlePatternChange = (pattern) => () => {
        wizardStore.setRulePattern(pattern);
    };

    const renderPatterns = (patterns) => {
        const patternItems = patterns.map((pattern, idx) => (
            <label
                /* eslint-disable-next-line react/no-array-index-key */
                key={`pattern${idx}`}
                className="radio-button-label"
                htmlFor={pattern}
            >
                <input
                    type="radio"
                    id={pattern}
                    name="rulePattern"
                    value={pattern}
                    checked={pattern === wizardStore.rulePattern}
                    onChange={handlePatternChange(pattern)}
                />
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <div className="radio-button" />
                {pattern}
            </label>
        ));

        return (
            <div className="patterns__content">
                {patternItems}
            </div>
        );
    };

    const handleOptionsChange = (id) => (e) => {
        const { checked } = e.target;
        wizardStore.setRuleOptionState(id, checked);
    };

    const renderOptions = () => {
        const options = Object.entries(RULE_OPTIONS_MAP);
        const renderedOptions = options.map(([id, { label }]) => {
            if (id === RULE_OPTIONS.RULE_DOMAIN && !logStore.selectedEvent.frameDomain) {
                return null;
            }

            // $third-party and $important modifiers are active for cookie rules
            // so $domain modifier is forbidden
            if (logStore.selectedEvent?.requestRule?.cookieRule
                && id === RULE_OPTIONS.RULE_DOMAIN) {
                return null;
            }

            // $removeparam option is available only for requests with query
            if (id === RULE_OPTIONS.RULE_REMOVE_PARAM
                && logStore.selectedEvent.requestUrl?.indexOf('?') < 0) {
                return null;
            }

            return (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control
                <label className="checkbox-label" key={id}>
                    <input
                        type="checkbox"
                        name={id}
                        value={id}
                        onChange={handleOptionsChange(id)}
                        checked={wizardStore.ruleOptions[id].checked}
                    />
                    <div className="custom-checkbox">
                        <Icon id="#checked" classname="icon--checked" />
                    </div>
                    {label}
                </label>
            );
        });

        return (
            <form>
                <div className="options__content">
                    {renderedOptions}
                </div>
            </form>
        );
    };

    const handleBackClick = () => {
        wizardStore.setViewState();
    };

    const handleAddRuleClick = async () => {
        await messenger.filteringLogAddUserRule(wizardStore.rule);
        const addedRuleState = wizardStore.requestModalState === WIZARD_STATES.BLOCK_REQUEST
            ? ADDED_RULE_STATES.BLOCK
            : ADDED_RULE_STATES.UNBLOCK;

        wizardStore.setAddedRuleState(addedRuleState);
    };

    const handleRuleChange = (e) => {
        wizardStore.setRuleText(e.currentTarget.value);
    };

    const {
        element,
        script,
        requestRule,
    } = logStore.selectedEvent;

    // Must invoke wizardStore.rulePatterns unconditionally to trigger wizardStore.rule computation
    const rulePatterns = renderPatterns(wizardStore.rulePatterns);
    const options = renderOptions();

    const isElementOrScript = element || script;
    const showPatterns = !isElementOrScript
        && !requestRule?.documentLevelRule
        && wizardStore.rulePatterns.length > 1;
    const showOptions = !isElementOrScript && !requestRule?.documentLevelRule;

    let title = reactTranslator.getMessage('filtering_modal_add_title');
    if (wizardStore.requestModalState === WIZARD_STATES.UNBLOCK_REQUEST) {
        title = reactTranslator.getMessage('filtering_modal_exception_title');
    }

    return (
        <>
            <div className={cn('request-modal__title', { 'request-modal__title_fixed': contentOverflowed })}>
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="request-modal__navigation request-modal__navigation--button"
                >
                    <Icon classname="icon--contain" id="#arrow-left" />
                </button>
                <span className="request-modal__header">{title}</span>
            </div>
            <div ref={ref} className="request-modal__content">
                <div className="request-info">
                    <div className="request-info__key">
                        {reactTranslator.getMessage('filtering_modal_rule_text_desc')}
                    </div>
                    <textarea
                        className="request-info__value request-modal__rule-text"
                        onChange={handleRuleChange}
                        value={wizardStore.rule}
                    />
                </div>
                {showPatterns && (
                    <div className="request-info patterns">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_patterns_desc')}
                        </div>
                        {rulePatterns}
                    </div>
                )}
                {showOptions && (
                    <div className="request-info options">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_options_desc')}
                        </div>
                        {options}
                    </div>
                )}
            </div>
            <div className={cn('request-modal__controls', { 'request-modal__controls_fixed': contentOverflowed })}>
                <button
                    type="button"
                    className="request-modal__button"
                    onClick={handleAddRuleClick}
                    title={reactTranslator.getMessage('filtering_modal_add_rule')}
                >
                    {reactTranslator.getMessage('filtering_modal_add_rule')}
                </button>
            </div>
        </>
    );
});

export { RequestCreateRule };
