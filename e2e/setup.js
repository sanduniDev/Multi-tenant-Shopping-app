const { device } = require('detox');

beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    permissions: { photos: 'YES', camera: 'YES' },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});
