# Multi-Tenant Marketplace App - Development Plan

## Project Overview

**Tech Stack:**
- Frontend: Expo React Native with TypeScript
- Backend: Supabase (Auth, Database, Storage, Realtime)
- Payment: Stripe
- Testing: Detox (E2E), Jest (Unit tests)
- State Management: Zustand
- Navigation: React Navigation
- Styling: NativeWind (Tailwind for React Native)

**App Type:** Multi-tenant marketplace with dual roles (Buyer/Seller)

---

## Stage 1: Project Foundation & Authentication

### Objective
Setup project infrastructure with complete authentication system and testing framework.

### Tasks

#### 1.1 Project Initialization
- Create new Expo project: `npx create-expo-app marketplace-app --template`
- Configure TypeScript
- Install core dependencies:
  ```bash
  npx expo install react-native-safe-area-context react-native-screens
  npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
  npm install @supabase/supabase-js @react-native-async-storage/async-storage
  npm install react-native-url-polyfill
  npm install zustand
  npm install nativewind
  npm install tailwindcss
  ```

#### 1.2 Project Structure
Create the following folder structure:
```
src/
├── components/
│   ├── common/
│   └── auth/
├── screens/
│   ├── auth/
│   ├── buyer/
│   └── seller/
├── navigation/
├── services/
│   └── supabase.ts
├── store/
│   └── authStore.ts
├── types/
│   └── index.ts
├── utils/
└── constants/
```

#### 1.3 Supabase Configuration
- Create Supabase project at supabase.com
- Create `.env` file:
  ```
  SUPABASE_URL=your_supabase_url
  SUPABASE_ANON_KEY=your_anon_key
  ```
- Setup Supabase client in `src/services/supabase.ts`

#### 1.4 Authentication Screens
Create the following screens:
- **SignInScreen**: Email/password login
- **SignUpScreen**: Registration with email verification
- **ForgotPasswordScreen**: Password reset flow
- **RoleSelectionScreen**: Choose Buyer or Seller role after signup
- **ProfileSetupScreen**: Complete profile information

#### 1.5 Auth State Management
- Create Zustand store for authentication state
- Implement session persistence
- Handle token refresh
- Create auth context/hooks

#### 1.6 Navigation Setup
- Create authentication stack (SignIn, SignUp, ForgotPassword)
- Create main app stack (will be expanded in later stages)
- Implement conditional navigation based on auth state

#### 1.7 Detox Setup
- Install Detox:
  ```bash
  npm install detox --save-dev
  npx detox init
  ```
- Configure `detox.config.js` for iOS and Android
- Create `e2e/` folder with test structure
- Write authentication flow tests:
  - Sign up flow
  - Sign in flow
  - Password reset flow
  - Role selection flow

### Deliverables
- ✅ Expo project with TypeScript configured
- ✅ Supabase integration working
- ✅ Complete authentication flow (Sign Up, Sign In, Password Reset)
- ✅ Role selection functionality
- ✅ Detox configured and auth tests passing
- ✅ Basic navigation structure

### Testing Checklist
- [ ] User can sign up with email
- [ ] Email verification works
- [ ] User can sign in
- [ ] Password reset flow works
- [ ] User can select role (Buyer/Seller)
- [ ] Session persists on app restart
- [ ] All Detox tests pass

---

## Stage 2: Database Schema & User Profiles

### Objective
Design complete database schema with RLS policies and implement user profile management.

### Tasks

#### 2.1 Database Schema Design
Create the following tables in Supabase:

**profiles table:**
```sql
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**user_roles table:**
```sql
create table user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  role text check (role in ('buyer', 'seller')),
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
```

**categories table:**
```sql
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  created_at timestamp with time zone default now()
);
```

**products table:**
```sql
create table products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references auth.users not null,
  title text not null,
  description text,
  price decimal(10,2) not null,
  category_id uuid references categories,
  inventory_count integer default 0,
  images text[],
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**orders table:**
```sql
create table orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references auth.users not null,
  total_amount decimal(10,2) not null,
  status text check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**order_items table:**
```sql
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders not null,
  product_id uuid references products not null,
  seller_id uuid references auth.users not null,
  quantity integer not null,
  price decimal(10,2) not null,
  created_at timestamp with time zone default now()
);
```

**reviews table:**
```sql
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products not null,
  buyer_id uuid references auth.users not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now(),
  unique(product_id, buyer_id)
);
```

**cart_items table:**
```sql
create table cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products not null,
  quantity integer not null default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, product_id)
);
```

**wishlists table:**
```sql
create table wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products not null,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);
```

**conversations table:**
```sql
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references auth.users not null,
  seller_id uuid references auth.users not null,
  product_id uuid references products,
  last_message_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(buyer_id, seller_id, product_id)
);
```

**messages table:**
```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations not null,
  sender_id uuid references auth.users not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);
```

**coupons table:**
```sql
create table coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percentage', 'fixed')),
  discount_value decimal(10,2) not null,
  min_purchase_amount decimal(10,2),
  max_discount_amount decimal(10,2),
  usage_limit integer,
  used_count integer default 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
```

**addresses table:**
```sql
create table addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);
```

#### 2.2 Row Level Security (RLS) Policies
Enable RLS and create policies for each table:

**Example RLS policies:**
```sql
-- Profiles: Users can read all, update own
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Products: Anyone can read active products, sellers can manage their own
alter table products enable row level security;

create policy "Active products are viewable by everyone"
  on products for select using (is_active = true);

create policy "Sellers can create products"
  on products for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own products"
  on products for update using (auth.uid() = seller_id);

create policy "Sellers can delete own products"
  on products for delete using (auth.uid() = seller_id);

-- Orders: Buyers see their orders, sellers see orders containing their products
alter table orders enable row level security;

create policy "Buyers can view own orders"
  on orders for select using (auth.uid() = buyer_id);

create policy "Buyers can create orders"
  on orders for insert with check (auth.uid() = buyer_id);
