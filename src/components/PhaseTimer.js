import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import BarSection from '@mui/icons-material/Rectangle';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid2';
import { IconButton } from '@mui/material';
import ResetIcon from '@mui/icons-material/Replay';
import NextIcon from '@mui/icons-material/NavigateNext';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { getReadTotalFromPhase, normalizePhase, ROUNDS } from '../util';

const StyledRating = styled(Rating)({
    '& .MuiRating-iconFilled, .prep': { // Apply to custom class "prep"
        color: '#4094c9',
    },
    '& .MuiRating-iconEmpty': {
        color: 'darkgray',
    },
});

const PhaseTimer = ({ phase, resetEncounter, advancePhase, playPauseEncounter, round }) => {
    const modPhase = normalizePhase(phase);
    const [damagePhaseCutoff, setDamagePhaseCutoff] = useState(0);

    useEffect(() => {
        if (round === ROUNDS.DPS) {
            setDamagePhaseCutoff(normalizePhase(phase));
        }
    }, [round]);

    const clsMap = {
        [ROUNDS.PREP]: '',
        [ROUNDS.DPS]: 'damage-bar',
        [ROUNDS.STALL]: 'stall'
    };

    const glowCls = clsMap[round];
    const damagePhases = [0, 1, 2, 3, 4].filter(x => x > damagePhaseCutoff);

    // eslint-disable-next-line react/prop-types
    const IconContainer = ({ value, ...other }) => {
        const shouldGlow = damagePhases.includes(value) && round === ROUNDS.DPS;
        let indexCol = modPhase < value ? "darkgray" : "#4094c9";
        let style = {};
        if (round === ROUNDS.DPS) {
            indexCol = modPhase < value ? "#93847b" : "#4094c9";
            indexCol = modPhase >= value && shouldGlow ? "orange" : indexCol;
            style = { color: indexCol };
        } else if (round === ROUNDS.STALL) {
            indexCol = modPhase < value ? "#463030" : "black";
            indexCol = modPhase >= value && shouldGlow ? "black" : indexCol;
            style = { color: indexCol };
        }
        return (
            <BarSection
                {...other}
                style={style}
                fontSize="inherit"
            />
        );
    };

    return (
        <Grid className="caption-grid" sx={{ marginLeft: "20em" }} container spacing={2}>
            <Grid size={12}>
                <Typography fontWeight={"bold"} className="lockset-label">{round}</Typography>
            </Grid>
            <Grid size={12}>
                <Box className="phase timer-holder" sx={{ '& > legend': { mt: 2 } }}>
                    <IconButton onClick={resetEncounter} title={`Reset Encounter`}
                        sx={{ color: "black", transform: 'translateX(-60px) scale(0.8)' }} className="control-button" size="small"
                    >
                        <ResetIcon />
                    </IconButton>
                    <StyledRating
                        sx={{ transform: "scaleX(2)" }}
                        name={`phase-timer-bar`}
                        value={modPhase}
                        max={4}
                        size="large"
                        getLabelText={value => `${value}`}
                        readOnly
                        precision={0.1}
                        // icon={<BarSection className={glowCls} sx={glowStyle} fontSize="inherit" />}
                        IconContainerComponent={IconContainer}
                        emptyIcon={<BarSection fontSize="inherit" />}
                    />
                    <IconButton onClick={advancePhase} title={`Advance Phase`}
                        sx={{ color: "blue", transform: 'translateX(60px) scale(0.8)' }} size="small" className="control-button"
                    >
                        <NextIcon />
                    </IconButton>
                    <IconButton onClick={playPauseEncounter} title={`Play/Pause Encounter`}
                        sx={{ color: "green", transform: 'translateX(63px) scale(0.8)' }} size="small" className="control-button">
                        <PlayIcon />
                    </IconButton>
                </Box>
            </Grid>
        </Grid>
    );
};

PhaseTimer.propTypes = {
    phase: PropTypes.number.isRequired,
    resetEncounter: PropTypes.func.isRequired,
    advancePhase: PropTypes.func.isRequired,
    playPauseEncounter: PropTypes.func.isRequired,
    round: PropTypes.string.isRequired
};
export default PhaseTimer;
