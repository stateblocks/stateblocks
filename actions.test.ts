import {useActions} from "./actions";
import {Counter, createMockCounterContext} from "./samples/Counter";


test("use actions", () => {
    useActions(Counter.actions).withContext({onReset(arg: number): void {

        }})
})