```

#### 2.3 Storage Buckets
Create storage buckets:
- `avatars` - User profile pictures
- `products` - Product images
- Configure public access policies

#### 2.4 Profile Management Screens
Create the following screens:
- **ProfileScreen**: Display user profile information
- **EditProfileScreen**: Edit profile details with avatar upload
- **RoleSwitchScreen**: Switch between Buyer and Seller roles

#### 2.5 Profile Services
Create services in `src/services/`:
- `profileService.ts`: Profile CRUD operations
- `storageService.ts`: Image upload/download utilities

#### 2.6 Multi-Role Support
- Implement role switching functionality
- Store active role in Zustand store
- Update navigation based on active role

#### 2.7 Detox Tests
Write tests for:
- Profile viewing
- Profile editing
- Avatar upload
- Role switching

### Deliverables
- ✅ Complete database schema created
- ✅ RLS policies implemented
- ✅ Storage buckets configured
- ✅ Profile management screens
- ✅ Multi-role switching functionality
- ✅ Detox tests for profile features

### Testing Checklist
- [ ] All database tables created successfully
- [ ] RLS policies prevent unauthorized access
- [ ] User can view profile
- [ ] User can edit profile
- [ ] User can upload avatar
- [ ] User can switch between Buyer/Seller roles
- [ ] Navigation updates based on active role
- [ ] All Detox tests pass

---

## Stage 3: Product Management (Seller Side)

### Objective
Enable sellers to create, edit, delete, and manage their product inventory.

### Tasks

#### 3.1 Seller Dashboard
Create `SellerDashboardScreen` with:
- Overview statistics (total products, active listings, pending orders)
- Quick action buttons (Add Product, View Orders, Analytics)
- Recent activity feed

#### 3.2 Product Listing Screen
Create `SellerProductsScreen`:
- Display all seller's products in a list
- Show product image, title, price, inventory status
- Filter options (Active, Inactive, Out of Stock)
- Search functionality
- Pull to refresh

#### 3.3 Add Product Screen
Create `AddProductScreen` with form fields:
- Product title (required)
- Description (multiline)
- Price (numeric input)
- Category selector
- Inventory count
- Multiple image upload (up to 5 images)
- Image preview with reordering
- Active/Inactive toggle
- Save button with validation

#### 3.4 Edit Product Screen
Create `EditProductScreen`:
- Pre-populate form with existing product data
- Same fields as Add Product
- Update functionality
- Delete product option (with confirmation)

#### 3.5 Image Upload Component
Create reusable `ImageUploadComponent`:
- Use `expo-image-picker`
- Support multiple image selection
- Image compression
- Upload to Supabase Storage
- Progress indicator
- Error handling

#### 3.6 Product Services
Create `src/services/productService.ts`:
```typescript
// Functions to implement:
- createProduct(productData)
- updateProduct(productId, productData)
- deleteProduct(productId)
- getSellerProducts(sellerId)
- uploadProductImages(images)
- deleteProductImage(imageUrl)
```

#### 3.7 Product Store
Create `src/store/productStore.ts` with Zustand:
- Manage product list state
- Handle loading states
- Cache product data
- Optimistic updates

#### 3.8 Form Validation
- Implement validation for product form
- Required field checks
- Price validation (positive numbers)
- Inventory validation
- Image count limits

#### 3.9 Detox Tests
Create `e2e/seller-products.test.js`:
- Test product creation flow
- Test product editing
- Test product deletion
- Test image upload
- Test form validation
- Test search and filter

### Deliverables
- ✅ Seller dashboard with statistics
- ✅ Product listing screen
- ✅ Complete product CRUD functionality
- ✅ Multi-image upload with preview
- ✅ Form validation
- ✅ Detox tests for all seller product features

### Testing Checklist
- [ ] Seller can view all their products
- [ ] Seller can create new product with images
- [ ] Seller can edit existing product
- [ ] Seller can delete product
- [ ] Form validation works correctly
- [ ] Images upload to Supabase Storage
- [ ] Product status can be toggled (active/inactive)
- [ ] Search and filter work correctly
- [ ] All Detox tests pass

---

## Stage 4: Product Browsing (Buyer Side)

### Objective
Enable buyers to browse, search, filter, and view product details.

### Tasks

#### 4.1 Home Screen
Create `BuyerHomeScreen`:
- Featured products section
- Category cards
- Popular products
- Recently added products
- Search bar at top

#### 4.2 Product Grid/List Component
Create `ProductGrid` and `ProductList` components:
- Product image
- Product title
- Price
- Rating display
- Seller name
- Add to cart button
- Wishlist icon
- View toggle (grid/list)

#### 4.3 Product Browse Screen
Create `ProductBrowseScreen`:
- Display all products
- Grid/List view toggle
- Sort options dropdown (Price: Low to High, High to Low, Newest, Most Popular)
- Filter button (opens filter modal)
- Pagination or infinite scroll
- Pull to refresh

#### 4.4 Search Functionality
Create `ProductSearchScreen`:
- Search input with debounce
- Search suggestions
- Recent searches
- Search results with same grid/list view
- Empty state for no results

#### 4.5 Filter Modal
Create `FilterModal` component:
- Category filter (checkboxes)
- Price range slider
- Rating filter (4+ stars, 3+ stars, etc.)
- Availability filter (In Stock only)
- Apply and Reset buttons
- Show result count

#### 4.6 Product Details Screen
Create `ProductDetailsScreen`:
- Image carousel (swipeable)
- Product title
- Price
- Rating and review count
- Seller information (name, avatar, ratings)
- "Contact Seller" button
- Description
- Category
- Stock availability
- Add to Cart button
- Add to Wishlist button
- Reviews section (show first 3, "See all" button)
- Related products section

#### 4.7 Category Screen
Create `CategoryScreen`:
- Display products by category
- Same grid/list view as browse
- Category name in header

#### 4.8 Browse Services
Create `src/services/browseService.ts`:
```typescript
// Functions to implement:
- getProducts(filters, sort, page)
- searchProducts(query, filters)
- getProductById(productId)
- getProductsByCategory(categoryId)
- getFeaturedProducts()
- getPopularProducts()
- getRelatedProducts(productId)
```

#### 4.9 Browse Store
Create `src/store/browseStore.ts`:
- Manage product browse state
- Store filter and sort preferences
- Cache product data
- Manage pagination state

#### 4.10 Detox Tests
Create `e2e/buyer-browse.test.js`:
- Test product browsing
- Test view switching (grid/list)
- Test search functionality
- Test filtering
- Test sorting
- Test product details navigation
- Test pagination

### Deliverables
- ✅ Home screen with featured products
- ✅ Product browsing with grid/list views
- ✅ Search functionality with debounce
- ✅ Advanced filtering system
- ✅ Sort functionality
- ✅ Complete product details screen
- ✅ Category browsing
- ✅ Detox tests for browsing features

### Testing Checklist
- [ ] Buyer can browse all products
- [ ] Grid/List view toggle works
- [ ] Search returns relevant results
- [ ] Filters work correctly (category, price, rating)
- [ ] Sort options work correctly
- [ ] Product details display correctly
- [ ] Image carousel is swipeable
- [ ] Related products load
- [ ] Pagination/infinite scroll works
- [ ] All Detox tests pass

---

## Stage 5: Shopping Cart & Wishlist

### Objective
Implement fully functional shopping cart and wishlist features with persistence.

### Tasks

#### 5.1 Cart Store
Create `src/store/cartStore.ts` with Zustand:
```typescript
// State and actions:
- cartItems: CartItem[]
- addToCart(product, quantity)
- removeFromCart(itemId)
- updateQuantity(itemId, quantity)
- clearCart()
- getCartTotal()
- getCartItemCount()
- syncWithServer()
```

#### 5.2 Cart Screen
Create `CartScreen`:
- List of cart items
- Each item shows: image, title, price, quantity, subtotal
- Quantity controls (+/- buttons)
- Remove item button
- "Save for Later" button
- Subtotal display
- "Continue Shopping" button
- "Proceed to Checkout" button
- Empty cart state

#### 5.3 Cart Item Component
Create `CartItemComponent`:
- Product thumbnail
- Product title and description
- Seller name
- Price per unit
- Quantity selector with min/max validation
- Remove button
- Save for Later button
- Stock availability check

#### 5.4 Cart Badge
Create `CartBadge` component:
- Display cart item count on tab bar icon
- Update in real-time

#### 5.5 Wishlist Store
Create `src/store/wishlistStore.ts`:
```typescript
// State and actions:
- wishlistItems: Product[]
- addToWishlist(product)
- removeFromWishlist(productId)
- isInWishlist(productId)
- moveToCart(productId)
- syncWithServer()
```

#### 5.6 Wishlist Screen
Create `WishlistScreen`:
- Grid view of wishlist products
- Same product card as browse screen
- "Add to Cart" button on each item
- "Remove from Wishlist" button
- Empty state with CTA
- Share wishlist option (future)

#### 5.7 Save for Later Feature
- Separate section in cart for "Saved for Later" items
- Move items between cart and saved list
- Persist in Supabase

#### 5.8 Cart Services
Create `src/services/cartService.ts`:
```typescript
// Functions to implement:
- getCart(userId)
- addToCart(userId, productId, quantity)
- updateCartItem(cartItemId, quantity)
- removeFromCart(cartItemId)
- clearCart(userId)
- validateCartItems(cartItems) // Check stock availability
```

#### 5.9 Wishlist Services
Create `src/services/wishlistService.ts`:
```typescript
// Functions to implement:
- getWishlist(userId)
- addToWishlist(userId, productId)
- removeFromWishlist(userId, productId)
- checkIfInWishlist(userId, productId)
```

#### 5.10 Cart Persistence
- Sync cart with Supabase on changes
- Load cart from server on app start
- Handle offline scenarios (queue actions)
- Merge cart on login

#### 5.11 Stock Validation
- Check product availability before checkout
- Show out-of-stock warnings
- Update cart if stock changed
- Disable checkout if items unavailable

#### 5.12 Detox Tests
Create `e2e/cart-wishlist.test.js`:
- Test adding product to cart
- Test updating quantity
- Test removing from cart
- Test cart persistence
- Test save for later
- Test wishlist operations
- Test moving wishlist to cart
- Test stock validation

### Deliverables
- ✅ Fully functional shopping cart
- ✅ Wishlist feature
- ✅ Save for Later functionality
- ✅ Cart persistence with Supabase
- ✅ Stock validation
- ✅ Cart badge with item count
- ✅ Detox tests for cart and wishlist

### Testing Checklist
- [ ] User can add products to cart
- [ ] User can update quantities
- [ ] User can remove items from cart
- [ ] Cart total calculates correctly
- [ ] Cart persists across sessions
- [ ] User can add/remove from wishlist
- [ ] User can move wishlist items to cart
- [ ] Save for Later works correctly
- [ ] Stock validation prevents overselling
- [ ] Cart badge updates in real-time
- [ ] All Detox tests pass

---

## Stage 6: Checkout Flow & Address Management

### Objective
Implement complete checkout process from cart to order confirmation (excluding payment).

### Tasks

#### 6.1 Address Management
Create `AddressesScreen`:
- List all saved addresses
- Default address highlighted
- Add new address button
- Edit/Delete options for each address
- Set as default option

Create `AddAddressScreen`:
- Form fields: Full Name, Phone, Address Line 1, Line 2, City, State, Postal Code, Country
- Set as default checkbox
- Save button with validation
- Use current location option (optional)

#### 6.2 Address Services
Create `src/services/addressService.ts`:
```typescript
// Functions to implement:
- getAddresses(userId)
- addAddress(addressData)
- updateAddress(addressId, addressData)
- deleteAddress(addressId)
- setDefaultAddress(addressId)
- getDefaultAddress(userId)
```

#### 6.3 Checkout Flow Navigation
Create checkout stack navigation:
1. Cart Screen (entry point)
2. Select Address Screen
3. Order Summary Screen
4. Payment Screen (Stage 7)
5. Order Confirmation Screen

#### 6.4 Select Address Screen
Create `SelectAddressScreen`:
- List saved addresses as selectable cards
- Show default address pre-selected
- "Add New Address" button
- "Continue" button
- Selected address highlighted

#### 6.5 Order Summary Screen
Create `OrderSummaryScreen`:
- Shipping address section (editable)
- Order items list (non-editable)
- Pricing breakdown:
  - Subtotal
  - Shipping charges
  - Tax (if applicable)
  - Discount (if coupon applied)
  - Total
- Coupon code section
- Terms and conditions checkbox
- "Proceed to Payment" button

#### 6.6 Coupon System
Create `CouponSection` component:
- Coupon code input field
- "Apply" button
- Display applied coupon with discount
- "Remove" button for applied coupon
- Error messages for invalid coupons

Create `src/services/couponService.ts`:
```typescript
// Functions to implement:
- validateCoupon(code, cartTotal)
- applyCoupon(code, orderId)
- calculateDiscount(coupon, subtotal)
- getCouponDetails(code)
```

#### 6.7 Order Confirmation Screen (UI Only)
Create `OrderConfirmationScreen`:
- Success animation/icon
- Order number
- Estimated delivery date
- Order summary
- "Track Order" button
- "Continue Shopping" button
- "View Order Details" button

#### 6.8 Checkout Store
Create `src/store/checkoutStore.ts`:
```typescript
// State and actions:
- selectedAddress: Address | null
- appliedCoupon: Coupon | null
- orderSummary: OrderSummary
- setAddress(address)
- applyCoupon(coupon)
- removeCoupon()
- calculateTotal()
- createOrder() // Placeholder for Stage 7
```

#### 6.9 Order Calculation Logic
Create `src/utils/orderCalculations.ts`:
- Calculate subtotal from cart items
- Calculate shipping charges (flat rate or based on weight)
- Calculate tax (if applicable)
- Apply coupon discount
- Calculate final total

#### 6.10 Form Validation
- Validate address fields (required fields, postal code format, phone format)
- Validate coupon code format
- Enable/disable buttons based on validation

#### 6.11 Detox Tests
Create `e2e/checkout.test.js`:
- Test address management (add, edit, delete, set default)
- Test complete checkout flow
- Test address selection
- Test coupon application
- Test coupon removal
- Test order summary calculations
- Test navigation through checkout

### Deliverables
- ✅ Complete address management system
- ✅ Checkout flow navigation
- ✅ Address selection functionality
- ✅ Order summary with pricing breakdown
- ✅ Coupon code system
- ✅ Order confirmation screen UI
- ✅ Detox tests for checkout flow

### Testing Checklist
- [ ] User can add/edit/delete addresses
- [ ] User can set default address
- [ ] User can select address during checkout
- [ ] Order summary displays correctly
- [ ] Pricing calculations are accurate
- [ ] User can apply valid coupon codes
- [ ] Invalid coupons show error messages
- [ ] Coupon discount calculates correctly
- [ ] Checkout flow navigation works smoothly
- [ ] All Detox tests pass

---

## Stage 7: Stripe Payment Integration

### Objective
Integrate Stripe payment processing with secure checkout flow.

### Tasks

#### 7.1 Stripe Setup
- Create Stripe account
- Get API keys (test mode and production)
- Add keys to `.env`:
  ```
  STRIPE_PUBLISHABLE_KEY=pk_test_xxx
  STRIPE_SECRET_KEY=sk_test_xxx
  ```

#### 7.2 Install Dependencies
```bash
npm install @stripe/stripe-react-native
npx expo install expo-crypto
```

#### 7.3 Supabase Edge Functions
Create Edge Functions for secure payment processing:

**Create `create-payment-intent` function:**
```typescript
// supabase/functions/create-payment-intent/index.ts
import Stripe from 'stripe'

