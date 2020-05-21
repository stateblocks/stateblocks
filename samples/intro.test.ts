import {Effect, Executor, Reducer, ReducerSimple} from "../core";

/**
 * This state can be read as a tutorial.
 */
test('intro', () => {

    let initialState = 0

    /**
     * State is updated with reducers. A reducer is a function taking previous state as parameter and returning a new state.
     * Reducers should be pure functions without side effects. Side effects management is explained later.
     */
    const increment = (state: number) => state + 1

    let newState = increment(initialState)

    expect(newState).toBe(1);

    /**
     * Reducers can depend on parameters. To create a parametrized reducer we use a function creating a reducers depending
     * on the parameters. We call this a reducer creator or an Action
     */
    const add = (value: number) => (state: number) => state + value;
    let addedState = add(2)(newState);
    expect(addedState).toBe(3)

    /**
     * Let's create an object in charge of applying reducers and keeping reference to the evolving state.
     */
    class Store<T> {
        state: T

        constructor(initialState: T) {
            this.state = initialState;
        }

        update(reducer: ReducerSimple<T>) {
            this.state = reducer(this.state)
        }
    }

    const store = new Store(0);

    store.update(increment)
    store.update(add(3))

    expect(store.state).toBe(4)

    /**
     * Managing side effects.
     * Let's say we want to save state after a decrement action. We can create a improved reducer to manage this side effect in a
     * functionally pure way.
     *
     * Let's simulate a backend to save state. Real implementation could be the browser localStorage, or a real server backend
     */
    class Backend{
        value:any
        save(value:any){
            this.value = value
        }
        get(){
            return this.value;
        }
    }
    const backend = new Backend();

    /**
     * Let's define an effect. The effect accepts the current state as parameter and can execute any code without restriction.
     * This effects depends on global variable backend. We will see later how to build effects without relying on global
     * variables with Contexts
     */
    const saveEffect = (state: number) => {
        backend.save(state)
    };

    /**
     * ...and a reducer using the effect
     */
    const decrement = (state: number, executor: Executor<number>) => {
        executor(saveEffect)
        return state - 1;
    }

    /**
     * This reducers requires a new parameter : an executor. An executor is just a function accepting another function
     * as parameter : the effect. Note that this reducer is still pure because the effect is not executed inside the
     * reducer.
     * To use this reducer, we need to provide an executor in charge of executing the effects. The executor must be able
     * to provide the effects with current state.
     * For now, let's create a simple executor that keeps track of effect.
     */
    let effects:Effect<number>[] = []
    let decrementedState = decrement(3, (effect) => {
        effects.push(effect)
    })
    /**
     * The reducers updated the state as expected
     */
    expect(decrementedState).toBe(2);

    /**
     * We now have one effect to execute to effectively save current state to local storage
     */
    expect(effects.length).toBe(1)

    /**
     * Let's execute the effect
     */
    effects[0](decrementedState, null, null)

    /**
     * Current state has been saved
     */
    expect(backend.get()).toBe(2)

    /**
     * We can now improve our Store to execute side effects after every reducer submission
     */
    class StoreWithEffect<T> {
        state: T

        constructor(initialState: T) {
            this.state = initialState;
        }

        update(reducer: Reducer<T>) {
            const effects:Effect<T>[] = [];
            this.state = reducer(this.state, (effect) => {
                effects.push(effect)
            })
            for(let effect of effects){
                effect(this.state, null, null)
            }
        }
    }

    const storeWithEffect = new StoreWithEffect(0);

    storeWithEffect.update(increment)
    storeWithEffect.update(add(3))
    storeWithEffect.update(decrement)

    expect(storeWithEffect.state).toBe(3);


})