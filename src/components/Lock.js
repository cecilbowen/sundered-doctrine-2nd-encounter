import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid2';
import { getReadTotalFromPhase, getSymbolImage } from '../util';

const Lock = ({ lockNumber, symbol, phase }) => {
    const renderSymbol = name => {
        if (!name) {
            name = "blank";
        }

        const backgroundImage = getSymbolImage(name);
        const read = getReadTotalFromPhase(phase, true);
        const glow = read === lockNumber ? 'active' : '';

        return <div className={`lock-box`}>
            <div className={`lock ${glow}`} id={`lock-${lockNumber}`} style={{ backgroundImage }} />
        </div>;
    };

    return renderSymbol(symbol);
};

Lock.propTypes = {
    lockNumber: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    symbol: PropTypes.string,
};
export default Lock;
