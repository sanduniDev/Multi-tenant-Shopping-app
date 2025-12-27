describe('Sign Up Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Navigate to sign up screen
    await element(by.text('Sign Up')).tap();
    // Wait for sign up screen to load
    await waitFor(element(by.text('Join BazaarX today')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show sign up screen', async () => {
    // Check for unique subtitle instead of title (which has duplicates)
    await expect(element(by.text('Join BazaarX today'))).toBeVisible();
    await expect(element(by.id('fullname-input'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
  });

  it('should show validation errors for empty fields', async () => {
    // Try to sign up without filling fields using testID
    await new Promise(resolve => setTimeout(resolve, 1000));
    await element(by.id('create-account-button')).tap();

    // Wait a moment for React to update state and re-render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll to the top to see the first error (fullname is at the top of the form)
    await element(by.id('sign-up-scroll-view')).scrollTo('top');

    // Check that the fullname error is visible
    await waitFor(element(by.text('Full name is required')))
      .toBeVisible()
      .withTimeout(5000);
    await waitFor(element(by.text('Email is required')))
      .toBeVisible()
      .withTimeout(5000);
    await waitFor(element(by.text('Password is required')))
      .toBeVisible()
      .withTimeout(5000);
    await waitFor(element(by.text('Please confirm your password')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error for invalid email format', async () => {
    // Use replaceText without tap() to avoid keyboard interference
    await element(by.id('fullname-input')).replaceText('Test User');
    await element(by.id('email-input')).replaceText('invalidemail');
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('password123');

    // Dismiss keyboard before tapping button
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to make button visible
    await element(by.id('sign-up-scroll-view')).scrollTo('bottom');
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('create-account-button')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll to see the email error
    await element(by.id('sign-up-scroll-view')).scrollTo('top');

    // Wait for error with increased timeout
    await waitFor(element(by.text('Please enter a valid email')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error for short name', async () => {
    // Use replaceText without tap() to avoid keyboard interference
    await element(by.id('fullname-input')).replaceText('A');
    await element(by.id('email-input')).replaceText('test@example.com');
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('password123');

    // Dismiss keyboard before tapping button
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to make button visible
    await element(by.id('sign-up-scroll-view')).scrollTo('bottom');
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('create-account-button')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll to top to see the fullname error
    await element(by.id('sign-up-scroll-view')).scrollTo('top');

    // Wait for error with increased timeout
    await waitFor(element(by.text('Name must be at least 2 characters')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error for short password', async () => {
    // Don't use tap() before replaceText - it causes keyboard interference
    await element(by.id('fullname-input')).replaceText('Test User');
    await element(by.id('email-input')).replaceText('test@example.com');
    await element(by.id('password-input')).replaceText('12345');
    await element(by.id('confirm-password-input')).replaceText('12345');

    // Dismiss keyboard before tapping button
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to make button visible
    await element(by.id('sign-up-scroll-view')).scrollTo('bottom');
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('create-account-button')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down a bit to see the password error
    await element(by.id('sign-up-scroll-view')).scroll(100, 'down');

    // Wait for error with increased timeout
    await waitFor(element(by.text('Password must be at least 6 characters')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error for password mismatch', async () => {
    // Use replaceText without tap() to avoid keyboard interference
    await element(by.id('fullname-input')).replaceText('Test User');
    await element(by.id('email-input')).replaceText('test@example.com');
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('differentpassword');

    // Dismiss keyboard before tapping button
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to make button visible
    await element(by.id('sign-up-scroll-view')).scrollTo('bottom');
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('create-account-button')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to see the confirm password error
    await element(by.id('sign-up-scroll-view')).scroll(150, 'down');

    // Wait for error with increased timeout
    await waitFor(element(by.text('Passwords do not match')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate back to sign in screen', async () => {
    // Wait for Sign In link to be visible and tap it
    await waitFor(element(by.text('Sign In')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Sign In')).tap();

    // Verify we're on sign in screen
    await waitFor(element(by.text('Welcome Back!')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Sign in to continue shopping'))).toBeVisible();
  });

  // This test will attempt to create a new account
  it('should successfully create account with valid data', async () => {
    // Generate unique email
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    // Use replaceText without tap() to avoid keyboard interference
    await element(by.id('fullname-input')).replaceText('Test User');
    await element(by.id('email-input')).replaceText(email);
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('password123');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to make button visible
    await element(by.id('sign-up-scroll-view')).scrollTo('bottom');
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('create-account-button')).tap();

    // Should redirect to sign in screen
    await waitFor(element(by.text('Welcome Back!')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it.skip('should show error for existing email', async () => {
    // Try to sign up with an email that already exists
    // Use replaceText without tap() to avoid keyboard interference
    await element(by.id('fullname-input')).replaceText('Test User');
    await element(by.id('email-input')).replaceText('testuser@example.com');
    await element(by.id('password-input')).replaceText('testpassword123');
    await element(by.id('confirm-password-input')).replaceText('testpassword123');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll down to make button visible
    await element(by.id('sign-up-scroll-view')).scrollTo('bottom');
    await new Promise(resolve => setTimeout(resolve, 300));

    await element(by.id('create-account-button')).tap();

    // Wait for error toast
    await waitFor(
      element(by.text(/already (registered|exists)/i).withAncestor(by.id('toast-container')))
    )
      .toBeVisible()
      .withTimeout(15000);
  });
});
