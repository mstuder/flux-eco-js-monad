export class FluxEcoJsStateMonad {
    /**
     * @property {object}
     */
    #stateValues;

    /**
     * @param {object} stateValues
     */
    constructor(stateValues) {
        this.#stateValues = stateValues;
    }

    /**
     * @typedef {object} FluxEcoJsElementStateValues
     * @property {string} currentStateName
     * @property {string} nextStateName
     * @property {string} finalStateName
     * @property {array} completedTransitions
     * @property {array} uncompletedTransitions
     * @property {Object} data
     *
     * @param {FluxEcoJsElementStateValues} stateValues
     */
    static of(stateValues) {
        return new this(stateValues);
    }

    /**
     * @return {object}
     */
    get stateValues() {
        return this.#stateValues;
    }

    bind(fn) {
        const [newState, newFn] = fn(this.#stateValues);
        if (newFn === null) {
            //final transition of chain
            return FluxEcoJsStateMonad.of(newState);
        }
        if (newFn && typeof newFn !== "function") {
            throw new TypeError("Invalid function provided.");
        }

        return FluxEcoJsStateMonad.of(newState).bind(newFn);
    }


    /**
     * todo think about the static - but in functional thinking it could/should be ok.
     * it should work non static by returning the FluxEcoJsStateMonad with the new state.
     *
     * bind(fn, stateName) ?
     */

    /**
     * @param {FluxEcoHtmlElementStateValues} stateValues
     * @param {string} currentStateName
     * @return {FluxEcoHtmlElementStateValues}
     */
    static markCurrentStateAsCompleted(stateValues, currentStateName) {
        if (stateValues.currentStateName !== currentStateName) {
            throw new Error("the current transition stateName differs from the initialized transition steps")
        }

        let index = stateValues.uncompletedTransitions.indexOf(currentStateName);
        if (index !== -1) {
            stateValues.uncompletedTransitions.splice(index, 1);
            stateValues.completedTransitions.push(currentStateName)
            stateValues.nextStateName = stateValues.uncompletedTransitions[0];
        }

        return stateValues;
    }

    static putStateNameAsNextInFront(stateValues, stateName) {
        if (stateValues.uncompletedTransitions.includes(stateName) === false) {
            stateValues.uncompletedTransitions.unshift(stateName);
        }
        stateValues.nextStateName = stateName;

        return stateValues;
    }

    /**
     * @param {FluxEcoHtmlElementStateValues} stateValues
     * @param {string} currentStateName
     * @return {FluxEcoHtmlElementStateValues}
     */
    static changeCurrentStateName(stateValues, currentStateName) {
        if (stateValues.nextStateName !== currentStateName && stateValues.currentStateName !== currentStateName) {
            throw new Error("the current transition stateName differs from the initalized transition steps")
        }
        stateValues.currentStateName = currentStateName;

        return stateValues;
    }
}