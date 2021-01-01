import {ActionMapToMethodMap, Effect, Reducer} from "./core";
import {handleActionMap} from "./handlers";


const voidContext = {};

/**
 * Holds a state and accepts reducer to update the state.
 * Runs side effects if required by reducers.
 * Informs listener of state changes.
 */
export class Store<S> {

    state: S;

    listener: (state: S) => void;

    /**
     * State updates count. For debug purposes.
     */
    count = 0;

    private inSynchronousEffect = 0;

    /**
     * If true, triggers state change events provoked by synchronous effects.
     * If false, triggers state change only when synchronous effects have finished. State changed provoked by
     * asynchronous effects are still triggered.
     */
    triggerChangesInSynchronousEffects = false;

    logUpdates = false;

    /**
     * If true, the state is considered immutable.
     * If state is considered immutable, the listener is informed of state change only if state object reference changed.
     *
     */
    private readonly immutableState: boolean;

    constructor(state: S, immutableState = true) {
        this.state = state;
        this.immutableState = immutableState;
        this.update = this.update.bind(this)
    }

    async update(action: Reducer<S>): Promise<void> {
        let effects: Effect<S>[] = [];
        let reducerRunning = true;
        let newState = action(this.state, (effect: Effect<S>) => {
            if (!reducerRunning) {
                throw "Reducer execution finished. Can't accept effects";
            }
            effects.push(effect);
        });
        // this.logUpdates && console.log("new state before effects : ", this.count, this.state);
        reducerRunning = false;
        let stateChanged = false;
        if (this.immutableState && this.state !== newState) {
            // if (isEqual(this.state, newState)) {
            //     console.warn("state object changed but objects are equals");
            //     console.log("new state (before effects) : ", this.count, newState);
            //     explainDiff(this.state, newState);
            // }
            this.state = newState;
            stateChanged = true;
        }else{
            stateChanged = true;
        }
        let effectPromises = [];
        if (effects.length) {
            for (let effect of effects) {
                this.inSynchronousEffect++;
                try {
                    let effectPromise = effect(this.state, this.update, voidContext);
                    effectPromises.push(effectPromise);
                } catch (e) {
                    effectPromises.push(Promise.reject(e))
                }
                this.inSynchronousEffect--;
            }
        }

        if (stateChanged && (this.triggerChangesInSynchronousEffects || this.inSynchronousEffect == 0)) {
            this.count++;
            this.logUpdates && console.log("new state : ", this.count, this.state);
            if (this.listener) {
                this.listener(this.state);
            }
        }
        return Promise.all(effectPromises).then(() => {});
    }

    onChange(listener: (state: S) => void) {
        this.listener = listener;
    }
}

/**
 * Redux-like store creator
 * @param initialState
 */
export function createStore<S>(initialState:S):Store<S>{
    return new Store<S>(initialState)
}


export class StoreWithActions<S, A> extends Store<S> {

    public handle: ActionMapToMethodMap<A>;

    constructor(state: S, actions: A) {
        super(state);
        this.handle = handleActionMap(this.update, actions);
    }
}