// This function creates a payment intent with Stripe
// Input: { amount, currency, customerId, orderId }
// Output: { clientSecret, paymentIntentId }
```

**Create `confirm-payment` function:**
```typescript
// supabase/functions/confirm-payment/index.ts
// This function confirms payment and creates order
// Input: { paymentIntentId, orderId, orderData }
// Output: { success, order }
```

**Create `webhook-handler` function:**
```typescript
// supabase/functions/stripe-webhook/index.ts
// Handle Stripe webhooks for payment status updates
// Events: payment_intent.succeeded, payment_intent.failed
```

Deploy Edge Functions:
```bash
supabase functions deploy create-payment-intent
supabase functions deploy confirm-payment
supabase functions deploy stripe-webhook
```

#### 7.4 Payment Screen
Create `PaymentScreen`:
- Display order total
- Payment method selection (Card payment)
- Stripe CardField component
- "Pay Now" button
- Loading state during processing
- Error handling display

#### 7.5 Stripe Provider Setup
Setup Stripe provider in `App.tsx`:
```typescript
import { StripeProvider } from '@stripe/stripe-react-native'

// Wrap app with StripeProvider
```

#### 7.6 Payment Service
Create `src/services/paymentService.ts`:
```typescript
// Functions to implement:
- createPaymentIntent(amount, currency, metadata)
- confirmPayment(paymentIntentId, orderData)
- handlePaymentSuccess(paymentIntent)
- handlePaymentFailure(error)
```

#### 7.7 Order Creation Logic
Update `src/services/orderService.ts`:
```typescript
// Functions to implement:
- createOrder(orderData)
- updateOrderStatus(orderId, status)
- getOrderById(orderId)
- assignOrderToSellers(orderId, items) // Split order by seller
```

#### 7.8 Payment Flow Implementation
1. User clicks "Proceed to Payment" on Order Summary
2. Navigate to Payment Screen
3. Create payment intent via Edge Function
4. Display Stripe CardField
5. User enters card details
6. Confirm payment with Stripe
7. On success, create order in database
8. Clear cart
9. Navigate to Order Confirmation
10. On failure, show error and allow retry

#### 7.9 Order Splitting by Seller
- When order is created, split into separate order_items by seller
- Each seller only sees their portion of the order
- Buyer sees complete order

#### 7.10 Payment Error Handling
- Handle network errors
- Handle card declined errors
- Handle insufficient funds
- Handle authentication required (3D Secure)
- Retry logic
- User-friendly error messages

#### 7.11 Test Payment Integration
- Use Stripe test cards:
  - Success: 4242 4242 4242 4242
  - Decline: 4000 0000 0000 0002
  - 3D Secure: 4000 0027 6000 3184

#### 7.12 Security Considerations
- Never store card details in app
- Use Stripe's secure card field
- Validate amounts on server (Edge Function)
- Prevent duplicate payments
- Log payment attempts

#### 7.13 Detox Tests
Create `e2e/payment.test.js`:
- Test payment flow with test card
- Test successful payment
- Test declined card
- Test order creation after payment
- Test cart clearing after payment
- Test error handling

### Deliverables
- ✅ Stripe integrated with Expo app
- ✅ Supabase Edge Functions for payment processing
- ✅ Secure payment flow
- ✅ Order creation after successful payment
- ✅ Order splitting by seller
- ✅ Payment error handling
- ✅ Webhook handler for payment events
- ✅ Detox tests for payment flow

### Testing Checklist
- [ ] Stripe provider initialized correctly
- [ ] Payment intent created successfully
- [ ] Card field displays correctly
- [ ] Test card payment succeeds
- [ ] Order created after successful payment
- [ ] Order items split by seller
- [ ] Cart cleared after payment
- [ ] Payment errors handled gracefully
- [ ] Webhooks process correctly
- [ ] 3D Secure flow works
- [ ] All Detox tests pass

---

## Stage 8: Order Management System

### Objective
Implement comprehensive order tracking and management for buyers and sellers.

### Tasks

#### 8.1 Buyer Order History Screen
Create `OrderHistoryScreen` (Buyer):
- List all orders in reverse chronological order
- Each order card shows:
  - Order number
  - Order date
  - Total amount
  - Order status badge
  - Number of items
  - Thumbnail of first product
- Filter by status (All, Pending, Shipped, Delivered, Cancelled)
- Search by order number or product name
- Pull to refresh
- Empty state

#### 8.2 Buyer Order Details Screen
Create `OrderDetailsScreen` (Buyer):
- Order number and date
- Order status timeline (visual progress indicator)
- Shipping address
- Payment method
- Order items list with images, names, quantities, prices
- Subtotal, tax, shipping, discount, total
- "Track Order" button (if shipped)
- "Contact Seller" button for each item
- "Leave Review" button (if delivered and not reviewed)
- "Cancel Order" button (if pending)
- "Reorder" button

#### 8.3 Seller Order Management Screen
Create `SellerOrdersScreen`:
- Tabs: All, New, Processing, Shipped, Delivered, Cancelled
- Each order shows:
  - Order item details (only seller's products)
  - Buyer information
  - Order date
  - Status
  - Amount earned
- Quick action buttons (Update Status, Contact Buyer)
- Filter and search options
- Pull to refresh

#### 8.4 Seller Order Details Screen
Create `SellerOrderDetailsScreen`:
- Order item details (only seller's products from the order)
- Buyer information (name, phone, address)
- Order status
- Payment status
- Amount to be received
- "Update Order Status" button
- Status update options: Processing → Shipped → Delivered
- "Contact Buyer" button
- Order timeline

#### 8.5 Order Status Management
Create `UpdateOrderStatusModal`:
- Current status display
- Next status options (dropdown)
- Tracking number input (for shipped status)
- Estimated delivery date picker
- Notes field (optional)
- Confirm button

#### 8.6 Order Services
Create `src/services/orderService.ts`:
```typescript
// Functions to implement:
// Buyer functions:
- getBuyerOrders(userId)
- getOrderDetails(orderId)
- cancelOrder(orderId, reason)
- reorder(orderId)
- trackOrder(orderId)

