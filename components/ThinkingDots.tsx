import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TH2 } from '../constants/Colors';

export function ThinkingDots() {
  const [f, setF] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setF(x => (x + 1) % 6), 340);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 8 }}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: TH2.t2,
            opacity: (f % 3) === i ? 1 : 0.22,
          }}
        />
      ))}
    </View>
  );
}

export default ThinkingDots;
