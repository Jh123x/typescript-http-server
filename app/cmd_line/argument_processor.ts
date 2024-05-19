export const processArgs = (args: string[]): Map<string, string> => {
    const map = new Map();
    for (let i = 0; i < args.length; i++) {
        if (!args[i].startsWith('--') || i + 1 >= args.length) {
            continue
        }

        map.set(args[i].slice(2), args[i + 1])
        ++i
    }
    return map
};