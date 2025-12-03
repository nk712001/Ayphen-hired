"use client";

import React, { useState } from 'react';
import { Timer } from './Timer';

const TimerTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(5); // 5 minutes by default

  const handleTimeUp = () => {
    alert('Time\'s up!');
    setIsRunning(false);
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Timer Test</h2>
      
      {!isRunning ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set Duration (minutes):
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleStart}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Start Timer
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-4xl font-bold my-6">
            <Timer 
              durationMinutes={duration} 
              onTimeUp={handleTimeUp}
              className="text-5xl py-4"
            />
          </div>
          <p className="text-gray-600 mb-4">
            The timer will turn red when less than 5 minutes remain.
          </p>
          <button
            onClick={() => setIsRunning(false)}
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
          >
            Stop Timer
          </button>
        </div>
      )}
    </div>
  );
};

export default TimerTest;
