import {createTwoCounters} from "./DoubleCounter";
import {Store, StoreWithActions} from "../store";
import {handleActionMap} from "../handlers";


type CounterComponent = {
    increment: () => void,
    decrement: () => void,
    setValue: (value: number) => void,
}


test("use in component", async () => {

    let {initialState, actions} = createTwoCounters();

    let store = new Store(initialState);

    let actionsHandler = handleActionMap(store.update, actions);

    /**
     * This object simulates some kind of view component that needs handlers as properties
     */
    let topCompo: CounterComponent = {
        decrement: actionsHandler.top.decrement,
        increment: actionsHandler.top.increment,
        setValue: actionsHandler.top.setValue,
    };

    await topCompo.setValue(42);
    expect(store.state).toEqual({top:42, bottom:0})

});


