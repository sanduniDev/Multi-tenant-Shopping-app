/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      build:
        'npx expo run:ios --configuration Debug --device-name="iPhone 15"',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/BazaarX.app',
    },
    'ios.release': {
      type: 'ios.app',
      build:
        'npx expo run:ios --configuration Release --device-name="iPhone 15"',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/BazaarX.app',
    },
    'android.debug': {
      type: 'android.apk',
      build:
        process.platform === 'win32'
          ? 'cd android && .\\gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug'
          : 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
    'android.release': {
      type: 'android.apk',
      build:
        process.platform === 'win32'
          ? 'cd android && .\\gradlew.bat assembleRelease assembleAndroidTest -DtestBuildType=release'
          : 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*', // any attached device
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
  },
};
