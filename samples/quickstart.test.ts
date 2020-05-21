import {createStore} from "../store";
import {actionsWithContext, composeActions} from "../actions";
import {ActionMapWithCtx, Executor} from "../core";

test("quickstart", () => {


    const actions = {
        increment: () => (state: number) => state + 1,
        decrement: () => (state: number) => state - 1,
        setValue: (value: number) => (state: number) => value
    }

    const store = createStore(0);

    store.listener = (state) => {
        console.log(state);
    }

    store.update(actions.increment())
    store.update(actions.increment())
    store.update(actions.decrement())
    store.update(actions.setValue(42))

    /**
     * Reducers can define side-effects while remaining pure functions. Effects are executed after reducer execution.
     */
    const actionsWithEffect = {
        ...actions,
        saveAndReset: () => (state:number, executor:Executor<number>) => {
            executor(() => {
                localStorage.setItem("previousValue", String(state))
            })
            return 0;
        }
    }

    store.update(actionsWithEffect.setValue(42))
    // Store executes side effects
    store.update(actionsWithEffect.saveAndReset())

    /**
     * Side effects can trigger updates too
     */
    const actionsWithUpdates = {
        ...actionsWithEffect,
        loadValue: () => (state:number, executor:Executor<number>) => {
            executor((state, handler) => {
                //retrieve value from server...
                let valueFromServer = 10
                handler(actionsWithEffect.setValue(valueFromServer))
            })
            return state;
        }
    }
    store.update(actionsWithUpdates.loadValue())

    /**
     * Side effects can depend on context data
     */
    const actionsWithContextData = {
        ...actionsWithUpdates,
        generateRandomValue:() => (state:number, executor:Executor<number, { generator: () => number }>) => {
            executor((state, handler, ctx) => {
                handler(actionsWithContextData.setValue(ctx.generator()))
            })
            return state;
        }
    }

    /**
     * Let's provide context data to the actions map
     */
    const actionsWithContextDataAvailable = actionsWithContext({generator:() => Math.round(Math.random()*10)}, actionsWithContextData)
    store.update(actionsWithContextDataAvailable.generateRandomValue())
    store.update((state, executor) => {
        executor((state, handler, ctx) => {

        })
        return state;
    })



    /**
     * Actions can be composed easily
     */
    const doubleActions = composeActions({
        top: actionsWithContextDataAvailable,
        bottom: actionsWithContextDataAvailable,
    })

    const doubleStore = createStore({top: 0, bottom: 0})

    doubleStore.update(doubleActions.top.increment())
    doubleStore.update(doubleActions.bottom.setValue(42))

    /**
     * Actions using side effects are also composed easily
     */
    doubleStore.update(doubleActions.top.generateRandomValue())

    expect(doubleStore.state).toEqual({top: 1, bottom: 42})

})