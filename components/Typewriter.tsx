import React, { useEffect, useState } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { TH2 } from '../constants/Colors';

interface Props {
  text: string;
  speed?: number;
  onDone?: () => void;
  style?: StyleProp<TextStyle>;
}

export function Typewriter({ text, speed = 28, onDone, style }: Props) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <Text
      style={[
        {
          fontFamily: 'Lora_500Medium',
          fontSize: 20,
          lineHeight: 37,
          color: TH2.t0,
        },
        style,
      ]}
    >
      {shown}
      {!done && (
        <Text
          style={{
            fontFamily: 'DMMono_400Regular',
            color: TH2.acc,
            opacity: 1,
          }}
        >
          {' |'}
        </Text>
      )}
    </Text>
  );
}

export default Typewriter;
