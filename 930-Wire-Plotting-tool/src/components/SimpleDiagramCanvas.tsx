import React from 'react';

interface SimpleDiagramCanvasProps {
  paletteVisible?: boolean;
}

export const SimpleDiagramCanvas: React.FC<SimpleDiagramCanvasProps> = ({ paletteVisible }) => {
  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4">🎯 CircuitPilot Canvas</h2>
        <p className="text-gray-300 mb-2">Enhanced wire routing system is ready!</p>
        <p className="text-gray-400 text-sm">
          • Cardinal-only routing ✅<br/>
          • Precise CTRE PDP modeling ✅<br/>
          • Terminal anchor system ✅<br/>
          • Rectilinear A* pathfinding ✅<br/>
          • Wire placement controller ✅
        </p>
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            Palette visible: {paletteVisible ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </div>
  );
};
