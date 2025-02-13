const SYMBOL_NAMES = [
    'hive',
    'commune',
    'kill',
    'stop',
    'remember',
];

export const isSymbol = text => {
    const isSymbol = SYMBOL_NAMES.includes(text) || text === "blank";
    return isSymbol ? text : false;
};

export const WHEEL_TO_SCREEN = {
    0: 99,
    3: 4, // if screen update, if phase 3, update screen 4
    2: 3,
    1: 2,
    4: 1
};

const phaseToWheelRotation = { // phase: wheel map
    1: 1, // on phase 1, wheel 1 rotates, etc
    2: 2,
    3: 3,
    4: 4
};

export const ROUNDS = {
  PREP: "lockset progression",
  STALL: "lockset engagement",
  DPS: "damage"
};

export const normalizePhase = phase => {
    const arr = [0, 1, 2, 3, 4]; // 0%, 25%, 50%, 75%, 100%
    return arr[phase % arr.length];
};

// screens get updated every 3 bars
export const shouldScreenUpdateHappen = phase => {
    let count = 0;

    // Track how many valid (non-zero) normalized phases have occurred
    for (let i = 0; i <= phase; i++) {
        if (normalizePhase(i) !== 0) {
            count++;

            // Only check for event triggering when counting a non-zero phase
            if (count % 3 === 0 && i === phase) {
                return true;
            }
        }
    }

    return false;
};

export const getWheelToRotate = phase => {
    return phaseToWheelRotation[normalizePhase(phase)];
};

// a copy is a "copy" form wheel to screen
export const getWheelToCopy = phase => {
    const norm = normalizePhase(phase);
    return WHEEL_TO_SCREEN[norm];
};

export const getScreenToLight = phase => {
    const norm = Math.floor(phase / 3);
    const wheels = [3, 2, 1, 4];
    const checker = wheels[norm % wheels.length];
    if (checker === wheels.length) { return 1; }
    return checker;
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
    return `url(symbols/${name}.png)`;
};

export const grabRandomSymbol = symbols => {
    if (symbols) {
        while (true) {
            const symbol = grabRandomSymbol();
            if (symbols.filter(x => x === symbol).length < 3) {
                return symbol;
            }
        }
    }
    const noKill = [...SYMBOL_NAMES].filter(x => x !== "kill");
    return noKill[Math.floor(Math.random() * noKill.length)];
};

const phaseToWheelRead = {
    0: 1, 1: 2, 2: 3, 3: 4
};

const phaseToScreenRead = {
    0: 1, 1: 2, 2: 3, 3: 4, 4: 1
};

export const getScreenFromPhase = phase => {
    return phaseToScreenRead[normalizePhase(phase)];
};

// returns the wheel to read on phase
export const getWheelFromPhase = phase => {
    return phaseToWheelRead[normalizePhase(phase)];
};

export const isWheelBeingRead = (wheelNumber, phase) => {
    return getWheelFromPhase(phase) === wheelNumber;
};

// return true if a wheel can still have an affect on the current round
export const doesWheelMatter = (wheelNumber, phase) => {
    const modPhase = normalizePhase(phase);
    return wheelNumber > modPhase + 1;
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
    const wheelStart = {
        1: "blank",
        2: "remember",
        3: "blank",
        4: "remember",
    };

    const ret = [wheelStart[wheelNumber], ...shuffle([...SYMBOL_NAMES, grabRandomSymbol()])];

    // kill can only be spots 4-5 on wheels 1 & 2,
    //                  spots 3-6 on wheel 3
    //                  spots 2-7 on wheel 4
    // at least on encounter start

    let spots = [1, 2, 3, 4, 5, 6];
    if (wheelNumber < 3) {
        spots = [3, 4];
    } else if (wheelNumber === 3) {
        spots = [2, 3, 4, 5];
    }

    const killIndex = ret.indexOf("kill");
    if (!spots.includes(killIndex)) {
        const newKillIndex = shuffle([...spots])[0];
        ret[killIndex] = ret[newKillIndex];
        ret[newKillIndex] = "kill";
    }

    return ret;
};

// used with events.json
export const details = (str, replacements) => {
    return str.replace(/_(\w+)_/g, (match, key) => replacements[key] || match);
};

export const getTimestamp = totalSeconds => {
    const seconds = totalSeconds % 60;
    const minutes = totalSeconds >= 60 ? Math.floor(totalSeconds / 60) : 0;
    const hours = minutes > 60 ? minutes / 60 : 0;

    const ss = `${seconds}`.length < 2 ? `0${seconds}` : `${seconds}`;
    const mm = `${minutes}`.length < 2 ? `0${minutes}` : `${minutes}`;
    let hh = `${hours}`.length < 2 ? `0${hours}:` : `${hours}:`;
    if (hours === 0) { hh = ""; }
    return `${hh}${mm}:${ss}`;
};

export const getTextRotation = rotation => {
    return rotation === "cw" ? "clockwise" : "counter-clockwise";
};
