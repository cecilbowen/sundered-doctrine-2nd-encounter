import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getScreenFromPhase, getSymbolImage, getWheelFromPhase, ROUNDS, shouldScreenUpdateHappen } from '../util';

const Lock = ({ lockNumber, symbol, phase, round }) => {
    const [prevRound, setPrevRound] = useState(round);
    const [nextScreenToUpdate, setNextScreenToUpdate] = useState(4);
    useEffect(() => {
        if (round === ROUNDS.PREP && shouldScreenUpdateHappen(phase)) {
            let nextUpdatePhase = phase;
            while (true) {
                nextUpdatePhase += 1;
                if (shouldScreenUpdateHappen(nextUpdatePhase)) {
                    break;
                }
            }
            setNextScreenToUpdate(getScreenFromPhase(nextUpdatePhase));
        }
    }, [phase]);

    useEffect(() => {
        if (prevRound !== ROUNDS.PREP) {
            setNextScreenToUpdate(4);
            setPrevRound(round);
        }
    }, [round]);

    const renderSymbol = name => {
        if (!name) {
            name = "blank";
        }

        const colMap = {
            [ROUNDS.DPS]: 'damage',
            [ROUNDS.STALL]: 'stall'
        };

        const backgroundImage = getSymbolImage(name);
        const currentWheel = getWheelFromPhase(phase);
        let glow = nextScreenToUpdate === lockNumber ? 'active' : '';
        if (round !== ROUNDS.PREP) {
            glow = '';
            if (lockNumber === currentWheel) {
                glow = colMap[round];
            }
        }

        return <div className={`lock-box`}>
            <div className="lock-number">{lockNumber}</div>
            <div className={`lock ${glow}`} id={`lock-${lockNumber}`} style={{ backgroundImage }} />
        </div>;
    };

    return renderSymbol(symbol);
};

Lock.propTypes = {
    lockNumber: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    round: PropTypes.string.isRequired,
    symbol: PropTypes.string,
};
export default Lock;
