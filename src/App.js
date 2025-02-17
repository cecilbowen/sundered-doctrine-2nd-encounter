import './App.css';
import Lock from './components/Lock';
import PhaseTimer from './components/PhaseTimer';
import Wheel from './components/Wheel';
import { useState, useEffect } from 'react';
import { getSymbolImage, getTextRotation, getTimestamp, getWheelFromPhase, normalizePhase, ROUNDS } from './util';
import { Paper } from '@mui/material';
import { useLog } from './hooks/LogContext';

/*
  about 1:10 per turn
  wheels 4 (far left-most) and 2 (inner right) start off with blank at top
  wheels rotate in phase 1, 2, 3, 4 order from left to right
    phase 1: wheel 4 (far left-most) rotates
    phase 2: wheel 3 (inner left) rotates, etc
  when a wheel rotates, it's blank (if it has one) is replace with a new symbol
*/

const App = () => {
  const secondsPerPhase = 15; // per bar (4 bars total)
  const secondsPerPause = 10; // stop symbol

  const [timer, setTimer] = useState(0); // elapsed time in seconds.  used for timestamps
  const [playing, setPlaying] = useState(false);
  const [turn, setTurn] = useState(0); // goes up 1 every 4 phases
  const [round, setRound] = useState(ROUNDS.PREP); // "lockset progression", "lockset engagement" or "damage"
  const [phase, setPhase] = useState(0); // cumulative (goes beyond 4)
  const [dPhase, setDPhase] = useState(phase);
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
  const [actions, setActions] = useState([]); // history of all triggered symbols
  const [events, setEvents] = useState([]); // history of all shrieker, wheel and screen events
  const [currentActions, setCurrentActions] = useState([]); // actions of the current read
  const [oldSymbol, setOldSymbol] = useState();
  const { logEvent, eventLog, callEvent, clearLog } = useLog();

  const [prevRound, setPrevRound] = useState();
  const [nextRound, setNextRound] = useState();
  const [nudger, setNudger] = useState(0);
  const [simpleEvents, setSimpleEvents] = useState(false); // if false, full event log, otherwise, just symbol icons

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
    if (round === ROUNDS.PREP && modPhase === 4 && lockSymbol1 !== "kill") {
      const allLocksEngaged = lockSymbolValues.filter(x => x && x !== "blank").length === 4;
      if (allLocksEngaged) {
        setNextRound(ROUNDS.STALL);
      }
    }
  }, [lockSymbol1]);

  useEffect(() => {
    callEvent(round, {
      bars: `${4 - normalizePhase(phase)}`
    }, timer);

    if (round === ROUNDS.STALL) {
      // plague
      triggerPlague(); // trigger first one manually, since phase already changed to 0
    }

    if (round === ROUNDS.DPS) {
      callEvent("dps-screens", {}, timer);
    }
  }, [round]);

  useEffect(() => {
    setDPhase(phase);
  }, [timer]);

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

    const increaseAmount = modPhase > 0 ? secondsPerPhase : 0;
    const extra = oldSymbol === "stop" ? secondsPerPause : 0;
    const newTime = timer + increaseAmount + extra;

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
      triggerPlague(newTime);
    }

    setTimer(newTime);

    // timer will not update, so update delayed phase
    if (newTime === timer) {
      setDPhase(phase);
    }
  }, [phase]);

  useEffect(() => {
    if (!nextRound && !prevRound && phase > 0 && normalizePhase(phase) === 0) {
      setPhase(0);
      // setLockResetFlag(true);
    }
  }, [prevRound]);

  useEffect(() => {
    if (!nextRound && phase > 0 && normalizePhase(phase) === 0) {
      setPhase(0);
      // setNudger(nudger + 1); // re-trigger phase 0 effects of wheels
    }
  }, [nextRound]);

  const triggerPlague = futureTime => {
    const screenToRead = getWheelFromPhase(phase);

    if (screenToRead) {
      const action = lockSymbolValues[screenToRead];
      trigger(screenToRead, action, futureTime);
      // callEvent("shrieker-read", {
      //     device: "screen",
      //     number: screenToRead, symbol: action
      // }, timer);
    }
  };

  const startDamage = () => {
    setRound(ROUNDS.DPS);
  };

  const startStall = () => {
    setRound(ROUNDS.STALL);
  };

  const trigger = (wheelNumber, symbol, futureTime) => {
    const time = futureTime || timer;
    if (!symbol || symbol === "blank") {
      callEvent("trigger", {
        number: wheelNumber, symbol: "blank",
      }, time);
      callEvent("blank", {}, time);
      return;
    }

    callEvent("trigger", {
      number: wheelNumber, symbol
    }, time);

    setOldSymbol(prev => {
      return symbol;
    });

    const newAction = { wheelNumber, symbol, timestamp: time };
    setCurrentActions([newAction]);

    const direction = wheelNumber < 3 ? "left" : "right";

    callEvent(symbol, {
      round: `${round}`, direction: `${direction}`, number: `${wheelNumber}`
    }, time);
  };

  const changeWheelRotation = (wheelNumber, rotation) => {
    const setFunc = wheelRotationFuncs[wheelNumber];
    const newRotation = rotation === "cw" ? "ccw" : "cw";
    const textRotation = getTextRotation(newRotation);
    setFunc(newRotation);

    callEvent("change-rotation", {
      number: wheelNumber, angle: textRotation,
  }, timer);
  };

  const screenUpdate = (wheelNumber, symbol) => {
    const lockFunc = lockSymbolFuncs[wheelNumber];
    lockFunc(symbol);
    callEvent("screen-update", {
      number: wheelNumber, symbol
    }, timer);
  };

  const advancePhase = () => {
    setPhase(phase + 1);
  };

  const playPauseEncounter = () => {
    setPlaying(!playing);
  };

  const resetEncounter = () => {
    clearLog();
    setPrevRound(undefined);
    setNextRound(undefined);
    setRound(ROUNDS.PREP);
    setPlaying(false);
    setPhase(0);
    setTurn(0);
    resetWheels(true);
    resetScreens();
    resetActions();
    setTimer(0);
  };

  const damageComplete = () => {
    setRound(ROUNDS.PREP);
    resetWheels(true);
    resetScreens();
    setPrevRound(undefined);
    // resetActions();
  };

  const stallComplete = () => {
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
  };

  if (resetFlag) {
    return null;
  }

  const renderAction = ({ wheelNumber, symbol }, index) => {
    const backgroundImage = getSymbolImage(symbol);
    const text = `Wheel ${wheelNumber}: ${symbol}`;
    return <div className="action-image" style={{ backgroundImage, position: "relative" }} title={text}>
      <div className="action-number">{index + 1}</div>
    </div>;
  };

  const renderEvent = ({ text, seconds, symbol }, index) => {
    const timestamp = getTimestamp(seconds);
    const backgroundImage = getSymbolImage(symbol);
    const latestMsgTime = eventLog[eventLog.length - 1].seconds || 0;
    const highlightStyle = seconds === latestMsgTime ? { fontWeight: "bold", color: "blue" } : {};

    return <div className="event-message" key={`${text}-${index}`} style={highlightStyle}>
      <div className="event-timestamp">{`[${timestamp}]: `}</div>
      {symbol && <div className="chat-symbol" style={{ backgroundImage }} title={symbol} />}
      <div className="event-text">{text}</div>
    </div>;
  };

  const renderSimpleEvents = () => {
    return <Paper elevation={2} className="actions-paper">
      <div className="actions" id="event-log">
        {actions.map((x, i) => renderAction(x, i))}
      </div>
    </Paper>;
  };

  const renderEventLog = () => {
    const evs = [...events, ...eventLog]; // testing, remove later

    return <Paper elevation={2} className="event-paper">
      <div className="events" id="event-log">
        {evs.map((x, i) => renderEvent(x, i))}
      </div>
    </Paper>;
  };

  return (
    <div className="App">
        <PhaseTimer phase={dPhase} advancePhase={advancePhase} round={round} timer={timer}
          playPauseEncounter={playPauseEncounter} resetEncounter={resetEncounter} />
        {!lockResetFlag && <div className="locks">
          <Lock lockNumber={1} symbol={lockSymbol1} phase={dPhase} round={round} />
          <Lock lockNumber={2} symbol={lockSymbol2} phase={dPhase} round={round} />
          <Lock lockNumber={3} symbol={lockSymbol3} phase={dPhase} round={round} />
          <Lock lockNumber={4} symbol={lockSymbol4} phase={dPhase} round={round} />
        </div>}
        <div className="wheels">
          <Wheel wheelNumber={1} phase={dPhase} locked={wheel1Locked} nudger={nudger} pendingRound={nextRound}
            rotation={wheel1Rotation} changeRotation={changeWheelRotation} round={round} timer={timer}
            trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
          <Wheel wheelNumber={2} phase={dPhase} locked={wheel2Locked} nudger={nudger} pendingRound={nextRound}
            rotation={wheel2Rotation} changeRotation={changeWheelRotation} round={round} timer={timer}
            trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
          <Wheel wheelNumber={3} phase={dPhase} locked={wheel3Locked} nudger={nudger} pendingRound={nextRound}
            rotation={wheel3Rotation} changeRotation={changeWheelRotation} round={round} timer={timer}
            trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
          <Wheel wheelNumber={4} phase={dPhase} locked={wheel4Locked} nudger={nudger} pendingRound={nextRound}
            rotation={wheel4Rotation} changeRotation={changeWheelRotation} round={round} timer={timer}
            trigger={trigger} screenUpdate={screenUpdate} changeLockStatus={changeLockStatus} />
        </div>
        {simpleEvents ? renderSimpleEvents() : renderEventLog()}
        <small style={{ display: "flex", justifyContent: "center", marginBottom: "1em" }}>
        <a target="_blank"
          rel="noopener noreferrer" href="https://github.com/cecilbowen/sundered-doctrine-2nd-encounter">Source Code</a>
        </small>
    </div>
  );
};

export default App;
