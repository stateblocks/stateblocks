import {createStore} from "../src/store";
import {provideContext, scopeActions, scopeActionsWithCtxBuilder} from "../src/actions";

test("quickstart", async () => {

    let storage = {}

    const localStorage = {
        setItem(key, value) {
            storage[key] = value;
        },
        getItem(key) {
            return storage[key]
        }
    }

    var counterActions;
    var initialStateTemp;

    {

        /// [actions]

        // For convenient reuse, let's group our actions in a simple object.
        const actions = {
            increment: () => (state) => state + 1,
            decrement: () => (state) => state - 1,
            addValue: (value) => (state) => state + value,
            setValue: (value) => (state) => value,
        }

        const initialState = 0;

        // Actions are just pure function that we can execute atomically :
        let newState = actions.increment()(initialState); // 1
        newState = actions.addValue(42)(newState); // 43

        /// [actions]

        expect(newState).toBe(43)
        counterActions = actions;
        initialStateTemp = initialState;

    }

    const initialState = initialStateTemp;

    {
        let actions = counterActions;

        // State is held in a Store. The store is in charge of applying reducers,
        // keeping a reference to the evolving state and managing side-effects.

        /// [store]
        const store = createStore(initialState);

        // You can be informed of states updates by listening to the store
        store.listener = (state) => {
            console.log(state);
        }

        // State is updated by dispatching reducers to the store.
        // The store simply apply the reducer to the current state and saves the
        // result as the new current state.
        store.update(actions.increment())
        // 1
        store.update(actions.decrement())
        // 0
        store.update(actions.addValue(42))
        // 42

        /// [store]
        expect(store.state).toBe(42);
    }


    {

        // Just like methods in object oriented programming, reducers can call
        // other reducers to avoid code repetition.

        const actions = {
            ...counterActions,
            incrementTwice: () => (state) => {
                state = actions.increment()(state);
                state = actions.increment()(state);
                return state;
            }
        }

    }

    {


/// [effect]

        const actions = {
            ...counterActions,
            printValue: () => (state, executor) => {
                // Invoking the executor with a function to dispatch side effect
                executor(() => console.log(state))
                return state; // always return state from the reducer
            },
        }

        // Let's call the new reducer manually for testing purpose
        var reducerEffect = null;
        actions.printValue()(12, (effect) => {
            // save the effect for execution after the reducer returns
            reducerEffect = effect;
        })
        reducerEffect()
        // prints : 12

        // Use in store
        const store = createStore(0);

        store.update(actions.addValue(42))
        store.update(actions.printValue())
        // prints : 42

/// [effect]
    }

    {
/// [effect-update]
        // Define an effect function.
        const setRandomValueEffect = (state, handler, context) => {
            // create random value
            let randomValue = Math.round(Math.random() * 10);
            // dispatch the setValue reducer with the random value
            handler(actions.setValue(randomValue));
        }

        const actions = {
            ...counterActions,
            setRandomValue: () => (state, executor) => {
                executor(setRandomValueEffect)
                return state;
            }
        }

        const store = createStore(0);

        store.update(actions.setRandomValue())
        // ...some random value in the state

/// [effect-update]
        counterActions = actions;

    }

    {
        // Let's define a simple data persistence API to store counter value.
        class DataStorage {
            savedValue = null;
            saveValue = (value) => this.savedValue = value;
            loadValue = () => this.savedValue;
        }

        const dataStorage = new DataStorage();

/// [effect-context]

        // Create a context object with two functions.
        // We could put the whole dataStore instance here, but let's keep only what is required
        const context = {
            save: dataStorage.saveValue,
            load: dataStorage.loadValue,
            // context can hold anything else required by effects...
        };


        // Define new actions to save and load value
        const actions = {
            ...counterActions,

            saveAndReset: () => (state, executor) => {
                // Dispatch effect to save value using context
                executor((_, handler, ctx) => {
                    return ctx.save(state);
                })
                return 0;
            },

            loadValue: () => (state, executor) => {
                // Dispatch effect to read value from context
                executor((state, handler, context) => {
                    let value = context.load(); // retrieve value
                    handler(actions.setValue(value)); // dispatch update
                })
                return state;
            }
        }

        // Before using actions, we need to provide the required context used by our
        // effects. We will use the function provideContext.
        const actionsWithContext = provideContext(context, actions)

        const store = createStore(0);

        store.update(actionsWithContext.setValue(42))
        // 42
        store.update(actionsWithContext.saveAndReset())
        // 0
        store.update(actionsWithContext.loadValue())
        //42

/// [effect-context]

        counterActions = actions;
    }

    {
/// [scope-actions]

        const topActions = scopeActions("top")(counterActions);

        // topActions can now be used to update a state shaped like {top: number}.
        // Other parts of the state won't be modified
        topActions.increment()({top: 0, other: "value"})
        // {top: 1, other: "value"}

        // scope argument can be omitted to create a variable-scope actions map
        const actions = scopeActions()(counterActions);
        actions("bottom").setValue(42)({top: 1, bottom: 0})
        // {top: 1, bottom: 42}

/// [scope-actions]
    }

    {
/// [double-counters]

        const doubleActions = {
            top: scopeActions("top")(counterActions),
            bottom: scopeActions("bottom")(counterActions),
        }

        // Compose the initial state according to the state shape
        const store = createStore({top: initialState, bottom: initialState})

        store.update(doubleActions.top.increment())
        store.update(doubleActions.bottom.setValue(42))
        // {top: 1, bottom: 42}

        // Side effects dispatching updates work with composition
        store.update(doubleActions.top.setRandomValue())
        // {top: <random value>, bottom: 42}

/// [double-counters]

    }
    {

        /// [array-counters]


        const arrayActions = {
            counter: scopeActions()(counterActions), // creates a variable-scoped action map
            addCounter: () => (state) => [...state, initialState],
            removeCounter: (index) => (state) => [...state].splice(index, 1)
        }

        // The action map now works on a number array
        arrayActions.counter(1).setValue(12)([initialState, initialState, initialState])
        // [0, 12, 0]

        const store = createStore([]);

        store.update(arrayActions.addCounter())
        // [0]
        store.update(arrayActions.counter(0).increment())
        // [1]
        store.update(arrayActions.addCounter())
        // [1, 0]
        store.update(arrayActions.counter(1).addValue(3))
        // [1, 3]

        /// [array-counters]

    }

    //TODO : free substate composition with stateMapper and stateUpdater


    /// [context-builder]


    // Define a function to provide a counter context depending on current scope.
    // Returned context can rely on a parent context that we will provide later
    const makeCounterCtx = (scope, state, handler, parentCtx) => ({
        save: (value) => {
            parentCtx.saveValue(scope, value);
        },
        load: () => parentCtx.loadValue(scope),
    })

    // Wraps effects of counterActions and use makeCounterCtx to provide them with a context depending on the scope
    const counterScoped = scopeActions()(counterActions, makeCounterCtx)

    const doubleActions = {
        top: counterScoped("top"),
        bottom: counterScoped("bottom")
    }

    // the sub-actions 'saveAndReset' and 'loadValue' will now dispatch effects that require
    // the parentCtx value we used in makeCounterCtx
    const actionsWithContext = provideContext({
        saveValue: (scope, value) => {
            localStorage.setItem(scope, value);
        },
        loadValue: (scope) => Number(localStorage.getItem(scope)),
    }, doubleActions)


    // Compose the initial state according to the state shape
    const store = createStore({top: initialState, bottom: initialState})

    store.update(actionsWithContext.top.increment())
    // {top:1, bottom: 0}

    store.update(actionsWithContext.top.saveAndReset())
    // {top:0, bottom: 0}

    localStorage.getItem("top");
    // 1

    /// [context-builder]
    expect(localStorage.getItem("top")).toBe(1);

})

test("actions in context", () => {


    // scopeState(actions, (key) => (state, handler, ctx) => {
    //
    // })


})
