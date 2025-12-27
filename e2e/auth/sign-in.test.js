describe('Sign In Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show sign in screen on launch', async () => {
    await expect(element(by.text('Welcome Back!'))).toBeVisible();
    await expect(element(by.text('Sign in to continue shopping'))).toBeVisible();
  });

  it('should show validation errors for empty fields', async () => {
    // Try to sign in without filling fields
    await element(by.id('sign-in-button')).tap();

    // Wait for React to update state
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll to top to see the email error
    await element(by.id('sign-in-scroll-view')).scrollTo('top');

    // Wait for error messages with increased timeout for emulator
    await waitFor(element(by.text('Email is required')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error for invalid email format', async () => {
    // Enter invalid email using testID
    await element(by.id('email-input')).typeText('invalidemail');
    await element(by.id('password-input')).typeText('password123');

    // Dismiss keyboard before tapping button to ensure visibility
    await element(by.id('password-input')).tapReturnKey();
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('sign-in-button')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll to top to see the email error
    await element(by.id('sign-in-scroll-view')).scrollTo('top');

    // Check for validation error with increased timeout
    await waitFor(element(by.text('Please enter a valid email')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error toast for incorrect credentials', async () => {
    // Enter credentials
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');

    // Dismiss keyboard before tapping button
    await element(by.id('password-input')).tapReturnKey();
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('sign-in-button')).tap();

    // Wait for error toast - Supabase returns "Invalid login credentials"
    await waitFor(element(by.text('Invalid login credentials')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('should navigate to sign up screen', async () => {
    // Tap sign up link
    await element(by.text('Sign Up')).tap();

    // Verify we're on sign up screen by checking for unique subtitle
    await waitFor(element(by.text('Join BazaarX today')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to forgot password screen', async () => {
    // Wait for the forgot password link to be visible and tap it
    await waitFor(element(by.id('forgot-password-link')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('forgot-password-link')).tap();

    // Verify we're on forgot password screen
    await waitFor(element(by.text('Reset Password')))
      .toBeVisible()
      .withTimeout(5000);
  });

  // This test requires a valid test account with completed role and profile
  it('should successfully sign in with valid credentials', async () => {
    // Enter valid credentials
    // Use replaceText to bypass keyboard issues (Detox Android bug adds phantom chars with typeText)
    await element(by.id('email-input')).tap();
    await element(by.id('email-input')).replaceText('testuser@example.com');

    await element(by.id('password-input')).tap();
    await element(by.id('password-input')).replaceText('testpassword123');

    // Dismiss keyboard
    await device.pressBack();
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('sign-in-button')).tap();

    // Verify navigation to home screen - shows "Welcome back," greeting
    // Note: Toast "Welcome back!" only shows for 2 seconds, too fast to reliably catch
    await waitFor(element(by.text('Welcome back,')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
