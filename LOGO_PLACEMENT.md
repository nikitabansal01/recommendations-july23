# 🎯 Company Logo Placement for Floating Chatbot Button

## 📍 Where to Place Your Logo:

### **Option 1: Replace Existing Logo (Recommended)**
- **File:** `/public/Logo.png` (already exists)
- **Size:** 260KB, 1091 lines
- **Format:** PNG
- **Current:** Generic logo placeholder

**Steps:**
1. Replace `/public/Logo.png` with your company logo
2. Keep the same filename: `Logo.png`
3. Recommended dimensions: **200x200px** or **300x300px**
4. Format: PNG with transparent background (preferred)

### **Option 2: Use Custom Filename**
- **File:** `/public/company-logo.png` (create new)
- **Update code:** Change `src="/Logo.png"` to `src="/company-logo.png"` in `FloatingChatbotButton.tsx`

## 🎨 Logo Requirements:

### **Recommended Specifications:**
- **Format:** PNG or SVG (PNG preferred for compatibility)
- **Dimensions:** 200x200px to 300x300px
- **Background:** Transparent or white
- **File size:** Under 500KB
- **Aspect ratio:** 1:1 (square)

### **Current Fallback:**
If logo fails to load, it shows "Auvra" text as fallback.

## 🔧 Code Location:

**File:** `src/app/components/FloatingChatbotButton.tsx`
**Line:** 20-26

```tsx
<img 
  src="/Logo.png"  // ← Change this path to your logo
  alt="Company Logo" 
  className={styles.companyLogo}
  // ... error handling
/>
```

## 🚀 How It Works:

1. **Always Visible:** Floating button appears in right bottom corner
2. **Click to Open:** Click logo to open chatbot
3. **Responsive:** Adapts to mobile and desktop
4. **Animations:** Floating animation and hover effects
5. **Notification:** Red dot appears when chatbot is closed

## 📱 Mobile Considerations:

- Logo scales down to 60x60px on mobile
- Tooltip hidden on mobile for better UX
- Touch-friendly sizing

## ✨ Customization:

You can also customize:
- **Colors:** Update gradient in `FloatingChatbotButton.module.css`
- **Size:** Modify dimensions in CSS
- **Position:** Change `bottom` and `right` values
- **Animation:** Adjust floating and pulse animations 