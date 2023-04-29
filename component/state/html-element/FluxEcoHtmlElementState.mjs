import {FluxEcoJsStateMonad} from "../FluxEcoJsStateMonad.mjs";

//todo setData at the end of each transition method
export class FluxEcoHtmlElementState {
    /**
     * @typedef {FluxEcoJsElementStateValues} FluxEcoHtmlElementStateValues
     * @property {HTMLElement|null} data.element
     * @property {array|null} data.childElementsName
     */


    stateNames = {
        init: "init",
        failed: "failed",
        create: "create",
        createElement: "createElement",
        changeName: "changeName",
        changeAttributes: "changeAttributes",
        changeChildElementsName: "changeChildElementsName",
        changeChildElementsChain: "changeChildElementsChain",
        removeObsoleteChildElements: "removeObsoleteChildElements",
        updateChildElements: "appendChildElements",
        created: "created"
    }

    /**
     * @private
     */
    constructor() {

    }

    /**
     * @return {FluxEcoHtmlElementState}
     */
    static emptyState() {
        return new this()
    }

    /**
     * @param {FluxEcoHtmlElementSpecData} specStateData
     * @param {array} transitionFlow
     * @return {FluxEcoHtmlElementStateValues}
     */
    createBySpecMorphism(specStateData, transitionFlow = [
        this.stateNames.createElement,
        this.stateNames.changeName,
        this.stateNames.changeAttributes,
        this.stateNames.changeChildElementsName,
        this.stateNames.removeObsoleteChildElements,
        this.stateNames.updateChildElements,
        this.stateNames.created
    ]) {
        const {tag, name, attributeValues, childElementsName} = specStateData;
        return this.create({tag, name, attributeValues, childElementsName}, transitionFlow)
    }

    /**
     * @param params
     * @param {string} params.tag
     * @param {string} params.name
     * @param {object} params.attributeValues
     * @param {array} params.childElementsName
     * @param transitionFlow
     * @return {FluxEcoHtmlElementStateValues}
     */
    create({params},  transitionFlow = [
        this.stateNames.createElement,
        this.stateNames.changeName,
        this.stateNames.changeAttributes,
        this.stateNames.changeChildElementsName,
        this.stateNames.removeObsoleteChildElements,
        this.stateNames.updateChildElements,
        this.stateNames.created
    ]) {
        /**
         * @type FluxEcoHtmlElementStateValues
         */
        const stateValues = {
            currentStateName:  this.stateNames.init,
            nextStateName: transitionFlow[0],
            finalStateName: transitionFlow[transitionFlow.length - 1],
            data: null,
            completedTransitions: [],
            uncompletedTransitions: transitionFlow,
        }

        const processedStateValues = this.#createStateMonad(stateValues)
            .bind((stateValues) => this.createElement(stateValues, params.tag))
            .bind((stateValues) => this.changeName(stateValues, params.name))
            .bind((stateValues) => this.changeAttributes(stateValues, params.attributeValues))
            .bind((stateValues) => this.changeChildElementsName(stateValues, params.childElementsName)).stateValues

        const {created} =  this.stateNames;
        return FluxEcoJsStateMonad.markCurrentStateAsCompleted(processedStateValues, created);
    }

    #createStateMonad(stateValues) {
        return FluxEcoJsStateMonad.of(stateValues);
    }


    createElement(stateValues, tag) {
        const {createElement} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, createElement);

        stateValues.data.element = document.createElement(tag);

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, createElement), null]
    }


    changeName(stateValues, name) {
        const {changeName} = this.stateNames
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, changeName)

        stateValues.data.name = name;

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, changeName), null]
    }

    /**
     * @param {FluxEcoHtmlElementStateValues} stateValues
     * @param {Object<string>} attributeValues
     * @return {array}
     */
    changeAttributes(stateValues, attributeValues) {
        const {changeAttributes} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, changeAttributes)

        if (attributeValues.entries.length > 0) {
            Object.entries(attributeValues).forEach(([attributeName, attributeValue]) => {
                stateValues.data.setAttribute(attributeName, attributeValue);
            })
        }

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, changeAttributes), null]
    }

    changeChildElementsName(stateValues, childElementsName) {
        const {changeChildElementsName, changeChildElementsChain} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, changeChildElementsName)

        stateValues.data.childElementsName = childElementsName;

        stateValues = this.#markCurrentStateAsCompleted(stateValues, changeChildElementsName);
        return [FluxEcoJsStateMonad.putStateNameAsNextInFront(stateValues, changeChildElementsChain), null];
    }

    /**
     * @typedef {function(stateValues, childElementsName, htmlElements)} htmlElementStateChangeChildElementsChain
     *
     * @param {FluxEcoHtmlElementStateValues} stateValues
     * @param {Object <string,HTMLElement>|null} htmlElements
     * @return {array}
     */
    changeChildElementsChain(stateValues, htmlElements) {
        return [
            stateValues,
            (stateValues) => {
                FluxEcoJsStateMonad.createStateMonad(stateValues)
                    .bind((stateValues) => this.removeObsoleteChildElements(stateValues))
                    .bind((stateValues) => this.updateChildElements(stateValues, htmlElements))
            }
        ];
    }

    /**
     * @param {FluxEcoHtmlElementStateValues} stateValues
     * @return {array}
     */
    removeObsoleteChildElements(stateValues) {
        const {removeObsoleteChildElements} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, removeObsoleteChildElements)

        const {childElementsName} = stateValues.data.childElementsName;

        if (childElementsName.length > 0) {
            if (stateValues.data.element.childElementCount > 0) {
                Array.from(stateValues.data.element.children).forEach(([index, child]) => {
                    if (!childElementsName.includes(child.nodeName)) {
                        stateValues.data.element.removeChild(child);
                    }
                });
            }
        }

        return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, removeObsoleteChildElements), null];
    }

    /**
     * @param {FluxEcoHtmlElementStateValues} stateValues
     * @param {{string, HTMLElement}} htmlElements
     * @return {array}
     */
    updateChildElements(stateValues, htmlElements) {
        const {updateChildElements, failed} = this.stateNames;
        stateValues = FluxEcoJsStateMonad.changeCurrentStateName(stateValues, updateChildElements)

        const {childElementsName} = stateValues.data.childElementsName;

        if (childElementsName.length > 0) {
            Object.entries(childElementsName).forEach(elementName => {

                if (stateValues.data.element.children.namedItem(elementName) !== null) {
                    delete stateValues.data.element.removeChild(
                        stateValues.data.element.children.namedItem(elementName)
                    );
                }

                if (htmlElements.hasOwnProperty(elementName)) {
                    const childHtmlElement = htmlElements[elementName];
                    stateValues.data.element.appendChild(childHtmlElement)
                } else {
                    stateValues.currentStateName = failed;
                    //todo => transition with infos to the failure
                    return [stateValues, null]
                }
            });
            return [FluxEcoJsStateMonad.markCurrentStateAsCompleted(stateValues, updateChildElements), null]
        }
    }
}