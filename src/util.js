const SYMBOL_NAMES = [
    'hive',
    'commune',
    'kill',
    'stop',
    'remember',
];

export const normalizePhase = phase => {
    if (phase === 0) { return 0; }

    const modPhase = phase % 4;
    if (modPhase === 0) { return 4; }

    return modPhase;
};

export const shouldReadHappen = phase => {
    if (phase === 0) { return false; }

    return phase % 3 === 0;
};

export const getReadFromPhase = phase => {
    return normalizePhase(phase / 3);
};

export const getReadTotalFromPhase = (phase, normalized) => {
    const ret = Math.floor(phase / 3) + 1; // cause zero index
    if (normalized) {
        return normalizePhase(ret);
    }
    return ret;
};

export const getWheelNextPosition = (position, rotation, amount) => {
    const modder = rotation === "cw" ? 1 : -1;
    let newPos = (position + modder * amount) % 7;

    if (newPos < 0) {
        newPos += 7;
    }

    return newPos;
};

export const getSymbolImage = name => {
    return `url(/symbols/${name}.png)`;
};

export const grabRandomSymbol = () => {
    // TODO: make sure kill cannot appear more than once per wheel
    const noKill = [...SYMBOL_NAMES].filter(x => x !== "kill");
    return noKill[Math.floor(Math.random() * noKill.length)];
};

const shuffle = array => {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
};

export const generateNewSymbols = wheelNumber => {
    const blankWheel = wheelNumber === 2 || wheelNumber === 4;

    if (!blankWheel) {
        const ret = ["remember", ...shuffle([...SYMBOL_NAMES]).filter(x => x !== "remember")];

        for (let i = 0; i < 7 - ret.length + 1; i++) {
            let tempSymbol = "blank";
            while (true) {
                const checkSymbol = tempSymbol;
                if (checkSymbol !== "blank" && ret.filter(x => x === checkSymbol).length < 3) {
                    break;
                }
                tempSymbol = grabRandomSymbol();
            }
            ret.push(tempSymbol);
        }

        return ret;
    }

    return ["blank", ...shuffle([...SYMBOL_NAMES]), grabRandomSymbol()];
};
