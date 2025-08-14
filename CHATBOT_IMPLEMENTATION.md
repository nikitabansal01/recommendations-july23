# 🤖 Auvra Chatbot Implementation

This document describes the comprehensive chatbot system implemented for the Auvra hormone health assessment app, designed to provide personalized user interactions and plan management.

## 🎯 Overview

The chatbot system implements 5 key flows as specified in the requirements:

1. **Feedback on Today's Action Plan** - Collects user satisfaction with their plan
2. **Let User Modify a Task** - Allows skipping, changing, or delaying tasks
3. **Let User Change Action Item** - Provides alternatives based on user preferences
4. **Personalize the Plan Based on New Inputs** - Collects additional preferences for customization
5. **Celebrate Plan Completion** - Congratulates users when they complete all tasks

## 🏗️ Architecture

### Core Components

- **`ChatbotProvider`** - React Context provider managing chatbot state
- **`Chatbot`** - Main chatbot UI component with all flow handlers
- **`TaskTracker`** - Component for tracking task completion and triggering celebration
- **`chatbot-context.tsx`** - State management and business logic

### State Management

The chatbot uses React Context with useReducer for state management:

```typescript
interface ChatbotState {
  isActive: boolean;
  currentFlow: ChatbotFlow;
  isVisible: boolean;
  userProfile: UserProfile;
  dailyFeedback: DailyFeedback;
  taskModifications: TaskModifications;
  personalization: PersonalizationData;
  refreshCount: number;
  maxRefreshes: number;
}
```

## 🔄 Flow Implementation

### 1. Feedback Flow

**Trigger:** Automatically appears 15 seconds after user lands on recommendations page
**Purpose:** Collects user satisfaction with their action plan

```typescript
const renderFeedbackFlow = () => (
  <div className={styles.flowContainer}>
    <div className={styles.botMessage}>
      <strong>Hey, did you like today's action plan?</strong>
    </div>
    <div className={styles.options}>
      <button onClick={() => handleFeedback('liked')}>
        Yes, I liked it 👍
      </button>
      <button onClick={() => handleFeedback('disliked')}>
        Not really 👎
      </button>
      <button onClick={() => handleFeedback('changes')}>
        I'd like to make changes ✏️
      </button>
    </div>
  </div>
);
```

**Flow Logic:**
- If user likes the plan → chatbot closes
- If user dislikes or wants changes → proceeds to modify-task flow

### 2. Task Modification Flow

**Trigger:** User selects "I'd like to make changes" from feedback
**Purpose:** Allows users to modify individual tasks

```typescript
const renderModifyTaskFlow = () => (
  <div className={styles.flowContainer}>
    <div className={styles.botMessage}>
      <strong>No problem. What would you like to do with this task?</strong>
    </div>
    <div className={styles.options}>
      <button onClick={() => handleTaskModification('skip')}>
        Skip it for today 🚫
      </button>
      <button onClick={() => handleTaskModification('change')}>
        Try something else instead 🔄
      </button>
      <button onClick={() => handleTaskModification('later')}>
        Plan to do it later 🕒
      </button>
    </div>
  </div>
);
```

**Flow Logic:**
- **Skip:** Removes task from today's plan
- **Change:** Proceeds to change-action flow
- **Later:** Moves task to bottom of list

### 3. Action Change Flow

**Trigger:** User selects "Try something else instead" from task modification
**Purpose:** Provides alternative activities based on user preferences

```typescript
const renderChangeActionFlow = () => (
  <div className={styles.flowContainer}>
    <div className={styles.botMessage}>
      <strong>Want to try something else here?</strong>
    </div>
    <div className={styles.options}>
      <button onClick={() => handleActionChange('easier')}>
        Something easier 🧘‍♀️
      </button>
      <button onClick={() => handleActionChange('new')}>
        Something new 🌱
      </button>
      <button onClick={() => handleActionChange('not-mood')}>
        I'm not in the mood for this 😐
      </button>
    </div>
  </div>
);
```

**Flow Logic:**
- Tracks refresh count (max 3 per day)
- If limit reached → triggers personalization flow
- Logs user preferences for future plan adjustments

### 4. Personalization Flow

**Trigger:** 
- User changes/skips 3+ tasks in a row, OR
- Modifies plan 3 days in a row, OR
- Reaches refresh limit

**Purpose:** Collects additional user preferences for plan customization

**Questions:**
1. **Location** - For food/culture relevance
2. **Allergies** - Food intolerances and restrictions
3. **Dietary Preference** - Veg, non-veg, or mixed
4. **Movement Preference** - Yoga, walks, strength, dance, low-impact, none
5. **Other Preferences** - Additional restrictions or preferences

```typescript
const renderPersonalizationFlow = () => (
  <div className={styles.flowContainer}>
    {/* Multi-step form with validation */}
    {/* Each step collects specific information */}
    {/* Final step allows completion */}
  </div>
);
```

### 5. Celebration Flow

**Trigger:** User completes all tasks in the recommended order
**Purpose:** Celebrates user achievement and saves plan as preferred