// Seller functions:
- getSellerOrders(sellerId, status)
- getSellerOrderDetails(orderId, sellerId)
- updateOrderStatus(orderItemId, status, trackingInfo)
- getOrderStatistics(sellerId)
```

#### 8.7 Order Store
Create `src/store/orderStore.ts`:
```typescript
// State and actions:
// Buyer state:
- buyerOrders: Order[]
- selectedOrder: Order | null

// Seller state:
- sellerOrders: Order[]
- orderStats: OrderStats

// Actions:
- fetchBuyerOrders()
- fetchSellerOrders(status)
- updateOrderStatus(orderId, status)
- cancelOrder(orderId)
```

#### 8.8 Order Status Timeline Component
Create `OrderStatusTimeline` component:
- Visual timeline showing order progression
- Statuses: Placed → Processing → Shipped → Delivered
- Completed steps highlighted in color
- Current step animated
- Timestamps for each completed step

#### 8.9 Order Notifications
Setup notification system (using Supabase Realtime or database triggers):
- Notify buyer when order status changes
- Notify seller when new order received
- Store notifications in database for persistence

#### 8.10 Cancel Order Logic
- Allow cancellation only if status is "pending" or "processing"
- Update order status to "cancelled"
- Optionally refund payment (requires Stripe refund API)
- Notify seller of cancellation
- Restore inventory count

#### 8.11 Reorder Functionality
- Fetch order items from previous order
- Check product availability
- Add available items to cart
- Navigate to cart
- Show message if items unavailable

#### 8.12 Order Search and Filter
- Search orders by order number, product name
- Filter by status, date range
- Sort by date, amount

#### 8.13 Detox Tests
Create `e2e/orders.test.js`:
- Test buyer viewing order history
- Test buyer viewing order details
- Test buyer canceling order
- Test reorder functionality
- Test seller viewing orders
- Test seller updating order status
- Test order search and filter
- Test order timeline display

### Deliverables
- ✅ Buyer order history and details screens
- ✅ Seller order management screens
- ✅ Order status update functionality
- ✅ Order timeline visualization
- ✅ Cancel and reorder features
- ✅ Order search and filter
- ✅ Order notifications
- ✅ Detox tests for order management

### Testing Checklist
- [ ] Buyer can view all orders
- [ ] Buyer can view order details
- [ ] Order timeline displays correctly
- [ ] Buyer can cancel pending orders
- [ ] Buyer can reorder from history
- [ ] Seller can view orders containing their products
- [ ] Seller can update order status
- [ ] Order status updates notify buyer
- [ ] Search and filter work correctly
- [ ] Inventory restored on cancellation
- [ ] All Detox tests pass

---

## Stage 9: Reviews & Ratings System

### Objective
Implement product review and rating functionality for buyers and display for all users.

### Tasks

#### 9.1 Review Submission Screen
Create `WriteReviewScreen`:
- Product information at top (image, name)
- Star rating selector (1-5 stars)
- Review text area (multiline, min 10 chars)
- Photo upload option (up to 3 photos)
- Submit button
- Character count indicator
- Form validation

#### 9.2 Reviews List Component
Create `ReviewsList` component:
- Display all reviews for a product
- Each review shows:
  - Reviewer name (or Anonymous)
  - Profile picture
  - Star rating
  - Review date
  - Review text
  - Review photos (if any)
  - Helpful count (optional: "Was this helpful?" buttons)
- Sort options: Most Recent, Highest Rating, Lowest Rating, Most Helpful
- Load more / pagination

#### 9.3 Product Rating Summary Component
Create `RatingSummary` component:
- Overall average rating (large, prominent)
- Total number of reviews
- Rating breakdown (5 stars: X%, 4 stars: X%, etc.)
- Visual bar chart for each rating
- "Write a Review" button

#### 9.4 Review Services
Create `src/services/reviewService.ts`:
```typescript
// Functions to implement:
- createReview(productId, userId, rating, comment, photos)
- getProductReviews(productId, sortBy, page)
- getUserReviews(userId)
- updateReview(reviewId, data)
- deleteReview(reviewId)
- checkIfUserReviewed(userId, productId)
- calculateProductRating(productId)
- markReviewHelpful(reviewId, userId)
```

#### 9.5 Review Eligibility Check
- User can only review products they purchased
- One review per product per user
- Review can be submitted after order is delivered
- Show "Write Review" button only for eligible products

#### 9.6 Update Product Rating
Create database trigger or function:
- Automatically update product's average rating when review is added/updated/deleted
- Update review count on product

```sql
-- Example trigger function
create or replace function update_product_rating()
returns trigger as $$
begin
  update products
  set
    average_rating = (select avg(rating) from reviews where product_id = NEW.product_id),
    review_count = (select count(*) from reviews where product_id = NEW.product_id)
  where id = NEW.product_id;
  return NEW;
