import { Accelerometer } from "expo-sensors";
import { AccelerometerMeasurement } from "expo-sensors/build/Accelerometer";
import { useEffect, useCallback, useRef } from "react";

export const useShakeEffect = (
  onShakeCallback: () => void,
  thresholdInG: number = 150,
  diffTimeLimitInMs: number = 100
) => {
  const lastRef = useRef<AccelerometerMeasurement>({ x: 0, y: 0, z: 0 });
  const lastUpdateRef = useRef(0);

  const handler = useCallback(
    ({ x, y, z }: AccelerometerMeasurement) => {
      const currTime = Date.now();
      if (currTime - lastUpdateRef.current > diffTimeLimitInMs) {
        const diffTime = currTime - lastUpdateRef.current;
        lastUpdateRef.current = currTime;

        const delta =
          (Math.abs(
            x +
              y +
              z -
              lastRef.current.x -
              lastRef.current.y -
              lastRef.current.z
          ) /
            diffTime) *
          10000;

        if (delta > thresholdInG) {
          onShakeCallback();
        }
        lastRef.current = { x, y, z };
      }
    },
    [onShakeCallback, thresholdInG, diffTimeLimitInMs]
  );
  useEffect(() => {
    const subscription = Accelerometer.addListener(handler);
    return () => subscription.remove();
  }, [handler]);
};
