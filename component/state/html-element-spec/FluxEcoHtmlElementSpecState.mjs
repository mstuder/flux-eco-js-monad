export class FluxEcoHtmlElementSpecState {


    /**
     * @typedef {object} FluxEcoHtmlElementSpecStateValues
     * @property {string} currentStateName
     * @property {string} finalStateName
     * @property {object} data
     * @property {string} data.name
     * @property {string} data.tag
     * @property {object} data.styleValues
     * @property {object} data.attributeValues
     * @property {array<string>} data.childElementsName
     *
     * @param {FluxEcoHtmlElementSpecStateValues}
     */
    #stateValues;

    /**
     * @param {FluxEcoHtmlElementSpecStateValues} stateValues
     */
    constructor(
        stateValues
    ) {
        this.#stateValues = stateValues;
    }

    /**
     * @param name
     * @param tag
     * @param styleValues
     * @param attributeValues
     * @param {array<string>} childElementsName
     * @return {FluxEcoHtmlElementSpecState}
     */
    static fromData(
        {
            name,
            tag,
            styleValues,
            attributeValues,
            childElementsName
        }
    ) {
        return new this(
            {
                currentStateName: FluxEcoHtmlElementSpecState.stateNames.created,
                finalStateName: FluxEcoHtmlElementSpecState.stateNames.created,
                data: {
                    name,
                    tag,
                    styleValues,
                    attributeValues,
                    childElementsName
                }
            }
        )
    }


    /**
     * @return {FluxEcoHtmlElementSpecStateValues}
     */
    get stateValues() {
        return this.#stateValues;
    }
}