end;
$$ language plpgsql;
```

#### 9.7 Integrate Reviews in Product Details
Update `ProductDetailsScreen`:
- Add `RatingSummary` component
- Show first 3 reviews
- "See All Reviews" button → navigates to all reviews screen

#### 9.8 All Reviews Screen
Create `AllReviewsScreen`:
- Display all reviews for a product
- Filter by rating (All, 5 star, 4 star, etc.)
- Sort options
- Search reviews (optional)
- Infinite scroll

#### 9.9 Seller Review Management
Create `SellerReviewsScreen`:
- View all reviews for seller's products
- Grouped by product
- Filter by rating
- Cannot edit/delete (read-only)
- Optional: Respond to reviews (future feature)

#### 9.10 My Reviews Screen (Buyer)
Create `MyReviewsScreen`:
- List all reviews written by user
- Option to edit own review
- Option to delete own review
- Show product information with each review

#### 9.11 Review Store
Create `src/store/reviewStore.ts`:
```typescript
// State and actions:
- productReviews: Review[]
- userReviews: Review[]
- fetchProductReviews(productId)
- fetchUserReviews(userId)
- submitReview(reviewData)
- updateReview(reviewId, data)
- deleteReview(reviewId)
```

#### 9.12 Review Validation
- Prevent duplicate reviews
- Minimum review length (10 characters)
- Maximum review length (500 characters)
- Rating required (1-5)
- Verify purchase before allowing review

#### 9.13 Review Photos
- Allow uploading up to 3 photos with review
- Upload to Supabase Storage (`review-photos` bucket)
- Display photos in review as gallery
- Click to view full size

#### 9.14 Detox Tests
Create `e2e/reviews.test.js`:
- Test writing a review
- Test review validation
- Test uploading photos with review
- Test viewing product reviews
- Test filtering reviews by rating
- Test sorting reviews
- Test preventing duplicate reviews
- Test editing own review
- Test deleting own review

### Deliverables
- ✅ Review submission functionality
- ✅ Reviews display on product pages
- ✅ Rating summary with breakdown
- ✅ Review photos support
- ✅ My Reviews screen for buyers
- ✅ Seller reviews viewing
- ✅ Automatic rating calculation
- ✅ Review eligibility checks
- ✅ Detox tests for review system

### Testing Checklist
- [ ] Buyer can write review for purchased product
- [ ] Review with photos submits successfully
- [ ] Reviews display on product details
- [ ] Average rating calculates correctly
- [ ] Rating breakdown displays correctly
- [ ] User cannot submit duplicate review
- [ ] User can edit their own review
- [ ] User can delete their own review
- [ ] Seller can view reviews for their products
- [ ] Review filtering and sorting work
- [ ] Review validation works correctly
- [ ] All Detox tests pass

---

## Stage 10: Seller Dashboard & Analytics

### Objective
Create comprehensive seller dashboard with sales analytics and business insights.

### Tasks

#### 10.1 Dashboard Overview Screen
Create `SellerDashboardScreen`:
- Key metrics cards:
  - Total Earnings (current month)
  - Total Orders (current month)
  - Active Products
  - Pending Orders
  - Average Rating
- Sales chart (last 30 days)
- Recent orders list (last 5)
- Quick actions:
  - Add Product
  - View Orders
  - View Analytics
- Low stock alerts

#### 10.2 Sales Analytics Screen
Create `SalesAnalyticsScreen`:
- Date range selector (Today, This Week, This Month, Custom Range)
- Sales metrics:
  - Total Sales
  - Total Orders
  - Average Order Value
  - Top Selling Products
- Interactive charts:
  - Sales over time (line chart)
  - Sales by category (pie chart)
  - Orders by status (bar chart)
- Export data option (CSV download)

#### 10.3 Earnings & Wallet Screen
Create `EarningsScreen`:
- Total earnings overview
- Earnings breakdown:
  - Completed orders earnings
  - Pending earnings (not yet delivered)
  - Available for withdrawal
- Transaction history:
  - Order earnings
  - Withdrawals (future feature)
  - Refunds
- "Withdraw Funds" button (placeholder for future)
- Filter by date range
- Export statement

#### 10.4 Top Products Screen
Create `TopProductsScreen`:
- List of products sorted by sales
- Each item shows:
  - Product image and name
  - Units sold
  - Revenue generated
  - Average rating
  - Views count (if tracked)
- Filter by time period
- Sort options: Sales, Revenue, Rating

#### 10.5 Inventory Alerts
Create `InventoryAlertsScreen`:
- Low stock products (< 5 items)
- Out of stock products
- Quick restock action
- Set alert thresholds

#### 10.6 Analytics Services
Create `src/services/analyticsService.ts`:
```typescript
// Functions to implement:
- getDashboardStats(sellerId, dateRange)
- getSalesOverTime(sellerId, dateRange, groupBy)
- getSalesByCategory(sellerId, dateRange)
- getOrdersByStatus(sellerId, dateRange)
- getTopProducts(sellerId, dateRange, limit)
- getEarnings(sellerId)
- getTransactionHistory(sellerId, dateRange)
- getLowStockProducts(sellerId, threshold)
- exportAnalyticsData(sellerId, dateRange)
```

#### 10.7 Chart Components
Install charting library:
```bash
npm install react-native-chart-kit
```

Create chart components:
- `SalesLineChart`: Sales over time
- `CategoryPieChart`: Sales by category
- `OrderStatusBarChart`: Orders by status

#### 10.8 Date Range Picker
Create `DateRangePicker` component:
- Preset options: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month
- Custom date range picker (from/to dates)
- Apply button
- Used across analytics screens

#### 10.9 Analytics Store
Create `src/store/analyticsStore.ts`:
```typescript
// State and actions:
- dashboardStats: DashboardStats
- salesData: SalesData[]
- earningsData: EarningsData
- topProducts: Product[]
- selectedDateRange: DateRange
- setDateRange(range)
- fetchDashboardStats()
- fetchSalesData()
- fetchEarnings()
- fetchTopProducts()
```

#### 10.10 Sales Calculations
Create utility functions in `src/utils/salesCalculations.ts`:
- Calculate total sales for period
- Calculate average order value
- Calculate growth rate (compare to previous period)
- Group sales by day/week/month
- Calculate product performance metrics

#### 10.11 Export Functionality
- Export sales data as CSV
- Export transaction history as PDF
- Include date range in filename
- Use `expo-file-system` for file operations
- Share exported file

#### 10.12 Performance Insights
Create `PerformanceInsightsScreen`:
- Product performance compared to average
- Sales trends (up, down, stable)
- Best performing day of week
- Best performing time of day (if data available)
- Recommendations (AI-generated suggestions, optional)

#### 10.13 Detox Tests
Create `e2e/seller-analytics.test.js`:
- Test dashboard displays correctly
- Test date range selection
- Test sales chart rendering
- Test earnings display
- Test top products list
- Test low stock alerts
- Test analytics filtering
- Test data export

### Deliverables
- ✅ Comprehensive seller dashboard
- ✅ Sales analytics with charts
- ✅ Earnings and wallet management
- ✅ Top products analysis
- ✅ Inventory alerts
- ✅ Date range filtering
- ✅ Data export functionality
- ✅ Performance insights
- ✅ Detox tests for analytics

### Testing Checklist
- [ ] Dashboard loads with correct metrics
- [ ] Sales charts display correctly
- [ ] Date range filtering works
- [ ] Top products list is accurate
- [ ] Earnings calculations are correct
- [ ] Transaction history displays
- [ ] Low stock alerts show correctly
- [ ] Data export works
- [ ] Analytics update in real-time
- [ ] All Detox tests pass

---

## Stage 11: Real-time Chat System

### Objective
Implement real-time messaging between buyers and sellers using Supabase Realtime.

### Tasks

#### 11.1 Chat Database Setup
Update database schema (should already exist from Stage 2):
- `conversations` table
- `messages` table

Add indexes for performance:
```sql
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_created_at_idx on messages(created_at desc);
create index conversations_buyer_id_idx on conversations(buyer_id);
create index conversations_seller_id_idx on conversations(seller_id);
```

#### 11.2 Enable Realtime
Enable Realtime for messages table:
```sql
alter publication supabase_realtime add table messages;
```

Setup RLS policies for real-time:
```sql
create policy "Users can view messages in their conversations"
  on messages for select using (
    conversation_id in (
      select id from conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );
```

#### 11.3 Chat Services
Create `src/services/chatService.ts`:
```typescript
// Functions to implement:
- getConversations(userId)
- getOrCreateConversation(buyerId, sellerId, productId)
- getMessages(conversationId, limit, offset)
- sendMessage(conversationId, senderId, content)
- markMessagesAsRead(conversationId, userId)
- subscribeToConversation(conversationId, callback)
- unsubscribeFromConversation(conversationId)
- deleteConversation(conversationId)
```

#### 11.4 Chat Store
Create `src/store/chatStore.ts` with Zustand:
```typescript
// State and actions:
- conversations: Conversation[]
- activeConversation: Conversation | null
- messages: Message[]
- unreadCount: number
- setActiveConversation(conversationId)
- addMessage(message)
- updateMessageStatus(messageId, status)
- subscribeToMessages(conversationId)
- unsubscribeFromMessages()
- fetchConversations()
- fetchMessages(conversationId)
- sendMessage(conversationId, content)
```

#### 11.5 Conversations List Screen
Create `ConversationsScreen`:
- List of all conversations
- Each conversation shows:
  - Other user's name and avatar
  - Product thumbnail (if linked to product)
  - Last message preview
  - Timestamp of last message
  - Unread badge count
  - Online status indicator (optional)
- Pull to refresh
- Search conversations
- Swipe to delete (with confirmation)
- Empty state

#### 11.6 Chat Screen
Create `ChatScreen`:
- Header with:
  - Other user's name and avatar
  - Online status
  - Product info (if applicable)
  - "View Product" button
- Message list (scrollable, inverted)
- Each message shows:
  - Message content
  - Sender name (if group chat, otherwise implied)
  - Timestamp
  - Read status (double check marks)
  - Avatar (for received messages)
- Message input field
- Send button
- Emoji picker (optional)
- Image attachment (optional)
- Auto-scroll to bottom on new message
- Load more on scroll to top

#### 11.7 Chat UI Component
Install chat UI library:
```bash
npm install react-native-gifted-chat
```

Or create custom components:
- `MessageBubble`: Display individual message
- `MessageInput`: Input field with send button
- `MessageList`: Virtualized message list
- `TypingIndicator`: Show when other user is typing

#### 11.8 Realtime Message Subscription
Implement realtime subscription:
```typescript
// Subscribe to new messages
const subscription = supabase
  .channel(`conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Add new message to state
    }
  )
  .subscribe()

// Cleanup on unmount
return () => {
  subscription.unsubscribe()
}
```

#### 11.9 Message Notifications
- Show push notification for new messages (when app in background)
- Update unread count badge on Conversations tab
- Play notification sound (optional)
- Vibrate on new message (optional)

#### 11.10 Start Conversation Flow
Add "Contact Seller" button to Product Details screen:
- Creates or opens existing conversation
- Links conversation to product
- Navigates to Chat Screen
- Pre-fills with product context

#### 11.11 Message Status Indicators
- Sent (single check)
- Delivered (double check)
- Read (double check, colored)
- Failed (red exclamation, allow retry)

#### 11.12 Typing Indicator
- Detect when user is typing
- Broadcast typing status to other user
- Display "User is typing..." indicator
- Clear typing status after 3 seconds of inactivity

#### 11.13 Message Timestamps
- Group messages by date (Today, Yesterday, specific dates)
- Show time for each message
- Use relative time (e.g., "Just now", "5 min ago")

#### 11.14 Chat Features (Optional Enhancements)
- Image/photo sharing
- Voice messages
- Emoji reactions to messages
- Message search
- Block user
- Report conversation

#### 11.15 Detox Tests
Create `e2e/chat.test.js`:
- Test viewing conversations list
- Test opening conversation
- Test sending message
- Test receiving message (simulate)
- Test unread count updates
- Test starting conversation from product
- Test marking messages as read
- Test deleting conversation

### Deliverables
- ✅ Real-time messaging functionality
- ✅ Conversations list screen
- ✅ Chat screen with message history
- ✅ Message status indicators
- ✅ Unread count badges
- ✅ Start conversation from product page
- ✅ Typing indicators
- ✅ Message notifications
- ✅ Detox tests for chat features

### Testing Checklist
- [ ] User can view all conversations
- [ ] User can open conversation
- [ ] User can send messages
- [ ] Messages appear in real-time
- [ ] Unread count updates correctly
- [ ] User can start conversation from product page
- [ ] Messages marked as read when viewed
- [ ] Typing indicator shows correctly
- [ ] Notifications sent for new messages
- [ ] Message timestamps display correctly
- [ ] All Detox tests pass

---

## Stage 12: Push Notifications & App Polish

### Objective
Implement push notifications and polish the app with loading states, error handling, and UX improvements.

### Tasks

#### 12.1 Setup Expo Push Notifications
Install dependencies:
```bash
npx expo install expo-notifications expo-device expo-constants
```

Configure `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

#### 12.2 Notification Service
Create `src/services/notificationService.ts`:
```typescript
// Functions to implement:
- registerForPushNotifications()
- getExpoPushToken()
- savePushToken(userId, token)
- sendPushNotification(userId, title, body, data)
- handleNotificationReceived(notification)
- handleNotificationResponse(response)
- scheduleLocalNotification(title, body, trigger)
- cancelAllNotifications()
```

#### 12.3 Save Push Tokens
Create `push_tokens` table:
```sql
create table push_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  expo_token text not null,
  device_info jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, expo_token)
);
```

Save token on app launch and update when changed.

#### 12.4 Notification Triggers
Send notifications for:

**Buyer notifications:**
- Order status updated (processing, shipped, delivered)
- New message from seller
- Product back in stock (wishlist item)
- Product price drop (wishlist item, optional)
- Review request after delivery

**Seller notifications:**
- New order received
- New message from buyer
- Low stock alert
- Product review received
- Payment received

#### 12.5 Notification Handling
Setup notification handlers:
- Foreground notifications: Show in-app banner
- Background notifications: Show system notification
- Notification tap: Navigate to relevant screen
- Deep linking support

#### 12.6 Notification Preferences Screen
Create `NotificationPreferencesScreen`:
- Toggle switches for each notification type:
  - Order updates
  - Messages
  - Promotions
  - Low stock alerts (sellers)
  - Reviews
- Save preferences to database
- Respect user preferences when sending notifications

#### 12.7 Supabase Edge Function for Notifications
Create `send-notification` Edge Function:
```typescript
// supabase/functions/send-notification/index.ts
import { Expo } from 'expo-server-sdk'

