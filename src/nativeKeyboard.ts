export function usesNativeKeyboard(device: { maxTouchPoints: number; userAgent: string }): boolean {
 return device.maxTouchPoints > 0 || /iPhone|iPad|iPod|Android/i.test(device.userAgent);
}