```typescript
const renderCelebrationFlow = () => (
  <div className={styles.flowContainer}>
    <div className={styles.botMessage}>
      <strong>Hey, amazing job — you completed your action plan today! 🎉</strong>
    </div>
    <div className={styles.celebrationContent}>
      <div className={styles.celebrationIcon}>🏆</div>
      <p>You've successfully completed all your tasks in the recommended order.</p>
      {/* Statistics and completion details */}
    </div>
  </div>
);
```

## 📊 Task Tracking

The `TaskTracker` component monitors task completion and triggers the celebration flow:

```typescript
const TaskTracker: React.FC<TaskTrackerProps> = ({ recommendations, category }) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskOrder, setTaskOrder] = useState<string[]>([]);

  // Check if all tasks are completed in order
  useEffect(() => {
    if (completedTasks.length === taskOrder.length && taskOrder.length > 0) {
      const completedInOrder = taskOrder.every((taskId, index) => 
        completedTasks[index] === taskId
      );
      
      if (completedInOrder) {
        setTimeout(() => {
          showChatbot('celebration');
        }, 1000);
      }
    }
  }, [completedTasks, taskOrder]);
};
```

**Features:**
- Visual progress bar
- Task completion checkboxes
- Order validation
- Automatic celebration trigger

## 🎨 UI/UX Design

### Visual Hierarchy
- **Bot questions** in bold text
- **User options** as interactive buttons
- **Emojis** for friendly, approachable feel
- **Consistent spacing** and typography

### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly button sizes
- Smooth animations and transitions

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- High contrast color schemes
- Screen reader friendly structure

## 🔧 Technical Implementation

### State Management
```typescript
// Actions for state updates
export type ChatbotAction = 
  | { type: 'SHOW_CHATBOT'; flow: ChatbotFlow }
  | { type: 'HIDE_CHATBOT' }
  | { type: 'SET_FEEDBACK'; rating: 'liked' | 'disliked' | 'changes' }
  | { type: 'MODIFY_TASK'; taskId: string; action: 'skip' | 'change' | 'later' }
  | { type: 'SET_PERSONALIZATION'; field: string; value: any }
  | { type: 'COMPLETE_PERSONALIZATION' }
  | { type: 'INCREMENT_REFRESH' }
  | { type: 'RESET_DAILY' };
```

### Daily Limits
- Feedback prompts once per day
- Refresh limits reset daily
- Task modifications tracked by date
- Persistent user preferences

### Data Persistence
- User feedback stored in context
- Task modifications logged
- Personalization data saved
- All data persists during session

## 🧪 Testing

### Demo Page
A dedicated demo page (`/chatbot-demo`) is available for testing:

- **Sample data** for immediate testing
- **All flows** accessible for demonstration
- **Task tracker** with sample recommendations
- **Automatic triggers** for testing timing

### Test Scenarios
1. **Feedback Flow:** Wait 15 seconds for automatic trigger
2. **Task Modification:** Complete feedback flow to access
3. **Action Changes:** Modify tasks to trigger alternatives
4. **Personalization:** Reach refresh limits or modify multiple tasks
5. **Celebration:** Complete all tasks in order

## 🚀 Usage

### Integration
```typescript
import { ChatbotProvider } from '../lib/chatbot-context';
import Chatbot from '../components/Chatbot';

// Wrap your app with the provider
<ChatbotProvider userProfile={userProfile}>
  <YourApp />
  <Chatbot />
</ChatbotProvider>
```

### Customization
- Modify trigger timings in `chatbot-context.tsx`
- Adjust daily limits and thresholds
- Customize questions in personalization flow
- Add new chatbot flows as needed

## 📝 Future Enhancements

### Planned Features
- **AI-powered responses** based on user history
- **Integration with external APIs** for real-time data
- **Advanced analytics** and user behavior tracking
- **Multi-language support** for global users
- **Voice interaction** capabilities

### Scalability
- **Modular flow system** for easy addition of new features
- **Configurable triggers** and conditions
- **Extensible state management** for complex scenarios
- **Performance optimization** for large user bases

## 🔍 Debugging

### Console Logging
All chatbot interactions are logged to console:
```
=== LOCAL DEVELOPMENT: SAVING RESPONSE ===
Response ID: response_1234567890_abc123
Survey Data: {...}
Results: {...}
Email: user@example.com
Timestamp: 2024-01-15T10:30:00.000Z
==========================================
```

### State Inspection
Use React DevTools to inspect chatbot state:
- Current flow and step
- User preferences and feedback
- Task modifications and completion status
- Personalization data

## 📚 Dependencies

- **React 19.1.0** - Core framework
- **TypeScript 5** - Type safety
- **CSS Modules** - Scoped styling
- **Next.js 15.4.2** - Framework features

## 🤝 Contributing

When adding new chatbot flows:

1. **Define the flow type** in `ChatbotFlow`
2. **Add state properties** to `ChatbotState`
3. **Create action types** in `ChatbotAction`
4. **Implement the flow** in `Chatbot.tsx`
5. **Add styles** to `Chatbot.module.css`
6. **Update documentation** in this file

---

**The Auvra chatbot system provides an engaging, personalized user experience that adapts to individual needs and preferences while maintaining a friendly, supportive interface.** 