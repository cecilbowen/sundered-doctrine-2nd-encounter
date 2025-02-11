import './App.css';
import Lock from './components/Lock';
import PhaseTimer from './components/PhaseTimer';
import Wheel from './components/Wheel';
import { useState, useEffect } from 'react';
import { getSymbolImage, getWheelFromPhase, normalizePhase, ROUNDS } from './util';
import { Paper } from '@mui/material';

/*
  about 1:10 per turn
  wheels 4 (far left-most) and 2 (inner right) start off with blank at top
  wheels rotate in phase 1, 2, 3, 4 order from left to right
    phase 1: wheel 4 (far left-most) rotates
    phase 2: wheel 3 (inner left) rotates, etc
  when a wheel rotates, it's blank (if it has one) is replace with a new symbol
*/

const App = () => {
  const secondsPerPhase = 10;
  const secondsPerTurn = 70;

  const [playing, setPlaying] = useState(false);
  const [turn, setTurn] = useState(0); // goes up 1 every 4 phases
  const [phase, setPhase] = useState(0); // cumulative (goes beyond 4)
  const [round, setRound] = useState(ROUNDS.PREP); // "lockset progression", "lockset engagement" or "damage"
  const [resetFlag, setResetFlag] = useState(false);
  const [lockResetFlag, setLockResetFlag] = useState(false); // the more of these the lazier i become

  const [lockSymbol1, setLockSymbol1] = useState("blank");
  const [lockSymbol2, setLockSymbol2] = useState("blank");
  const [lockSymbol3, setLockSymbol3] = useState("blank");
  const [lockSymbol4, setLockSymbol4] = useState("blank");
  const lockSymbolValues = [null, lockSymbol1, lockSymbol2, lockSymbol3, lockSymbol4];
  const lockSymbolFuncs = [null, setLockSymbol1, setLockSymbol2, setLockSymbol3, setLockSymbol4];

  // cw (clockwise) or ccw (counter-clockwise)
  const [wheel1Rotation, setWheel1Rotation] = useState("cw");
  const [wheel2Rotation, setWheel2Rotation] = useState("cw");
  const [wheel3Rotation, setWheel3Rotation] = useState("cw");
  const [wheel4Rotation, setWheel4Rotation] = useState("cw");
  const wheelRotationFuncs = [null, setWheel1Rotation, setWheel2Rotation, setWheel3Rotation, setWheel4Rotation];

  const [wheel1Locked, setWheel1Locked] = useState(false);
  const [wheel2Locked, setWheel2Locked] = useState(false);
  const [wheel3Locked, setWheel3Locked] = useState(false);
  const [wheel4Locked, setWheel4Locked] = useState(false);
  const lockWheelFuncs = [null, setWheel1Locked, setWheel2Locked, setWheel3Locked, setWheel4Locked];

  // action = { wheelNumber, symbol }
  const [actions, setActions] = useState([]); // history of all triggered actions
  const [currentActions, setCurrentActions] = useState([]); // actions of the current read

  const [prevRound, setPrevRound] = useState();
  const [nextRound, setNextRound] = useState();
  const [nudger, setNudger] = useState(0);

  useEffect(() => {
    if (resetFlag) {
      setResetFlag(false);
    }
  }, [resetFlag]);

  useEffect(() => {
    if (lockResetFlag) {
      setLockResetFlag(false);
    }
  }, [lockResetFlag]);

  useEffect(() => {
    if (currentActions.length > 0) {
      console.log(`action pool`, currentActions);
      setActions(prev => [...prev, ...currentActions]);
      setCurrentActions([]);

      if (currentActions[0].symbol === "kill") {
        startDamage();
      }
    }
  }, [currentActions]);

  useEffect(() => {
    console.log("total actions: ", actions);
  }, [actions]);

  useEffect(() => {
    const modPhase = normalizePhase(phase);
    if (round === ROUNDS.PREP && modPhase === 4) {
      const allLocksEngaged = lockSymbolValues.filter(x => x && x !== "blank").length === 4;
      console.log('locks? ', allLocksEngaged);
      if (allLocksEngaged) {
        setNextRound(ROUNDS.STALL);
        console.log("next round is STALL round ---------------------");
      }
    }
  }, [lockSymbol1]);

  useEffect(() => {
    const modPhase = normalizePhase(phase);
    if (round !== ROUNDS.PREP && modPhase === 4) {
      setPrevRound(round);
    }

    // honestly, don't even use turn..
    if (phase > 0) {
      if (modPhase === 0) {
        setTurn(turn + 1);
      }
    }

    if (modPhase === 0 && prevRound) {
      if (prevRound === ROUNDS.DPS) {
        damageComplete();
      } else if (prevRound === ROUNDS.STALL) {
        stallComplete();
      }
    } else if (modPhase === 0 && nextRound) {
      startStall();
    } else if (round === ROUNDS.STALL || round === ROUNDS.DPS) {
      // trigger corresponding screen effect on phase change
      triggerPlague();
    }
  }, [phase]);

  useEffect(() => {
    console.log(`starting ${round} round`);
    if (round === ROUNDS.STALL) {
      // plague
      triggerPlague(); // trigger first one manually, since phase already changed to 0
    }
  }, [round]);

  useEffect(() => {
    if (!nextRound && !prevRound && phase > 0 && normalizePhase(phase) === 0) {
      setPhase(0);
      setLockResetFlag(true);
    }
  }, [prevRound]);

  useEffect(() => {
    if (!nextRound && phase > 0 && normalizePhase(phase) === 0) {
      setPhase(0);
      // setNudger(nudger + 1); // re-trigger phase 0 effects of wheels
    }
  }, [nextRound]);

  const triggerPlague = () => {
    const screenToRead = getWheelFromPhase(phase);

    if (screenToRead) {
      const action = lockSymbolValues[screenToRead];
      trigger(`screen-${screenToRead}`, action);
      console.log(`[${round}]: plague ${normalizePhase(phase)} - ${action}`);
    }
  };

  const startDamage = () => {
    setRound(ROUNDS.DPS);
  };

  const startStall = () => {
    setRound(ROUNDS.STALL);
  };

  const trigger = (wheelNumber, symbol) => {
    if (!symbol || symbol === "blank") {
      console.log(`wheel ${wheelNumber} blank - no trigger..`);
      return;
    }
    const newAction = { wheelNumber, symbol };
    setCurrentActions([newAction]);
    console.log(`wheel ${wheelNumber} triggered symbol: ${symbol}`);
  };

  const changeWheelRotation = (wheelNumber, rotation) => {
    const setFunc = wheelRotationFuncs[wheelNumber];
    console.log(wheelNumber, rotation);
    setFunc(rotation === "cw" ? "ccw" : "cw");
  };

  const screenUpdate = (wheelNumber, symbol) => {
    const lockFunc = lockSymbolFuncs[wheelNumber];
    lockFunc(symbol);
    console.log(`wheel ${wheelNumber} screen update with symbol: ${symbol}`);
  };

  const renderAction = ({ wheelNumber, symbol }, index) => {
    const backgroundImage = getSymbolImage(symbol);
    const text = `Wheel ${wheelNumber}: ${symbol}`;
    return <div className="action-image" style={{ backgroundImage, position: "relative" }} title={text}>
      <div style={{ position: 'absolute', fontWeight: 'bold', left: "50%", top: "50%" }}>{index + 1}</div>
    </div>;
  };

  const advancePhase = () => {
    setPhase(phase + 1);
  };

  const playPauseEncounter = () => {
    setPlaying(!playing);
  };

  const resetEncounter = () => {
    console.log('resetEncounter()');
    setRound(ROUNDS.PREP);
    setPlaying(false);
    setPhase(0);
    setTurn(0);
    resetWheels(true);
    resetScreens();
    resetActions();
  };

  const damageComplete = () => {
    console.log('damageComplete()');
    setRound(ROUNDS.PREP);
    resetWheels(true);
    resetScreens();
    setPrevRound(undefined);
    // resetActions();
  };

  const stallComplete = () => {
    console.log('stallComplete()');
    resetScreens();
    setRound(ROUNDS.PREP);
    setPrevRound(undefined);
    setNextRound(undefined);
  };

  const unlockWheels = () => {
    for (const ff of lockWheelFuncs) {
      if (ff) {
        ff(false);
      }
    }
  };

  const resetScreens = () => {
    console.log('resetScreens()');
    for (const ff of lockSymbolFuncs) {
      if (ff) {
        ff("blank");
      }
    }
  };

  const resetWheelRotations = () => {
    for (const ff of wheelRotationFuncs) {
      if (ff) {
        ff("cw");
      }
    }
  };

  const resetActions = () => {
    setActions([]);
    setCurrentActions([]);
  };

  const resetWheels = (hard = false) => {
    // lazy way
    setResetFlag(true);
    unlockWheels();
    if (hard) { resetWheelRotations(); }
  };

  const changeLockStatus = (wheelNumber, lock) => {
    const lockFunc = lockWheelFuncs[wheelNumber];
    lockFunc(lock);
    console.log(`setting wheel ${wheelNumber} lock status to: ${lock}`);
  };

  if (resetFlag) {
    return null;
  }

  return (
    <div className="App">
      <PhaseTimer phase={phase} advancePhase={advancePhase} round={round}
        playPauseEncounter={playPauseEncounter} resetEncounter={resetEncounter} />
      {!lockResetFlag && <div className="locks">
        <Lock lockNumber={1} symbol={lockSymbol1} phase={phase} round={round} />
        <Lock lockNumber={2} symbol={lockSymbol2} phase={phase} round={round} />
        <Lock lockNumber={3} symbol={lockSymbol3} phase={phase} round={round} />
        <Lock lockNumber={4} symbol={lockSymbol4} phase={phase} round={round} />
      </div>}
      <div className="wheels">
        <Wheel wheelNumber={1} phase={phase} locked={wheel1Locked} nudger={nudger}
          rotation={wheel1Rotation} changeRotation={changeWheelRotation} round={round}
          trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
        <Wheel wheelNumber={2} phase={phase} locked={wheel2Locked} nudger={nudger}
          rotation={wheel2Rotation} changeRotation={changeWheelRotation} round={round}
          trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
        <Wheel wheelNumber={3} phase={phase} locked={wheel3Locked} nudger={nudger}
          rotation={wheel3Rotation} changeRotation={changeWheelRotation} round={round}
          trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
        <Wheel wheelNumber={4} phase={phase} locked={wheel4Locked} nudger={nudger}
          rotation={wheel4Rotation} changeRotation={changeWheelRotation} round={round}
          trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
      </div>
      <Paper elevation={2} className="actions">
        {actions.map((x, i) => renderAction(x, i))}
      </Paper>
    </div>
  );
};

export default App;
