# 💪 Workout Tracker PWA

A simple, mobile-first Progressive Web App for tracking physio exercises. Designed for minimal clicks and maximum convenience.

## Features

- **Progressive Web App**: Install on your phone as a bookmark/app
- **Two Modes**:
  - **Live Mode**: Quick exercise logging (default)
  - **Edit Mode**: Modify exercise templates
- **Email Reporting**: Sends workout logs to george.cains@gmail.com
- **Offline Ready**: Works without internet connection
- **Zero Backend**: Pure client-side app, no server needed
- **Mobile Optimized**: Large touch targets, minimal clicks

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Installation on Phone

1. Open the app in your mobile browser
2. For iOS:
   - Tap the Share button
   - Select "Add to Home Screen"
3. For Android:
   - Tap the menu (⋮)
   - Select "Add to Home Screen" or "Install App"

## Usage

### Live Mode (Default)

1. Open the app
2. Enter reps for each set
3. Tap "📧 Send Workout"
4. Your email client opens with the workout data
5. Send the email to complete logging

### Edit Mode

1. Tap "⚙️ Edit" in the top right
2. Modify exercise names (up to 100 characters)
3. Add/remove sets (max 5 per exercise)
4. Add/remove exercises
5. Tap "💾 Save Template" when done

### Changing Exercises

To update your exercise routine:
1. Enter Edit Mode
2. Modify exercise names in the text areas
3. Add or remove sets as needed
4. Save the template
5. Your changes are stored locally on your device

## Technical Details

### Built With

- **React 18**: UI framework
- **Vite 5**: Build tool and dev server
- **Formik 2**: Form management
- **vite-plugin-pwa**: PWA capabilities

### Data Storage

- Exercise templates are stored in browser localStorage
- No backend required
- Data persists across sessions
- Stored locally on your device only

### Email Integration

Uses `mailto:` protocol to open your default email client with pre-filled workout data. This approach:
- Requires no backend or API keys
- Works on all devices
- Respects your email preferences
- No third-party services needed

## Customization

### Change Email Address

Edit `src/App.jsx` line 7:

```javascript
const EMAIL_TARGET = 'your-email@example.com';
```

### Styling

Modify `src/App.css` for visual customization. The app uses a mobile-first approach with:
- Large touch targets (44px minimum)
- Safe area insets for notched devices
- Responsive landscape mode

### Default Exercise Template

Edit the default template in `src/App.jsx` around line 18:

```javascript
setExercises([{
  name: 'Your Exercise Name',
  sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
}]);
```

## Browser Support

- Chrome/Edge: Full PWA support
- Safari (iOS): Add to Home Screen support
- Firefox: Basic PWA support

## License

MIT License - See LICENSE file for details

## Tips

- Keep exercise names short for better mobile display
- Use Edit mode to set up your routine once, then use Live mode daily
- The app works offline after first load
- Data is stored per device - won't sync across devices
