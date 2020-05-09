import {Store} from "../store";
import {DoubleApp} from "./DoubleMultipleCounters";

test("double", () => {
    var store = new Store(DoubleApp.initialState);

    store.update(DoubleApp.actions.init());
    // @ts-ignore
    store.update(DoubleApp.actions.left.top().increment())
});