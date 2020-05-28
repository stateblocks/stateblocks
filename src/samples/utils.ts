export async function sleep(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout)
    })
}

/**
 * Sample statefull object simulating real world APIs
 */
export class SampleStorage {

    data: { [path: string]: string } = {}

    async put(path: string, data: string): Promise<void> {
        await sleep(100);
        this.data[path] = data;
    }
}
