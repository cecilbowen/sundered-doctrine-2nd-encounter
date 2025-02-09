import './App.css';
import Lock from './components/Lock';
import PhaseTimer from './components/PhaseTimer';
import Wheel from './components/Wheel';
import { useState, useEffect } from 'react';
import { getReadFromPhase, getReadTotalFromPhase, getSymbolImage, normalizePhase } from './util';
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
  const [stall, setStall] = useState("no"); // "no", "yes", "damage"
  const [resetFlag, setResetFlag] = useState(false);

  const [lockSymbol1, setLockSymbol1] = useState("blank");
  const [lockSymbol2, setLockSymbol2] = useState("blank");
  const [lockSymbol3, setLockSymbol3] = useState("blank");
  const [lockSymbol4, setLockSymbol4] = useState("blank");
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

  useEffect(() => {
    if (resetFlag) {
      setResetFlag(false);
    }
  }, [resetFlag]);

  useEffect(() => {
    console.log("... currentActions: ", currentActions);
    const normalizedRead = getReadTotalFromPhase(phase, true);
    const totalRead = getReadTotalFromPhase(phase);

    let checkNum = 4;
    if (normalizedRead === 2 && totalRead === normalizedRead) {
      // going to have one blank
      checkNum = 3;
    }

    if (currentActions.length === checkNum) {
      console.log(`action pool #${getReadFromPhase(phase)}`, currentActions);
      setActions(prev => [...prev, ...currentActions]);
      setCurrentActions([]);
    }
  }, [currentActions]);

  useEffect(() => {
    console.log("total actions: ", actions);
  }, [actions]);

  useEffect(() => {
    if (phase > 0) {
      const modPhase = phase % 4;
      if (modPhase === 0) {
        setTurn(turn + 1);
      }
    }
  }, [phase]);

  const trigger = (wheelNumber, symbol) => {
    if (symbol === "blank") { return; }
    const newAction = { wheelNumber, symbol };
    setCurrentActions(prev => [...prev, newAction]);
    console.log(`wheel ${wheelNumber} triggered symbol: ${symbol}`);
  };

  const changeWheelRotation = (wheelNumber, rotation) => {
    const setFunc = wheelRotationFuncs[wheelNumber];
    console.log(wheelNumber, rotation);
    setFunc(rotation === "cw" ? "ccw" : "cw");
  };

  const read = (wheelNumber, symbol) => {
    const lockFunc = lockSymbolFuncs[wheelNumber];
    lockFunc(symbol);
    console.log(`read wheel ${wheelNumber} with symbol: ${symbol}`);
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
    setPlaying(false);
    setPhase(0);
    setTurn(0);
    resetWheels();
  };

  const resetWheels = () => {
    // lazy way
    setResetFlag(true);
    for (const ff of lockSymbolFuncs) {
      if (ff) {
        ff("blank");
      }
    }

    for (const ff of lockWheelFuncs) {
      if (ff) {
        ff(false);
      }
    }
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
      <PhaseTimer phase={phase} advancePhase={advancePhase}
        playPauseEncounter={playPauseEncounter} resetEncounter={resetEncounter} />
      <div className="locks">
        <Lock lockNumber={4} symbol={lockSymbol4} phase={phase} />
        <Lock lockNumber={3} symbol={lockSymbol3} phase={phase} />
        <Lock lockNumber={2} symbol={lockSymbol2} phase={phase} />
        <Lock lockNumber={1} symbol={lockSymbol1} phase={phase} />
      </div>
      <div className="wheels">
        <Wheel wheelNumber={4} phase={phase} locked={wheel4Locked}
          rotation={wheel4Rotation} changeRotation={changeWheelRotation}
          trigger={trigger} read={read} changeLockStatus={changeLockStatus} />
        <Wheel wheelNumber={3} phase={phase} locked={wheel3Locked}
          rotation={wheel3Rotation} changeRotation={changeWheelRotation}
          trigger={trigger} read={read} changeLockStatus={changeLockStatus} />
        <Wheel wheelNumber={2} phase={phase} locked={wheel2Locked}
          rotation={wheel2Rotation} changeRotation={changeWheelRotation}
          trigger={trigger} read={read} changeLockStatus={changeLockStatus} />
        <Wheel wheelNumber={1} phase={phase} locked={wheel1Locked}
          rotation={wheel1Rotation} changeRotation={changeWheelRotation}
          trigger={trigger} read={read} changeLockStatus={changeLockStatus} />
      </div>
      <Paper elevation={2} className="actions">
        {actions.map((x, i) => renderAction(x, i))}
      </Paper>
    </div>
  );
};

export default App;