// Send push notification via Expo
// Input: { userId, title, body, data }
// Check user's notification preferences
// Send to Expo Push API
```

#### 12.8 Loading States
Add loading indicators throughout app:
- Skeleton screens for list views
- Shimmer effect for cards
- Spinner for button actions
- Progress bars for uploads
- Pull-to-refresh indicators

Create reusable loading components:
- `LoadingSpinner`
- `SkeletonCard`
- `ShimmerPlaceholder`
- `LoadingOverlay`

#### 12.9 Error Handling
Implement consistent error handling:
- Network error handling
- API error messages
- Form validation errors
- Empty states
- Retry mechanisms
- Offline mode detection

Create error components:
- `ErrorMessage`
- `ErrorBoundary`
- `OfflineNotice`
- `EmptyState`

#### 12.10 Empty States
Create empty state screens for:
- No products found
- No orders yet
- Empty cart
- Empty wishlist
- No conversations
- No reviews
- No search results

Each with:
- Illustration or icon
- Clear message
- Call-to-action button

#### 12.11 Pull-to-Refresh
Add pull-to-refresh to all list screens:
- Product browse
- Cart
- Orders
- Conversations
- Reviews
- Seller products

#### 12.12 Image Optimization
- Lazy load images
- Use image caching
- Compress images before upload
- Progressive image loading
- Placeholder while loading

Install:
```bash
npx expo install expo-image
```

Replace `<Image>` with `<ExpoImage>` for better performance.

#### 12.13 App Feedback Mechanisms
Add user feedback features:
- Toast notifications for actions (item added to cart, order placed, etc.)
- Haptic feedback for important actions
- Success/error animations
- Confirmation dialogs for destructive actions

#### 12.14 Performance Optimization
- Implement virtualized lists (FlatList, SectionList)
- Memoize expensive components
- Optimize re-renders with React.memo
- Use debounce for search inputs
- Implement pagination for large lists
- Code splitting (lazy load screens)

#### 12.15 Accessibility
- Add accessibility labels
- Ensure proper contrast ratios
- Support screen readers
- Keyboard navigation (if applicable)
- Font scaling support

#### 12.16 Detox Tests
Create `e2e/notifications.test.js`:
- Test notification permissions request
- Test notification preferences saving
- Test push token registration
- Test notification navigation (tap to open)

Update existing tests to include:
- Loading state checks
- Error handling scenarios
- Empty state displays
- Pull-to-refresh actions

### Deliverables
- ✅ Push notifications setup
- ✅ Notification triggers for all events
- ✅ Notification preferences screen
- ✅ Loading states throughout app
- ✅ Comprehensive error handling
- ✅ Empty states for all lists
- ✅ Pull-to-refresh everywhere
- ✅ Image optimization
- ✅ User feedback mechanisms
- ✅ Performance optimizations
- ✅ Accessibility improvements
- ✅ Detox tests updated

### Testing Checklist
- [ ] Push notifications send correctly
- [ ] User can configure notification preferences
- [ ] Notifications navigate to correct screens
- [ ] Loading states show during data fetch
- [ ] Error messages display appropriately
- [ ] Empty states show when no data
- [ ] Pull-to-refresh works on all lists
- [ ] Images load and cache properly
- [ ] Toast messages show for actions
- [ ] App feels responsive and polished
- [ ] All Detox tests pass

---

## Stage 13: Comprehensive Testing & QA

### Objective
Achieve comprehensive test coverage, perform regression testing, and ensure app quality.

### Tasks

#### 13.1 Complete Detox Test Suite
Ensure all features have Detox E2E tests:
- Authentication flows ✓
- Profile management ✓
- Product management (seller) ✓
- Product browsing (buyer) ✓
- Cart and wishlist ✓
- Checkout flow ✓
- Payment processing ✓
- Order management ✓
- Reviews and ratings ✓
- Chat system ✓
- Notifications ✓

#### 13.2 Create User Journey Tests
Create comprehensive user journey tests:

**Buyer journey test:**
```javascript
// e2e/buyer-journey.test.js
describe('Complete Buyer Journey', () => {
  it('should complete full shopping flow', async () => {
    // 1. Sign up
    // 2. Browse products
    // 3. Search for product
    // 4. View product details
    // 5. Add to cart
    // 6. Add to wishlist
    // 7. Proceed to checkout
    // 8. Add address
    // 9. Apply coupon
    // 10. Complete payment
    // 11. View order confirmation
    // 12. Check order in history
    // 13. Chat with seller
    // 14. Leave review
  })
})
```

**Seller journey test:**
```javascript
// e2e/seller-journey.test.js
describe('Complete Seller Journey', () => {
  it('should complete full seller flow', async () => {
    // 1. Sign up as seller
    // 2. Add products
    // 3. Upload product images
    // 4. View dashboard
    // 5. Receive order notification
    // 6. View order details
    // 7. Update order status
    // 8. View earnings
    // 9. Check analytics
    // 10. Respond to buyer message
    // 11. View reviews
  })
})
```

#### 13.3 Edge Case Tests
Create tests for edge cases:
- Out of stock scenarios
- Concurrent cart updates
- Network failures and retries
- Payment failures
- Session expiration
- Invalid input handling
- Boundary conditions (empty cart, max quantity, etc.)

#### 13.4 Unit Tests
Write unit tests for critical functions:
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

Test files to create:
- `__tests__/services/productService.test.ts`
- `__tests__/services/orderService.test.ts`
- `__tests__/services/cartService.test.ts`
- `__tests__/utils/orderCalculations.test.ts`
- `__tests__/utils/validation.test.ts`
- `__tests__/store/authStore.test.ts`
- `__tests__/store/cartStore.test.ts`

#### 13.5 Component Tests
Write tests for key components:
- `__tests__/components/ProductCard.test.tsx`
- `__tests__/components/CartItem.test.tsx`
- `__tests__/components/OrderStatusTimeline.test.tsx`
- `__tests__/components/RatingSummary.test.tsx`

#### 13.6 Integration Tests
Test integration between services:
- Cart → Checkout → Payment → Order creation flow
- Product → Cart → Wishlist synchronization
- Order status → Notification trigger
- Review → Rating calculation → Product update

#### 13.7 Test Coverage Measurement
Setup code coverage:
```bash
npm install --save-dev @babel/preset-env
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

