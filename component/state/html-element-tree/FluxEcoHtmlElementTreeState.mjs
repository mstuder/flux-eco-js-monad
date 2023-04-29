import {FluxEcoJsStateMonad} from "../FluxEcoJsStateMonad.mjs";

export class FluxEcoHtmlElementTreeState {
    /**
     * @typedef {FluxEcoJsElementStateValues} FluxEcoHtmlElementTreeStateValues
     * @property {array} data.rootChildElementNames
     * @property {HTMLElement|null} data.rootElement
     * @property {Object <string, HTMLElement>|null} data.elements
     */


    stateNames = {
        init: "init",
        createByElementSpecListMorphism: "createByElementSpecListMorphism",
        create: "create",
        createRootElement: "createRootElement",
        changeRootChildElementsChain: "changeRootChildElementsChain",
        removeObsoleteRootChildElements: "removeObsoleteRootChildElements",
        updateRootChildElements: "updateRootChildElements",
        failed: "failed",
        created: "created"
    }

    /**
     * @private
     */
    constructor() {

    }

    /**
     * @return {FluxEcoHtmlElementTreeState}
     */
    static emptyState() {
        return new this()
    }

    #createStateMonad(stateValues) {
        return FluxEcoJsStateMonad.of(stateValues);
    }

    //@param {FluxEcoHtmlElementSpecData} specStateData

    /**
     * @param {Object <string, FluxEcoHtmlElementSpecData>} specStateDataList
     * @param {array} rootChildElementNames
     * @param {function(specStateValues: FluxEcoHtmlElementSpecStateValues)} htmlElementCreateBySpecMorphism
     * @param {function} htmlElementChangeChildElementsChain
     * @param {array} transitionFlow
     * @return {FluxEcoHtmlElementStateValues}
     */
    createByElementsSpecStateMorphism(
        specStateDataList,
        rootChildElementNames,
        htmlElementCreateBySpecMorphism,
        htmlElementChangeChildElementsChain,
        transitionFlow = [
            this.stateNames.createRootElement,
            this.stateNames.changeRootChildElementsChain,
            this.stateNames.created,
        ]
    ) {
        const htmlElementStateValuesListToFinalize = [];
        Object.entries(specStateDataList).forEach(([elementName, specStateData]) => {
            htmlElementStateValuesListToFinalize.push(
                htmlElementCreateBySpecMorphism(specStateData)
            )
        });

        const finalizeHtmlElements = (htmlElementStateValuesListToFinalize) => {
            const finalizedElements = {};
            let hasUnfullfieldDependencies = false;

            Object.entries(htmlElementStateValuesListToFinalize).forEach(([elementName, htmlElementStateValues]) => {

                const requiredChildElementNames = htmlElementStateValues.data.childElementsName;


                if (requiredChildElementNames === null) {
                    finalizedElements[elementName] = this.#createStateMonad(htmlElementStateValues)
                        .bind((stateValues) => htmlElementChangeChildElementsChain(stateValues, null))
                        .stateValues.data.element
                    delete htmlElementStateValuesListToFinalize[elementName];
                } else {
                    hasUnfullfieldDependencies = false;
                    requiredChildElementNames.forEach((elementName) => {
                        if (finalizedElements.hasOwnProperty(elementName) === false) {
                            hasUnfullfieldDependencies = true;
                        }
                    });
                    if (hasUnfullfieldDependencies === false) {
                        finalizedElements[elementName] = this.#createStateMonad(htmlElementStateValues)
                            .bind((stateValues) => htmlElementChangeChildElementsChain(stateValues, finalizedElements))
                            .stateValues.data.element
                        delete htmlElementStateValuesListToFinalize[elementName];
                    }
                }

            })

            if (Object.keys(htmlElementStateValuesListToFinalize).length === 0) {
                return finalizedElements;
            }
            finalizeHtmlElements(htmlElementStateValuesListToFinalize)
        };
    }

    /**
     * @param params
     * @param params.rootChildElementNames
     * @param params.htmlElements
     * @param {array} transitionFlow
     */
    create({rootChildElementNames, htmlElements}, transitionFlow = [
        this.stateNames.createRootElement,
        this.stateNames.changeRootChildElementsChain,
        this.stateNames.created,
    ]) {
        const stateValues = {
            currentStateName: this.stateNames.init,
            nextStateName: transitionFlow[0],
            finalStateName: transitionFlow[transitionFlow.length - 1],
            data: null,
            completedTransitions: [],
            uncompletedTransitions: transitionFlow,
        }


        const processedStateValues = this.#createStateMonad(stateValues)
            .bind((stateValues) => this.createRootElement(stateValues))
            .bind((stateValues) => this.changeRootChildElementsChain(stateValues, rootChildElementNames, htmlElements)).stateValues

        const {created} = this.stateNames;
        return FluxEcoJsStateMonad.markCurrentStateAsCompleted(processedStateValues, created);
    }

    /**
     * @param {FluxEcoHtmlElementTreeStateValues} stateValues
     */
    createRootElement(stateValues) {
        const {createRootElement} = this.stateNames
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, createRootElement);

        stateValues.data.rootElement = document.createElement("div");

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, createRootElement), null]
    }


    /**
     * @param {FluxEcoHtmlElementTreeStateValues} stateValues
     * @param {array} rootChildElementNames
     * @param {Object <string, HTMLElement>} htmlElements
     * @return {array}
     */
    changeRootChildElementsChain(stateValues, rootChildElementNames, htmlElements) {
        return [
            stateValues,
            (stateValues) => {
                this.#createStateMonad(stateValues)
                    .bind((stateValues) => this.removeObsoleteRootChildElements(stateValues, rootChildElementNames))
                    .bind((stateValues) => this.updateRootChildElements(stateValues, rootChildElementNames, htmlElements))
            }
        ];
    }

    /**
     * @param {FluxEcoHtmlElementTreeStateValues} stateValues
     * @param {array} rootChildElementNames
     * @return {array}
     */
    removeObsoleteRootChildElements(stateValues, rootChildElementNames) {
        const {removeObsoleteRootChildElements} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, removeObsoleteRootChildElements);

        if (stateValues.data.rootElement.childElementCount > 0) {
            Array.from(stateValues.data.rootElement.children).forEach(([index, child]) => {
                if (!rootChildElementNames.includes(child.nodeName)) {
                    stateValues.data.rootElement.removeChild(child);
                }
            });
        }

        stateValues.data.rootChildElementNames = rootChildElementNames;

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, removeObsoleteRootChildElements), null];
    }

    /**
     * @param {FluxEcoHtmlElementTreeStateValues} stateValues
     * @param {array} rootChildElementNames
     * @param {Object <string, HTMLElement>} htmlElements
     * @return {array}
     */
    updateRootChildElements(stateValues, rootChildElementNames, htmlElements) {
        const {updateRootChildElements, failed} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, updateRootChildElements);

        Array.from(rootChildElementNames).forEach((childElementName) => {
            if (stateValues.data.rootElement.children.namedItem(childElementName)) {
                //todo discuss this
                const childElement = stateValues.data.rootElement.children.namedItem(childElementName);
                childElement.innerHTML = htmlElements[childElementName].innerHTML;
            }
            stateValues.data.rootElement.appendChild(htmlElements[childElementName]);
        })

        stateValues.data.rootChildElementNames = rootChildElementNames;
        stateValues.data.elements = htmlElements;

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, updateRootChildElements), null];
    }
}