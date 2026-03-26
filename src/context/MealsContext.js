import React, { createContext, useContext, useState } from 'react';

const MealsContext = createContext(null);

export function MealsProvider({ children }) {
  const [meals, setMeals] = useState([]);

  const logMeal = ({ text, imageUri }) => {
    setMeals(prev => [
      { id: Date.now(), timestamp: new Date(), text, imageUri },
      ...prev,
    ]);
  };

  const todaysMeals = meals.filter((m) => {
    const mealDate = new Date(m.timestamp);
    const now = new Date();
    return (
      mealDate.getDate() === now.getDate() &&
      mealDate.getMonth() === now.getMonth() &&
      mealDate.getFullYear() === now.getFullYear()
    );
  });

  return (
    <MealsContext.Provider value={{ meals, todaysMeals, logMeal }}>
      {children}
    </MealsContext.Provider>
  );
}

export function useMeals() {
  return useContext(MealsContext);
}