Target coverage goals:
- Critical paths: 90%+
- Services: 80%+
- Stores: 80%+
- Components: 70%+
- Overall: 75%+

#### 13.8 Setup CI/CD Pipeline
Create GitHub Actions workflow:
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run detox:build
      - run: npm run detox:test
```

#### 13.9 Performance Testing
Test app performance:
- Measure screen load times
- Test with large datasets (1000+ products)
- Monitor memory usage
- Check for memory leaks
- Profile render performance
- Test on low-end devices

Tools:
- React DevTools Profiler
- Flipper
- Detox performance metrics

#### 13.10 Security Testing
Verify security measures:
- [ ] API keys not exposed in code
- [ ] Sensitive data encrypted
- [ ] RLS policies prevent unauthorized access
- [ ] Input sanitization prevents injection attacks
- [ ] Session management secure
- [ ] Payment data never stored locally
- [ ] HTTPS enforced
- [ ] No sensitive data in logs

#### 13.11 Accessibility Testing
Test with accessibility tools:
- Screen reader compatibility (TalkBack, VoiceOver)
- Color contrast ratios
- Touch target sizes
- Font scaling
- Keyboard navigation

#### 13.12 Regression Testing
Create regression test suite:
- Run full Detox suite before each release
- Test on both iOS and Android
- Test on multiple device sizes
- Test with different network conditions
- Test in different locales (if internationalized)

#### 13.13 Manual QA Checklist
Create manual testing checklist:

**Authentication:**
- [ ] Sign up with valid email
- [ ] Sign up with existing email shows error
- [ ] Email verification required
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password shows error
- [ ] Password reset flow works
- [ ] Session persists on app restart

**Product Browsing:**
- [ ] Products load correctly
- [ ] Search finds relevant products
- [ ] Filters work correctly
- [ ] Sort options work
- [ ] Product details accurate
- [ ] Images load properly

**Cart & Checkout:**
- [ ] Add to cart works
- [ ] Cart updates quantities
- [ ] Cart persists
- [ ] Checkout flow smooth
- [ ] Address saving works
- [ ] Payment processes successfully

**Orders:**
- [ ] Orders display correctly
- [ ] Order status updates
- [ ] Buyer can track order
- [ ] Seller can update status

**Reviews:**
- [ ] Review submission works
- [ ] Rating calculates correctly
- [ ] Cannot submit duplicate review

**Chat:**
- [ ] Messages send/receive in real-time
- [ ] Unread count accurate
- [ ] Conversation persists

**Notifications:**
- [ ] Notifications received
- [ ] Tapping notification navigates correctly

#### 13.14 Bug Tracking & Fixes
- Setup issue tracking system (GitHub Issues, Jira)
- Prioritize bugs (Critical, High, Medium, Low)
- Fix critical and high priority bugs
- Retest after fixes
- Document known issues

#### 13.15 Test Documentation
Create test documentation:
- Test plan document
- Test cases spreadsheet
- Known issues list
- Testing best practices
- How to run tests guide

### Deliverables
- ✅ Complete Detox test suite (all features)
- ✅ User journey tests
- ✅ Edge case tests
- ✅ Unit tests with 75%+ coverage
- ✅ Component tests
- ✅ Integration tests
- ✅ CI/CD pipeline setup
- ✅ Performance testing completed
- ✅ Security audit passed
- ✅ Accessibility testing passed
- ✅ Regression test suite
- ✅ Manual QA checklist completed
- ✅ All critical bugs fixed
- ✅ Test documentation

### Testing Checklist
- [ ] All Detox tests pass on iOS
- [ ] All Detox tests pass on Android
- [ ] Unit test coverage ≥ 75%
- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] CI/CD pipeline green
- [ ] No critical performance issues
- [ ] Security audit passed
- [ ] Accessibility requirements met
- [ ] No critical or high priority bugs
- [ ] Manual QA checklist 100% complete
- [ ] App stable on test devices

---

## Stage 14: Deployment & Production Setup

### Objective
Prepare app for production, build release versions, and deploy to app stores.

### Tasks

#### 14.1 Environment Configuration
Create environment configs:

**.env.development:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
API_URL=https://xxx.supabase.co/functions/v1
```

