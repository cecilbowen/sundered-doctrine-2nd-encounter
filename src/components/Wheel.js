import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid2';
import DiamondIcon from './DiamondIcon';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LockIcon from '@mui/icons-material/Lock';
import OneIcon from '@mui/icons-material/LooksOne';
import TwoIcon from '@mui/icons-material/LooksTwo';
import ThreeIcon from '@mui/icons-material/Looks3';
import { getReadFromPhase, getSymbolImage, getWheelNextPosition,
    normalizePhase, shouldReadHappen, generateNewSymbols,
    grabRandomSymbol } from '../util';
import DunkIcon from '@mui/icons-material/MoveToInbox';
import '../Spin.css';
import { Paper } from '@mui/material';

const Wheel = ({ wheelNumber, symbolsForced, rotation,
    locked, changeRotation, phase, trigger, read,
    changeLockStatus
}) => {
// no-lint
/* symbols array order

        1
    7       2

  6           3

     5     4

*/
    const [position, setPosition] = useState(0); // 0 - 6 (symbol "clock" positions)
    const [action, setAction] = useState(); // active symbol
    const [symbols, setSymbols] = useState();
    const angles = [0, -60, -105, 210, 150, 105, 60]; // counter angles for images to stay upright

    useEffect(() => {
        if (!symbolsForced) {
            const newSymbols = generateNewSymbols(wheelNumber);
            console.log(wheelNumber, newSymbols);
            setSymbols(newSymbols);
            setAction(newSymbols[0]);
        }
    }, []);

    const phaseToWheelRotation = { // phase: wheel map
        0: 22, // don't do anything on startup phase
        1: 4, // on phase 1, wheel 4 rotates, etc
        2: 3,
        3: 2,
        4: 1
    };

    useEffect(() => {
        const wheelToRead = getReadFromPhase(phase);

        if (shouldReadHappen(phase)) {
            if (wheelToRead === wheelNumber) {
                read(wheelNumber, action);
                changeLockStatus(wheelNumber, false);
            }

            trigger(wheelNumber, action);
        }

        const modPhase = normalizePhase(phase);
        const wheelToRotate = phaseToWheelRotation[modPhase];

        if (wheelToRotate === wheelNumber) {
            rotateWheel(true);
        }
    }, [phase]);

    const rotateWheel = (auto, amount = 1) => {
        if (locked && auto) {
            return;
        }

        if (!auto) {
            changeLockStatus(wheelNumber, true);
        }

        let newPos = getWheelNextPosition(position, rotation, amount);

        // never auto-rotate to kill
        if (auto && symbols[newPos] === 'kill') {
            newPos = getWheelNextPosition(newPos, rotation, 1);
        }

        let syms = [...symbols];
        if (auto && syms.indexOf("blank") !== -1) { // TODO: make sure blanks only get replaced on auto rotations
            syms = [grabRandomSymbol(), ...syms.filter(x => x !== "blank")];
        }

        setSymbols(syms);
        setPosition(newPos);
        setAction(syms[newPos]);
    };

    const renderSymbol = (name, index) => {
        if (!name) {
            name = "blank";
        }

        const backgroundImage = getSymbolImage(name);
        const transform = `rotate(${angles[index]}deg)`;

        const activeCls = index === position ? 'active' : '';

        return <div className={`small-circle`} key={`symbol-${name}-${index}`} title={name}>
            <div className={`small-circle-image ${activeCls}`} style={{ backgroundImage, transform }} />
        </div>;
    };

    const renderSymbols = names => {
        return names.map((name, i) => renderSymbol(name, i));
    };

    // const reversed = rotation === 'cw' ? '' : 'reverse-spin';
    // const spinAction = locked ? '' : reversed;

    const prepWheelRotation = () => {
        changeRotation(wheelNumber, rotation);
    };

    const spinState = rotation === "ccw" ? { animationPlayState: 'running' } : {};

    const renderDunkButton = stack => {
        const adjectives = ["", "Heightened", "Brimming", "Overwhelming"];
        const icons = [0,
            <OneIcon className="dunk-button" key={`wheel-${wheelNumber}-dunk-${stack}`} />,
            <TwoIcon className="dunk-button" key={`wheel-${wheelNumber}-dunk-${stack}`} />,
            <ThreeIcon className="dunk-button" key={`wheel-${wheelNumber}-dunk-${stack}`} />
        ];

        return <IconButton onClick={() => rotateWheel(false, stack)}
            title={`Deposit ${adjectives[stack]} Knowledge`}>
                {icons[stack]}
        </IconButton>;
    };

    if (!symbols) {
        return null;
    }

    return (
        <Grid className="caption-grid" container spacing={2}>
            <Grid size={12} sx={{ display: "flex" }} justifyContent={"center"}>
                <IconButton onClick={prepWheelRotation}
                    sx={{ transform: "scale(1.5)" }} title={`Change Wheel ${wheelNumber} Rotation`}>
                    <DiamondIcon />
                </IconButton>
            </Grid>
            <Grid size={12} sx={{ display: "flex" }} justifyContent={"center"}>
                <div className="wheel">
                    <div className="wheel-dial">
                        {locked && <LockIcon className="locked-wheel" />}
                    </div>
                    <div className="spin-container" style={ spinState }>
                        <div className={`wheel-hands spin`} id={`wheel-${wheelNumber}-hands`}></div>
                    </div>
                    {renderSymbols(symbols)}
                </div>
            </Grid>
            <Grid size={12} sx={{ display: "flex" }} justifyContent={"center"}>
                <Paper elevation={2} className="dunk-holder">
                    <DunkIcon className="dunk-icon" />
                    {[1, 2, 3].map(stack => renderDunkButton(stack))}
                </Paper>
            </Grid>
        </Grid>
    );
};

Wheel.propTypes = {
    wheelNumber: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    rotation: PropTypes.string.isRequired,
    changeRotation: PropTypes.func.isRequired,
    trigger: PropTypes.func.isRequired,
    read: PropTypes.func.isRequired,
    changeLockStatus: PropTypes.func.isRequired,
    symbolsForced: PropTypes.array,
    locked: PropTypes.bool
};
export default Wheel;
