import * as React from 'react';
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
import { getReadTotalFromPhase, normalizePhase } from '../util';

const StyledRating = styled(Rating)({
    '& .MuiRating-iconFilled': {
        color: '#4094c9',
    },
    '& .MuiRating-iconEmpty': {
        color: 'darkgray',
    },
});

const PhaseTimer = ({ phase, resetEncounter, advancePhase, playPauseEncounter }) => {
    const modPhase = normalizePhase(phase);

    return (
        <Grid className="caption-grid" container spacing={2}>
            <Grid size={12}>
                <Typography className="lockset-label">Lockset Progression, Read #{getReadTotalFromPhase(phase)}</Typography>
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
                        name="phase-timer-bar"
                        value={modPhase}
                        max={4}
                        size="large"
                        getLabelText={value => `${value}`}
                        readOnly
                        precision={0.1}
                        icon={<BarSection fontSize="inherit" />}
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
    playPauseEncounter: PropTypes.func.isRequired
};
export default PhaseTimer;