**.env.production:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
API_URL=https://xxx.supabase.co/functions/v1
```

Install:
```bash
npm install react-native-dotenv
```

#### 14.2 App Configuration
Update `app.json`:
```json
{
  "expo": {
    "name": "Marketplace",
    "slug": "marketplace-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.marketplace",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.marketplace",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### 14.3 Create App Assets
Design and create:
- App icon (1024x1024 PNG)
- Splash screen (1242x2436 PNG for iOS, various for Android)
- Adaptive icon for Android (foreground + background)
- Store screenshots (required for app stores)
- Feature graphic for Google Play
- App preview video (optional)

Use Figma or design tools.

#### 14.4 Setup EAS Build
Install EAS CLI:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

Create `eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "AB12CD34EF"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

#### 14.5 Code Signing
**iOS:**
- Create Apple Developer account
- Create App ID
- Create provisioning profiles
- Configure signing certificates in EAS

**Android:**
- Generate keystore:
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore marketplace.keystore -alias marketplace -keyalg RSA -keysize 2048 -validity 10000
  ```
- Configure in `eas.json`

#### 14.6 Production Supabase Setup
- Create production Supabase project
- Run all database migrations
- Setup RLS policies
- Create storage buckets
- Configure email templates
- Setup custom domain (optional)
- Enable database backups

#### 14.7 Production Stripe Setup
- Verify Stripe account
- Activate live mode
- Update production API keys
- Configure webhooks for production URL
- Test live payment flow
- Setup payout schedule

#### 14.8 Deploy Supabase Edge Functions
Deploy all edge functions to production:
```bash
supabase functions deploy create-payment-intent --project-ref xxx
supabase functions deploy confirm-payment --project-ref xxx
supabase functions deploy stripe-webhook --project-ref xxx
supabase functions deploy send-notification --project-ref xxx
```

#### 14.9 Configure Webhooks
Setup Stripe webhooks:
- Webhook URL: `https://xxx.supabase.co/functions/v1/stripe-webhook`
- Events: `payment_intent.succeeded`, `payment_intent.failed`, `charge.refunded`
- Get webhook secret and add to Edge Function env

#### 14.10 Build Production App
**iOS:**
```bash
eas build --platform ios --profile production
```

**Android:**
```bash
eas build --platform android --profile production
```

Wait for builds to complete (can take 20-30 minutes).

#### 14.11 Test Production Builds
- Download and install production builds on test devices
- Test complete user flows
- Verify production API endpoints
- Test real payments with Stripe live mode (small amounts)
- Check analytics tracking
- Verify notifications work
- Test on multiple devices

#### 14.12 App Store Preparation
**Apple App Store:**
- Create app in App Store Connect
- Fill in app information:
  - App name
  - Subtitle
  - Description
  - Keywords
  - Support URL
  - Privacy policy URL
- Upload screenshots (required sizes)
- Upload app icon
- Set pricing and availability
- Set age rating
- Add app privacy details
- Select app category

**Google Play Store:**
- Create app in Google Play Console
- Fill in store listing:
  - App name
  - Short description
  - Full description
  - App icon
  - Feature graphic
  - Screenshots
- Set content rating
- Select app category
- Set pricing and distribution
- Add privacy policy URL
- Complete data safety section

#### 14.13 Privacy Policy & Terms
Create legal documents:
- Privacy Policy (data collection, storage, usage)
- Terms of Service
- Refund Policy
- Cookie Policy (if applicable)

Host on website or use services like:
- Termly.io
- iubenda.com
- Privacy Policy Generator

#### 14.14 Beta Testing
**iOS TestFlight:**
- Upload build via EAS Submit or App Store Connect
- Add internal testers (up to 100)
- Add external testers (up to 10,000)
- Collect feedback
- Fix issues

**Android Internal Testing:**
- Upload build to Internal Testing track
- Add testers via email
- Distribute via Google Play link
- Collect feedback
- Fix issues

#### 14.15 Submit for Review
**iOS:**
```bash
eas submit --platform ios --profile production
```
Or manually via App Store Connect.

**Android:**
```bash
eas submit --platform android --profile production
```
Or manually via Google Play Console.

Review times:
- iOS: 24-48 hours (typically)
- Android: Few hours to 1 day (typically)

#### 14.16 Monitoring & Analytics Setup
Setup monitoring services:
- **Sentry** for error tracking:
  ```bash
  npm install @sentry/react-native
  npx @sentry/wizard -i reactNative
  ```
- **Firebase Analytics** (optional):
  ```bash
  npx expo install @react-native-firebase/app @react-native-firebase/analytics
  ```
- **Supabase Analytics** (built-in)

#### 14.17 App Versioning Strategy
Establish versioning strategy:
- Semantic versioning: MAJOR.MINOR.PATCH (e.g., 1.0.0)
- iOS: Update `version` and `buildNumber` in app.json
- Android: Update `versionCode` and `version` in app.json
- Tag releases in Git
- Maintain changelog

#### 14.18 Create User Documentation
Create user-facing documentation:
- Getting Started guide
- How to buy products
- How to sell products
- Payment information
- FAQ section
- Contact support information
- Video tutorials (optional)

#### 14.19 Post-Launch Checklist
After approval and launch:
- [ ] Monitor error reports (Sentry)
- [ ] Monitor app performance
- [ ] Monitor user reviews
- [ ] Monitor server load (Supabase)
- [ ] Monitor payment processing
- [ ] Check notification delivery
- [ ] Monitor crash rates
- [ ] Track user acquisition
- [ ] Track retention rates
- [ ] Respond to user reviews
- [ ] Fix critical bugs immediately
- [ ] Plan first update

#### 14.20 Rollout Strategy
Consider phased rollout:
- Release to 10% of users first
- Monitor for issues
- Gradually increase to 25%, 50%, 100%
- Halt rollout if critical issues found

Available on:
- Google Play: Staged rollout option
- iOS: Phased release option

### Deliverables
- ✅ Production environment configured
- ✅ App assets created (icons, splash, screenshots)
- ✅ EAS Build configured
- ✅ Production builds created (iOS + Android)
- ✅ Production backend deployed (Supabase + Stripe)
- ✅ App store listings completed
- ✅ Privacy policy and terms created
- ✅ Beta testing completed
- ✅ Apps submitted for review
- ✅ Monitoring and analytics setup
- ✅ User documentation created
- ✅ Apps approved and live on stores! 🎉

### Testing Checklist
- [ ] Production build installs correctly
- [ ] All features work in production
- [ ] Real payments process successfully
- [ ] Notifications work in production
- [ ] No critical errors in Sentry
- [ ] Analytics tracking works
- [ ] Privacy policy accessible
- [ ] Beta testers approve
- [ ] App store requirements met
- [ ] App approved by Apple/Google
- [ ] App visible on stores
- [ ] First users can download and use app

---

## Post-Launch: Maintenance & Iteration

### Ongoing Tasks
After launch, continue with:

1. **Monitoring & Support:**
   - Daily error monitoring
   - User feedback collection
   - App store review responses
   - Customer support

2. **Bug Fixes:**
   - Prioritize critical bugs
   - Release patch updates
   - Test thoroughly before release

3. **Performance Optimization:**
   - Monitor app performance metrics
   - Optimize slow screens
   - Reduce app size
   - Improve load times

4. **Feature Updates:**
   - Plan new features based on user feedback
   - Follow same development stages
   - A/B test new features
   - Release regular updates

5. **Marketing & Growth:**
   - App Store Optimization (ASO)
   - Social media presence
   - Content marketing
   - Paid advertising (optional)

6. **Analytics Review:**
   - Weekly analytics review
   - User behavior analysis
   - Conversion funnel optimization
   - Retention improvements

---

## Summary

This development plan breaks down the marketplace app into 14 manageable stages, each designed to be handled by an LLM. Each stage:

- Has clear objectives and deliverables
- Includes specific tasks and code examples
- Has testable success criteria
- Builds upon previous stages
- Includes Detox testing requirements
- Can be completed independently (after dependencies)

**Total Estimated Timeline:** 8-12 weeks (with 1 developer working with LLM assistance)

**Key Success Factors:**
- Follow stages in order
- Complete all tests before moving to next stage
- Keep code clean and documented
- Regular testing on real devices
- Iterative improvements based on feedback

**Tech Stack Summary:**
- Expo + React Native + TypeScript
- Supabase (Auth, Database, Storage, Realtime)
- Stripe (Payments)
- Detox + Jest (Testing)
- Zustand (State Management)
- React Navigation (Navigation)
- NativeWind (Styling)

Good luck with your development! 🚀
