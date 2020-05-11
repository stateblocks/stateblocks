import {actionsOf, useActions} from "./actions";
import {Counter, createMockCounterContext} from "./samples/Counter";


test("use actions", () => {
    useActions(Counter.actions).withContext({onReset(arg: number): void {

        }})
})

test("check actions shape", () => {
    actionsOf<number, {a:() => void}>()({
        increment:() => (state, exe) => {
            return state + 1
        }
    })

})