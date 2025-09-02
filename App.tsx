import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, NativeModules, NativeEventEmitter, ScrollView } from 'react-native';

// Define the interface for the native module
interface HyBidBridgeInterface {
  initialize: (appToken: string) => void;
  loadBanner: (zoneId: string, width: number) => void;
  loadInterstitial: (zoneId: string) => void;
  showInterstitial: () => void;
}

// Access native module
const HyBidBridge = NativeModules.HyBidBridge as HyBidBridgeInterface | undefined;

const APP_TOKEN = 'dde3c298b47648459f8ada4a982fa92d';
const ZONE_ID = '1';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [hyBidAvailable, setHyBidAvailable] = useState(false);

  // Initialize HyBid and load banner on mount
  useEffect(() => {
    if (HyBidBridge) {
      setHyBidAvailable(true);
      HyBidBridge.initialize(APP_TOKEN);
      HyBidBridge.loadBanner(ZONE_ID, 320);
    } else {
      console.warn('HyBidBridge native module is not available');
    }
  }, []);

  // Show interstitial ad after calculation
  const showAdAfterCalculation = () => {
    if (HyBidBridge) {
      HyBidBridge.loadInterstitial(ZONE_ID);
      setTimeout(() => {
        HyBidBridge.showInterstitial();
      }, 1000);
    }
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      let newValue: number;
      const currentValue = previousValue || 0;

      switch(operation) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '*': newValue = currentValue * inputValue; break;
        case '/': newValue = currentValue / inputValue; break;
        default: newValue = inputValue;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);

      if (nextOperation === '=') {
        showAdAfterCalculation();
      }
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  return (
    <View style={styles.container}>
      {/* Display */}
      <View style={styles.display}>
        <Text style={styles.displayText}>{display}</Text>
        {!hyBidAvailable && (
          <Text style={styles.warningText}>HyBid not available</Text>
        )}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {[
          ['C','7','8','/'],
          ['4','5','6','*'],
          ['1','2','3','-'],
          ['0','=','+']
        ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((item, colIndex) => {
              const isOperator = ['/', '*', '-', '+', '='].includes(item);
              const isZero = item === '0';
              return (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.button,
                    isOperator && styles.operator,
                    isZero && styles.zero
                  ]}
                  onPress={() => {
                    if (item === 'C') clearAll();
                    else if (isOperator) performOperation(item);
                    else inputDigit(item);
                  }}
                >
                  <Text style={[styles.buttonText, isOperator && styles.operatorText]}>{item}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </View>

      {/* Banner Ad Placeholder */}
      <View style={styles.bannerPlaceholder}>
        <Text style={styles.placeholderText}>
          {hyBidAvailable ? 'HyBid Banner Ad' : 'Banner Ad (HyBid not available)'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  display: {
    padding: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flex: 1,
  },
  displayText: {
    color: '#fff',
    fontSize: 60,
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
  },
  keypad: {
    flex: 3,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#333',
  },
  zero: {
    flex: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
  },
  operator: {
    backgroundColor: '#ff9500',
  },
  operatorText: {
    color: '#fff',
  },
  bannerPlaceholder: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginTop: 10,
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
  },
});

