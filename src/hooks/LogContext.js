import { createContext, useContext, useState } from "react";
import * as EVENT_MAP from '../data/events.json';
import { details, isSymbol } from "../util";

// Create the context
const LogContext = createContext();

// Provider component
// eslint-disable-next-line react/prop-types
export const LogProvider = ({ children }) => {
  const [eventLog, setEventLog] = useState([]);

  const logEvent = event => {
    setEventLog(prevLog => [...prevLog, event]);
    updateScrollBox();
  };

  const updateScrollBox = () => {
    const objDiv = document.getElementById("event-log");
    if (objDiv) {
      setTimeout(() => {
        objDiv.scrollTop = objDiv.scrollHeight;
      }, 100);
    }
  };

  const callEvent = (name, vars, seconds) => {
    const template = EVENT_MAP[name];
    if (!template) { return; }
    const text = details(template, vars);

    const symbol = isSymbol(name);

    const event = { text, seconds, symbol };

    const noDupeEvents = ["trigger", "blank", "stop", "hive", "remember", "commune", "kill"];
    const dupeCheck = noDupeEvents.includes(name) &&
      eventLog.filter(x => x.seconds === seconds && x.symbol === symbol && x.text === text)[0];

    if (dupeCheck) {
      console.warn('event log was about to post a duplicate, skipped');
      return;
    }

    // if (eventLog.filter(x => x.text === text && x.seconds === seconds).length > 0) {
    //   console.warn('skipping duplicate event in event log (probably cause of react strict mode)', text);
    //   return;
    // }

    setEventLog(prevLog => [...prevLog, event]);
    updateScrollBox();
  };

  const clearLog = () => {
    setEventLog([]);
  };

  return (
    <LogContext.Provider value={{ eventLog, callEvent, logEvent, clearLog }}>
      {children}
    </LogContext.Provider>
  );
};

// Custom hook to use the log context
export const useLog = () => useContext(LogContext);
