import React from 'react';

export function FireworksOverlay({ bursts }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10">
      {bursts.map((spark) => (
        <span
          key={spark.id}
          className="spark"
          style={{
            left: spark.x,
            top: spark.y,
            background: spark.color,
            ['--dx']: spark.dx,
            ['--dy']: spark.dy,
          }}
        />
      ))}
    </div>
  );
}

export default FireworksOverlay;
