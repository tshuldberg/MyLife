import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import {
  handleBarcodeScan,
  type BarcodeResult,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.nutrition;

export default function ScanScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const processingRef = useRef(false);

  const handleScan = useCallback(
    async (scanResult: BarcodeScanningResult) => {
      if (processingRef.current || !scanning) return;
      const barcode = scanResult.data;
      if (!barcode) return;

      processingRef.current = true;
      setScanning(false);

      try {
        const scanRes = await handleBarcodeScan(db, barcode);
        const barcodeResult = scanRes.result;
        setResult(barcodeResult);

        if (barcodeResult.found && barcodeResult.food) {
          // Navigate to search with the barcode pre-filled since food isn't in local DB yet
          router.push(`/(nutrition)/search`);
        } else {
          Alert.alert(
            'Not Found',
            `No food found for barcode ${barcode}. Would you like to search manually?`,
            [
              { text: 'Cancel', onPress: () => resetScanner() },
              {
                text: 'Search',
                onPress: () => router.push('/(nutrition)/search'),
              },
            ],
          );
        }
      } catch {
        Alert.alert('Error', 'Failed to look up barcode.');
        resetScanner();
      }
    },
    [db, router, scanning],
  );

  const resetScanner = () => {
    processingRef.current = false;
    setScanning(true);
    setResult(null);
  };

  const handleManualLookup = async () => {
    const barcode = manualInput.trim();
    if (!barcode) return;

    try {
      const scanRes = await handleBarcodeScan(db, barcode);
      setResult(scanRes.result);
      if (scanRes.result.found && scanRes.result.food) {
        router.push('/(nutrition)/search');
      } else {
        Alert.alert('Not Found', `No food found for barcode ${barcode}.`);
      }
    } catch {
      Alert.alert('Error', 'Failed to look up barcode.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Text variant="body" color={colors.textSecondary}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Text variant="body" color={colors.textSecondary}>
            Camera access is required to scan barcodes.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text variant="label" color={colors.background}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Camera view */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
          }}
          onBarcodeScanned={scanning ? handleScan : undefined}
        />
        {/* Scan overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanGuide} />
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusArea}>
        {scanning && (
          <Text variant="body" color={colors.textSecondary}>
            Point camera at a barcode
          </Text>
        )}
        {result?.found && (
          <Card>
            <Text variant="body" color={ACCENT}>
              Food found! Redirecting...
            </Text>
          </Card>
        )}
        {!scanning && !result?.found && (
          <Pressable style={styles.primaryButton} onPress={resetScanner}>
            <Text variant="label" color={colors.background}>Scan Again</Text>
          </Pressable>
        )}
      </View>

      {/* Manual entry */}
      <Card style={styles.manualCard}>
        <Text variant="caption" color={colors.textSecondary}>
          Or enter barcode manually:
        </Text>
        <View style={styles.manualRow}>
          <View style={styles.manualInputContainer}>
            <Text
              variant="body"
              color={manualInput ? colors.text : colors.textTertiary}
              onPress={() => {
                Alert.prompt?.(
                  'Enter Barcode',
                  'Type the barcode number',
                  (text: string) => setManualInput(text),
                  'plain-text',
                  manualInput,
                );
              }}
            >
              {manualInput || 'Tap to enter barcode'}
            </Text>
          </View>
          <Pressable style={styles.lookupButton} onPress={handleManualLookup}>
            <Text variant="caption" color={ACCENT}>Lookup</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  cameraContainer: {
    flex: 1,
    maxHeight: '50%',
    overflow: 'hidden',
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanGuide: {
    width: 250,
    height: 120,
    borderWidth: 2,
    borderColor: ACCENT,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  statusArea: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  manualCard: {
    margin: spacing.md,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  manualInputContainer: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lookupButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
});
