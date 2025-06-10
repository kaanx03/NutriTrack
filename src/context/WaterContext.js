import React, { createContext, useContext, useState } from "react";

const WaterContext = createContext();

export const WaterProvider = ({ children }) => {
  const [waterIntake, setWaterIntake] = useState(0); // varsayılan 0 mL
  const [waterGoal, setWaterGoal] = useState(2500); // varsayılan hedef

  const increaseWater = (amount) => {
    setWaterIntake((prev) => prev + amount);
  };

  const decreaseWater = (amount) => {
    setWaterIntake((prev) => Math.max(0, prev - amount));
  };

  const resetWater = () => {
    setWaterIntake(0);
  };

  return (
    <WaterContext.Provider
      value={{
        waterIntake,
        setWaterIntake,
        increaseWater,
        decreaseWater,
        waterGoal,
        setWaterGoal,
        resetWater,
      }}
    >
      {children}
    </WaterContext.Provider>
  );
};

export const useWater = () => useContext(WaterContext);
