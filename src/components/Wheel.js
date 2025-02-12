import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid2';
import DiamondIcon from './DiamondIcon';
import IconButton from '@mui/material/IconButton';
import LockIcon from '@mui/icons-material/Lock';
import OneIcon from '@mui/icons-material/LooksOne';
import TwoIcon from '@mui/icons-material/LooksTwo';
import ThreeIcon from '@mui/icons-material/Looks3';
import { getSymbolImage, getWheelNextPosition,
    normalizePhase, shouldScreenUpdateHappen, generateNewSymbols,
    grabRandomSymbol,
    getWheelToCopy,
    getWheelFromPhase,
    isWheelBeingRead,
    doesWheelMatter,
    ROUNDS,
    getWheelToRotate,
    getTextRotation } from '../util';
import DunkIcon from '@mui/icons-material/MoveToInbox';
import '../Spin.css';
import { Button, Paper } from '@mui/material';
import { useLog } from '../hooks/LogContext';

const Wheel = ({ wheelNumber, symbolsForced, rotation,
    locked, changeRotation, phase, trigger, screenUpdate,
    changeLockStatus, round, nudger, pendingRound, timer
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
    const { callEvent } = useLog();
    const angles = [0, -60, -105, 210, 150, 105, 60]; // counter angles for images to stay upright

    useEffect(() => {
        let newSymbols = symbolsForced;
        if (!newSymbols) {
            newSymbols = generateNewSymbols(wheelNumber);
        }

        setSymbols(newSymbols);
        setAction(newSymbols[position]);
    }, []);

    useEffect(() => {
        if (round !== ROUNDS.PREP) {
            if (round === ROUNDS.DPS) {
                const syms = [...symbols];
                if (doesWheelMatter(wheelNumber, phase)) {
                    // remove kill from any activate-able wheels
                    const killIndex = syms.indexOf("kill");
                    const blankIndex = syms.indexOf("blank");
                    const newKillReplacement = grabRandomSymbol(syms);
                    syms[killIndex] = newKillReplacement;

                    callEvent("replace-kill", {
                        number: wheelNumber, symbol: newKillReplacement
                    }, timer);

                    if (blankIndex !== -1) {
                        syms[blankIndex] = grabRandomSymbol(syms);
                    }
                    setSymbols(syms);
                }
                screenUpdate(wheelNumber, syms[position]);
            } // TODO: test stall phase end, with a KILL on wheel 1 (immediate dps phase?)
        }
    }, [round]);

    const handlePhaseChange = () => {
        const wheelToCopy = getWheelToCopy(phase);
        const wheelToRead = getWheelFromPhase(phase);
        const wheelToRotate = getWheelToRotate(phase);

        if (round === ROUNDS.DPS) {
            if (isWheelBeingRead(wheelNumber, phase) && doesWheelMatter(wheelNumber, phase)) {
                // can still reflect changes on screen
                trigger(wheelNumber, action);
            }
        } else if (round === ROUNDS.STALL) {
            // wheels have no affect during stall round, only screens
            return;
        } else if (!pendingRound || pendingRound !== ROUNDS.STALL) {
            // prep round, standard stuff
            if (shouldScreenUpdateHappen(phase)) {
                if (wheelToCopy === wheelNumber) {
                    screenUpdate(wheelNumber, action);
                }
            }

            if (wheelToRead === wheelNumber) {
                trigger(wheelNumber, action);
            }

            if (wheelToRotate === wheelNumber) {
                if (locked) {
                    changeLockStatus(wheelNumber, false);
                    callEvent("unlock-wheel", {
                        number: wheelNumber
                    }, timer);
                } else {
                    rotateWheel(true);
                }
            }
        }
    };

    useEffect(() => {
        handlePhaseChange();
    }, [phase]);

    useEffect(() => {
        if (nudger > 0) {
            handlePhaseChange();
        }
    }, [nudger]);

    const rotateWheel = (auto, amount = 1) => {
        if (!symbols) { return; }

        if (!auto) {
            const adjectives = ["", "Heightened", "Brimming", "Overwhelming"];

            callEvent("deposit", {
                number: wheelNumber, knowledge: adjectives[amount],
                amount
            }, timer);
        }

        // manual rotation during dps changes screens, if wheel hasn't been processed yet
        if (!auto && round === ROUNDS.DPS) {
            if (doesWheelMatter(wheelNumber, phase)) {
                const newPos = getWheelNextPosition(position, rotation, amount);
                setPosition(newPos);
                setAction(symbols[newPos]);
                screenUpdate(wheelNumber, symbols[newPos]);

                callEvent("rotate", {
                    number: wheelNumber, angle: getTextRotation(rotation),
                    amount, source: "player"
                }, timer);

                return;
            }
        } else if (auto && (locked || phase === 0)) {
            return;
        }

        if (!auto) {
            changeLockStatus(wheelNumber, true);
        }

        let newPos = getWheelNextPosition(position, rotation, amount);

        callEvent("rotate", {
            number: wheelNumber, angle: getTextRotation(rotation),
            amount, source: auto ? "auto" : "player"
        }, timer);

        // never auto-rotate to kill
        if (auto && symbols[newPos] === 'kill') {
            newPos = getWheelNextPosition(newPos, rotation, 1);

            callEvent("rotate-kill", {
                number: wheelNumber, angle: getTextRotation(rotation)
            }, timer);
        }

        const syms = [...symbols];
        const blankIndex = syms.indexOf("blank");
        if (blankIndex !== -1) {
            syms[blankIndex] = grabRandomSymbol(syms);

            callEvent("replace-blank", {
                number: wheelNumber, symbol: syms[blankIndex]
            }, timer);
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

        return <IconButton onClick={() => rotateWheel(false, stack)} className="dunk-icon-button"
            title={`Deposit ${adjectives[stack]} Knowledge`}>
                {icons[stack]}
        </IconButton>;
    };

    const doBeScreenUpdating = shouldScreenUpdateHappen(phase);

    if (!symbols) {
        return null;
    }

    const wheelToRead = getWheelFromPhase(phase);
    const glow = wheelNumber === wheelToRead ? 'active' : '';

    return (
        <Grid className="caption-grid" container spacing={1}>
            <Grid size={12} sx={{ display: "flex" }} justifyContent={"center"}>
                <Button variant="outlined" onClick={prepWheelRotation} title={`Change Wheel ${wheelNumber} Rotation`}
                    className="change-rotation-button" startIcon={<DiamondIcon />}>
                    Rotation
                </Button>
                {/* <IconButton onClick={prepWheelRotation} className="change-rotation-button"
                    title={`Change Wheel ${wheelNumber} Rotation`}>
                    <DiamondIcon />
                    {doBeScreenUpdating && "SCREEN UPDATE"}
                </IconButton> */}
            </Grid>
            <Grid size={12} sx={{ display: "flex" }} justifyContent={"center"}>
                <div className={`wheel ${glow}`}>
                    <div className="wheel-number">{wheelNumber}</div>
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
    screenUpdate: PropTypes.func.isRequired,
    changeLockStatus: PropTypes.func.isRequired,
    round: PropTypes.string.isRequired,
    pendingRound: PropTypes.string,
    timer: PropTypes.number,
    nudger: PropTypes.number,
    symbolsForced: PropTypes.array,
    locked: PropTypes.bool
};
export default Wheel;
