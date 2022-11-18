(function (global, doc, ibexa, React, ReactDOM, Translator) {
    const CLASS_FIELD_SINGLE = 'ibexa-field-edit--ngenhancedlink';
    const SELECTOR_FIELD = '.ibexa-field-edit--ngenhancedlink';
    const SELECTOR_INPUT = '.internal_link_id';
    const SELECTOR_BTN_ADD = '.ibexa-relations__table-action--create';
    const SELECTOR_ROW = '.ibexa-relations__item';
    const EVENT_CUSTOM = 'validateInput';

    class EzObjectRelationListValidator extends ibexa.BaseFieldValidator {
        /**
         * Validates the input
         *
         * @method validateInput
         * @param {Event} event
         * @returns {Object}
         * @memberof EzObjectRelationListValidator
         */
        validateInput({ currentTarget }) {
            const isRequired = currentTarget.required;
            const isEmpty = !currentTarget.value.length;
            const hasCorrectValues = currentTarget.value.split(',').every((id) => !isNaN(parseInt(id, 10)));
            const fieldContainer = currentTarget.closest(SELECTOR_FIELD);
            const label = fieldContainer.querySelector('.ibexa-field-edit__label').innerHTML;
            const result = { isError: false };

            if (isRequired && isEmpty) {
                result.isError = true;
                result.errorMessage = ibexa.errors.emptyField.replace('{fieldName}', label);
            } else if (!isEmpty && !hasCorrectValues) {
                result.isError = true;
                result.errorMessage = ibexa.errors.invalidValue.replace('{fieldName}', label);
            }

            return result;
        }
    }

    [...doc.querySelectorAll(SELECTOR_FIELD)].forEach((fieldContainer) => {
        const validator = new EzObjectRelationListValidator({
            classInvalid: 'is-invalid',
            fieldContainer,
            eventsMap: [
                {
                    selector: SELECTOR_INPUT,
                    eventName: 'blur',
                    callback: 'validateInput',
                    errorNodeSelectors: ['.ibexa-form-error'],
                },
                {
                    isValueValidator: false,
                    selector: SELECTOR_INPUT,
                    eventName: EVENT_CUSTOM,
                    callback: 'validateInput',
                    errorNodeSelectors: ['.ibexa-form-error'],
                },
            ],
        });
        const udwContainer = doc.getElementById('react-udw');
        const sourceInput = fieldContainer.querySelector(SELECTOR_INPUT);
        const relationsContainer = fieldContainer.querySelector('.ibexa-relations__list');
        const relationsWrapper = fieldContainer.querySelector('.ibexa-relations__wrapper');
        const relationsCTA = fieldContainer.querySelector('.ibexa-relations__cta');
        const addBtn = fieldContainer.querySelector(SELECTOR_BTN_ADD);
        const trashBtn = fieldContainer.querySelector('.ibexa-relations__table-action--remove');
        const isSingle = fieldContainer.classList.contains(CLASS_FIELD_SINGLE);
        const selectedItemsLimit = isSingle ? 1 : parseInt(relationsContainer.dataset.limit, 10);
        const relationsTable = relationsWrapper.querySelector('.ibexa-table');
        const startingLocationId =
            relationsContainer.dataset.defaultLocation !== '0' ? parseInt(relationsContainer.dataset.defaultLocation, 10) : null;
        const closeUDW = () => ReactDOM.unmountComponentAtNode(udwContainer);
        const renderRows = (items) => {
            items.forEach((item, index) => {
                relationsContainer.insertAdjacentHTML('beforeend', renderRow(item, index));

                const { escapeHTML } = ibexa.helpers.text;
                const itemNodes = relationsContainer.querySelectorAll('.ibexa-relations__item');
                const itemNode = itemNodes[itemNodes.length - 1];

                itemNode.setAttribute('data-content-id', escapeHTML(item.ContentInfo.Content._id));
                itemNode.querySelector('.ibexa-relations__table-action--remove-item').addEventListener('click', removeItem, false);
            });

            ibexa.helpers.tooltips.parse();
        };
        const updateInputValue = (items) => {
            sourceInput.value = items.join();
            sourceInput.dispatchEvent(new CustomEvent(EVENT_CUSTOM));
        };
        const onConfirm = (items) => {
            items = excludeDuplicatedItems(items);

            renderRows(items);
            attachRowsEventHandlers();

            selectedItems = [...selectedItems, ...items.map((item) => item.ContentInfo.Content._id)];

            updateInputValue(selectedItems);
            closeUDW();
            updateFieldState();
            updateAddBtnState();
        };
        const openUDW = (event) => {
            event.preventDefault();

            const config = JSON.parse(event.currentTarget.dataset.udwConfig);
            const limit = parseInt(event.currentTarget.dataset.limit, 10);
            const title =
                limit === 1
                    ? Translator.trans(
                          /*@Desc("Select a Content item")*/ 'ezobjectrelationlist.title.single',
                          {},
                          'universal_discovery_widget',
                      )
                    : Translator.trans(
                          /*@Desc("Select Content item(s)")*/ 'ezobjectrelationlist.title.multi',
                          {},
                          'universal_discovery_widget',
                      );

            ReactDOM.render(
                React.createElement(ibexa.modules.UniversalDiscovery, {
                    onConfirm,
                    onCancel: closeUDW,
                    title,
                    startingLocationId,
                    ...config,
                    multiple: isSingle ? false : selectedItemsLimit !== 1,
                    multipleItemsLimit: selectedItemsLimit > 1 ? selectedItemsLimit - selectedItems.length : selectedItemsLimit,
                }),
                udwContainer,
            );
        };
        const excludeDuplicatedItems = (items) => {
            selectedItemsMap = items.reduce((total, item) => ({ ...total, [item.ContentInfo.Content._id]: item }), selectedItemsMap);

            return items.filter((item) => selectedItemsMap[item.ContentInfo.Content._id]);
        };
        const renderRow = (item, index) => {
            const { escapeHTML } = ibexa.helpers.text;
            const { formatShortDateTime } = ibexa.helpers.timezone;
            const contentTypeName = ibexa.helpers.contentType.getContentTypeName(item.ContentInfo.Content.ContentTypeInfo.identifier);
            const contentName = escapeHTML(item.ContentInfo.Content.TranslatedName);
            const { rowTemplate } = relationsWrapper.dataset;

            return rowTemplate
                .replace('{{ content_name }}', contentName)
                .replace('{{ content_type_name }}', contentTypeName)
                .replace('{{ published_date }}', formatShortDateTime(item.ContentInfo.Content.publishedDate))
                .replace('{{ order }}', selectedItems.length + index + 1);
        };
        const updateFieldState = () => {
            const tableHideMethod = selectedItems.length ? 'removeAttribute' : 'setAttribute';
            const ctaHideMethod = selectedItems.length ? 'setAttribute' : 'removeAttribute';

            relationsTable[tableHideMethod]('hidden', true);

            if (trashBtn) {
                trashBtn[tableHideMethod]('hidden', true);
            }

            if (addBtn) {
                addBtn[tableHideMethod]('hidden', true);
            }

            relationsCTA[ctaHideMethod]('hidden', true);
        };
        const updateAddBtnState = () => {
            if (!addBtn) {
                return;
            }

            const methodName = !selectedItemsLimit || selectedItems.length < selectedItemsLimit ? 'removeAttribute' : 'setAttribute';

            addBtn[methodName]('disabled', true);
        };
        const updateTrashBtnState = (event) => {
            if (
                !trashBtn ||
                ((!event.target.hasAttribute('type') || event.target.type !== 'checkbox') && event.currentTarget !== trashBtn)
            ) {
                return;
            }

            const anySelected = findCheckboxes().some((item) => item.checked === true);
            const methodName = anySelected ? 'removeAttribute' : 'setAttribute';

            trashBtn[methodName]('disabled', true);
        };
        const removeItems = (event) => {
            event.preventDefault();

            const removedItems = [];

            relationsContainer.querySelectorAll('input:checked').forEach((input) => {
                removedItems.push(parseInt(input.value, 10));

                input.closest('tr').remove();
            });

            selectedItems = selectedItems.filter((item) => !removedItems.includes(item));

            updateInputValue(selectedItems);
            updateFieldState();
            updateAddBtnState();
        };
        const removeItem = (event) => {
            const row = event.target.closest('.ibexa-relations__item');
            const contentId = parseInt(row.dataset.contentId, 10);

            row.remove();

            selectedItems = selectedItems.filter((item) => contentId !== item);

            updateInputValue(selectedItems);
            updateFieldState();
            updateAddBtnState();
        };
        const findOrderInputs = () => {
            return [...relationsContainer.querySelectorAll('.ibexa-relations__order-input')];
        };
        const findCheckboxes = () => {
            return [...relationsContainer.querySelectorAll('[type="checkbox"]')];
        };
        const attachRowsEventHandlers = () => {
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

            findOrderInputs().forEach((item) => {
                item.addEventListener('blur', updateSelectedItemsOrder, false);

                if (isFirefox) {
                    item.addEventListener('change', focusOnElement, false);
                }
            });
        };
        const focusOnElement = (event) => {
            if (doc.activeElement !== event.target) {
                event.target.focus();
            }
        };
        const emptyRelationsContainer = () => {
            while (relationsContainer.lastChild) {
                relationsContainer.removeChild(relationsContainer.lastChild);
            }
        };
        const updateSelectedItemsOrder = (event) => {
            event.preventDefault();

            const inputs = findOrderInputs().reduce((total, input) => {
                return [
                    ...total,
                    {
                        order: parseInt(input.value, 10),
                        row: input.closest(SELECTOR_ROW),
                    },
                ];
            }, []);

            inputs.sort((a, b) => a.order - b.order);

            const fragment = inputs.reduce((frag, item) => {
                frag.appendChild(item.row);

                return frag;
            }, doc.createDocumentFragment());

            emptyRelationsContainer();
            relationsContainer.appendChild(fragment);
            attachRowsEventHandlers();

            selectedItems = inputs.map((item) => parseInt(item.row.dataset.contentId, 10));
            updateInputValue(selectedItems);
        };
        let selectedItems = [...fieldContainer.querySelectorAll(SELECTOR_ROW)].map((row) => parseInt(row.dataset.contentId, 10));
        let selectedItemsMap = selectedItems.reduce((total, item) => ({ ...total, [item]: item }), {});

        /** LINK TYPES */
        const typeOptionsWrapper = fieldContainer.querySelector('.link-type-options');
        const allowedLinkType = fieldContainer.querySelector('.link-type-options').dataset.allowedLinkType;
        const linkTypeOptionsInputs = typeOptionsWrapper.querySelectorAll('.form-check input[type="radio"]');

        const otherValue = {
            internal: 'external',
            external: 'internal'
        };
        if (allowedLinkType === 'all') {
            typeOptionsWrapper.classList.remove('hidden');

            const handleLinkTypeChange = (option, container) => {
                if (!option.checked) {
                    return;
                }
    
                container.querySelector(`.${option.value}-link-form`).classList.remove('hidden');
                container.querySelector(`.${otherValue[option.value]}-link-form`).classList.add('hidden');
            };

            linkTypeOptionsInputs.forEach(linkTypeOption => {
                const parent = linkTypeOption.parentElement;
                const type = linkTypeOption.value;
                parent.appendChild(fieldContainer.querySelector(`.${type}-link-form`));

                linkTypeOption.addEventListener('change', handleLinkTypeChange.bind(null, linkTypeOption, typeOptionsWrapper));
            });
            linkTypeOptionsInputs.forEach(option => handleLinkTypeChange(option, typeOptionsWrapper));
        } else {
            fieldContainer.querySelector(`.${allowedLinkType}-link-form`).classList.remove('hidden');
            typeOptionsWrapper.querySelector(`.form-check input[type="radio"][value="${allowedLinkType}"]`).checked = true;
        }
        /** LINK TYPES */
        
        updateAddBtnState();
        attachRowsEventHandlers();

        [...fieldContainer.querySelectorAll(SELECTOR_BTN_ADD), ...fieldContainer.querySelectorAll('.ibexa-relations__cta-btn')].forEach(
            (btn) => btn.addEventListener('click', openUDW, false),
        );

        [...fieldContainer.querySelectorAll('.ibexa-relations__table-action--remove-item')].forEach((btn) =>
            btn.addEventListener('click', removeItem, false),
        );

        if (trashBtn) {
            trashBtn.addEventListener('click', removeItems, false);
            trashBtn.addEventListener('click', updateTrashBtnState, false);
        }

        relationsContainer.addEventListener('change', updateTrashBtnState, false);

        validator.init();

        ibexa.addConfig('fieldTypeValidators', [validator], true);
    });
})(window, window.document, window.ibexa, window.React, window.ReactDOM, window.Translator);
